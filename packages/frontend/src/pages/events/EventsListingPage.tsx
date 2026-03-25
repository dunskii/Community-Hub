/**
 * EventsListingPage
 * Phase 8: Events & Calendar System
 * Main events listing page with horizontal filters, search, and responsive card grid
 * Material 3 inspired layout - WCAG 2.1 AA compliant, SEO optimized
 */

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { PageContainer } from '../../components/layout/PageContainer';
import { EventCard } from '../../components/events/EventCard';
import { EventFilters } from '../../components/events/EventFilters';
import { Pagination } from '../../components/display/Pagination';
import { Skeleton } from '../../components/display/Skeleton';
import { EmptyState } from '../../components/display/EmptyState';
import { Alert } from '../../components/display/Alert';
import { useAuth } from '../../hooks/useAuth';
import { eventService } from '../../services/event-service';
import type { Event, EventFilters as EventFiltersType, EventsResponse } from '../../services/event-service';

export function EventsListingPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    hasMore: false,
  });

  // Parse filters from URL
  const [filters, setFilters] = useState<EventFiltersType>(() => ({
    dateFrom: searchParams.get('dateFrom') || undefined,
    dateTo: searchParams.get('dateTo') || undefined,
    categoryId: searchParams.get('categoryId') || undefined,
    locationType: (searchParams.get('locationType') as EventFiltersType['locationType']) || undefined,
    distance: searchParams.get('distance') ? Number(searchParams.get('distance')) : undefined,
    latitude: searchParams.get('latitude') ? Number(searchParams.get('latitude')) : undefined,
    longitude: searchParams.get('longitude') ? Number(searchParams.get('longitude')) : undefined,
    freeOnly: searchParams.get('freeOnly') === 'true' || undefined,
    includePast: searchParams.get('includePast') === 'true' || undefined,
    search: searchParams.get('search') || undefined,
    page: parseInt(searchParams.get('page') || '1', 10),
    limit: 12,
    sort: (searchParams.get('sort') as EventFiltersType['sort']) || 'upcoming',
  }));

  // Categories state (would normally come from API)
  const [categories] = useState<Array<{ id: string; name: string; slug: string }>>([]);

  // User location for distance filtering
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | undefined>();

  // Request user location
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          // User denied or error - location filter won't be available
        }
      );
    }
  }, []);

  // Fetch events
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response: EventsResponse = await eventService.listEvents(filters);
      setEvents(response.data.events);
      setPagination({
        page: response.data.pagination.page,
        totalPages: response.data.pagination.totalPages,
        total: response.data.pagination.total,
        hasMore: response.data.pagination.hasMore,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('events.error.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [filters, t]);

  // Fetch on mount and filter change
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams();

    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.set('dateTo', filters.dateTo);
    if (filters.categoryId) params.set('categoryId', filters.categoryId);
    if (filters.locationType) params.set('locationType', filters.locationType);
    if (filters.distance) params.set('distance', String(filters.distance));
    if (filters.freeOnly) params.set('freeOnly', 'true');
    if (filters.includePast) params.set('includePast', 'true');
    if (filters.search) params.set('search', filters.search);
    if (filters.page && filters.page > 1) params.set('page', String(filters.page));
    if (filters.sort && filters.sort !== 'upcoming') params.set('sort', filters.sort);

    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  const handleFiltersChange = (newFilters: Partial<EventFiltersType>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: 1, // Reset to first page when filters change
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((prev) => ({
      ...prev,
      search: searchQuery.trim() || undefined,
      page: 1,
    }));
  };

  const platformName = import.meta.env.VITE_PLATFORM_NAME || 'Community Hub';
  const pageTitle = `${t('events.pageTitle')} | ${platformName}`;
  const pageDescription = t('events.pageDescription');

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={t('events.pageTitle')} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={t('events.pageTitle')} />
        <meta name="twitter:description" content={pageDescription} />
      </Helmet>

      <PageContainer>
        <div className="events-listing-page py-2">
          {/* Hero header section */}
          <header className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
              <div className="text-left">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {t('events.pageTitle')}
                </h1>
                <p className="mt-1 text-gray-600 dark:text-gray-400">{t('events.pageDescription')}</p>
              </div>

              {user && (
                <Link
                  to="/events/create"
                  className="inline-flex items-center justify-center px-5 py-2.5 bg-primary text-white rounded-full hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 min-h-[44px] font-medium shadow-sm transition-colors"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  {t('events.createEvent')}
                </Link>
              )}
            </div>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="relative mb-5">
              <div className="relative">
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('events.searchPlaceholder', 'Search events...')}
                  className="w-full pl-12 pr-4 py-3 min-h-[48px] bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary shadow-sm transition-shadow hover:shadow-md"
                  aria-label={t('events.searchPlaceholder', 'Search events...')}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setFilters((prev) => ({ ...prev, search: undefined, page: 1 }));
                    }}
                    className="absolute right-14 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                    aria-label={t('common.clear', 'Clear search')}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 min-h-[36px] transition-colors"
                >
                  {t('common.search', 'Search')}
                </button>
              </div>
            </form>

            {/* Horizontal filter bar */}
            <EventFilters
              filters={filters}
              onChange={handleFiltersChange}
              categories={categories}
              userLocation={userLocation}
              showDistance={!!userLocation}
            />
          </header>

          {/* Results count */}
          {!loading && !error && (
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              {t('events.resultsCount', { count: pagination.total })}
            </p>
          )}

          {/* Error state */}
          {error && (
            <Alert type="critical" message={error} />
          )}

          {/* Loading state */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
                  <Skeleton variant="rectangular" width="100%" height="200px" />
                  <div className="p-4 space-y-3">
                    <Skeleton variant="text" width="30%" height="20px" />
                    <Skeleton variant="text" width="80%" height="24px" />
                    <Skeleton variant="text" width="60%" height="18px" />
                    <div className="flex justify-between pt-2">
                      <Skeleton variant="text" width="40%" height="18px" />
                      <Skeleton variant="text" width="15%" height="24px" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Events grid - full width, responsive columns */}
          {!loading && !error && events.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && events.length === 0 && (
            <div className="py-16">
              <EmptyState
                title={t('events.noEventsTitle')}
                description={
                  Object.keys(filters).some(
                    (k) => k !== 'page' && k !== 'limit' && k !== 'sort' && filters[k as keyof EventFiltersType]
                  )
                    ? t('events.noEventsFiltered')
                    : t('events.noEventsDescription')
                }
                icon="📅"
                action={
                  user ? (
                    <Link
                      to="/events/create"
                      className="inline-flex items-center px-5 py-2.5 bg-primary text-white rounded-full hover:bg-primary/90 font-medium shadow-sm"
                    >
                      {t('events.createFirstEvent')}
                    </Link>
                  ) : undefined
                }
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
        </div>
      </PageContainer>
    </>
  );
}

export default EventsListingPage;
