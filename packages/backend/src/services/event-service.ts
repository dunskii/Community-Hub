/**
 * Event Service
 * Phase 8: Events & Calendar System
 * Spec §15: Events & Calendar
 *
 * Handles CRUD operations for events.
 * RSVP operations are in event-rsvp-service.ts
 * ICS export is in event-export-service.ts
 * Email notifications are in event-notification-service.ts
 */

import crypto from 'crypto';
import { getPlatformConfig } from '../config/platform-loader.js';
import { prisma } from '../db/index.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/api-error.js';
import { getRedis } from '../cache/redis-client.js';
import { eventRSVPService } from './event-rsvp-service.js';
import { eventExportService } from './event-export-service.js';
import { eventNotificationService } from './event-notification-service.js';
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
    const category = await prisma.categories.findUnique({
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
      const business = await prisma.businesses.findUnique({
        where: { id: data.linkedBusinessId },
      });

      if (!business) {
        throw ApiError.notFound('BUSINESS_NOT_FOUND', 'Linked business not found');
      }

      // Check if user is the business owner
      if (business.claimed_by !== userId) {
        throw ApiError.forbidden(
          'NOT_BUSINESS_OWNER',
          'You must be the business owner to link events'
        );
      }
    }

    // Generate slug
    const slug = await this.generateSlug(data.title);

    // Create event
    const event = await prisma.events.create({
      data: {
        id: crypto.randomUUID(),
        title: data.title,
        description: data.description,
        category_id: data.categoryId,
        start_time: new Date(data.startTime),
        end_time: new Date(data.endTime),
        timezone: data.timezone || config.location.timezone,
        location_type: data.locationType as LocationType,
        venue: data.venue as object | undefined,
        online_url: data.onlineUrl,
        linked_business_id: data.linkedBusinessId,
        image_url: data.imageUrl,
        ticket_url: data.ticketUrl,
        cost: data.cost,
        capacity: data.capacity,
        age_restriction: data.ageRestriction,
        accessibility: data.accessibility || [],
        recurrence: data.recurrence as object | undefined,
        created_by_id: userId,
        status: EventStatus.PENDING,
        slug,
        updated_at: new Date(),
      },
      include: {
        categories: true,
        businesses: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        users: {
          select: {
            id: true,
            display_name: true,
            profile_photo: true,
          },
        },
        _count: {
          select: {
            event_rsvps: true,
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
    const existingEvent = await prisma.events.findUnique({
      where: { id: eventId },
      include: {
        users: {
          select: { display_name: true },
        },
        _count: {
          select: {
            event_rsvps: {
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
    if (existingEvent.created_by_id !== userId) {
      throw ApiError.forbidden('NOT_EVENT_OWNER', 'You are not the event owner');
    }

    // Check if event is cancelled
    if (existingEvent.status === EventStatus.CANCELLED) {
      throw ApiError.badRequest(
        'EVENT_CANCELLED',
        'Cannot update a cancelled event'
      );
    }

    // Track changes for notification
    const changes: string[] = [];

    // If changing start time and there are RSVPs, track for notification
    if (data.startTime && existingEvent._count.event_rsvps > 0) {
      const newStartTime = new Date(data.startTime);
      if (newStartTime.getTime() !== existingEvent.start_time.getTime()) {
        changes.push('date/time');
        logger.info(
          { eventId, rsvpCount: existingEvent._count.event_rsvps },
          'Event start time changed with existing RSVPs'
        );
      }
    }

    if (data.locationType && data.locationType !== existingEvent.location_type) {
      changes.push('location type');
    }
    if (data.venue) {
      changes.push('venue');
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.categoryId !== undefined) updateData.category_id = data.categoryId;
    if (data.startTime !== undefined) updateData.start_time = new Date(data.startTime);
    if (data.endTime !== undefined) updateData.end_time = new Date(data.endTime);
    if (data.timezone !== undefined) updateData.timezone = data.timezone;
    if (data.locationType !== undefined) updateData.location_type = data.locationType;
    if (data.venue !== undefined) updateData.venue = data.venue as object | null;
    if (data.onlineUrl !== undefined) updateData.online_url = data.onlineUrl;
    if (data.linkedBusinessId !== undefined) updateData.linked_business_id = data.linkedBusinessId;
    if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl;
    if (data.ticketUrl !== undefined) updateData.ticket_url = data.ticketUrl;
    if (data.cost !== undefined) updateData.cost = data.cost;
    if (data.capacity !== undefined) updateData.capacity = data.capacity;
    if (data.ageRestriction !== undefined) updateData.age_restriction = data.ageRestriction;
    if (data.accessibility !== undefined) updateData.accessibility = data.accessibility;
    if (data.status !== undefined) updateData.status = data.status;

    // Update event
    const updatedEvent = await prisma.events.update({
      where: { id: eventId },
      data: updateData,
      include: {
        categories: true,
        businesses: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        users: {
          select: {
            id: true,
            display_name: true,
            profile_photo: true,
          },
        },
      },
    });

    // Log audit
    await this.logAudit('event.update', eventId, existingEvent, updatedEvent, auditContext);

    logger.info({ eventId, userId }, 'Event updated');

    // Send update notifications if there were significant changes
    if (changes.length > 0 && existingEvent._count.event_rsvps > 0) {
      // Fire and forget - don't block the response
      eventNotificationService.sendEventUpdateNotification(
        {
          eventId: updatedEvent.id,
          eventTitle: updatedEvent.title,
          eventStartTime: updatedEvent.start_time,
          eventEndTime: updatedEvent.end_time,
          locationType: updatedEvent.location_type,
          venue: updatedEvent.venue as VenueInput | null,
          onlineUrl: updatedEvent.online_url,
          organizerName: existingEvent.users.display_name,
        },
        changes
      ).catch((err) => {
        logger.error({ err, eventId }, 'Failed to send update notifications');
      });
    }

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
    const event = await prisma.events.findUnique({
      where: { id: eventId },
      include: {
        users: {
          select: { display_name: true },
        },
        event_rsvps: {
          where: { status: RSVPStatus.GOING },
          include: {
            users: {
              select: {
                id: true,
                email: true,
                display_name: true,
              },
            },
          },
        },
      },
    });

    if (!event) {
      throw ApiError.notFound('EVENT_NOT_FOUND', 'Event not found');
    }

    if (event.created_by_id !== userId) {
      throw ApiError.forbidden('NOT_EVENT_OWNER', 'You are not the event owner');
    }

    // Mark as cancelled instead of deleting
    await prisma.events.update({
      where: { id: eventId },
      data: { status: EventStatus.CANCELLED },
    });

    // Log audit
    await this.logAudit('event.cancel', eventId, event, { status: 'CANCELLED' }, auditContext);

    logger.info(
      { eventId, userId, rsvpCount: event.event_rsvps.length },
      'Event cancelled'
    );

    // Send cancellation emails to RSVPs (fire and forget)
    if (event.event_rsvps.length > 0) {
      eventNotificationService.sendCancellationNotifications({
        eventId: event.id,
        eventTitle: event.title,
        eventStartTime: event.start_time,
        eventEndTime: event.end_time,
        locationType: event.location_type,
        venue: event.venue as VenueInput | null,
        onlineUrl: event.online_url,
        organizerName: event.users.display_name,
      }).catch((err) => {
        logger.error({ err, eventId }, 'Failed to send cancellation notifications');
      });
    }

    // Invalidate cache
    await this.invalidateCache(eventId);
  }

  /**
   * Gets a single event by ID
   */
  async getEvent(eventId: string, userId?: string): Promise<EventWithDetails> {
    const event = await prisma.events.findUnique({
      where: { id: eventId },
      include: {
        categories: true,
        businesses: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        users: {
          select: {
            id: true,
            display_name: true,
            profile_photo: true,
          },
        },
        event_rsvps: true,
      },
    });

    if (!event) {
      throw ApiError.notFound('EVENT_NOT_FOUND', 'Event not found');
    }

    // Only show active events publicly (or pending to owner/admin)
    if (event.status !== EventStatus.ACTIVE && event.created_by_id !== userId) {
      throw ApiError.notFound('EVENT_NOT_FOUND', 'Event not found');
    }

    // Get user's RSVP if logged in
    let userRSVP = null;
    if (userId) {
      const rsvp = await prisma.event_rsvps.findUnique({
        where: {
          event_id_user_id: {
            event_id: eventId,
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

    return this.formatEventWithDetails(event, userRSVP);
  }

  /**
   * Gets a single event by slug
   */
  async getEventBySlug(slug: string, userId?: string): Promise<EventWithDetails> {
    const event = await prisma.events.findFirst({
      where: { slug },
      include: {
        categories: true,
        businesses: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        users: {
          select: {
            id: true,
            display_name: true,
            profile_photo: true,
          },
        },
        event_rsvps: true,
      },
    });

    if (!event) {
      throw ApiError.notFound('EVENT_NOT_FOUND', 'Event not found');
    }

    if (event.status !== EventStatus.ACTIVE && event.created_by_id !== userId) {
      throw ApiError.notFound('EVENT_NOT_FOUND', 'Event not found');
    }

    let userRSVP = null;
    if (userId) {
      const rsvp = await prisma.event_rsvps.findUnique({
        where: {
          event_id_user_id: {
            event_id: event.id,
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
        include: {
          categories: true,
          businesses: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          users: {
            select: {
              id: true,
              display_name: true,
              profile_photo: true,
            },
          },
          event_rsvps: true,
        },
      }),
      prisma.events.count({ where }),
    ]);

    // Get user RSVPs if logged in
    let userRsvps: Map<string, { status: RSVPStatus; guestCount: number }> = new Map();
    if (userId && events.length > 0) {
      const rsvps = await prisma.event_rsvps.findMany({
        where: {
          user_id: userId,
          event_id: { in: events.map((e) => e.id) },
        },
      });
      userRsvps = new Map(
        rsvps.map((r) => [r.event_id, { status: r.status, guestCount: r.guest_count }])
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

  /**
   * Updates past events to PAST status (batch job)
   */
  async updatePastEventsStatus(): Promise<number> {
    const result = await prisma.events.updateMany({
      where: {
        status: EventStatus.ACTIVE,
        end_time: { lt: new Date() },
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
    const event = await prisma.events.findUnique({
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

    const updatedEvent = await prisma.events.update({
      where: { id: eventId },
      data: { status: EventStatus.ACTIVE },
      include: {
        categories: true,
        businesses: {
          select: { id: true, name: true, slug: true },
        },
        users: {
          select: { id: true, display_name: true, profile_photo: true },
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

    while (await prisma.events.findFirst({ where: { slug } })) {
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
    const rsvps = (event.event_rsvps as Array<{ status: RSVPStatus; guest_count: number }>) || [];

    const goingCount = rsvps
      .filter((r) => r.status === RSVPStatus.GOING)
      .reduce((sum, r) => sum + r.guest_count, 0);

    const interestedCount = rsvps.filter(
      (r) => r.status === RSVPStatus.INTERESTED
    ).length;

    const capacity = event.capacity as number | null;
    const spotsRemaining = capacity !== null ? capacity - goingCount : null;

    // Map snake_case to camelCase for API response
    const users = event.users as { id: string; display_name: string; profile_photo: string | null } | undefined;
    const categories = event.categories as EventWithDetails['category'] | undefined;
    const businesses = event.businesses as EventWithDetails['linkedBusiness'] | undefined;

    return {
      id: event.id as string,
      title: event.title as string,
      description: event.description as string,
      categoryId: event.category_id as string,
      category: categories as EventWithDetails['category'],
      startTime: event.start_time as Date,
      endTime: event.end_time as Date,
      timezone: event.timezone as string,
      locationType: event.location_type as LocationType,
      venue: event.venue as VenueInput | null,
      onlineUrl: event.online_url as string | null,
      linkedBusinessId: event.linked_business_id as string | null,
      linkedBusiness: businesses as EventWithDetails['linkedBusiness'],
      imageUrl: event.image_url as string | null,
      ticketUrl: event.ticket_url as string | null,
      cost: event.cost as string | null,
      capacity,
      ageRestriction: event.age_restriction as string | null,
      accessibility: event.accessibility as string[],
      recurrence: event.recurrence as RecurrenceRuleInput | null,
      createdById: event.created_by_id as string,
      createdBy: users ? {
        id: users.id,
        displayName: users.display_name,
        profilePhoto: users.profile_photo,
      } : event.createdBy as EventWithDetails['createdBy'],
      status: event.status as EventStatus,
      slug: event.slug as string | null,
      createdAt: event.created_at as Date,
      updatedAt: event.updated_at as Date,
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
      await prisma.audit_logs.create({
        data: {
          id: crypto.randomUUID(),
          actor_id: context.actorId,
          actor_role: context.actorRole as 'USER' | 'BUSINESS_OWNER' | 'MODERATOR' | 'ADMIN' | 'SYSTEM',
          action,
          target_type: 'Event',
          target_id: targetId,
          previous_value: previousValue ? JSON.parse(JSON.stringify(previousValue)) : null,
          new_value: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
          ip_address: context.ipAddress || 'unknown',
          user_agent: context.userAgent || 'unknown',
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
