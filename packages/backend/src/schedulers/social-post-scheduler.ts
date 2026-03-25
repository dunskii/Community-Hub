/**
 * Social Post Scheduler
 *
 * Periodically processes the social post queue and publishes posts
 * to connected platforms via their adapters.
 *
 * Also handles:
 * - Scheduled posts (PENDING -> QUEUED when due)
 * - Rate limiting per business per platform
 * - Proactive token refresh
 *
 * Modeled after EventReminderScheduler.
 */

import { prisma } from '../db/index.js';
import { logger } from '../utils/logger.js';
import { getRedis } from '../cache/redis-client.js';
import { socialPostQueue } from '../queues/social-post-queue.js';
import { socialTokenService } from '../services/social-token-service.js';
import { getAdapter } from '../social/adapter-registry.js';
import type { SocialPlatform } from '@community-hub/shared';

// ─── Configuration ────────────────────────────────────────────

const PROCESS_INTERVAL_MS = 30 * 1000; // Process every 30 seconds
const SCHEDULED_CHECK_INTERVAL_MS = 60 * 1000; // Check scheduled posts every 60 seconds
const TOKEN_REFRESH_INTERVAL_MS = 60 * 60 * 1000; // Refresh tokens every hour
const RATE_LIMIT_WINDOW_S = 60; // 1 minute window
const MAX_POSTS_PER_MINUTE_PER_ACCOUNT = 1;
const MAX_GLOBAL_POSTS_PER_MINUTE = 10;

// ─── Scheduler Class ──────────────────────────────────────────

export class SocialPostScheduler {
  private processIntervalId: ReturnType<typeof setInterval> | null = null;
  private scheduledCheckId: ReturnType<typeof setInterval> | null = null;
  private tokenRefreshId: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;

  /**
   * Start the social post scheduler.
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('Social post scheduler is already running');
      return;
    }

    this.isRunning = true;

    // Process queue every 30 seconds
    this.processIntervalId = setInterval(() => {
      this.processQueue().catch(err => {
        logger.error({ error: err }, 'Social post queue processing error');
      });
    }, PROCESS_INTERVAL_MS);

    // Check for scheduled posts every 60 seconds
    this.scheduledCheckId = setInterval(() => {
      this.promoteScheduledPosts().catch(err => {
        logger.error({ error: err }, 'Scheduled post promotion error');
      });
    }, SCHEDULED_CHECK_INTERVAL_MS);

    // Proactive token refresh every hour
    this.tokenRefreshId = setInterval(() => {
      socialTokenService.refreshExpiringTokens().catch(err => {
        logger.error({ error: err }, 'Token refresh error');
      });
    }, TOKEN_REFRESH_INTERVAL_MS);

    logger.info('Social post scheduler started');
  }

  /**
   * Stop the scheduler.
   */
  stop(): void {
    if (this.processIntervalId) {
      clearInterval(this.processIntervalId);
      this.processIntervalId = null;
    }
    if (this.scheduledCheckId) {
      clearInterval(this.scheduledCheckId);
      this.scheduledCheckId = null;
    }
    if (this.tokenRefreshId) {
      clearInterval(this.tokenRefreshId);
      this.tokenRefreshId = null;
    }
    this.isRunning = false;
    logger.info('Social post scheduler stopped');
  }

  /**
   * Process queued social posts (batch - up to MAX_GLOBAL_POSTS_PER_MINUTE per cycle).
   */
  private async processQueue(): Promise<void> {
    const maxPerCycle = MAX_GLOBAL_POSTS_PER_MINUTE;

    for (let i = 0; i < maxPerCycle; i++) {
      // Check global rate limit
      if (!(await this.checkGlobalRateLimit())) return;

      const item = await socialPostQueue.dequeue();
      if (!item) return; // Queue empty

      await this.processItem(item);
    }
  }

