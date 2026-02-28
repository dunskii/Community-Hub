/**
 * BusinessList Component
 * Displays a list of businesses with loading and empty states
 * WCAG 2.1 AA compliant
 */

import type { Business } from '@community-hub/shared';
import { BusinessCard } from './BusinessCard';
import { EmptyState } from '../display/EmptyState';
import { Skeleton } from '../display/Skeleton';
import { useTranslation } from 'react-i18next';

interface BusinessListProps {
  businesses: Business[];
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  /** Distance data for each business (by ID) */
  distances?: Record<string, number>;
  /** Custom click handler for business cards */
  onBusinessClick?: (business: Business) => void;
}

export function BusinessList({
  businesses,
  loading = false,
  error = null,
  emptyMessage,
  distances,
  onBusinessClick,
}: BusinessListProps) {
  const { t } = useTranslation();

  // Error state
  if (error) {
    return (
      <EmptyState
        title={t('business.errorTitle')}
        description={error}
        icon="⚠️"
      />
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="business-list" role="status" aria-live="polite" aria-busy="true">
        <span className="sr-only">{t('common.loading')}</span>
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="business-list__skeleton">
            <Skeleton variant="rectangular" width="80px" height="80px" />
            <div className="business-list__skeleton-content">
              <Skeleton variant="text" width="60%" height="24px" />
              <Skeleton variant="text" width="90%" height="16px" />
              <Skeleton variant="text" width="40%" height="14px" />
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
        title={emptyMessage || t('business.noBusinessesTitle')}
        description={t('business.noBusinessesDescription')}
        icon="🏪"
      />
    );
  }

  // Business list
  return (
    <div className="business-list">
      {businesses.map(business => (
        <BusinessCard
          key={business.id}
          business={business}
          distance={distances?.[business.id]}
          onClick={onBusinessClick ? () => onBusinessClick(business) : undefined}
        />
      ))}
    </div>
  );
}
