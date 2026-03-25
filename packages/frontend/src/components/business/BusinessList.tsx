/**
 * BusinessList Component
 * Displays a list of businesses with loading and empty states
 * Supports grid and list view modes
 * WCAG 2.1 AA compliant
 */

import type { Business } from '@community-hub/shared';
import { BusinessCard } from './BusinessCard';
import { EmptyState } from '../display/EmptyState';
import { Skeleton } from '../display/Skeleton';
import { useTranslation } from 'react-i18next';
import { ExclamationTriangleIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline';
import type { ViewMode } from '../ui/ViewToggle';

interface BusinessListProps {
  businesses: Business[];
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  /** Distance data for each business (by ID) */
  distances?: Record<string, number>;
  /** Custom click handler for business cards */
  onBusinessClick?: (business: Business) => void;
  /** View mode - grid or list */
  viewMode?: ViewMode;
}

export function BusinessList({
  businesses,
  loading = false,
  error = null,
  emptyMessage,
  distances,
  onBusinessClick,
  viewMode = 'grid',
}: BusinessListProps) {
  const { t } = useTranslation('business');

  // Error state
  if (error) {
    return (
      <EmptyState
        title={t('errorTitle', 'Error Loading Businesses')}
        description={error}
        icon={<ExclamationTriangleIcon className="w-12 h-12 text-warning" />}
      />
    );
  }

  // Loading state
  if (loading) {
    const skeletonCount = viewMode === 'grid' ? 6 : 5;
    const gridClasses = viewMode === 'grid'
      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
      : 'flex flex-col gap-4';

    return (
      <div className={gridClasses} role="status" aria-live="polite" aria-busy="true">
        <span className="sr-only">Loading...</span>
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <div
            key={index}
            className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden ${
              viewMode === 'list' ? 'flex' : ''
            }`}
          >
            <Skeleton
              variant="rectangular"
              width={viewMode === 'list' ? '160px' : '100%'}
              height={viewMode === 'list' ? '160px' : '176px'}
            />
            <div className="p-4 flex-1 space-y-3">
              <div className="flex justify-between">
                <Skeleton variant="text" width="65%" height="22px" />
                <Skeleton variant="text" width="20%" height="22px" />
              </div>
              <Skeleton variant="text" width="90%" height="16px" />
              <Skeleton variant="text" width="75%" height="16px" />
              <div className="flex items-center gap-3 pt-1">
                <Skeleton variant="text" width="25%" height="14px" />
                <Skeleton variant="text" width="20%" height="14px" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (businesses.length === 0) {
    return (
      <EmptyState
        title={emptyMessage || t('noBusinessesTitle', 'No Businesses Found')}
        description={t('noBusinessesDescription', 'There are no businesses available at this time.')}
        icon={<BuildingStorefrontIcon className="w-12 h-12 text-slate-400 dark:text-slate-500" />}
      />
    );
  }

  // Business list - grid or list layout
  const containerClasses = viewMode === 'grid'
    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
    : 'flex flex-col gap-4';

  return (
    <div className={containerClasses}>
      {businesses.map(business => (
        <BusinessCard
          key={business.id}
          business={business}
          distance={distances?.[business.id]}
          onClick={onBusinessClick ? () => onBusinessClick(business) : undefined}
          viewMode={viewMode}
        />
      ))}
    </div>
  );
}
