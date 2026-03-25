import { z } from 'zod';

/**
 * Admin validation schemas
 * Phase 15: Admin Dashboard
 * Spec §23: Administration & Moderation
 */

// ─── User Management Schemas ─────────────────────────────────

export const USER_ROLES = ['COMMUNITY', 'BUSINESS_OWNER', 'MODERATOR', 'CURATOR', 'ADMIN', 'SUPER_ADMIN'] as const;
export const USER_STATUSES = ['ACTIVE', 'SUSPENDED', 'PENDING', 'DELETED'] as const;
export const BUSINESS_STATUSES = ['ACTIVE', 'PENDING', 'SUSPENDED', 'DELETED'] as const;

export const updateUserRoleSchema = z.object({
  role: z.enum(USER_ROLES, {
    errorMap: () => ({ message: 'Invalid user role' }),
  }),
});

export const suspendUserSchema = z.object({
  reason: z
    .string()
    .min(10, { message: 'Suspension reason must be at least 10 characters' })
    .max(500, { message: 'Suspension reason cannot exceed 500 characters' }),
});

export const adminUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  role: z.enum(USER_ROLES).optional(),
  status: z.enum(USER_STATUSES).optional(),
  search: z.string().max(100).optional(),
  sort: z.enum(['newest', 'oldest', 'name', 'lastLogin']).default('newest'),
});

// ─── Business Management Schemas ─────────────────────────────

export const updateBusinessStatusSchema = z.object({
  status: z.enum(BUSINESS_STATUSES, {
    errorMap: () => ({ message: 'Invalid business status' }),
  }),
  reason: z.string().max(500).optional(),
});

export const adminBusinessesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(BUSINESS_STATUSES).optional(),
  category: z.string().uuid().optional(),
  claimed: z.coerce.boolean().optional(),
  search: z.string().max(100).optional(),
  sort: z.enum(['newest', 'oldest', 'name', 'rating']).default('newest'),
});

// ─── Analytics Schemas ───────────────────────────────────────

export const adminAnalyticsQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  granularity: z.enum(['day', 'week', 'month']).default('day'),
});

// ─── Event Management Schemas ────────────────────────────────

export const adminEventsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['PENDING', 'ACTIVE', 'CANCELLED', 'PAST']).optional(),
  search: z.string().max(100).optional(),
  sort: z.enum(['newest', 'oldest', 'upcoming', 'title']).default('newest'),
});

// ─── User Creation Schema ────────────────────────────────────

const ASSIGNABLE_ROLES = ['COMMUNITY', 'BUSINESS_OWNER', 'MODERATOR', 'CURATOR', 'ADMIN'] as const;

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters').max(100),
  role: z.enum(ASSIGNABLE_ROLES, {
    errorMap: () => ({ message: 'Invalid user role' }),
  }),
});

// ─── Business Owner Assignment Schema ────────────────────────

export const assignBusinessOwnerSchema = z.object({
  userId: z.string().uuid().nullable(),
});

// ─── Export Types ────────────────────────────────────────────

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
export type SuspendUserInput = z.infer<typeof suspendUserSchema>;
export type AdminUsersQuery = z.infer<typeof adminUsersQuerySchema>;
export type UpdateBusinessStatusInput = z.infer<typeof updateBusinessStatusSchema>;
export type AdminBusinessesQuery = z.infer<typeof adminBusinessesQuerySchema>;
export type AdminAnalyticsQuery = z.infer<typeof adminAnalyticsQuerySchema>;
export type AdminEventsQuery = z.infer<typeof adminEventsQuerySchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type AssignBusinessOwnerInput = z.infer<typeof assignBusinessOwnerSchema>;
