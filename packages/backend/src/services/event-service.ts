/**
 * Event Service
 * Phase 8: Events & Calendar System
 * Spec §15: Events & Calendar
 *
 * Handles CRUD operations for events, RSVP management, and ICS export.
 */

import { getPlatformConfig } from '../config/platform-loader.js';
import { prisma } from '../db/index.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/api-error.js';
import { getRedis } from '../cache/redis-client.js';
import type {
  EventCreateInput,
  EventUpdateInput,
  EventRSVPInput,
  EventFilterInput,
  AttendeeFilterInput,
  VenueInput,
  RecurrenceRuleInput,
} from '@community-hub/shared';
import {
  EventStatus,
  LocationType,
  RSVPStatus,
  CategoryType,
} from '../generated/prisma/index.js';

// ─── Types ────────────────────────────────────────────────────

export interface AuditContext {
  actorId: string;
  actorRole: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface EventWithDetails {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  category: {
    id: string;
    name: Record<string, string>;
    slug: string;
    icon: string;
  };
  startTime: Date;
  endTime: Date;
  timezone: string;
  locationType: LocationType;
  venue: VenueInput | null;
  onlineUrl: string | null;
  linkedBusinessId: string | null;
  linkedBusiness: {
    id: string;
    name: string;
    slug: string;
  } | null;
  imageUrl: string | null;
  ticketUrl: string | null;
  cost: string | null;
  capacity: number | null;
  ageRestriction: string | null;
  accessibility: string[];
  recurrence: RecurrenceRuleInput | null;
  createdById: string;
  createdBy: {
    id: string;
    displayName: string;
    profilePhoto: string | null;
  };
  status: EventStatus;
  slug: string | null;
  createdAt: Date;
  updatedAt: Date;
  rsvpCount: {
    going: number;
    interested: number;
    total: number;
  };
  userRSVP?: {
    status: RSVPStatus;
    guestCount: number;
  } | null;
  spotsRemaining: number | null;
}

export interface PaginatedEvents {
  events: EventWithDetails[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface AttendeeInfo {
  id: string;
  userId: string;
  user: {
    id: string;
    displayName: string;
    profilePhoto: string | null;
    email?: string; // Only visible to event owner
  };
  status: RSVPStatus;
  guestCount: number;
  notes: string | null;
  rsvpDate: Date;
}

export interface PaginatedAttendees {
  attendees: AttendeeInfo[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
  summary: {
    going: number;
    interested: number;
    notGoing: number;
    totalGuests: number;
  };
}

// ─── Cache Keys ───────────────────────────────────────────────

const CACHE_PREFIX = 'events';
// const CACHE_TTL = 300; // 5 minutes - reserved for future use

function getCacheKey(type: string, ...args: string[]): string {
  return `${CACHE_PREFIX}:${type}:${args.join(':')}`;
}

// ─── Service ──────────────────────────────────────────────────

export class EventService {
  // ─── Event CRUD ─────────────────────────────────────────────

  /**
   * Creates a new event with PENDING status
   */
  async createEvent(
    data: EventCreateInput,
    userId: string,
    auditContext: AuditContext
  ): Promise<EventWithDetails> {
    const config = getPlatformConfig();

    // Check if events feature is enabled
    if (!config.features.eventsCalendar) {
      throw ApiError.forbidden('EVENTS_DISABLED', 'Events feature is not enabled');
    }

    // Validate category exists and is of type EVENT
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      throw ApiError.notFound('CATEGORY_NOT_FOUND', 'Category not found');
    }

    if (category.type !== CategoryType.EVENT) {
      throw ApiError.badRequest(
        'INVALID_CATEGORY_TYPE',
        'Category must be of type EVENT'
      );
    }

    // Validate linked business if provided
    if (data.linkedBusinessId) {
      const business = await prisma.business.findUnique({
        where: { id: data.linkedBusinessId },
      });

      if (!business) {
        throw ApiError.notFound('BUSINESS_NOT_FOUND', 'Linked business not found');
      }

      // Check if user is the business owner
      if (business.claimedBy !== userId) {
        throw ApiError.forbidden(
          'NOT_BUSINESS_OWNER',
          'You must be the business owner to link events'
        );
      }
    }

    // Generate slug
    const slug = await this.generateSlug(data.title);

    // Create event
    const event = await prisma.event.create({
      data: {
        title: data.title,
        description: data.description,
        categoryId: data.categoryId,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        timezone: data.timezone || config.location.timezone,
        locationType: data.locationType as LocationType,
        venue: data.venue as object | undefined,
        onlineUrl: data.onlineUrl,
        linkedBusinessId: data.linkedBusinessId,
        imageUrl: data.imageUrl,
        ticketUrl: data.ticketUrl,
        cost: data.cost,
        capacity: data.capacity,
        ageRestriction: data.ageRestriction,
        accessibility: data.accessibility || [],
        recurrence: data.recurrence as object | undefined,
        createdById: userId,
        status: EventStatus.PENDING,
        slug,
      },
      include: {
        category: true,
        linkedBusiness: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            displayName: true,
            profilePhoto: true,
          },
        },
        _count: {
          select: {
            rsvps: true,
          },
        },
      },
    });

    // Log audit
    await this.logAudit('event.create', event.id, null, event, auditContext);

    logger.info({ eventId: event.id, userId }, 'Event created');

    // Invalidate cache
    await this.invalidateCache();

    return this.formatEventWithDetails(event, null);
  }

