/**
 * Deal API Client
 * Phase 10: Promotions & Deals MVP
 * API endpoints for deal operations
 */

import { get, post, put, del } from './api-client';
import type { Deal, DealCreateInput, DealUpdateInput, DealFilterInput } from '@community-hub/shared';

// Response types
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface DealsListResponse {
  deals: Deal[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

interface BusinessDealsResponse {
  deals: Deal[];
  activeCount: number;
  maxDeals: number;
}

interface FeaturedDealsResponse {
  deals: Deal[];
}

interface SingleDealResponse {
  deal: Deal;
}

interface DealsCountResponse {
  active: number;
  max: number;
}

/**
 * Deal API methods
 */
export const dealApi = {
  /**
   * Get active deals with filtering and pagination
   */
  async getActiveDeals(filters?: Partial<DealFilterInput>): Promise<DealsListResponse> {
    const params = new URLSearchParams();

    if (filters?.status) params.append('status', filters.status);
    if (filters?.featured !== undefined) params.append('featured', String(filters.featured));
    if (filters?.businessId) params.append('businessId', filters.businessId);
    if (filters?.validNow !== undefined) params.append('validNow', String(filters.validNow));
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));
    if (filters?.sort) params.append('sort', filters.sort);

    const queryString = params.toString();
    const endpoint = queryString ? `/deals?${queryString}` : '/deals';

    const response = await get<ApiResponse<DealsListResponse>>(endpoint);
    return response.data;
  },

  /**
   * Get featured deals (for homepage)
   */
  async getFeaturedDeals(limit: number = 6): Promise<Deal[]> {
    const response = await get<ApiResponse<FeaturedDealsResponse>>(
      `/deals/featured?limit=${limit}`
    );
    return response.data.deals;
  },

  /**
   * Get a single deal by ID
   */
  async getDealById(dealId: string): Promise<Deal> {
    const response = await get<ApiResponse<SingleDealResponse>>(`/deals/${dealId}`);
    return response.data.deal;
  },

  /**
   * Get all deals for a specific business
   */
  async getBusinessDeals(
    businessId: string,
    options?: { includeExpired?: boolean }
  ): Promise<BusinessDealsResponse> {
    const params = new URLSearchParams();
    if (options?.includeExpired) params.append('includeExpired', 'true');

    const queryString = params.toString();
    const endpoint = queryString
      ? `/businesses/${businessId}/deals?${queryString}`
      : `/businesses/${businessId}/deals`;

    const response = await get<ApiResponse<BusinessDealsResponse>>(endpoint);
    return response.data;
  },

  /**
   * Get active deal count for a business
   */
  async getDealsCount(businessId: string): Promise<DealsCountResponse> {
    const response = await get<ApiResponse<DealsCountResponse>>(
      `/businesses/${businessId}/deals/count`
    );
    return response.data;
  },

  /**
   * Create a new deal for a business
   */
  async createDeal(businessId: string, data: DealCreateInput): Promise<Deal> {
    const response = await post<ApiResponse<SingleDealResponse>>(
      `/businesses/${businessId}/deals`,
      data
    );
    return response.data.deal;
  },

  /**
   * Update a deal
   */
  async updateDeal(
    businessId: string,
    dealId: string,
    data: DealUpdateInput
  ): Promise<Deal> {
    const response = await put<ApiResponse<SingleDealResponse>>(
      `/businesses/${businessId}/deals/${dealId}`,
      data
    );
    return response.data.deal;
  },

  /**
   * Delete a deal
   */
  async deleteDeal(businessId: string, dealId: string): Promise<void> {
    await del(`/businesses/${businessId}/deals/${dealId}`);
  },

  /**
   * Track deal click (modal opened)
   */
  async trackClick(dealId: string): Promise<void> {
    try {
      await post(`/deals/${dealId}/click`, {});
    } catch { /* non-critical */ }
  },

  /**
   * Track voucher code reveal
   */
  async trackVoucherReveal(dealId: string): Promise<void> {
    try {
      await post(`/deals/${dealId}/voucher-reveal`, {});
    } catch { /* non-critical */ }
  },

  /**
   * Get promotion stats for a business
   */
  async getPromotionStats(businessId: string): Promise<{
    totalViews: number;
    totalClicks: number;
    totalVoucherReveals: number;
    activeDeals: number;
  }> {
    const response = await get<ApiResponse<{
      totalViews: number;
      totalClicks: number;
      totalVoucherReveals: number;
      activeDeals: number;
    }>>(`/businesses/${businessId}/deals/stats`);
    return response.data;
  },
};
