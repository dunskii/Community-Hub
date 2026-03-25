/**
 * PromotionsTab
 *
 * Deals list and deal form for creating/editing promotions.
 */

import type { TFunction } from 'i18next';
import { TagIcon } from '@heroicons/react/24/outline';
import { DealForm, DealList } from '../../../components/deals';
import type { Deal, DealCreateInput, DealUpdateInput } from '@community-hub/shared';

interface PromotionsTabProps {
  t: TFunction;
  deals: Deal[];
  dealsLoading: boolean;
  activeDealsCount: number;
  maxDeals: number;
  showDealForm: boolean;
  setShowDealForm: (show: boolean) => void;
  editingDeal: Deal | null;
  setEditingDeal: (deal: Deal | null) => void;
  dealFormLoading: boolean;
  handleCreateDeal: (data: DealCreateInput | DealUpdateInput) => Promise<void>;
  handleUpdateDeal: (data: DealCreateInput | DealUpdateInput) => Promise<void>;
  handleDeleteDeal: (dealId: string) => Promise<void>;
}

export function PromotionsTab({
  t,
  deals,
  dealsLoading,
  activeDealsCount,
  maxDeals,
  showDealForm,
  setShowDealForm,
  editingDeal,
  setEditingDeal,
  dealFormLoading,
  handleCreateDeal,
  handleUpdateDeal,
  handleDeleteDeal,
}: PromotionsTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {t('editBusiness.promotions.title', 'Promotions & Deals')}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {t('editBusiness.promotions.description', 'Create special offers to attract customers')}
            </p>
          </div>
          {!showDealForm && !editingDeal && activeDealsCount < maxDeals && (
            <button
              type="button"
              onClick={() => setShowDealForm(true)}
              className="inline-flex items-center px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              <TagIcon className="w-5 h-5 mr-2" />
              {t('editBusiness.promotions.addPromotion', 'Add Promotion')}
            </button>
          )}
        </div>

        {/* Deal Form (Create/Edit) */}
        {(showDealForm || editingDeal) && (
          <div className="mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-md font-semibold text-slate-900 dark:text-white mb-4">
              {editingDeal
                ? t('editBusiness.promotions.editPromotion', 'Edit Promotion')
                : t('editBusiness.promotions.newPromotion', 'New Promotion')}
            </h3>
            <DealForm
              deal={editingDeal || undefined}
              onSubmit={editingDeal ? handleUpdateDeal : handleCreateDeal}
              onCancel={() => {
                setShowDealForm(false);
                setEditingDeal(null);
              }}
              loading={dealFormLoading}
            />
          </div>
        )}

        {/* Deals List */}
        {!showDealForm && !editingDeal && (
          <DealList
            deals={deals}
            activeCount={activeDealsCount}
            maxDeals={maxDeals}
            onEdit={(deal) => setEditingDeal(deal)}
            onDelete={handleDeleteDeal}
            loading={dealsLoading}
            showActions={true}
          />
        )}
      </div>
    </div>
  );
}
