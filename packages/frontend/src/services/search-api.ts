/**
 * Search API Service
 * Phase 5: Search & Discovery
 *
 * Client-side service for search endpoints
 */

import { get } from './api-client.js';
import type {
  SearchParams,
  SearchResponse,
  BusinessSearchResult,
  AutocompleteResponse,
} from '@community-hub/shared';

/**
 * Build query string from search params
 */
function buildQueryString(params: SearchParams): string {
  const queryParams = new URLSearchParams();

  // Text query
  if (params.q) queryParams.append('q', params.q);

  // Category filter (can be array or string)
  if (params.category) {
    if (Array.isArray(params.category)) {
      params.category.forEach(cat => queryParams.append('category', cat));
    } else {
      queryParams.append('category', params.category);
    }
  }

  // Distance filter
  if (params.distance !== undefined) queryParams.append('distance', String(params.distance));
  if (params.lat !== undefined) queryParams.append('lat', String(params.lat));
  if (params.lng !== undefined) queryParams.append('lng', String(params.lng));

  // Boolean filters
  if (params.openNow) queryParams.append('openNow', 'true');
  if (params.verifiedOnly) queryParams.append('verifiedOnly', 'true');
  if (params.hasPromotions) queryParams.append('hasPromotions', 'true');
  if (params.hasEvents) queryParams.append('hasEvents', 'true');

  // Array filters
  if (params.languages?.length) {
    params.languages.forEach(lang => queryParams.append('languages', lang));
  }
  if (params.priceRange?.length) {
    params.priceRange.forEach(price => queryParams.append('priceRange', String(price)));
  }
  if (params.certifications?.length) {
    params.certifications.forEach(cert => queryParams.append('certifications', cert));
  }
  if (params.accessibilityFeatures?.length) {
    params.accessibilityFeatures.forEach(feat => queryParams.append('accessibilityFeatures', feat));
  }

  // Rating filter
  if (params.rating !== undefined) queryParams.append('rating', String(params.rating));

  // Sort option
  if (params.sort) queryParams.append('sort', params.sort);

  // Pagination
  if (params.page !== undefined) queryParams.append('page', String(params.page));
  if (params.limit !== undefined) queryParams.append('limit', String(params.limit));

  return queryParams.toString();
}

/**
 * Search businesses
 *
 * @param params - Search parameters
 * @returns Search results with pagination
 */
export async function searchBusinesses(
  params: SearchParams
): Promise<SearchResponse<BusinessSearchResult>> {
  const queryString = buildQueryString(params);
  const endpoint = `/search/businesses${queryString ? `?${queryString}` : ''}`;

  const response = await get<{ success: boolean; data: SearchResponse<BusinessSearchResult> }>(endpoint);
  return response.data;
}

/**
 * Get autocomplete suggestions
 *
 * @param query - Search query
 * @param limit - Max number of suggestions (default: 10)
 * @returns Autocomplete suggestions with recent and popular searches
 */
export async function getAutocompleteSuggestions(
  query: string,
  limit: number = 10
): Promise<AutocompleteResponse> {
  const queryParams = new URLSearchParams();
  queryParams.append('q', query);
  if (limit !== 10) queryParams.append('limit', String(limit));

  const endpoint = `/search/suggestions?${queryParams.toString()}`;
  const response = await get<{ success: boolean; data: AutocompleteResponse }>(endpoint);
  return response.data;
}

/**
 * Search all content types (businesses + events)
 *
 * @param params - Search parameters
 * @returns Combined search results
 */
export async function searchAll(params: SearchParams): Promise<{
  businesses: BusinessSearchResult[];
  events: unknown[]; // TODO: Replace with Event type in Phase 8
  total: number;
}> {
  const queryString = buildQueryString(params);
  const endpoint = `/search/all${queryString ? `?${queryString}` : ''}`;

  const response = await get<{
    success: boolean;
    data: {
      businesses: BusinessSearchResult[];
      events: unknown[];
      total: number;
    };
  }>(endpoint);
  return response.data;
}
