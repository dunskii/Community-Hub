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
import {
  ChartBarIcon,
  StarIcon,
  PhotoIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  BuildingStorefrontIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  CursorArrowRaysIcon,
  HeartIcon,
} from '@heroicons/react/24/outline';

interface OwnedBusiness {
  id: string;
  name: string;
  slug: string;
  status: 'PUBLISHED' | 'DRAFT' | 'PENDING_REVIEW' | 'SUSPENDED' | 'ACTIVE';
  claimed: boolean;
  verifiedAt: string | null;
  rating: number | null;
  reviewCount: number;
  followerCount: number;
  photos: string[];
}

export function OwnerDashboardPage() {
  const { t } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
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

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Loading state
  if (loading) {
    return (
      <PageContainer>
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton variant="text" width="300px" height="40px" />
          <Skeleton variant="text" width="400px" height="24px" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Skeleton variant="rectangular" width="100%" height="120px" />
            <Skeleton variant="rectangular" width="100%" height="120px" />
            <Skeleton variant="rectangular" width="100%" height="120px" />
            <Skeleton variant="rectangular" width="100%" height="120px" />
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
          title={t('owner.errorTitle', 'Error Loading Dashboard')}
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
          <title>{t('owner.dashboardTitle', 'Business Dashboard')} | Community Hub</title>
        </Helmet>
        <div className="max-w-2xl mx-auto text-center py-12">
          <BuildingStorefrontIcon className="w-16 h-16 mx-auto text-slate-400 mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {t('owner.noBusinessesTitle', 'No Businesses')}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {t('owner.noBusinessesDescription', "You don't have any claimed businesses yet. Start by claiming a business you own.")}
          </p>
          <Link
            to="/businesses"
            className="inline-flex items-center px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            {t('owner.claimBusiness', 'Claim a Business')}
          </Link>
        </div>
      </PageContainer>
    );
  }

  const statusVariant = (status: OwnedBusiness['status']): 'success' | 'default' | 'warning' | 'error' => {
    switch (status) {
      case 'PUBLISHED':
      case 'ACTIVE':
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
        <title>{t('owner.dashboardTitle', 'Business Dashboard')} | Community Hub</title>
      </Helmet>

      <PageContainer>
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                {t('owner.dashboardTitle', 'Business Dashboard')}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                {t('owner.dashboardSubtitle', 'Manage your businesses and view performance')}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              {t('navigation.logout', 'Log Out')}
            </button>
          </div>

          {/* Business Selector (if multiple businesses) */}
          {businesses.length > 1 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
              <label htmlFor="business-select" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('owner.selectBusiness', 'Select a business')}
              </label>
              <select
                id="business-select"
                value={selectedBusiness?.id || ''}
                onChange={(e) => {
                  const business = businesses.find((b) => b.id === e.target.value);
                  setSelectedBusiness(business || null);
                }}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
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
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row gap-6">
                    {/* Business Image */}
                    <div className="flex-shrink-0">
                      {selectedBusiness.photos[0] ? (
                        <img
                          src={selectedBusiness.photos[0]}
                          alt={selectedBusiness.name}
                          className="w-24 h-24 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                          <BuildingStorefrontIcon className="w-12 h-12 text-slate-400" />
                        </div>
                      )}
                    </div>

                    {/* Business Details */}
                    <div className="flex-1 min-w-0">
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {selectedBusiness.name}
                      </h2>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant={statusVariant(selectedBusiness.status)}>
                          {t(`owner.status.${selectedBusiness.status.toLowerCase()}`, selectedBusiness.status)}
                        </Badge>
                        {selectedBusiness.verifiedAt && (
                          <Badge variant="success">{t('owner.verified', 'Verified')}</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-600 dark:text-slate-400">
                        {selectedBusiness.rating && (
                          <span className="flex items-center gap-1">
                            <StarIcon className="w-4 h-4 text-yellow-500" />
                            {selectedBusiness.rating.toFixed(1)}
                          </span>
                        )}
                        <span>{selectedBusiness.reviewCount} {t('owner.reviews', 'reviews')}</span>
                        <span>{selectedBusiness.followerCount} {t('owner.followers', 'followers')}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Link
                        to={`/businesses/${selectedBusiness.slug}`}
                        className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                      >
                        {t('owner.viewProfile', 'View Profile')}
                      </Link>
                      <Link
                        to={`/owner/business/${selectedBusiness.id}/edit`}
                        className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        {t('owner.editProfile', 'Edit Profile')}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <section>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  {t('owner.quickStats', 'Quick Stats')}
                </h2>
                {analyticsLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} variant="rectangular" width="100%" height="100px" />
                    ))}
                  </div>
                ) : analytics ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                      label={t('owner.stats.profileViews', 'Profile Views')}
                      metric={analytics.summary.profileViews}
                      icon={<EyeIcon className="w-6 h-6" />}
                    />
                    <StatCard
                      label={t('owner.stats.searchAppearances', 'Search Appearances')}
                      metric={analytics.summary.searchAppearances}
                      icon={<MagnifyingGlassIcon className="w-6 h-6" />}
                    />
                    <StatCard
                      label={t('owner.stats.totalClicks', 'Total Clicks')}
                      metric={analytics.summary.clicks.total}
                      icon={<CursorArrowRaysIcon className="w-6 h-6" />}
                    />
                    <StatCard
                      label={t('owner.stats.newFollowers', 'New Followers')}
                      metric={analytics.summary.follows}
                      icon={<HeartIcon className="w-6 h-6" />}
                    />
                  </div>
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 text-center text-slate-600 dark:text-slate-400">
                    {t('owner.analyticsNotAvailable', 'Analytics data is not yet available for this business.')}
                  </div>
                )}
              </section>

              {/* Quick Actions */}
              <section>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  {t('owner.quickActions', 'Quick Actions')}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <ActionCard
                    title={t('owner.actions.analytics', 'View Analytics')}
                    description={t('owner.actions.analyticsDesc', 'See detailed performance metrics')}
                    icon={<ChartBarIcon className="w-8 h-8" />}
                    to={`/owner/business/${selectedBusiness.id}/analytics`}
                  />
                  <ActionCard
                    title={t('owner.actions.reviews', 'Manage Reviews')}
                    description={t('owner.actions.reviewsDesc', 'Respond to customer reviews')}
                    icon={<StarIcon className="w-8 h-8" />}
                    to={`/owner/business/${selectedBusiness.id}/reviews`}
                  />
                  <ActionCard
                    title={t('owner.actions.photos', 'Update Photos')}
                    description={t('owner.actions.photosDesc', 'Add or manage business photos')}
                    icon={<PhotoIcon className="w-8 h-8" />}
                    to={`/owner/business/${selectedBusiness.id}/photos`}
                  />
                  <ActionCard
                    title={t('owner.actions.settings', 'Settings')}
                    description={t('owner.actions.settingsDesc', 'Update business information')}
                    icon={<Cog6ToothIcon className="w-8 h-8" />}
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
  icon: React.ReactNode;
}

function StatCard({ label, metric, icon }: StatCardProps) {
  const { value, trend, trendClass } = formatMetricWithTrend(metric);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="flex items-start justify-between">
        <div className="text-primary">{icon}</div>
        <span className={`text-sm font-medium ${trendClass}`}>{trend}</span>
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{label}</p>
      </div>
    </div>
  );
}

interface ActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  to: string;
}

function ActionCard({ title, description, icon, to }: ActionCardProps) {
  return (
    <Link
      to={to}
      className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-primary hover:shadow-md transition-all group"
    >
      <div className="text-primary group-hover:scale-110 transition-transform">{icon}</div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mt-3">{title}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{description}</p>
    </Link>
  );
}
