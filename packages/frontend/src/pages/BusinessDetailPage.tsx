/**
 * BusinessDetailPage
 * Individual business profile page with full details
 * Material Design 3 inspired, WCAG 2.1 AA compliant
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { PageContainer } from '../components/layout/PageContainer';
import { Tabs } from '../components/display/Tabs';
import { Badge } from '../components/display/Badge';
import { Skeleton } from '../components/display/Skeleton';
import { EmptyState } from '../components/display/EmptyState';
import { OperatingHoursDisplay } from '../components/business/OperatingHoursDisplay';
import { ReviewsTab } from '../components/business/ReviewsTab';
import { DealsSection } from '../components/business/DealsSection';
import { SaveButton } from '../components/SaveButton';
import { useBusinessDetail } from '../hooks/useBusinessDetail';
import { useIsOpenNow } from '../hooks/useIsOpenNow';
import { useSavedBusiness } from '../hooks/useSavedBusiness';
import { useAuth } from '../hooks/useAuth';
import { submitEnquiry } from '../services/enquiry-service';
import { dealApi } from '../services/deal-api';
import { DealDetailModal } from '../components/deals/DealDetailModal';
import type { Deal } from '@community-hub/shared';
import {
  generateBusinessSchema,
  generateBusinessTitle,
  generateBusinessDescription,
  generateBusinessCanonicalUrl,
} from '../utils/seo';
import {
  PhoneIcon,
  GlobeAltIcon,
  MapPinIcon,
  ClockIcon,
  CheckBadgeIcon,
  PhotoIcon,
  BuildingStorefrontIcon,
  ArrowTopRightOnSquareIcon,
  PencilSquareIcon,
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  ArrowLeftIcon,
  CreditCardIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { BusinessMap } from '../components/maps/BusinessMap';
import { getLanguageNativeName } from '../i18n/utils';
import { useLanguage } from '../hooks/useLanguage';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

const ENQUIRY_CATEGORIES = [
  { value: 'GENERAL', labelKey: 'enquiry.category.general' },
  { value: 'PRODUCT_QUESTION', labelKey: 'enquiry.category.product' },
  { value: 'BOOKING', labelKey: 'enquiry.category.booking' },
  { value: 'FEEDBACK', labelKey: 'enquiry.category.feedback' },
  { value: 'OTHER', labelKey: 'enquiry.category.other' },
] as const;

function EnquiryModal({
  businessId,
  businessName,
  onClose,
}: {
  businessId: string;
  businessName: string;
  onClose: () => void;
}) {
  const { t } = useTranslation('business');
  const { user } = useAuth();
  const [name, setName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setError(t('enquiry.validation.required', 'Please fill in all required fields'));
      return;
    }
    if (subject.trim().length < 5) {
      setError(t('enquiry.validation.subjectShort', 'Subject must be at least 5 characters'));
      return;
    }
    if (message.trim().length < 10) {
      setError(t('enquiry.validation.messageShort', 'Message must be at least 10 characters'));
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await submitEnquiry({
        businessId,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        category,
        subject: subject.trim(),
        message: message.trim(),
      });
      setSuccess(true);
    } catch (err) {
      let msg = t('enquiry.error', 'Failed to send enquiry');
      if (err instanceof Error) {
        msg = err.message;
      }
      // Show validation details if available
      const httpErr = err as { details?: Array<{ field: string; message: string }> };
      if (httpErr.details && Array.isArray(httpErr.details)) {
        msg = httpErr.details.map(d => d.message).join('. ');
      }
      setError(msg);
    } finally {
      setSubmitting(false);
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
          aria-labelledby="enquiry-modal-title"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
            <div>
              <h2 id="enquiry-modal-title" className="text-lg font-semibold text-slate-900 dark:text-white">
                {t('enquiry.title', 'Make an Enquiry')}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {businessName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              aria-label={t('common.close', 'Close')}
            >
              <XMarkIcon className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {success ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <ChatBubbleLeftRightIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                {t('enquiry.sent', 'Enquiry Sent!')}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                {t('enquiry.sentDesc', 'Your message has been sent to {{name}}. They\'ll get back to you soon.', { name: businessName })}
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                {t('common.done', 'Done')}
              </button>
            </div>
          ) : (
            <>
              {/* Form */}
              <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="enquiry-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      {t('enquiry.name', 'Your Name')} *
                    </label>
                    <input
                      id="enquiry-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="enquiry-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      {t('enquiry.email', 'Your Email')} *
                    </label>
                    <input
                      id="enquiry-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="enquiry-phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('enquiry.phone', 'Phone')} <span className="text-slate-400 font-normal">({t('common.optional', 'optional')})</span>
                  </label>
                  <input
                    id="enquiry-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="enquiry-category" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('enquiry.categoryLabel', 'Category')}
                  </label>
                  <select
                    id="enquiry-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    {ENQUIRY_CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {t(cat.labelKey, cat.value.replace('_', ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase()))}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="enquiry-subject" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('enquiry.subject', 'Subject')} *
                  </label>
                  <input
                    id="enquiry-subject"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder={t('enquiry.subjectPlaceholder', 'What is your enquiry about?')}
                    maxLength={200}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="enquiry-message" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('enquiry.message', 'Message')} *
                  </label>
                  <textarea
                    id="enquiry-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t('enquiry.messagePlaceholder', 'Provide details about your enquiry...')}
                    rows={4}
                    maxLength={1000}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    required
                  />
                  <p className="mt-1 text-xs text-slate-400">{message.length}/1000</p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !name.trim() || !email.trim() || !subject.trim() || !message.trim()}
                  className="px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors font-medium flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {t('enquiry.sending', 'Sending...')}
                    </>
                  ) : (
                    <>
                      <ChatBubbleLeftRightIcon className="w-4 h-4" />
                      {t('enquiry.send', 'Send Enquiry')}
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function OwnerEditLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary hover:text-primary/80 hover:bg-primary/5 rounded-lg transition-colors"
      title={label}
    >
      <PencilSquareIcon className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}

