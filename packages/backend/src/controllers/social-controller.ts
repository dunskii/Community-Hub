/**
 * Social Media Controller
 *
 * Handles HTTP requests for social media OAuth connections and posting.
 * Spec §20: Social Media Integration
 */

import type { Request, Response } from 'express';
import { randomBytes } from 'node:crypto';
import { prisma } from '../db/index.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/api-error.js';
import { getRedis } from '../cache/redis-client.js';
import { getAdapter, isAdapterConfigured } from '../social/adapter-registry.js';
import { TwitterAdapter } from '../social/adapters/twitter-adapter.js';
import { socialTokenService } from '../services/social-token-service.js';
import { socialPostService } from '../services/social-post-service.js';
import {
  socialPostCreateSchema,
  socialAccountToggleSchema,
  captionPreviewSchema,
  socialPostFilterSchema,
  gbpSyncApplySchema,
  SOCIAL_PLATFORMS,
} from '@community-hub/shared';
import type { SocialPlatform, GbpProfileData, GbpSyncField } from '@community-hub/shared';
import type { OAuthState } from '../social/types.js';
import * as gbpProfileService from '../services/gbp-profile-service.js';

// ─── Helpers ──────────────────────────────────────────────────

function sendSuccess(res: Response, data: unknown, statusCode = 200, message?: string): void {
  res.status(statusCode).json({ success: true, data, ...(message && { message }) });
}

function sendError(res: Response, code: string, message: string, statusCode = 500): void {
  res.status(statusCode).json({ success: false, error: { code, message } });
}

function handleError(res: Response, error: unknown, defaultCode: string): void {
  if (error instanceof ApiError) {
    sendError(res, error.code, error.message, error.statusCode);
  } else if (error instanceof Error) {
    logger.error({ error }, `Social controller error: ${defaultCode}`);
    sendError(res, defaultCode, error.message, 500);
  } else {
    sendError(res, defaultCode, 'An unexpected error occurred', 500);
  }
}

const OAUTH_STATE_TTL = 600; // 10 minutes
const FRONTEND_URL = process.env['FRONTEND_URL'] || 'http://localhost:5173';

// Express params helper
function param(req: Request, name: string): string {
  const val = req.params[name];
  if (typeof val !== 'string') throw new Error(`Missing route parameter: ${name}`);
  return val;
}

function queryStr(req: Request, name: string): string | undefined {
  const val = req.query[name];
  return typeof val === 'string' ? val : undefined;
}

// ─── Controller ───────────────────────────────────────────────

class SocialController {
  /**
   * GET /businesses/:businessId/social/accounts
   * List connected social accounts for a business.
   */
  async listAccounts(req: Request, res: Response): Promise<void> {
    try {
      const businessId = param(req, 'businessId');

      const accounts = await prisma.social_accounts.findMany({
        where: { business_id: businessId },
        select: {
          id: true,
          business_id: true,
          platform: true,
          platform_account_id: true,
          platform_account_name: true,
          is_active: true,
          scopes: true,
          last_post_at: true,
          last_error: true,
          token_expires_at: true,
          created_at: true,
          updated_at: true,
        },
        orderBy: { created_at: 'asc' },
      });

      // Also return which platforms are configured (have env vars)
      const configuredPlatforms = SOCIAL_PLATFORMS.filter(p => isAdapterConfigured(p));

      sendSuccess(res, {
        accounts: accounts.map(a => ({
          id: a.id,
          businessId: a.business_id,
          platform: a.platform,
          platformAccountId: a.platform_account_id,
          platformAccountName: a.platform_account_name,
          isActive: a.is_active,
          scopes: a.scopes,
          lastPostAt: a.last_post_at?.toISOString() || null,
          lastError: a.last_error,
          tokenExpiresAt: a.token_expires_at?.toISOString() || null,
          createdAt: a.created_at.toISOString(),
          updatedAt: a.updated_at.toISOString(),
        })),
        configuredPlatforms,
      });
    } catch (error) {
      handleError(res, error, 'LIST_ACCOUNTS_FAILED');
    }
  }

