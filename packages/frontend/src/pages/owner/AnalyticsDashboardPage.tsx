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

export function AnalyticsDashboardPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const { t } = useTranslation();
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
      navigate('/login', { state: { from: `/owner/business/${businessId}/analytics` } });
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
        <div className="analytics-dashboard">
          <Skeleton variant="text" width="200px" height="32px" />
          <div className="analytics-dashboard__controls">
            <Skeleton variant="rectangular" width="200px" height="40px" />
          </div>
          <div className="analytics-dashboard__grid">
            <Skeleton variant="rectangular" width="100%" height="150px" />
            <Skeleton variant="rectangular" width="100%" height="150px" />
            <Skeleton variant="rectangular" width="100%" height="150px" />
            <Skeleton variant="rectangular" width="100%" height="150px" />
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
            <button onClick={() => window.location.reload()} className="btn btn--primary">
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
        <div className="analytics-dashboard">
          {/* Header */}
          <header className="analytics-dashboard__header">
            <div>
              <Link to="/owner/dashboard" className="analytics-dashboard__back">
                ← {t('analytics.backToDashboard')}
              </Link>
              <h1>{t('analytics.title')}</h1>
              <p className="analytics-dashboard__business-name">{analytics.businessName}</p>
            </div>
            <button onClick={handleExport} className="btn btn--secondary">
              {t('analytics.exportCSV')}
            </button>
          </header>

          {/* Date Range Controls */}
          <div className="analytics-dashboard__controls">
            <div className="analytics-dashboard__date-buttons" role="group" aria-label={t('analytics.dateRange')}>
              {(['7d', '30d', '90d', '1y'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`analytics-dashboard__date-btn ${dateRange === range ? 'active' : ''}`}
                  aria-pressed={dateRange === range}
                >
                  {t(`analytics.range.${range}`)}
                </button>
              ))}
            </div>
            <select
              value={granularity}
              onChange={(e) => setGranularity(e.target.value as Granularity)}
              className="analytics-dashboard__granularity"
              aria-label={t('analytics.granularity')}
            >
              <option value="day">{t('analytics.granularity.day')}</option>
              <option value="week">{t('analytics.granularity.week')}</option>
              <option value="month">{t('analytics.granularity.month')}</option>
            </select>
          </div>

          {/* Summary Cards */}
          <section className="analytics-dashboard__summary">
            <h2 className="sr-only">{t('analytics.summary')}</h2>
            <div className="analytics-dashboard__summary-grid">
              <MetricCard
                label={t('analytics.metrics.profileViews')}
                metric={analytics.summary.profileViews}
                icon="👁️"
              />
              <MetricCard
                label={t('analytics.metrics.uniqueViews')}
                metric={analytics.summary.uniqueViews}
                icon="👤"
              />
              <MetricCard
                label={t('analytics.metrics.searchAppearances')}
                metric={analytics.summary.searchAppearances}
                icon="🔍"
              />
              <MetricCard
                label={t('analytics.metrics.totalClicks')}
                metric={analytics.summary.clicks.total}
                icon="👆"
              />
            </div>
          </section>

          {/* Click Breakdown */}
          <section className="analytics-dashboard__clicks">
            <h2>{t('analytics.clickBreakdown')}</h2>
            <div className="analytics-dashboard__clicks-grid">
              <MetricCard
                label={t('analytics.metrics.websiteClicks')}
                metric={analytics.summary.clicks.website}
                icon="🌐"
                size="small"
              />
              <MetricCard
                label={t('analytics.metrics.phoneClicks')}
                metric={analytics.summary.clicks.phone}
                icon="📞"
                size="small"
              />
              <MetricCard
                label={t('analytics.metrics.directionsClicks')}
                metric={analytics.summary.clicks.directions}
                icon="🗺️"
                size="small"
              />
            </div>
          </section>

          {/* Engagement Metrics */}
          <section className="analytics-dashboard__engagement">
            <h2>{t('analytics.engagement')}</h2>
            <div className="analytics-dashboard__engagement-grid">
              <MetricCard
                label={t('analytics.metrics.saves')}
                metric={analytics.summary.saves}
                icon="🔖"
                size="small"
              />
              <MetricCard
                label={t('analytics.metrics.follows')}
                metric={analytics.summary.follows}
                icon="❤️"
                size="small"
              />
              <MetricCard
                label={t('analytics.metrics.photoViews')}
                metric={analytics.summary.photoViews}
                icon="📷"
                size="small"
              />
            </div>
          </section>

          {/* Reviews Section */}
          <section className="analytics-dashboard__reviews">
            <h2>{t('analytics.reviewStats')}</h2>
            <div className="analytics-dashboard__reviews-grid">
              <div className="analytics-dashboard__review-card">
                <span className="analytics-dashboard__review-value">
                  <span aria-hidden="true">⭐</span> {analytics.summary.reviews.averageRating.toFixed(1)}
                </span>
                <span className="analytics-dashboard__review-label">
                  {t('analytics.metrics.averageRating')}
                </span>
              </div>
              <MetricCard
                label={t('analytics.metrics.newReviews')}
                metric={analytics.summary.reviews.count}
                icon="✍️"
                size="small"
              />
            </div>
          </section>

          {/* Insights Tabs */}
          <section className="analytics-dashboard__insights">
            <h2>{t('analytics.insights')}</h2>
            <Tabs
              tabs={[
                {
                  id: 'search-terms',
                  label: t('analytics.insights.searchTerms'),
                  content: (
                    <div className="analytics-dashboard__insight-content">
                      {analytics.insights.topSearchTerms.length > 0 ? (
                        <ul className="analytics-dashboard__insight-list">
                          {analytics.insights.topSearchTerms.map((term, index) => (
                            <li key={index} className="analytics-dashboard__insight-item">
                              <span className="analytics-dashboard__insight-rank">
                                #{index + 1}
                              </span>
                              <span className="analytics-dashboard__insight-term">
                                {term.term}
                              </span>
                              <Badge variant="default">{term.count}</Badge>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="analytics-dashboard__no-data">
                          {t('analytics.noSearchTerms')}
                        </p>
                      )}
                    </div>
                  ),
                },
                {
                  id: 'referrals',
                  label: t('analytics.insights.referralSources'),
                  content: (
                    <div className="analytics-dashboard__insight-content">
                      {analytics.insights.referralSources.length > 0 ? (
                        <ul className="analytics-dashboard__insight-list">
                          {analytics.insights.referralSources.map((source, index) => (
                            <li key={index} className="analytics-dashboard__insight-item">
                              <span className="analytics-dashboard__insight-source">
                                {t(`analytics.referral.${source.source}`)}
                              </span>
                              <div
                                className="analytics-dashboard__insight-bar"
                                role="progressbar"
                                aria-valuenow={source.percentage}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-label={`${t(`analytics.referral.${source.source}`)}: ${source.percentage}%`}
                              >
                                <div
                                  className="analytics-dashboard__insight-bar-fill"
                                  style={{ width: `${source.percentage}%` }}
                                  aria-hidden="true"
                                />
                              </div>
                              <span className="analytics-dashboard__insight-percent">
                                {source.percentage}%
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="analytics-dashboard__no-data">
                          {t('analytics.noReferrals')}
                        </p>
                      )}
                    </div>
                  ),
                },
                {
                  id: 'peak-times',
                  label: t('analytics.insights.peakTimes'),
                  content: (
                    <div className="analytics-dashboard__insight-content">
                      {analytics.insights.peakActivityTimes.length > 0 ? (
                        <ul className="analytics-dashboard__insight-list">
                          {analytics.insights.peakActivityTimes.slice(0, 5).map((time, index) => (
                            <li key={index} className="analytics-dashboard__insight-item">
                              <span className="analytics-dashboard__insight-time">
                                {time.dayOfWeek}, {formatHour(time.hour)}
                              </span>
                              <Badge variant="default">{time.count} {t('analytics.views')}</Badge>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="analytics-dashboard__no-data">
                          {t('analytics.noPeakTimes')}
                        </p>
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </section>

          {/* Timeseries Chart Placeholder */}
          <section className="analytics-dashboard__chart">
            <h2>{t('analytics.trend')}</h2>
            <div className="analytics-dashboard__chart-container">
              {analytics.timeseries.length > 0 ? (
                <div className="analytics-dashboard__simple-chart">
                  {/* Simple bar chart visualization */}
                  <div
                    className="analytics-dashboard__chart-bars"
                    role="img"
                    aria-label={`${t('analytics.profileViewsOverTime')}: ${analytics.timeseries.slice(-14).map(d => `${d.date}: ${d.profileViews}`).join(', ')}`}
                  >
                    {analytics.timeseries.slice(-14).map((day, index) => {
                      const maxViews = Math.max(...analytics.timeseries.map((d) => d.profileViews), 1);
                      const height = (day.profileViews / maxViews) * 100;
                      return (
                        <div
                          key={index}
                          className="analytics-dashboard__chart-bar"
                          style={{ height: `${height}%` }}
                          title={`${day.date}: ${day.profileViews} ${t('analytics.views')}`}
                          aria-hidden="true"
                        />
                      );
                    })}
                  </div>
                  <p className="analytics-dashboard__chart-label">
                    {t('analytics.profileViewsOverTime')}
                  </p>
                </div>
              ) : (
                <p className="analytics-dashboard__no-data">
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
  icon: string;
  size?: 'normal' | 'small';
}

function MetricCard({ label, metric, icon, size = 'normal' }: MetricCardProps) {
  const { value, trend, trendClass } = formatMetricWithTrend(metric);

  return (
    <div className={`metric-card metric-card--${size}`}>
      <div className="metric-card__icon" aria-hidden="true">{icon}</div>
      <div className="metric-card__content">
        <span className="metric-card__value">{value}</span>
        <span className="metric-card__label">{label}</span>
        <span className={`metric-card__trend ${trendClass}`} aria-label={`${trend} from previous period`}>
          {trend}
        </span>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────

function formatHour(hour: number): string {
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:00 ${suffix}`;
}
