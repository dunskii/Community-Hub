/**
 * SearchFilters Component
 * Phase 5: Search & Discovery
 *
 * Filter panel for search results
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Select } from '../form/Select.js';
import { Checkbox } from '../form/Checkbox.js';
import type { SearchParams } from '@community-hub/shared';

export interface SearchFiltersProps {
  /** Current filter values */
  filters: Partial<SearchParams>;
  /** Callback when filters change */
  onChange: (filters: Partial<SearchParams>) => void;
  /** Available categories */
  categories?: Array<{ slug: string; name: string }>;
  /** Show distance filter */
  showDistance?: boolean;
  /** User's current location */
  userLocation?: { lat: number; lng: number };
  /** Custom CSS class */
  className?: string;
}

export function SearchFilters({
  filters,
  onChange,
  categories = [],
  showDistance = true,
  userLocation,
  className = '',
}: SearchFiltersProps) {
  const { t } = useTranslation('search');
  const [isExpanded, setIsExpanded] = useState(false);

  // Update filter
  const updateFilter = (key: keyof SearchParams, value: unknown) => {
    onChange({ ...filters, [key]: value });
  };

  // Clear all filters
  const clearFilters = () => {
    onChange({});
  };

  // Distance options (in km)
  const distanceOptions = [
    { value: '', label: t('anyDistance') },
    { value: '0.5', label: '0.5 km' },
    { value: '1', label: '1 km' },
    { value: '2', label: '2 km' },
    { value: '5', label: '5 km' },
    { value: '10', label: '10 km' },
    { value: '25', label: '25 km' },
  ];

  // Sort options
  const sortOptions = [
    { value: 'relevance', label: t('sort.relevance') },
    { value: 'distance', label: t('sort.distance') },
    { value: 'rating', label: t('sort.rating') },
    { value: 'reviews', label: t('sort.reviews') },
    { value: 'updated', label: t('sort.updated') },
    { value: 'name', label: t('sort.name') },
    { value: 'newest', label: t('sort.newest') },
  ];

  // Rating options
  const ratingOptions = [
    { value: '', label: 'Any rating' },
    { value: '4', label: '4+ stars' },
    { value: '3', label: '3+ stars' },
    { value: '2', label: '2+ stars' },
  ];

  const hasFilters = Object.keys(filters).length > 0;

  return (
    <div className={`bg-white rounded-lg shadow-sm ${className}`}>
      {/* Mobile: Collapsible Header */}
      <div className="md:hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between px-4 py-3 text-left"
          aria-expanded={isExpanded}
        >
          <span className="font-semibold text-dark">{t('filters')}</span>
          <svg
            className={`h-5 w-5 text-neutral-dark transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Desktop: Always visible title */}
      <div className="hidden md:block px-4 py-3 border-b border-neutral-light">
        <h2 className="font-semibold text-dark">{t('filters')}</h2>
      </div>

      {/* Filter Content */}
      <div className={`px-4 py-4 space-y-4 ${!isExpanded ? 'hidden md:block' : ''}`}>
        {/* Sort */}
        <div>
          <Select
            label={t('sortBy')}
            value={filters.sort || 'relevance'}
            onChange={value => updateFilter('sort', value as SearchParams['sort'])}
            options={sortOptions}
          />
        </div>

        {/* Category */}
        {categories.length > 0 && (
          <div>
            <Select
              label={t('categories')}
              value={filters.category || ''}
              onChange={value => updateFilter('category', value || undefined)}
              options={[
                { value: '', label: 'All Categories' },
                ...categories.map(cat => ({ value: cat.slug, label: cat.name })),
              ]}
            />
          </div>
        )}

        {/* Distance */}
        {showDistance && userLocation && (
          <div>
            <Select
              label={t('distance')}
              value={filters.distance?.toString() || ''}
              onChange={value => {
                if (value) {
                  updateFilter('distance', parseFloat(value));
                  updateFilter('lat', userLocation.lat);
                  updateFilter('lng', userLocation.lng);
                } else {
                  updateFilter('distance', undefined);
                  updateFilter('lat', undefined);
                  updateFilter('lng', undefined);
                }
              }}
              options={distanceOptions}
              disabled={!userLocation}
            />
          </div>
        )}

        {/* Rating */}
        <div>
          <Select
            label={t('rating')}
            value={filters.rating?.toString() || ''}
            onChange={value => updateFilter('rating', value ? parseFloat(value) : undefined)}
            options={ratingOptions}
          />
        </div>

        {/* Boolean Filters */}
        <div className="space-y-2 pt-2 border-t border-neutral-light">
          <Checkbox
            id="filter-open-now"
            label={t('openNow')}
            checked={filters.openNow || false}
            onChange={checked => updateFilter('openNow', checked || undefined)}
          />

          <Checkbox
            id="filter-verified"
            label={t('verifiedOnly')}
            checked={filters.verifiedOnly || false}
            onChange={checked => updateFilter('verifiedOnly', checked || undefined)}
          />

          <Checkbox
            id="filter-promotions"
            label={t('hasPromotions')}
            checked={filters.hasPromotions || false}
            onChange={checked => updateFilter('hasPromotions', checked || undefined)}
          />

          <Checkbox
            id="filter-events"
            label={t('hasEvents')}
            checked={filters.hasEvents || false}
            onChange={checked => updateFilter('hasEvents', checked || undefined)}
          />
        </div>

        {/* Clear Filters Button */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="w-full mt-4 px-4 py-2 text-sm font-medium text-primary bg-white border border-primary rounded-md hover:bg-primary-tint-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            {t('clearFilters')}
          </button>
        )}
      </div>
    </div>
  );
}