  /**
   * GET /businesses/:businessId/social/auth/:platform
   * Initiate OAuth flow - redirects to the platform's authorization page.
   */
  async initiateAuth(req: Request, res: Response): Promise<void> {
    try {
      const businessId = param(req, 'businessId');
      const platform = param(req, 'platform');
      const user = req.user!;

      // Validate platform
      if (!SOCIAL_PLATFORMS.includes(platform as SocialPlatform)) {
        sendError(res, 'INVALID_PLATFORM', `Invalid platform: ${platform}`, 400);
        return;
      }

      const platformEnum = platform as SocialPlatform;

      if (!isAdapterConfigured(platformEnum)) {
        sendError(res, 'PLATFORM_NOT_CONFIGURED', `${platform} is not configured. Contact the administrator.`, 400);
        return;
      }

      const adapter = getAdapter(platformEnum);
      const redis = getRedis();

      // Generate CSRF state token
      const stateToken = randomBytes(32).toString('hex');

      // For Twitter, generate PKCE values (verifier stored in Redis, challenge sent in URL)
      let codeVerifier: string | undefined;
      let codeChallenge: string | undefined;
      if (platformEnum === 'TWITTER') {
        const pkce = TwitterAdapter.generatePKCE();
        codeVerifier = pkce.codeVerifier;
        codeChallenge = pkce.codeChallenge;
      }

      // Store state in Redis for validation on callback
      const oauthState: OAuthState = {
        businessId,
        userId: user.id,
        platform: platformEnum,
        codeVerifier,
        createdAt: Date.now(),
      };

      await redis.set(
        `social:oauth:state:${stateToken}`,
        JSON.stringify(oauthState),
        'EX',
        OAUTH_STATE_TTL,
      );

      // Build redirect URI
      const redirectUri = `${req.protocol}://${req.get('host')}/api/v1/businesses/${businessId}/social/callback/${platform}`;

      const authUrl = adapter.getAuthUrl(businessId, redirectUri, stateToken, { codeChallenge });

      // Redirect the popup window to the platform's auth page
      res.redirect(authUrl);
    } catch (error) {
      handleError(res, error, 'AUTH_INITIATE_FAILED');
    }
  }

  /**
   * GET /businesses/:businessId/social/callback/:platform
   * OAuth callback - exchanges code, stores tokens, closes popup.
   */
  async handleCallback(req: Request, res: Response): Promise<void> {
    try {
      const businessId = param(req, 'businessId');
      const platform = param(req, 'platform');
      const code = queryStr(req, 'code');
      const state = queryStr(req, 'state');
      const oauthError = queryStr(req, 'error');

      // Handle OAuth error (user denied, etc.)
      if (oauthError) {
        res.send(this.callbackHTML(false, platform, String(oauthError)));
        return;
      }

      if (!code || !state) {
        res.send(this.callbackHTML(false, platform, 'Missing authorization code or state'));
        return;
      }

      // Validate CSRF state
      const redis = getRedis();
      const stateKey = `social:oauth:state:${state!}`;
      const storedState = await redis.get(stateKey);
      await redis.del(stateKey);

      if (!storedState) {
        res.send(this.callbackHTML(false, platform, 'Invalid or expired state. Please try again.'));
        return;
      }

      const oauthState = JSON.parse(storedState) as OAuthState;

      // Verify business ID matches
      if (oauthState.businessId !== businessId) {
        res.send(this.callbackHTML(false, platform, 'Business ID mismatch'));
        return;
      }

      const adapter = getAdapter(oauthState.platform);
      const redirectUri = `${req.protocol}://${req.get('host')}/api/v1/businesses/${businessId}/social/callback/${platform}`;

      // Exchange code for tokens
      const tokens = await adapter.handleCallback(
        code!,
        redirectUri,
        oauthState.codeVerifier,
      );

      // Store encrypted tokens
      await socialTokenService.storeTokens(
        oauthState.businessId,
        oauthState.platform,
        oauthState.userId,
        tokens,
      );

      // Return HTML that sends postMessage to opener and closes popup
      res.send(this.callbackHTML(true, platform));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Connection failed';
      const plat = param(req, 'platform');
      logger.error({ error, platform: plat }, 'Social OAuth callback error');
      res.send(this.callbackHTML(false, plat, message));
    }
  }

