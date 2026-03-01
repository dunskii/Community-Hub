/**
 * Search types for Community Hub
 * Phase 5: Search & Discovery
 */

export interface SearchParams {
  // Text search
  q?: string;

  // Filters
  category?: string | string[];
  distance?: number;
  lat?: number;
  lng?: number;
  openNow?: boolean;
  languages?: string[];
  priceRange?: number[];
  rating?: number;
  certifications?: string[];
  accessibilityFeatures?: string[];
  hasPromotions?: boolean;
  hasEvents?: boolean;
  verifiedOnly?: boolean;

  // Sort
  sort?: 'relevance' | 'distance' | 'rating' | 'reviews' | 'updated' | 'name' | 'newest';

  // Pagination
  page?: number;
  limit?: number;
}

export interface SearchResponse<T> {
  results: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BusinessSearchResult {
  id: string;
  name: string;
  description: string;
  categorySlug: string;
  categoryName: string;
  rating: number;
  reviewCount: number;
  distance?: number;
  photos: string[];
  verified: boolean;
  featured: boolean;
  highlights?: {
    name?: string;
    description?: string;
  };
}

export interface AutocompleteSuggestion {
  type: 'business' | 'category';
  id: string;
  name: string;
  categoryName?: string;
  slug?: string;
}

export interface AutocompleteResponse {
  suggestions: AutocompleteSuggestion[];
  recentSearches: string[];
  popularSearches: string[];
}
