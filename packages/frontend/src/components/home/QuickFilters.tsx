/**
 * QuickFilters Component
 * Phase 5: Search & Discovery - Homepage Discovery
 *
 * Quick filter chips for common searches
 */

import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ClockIcon,
  BuildingStorefrontIcon,
  ShoppingBagIcon,
  PlusCircleIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';

export interface QuickFiltersProps {
  /** Callback when filter is clicked */
  onFilterClick: (filter: { category?: string; openNow?: boolean; verifiedOnly?: boolean }) => void;
  /** Search bar element to render on the right */
  searchBar?: ReactNode;
}

export function QuickFilters({ onFilterClick, searchBar }: QuickFiltersProps) {
  const { t } = useTranslation('home');

  const quickFilters = [
    { label: t('quickFilters.openNow'), filter: { openNow: true }, Icon: ClockIcon },
    { label: t('quickFilters.restaurants'), filter: { category: 'restaurant' }, Icon: BuildingStorefrontIcon },
    { label: t('quickFilters.retail'), filter: { category: 'retail' }, Icon: ShoppingBagIcon },
    { label: t('quickFilters.health'), filter: { category: 'health' }, Icon: PlusCircleIcon },
    { label: t('quickFilters.services'), filter: { category: 'services' }, Icon: WrenchScrewdriverIcon },
  ];

  return (
    <div className="bg-neutral-light border-b border-neutral-medium">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Quick filter chips */}
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide flex-1 min-w-0">
            <span className="text-sm font-semibold text-neutral-dark whitespace-nowrap">
              {t('quickFilters.title')}
            </span>
            {quickFilters.map((item, index) => (
              <button
                key={index}
                onClick={() => onFilterClick(item.filter)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-neutral-medium text-dark hover:bg-primary-tint-95 hover:border-primary transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                <item.Icon className="w-5 h-5" aria-hidden="true" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Search bar */}
          {searchBar && (
            <div className="w-full lg:w-80 xl:w-96 flex-shrink-0">
              {searchBar}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