  /**
   * DELETE /businesses/:businessId/social/accounts/:accountId
   * Disconnect a social account.
   */
  async disconnectAccount(req: Request, res: Response): Promise<void> {
    try {
      const businessId = param(req, 'businessId');
      const accountId = param(req, 'accountId');
      await socialTokenService.disconnect(accountId, businessId);
      sendSuccess(res, null, 200, 'Account disconnected');
    } catch (error) {
      handleError(res, error, 'DISCONNECT_FAILED');
    }
  }

  /**
   * PATCH /businesses/:businessId/social/accounts/:accountId
   * Toggle account active state.
   */
  async toggleAccount(req: Request, res: Response): Promise<void> {
    try {
      const businessId = param(req, 'businessId');
      const accountId = param(req, 'accountId');
      const parsed = socialAccountToggleSchema.parse(req.body);

      const account = await prisma.social_accounts.findFirst({
        where: { id: accountId, business_id: businessId },
      });

      if (!account) {
        sendError(res, 'ACCOUNT_NOT_FOUND', 'Social account not found', 404);
        return;
      }

      await prisma.social_accounts.update({
        where: { id: accountId },
        data: { is_active: parsed.isActive },
      });

      sendSuccess(res, { isActive: parsed.isActive });
    } catch (error) {
      handleError(res, error, 'TOGGLE_FAILED');
    }
  }

  /**
   * POST /businesses/:businessId/social/posts
   * Create social post(s) for a deal/event.
   */
  async createPosts(req: Request, res: Response): Promise<void> {
    try {
      const businessId = param(req, 'businessId');
      const user = req.user!;
      const input = socialPostCreateSchema.parse(req.body);

      const results = await socialPostService.createPosts(businessId, user.id, input);
      sendSuccess(res, results, 201);
    } catch (error) {
      handleError(res, error, 'CREATE_POSTS_FAILED');
    }
  }

  /**
   * GET /businesses/:businessId/social/posts
   * List social posts for a business.
   */
  async listPosts(req: Request, res: Response): Promise<void> {
    try {
      const businessId = param(req, 'businessId');
      const filters = socialPostFilterSchema.parse(req.query);

      const result = await socialPostService.getPostsForBusiness(businessId, filters);
      sendSuccess(res, result);
    } catch (error) {
      handleError(res, error, 'LIST_POSTS_FAILED');
    }
  }

  /**
   * POST /businesses/:businessId/social/posts/:postId/cancel
   * Cancel a pending post.
   */
  async cancelPost(req: Request, res: Response): Promise<void> {
    try {
      const businessId = param(req, 'businessId');
      const postId = param(req, 'postId');
      await socialPostService.cancelPost(postId, businessId);
      sendSuccess(res, null, 200, 'Post cancelled');
    } catch (error) {
      handleError(res, error, 'CANCEL_POST_FAILED');
    }
  }

  /**
   * POST /businesses/:businessId/social/posts/:postId/retry
   * Retry a failed post.
   */
  async retryPost(req: Request, res: Response): Promise<void> {
    try {
      const businessId = param(req, 'businessId');
      const postId = param(req, 'postId');
      await socialPostService.retryPost(postId, businessId);
      sendSuccess(res, null, 200, 'Post queued for retry');
    } catch (error) {
      handleError(res, error, 'RETRY_POST_FAILED');
    }
  }

