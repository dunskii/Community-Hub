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
import { replyToEnquiry, recordCallClick } from '../../services/enquiry-service';
import { dealApi } from '../../services/deal-api';
import type { Deal } from '@community-hub/shared';
import type { Enquiry } from '../../services/enquiry-service';
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
  BuildingStorefrontIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  CursorArrowRaysIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  PhoneIcon as PhoneOutlineIcon,
  XMarkIcon,
  ClockIcon as ClockOutlineIcon,
  CheckCircleIcon,
  GlobeAltIcon,
  MapPinIcon,
  TagIcon,
  CalendarDaysIcon,
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
  // Raw API fields (snake_case from Prisma)
  cover_photo?: string;
  gallery?: (string | { url: string })[];
}

function getBusinessImage(biz: OwnedBusiness): string | undefined {
  if (biz.cover_photo) return biz.cover_photo;
  if (biz.photos && biz.photos.length > 0) return biz.photos[0];
  if (biz.gallery && biz.gallery.length > 0) {
    const first = biz.gallery[0];
    return typeof first === 'string' ? first : first?.url;
  }
  return undefined;
}

export function OwnerDashboardPage() {
  const { t } = useTranslation();
  const { user, isAuthenticated, isLoading: authLoading, refreshToken } = useAuth();
  const navigate = useNavigate();

  const [businesses, setBusinesses] = useState<OwnedBusiness[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<OwnedBusiness | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [enquiryCount, setEnquiryCount] = useState(0);
  const [enquiriesLoading, setEnquiriesLoading] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [promoStats, setPromoStats] = useState<{ totalViews: number; totalClicks: number; totalVoucherReveals: number; activeDeals: number } | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [dealsLoading, setDealsLoading] = useState(false);

  // Redirect if not authenticated (wait for auth to finish loading first)
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login', { state: { from: '/business/dashboard' } });
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Fetch owned businesses
  useEffect(() => {
    async function fetchBusinesses() {
      if (!user || authLoading) return;

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
        // If 401, try refreshing the token and retry once
        if (err instanceof Error && err.message === 'Authentication required') {
          try {
            await refreshToken();
            const response = await get<{ success: boolean; data: { businesses: OwnedBusiness[] } }>(
              `/users/me/businesses`
            );
            setBusinesses(response.data.businesses);
            if (response.data.businesses.length > 0 && response.data.businesses[0]) {
              setSelectedBusiness(response.data.businesses[0]);
            }
            return;
          } catch {
            // Refresh failed, redirect to login
            navigate('/login', { state: { from: '/business/dashboard' } });
            return;
          }
        }
        setError(err instanceof Error ? err.message : 'Failed to load businesses');
      } finally {
        setLoading(false);
      }
    }

    fetchBusinesses();
  }, [user, authLoading, refreshToken, navigate]);

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

  // Fetch enquiries for selected business
  useEffect(() => {
    async function fetchEnquiries() {
      if (!selectedBusiness) return;

      setEnquiriesLoading(true);
      try {
        const response = await get<{ success: boolean; data: { enquiries: Enquiry[]; total: number } }>(
          `/businesses/${selectedBusiness.id}/enquiries?limit=5`
        );
        setEnquiries(response.data.enquiries);
        setEnquiryCount(response.data.total);
      } catch {
        setEnquiries([]);
        setEnquiryCount(0);
      } finally {
        setEnquiriesLoading(false);
      }
    }

    fetchEnquiries();
  }, [selectedBusiness]);

  // Fetch promotion stats and deals
  useEffect(() => {
    if (!selectedBusiness) return;
    dealApi.getPromotionStats(selectedBusiness.id)
      .then(setPromoStats)
      .catch(() => setPromoStats(null));

    setDealsLoading(true);
    dealApi.getBusinessDeals(selectedBusiness.id)
      .then(response => setDeals(response.deals.filter(d => d.status === 'ACTIVE')))
      .catch(() => setDeals([]))
      .finally(() => setDealsLoading(false));
  }, [selectedBusiness]);

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
            className="inline-flex items-center px-6 py-3 bg-primary text-white font-medium rounded-full hover:bg-primary/90 transition-colors"
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
        <div className="max-w-6xl mx-auto space-y-8 pt-6">
          {/* Business Selector (if multiple businesses) */}
          {businesses.length > 1 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
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
                className="w-full px-4 py-2 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
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
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row gap-6">
                    {/* Business Image */}
                    {(() => {
                      const imageUrl = getBusinessImage(selectedBusiness);
                      return imageUrl ? (
                        <div className="flex-shrink-0">
                          <img
                            src={imageUrl}
                            alt={selectedBusiness.name}
                            className="w-24 h-24 rounded-2xl object-cover"
                          />
                        </div>
                      ) : null;
                    })()}

                    {/* Business Details */}
                    <div className="flex-1 min-w-0">
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {selectedBusiness.name}
                        {' '}
                        <Link
                          to={`/businesses/${selectedBusiness.slug}`}
                          className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors align-middle relative -top-0.5"
                        >
                          {t('owner.viewProfile', 'View Profile')}
                        </Link>
                        {' '}
                        <Link
                          to={`/business/manage/${selectedBusiness.id}/edit`}
                          className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-white bg-primary rounded-md hover:bg-primary/90 transition-colors align-middle relative -top-0.5"
                        >
                          {t('owner.editProfile', 'Edit Profile')}
                        </Link>
                        {' '}
                        <Link
                          to={`/business/manage/${selectedBusiness.id}/photos`}
                          className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors align-middle relative -top-0.5"
                        >
                          {t('owner.managePhotos', 'Photos')}
                        </Link>
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
                  </div>
                </div>
              </div>

              {/* Customer Enquiries */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <ChatBubbleLeftRightIcon className="w-6 h-6 text-primary" />
                    {t('owner.enquiries', 'Customer Enquiries')}
                    {enquiryCount > 0 && (
                      <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold text-white bg-primary rounded-full min-w-[20px]">
                        {enquiryCount}
                      </span>
                    )}
                  </h2>
                </div>

                {enquiriesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} variant="rectangular" width="100%" height="72px" className="rounded-lg" />
                    ))}
                  </div>
                ) : enquiries.length === 0 ? (
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-200 dark:border-slate-700 text-center">
                    <EnvelopeIcon className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                    <p className="text-slate-500 dark:text-slate-400">
                      {t('owner.noEnquiries', 'No customer enquiries yet. They\'ll appear here when customers contact you.')}
                    </p>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700 overflow-hidden">
                    {enquiries.map(enq => (
                      <button
                        key={enq.id}
                        type="button"
                        onClick={() => setSelectedEnquiry(enq)}
                        className={`flex items-start gap-3 p-4 w-full text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                          enq.status === 'NEW' ? 'bg-primary/5 dark:bg-primary/10' : ''
                        }`}
                      >
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <EnvelopeIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-sm truncate ${enq.status === 'NEW' ? 'font-semibold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                              {enq.subject}
                            </p>
                            {enq.status === 'NEW' && (
                              <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold text-white bg-primary rounded-full flex-shrink-0">
                                {t('owner.new', 'New')}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {enq.name} · {enq.email}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {enq.message}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                            {new Date(enq.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </section>

              {/* Enquiry Detail Modal */}
              {selectedEnquiry && selectedBusiness && (
                <EnquiryDetailModal
                  enquiry={selectedEnquiry}
                  businessId={selectedBusiness.id}
                  onClose={() => setSelectedEnquiry(null)}
                  onUpdate={(updated) => {
                    setSelectedEnquiry(updated);
                    setEnquiries(prev => prev.map(e => e.id === updated.id ? updated : e));
                  }}
                />
              )}

              {/* Current Promotions */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <TagIcon className="w-6 h-6 text-primary" />
                    {t('owner.currentPromotions', 'Current Promotions')}
                  </h2>
                  <Link
                    to={`/business/manage/${selectedBusiness.id}/edit?tab=promotions`}
                    className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
                  >
                    {t('owner.manageDeals', 'Manage')} &rarr;
                  </Link>
                </div>

                {dealsLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[1, 2].map(i => (
                      <Skeleton key={i} variant="rectangular" width="100%" height="80px" className="rounded-lg" />
                    ))}
                  </div>
                ) : deals.length === 0 ? (
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 text-center">
                    <TagIcon className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                      {t('owner.noPromotions', 'No active promotions. Create one to attract more customers.')}
                    </p>
                    <Link
                      to={`/business/manage/${selectedBusiness.id}/edit?tab=promotions`}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-primary rounded-full hover:bg-primary/90 transition-colors"
                    >
                      {t('owner.createPromotion', 'Create Promotion')}
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {deals.map(deal => {
                      const daysLeft = Math.ceil((new Date(deal.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                      return (
                        <div
                          key={deal.id}
                          className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-xl p-3 shadow-sm border border-slate-200 dark:border-slate-700"
                        >
                          {deal.image ? (
                            <img src={deal.image} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0">
                              <TagIcon className="w-6 h-6 text-amber-500" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{deal.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {deal.discountType === 'PERCENTAGE' && deal.discountValue && (
                                <span className="text-xs font-semibold text-red-600 dark:text-red-400">{deal.discountValue}% off</span>
                              )}
                              {deal.discountType === 'FIXED' && deal.discountValue && (
                                <span className="text-xs font-semibold text-red-600 dark:text-red-400">${deal.discountValue} off</span>
                              )}
                              {deal.discountType === 'BOGO' && (
                                <span className="text-xs font-semibold text-red-600 dark:text-red-400">BOGO</span>
                              )}
                              {deal.discountType === 'FREE_ITEM' && (
                                <span className="text-xs font-semibold text-red-600 dark:text-red-400">Free Item</span>
                              )}
                              <span className="text-xs text-slate-400">·</span>
                              <span className={`text-xs ${daysLeft <= 3 ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
                                {daysLeft <= 0 ? t('owner.expired', 'Expired') : t('owner.daysLeft', '{{days}}d left', { days: daysLeft })}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                              <span>{deal.views} {t('owner.views', 'views')}</span>
                              <span>{deal.clicks} {t('owner.clicks', 'clicks')}</span>
                              {deal.voucherCode && <span>{deal.voucherReveals} {t('owner.reveals', 'reveals')}</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Quick Stats */}
              <section>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  {t('owner.quickStats', 'Quick Stats')}
                </h2>
                {analyticsLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                    {[...Array(7)].map((_, i) => (
                      <Skeleton key={i} variant="rectangular" width="100%" height="56px" className="rounded-lg" />
                    ))}
                  </div>
                ) : analytics ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                    <StatCard
                      label={t('owner.stats.profileViews', 'Profile Views')}
                      metric={analytics.summary.profileViews}
                      icon={<EyeIcon className="w-5 h-5" />}
                    />
                    <StatCard
                      label={t('owner.stats.searchAppearances', 'Search')}
                      metric={analytics.summary.searchAppearances}
                      icon={<MagnifyingGlassIcon className="w-5 h-5" />}
                    />
                    <StatCard
                      label={t('owner.stats.websiteClicks', 'Website')}
                      metric={analytics.summary.clicks.website}
                      icon={<GlobeAltIcon className="w-5 h-5" />}
                    />
                    <StatCard
                      label={t('owner.stats.phoneClicks', 'Phone')}
                      metric={analytics.summary.clicks.phone}
                      icon={<PhoneOutlineIcon className="w-5 h-5" />}
                    />
                    <StatCard
                      label={t('owner.stats.directionsClicks', 'Directions')}
                      metric={analytics.summary.clicks.directions}
                      icon={<MapPinIcon className="w-5 h-5" />}
                    />
                    <StatCard
                      label={t('owner.stats.totalClicks', 'Total Clicks')}
                      metric={analytics.summary.clicks.total}
                      icon={<CursorArrowRaysIcon className="w-5 h-5" />}
                    />
                    <StatCard
                      label={t('owner.stats.newFollowers', 'Followers')}
                      metric={analytics.summary.follows}
                      icon={<HeartIcon className="w-5 h-5" />}
                    />
                  </div>
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 text-center text-slate-600 dark:text-slate-400">
                    {t('owner.analyticsNotAvailable', 'Analytics data is not yet available for this business.')}
                  </div>
                )}
              </section>

              {/* Promotion Stats */}
              {promoStats && (promoStats.totalViews > 0 || promoStats.activeDeals > 0) && (
                <section>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <TagIcon className="w-6 h-6 text-primary" />
                    {t('owner.promotionStats', 'Promotion Performance')}
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-3 shadow-sm border border-slate-200 dark:border-slate-700 text-center">
                      <p className="text-lg font-bold text-slate-900 dark:text-white">{promoStats.activeDeals}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{t('owner.promo.activeDeals', 'Active Deals')}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-3 shadow-sm border border-slate-200 dark:border-slate-700 text-center">
                      <p className="text-lg font-bold text-slate-900 dark:text-white">{promoStats.totalViews}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{t('owner.promo.views', 'Views')}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-3 shadow-sm border border-slate-200 dark:border-slate-700 text-center">
                      <p className="text-lg font-bold text-slate-900 dark:text-white">{promoStats.totalClicks}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{t('owner.promo.clicks', 'Clicks')}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-3 shadow-sm border border-slate-200 dark:border-slate-700 text-center">
                      <p className="text-lg font-bold text-slate-900 dark:text-white">{promoStats.totalVoucherReveals}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{t('owner.promo.voucherReveals', 'Voucher Reveals')}</p>
                    </div>
                  </div>
                </section>
              )}

              {/* Quick Actions */}
              <section>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  {t('owner.quickActions', 'Quick Actions')}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  <ActionCard
                    title={t('owner.actions.analytics', 'Analytics')}
                    description={t('owner.actions.analyticsDesc', 'Performance metrics')}
                    icon={<ChartBarIcon className="w-5 h-5" />}
                    to={`/business/manage/${selectedBusiness.id}/analytics`}
                  />
                  <ActionCard
                    title={t('owner.actions.events', 'Events')}
                    description={t('owner.actions.eventsDesc', 'Create & manage events')}
                    icon={<CalendarDaysIcon className="w-5 h-5" />}
                    to={`/business/manage/${selectedBusiness.id}/events`}
                  />
                  <ActionCard
                    title={t('owner.actions.reviews', 'Reviews')}
                    description={t('owner.actions.reviewsDesc', 'Customer reviews')}
                    icon={<StarIcon className="w-5 h-5" />}
                    to={`/business/manage/${selectedBusiness.id}/reviews`}
                  />
                  <ActionCard
                    title={t('owner.actions.photos', 'Photos')}
                    description={t('owner.actions.photosDesc', 'Manage photos')}
                    icon={<PhotoIcon className="w-5 h-5" />}
                    to={`/business/manage/${selectedBusiness.id}/photos`}
                  />
                  <ActionCard
                    title={t('owner.actions.settings', 'Settings')}
                    description={t('owner.actions.settingsDesc', 'Business info')}
                    icon={<Cog6ToothIcon className="w-5 h-5" />}
                    to={`/business/manage/${selectedBusiness.id}/edit`}
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
    <div className="bg-white dark:bg-slate-800 rounded-xl p-3 shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-2">
        <div className="rounded-full p-1.5 bg-primary/10 text-primary flex-shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5">
            <p className="text-lg font-bold text-slate-900 dark:text-white">{value}</p>
            <span className={`text-xs font-medium ${trendClass}`}>{trend}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{label}</p>
        </div>
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
      className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-xl p-3 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-primary hover:shadow-md transition-all"
    >
      <div className="rounded-full p-1.5 bg-primary/10 text-primary flex-shrink-0">{icon}</div>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">{title}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{description}</p>
      </div>
    </Link>
  );
}

// ─── Enquiry Detail Modal ─────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  GENERAL: 'General Enquiry',
  PRODUCT_QUESTION: 'Product Question',
  BOOKING: 'Booking Request',
  FEEDBACK: 'Feedback',
  OTHER: 'Other',
};

function EnquiryDetailModal({
  enquiry,
  businessId,
  onClose,
  onUpdate,
}: {
  enquiry: Enquiry;
  businessId: string;
  onClose: () => void;
  onUpdate: (updated: Enquiry) => void;
}) {
  const { t } = useTranslation();
  const [replyText, setReplyText] = useState(enquiry.replyMessage || '');
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    setError(null);
    try {
      const updated = await replyToEnquiry(businessId, enquiry.id, replyText.trim());
      onUpdate(updated);
      setShowReplyForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const handleCallClick = async () => {
    try {
      const updated = await recordCallClick(businessId, enquiry.id);
      onUpdate(updated);
      // Open the phone dialer
      if (enquiry.phone) {
        window.location.href = `tel:${enquiry.phone}`;
      }
    } catch {
      // Still open phone even if tracking fails
      if (enquiry.phone) {
        window.location.href = `tel:${enquiry.phone}`;
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        <div
          className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                enquiry.status === 'NEW' ? 'bg-primary/10' : enquiry.status === 'REPLIED' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-slate-100 dark:bg-slate-700'
              }`}>
                {enquiry.status === 'REPLIED'
                  ? <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                  : <EnvelopeIcon className="w-5 h-5 text-primary" />
                }
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {enquiry.subject}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {CATEGORY_LABELS[enquiry.category] || enquiry.category} · {new Date(enquiry.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Customer Info */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">
              {t('owner.enquiryFrom', 'Customer Details')}
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {enquiry.name.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium text-slate-900 dark:text-white">{enquiry.name}</span>
              </div>
              <a
                href={`mailto:${enquiry.email}`}
                className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
              >
                <EnvelopeIcon className="w-4 h-4" />
                {enquiry.email}
              </a>
              {enquiry.phone && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCallClick}
                    className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium transition-colors"
                  >
                    <PhoneOutlineIcon className="w-4 h-4" />
                    {enquiry.phone}
                  </button>
                  {enquiry.callCount > 0 && (
                    <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <PhoneOutlineIcon className="w-3 h-3" />
                      {t('owner.callsMade', 'Called {{count}} time(s)', { count: enquiry.callCount })}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Message */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
              {t('owner.enquiryMessage', 'Message')}
            </h3>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {enquiry.message}
            </p>
          </div>

          {/* Existing Reply */}
          {enquiry.replyMessage && (
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 bg-green-50/50 dark:bg-green-900/10">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircleIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                <h3 className="text-sm font-medium text-green-700 dark:text-green-400">
                  {t('owner.yourReply', 'Your Reply')}
                </h3>
                {enquiry.repliedAt && (
                  <span className="text-xs text-slate-400">
                    {new Date(enquiry.repliedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
              <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                {enquiry.replyMessage}
              </p>
            </div>
          )}

          {/* Reply Form */}
          {showReplyForm ? (
            <div className="p-5 border-b border-slate-200 dark:border-slate-700">
              {error && (
                <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
              )}
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={t('owner.replyPlaceholder', 'Type your reply...')}
                rows={4}
                maxLength={2000}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                autoFocus
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-slate-400">{replyText.length}/2000</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowReplyForm(false)}
                    className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                  >
                    {t('common.cancel', 'Cancel')}
                  </button>
                  <button
                    onClick={handleReply}
                    disabled={sending || !replyText.trim()}
                    className="px-4 py-1.5 text-sm bg-primary text-white rounded-full hover:bg-primary/90 disabled:opacity-50 transition-colors font-medium"
                  >
                    {sending ? t('common.sending', 'Sending...') : t('owner.sendReply', 'Send Reply')}
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {/* Actions */}
          <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ClockOutlineIcon className="w-3.5 h-3.5" />
              {new Date(enquiry.createdAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
            <div className="flex items-center gap-2">
              {enquiry.phone && (
                <button
                  onClick={handleCallClick}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-colors font-medium"
                >
                  <PhoneOutlineIcon className="w-4 h-4" />
                  {t('owner.callCustomer', 'Call')}
                  {enquiry.callCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 bg-green-700 rounded text-xs">
                      {enquiry.callCount}
                    </span>
                  )}
                </button>
              )}
              {!showReplyForm && (
                <button
                  onClick={() => setShowReplyForm(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-primary text-white rounded-full hover:bg-primary/90 transition-colors font-medium"
                >
                  <ChatBubbleLeftRightIcon className="w-4 h-4" />
                  {enquiry.replyMessage
                    ? t('owner.editReply', 'Edit Reply')
                    : t('owner.reply', 'Reply')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
