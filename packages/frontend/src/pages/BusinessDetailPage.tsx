/**
 * BusinessDetailPage
 * Individual business profile page with full details
 * Material Design 3 inspired, WCAG 2.1 AA compliant
 */

import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { PageContainer } from '../components/layout/PageContainer';
import { Tabs } from '../components/display/Tabs';
import { Badge } from '../components/display/Badge';
import { Skeleton } from '../components/display/Skeleton';
import { EmptyState } from '../components/display/EmptyState';
import { OperatingHoursDisplay } from '../components/business/OperatingHoursDisplay';
import { ReviewsTab } from '../components/business/ReviewsTab';
import { SaveButton } from '../components/SaveButton';
import { FollowButton } from '../components/FollowButton';
import { useBusinessDetail } from '../hooks/useBusinessDetail';
import { useIsOpenNow } from '../hooks/useIsOpenNow';
import { useSavedBusiness } from '../hooks/useSavedBusiness';
import { useFollowBusiness } from '../hooks/useFollowBusiness';
import {
  generateBusinessSchema,
  generateBusinessTitle,
  generateBusinessDescription,
  generateBusinessCanonicalUrl,
} from '../utils/seo';
import {
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  MapPinIcon,
  ClockIcon,
  CheckBadgeIcon,
  PhotoIcon,
  BuildingStorefrontIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

export function BusinessDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation('business');
  const { business, loading, error } = useBusinessDetail({ slug });
  const { isOpen } = useIsOpenNow(business?.operatingHours);

  const { isSaved, toggleSaved } = useSavedBusiness(business?.id || '');
  const { isFollowing, followerCount, toggleFollow } = useFollowBusiness(business?.id || '');

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
            </div>
          ) : (
            <div className="w-full h-64 md:h-80 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/20 dark:from-primary/20 dark:to-primary/30 flex items-center justify-center">
              <BuildingStorefrontIcon className="w-24 h-24 text-primary/50" />
            </div>
          )}

          {/* Header Card */}
          <div className="relative -mt-20 mx-4 md:mx-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 md:p-8">
            {/* Title Row */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                  {name}
                </h1>

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-slate-600 dark:text-slate-400">
                  {business.categoryPrimary && (
                    <span className="inline-flex items-center gap-1 text-primary font-medium">
                      {typeof business.categoryPrimary.name === 'string'
                        ? business.categoryPrimary.name
                        : business.categoryPrimary.name[i18n.language] || business.categoryPrimary.name.en}
                    </span>
                  )}

                  {business.priceRange && (
                    <span className="text-slate-500 dark:text-slate-400">
                      {business.priceRange}
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
                {/* Status Badge */}
                {isOpen === null ? (
                  <Badge variant="default">{t('byAppointment', 'By Appointment')}</Badge>
                ) : isOpen ? (
                  <Badge variant="success">{t('openNow', 'Open Now')}</Badge>
                ) : (
                  <Badge variant="default">{t('closed', 'Closed')}</Badge>
                )}

                <SaveButton
                  isSaved={isSaved}
                  onClick={toggleSaved}
                  variant="full"
                />
                <FollowButton
                  isFollowing={isFollowing}
                  onClick={toggleFollow}
                  variant="primary"
                  followerCount={followerCount}
                />
              </div>
            </div>

            {/* Description */}
            {description && (
              <p className="mt-4 text-slate-600 dark:text-slate-300 leading-relaxed">
                {description}
              </p>
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

                          {business.email && (
                            <a
                              href={`mailto:${business.email}`}
                              className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <EnvelopeIcon className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{t('email', 'Email')}</p>
                                <p className="font-medium text-slate-900 dark:text-white">{business.email}</p>
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
                            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <MapPinIcon className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{t('address', 'Address')}</p>
                                <address className="not-italic font-medium text-slate-900 dark:text-white">
                                  {business.address.streetAddress}<br />
                                  {business.address.suburb}, {business.address.state} {business.address.postcode}
                                </address>
                              </div>
                            </div>
                          )}
                        </div>
                      </section>

                      {/* Operating Hours */}
                      <section>
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                          <ClockIcon className="w-5 h-5 text-primary" />
                          {t('openingHours', 'Opening Hours')}
                        </h2>
                        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                          <OperatingHoursDisplay
                            operatingHours={business.operatingHours}
                            showStatus={false}
                          />
                        </div>
                      </section>

                      {/* Accessibility Features */}
                      {business.accessibility && business.accessibility.length > 0 && (
                        <section>
                          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <CheckBadgeIcon className="w-5 h-5 text-primary" />
                            {t('accessibility', 'Accessibility')}
                          </h2>
                          <div className="flex flex-wrap gap-2">
                            {business.accessibility.map((feature, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-medium"
                              >
                                <CheckBadgeIcon className="w-4 h-4" />
                                {feature}
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
                    </div>
                  ),
                },
                {
                  id: 'photos',
                  label: t('tabs.photos', 'Photos'),
                  content: (
                    <div className="p-6 md:p-8">
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
                      <ReviewsTab businessId={business.id} businessName={name} />
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </article>
      </PageContainer>
    </>
  );
}
