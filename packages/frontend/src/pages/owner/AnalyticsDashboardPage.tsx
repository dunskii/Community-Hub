/**
 * AnalyticsDashboardPage
 *
 * Business analytics dashboard with metrics, charts, and insights.
 * Spec §13.4: Business Analytics
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { PageContainer } from '../../components/layout/PageContainer';
import { Skeleton } from '../../components/display/Skeleton';
import { EmptyState } from '../../components/display/EmptyState';
import { Badge } from '../../components/display/Badge';
import { Tabs } from '../../components/display/Tabs';
import { useAuth } from '../../hooks/useAuth';
import {
  getAnalytics,
  getAnalyticsExportUrl,
  formatMetricWithTrend,
  type AnalyticsResponse,
  type Granularity,
} from '../../services/analytics-service';
import {
  ArrowLeftIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  UserIcon,
  MagnifyingGlassIcon,
  CursorArrowRaysIcon,
  GlobeAltIcon,
  PhoneIcon,
  MapPinIcon,
  BookmarkIcon,
  PhotoIcon,
  StarIcon,
  PencilSquareIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
} from '@heroicons/react/24/outline';

export function AnalyticsDashboardPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const { t } = useTranslation('owner');
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Date range state
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [granularity, setGranularity] = useState<Granularity>('day');

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/business/manage/${businessId}/analytics` } });
    }
  }, [isAuthenticated, navigate, businessId]);

  // Calculate date range
  const getDateRange = useCallback(() => {
    const endDate = new Date();
    const startDate = new Date();

    switch (dateRange) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    return {
      startDate: startDate.toISOString().split('T')[0] ?? '',
      endDate: endDate.toISOString().split('T')[0] ?? '',
    };
  }, [dateRange]);

  // Fetch analytics
  useEffect(() => {
    async function fetchAnalytics() {
      if (!businessId) return;

      try {
        setLoading(true);
        setError(null);
        const range = getDateRange();
        const data = await getAnalytics(businessId, {
          startDate: range.startDate,
          endDate: range.endDate,
          granularity,
        });
        setAnalytics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [businessId, getDateRange, granularity]);

  // Handle export
  const handleExport = () => {
    if (!businessId) return;
    const range = getDateRange();
    const url = getAnalyticsExportUrl(businessId, range.startDate ?? '', range.endDate ?? '');
    window.open(url, '_blank');
  };

  // Loading state
  if (loading) {
    return (
      <PageContainer>
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          <Skeleton variant="text" width="200px" height="32px" />
          <div className="flex gap-4">
            <Skeleton variant="rectangular" width="200px" height="40px" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Skeleton variant="rectangular" width="100%" height="140px" />
            <Skeleton variant="rectangular" width="100%" height="140px" />
            <Skeleton variant="rectangular" width="100%" height="140px" />
            <Skeleton variant="rectangular" width="100%" height="140px" />
          </div>
          <Skeleton variant="rectangular" width="100%" height="300px" />
        </div>
      </PageContainer>
    );
  }

  // Error state
  if (error) {
    return (
      <PageContainer>
        <EmptyState
          title={t('analytics.errorTitle')}
          description={error}
          icon="⚠️"
          action={
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-colors"
            >
              {t('common.retry')}
            </button>
          }
        />
      </PageContainer>
    );
  }

  // No analytics
  if (!analytics) {
    return (
      <PageContainer>
        <EmptyState
          title={t('analytics.noDataTitle')}
          description={t('analytics.noDataDescription')}
          icon="📊"
        />
      </PageContainer>
    );
  }

  return (
    <>
      <Helmet>
        <title>{t('analytics.title')} - {analytics.businessName} | Community Hub</title>
      </Helmet>

      <PageContainer>
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
          {/* Header */}
          <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Link
                to="/business/dashboard"
                className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-primary transition-colors mb-2"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                {t('analytics.backToDashboard')}
              </Link>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                {t('analytics.title')}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">{analytics.businessName}</p>
            </div>
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
              {t('analytics.exportCSV')}
            </button>
          </header>

          {/* Date Range Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div
              className="inline-flex rounded-full bg-slate-100 dark:bg-slate-800 p-1"
              role="group"
              aria-label={t('analytics.dateRange')}
            >
              {(['7d', '30d', '90d', '1y'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                    dateRange === range
                      ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  aria-pressed={dateRange === range}
                >
                  {t(`analytics.range.${range}`)}
                </button>
              ))}
            </div>
            <select
              value={granularity}
              onChange={(e) => setGranularity(e.target.value as Granularity)}
              className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label={t('analytics.granularity')}
            >
              <option value="day">{t('analytics.granularityOptions.day')}</option>
              <option value="week">{t('analytics.granularityOptions.week')}</option>
              <option value="month">{t('analytics.granularityOptions.month')}</option>
            </select>
          </div>

          {/* Summary Cards */}
          <section>
            <h2 className="sr-only">{t('analytics.summary')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                label={t('analytics.metrics.profileViews')}
                metric={analytics.summary.profileViews}
                icon={<EyeIcon className="w-6 h-6" />}
              />
              <MetricCard
                label={t('analytics.metrics.uniqueViews')}
                metric={analytics.summary.uniqueViews}
                icon={<UserIcon className="w-6 h-6" />}
              />
              <MetricCard
                label={t('analytics.metrics.searchAppearances')}
                metric={analytics.summary.searchAppearances}
                icon={<MagnifyingGlassIcon className="w-6 h-6" />}
              />
              <MetricCard
                label={t('analytics.metrics.totalClicks')}
                metric={analytics.summary.clicks.total}
                icon={<CursorArrowRaysIcon className="w-6 h-6" />}
              />
            </div>
          </section>

          {/* Click Breakdown */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              {t('analytics.clickBreakdown')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <MetricCard
                label={t('analytics.metrics.websiteClicks')}
                metric={analytics.summary.clicks.website}
                icon={<GlobeAltIcon className="w-5 h-5" />}
                size="small"
              />
              <MetricCard
                label={t('analytics.metrics.phoneClicks')}
                metric={analytics.summary.clicks.phone}
                icon={<PhoneIcon className="w-5 h-5" />}
                size="small"
              />
              <MetricCard
                label={t('analytics.metrics.directionsClicks')}
                metric={analytics.summary.clicks.directions}
                icon={<MapPinIcon className="w-5 h-5" />}
                size="small"
              />
            </div>
          </section>

          {/* Engagement Metrics */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              {t('analytics.engagement')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <MetricCard
                label={t('analytics.metrics.saves')}
                metric={analytics.summary.saves}
                icon={<BookmarkIcon className="w-5 h-5" />}
                size="small"
              />
              <MetricCard
                label={t('analytics.metrics.photoViews')}
                metric={analytics.summary.photoViews}
                icon={<PhotoIcon className="w-5 h-5" />}
                size="small"
              />
            </div>
          </section>

          {/* Reviews Section */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              {t('analytics.reviewStats')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                  <StarIcon className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {analytics.summary.reviews.averageRating.toFixed(1)}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {t('analytics.metrics.averageRating')}
                  </p>
                </div>
              </div>
              <MetricCard
                label={t('analytics.metrics.newReviews')}
                metric={analytics.summary.reviews.count}
                icon={<PencilSquareIcon className="w-5 h-5" />}
                size="small"
              />
            </div>
          </section>

          {/* Insights Tabs */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              {t('analytics.insights')}
            </h2>
            <Tabs
              tabs={[
                {
                  id: 'search-terms',
                  label: t('analytics.insightsLabels.searchTerms'),
                  content: (
                    <div className="py-4">
                      {analytics.insights.topSearchTerms.length > 0 ? (
                        <ul className="space-y-3">
                          {analytics.insights.topSearchTerms.map((term, index) => (
                            <li key={index} className="flex items-center gap-3">
                              <span className="w-6 h-6 flex items-center justify-center text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-full">
                                {index + 1}
                              </span>
                              <span className="flex-1 text-slate-700 dark:text-slate-300">
                                {term.term}
                              </span>
                              <Badge variant="default">{term.count}</Badge>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-slate-500 dark:text-slate-400 text-center py-8">
                          {t('analytics.noSearchTerms')}
                        </p>
                      )}
                    </div>
                  ),
                },
                {
                  id: 'referrals',
                  label: t('analytics.insightsLabels.referralSources'),
                  content: (
                    <div className="py-4">
                      {analytics.insights.referralSources.length > 0 ? (
                        <ul className="space-y-4">
                          {analytics.insights.referralSources.map((source, index) => (
                            <li key={index} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-700 dark:text-slate-300">
                                  {t(`analytics.referral.${source.source}`)}
                                </span>
                                <span className="text-slate-500 dark:text-slate-400">
                                  {source.percentage}%
                                </span>
                              </div>
                              <div
                                className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden"
                                role="progressbar"
                                aria-valuenow={source.percentage}
                                aria-valuemin={0}
                                aria-valuemax={100}
                              >
                                <div
                                  className="h-full bg-primary rounded-full transition-all"
                                  style={{ width: `${source.percentage}%` }}
                                />
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-slate-500 dark:text-slate-400 text-center py-8">
                          {t('analytics.noReferrals')}
                        </p>
                      )}
                    </div>
                  ),
                },
                {
                  id: 'peak-times',
                  label: t('analytics.insightsLabels.peakTimes'),
                  content: (
                    <div className="py-4">
                      {analytics.insights.peakActivityTimes.length > 0 ? (
                        <ul className="space-y-3">
                          {analytics.insights.peakActivityTimes.slice(0, 5).map((time, index) => (
                            <li key={index} className="flex items-center justify-between">
                              <span className="text-slate-700 dark:text-slate-300">
                                {time.dayOfWeek}, {formatHour(time.hour)}
                              </span>
                              <Badge variant="default">
                                {time.count} {t('analytics.views')}
                              </Badge>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-slate-500 dark:text-slate-400 text-center py-8">
                          {t('analytics.noPeakTimes')}
                        </p>
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </section>

          {/* Timeseries Chart */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              {t('analytics.trend')}
            </h2>
            <div>
              {analytics.timeseries.length > 0 ? (
                <div>
                  <div
                    className="flex items-end gap-1 h-48"
                    role="img"
                    aria-label={`${t('analytics.profileViewsOverTime')}`}
                  >
                    {analytics.timeseries.slice(-14).map((day, index) => {
                      const maxViews = Math.max(...analytics.timeseries.map((d) => d.profileViews), 1);
                      const height = (day.profileViews / maxViews) * 100;
                      return (
                        <div
                          key={index}
                          className="flex-1 bg-primary/20 hover:bg-primary/40 rounded-t transition-colors cursor-pointer group relative"
                          style={{ height: `${Math.max(height, 4)}%` }}
                          title={`${day.date}: ${day.profileViews} ${t('analytics.views')}`}
                        >
                          <div
                            className="absolute bottom-0 left-0 right-0 bg-primary rounded-t transition-all"
                            style={{ height: `${height}%` }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-4">
                    {t('analytics.profileViewsOverTime')}
                  </p>
                </div>
              ) : (
                <p className="text-slate-500 dark:text-slate-400 text-center py-8">
                  {t('analytics.noTimeseriesData')}
                </p>
              )}
            </div>
          </section>
        </div>
      </PageContainer>
    </>
  );
}

// ─── Sub-components ──────────────────────────────────────────

interface MetricCardProps {
  label: string;
  metric: { current: number; previous: number; changePercent: number; trend: 'up' | 'down' | 'flat' };
  icon: React.ReactNode;
  size?: 'normal' | 'small';
}

function MetricCard({ label, metric, icon, size = 'normal' }: MetricCardProps) {
  const { value, trend } = formatMetricWithTrend(metric);

  const TrendIcon = metric.trend === 'up' ? ArrowTrendingUpIcon : metric.trend === 'down' ? ArrowTrendingDownIcon : MinusIcon;
  const trendColor = metric.trend === 'up' ? 'text-emerald-500' : metric.trend === 'down' ? 'text-red-500' : 'text-slate-400';

  if (size === 'small') {
    return (
      <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
        <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-full text-primary">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-bold text-slate-900 dark:text-white">{value}</p>
          <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{label}</p>
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}>
          <TrendIcon className="w-4 h-4" />
          <span>{trend}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-full text-primary">
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium ${trendColor}`}>
          <TrendIcon className="w-4 h-4" />
          <span>{trend}</span>
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{label}</p>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────

function formatHour(hour: number): string {
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:00 ${suffix}`;
}
