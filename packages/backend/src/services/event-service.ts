/**
 * Event Service — Backward-Compatibility Shim
 * Phase 8: Events & Calendar System
 *
 * Re-exports everything from the decomposed events/ module so that
 * existing consumers (controller, RSVP service, tests, schedulers)
 * continue to work without import-path changes.
 */

export {
  eventService,
  EventService,
} from './events/index.js';

export type {
  EventWithDetails,
  PaginatedEvents,
  AttendeeInfo,
  PaginatedAttendees,
  AuditContext,
  PaginationOptions,
} from './events/index.js';
