/**
 * Social Media Routes
 *
 * API endpoints for social media OAuth connections and auto-posting.
 * Mounted at /businesses/:businessId/social
 *
 * Spec §20: Social Media Integration
 */

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { socialController } from '../controllers/social-controller.js';
import { requireAuth } from '../middleware/auth-middleware.js';
import { requireBusinessOwnership } from '../middleware/business-ownership.js';
import {
  socialAuthLimiter,
  socialPostLimiter,
  socialPreviewLimiter,
  socialAccountLimiter,
} from '../middleware/social-rate-limiter.js';
import { sendError } from '../utils/api-response.js';
import { getPlatformConfig } from '../config/platform-loader.js';

const router: ReturnType<typeof Router> = Router({ mergeParams: true });

// Feature gate: check socialPosting feature flag
router.use((_req: Request, res: Response, next: NextFunction) => {
  const config = getPlatformConfig();
  if (!config.features.socialPosting) {
    sendError(res, 'NOT_FOUND', 'Social media posting is not enabled.', 404);
    return;
  }
  next();
});

// ─── OAuth Callback (no auth required - user returning from provider) ─────

/**
 * GET /businesses/:businessId/social/callback/:platform
 * OAuth callback handler - exchanges code for tokens
 * Returns HTML that sends postMessage to opener and closes popup
 * No auth required: validated via Redis CSRF state token.
 */
router.get(
  '/callback/:platform',
  socialController.handleCallback.bind(socialController),
);

// All remaining routes require authentication
router.use(requireAuth);

// ─── Account Management ───────────────────────────────────────

/**
 * GET /businesses/:businessId/social/accounts
 * List connected social accounts for a business
 */
router.get(
  '/accounts',
  requireBusinessOwnership,
  socialAccountLimiter,
  socialController.listAccounts.bind(socialController),
);

/**
 * GET /businesses/:businessId/social/auth/:platform
 * Initiate OAuth flow (redirects to platform auth page)
 * Opens in popup window from frontend
 */
router.get(
  '/auth/:platform',
  requireBusinessOwnership,
  socialAuthLimiter,
  socialController.initiateAuth.bind(socialController),
);

/**
 * DELETE /businesses/:businessId/social/accounts/:accountId
 * Disconnect a social account (revoke token + delete)
 */
router.delete(
  '/accounts/:accountId',
  requireBusinessOwnership,
  socialAccountLimiter,
  socialController.disconnectAccount.bind(socialController),
);

/**
 * PATCH /businesses/:businessId/social/accounts/:accountId
 * Toggle account active/inactive
 */
router.patch(
  '/accounts/:accountId',
  requireBusinessOwnership,
  socialAccountLimiter,
  socialController.toggleAccount.bind(socialController),
);

// ─── GBP Data Sync (§26.1) ───────────────────────────────────

/**
 * GET /businesses/:businessId/social/gbp/profile
 * Fetch business profile data from Google Business Profile
 */
router.get(
  '/gbp/profile',
  requireBusinessOwnership,
  socialAccountLimiter,
  socialController.fetchGbpProfile.bind(socialController),
);

/**
 * POST /businesses/:businessId/social/gbp/sync
 * Apply selected GBP fields to the business record
 */
router.post(
  '/gbp/sync',
  requireBusinessOwnership,
  socialPostLimiter,
  socialController.applyGbpSync.bind(socialController),
);

/**
 * GET /businesses/:businessId/social/gbp/sync-status
 * Get GBP connection and sync status
 */
router.get(
  '/gbp/sync-status',
  requireBusinessOwnership,
  socialAccountLimiter,
  socialController.getGbpSyncStatus.bind(socialController),
);

// ─── Social Posting ───────────────────────────────────────────

/**
 * POST /businesses/:businessId/social/posts
 * Create social post(s) for a deal or event
 */
router.post(
  '/posts',
  requireBusinessOwnership,
  socialPostLimiter,
  socialController.createPosts.bind(socialController),
);

/**
 * GET /businesses/:businessId/social/posts
 * List social posts with filters
 */
router.get(
  '/posts',
  requireBusinessOwnership,
  socialController.listPosts.bind(socialController),
);

/**
 * POST /businesses/:businessId/social/posts/:postId/cancel
 * Cancel a pending/queued post
 */
router.post(
  '/posts/:postId/cancel',
  requireBusinessOwnership,
  socialPostLimiter,
  socialController.cancelPost.bind(socialController),
);

/**
 * POST /businesses/:businessId/social/posts/:postId/retry
 * Retry a failed post
 */
router.post(
  '/posts/:postId/retry',
  requireBusinessOwnership,
  socialPostLimiter,
  socialController.retryPost.bind(socialController),
);

/**
 * POST /businesses/:businessId/social/posts/preview-caption
 * Generate caption preview for a deal/event
 */
router.post(
  '/posts/preview-caption',
  requireBusinessOwnership,
  socialPreviewLimiter,
  socialController.previewCaption.bind(socialController),
);

export { router as socialRouter };
