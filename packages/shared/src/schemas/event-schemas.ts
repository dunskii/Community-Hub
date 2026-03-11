import { z } from 'zod';

/**
 * Event validation schemas
 * Phase 8: Events & Calendar System
 * Spec §15: Events & Calendar
 *
 * Note: Validation limits are hardcoded here to avoid circular dependencies.
 * These should match the values in platform.json limits section.
 */

// Default limits
const LIMITS = {
  minTitleLength: 1,
  maxTitleLength: 100,
  minDescriptionLength: 50,
  maxDescriptionLength: 5000,
  maxCostLength: 100,
  maxAgeRestrictionLength: 20,
  maxGuestCount: 10,
  maxNotesLength: 200,
  maxAccessibilityFeatures: 10,
  maxRecurrenceExceptions: 100,
} as const;

// Location type enum values
export const LOCATION_TYPES = ['PHYSICAL', 'ONLINE', 'HYBRID'] as const;
export type LocationType = (typeof LOCATION_TYPES)[number];

// Event status enum values
export const EVENT_STATUSES = ['PENDING', 'ACTIVE', 'CANCELLED', 'PAST'] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

// RSVP status enum values
export const RSVP_STATUSES = ['GOING', 'INTERESTED', 'NOT_GOING'] as const;
export type RSVPStatus = (typeof RSVP_STATUSES)[number];

// Recurrence frequency enum values
export const RECURRENCE_FREQUENCIES = ['NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] as const;
export type RecurrenceFrequency = (typeof RECURRENCE_FREQUENCIES)[number];

// Venue schema for physical/hybrid events
export const venueSchema = z.object({
  street: z.string().min(1, { message: 'Street address is required' }),
  suburb: z.string().min(1, { message: 'Suburb is required' }),
  state: z.string().min(1, { message: 'State is required' }),
  postcode: z.string().min(4, { message: 'Postcode is required' }),
  country: z.string().default('Australia'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

// Recurrence rule schema for repeating events
export const recurrenceRuleSchema = z.object({
  frequency: z.enum(RECURRENCE_FREQUENCIES, {
    errorMap: () => ({ message: 'Invalid recurrence frequency' }),
  }),
  interval: z.number().int().min(1).max(365).default(1),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).max(7).optional(), // 0=Sunday, 6=Saturday
  endDate: z.string().datetime({ message: 'Invalid end date format' }).optional(),
  exceptions: z
    .array(z.string().datetime())
    .max(LIMITS.maxRecurrenceExceptions)
    .optional(), // Dates to skip
});

// Event creation schema
export const eventCreateSchema = z
  .object({
    title: z
      .string()
      .min(LIMITS.minTitleLength, { message: 'Title is required' })
      .max(LIMITS.maxTitleLength, {
        message: `Title cannot exceed ${LIMITS.maxTitleLength} characters`,
      }),
    description: z
      .string()
      .min(LIMITS.minDescriptionLength, {
        message: `Description must be at least ${LIMITS.minDescriptionLength} characters`,
      })
      .max(LIMITS.maxDescriptionLength, {
        message: `Description cannot exceed ${LIMITS.maxDescriptionLength} characters`,
      }),
    categoryId: z.string().uuid({ message: 'Invalid category ID' }),
    startTime: z.string().datetime({ message: 'Invalid start time format' }),
    endTime: z.string().datetime({ message: 'Invalid end time format' }),
    timezone: z.string().default('Australia/Sydney'),
    locationType: z.enum(LOCATION_TYPES, {
      errorMap: () => ({ message: 'Invalid location type' }),
    }),
    venue: venueSchema.optional(),
    onlineUrl: z.string().url({ message: 'Invalid URL format' }).optional(),
    linkedBusinessId: z.string().uuid({ message: 'Invalid business ID' }).optional(),
    imageUrl: z.string().url({ message: 'Invalid image URL' }).optional(),
    ticketUrl: z.string().url({ message: 'Invalid ticket URL' }).optional(),
    cost: z
      .string()
      .max(LIMITS.maxCostLength, {
        message: `Cost cannot exceed ${LIMITS.maxCostLength} characters`,
      })
      .optional(),
    capacity: z.number().int().positive({ message: 'Capacity must be positive' }).optional(),
    ageRestriction: z
      .string()
      .max(LIMITS.maxAgeRestrictionLength, {
        message: `Age restriction cannot exceed ${LIMITS.maxAgeRestrictionLength} characters`,
      })
      .optional(),
    accessibility: z
      .array(z.string())
      .max(LIMITS.maxAccessibilityFeatures, {
        message: `Cannot have more than ${LIMITS.maxAccessibilityFeatures} accessibility features`,
      })
      .optional(),
    recurrence: recurrenceRuleSchema.optional(),
  })
  // Validate start time is before end time
  .refine(
    (data) => new Date(data.startTime) < new Date(data.endTime),
    {
      message: 'Start time must be before end time',
      path: ['endTime'],
    }
  )
  // Validate start time is in the future
  .refine(
    (data) => new Date(data.startTime) > new Date(),
    {
      message: 'Event start time must be in the future',
      path: ['startTime'],
    }
  )
  // Validate venue is required for physical/hybrid events
  .refine(
    (data) => {
      if (data.locationType === 'PHYSICAL' || data.locationType === 'HYBRID') {
        return !!data.venue;
      }
      return true;
    },
    {
      message: 'Venue is required for physical or hybrid events',
      path: ['venue'],
    }
  )
  // Validate online URL is required for online/hybrid events
  .refine(
    (data) => {
      if (data.locationType === 'ONLINE' || data.locationType === 'HYBRID') {
        return !!data.onlineUrl;
      }
      return true;
    },
    {
      message: 'Online URL is required for online or hybrid events',
      path: ['onlineUrl'],
    }
  );

// Event update schema (partial, without future date requirement)
export const eventUpdateSchema = z
  .object({
    title: z
      .string()
      .min(LIMITS.minTitleLength)
      .max(LIMITS.maxTitleLength)
      .optional(),
    description: z
      .string()
      .min(LIMITS.minDescriptionLength)
      .max(LIMITS.maxDescriptionLength)
      .optional(),
    categoryId: z.string().uuid().optional(),
    startTime: z.string().datetime().optional(),
    endTime: z.string().datetime().optional(),
    timezone: z.string().optional(),
    locationType: z.enum(LOCATION_TYPES).optional(),
    venue: venueSchema.optional().nullable(),
    onlineUrl: z.string().url().optional().nullable(),
    linkedBusinessId: z.string().uuid().optional().nullable(),
    imageUrl: z.string().url().optional().nullable(),
    ticketUrl: z.string().url().optional().nullable(),
    cost: z.string().max(LIMITS.maxCostLength).optional().nullable(),
    capacity: z.number().int().positive().optional().nullable(),
    ageRestriction: z.string().max(LIMITS.maxAgeRestrictionLength).optional().nullable(),
    accessibility: z.array(z.string()).max(LIMITS.maxAccessibilityFeatures).optional(),
    status: z.enum(['ACTIVE', 'CANCELLED']).optional(), // Owner can cancel
  })
  // Validate start/end time relationship if both provided
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return new Date(data.startTime) < new Date(data.endTime);
      }
      return true;
    },
    {
      message: 'Start time must be before end time',
      path: ['endTime'],
    }
  )
  // Validate venue for location type changes
  .refine(
    (data) => {
      if (data.locationType === 'PHYSICAL' || data.locationType === 'HYBRID') {
        // venue can be undefined if locationType is unchanged and venue already exists
        return data.venue !== null;
      }
      return true;
    },
    {
      message: 'Venue is required for physical or hybrid events',
      path: ['venue'],
    }
  )
  // Validate online URL for location type changes
  .refine(
    (data) => {
      if (data.locationType === 'ONLINE' || data.locationType === 'HYBRID') {
        return data.onlineUrl !== null;
      }
      return true;
    },
    {
      message: 'Online URL is required for online or hybrid events',
      path: ['onlineUrl'],
    }
  );

