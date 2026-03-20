/**
 * Event Export Service
 * Phase 8: Events & Calendar System
 * Spec §15: Events & Calendar
 *
 * Handles ICS export for events.
 */

import { prisma } from '../db/index.js';
import { ApiError } from '../utils/api-error.js';
import { EventStatus } from '../generated/prisma/index.js';
import type { VenueInput, RecurrenceRuleInput } from '@community-hub/shared';

// ─── Service ──────────────────────────────────────────────────

export class EventExportService {
  /**
   * Exports an event to ICS format
   */
  async exportEventICS(eventId: string): Promise<string> {
    const event = await prisma.events.findUnique({
      where: { id: eventId },
      include: {
        categories: true,
        businesses: {
          select: { name: true },
        },
        users: {
          select: { display_name: true },
        },
      },
    });

    if (!event) {
      throw ApiError.notFound('EVENT_NOT_FOUND', 'Event not found');
    }

    if (event.status !== EventStatus.ACTIVE) {
      throw ApiError.badRequest(
        'EVENT_NOT_ACTIVE',
        'Cannot export an event that is not active'
      );
    }

    return this.generateICS(event);
  }

  /**
   * Generates ICS content for an event
   */
  private generateICS(event: Record<string, unknown>): string {
    const formatDate = (date: Date): string => {
      return date
        .toISOString()
        .replace(/[-:]/g, '')
        .replace(/\.\d{3}/, '');
    };

    const escapeText = (text: string): string => {
      return text
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n');
    };

    const lines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Community Hub//Events//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${event.id}@communityhub.local`,
      `DTSTAMP:${formatDate(new Date())}`,
      `DTSTART:${formatDate(event.start_time as Date)}`,
      `DTEND:${formatDate(event.end_time as Date)}`,
      `SUMMARY:${escapeText(event.title as string)}`,
      `DESCRIPTION:${escapeText(event.description as string)}`,
    ];

    // Add location
    const locationType = event.location_type as string;
    const venue = event.venue as VenueInput | null;
    const onlineUrl = event.online_url as string | null;

    if (locationType === 'PHYSICAL' && venue) {
      const location = `${venue.street}, ${venue.suburb}, ${venue.state} ${venue.postcode}`;
      lines.push(`LOCATION:${escapeText(location)}`);
      if (venue.latitude && venue.longitude) {
        lines.push(`GEO:${venue.latitude};${venue.longitude}`);
      }
    } else if (locationType === 'ONLINE' && onlineUrl) {
      lines.push(`URL:${onlineUrl}`);
      lines.push(`LOCATION:Online Event`);
    } else if (locationType === 'HYBRID') {
      if (venue) {
        const location = `${venue.street}, ${venue.suburb}, ${venue.state} ${venue.postcode}`;
        lines.push(`LOCATION:${escapeText(location)} (Hybrid - also online)`);
      }
      if (onlineUrl) {
        lines.push(`URL:${onlineUrl}`);
      }
    }

    // Add organizer
    const createdBy = event.users as { display_name: string };
    lines.push(`ORGANIZER;CN=${escapeText(createdBy.display_name)}:MAILTO:noreply@communityhub.local`);

    // Add recurrence rule if present
    const recurrence = event.recurrence as RecurrenceRuleInput | null;
    if (recurrence && recurrence.frequency !== 'NONE') {
      let rrule = `RRULE:FREQ=${recurrence.frequency}`;
      if (recurrence.interval && recurrence.interval > 1) {
        rrule += `;INTERVAL=${recurrence.interval}`;
      }
      if (recurrence.daysOfWeek && recurrence.daysOfWeek.length > 0) {
        const days = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
        const byDay = recurrence.daysOfWeek.map((d: number) => days[d]).join(',');
        rrule += `;BYDAY=${byDay}`;
      }
      if (recurrence.endDate) {
        rrule += `;UNTIL=${formatDate(new Date(recurrence.endDate))}`;
      }
      lines.push(rrule);
    }

    lines.push('END:VEVENT');
    lines.push('END:VCALENDAR');

    return lines.join('\r\n');
  }
}

// Export singleton instance
export const eventExportService = new EventExportService();
