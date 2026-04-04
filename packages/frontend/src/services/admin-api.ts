/**
 * Admin API Service
 *
 * Frontend API client for admin dashboard endpoints.
 * Spec §23: Administration & Moderation
 */

import { get, put, post } from './api-client';

// ─── User Search Result Type ─────────────────────────────────

export interface UserSearchResult {
  id: string;
  email: string;
  displayName: string;
  role: string;
}

// ─── Types ──────────────────────────────────────────────────

export interface DashboardOverview {
  activeUsers: number;
  totalUsers: number;
  newRegistrations: number;
  pendingApprovals: {
    businesses: number;
    reviews: number;
    events: number;
    claims: number;
    total: number;
  };
  activeBusinesses: number;
  totalBusinesses: number;
  upcomingEvents: number;
  totalDeals: number;
  recentActivity: Array<{
    id: string;
    action: string;
    targetType: string;
    targetId: string;
    targetName: string | null;
    actorRole: string;
    actorName: string | null;
    createdAt: string;
  }>;
}

export interface PlatformAnalytics {
  period: {
    startDate: string;
    endDate: string;
    daysInPeriod: number;
  };
  summary: {
    totalProfileViews: number;
    totalUniqueViews: number;
    totalSearchAppearances: number;
    totalWebsiteClicks: number;
    totalPhoneClicks: number;
    totalDirectionsClicks: number;
    totalPhotoViews: number;
    totalSaves: number;
    totalReviews: number;
    totalMessages: number;
    totalDealClicks: number;
    totalVoucherReveals: number;
  };
  topBusinesses: Array<{
    id: string;
    name: string;
    slug: string;
    profileViews: number;
    phoneClicks: number;
    websiteClicks: number;
  }>;
  timeseries: Array<{
    date: string;
    profileViews: number;
    phoneClicks: number;
    websiteClicks: number;
    directionsClicks: number;
    searchAppearances: number;
  }>;
  growth: {
    newUsers: number;
    newBusinesses: number;
    newReviews: number;
    newEvents: number;
  };
}

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  profilePhoto: string | null;
  role: string;
  status: string;
  emailVerified: boolean;
  createdAt: string;
  lastLogin: string | null;
  businessCount: number;
}

export interface AdminBusiness {
  id: string;
  name: string;
  slug: string;
  status: string;
  claimed: boolean;
  claimedBy: string | null;
  categoryName: string;
  phone: string;
  email: string | null;
  featured: boolean;
  createdAt: string;
  reviewCount: number;
  dealCount: number;
  ownerName: string | null;
}

export interface AdminEvent {
  id: string;
  title: string;
  slug: string | null;
  status: string;
  startTime: string;
  endTime: string;
  locationType: string;
  capacity: number | null;
  rsvpCount: number;
  createdByName: string;
  businessName: string | null;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ApiSuccessResponse<T> {
  success: boolean;
  data: T;
}

// ─── Dashboard ──────────────────────────────────────────────

export async function getAdminDashboard(): Promise<DashboardOverview> {
  const response = await get<ApiSuccessResponse<DashboardOverview>>('/admin/dashboard');
  return response.data;
}

// ─── Platform Analytics ─────────────────────────────────────

export async function getPlatformAnalytics(options: {
  startDate: string;
  endDate: string;
  granularity?: 'day' | 'week' | 'month';
}): Promise<PlatformAnalytics> {
  const params = new URLSearchParams({
    startDate: options.startDate,
    endDate: options.endDate,
    ...(options.granularity && { granularity: options.granularity }),
  });
  const response = await get<ApiSuccessResponse<PlatformAnalytics>>(`/admin/analytics?${params}`);
  return response.data;
}

export function getPlatformAnalyticsExportUrl(startDate: string, endDate: string): string {
  const params = new URLSearchParams({ startDate, endDate });
  const baseUrl = import.meta.env.VITE_API_URL || '/api/v1';
  return `${baseUrl}/admin/analytics/export?${params}`;
}

// ─── User Management ────────────────────────────────────────

export async function listUsers(options: {
  page?: number;
  limit?: number;
  role?: string;
  status?: string;
  search?: string;
  sort?: string;
}): Promise<PaginatedResponse<AdminUser>> {
  const params = new URLSearchParams();
  if (options.page) params.set('page', String(options.page));
  if (options.limit) params.set('limit', String(options.limit));
  if (options.role) params.set('role', options.role);
  if (options.status) params.set('status', options.status);
  if (options.search) params.set('search', options.search);
  if (options.sort) params.set('sort', options.sort);

  return get<PaginatedResponse<AdminUser>>(`/admin/users?${params}`);
}

export async function updateUserRole(userId: string, role: string): Promise<void> {
  await put(`/admin/users/${userId}/role`, { role });
}

export async function suspendUser(userId: string, reason: string): Promise<void> {
  await post(`/admin/users/${userId}/suspend`, { reason });
}

export async function unsuspendUser(userId: string): Promise<void> {
  await post(`/admin/users/${userId}/unsuspend`);
}

// ─── Business Management ────────────────────────────────────

export async function listAdminBusinesses(options: {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  claimed?: boolean;
  search?: string;
  sort?: string;
}): Promise<PaginatedResponse<AdminBusiness>> {
  const params = new URLSearchParams();
  if (options.page) params.set('page', String(options.page));
  if (options.limit) params.set('limit', String(options.limit));
  if (options.status) params.set('status', options.status);
  if (options.category) params.set('category', options.category);
  if (options.claimed !== undefined) params.set('claimed', String(options.claimed));
  if (options.search) params.set('search', options.search);
  if (options.sort) params.set('sort', options.sort);

  return get<PaginatedResponse<AdminBusiness>>(`/admin/businesses?${params}`);
}

export async function updateBusinessStatus(businessId: string, status: string, reason?: string): Promise<void> {
  await put(`/admin/businesses/${businessId}/status`, { status, reason });
}

// ─── Event Management ───────────────────────────────────────

export async function listAdminEvents(options: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sort?: string;
}): Promise<PaginatedResponse<AdminEvent>> {
  const params = new URLSearchParams();
  if (options.page) params.set('page', String(options.page));
  if (options.limit) params.set('limit', String(options.limit));
  if (options.status) params.set('status', options.status);
  if (options.search) params.set('search', options.search);
  if (options.sort) params.set('sort', options.sort);

  return get<PaginatedResponse<AdminEvent>>(`/admin/events?${params}`);
}

