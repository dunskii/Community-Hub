/**
 * OwnerDashboardPage
 *
 * Business owner dashboard for managing claimed businesses.
 * Spec §13.2: Business Owner Dashboard
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { PageContainer } from '../../components/layout/PageContainer';
import { Skeleton } from '../../components/display/Skeleton';
import { EmptyState } from '../../components/display/EmptyState';
import { Badge } from '../../components/display/Badge';
import { useAuth } from '../../hooks/useAuth';
import { get } from '../../services/api-client';
import {
  getAnalytics,
  getDefaultDateRange,
  formatMetricWithTrend,
  type AnalyticsResponse,
} from '../../services/analytics-service';

interface OwnedBusiness {
  id: string;
  name: string;
  slug: string;
  status: 'PUBLISHED' | 'DRAFT' | 'PENDING_REVIEW' | 'SUSPENDED';
  claimed: boolean;
  verifiedAt: string | null;
  rating: number | null;
  reviewCount: number;
  followerCount: number;
  photos: string[];
}

export function OwnerDashboardPage() {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [businesses, setBusinesses] = useState<OwnedBusiness[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<OwnedBusiness | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/owner/dashboard' } });
    }
  }, [isAuthenticated, navigate]);

  // Fetch owned businesses
  useEffect(() => {
    async function fetchBusinesses() {
      if (!user) return;

      try {
        setLoading(true);
        const response = await get<{ success: boolean; data: { businesses: OwnedBusiness[] } }>(
          `/users/me/businesses`
        );
        setBusinesses(response.data.businesses);

        // Auto-select first business
        if (response.data.businesses.length > 0 && response.data.businesses[0]) {
          setSelectedBusiness(response.data.businesses[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load businesses');
      } finally {
        setLoading(false);
      }
    }

    fetchBusinesses();
  }, [user]);

  // Fetch analytics for selected business
  useEffect(() => {
    async function fetchAnalytics() {
      if (!selectedBusiness) return;

      try {
        setAnalyticsLoading(true);
        const dateRange = getDefaultDateRange();
        const data = await getAnalytics(selectedBusiness.id, dateRange);
        setAnalytics(data);
      } catch {
        // Analytics may not be available for all businesses
        setAnalytics(null);
      } finally {
        setAnalyticsLoading(false);
      }
    }

    fetchAnalytics();
  }, [selectedBusiness]);

  // Loading state
  if (loading) {
    return (
      <PageContainer>
        <div className="owner-dashboard">
          <Skeleton variant="text" width="200px" height="32px" />
          <div className="owner-dashboard__grid">
            <Skeleton variant="rectangular" width="100%" height="200px" />
            <Skeleton variant="rectangular" width="100%" height="200px" />
            <Skeleton variant="rectangular" width="100%" height="200px" />
          </div>
        </div>
      </PageContainer>
    );
  }

  // Error state
  if (error) {
    return (
      <PageContainer>
        <EmptyState
          title={t('owner.errorTitle')}
          description={error}
          icon="⚠️"
        />
      </PageContainer>
    );
  }

  // No businesses
  if (businesses.length === 0) {
    return (
      <PageContainer>
        <Helmet>
          <title>{t('owner.dashboardTitle')} | Community Hub</title>
        </Helmet>
        <EmptyState
          title={t('owner.noBusinessesTitle')}
          description={t('owner.noBusinessesDescription')}
          icon="🏪"
          action={
            <button onClick={() => navigate('/businesses')} className="btn btn--primary">
              {t('owner.claimBusiness')}
            </button>
          }
        />
      </PageContainer>
    );
  }

  const statusVariant = (status: OwnedBusiness['status']): 'success' | 'default' | 'warning' | 'error' => {
    switch (status) {
      case 'PUBLISHED':
        return 'success';
      case 'DRAFT':
        return 'default';
      case 'PENDING_REVIEW':
        return 'warning';
      case 'SUSPENDED':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('owner.dashboardTitle')} | Community Hub</title>
      </Helmet>

      <PageContainer>
        <div className="owner-dashboard">
          <header className="owner-dashboard__header">
            <h1>{t('owner.dashboardTitle')}</h1>
            <p className="owner-dashboard__subtitle">{t('owner.dashboardSubtitle')}</p>
          </header>

          {/* Business Selector */}
          {businesses.length > 1 && (
            <div className="owner-dashboard__selector">
              <label htmlFor="business-select" className="sr-only">
                {t('owner.selectBusiness')}
              </label>
              <select
                id="business-select"
                value={selectedBusiness?.id || ''}
                onChange={(e) => {
                  const business = businesses.find((b) => b.id === e.target.value);
                  setSelectedBusiness(business || null);
                }}
                className="owner-dashboard__select"
              >
                {businesses.map((business) => (
                  <option key={business.id} value={business.id}>
                    {business.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedBusiness && (
            <>
              {/* Business Card */}
              <section className="owner-dashboard__business-card">
                <div className="owner-dashboard__business-info">
                  <div className="owner-dashboard__business-image">
                    {selectedBusiness.photos[0] ? (
                      <img src={selectedBusiness.photos[0]} alt={selectedBusiness.name} />
                    ) : (
                      <div className="owner-dashboard__business-placeholder">🏪</div>
                    )}
                  </div>
                  <div className="owner-dashboard__business-details">
                    <h2>{selectedBusiness.name}</h2>
                    <div className="owner-dashboard__business-meta">
                      <Badge variant={statusVariant(selectedBusiness.status)}>
                        {t(`owner.status.${selectedBusiness.status.toLowerCase()}`)}
                      </Badge>
                      {selectedBusiness.verifiedAt && (
                        <Badge variant="success">{t('owner.verified')}</Badge>
                      )}
                    </div>
                    <div className="owner-dashboard__business-stats">
                      {selectedBusiness.rating && (
                        <span>⭐ {selectedBusiness.rating.toFixed(1)}</span>
                      )}
                      <span>{selectedBusiness.reviewCount} {t('owner.reviews')}</span>
                      <span>{selectedBusiness.followerCount} {t('owner.followers')}</span>
                    </div>
                  </div>
                </div>

                <div className="owner-dashboard__business-actions">
                  <Link
                    to={`/business/${selectedBusiness.slug}`}
                    className="btn btn--secondary"
                  >
                    {t('owner.viewProfile')}
                  </Link>
                  <Link
                    to={`/owner/business/${selectedBusiness.id}/edit`}
                    className="btn btn--primary"
                  >
                    {t('owner.editProfile')}
                  </Link>
                </div>
              </section>

              {/* Quick Stats */}
              <section className="owner-dashboard__stats">
                <h2 className="sr-only">{t('owner.quickStats')}</h2>
                {analyticsLoading ? (
                  <div className="owner-dashboard__stats-grid">
                    <Skeleton variant="rectangular" width="100%" height="100px" />
                    <Skeleton variant="rectangular" width="100%" height="100px" />
                    <Skeleton variant="rectangular" width="100%" height="100px" />
                    <Skeleton variant="rectangular" width="100%" height="100px" />
                  </div>
                ) : analytics ? (
                  <div className="owner-dashboard__stats-grid">
                    <StatCard
                      label={t('owner.stats.profileViews')}
                      metric={analytics.summary.profileViews}
                      icon="👁️"
                    />
                    <StatCard
                      label={t('owner.stats.searchAppearances')}
                      metric={analytics.summary.searchAppearances}
                      icon="🔍"
                    />
                    <StatCard
                      label={t('owner.stats.totalClicks')}
                      metric={analytics.summary.clicks.total}
                      icon="👆"
                    />
                    <StatCard
                      label={t('owner.stats.newFollowers')}
                      metric={analytics.summary.follows}
                      icon="❤️"
                    />
                  </div>
                ) : (
                  <p className="owner-dashboard__no-analytics">
                    {t('owner.analyticsNotAvailable')}
                  </p>
                )}
              </section>

              {/* Quick Actions */}
              <section className="owner-dashboard__actions">
                <h2>{t('owner.quickActions')}</h2>
                <div className="owner-dashboard__actions-grid">
                  <ActionCard
                    title={t('owner.actions.analytics')}
                    description={t('owner.actions.analyticsDesc')}
                    icon="📊"
                    to={`/owner/business/${selectedBusiness.id}/analytics`}
                  />
                  <ActionCard
                    title={t('owner.actions.reviews')}
                    description={t('owner.actions.reviewsDesc')}
                    icon="⭐"
                    to={`/owner/business/${selectedBusiness.id}/reviews`}
                  />
                  <ActionCard
                    title={t('owner.actions.photos')}
                    description={t('owner.actions.photosDesc')}
                    icon="📷"
                    to={`/owner/business/${selectedBusiness.id}/photos`}
                  />
                  <ActionCard
                    title={t('owner.actions.settings')}
                    description={t('owner.actions.settingsDesc')}
                    icon="⚙️"
                    to={`/owner/business/${selectedBusiness.id}/settings`}
                  />
                </div>
              </section>
            </>
          )}
        </div>
      </PageContainer>
    </>
  );
}

// ─── Sub-components ──────────────────────────────────────────

interface StatCardProps {
  label: string;
  metric: { current: number; previous: number; changePercent: number; trend: 'up' | 'down' | 'flat' };
  icon: string;
}

function StatCard({ label, metric, icon }: StatCardProps) {
  const { value, trend, trendClass } = formatMetricWithTrend(metric);

  return (
    <div className="stat-card">
      <div className="stat-card__icon">{icon}</div>
      <div className="stat-card__content">
        <span className="stat-card__value">{value}</span>
        <span className="stat-card__label">{label}</span>
        <span className={`stat-card__trend ${trendClass}`}>{trend}</span>
      </div>
    </div>
  );
}

interface ActionCardProps {
  title: string;
  description: string;
  icon: string;
  to: string;
}

function ActionCard({ title, description, icon, to }: ActionCardProps) {
  return (
    <Link to={to} className="action-card">
      <span className="action-card__icon">{icon}</span>
      <span className="action-card__title">{title}</span>
      <span className="action-card__description">{description}</span>
    </Link>
  );
}
