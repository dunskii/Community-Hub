/**
 * Search Routes
 * Phase 5: Search & Discovery
 *
 * RESTful API endpoints for search functionality
 */

import { Router } from 'express';
import { searchRateLimiter, apiRateLimiter } from '../middleware/rate-limiter.js';
import { validate } from '../middleware/validate.js';
import { optionalAuth } from '../middleware/auth-middleware.js';
import { searchBusinessesSchema, autocompleteSuggestionsSchema } from '@community-hub/shared';
import {
  handleSearchBusinesses,
  handleAutocompleteSuggestions,
  handleSearchEvents,
  handleSearchAll,
} from '../controllers/search-controller.js';

const router = Router();

// ─── Rate Limiters ────────────────────────────────────────────────

/**
 * Search rate limiter: 30 requests per minute (from rate-limiter.ts)
 * Per Spec §4.8 - Rate Limiting
 */

/**
 * Autocomplete rate limiter: Use apiRateLimiter (100 requests per minute)
 * Higher limit for better UX (autocomplete on every keystroke)
 */
const autocompleteRateLimiter = apiRateLimiter;

// ─── Routes ───────────────────────────────────────────────────────

/**
 * GET /api/v1/search/businesses
 * Search businesses with filters and sorting
 *
 * Query params:
 *   - q: Search query (1-100 chars)
 *   - category: Category slug(s)
 *   - distance: Radius in km (0.5-25)
 *   - lat/lng: User location
 *   - rating: Minimum rating (0-5)
 *   - languages: Languages spoken
 *   - priceRange: Price range (1-4)
 *   - certifications: Certifications
 *   - accessibilityFeatures: Accessibility features
 *   - verifiedOnly: Show only verified businesses
 *   - sort: Sort option (relevance|distance|rating|reviews|updated|name|newest)
 *   - page: Page number (default: 1)
 *   - limit: Results per page (default: 20, max: 100)
 *
 * Rate limit: 30 requests per minute
 * Public access
 */
router.get(
  '/businesses',
  searchRateLimiter,
  optionalAuth,
  validate({ query: searchBusinessesSchema }),
  handleSearchBusinesses
);

/**
 * GET /api/v1/search/suggestions
 * Get autocomplete suggestions
 *
 * Query params:
 *   - q: Search query (1-100 chars)
 *   - limit: Max suggestions (default: 10, max: 20)
 *
 * Rate limit: 60 requests per minute
 * Public access
 */
router.get(
  '/suggestions',
  autocompleteRateLimiter,
  optionalAuth,
  validate({ query: autocompleteSuggestionsSchema }),
  handleAutocompleteSuggestions
);

/**
 * GET /api/v1/search/events
 * Search events (stub for Phase 8)
 *
 * Rate limit: 30 requests per minute
 * Public access
 */
router.get(
  '/events',
  searchRateLimiter,
  handleSearchEvents
);

/**
 * GET /api/v1/search/all
 * Combined search across all content types
 *
 * Query params: Same as /businesses
 *
 * Rate limit: 30 requests per minute
 * Public access
 */
router.get(
  '/all',
  searchRateLimiter,
  optionalAuth,
  validate({ query: searchBusinessesSchema }),
  handleSearchAll
);

export default router;
