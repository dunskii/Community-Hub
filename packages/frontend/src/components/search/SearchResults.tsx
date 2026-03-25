/**
 * SearchResults Component
 * Phase 5: Search & Discovery
 *
 * Displays search results in a responsive card grid with M3 styling
 */

import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Pagination } from '../display/Pagination.js';
import { EmptyState } from '../display/EmptyState.js';
import { Skeleton } from '../display/Skeleton.js';
import type { BusinessSearchResult, SearchResponse } from '@community-hub/shared';

export interface SearchResultsProps {
  /** Search results */
  results?: SearchResponse<BusinessSearchResult>;
  /** Loading state */
  isLoading?: boolean;
  /** Error state */
  error?: string | null;
  /** Current page */
  page?: number;
  /** Callback when page changes */
  onPageChange?: (page: number) => void;
  /** Custom CSS class */
  className?: string;
}

export function SearchResults({
  results,
  isLoading = false,
  error = null,
  page = 1,
  onPageChange,
  className = '',
}: SearchResultsProps) {
  const { t } = useTranslation('search');

  // Error State
  if (error) {
    return (
      <div className={`py-16 ${className}`}>
        <EmptyState
          icon={
            <svg className="h-12 w-12 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          }
          title={t('errorLoading')}
          description={error || t('errorDescription')}
        />
      </div>
    );
  }

  // Loading State
  if (isLoading) {
    return (
      <div className={className}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
              <Skeleton variant="rectangular" width="100%" height="176px" />
              <div className="p-4 space-y-3">
                <div className="flex justify-between">
                  <Skeleton variant="text" width="65%" height="24px" />
                  <Skeleton variant="text" width="20%" height="22px" />
                </div>
                <Skeleton variant="text" width="90%" height="16px" />
                <Skeleton variant="text" width="75%" height="16px" />
                <div className="flex items-center gap-3 pt-1">
                  <Skeleton variant="text" width="25%" height="16px" />
                  <Skeleton variant="text" width="20%" height="16px" />
                  <Skeleton variant="text" width="15%" height="16px" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // No Results
  if (!results || results.results.length === 0) {
    return (
      <div className={`py-16 ${className}`}>
        <EmptyState
          icon={
            <svg className="h-12 w-12 text-neutral-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          }
          title={t('noResults')}
          description={t('noResultsDescription')}
        />
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Results Count */}
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        {t('resultsCount', { count: results.total })}
      </p>

      {/* Results Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.results.map((business) => (
          <Link
            key={business.id}
            to={`/businesses/${business.id}`}
            className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-2xl"
          >
            <article className="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200 h-full">
              {/* Business Image Placeholder */}
              <div className="h-44 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                <svg className="w-12 h-12 text-primary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>

              <div className="p-4">
                {/* Business Name */}
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white line-clamp-1 group-hover:text-primary transition-colors leading-snug">
                    {business.name}
                    {business.verified && (
                      <svg className="inline-block h-4 w-4 text-primary ml-1" fill="currentColor" viewBox="0 0 20 20" aria-label="Verified">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </h3>
                </div>

                {/* Category */}
                {business.categoryName && (
                  <p className="text-sm text-primary/80 mb-2">{business.categoryName}</p>
                )}

                {/* Description */}
                {business.highlights?.description ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2" dangerouslySetInnerHTML={{ __html: business.highlights.description }} />
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{business.description}</p>
                )}

                {/* Metadata row */}
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                  {/* Rating */}
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {business.rating.toFixed(1)}
                    <span className="text-gray-400">({business.reviewCount})</span>
                  </span>

                  {/* Distance */}
                  {business.distance !== undefined && (
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {business.distance.toFixed(1)} km
                    </span>
                  )}
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {results.totalPages > 1 && (
        <div className="mt-8">
          {onPageChange && (
            <Pagination
              currentPage={page}
              totalPages={results.totalPages}
              onPageChange={onPageChange}
            />
          )}
        </div>
      )}
    </div>
  );
}
