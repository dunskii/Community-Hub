/**
 * OwnerEventsPage
 *
 * Business owner page for viewing and managing events linked to their business.
 * Shows all events with status badges and actions for create/edit.
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { PageContainer } from '../../components/layout/PageContainer';
import { Badge } from '../../components/display/Badge';
import { Skeleton } from '../../components/display/Skeleton';
import { EmptyState } from '../../components/display/EmptyState';
import { Pagination } from '../../components/display/Pagination';
import { eventService, type Event, type EventStatus, formatEventDate } from '../../services/event-service';
import { businessApi } from '../../services/business-api';
import {
  ArrowLeftIcon,
  PlusIcon,
  PencilSquareIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const STATUS_BADGE_VARIANTS: Record<EventStatus, 'warning' | 'success' | 'default' | 'error'> = {
  PENDING: 'warning',
  ACTIVE: 'success',
  PAST: 'default',
  CANCELLED: 'error',
};

const ITEMS_PER_PAGE = 10;

export function OwnerEventsPage() {
  const { t, i18n } = useTranslation();
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();

  const [events, setEvents] = useState<Event[]>([]);
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchEvents = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await eventService.listEvents({
        linkedBusinessId: businessId,
        includePast: true,
        page,
        limit: ITEMS_PER_PAGE,
        sort: 'newest',
      });
      setEvents(response.data.events);
      setTotalPages(response.data.pagination.totalPages);
      setTotal(response.data.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error', 'Something went wrong'));
    } finally {
      setLoading(false);
    }
  }, [businessId, page]);

  useEffect(() => {
    async function loadBusiness() {
      if (!businessId) return;
      try {
        const business = await businessApi.getBusinessById(businessId);
        const name = business.name;
        setBusinessName(typeof name === 'string' ? name : name?.en || '');
      } catch {
        // Business name is non-critical
      }
    }
    loadBusiness();
  }, [businessId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const platformName = import.meta.env.VITE_PLATFORM_NAME || 'Community Hub';

  return (
    <PageContainer>
      <Helmet>
        <title>{t('owner.events.title')} — {businessName || t('owner.events.title')} | {platformName}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back link */}
        <button
          type="button"
          onClick={() => navigate('/business/dashboard')}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          {t('analytics.backToDashboard', 'Back to Dashboard')}
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              {t('owner.events.title')}
            </h1>
            {businessName && (
              <p className="text-slate-500 dark:text-slate-400 mt-1">{businessName}</p>
            )}
          </div>
          <Link
            to={`/business/manage/${businessId}/events/create`}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-medium text-sm shadow-sm"
          >
            <PlusIcon className="h-4 w-4" />
            {t('owner.events.createEvent')}
          </Link>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 p-4 text-red-600 dark:text-red-400">
            <ExclamationTriangleIcon className="h-5 w-5 inline mr-2" />
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-center gap-4">
                  <Skeleton width="48px" height="48px" variant="rectangular" />
                  <div className="flex-1 space-y-2">
                    <Skeleton width="60%" height="20px" />
                    <Skeleton width="40%" height="16px" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          /* Empty state */
          <EmptyState
            title={t('owner.events.noEventsTitle')}
            description={t('owner.events.noEventsDescription')}
            icon="📅"
            action={
              <Link
                to={`/business/manage/${businessId}/events/create`}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-medium text-sm"
              >
                <PlusIcon className="h-4 w-4" />
                {t('owner.events.createEvent')}
              </Link>
            }
          />
        ) : (
          /* Events list */
          <>
            <div className="space-y-3">
              {events.map((event) => {
                const dateInfo = formatEventDate(event.startTime, event.endTime, i18n.language === 'en' ? 'en-AU' : i18n.language);
                const canEdit = event.status === 'PENDING' || event.status === 'ACTIVE';
                const statusKey = event.status.toLowerCase() as 'pending' | 'active' | 'past' | 'cancelled';

                return (
                  <div
                    key={event.id}
                    className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start gap-4">
                      {/* Date badge */}
                      <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex flex-col items-center justify-center">
                        <span className="text-[10px] font-semibold text-primary uppercase leading-none">
                          {new Date(event.startTime).toLocaleDateString(i18n.language, { month: 'short' })}
                        </span>
                        <span className="text-lg font-bold text-primary leading-tight">
                          {new Date(event.startTime).getDate()}
                        </span>
                      </div>

                      {/* Event info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <Link
                              to={`/events/${event.slug || event.id}`}
                              className="text-base font-semibold text-slate-900 dark:text-white hover:text-primary transition-colors line-clamp-1"
                            >
                              {event.title}
                            </Link>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                              {dateInfo.date} · {dateInfo.time}
                            </p>
                          </div>
                          <Badge
                            variant={STATUS_BADGE_VARIANTS[event.status]}
                            size="sm"
                          >
                            {t(`owner.events.status.${statusKey}`)}
                          </Badge>
                        </div>

                        {/* Location */}
                        {event.venue && (
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 truncate">
                            {[event.venue.name, event.venue.street, event.venue.suburb].filter(Boolean).join(', ')}
                          </p>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-3 mt-3">
                          {canEdit && (
                            <Link
                              to={`/business/manage/${businessId}/events/${event.id}/edit`}
                              className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                            >
                              <PencilSquareIcon className="h-3.5 w-3.5" />
                              {t('owner.events.editEvent')}
                            </Link>
                          )}
                          <Link
                            to={`/events/${event.slug || event.id}`}
                            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                          >
                            <CalendarDaysIcon className="h-3.5 w-3.5" />
                            {t('events.viewEvent', 'View')}
                          </Link>
                          {event.rsvpCount.going > 0 && (
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                              {t('events.rsvp.goingCount', { count: event.rsvpCount.going })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center pt-4">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}

            <p className="text-center text-sm text-slate-400 dark:text-slate-500">
              {t('events.totalCount', '{{count}} events', { count: total })}
            </p>
          </>
        )}
      </div>
    </PageContainer>
  );
}
