/**
 * DealDetailModal Component
 * Displays full deal details in a modal overlay
 * WCAG 2.1 AA compliant
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge } from '../display/Badge';
import { dealApi } from '../../services/deal-api';
import type { Deal, DiscountType } from '@community-hub/shared';
import { TagIcon, XMarkIcon, CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';

function formatDiscountText(
  discountType: DiscountType | null,
  discountValue: number | null,
): string | null {
  if (!discountType || discountValue === null) return null;
  switch (discountType) {
    case 'PERCENTAGE': return `${discountValue}% off`;
    case 'FIXED': return `$${discountValue} off`;
    case 'BOGO': return 'Buy One Get One';
    case 'FREE_ITEM': return 'Free Item';
    default: return null;
  }
}

interface DealDetailModalProps {
  deal: Deal;
  onClose: () => void;
  /** Show link to business profile */
  showBusinessLink?: boolean;
}

export function DealDetailModal({ deal, onClose, showBusinessLink = false }: DealDetailModalProps) {
  const { t, i18n } = useTranslation('business');
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const daysRemaining = Math.ceil(
    (new Date(deal.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const isExpired = daysRemaining <= 0;
  const discountText = formatDiscountText(deal.discountType, deal.discountValue);

  // Track deal click on mount
  useEffect(() => {
    dealApi.trackClick(deal.id);
  }, [deal.id]);

  const handleRevealCode = () => {
    setShowCode(true);
    dealApi.trackVoucherReveal(deal.id);
  };

  const handleCopy = () => {
    if (deal.voucherCode) {
      navigator.clipboard.writeText(deal.voucherCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div
          className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="deal-modal-title"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 p-2 bg-white/80 dark:bg-slate-800/80 rounded-full hover:bg-white dark:hover:bg-slate-700 transition-colors"
            aria-label={t('common.close', 'Close')}
          >
            <XMarkIcon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>

          {/* Image */}
          {deal.image ? (
            <div className="w-full h-48 md:h-56 relative">
              <img
                src={deal.image}
                alt=""
                className="w-full h-full object-cover"
              />
              {discountText && (
                <div className="absolute top-3 left-3">
                  <Badge variant="error" size="lg">{discountText}</Badge>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-32 bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center relative">
              <TagIcon className="w-12 h-12 text-primary/50" />
              {discountText && (
                <div className="absolute top-3 left-3">
                  <Badge variant="error" size="lg">{discountText}</Badge>
                </div>
              )}
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            {/* Status badges */}
            <div className="flex flex-wrap gap-2 mb-3">
              {deal.featured && (
                <Badge variant="warning" size="sm">
                  {t('deals.featured', 'Featured')}
                </Badge>
              )}
              {isExpired ? (
                <Badge variant="error" size="sm">
                  {t('deals.expired', 'Expired')}
                </Badge>
              ) : daysRemaining <= 3 ? (
                <Badge variant="error" size="sm">
                  {t('deals.endingSoon', 'Ends in {{days}} days', { days: daysRemaining })}
                </Badge>
              ) : null}
            </div>

            {/* Title */}
            <h2
              id="deal-modal-title"
              className="text-xl font-bold text-slate-900 dark:text-white mb-3"
            >
              {deal.title}
            </h2>

            {/* Business Name */}
            {showBusinessLink && deal.business && (
              <Link
                to={`/businesses/${deal.business.slug}`}
                className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 mb-3 font-medium"
                onClick={onClose}
              >
                {deal.business.name} &rarr;
              </Link>
            )}

            {/* Description */}
            <p className="text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              {deal.description}
            </p>

            {/* Pricing */}
            {(deal.price !== null || deal.originalPrice !== null) && (
              <div className="flex items-baseline gap-3 mb-4">
                {deal.price !== null && (
                  <span className="text-2xl font-bold text-primary">
                    ${deal.price.toFixed(2)}
                  </span>
                )}
                {deal.originalPrice !== null && (
                  <span className="text-lg text-slate-400 line-through">
                    ${deal.originalPrice.toFixed(2)}
                  </span>
                )}
              </div>
            )}

            {/* Details */}
            <div className="space-y-2 mb-4">
              {deal.duration && (
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <ClockIcon className="w-4 h-4 flex-shrink-0" />
                  <span>{deal.duration}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <CalendarIcon className="w-4 h-4 flex-shrink-0" />
                <span>
                  {t('deals.validPeriod', 'Valid {{from}} – {{until}}', {
                    from: new Date(deal.validFrom).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' }),
                    until: new Date(deal.validUntil).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric', year: 'numeric' }),
                  })}
                </span>
              </div>
            </div>

            {/* Terms */}
            {deal.terms && (
              <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  {t('deals.termsAndConditions', 'Terms & Conditions')}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {deal.terms}
                </p>
              </div>
            )}

            {/* Voucher Code */}
            {deal.voucherCode && !isExpired && (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                {showCode ? (
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 rounded-lg font-mono text-center text-lg tracking-wider">
                      {deal.voucherCode}
                    </code>
                    <button
                      onClick={handleCopy}
                      className="px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                    >
                      {copied
                        ? t('deals.copied', 'Copied!')
                        : t('deals.copyCode', 'Copy')}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleRevealCode}
                    className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
                  >
                    {t('deals.revealVoucherCode', 'Reveal Voucher Code')}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
