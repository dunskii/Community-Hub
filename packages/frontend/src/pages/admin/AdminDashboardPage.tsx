/**
 * AdminDashboardPage
 *
 * Admin dashboard home with overview widgets and quick actions.
 * Spec §23.1: Admin Dashboard Widgets
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { Skeleton } from '../../components/display/Skeleton';
import {
  UsersIcon,
  BuildingStorefrontIcon,
  CalendarIcon,
  ShieldCheckIcon,
  TagIcon,
  UserPlusIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { getAdminDashboard, type DashboardOverview } from '../../services/admin-api';

function MetricCard({
  title,
  value,
  icon: Icon,
  color,
  link,
}: {
  title: string;
  value: number | string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  link?: string;
}) {
  const content = (
    <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        </div>
        <div className={`rounded-full p-3 ${color}`}>
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
      </div>
    </div>
  );

  if (link) {
    return <Link to={link} className="block">{content}</Link>;
  }
  return content;
}

function formatAction(action: string): string {
  const actionMap: Record<string, string> = {
    'user.role_change': 'changed the role of',
    'user.suspend': 'suspended',
    'user.unsuspend': 'unsuspended',
    'business.status_change': 'changed the status of',
    'business.create': 'created',
    'business.update': 'updated',
    'business.updateBusiness': 'updated',
    'business.delete': 'deleted',
    'business.claim_approve': 'approved claim for',
    'business.claim_reject': 'rejected claim for',
    'review.delete': 'deleted a review on',
    'review.approve': 'approved a review on',
    'review.reject': 'rejected a review on',
    'event.create': 'created event',
    'event.update': 'updated event',
    'event.approve': 'approved event',
    'event.cancel': 'cancelled event',
  };
  return actionMap[action] || action.replace(/\./g, ' ').replace(/([A-Z])/g, ' $1').toLowerCase();
}

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function AdminDashboardPage() {
  const { t } = useTranslation();
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const data = await getAdminDashboard();
        if (!cancelled) setOverview(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <PageContainer>
        <Helmet><title>{t('admin.dashboard.title')} | Admin</title></Helmet>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} width="100%" height="100px" />
            ))}
          </div>
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <div className="max-w-7xl mx-auto">
          <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 p-4 text-red-600 dark:text-red-400">
            <ExclamationTriangleIcon className="h-5 w-5 inline mr-2" />
            {error}
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!overview) return null;

  return (
    <PageContainer>
      <Helmet>
        <title>{t('admin.dashboard.title')} | Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          {t('admin.dashboard.title')}
        </h1>

        {/* Overview Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title={t('admin.dashboard.activeUsers')}
            value={overview.activeUsers}
            icon={UsersIcon}
            color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
            link="/admin/users"
          />
          <MetricCard
            title={t('admin.dashboard.newRegistrations')}
            value={overview.newRegistrations}
            icon={UserPlusIcon}
            color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
            link="/admin/users?sort=newest"
          />
          <MetricCard
            title={t('admin.dashboard.pendingApprovals')}
            value={overview.pendingApprovals.total}
            icon={ShieldCheckIcon}
            color={overview.pendingApprovals.total > 0
              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'}
            link="/admin/moderation"
          />
          <MetricCard
            title={t('admin.dashboard.activeBusinesses')}
            value={overview.activeBusinesses}
            icon={BuildingStorefrontIcon}
            color="bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400"
            link="/admin/businesses"
          />
          <MetricCard
            title={t('admin.dashboard.totalBusinesses')}
            value={overview.totalBusinesses}
            icon={BuildingStorefrontIcon}
            color="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
            link="/admin/businesses"
          />
          <MetricCard
            title={t('admin.dashboard.upcomingEvents')}
            value={overview.upcomingEvents}
            icon={CalendarIcon}
            color="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
            link="/admin/events"
          />
          <MetricCard
            title={t('admin.dashboard.activeDeals')}
            value={overview.totalDeals}
            icon={TagIcon}
            color="bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400"
          />
          <MetricCard
            title={t('admin.dashboard.totalUsers')}
            value={overview.totalUsers}
            icon={UsersIcon}
            color="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400"
            link="/admin/users"
          />
        </div>

        {/* Pending Approvals Breakdown */}
        {overview.pendingApprovals.total > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-700 p-5">
            <h2 className="text-lg font-semibold text-amber-800 dark:text-amber-300 mb-3">
              {t('admin.dashboard.pendingBreakdown')}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {overview.pendingApprovals.businesses > 0 && (
                <Link to="/admin/businesses?status=PENDING" className="text-center p-3 rounded-xl bg-white dark:bg-slate-800 shadow-sm">
                  <p className="text-2xl font-bold text-amber-600">{overview.pendingApprovals.businesses}</p>
                  <p className="text-xs text-slate-500">{t('admin.dashboard.pendingBusinesses')}</p>
                </Link>
              )}
              {overview.pendingApprovals.reviews > 0 && (
                <Link to="/admin/moderation" className="text-center p-3 rounded-xl bg-white dark:bg-slate-800 shadow-sm">
                  <p className="text-2xl font-bold text-amber-600">{overview.pendingApprovals.reviews}</p>
                  <p className="text-xs text-slate-500">{t('admin.dashboard.pendingReviews')}</p>
                </Link>
              )}
              {overview.pendingApprovals.events > 0 && (
                <Link to="/admin/events?status=PENDING" className="text-center p-3 rounded-xl bg-white dark:bg-slate-800 shadow-sm">
                  <p className="text-2xl font-bold text-amber-600">{overview.pendingApprovals.events}</p>
                  <p className="text-xs text-slate-500">{t('admin.dashboard.pendingEvents')}</p>
                </Link>
              )}
              {overview.pendingApprovals.claims > 0 && (
                <div className="text-center p-3 rounded-xl bg-white dark:bg-slate-800 shadow-sm">
                  <p className="text-2xl font-bold text-amber-600">{overview.pendingApprovals.claims}</p>
                  <p className="text-xs text-slate-500">{t('admin.dashboard.pendingClaims')}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/admin/businesses"
            className="flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="rounded-full p-2 bg-teal-100 dark:bg-teal-900/30">
              <BuildingStorefrontIcon className="h-8 w-8 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">{t('admin.dashboard.manageBusinesses')}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('admin.dashboard.manageBusinessesDesc')}</p>
            </div>
          </Link>
          <Link
            to="/admin/analytics"
            className="flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="rounded-full p-2 bg-blue-100 dark:bg-blue-900/30">
              <svg className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">{t('admin.dashboard.viewAnalytics')}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('admin.dashboard.viewAnalyticsDesc')}</p>
            </div>
          </Link>
          <Link
            to="/admin/events"
            className="flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="rounded-full p-2 bg-purple-100 dark:bg-purple-900/30">
              <CalendarIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">{t('admin.dashboard.manageEvents')}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('admin.dashboard.manageEventsDesc')}</p>
            </div>
          </Link>
        </div>

        {/* Recent Activity */}
        {overview.recentActivity.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              <ClockIcon className="h-5 w-5 inline mr-2" />
              {t('admin.dashboard.recentActivity')}
            </h2>
            <ul className="divide-y divide-slate-100 dark:divide-slate-700" role="list">
              {overview.recentActivity.map((activity) => (
                <li key={activity.id} className="py-3 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm text-slate-900 dark:text-white">
                      {activity.actorName && (
                        <span className="font-medium">{activity.actorName}</span>
                      )}
                      {!activity.actorName && (
                        <span className="font-medium text-slate-500">{activity.actorRole}</span>
                      )}
                      <span className="text-slate-500 dark:text-slate-400">
                        {' '}{formatAction(activity.action)}{' '}
                      </span>
                      {activity.targetName ? (
                        <span className="font-medium">{activity.targetName}</span>
                      ) : (
                        <span className="text-slate-400">{activity.targetType}</span>
                      )}
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap shrink-0">
                    {formatTimeAgo(activity.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
