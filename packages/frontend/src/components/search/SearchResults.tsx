/**
 * SearchResults Component
 * Phase 5: Search & Discovery
 *
 * Displays search results with pagination
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { BusinessCard } from '../business/BusinessCard.js';
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
      <div className={className}>
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
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-6">
              <Skeleton height={24} width="60%" className="mb-2" />
              <Skeleton height={16} width="40%" className="mb-4" />
              <Skeleton height={16} width="100%" className="mb-2" />
              <Skeleton height={16} width="90%" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // No Results
  if (!results || results.results.length === 0) {
    return (
      <div className={className}>
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
      <div className="mb-4">
        <p className="text-sm text-neutral-dark">
          {t('resultsCount', { count: results.total })}
        </p>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {results.results.map(business => (
          <div key={business.id} className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
            <a href={`/businesses/${business.id}`} className="block">
              {/* Business Name */}
              <h3 className="text-lg font-semibold text-dark mb-1">
                {business.name}
                {business.verified && (
                  <svg className="inline-block h-5 w-5 text-primary ml-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </h3>

              {/* Category */}
              <p className="text-sm text-neutral-dark mb-2">{business.categoryName}</p>

              {/* Description with highlights */}
              {business.highlights?.description ? (
                <p className="text-sm text-dark mb-3" dangerouslySetInnerHTML={{ __html: business.highlights.description }} />
              ) : (
                <p className="text-sm text-dark mb-3 line-clamp-2">{business.description}</p>
              )}

              {/* Rating & Reviews */}
              <div className="flex items-center mb-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`h-4 w-4 ${i < Math.floor(business.rating) ? 'text-warning' : 'text-neutral-light'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <span className="ml-1 text-sm text-neutral-dark">
                    {business.rating.toFixed(1)} ({business.reviewCount})
                  </span>
                </div>
              </div>

              {/* Distance */}
              {business.distance !== undefined && (
                <p className="text-sm text-neutral-dark">
                  <svg className="inline-block h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {business.distance.toFixed(1)} km
                </p>
              )}
            </a>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {results.totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <Pagination
            currentPage={page}
            totalPages={results.totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}
