/**
 * FilterChips Component
 * Phase 5: Search & Discovery
 *
 * Displays active filters as removable chips
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import type { SearchParams } from '@community-hub/shared';

export interface FilterChipsProps {
  /** Current filter values */
  filters: Partial<SearchParams>;
  /** Callback when a filter is removed */
  onRemoveFilter: (key: keyof SearchParams) => void;
  /** Callback when all filters are cleared */
  onClearAll?: () => void;
  /** Available categories (for display names) */
  categories?: Array<{ slug: string; name: string }>;
  /** Custom CSS class */
  className?: string;
}

export function FilterChips({
  filters,
  onRemoveFilter,
  onClearAll,
  categories = [],
  className = '',
}: FilterChipsProps) {
  const { t } = useTranslation('search');

  // Build array of active filter chips
  const chips: Array<{ key: keyof SearchParams; label: string }> = [];

  // Category filter
  if (filters.category) {
    const categoryName = categories.find(c => c.slug === filters.category)?.name || filters.category;
    chips.push({ key: 'category', label: `${t('categories')}: ${categoryName}` });
  }

  // Distance filter
  if (filters.distance) {
    chips.push({ key: 'distance', label: t('distanceKm', { distance: filters.distance }) });
  }

  // Rating filter
  if (filters.rating) {
    chips.push({ key: 'rating', label: `${filters.rating}+ stars` });
  }

  // Sort (only show if not default)
  if (filters.sort && filters.sort !== 'relevance') {
    chips.push({ key: 'sort', label: `${t('sortBy')}: ${t(`sort.${filters.sort}`)}` });
  }

  // Boolean filters
  if (filters.openNow) {
    chips.push({ key: 'openNow', label: t('openNow') });
  }

  if (filters.verifiedOnly) {
    chips.push({ key: 'verifiedOnly', label: t('verifiedOnly') });
  }

  if (filters.hasPromotions) {
    chips.push({ key: 'hasPromotions', label: t('hasPromotions') });
  }

  if (filters.hasEvents) {
    chips.push({ key: 'hasEvents', label: t('hasEvents') });
  }

  // Array filters
  if (filters.languages && filters.languages.length > 0) {
    filters.languages.forEach((lang, index) => {
      chips.push({ key: 'languages' as keyof SearchParams, label: `${t('languages')}: ${lang}` });
    });
  }

  if (filters.priceRange && filters.priceRange.length > 0) {
    const priceLabels = filters.priceRange.map(p => t(`priceRangeLabels.${p}`)).join(', ');
    chips.push({ key: 'priceRange', label: `${t('priceRange')}: ${priceLabels}` });
  }

  if (filters.certifications && filters.certifications.length > 0) {
    filters.certifications.forEach(cert => {
      chips.push({ key: 'certifications' as keyof SearchParams, label: `${t('certifications')}: ${cert}` });
    });
  }

  if (filters.accessibilityFeatures && filters.accessibilityFeatures.length > 0) {
    filters.accessibilityFeatures.forEach(feature => {
      chips.push({ key: 'accessibilityFeatures' as keyof SearchParams, label: `${t('accessibilityFeatures')}: ${feature}` });
    });
  }

  // Don't render if no active filters
  if (chips.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`} role="group" aria-label="Active filters">
      {/* Filter Chips */}
      {chips.map((chip, index) => (
        <button
          key={`${chip.key}-${index}`}
          onClick={() => onRemoveFilter(chip.key)}
          className="inline-flex items-center gap-1 px-3 py-1 text-sm rounded-full bg-primary-tint-90 text-primary hover:bg-primary-tint-80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
          aria-label={`Remove filter: ${chip.label}`}
        >
          <span>{chip.label}</span>
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      ))}

      {/* Clear All Button */}
      {chips.length > 1 && onClearAll && (
        <button
          onClick={onClearAll}
          className="text-sm text-neutral-dark hover:text-dark underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
          aria-label="Clear all filters"
        >
          {t('clearFilters')}
        </button>
      )}
    </div>
  );
}
