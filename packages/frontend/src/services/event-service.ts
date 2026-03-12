/**
 * Event Service
 * Phase 8: Events & Calendar System
 * API client for event operations
 */

import { apiClient } from './api-client';
import type {
  EventCreateInput,
  EventUpdateInput,
  EventRSVPInput,
  LocationType,
  EventStatus,
  RSVPStatus,
  VenueInput,
  RecurrenceRuleInput,
} from '@community-hub/shared';

// Re-export shared types for convenience
export type { LocationType, EventStatus, RSVPStatus } from '@community-hub/shared';

// ─── Types ────────────────────────────────────────────────────

export interface EventCategory {
  id: string;
  name: Record<string, string>;
  slug: string;
  icon: string;
}

export interface EventCreator {
  id: string;
  displayName: string;
  profilePhoto: string | null;
}

export interface LinkedBusiness {
  id: string;
  name: string;
  slug: string;
}

export interface RSVPCount {
  going: number;
  interested: number;
  total: number;
}

export interface UserRSVP {
  status: RSVPStatus;
  guestCount: number;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  category: EventCategory;
  startTime: string;
  endTime: string;
  timezone: string;
  locationType: LocationType;
  venue: VenueInput | null;
  onlineUrl: string | null;
  linkedBusinessId: string | null;
  linkedBusiness: LinkedBusiness | null;
  imageUrl: string | null;
  ticketUrl: string | null;
  cost: string | null;
  capacity: number | null;
  ageRestriction: string | null;
  accessibility: string[];
  recurrence: RecurrenceRuleInput | null;
  createdById: string;
  createdBy: EventCreator;
  status: EventStatus;
  slug: string | null;
  createdAt: string;
  updatedAt: string;
  rsvpCount: RSVPCount;
  userRSVP: UserRSVP | null;
  spotsRemaining: number | null;
}

export interface EventsResponse {
  success: boolean;
  data: {
    events: Event[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasMore: boolean;
    };
  };
}

export interface EventResponse {
  success: boolean;
  data: Event;
}

export interface RSVPResponse {
  success: boolean;
  data: {
    rsvp: {
      id: string;
      userId: string;
      status: RSVPStatus;
      guestCount: number;
      notes: string | null;
      rsvpDate: string;
    };
    event: Event;
  };
}

export interface Attendee {
  id: string;
  userId: string;
  user: {
    id: string;
    displayName: string;
    profilePhoto: string | null;
    email?: string;
  };
  status: RSVPStatus;
  guestCount: number;
  notes: string | null;
  rsvpDate: string;
}

export interface AttendeesResponse {
  success: boolean;
  data: {
    attendees: Attendee[];
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
  };
}

export interface EventFilters {
  dateFrom?: string;
  dateTo?: string;
  categoryId?: string;
  locationType?: LocationType;
  distance?: number;
  latitude?: number;
  longitude?: number;
  includePast?: boolean;
  freeOnly?: boolean;
  linkedBusinessId?: string;
  createdById?: string;
  status?: EventStatus;
  search?: string;
  page?: number;
  limit?: number;
  sort?: 'upcoming' | 'distance' | 'newest' | 'popular';
}

// ─── Service ──────────────────────────────────────────────────

