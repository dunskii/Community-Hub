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

/**
 * Normalize business data from API (snake_case) to frontend (camelCase)
 * The backend returns raw Prisma records with snake_case fields
 */
export function normalizeBusiness(data: Record<string, unknown>): Business {
  const biz = data as Record<string, unknown>;
  // Map gallery (Json field) to photos array
  let photos: string[] = [];
  if (biz.gallery && Array.isArray(biz.gallery)) {
    photos = (biz.gallery as Array<string | Record<string, unknown>>).map(item =>
      typeof item === 'string' ? item : (item as Record<string, string>).url
    ).filter((url): url is string => Boolean(url));
  } else if (biz.photos && Array.isArray(biz.photos)) {
    photos = biz.photos as string[];
  }

  const accessibilityFeatures = (biz.accessibility_features || biz.accessibilityFeatures || []) as string[];

  return {
    ...data,
    coverPhoto: (biz.cover_photo || biz.coverPhoto) as string | undefined,
    photos,
    claimedBy: (biz.claimed_by || biz.claimedBy) as string | undefined,
    operatingHours: biz.operating_hours || biz.operatingHours,
    socialLinks: biz.social_links || biz.socialLinks,
    languagesSpoken: biz.languages_spoken || biz.languagesSpoken || [],
    accessibilityFeatures,
    accessibility: accessibilityFeatures.length > 0
      ? { wheelchairAccessible: accessibilityFeatures.some((f: string) => f.includes('WHEELCHAIR')), features: accessibilityFeatures }
      : undefined,
    paymentMethods: biz.payment_methods || biz.paymentMethods || [],
    certifications: biz.certifications || [],
    parkingInformation: (biz.parking_information || biz.parkingInformation) as string | undefined,
    yearEstablished: (biz.year_established || biz.yearEstablished) as number | undefined,
    priceRange: (biz.price_range || biz.priceRange) as string | undefined,
    categoryPrimaryId: (biz.category_primary_id || biz.categoryPrimaryId) as string,
    categoriesSecondary: (biz.categories_secondary || biz.categoriesSecondary || []) as string[],
    secondaryPhone: (biz.secondary_phone || biz.secondaryPhone) as string | undefined,
    verifiedAt: (biz.verified_at || biz.verifiedAt) as Date | undefined,
  } as unknown as Business;
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
    if (response.data.businesses) {
      response.data.businesses = response.data.businesses.map(b => normalizeBusiness(b as unknown as Record<string, unknown>));
    }
    return response.data;
  }

  /**
   * Get business by ID
   */
  async getBusinessById(id: string): Promise<Business> {
    const response = await get<ApiResponse<Business>>(`/businesses/${id}`);
    return normalizeBusiness(response.data as unknown as Record<string, unknown>);
  }

  /**
   * Get business by slug (for SEO URLs)
   */
  async getBusinessBySlug(slug: string): Promise<Business> {
    const response = await get<ApiResponse<Business>>(`/businesses/slug/${slug}`);
    return normalizeBusiness(response.data as unknown as Record<string, unknown>);
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
