/**
 * Saved Business Service
 * API client for saved business operations
 */

import { apiClient } from './api-client';

export interface SavedBusiness {
  id: string;
  userId: string;
  businessId: string;
  listId: string | null;
  notes: string | null;
  savedAt: string;
  business: {
    id: string;
    name: string;
    slug: string;
    categoryPrimary: string;
    rating: number | null;
    photos: string[];
  };
}

export interface SavedList {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  businessCount: number;
}

export interface SavedBusinessesResponse {
  success: boolean;
  data: {
    saved: SavedBusiness[];
    lists: SavedList[];
    total: number;
    page: number;
    limit: number;
  };
}

export const savedService = {
  /**
   * Save a business
   */
  async saveBusiness(
    businessId: string,
    options?: {
      listId?: string;
      notes?: string;
    }
  ): Promise<{ success: boolean; data: SavedBusiness }> {
    const response = await apiClient.post<{ success: boolean; data: SavedBusiness }>(`/users/me/saved`, {
      businessId,
      listId: options?.listId,
      notes: options?.notes,
    });
    return response;
  },

  /**
   * Unsave a business
   */
  async unsaveBusiness(businessId: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete<{ success: boolean }>(`/users/me/saved/${businessId}`);
    return response;
  },

  /**
   * Get saved businesses
   */
  async getSavedBusinesses(options?: {
    listId?: string;
    page?: number;
    limit?: number;
  }): Promise<SavedBusinessesResponse> {
    const params = new URLSearchParams();
    if (options?.listId) params.append('listId', options.listId);
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());

    const response = await apiClient.get<SavedBusinessesResponse>(
      `/users/me/saved?${params.toString()}`
    );
    return response;
  },

  /**
   * Check if a business is saved
   */
  async isSaved(businessId: string): Promise<boolean> {
    try {
      const response = await savedService.getSavedBusinesses({ limit: 1000 });
      return response.data.saved.some((s) => s.businessId === businessId);
    } catch {
      return false;
    }
  },

  /**
   * Create a custom list
   */
  async createList(name: string): Promise<{ success: boolean; data: SavedList }> {
    const response = await apiClient.post<{ success: boolean; data: SavedList }>('/users/me/lists', { name });
    return response;
  },

  /**
   * Update a custom list
   */
  async updateList(listId: string, name: string): Promise<{ success: boolean; data: SavedList }> {
    const response = await apiClient.put<{ success: boolean; data: SavedList }>(`/users/me/lists/${listId}`, { name });
    return response;
  },

  /**
   * Delete a custom list
   */
  async deleteList(listId: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete<{ success: boolean }>(`/users/me/lists/${listId}`);
    return response;
  },
};
