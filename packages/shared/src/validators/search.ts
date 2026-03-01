/**
 * Search validation schemas
 * Phase 5: Search & Discovery
 */

import { z } from 'zod';

export const searchBusinessesSchema = z.object({
  // Text search
  q: z.string().min(1).max(100).optional(),

  // Filters
  category: z.union([z.string(), z.array(z.string())]).optional(),
  distance: z.coerce.number().min(0.5).max(25).optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  openNow: z.coerce.boolean().optional(),
  languages: z.union([z.string(), z.array(z.string())]).optional().transform((val) => {
    if (typeof val === 'string') return [val];
    return val;
  }),
  priceRange: z.union([
    z.coerce.number().min(1).max(4),
    z.array(z.coerce.number().min(1).max(4)),
  ]).optional().transform((val) => {
    if (typeof val === 'number') return [val];
    return val;
  }),
  rating: z.coerce.number().min(0).max(5).optional(),
  certifications: z.union([z.string(), z.array(z.string())]).optional().transform((val) => {
    if (typeof val === 'string') return [val];
    return val;
  }),
  accessibilityFeatures: z.union([z.string(), z.array(z.string())]).optional().transform((val) => {
    if (typeof val === 'string') return [val];
    return val;
  }),
  hasPromotions: z.coerce.boolean().optional(),
  hasEvents: z.coerce.boolean().optional(),
  verifiedOnly: z.coerce.boolean().optional(),

  // Sort
  sort: z.enum(['relevance', 'distance', 'rating', 'reviews', 'updated', 'name', 'newest']).optional(),

  // Pagination
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});

export const autocompleteSuggestionsSchema = z.object({
  q: z.string().min(1).max(100),
  limit: z.coerce.number().min(1).max(20).optional(),
});