  /**
   * POST /businesses/:businessId/social/posts/preview-caption
   * Generate a caption preview for a deal/event.
   */
  async previewCaption(req: Request, res: Response): Promise<void> {
    try {
      const businessId = param(req, 'businessId');
      const input = captionPreviewSchema.parse(req.body);

      // Verify the content belongs to this business
      await socialPostService.verifyContentExists(input.contentType, input.contentId, businessId);

      const caption = await socialPostService.generateCaption(
        input.contentType,
        input.contentId,
        input.platform,
      );

      const { CAPTION_LIMITS } = await import('@community-hub/shared');

      sendSuccess(res, {
        platform: input.platform,
        caption,
        characterLimit: CAPTION_LIMITS[input.platform],
        characterCount: caption.length,
      });
    } catch (error) {
      handleError(res, error, 'PREVIEW_CAPTION_FAILED');
    }
  }

  // ─── GBP Data Sync (§26.1) ─────────────────────────────────

  /**
   * GET /businesses/:businessId/social/gbp/profile
   * Fetch current business profile data from Google Business Profile.
   */
  async fetchGbpProfile(req: Request, res: Response): Promise<void> {
    try {
      const businessId = param(req, 'businessId');
      const profile = await gbpProfileService.fetchGbpProfile(businessId);
      sendSuccess(res, profile);
    } catch (error) {
      handleError(res, error, 'GBP_FETCH_FAILED');
    }
  }

  /**
   * POST /businesses/:businessId/social/gbp/sync
   * Apply selected GBP fields to the business record.
   */
  async applyGbpSync(req: Request, res: Response): Promise<void> {
    try {
      const businessId = param(req, 'businessId');
      const user = req.user!;
      const parsed = gbpSyncApplySchema.parse(req.body);

      const auditContext = {
        actorId: user.id,
        actorRole: user.role || 'BUSINESS_OWNER',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      };

      // gbpData is validated by gbpSyncApplySchema (strict Zod schema with
      // max lengths, URL validation, and type constraints). Re-fetching from
      // GBP on every apply would double API calls. The owner reviews the diff
      // in the UI and must also click Save on the form, providing two approval gates.
      const result = await gbpProfileService.applySyncFields(
        businessId,
        parsed.fields as GbpSyncField[],
        parsed.gbpData as GbpProfileData,
        auditContext,
      );

      sendSuccess(res, result);
    } catch (error) {
      handleError(res, error, 'GBP_SYNC_FAILED');
    }
  }

  /**
   * GET /businesses/:businessId/social/gbp/sync-status
   * Get GBP connection and sync status.
   */
  async getGbpSyncStatus(req: Request, res: Response): Promise<void> {
    try {
      const businessId = param(req, 'businessId');
      const status = await gbpProfileService.getSyncStatus(businessId);
      sendSuccess(res, status);
    } catch (error) {
      handleError(res, error, 'GBP_STATUS_FAILED');
    }
  }

  /**
   * Generate the callback HTML that sends postMessage to opener and closes popup.
   * Uses JSON.stringify for JS context to prevent XSS injection.
   */
  private callbackHTML(success: boolean, platform: string, error?: string): string {
    // Sanitize all values using JSON.stringify to prevent XSS
    const messageObj = success
      ? { type: 'social-auth-success', platform }
      : { type: 'social-auth-error', platform, error: error || 'Unknown error' };

    const safeMessage = JSON.stringify(messageObj);
    const safeFrontendUrl = JSON.stringify(FRONTEND_URL);
    const safeDisplayText = (error || 'Unknown error')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

    return `<!DOCTYPE html>
<html>
<head><title>Connecting...</title></head>
<body>
<p>${success ? 'Connected! Closing...' : `Error: ${safeDisplayText}`}</p>
<script>
  if (window.opener) {
    window.opener.postMessage(${safeMessage}, ${safeFrontendUrl});
  }
  setTimeout(function() { window.close(); }, 1000);
</script>
</body>
</html>`;
  }
}

export const socialController = new SocialController();
