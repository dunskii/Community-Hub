/**
 * useBusinessDeals hook
 *
 * Manages deals state and CRUD operations for the promotions tab.
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { dealApi } from '../../../services/deal-api';
import type { Deal, DealCreateInput, DealUpdateInput } from '@community-hub/shared';
import type { TabId } from './types';

export function useBusinessDeals(businessId: string | undefined, activeTab: TabId) {
  const { t } = useTranslation();

  const [deals, setDeals] = useState<Deal[]>([]);
  const [dealsLoading, setDealsLoading] = useState(false);
  const [activeDealsCount, setActiveDealsCount] = useState(0);
  const [maxDeals, setMaxDeals] = useState(5);
  const [showDealForm, setShowDealForm] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [dealFormLoading, setDealFormLoading] = useState(false);

  // Fetch deals when promotions tab is active
  useEffect(() => {
    async function fetchDeals() {
      if (!businessId || activeTab !== 'promotions') return;

      try {
        setDealsLoading(true);
        const response = await dealApi.getBusinessDeals(businessId, { includeExpired: true });
        setDeals(response.deals);
        setActiveDealsCount(response.activeCount);
        setMaxDeals(response.maxDeals);
      } catch (err) {
        console.error('Failed to load deals:', err);
      } finally {
        setDealsLoading(false);
      }
    }

    fetchDeals();
  }, [businessId, activeTab]);

  const handleCreateDeal = async (data: DealCreateInput | DealUpdateInput) => {
    if (!businessId) return;

    setDealFormLoading(true);
    try {
      const newDeal = await dealApi.createDeal(businessId, data as DealCreateInput);
      setDeals(prev => [newDeal, ...prev]);
      setActiveDealsCount(prev => prev + 1);
      setShowDealForm(false);
    } finally {
      setDealFormLoading(false);
    }
  };

  const handleUpdateDeal = async (data: DealCreateInput | DealUpdateInput) => {
    if (!businessId || !editingDeal) return;

    setDealFormLoading(true);
    try {
      const updatedDeal = await dealApi.updateDeal(businessId, editingDeal.id, data as DealUpdateInput);
      setDeals(prev => prev.map(d => d.id === updatedDeal.id ? updatedDeal : d));
      setEditingDeal(null);
    } finally {
      setDealFormLoading(false);
    }
  };

  const handleDeleteDeal = async (dealId: string) => {
    if (!businessId) return;
    if (!window.confirm(t('deal.confirmDelete', 'Are you sure you want to delete this promotion?'))) return;

    try {
      await dealApi.deleteDeal(businessId, dealId);
      const deletedDeal = deals.find(d => d.id === dealId);
      setDeals(prev => prev.filter(d => d.id !== dealId));
      if (deletedDeal?.status === 'ACTIVE') {
        setActiveDealsCount(prev => prev - 1);
      }
    } catch (err) {
      console.error('Failed to delete deal:', err);
    }
  };

  return {
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
  };
}
