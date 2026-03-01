/**
 * Search Controller
 * Phase 5: Search & Discovery
 *
 * Handles HTTP requests for search endpoints
 */

import type { Request, Response, NextFunction } from 'express';
import { searchBusinesses, getAutocompleteSuggestions } from '../services/search-service.js';
import { sendSuccess } from '../utils/api-response.js';
import { logger } from '../utils/logger.js';
import type { SearchParams } from '@community-hub/shared';

/**
 * GET /api/v1/search/businesses
 * Search businesses with filters and sorting
 */
export async function handleSearchBusinesses(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Query params are already validated by middleware
    const params = req.query as unknown as SearchParams;

    // Get user ID from request (set by optional auth middleware)
    const userId = (req as any).user?.id;

    const results = await searchBusinesses(params, userId);

    sendSuccess(res, results);
  } catch (error) {
    logger.error({ error }, 'Search businesses failed');
    next(error);
  }
}

/**
 * GET /api/v1/search/suggestions
 * Get autocomplete suggestions
 */
export async function handleAutocompleteSuggestions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { q, limit } = req.query;

    // Get user ID from request (set by optional auth middleware)
    const userId = (req as any).user?.id;

    const results = await getAutocompleteSuggestions(
      q as string,
      limit ? parseInt(limit as string) : 10,
      userId
    );

    sendSuccess(res, results);
  } catch (error) {
    logger.error({ error }, 'Autocomplete failed');
    next(error);
  }
}

/**
 * GET /api/v1/search/events
 * Search events (stub for Phase 8)
 */
export async function handleSearchEvents(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // TODO: Implement in Phase 8 (Events System)
    sendSuccess(res, {
      results: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/search/all
 * Combined search across all content types
 */
export async function handleSearchAll(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const params = req.query as unknown as SearchParams;

    // Get user ID from request (set by optional auth middleware)
    const userId = (req as any).user?.id;

    // Search businesses
    const businesses = await searchBusinesses(params, userId);

    // TODO: Search events (Phase 8)
    const events = { results: [], total: 0 };

    sendSuccess(res, {
      businesses: businesses.results,
      events: events.results,
      total: businesses.total + events.total,
    });
  } catch (error) {
    logger.error({ error }, 'Search all failed');
    next(error);
  }
}