  /**
   * Updates an existing event
   */
  async updateEvent(
    eventId: string,
    data: EventUpdateInput,
    userId: string,
    auditContext: AuditContext
  ): Promise<EventWithDetails> {
    // Get existing event
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: {
            rsvps: {
              where: { status: RSVPStatus.GOING },
            },
          },
        },
      },
    });

    if (!existingEvent) {
      throw ApiError.notFound('EVENT_NOT_FOUND', 'Event not found');
    }

    // Verify ownership
    if (existingEvent.createdById !== userId) {
      throw ApiError.forbidden('NOT_EVENT_OWNER', 'You are not the event owner');
    }

    // Check if event is cancelled
    if (existingEvent.status === EventStatus.CANCELLED) {
      throw ApiError.badRequest(
        'EVENT_CANCELLED',
        'Cannot update a cancelled event'
      );
    }

    // If changing start time and there are RSVPs, warn/prevent
    if (data.startTime && existingEvent._count.rsvps > 0) {
      const newStartTime = new Date(data.startTime);
      if (newStartTime.getTime() !== existingEvent.startTime.getTime()) {
        // Allow the update but we should notify RSVPs (handled by email service)
        logger.info(
          { eventId, rsvpCount: existingEvent._count.rsvps },
          'Event start time changed with existing RSVPs'
        );
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.startTime !== undefined) updateData.startTime = new Date(data.startTime);
    if (data.endTime !== undefined) updateData.endTime = new Date(data.endTime);
    if (data.timezone !== undefined) updateData.timezone = data.timezone;
    if (data.locationType !== undefined) updateData.locationType = data.locationType;
    if (data.venue !== undefined) updateData.venue = data.venue as object | null;
    if (data.onlineUrl !== undefined) updateData.onlineUrl = data.onlineUrl;
    if (data.linkedBusinessId !== undefined) updateData.linkedBusinessId = data.linkedBusinessId;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.ticketUrl !== undefined) updateData.ticketUrl = data.ticketUrl;
    if (data.cost !== undefined) updateData.cost = data.cost;
    if (data.capacity !== undefined) updateData.capacity = data.capacity;
    if (data.ageRestriction !== undefined) updateData.ageRestriction = data.ageRestriction;
    if (data.accessibility !== undefined) updateData.accessibility = data.accessibility;
    if (data.status !== undefined) updateData.status = data.status;

    // Update event
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
      include: {
        category: true,
        linkedBusiness: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            displayName: true,
            profilePhoto: true,
          },
        },
      },
    });

    // Log audit
    await this.logAudit('event.update', eventId, existingEvent, updatedEvent, auditContext);

    logger.info({ eventId, userId }, 'Event updated');

    // Invalidate cache
    await this.invalidateCache(eventId);

    return this.formatEventWithDetails(updatedEvent, null);
  }

  /**
   * Deletes an event (soft delete via status change)
   */
  async deleteEvent(
    eventId: string,
    userId: string,
    auditContext: AuditContext
  ): Promise<void> {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        rsvps: {
          where: { status: RSVPStatus.GOING },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                displayName: true,
              },
            },
          },
        },
      },
    });

    if (!event) {
      throw ApiError.notFound('EVENT_NOT_FOUND', 'Event not found');
    }

    if (event.createdById !== userId) {
      throw ApiError.forbidden('NOT_EVENT_OWNER', 'You are not the event owner');
    }

    // Mark as cancelled instead of deleting
    await prisma.event.update({
      where: { id: eventId },
      data: { status: EventStatus.CANCELLED },
    });

    // Log audit
    await this.logAudit('event.cancel', eventId, event, { status: 'CANCELLED' }, auditContext);

    logger.info(
      { eventId, userId, rsvpCount: event.rsvps.length },
      'Event cancelled'
    );

    // TODO: Send cancellation emails to RSVPs

    // Invalidate cache
    await this.invalidateCache(eventId);
  }

  /**
   * Gets a single event by ID
   */
  async getEvent(eventId: string, userId?: string): Promise<EventWithDetails> {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        category: true,
        linkedBusiness: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            displayName: true,
            profilePhoto: true,
          },
        },
        rsvps: true,
      },
    });

    if (!event) {
      throw ApiError.notFound('EVENT_NOT_FOUND', 'Event not found');
    }

    // Only show active events publicly (or pending to owner/admin)
    if (event.status !== EventStatus.ACTIVE && event.createdById !== userId) {
      throw ApiError.notFound('EVENT_NOT_FOUND', 'Event not found');
    }

    // Get user's RSVP if logged in
    let userRSVP = null;
    if (userId) {
      const rsvp = await prisma.eventRSVP.findUnique({
        where: {
          eventId_userId: {
            eventId,
            userId,
          },
        },
      });
      if (rsvp) {
        userRSVP = {
          status: rsvp.status,
          guestCount: rsvp.guestCount,
        };
      }
    }

    return this.formatEventWithDetails(event, userRSVP);
  }

  /**
   * Gets a single event by slug
   */
  async getEventBySlug(slug: string, userId?: string): Promise<EventWithDetails> {
    const event = await prisma.event.findFirst({
      where: { slug },
      include: {
        category: true,
        linkedBusiness: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            displayName: true,
            profilePhoto: true,
          },
        },
        rsvps: true,
      },
    });

    if (!event) {
      throw ApiError.notFound('EVENT_NOT_FOUND', 'Event not found');
    }

    if (event.status !== EventStatus.ACTIVE && event.createdById !== userId) {
      throw ApiError.notFound('EVENT_NOT_FOUND', 'Event not found');
    }

    let userRSVP = null;
    if (userId) {
      const rsvp = await prisma.eventRSVP.findUnique({
        where: {
          eventId_userId: {
            eventId: event.id,
            userId,
          },
        },
      });
      if (rsvp) {
        userRSVP = {
          status: rsvp.status,
          guestCount: rsvp.guestCount,
        };
      }
    }

    return this.formatEventWithDetails(event, userRSVP);
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
      where.endTime = { gte: new Date() };
    } else {
      where.status = { in: [EventStatus.ACTIVE, EventStatus.PAST] };
    }

    // Date range filter
    if (filterOptions.dateFrom) {
      where.startTime = {
        ...(where.startTime as object || {}),
        gte: new Date(filterOptions.dateFrom),
      };
    }
    if (filterOptions.dateTo) {
      where.endTime = {
        ...(where.endTime as object || {}),
        lte: new Date(filterOptions.dateTo),
      };
    }

    // Category filter
    if (filterOptions.categoryId) {
      where.categoryId = filterOptions.categoryId;
    }

    // Location type filter
    if (filterOptions.locationType) {
      where.locationType = filterOptions.locationType;
    }

    // Linked business filter
    if (filterOptions.linkedBusinessId) {
      where.linkedBusinessId = filterOptions.linkedBusinessId;
    }

    // Created by filter
    if (filterOptions.createdById) {
      where.createdById = filterOptions.createdById;
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
        orderBy = [{ startTime: 'asc' }];
        break;
      case 'newest':
        orderBy = [{ createdAt: 'desc' }];
        break;
      case 'popular':
        // Will be handled differently - by RSVP count
        orderBy = [{ startTime: 'asc' }];
        break;
      default:
        orderBy = [{ startTime: 'asc' }];
    }

    // Execute query
    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          category: true,
          linkedBusiness: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              displayName: true,
              profilePhoto: true,
            },
          },
          rsvps: true,
        },
      }),
      prisma.event.count({ where }),
    ]);

    // Get user RSVPs if logged in
    let userRsvps: Map<string, { status: RSVPStatus; guestCount: number }> = new Map();
    if (userId && events.length > 0) {
      const rsvps = await prisma.eventRSVP.findMany({
        where: {
          userId,
          eventId: { in: events.map((e) => e.id) },
        },
      });
      userRsvps = new Map(
        rsvps.map((r) => [r.eventId, { status: r.status, guestCount: r.guestCount }])
      );
    }

    // Format events
    const formattedEvents = events.map((event) =>
      this.formatEventWithDetails(event, userRsvps.get(event.id) || null)
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

  // ─── RSVP Operations ────────────────────────────────────────

  /**
   * Creates or updates an RSVP for an event
   */
  async rsvpToEvent(
    eventId: string,
    userId: string,
    data: EventRSVPInput,
    auditContext: AuditContext
  ): Promise<{ rsvp: AttendeeInfo; event: EventWithDetails }> {
    // Get event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        rsvps: true,
        category: true,
        linkedBusiness: {
          select: { id: true, name: true, slug: true },
        },
        createdBy: {
          select: { id: true, displayName: true, profilePhoto: true },
        },
      },
    });

    if (!event) {
      throw ApiError.notFound('EVENT_NOT_FOUND', 'Event not found');
    }

    // Check event status
    if (event.status !== EventStatus.ACTIVE) {
      throw ApiError.badRequest(
        'EVENT_NOT_ACTIVE',
        'Cannot RSVP to an event that is not active'
      );
    }

    // Check if event has already started
    if (new Date() > event.startTime) {
      throw ApiError.badRequest(
        'EVENT_STARTED',
        'Cannot RSVP to an event that has already started'
      );
    }

    // Check capacity for GOING status
    if (data.status === 'GOING' && event.capacity) {
      const currentGoing = event.rsvps
        .filter((r) => r.status === RSVPStatus.GOING)
        .reduce((sum, r) => sum + r.guestCount, 0);

      // Exclude current user's existing RSVP if updating
      const existingRsvp = event.rsvps.find((r) => r.userId === userId);
      const existingGuests = existingRsvp?.status === RSVPStatus.GOING
        ? existingRsvp.guestCount
        : 0;

      const newTotal = currentGoing - existingGuests + data.guestCount;

      if (newTotal > event.capacity) {
        throw ApiError.badRequest(
          'EVENT_AT_CAPACITY',
          `This event is at full capacity. Only ${event.capacity - currentGoing + existingGuests} spots remaining.`
        );
      }
    }

    // Create or update RSVP
    const rsvp = await prisma.eventRSVP.upsert({
      where: {
        eventId_userId: { eventId, userId },
      },
      update: {
        status: data.status as RSVPStatus,
        guestCount: data.guestCount,
        notes: data.notes,
        rsvpDate: new Date(),
      },
      create: {
        eventId,
        userId,
        status: data.status as RSVPStatus,
        guestCount: data.guestCount,
        notes: data.notes,
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            profilePhoto: true,
          },
        },
      },
    });

    // Log audit
    await this.logAudit('event.rsvp', eventId, null, rsvp, auditContext);

    logger.info(
      { eventId, userId, status: data.status, guestCount: data.guestCount },
      'Event RSVP created/updated'
    );

    // Invalidate cache
    await this.invalidateCache(eventId);

    // Refresh event data
    const updatedEvent = await this.getEvent(eventId, userId);

    return {
      rsvp: {
        id: rsvp.id,
        userId: rsvp.userId,
        user: rsvp.user,
        status: rsvp.status,
        guestCount: rsvp.guestCount,
        notes: rsvp.notes,
        rsvpDate: rsvp.rsvpDate,
      },
      event: updatedEvent,
    };
  }

  /**
   * Cancels a user's RSVP
   */
  async cancelRSVP(
    eventId: string,
    userId: string,
    auditContext: AuditContext
  ): Promise<void> {
    const rsvp = await prisma.eventRSVP.findUnique({
      where: {
        eventId_userId: { eventId, userId },
      },
    });

    if (!rsvp) {
      throw ApiError.notFound('RSVP_NOT_FOUND', 'RSVP not found');
    }

    await prisma.eventRSVP.delete({
      where: { id: rsvp.id },
    });

    // Log audit
    await this.logAudit('event.rsvp.cancel', eventId, rsvp, null, auditContext);

    logger.info({ eventId, userId }, 'Event RSVP cancelled');

    // Invalidate cache
    await this.invalidateCache(eventId);
  }

  /**
   * Gets attendee list for an event (owner only)
   */
  async getEventAttendees(
    eventId: string,
    userId: string,
    filters: AttendeeFilterInput
  ): Promise<PaginatedAttendees> {
    // Verify event ownership
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw ApiError.notFound('EVENT_NOT_FOUND', 'Event not found');
    }

    if (event.createdById !== userId) {
      throw ApiError.forbidden(
        'NOT_EVENT_OWNER',
        'Only the event owner can view attendees'
      );
    }

    const { page, limit, status } = filters;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = { eventId };
    if (status) {
      where.status = status;
    }

    // Get attendees
    const [attendees, total, summary] = await Promise.all([
      prisma.eventRSVP.findMany({
        where,
        skip,
        take: limit,
        orderBy: { rsvpDate: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              profilePhoto: true,
              email: true, // Visible to owner
            },
          },
        },
      }),
      prisma.eventRSVP.count({ where }),
      prisma.eventRSVP.groupBy({
        by: ['status'],
        where: { eventId },
        _count: true,
        _sum: { guestCount: true },
      }),
    ]);

    // Calculate summary
    const summaryMap = new Map(summary.map((s) => [s.status, s]));
    const goingData = summaryMap.get(RSVPStatus.GOING);
    const interestedData = summaryMap.get(RSVPStatus.INTERESTED);
    const notGoingData = summaryMap.get(RSVPStatus.NOT_GOING);

    return {
      attendees: attendees.map((a) => ({
        id: a.id,
        userId: a.userId,
        user: a.user,
        status: a.status,
        guestCount: a.guestCount,
        notes: a.notes,
        rsvpDate: a.rsvpDate,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + attendees.length < total,
      },
      summary: {
        going: goingData?._count || 0,
        interested: interestedData?._count || 0,
        notGoing: notGoingData?._count || 0,
        totalGuests: (goingData?._sum.guestCount || 0) +
          (interestedData?._sum.guestCount || 0),
      },
    };
  }

  // ─── ICS Export ─────────────────────────────────────────────

  /**
   * Exports an event to ICS format
   */
  async exportEventICS(eventId: string): Promise<string> {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        category: true,
        linkedBusiness: {
          select: { name: true },
        },
        createdBy: {
          select: { displayName: true },
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

  // ─── Status Management ──────────────────────────────────────

  /**
   * Updates past events to PAST status (batch job)
   */
  async updatePastEventsStatus(): Promise<number> {
    const result = await prisma.event.updateMany({
      where: {
        status: EventStatus.ACTIVE,
        endTime: { lt: new Date() },
      },
      data: {
        status: EventStatus.PAST,
      },
    });

    if (result.count > 0) {
      logger.info({ count: result.count }, 'Updated past events status');
      await this.invalidateCache();
    }

    return result.count;
  }

  /**
   * Approves a pending event (moderator action)
   */
  async approveEvent(
    eventId: string,
    moderatorId: string,
    auditContext: AuditContext
  ): Promise<EventWithDetails> {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw ApiError.notFound('EVENT_NOT_FOUND', 'Event not found');
    }

    if (event.status !== EventStatus.PENDING) {
      throw ApiError.badRequest(
        'EVENT_NOT_PENDING',
        'Only pending events can be approved'
      );
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: { status: EventStatus.ACTIVE },
      include: {
        category: true,
        linkedBusiness: {
          select: { id: true, name: true, slug: true },
        },
        createdBy: {
          select: { id: true, displayName: true, profilePhoto: true },
        },
      },
    });

    // Log audit
    await this.logAudit('event.approve', eventId, event, updatedEvent, {
      ...auditContext,
      actorId: moderatorId,
    });

    logger.info({ eventId, moderatorId }, 'Event approved');

    // Invalidate cache
    await this.invalidateCache(eventId);

    return this.formatEventWithDetails(updatedEvent, null);
  }

  // ─── Helper Methods ─────────────────────────────────────────

  /**
   * Generates a unique slug for an event
   */
  private async generateSlug(title: string): Promise<string> {
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 100);

    // Check for existing slugs
    let slug = baseSlug;
    let counter = 1;

    while (await prisma.event.findFirst({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  /**
   * Formats an event with calculated fields
   */
  private formatEventWithDetails(
    event: Record<string, unknown>,
    userRSVP: { status: RSVPStatus; guestCount: number } | null
  ): EventWithDetails {
    const rsvps = (event.rsvps as Array<{ status: RSVPStatus; guestCount: number }>) || [];

    const goingCount = rsvps
      .filter((r) => r.status === RSVPStatus.GOING)
      .reduce((sum, r) => sum + r.guestCount, 0);

    const interestedCount = rsvps.filter(
      (r) => r.status === RSVPStatus.INTERESTED
    ).length;

    const capacity = event.capacity as number | null;
    const spotsRemaining = capacity !== null ? capacity - goingCount : null;

    return {
      id: event.id as string,
      title: event.title as string,
      description: event.description as string,
      categoryId: event.categoryId as string,
      category: event.category as EventWithDetails['category'],
      startTime: event.startTime as Date,
      endTime: event.endTime as Date,
      timezone: event.timezone as string,
      locationType: event.locationType as LocationType,
      venue: event.venue as VenueInput | null,
      onlineUrl: event.onlineUrl as string | null,
      linkedBusinessId: event.linkedBusinessId as string | null,
      linkedBusiness: event.linkedBusiness as EventWithDetails['linkedBusiness'],
      imageUrl: event.imageUrl as string | null,
      ticketUrl: event.ticketUrl as string | null,
      cost: event.cost as string | null,
      capacity,
      ageRestriction: event.ageRestriction as string | null,
      accessibility: event.accessibility as string[],
      recurrence: event.recurrence as RecurrenceRuleInput | null,
      createdById: event.createdById as string,
      createdBy: event.createdBy as EventWithDetails['createdBy'],
      status: event.status as EventStatus,
      slug: event.slug as string | null,
      createdAt: event.createdAt as Date,
      updatedAt: event.updatedAt as Date,
      rsvpCount: {
        going: goingCount,
        interested: interestedCount,
        total: rsvps.length,
      },
      userRSVP,
      spotsRemaining,
    };
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
      `DTSTART:${formatDate(event.startTime as Date)}`,
      `DTEND:${formatDate(event.endTime as Date)}`,
      `SUMMARY:${escapeText(event.title as string)}`,
      `DESCRIPTION:${escapeText(event.description as string)}`,
    ];

    // Add location
    const locationType = event.locationType as string;
    const venue = event.venue as VenueInput | null;
    const onlineUrl = event.onlineUrl as string | null;

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
    const createdBy = event.createdBy as { displayName: string };
    lines.push(`ORGANIZER;CN=${escapeText(createdBy.displayName)}:MAILTO:noreply@communityhub.local`);

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

  /**
   * Logs an audit entry
   */
  private async logAudit(
    action: string,
    targetId: string,
    previousValue: unknown,
    newValue: unknown,
    context: AuditContext
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          actorId: context.actorId,
          actorRole: context.actorRole as 'USER' | 'BUSINESS_OWNER' | 'MODERATOR' | 'ADMIN' | 'SYSTEM',
          action,
          targetType: 'Event',
          targetId,
          previousValue: previousValue ? JSON.parse(JSON.stringify(previousValue)) : null,
          newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
          ipAddress: context.ipAddress || 'unknown',
          userAgent: context.userAgent || 'unknown',
        },
      });
    } catch (error) {
      logger.error({ error, action, targetId }, 'Failed to create audit log');
    }
  }

  /**
   * Invalidates event cache
   */
  private async invalidateCache(eventId?: string): Promise<void> {
    try {
      const redis = getRedis();
      if (!redis) return;

      if (eventId) {
        await redis.del(getCacheKey('event', eventId));
      }
      // Also invalidate list caches
      const keys = await redis.keys(`${CACHE_PREFIX}:list:*`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      logger.error({ error }, 'Failed to invalidate event cache');
    }
  }
}

// Export singleton instance
export const eventService = new EventService();
