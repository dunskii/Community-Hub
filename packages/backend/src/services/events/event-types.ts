/**
 * Event Types & Constants
 * Phase 8: Events & Calendar System
 *
 * Shared interfaces, types, and Prisma include constants
 * used across event sub-services.
 */

import type { LocationType, RSVPStatus, EventStatus } from '../../generated/prisma/index.js';
import type { VenueInput, RecurrenceRuleInput } from '@community-hub/shared';

// Re-export shared service types for backward compatibility
export type { AuditContext, PaginationOptions } from '../../types/service-types.js';

// ─── Interfaces ──────────────────────────────────────────────

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

// ─── Constants ───────────────────────────────────────────────

export const CACHE_PREFIX = 'events';

/**
 * Standard Prisma include clause for event detail queries.
 * Used by getEvent, getEventBySlug, listEvents, createEvent, etc.
 */
export const EVENT_DETAIL_INCLUDE = {
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
};

/**
 * Include clause for event detail without RSVPs (used for create/update).
 */
export const EVENT_DETAIL_INCLUDE_NO_RSVPS = {
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
};
