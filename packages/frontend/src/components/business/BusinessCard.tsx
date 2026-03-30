/**
 * BusinessCard Component
 * Displays business information in a card format for listings
 * WCAG 2.1 AA compliant, mobile-first, RTL-aware
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Business as BaseBusiness, Deal } from '@community-hub/shared';
import { useIsOpenNow } from '../../hooks/useIsOpenNow';
import { Badge } from '../display/Badge';
import { Avatar } from '../display/Avatar';
import { ResponsiveImage } from '../ui/ResponsiveImage';
import { useTranslation } from 'react-i18next';
import { StarIcon } from '@heroicons/react/24/solid';
import { TagIcon } from '@heroicons/react/24/outline';
import type { ViewMode } from '../ui/ViewToggle';
import { getLanguageNativeName } from '../../i18n/utils';
import { dealApi } from '../../services/deal-api';

/** Convert price range enum to $ symbols */
const PRICE_SYMBOLS: Record<string, string> = {
  BUDGET: '$',
  MODERATE: '$$',
  PREMIUM: '$$$',
  LUXURY: '$$$$',
};

interface BusinessCardProps {
  business: BaseBusiness;
  /** Show distance if available */
  distance?: number;
  /** Custom click handler (overrides default link) */
  onClick?: () => void;
  /** View mode - grid or list */
  viewMode?: ViewMode;
}

export function BusinessCard({ business, distance, onClick, viewMode = 'grid' }: BusinessCardProps) {
  const { t, i18n } = useTranslation('business');
  const { isOpen, nextOpeningTime } = useIsOpenNow(business.operatingHours);
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);

  useEffect(() => {
    dealApi.getBusinessDeals(business.id).then(res => {
      const deal = res.deals.find(d => d.featured && d.status === 'ACTIVE')
        || res.deals.find(d => d.status === 'ACTIVE')
        || null;
      setActiveDeal(deal);
    }).catch(() => { /* deals may not be available */ });
  }, [business.id]);

  const name = typeof business.name === 'string'
    ? business.name
    : business.name[i18n.language] || (business.name as Record<string, string>).en || '';

  const description = typeof business.description === 'string'
    ? business.description
    : business.description[i18n.language] || (business.description as Record<string, string>).en || '';

  // View-specific styling
  const isListView = viewMode === 'list';
  const cardClasses = isListView
    ? 'flex flex-row bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden hover:shadow-md transition-all duration-200'
    : 'group flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden hover:shadow-md transition-all duration-200';

  const imageClasses = isListView
    ? 'w-32 h-32 sm:w-40 sm:h-40 flex-shrink-0'
    : 'w-full h-44';

  const content = (
    <div className={cardClasses}>
      {/* Business Photo */}
      <div className={imageClasses}>
        {business.photos && business.photos.length > 0 ? (
          <ResponsiveImage
            src={business.photos[0] ?? ''}
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
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors leading-snug min-w-0">
            {name}
            {business.priceRange && (
              <span className="text-sm font-normal text-slate-400 dark:text-slate-500 ml-1.5" title={business.priceRange}>
                {PRICE_SYMBOLS[business.priceRange] || business.priceRange}
              </span>
            )}
          </h3>

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
                {nextOpeningTime && (
                  <span className="ml-1">· {t('opensAt', 'Opens at')} {nextOpeningTime}</span>
                )}
              </Badge>
            )}
          </div>
        </div>

        {/* Address */}
        {business.address && (
          <address className="text-sm text-slate-500 dark:text-slate-400 not-italic mb-1">
            {business.address.street}, {business.address.suburb}
          </address>
        )}

        {/* Languages Spoken */}
        {business.languagesSpoken && business.languagesSpoken.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1.5">
            {business.languagesSpoken.map((lang) => (
              <span
                key={lang}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
              >
                {getLanguageNativeName(lang)}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        {description && (
          <p className={`text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-2`}>
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
                : (business.categoryPrimary.name as Record<string, string>)[i18n.language] || (business.categoryPrimary.name as Record<string, string>).en}
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

        {/* Active Promotion */}
        {activeDeal && (
          <div className="mt-2 flex items-center gap-2.5 p-2 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200/60 dark:border-amber-800/40">
            {activeDeal.image ? (
              <img
                src={activeDeal.image}
                alt=""
                className="w-10 h-10 rounded-md object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-md bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                <TagIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                  {t('featuredDeal', 'Special Offer')}
                </span>
                {activeDeal.discountType === 'PERCENTAGE' && activeDeal.discountValue && (
                  <span className="text-xs font-bold text-red-600 dark:text-red-400">
                    {activeDeal.discountValue}% OFF
                  </span>
                )}
                {activeDeal.discountType === 'FIXED' && activeDeal.discountValue && (
                  <span className="text-xs font-bold text-red-600 dark:text-red-400">
                    ${activeDeal.discountValue} OFF
                  </span>
                )}
              </div>
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                {activeDeal.title}
              </p>
            </div>
            {activeDeal.price !== null && activeDeal.originalPrice !== null && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className="text-xs font-bold text-primary">${activeDeal.price.toFixed(2)}</span>
                <span className="text-xs text-slate-400 line-through">${activeDeal.originalPrice.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const wrapperClasses = 'block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-2xl';

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
