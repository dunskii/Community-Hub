/**
 * Event Controller
 * Phase 8: Events & Calendar System
 * Handles HTTP requests for event operations
 */

import type { Request, Response } from 'express';
import { eventService } from '../services/event-service.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/api-error.js';

/**
 * Extracts IP address from request (handles array case)
 */
function getClientIP(req: Request): string | undefined {
  const ip = req.ip;
  if (Array.isArray(ip)) {
    return ip[0];
  }
  return ip;
}

/**
 * Sends success response
 */
function sendSuccess(
  res: Response,
  data: unknown,
  statusCode: number = 200,
  message?: string
): void {
  res.status(statusCode).json({
    success: true,
    data,
    ...(message && { message }),
  });
}

/**
 * Sends error response
 */
function sendError(
  res: Response,
  code: string,
  message: string,
  statusCode: number = 500
): void {
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
    },
  });
}

/**
 * Handles ApiError instances
 */
function handleError(res: Response, error: unknown, defaultCode: string): void {
  if (error instanceof ApiError) {
    sendError(res, error.code, error.message, error.statusCode);
  } else if (error instanceof Error) {
    sendError(res, defaultCode, error.message, 500);
  } else {
    sendError(res, defaultCode, 'An unexpected error occurred', 500);
  }
}

export class EventController {
  // ─── Event CRUD ─────────────────────────────────────────────

