/**
 * Social Post Queue
 *
 * Redis-backed queue for async social media post publishing.
 * Extends the pattern from packages/backend/src/email/queue.ts
 * with visibility timeout for crash recovery.
 */

import { getRedis } from '../cache/redis-client.js';
import { logger } from '../utils/logger.js';
import type { SocialPlatform } from '@community-hub/shared';

export interface QueuedSocialPost {
  socialPostId: string;
  platform: SocialPlatform;
  retryCount: number;
  queuedAt: string;
}

const QUEUE_KEY = 'social:post:queue';
const PROCESSING_KEY = 'social:post:processing';
const DLQ_KEY = 'social:post:dlq';
const MAX_RETRIES = 3;
const PROCESSING_TTL = 300; // 5 minutes visibility timeout

export class SocialPostQueue {
  /**
   * Enqueue a social post for publishing.
   */
  async enqueue(item: QueuedSocialPost): Promise<void> {
    const redis = getRedis();
    await redis.rpush(QUEUE_KEY, JSON.stringify(item));
    logger.info({ postId: item.socialPostId, platform: item.platform }, 'Social post enqueued');
  }

  /**
   * Dequeue a social post for processing.
   * Moves the item to a processing set with a TTL for crash recovery.
   * Returns null if queue is empty.
   */
  async dequeue(): Promise<QueuedSocialPost | null> {
    const redis = getRedis();
    const raw = await redis.lpop(QUEUE_KEY);
    if (!raw) return null;

    const item = JSON.parse(raw) as QueuedSocialPost;

    // Track in processing set with TTL
    await redis.set(
      `${PROCESSING_KEY}:${item.socialPostId}`,
      raw,
      'EX',
      PROCESSING_TTL,
    );

    return item;
  }

  /**
   * Mark a post as successfully processed (remove from processing set).
   */
  async complete(socialPostId: string): Promise<void> {
    const redis = getRedis();
    await redis.del(`${PROCESSING_KEY}:${socialPostId}`);
  }

  /**
   * Re-queue a failed post for retry.
   * If max retries exceeded, moves to dead letter queue.
   */
  async retry(item: QueuedSocialPost): Promise<boolean> {
    const redis = getRedis();
    await redis.del(`${PROCESSING_KEY}:${item.socialPostId}`);

    if (item.retryCount >= MAX_RETRIES) {
      await this.moveToDLQ(item);
      return false;
    }

    const retryItem: QueuedSocialPost = {
      ...item,
      retryCount: item.retryCount + 1,
      queuedAt: new Date().toISOString(),
    };

    await redis.rpush(QUEUE_KEY, JSON.stringify(retryItem));
    logger.warn(
      { postId: item.socialPostId, retryCount: retryItem.retryCount },
      'Social post re-queued for retry',
    );
    return true;
  }

  /**
   * Move a post to the dead letter queue.
   */
  async moveToDLQ(item: QueuedSocialPost): Promise<void> {
    const redis = getRedis();
    await redis.rpush(DLQ_KEY, JSON.stringify({
      ...item,
      failedAt: new Date().toISOString(),
    }));
    logger.error(
      { postId: item.socialPostId, platform: item.platform },
      'Social post moved to dead letter queue after max retries',
    );
  }

  /**
   * Get queue length.
   */
  async length(): Promise<number> {
    const redis = getRedis();
    return redis.llen(QUEUE_KEY);
  }

  /**
   * Get dead letter queue length.
   */
  async dlqLength(): Promise<number> {
    const redis = getRedis();
    return redis.llen(DLQ_KEY);
  }
}

export const socialPostQueue = new SocialPostQueue();
