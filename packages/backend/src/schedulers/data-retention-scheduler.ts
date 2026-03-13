/**
 * Data Retention Scheduler
 * Phase 9: Messaging System
 * Spec §4.6: Data Retention & Privacy Compliance
 *
 * Periodically anonymizes or deletes old data to comply with:
 * - Australian Privacy Principles (APP)
 * - 90-day IP address retention policy
 * - Message content deletion (soft delete already handled)
 */

import { prisma } from '../db/index.js';
import { logger } from '../utils/logger.js';
import { createHash } from 'crypto';

// ─── Configuration ────────────────────────────────────────────

// How often to run data retention checks (daily at 2 AM is typical)
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Data retention periods
const IP_RETENTION_DAYS = 90; // IP addresses anonymized after 90 days
const AUDIT_LOG_RETENTION_DAYS = 365; // Audit logs kept for 1 year
const DELETED_MESSAGE_RETENTION_DAYS = 30; // Hard delete soft-deleted messages after 30 days

// Batch size for processing
const BATCH_SIZE = 1000;

// ─── Scheduler Class ──────────────────────────────────────────

export class DataRetentionScheduler {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;
  private isProcessing = false;

  /**
   * Starts the data retention scheduler
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('Data retention scheduler is already running');
      return;
    }

    this.isRunning = true;
    logger.info({ intervalMs: CHECK_INTERVAL_MS }, 'Starting data retention scheduler');

    // Run immediately on start (after a short delay to allow startup)
    setTimeout(() => {
      void this.runRetentionTasks();
    }, 60000); // 1 minute delay on startup

    // Schedule daily checks
    this.intervalId = setInterval(() => {
      void this.runRetentionTasks();
    }, CHECK_INTERVAL_MS);
  }

  /**
   * Stops the data retention scheduler
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    logger.info('Data retention scheduler stopped');
  }

  /**
   * Main method that runs all retention tasks
   */
  async runRetentionTasks(): Promise<void> {
    if (this.isProcessing) {
      logger.debug('Data retention tasks already in progress, skipping');
      return;
    }

    this.isProcessing = true;
    const startTime = Date.now();

    try {
      logger.info('Starting data retention tasks');

      // Run each task
      const ipCount = await this.anonymizeOldIpAddresses();
      const auditCount = await this.cleanupOldAuditLogs();
      const messageCount = await this.hardDeleteOldMessages();

      const duration = Date.now() - startTime;
      logger.info(
        {
          duration,
          ipAddressesAnonymized: ipCount,
          auditLogsDeleted: auditCount,
          messagesHardDeleted: messageCount,
        },
        'Data retention tasks completed'
      );
    } catch (error) {
      logger.error({ error }, 'Error in data retention scheduler');
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Anonymizes IP addresses older than retention period
   * Uses SHA-256 hash to maintain uniqueness while removing identifiable info
   */
  private async anonymizeOldIpAddresses(): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - IP_RETENTION_DAYS);

    let totalProcessed = 0;

    try {
      // Process AuditLog entries with old IP addresses
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
          ipAddress: {
            not: null,
          },
          NOT: {
            ipAddress: {
              startsWith: 'ANON:',
            },
          },
        },
        select: {
          id: true,
          ipAddress: true,
        },
        take: BATCH_SIZE,
      });

      if (auditLogs.length > 0) {
        // Batch update with anonymized IPs
        for (const log of auditLogs) {
          if (log.ipAddress && !log.ipAddress.startsWith('ANON:')) {
            const anonymizedIp = this.anonymizeIp(log.ipAddress);
            await prisma.auditLog.update({
              where: { id: log.id },
              data: { ipAddress: anonymizedIp },
            });
            totalProcessed++;
          }
        }

        logger.debug(
          { count: totalProcessed, table: 'AuditLog' },
          'Anonymized IP addresses in audit logs'
        );
      }

      // Process Message entries (if they have IP tracking)
      // Note: Messages may not have direct IP fields, but conversation metadata might
      // This is extensible for future needs

    } catch (error) {
      logger.error({ error }, 'Error anonymizing IP addresses');
    }

    return totalProcessed;
  }

  /**
   * Creates an anonymized version of an IP address
   * Uses truncated SHA-256 hash to maintain uniqueness for analytics
   * while removing the ability to identify specific users
   */
  private anonymizeIp(ip: string): string {
    // Hash the IP with a salt based on the date (allows for time-based correlation)
    const salt = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const hash = createHash('sha256')
      .update(`${ip}:${salt}`)
      .digest('hex')
      .slice(0, 16);
    return `ANON:${hash}`;
  }

  /**
   * Cleans up old audit log entries beyond retention period
   * Archives to cold storage or deletes based on configuration
   */
  private async cleanupOldAuditLogs(): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - AUDIT_LOG_RETENTION_DAYS);

    try {
      // Count logs to be deleted
      const count = await prisma.auditLog.count({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      if (count === 0) {
        return 0;
      }

      // Delete all at once (Prisma handles batching internally)
      const result = await prisma.auditLog.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      logger.debug({ count: result.count }, 'Deleted old audit logs');
      return result.count;
    } catch (error) {
      logger.error({ error }, 'Error cleaning up audit logs');
      return 0;
    }
  }

  /**
   * Hard deletes messages that were soft-deleted beyond retention period
   * This permanently removes message content for privacy compliance
   */
  private async hardDeleteOldMessages(): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - DELETED_MESSAGE_RETENTION_DAYS);

    try {
      // Find soft-deleted messages beyond retention period
      const result = await prisma.message.deleteMany({
        where: {
          deletedAt: {
            lt: cutoffDate,
            not: null,
          },
        },
      });

      if (result.count > 0) {
        logger.debug({ count: result.count }, 'Hard deleted old messages');
      }

      return result.count;
    } catch (error) {
      logger.error({ error }, 'Error hard deleting old messages');
      return 0;
    }
  }

  /**
   * Manually triggers retention tasks (useful for testing or admin action)
   */
  async triggerRetention(): Promise<{
    ipAddressesAnonymized: number;
    auditLogsDeleted: number;
    messagesHardDeleted: number;
  }> {
    const startTime = Date.now();

    const ipCount = await this.anonymizeOldIpAddresses();
    const auditCount = await this.cleanupOldAuditLogs();
    const messageCount = await this.hardDeleteOldMessages();

    logger.info(
      { duration: Date.now() - startTime },
      'Manual data retention trigger completed'
    );

    return {
      ipAddressesAnonymized: ipCount,
      auditLogsDeleted: auditCount,
      messagesHardDeleted: messageCount,
    };
  }

  /**
   * Gets scheduler status
   */
  getStatus(): {
    isRunning: boolean;
    isProcessing: boolean;
    intervalMs: number;
    retentionPeriods: {
      ipAddressDays: number;
      auditLogDays: number;
      deletedMessageDays: number;
    };
  } {
    return {
      isRunning: this.isRunning,
      isProcessing: this.isProcessing,
      intervalMs: CHECK_INTERVAL_MS,
      retentionPeriods: {
        ipAddressDays: IP_RETENTION_DAYS,
        auditLogDays: AUDIT_LOG_RETENTION_DAYS,
        deletedMessageDays: DELETED_MESSAGE_RETENTION_DAYS,
      },
    };
  }
}

// Export singleton instance
export const dataRetentionScheduler = new DataRetentionScheduler();
