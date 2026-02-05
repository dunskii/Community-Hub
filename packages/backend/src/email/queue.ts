import { getRedisClient } from '../cache/redis-client.js';
import { logger } from '../utils/logger.js';

interface QueuedEmail {
  to: string;
  from: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
  tags?: string[];
  retryCount: number;
  queuedAt: string;
}

const QUEUE_KEY = 'email:queue';
const MAX_RETRIES = 3;

/**
 * Email queue backed by Redis.
 * Enables async sending and retry logic.
 */
export class EmailQueue {
  /**
   * Enqueue an email for sending.
   */
  async enqueue(email: Omit<QueuedEmail, 'retryCount' | 'queuedAt'>): Promise<void> {
    const redis = getRedisClient();
    const queuedEmail: QueuedEmail = {
      ...email,
      retryCount: 0,
      queuedAt: new Date().toISOString(),
    };

    await redis.rpush(QUEUE_KEY, JSON.stringify(queuedEmail));
    logger.info('Email enqueued', { to: email.to, subject: email.subject });
  }

  /**
   * Dequeue an email for processing.
   * Returns null if queue is empty.
   */
  async dequeue(): Promise<QueuedEmail | null> {
    const redis = getRedisClient();
    const result = await redis.lpop(QUEUE_KEY);
    if (!result) return null;

    return JSON.parse(result) as QueuedEmail;
  }

  /**
   * Re-queue an email for retry.
   */
  async retry(email: QueuedEmail): Promise<void> {
    if (email.retryCount >= MAX_RETRIES) {
      logger.error('Email max retries exceeded', { to: email.to, subject: email.subject });
      return; // Move to dead-letter queue (implement in Phase 16)
    }

    const redis = getRedisClient();
    const retryEmail: QueuedEmail = {
      ...email,
      retryCount: email.retryCount + 1,
    };

    await redis.rpush(QUEUE_KEY, JSON.stringify(retryEmail));
    logger.warn('Email re-queued for retry', { to: email.to, retryCount: retryEmail.retryCount });
  }

  /**
   * Get queue length.
   */
  async length(): Promise<number> {
    const redis = getRedisClient();
    return redis.llen(QUEUE_KEY);
  }
}
