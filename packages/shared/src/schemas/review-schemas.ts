import { z } from 'zod';
import { getPlatformConfig } from '../config/platform-config.js';

const config = getPlatformConfig();

export const reviewCreateSchema = z.object({
  businessId: z.string().uuid({ message: 'Invalid business ID' }),
  rating: z.number().int().min(1).max(5, { message: 'Rating must be between 1 and 5' }),
  title: z.string().max(100, { message: 'Title cannot exceed 100 characters' }).optional(),
  content: z
    .string()
    .min(config.limits.minReviewLength, {
      message: `Review must be at least ${config.limits.minReviewLength} characters`,
    })
    .max(config.limits.maxReviewLength, {
      message: `Review cannot exceed ${config.limits.maxReviewLength} characters`,
    }),
  photos: z
    .array(
      z.object({
        url: z.string().url({ message: 'Invalid photo URL' }),
        altText: z.string().max(200, { message: 'Alt text cannot exceed 200 characters' }),
      })
    )
    .max(config.limits.maxReviewPhotos, {
      message: `Cannot upload more than ${config.limits.maxReviewPhotos} photos`,
    })
    .optional(),
});

export const reviewUpdateSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  title: z.string().max(100).optional(),
  content: z
    .string()
    .min(config.limits.minReviewLength)
    .max(config.limits.maxReviewLength)
    .optional(),
});

export const businessResponseSchema = z.object({
  response: z
    .string()
    .min(10, { message: 'Response must be at least 10 characters' })
    .max(config.limits.businessResponseMaxLength, {
      message: `Response cannot exceed ${config.limits.businessResponseMaxLength} characters`,
    }),
});

export const reportReviewSchema = z.object({
  reason: z.enum(['SPAM', 'INAPPROPRIATE', 'FAKE', 'HARASSMENT', 'OTHER'], {
    errorMap: () => ({ message: 'Invalid report reason' }),
  }),
  details: z.string().max(500, { message: 'Details cannot exceed 500 characters' }).optional(),
});

export const savedBusinessSchema = z.object({
  businessId: z.string().uuid({ message: 'Invalid business ID' }),
  listId: z.string().uuid({ message: 'Invalid list ID' }).optional().nullable(),
  notes: z.string().max(500, { message: 'Notes cannot exceed 500 characters' }).optional().nullable(),
});

export const createListSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'List name is required' })
    .max(config.limits.maxListNameLength, {
      message: `List name cannot exceed ${config.limits.maxListNameLength} characters`,
    }),
});

export const updateListSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'List name is required' })
    .max(config.limits.maxListNameLength, {
      message: `List name cannot exceed ${config.limits.maxListNameLength} characters`,
    }),
});

export const moderationApproveSchema = z.object({
  notes: z.string().max(500).optional().nullable(),
});

export const moderationRejectSchema = z.object({
  reason: z.string().min(1, { message: 'Rejection reason is required' }),
  notes: z.string().max(500).optional().nullable(),
});

export type ReviewCreateInput = z.infer<typeof reviewCreateSchema>;
export type ReviewUpdateInput = z.infer<typeof reviewUpdateSchema>;
export type BusinessResponseInput = z.infer<typeof businessResponseSchema>;
export type ReportReviewInput = z.infer<typeof reportReviewSchema>;
export type SavedBusinessInput = z.infer<typeof savedBusinessSchema>;
export type CreateListInput = z.infer<typeof createListSchema>;
export type UpdateListInput = z.infer<typeof updateListSchema>;
export type ModerationApproveInput = z.infer<typeof moderationApproveSchema>;
export type ModerationRejectInput = z.infer<typeof moderationRejectSchema>;