  /**
   * GET /events
   * List events with filtering and pagination
   */
  async listEvents(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const filters = {
        dateFrom: req.query.dateFrom as string | undefined,
        dateTo: req.query.dateTo as string | undefined,
        categoryId: req.query.categoryId as string | undefined,
        locationType: req.query.locationType as 'PHYSICAL' | 'ONLINE' | 'HYBRID' | undefined,
        distance: req.query.distance ? Number(req.query.distance) : undefined,
        latitude: req.query.latitude ? Number(req.query.latitude) : undefined,
        longitude: req.query.longitude ? Number(req.query.longitude) : undefined,
        includePast: req.query.includePast === 'true',
        freeOnly: req.query.freeOnly === 'true',
        linkedBusinessId: req.query.linkedBusinessId as string | undefined,
        createdById: req.query.createdById as string | undefined,
        status: req.query.status as 'PENDING' | 'ACTIVE' | 'CANCELLED' | 'PAST' | undefined,
        search: req.query.search as string | undefined,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Math.min(Number(req.query.limit), 50) : 20,
        sort: (req.query.sort as 'upcoming' | 'distance' | 'newest' | 'popular') || 'upcoming',
      };

      const result = await eventService.listEvents(filters, userId);
      sendSuccess(res, result);
    } catch (error) {
      logger.error({ error }, 'Failed to list events');
      handleError(res, error, 'LIST_EVENTS_FAILED');
    }
  }

  /**
   * GET /events/:id
   * Get single event details
   */
  async getEvent(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const userId = req.user?.id;

      const event = await eventService.getEvent(id, userId);
      sendSuccess(res, event);
    } catch (error) {
      logger.error({ error, eventId: req.params.id }, 'Failed to get event');
      handleError(res, error, 'GET_EVENT_FAILED');
    }
  }

  /**
   * GET /events/slug/:slug
   * Get event by slug
   */
  async getEventBySlug(req: Request, res: Response): Promise<void> {
    try {
      const slug = req.params.slug as string;
      const userId = req.user?.id;

      const event = await eventService.getEventBySlug(slug, userId);
      sendSuccess(res, event);
    } catch (error) {
      logger.error({ error, slug: req.params.slug }, 'Failed to get event by slug');
      handleError(res, error, 'GET_EVENT_FAILED');
    }
  }

  /**
   * POST /events
   * Create new event
   */
  async createEvent(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const data = req.body;

      const event = await eventService.createEvent(data, userId, {
        actorId: userId,
        actorRole: req.user!.role,
        ipAddress: getClientIP(req),
        userAgent: req.get('user-agent'),
      });

      sendSuccess(res, event, 201, 'Event created successfully and pending approval');
    } catch (error) {
      logger.error({ error, userId: req.user?.id }, 'Failed to create event');
      handleError(res, error, 'CREATE_EVENT_FAILED');
    }
  }

  /**
   * PUT /events/:id
   * Update existing event
   */
  async updateEvent(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const userId = req.user!.id;
      const data = req.body;

      const event = await eventService.updateEvent(id, data, userId, {
        actorId: userId,
        actorRole: req.user!.role,
        ipAddress: getClientIP(req),
        userAgent: req.get('user-agent'),
      });

      sendSuccess(res, event, 200, 'Event updated successfully');
    } catch (error) {
      logger.error({ error, eventId: req.params.id }, 'Failed to update event');
      handleError(res, error, 'UPDATE_EVENT_FAILED');
    }
  }

  /**
   * DELETE /events/:id
   * Delete (cancel) event
   */
  async deleteEvent(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const userId = req.user!.id;

      await eventService.deleteEvent(id, userId, {
        actorId: userId,
        actorRole: req.user!.role,
        ipAddress: getClientIP(req),
        userAgent: req.get('user-agent'),
      });

      sendSuccess(res, null, 200, 'Event cancelled successfully');
    } catch (error) {
      logger.error({ error, eventId: req.params.id }, 'Failed to delete event');
      handleError(res, error, 'DELETE_EVENT_FAILED');
    }
  }

  // ─── RSVP Operations ────────────────────────────────────────

  /**
   * POST /events/:id/rsvp
   * Create or update RSVP
   */
  async rsvpToEvent(req: Request, res: Response): Promise<void> {
    try {
      const eventId = req.params.id as string;
      const userId = req.user!.id;
      const data = req.body;

      const result = await eventService.rsvpToEvent(eventId, userId, data, {
        actorId: userId,
        actorRole: req.user!.role,
        ipAddress: getClientIP(req),
        userAgent: req.get('user-agent'),
      });

      sendSuccess(res, result, 200, 'RSVP confirmed');
    } catch (error) {
      logger.error({ error, eventId: req.params.id }, 'Failed to RSVP');
      handleError(res, error, 'RSVP_FAILED');
    }
  }

  /**
   * DELETE /events/:id/rsvp
   * Cancel RSVP
   */
  async cancelRSVP(req: Request, res: Response): Promise<void> {
    try {
      const eventId = req.params.id as string;
      const userId = req.user!.id;

      await eventService.cancelRSVP(eventId, userId, {
        actorId: userId,
        actorRole: req.user!.role,
        ipAddress: getClientIP(req),
        userAgent: req.get('user-agent'),
      });

      sendSuccess(res, null, 200, 'RSVP cancelled');
    } catch (error) {
      logger.error({ error, eventId: req.params.id }, 'Failed to cancel RSVP');
      handleError(res, error, 'CANCEL_RSVP_FAILED');
    }
  }

  /**
   * GET /events/:id/attendees
   * Get attendee list (owner only)
   */
  async getAttendees(req: Request, res: Response): Promise<void> {
    try {
      const eventId = req.params.id as string;
      const userId = req.user!.id;
      const filters = {
        status: req.query.status as 'GOING' | 'INTERESTED' | 'NOT_GOING' | undefined,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Math.min(Number(req.query.limit), 100) : 50,
      };

      const result = await eventService.getEventAttendees(eventId, userId, filters);
      sendSuccess(res, result);
    } catch (error) {
      logger.error({ error, eventId: req.params.id }, 'Failed to get attendees');
      handleError(res, error, 'GET_ATTENDEES_FAILED');
    }
  }

  // ─── Export ─────────────────────────────────────────────────

  /**
   * GET /events/:id/export
   * Export event to ICS format
   */
  async exportICS(req: Request, res: Response): Promise<void> {
    try {
      const eventId = req.params.id as string;

      const icsContent = await eventService.exportEventICS(eventId);

      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="event-${eventId}.ics"`
      );
      res.send(icsContent);
    } catch (error) {
      logger.error({ error, eventId: req.params.id }, 'Failed to export ICS');
      handleError(res, error, 'EXPORT_ICS_FAILED');
    }
  }

  // ─── Moderation ─────────────────────────────────────────────

  /**
   * POST /events/:id/approve
   * Approve pending event (moderator only)
   */
  async approveEvent(req: Request, res: Response): Promise<void> {
    try {
      const eventId = req.params.id as string;
      const moderatorId = req.user!.id;

      const event = await eventService.approveEvent(eventId, moderatorId, {
        actorId: moderatorId,
        actorRole: req.user!.role,
        ipAddress: getClientIP(req),
        userAgent: req.get('user-agent'),
      });

      sendSuccess(res, event, 200, 'Event approved');
    } catch (error) {
      logger.error({ error, eventId: req.params.id }, 'Failed to approve event');
      handleError(res, error, 'APPROVE_EVENT_FAILED');
    }
  }

  // ─── User's Events ──────────────────────────────────────────

  /**
   * GET /users/:id/events
   * Get events created by user
   */
  async getUserEvents(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.id as string;
      const currentUserId = req.user?.id;
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Math.min(Number(req.query.limit), 50) : 20;

      const result = await eventService.listEvents(
        {
          createdById: userId,
          includePast: true,
          freeOnly: false,
          page,
          limit,
          sort: 'newest',
        },
        currentUserId
      );

      sendSuccess(res, result);
    } catch (error) {
      logger.error({ error, userId: req.params.id }, 'Failed to get user events');
      handleError(res, error, 'GET_USER_EVENTS_FAILED');
    }
  }

  /**
   * GET /users/:id/rsvps
   * Get events user has RSVP'd to
   */
  async getUserRSVPs(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.id as string;
      const currentUserId = req.user?.id;

      // Only allow users to view their own RSVPs
      if (userId !== currentUserId) {
        sendError(res, 'FORBIDDEN', 'You can only view your own RSVPs', 403);
        return;
      }

      const options = {
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Math.min(Number(req.query.limit), 50) : 20,
        status: req.query.status as 'GOING' | 'INTERESTED' | 'NOT_GOING' | undefined,
        includePast: req.query.includePast === 'true',
      };

      const result = await eventService.getUserRSVPs(userId, options);
      sendSuccess(res, result);
    } catch (error) {
      logger.error({ error, userId: req.params.id }, 'Failed to get user RSVPs');
      handleError(res, error, 'GET_USER_RSVPS_FAILED');
    }
  }
}

// Export singleton instance
export const eventController = new EventController();
