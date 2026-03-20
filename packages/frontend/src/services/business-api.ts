/**
 * Business API Client
 * Handles all HTTP requests to business endpoints
 */

import type {
  Business,
  BusinessCreateInput,
  BusinessUpdateInput,
} from '@community-hub/shared';
import { get, post, put, del } from './api-client';

export interface BusinessListParams {
  category?: string;
  status?: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'DELETED';
  openNow?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface BusinessListResponse {
  businesses: Business[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CategoryListParams {
  type?: string;
  parent?: string | 'null';
  active?: boolean;
  withBusinesses?: boolean;
}

export interface Category {
  id: string;
  name: Record<string, string>;
  slug: string;
  type: string;
  icon: string | null;
  displayOrder: number;
  active: boolean;
  parentId: string | null;
  businessCount?: number;
  parent?: {
    id: string;
    name: Record<string, string>;
    slug: string;
  };
  children?: Array<{
    id: string;
    name: Record<string, string>;
    slug: string;
    icon: string | null;
  }>;
}

export interface CategoryBusinessesParams {
  page?: number;
  limit?: number;
  sort?: string;
}

export interface CategoryBusinessesResponse {
  category: {
    id: string;
    name: Record<string, string>;
    slug: string;
  };
  businesses: Business[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

class BusinessApiClient {
  /**
   * List businesses with filtering and pagination
   */
  async listBusinesses(params: BusinessListParams = {}): Promise<BusinessListResponse> {
    const queryParams = new URLSearchParams();

    if (params.category) queryParams.set('category', params.category);
    if (params.status) queryParams.set('status', params.status);
    if (params.openNow !== undefined) queryParams.set('open_now', String(params.openNow));
    if (params.search) queryParams.set('search', params.search);
    if (params.page) queryParams.set('page', String(params.page));
    if (params.limit) queryParams.set('limit', String(params.limit));
    if (params.sort) queryParams.set('sort', params.sort);

    const endpoint = `/businesses${queryParams.toString() ? `?${queryParams}` : ''}`;
    const response = await get<ApiResponse<BusinessListResponse>>(endpoint);
    return response.data;
  }

  /**
   * Get business by ID
   */
  async getBusinessById(id: string): Promise<Business> {
    const response = await get<ApiResponse<Business>>(`/businesses/${id}`);
    return response.data;
  }

  /**
   * Get business by slug (for SEO URLs)
   */
  async getBusinessBySlug(slug: string): Promise<Business> {
    const response = await get<ApiResponse<Business>>(`/businesses/slug/${slug}`);
    return response.data;
  }

  /**
   * Create new business (admin only)
   */
  async createBusiness(input: BusinessCreateInput): Promise<Business> {
    const response = await post<ApiResponse<Business>>('/businesses', input);
    return response.data;
  }

  /**
   * Update business (owner or admin)
   */
  async updateBusiness(id: string, input: BusinessUpdateInput): Promise<Business> {
    const response = await put<ApiResponse<Business>>(`/businesses/${id}`, input);
    return response.data;
  }

  /**
   * Delete business (admin only)
   */
  async deleteBusiness(id: string): Promise<void> {
    await del<void>(`/businesses/${id}`);
  }

  /**
   * List all categories
   */
  async listCategories(params: CategoryListParams = {}): Promise<Category[]> {
    const queryParams = new URLSearchParams();

    if (params.type) queryParams.set('type', params.type);
    if (params.parent !== undefined) queryParams.set('parent', params.parent);
    if (params.active !== undefined) queryParams.set('active', String(params.active));
    if (params.withBusinesses !== undefined) queryParams.set('withBusinesses', String(params.withBusinesses));

    const endpoint = `/categories${queryParams.toString() ? `?${queryParams}` : ''}`;
    const response = await get<ApiResponse<Category[]>>(endpoint);
    return response.data;
  }

  /**
   * Get category by ID
   */
  async getCategoryById(id: string): Promise<Category> {
    const response = await get<ApiResponse<Category>>(`/categories/${id}`);
    return response.data;
  }

  /**
   * Get businesses for a category
   */
  async getCategoryBusinesses(
    id: string,
    params: CategoryBusinessesParams = {}
  ): Promise<CategoryBusinessesResponse> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.set('page', String(params.page));
    if (params.limit) queryParams.set('limit', String(params.limit));
    if (params.sort) queryParams.set('sort', params.sort);

    const endpoint = `/categories/${id}/businesses${queryParams.toString() ? `?${queryParams}` : ''}`;
    const response = await get<ApiResponse<CategoryBusinessesResponse>>(endpoint);
    return response.data;
  }
}

export const businessApi = new BusinessApiClient();
