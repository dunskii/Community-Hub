/**
 * AdminUsersPage
 *
 * Admin page for managing platform users.
 * Lists users with role changes and suspend/unsuspend capabilities.
 * Spec §23.2: User Management
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { Pagination } from '../../components/display/Pagination';
import { Skeleton } from '../../components/display/Skeleton';
import { Badge } from '../../components/display/Badge';
import { Modal } from '../../components/display/Modal';
import {
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  NoSymbolIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import {
  listUsers,
  updateUserRole,
  suspendUser,
  unsuspendUser,
  type AdminUser,
  type PaginatedResponse,
} from '../../services/admin-api';

const ROLE_OPTIONS = ['', 'COMMUNITY', 'BUSINESS_OWNER', 'MODERATOR', 'CURATOR', 'ADMIN'] as const;
const STATUS_OPTIONS = ['', 'ACTIVE', 'SUSPENDED', 'PENDING'] as const;
const SORT_OPTIONS = ['newest', 'oldest', 'name', 'lastLogin'] as const;
const ASSIGNABLE_ROLES = ['COMMUNITY', 'BUSINESS_OWNER', 'MODERATOR', 'CURATOR', 'ADMIN'] as const;

function getStatusBadge(status: string) {
  switch (status) {
    case 'ACTIVE': return <Badge variant="success">{status}</Badge>;
    case 'SUSPENDED': return <Badge variant="error">{status}</Badge>;
    case 'PENDING': return <Badge variant="warning">{status}</Badge>;
    case 'DELETED': return <Badge variant="default">{status}</Badge>;
    default: return <Badge>{status}</Badge>;
  }
}

function getRoleBadge(role: string) {
  switch (role) {
    case 'SUPER_ADMIN': return <Badge variant="error">{role}</Badge>;
    case 'ADMIN': return <Badge variant="warning">{role}</Badge>;
    case 'CURATOR': return <Badge variant="primary">{role}</Badge>;
    case 'MODERATOR': return <Badge variant="primary">{role}</Badge>;
    case 'BUSINESS_OWNER': return <Badge variant="success">{role}</Badge>;
    default: return <Badge variant="default">{role}</Badge>;
  }
}

export function AdminUsersPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Suspend modal
  const [suspendModal, setSuspendModal] = useState<{ userId: string; userName: string } | null>(null);
  const [suspendReason, setSuspendReason] = useState('');

  // URL params
  const page = Number(searchParams.get('page')) || 1;
  const role = searchParams.get('role') || '';
  const status = searchParams.get('status') || '';
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'newest';
  const [searchInput, setSearchInput] = useState(search);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result: PaginatedResponse<AdminUser> = await listUsers({
        page,
        limit: 20,
        role: role || undefined,
        status: status || undefined,
        search: search || undefined,
        sort,
      });
      setUsers(result.data);
      setPagination(result.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, role, status, search, sort]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, val]) => {
      if (val) params.set(key, val);
      else params.delete(key);
    });
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ search: searchInput });
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(newPage));
    setSearchParams(params);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      setActionLoading(userId);
      await updateUserRole(userId, newRole);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspend = async () => {
    if (!suspendModal || suspendReason.length < 10) return;
    try {
      setActionLoading(suspendModal.userId);
      await suspendUser(suspendModal.userId, suspendReason);
      setSuspendModal(null);
      setSuspendReason('');
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to suspend user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnsuspend = async (userId: string) => {
    try {
      setActionLoading(userId);
      await unsuspendUser(userId);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unsuspend user');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <PageContainer>
      <Helmet>
        <title>{t('admin.users.title')} | Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="max-w-7xl mx-auto space-y-6">
        <Link to="/admin" className="inline-flex items-center text-sm text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary transition-colors">
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          {t('admin.nav.backToDashboard')}
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-4 sm:mb-0">
            {t('admin.users.title')}
          </h1>
          <span className="text-sm text-slate-500">
            {pagination.total} {t('admin.users.totalCount')}
          </span>
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
                placeholder={t('admin.users.searchPlaceholder')}
                className="w-full pl-10 pr-4 py-2 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary"
                aria-label={t('admin.users.searchPlaceholder')}
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
            value={role}
            onChange={(e) => updateParams({ role: e.target.value })}
            className="px-4 py-2 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary"
            aria-label={t('admin.users.filterByRole')}
          >
            <option value="">{t('admin.users.allRoles')}</option>
            {ROLE_OPTIONS.filter(Boolean).map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => updateParams({ status: e.target.value })}
            className="px-4 py-2 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary"
            aria-label={t('admin.users.filterByStatus')}
          >
            <option value="">{t('admin.users.allStatuses')}</option>
            {STATUS_OPTIONS.filter(Boolean).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(e) => updateParams({ sort: e.target.value })}
            className="px-4 py-2 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary"
            aria-label={t('admin.users.sortBy')}
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s} value={s}>{t(`admin.users.sort.${s}`)}</option>
            ))}
          </select>
        </div>

        {error && (
          <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 p-4 text-red-600 dark:text-red-400">
            <ExclamationTriangleIcon className="h-5 w-5 inline mr-2" />
            {error}
            <button onClick={() => setError(null)} className="ml-2 underline text-sm">dismiss</button>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} width="100%" height="64px" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            {t('admin.users.noResults')}
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm" role="table">
                  <caption className="sr-only">{t('admin.users.tableCaption')}</caption>
                  <thead className="bg-slate-50 dark:bg-slate-700/50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-300">{t('admin.users.name')}</th>
                      <th scope="col" className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-300">{t('admin.users.email')}</th>
                      <th scope="col" className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-300">{t('admin.users.role')}</th>
                      <th scope="col" className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-300">{t('admin.users.status')}</th>
                      <th scope="col" className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-300">{t('admin.users.joined')}</th>
                      <th scope="col" className="px-4 py-3 text-right font-medium text-slate-500 dark:text-slate-300">{t('admin.users.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {user.profilePhoto ? (
                              <img src={user.profilePhoto} alt="" className="h-8 w-8 rounded-full object-cover" />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-xs font-medium text-slate-600 dark:text-slate-300">
                                {user.displayName.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-slate-900 dark:text-white">{user.displayName}</p>
                              {user.businessCount > 0 && (
                                <p className="text-xs text-slate-500">{user.businessCount} business{user.businessCount !== 1 ? 'es' : ''}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          {user.email}
                          {!user.emailVerified && (
                            <span className="ml-1 text-xs text-amber-500" title="Email not verified">
                              (unverified)
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {user.role === 'SUPER_ADMIN' ? (
                            getRoleBadge(user.role)
                          ) : (
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user.id, e.target.value)}
                              disabled={actionLoading === user.id}
                              className="text-xs px-2 py-1 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary"
                              aria-label={`${t('admin.users.changeRole')} ${user.displayName}`}
                            >
                              {ASSIGNABLE_ROLES.map((r) => (
                                <option key={r} value={r}>{r}</option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(user.status)}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            {user.role !== 'SUPER_ADMIN' && (
                              user.status === 'SUSPENDED' ? (
                                <button
                                  type="button"
                                  onClick={() => handleUnsuspend(user.id)}
                                  disabled={actionLoading === user.id}
                                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-full transition-colors"
                                  title={t('admin.users.unsuspend')}
                                >
                                  <CheckCircleIcon className="h-4 w-4" />
                                  {t('admin.users.unsuspend')}
                                </button>
                              ) : user.status === 'ACTIVE' ? (
                                <button
                                  type="button"
                                  onClick={() => setSuspendModal({ userId: user.id, userName: user.displayName })}
                                  disabled={actionLoading === user.id}
                                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                                  title={t('admin.users.suspend')}
                                >
                                  <NoSymbolIcon className="h-4 w-4" />
                                  {t('admin.users.suspend')}
                                </button>
                              ) : null
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

        {/* Suspend Confirmation Modal */}
        {suspendModal && (
          <Modal
            isOpen={true}
            onClose={() => { setSuspendModal(null); setSuspendReason(''); }}
            title={t('admin.users.suspendConfirmTitle')}
          >
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {t('admin.users.suspendConfirmMessage', { name: suspendModal.userName })}
              </p>
              <div>
                <label htmlFor="suspend-reason" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t('admin.users.suspendReason')}
                </label>
                <textarea
                  id="suspend-reason"
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  rows={3}
                  minLength={10}
                  placeholder={t('admin.users.suspendReasonPlaceholder')}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary"
                />
                {suspendReason.length > 0 && suspendReason.length < 10 && (
                  <p className="text-xs text-red-500 mt-1">{t('admin.users.suspendReasonMinLength')}</p>
                )}
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setSuspendModal(null); setSuspendReason(''); }}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleSuspend}
                  disabled={suspendReason.length < 10 || actionLoading !== null}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {t('admin.users.confirmSuspend')}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </PageContainer>
  );
}
