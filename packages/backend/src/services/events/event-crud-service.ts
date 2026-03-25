/**
 * Event CRUD Service
 * Phase 8: Events & Calendar System
 *
 * Write operations: createEvent, updateEvent, deleteEvent.
 */

import crypto from 'crypto';
import { getPlatformConfig } from '../../config/platform-loader.js';
import { prisma } from '../../db/index.js';
import { logger } from '../../utils/logger.js';
import { ApiError } from '../../utils/api-error.js';
import { createAuditLog } from '../../utils/audit-logger.js';
import { eventNotificationService } from '../event-notification-service.js';
import {
  EventStatus,
  RSVPStatus,
  CategoryType,
} from '../../generated/prisma/index.js';
import type { LocationType } from '../../generated/prisma/index.js';
import type {
  EventCreateInput,
  EventUpdateInput,
  VenueInput,
} from '@community-hub/shared';
import type { AuditContext, EventWithDetails } from './event-types.js';
import { EVENT_DETAIL_INCLUDE_NO_RSVPS } from './event-types.js';
import { formatEventWithDetails, generateSlug, invalidateEventCache } from './event-helpers.js';

// ─── Service ──────────────────────────────────────────────────

export class EventCrudService {
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
    const slug = await generateSlug(data.title);

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
        status: auditContext.actorRole === 'ADMIN' || auditContext.actorRole === 'SUPER_ADMIN'
          ? EventStatus.ACTIVE
          : EventStatus.PENDING,
        slug,
        updated_at: new Date(),
      },
      include: {
        ...EVENT_DETAIL_INCLUDE_NO_RSVPS,
        _count: {
          select: {
            event_rsvps: true,
          },
        },
      },
    });

    // Log audit
    await createAuditLog({ context: auditContext, action: 'event.create', targetType: 'Event', targetId: event.id, newValue: event });

    logger.info({ eventId: event.id, userId }, 'Event created');

    // Invalidate cache
    await invalidateEventCache();

    return formatEventWithDetails(event, null);
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
      include: EVENT_DETAIL_INCLUDE_NO_RSVPS,
    });

    // Log audit
    await createAuditLog({ context: auditContext, action: 'event.update', targetType: 'Event', targetId: eventId, previousValue: existingEvent, newValue: updatedEvent });

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
    await invalidateEventCache(eventId);

    return formatEventWithDetails(updatedEvent, null);
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
    await createAuditLog({ context: auditContext, action: 'event.cancel', targetType: 'Event', targetId: eventId, previousValue: event, newValue: { status: 'CANCELLED' } });

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
    await invalidateEventCache(eventId);
  }
}
