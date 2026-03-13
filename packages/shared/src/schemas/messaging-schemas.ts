import { z } from 'zod';

/**
 * Messaging validation schemas
 * Phase 9: Messaging System
 * Spec §16: Messaging & Communication System
 *
 * Note: Validation limits are hardcoded here to avoid circular dependencies.
 * These should match the values in platform.json limits section.
 */

// Default limits (Spec §16.1)
const LIMITS = {
  minSubjectLength: 5,
  maxSubjectLength: 200,
  minMessageLength: 1,
  maxMessageLength: 1000,
  maxAttachments: 3,
  maxAttachmentSizeBytes: 5 * 1024 * 1024, // 5MB
  minQuickReplyNameLength: 1,
  maxQuickReplyNameLength: 50,
  maxQuickReplyContentLength: 1000,
  maxSearchLength: 100,
  maxReportDetailsLength: 500,
} as const;

// Subject category enum values (Spec §16.1)
export const SUBJECT_CATEGORIES = [
  'GENERAL',
  'PRODUCT_QUESTION',
  'BOOKING',
  'FEEDBACK',
  'OTHER',
] as const;
export type SubjectCategory = (typeof SUBJECT_CATEGORIES)[number];

// Conversation status enum values (Spec §16.2)
export const CONVERSATION_STATUSES = ['ACTIVE', 'ARCHIVED', 'BLOCKED'] as const;
export type ConversationStatus = (typeof CONVERSATION_STATUSES)[number];

// Sender type enum values (Spec A.5)
export const SENDER_TYPES = ['USER', 'BUSINESS'] as const;
export type SenderType = (typeof SENDER_TYPES)[number];

// Preferred contact method (optional field)
export const PREFERRED_CONTACTS = ['email', 'phone', 'message'] as const;
export type PreferredContact = (typeof PREFERRED_CONTACTS)[number];

// Report reasons (reusing from moderation)
export const MESSAGE_REPORT_REASONS = ['SPAM', 'INAPPROPRIATE', 'HARASSMENT', 'OTHER'] as const;
export type MessageReportReason = (typeof MESSAGE_REPORT_REASONS)[number];

// Allowed MIME types for attachments
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

// ─── Attachment Schema ────────────────────────────────────────

export const messageAttachmentSchema = z.object({
  url: z.string().url({ message: 'Invalid attachment URL' }),
  altText: z
    .string()
    .max(200, { message: 'Alt text cannot exceed 200 characters' })
    .optional(),
  sizeBytes: z
    .number()
    .int()
    .min(1, { message: 'Invalid file size' })
    .max(LIMITS.maxAttachmentSizeBytes, {
      message: `Attachment size cannot exceed ${LIMITS.maxAttachmentSizeBytes / 1024 / 1024}MB`,
    }),
  mimeType: z.enum(ALLOWED_MIME_TYPES, {
    errorMap: () => ({ message: 'Only JPEG, PNG, and WebP images are allowed' }),
  }),
});

export type MessageAttachmentInput = z.infer<typeof messageAttachmentSchema>;

// ─── Create Conversation Schema ───────────────────────────────

