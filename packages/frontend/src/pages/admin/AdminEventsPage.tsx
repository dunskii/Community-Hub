/**
 * AdminEventsPage
 *
 * Admin page for managing all events on the platform.
 * Lists, filters, and allows creating/editing platform events.
 * Spec §23: Administration & Moderation
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { Pagination } from '../../components/display/Pagination';
import { Skeleton } from '../../components/display/Skeleton';
import { Badge } from '../../components/display/Badge';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  EyeIcon,
  PencilSquareIcon,
  ArrowLeftIcon,
  CalendarDaysIcon,
  MapPinIcon,
  UsersIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import {
  listAdminEvents,
  type AdminEvent,
  type PaginatedResponse,
} from '../../services/admin-api';
import { eventService } from '../../services/event-service';

const STATUS_OPTIONS = ['', 'PENDING', 'ACTIVE', 'CANCELLED', 'PAST'] as const;
const SORT_OPTIONS = ['newest', 'oldest', 'upcoming', 'title'] as const;

function getStatusBadge(status: string) {
  switch (status) {
    case 'ACTIVE': return <Badge variant="success">{status}</Badge>;
    case 'PENDING': return <Badge variant="warning">{status}</Badge>;
    case 'CANCELLED': return <Badge variant="error">{status}</Badge>;
    case 'PAST': return <Badge variant="default">{status}</Badge>;
    default: return <Badge>{status}</Badge>;
  }
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AdminEventsPage({ basePath = '/admin' }: { basePath?: string }) {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const page = Number(searchParams.get('page')) || 1;
  const status = searchParams.get('status') || '';
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'newest';
  const [searchInput, setSearchInput] = useState(search);

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result: PaginatedResponse<AdminEvent> = await listAdminEvents({
        page,
        limit: 20,
        status: status || undefined,
        search: search || undefined,
        sort,
      });
      setEvents(result.data);
      setPagination(result.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [page, status, search, sort]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleApprove = async (eventId: string) => {
    try {
      setActionLoading(eventId);
      await eventService.approveEvent(eventId);
      await loadEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve event');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (eventId: string) => {
    try {
      setActionLoading(eventId);
      await eventService.deleteEvent(eventId);
      await loadEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel event');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchInput) params.set('search', searchInput);
    else params.delete('search');
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleStatusFilter = (newStatus: string) => {
    const params = new URLSearchParams(searchParams);
    if (newStatus) params.set('status', newStatus);
    else params.delete('status');
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleSort = (newSort: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('sort', newSort);
    params.set('page', '1');
    setSearchParams(params);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(newPage));
    setSearchParams(params);
  };

  return (
    <PageContainer>
      <Helmet>
        <title>{t('admin.events.title')} | Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="max-w-7xl mx-auto space-y-6">
        <Link to={basePath} className="inline-flex items-center text-sm text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary transition-colors">
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          {t('admin.nav.backToDashboard')}
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-4 sm:mb-0">
            {t('admin.events.title')}
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">
              {pagination.total} {t('admin.events.totalCount')}
            </span>
            <Link
              to={`${basePath}/events/create`}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              <PlusIcon className="h-4 w-4" />
              {t('admin.events.createEvent')}
            </Link>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t('admin.events.searchPlaceholder')}
                className="w-full pl-10 pr-4 py-2 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary"
                aria-label={t('admin.events.searchPlaceholder')}
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors"
            >
              {t('common.search')}
            </button>
          </form>

          <select
            value={status}
            onChange={(e) => handleStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary"
            aria-label={t('admin.events.filterByStatus')}
          >
            <option value="">{t('admin.events.allStatuses')}</option>
            {STATUS_OPTIONS.filter(Boolean).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(e) => handleSort(e.target.value)}
            className="px-4 py-2 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary"
            aria-label={t('admin.events.sortBy')}
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s} value={s}>{t(`admin.events.sort.${s}`)}</option>
            ))}
          </select>
        </div>

        {error && (
          <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 p-4 text-red-600 dark:text-red-400">
            <ExclamationTriangleIcon className="h-5 w-5 inline mr-2" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} width="100%" height="80px" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            {t('admin.events.noResults')}
          </div>
        ) : (
          <>
            {/* Events Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm" role="table">
                  <caption className="sr-only">{t('admin.events.tableCaption')}</caption>
                  <thead className="bg-slate-50 dark:bg-slate-700/50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-300">
                        {t('admin.events.eventTitle')}
                      </th>
                      <th scope="col" className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-300">
                        {t('admin.events.dateTime')}
                      </th>
                      <th scope="col" className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-300">
                        {t('admin.events.status')}
                      </th>
                      <th scope="col" className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-300">
                        {t('admin.events.type')}
                      </th>
                      <th scope="col" className="px-4 py-3 text-center font-medium text-slate-500 dark:text-slate-300">
                        {t('admin.events.rsvps')}
                      </th>
                      <th scope="col" className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-300">
                        {t('admin.events.createdBy')}
                      </th>
                      <th scope="col" className="px-4 py-3 text-right font-medium text-slate-500 dark:text-slate-300">
                        {t('admin.events.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {events.map((event) => (
                      <tr key={event.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">{event.title}</p>
                            {event.businessName && (
                              <p className="text-xs text-slate-500">{event.businessName}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          <CalendarDaysIcon className="h-4 w-4 inline mr-1" />
                          {formatDateTime(event.startTime)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {getStatusBadge(event.status)}
                            {event.status === 'PENDING' && (
                              <button
                                type="button"
                                onClick={() => handleApprove(event.id)}
                                disabled={actionLoading === event.id}
                                className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 disabled:opacity-50 transition-colors"
                              >
                                {actionLoading === event.id ? '...' : t('admin.events.approve', 'Approve')}
                              </button>
                            )}
                            {event.status === 'ACTIVE' && (
                              <button
                                type="button"
                                onClick={() => handleCancel(event.id)}
                                disabled={actionLoading === event.id}
                                className="text-xs px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 disabled:opacity-50 transition-colors"
                              >
                                {actionLoading === event.id ? '...' : t('admin.events.cancel', 'Cancel')}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          <MapPinIcon className="h-4 w-4 inline mr-1" />
                          {event.locationType}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300">
                            <UsersIcon className="h-4 w-4" />
                            {event.rsvpCount}
                            {event.capacity && <span className="text-slate-400">/{event.capacity}</span>}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          {event.createdByName}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              to={`${basePath}/events/${event.id}/edit`}
                              className="p-1.5 rounded-full text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"
                              title={t('admin.events.editEvent', 'Edit event')}
                            >
                              <PencilSquareIcon className="h-4 w-4" />
                            </Link>
                            {event.slug && (
                              <Link
                                to={`/events/${event.slug}`}
                                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                title={t('admin.events.viewEvent')}
                              >
                                <EyeIcon className="h-4 w-4" />
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {pagination.totalPages > 1 && (
              <div className="mt-4 flex justify-center">
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </div>
    </PageContainer>
  );
}
