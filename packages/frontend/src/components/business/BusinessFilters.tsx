/**
 * BusinessFilters Component
 * Provides filtering UI for business listings
 * WCAG 2.1 AA compliant, mobile-first
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Select } from '../form/Select';
import { Input } from '../form/Input';
import { Toggle } from '../form/Toggle';
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
}

export function BusinessFilters({
  filters,
  onChange,
  categories = [],
  loading = false,
}: BusinessFiltersProps) {
  const { t, i18n } = useTranslation('business');
  const [searchInput, setSearchInput] = useState(filters.search || '');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onChange({ ...filters, search: searchInput || undefined });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filters, category: e.target.value || undefined });
  };

  const handleOpenNowChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, openNow: e.target.checked || undefined });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filters, sort: e.target.value || undefined });
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

  return (
    <div className="business-filters">
      <form onSubmit={handleSearchSubmit} className="business-filters__search">
        <Input
          id="business-search"
          name="search"
          type="search"
          placeholder={t('searchPlaceholder', 'Search businesses...')}
          value={searchInput}
          onChange={handleSearchChange}
          disabled={loading}
          aria-label={t('searchLabel', 'Search for businesses')}
        />
      </form>

      <div className="business-filters__controls">
        <Select
          id="category-filter"
          name="category"
          label={t('categoryLabel', 'Category')}
          options={categoryOptions}
          value={filters.category || ''}
          onChange={handleCategoryChange}
          disabled={loading}
        />

        <Select
          id="sort-filter"
          name="sort"
          label={t('sortLabel', 'Sort by')}
          options={sortOptions}
          value={filters.sort || ''}
          onChange={handleSortChange}
          disabled={loading}
        />

        <div className="business-filters__toggle">
          <Toggle
            id="open-now-filter"
            name="openNow"
            label={t('openNowOnly', 'Open Now')}
            checked={filters.openNow || false}
            onChange={handleOpenNowChange}
            disabled={loading}
          />
        </div>
      </div>
    </div>
  );
}
