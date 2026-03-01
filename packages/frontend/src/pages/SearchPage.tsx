/**
 * SearchPage
 * Phase 5: Search & Discovery
 *
 * Main search page with filters, results, and autocomplete
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SearchBar } from '../components/search/SearchBar.js';
import { SearchFilters } from '../components/search/SearchFilters.js';
import { SearchResults } from '../components/search/SearchResults.js';
import { FilterChips } from '../components/search/FilterChips.js';
import { PageContainer } from '../components/layout/PageContainer.js';
import { searchBusinesses } from '../services/search-api.js';
import { logger } from '../utils/logger.js';
import type { SearchParams, SearchResponse, BusinessSearchResult } from '@community-hub/shared';

export function SearchPage() {
  const { t } = useTranslation('search');
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // State
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<SearchResponse<BusinessSearchResult> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Partial<SearchParams>>({});

  // Parse URL params to filters
  useEffect(() => {
    const params: Partial<SearchParams> = {};

    if (searchParams.get('q')) params.q = searchParams.get('q')!;
    if (searchParams.get('category')) params.category = searchParams.get('category')!;
    if (searchParams.get('distance')) params.distance = parseFloat(searchParams.get('distance')!);
    if (searchParams.get('lat')) params.lat = parseFloat(searchParams.get('lat')!);
    if (searchParams.get('lng')) params.lng = parseFloat(searchParams.get('lng')!);
    if (searchParams.get('rating')) params.rating = parseFloat(searchParams.get('rating')!);
    if (searchParams.get('sort')) params.sort = searchParams.get('sort') as SearchParams['sort'];
    if (searchParams.get('page')) params.page = parseInt(searchParams.get('page')!);
    if (searchParams.get('openNow')) params.openNow = searchParams.get('openNow') === 'true';
    if (searchParams.get('verifiedOnly')) params.verifiedOnly = searchParams.get('verifiedOnly') === 'true';
    if (searchParams.get('hasPromotions')) params.hasPromotions = searchParams.get('hasPromotions') === 'true';
    if (searchParams.get('hasEvents')) params.hasEvents = searchParams.get('hasEvents') === 'true';

    setFilters(params);
    setQuery(params.q || '');
  }, [searchParams]);

  // Perform search
  useEffect(() => {
    if (Object.keys(filters).length === 0) {
      setResults(null);
      return;
    }

    const performSearch = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await searchBusinesses(filters);
        setResults(data);
      } catch (err) {
        logger.error('Search failed', err instanceof Error ? err : undefined);
        setError(err instanceof Error ? err.message : 'Search failed');
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [filters]);

  // Update URL when filters change
  const updateFilters = (newFilters: Partial<SearchParams>) => {
    const params = new URLSearchParams();

    if (newFilters.q) params.set('q', newFilters.q);
    if (newFilters.category) params.set('category', newFilters.category as string);
    if (newFilters.distance) params.set('distance', newFilters.distance.toString());
    if (newFilters.lat) params.set('lat', newFilters.lat.toString());
    if (newFilters.lng) params.set('lng', newFilters.lng.toString());
    if (newFilters.rating) params.set('rating', newFilters.rating.toString());
    if (newFilters.sort) params.set('sort', newFilters.sort);
    if (newFilters.page) params.set('page', newFilters.page.toString());
    if (newFilters.openNow) params.set('openNow', 'true');
    if (newFilters.verifiedOnly) params.set('verifiedOnly', 'true');
    if (newFilters.hasPromotions) params.set('hasPromotions', 'true');
    if (newFilters.hasEvents) params.set('hasEvents', 'true');

    setSearchParams(params);
  };

  // Handle search submission
  const handleSearch = (searchQuery: string) => {
    updateFilters({ ...filters, q: searchQuery, page: 1 });
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: { type: string; id?: string; name: string }) => {
    if (suggestion.type === 'business' && suggestion.id) {
      navigate(`/businesses/${suggestion.id}`);
    } else {
      handleSearch(suggestion.name);
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    updateFilters({ ...filters, page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle filter change
  const handleFilterChange = (newFilters: Partial<SearchParams>) => {
    updateFilters({ ...newFilters, page: 1 }); // Reset to page 1 when filters change
  };

  // Handle removing a single filter
  const handleRemoveFilter = (key: keyof SearchParams) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    updateFilters({ ...newFilters, page: 1 });
  };

  // Handle clearing all filters
  const handleClearAllFilters = () => {
    updateFilters({ q: filters.q }); // Keep only the search query
  };

  // Available categories
  const availableCategories = [
    { slug: 'restaurants', name: 'Restaurants' },
    { slug: 'retail', name: 'Retail' },
    { slug: 'services', name: 'Services' },
    { slug: 'health', name: 'Health & Wellness' },
    { slug: 'education', name: 'Education' },
  ];

  return (
    <PageContainer
      title={query ? `Search: ${query}` : 'Search'}
      description="Search for local businesses, events, and deals"
    >
      {/* Search Bar */}
      <div className="mb-6">
        <SearchBar
          value={query}
          onChange={setQuery}
          onSubmit={handleSearch}
          onSuggestionSelect={handleSuggestionSelect}
          showAutocomplete={true}
        />
      </div>

      {/* Active Filter Chips */}
      {Object.keys(filters).length > 0 && filters.q && (
        <div className="mb-4">
          <FilterChips
            filters={filters}
            onRemoveFilter={handleRemoveFilter}
            onClearAll={handleClearAllFilters}
            categories={availableCategories}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <aside className="lg:col-span-1">
          <SearchFilters
            filters={filters}
            onChange={handleFilterChange}
            categories={availableCategories}
            showDistance={false} // TODO: Get user location
          />
        </aside>

        {/* Results */}
        <main className="lg:col-span-3">
          <SearchResults
            results={results || undefined}
            isLoading={isLoading}
            error={error}
            page={filters.page || 1}
            onPageChange={handlePageChange}
          />
        </main>
      </div>
    </PageContainer>
  );
}
