import { z } from 'zod';

/**
 * Deal validation schemas
 * Phase 10: Promotions & Deals MVP
 * Spec §17: Deals & Promotions
 *
 * Note: Validation limits are hardcoded here to avoid circular dependencies.
 * These should match the values in platform.json limits section.
 */

// Default limits
const LIMITS = {
  maxTitleLength: 100,
  minDescriptionLength: 10,
  maxDescriptionLength: 500,
  maxDurationLength: 100,
  maxVoucherCodeLength: 50,
  maxTermsLength: 500,
  maxActiveDealsPerBusiness: 5,
  maxPercentageDiscount: 100,
} as const;

// Discount type enum values
export const DISCOUNT_TYPES = ['PERCENTAGE', 'FIXED', 'BOGO', 'FREE_ITEM'] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

// Deal status enum values
export const DEAL_STATUSES = ['ACTIVE', 'EXPIRED', 'CANCELLED'] as const;
export type DealStatus = (typeof DEAL_STATUSES)[number];

// Deal creation schema
export const dealCreateSchema = z
  .object({
    title: z
      .string()
      .min(1, { message: 'Title is required' })
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
    price: z
      .number()
      .positive({ message: 'Price must be positive' })
      .max(999999.99, { message: 'Price is too large' })
      .optional(),
    originalPrice: z
      .number()
      .positive({ message: 'Original price must be positive' })
      .max(999999.99, { message: 'Original price is too large' })
      .optional(),
    discountType: z
      .enum(DISCOUNT_TYPES, {
        errorMap: () => ({ message: 'Invalid discount type' }),
      })
      .optional(),
    discountValue: z
      .number()
      .min(0, { message: 'Discount value cannot be negative' })
      .max(LIMITS.maxPercentageDiscount, {
        message: `Discount value cannot exceed ${LIMITS.maxPercentageDiscount}`,
      })
      .optional(),
    duration: z
      .string()
      .max(LIMITS.maxDurationLength, {
        message: `Duration cannot exceed ${LIMITS.maxDurationLength} characters`,
      })
      .optional(),
    voucherCode: z
      .string()
      .max(LIMITS.maxVoucherCodeLength, {
        message: `Voucher code cannot exceed ${LIMITS.maxVoucherCodeLength} characters`,
      })
      .optional(),
    image: z.string().refine(
      (val) => val.startsWith('/uploads/') || /^https?:\/\//.test(val),
      { message: 'Image must be a local upload path or valid URL' },
    ).optional(),
    terms: z
      .string()
      .max(LIMITS.maxTermsLength, {
        message: `Terms cannot exceed ${LIMITS.maxTermsLength} characters`,
      })
      .optional(),
    validFrom: z.string().datetime({ message: 'Invalid start date format' }),
    validUntil: z.string().datetime({ message: 'Invalid end date format' }),
    featured: z.boolean().default(false),
  })
  // Validate start date is before end date
  .refine((data) => new Date(data.validFrom) < new Date(data.validUntil), {
    message: 'Start date must be before end date',
    path: ['validUntil'],
  })
  // Validate price is less than original price if both provided
  .refine(
    (data) => {
      if (data.price && data.originalPrice) {
        return data.price < data.originalPrice;
      }
      return true;
    },
    {
      message: 'Promotional price must be less than original price',
      path: ['price'],
    }
  )
  // Validate discount value for percentage type
  .refine(
    (data) => {
      if (data.discountType === 'PERCENTAGE' && data.discountValue) {
        return data.discountValue <= 100;
      }
      return true;
    },
    {
      message: 'Percentage discount cannot exceed 100%',
      path: ['discountValue'],
    }
  );

// Deal update schema (partial)
export const dealUpdateSchema = z
  .object({
    title: z.string().min(1).max(LIMITS.maxTitleLength).optional(),
    description: z
      .string()
      .min(LIMITS.minDescriptionLength)
      .max(LIMITS.maxDescriptionLength)
      .optional(),
    price: z.number().positive().max(999999.99).optional().nullable(),
    originalPrice: z.number().positive().max(999999.99).optional().nullable(),
    discountType: z.enum(DISCOUNT_TYPES).optional().nullable(),
    discountValue: z.number().min(0).max(LIMITS.maxPercentageDiscount).optional().nullable(),
    duration: z.string().max(LIMITS.maxDurationLength).optional().nullable(),
    voucherCode: z.string().max(LIMITS.maxVoucherCodeLength).optional().nullable(),
    image: z.string().refine(
      (val) => val.startsWith('/uploads/') || /^https?:\/\//.test(val),
      { message: 'Image must be a local upload path or valid URL' },
    ).optional().nullable(),
    terms: z.string().max(LIMITS.maxTermsLength).optional().nullable(),
    validFrom: z.string().datetime().optional(),
    validUntil: z.string().datetime().optional(),
    featured: z.boolean().optional(),
    status: z.enum(['ACTIVE', 'CANCELLED']).optional(),
  })
  // Validate start/end date relationship if both provided
  .refine(
    (data) => {
      if (data.validFrom && data.validUntil) {
        return new Date(data.validFrom) < new Date(data.validUntil);
      }
      return true;
    },
    {
      message: 'Start date must be before end date',
      path: ['validUntil'],
    }
  )
  // Validate price is less than original price if both provided
  .refine(
    (data) => {
      if (data.price && data.originalPrice) {
        return data.price < data.originalPrice;
      }
      return true;
    },
    {
      message: 'Promotional price must be less than original price',
      path: ['price'],
    }
  );

// Deal filter schema for listing
export const dealFilterSchema = z.object({
  status: z.enum(DEAL_STATUSES).optional(),
  featured: z.boolean().optional(),
  businessId: z.string().uuid().optional(),
  validNow: z.boolean().default(true),
  page: z.number().int().positive().default(1),
  limit: z.number().int().min(1).max(50).default(20),
  sort: z.enum(['newest', 'endingSoon', 'featured', 'discount']).default('newest'),
});

// Export types
export type DealCreateInput = z.infer<typeof dealCreateSchema>;
export type DealUpdateInput = z.infer<typeof dealUpdateSchema>;
export type DealFilterInput = z.infer<typeof dealFilterSchema>;

// Deal interface for API responses
export interface Deal {
  id: string;
  businessId: string;
  title: string;
  description: string;
  price: number | null;
  originalPrice: number | null;
  discountType: DiscountType | null;
  discountValue: number | null;
  duration: string | null;
  voucherCode: string | null;
  image: string | null;
  terms: string | null;
  validFrom: string;
  validUntil: string;
  featured: boolean;
  status: DealStatus;
  views: number;
  clicks: number;
  voucherReveals: number;
  createdAt: string;
  updatedAt: string;
  business?: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
  };
}

// Export limits for use in components
export const DEAL_LIMITS = LIMITS;
