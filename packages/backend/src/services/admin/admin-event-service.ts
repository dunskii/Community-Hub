/**
 * Admin Event Service
 *
 * Event listing and management for admin dashboard.
 * Spec §23: Administration & Moderation
 */

import { prisma } from '../../db/index.js';
import type { AdminEventListItem } from './admin-types.js';

export class AdminEventService {
  /**
   * List all events with filtering and pagination
   */
  async listEvents(options: {
    page: number;
    limit: number;
    status?: string;
    search?: string;
    sort?: string;
  }): Promise<{ events: AdminEventListItem[]; total: number }> {
    const where: Record<string, unknown> = {};

    if (options.status) where.status = options.status;
    if (options.search) {
      where.OR = [
        { title: { contains: options.search, mode: 'insensitive' } },
        { description: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Record<string, string> = {};
    switch (options.sort) {
      case 'oldest': orderBy.created_at = 'asc'; break;
      case 'upcoming': orderBy.start_time = 'asc'; break;
      case 'title': orderBy.title = 'asc'; break;
      default: orderBy.created_at = 'desc';
    }

    const [events, total] = await Promise.all([
      prisma.events.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          start_time: true,
          end_time: true,
          location_type: true,
          capacity: true,
          created_at: true,
          users: { select: { display_name: true } },
          businesses: { select: { name: true } },
          _count: { select: { event_rsvps: true } },
        },
        orderBy,
        skip: (options.page - 1) * options.limit,
        take: options.limit,
      }),
      prisma.events.count({ where }),
    ]);

    return {
      events: events.map((e) => ({
        id: e.id,
        title: e.title,
        slug: e.slug,
        status: e.status,
        startTime: e.start_time,
        endTime: e.end_time,
        locationType: e.location_type,
        capacity: e.capacity,
        rsvpCount: e._count.event_rsvps,
        createdByName: e.users.display_name,
        businessName: e.businesses?.name || null,
        createdAt: e.created_at,
      })),
      total,
    };
  }
}
