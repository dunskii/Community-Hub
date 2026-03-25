/**
 * DealsListingPage
 * Phase 10: Promotions & Deals
 * Main deals/promotions listing page with filters and responsive card grid
 * Material 3 inspired layout - WCAG 2.1 AA compliant
 */

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { PageContainer } from '../components/layout/PageContainer';
import { DealCard } from '../components/deals/DealCard';
import { DealDetailModal } from '../components/deals/DealDetailModal';
import { Pagination } from '../components/display/Pagination';
import { Skeleton } from '../components/display/Skeleton';
import { EmptyState } from '../components/display/EmptyState';
import { Alert } from '../components/display/Alert';
import { dealApi } from '../services/deal-api';
import type { Deal, DealFilterInput } from '@community-hub/shared';

export function DealsListingPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    hasMore: false,
  });

  const [filters, setFilters] = useState<Partial<DealFilterInput>>(() => ({
    validNow: searchParams.get('validNow') !== 'false',
    sort: (searchParams.get('sort') as DealFilterInput['sort']) || 'newest',
    page: parseInt(searchParams.get('page') || '1', 10),
    limit: 12,
  }));

  const fetchDeals = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await dealApi.getActiveDeals(filters);
      setDeals(response.deals);
      setPagination({
        page: response.pagination.page,
        totalPages: response.pagination.totalPages,
        total: response.pagination.total,
        hasMore: response.pagination.hasMore,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('deal.error.loadFailed', 'Failed to load deals'));
    } finally {
      setLoading(false);
    }
  }, [filters, t]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams();

    if (filters.sort && filters.sort !== 'newest') params.set('sort', filters.sort);
    if (filters.validNow === false) params.set('validNow', 'false');
    if (filters.page && filters.page > 1) params.set('page', String(filters.page));

    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const sortOptions = [
    { value: 'newest', label: t('deal.sort.newest', 'Newest') },
    { value: 'endingSoon', label: t('deal.sort.endingSoon', 'Ending Soon') },
    { value: 'featured', label: t('deal.sort.featured', 'Featured') },
    { value: 'discount', label: t('deal.sort.discount', 'Biggest Discount') },
  ];

  const platformName = import.meta.env.VITE_PLATFORM_NAME || 'Community Hub';
  const pageTitle = `${t('deal.title')} | ${platformName}`;
  const pageDescription = t('deal.description');

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={t('deal.title')} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
      </Helmet>

      <PageContainer>
        <div className="py-2 pb-16">
          {/* Header */}
          <header className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
              <div className="text-left">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {t('deal.title')}
                </h1>
                <p className="mt-1 text-gray-600 dark:text-gray-400">
                  {t('deal.description')}
                </p>
              </div>
            </div>

            {/* Horizontal filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Sort */}
              <div className="relative">
                <select
                  aria-label={t('deal.sort.label', 'Sort by')}
                  value={filters.sort || 'newest'}
                  onChange={(e) => setFilters((prev) => ({ ...prev, sort: e.target.value as DealFilterInput['sort'], page: 1 }))}
                  className="appearance-none rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 pl-3 pr-8 py-2 min-h-[36px] hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary cursor-pointer transition-colors"
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <svg
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* Include expired toggle */}
              <button
                type="button"
                onClick={() => setFilters((prev) => ({ ...prev, validNow: prev.validNow === false ? true : false, page: 1 }))}
                className={`inline-flex items-center rounded-full border text-sm px-3 py-2 min-h-[36px] transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                  filters.validNow === false
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-primary'
                }`}
                aria-pressed={filters.validNow === false}
              >
                {t('deal.showExpired', 'Include expired')}
              </button>
            </div>
          </header>

          {/* Results count */}
          {!loading && !error && (
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              {t('deal.resultsCount', { count: pagination.total, defaultValue: '{{count}} deals found' })}
            </p>
          )}

          {/* Error */}
          {error && <Alert type="critical" message={error} />}

          {/* Loading */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
                  <Skeleton variant="rectangular" width="100%" height="176px" />
                  <div className="p-4 space-y-3">
                    <Skeleton variant="text" width="30%" height="24px" />
                    <Skeleton variant="text" width="75%" height="22px" />
                    <Skeleton variant="text" width="50%" height="16px" />
                    <div className="flex justify-between pt-2">
                      <Skeleton variant="text" width="30%" height="20px" />
                      <Skeleton variant="text" width="25%" height="16px" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Deals grid */}
          {!loading && !error && deals.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {deals.map((deal) => (
                <DealCard
                  key={deal.id}
                  deal={deal}
                  onClick={() => setSelectedDeal(deal)}
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && deals.length === 0 && (
            <div className="py-16">
              <EmptyState
                title={t('deal.empty.title')}
                description={t('deal.empty.description')}
                icon="🏷️"
              />
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}

          {/* Deal Detail Modal */}
          {selectedDeal && (
            <DealDetailModal
              deal={selectedDeal}
              onClose={() => setSelectedDeal(null)}
              showBusinessLink
            />
          )}
        </div>
      </PageContainer>
    </>
  );
}

export default DealsListingPage;
