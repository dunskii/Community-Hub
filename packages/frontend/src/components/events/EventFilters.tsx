/**
 * EventFilters Component
 * Phase 8: Events & Calendar System
 * Filter panel for event listings
 * WCAG 2.1 AA compliant, mobile-first
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Select } from '../form/Select';
import { Checkbox } from '../form/Checkbox';
import { DatePicker } from '../form/DatePicker';
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
  const [isExpanded, setIsExpanded] = useState(false);

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

  const hasFilters = Object.keys(filters).some(
    (key) => key !== 'page' && key !== 'limit' && key !== 'sort'
  );

  return (
    <div className={`bg-white rounded-lg shadow-sm ${className}`}>
      {/* Mobile: Collapsible Header */}
      <div className="md:hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between px-4 py-3 text-left min-h-[44px]"
          aria-expanded={isExpanded}
          aria-controls="event-filter-content"
        >
          <span className="font-semibold text-gray-900">{t('events.filters.title')}</span>
          <svg
            className={`h-5 w-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Desktop: Always visible title */}
      <div className="hidden md:block px-4 py-3 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">{t('events.filters.title')}</h2>
      </div>

      {/* Filter Content */}
      <div
        id="event-filter-content"
        className={`px-4 py-4 space-y-4 ${!isExpanded ? 'hidden md:block' : ''}`}
      >
        {/* Sort */}
        <div>
          <Select
            label={t('events.filters.sortBy')}
            value={filters.sort || 'upcoming'}
            onChange={(e) => updateFilter('sort', e.target.value as EventFiltersType['sort'])}
            options={sortOptions}
          />
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-3">
          <DatePicker
            label={t('events.filters.dateFrom')}
            value={filters.dateFrom || ''}
            onChange={(e) => updateFilter('dateFrom', e.target.value || undefined)}
          />
          <DatePicker
            label={t('events.filters.dateTo')}
            value={filters.dateTo || ''}
            onChange={(e) => updateFilter('dateTo', e.target.value || undefined)}
            min={filters.dateFrom}
          />
        </div>

        {/* Category */}
        {categories.length > 0 && (
          <div>
            <Select
              label={t('events.filters.category')}
              value={filters.categoryId || ''}
              onChange={(e) => updateFilter('categoryId', e.target.value || undefined)}
              options={[
                { value: '', label: t('events.filters.allCategories') },
                ...categories.map((cat) => ({ value: cat.id, label: cat.name })),
              ]}
            />
          </div>
        )}

        {/* Location Type */}
        <div>
          <Select
            label={t('events.filters.locationType')}
            value={filters.locationType || ''}
            onChange={(e) => updateFilter('locationType', (e.target.value as LocationType) || undefined)}
            options={locationTypeOptions}
          />
        </div>

        {/* Distance */}
        {showDistance && userLocation && (
          <div>
            <Select
              label={t('events.filters.distance')}
              value={filters.distance?.toString() || ''}
              onChange={(e) => {
                const value = e.target.value;
                if (value) {
                  updateFilter('distance', parseFloat(value));
                  updateFilter('latitude', userLocation.lat);
                  updateFilter('longitude', userLocation.lng);
                } else {
                  updateFilter('distance', undefined);
                  updateFilter('latitude', undefined);
                  updateFilter('longitude', undefined);
                }
              }}
              options={distanceOptions}
              disabled={!userLocation}
            />
          </div>
        )}

        {/* Status (moderators only) */}
        {showStatus && (
          <div>
            <Select
              label={t('events.filters.status')}
              value={filters.status || ''}
              onChange={(e) => updateFilter('status', (e.target.value as EventStatus) || undefined)}
              options={statusOptions}
            />
          </div>
        )}

        {/* Boolean Filters */}
        <div className="space-y-3 pt-3 border-t border-gray-100">
          <Checkbox
            id="filter-free-only"
            label={t('events.filters.freeOnly')}
            checked={filters.freeOnly || false}
            onChange={(e) => updateFilter('freeOnly', e.target.checked || undefined)}
          />

          <Checkbox
            id="filter-include-past"
            label={t('events.filters.includePast')}
            checked={filters.includePast || false}
            onChange={(e) => updateFilter('includePast', e.target.checked || undefined)}
          />
        </div>

        {/* Clear Filters Button */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="w-full mt-4 px-4 py-2 text-sm font-medium text-primary bg-white border border-primary rounded-lg hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 min-h-[44px]"
          >
            {t('events.filters.clear')}
          </button>
        )}
      </div>
    </div>
  );
}

export default EventFilters;
