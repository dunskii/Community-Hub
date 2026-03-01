/**
 * QuickFilters Component
 * Phase 5: Search & Discovery - Homepage Discovery
 *
 * Quick filter chips for common searches
 */

import React from 'react';
import { useTranslation } from 'react-i18next';

export interface QuickFiltersProps {
  /** Callback when filter is clicked */
  onFilterClick: (filter: { category?: string; openNow?: boolean; verifiedOnly?: boolean }) => void;
}

export function QuickFilters({ onFilterClick }: QuickFiltersProps) {
  const { t } = useTranslation('home');

  const quickFilters = [
    { label: t('quickFilters.openNow'), filter: { openNow: true }, icon: '🕐' },
    { label: t('quickFilters.restaurants'), filter: { category: 'restaurants' }, icon: '🍽️' },
    { label: t('quickFilters.retail'), filter: { category: 'retail' }, icon: '🛍️' },
    { label: t('quickFilters.health'), filter: { category: 'health' }, icon: '🏥' },
    { label: t('quickFilters.services'), filter: { category: 'services' }, icon: '🔧' },
    { label: t('quickFilters.verified'), filter: { verifiedOnly: true }, icon: '✓' },
  ];

  return (
    <div className="bg-neutral-light border-b border-neutral-medium">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
          <span className="text-sm font-semibold text-neutral-dark whitespace-nowrap">
            {t('quickFilters.title')}
          </span>
          {quickFilters.map((item, index) => (
            <button
              key={index}
              onClick={() => onFilterClick(item.filter)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-neutral-medium text-dark hover:bg-primary-tint-95 hover:border-primary transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <span className="text-lg" aria-hidden="true">{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
