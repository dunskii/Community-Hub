/**
 * BusinessCard Component
 * Displays business information in a card format for listings
 * WCAG 2.1 AA compliant, mobile-first, RTL-aware
 */

import { Link } from 'react-router-dom';
import type { Business } from '@community-hub/shared';
import { useIsOpenNow } from '../../hooks/useIsOpenNow';
import { Badge } from '../display/Badge';
import { Avatar } from '../display/Avatar';
import { ResponsiveImage } from '../ui/ResponsiveImage';
import { useTranslation } from 'react-i18next';

interface BusinessCardProps {
  business: Business;
  /** Show distance if available */
  distance?: number;
  /** Custom click handler (overrides default link) */
  onClick?: () => void;
}

export function BusinessCard({ business, distance, onClick }: BusinessCardProps) {
  const { t, i18n } = useTranslation();
  const { isOpen } = useIsOpenNow(business.operatingHours);
  const isRtl = i18n.dir() === 'rtl';

  const name = typeof business.name === 'string'
    ? business.name
    : business.name[i18n.language] || business.name.en;

  const description = typeof business.description === 'string'
    ? business.description
    : business.description[i18n.language] || business.description.en;

  const content = (
    <div className="business-card">
      {/* Business Photo */}
      <div className="business-card__image">
        {business.photos && business.photos.length > 0 ? (
          <ResponsiveImage
            src={business.photos[0]}
            alt=""
            decorative
            aspectRatio="16:9"
            objectFit="cover"
            className="business-card__photo"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <Avatar
            name={name}
            size="xl"
            className="business-card__avatar"
          />
        )}
      </div>

      {/* Business Info */}
      <div className="business-card__content">
        <div className="business-card__header">
          <h3 className="business-card__name">{name}</h3>

          {/* Status Badge */}
          <div className="business-card__status">
            {isOpen === null ? (
              <Badge variant="neutral" size="sm">
                {t('business.byAppointment')}
              </Badge>
            ) : isOpen ? (
              <Badge variant="success" size="sm">
                {t('business.openNow')}
              </Badge>
            ) : (
              <Badge variant="neutral" size="sm">
                {t('business.closed')}
              </Badge>
            )}
          </div>
        </div>

        {/* Description */}
        {description && (
          <p className="business-card__description">
            {description}
          </p>
        )}

        {/* Metadata */}
        <div className="business-card__meta">
          {/* Category */}
          {business.categoryPrimary && (
            <span className="business-card__category">
              {typeof business.categoryPrimary.name === 'string'
                ? business.categoryPrimary.name
                : business.categoryPrimary.name[i18n.language] || business.categoryPrimary.name.en}
            </span>
          )}

          {/* Price Range */}
          {business.priceRange && (
            <span className="business-card__price" aria-label={t('business.priceRange')}>
              {business.priceRange}
            </span>
          )}

          {/* Distance */}
          {distance !== undefined && (
            <span className="business-card__distance">
              {distance < 1
                ? `${Math.round(distance * 1000)}${t('common.meters')}`
                : `${distance.toFixed(1)}${t('common.kilometers')}`}
            </span>
          )}

          {/* Rating */}
          {business.rating && (
            <span className="business-card__rating" aria-label={t('business.rating')}>
              ⭐ {business.rating.toFixed(1)}
              {business.reviewCount && (
                <span className="business-card__review-count">
                  ({business.reviewCount})
                </span>
              )}
            </span>
          )}
        </div>

        {/* Address */}
        {business.address && (
          <address className="business-card__address">
            {business.address.streetAddress}, {business.address.suburb}
          </address>
        )}
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="business-card-button"
        type="button"
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      to={`/businesses/${business.slug}`}
      className="business-card-link"
    >
      {content}
    </Link>
  );
}
