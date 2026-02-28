import { getRedis } from '../cache/redis-client.js';
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
    const redis = getRedis();
    const queuedEmail: QueuedEmail = {
      ...email,
      retryCount: 0,
      queuedAt: new Date().toISOString(),
    };

    await redis.rpush(QUEUE_KEY, JSON.stringify(queuedEmail));
    logger.info({ to: email.to, subject: email.subject }, 'Email enqueued');
  }

  /**
   * Dequeue an email for processing.
   * Returns null if queue is empty.
   */
  async dequeue(): Promise<QueuedEmail | null> {
    const redis = getRedis();
    const result = await redis.lpop(QUEUE_KEY);
    if (!result) return null;

    return JSON.parse(result) as QueuedEmail;
  }

  /**
   * Re-queue an email for retry.
   */
  async retry(email: QueuedEmail): Promise<void> {
    if (email.retryCount >= MAX_RETRIES) {
      logger.error({ to: email.to, subject: email.subject }, 'Email max retries exceeded');
      return; // Move to dead-letter queue (implement in Phase 16)
    }

    const redis = getRedis();
    const retryEmail: QueuedEmail = {
      ...email,
      retryCount: email.retryCount + 1,
    };

    await redis.rpush(QUEUE_KEY, JSON.stringify(retryEmail));
    logger.warn({ to: email.to, retryCount: retryEmail.retryCount }, 'Email re-queued for retry');
  }

  /**
   * Get queue length.
   */
  async length(): Promise<number> {
    const redis = getRedis();
    return redis.llen(QUEUE_KEY);
  }
}
