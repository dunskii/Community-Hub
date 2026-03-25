/**
 * EventFilters Component
 * Phase 8: Events & Calendar System
 * Horizontal filter bar with inline controls and active filter chips (Material 3 style)
 * WCAG 2.1 AA compliant, mobile-first
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { EventFilters as EventFiltersType } from '../../services/event-service';
import type { LocationType, EventStatus } from '@community-hub/shared';

export interface EventFiltersProps {
  /** Current filter values */
  filters: Partial<EventFiltersType>;
  /** Callback when filters change */
  onChange: (filters: Partial<EventFiltersType>) => void;
  /** Available categories */
  categories?: Array<{ id: string; name: string; slug: string }>;
  /** Show distance filter */
  showDistance?: boolean;
  /** User's current location */
  userLocation?: { lat: number; lng: number };
  /** Show status filter (for moderators/admins) */
  showStatus?: boolean;
  /** Custom CSS class */
  className?: string;
}

export function EventFilters({
  filters,
  onChange,
  categories = [],
  showDistance = true,
  userLocation,
  showStatus = false,
  className = '',
}: EventFiltersProps) {
  const { t } = useTranslation();
  const [showMore, setShowMore] = useState(false);

  // Update filter
  const updateFilter = <K extends keyof EventFiltersType>(
    key: K,
    value: EventFiltersType[K] | undefined
  ) => {
    const newFilters = { ...filters };
    if (value === undefined || value === '') {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    onChange(newFilters);
  };

  // Clear all filters
  const clearFilters = () => {
    onChange({});
  };

  // Location type options
  const locationTypeOptions = [
    { value: '', label: t('events.filters.anyLocationType') },
    { value: 'PHYSICAL', label: t('events.locationType.physical') },
    { value: 'ONLINE', label: t('events.locationType.online') },
    { value: 'HYBRID', label: t('events.locationType.hybrid') },
  ];

  // Distance options (in km)
  const distanceOptions = [
    { value: '', label: t('events.filters.anyDistance') },
    { value: '1', label: '1 km' },
    { value: '2', label: '2 km' },
    { value: '5', label: '5 km' },
    { value: '10', label: '10 km' },
    { value: '25', label: '25 km' },
    { value: '50', label: '50 km' },
  ];

  // Sort options
  const sortOptions = [
    { value: 'upcoming', label: t('events.sort.upcoming') },
    { value: 'popular', label: t('events.sort.popular') },
    { value: 'newest', label: t('events.sort.newest') },
    { value: 'distance', label: t('events.sort.distance') },
  ];

  // Status options (for moderators)
  const statusOptions = [
    { value: '', label: t('events.filters.anyStatus') },
    { value: 'PENDING', label: t('events.status.pending') },
    { value: 'ACTIVE', label: t('events.status.active') },
    { value: 'CANCELLED', label: t('events.status.cancelled') },
    { value: 'PAST', label: t('events.status.past') },
  ];

  // Build active filter chips
  const activeChips: Array<{ key: string; label: string; onRemove: () => void }> = [];

  if (filters.locationType) {
    const opt = locationTypeOptions.find((o) => o.value === filters.locationType);
    if (opt) {
      activeChips.push({
        key: 'locationType',
        label: opt.label,
        onRemove: () => updateFilter('locationType', undefined),
      });
    }
  }
  if (filters.distance) {
    activeChips.push({
      key: 'distance',
      label: `${filters.distance} km`,
      onRemove: () => {
        updateFilter('distance', undefined);
        updateFilter('latitude', undefined);
        updateFilter('longitude', undefined);
      },
    });
  }
  if (filters.categoryId && categories.length > 0) {
    const cat = categories.find((c) => c.id === filters.categoryId);
    if (cat) {
      activeChips.push({
        key: 'categoryId',
        label: cat.name,
        onRemove: () => updateFilter('categoryId', undefined),
      });
    }
  }
  if (filters.freeOnly) {
    activeChips.push({
      key: 'freeOnly',
      label: t('events.filters.freeOnly'),
      onRemove: () => updateFilter('freeOnly', undefined),
    });
  }
  if (filters.includePast) {
    activeChips.push({
      key: 'includePast',
      label: t('events.filters.includePast'),
      onRemove: () => updateFilter('includePast', undefined),
    });
  }
  if (filters.dateFrom) {
    activeChips.push({
      key: 'dateFrom',
      label: `${t('events.filters.dateFrom')}: ${filters.dateFrom}`,
      onRemove: () => updateFilter('dateFrom', undefined),
    });
  }
  if (filters.dateTo) {
    activeChips.push({
      key: 'dateTo',
      label: `${t('events.filters.dateTo')}: ${filters.dateTo}`,
      onRemove: () => updateFilter('dateTo', undefined),
    });
  }
  if (filters.status) {
    const opt = statusOptions.find((o) => o.value === filters.status);
    if (opt) {
      activeChips.push({
        key: 'status',
        label: opt.label,
        onRemove: () => updateFilter('status', undefined),
      });
    }
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

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Primary filter row - always visible */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Sort */}
        <InlineSelect
          label={t('events.filters.sortBy')}
          value={filters.sort || 'upcoming'}
          options={sortOptions}
          onChangeValue={(val) => updateFilter('sort', val as EventFiltersType['sort'])}
        />

        {/* Location Type */}
        <InlineSelect
          label={t('events.filters.locationType')}
          value={filters.locationType || ''}
          options={locationTypeOptions}
          onChangeValue={(val) => updateFilter('locationType', (val as LocationType) || undefined)}
        />

        {/* Category */}
        {categories.length > 0 && (
          <InlineSelect
            label={t('events.filters.category')}
            value={filters.categoryId || ''}
            options={[
              { value: '', label: t('events.filters.allCategories') },
              ...categories.map((cat) => ({ value: cat.id, label: cat.name })),
            ]}
            onChangeValue={(val) => updateFilter('categoryId', val || undefined)}
          />
        )}

        {/* Distance */}
        {showDistance && userLocation && (
          <InlineSelect
            label={t('events.filters.distance')}
            value={filters.distance?.toString() || ''}
            options={distanceOptions}
            onChangeValue={(val) => {
              if (val) {
                updateFilter('distance', parseFloat(val));
                updateFilter('latitude', userLocation.lat);
                updateFilter('longitude', userLocation.lng);
              } else {
                updateFilter('distance', undefined);
                updateFilter('latitude', undefined);
                updateFilter('longitude', undefined);
              }
            }}
            disabled={!userLocation}
          />
        )}

        {/* Toggle chips for booleans */}
        <button
          type="button"
          onClick={() => updateFilter('freeOnly', filters.freeOnly ? undefined : true)}
          className={`inline-flex items-center rounded-full border text-sm px-3 py-2 min-h-[36px] transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
            filters.freeOnly
              ? 'bg-primary text-white border-primary'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-primary'
          }`}
          aria-pressed={!!filters.freeOnly}
        >
          {t('events.filters.freeOnly')}
        </button>

        {/* More filters toggle */}
        <button
          type="button"
          onClick={() => setShowMore(!showMore)}
          className="inline-flex items-center gap-1 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 px-3 py-2 min-h-[36px] hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-expanded={showMore}
          aria-controls="event-filters-more"
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
          {t('events.filters.title')}
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
          id="event-filters-more"
          className="flex flex-wrap items-end gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700"
        >
          {/* Date Range */}
          <div className="flex items-end gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {t('events.filters.dateFrom')}
              </label>
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => updateFilter('dateFrom', e.target.value || undefined)}
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 px-3 py-2 min-h-[36px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <span className="text-gray-400 pb-2">-</span>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {t('events.filters.dateTo')}
              </label>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => updateFilter('dateTo', e.target.value || undefined)}
                min={filters.dateFrom}
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 px-3 py-2 min-h-[36px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          {/* Include Past toggle */}
          <button
            type="button"
            onClick={() => updateFilter('includePast', filters.includePast ? undefined : true)}
            className={`inline-flex items-center rounded-full border text-sm px-3 py-2 min-h-[36px] transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              filters.includePast
                ? 'bg-primary text-white border-primary'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-primary'
            }`}
            aria-pressed={!!filters.includePast}
          >
            {t('events.filters.includePast')}
          </button>

          {/* Status (moderators only) */}
          {showStatus && (
            <InlineSelect
              label={t('events.filters.status')}
              value={filters.status || ''}
              options={statusOptions}
              onChangeValue={(val) => updateFilter('status', (val as EventStatus) || undefined)}
            />
          )}
        </div>
      )}

      {/* Active filter chips */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2" role="list" aria-label={t('events.filters.activeFilters', 'Active filters')}>
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
                aria-label={t('events.filters.removeFilter', { filter: chip.label })}
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
              {t('events.filters.clear')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default EventFilters;
