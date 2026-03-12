/**
 * Event Reminder Scheduler
 * Phase 8: Events & Calendar System
 * Spec §15: Events & Calendar
 *
 * Periodically checks for upcoming events and sends reminder notifications
 * to users who have RSVP'd with GOING status.
 *
 * Reminder Types:
 * - 24h: Sent 24 hours before event starts
 * - 1h: Sent 1 hour before event starts
 */

import { prisma } from '../db/index.js';
import { logger } from '../utils/logger.js';
import { eventNotificationService, type EventNotificationData } from '../services/event-notification-service.js';
import { EventStatus, RSVPStatus } from '../generated/prisma/index.js';
import { getRedis } from '../cache/redis-client.js';
import type { VenueInput } from '@community-hub/shared';

// ─── Configuration ────────────────────────────────────────────

// How often to check for events needing reminders (in milliseconds)
const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// Time windows for reminders
const REMINDER_24H_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
const REMINDER_1H_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// Tolerance window for timing (don't send if too late)
const REMINDER_TOLERANCE_MS = 10 * 60 * 1000; // 10 minutes

// Cache key prefix for tracking sent reminders
const REMINDER_CACHE_PREFIX = 'event:reminder:sent';

// ─── Types ────────────────────────────────────────────────────

interface ScheduledReminder {
  eventId: string;
  eventTitle: string;
  startTime: Date;
  reminderType: '24h' | '1h';
}

// ─── Scheduler Class ──────────────────────────────────────────

export class EventReminderScheduler {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;

  /**
   * Starts the reminder scheduler
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('Event reminder scheduler is already running');
      return;
    }

    this.isRunning = true;
    logger.info({ intervalMs: CHECK_INTERVAL_MS }, 'Starting event reminder scheduler');

    // Run immediately on start
    void this.checkAndSendReminders();

    // Schedule periodic checks
    this.intervalId = setInterval(() => {
      void this.checkAndSendReminders();
    }, CHECK_INTERVAL_MS);
  }

  /**
   * Stops the reminder scheduler
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    logger.info('Event reminder scheduler stopped');
  }

  /**
   * Main method that checks for events and sends reminders
   */
  async checkAndSendReminders(): Promise<void> {
    try {
      const now = new Date();

      // Find events needing 24h reminders
      const events24h = await this.findEventsForReminder(now, '24h');

      // Find events needing 1h reminders
      const events1h = await this.findEventsForReminder(now, '1h');

      if (events24h.length === 0 && events1h.length === 0) {
        logger.debug('No events need reminders at this time');
        return;
      }

      logger.info(
        { count24h: events24h.length, count1h: events1h.length },
        'Found events needing reminders'
      );

      // Process 24h reminders
      for (const reminder of events24h) {
        await this.processReminder(reminder);
      }

      // Process 1h reminders
      for (const reminder of events1h) {
        await this.processReminder(reminder);
      }
    } catch (error) {
      logger.error({ error }, 'Error in event reminder scheduler');
    }
  }

  /**
   * Finds events that need reminders of a specific type
   */
  private async findEventsForReminder(
    now: Date,
    reminderType: '24h' | '1h'
  ): Promise<ScheduledReminder[]> {
    const windowMs = reminderType === '24h' ? REMINDER_24H_WINDOW_MS : REMINDER_1H_WINDOW_MS;

    // Calculate the target time window
    const targetTime = new Date(now.getTime() + windowMs);
    const minTime = new Date(targetTime.getTime() - REMINDER_TOLERANCE_MS);
    const maxTime = new Date(targetTime.getTime() + REMINDER_TOLERANCE_MS);

    // Find events starting within the reminder window
    const events = await prisma.event.findMany({
      where: {
        status: EventStatus.ACTIVE,
        startTime: {
          gte: minTime,
          lte: maxTime,
        },
        // Only include events with GOING RSVPs
        rsvps: {
          some: {
            status: RSVPStatus.GOING,
          },
        },
      },
      select: {
        id: true,
        title: true,
        startTime: true,
      },
    });

    // Filter out events that already had this reminder sent
    const reminders: ScheduledReminder[] = [];
    for (const event of events) {
      const alreadySent = await this.wasReminderSent(event.id, reminderType);
      if (!alreadySent) {
        reminders.push({
          eventId: event.id,
          eventTitle: event.title,
          startTime: event.startTime,
          reminderType,
        });
      }
    }

    return reminders;
  }

