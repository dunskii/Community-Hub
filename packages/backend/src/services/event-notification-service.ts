/**
 * Event Notification Service
 * Phase 8: Events & Calendar System
 * Spec §15: Events & Calendar
 *
 * Handles email notifications for event-related activities.
 */

import { prisma } from '../db/index.js';
import { logger } from '../utils/logger.js';
import { EmailService } from '../email/email-service.js';
import { RSVPStatus } from '../generated/prisma/index.js';
import type { LanguageCode } from '../email/template-types.js';

// Create email service instance
const emailService = new EmailService();

// ─── Types ────────────────────────────────────────────────────

export interface EventNotificationData {
  eventId: string;
  eventTitle: string;
  eventStartTime: Date;
  eventEndTime: Date;
  locationType: string;
  venue?: {
    name?: string;
    street: string;
    suburb: string;
    state: string;
    postcode: string;
  } | null;
  onlineUrl?: string | null;
  organizerName: string;
}

// ─── Service ──────────────────────────────────────────────────

export class EventNotificationService {
  /**
   * Sends cancellation emails to all RSVPs for an event
   */
  async sendCancellationNotifications(eventData: EventNotificationData): Promise<void> {
    try {
      // Get all RSVPs with GOING or INTERESTED status
      const rsvps = await prisma.event_rsvps.findMany({
        where: {
          event_id: eventData.eventId,
          status: {
            in: [RSVPStatus.GOING, RSVPStatus.INTERESTED],
          },
        },
        include: {
          users: {
            select: {
              id: true,
              email: true,
              display_name: true,
              language_preference: true,
            },
          },
        },
      });

      if (rsvps.length === 0) {
        logger.info({ eventId: eventData.eventId }, 'No RSVPs to notify for event cancellation');
        return;
      }

      logger.info(
        { eventId: eventData.eventId, rsvpCount: rsvps.length },
        'Sending event cancellation notifications'
      );

      // Send emails in batches to avoid overwhelming the email service
      const batchSize = 10;
      for (let i = 0; i < rsvps.length; i += batchSize) {
        const batch = rsvps.slice(i, i + batchSize);

        await Promise.all(
          batch.map((rsvp) =>
            this.sendCancellationEmail(
              {
                id: rsvp.users.id,
                email: rsvp.users.email,
                displayName: rsvp.users.display_name,
                languagePreference: rsvp.users.language_preference,
              },
              eventData,
              rsvp.status
            )
          )
        );
      }

      logger.info(
        { eventId: eventData.eventId, emailsSent: rsvps.length },
        'Event cancellation notifications sent'
      );
    } catch (error) {
      logger.error(
        { error, eventId: eventData.eventId },
        'Failed to send event cancellation notifications'
      );
      // Don't throw - notification failure shouldn't block event cancellation
    }
  }

