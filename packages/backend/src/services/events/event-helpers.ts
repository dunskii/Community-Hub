/**
 * Event Helpers
 * Phase 8: Events & Calendar System
 *
 * Shared formatting and utility functions used across event sub-services.
 */

import { prisma } from '../../db/index.js';
import { makeCacheKey, invalidateCacheByPattern } from '../../cache/cache-helpers.js';
import { RSVPStatus } from '../../generated/prisma/index.js';
import type { LocationType } from '../../generated/prisma/index.js';
import type { VenueInput, RecurrenceRuleInput } from '@community-hub/shared';
import type { EventWithDetails } from './event-types.js';
import { CACHE_PREFIX } from './event-types.js';

// ─── Cache Helpers ───────────────────────────────────────────

export function getCacheKey(type: string, ...args: string[]): string {
  return makeCacheKey(CACHE_PREFIX, type, ...args);
}

export async function invalidateEventCache(eventId?: string): Promise<void> {
  await invalidateCacheByPattern(
    CACHE_PREFIX,
    eventId ? getCacheKey('event', eventId) : undefined,
    ['list:*']
  );
}

// ─── Slug Generation ─────────────────────────────────────────

/**
 * Generates a unique slug for an event title.
 * Checks the database to avoid collisions.
 */
export async function generateSlug(title: string): Promise<string> {
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

// ─── Event Formatting ────────────────────────────────────────

/**
 * Formats a raw Prisma event record (snake_case) into the camelCase
 * EventWithDetails shape expected by the API.
 */
export function formatEventWithDetails(
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
    status: event.status as EventWithDetails['status'],
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
