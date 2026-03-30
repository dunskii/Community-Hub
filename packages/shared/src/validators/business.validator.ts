/**
 * Business validation schemas using Zod
 */

import { z } from 'zod';
import { validateAustralianPhone } from '../utils/phone-validator.js';
import { validateAustralianPostcode } from '../utils/postcode-validator.js';
import {
  BusinessStatus,
  PriceRange,
  CERTIFICATIONS,
  PAYMENT_METHODS,
  ACCESSIBILITY_FEATURES,
  GALLERY_CATEGORIES,
} from '../constants/business.constants.js';

// Address schema
export const addressSchema = z.object({
  street: z.string().min(5, 'Street address must be at least 5 characters').max(255),
  suburb: z.string().min(2, 'Suburb must be at least 2 characters').max(100),
  state: z.string().default('NSW'),
  postcode: z
    .string()
    .regex(/^\d{4}$/, 'Postcode must be exactly 4 digits')
    .refine((val) => validateAustralianPostcode(val), {
      message: 'Invalid Australian postcode',
    }),
  country: z.string().default('Australia'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

// Day hours schema
const dayHoursSchema = z.object({
  open: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (use HH:MM)'),
  close: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (use HH:MM)'),
  closed: z.boolean(),
  byAppointment: z.boolean(),
});

// Operating hours schema
export const operatingHoursSchema = z.object({
  monday: dayHoursSchema,
  tuesday: dayHoursSchema,
  wednesday: dayHoursSchema,
  thursday: dayHoursSchema,
  friday: dayHoursSchema,
  saturday: dayHoursSchema,
  sunday: dayHoursSchema,
  publicHolidays: dayHoursSchema,
  specialNotes: z.string().max(500).optional(),
});

// Social links schema with URL normalization
export const socialLinksSchema = z.object({
  facebook: z
    .string()
    .url('Invalid Facebook URL')
    .transform((url) => url.toLowerCase())
    .optional(),
  instagram: z
    .string()
    .url('Invalid Instagram URL')
    .or(z.string().regex(/^@\w+$/))
    .transform((val) => val.toLowerCase())
    .optional(),
  twitter: z
    .string()
    .url('Invalid Twitter URL')
    .or(z.string().regex(/^@\w+$/))
    .transform((val) => val.toLowerCase())
    .optional(),
  tiktok: z
    .string()
    .url('Invalid TikTok URL')
    .or(z.string().regex(/^@\w+$/))
    .transform((val) => val.toLowerCase())
    .optional(),
  linkedin: z
    .string()
    .url('Invalid LinkedIn URL')
    .transform((url) => url.toLowerCase())
    .optional(),
  youtube: z
    .string()
    .url('Invalid YouTube URL')
    .transform((url) => url.toLowerCase())
    .optional(),
  googleBusiness: z
    .string()
    .url('Invalid Google Business URL')
    .transform((url) => url.toLowerCase())
    .optional(),
});

// Gallery photo schema
export const galleryPhotoSchema = z.object({
  url: z.string().refine(
    (val) => val.startsWith('/uploads/') || /^https?:\/\//.test(val),
    'Photo must be a local upload path or valid URL',
  ),
  alt: z.string().min(1).max(200, 'Alt text must be at most 200 characters'),
  category: z.enum(GALLERY_CATEGORIES as unknown as [string, ...string[]]),
  order: z.number().int().min(0),
});

// Business create schema
export const businessCreateSchema = z.object({
  name: z.string().min(2, 'Business name must be at least 2 characters').max(100),
  description: z.record(z.string(), z.string().min(10).max(2000)),
  categoryPrimaryId: z.string().uuid('Invalid category ID'),
  categoriesSecondary: z.array(z.string().uuid()).max(3, 'Maximum 3 secondary categories').optional(),
  address: addressSchema.omit({ latitude: true, longitude: true }), // Coordinates added by geocoding
  phone: z.string().refine((val) => validateAustralianPhone(val), {
    message: 'Invalid Australian phone number format',
  }),
  email: z
    .string()
    .email('Invalid email format')
    .toLowerCase()
    .trim()
    .optional(),
  website: z
    .string()
    .url('Invalid website URL')
    .transform((url) => {
      // Normalize URL: add https:// if missing protocol
      if (!url.match(/^https?:\/\//i)) {
        return `https://${url}`;
      }
      return url.toLowerCase();
    })
    .optional(),
  secondaryPhone: z
    .string()
    .min(1, 'Secondary phone cannot be empty if provided')
    .refine((val) => validateAustralianPhone(val), {
      message: 'Invalid Australian phone number format',
    })
    .optional(),
  operatingHours: operatingHoursSchema.optional(),
  socialLinks: socialLinksSchema.optional(),
  languagesSpoken: z.array(z.string()).default([]),
  certifications: z
    .array(z.enum(CERTIFICATIONS as unknown as [string, ...string[]]))
    .default([]),
  paymentMethods: z
    .array(z.enum(PAYMENT_METHODS as unknown as [string, ...string[]]))
    .default([]),
  accessibilityFeatures: z
    .array(z.enum(ACCESSIBILITY_FEATURES as unknown as [string, ...string[]]))
    .default([]),
  priceRange: z.nativeEnum(PriceRange).optional(),
  parkingInformation: z.string().max(500).optional(),
  yearEstablished: z
    .number()
    .int()
    .min(1800)
    .max(new Date().getFullYear())
    .optional(),
  coverPhoto: z.string().refine(
    (val) => val.startsWith('/uploads/') || /^https?:\/\//.test(val),
    'Cover photo must be a local upload path or valid URL',
  ).optional(),
  photos: z.array(z.string().refine(
    (val) => val.startsWith('/uploads/') || /^https?:\/\//.test(val),
    'Photo must be a local upload path or valid URL',
  )).max(50, 'Maximum 50 photos').optional(),
});

// Business update schema (all fields optional except protected ones)
export const businessUpdateSchema = businessCreateSchema.partial().omit({
  // Remove protected fields that can't be updated by business owner
});

// Admin can update status
export const businessStatusUpdateSchema = z.object({
  status: z.nativeEnum(BusinessStatus),
});

export type BusinessCreateInput = z.infer<typeof businessCreateSchema>;
export type BusinessUpdateInput = z.infer<typeof businessUpdateSchema>;
export type BusinessStatusUpdateInput = z.infer<typeof businessStatusUpdateSchema>;
