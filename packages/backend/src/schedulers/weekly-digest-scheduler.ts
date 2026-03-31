/**
 * Weekly Digest Scheduler
 *
 * Sends weekly digest emails to opted-in users containing deals and events
 * from their saved businesses. Follows the EventReminderScheduler pattern.
 *
 * Configuration via platform.json:
 * - digest.weeklyDigestDay: 0=Sunday, 1=Monday, ..., 6=Saturday
 * - digest.weeklyDigestHourUTC: 0-23 (UTC hour to send)
 * - digest.enabled: true/false
 */

import { logger } from '../utils/logger.js';
import { getRedis } from '../cache/redis-client.js';
import { weeklyDigestService } from '../services/weekly-digest-service.js';
import { loadPlatformConfig } from '../config/platform-loader.js';
import { prisma } from '../db/index.js';

// ─── Configuration ────────────────────────────────────────────

// Check every hour whether it's time to send digests
const CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

// Redis cache prefix for tracking sent digests
const DIGEST_CACHE_PREFIX = 'digest:weekly:sent';

// Batch size for processing users
const BATCH_SIZE = 50;

// ─── Scheduler Class ──────────────────────────────────────────

export class WeeklyDigestScheduler {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;
  private isProcessing = false;

  /**
   * Start the digest scheduler.
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('Weekly digest scheduler is already running');
      return;
    }

    const config = loadPlatformConfig();
    if (!config.digest?.enabled) {
      logger.info('Weekly digest scheduler is disabled via config');
      return;
    }

    this.isRunning = true;
    logger.info(
      { intervalMs: CHECK_INTERVAL_MS, day: config.digest.weeklyDigestDay, hourUTC: config.digest.weeklyDigestHourUTC },
      'Starting weekly digest scheduler'
    );

    // Run check immediately on start
    void this.checkAndSend();

    // Schedule periodic checks
    this.intervalId = setInterval(() => {
      void this.checkAndSend();
    }, CHECK_INTERVAL_MS);
  }

  /**
   * Stop the digest scheduler.
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    logger.info('Weekly digest scheduler stopped');
  }

  /**
   * Check if it's time to send digests and process if so.
   */
  async checkAndSend(): Promise<void> {
    if (this.isProcessing) {
      logger.debug('Weekly digest is already being processed, skipping');
      return;
    }

    try {
      const config = loadPlatformConfig();
      const now = new Date();
      const currentDayUTC = now.getUTCDay();
      const currentHourUTC = now.getUTCHours();

      // Only send on the configured day and hour
      if (currentDayUTC !== config.digest.weeklyDigestDay || currentHourUTC !== config.digest.weeklyDigestHourUTC) {
        return;
      }

      // Check if we already processed this week
      const yearWeek = this.getYearWeek(now);
      const globalKey = `${DIGEST_CACHE_PREFIX}:global:${yearWeek}`;
      const alreadyProcessed = await this.wasProcessed(globalKey);
      if (alreadyProcessed) {
        logger.debug({ yearWeek }, 'Weekly digest already processed this week');
        return;
      }

      logger.info({ yearWeek }, 'Starting weekly digest processing');
      this.isProcessing = true;

      // Get all opted-in users
      const users = await weeklyDigestService.getDigestUsers();
      if (users.length === 0) {
        logger.info('No users opted in for weekly digest');
        await this.markProcessed(globalKey);
        this.isProcessing = false;
        return;
      }

      logger.info({ userCount: users.length }, 'Processing weekly digest for users');

      let sentCount = 0;
      let skippedCount = 0;
      let errorCount = 0;

      // Process in batches
      for (let i = 0; i < users.length; i += BATCH_SIZE) {
        const batch = users.slice(i, i + BATCH_SIZE);

        for (const user of batch) {
          // Check per-user dedup
          const userKey = `${DIGEST_CACHE_PREFIX}:${user.id}:${yearWeek}`;
          const alreadySent = await this.wasProcessed(userKey);
          if (alreadySent) {
            skippedCount++;
            continue;
          }

          try {
            const sent = await weeklyDigestService.sendDigestForUser(user);
            if (sent) {
              sentCount++;
            } else {
              skippedCount++; // No content for this user
            }
            // Mark as sent regardless (no content = don't retry)
            await this.markProcessed(userKey);
          } catch (error) {
            errorCount++;
            logger.error({ error, userId: user.id }, 'Failed to process digest for user');
          }
        }
      }

      // Mark global processing as done
      await this.markProcessed(globalKey);

      logger.info(
        { sentCount, skippedCount, errorCount, totalUsers: users.length },
        'Weekly digest processing complete'
      );
    } catch (error) {
      logger.error({ error }, 'Error in weekly digest scheduler');
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Get ISO year-week string (e.g., "2026-W14") for deduplication.
   */
  private getYearWeek(date: Date): string {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  }

  /**
   * Check if a digest key was already processed (Redis with DB fallback).
   */
  private async wasProcessed(key: string): Promise<boolean> {
    try {
      const redis = getRedis();
      if (redis && redis.status === 'ready') {
        const exists = await redis.exists(key);
        return exists === 1;
      }
    } catch {
      // Fall through to DB
    }

    // Database fallback
    const setting = await prisma.system_settings.findFirst({
      where: { key },
    });
    return setting !== null;
  }

  /**
   * Mark a digest key as processed (Redis with 8-day TTL + DB fallback).
   */
  private async markProcessed(key: string): Promise<void> {
    try {
      const redis = getRedis();
      if (redis && redis.status === 'ready') {
        await redis.setex(key, 8 * 24 * 60 * 60, '1'); // 8-day TTL
        return;
      }
    } catch {
      // Fall through to DB
    }

    // Database fallback
    await prisma.system_settings.upsert({
      where: { key },
      create: {
        key,
        value: { sent: true, timestamp: new Date().toISOString() },
        description: 'Weekly digest sent marker',
        updated_at: new Date(),
      },
      update: {
        value: { sent: true, timestamp: new Date().toISOString() },
        updated_at: new Date(),
      },
    });
  }

  /**
   * Manually trigger digest processing (useful for testing).
   */
  async triggerDigest(): Promise<void> {
    logger.info('Manually triggering weekly digest');
    this.isProcessing = false; // Reset processing flag
    const users = await weeklyDigestService.getDigestUsers();

    let sentCount = 0;
    for (const user of users) {
      const sent = await weeklyDigestService.sendDigestForUser(user);
      if (sent) sentCount++;
    }

    logger.info({ sentCount, totalUsers: users.length }, 'Manual weekly digest complete');
  }

  /**
   * Get scheduler status.
   */
  getStatus(): { isRunning: boolean; isProcessing: boolean; intervalMs: number } {
    return {
      isRunning: this.isRunning,
      isProcessing: this.isProcessing,
      intervalMs: CHECK_INTERVAL_MS,
    };
  }
}

// Export singleton instance
export const weeklyDigestScheduler = new WeeklyDigestScheduler();
