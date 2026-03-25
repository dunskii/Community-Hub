/**
 * Social Token Service
 *
 * Manages encrypted storage, retrieval, and refresh of social media OAuth tokens.
 * Spec §20: Social Media Integration, §4.2: AES-256 encryption
 */

import { prisma } from '../db/index.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/api-error.js';
import { encryptToken, decryptToken } from '../utils/social-encryption.js';
import { getRedis } from '../cache/redis-client.js';
import { getAdapter } from '../social/adapter-registry.js';
import type { SocialPlatform } from '@community-hub/shared';
import type { OAuthTokenResponse } from '../social/types.js';

const TOKEN_REFRESH_LOCK_TTL = 60; // seconds
const TOKEN_REFRESH_BUFFER_MS = 24 * 60 * 60 * 1000; // 24 hours

export class SocialTokenService {
  /**
   * Store OAuth tokens for a connected social account.
   */
  async storeTokens(
    businessId: string,
    platform: SocialPlatform,
    connectedBy: string,
    tokens: OAuthTokenResponse,
  ): Promise<string> {
    const encryptedAccess = encryptToken(tokens.accessToken);
    const encryptedRefresh = tokens.refreshToken ? encryptToken(tokens.refreshToken) : null;

    const tokenExpiresAt = tokens.expiresIn
      ? new Date(Date.now() + tokens.expiresIn * 1000)
      : null;

    const account = await prisma.social_accounts.upsert({
      where: {
        business_id_platform: {
          business_id: businessId,
          platform,
        },
      },
      update: {
        access_token_encrypted: encryptedAccess,
        refresh_token_encrypted: encryptedRefresh,
        token_expires_at: tokenExpiresAt,
        platform_account_id: tokens.platformAccountId,
        platform_account_name: tokens.platformAccountName,
        scopes: tokens.scopes,
        is_active: true,
        last_error: null,
      },
      create: {
        business_id: businessId,
        platform,
        platform_account_id: tokens.platformAccountId,
        platform_account_name: tokens.platformAccountName,
        access_token_encrypted: encryptedAccess,
        refresh_token_encrypted: encryptedRefresh,
        token_expires_at: tokenExpiresAt,
        scopes: tokens.scopes,
        connected_by: connectedBy,
      },
    });

    logger.info(
      { businessId, platform, accountId: account.id },
      'Social account tokens stored',
    );

    return account.id;
  }

  /**
   * Get a valid access token for a social account.
   * Refreshes the token if expired or about to expire.
   */
  async getValidToken(accountId: string): Promise<string> {
    const account = await prisma.social_accounts.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw ApiError.notFound('SOCIAL_ACCOUNT_NOT_FOUND', 'Social account not found');
    }

    if (!account.is_active) {
      throw ApiError.forbidden('SOCIAL_ACCOUNT_INACTIVE', 'Social account is inactive');
    }

    const accessToken = decryptToken(account.access_token_encrypted);

    // Check if token needs refresh
    if (account.token_expires_at) {
      const timeUntilExpiry = account.token_expires_at.getTime() - Date.now();
      if (timeUntilExpiry < 5 * 60 * 1000) { // Less than 5 minutes
        return this.refreshAndReturn(account.id, account.platform, account.refresh_token_encrypted);
      }
    }

