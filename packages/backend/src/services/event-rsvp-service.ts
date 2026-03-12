/**
 * Event RSVP Service
 * Phase 8: Events & Calendar System
 * Spec §15: Events & Calendar
 *
 * Handles RSVP operations for events.
 */

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

    // Refresh event data using callback
    const updatedEvent = await getEventCallback(eventId, userId);

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
    const where: Record<string, unknown> = { userId };
    if (status) {
      where.status = status;
    }

    // Filter out past events unless requested
    const eventWhere: Record<string, unknown> = {};
    if (!includePast) {
      eventWhere.endTime = { gte: new Date() };
      eventWhere.status = { not: EventStatus.PAST };
    }

    const [rsvps, total] = await Promise.all([
      prisma.eventRSVP.findMany({
        where: {
          ...where,
          event: eventWhere,
        },
        skip,
        take: limit,
        orderBy: { event: { startTime: 'asc' } },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              slug: true,
              startTime: true,
              endTime: true,
              locationType: true,
              imageUrl: true,
              status: true,
            },
          },
        },
      }),
      prisma.eventRSVP.count({
        where: {
          ...where,
          event: eventWhere,
        },
      }),
    ]);

    return {
      rsvps: rsvps.map((r) => ({
        id: r.id,
        status: r.status,
        guestCount: r.guestCount,
        rsvpDate: r.rsvpDate,
        event: r.event,
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
      await prisma.auditLog.create({
        data: {
          actorId: context.actorId,
          actorRole: context.actorRole as 'USER' | 'BUSINESS_OWNER' | 'MODERATOR' | 'ADMIN' | 'SYSTEM',
          action,
          targetType: 'EventRSVP',
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
export const eventRSVPService = new EventRSVPService();
