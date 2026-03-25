/**
 * DealsSection Component
 * Phase 10: Promotions & Deals MVP
 * Displays active deals for a business profile page
 * WCAG 2.1 AA compliant, mobile-first
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DealCard } from '../deals/DealCard';
import { DealDetailModal } from '../deals/DealDetailModal';
import { Skeleton } from '../display/Skeleton';
import { EmptyState } from '../display/EmptyState';
import { dealApi } from '../../services/deal-api';
import type { Deal } from '@community-hub/shared';
import { TagIcon } from '@heroicons/react/24/outline';

interface DealsSectionProps {
  /** Business ID to fetch deals for */
  businessId: string;
  /** Business name for display */
  businessName?: string;
  /** Maximum number of deals to show (0 = all) */
  maxDeals?: number;
}

export function DealsSection({ businessId, businessName: _businessName, maxDeals = 0 }: DealsSectionProps) {
  const { t, i18n } = useTranslation('business');
  const isRtl = i18n.dir() === 'rtl';

  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  useEffect(() => {
    async function fetchDeals() {
      try {
        setLoading(true);
        setError(null);
        const response = await dealApi.getBusinessDeals(businessId);
        // Filter only active deals
        const activeDeals = response.deals.filter(d => d.status === 'ACTIVE');
        setDeals(maxDeals > 0 ? activeDeals.slice(0, maxDeals) : activeDeals);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load deals');
      } finally {
        setLoading(false);
      }
    }

    if (businessId) {
      fetchDeals();
    }
  }, [businessId, maxDeals]);

  if (loading) {
    return (
      <div className="space-y-4" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse"
            >
              <Skeleton variant="rectangular" height="180px" className="rounded-t-lg" />
              <div className="p-4 space-y-2">
                <Skeleton variant="text" width="70%" height="20px" />
                <Skeleton variant="text" width="100%" height="16px" />
                <Skeleton variant="text" width="40%" height="16px" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-error" dir={isRtl ? 'rtl' : 'ltr'}>
        {error}
      </div>
    );
  }

  if (deals.length === 0) {
    return (
      <EmptyState
        title={t('deals.noDeals', 'No Deals Available')}
        description={t('deals.noDealsDescription', 'This business has no active promotions at the moment.')}
        icon={<TagIcon className="w-16 h-16 text-slate-400" />}
      />
    );
  }

  return (
    <div className="space-y-4" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Deals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {deals.map((deal) => (
          <DealCard
            key={deal.id}
            deal={deal}
            showVoucherCode={true}
            onClick={() => setSelectedDeal(deal)}
          />
        ))}
      </div>

      {/* Show "more" indicator if truncated */}
      {maxDeals > 0 && deals.length === maxDeals && (
        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          {t('deals.viewAllDeals', 'View the Deals tab for all promotions')}
        </p>
      )}

      {/* Deal Detail Modal */}
      {selectedDeal && (
        <DealDetailModal
          deal={selectedDeal}
          onClose={() => setSelectedDeal(null)}
        />
      )}
    </div>
  );
}
