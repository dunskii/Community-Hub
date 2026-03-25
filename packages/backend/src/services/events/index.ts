/**
 * Events Module Barrel Export
 * Phase 8: Events & Calendar System
 *
 * Re-exports the event service singleton and all public types.
 */

// Singleton
export { eventService, EventService } from './event-service.js';

// Types & interfaces
export type {
  EventWithDetails,
  PaginatedEvents,
  AttendeeInfo,
  PaginatedAttendees,
  AuditContext,
  PaginationOptions,
} from './event-types.js';

// Constants (for consumers that need them)
export { CACHE_PREFIX, EVENT_DETAIL_INCLUDE, EVENT_DETAIL_INCLUDE_NO_RSVPS } from './event-types.js';
