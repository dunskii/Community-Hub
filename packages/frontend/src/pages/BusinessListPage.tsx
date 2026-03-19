/**
 * BusinessListPage
 * Main business directory listing page with filtering
 * WCAG 2.1 AA compliant
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { PageContainer } from '../components/layout/PageContainer';
import { BusinessList } from '../components/business/BusinessList';
import { BusinessFilters } from '../components/business/BusinessFilters';
import { Pagination } from '../components/display/Pagination';
import { ViewToggle, type ViewMode } from '../components/ui/ViewToggle';
import { useBusinesses } from '../hooks/useBusinesses';
import { useCategories } from '../hooks/useCategories';
import type { BusinessListParams } from '../services/business-api';

// Local storage key for persisting view preference
const VIEW_STORAGE_KEY = 'community-hub-business-view';

export function BusinessListPage() {
  const { t } = useTranslation('business');
  const [searchParams, setSearchParams] = useSearchParams();

  // View mode state with localStorage persistence
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem(VIEW_STORAGE_KEY);
    return (saved === 'list' || saved === 'grid') ? saved : 'grid';
  });

  // Update localStorage when view changes
  const handleViewChange = (newView: ViewMode) => {
    setViewMode(newView);
    localStorage.setItem(VIEW_STORAGE_KEY, newView);
  };

  // Parse filters from URL
  const [filters, setFilters] = useState<BusinessListParams>({
    category: searchParams.get('category') || undefined,
    status: (searchParams.get('status') as any) || undefined,
    openNow: searchParams.get('openNow') === 'true' || undefined,
    search: searchParams.get('search') || undefined,
    page: parseInt(searchParams.get('page') || '1', 10),
    limit: 20,
    sort: searchParams.get('sort') || undefined,
  });

  // Fetch businesses and categories
  const { businesses, pagination, loading, error, setPage, setFilters: updateFilters } = useBusinesses(filters);
  const { categories, loading: categoriesLoading } = useCategories({ active: true, withBusinesses: true });

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams();

    if (filters.category) params.set('category', filters.category);
    if (filters.status) params.set('status', filters.status);
    if (filters.openNow) params.set('openNow', 'true');
    if (filters.search) params.set('search', filters.search);
    if (filters.page && filters.page > 1) params.set('page', String(filters.page));
    if (filters.sort) params.set('sort', filters.sort);

    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  const handleFiltersChange = (newFilters: BusinessListParams) => {
    setFilters(newFilters);
    updateFilters(newFilters);
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
    setPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const platformName = import.meta.env.VITE_PLATFORM_NAME || 'Community Hub';
  const pageTitle = `${t('directoryTitle')} | ${platformName}`;
  const pageDescription = t('directoryDescription');

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={t('directoryTitle')} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={t('directoryTitle')} />
        <meta name="twitter:description" content={pageDescription} />
      </Helmet>

      <PageContainer>
        <div className="business-list-page">
          <header className="business-list-page__header">
            <h1>{t('directoryTitle')}</h1>
            <p className="business-list-page__description">
              {t('directoryDescription')}
            </p>
          </header>

        <BusinessFilters
          filters={filters}
          onChange={handleFiltersChange}
          categories={categories}
          loading={loading || categoriesLoading}
        />

        <div className="business-list-page__results">
          <div className="flex items-center justify-between mb-4">
            {!loading && !error && (
              <p className="business-list-page__count text-gray-600 dark:text-gray-400">
                {t('resultsCount', { count: pagination.total })}
              </p>
            )}
            {loading && <div />}
            <ViewToggle
              view={viewMode}
              onChange={handleViewChange}
              size="sm"
            />
          </div>

          <BusinessList
            viewMode={viewMode}
            businesses={businesses}
            loading={loading}
            error={error}
            emptyMessage={
              filters.search || filters.category || filters.openNow
                ? t('noResultsFiltered')
                : undefined
            }
          />

          {pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </div>
        </div>
      </PageContainer>
    </>
  );
}
