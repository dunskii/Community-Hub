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
import { StarIcon } from '@heroicons/react/24/solid';
import type { ViewMode } from '../ui/ViewToggle';

interface BusinessCardProps {
  business: Business;
  /** Show distance if available */
  distance?: number;
  /** Custom click handler (overrides default link) */
  onClick?: () => void;
  /** View mode - grid or list */
  viewMode?: ViewMode;
}

export function BusinessCard({ business, distance, onClick, viewMode = 'grid' }: BusinessCardProps) {
  const { t, i18n } = useTranslation('business');
  const { isOpen } = useIsOpenNow(business.operatingHours);
  const isRtl = i18n.dir() === 'rtl';

  const name = typeof business.name === 'string'
    ? business.name
    : business.name[i18n.language] || business.name.en;

  const description = typeof business.description === 'string'
    ? business.description
    : business.description[i18n.language] || business.description.en;

  // View-specific styling
  const isListView = viewMode === 'list';
  const cardClasses = isListView
    ? 'flex flex-row bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow'
    : 'flex flex-col bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow';

  const imageClasses = isListView
    ? 'w-32 h-32 sm:w-40 sm:h-40 flex-shrink-0'
    : 'w-full h-40';

  const content = (
    <div className={cardClasses}>
      {/* Business Photo */}
      <div className={imageClasses}>
        {business.photos && business.photos.length > 0 ? (
          <ResponsiveImage
            src={business.photos[0]}
            alt=""
            decorative
            aspectRatio={isListView ? '1:1' : '16:9'}
            objectFit="cover"
            className="w-full h-full"
            sizes={isListView ? '160px' : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center">
            <Avatar name={name} size={isListView ? 'lg' : 'xl'} />
          </div>
        )}
      </div>

      {/* Business Info */}
      <div className={`p-4 flex-1 ${isListView ? 'flex flex-col justify-center' : ''}`}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white line-clamp-1">{name}</h3>

          {/* Status Badge */}
          <div className="flex-shrink-0">
            {isOpen === null ? (
              <Badge variant="default" size="sm">
                {t('byAppointment', 'By Appointment')}
              </Badge>
            ) : isOpen ? (
              <Badge variant="success" size="sm">
                {t('openNow', 'Open Now')}
              </Badge>
            ) : (
              <Badge variant="default" size="sm">
                {t('closed', 'Closed')}
              </Badge>
            )}
          </div>
        </div>

        {/* Description */}
        {description && (
          <p className={`text-sm text-slate-600 dark:text-slate-400 ${isListView ? 'line-clamp-2' : 'line-clamp-2'} mb-2`}>
            {description}
          </p>
        )}

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          {/* Category */}
          {business.categoryPrimary && (
            <span className="text-primary">
              {typeof business.categoryPrimary.name === 'string'
                ? business.categoryPrimary.name
                : business.categoryPrimary.name[i18n.language] || business.categoryPrimary.name.en}
            </span>
          )}

          {/* Price Range */}
          {business.priceRange && (
            <span aria-label={t('priceRange', 'Price Range')}>
              {business.priceRange}
            </span>
          )}

          {/* Distance */}
          {distance !== undefined && (
            <span>
              {distance < 1
                ? `${Math.round(distance * 1000)}m`
                : `${distance.toFixed(1)}km`}
            </span>
          )}

          {/* Rating */}
          {business.rating && (
            <span className="flex items-center gap-1" aria-label={t('rating', 'Rating')}>
              <StarIcon className="w-4 h-4 text-yellow-500" aria-hidden="true" />
              {business.rating.toFixed(1)}
              {business.reviewCount && (
                <span className="text-slate-400 dark:text-slate-500">
                  ({business.reviewCount})
                </span>
              )}
            </span>
          )}
        </div>

        {/* Address */}
        {business.address && (
          <address className="text-sm text-slate-500 dark:text-slate-400 mt-2 not-italic">
            {business.address.streetAddress}, {business.address.suburb}
          </address>
        )}
      </div>
    </div>
  );

  const wrapperClasses = 'block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg';

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={wrapperClasses}
        type="button"
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      to={`/businesses/${business.slug}`}
      className={wrapperClasses}
    >
      {content}
    </Link>
  );
}