// RSVP schema
export const eventRSVPSchema = z.object({
  status: z.enum(RSVP_STATUSES, {
    errorMap: () => ({ message: 'Invalid RSVP status' }),
  }),
  guestCount: z
    .number()
    .int()
    .min(1, { message: 'Guest count must be at least 1' })
    .max(LIMITS.maxGuestCount, {
      message: `Guest count cannot exceed ${LIMITS.maxGuestCount}`,
    })
    .default(1),
  notes: z
    .string()
    .max(LIMITS.maxNotesLength, {
      message: `Notes cannot exceed ${LIMITS.maxNotesLength} characters`,
    })
    .optional(),
});

// Event filter schema for listing/search
export const eventFilterSchema = z.object({
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  categoryId: z.string().uuid().optional(),
  locationType: z.enum(LOCATION_TYPES).optional(),
  distance: z.number().positive().max(100).optional(), // km
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  includePast: z.boolean().default(false),
  freeOnly: z.boolean().default(false),
  hasAccessibility: z.array(z.string()).optional(),
  linkedBusinessId: z.string().uuid().optional(),
  createdById: z.string().uuid().optional(),
  status: z.enum(EVENT_STATUSES).optional(),
  search: z.string().max(200).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().min(1).max(50).default(20),
  sort: z
    .enum(['upcoming', 'distance', 'newest', 'popular'])
    .default('upcoming'),
});

// Attendee list filter schema
export const attendeeFilterSchema = z.object({
  status: z.enum(RSVP_STATUSES).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().min(1).max(100).default(50),
});

// Export types
export type VenueInput = z.infer<typeof venueSchema>;
export type RecurrenceRuleInput = z.infer<typeof recurrenceRuleSchema>;
export type EventCreateInput = z.infer<typeof eventCreateSchema>;
export type EventUpdateInput = z.infer<typeof eventUpdateSchema>;
export type EventRSVPInput = z.infer<typeof eventRSVPSchema>;
export type EventFilterInput = z.infer<typeof eventFilterSchema>;
export type AttendeeFilterInput = z.infer<typeof attendeeFilterSchema>;