    return accessToken;
  }

  /**
   * Refresh the token with a Redis lock to prevent concurrent refreshes.
   */
  private async refreshAndReturn(
    accountId: string,
    platform: SocialPlatform,
    encryptedRefreshToken: string | null,
  ): Promise<string> {
    if (!encryptedRefreshToken) {
      // No refresh token - mark as needing re-auth
      await prisma.social_accounts.update({
        where: { id: accountId },
        data: { last_error: 'Token expired. Re-authentication required.' },
      });
      throw ApiError.forbidden('TOKEN_EXPIRED', 'Social token expired. Please re-connect the account.');
    }

    const redis = getRedis();
    const lockKey = `social:token:refresh:${accountId}`;

    // Try to acquire lock
    const acquired = await redis.set(lockKey, '1', 'EX', TOKEN_REFRESH_LOCK_TTL, 'NX');
    if (!acquired) {
      // Another process is refreshing - wait briefly and read the updated token
      await new Promise(resolve => setTimeout(resolve, 2000));
      const updated = await prisma.social_accounts.findUnique({ where: { id: accountId } });
      if (updated) return decryptToken(updated.access_token_encrypted);
      throw new Error('Failed to get refreshed token');
    }

    try {
      const refreshToken = decryptToken(encryptedRefreshToken);
      const adapter = getAdapter(platform);
      const newTokens = await adapter.refreshToken(refreshToken);

      const encryptedAccess = encryptToken(newTokens.accessToken);
      const encryptedRefresh = newTokens.refreshToken
        ? encryptToken(newTokens.refreshToken)
        : encryptedRefreshToken;

      const tokenExpiresAt = newTokens.expiresIn
        ? new Date(Date.now() + newTokens.expiresIn * 1000)
        : null;

      await prisma.social_accounts.update({
        where: { id: accountId },
        data: {
          access_token_encrypted: encryptedAccess,
          refresh_token_encrypted: encryptedRefresh,
          token_expires_at: tokenExpiresAt,
          last_error: null,
        },
      });

      logger.info({ accountId, platform }, 'Social token refreshed');
      return newTokens.accessToken;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Token refresh failed';
      await prisma.social_accounts.update({
        where: { id: accountId },
        data: { last_error: message },
      });
      logger.error({ accountId, platform, error: message }, 'Social token refresh failed');
      throw error;
    } finally {
      await redis.del(lockKey);
    }
  }

  /**
   * Proactively refresh tokens that are expiring within 24 hours.
   */
  async refreshExpiringTokens(): Promise<void> {
    const cutoff = new Date(Date.now() + TOKEN_REFRESH_BUFFER_MS);

    const expiringAccounts = await prisma.social_accounts.findMany({
      where: {
        is_active: true,
        token_expires_at: { lte: cutoff },
        refresh_token_encrypted: { not: null },
      },
      select: { id: true, platform: true, refresh_token_encrypted: true },
    });

    for (const account of expiringAccounts) {
      try {
        await this.refreshAndReturn(
          account.id,
          account.platform,
          account.refresh_token_encrypted,
        );
      } catch (error) {
        logger.warn(
          { accountId: account.id, platform: account.platform },
          'Proactive token refresh failed',
        );
      }
    }

    if (expiringAccounts.length > 0) {
      logger.info({ count: expiringAccounts.length }, 'Proactive token refresh complete');
    }
  }

  /**
   * Disconnect a social account - revoke token and delete record.
   */
  async disconnect(accountId: string, businessId: string): Promise<void> {
    const account = await prisma.social_accounts.findFirst({
      where: { id: accountId, business_id: businessId },
    });

    if (!account) {
      throw ApiError.notFound('SOCIAL_ACCOUNT_NOT_FOUND', 'Social account not found');
    }

    // Best-effort token revocation on the platform
    try {
      const adapter = getAdapter(account.platform);
      const accessToken = decryptToken(account.access_token_encrypted);
      await adapter.revokeToken(accessToken);
    } catch (error) {
      logger.warn({ accountId, platform: account.platform }, 'Token revocation failed (continuing with deletion)');
    }

    // Cancel any pending posts
    await prisma.social_posts.updateMany({
      where: {
        social_account_id: accountId,
        status: { in: ['PENDING', 'QUEUED'] },
      },
      data: { status: 'CANCELLED', error_message: 'Account disconnected' },
    });

    // Delete the account (cascades to social_posts)
    await prisma.social_accounts.delete({ where: { id: accountId } });

    logger.info({ accountId, businessId, platform: account.platform }, 'Social account disconnected');
  }
}

export const socialTokenService = new SocialTokenService();
