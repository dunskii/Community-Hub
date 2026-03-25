/**
 * AdminAnalyticsPage
 *
 * Platform-wide analytics dashboard with aggregate metrics.
 * Spec §25: Analytics & Reporting
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { Skeleton } from '../../components/display/Skeleton';
import {
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  EyeIcon,
  PhoneIcon,
  GlobeAltIcon,
  MapPinIcon,
  MagnifyingGlassIcon,
  TagIcon,
  UserPlusIcon,
  BuildingStorefrontIcon,
  StarIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import {
  getPlatformAnalytics,
  getPlatformAnalyticsExportUrl,
  type PlatformAnalytics,
} from '../../services/admin-api';

type DateRangeOption = '7d' | '30d' | '90d' | '1y';

function getDateRange(range: DateRangeOption): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  switch (range) {
    case '7d': start.setDate(start.getDate() - 7); break;
    case '30d': start.setDate(start.getDate() - 30); break;
    case '90d': start.setDate(start.getDate() - 90); break;
    case '1y': start.setFullYear(start.getFullYear() - 1); break;
  }
  return {
    startDate: start.toISOString().split('T')[0] ?? '',
    endDate: end.toISOString().split('T')[0] ?? '',
  };
}

function MetricCard({ label, value, icon: Icon }: {
  label: string;
  value: number;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-primary/10 dark:bg-primary/20 p-2">
          <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
          <p className="text-lg font-bold text-slate-900 dark:text-white">{value.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

export function AdminAnalyticsPage() {
  const { t } = useTranslation();
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRangeOption>('30d');

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { startDate, endDate } = getDateRange(dateRange);
      const data = await getPlatformAnalytics({ startDate, endDate });
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const handleExport = () => {
    const { startDate, endDate } = getDateRange(dateRange);
    window.open(getPlatformAnalyticsExportUrl(startDate, endDate), '_blank');
  };

  return (
    <PageContainer>
      <Helmet>
        <title>{t('admin.analytics.title')} | Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="max-w-7xl mx-auto space-y-8">
        <Link to="/admin" className="inline-flex items-center text-sm text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary transition-colors">
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          {t('admin.nav.backToDashboard')}
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-4 sm:mb-0">
            {t('admin.analytics.title')}
          </h1>

          <div className="flex items-center gap-3">
            {/* Date Range Selector - M3 segmented button style */}
            <div
              className="inline-flex rounded-full bg-slate-100 dark:bg-slate-800 p-1"
              role="group"
              aria-label={t('admin.analytics.dateRange', 'Date range')}
            >
              {(['7d', '30d', '90d', '1y'] as const).map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setDateRange(range)}
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                    dateRange === range
                      ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  aria-pressed={dateRange === range}
                >
                  {range}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              {t('admin.analytics.export')}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 p-4 text-red-600 dark:text-red-400">
            <ExclamationTriangleIcon className="h-5 w-5 inline mr-2" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} width="100%" height="80px" />
            ))}
          </div>
        ) : analytics ? (
          <>
            {/* Platform Metrics */}
            <section>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                {t('admin.analytics.platformMetrics')}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                <MetricCard label={t('admin.analytics.profileViews')} value={analytics.summary.totalProfileViews} icon={EyeIcon} />
                <MetricCard label={t('admin.analytics.phoneClicks')} value={analytics.summary.totalPhoneClicks} icon={PhoneIcon} />
                <MetricCard label={t('admin.analytics.websiteClicks')} value={analytics.summary.totalWebsiteClicks} icon={GlobeAltIcon} />
                <MetricCard label={t('admin.analytics.directionsClicks')} value={analytics.summary.totalDirectionsClicks} icon={MapPinIcon} />
                <MetricCard label={t('admin.analytics.searchAppearances')} value={analytics.summary.totalSearchAppearances} icon={MagnifyingGlassIcon} />
                <MetricCard label={t('admin.analytics.saves')} value={analytics.summary.totalSaves} icon={StarIcon} />
                <MetricCard label={t('admin.analytics.dealClicks')} value={analytics.summary.totalDealClicks} icon={TagIcon} />
                <MetricCard label={t('admin.analytics.voucherReveals')} value={analytics.summary.totalVoucherReveals} icon={TagIcon} />
              </div>
            </section>

            {/* Growth Metrics */}
            <section>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                {t('admin.analytics.growth')}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <MetricCard label={t('admin.analytics.newUsers')} value={analytics.growth.newUsers} icon={UserPlusIcon} />
                <MetricCard label={t('admin.analytics.newBusinesses')} value={analytics.growth.newBusinesses} icon={BuildingStorefrontIcon} />
                <MetricCard label={t('admin.analytics.newReviews')} value={analytics.growth.newReviews} icon={StarIcon} />
                <MetricCard label={t('admin.analytics.newEvents')} value={analytics.growth.newEvents} icon={CalendarIcon} />
              </div>
            </section>

            {/* Timeseries Chart */}
            {analytics.timeseries.length > 0 && (
              <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                  {t('admin.analytics.dailyActivity')}
                </h2>
                <div className="overflow-x-auto">
                  <div className="flex items-end gap-1 h-48 min-w-[600px]">
                    {analytics.timeseries.map((day) => {
                      const maxViews = Math.max(...analytics.timeseries.map((d) => d.profileViews), 1);
                      const height = Math.max((day.profileViews / maxViews) * 100, 2);
                      return (
                        <div
                          key={day.date}
                          className="flex-1 bg-primary/20 hover:bg-primary/40 rounded-t transition-colors cursor-default group relative"
                          style={{ height: `${height}%` }}
                          title={`${day.date}: ${day.profileViews} views`}
                        >
                          <div
                            className="absolute bottom-0 left-0 right-0 bg-primary rounded-t transition-all"
                            style={{ height: `${height}%` }}
                          />
                          <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-900 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap z-10">
                            {day.date}: {day.profileViews}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-4">
                    {t('admin.analytics.profileViewsOverTime', 'Profile views over time')}
                  </p>
                </div>
              </section>
            )}

            {/* Top Businesses */}
            {analytics.topBusinesses.length > 0 && (
              <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                  {t('admin.analytics.topBusinesses')}
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" role="table">
                    <caption className="sr-only">{t('admin.analytics.topBusinessesCaption')}</caption>
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th scope="col" className="text-left py-2 px-3 font-medium text-slate-500">#</th>
                        <th scope="col" className="text-left py-2 px-3 font-medium text-slate-500">{t('admin.analytics.business')}</th>
                        <th scope="col" className="text-right py-2 px-3 font-medium text-slate-500">{t('admin.analytics.views')}</th>
                        <th scope="col" className="text-right py-2 px-3 font-medium text-slate-500">{t('admin.analytics.phoneCalls')}</th>
                        <th scope="col" className="text-right py-2 px-3 font-medium text-slate-500">{t('admin.analytics.websiteVisits')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {analytics.topBusinesses.map((biz, idx) => (
                        <tr key={biz.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                          <td className="py-2 px-3">
                            <Link
                              to={`/business/${biz.slug}`}
                              className="font-medium text-primary hover:text-primary/80 transition-colors"
                            >
                              {biz.name}
                            </Link>
                          </td>
                          <td className="py-2 px-3 text-right text-slate-700 dark:text-slate-300">
                            {biz.profileViews.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-700 dark:text-slate-300">
                            {biz.phoneClicks.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-700 dark:text-slate-300">
                            {biz.websiteClicks.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        ) : null}
      </div>
    </PageContainer>
  );
}
