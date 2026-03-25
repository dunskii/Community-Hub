/**
 * Event Query Service
 * Phase 8: Events & Calendar System
 *
 * Read operations: getEvent, getEventBySlug, listEvents.
 */

import { prisma } from '../../db/index.js';
import { ApiError } from '../../utils/api-error.js';
import { EventStatus, RSVPStatus } from '../../generated/prisma/index.js';
import type { EventFilterInput } from '@community-hub/shared';
import type { EventWithDetails, PaginatedEvents } from './event-types.js';
import { EVENT_DETAIL_INCLUDE } from './event-types.js';
import { formatEventWithDetails } from './event-helpers.js';

// ─── Service ──────────────────────────────────────────────────

export class EventQueryService {
  /**
   * Checks visibility rules and loads the user's RSVP for a raw event record.
   * Shared post-processing for getEvent and getEventBySlug.
   */
  private async applyVisibilityAndRSVP(
    event: Record<string, unknown> | null,
    userId?: string,
    userRole?: string
  ): Promise<EventWithDetails> {
    if (!event) {
      throw ApiError.notFound('EVENT_NOT_FOUND', 'Event not found');
    }

    // Only show active events publicly (or pending to owner/admin)
    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
    if (event.status !== EventStatus.ACTIVE && event.created_by_id !== userId && !isAdmin) {
      throw ApiError.notFound('EVENT_NOT_FOUND', 'Event not found');
    }

    // Get user's RSVP if logged in
    let userRSVP = null;
    if (userId) {
      const rsvp = await prisma.event_rsvps.findUnique({
        where: {
          event_id_user_id: {
            event_id: event.id as string,
            user_id: userId,
          },
        },
      });
      if (rsvp) {
        userRSVP = {
          status: rsvp.status,
          guestCount: rsvp.guest_count,
        };
      }
    }

    return formatEventWithDetails(event, userRSVP);
  }

  /**
   * Gets a single event by ID
   */
  async getEvent(eventId: string, userId?: string, userRole?: string): Promise<EventWithDetails> {
    const event = await prisma.events.findUnique({
      where: { id: eventId },
      include: EVENT_DETAIL_INCLUDE,
    });

    return this.applyVisibilityAndRSVP(event, userId, userRole);
  }

  /**
   * Gets a single event by slug
   */
  async getEventBySlug(slug: string, userId?: string, userRole?: string): Promise<EventWithDetails> {
    const event = await prisma.events.findFirst({
      where: { slug },
      include: EVENT_DETAIL_INCLUDE,
    });

    return this.applyVisibilityAndRSVP(event, userId, userRole);
  }

  /**
   * Lists events with filtering and pagination
   */
  async listEvents(
    filters: EventFilterInput,
    userId?: string
  ): Promise<PaginatedEvents> {
    const { page, limit, sort, ...filterOptions } = filters;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};

    // Status filter (default to ACTIVE for public)
    if (filterOptions.status) {
      where.status = filterOptions.status;
    } else if (!filterOptions.includePast) {
      where.status = EventStatus.ACTIVE;
      where.end_time = { gte: new Date() };
    } else {
      where.status = { in: [EventStatus.ACTIVE, EventStatus.PAST] };
    }

    // Date range filter
    if (filterOptions.dateFrom) {
      where.start_time = {
        ...(where.start_time as object || {}),
        gte: new Date(filterOptions.dateFrom),
      };
    }
    if (filterOptions.dateTo) {
      where.end_time = {
        ...(where.end_time as object || {}),
        lte: new Date(filterOptions.dateTo),
      };
    }

    // Category filter
    if (filterOptions.categoryId) {
      where.category_id = filterOptions.categoryId;
    }

    // Location type filter
    if (filterOptions.locationType) {
      where.location_type = filterOptions.locationType;
    }

    // Linked business filter
    if (filterOptions.linkedBusinessId) {
      where.linked_business_id = filterOptions.linkedBusinessId;
    }

    // Created by filter
    if (filterOptions.createdById) {
      where.created_by_id = filterOptions.createdById;
    }

    // Free events filter
    if (filterOptions.freeOnly) {
      where.OR = [
        { cost: null },
        { cost: '' },
        { cost: { contains: 'free', mode: 'insensitive' } },
        { cost: { contains: 'Free', mode: 'insensitive' } },
        { cost: '$0' },
      ];
    }

    // Search filter
    if (filterOptions.search) {
      const searchTerm = filterOptions.search.trim();
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    // Build orderBy
    let orderBy: Record<string, string>[] = [];
    switch (sort) {
      case 'upcoming':
        orderBy = [{ start_time: 'asc' }];
        break;
      case 'newest':
        orderBy = [{ created_at: 'desc' }];
        break;
      case 'popular':
        // Will be handled differently - by RSVP count
        orderBy = [{ start_time: 'asc' }];
        break;
      default:
        orderBy = [{ start_time: 'asc' }];
    }

    // Execute query
    const [events, total] = await Promise.all([
      prisma.events.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: EVENT_DETAIL_INCLUDE,
      }),
      prisma.events.count({ where }),
    ]);

    // Get user RSVPs if logged in
    let userRsvps: Map<string, { status: RSVPStatus; guestCount: number }> = new Map();
    if (userId && events.length > 0) {
      const rsvps = await prisma.event_rsvps.findMany({
        where: {
          user_id: userId,
          event_id: { in: events.map((e: Record<string, unknown>) => e.id as string) },
        },
      });
      userRsvps = new Map(
        rsvps.map((r) => [r.event_id, { status: r.status, guestCount: r.guest_count }])
      );
    }

    // Format events
    const formattedEvents = events.map((event: Record<string, unknown>) =>
      formatEventWithDetails(event, userRsvps.get(event.id as string) || null)
    );

    // Sort by popularity if needed
    if (sort === 'popular') {
      formattedEvents.sort((a, b) => b.rsvpCount.total - a.rsvpCount.total);
    }

    return {
      events: formattedEvents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + events.length < total,
      },
    };
  }
}