export const createConversationSchema = z.object({
  businessId: z.string().uuid({ message: 'Invalid business ID' }),
  subject: z
    .string()
    .min(LIMITS.minSubjectLength, {
      message: `Subject must be at least ${LIMITS.minSubjectLength} characters`,
    })
    .max(LIMITS.maxSubjectLength, {
      message: `Subject cannot exceed ${LIMITS.maxSubjectLength} characters`,
    }),
  subjectCategory: z.enum(SUBJECT_CATEGORIES, {
    errorMap: () => ({ message: 'Invalid subject category' }),
  }),
  message: z
    .string()
    .min(LIMITS.minMessageLength, { message: 'Message is required' })
    .max(LIMITS.maxMessageLength, {
      message: `Message cannot exceed ${LIMITS.maxMessageLength} characters`,
    }),
  preferredContact: z.enum(PREFERRED_CONTACTS).optional(),
  attachments: z
    .array(messageAttachmentSchema)
    .max(LIMITS.maxAttachments, {
      message: `Cannot attach more than ${LIMITS.maxAttachments} files`,
    })
    .optional(),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;

// ─── Send Message Schema ──────────────────────────────────────

export const sendMessageSchema = z.object({
  content: z
    .string()
    .min(LIMITS.minMessageLength, { message: 'Message is required' })
    .max(LIMITS.maxMessageLength, {
      message: `Message cannot exceed ${LIMITS.maxMessageLength} characters`,
    }),
  attachments: z
    .array(messageAttachmentSchema)
    .max(LIMITS.maxAttachments, {
      message: `Cannot attach more than ${LIMITS.maxAttachments} files`,
    })
    .optional(),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

// ─── Conversation Filter Schema ───────────────────────────────

export const conversationFilterSchema = z.object({
  status: z
    .enum(['active', 'archived', 'all'], {
      errorMap: () => ({ message: 'Invalid status filter' }),
    })
    .optional()
    .default('active'),
  search: z
    .string()
    .max(LIMITS.maxSearchLength, {
      message: `Search query cannot exceed ${LIMITS.maxSearchLength} characters`,
    })
    .optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export type ConversationFilterInput = z.infer<typeof conversationFilterSchema>;

// ─── Message Pagination Schema ────────────────────────────────

export const messagePaginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export type MessagePaginationInput = z.infer<typeof messagePaginationSchema>;

// ─── Report Conversation Schema ───────────────────────────────

export const reportConversationSchema = z.object({
  reason: z.enum(MESSAGE_REPORT_REASONS, {
    errorMap: () => ({ message: 'Invalid report reason' }),
  }),
  details: z
    .string()
    .max(LIMITS.maxReportDetailsLength, {
      message: `Details cannot exceed ${LIMITS.maxReportDetailsLength} characters`,
    })
    .optional(),
});

export type ReportConversationInput = z.infer<typeof reportConversationSchema>;

// ─── Quick Reply Template Schema ──────────────────────────────

export const quickReplyTemplateSchema = z.object({
  name: z
    .string()
    .min(LIMITS.minQuickReplyNameLength, { message: 'Template name is required' })
    .max(LIMITS.maxQuickReplyNameLength, {
      message: `Template name cannot exceed ${LIMITS.maxQuickReplyNameLength} characters`,
    }),
  content: z
    .string()
    .min(LIMITS.minMessageLength, { message: 'Template content is required' })
    .max(LIMITS.maxQuickReplyContentLength, {
      message: `Template content cannot exceed ${LIMITS.maxQuickReplyContentLength} characters`,
    }),
});

export type QuickReplyTemplateInput = z.infer<typeof quickReplyTemplateSchema>;

// ─── Reorder Templates Schema ─────────────────────────────────

export const reorderTemplatesSchema = z.object({
  templateIds: z
    .array(z.string().uuid({ message: 'Invalid template ID' }))
    .min(1, { message: 'At least one template ID is required' }),
});

export type ReorderTemplatesInput = z.infer<typeof reorderTemplatesSchema>;

// ─── Business Inbox Filter Schema ─────────────────────────────

export const businessInboxFilterSchema = z.object({
  status: z
    .enum(['active', 'archived', 'blocked', 'all'], {
      errorMap: () => ({ message: 'Invalid status filter' }),
    })
    .optional()
    .default('active'),
  search: z
    .string()
    .max(LIMITS.maxSearchLength, {
      message: `Search query cannot exceed ${LIMITS.maxSearchLength} characters`,
    })
    .optional(),
  unreadOnly: z.coerce.boolean().optional().default(false),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export type BusinessInboxFilterInput = z.infer<typeof businessInboxFilterSchema>;

// ─── Messaging Stats Query Schema ─────────────────────────────

export const messagingStatsQuerySchema = z.object({
  startDate: z.string().datetime({ message: 'Invalid start date' }).optional(),
  endDate: z.string().datetime({ message: 'Invalid end date' }).optional(),
});

export type MessagingStatsQueryInput = z.infer<typeof messagingStatsQuerySchema>;
