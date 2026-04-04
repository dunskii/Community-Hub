/**
 * AdminBusinessesPage
 *
 * Admin page for managing all businesses on the platform.
 * Lists, searches, filters, and allows status changes and editing.
 * Spec §23.3: Admin Business Management
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { Pagination } from '../../components/display/Pagination';
import { Skeleton } from '../../components/display/Skeleton';
import {
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusIcon,
  ArrowUpTrayIcon,
  TagIcon,
  EyeIcon,
  PhotoIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { AssignOwnerModal } from '../../components/admin/AssignOwnerModal';
import {
  listAdminBusinesses,
  updateBusinessStatus,
  type AdminBusiness,
  type PaginatedResponse,
} from '../../services/admin-api';

const STATUS_OPTIONS = ['', 'ACTIVE', 'PENDING', 'SUSPENDED', 'DELETED'] as const;
const SORT_OPTIONS = ['newest', 'oldest', 'name'] as const;

export function AdminBusinessesPage({ basePath = '/admin' }: { basePath?: string }) {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [businesses, setBusinesses] = useState<AdminBusiness[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);
  const [assignOwnerBusiness, setAssignOwnerBusiness] = useState<AdminBusiness | null>(null);

  // Filters from URL params
  const page = Number(searchParams.get('page')) || 1;
  const status = searchParams.get('status') || '';
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'newest';
  const [searchInput, setSearchInput] = useState(search);

  const loadBusinesses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result: PaginatedResponse<AdminBusiness> = await listAdminBusinesses({
        page,
        limit: 20,
        status: status || undefined,
        search: search || undefined,
        sort,
      });
      setBusinesses(result.data);
      setPagination(result.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load businesses');
    } finally {
      setLoading(false);
    }
  }, [page, status, search, sort]);

  useEffect(() => {
    loadBusinesses();
  }, [loadBusinesses]);

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

  const handleStatusChange = async (businessId: string, newStatus: string) => {
    try {
      setStatusUpdating(businessId);
      await updateBusinessStatus(businessId, newStatus);
      await loadBusinesses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setStatusUpdating(null);
    }
  };

  return (
    <PageContainer>
      <Helmet>
        <title>{t('admin.businesses.title')} | Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="max-w-7xl mx-auto space-y-6">
        <Link to={basePath} className="inline-flex items-center text-sm text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary transition-colors">
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          {t('admin.nav.backToDashboard')}
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-4 sm:mb-0">
            {t('admin.businesses.title')}
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">
              {pagination.total} {t('admin.businesses.totalCount')}
            </span>
            <Link
              to={`${basePath}/businesses/import`}
              className="flex items-center gap-2 px-4 py-2 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
            >
              <ArrowUpTrayIcon className="h-4 w-4" />
              {t('admin.businesses.importCSV', 'Import CSV')}
            </Link>
            <Link
              to={`${basePath}/businesses/create`}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              <PlusIcon className="h-4 w-4" />
              {t('admin.businesses.addBusiness', 'Add Business')}
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
                placeholder={t('admin.businesses.searchPlaceholder')}
                className="w-full pl-10 pr-4 py-2 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                aria-label={t('admin.businesses.searchPlaceholder')}
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
            aria-label={t('admin.businesses.filterByStatus')}
          >
            <option value="">{t('admin.businesses.allStatuses')}</option>
            {STATUS_OPTIONS.filter(Boolean).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(e) => handleSort(e.target.value)}
            className="px-4 py-2 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary"
            aria-label={t('admin.businesses.sortBy')}
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s} value={s}>{t(`admin.businesses.sort.${s}`)}</option>
            ))}
          </select>
        </div>

        {/* Error State */}
        {error && (
          <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 p-4 text-red-600 dark:text-red-400">
            <ExclamationTriangleIcon className="h-5 w-5 inline mr-2" />
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} width="100%" height="72px" />
            ))}
          </div>
        ) : businesses.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            {t('admin.businesses.noResults')}
          </div>
        ) : (
          <>
            {/* Business Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm" role="table">
                  <caption className="sr-only">{t('admin.businesses.tableCaption')}</caption>
                  <thead className="bg-slate-50 dark:bg-slate-700/50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-300">
                        {t('admin.businesses.name')}
                      </th>
                      <th scope="col" className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-300">
                        {t('admin.businesses.category')}
                      </th>
                      <th scope="col" className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-300">
                        {t('admin.businesses.status')}
                      </th>
                      <th scope="col" className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-300">
                        {t('admin.businesses.owner')}
                      </th>
                      <th scope="col" className="px-4 py-3 text-center font-medium text-slate-500 dark:text-slate-300">
                        {t('admin.businesses.reviews')}
                      </th>
                      <th scope="col" className="px-4 py-3 text-center font-medium text-slate-500 dark:text-slate-300">
                        {t('admin.businesses.deals')}
                      </th>
                      <th scope="col" className="px-4 py-3 text-right font-medium text-slate-500 dark:text-slate-300">
                        {t('admin.businesses.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {businesses.map((business) => (
                      <tr key={business.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">{business.name}</p>
                            <p className="text-xs text-slate-500">{business.phone}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          {business.categoryName}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={business.status}
                            onChange={(e) => handleStatusChange(business.id, e.target.value)}
                            disabled={statusUpdating === business.id}
                            className="text-xs px-2 py-1 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary"
                            aria-label={`${t('admin.businesses.changeStatus')} ${business.name}`}
                          >
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="PENDING">PENDING</option>
                            <option value="SUSPENDED">SUSPENDED</option>
                            <option value="DELETED">DELETED</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          {business.ownerName || (
                            <span className="text-slate-400 italic">{t('admin.businesses.unclaimed')}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300">
                          {business.reviewCount}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300">
                          {business.dealCount}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              to={`/businesses/${business.slug}`}
                              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                              title={t('admin.businesses.view')}
                            >
                              <EyeIcon className="h-4 w-4" />
                            </Link>
                            <Link
                              to={`${basePath}/businesses/${business.id}/edit`}
                              className="p-1.5 rounded-full text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"
                              title={t('admin.businesses.edit')}
                            >
                              <PencilSquareIcon className="h-4 w-4" />
                            </Link>
                            <Link
                              to={`${basePath}/businesses/${business.id}/photos`}
                              className="p-1.5 rounded-full text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                              title={t('admin.businesses.managePhotos')}
                            >
                              <PhotoIcon className="h-4 w-4" />
                            </Link>
                            <Link
                              to={`${basePath}/businesses/${business.id}/edit?tab=promotions`}
                              className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
                              title={t('admin.businesses.manageDealsBtnTitle')}
                            >
                              <TagIcon className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => setAssignOwnerBusiness(business)}
                              className="p-1.5 rounded-full text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors"
                              title={t('admin.businesses.assignOwner', 'Assign Owner')}
                            >
                              <UserIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
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

        {/* Assign Owner Modal */}
        {assignOwnerBusiness && (
          <AssignOwnerModal
            businessId={assignOwnerBusiness.id}
            businessName={assignOwnerBusiness.name}
            currentOwner={assignOwnerBusiness.ownerName}
            onClose={() => setAssignOwnerBusiness(null)}
            onAssigned={() => {
              setAssignOwnerBusiness(null);
              loadBusinesses();
            }}
          />
        )}
      </div>
    </PageContainer>
  );
}
