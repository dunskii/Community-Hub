/**
 * Social Media Auto-Posting Validation Schemas
 *
 * Spec §20: Social Media Integration
 */

import { z } from 'zod';
import { SOCIAL_PLATFORMS, SOCIAL_CONTENT_TYPES } from '../types/social.js';

export const socialPlatformSchema = z.enum(SOCIAL_PLATFORMS);

export const socialContentTypeSchema = z.enum(SOCIAL_CONTENT_TYPES);

/** Validate social post creation */
export const socialPostCreateSchema = z.object({
  platforms: z
    .array(socialPlatformSchema)
    .min(1, 'Select at least one platform')
    .max(5, 'Maximum 5 platforms'),
  contentType: socialContentTypeSchema,
  contentId: z.string().uuid('Invalid content ID'),
  caption: z
    .string()
    .max(2200, 'Caption cannot exceed 2200 characters')
    .optional(),
  imageUrl: z
    .string()
    .url('Invalid image URL')
    .max(500)
    .optional(),
  scheduledAt: z
    .string()
    .datetime({ message: 'Invalid datetime format' })
    .optional()
    .refine(
      (val) => !val || new Date(val) > new Date(),
      'Scheduled time must be in the future'
    ),
});

/** Validate account toggle */
export const socialAccountToggleSchema = z.object({
  isActive: z.boolean(),
});

/** Validate caption preview request */
export const captionPreviewSchema = z.object({
  contentType: socialContentTypeSchema,
  contentId: z.string().uuid('Invalid content ID'),
  platform: socialPlatformSchema,
});

/** Validate social post list filters */
export const socialPostFilterSchema = z.object({
  status: z.enum(['PENDING', 'QUEUED', 'PUBLISHING', 'PUBLISHED', 'FAILED', 'CANCELLED']).optional(),
  platform: socialPlatformSchema.optional(),
  contentType: socialContentTypeSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

/** GBP profile data schema — validates the shape of data from the GBP API (§26.1) */
const gbpAddressSchema = z.object({
  street: z.string().max(200),
  suburb: z.string().max(100),
  state: z.string().max(50),
  postcode: z.string().max(20),
  country: z.string().max(50),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
}).strict();

const gbpHoursEntrySchema = z.object({
  open: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format'),
  close: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format'),
  closed: z.boolean(),
}).strict();

const gbpPhotoSchema = z.object({
  url: z.string().url().max(500),
  category: z.string().max(50),
}).strict();

export const gbpProfileDataSchema = z.object({
  name: z.string().max(100).optional(),
  phone: z.string().max(30).optional(),
  website: z.string().url().max(500).optional(),
  description: z.string().max(5000).optional(),
  address: gbpAddressSchema.optional(),
  operatingHours: z.record(gbpHoursEntrySchema).optional(),
  categories: z.array(z.string().max(100)).max(20).optional(),
  photos: z.array(gbpPhotoSchema).max(50).optional(),
}).strict();

/** Validate GBP sync apply request (§26.1) */
export const gbpSyncApplySchema = z.object({
  fields: z
    .array(z.enum(['name', 'phone', 'website', 'description', 'address', 'operatingHours', 'categories', 'photos']))
    .min(1, 'Select at least one field to sync'),
  gbpData: gbpProfileDataSchema,
});

// Inferred types
export type SocialPostCreateInput = z.infer<typeof socialPostCreateSchema>;
export type SocialAccountToggleInput = z.infer<typeof socialAccountToggleSchema>;
export type CaptionPreviewInput = z.infer<typeof captionPreviewSchema>;
export type SocialPostFilterInput = z.infer<typeof socialPostFilterSchema>;
export type GbpSyncApplyInput = z.infer<typeof gbpSyncApplySchema>;
