/**
 * EventsListingPage
 * Phase 8: Events & Calendar System
 * Main events listing page with filtering and pagination
 * WCAG 2.1 AA compliant, SEO optimized
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
        <div className="events-listing-page">
          {/* Header */}
          <header className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {t('events.pageTitle')}
                </h1>
                <p className="mt-1 text-gray-600">{t('events.pageDescription')}</p>
              </div>

              {user && (
                <Link
                  to="/events/create"
                  className="inline-flex items-center justify-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 min-h-[44px]"
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
          </header>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar - Filters */}
            <aside className="lg:col-span-1">
              <EventFilters
                filters={filters}
                onChange={handleFiltersChange}
                categories={categories}
                userLocation={userLocation}
                showDistance={!!userLocation}
              />
            </aside>

            {/* Main Content - Event Grid */}
            <main className="lg:col-span-3">
              {/* Results count */}
              {!loading && !error && (
                <p className="mb-4 text-sm text-gray-600">
                  {t('events.resultsCount', { count: pagination.total })}
                </p>
              )}

              {/* Error state */}
              {error && (
                <Alert type="critical" message={error} />
              )}

              {/* Loading state */}
              {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden">
                      <Skeleton variant="rectangular" width="100%" height="192px" />
                      <div className="p-4 space-y-2">
                        <Skeleton variant="text" width="30%" height="24px" />
                        <Skeleton variant="text" width="80%" height="28px" />
                        <Skeleton variant="text" width="60%" height="20px" />
                        <Skeleton variant="text" width="50%" height="20px" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Events grid */}
              {!loading && !error && events.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {events.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!loading && !error && events.length === 0 && (
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
                        className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                      >
                        {t('events.createFirstEvent')}
                      </Link>
                    ) : undefined
                  }
                />
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </main>
          </div>
        </div>
      </PageContainer>
    </>
  );
}

export default EventsListingPage;