  /**
   * Process a single queued social post.
   */
  private async processItem(item: import('../queues/social-post-queue.js').QueuedSocialPost): Promise<void> {
    const { socialPostId, platform } = item;

    try {
      // Get the post record
      const post = await prisma.social_posts.findUnique({
        where: { id: socialPostId },
        include: {
          social_accounts: { select: { id: true, platform_account_id: true } },
        },
      });

      if (!post || post.status === 'CANCELLED') {
        await socialPostQueue.complete(socialPostId);
        return;
      }

      // Check per-account rate limit
      if (!(await this.checkAccountRateLimit(post.social_account_id, platform))) {
        // Re-queue with a short delay (will be picked up next cycle)
        await socialPostQueue.retry({ ...item, retryCount: item.retryCount }); // Don't increment
        return;
      }

      // Update status to PUBLISHING
      await prisma.social_posts.update({
        where: { id: socialPostId },
        data: { status: 'PUBLISHING' },
      });

      await prisma.social_post_logs.create({
        data: { social_post_id: socialPostId, action: 'PUBLISHING' },
      });

      // Get valid token (refreshes if needed)
      const accessToken = await socialTokenService.getValidToken(post.social_account_id);

      // Publish via adapter
      const adapter = getAdapter(platform);
      const result = await adapter.publishPost(accessToken, {
        caption: post.caption,
        imageUrl: post.image_url || undefined,
        platformAccountId: post.social_accounts.platform_account_id,
      });

      // Mark as published
      await prisma.social_posts.update({
        where: { id: socialPostId },
        data: {
          status: 'PUBLISHED',
          platform_post_id: result.platformPostId,
          platform_post_url: result.platformPostUrl || null,
          published_at: new Date(),
          error_message: null,
        },
      });

      // Update account last_post_at
      await prisma.social_accounts.update({
        where: { id: post.social_account_id },
        data: { last_post_at: new Date(), last_error: null },
      });

      await prisma.social_post_logs.create({
        data: {
          social_post_id: socialPostId,
          action: 'PUBLISHED',
          details: { platformPostId: result.platformPostId, platformPostUrl: result.platformPostUrl },
        },
      });

      await socialPostQueue.complete(socialPostId);

      // Increment rate limit counters
      await this.incrementRateLimitCounters(post.social_account_id, platform);

      logger.info(
        { socialPostId, platform, platformPostId: result.platformPostId },
        'Social post published',
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown publish error';

      await prisma.social_post_logs.create({
        data: {
          social_post_id: socialPostId,
          action: 'FAILED',
          details: { error: errorMessage },
        },
      });

      // Retry or move to DLQ
      const retried = await socialPostQueue.retry(item);

      if (!retried) {
        // Max retries exceeded
        await prisma.social_posts.update({
          where: { id: socialPostId },
          data: {
            status: 'FAILED',
            error_message: errorMessage,
          },
        });
      } else {
        // Will retry - update error but keep queued
        await prisma.social_posts.update({
          where: { id: socialPostId },
          data: {
            status: 'QUEUED',
            error_message: errorMessage,
          },
        });
      }

      logger.error(
        { socialPostId, platform, error: errorMessage, retryCount: item.retryCount },
        'Social post publish failed',
      );
    }
  }

  /**
   * Promote PENDING scheduled posts to QUEUED when their scheduled time arrives.
   */
  private async promoteScheduledPosts(): Promise<void> {
    const now = new Date();

    const duePosts = await prisma.social_posts.findMany({
      where: {
        status: 'PENDING',
        scheduled_at: { lte: now },
      },
      select: { id: true, platform: true },
    });

    for (const post of duePosts) {
      await prisma.social_posts.update({
        where: { id: post.id },
        data: { status: 'QUEUED' },
      });

      await socialPostQueue.enqueue({
        socialPostId: post.id,
        platform: post.platform,
        retryCount: 0,
        queuedAt: now.toISOString(),
      });

      await prisma.social_post_logs.create({
        data: {
          social_post_id: post.id,
          action: 'QUEUED',
          details: { reason: 'Scheduled time reached' },
        },
      });
    }

    if (duePosts.length > 0) {
      logger.info({ count: duePosts.length }, 'Promoted scheduled social posts to queue');
    }
  }

  /**
   * Check per-account rate limit (1 post/minute per platform account).
   */
  private async checkAccountRateLimit(accountId: string, platform: SocialPlatform): Promise<boolean> {
    const redis = getRedis();
    const key = `social:ratelimit:${accountId}:${platform}`;
    const count = await redis.get(key);
    return !count || parseInt(count) < MAX_POSTS_PER_MINUTE_PER_ACCOUNT;
  }

  /**
   * Check global rate limit (10 posts/minute across all accounts).
   */
  private async checkGlobalRateLimit(): Promise<boolean> {
    const redis = getRedis();
    const key = `social:ratelimit:global:${Math.floor(Date.now() / 60000)}`;
    const count = await redis.get(key);
    return !count || parseInt(count) < MAX_GLOBAL_POSTS_PER_MINUTE;
  }

  /**
   * Increment rate limit counters after a successful publish.
   */
  private async incrementRateLimitCounters(accountId: string, platform: SocialPlatform): Promise<void> {
    const redis = getRedis();

    // Per-account limit
    const accountKey = `social:ratelimit:${accountId}:${platform}`;
    await redis.incr(accountKey);
    await redis.expire(accountKey, RATE_LIMIT_WINDOW_S);

    // Global limit
    const globalKey = `social:ratelimit:global:${Math.floor(Date.now() / 60000)}`;
    await redis.incr(globalKey);
    await redis.expire(globalKey, RATE_LIMIT_WINDOW_S);
  }
}

export const socialPostScheduler = new SocialPostScheduler();