export function BusinessDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation('business');
  const { business, loading, error } = useBusinessDetail({ slug });
  const { isOpen, nextOpeningTime } = useIsOpenNow(business?.operatingHours);

  const { user } = useAuth();
  const { isSaved, toggleSaved } = useSavedBusiness(business?.id || '');
  const { currentLanguage, changeLanguage } = useLanguage();

  const [showEnquiry, setShowEnquiry] = useState(false);
  const [featuredDeal, setFeaturedDeal] = useState<Deal | null>(null);
  const [showDealModal, setShowDealModal] = useState(false);

  // Fetch featured deal for this business
  useEffect(() => {
    if (!business?.id) return;
    dealApi.getBusinessDeals(business.id).then(response => {
      const featured = response.deals.find(d => d.featured && d.status === 'ACTIVE');
      const active = response.deals.find(d => d.status === 'ACTIVE');
      setFeaturedDeal(featured || active || null);
    }).catch(() => {
      // Deals may not be available
    });
  }, [business?.id]);

  // Check if current user is the business owner
  const isOwner = !!(user && business && business.claimedBy === user.id);
  const isAdmin = !!(user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'));

  // Loading state
  if (loading) {
    return (
      <PageContainer>
        <div className="max-w-4xl mx-auto py-8">
          <Skeleton variant="rectangular" width="100%" height="300px" className="rounded-2xl" />
          <div className="mt-6 space-y-4">
            <Skeleton variant="text" width="60%" height="40px" />
            <Skeleton variant="text" width="40%" height="24px" />
            <Skeleton variant="text" width="100%" height="80px" />
          </div>
        </div>
      </PageContainer>
    );
  }

  // Error state
  if (error || !business) {
    return (
      <PageContainer>
        <EmptyState
          title={t('notFoundTitle', 'Business Not Found')}
          description={error || t('notFoundDescription', "The business you're looking for doesn't exist or has been removed.")}
          icon={<BuildingStorefrontIcon className="w-16 h-16 text-slate-400" />}
        />
      </PageContainer>
    );
  }

  const name = typeof business.name === 'string'
    ? business.name
    : business.name[i18n.language] || business.name.en;

  const description = typeof business.description === 'string'
    ? business.description
    : business.description[i18n.language] || business.description.en;

  const pageTitle = generateBusinessTitle(business, i18n.language);
  const pageDescription = generateBusinessDescription(business, i18n.language);
  const canonicalUrl = generateBusinessCanonicalUrl(business.slug);
  const schema = generateBusinessSchema(business, i18n.language);

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={name} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="business.business" />
        <meta property="og:url" content={canonicalUrl} />
        {business.photos?.[0] && <meta property="og:image" content={business.photos[0]} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={name} />
        <meta name="twitter:description" content={pageDescription} />
        {business.photos?.[0] && <meta name="twitter:image" content={business.photos[0]} />}
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>

      <PageContainer>
        <article className="max-w-4xl mx-auto py-8">
          {/* Admin back link */}
          {isAdmin && (
            <Link
              to="/admin/businesses"
              className="inline-flex items-center text-sm text-slate-600 dark:text-slate-400 hover:text-teal-600 mb-4"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-1" />
              {t('admin.businesses.backToBusinesses', 'Back to Businesses')}
            </Link>
          )}

          {/* Hero Image */}
          {business.photos && business.photos.length > 0 ? (
            <div className="relative w-full h-64 md:h-80 lg:h-96 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800">
              <img
                src={business.photos[0]}
                alt={name}
                className="w-full h-full object-cover"
              />
              {/* Gradient overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              {isOwner && (
                <Link
                  to={`/business/manage/${business.id}/photos`}
                  className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm"
                >
                  <PencilSquareIcon className="w-3.5 h-3.5" />
                  {t('editPhotos', 'Edit Photos')}
                </Link>
              )}
            </div>
          ) : (
            <div className="relative w-full h-64 md:h-80 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/20 dark:from-primary/20 dark:to-primary/30 flex items-center justify-center">
              <BuildingStorefrontIcon className="w-24 h-24 text-primary/50" />
              {isOwner && (
                <Link
                  to={`/business/manage/${business.id}/photos`}
                  className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm"
                >
                  <PencilSquareIcon className="w-3.5 h-3.5" />
                  {t('addPhotos', 'Add Photos')}
                </Link>
              )}
            </div>
          )}

          {/* Header Card */}
          <div className="relative -mt-20 mx-4 md:mx-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 md:p-8">
            {/* Title Row */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-baseline gap-3">
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                    {name}
                  </h1>
                  {business.yearEstablished && (
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      Est. {business.yearEstablished}
                    </span>
                  )}
                  {business.priceRange && (
                    <span className="text-sm text-slate-500 dark:text-slate-400" title={business.priceRange}>
                      {{ BUDGET: '$', MODERATE: '$$', PREMIUM: '$$$', LUXURY: '$$$$' }[business.priceRange] || business.priceRange}
                    </span>
                  )}
                </div>

                {/* Languages Spoken - click to switch platform language */}
                {business.languagesSpoken && business.languagesSpoken.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {business.languagesSpoken.map((lang, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => changeLanguage(lang)}
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                          currentLanguage === lang
                            ? 'bg-primary text-white'
                            : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50'
                        }`}
                      >
                        {getLanguageNativeName(lang)}
                      </button>
                    ))}
                  </div>
                )}

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-slate-600 dark:text-slate-400">
                  {business.categoryPrimary && (
                    <span className="inline-flex items-center gap-1 text-primary font-medium">
                      {typeof business.categoryPrimary.name === 'string'
                        ? business.categoryPrimary.name
                        : business.categoryPrimary.name[i18n.language] || business.categoryPrimary.name.en}
                    </span>
                  )}

                  {business.rating && (
                    <span className="inline-flex items-center gap-1">
                      <StarSolidIcon className="w-4 h-4 text-amber-500" />
                      <span className="font-medium text-slate-900 dark:text-white">
                        {business.rating.toFixed(1)}
                      </span>
                      {business.reviewCount && (
                        <span className="text-slate-500 dark:text-slate-400">
                          ({business.reviewCount} {t('reviews', 'reviews')})
                        </span>
                      )}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Owner Edit Button */}
                {isOwner && (
                  <OwnerEditLink
                    to={`/business/manage/${business.id}/edit`}
                    label={t('editProfile', 'Edit Profile')}
                  />
                )}
                {/* Status Badge */}
                {isOpen === null ? (
                  <Badge variant="default">{t('byAppointment', 'By Appointment')}</Badge>
                ) : isOpen ? (
                  <Badge variant="success">{t('openNow', 'Open Now')}</Badge>
                ) : (
                  <Badge variant="default">
                    {t('closed', 'Closed')}
                    {nextOpeningTime && (
                      <span className="ml-1">
                        · {t('opensAt', 'Opens at')} {nextOpeningTime}
                      </span>
                    )}
                  </Badge>
                )}

                {!isOwner && (
                  <button
                    onClick={() => setShowEnquiry(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <ChatBubbleLeftRightIcon className="w-4 h-4" />
                    {t('makeEnquiry', 'Make Enquiry')}
                  </button>
                )}

                {user && (
                  <SaveButton
                    isSaved={isSaved}
                    onClick={toggleSaved}
                    variant="full"
                  />
                )}
              </div>
            </div>

            {/* Description */}
            {description && (
              <p className="mt-4 text-slate-600 dark:text-slate-300 leading-relaxed">
                {description}
              </p>
            )}

            {/* Featured Promotion */}
            {featuredDeal && (
              <button
                onClick={() => setShowDealModal(true)}
                className="mt-4 w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800/50 hover:border-amber-300 dark:hover:border-amber-700 transition-colors text-left group"
              >
                {featuredDeal.image ? (
                  <img
                    src={featuredDeal.image}
                    alt=""
                    className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🏷️</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                      {t('featuredDeal', 'Special Offer')}
                    </span>
                    {featuredDeal.discountType === 'PERCENTAGE' && featuredDeal.discountValue && (
                      <span className="text-xs font-bold text-red-600 dark:text-red-400">
                        {featuredDeal.discountValue}% OFF
                      </span>
                    )}
                    {featuredDeal.discountType === 'FIXED' && featuredDeal.discountValue && (
                      <span className="text-xs font-bold text-red-600 dark:text-red-400">
                        ${featuredDeal.discountValue} OFF
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {featuredDeal.title}
                  </p>
                  {featuredDeal.price !== null && featuredDeal.originalPrice !== null && (
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-sm font-bold text-primary">${featuredDeal.price.toFixed(2)}</span>
                      <span className="text-xs text-slate-400 line-through">${featuredDeal.originalPrice.toFixed(2)}</span>
                    </div>
                  )}
                </div>
                <span className="text-primary group-hover:translate-x-0.5 transition-transform text-sm">&rarr;</span>
              </button>
            )}
          </div>

          {/* Tabs Section */}
          <div className="mt-8 bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <Tabs
              tabs={[
                {
                  id: 'overview',
                  label: t('tabs.overview', 'Overview'),
                  content: (
                    <div className="p-6 md:p-8 space-y-8">
                      {/* Contact Information */}
                      <section>
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                          <PhoneIcon className="w-5 h-5 text-primary" />
                          {t('contactInfo', 'Contact Information')}
                          {isOwner && (
                            <OwnerEditLink
                              to={`/business/manage/${business.id}/edit?tab=contact`}
                              label={t('edit', 'Edit')}
                            />
                          )}
                        </h2>

                        <div className="space-y-3">
                          {business.phone && (
                            <a
                              href={`tel:${business.phone}`}
                              className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <PhoneIcon className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{t('phone', 'Phone')}</p>
                                <p className="font-medium text-slate-900 dark:text-white">{business.phone}</p>
                              </div>
                            </a>
                          )}

                          {business.website && (
                            <a
                              href={business.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <GlobeAltIcon className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{t('website', 'Website')}</p>
                                <p className="font-medium text-primary truncate max-w-xs">{business.website}</p>
                              </div>
                            </a>
                          )}

                          {business.address && (
                            <div className="space-y-4">
                              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                  <MapPinIcon className="w-5 h-5 text-primary" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm text-slate-500 dark:text-slate-400">{t('address', 'Address')}</p>
                                  <address className="not-italic font-medium text-slate-900 dark:text-white">
                                    {business.address.street}<br />
                                    {business.address.suburb}, {business.address.state} {business.address.postcode}
                                  </address>
                                </div>
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                    `${business.address.street}, ${business.address.suburb}, ${business.address.state} ${business.address.postcode}`
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
                                  aria-label={t('getDirections', 'Get directions')}
                                >
                                  <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                                  <span className="hidden sm:inline">{t('directions', 'Directions')}</span>
                                </a>
                              </div>

                              {/* Location Map */}
                              {business.address.latitude && business.address.longitude && (
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                    `${business.address.street}, ${business.address.suburb}, ${business.address.state} ${business.address.postcode}`
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block cursor-pointer"
                                  aria-label={t('getDirectionsTo', 'Get directions to {{name}}', { name: name ?? '' })}
                                >
                                  <BusinessMap
                                    latitude={business.address.latitude}
                                    longitude={business.address.longitude}
                                    businessName={name ?? ''}
                                    address={`${business.address.street}, ${business.address.suburb}, ${business.address.state} ${business.address.postcode}`}
                                    className="h-64 rounded-xl"
                                  />
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </section>

                      {/* Operating Hours */}
                      <section>
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                          <ClockIcon className="w-5 h-5 text-primary" />
                          {t('openingHours', 'Opening Hours')}
                          {isOwner && (
                            <OwnerEditLink
                              to={`/business/manage/${business.id}/edit?tab=hours`}
                              label={t('edit', 'Edit')}
                            />
                          )}
                        </h2>
                        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                          <OperatingHoursDisplay
                            operatingHours={business.operatingHours}
                            showStatus={false}
                          />
                        </div>
                      </section>

                      {/* Accessibility Features */}
                      {business.accessibilityFeatures && business.accessibilityFeatures.length > 0 && (
                        <section>
                          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <CheckBadgeIcon className="w-5 h-5 text-primary" />
                            {t('accessibility', 'Accessibility')}
                          </h2>
                          <div className="flex flex-wrap gap-2">
                            {business.accessibilityFeatures.map((feature: string, index: number) => (
                              <span
                                key={index}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-medium"
                              >
                                <CheckBadgeIcon className="w-4 h-4" />
                                {t(`accessibilityFeature.${feature}`, feature.replace(/_/g, ' '))}
                              </span>
                            ))}
                          </div>
                        </section>
                      )}

                      {/* Certifications */}
                      {business.certifications && business.certifications.length > 0 && (
                        <section>
                          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <CheckBadgeIcon className="w-5 h-5 text-primary" />
                            {t('certifications', 'Certifications')}
                          </h2>
                          <div className="flex flex-wrap gap-2">
                            {business.certifications.map((cert, index) => (
                              <Badge key={index} variant="default">
                                {cert}
                              </Badge>
                            ))}
                          </div>
                        </section>
                      )}

                      {/* Payment Methods */}
                      {business.paymentMethods && business.paymentMethods.length > 0 && (
                        <section>
                          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <CreditCardIcon className="w-5 h-5 text-primary" />
                            {t('paymentMethods', 'Payment Methods')}
                          </h2>
                          <div className="flex flex-wrap gap-2">
                            {business.paymentMethods.map((method, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium"
                              >
                                {t(`paymentMethod.${method}`, method.replace(/_/g, ' '))}
                              </span>
                            ))}
                          </div>
                        </section>
                      )}


                      {/* Social Links */}
                      {business.socialLinks && Object.values(business.socialLinks).some(Boolean) && (
                        <section>
                          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <GlobeAltIcon className="w-5 h-5 text-primary" />
                            {t('socialLinks', 'Social Media')}
                          </h2>
                          <div className="flex flex-wrap gap-3">
                            {business.socialLinks.facebook && (
                              <a href={business.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm font-medium text-slate-700 dark:text-slate-300">
                                {t('social.facebook', 'Facebook')}
                                <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {business.socialLinks.instagram && (
                              <a href={business.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm font-medium text-slate-700 dark:text-slate-300">
                                {t('social.instagram', 'Instagram')}
                                <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {business.socialLinks.twitter && (
                              <a href={business.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm font-medium text-slate-700 dark:text-slate-300">
                                {t('social.twitter', 'Twitter / X')}
                                <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {business.socialLinks.tiktok && (
                              <a href={business.socialLinks.tiktok} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm font-medium text-slate-700 dark:text-slate-300">
                                {t('social.tiktok', 'TikTok')}
                                <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {business.socialLinks.linkedin && (
                              <a href={business.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm font-medium text-slate-700 dark:text-slate-300">
                                {t('social.linkedin', 'LinkedIn')}
                                <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {business.socialLinks.youtube && (
                              <a href={business.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm font-medium text-slate-700 dark:text-slate-300">
                                {t('social.youtube', 'YouTube')}
                                <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {business.socialLinks.googleBusiness && (
                              <a href={business.socialLinks.googleBusiness} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm font-medium text-slate-700 dark:text-slate-300">
                                {t('social.googleBusiness', 'Google Business')}
                                <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </section>
                      )}

                      {/* Parking Information */}
                      {business.parkingInformation && (
                        <section>
                          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <InformationCircleIcon className="w-5 h-5 text-primary" />
                            {t('parking', 'Parking')}
                          </h2>
                          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <MapPinIcon className="w-5 h-5 text-primary" />
                            </div>
                            <p className="font-medium text-slate-900 dark:text-white self-center">{business.parkingInformation}</p>
                          </div>
                        </section>
                      )}
                    </div>
                  ),
                },
                {
                  id: 'deals',
                  label: t('tabs.deals', 'Deals'),
                  content: (
                    <div className="p-6 md:p-8">
                      {isOwner && (
                        <div className="flex justify-end mb-4">
                          <OwnerEditLink
                            to={`/business/manage/${business.id}/edit?tab=promotions`}
                            label={t('manageDeals', 'Manage Deals')}
                          />
                        </div>
                      )}
                      <DealsSection businessId={business.id} businessName={name ?? ''} />
                    </div>
                  ),
                },
                {
                  id: 'photos',
                  label: t('tabs.photos', 'Photos'),
                  content: (
                    <div className="p-6 md:p-8">
                      {isOwner && (
                        <div className="flex justify-end mb-4">
                          <OwnerEditLink
                            to={`/business/manage/${business.id}/photos`}
                            label={t('managePhotos', 'Manage Photos')}
                          />
                        </div>
                      )}
                      {business.photos && business.photos.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {business.photos.map((photo, index) => (
                            <div
                              key={index}
                              className="aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700"
                            >
                              <img
                                src={photo}
                                alt={`${name} - ${t('photo', 'Photo')} ${index + 1}`}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <EmptyState
                          title={t('noPhotos', 'No Photos Available')}
                          description={t('noPhotosDescription', "This business hasn't uploaded any photos yet.")}
                          icon={<PhotoIcon className="w-16 h-16 text-slate-400" />}
                        />
                      )}
                    </div>
                  ),
                },
                {
                  id: 'reviews',
                  label: t('tabs.reviews', 'Reviews'),
                  content: (
                    <div className="p-6 md:p-8">
                      {isOwner && (
                        <div className="flex justify-end mb-4">
                          <OwnerEditLink
                            to={`/business/manage/${business.id}/reviews`}
                            label={t('manageReviews', 'Manage Reviews')}
                          />
                        </div>
                      )}
                      <ReviewsTab businessId={business.id} businessName={name ?? ''} />
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </article>
      </PageContainer>

      {/* Deal Detail Modal */}
      {showDealModal && featuredDeal && (
        <DealDetailModal
          deal={featuredDeal}
          onClose={() => setShowDealModal(false)}
        />
      )}

      {/* Enquiry Modal */}
      {showEnquiry && business && (
        <EnquiryModal
          businessId={business.id}
          businessName={name ?? ''}
          onClose={() => setShowEnquiry(false)}
        />
      )}
    </>
  );
}