  /**
   * Sends a cancellation email to a single user
   */
  private async sendCancellationEmail(
    user: {
      id: string;
      email: string;
      displayName: string;
      languagePreference: string | null;
    },
    eventData: EventNotificationData,
    rsvpStatus: RSVPStatus
  ): Promise<void> {
    const language = user.languagePreference || 'en';

    // Format the event date/time
    const dateFormatter = new Intl.DateTimeFormat(language, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const timeFormatter = new Intl.DateTimeFormat(language, {
      hour: 'numeric',
      minute: '2-digit',
    });

    const eventDate = dateFormatter.format(eventData.eventStartTime);
    const eventTime = `${timeFormatter.format(eventData.eventStartTime)} - ${timeFormatter.format(eventData.eventEndTime)}`;

    // Build location string
    let location = '';
    if (eventData.locationType === 'PHYSICAL' && eventData.venue) {
      location = eventData.venue.name
        ? `${eventData.venue.name}, ${eventData.venue.street}, ${eventData.venue.suburb}`
        : `${eventData.venue.street}, ${eventData.venue.suburb}`;
    } else if (eventData.locationType === 'ONLINE') {
      location = 'Online Event';
    } else if (eventData.locationType === 'HYBRID' && eventData.venue) {
      location = `${eventData.venue.name || eventData.venue.street}, ${eventData.venue.suburb} (Hybrid)`;
    }

    try {
      await emailService.sendTemplatedEmail(
        'event_cancellation',
        user.email,
        {
          userName: user.displayName,
          eventTitle: eventData.eventTitle,
          eventDate,
          eventTime,
          eventLocation: location,
          organizerName: eventData.organizerName,
          rsvpStatus: rsvpStatus === RSVPStatus.GOING ? 'going' : 'interested',
        },
        language as LanguageCode
      );
    } catch (error) {
      logger.error(
        { error, userId: user.id, eventId: eventData.eventId },
        'Failed to send cancellation email to user'
      );
      // Don't throw - continue with other users
    }
  }

  /**
   * Sends a reminder email to users who have RSVP'd
   */
  async sendEventReminders(
    eventData: EventNotificationData,
    reminderType: '24h' | '1h'
  ): Promise<void> {
    try {
      // Get all RSVPs with GOING status
      const rsvps = await prisma.event_rsvps.findMany({
        where: {
          event_id: eventData.eventId,
          status: RSVPStatus.GOING,
        },
        include: {
          users: {
            select: {
              id: true,
              email: true,
              display_name: true,
              language_preference: true,
            },
          },
        },
      });

      if (rsvps.length === 0) {
        return;
      }

      logger.info(
        { eventId: eventData.eventId, rsvpCount: rsvps.length, reminderType },
        'Sending event reminders'
      );

      // Send emails in batches
      const batchSize = 10;
      for (let i = 0; i < rsvps.length; i += batchSize) {
        const batch = rsvps.slice(i, i + batchSize);

        await Promise.all(
          batch.map((rsvp) =>
            this.sendReminderEmail(
              {
                id: rsvp.users.id,
                email: rsvp.users.email,
                displayName: rsvp.users.display_name,
                languagePreference: rsvp.users.language_preference,
              },
              eventData,
              reminderType
            )
          )
        );
      }

      logger.info(
        { eventId: eventData.eventId, emailsSent: rsvps.length },
        'Event reminders sent'
      );
    } catch (error) {
      logger.error(
        { error, eventId: eventData.eventId },
        'Failed to send event reminders'
      );
    }
  }

  /**
   * Sends a reminder email to a single user
   */
  private async sendReminderEmail(
    user: {
      id: string;
      email: string;
      displayName: string;
      languagePreference: string | null;
    },
    eventData: EventNotificationData,
    reminderType: '24h' | '1h'
  ): Promise<void> {
    const language = user.languagePreference || 'en';

    // Format the event date/time
    const dateFormatter = new Intl.DateTimeFormat(language, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const timeFormatter = new Intl.DateTimeFormat(language, {
      hour: 'numeric',
      minute: '2-digit',
    });

    const eventDate = dateFormatter.format(eventData.eventStartTime);
    const eventTime = `${timeFormatter.format(eventData.eventStartTime)} - ${timeFormatter.format(eventData.eventEndTime)}`;

    // Build location string
    let location = '';
    if (eventData.locationType === 'PHYSICAL' && eventData.venue) {
      location = eventData.venue.name
        ? `${eventData.venue.name}, ${eventData.venue.street}, ${eventData.venue.suburb}`
        : `${eventData.venue.street}, ${eventData.venue.suburb}`;
    } else if (eventData.locationType === 'ONLINE' && eventData.onlineUrl) {
      location = eventData.onlineUrl;
    } else if (eventData.locationType === 'HYBRID' && eventData.venue) {
      location = `${eventData.venue.name || eventData.venue.street}, ${eventData.venue.suburb}`;
    }

    try {
      const templateKey = reminderType === '24h' ? 'event_reminder_24h' : 'event_reminder_1h';
      await emailService.sendTemplatedEmail(
        templateKey,
        user.email,
        {
          userName: user.displayName,
          eventTitle: eventData.eventTitle,
          eventDate,
          eventTime,
          eventLocation: location,
          onlineUrl: eventData.onlineUrl || '',
          organizerName: eventData.organizerName,
        },
        language as LanguageCode
      );
    } catch (error) {
      logger.error(
        { error, userId: user.id, eventId: eventData.eventId },
        'Failed to send reminder email to user'
      );
    }
  }

  /**
   * Sends notification when event details are updated
   */
  async sendEventUpdateNotification(
    eventData: EventNotificationData,
    changes: string[]
  ): Promise<void> {
    try {
      // Get all RSVPs with GOING or INTERESTED status
      const rsvps = await prisma.event_rsvps.findMany({
        where: {
          event_id: eventData.eventId,
          status: {
            in: [RSVPStatus.GOING, RSVPStatus.INTERESTED],
          },
        },
        include: {
          users: {
            select: {
              id: true,
              email: true,
              display_name: true,
              language_preference: true,
            },
          },
        },
      });

      if (rsvps.length === 0) {
        return;
      }

      logger.info(
        { eventId: eventData.eventId, rsvpCount: rsvps.length, changes },
        'Sending event update notifications'
      );

      // Send emails in batches
      const batchSize = 10;
      for (let i = 0; i < rsvps.length; i += batchSize) {
        const batch = rsvps.slice(i, i + batchSize);

        await Promise.all(
          batch.map((rsvp) =>
            this.sendUpdateEmail(
              {
                id: rsvp.users.id,
                email: rsvp.users.email,
                displayName: rsvp.users.display_name,
                languagePreference: rsvp.users.language_preference,
              },
              eventData,
              changes
            )
          )
        );
      }

      logger.info(
        { eventId: eventData.eventId, emailsSent: rsvps.length },
        'Event update notifications sent'
      );
    } catch (error) {
      logger.error(
        { error, eventId: eventData.eventId },
        'Failed to send event update notifications'
      );
    }
  }

  /**
   * Sends an update email to a single user
   */
  private async sendUpdateEmail(
    user: {
      id: string;
      email: string;
      displayName: string;
      languagePreference: string | null;
    },
    eventData: EventNotificationData,
    changes: string[]
  ): Promise<void> {
    const language = user.languagePreference || 'en';

    // Format the event date/time
    const dateFormatter = new Intl.DateTimeFormat(language, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const timeFormatter = new Intl.DateTimeFormat(language, {
      hour: 'numeric',
      minute: '2-digit',
    });

    const eventDate = dateFormatter.format(eventData.eventStartTime);
    const eventTime = `${timeFormatter.format(eventData.eventStartTime)} - ${timeFormatter.format(eventData.eventEndTime)}`;

    try {
      await emailService.sendTemplatedEmail(
        'event_update',
        user.email,
        {
          userName: user.displayName,
          eventTitle: eventData.eventTitle,
          eventDate,
          eventTime,
          organizerName: eventData.organizerName,
          changes: changes.join(', '),
        },
        language as LanguageCode
      );
    } catch (error) {
      logger.error(
        { error, userId: user.id, eventId: eventData.eventId },
        'Failed to send update email to user'
      );
    }
  }
}

// Export singleton instance
export const eventNotificationService = new EventNotificationService();
