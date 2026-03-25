/**
 * Event Moderation Service
 * Phase 8: Events & Calendar System
 *
 * Admin/system operations: approveEvent, updatePastEventsStatus.
 */

import { prisma } from '../../db/index.js';
import { logger } from '../../utils/logger.js';
import { ApiError } from '../../utils/api-error.js';
import { createAuditLog } from '../../utils/audit-logger.js';
import { EventStatus } from '../../generated/prisma/index.js';
import type { AuditContext, EventWithDetails } from './event-types.js';
import { EVENT_DETAIL_INCLUDE_NO_RSVPS } from './event-types.js';
import { formatEventWithDetails, invalidateEventCache } from './event-helpers.js';

// ─── Service ──────────────────────────────────────────────────

export class EventModerationService {
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
      include: EVENT_DETAIL_INCLUDE_NO_RSVPS,
    });

    // Log audit
    await createAuditLog({ context: { ...auditContext, actorId: moderatorId }, action: 'event.approve', targetType: 'Event', targetId: eventId, previousValue: event, newValue: updatedEvent });

    logger.info({ eventId, moderatorId }, 'Event approved');

    // Invalidate cache
    await invalidateEventCache(eventId);

    return formatEventWithDetails(updatedEvent, null);
  }

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
      await invalidateEventCache();
    }

    return result.count;
  }
}
