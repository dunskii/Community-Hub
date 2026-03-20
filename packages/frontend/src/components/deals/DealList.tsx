/**
 * DealList Component
 * Phase 10: Promotions & Deals MVP
 * Displays a list of deals with edit/delete actions for business owners
 * WCAG 2.1 AA compliant with keyboard navigation
 */

import { useTranslation } from 'react-i18next';
import { DealCard } from './DealCard';
import { Badge } from '../display/Badge';
import { EmptyState } from '../display/EmptyState';
import type { Deal } from '@community-hub/shared';

interface DealListProps {
  /** List of deals to display */
  deals: Deal[];
  /** Active deal count */
  activeCount: number;
  /** Maximum deals allowed */
  maxDeals: number;
  /** Callback when edit is clicked */
  onEdit?: (deal: Deal) => void;
  /** Callback when delete is clicked */
  onDelete?: (dealId: string) => void;
  /** Loading state */
  loading?: boolean;
  /** Show owner actions (edit/delete) */
  showActions?: boolean;
  /** Custom class name */
  className?: string;
}

export function DealList({
  deals,
  activeCount,
  maxDeals,
  onEdit,
  onDelete,
  loading = false,
  showActions = true,
  className = '',
}: DealListProps) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';

  if (loading) {
    return (
      <div className={`deal-list ${className}`}>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-200 dark:bg-slate-700 rounded-lg h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (deals.length === 0) {
    return (
      <div className={`deal-list ${className}`}>
        <EmptyState
          icon={
            <svg
              className="w-16 h-16 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
          }
          title={t('deal.empty.title')}
          description={t('deal.empty.description')}
        />
      </div>
    );
  }

  const isAtLimit = activeCount >= maxDeals;

  return (
    <div className={`deal-list ${className}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Deal count indicator */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Badge variant={isAtLimit ? 'warning' : 'default'} size="md">
            {activeCount}/{maxDeals} {t('deal.activeDeals')}
          </Badge>
          {isAtLimit && (
            <span className="text-sm text-warning">{t('deal.limitReached')}</span>
          )}
        </div>
      </div>

      {/* Deals list */}
      <ul className="space-y-4" role="list">
        {deals.map((deal) => (
          <li key={deal.id} className="relative">
            {showActions && (onEdit || onDelete) ? (
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-card">
                {/* Deal card content */}
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Deal image */}
                    <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-700">
                      {deal.image ? (
                        <img
                          src={deal.image}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">
                          🏷️
                        </div>
                      )}
                    </div>

                    {/* Deal info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                            {deal.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1 mt-1">
                            {deal.description}
                          </p>
                        </div>

                        {/* Status badge */}
                        <Badge
                          variant={
                            deal.status === 'ACTIVE'
                              ? 'success'
                              : deal.status === 'EXPIRED'
                              ? 'error'
                              : 'default'
                          }
                          size="sm"
                        >
                          {t(`deal.status.${deal.status.toLowerCase()}`)}
                        </Badge>
                      </div>

                      {/* Pricing and dates */}
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {(deal.price !== null || deal.discountValue !== null) && (
                          <span>
                            {deal.price !== null && `$${deal.price.toFixed(2)}`}
                            {deal.discountType === 'PERCENTAGE' &&
                              deal.discountValue !== null &&
                              ` (${deal.discountValue}% off)`}
                          </span>
                        )}
                        <span>
                          {t('deal.validUntil', {
                            date: new Date(deal.validUntil).toLocaleDateString(i18n.language, {
                              month: 'short',
                              day: 'numeric',
                            }),
                          })}
                        </span>
                        {deal.views > 0 && (
                          <span className="flex items-center gap-1">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                            {deal.views}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(deal)}
                        className="px-4 py-2 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors flex items-center gap-1"
                        aria-label={t('deal.editDeal', { title: deal.title })}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        {t('common.edit')}
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(deal.id)}
                        className="px-4 py-2 text-sm text-error hover:bg-error/10 rounded-lg transition-colors flex items-center gap-1"
                        aria-label={t('deal.deleteDeal', { title: deal.title })}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        {t('common.delete')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <DealCard deal={deal} compact showVoucherCode={false} />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