// ─── User Creation ─────────────────────────────────────────

export async function createAdminUser(data: {
  email: string;
  password: string;
  displayName: string;
  role: string;
}): Promise<UserSearchResult> {
  const response = await post<ApiSuccessResponse<UserSearchResult>>('/admin/users', data);
  return response.data;
}

// ─── User Search ───────────────────────────────────────────

export async function searchUsers(query: string): Promise<UserSearchResult[]> {
  const response = await get<ApiSuccessResponse<UserSearchResult[]>>(`/admin/users/search?q=${encodeURIComponent(query)}`);
  return response.data;
}

// ─── Business Owner Assignment ─────────────────────────────

export async function assignBusinessOwner(businessId: string, userId: string | null): Promise<void> {
  await put(`/admin/businesses/${businessId}/owner`, { userId });
}

// ─── Business CSV Import & Google Places Enrichment ────────

export interface EnrichBusinessInput {
  name: string;
  address?: string;
  phone?: string;
}

export interface EnrichedBusinessData {
  name: string;
  formattedAddress: string;
  street: string;
  suburb: string;
  state: string;
  postcode: string;
  country: string;
  latitude: number;
  longitude: number;
  phone: string;
  website: string;
  googleMapsUri: string;
  googlePlaceId: string;
  operatingHours: Record<string, { open: string; close: string }> | null;
  rating: number | null;
  userRatingCount: number | null;
  businessType: string | null;
}

export interface BulkImportBusinessInput {
  name: string;
  description?: string;
  categoryPrimaryId: string;
  phone: string;
  email?: string;
  website?: string;
  street: string;
  suburb: string;
  state: string;
  postcode: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  operatingHours?: Record<string, { open: string; close: string }>;
}

export interface BulkImportResult {
  row: number;
  name: string;
  success: boolean;
  businessId?: string;
  error?: string;
}

export interface BulkImportResponse {
  results: BulkImportResult[];
  summary: { total: number; success: number; failed: number };
}

export async function enrichBusinessesFromCSV(
  businesses: EnrichBusinessInput[],
): Promise<(EnrichedBusinessData | null)[]> {
  const response = await post<ApiSuccessResponse<{ enriched: (EnrichedBusinessData | null)[] }>>(
    '/admin/businesses/enrich',
    { businesses },
  );
  return response.data.enriched;
}

export async function bulkImportBusinesses(
  businesses: BulkImportBusinessInput[],
): Promise<BulkImportResponse> {
  const response = await post<ApiSuccessResponse<BulkImportResponse>>(
    '/admin/businesses/bulk-import',
    { businesses },
  );
  return response.data;
}
