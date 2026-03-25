/**
 * Event Service (Facade)
 * Phase 8: Events & Calendar System
 * Spec §15: Events & Calendar
 *
 * Thin facade that delegates to focused sub-services while
 * maintaining the original public API surface.
 *
 * RSVP operations are in event-rsvp-service.ts
 * ICS export is in event-export-service.ts
 * Email notifications are in event-notification-service.ts
 */

import { eventRSVPService } from '../event-rsvp-service.js';
import { eventExportService } from '../event-export-service.js';
import type {
  EventCreateInput,
  EventUpdateInput,
  EventRSVPInput,
  EventFilterInput,
  AttendeeFilterInput,
} from '@community-hub/shared';
import { RSVPStatus } from '../../generated/prisma/index.js';
import type { AuditContext, EventWithDetails, PaginatedEvents } from './event-types.js';
import { EventQueryService } from './event-query-service.js';
import { EventCrudService } from './event-crud-service.js';
import { EventModerationService } from './event-moderation-service.js';

// ─── Service ──────────────────────────────────────────────────

export class EventService {
  private readonly queryService = new EventQueryService();
  private readonly crudService = new EventCrudService();
  private readonly moderationService = new EventModerationService();

  // ─── Event CRUD ─────────────────────────────────────────────

  async createEvent(
    data: EventCreateInput,
    userId: string,
    auditContext: AuditContext
  ): Promise<EventWithDetails> {
    return this.crudService.createEvent(data, userId, auditContext);
  }

  async updateEvent(
    eventId: string,
    data: EventUpdateInput,
    userId: string,
    auditContext: AuditContext
  ): Promise<EventWithDetails> {
    return this.crudService.updateEvent(eventId, data, userId, auditContext);
  }

  async deleteEvent(
    eventId: string,
    userId: string,
    auditContext: AuditContext
  ): Promise<void> {
    return this.crudService.deleteEvent(eventId, userId, auditContext);
  }

  // ─── Event Queries ──────────────────────────────────────────

  async getEvent(eventId: string, userId?: string, userRole?: string): Promise<EventWithDetails> {
    return this.queryService.getEvent(eventId, userId, userRole);
  }

  async getEventBySlug(slug: string, userId?: string, userRole?: string): Promise<EventWithDetails> {
    return this.queryService.getEventBySlug(slug, userId, userRole);
  }

  async listEvents(
    filters: EventFilterInput,
    userId?: string
  ): Promise<PaginatedEvents> {
    return this.queryService.listEvents(filters, userId);
  }

  // ─── RSVP Operations (delegated) ───────────────────────────

  async rsvpToEvent(
    eventId: string,
    userId: string,
    data: EventRSVPInput,
    auditContext: AuditContext
  ) {
    return eventRSVPService.rsvpToEvent(
      eventId,
      userId,
      data,
      auditContext,
      this.getEvent.bind(this)
    );
  }

  async cancelRSVP(eventId: string, userId: string, auditContext: AuditContext) {
    return eventRSVPService.cancelRSVP(eventId, userId, auditContext);
  }

  async getEventAttendees(eventId: string, userId: string, filters: AttendeeFilterInput) {
    return eventRSVPService.getEventAttendees(eventId, userId, filters);
  }

  async getUserRSVPs(
    userId: string,
    options: { page: number; limit: number; status?: RSVPStatus; includePast?: boolean }
  ) {
    return eventRSVPService.getUserRSVPs(userId, options);
  }

  // ─── ICS Export (delegated) ────────────────────────────────

  async exportEventICS(eventId: string) {
    return eventExportService.exportEventICS(eventId);
  }

  // ─── Status Management ──────────────────────────────────────

  async approveEvent(
    eventId: string,
    moderatorId: string,
    auditContext: AuditContext
  ): Promise<EventWithDetails> {
    return this.moderationService.approveEvent(eventId, moderatorId, auditContext);
  }

  async updatePastEventsStatus(): Promise<number> {
    return this.moderationService.updatePastEventsStatus();
  }
}

// Export singleton instance
export const eventService = new EventService();
