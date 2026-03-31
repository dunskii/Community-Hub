import { z } from 'zod';

/**
 * Business Analytics validation schemas
 * Phase 7: Business Owner Features
 *
 * Spec §13.4: Business Analytics
 */

// Date range validation
const dateSchema = z.string().refine(
  (val) => !isNaN(Date.parse(val)),
  { message: 'Invalid date format. Use ISO 8601 (e.g., 2026-03-01)' }
);

// Granularity options
export const granularitySchema = z.enum(['day', 'week', 'month']).optional();

// Event types for tracking
export const analyticsEventTypeSchema = z.enum([
  'PROFILE_VIEW',
  'SEARCH_APPEARANCE',
  'WEBSITE_CLICK',
  'PHONE_CLICK',
  'DIRECTIONS_CLICK',
  'PHOTO_VIEW',
  'SAVE',
  'UNSAVE',
  'REVIEW_CREATED',
  'MESSAGE_SENT',
]);

// Referral sources
export const referralSourceSchema = z.enum([
  'search',
  'homepage',
  'saved_list',
  'direct',
  'external',
]);

/**
 * Analytics query schema
 */
export const analyticsQuerySchema = z.object({
  startDate: dateSchema,
  endDate: dateSchema,
  granularity: granularitySchema,
}).refine(
  (data) => new Date(data.startDate) <= new Date(data.endDate),
  { message: 'Start date must be before or equal to end date', path: ['startDate'] }
).refine(
  (data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 1095; // 3 years
  },
  { message: 'Date range cannot exceed 3 years', path: ['endDate'] }
);

/**
 * Analytics export schema
 */
export const analyticsExportSchema = z.object({
  startDate: dateSchema,
  endDate: dateSchema,
  format: z.enum(['csv', 'pdf']).default('csv'),
});

/**
 * Track event schema
 */
export const trackEventSchema = z.object({
  eventType: analyticsEventTypeSchema,
  referralSource: referralSourceSchema.optional(),
  searchTerm: z.string().max(200).optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Inbox analytics query schema
 */
export const inboxAnalyticsQuerySchema = z.object({
  period: z.enum(['today', 'last_7_days', 'last_30_days', 'last_12_months']).default('last_30_days'),
});

// Export types
export type Granularity = z.infer<typeof granularitySchema>;
export type AnalyticsEventType = z.infer<typeof analyticsEventTypeSchema>;
export type ReferralSource = z.infer<typeof referralSourceSchema>;
export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>;
export type AnalyticsExportInput = z.infer<typeof analyticsExportSchema>;
export type TrackEventInput = z.infer<typeof trackEventSchema>;
export type InboxAnalyticsQueryInput = z.infer<typeof inboxAnalyticsQuerySchema>;
