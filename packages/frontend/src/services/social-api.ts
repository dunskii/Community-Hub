/**
 * Social Media API Client
 *
 * API endpoints for social media OAuth connections and auto-posting.
 * Spec §20: Social Media Integration
 */

import { get, post, del, patch } from './api-client';
import type {
  SocialPlatform,
  SocialAccount,
  SocialPost,
  CaptionPreview,
  GbpProfileData,
  GbpSyncField,
  GbpSyncResult,
  GbpSyncStatus,
} from '@community-hub/shared';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface AccountsResponse {
  accounts: SocialAccount[];
  configuredPlatforms: SocialPlatform[];
}

interface PostsResponse {
  posts: SocialPost[];
  total: number;
  page: number;
  pages: number;
}

interface PostCreateResult {
  id: string;
  platform: SocialPlatform;
  status: string;
}

interface PostFilters {
  status?: string;
  platform?: SocialPlatform;
  contentType?: string;
  page?: number;
  limit?: number;
}

/**
 * Social Media API methods
 */
export const socialApi = {
  // ─── Account Management ─────────────────────────────────────

  /** Get connected social accounts for a business */
  async getAccounts(businessId: string): Promise<AccountsResponse> {
    const res = await get<ApiResponse<AccountsResponse>>(
      `/businesses/${businessId}/social/accounts`
    );
    return res.data;
  },

  /** Get OAuth authorization URL (opens in popup) */
  getAuthUrl(businessId: string, platform: SocialPlatform): string {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
    return `${baseUrl}/businesses/${businessId}/social/auth/${platform}`;
  },

  /** Disconnect a social account */
  async disconnectAccount(businessId: string, accountId: string): Promise<void> {
    await del<ApiResponse<null>>(
      `/businesses/${businessId}/social/accounts/${accountId}`
    );
  },

  /** Toggle account active/inactive */
  async toggleAccount(businessId: string, accountId: string, isActive: boolean): Promise<void> {
    await patch<ApiResponse<{ isActive: boolean }>>(
      `/businesses/${businessId}/social/accounts/${accountId}`,
      { isActive }
    );
  },

  // ─── Social Posting ─────────────────────────────────────────

  /** Create social post(s) for a deal/event */
  async createPosts(
    businessId: string,
    input: {
      platforms: SocialPlatform[];
      contentType: 'DEAL' | 'EVENT';
      contentId: string;
      caption?: string;
      imageUrl?: string;
      scheduledAt?: string;
    }
  ): Promise<PostCreateResult[]> {
    const res = await post<ApiResponse<PostCreateResult[]>>(
      `/businesses/${businessId}/social/posts`,
      input
    );
    return res.data;
  },

  /** Get social posts for a business */
  async getPosts(businessId: string, filters?: PostFilters): Promise<PostsResponse> {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.platform) params.set('platform', filters.platform);
    if (filters?.contentType) params.set('contentType', filters.contentType);
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.limit) params.set('limit', String(filters.limit));

    const query = params.toString();
    const res = await get<ApiResponse<PostsResponse>>(
      `/businesses/${businessId}/social/posts${query ? `?${query}` : ''}`
    );
    return res.data;
  },

  /** Cancel a pending post */
  async cancelPost(businessId: string, postId: string): Promise<void> {
    await post<ApiResponse<null>>(
      `/businesses/${businessId}/social/posts/${postId}/cancel`
    );
  },

  /** Retry a failed post */
  async retryPost(businessId: string, postId: string): Promise<void> {
    await post<ApiResponse<null>>(
      `/businesses/${businessId}/social/posts/${postId}/retry`
    );
  },

  /** Generate caption preview for a deal/event */
  async previewCaption(
    businessId: string,
    contentType: 'DEAL' | 'EVENT',
    contentId: string,
    platform: SocialPlatform,
  ): Promise<CaptionPreview> {
    const res = await post<ApiResponse<CaptionPreview>>(
      `/businesses/${businessId}/social/posts/preview-caption`,
      { contentType, contentId, platform }
    );
    return res.data;
  },

  // ─── GBP Data Sync (§26.1) ───────────────────────────────

  /** Fetch business profile data from Google Business Profile */
  async fetchGbpProfile(businessId: string): Promise<GbpProfileData> {
    const res = await get<ApiResponse<GbpProfileData>>(
      `/businesses/${businessId}/social/gbp/profile`
    );
    return res.data;
  },

  /** Apply selected GBP fields to the business record */
  async applyGbpSync(
    businessId: string,
    fields: GbpSyncField[],
    gbpData: GbpProfileData,
  ): Promise<GbpSyncResult> {
    const res = await post<ApiResponse<GbpSyncResult>>(
      `/businesses/${businessId}/social/gbp/sync`,
      { fields, gbpData }
    );
    return res.data;
  },

  /** Get GBP connection and sync status */
  async getGbpSyncStatus(businessId: string): Promise<GbpSyncStatus> {
    const res = await get<ApiResponse<GbpSyncStatus>>(
      `/businesses/${businessId}/social/gbp/sync-status`
    );
    return res.data;
  },
};
