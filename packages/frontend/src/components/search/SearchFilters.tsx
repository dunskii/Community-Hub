/**
 * SearchFilters Component
 * Phase 5: Search & Discovery
 *
 * Horizontal filter bar with inline controls and active filter chips (Material 3 style)
 * WCAG 2.1 AA compliant, mobile-first
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const [showMore, setShowMore] = useState(false);

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
    { value: '', label: t('rating') },
    { value: '4', label: '4+ stars' },
    { value: '3', label: '3+ stars' },
    { value: '2', label: '2+ stars' },
  ];

  // Build active filter chips
  const activeChips: Array<{ key: keyof SearchParams; label: string; onRemove: () => void }> = [];

  if (filters.category) {
    const categoryName = categories.find((c) => c.slug === filters.category)?.name || filters.category;
    activeChips.push({
      key: 'category',
      label: categoryName as string,
      onRemove: () => updateFilter('category', undefined),
    });
  }
  if (filters.distance) {
    activeChips.push({
      key: 'distance',
      label: t('distanceKm', { distance: filters.distance }),
      onRemove: () => {
        updateFilter('distance', undefined);
        updateFilter('lat', undefined);
        updateFilter('lng', undefined);
      },
    });
  }
  if (filters.rating) {
    activeChips.push({
      key: 'rating',
      label: `${filters.rating}+ stars`,
      onRemove: () => updateFilter('rating', undefined),
    });
  }
  if (filters.openNow) {
    activeChips.push({
      key: 'openNow',
      label: t('openNow'),
      onRemove: () => updateFilter('openNow', undefined),
    });
  }
  if (filters.verifiedOnly) {
    activeChips.push({
      key: 'verifiedOnly',
      label: t('verifiedOnly'),
      onRemove: () => updateFilter('verifiedOnly', undefined),
    });
  }
  if (filters.hasPromotions) {
    activeChips.push({
      key: 'hasPromotions',
      label: t('hasPromotions'),
      onRemove: () => updateFilter('hasPromotions', undefined),
    });
  }
  if (filters.hasEvents) {
    activeChips.push({
      key: 'hasEvents',
      label: t('hasEvents'),
      onRemove: () => updateFilter('hasEvents', undefined),
    });
  }

  // Inline select helper - styled as M3 outlined filter chip
  const InlineSelect = ({
    label,
    value,
    options,
    onChangeValue,
    disabled = false,
  }: {
    label: string;
    value: string;
    options: Array<{ value: string; label: string }>;
    onChangeValue: (val: string) => void;
    disabled?: boolean;
  }) => (
    <div className="relative">
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChangeValue(e.target.value)}
        disabled={disabled}
        className="appearance-none rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 pl-3 pr-8 py-2 min-h-[36px] hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <svg
        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );

  // Toggle chip helper
  const ToggleChip = ({
    label,
    active,
    onToggle,
  }: {
    label: string;
    active: boolean;
    onToggle: () => void;
  }) => (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex items-center rounded-full border text-sm px-3 py-2 min-h-[36px] transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
        active
          ? 'bg-primary text-white border-primary'
          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-primary'
      }`}
      aria-pressed={active}
    >
      {label}
    </button>
  );

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Primary filter row - always visible */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Sort */}
        <InlineSelect
          label={t('sortBy')}
          value={filters.sort || 'relevance'}
          options={sortOptions}
          onChangeValue={(val) => updateFilter('sort', val as SearchParams['sort'])}
        />

        {/* Category */}
        {categories.length > 0 && (
          <InlineSelect
            label={t('categories')}
            value={(filters.category as string) || ''}
            options={[
              { value: '', label: t('categories') },
              ...categories.map((cat) => ({ value: cat.slug, label: cat.name })),
            ]}
            onChangeValue={(val) => updateFilter('category', val || undefined)}
          />
        )}

        {/* Rating */}
        <InlineSelect
          label={t('rating')}
          value={filters.rating?.toString() || ''}
          options={ratingOptions}
          onChangeValue={(val) => updateFilter('rating', val ? parseFloat(val) : undefined)}
        />

        {/* Open Now toggle */}
        <ToggleChip
          label={t('openNow')}
          active={!!filters.openNow}
          onToggle={() => updateFilter('openNow', filters.openNow ? undefined : true)}
        />

        {/* Verified toggle */}
        <ToggleChip
          label={t('verifiedOnly')}
          active={!!filters.verifiedOnly}
          onToggle={() => updateFilter('verifiedOnly', filters.verifiedOnly ? undefined : true)}
        />

        {/* More filters toggle */}
        <button
          type="button"
          onClick={() => setShowMore(!showMore)}
          className="inline-flex items-center gap-1 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 px-3 py-2 min-h-[36px] hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-expanded={showMore}
          aria-controls="search-filters-more"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          {t('filters')}
          <svg
            className={`w-3 h-3 transition-transform ${showMore ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Expanded filters row */}
      {showMore && (
        <div
          id="search-filters-more"
          className="flex flex-wrap items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700"
        >
          {/* Distance */}
          {showDistance && userLocation && (
            <InlineSelect
              label={t('distance')}
              value={filters.distance?.toString() || ''}
              options={distanceOptions}
              onChangeValue={(val) => {
                if (val) {
                  updateFilter('distance', parseFloat(val));
                  updateFilter('lat', userLocation.lat);
                  updateFilter('lng', userLocation.lng);
                } else {
                  updateFilter('distance', undefined);
                  updateFilter('lat', undefined);
                  updateFilter('lng', undefined);
                }
              }}
              disabled={!userLocation}
            />
          )}

          {/* Has Promotions toggle */}
          <ToggleChip
            label={t('hasPromotions')}
            active={!!filters.hasPromotions}
            onToggle={() => updateFilter('hasPromotions', filters.hasPromotions ? undefined : true)}
          />

          {/* Has Events toggle */}
          <ToggleChip
            label={t('hasEvents')}
            active={!!filters.hasEvents}
            onToggle={() => updateFilter('hasEvents', filters.hasEvents ? undefined : true)}
          />
        </div>
      )}

      {/* Active filter chips */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2" role="list" aria-label="Active filters">
          {activeChips.map((chip) => (
            <span
              key={chip.key}
              role="listitem"
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-sm pl-3 pr-1.5 py-1"
            >
              {chip.label}
              <button
                type="button"
                onClick={chip.onRemove}
                className="inline-flex items-center justify-center w-5 h-5 rounded-full hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                aria-label={`Remove filter: ${chip.label}`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}

          {activeChips.length >= 2 && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm text-primary hover:text-primary/80 underline underline-offset-2 focus:outline-none focus:ring-2 focus:ring-primary rounded px-1"
            >
              {t('clearFilters')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
