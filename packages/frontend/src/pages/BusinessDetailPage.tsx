/**
 * BusinessDetailPage
 * Individual business profile page with full details
 * WCAG 2.1 AA compliant, SEO optimized
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
import { useBusinessDetail } from '../hooks/useBusinessDetail';
import { useIsOpenNow } from '../hooks/useIsOpenNow';
import {
  generateBusinessSchema,
  generateBusinessTitle,
  generateBusinessDescription,
  generateBusinessCanonicalUrl,
} from '../utils/seo';

export function BusinessDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation();
  const { business, loading, error } = useBusinessDetail({ slug });
  const { isOpen } = useIsOpenNow(business?.operatingHours);

  // Loading state
  if (loading) {
    return (
      <PageContainer>
        <div className="business-detail-page">
          <Skeleton variant="rectangular" width="100%" height="300px" />
          <div className="business-detail-page__content">
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
          title={t('business.notFoundTitle')}
          description={error || t('business.notFoundDescription')}
          icon="🔍"
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

        {/* Open Graph */}
        <meta property="og:title" content={name} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="business.business" />
        <meta property="og:url" content={canonicalUrl} />
        {business.photos?.[0] && <meta property="og:image" content={business.photos[0]} />}

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={name} />
        <meta name="twitter:description" content={pageDescription} />
        {business.photos?.[0] && <meta name="twitter:image" content={business.photos[0]} />}

        {/* Schema.org LocalBusiness */}
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      </Helmet>

      <PageContainer>
        <div className="business-detail-page">
          {/* Hero Image */}
          {business.photos && business.photos.length > 0 && (
            <div className="business-detail-page__hero">
              <img
                src={business.photos[0]}
                alt={name}
                className="business-detail-page__hero-image"
              />
            </div>
          )}

          {/* Header */}
          <header className="business-detail-page__header">
            <div className="business-detail-page__title-row">
              <h1 className="business-detail-page__title">{name}</h1>
              <div className="business-detail-page__status">
                {isOpen === null ? (
                  <Badge variant="neutral">{t('business.byAppointment')}</Badge>
                ) : isOpen ? (
                  <Badge variant="success">{t('business.openNow')}</Badge>
                ) : (
                  <Badge variant="neutral">{t('business.closed')}</Badge>
                )}
              </div>
            </div>

            {/* Metadata */}
            <div className="business-detail-page__meta">
              {business.categoryPrimary && (
                <span className="business-detail-page__category">
                  {typeof business.categoryPrimary.name === 'string'
                    ? business.categoryPrimary.name
                    : business.categoryPrimary.name[i18n.language] || business.categoryPrimary.name.en}
                </span>
              )}

              {business.priceRange && (
                <span className="business-detail-page__price" aria-label={t('business.priceRange')}>
                  {business.priceRange}
                </span>
              )}

              {business.rating && (
                <span className="business-detail-page__rating" aria-label={t('business.rating')}>
                  ⭐ {business.rating.toFixed(1)}
                  {business.reviewCount && (
                    <span className="business-detail-page__review-count">
                      ({business.reviewCount} {t('business.reviews')})
                    </span>
                  )}
                </span>
              )}
            </div>

            {/* Description */}
            {description && (
              <p className="business-detail-page__description">{description}</p>
            )}
          </header>

          {/* Tabs */}
          <Tabs
            tabs={[
              {
                id: 'overview',
                label: t('business.tabs.overview'),
                content: (
                  <div className="business-detail-page__tab-content">
                    {/* Contact Information */}
                    <section className="business-detail-section">
                      <h2>{t('business.contactInfo')}</h2>

                      {business.phone && (
                        <div className="business-detail-item">
                          <strong>{t('business.phone')}:</strong>
                          <a href={`tel:${business.phone}`}>{business.phone}</a>
                        </div>
                      )}

                      {business.email && (
                        <div className="business-detail-item">
                          <strong>{t('business.email')}:</strong>
                          <a href={`mailto:${business.email}`}>{business.email}</a>
                        </div>
                      )}

                      {business.website && (
                        <div className="business-detail-item">
                          <strong>{t('business.website')}:</strong>
                          <a
                            href={business.website}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {business.website}
                          </a>
                        </div>
                      )}

                      {business.address && (
                        <div className="business-detail-item">
                          <strong>{t('business.address')}:</strong>
                          <address>
                            {business.address.streetAddress}<br />
                            {business.address.suburb}, {business.address.state} {business.address.postcode}
                          </address>
                        </div>
                      )}
                    </section>

                    {/* Operating Hours */}
                    <section className="business-detail-section">
                      <h2>{t('business.openingHours')}</h2>
                      <OperatingHoursDisplay
                        operatingHours={business.operatingHours}
                        showStatus={false}
                      />
                    </section>

                    {/* Features */}
                    {business.accessibility && business.accessibility.length > 0 && (
                      <section className="business-detail-section">
                        <h2>{t('business.accessibility')}</h2>
                        <ul className="business-detail-list">
                          {business.accessibility.map((feature, index) => (
                            <li key={index}>{t(`business.accessibility.${feature}`)}</li>
                          ))}
                        </ul>
                      </section>
                    )}

                    {business.certifications && business.certifications.length > 0 && (
                      <section className="business-detail-section">
                        <h2>{t('business.certifications')}</h2>
                        <div className="business-detail-badges">
                          {business.certifications.map((cert, index) => (
                            <Badge key={index} variant="neutral">
                              {t(`business.certifications.${cert}`)}
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
                label: t('business.tabs.photos'),
                content: (
                  <div className="business-detail-page__tab-content">
                    {business.photos && business.photos.length > 0 ? (
                      <div className="business-detail-gallery">
                        {business.photos.map((photo, index) => (
                          <img
                            key={index}
                            src={photo}
                            alt={`${name} - ${t('business.photo')} ${index + 1}`}
                            className="business-detail-gallery__image"
                            loading="lazy"
                          />
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        title={t('business.noPhotos')}
                        description={t('business.noPhotosDescription')}
                        icon="📷"
                      />
                    )}
                  </div>
                ),
              },
              {
                id: 'reviews',
                label: t('business.tabs.reviews'),
                content: (
                  <div className="business-detail-page__tab-content">
                    <EmptyState
                      title={t('business.reviewsComingSoon')}
                      description={t('business.reviewsComingSoonDescription')}
                      icon="⭐"
                    />
                  </div>
                ),
              },
            ]}
          />
        </div>
      </PageContainer>
    </>
  );
}
