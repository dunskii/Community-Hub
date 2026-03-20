/**
 * DealCard Component
 * Phase 10: Promotions & Deals MVP
 * Displays deal/promotion information in a card format
 * WCAG 2.1 AA compliant, mobile-first, RTL-aware
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge } from '../display/Badge';
import { ResponsiveImage } from '../ui/ResponsiveImage';
import type { Deal, DiscountType } from '@community-hub/shared';

interface DealCardProps {
  deal: Deal;
  /** Show compact version for lists */
  compact?: boolean;
  /** Show voucher code button */
  showVoucherCode?: boolean;
  /** Custom click handler (overrides default link) */
  onClick?: () => void;
}

/**
 * Format discount display
 */
function formatDiscount(
  discountType: DiscountType | null,
  discountValue: number | null,
  t: (key: string, options?: Record<string, unknown>) => string
): string | null {
  if (!discountType || discountValue === null) return null;

  switch (discountType) {
    case 'PERCENTAGE':
      return t('deal.discountOff', { value: `${discountValue}%` });
    case 'FIXED':
      return t('deal.discountOff', { value: `$${discountValue}` });
    case 'BOGO':
      return t('deal.bogo');
    case 'FREE_ITEM':
      return t('deal.freeItem');
    default:
      return null;
  }
}

/**
 * Format price display
 */
function formatPrice(price: number | null): string | null {
  if (price === null) return null;
  return `$${price.toFixed(2)}`;
}

/**
 * Calculate days remaining until deal expires
 */
function getDaysRemaining(validUntil: string): number {
  const now = new Date();
  const end = new Date(validUntil);
  const diffTime = end.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get discount badge variant
 */
function getDiscountBadgeVariant(discountType: DiscountType | null): 'success' | 'warning' | 'error' {
  switch (discountType) {
    case 'PERCENTAGE':
      return 'error'; // Red for percentage off
    case 'FIXED':
      return 'error';
    case 'BOGO':
      return 'warning';
    case 'FREE_ITEM':
      return 'success';
    default:
      return 'success';
  }
}

export function DealCard({ deal, compact = false, showVoucherCode = true, onClick }: DealCardProps) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';
  const [showCode, setShowCode] = useState(false);

  const discountText = formatDiscount(deal.discountType, deal.discountValue, t);
  const daysRemaining = getDaysRemaining(deal.validUntil);
  const isEndingSoon = daysRemaining <= 3 && daysRemaining > 0;
  const isExpired = daysRemaining <= 0;

  const content = (
    <article
      className={`deal-card bg-white dark:bg-slate-800 rounded-lg shadow-card hover:shadow-card-hover transition-shadow ${
        compact ? 'flex gap-4' : ''
      }`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Deal Image */}
      <div
        className={`deal-card__image relative overflow-hidden ${
          compact ? 'w-24 h-24 shrink-0 rounded-s-lg' : 'w-full h-40 rounded-t-lg'
        }`}
      >
        {deal.image ? (
          <ResponsiveImage
            src={deal.image}
            alt=""
            decorative
            aspectRatio={compact ? '1:1' : '16:9'}
            objectFit="cover"
            className="w-full h-full"
            sizes={compact ? '96px' : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
            <span className="text-4xl" role="img" aria-hidden="true">
              🏷️
            </span>
          </div>
        )}

        {/* Discount badge overlay */}
        {discountText && !compact && (
          <div className={`absolute top-3 ${isRtl ? 'left-3' : 'right-3'}`}>
            <Badge variant={getDiscountBadgeVariant(deal.discountType)} size="md">
              {discountText}
            </Badge>
          </div>
        )}

        {/* Status overlays */}
        {isExpired && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge variant="error" size="lg">
              {t('deal.expired')}
            </Badge>
          </div>
        )}
      </div>

      {/* Deal Info */}
      <div className={`deal-card__content p-4 ${compact ? 'flex-1 min-w-0' : ''}`}>
        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {compact && discountText && (
            <Badge variant={getDiscountBadgeVariant(deal.discountType)} size="sm">
              {discountText}
            </Badge>
          )}
          {deal.featured && (
            <Badge variant="warning" size="sm">
              {t('deal.featured')}
            </Badge>
          )}
          {isEndingSoon && !isExpired && (
            <Badge variant="error" size="sm">
              {t('deal.endingSoon', { days: daysRemaining })}
            </Badge>
          )}
        </div>

        {/* Title */}
        <h3 className="deal-card__title text-lg font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2">
          {deal.title}
        </h3>

        {/* Business name */}
        {deal.business && (
          <div className="deal-card__business text-sm text-gray-600 dark:text-gray-400 mb-2">
            {deal.business.name}
          </div>
        )}

        {/* Pricing */}
        {(deal.price !== null || deal.originalPrice !== null) && (
          <div className="deal-card__pricing flex items-center gap-2 mb-2">
            {deal.price !== null && (
              <span className="text-lg font-bold text-primary dark:text-primary-light">
                {formatPrice(deal.price)}
              </span>
            )}
            {deal.originalPrice !== null && (
              <span className="text-sm text-gray-500 line-through">
                {formatPrice(deal.originalPrice)}
              </span>
            )}
          </div>
        )}

        {/* Duration (for services) */}
        {deal.duration && !compact && (
          <div className="deal-card__duration text-sm text-gray-600 dark:text-gray-400 mb-2">
            {deal.duration}
          </div>
        )}

        {/* Description preview (non-compact only) */}
        {!compact && deal.description && (
          <p className="deal-card__description text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
            {deal.description}
          </p>
        )}

        {/* Valid until */}
        <div className="deal-card__validity flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
          <svg
            className="w-4 h-4 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span>
            {t('deal.validUntil', {
              date: new Date(deal.validUntil).toLocaleDateString(i18n.language, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              }),
            })}
          </span>
        </div>

        {/* Voucher code section */}
        {showVoucherCode && deal.voucherCode && !isExpired && (
          <div className="deal-card__voucher mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            {showCode ? (
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-gray-100 dark:bg-slate-700 rounded font-mono text-sm text-center">
                  {deal.voucherCode}
                </code>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigator.clipboard.writeText(deal.voucherCode!);
                  }}
                  className="p-2 text-primary hover:bg-primary/10 rounded transition-colors"
                  aria-label={t('deal.copyCode')}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                    />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowCode(true);
                }}
                className="w-full py-2 px-4 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium text-sm"
              >
                {t('deal.revealCode')}
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="deal-card-button block w-full text-start focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg"
        type="button"
      >
        {content}
      </button>
    );
  }

  // Link to business profile with deals tab
  const linkPath = deal.business?.slug
    ? `/business/${deal.business.slug}?tab=deals`
    : `/business/${deal.businessId}?tab=deals`;

  return (
    <Link
      to={linkPath}
      className="deal-card-link block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg"
    >
      {content}
    </Link>
  );
}
