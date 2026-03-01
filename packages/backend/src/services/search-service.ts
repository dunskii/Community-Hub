/**
 * Search Service
 * Phase 5: Search & Discovery
 *
 * Business logic layer for search functionality
 */

import { getEsClient } from '../search/elasticsearch-client.js';
import { buildSearchQuery, buildAutocompleteQuery } from '../search/query-builder.js';
import type { SearchParams, SearchResponse, BusinessSearchResult, AutocompleteResponse } from '@community-hub/shared';
import { logger } from '../utils/logger.js';
import {
  addRecentSearch,
  getRecentSearches,
  trackPopularSearch,
  getPopularSearches,
} from '../utils/search-cache.js';

interface ElasticsearchHit {
  _source: {
    id: string;
    name: string;
    description: string;
    categorySlug: string;
    rating?: number;
    reviewCount?: number;
    verified?: boolean;
    featured?: boolean;
  };
  highlight?: {
    name?: string[];
    description?: string[];
  };
  sort?: number[];
}

/**
 * Search businesses using Elasticsearch
 */
export async function searchBusinesses(
  params: SearchParams,
  userId?: string
): Promise<SearchResponse<BusinessSearchResult>> {
  const client = getEsClient();
  const esQuery = buildSearchQuery(params);

  // Track search query for analytics (async, non-blocking)
  if (params.q) {
    trackPopularSearch(params.q).catch((err) =>
      logger.debug('Failed to track popular search', err)
    );

    // Track recent searches for authenticated users
    if (userId) {
      addRecentSearch(userId, params.q).catch((err) =>
        logger.debug('Failed to add recent search', err)
      );
    }
  }

  try {
    // @ts-expect-error - Elasticsearch types don't match our simplified query builder types
    const result = await client.search(esQuery);

    // Format results
    const results: BusinessSearchResult[] = result.hits.hits.map((hit: unknown) => {
      const esHit = hit as ElasticsearchHit;
      const source = esHit._source;
      const highlights = esHit.highlight || {};

      // Extract distance from sort results (if sorted by distance)
      let distance: number | undefined;
      if (params.sort === 'distance' && esHit.sort && esHit.sort[0]) {
        distance = Math.round(esHit.sort[0] * 10) / 10; // Round to 1 decimal
      }

      return {
        id: source.id,
        name: source.name,
        description: source.description,
        categorySlug: source.categorySlug,
        categoryName: source.categorySlug, // TODO: Resolve category name from DB
        rating: source.rating || 0,
        reviewCount: source.reviewCount || 0,
        distance,
        photos: [], // TODO: Fetch photos from business in Phase 6
        verified: source.verified || false,
        featured: source.featured || false,
        highlights: {
          name: highlights.name?.[0],
          description: highlights.description?.[0],
        },
      };
    });

    // Get total count
    const total = typeof result.hits.total === 'number'
      ? result.hits.total
      : result.hits.total?.value ?? 0;

    const page = params.page || 1;
    const limit = params.limit || 20;
    const totalPages = Math.ceil(total / limit);

    return {
      results,
      total,
      page,
      limit,
      totalPages,
    };
  } catch (error) {
    logger.error({ error }, 'Elasticsearch search failed');

    // Graceful degradation: return empty results if ES fails
    return {
      results: [],
      total: 0,
      page: params.page || 1,
      limit: params.limit || 20,
      totalPages: 0,
    };
  }
}

/**
 * Get autocomplete suggestions
 */
export async function getAutocompleteSuggestions(
  q: string,
  limit: number = 10,
  userId?: string
): Promise<AutocompleteResponse> {
  const client = getEsClient();
  const esQuery = buildAutocompleteQuery(q, limit);

  try {
    // @ts-expect-error - Elasticsearch types don't match our simplified query builder types
    const result = await client.search(esQuery);

    const suggestions = result.hits.hits.map((hit: unknown) => {
      const esHit = hit as ElasticsearchHit;
      return {
        type: 'business' as const,
        id: esHit._source.id,
        name: esHit._source.name,
        categoryName: esHit._source.categorySlug, // TODO: Resolve category name
      };
    });

    // Fetch recent searches (authenticated users only)
    const recentSearches = userId ? await getRecentSearches(userId) : [];

    // Fetch popular searches (all users)
    const popularSearches = await getPopularSearches(10);

    return {
      suggestions,
      recentSearches,
      popularSearches,
    };
  } catch (error) {
    logger.error({ error }, 'Autocomplete failed');

    // Graceful degradation
    return {
      suggestions: [],
      recentSearches: [],
      popularSearches: [],
    };
  }
}

/**
 * Apply service-layer filters (openNow, hasPromotions, hasEvents)
 * These require database JOINs and cannot be done in Elasticsearch
 */
export async function applyServiceLayerFilters(
  businessIds: string[],
  params: SearchParams
): Promise<string[]> {
  let filteredIds = businessIds;

  // Filter: Open Now
  if (params.openNow) {
    // TODO: Implement in Phase 6 when we have operating hours + timezone
    // For now, skip this filter
    logger.debug('Open Now filter not yet implemented');
  }

  // Filter: Has Promotions
  if (params.hasPromotions) {
    // TODO: Implement in Phase 10 when Deal entity exists
    // Query: SELECT DISTINCT business_id FROM Deal WHERE valid_until > NOW()
    logger.debug('Has Promotions filter not yet implemented');
  }

  // Filter: Has Events
  if (params.hasEvents) {
    // TODO: Implement in Phase 8 when Event entity exists
    // Query: SELECT DISTINCT business_id FROM Event WHERE event_start > NOW()
    logger.debug('Has Events filter not yet implemented');
  }

  return filteredIds;
}
