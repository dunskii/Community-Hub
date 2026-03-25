/**
 * Follow Service
 * API client for business following operations
 */

import { apiClient } from './api-client';

export interface FollowResponse {
  success: boolean;
  data: {
    id: string;
    userId: string;
    businessId: string;
    followedAt: string;
  };
}

export interface FollowerCountResponse {
  success: boolean;
  data: {
    count: number;
  };
}

export interface FollowStatusResponse {
  success: boolean;
  data: {
    isFollowing: boolean;
  };
}

export const followService = {
  /**
   * Follow a business
   */
  async followBusiness(businessId: string): Promise<FollowResponse> {
    const response = await apiClient.post<FollowResponse>(`/businesses/${businessId}/follow`);
    return response;
  },

  /**
   * Unfollow a business
   */
  async unfollowBusiness(businessId: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete<{ success: boolean }>(
      `/businesses/${businessId}/follow`
    );
    return response;
  },

  /**
   * Get follower count for a business
   */
  async getFollowerCount(businessId: string): Promise<number> {
    const response = await apiClient.get<FollowerCountResponse>(
      `/businesses/${businessId}/followers/count`
    );
    return response.data.count;
  },

  /**
   * Check if current user is following a business
   */
  async getFollowStatus(businessId: string): Promise<boolean> {
    const response = await apiClient.get<FollowStatusResponse>(
      `/businesses/${businessId}/follow/status`
    );
    return response.data.isFollowing;
  },

  /**
   * Get businesses user is following
   */
  async getFollowedBusinesses(options?: {
    page?: number;
    limit?: number;
  }): Promise<{
    success: boolean;
    data: {
      businesses: any[];
      total: number;
      page: number;
      limit: number;
    };
  }> {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());

    const response = await apiClient.get<{
      success: boolean;
      data: {
        businesses: any[];
        total: number;
        page: number;
        limit: number;
      };
    }>(`/users/me/following?${params.toString()}`);
    return response;
  },
};
