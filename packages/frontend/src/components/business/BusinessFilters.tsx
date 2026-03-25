/**
 * BusinessFilters Component
 * Horizontal filter bar with inline controls and toggle chips (Material 3 style)
 * Matches EventFilters design pattern
 * WCAG 2.1 AA compliant, mobile-first
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { BusinessListParams } from '../../services/business-api';
import type { Category } from '../../services/business-api';

interface BusinessFiltersProps {
  /** Current filter values */
  filters: BusinessListParams;
  /** Callback when filters change */
  onChange: (filters: BusinessListParams) => void;
  /** Available categories for filtering */
  categories?: Category[];
  /** Show loading state */
  loading?: boolean;
  /** Search query state */
  searchInput?: string;
  /** Search change handler */
  onSearchChange?: (value: string) => void;
  /** Search submit handler */
  onSearchSubmit?: (e: React.FormEvent) => void;
}

export function BusinessFilters({
  filters,
  onChange,
  categories = [],
  loading = false,
}: BusinessFiltersProps) {
  const { t, i18n } = useTranslation('business');
  const [searchInput, setSearchInput] = useState(filters.search || '');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onChange({ ...filters, search: searchInput.trim() || undefined, page: 1 });
  };

  // Convert categories to select options
  const categoryOptions = [
    { value: '', label: t('allCategories', 'All Categories') },
    ...categories.map(cat => ({
      value: cat.id,
      label: (typeof cat.name === 'string'
        ? cat.name
        : cat.name[i18n.language] || cat.name.en) || cat.id,
    })),
  ];

  const sortOptions = [
    { value: '', label: t('sort.default', 'Default') },
    { value: 'name', label: t('sort.nameAsc', 'Name (A-Z)') },
    { value: '-name', label: t('sort.nameDesc', 'Name (Z-A)') },
    { value: 'rating', label: t('sort.ratingAsc', 'Rating (Low to High)') },
    { value: '-rating', label: t('sort.ratingDesc', 'Rating (High to Low)') },
    { value: 'createdAt', label: t('sort.newestFirst', 'Newest First') },
    { value: '-createdAt', label: t('sort.oldestFirst', 'Oldest First') },
  ];

  // Build active filter chips
  const activeChips: Array<{ key: string; label: string; onRemove: () => void }> = [];

  if (filters.category) {
    const cat = categoryOptions.find(c => c.value === filters.category);
    if (cat && cat.value) {
      activeChips.push({
        key: 'category',
        label: cat.label,
        onRemove: () => onChange({ ...filters, category: undefined, page: 1 }),
      });
    }
  }
  if (filters.search) {
    activeChips.push({
      key: 'search',
      label: `"${filters.search}"`,
      onRemove: () => {
        setSearchInput('');
        onChange({ ...filters, search: undefined, page: 1 });
      },
    });
  }
  if (filters.openNow) {
    activeChips.push({
      key: 'openNow',
      label: t('openNowOnly', 'Open Now'),
      onRemove: () => onChange({ ...filters, openNow: undefined, page: 1 }),
    });
  }
  if (filters.sort) {
    const sortOpt = sortOptions.find(s => s.value === filters.sort);
    if (sortOpt && sortOpt.value) {
      activeChips.push({
        key: 'sort',
        label: `${t('sortLabel', 'Sort')}: ${sortOpt.label}`,
        onRemove: () => onChange({ ...filters, sort: undefined, page: 1 }),
      });
    }
  }

  // Inline select helper - M3 outlined filter chip style
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
    <div className="space-y-3">
      {/* Search bar - M3 pill style */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <div className="relative">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t('searchPlaceholder', 'Search businesses...')}
            disabled={loading}
            className="w-full pl-12 pr-4 py-3 min-h-[48px] bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary shadow-sm transition-shadow hover:shadow-md disabled:opacity-50"
            aria-label={t('searchLabel', 'Search for businesses')}
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                onChange({ ...filters, search: undefined, page: 1 });
              }}
              className="absolute right-14 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label={t('clearSearch', 'Clear search')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 min-h-[36px] transition-colors disabled:opacity-50"
          >
            {t('searchButton', 'Search')}
          </button>
        </div>
      </form>

      {/* Horizontal filter row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Sort */}
        <InlineSelect
          label={t('sortLabel', 'Sort by')}
          value={filters.sort || ''}
          options={sortOptions}
          onChangeValue={(val) => onChange({ ...filters, sort: val || undefined, page: 1 })}
          disabled={loading}
        />

        {/* Category */}
        {categories.length > 0 && (
          <InlineSelect
            label={t('categoryLabel', 'Category')}
            value={filters.category || ''}
            options={categoryOptions}
            onChangeValue={(val) => onChange({ ...filters, category: val || undefined, page: 1 })}
            disabled={loading}
          />
        )}

        {/* Open Now toggle chip */}
        <button
          type="button"
          onClick={() => onChange({ ...filters, openNow: filters.openNow ? undefined : true, page: 1 })}
          disabled={loading}
          className={`inline-flex items-center rounded-full border text-sm px-3 py-2 min-h-[36px] transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 ${
            filters.openNow
              ? 'bg-primary text-white border-primary'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-primary'
          }`}
          aria-pressed={!!filters.openNow}
        >
          {t('openNowOnly', 'Open Now')}
        </button>
      </div>

      {/* Active filter chips */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2" role="list" aria-label={t('activeFilters', 'Active filters')}>
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
                aria-label={t('removeFilter', { filter: chip.label })}
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
              onClick={() => {
                setSearchInput('');
                onChange({ page: 1, limit: filters.limit });
              }}
              className="text-sm text-primary hover:text-primary/80 underline underline-offset-2 focus:outline-none focus:ring-2 focus:ring-primary rounded px-1"
            >
              {t('clearAll', 'Clear all')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
