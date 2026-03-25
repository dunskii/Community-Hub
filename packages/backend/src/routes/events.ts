/**
 * Event Routes
 * Phase 8: Events & Calendar System
 * RESTful API endpoints for event operations
 */

import { Router } from 'express';
import { eventController } from '../controllers/event-controller.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, optionalAuth } from '../middleware/auth-middleware.js';
import { requireRole } from '../middleware/rbac-middleware.js';
import {
  createEventLimiter,
  updateEventLimiter,
  rsvpLimiter,
  listEventsLimiter,
  getEventLimiter,
  exportICSLimiter,
} from '../middleware/event-rate-limiter.js';
import {
  eventCreateSchema,
  eventUpdateSchema,
  eventRSVPSchema,
} from '@community-hub/shared';

const router: ReturnType<typeof Router> = Router();

// ─── Public Routes ────────────────────────────────────────────────

/**
 * GET /events
 * List events with filtering
 * Public access (optional auth for RSVP status)
 * Query params: ?dateFrom=&dateTo=&categoryId=&locationType=&page=1&limit=20&sort=upcoming
 */
router.get(
  '/',
  optionalAuth,
  listEventsLimiter,
  eventController.listEvents.bind(eventController)
);

/**
 * GET /events/:id
 * Get single event details
 * Public access (optional auth for RSVP status)
 */
router.get(
  '/:id',
  optionalAuth,
  getEventLimiter,
  eventController.getEvent.bind(eventController)
);

/**
 * GET /events/slug/:slug
 * Get event by slug
 * Public access (optional auth for RSVP status)
 */
router.get(
  '/slug/:slug',
  optionalAuth,
  getEventLimiter,
  eventController.getEventBySlug.bind(eventController)
);

/**
 * GET /events/:id/export
 * Export event to ICS format
 * Public access
 */
router.get(
  '/:id/export',
  exportICSLimiter,
  eventController.exportICS.bind(eventController)
);

// ─── Protected Routes (Authenticated Users) ───────────────────────

/**
 * POST /events
 * Create new event
 * User auth required
 * Rate limit: 5 per minute
 */
router.post(
  '/',
  requireAuth,
  createEventLimiter,
  validate({ body: eventCreateSchema }),
  eventController.createEvent.bind(eventController)
);

/**
 * PUT /events/:id
 * Update event
 * User auth required (owner only - checked in controller)
 * Rate limit: 10 per minute
 */
router.put(
  '/:id',
  requireAuth,
  updateEventLimiter,
  validate({ body: eventUpdateSchema }),
  eventController.updateEvent.bind(eventController)
);

/**
 * DELETE /events/:id
 * Delete (cancel) event
 * User auth required (owner only - checked in controller)
 */
router.delete(
  '/:id',
  requireAuth,
  eventController.deleteEvent.bind(eventController)
);

/**
 * POST /events/:id/rsvp
 * Create or update RSVP
 * User auth required
 * Rate limit: 20 per minute
 */
router.post(
  '/:id/rsvp',
  requireAuth,
  rsvpLimiter,
  validate({ body: eventRSVPSchema }),
  eventController.rsvpToEvent.bind(eventController)
);

/**
 * DELETE /events/:id/rsvp
 * Cancel RSVP
 * User auth required
 * Rate limit: 20 per minute
 */
router.delete(
  '/:id/rsvp',
  requireAuth,
  rsvpLimiter,
  eventController.cancelRSVP.bind(eventController)
);

/**
 * GET /events/:id/attendees
 * Get attendee list
 * User auth required (owner only - checked in controller)
 */
router.get(
  '/:id/attendees',
  requireAuth,
  eventController.getAttendees.bind(eventController)
);

// ─── Moderator Routes ─────────────────────────────────────────────

/**
 * POST /events/:id/approve
 * Approve pending event
 * Moderator or Admin auth required
 */
router.post(
  '/:id/approve',
  requireAuth,
  requireRole(['MODERATOR', 'CURATOR', 'ADMIN', 'SUPER_ADMIN']),
  eventController.approveEvent.bind(eventController)
);

export { router as eventRouter };
