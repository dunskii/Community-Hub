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
  const { t, i18n } = useTranslation();
  const [searchInput, setSearchInput] = useState(filters.search || '');

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onChange({ ...filters, search: searchInput || undefined });
  };

  const handleCategoryChange = (value: string) => {
    onChange({ ...filters, category: value || undefined });
  };

  const handleOpenNowChange = (checked: boolean) => {
    onChange({ ...filters, openNow: checked || undefined });
  };

  const handleSortChange = (value: string) => {
    onChange({ ...filters, sort: value || undefined });
  };

  // Convert categories to select options
  const categoryOptions = [
    { value: '', label: t('business.allCategories') },
    ...categories.map(cat => ({
      value: cat.id,
      label: typeof cat.name === 'string'
        ? cat.name
        : cat.name[i18n.language] || cat.name.en,
    })),
  ];

  const sortOptions = [
    { value: '', label: t('business.sort.default') },
    { value: 'name', label: t('business.sort.nameAsc') },
    { value: '-name', label: t('business.sort.nameDesc') },
    { value: 'rating', label: t('business.sort.ratingAsc') },
    { value: '-rating', label: t('business.sort.ratingDesc') },
    { value: 'createdAt', label: t('business.sort.newestFirst') },
    { value: '-createdAt', label: t('business.sort.oldestFirst') },
  ];

  return (
    <div className="business-filters">
      <form onSubmit={handleSearchSubmit} className="business-filters__search">
        <Input
          id="business-search"
          name="search"
          type="search"
          placeholder={t('business.searchPlaceholder')}
          value={searchInput}
          onChange={handleSearchChange}
          disabled={loading}
          aria-label={t('business.searchLabel')}
        />
      </form>

      <div className="business-filters__controls">
        <Select
          id="category-filter"
          name="category"
          label={t('business.categoryLabel')}
          options={categoryOptions}
          value={filters.category || ''}
          onChange={handleCategoryChange}
          disabled={loading}
        />

        <Select
          id="sort-filter"
          name="sort"
          label={t('business.sortLabel')}
          options={sortOptions}
          value={filters.sort || ''}
          onChange={handleSortChange}
          disabled={loading}
        />

        <div className="business-filters__toggle">
          <Toggle
            id="open-now-filter"
            name="openNow"
            label={t('business.openNowOnly')}
            checked={filters.openNow || false}
            onChange={handleOpenNowChange}
            disabled={loading}
          />
        </div>
      </div>
    </div>
  );
}
