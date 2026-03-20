/**
 * TodayDealsSection Component
 * Phase 10: Promotions & Deals MVP - Homepage Integration
 *
 * Displays featured/active deals on the homepage
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { dealApi } from '../../services/deal-api';
import { Badge } from '../display/Badge';
import type { Deal, DiscountType } from '@community-hub/shared';
import { TagIcon } from '@heroicons/react/24/outline';

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
 * Calculate days remaining until deal expires
 */
function getDaysRemaining(validUntil: string): number {
  const now = new Date();
  const end = new Date(validUntil);
  const diffTime = end.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function TodayDealsSection() {
  const { t, i18n } = useTranslation();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const locale = i18n.language === 'en' ? 'en-AU' : i18n.language;

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        // First try featured deals, fallback to active deals
        const featuredDeals = await dealApi.getFeaturedDeals(6);
        if (featuredDeals.length > 0) {
          setDeals(featuredDeals);
        } else {
          // Get active deals if no featured ones
          const response = await dealApi.getActiveDeals({
            validNow: true,
            limit: 6,
            sort: 'newest',
          });
          setDeals(response.deals);
        }
      } catch (error) {
        console.error('Failed to fetch deals:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDeals();
  }, []);

  if (isLoading) {
    return (
      <section aria-labelledby="today-deals-heading">
        <h2 id="today-deals-heading" className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          {t('home.todaysDeals.title', "Today's Deals")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-t-lg" />
              <div className="p-4 bg-white dark:bg-gray-800 rounded-b-lg border border-gray-200 dark:border-gray-700">
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (deals.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="today-deals-heading">
      <div className="flex items-center justify-between mb-6">
        <h2 id="today-deals-heading" className="text-3xl font-bold text-gray-900 dark:text-white">
          {t('home.todaysDeals.title', "Today's Deals")}
        </h2>
        <Link
          to="/businesses?hasDeals=true"
          className="text-primary hover:text-primary/80 font-medium text-sm transition-colors"
        >
          {t('home.todaysDeals.viewAll', 'View All')} &rarr;
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {deals.map((deal) => {
          const discountText = formatDiscount(deal.discountType, deal.discountValue, t);
          const daysRemaining = getDaysRemaining(deal.validUntil);
          const isEndingSoon = daysRemaining <= 3 && daysRemaining > 0;

          return (
            <Link
              key={deal.id}
              to={deal.business?.slug ? `/business/${deal.business.slug}?tab=deals` : `/business/${deal.businessId}?tab=deals`}
              className="group block bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 border border-gray-100 dark:border-gray-700"
            >
              {/* Deal Image */}
              <div className="h-40 bg-gray-100 relative overflow-hidden">
                {deal.image ? (
                  <img
                    src={deal.image}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                    <TagIcon className="w-12 h-12 text-primary" aria-hidden="true" />
                  </div>
                )}

                {/* Discount badge overlay */}
                {discountText && (
                  <div className="absolute top-3 left-3">
                    <Badge variant="error" size="md">
                      {discountText}
                    </Badge>
                  </div>
                )}

                {/* Ending soon badge */}
                {isEndingSoon && (
                  <div className="absolute top-3 right-3">
                    <Badge variant="warning" size="sm">
                      {t('deal.endingSoon', { days: daysRemaining })}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Deal Info */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                  {deal.title}
                </h3>

                {/* Business Name */}
                {deal.business && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {deal.business.name}
                  </p>
                )}

                {/* Description */}
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                  {deal.description}
                </p>

                {/* Price and validity */}
                <div className="flex items-center justify-between">
                  {/* Pricing */}
                  <div className="flex items-center gap-2">
                    {deal.price !== null && (
                      <span className="text-lg font-bold text-primary">
                        ${deal.price.toFixed(2)}
                      </span>
                    )}
                    {deal.originalPrice !== null && (
                      <span className="text-sm text-gray-500 line-through">
                        ${deal.originalPrice.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Valid until */}
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {t('deal.validUntil', {
                      date: new Date(deal.validUntil).toLocaleDateString(locale, {
                        month: 'short',
                        day: 'numeric',
                      }),
                    })}
                  </span>
                </div>

                {/* Voucher code indicator */}
                {deal.voucherCode && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                        />
                      </svg>
                      {t('deal.hasVoucherCode', 'Voucher code available')}
                    </div>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
