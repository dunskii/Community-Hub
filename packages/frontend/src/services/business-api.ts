/**
 * Business API Client
 * Handles all HTTP requests to business endpoints
 */

import type {
  Business,
  BusinessCreateInput,
  BusinessUpdateInput,
} from '@community-hub/shared';

const API_BASE = '/api/v1';

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

    const url = `${API_BASE}/businesses${queryParams.toString() ? `?${queryParams}` : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch businesses: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Get business by ID
   */
  async getBusinessById(id: string): Promise<Business> {
    const response = await fetch(`${API_BASE}/businesses/${id}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Business not found');
      }
      throw new Error(`Failed to fetch business: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Get business by slug (for SEO URLs)
   */
  async getBusinessBySlug(slug: string): Promise<Business> {
    const response = await fetch(`${API_BASE}/businesses/slug/${slug}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Business not found');
      }
      throw new Error(`Failed to fetch business: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Create new business (admin only)
   */
  async createBusiness(input: BusinessCreateInput): Promise<Business> {
    const response = await fetch(`${API_BASE}/businesses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for auth
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to create business');
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Update business (owner or admin)
   */
  async updateBusiness(id: string, input: BusinessUpdateInput): Promise<Business> {
    const response = await fetch(`${API_BASE}/businesses/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to update business');
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Delete business (admin only)
   */
  async deleteBusiness(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/businesses/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to delete business');
    }
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

    const url = `${API_BASE}/categories${queryParams.toString() ? `?${queryParams}` : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Get category by ID
   */
  async getCategoryById(id: string): Promise<Category> {
    const response = await fetch(`${API_BASE}/categories/${id}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Category not found');
      }
      throw new Error(`Failed to fetch category: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
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

    const url = `${API_BASE}/categories/${id}/businesses${queryParams.toString() ? `?${queryParams}` : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Category not found');
      }
      throw new Error(`Failed to fetch category businesses: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  }
}

export const businessApi = new BusinessApiClient();