export const eventService = {
  /**
   * List events with filters
   */
  async listEvents(filters?: EventFilters): Promise<EventsResponse> {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.categoryId) params.append('categoryId', filters.categoryId);
      if (filters.locationType) params.append('locationType', filters.locationType);
      if (filters.distance) params.append('distance', filters.distance.toString());
      if (filters.latitude) params.append('latitude', filters.latitude.toString());
      if (filters.longitude) params.append('longitude', filters.longitude.toString());
      if (filters.includePast) params.append('includePast', 'true');
      if (filters.freeOnly) params.append('freeOnly', 'true');
      if (filters.linkedBusinessId) params.append('linkedBusinessId', filters.linkedBusinessId);
      if (filters.createdById) params.append('createdById', filters.createdById);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.sort) params.append('sort', filters.sort);
    }

    const queryString = params.toString();
    const endpoint = queryString ? `/events?${queryString}` : '/events';

    return apiClient.get<EventsResponse>(endpoint);
  },

  /**
   * Get single event by ID
   */
  async getEvent(eventId: string): Promise<EventResponse> {
    return apiClient.get<EventResponse>(`/events/${eventId}`);
  },

  /**
   * Get event by slug
   */
  async getEventBySlug(slug: string): Promise<EventResponse> {
    return apiClient.get<EventResponse>(`/events/slug/${slug}`);
  },

  /**
   * Create new event
   */
  async createEvent(data: EventCreateInput): Promise<EventResponse> {
    return apiClient.post<EventResponse>('/events', data);
  },

  /**
   * Update event
   */
  async updateEvent(eventId: string, data: EventUpdateInput): Promise<EventResponse> {
    return apiClient.put<EventResponse>(`/events/${eventId}`, data);
  },

  /**
   * Delete (cancel) event
   */
  async deleteEvent(eventId: string): Promise<{ success: boolean }> {
    return apiClient.delete<{ success: boolean }>(`/events/${eventId}`);
  },

  /**
   * RSVP to event
   */
  async rsvpToEvent(eventId: string, data: EventRSVPInput): Promise<RSVPResponse> {
    return apiClient.post<RSVPResponse>(`/events/${eventId}/rsvp`, data);
  },

  /**
   * Cancel RSVP
   */
  async cancelRSVP(eventId: string): Promise<{ success: boolean }> {
    return apiClient.delete<{ success: boolean }>(`/events/${eventId}/rsvp`);
  },

  /**
   * Get event attendees (owner only)
   */
  async getAttendees(
    eventId: string,
    options?: {
      status?: RSVPStatus;
      page?: number;
      limit?: number;
    }
  ): Promise<AttendeesResponse> {
    const params = new URLSearchParams();
    if (options?.status) params.append('status', options.status);
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());

    const queryString = params.toString();
    const endpoint = queryString
      ? `/events/${eventId}/attendees?${queryString}`
      : `/events/${eventId}/attendees`;

    return apiClient.get<AttendeesResponse>(endpoint);
  },

  /**
   * Export event to ICS
   */
  getExportUrl(eventId: string): string {
    const apiBaseUrl = import.meta.env.VITE_API_URL || '/api/v1';
    return `${apiBaseUrl}/events/${eventId}/export`;
  },

  /**
   * Get Google Calendar add URL
   */
  getGoogleCalendarUrl(event: Event): string {
    const startTime = new Date(event.startTime).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const endTime = new Date(event.endTime).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

    let location = '';
    if (event.locationType === 'PHYSICAL' && event.venue) {
      location = `${event.venue.street}, ${event.venue.suburb}, ${event.venue.state} ${event.venue.postcode}`;
    } else if (event.locationType === 'ONLINE' && event.onlineUrl) {
      location = event.onlineUrl;
    }

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      details: event.description.substring(0, 500),
      dates: `${startTime}/${endTime}`,
      location,
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  },
};

// ─── Utility Functions ────────────────────────────────────────

/**
 * Format event date for display
 */
export function formatEventDate(
  startTime: string,
  endTime: string,
  locale: string = 'en-AU'
): { date: string; time: string; duration: string } {
  const start = new Date(startTime);
  const end = new Date(endTime);

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const timeFormatter = new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const date = dateFormatter.format(start);
  const startTimeStr = timeFormatter.format(start);
  const endTimeStr = timeFormatter.format(end);

  // Calculate duration
  const durationMs = end.getTime() - start.getTime();
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

  let duration = '';
  if (hours > 0) {
    duration += `${hours}h`;
  }
  if (minutes > 0) {
    duration += ` ${minutes}m`;
  }

  return {
    date,
    time: `${startTimeStr} - ${endTimeStr}`,
    duration: duration.trim(),
  };
}

/**
 * Get smart date label (Today, Tomorrow, etc.)
 */
export function getSmartDateLabel(dateString: string, t: (key: string) => string): string {
  const date = new Date(dateString);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const isTomorrow =
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear();

  if (isToday) {
    return t('events.date.today');
  }
  if (isTomorrow) {
    return t('events.date.tomorrow');
  }

  return new Intl.DateTimeFormat('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date);
}

/**
 * Format location for display
 */
export function formatEventLocation(event: Event): string {
  if (event.locationType === 'ONLINE') {
    return 'Online Event';
  }

  if (event.venue) {
    return `${event.venue.suburb}, ${event.venue.state}`;
  }

  return '';
}

/**
 * Get location type badge color
 */
export function getLocationTypeBadgeVariant(
  locationType: LocationType
): 'default' | 'success' | 'warning' {
  switch (locationType) {
    case 'PHYSICAL':
      return 'default';
    case 'ONLINE':
      return 'success';
    case 'HYBRID':
      return 'warning';
    default:
      return 'default';
  }
}
