/**
 * FilterChips Component
 * Phase 5: Search & Discovery
 *
 * Displays active filters as removable chips
 */

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
    filters.languages.forEach((lang) => {
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
        <span
          key={`${chip.key}-${index}`}
          className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-sm pl-3 pr-1.5 py-1"
        >
          {chip.label}
          <button
            onClick={() => onRemoveFilter(chip.key)}
            className="inline-flex items-center justify-center w-5 h-5 rounded-full hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
            aria-label={`Remove filter: ${chip.label}`}
          >
            <svg
              className="w-3 h-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </span>
      ))}

      {/* Clear All Button */}
      {chips.length > 1 && onClearAll && (
        <button
          onClick={onClearAll}
          className="text-sm text-primary hover:text-primary/80 underline underline-offset-2 focus:outline-none focus:ring-2 focus:ring-primary rounded px-1"
          aria-label="Clear all filters"
        >
          {t('clearFilters')}
        </button>
      )}
    </div>
  );
}