  /**
   * Processes a single reminder (sends notifications and marks as sent)
   */
  private async processReminder(reminder: ScheduledReminder): Promise<void> {
    try {
      // Get full event data for notification
      const event = await prisma.event.findUnique({
        where: { id: reminder.eventId },
        include: {
          createdBy: {
            select: {
              displayName: true,
            },
          },
        },
      });

      if (!event) {
        logger.warn({ eventId: reminder.eventId }, 'Event not found for reminder');
        return;
      }

      // Build notification data
      const notificationData: EventNotificationData = {
        eventId: event.id,
        eventTitle: event.title,
        eventStartTime: event.startTime,
        eventEndTime: event.endTime,
        locationType: event.locationType,
        venue: event.venue as VenueInput | null,
        onlineUrl: event.onlineUrl,
        organizerName: event.createdBy.displayName,
      };

      // Send reminders
      await eventNotificationService.sendEventReminders(
        notificationData,
        reminder.reminderType
      );

      // Mark reminder as sent
      await this.markReminderSent(reminder.eventId, reminder.reminderType);

      logger.info(
        { eventId: reminder.eventId, eventTitle: reminder.eventTitle, reminderType: reminder.reminderType },
        'Event reminder sent successfully'
      );
    } catch (error) {
      logger.error(
        { error, eventId: reminder.eventId, reminderType: reminder.reminderType },
        'Failed to process event reminder'
      );
    }
  }

  /**
   * Checks if a reminder was already sent (using Redis)
   */
  private async wasReminderSent(eventId: string, reminderType: '24h' | '1h'): Promise<boolean> {
    try {
      const redis = getRedis();
      if (!redis) {
        // Without Redis, use database fallback (less efficient but functional)
        return this.wasReminderSentDb(eventId, reminderType);
      }

      const key = `${REMINDER_CACHE_PREFIX}:${eventId}:${reminderType}`;
      const exists = await redis.exists(key);
      return exists === 1;
    } catch (error) {
      logger.error({ error, eventId, reminderType }, 'Error checking reminder status');
      return false;
    }
  }

  /**
   * Database fallback for checking reminder status
   */
  private async wasReminderSentDb(eventId: string, reminderType: '24h' | '1h'): Promise<boolean> {
    const setting = await prisma.systemSetting.findFirst({
      where: {
        key: `reminder_sent_${eventId}_${reminderType}`,
      },
    });
    return setting !== null;
  }

  /**
   * Marks a reminder as sent (using Redis with TTL)
   */
  private async markReminderSent(eventId: string, reminderType: '24h' | '1h'): Promise<void> {
    try {
      const redis = getRedis();
      if (!redis) {
        // Without Redis, use database fallback
        await this.markReminderSentDb(eventId, reminderType);
        return;
      }

      const key = `${REMINDER_CACHE_PREFIX}:${eventId}:${reminderType}`;
      // Set with TTL of 48 hours (reminders expire after event passes)
      await redis.setex(key, 48 * 60 * 60, '1');
    } catch (error) {
      logger.error({ error, eventId, reminderType }, 'Error marking reminder as sent');
    }
  }

  /**
   * Database fallback for marking reminder as sent
   */
  private async markReminderSentDb(eventId: string, reminderType: '24h' | '1h'): Promise<void> {
    await prisma.systemSetting.upsert({
      where: {
        key: `reminder_sent_${eventId}_${reminderType}`,
      },
      create: {
        key: `reminder_sent_${eventId}_${reminderType}`,
        value: { sent: true, timestamp: new Date().toISOString() },
        description: `Reminder sent marker for event ${eventId}`,
      },
      update: {
        value: { sent: true, timestamp: new Date().toISOString() },
      },
    });
  }

  /**
   * Manually triggers reminder check (useful for testing)
   */
  async triggerCheck(): Promise<void> {
    await this.checkAndSendReminders();
  }

  /**
   * Gets scheduler status
   */
  getStatus(): { isRunning: boolean; intervalMs: number } {
    return {
      isRunning: this.isRunning,
      intervalMs: CHECK_INTERVAL_MS,
    };
  }
}

// Export singleton instance
export const eventReminderScheduler = new EventReminderScheduler();
