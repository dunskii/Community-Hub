/**
 * Event RSVP Service
 * Phase 8: Events & Calendar System
 * Spec §15: Events & Calendar
 *
 * Handles RSVP operations for events.
 */

import crypto from 'crypto';
import { prisma } from '../db/index.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/api-error.js';
import { getRedis } from '../cache/redis-client.js';
import type { EventRSVPInput, AttendeeFilterInput } from '@community-hub/shared';
import { EventStatus, RSVPStatus } from '../generated/prisma/index.js';
import type { AuditContext, AttendeeInfo, PaginatedAttendees, EventWithDetails } from './event-service.js';

// ─── Cache Keys ───────────────────────────────────────────────

const CACHE_PREFIX = 'events';

function getCacheKey(type: string, ...args: string[]): string {
  return `${CACHE_PREFIX}:${type}:${args.join(':')}`;
}

// ─── Service ──────────────────────────────────────────────────

export class EventRSVPService {
  /**
   * Creates or updates an RSVP for an event
   */
  async rsvpToEvent(
    eventId: string,
    userId: string,
    data: EventRSVPInput,
    auditContext: AuditContext,
    getEventCallback: (eventId: string, userId?: string) => Promise<EventWithDetails>
  ): Promise<{ rsvp: AttendeeInfo; event: EventWithDetails }> {
    // Get event
    const event = await prisma.events.findUnique({
      where: { id: eventId },
      include: {
        event_rsvps: true,
        categories: true,
        businesses: {
          select: { id: true, name: true, slug: true },
        },
        users: {
          select: { id: true, display_name: true, profile_photo: true },
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
    if (new Date() > event.start_time) {
      throw ApiError.badRequest(
        'EVENT_STARTED',
        'Cannot RSVP to an event that has already started'
      );
    }

    // Check capacity for GOING status
    if (data.status === 'GOING' && event.capacity) {
      const currentGoing = event.event_rsvps
        .filter((r) => r.status === RSVPStatus.GOING)
        .reduce((sum, r) => sum + r.guest_count, 0);

      // Exclude current user's existing RSVP if updating
      const existingRsvp = event.event_rsvps.find((r) => r.user_id === userId);
      const existingGuests = existingRsvp?.status === RSVPStatus.GOING
        ? existingRsvp.guest_count
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
    const rsvp = await prisma.event_rsvps.upsert({
      where: {
        event_id_user_id: { event_id: eventId, user_id: userId },
      },
      update: {
        status: data.status as RSVPStatus,
        guest_count: data.guestCount,
        notes: data.notes,
        rsvp_date: new Date(),
        updated_at: new Date(),
      },
      create: {
        id: crypto.randomUUID(),
        event_id: eventId,
        user_id: userId,
        status: data.status as RSVPStatus,
        guest_count: data.guestCount,
        notes: data.notes,
        updated_at: new Date(),
      },
      include: {
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
    await this.logAudit('event.rsvp', eventId, null, rsvp, auditContext);

    logger.info(
      { eventId, userId, status: data.status, guestCount: data.guestCount },
      'Event RSVP created/updated'
    );

    // Invalidate cache
    await this.invalidateCache(eventId);

    // Refresh event data using callback
    const updatedEvent = await getEventCallback(eventId, userId);

    return {
      rsvp: {
        id: rsvp.id,
        userId: rsvp.user_id,
        user: {
          id: rsvp.users.id,
          displayName: rsvp.users.display_name,
          profilePhoto: rsvp.users.profile_photo,
        },
        status: rsvp.status,
        guestCount: rsvp.guest_count,
        notes: rsvp.notes,
        rsvpDate: rsvp.rsvp_date,
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
    const rsvp = await prisma.event_rsvps.findUnique({
      where: {
        event_id_user_id: { event_id: eventId, user_id: userId },
      },
    });

    if (!rsvp) {
      throw ApiError.notFound('RSVP_NOT_FOUND', 'RSVP not found');
    }

    await prisma.event_rsvps.delete({
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
    const event = await prisma.events.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw ApiError.notFound('EVENT_NOT_FOUND', 'Event not found');
    }

    if (event.created_by_id !== userId) {
      throw ApiError.forbidden(
        'NOT_EVENT_OWNER',
        'Only the event owner can view attendees'
      );
    }

    const { page, limit, status } = filters;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = { event_id: eventId };
    if (status) {
      where.status = status;
    }

    // Get attendees
    const [attendees, total, summary] = await Promise.all([
      prisma.event_rsvps.findMany({
        where,
        skip,
        take: limit,
        orderBy: { rsvp_date: 'desc' },
        include: {
          users: {
            select: {
              id: true,
              display_name: true,
              profile_photo: true,
              email: true, // Visible to owner
            },
          },
        },
      }),
      prisma.event_rsvps.count({ where }),
      prisma.event_rsvps.groupBy({
        by: ['status'],
        where: { event_id: eventId },
        _count: true,
        _sum: { guest_count: true },
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
        userId: a.user_id,
        user: {
          id: a.users.id,
          displayName: a.users.display_name,
          profilePhoto: a.users.profile_photo,
          email: a.users.email,
        },
        status: a.status,
        guestCount: a.guest_count,
        notes: a.notes,
        rsvpDate: a.rsvp_date,
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
        totalGuests: (goingData?._sum.guest_count || 0) +
          (interestedData?._sum.guest_count || 0),
      },
    };
  }

  /**
   * Gets all RSVPs for a user
   */
  async getUserRSVPs(
    userId: string,
    options: { page: number; limit: number; status?: RSVPStatus; includePast?: boolean }
  ): Promise<{
    rsvps: Array<{
      id: string;
      status: RSVPStatus;
      guestCount: number;
      rsvpDate: Date;
      event: {
        id: string;
        title: string;
        slug: string | null;
        startTime: Date;
        endTime: Date;
        locationType: string;
        imageUrl: string | null;
        status: EventStatus;
      };
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasMore: boolean;
    };
  }> {
    const { page, limit, status, includePast } = options;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = { user_id: userId };
    if (status) {
      where.status = status;
    }

    // Filter out past events unless requested
    const eventWhere: Record<string, unknown> = {};
    if (!includePast) {
      eventWhere.end_time = { gte: new Date() };
      eventWhere.status = { not: EventStatus.PAST };
    }

    const [rsvps, total] = await Promise.all([
      prisma.event_rsvps.findMany({
        where: {
          ...where,
          events: eventWhere,
        },
        skip,
        take: limit,
        orderBy: { events: { start_time: 'asc' } },
        include: {
          events: {
            select: {
              id: true,
              title: true,
              slug: true,
              start_time: true,
              end_time: true,
              location_type: true,
              image_url: true,
              status: true,
            },
          },
        },
      }),
      prisma.event_rsvps.count({
        where: {
          ...where,
          events: eventWhere,
        },
      }),
    ]);

    return {
      rsvps: rsvps.map((r) => ({
        id: r.id,
        status: r.status,
        guestCount: r.guest_count,
        rsvpDate: r.rsvp_date,
        event: {
          id: r.events.id,
          title: r.events.title,
          slug: r.events.slug,
          startTime: r.events.start_time,
          endTime: r.events.end_time,
          locationType: r.events.location_type,
          imageUrl: r.events.image_url,
          status: r.events.status,
        },
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + rsvps.length < total,
      },
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
          target_type: 'EventRSVP',
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
export const eventRSVPService = new EventRSVPService();
