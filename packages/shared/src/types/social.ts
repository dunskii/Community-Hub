/**
 * Social Media Auto-Posting Types
 *
 * Spec §20: Social Media Integration
 */

export const SOCIAL_PLATFORMS = ['FACEBOOK', 'INSTAGRAM', 'TWITTER', 'LINKEDIN', 'GOOGLE_BUSINESS'] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export const SOCIAL_POST_STATUSES = ['PENDING', 'QUEUED', 'PUBLISHING', 'PUBLISHED', 'FAILED', 'CANCELLED'] as const;
export type SocialPostStatus = (typeof SOCIAL_POST_STATUSES)[number];

export const SOCIAL_CONTENT_TYPES = ['DEAL', 'EVENT'] as const;
export type SocialContentType = (typeof SOCIAL_CONTENT_TYPES)[number];

/** Platform-specific character limits for post captions */
export const CAPTION_LIMITS: Record<SocialPlatform, number> = {
  FACEBOOK: 63206,
  INSTAGRAM: 2200,
  TWITTER: 280,
  LINKEDIN: 3000,
  GOOGLE_BUSINESS: 1500,
};

/** Platform display metadata */
export const PLATFORM_META: Record<SocialPlatform, { name: string; color: string; icon: string }> = {
  FACEBOOK: { name: 'Facebook', color: '#1877F2', icon: 'facebook' },
  INSTAGRAM: { name: 'Instagram', color: '#E4405F', icon: 'instagram' },
  TWITTER: { name: 'X', color: '#000000', icon: 'x' },
  LINKEDIN: { name: 'LinkedIn', color: '#0A66C2', icon: 'linkedin' },
  GOOGLE_BUSINESS: { name: 'Google Business', color: '#4285F4', icon: 'google' },
};

/** Connected social account (API response - no tokens exposed) */
export interface SocialAccount {
  id: string;
  businessId: string;
  platform: SocialPlatform;
  platformAccountId: string;
  platformAccountName: string;
  isActive: boolean;
  scopes: string[];
  lastPostAt: string | null;
  lastError: string | null;
  tokenExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Social post record (API response) */
export interface SocialPost {
  id: string;
  businessId: string;
  socialAccountId: string;
  contentType: SocialContentType;
  contentId: string;
  platform: SocialPlatform;
  caption: string;
  imageUrl: string | null;
  platformPostId: string | null;
  platformPostUrl: string | null;
  status: SocialPostStatus;
  scheduledAt: string | null;
  publishedAt: string | null;
  errorMessage: string | null;
  retryCount: number;
  createdAt: string;
}

// Input types are defined via Zod schemas in schemas/social-schemas.ts
// Use the inferred types from there (SocialPostCreateInput, SocialAccountToggleInput, CaptionPreviewInput)

/** Caption preview response */
export interface CaptionPreview {
  platform: SocialPlatform;
  caption: string;
  characterLimit: number;
  characterCount: number;
}

/** Platform approval status (stored in system_settings) */
export interface PlatformApprovals {
  facebook: boolean;
  instagram: boolean;
  twitter: boolean;
  linkedin: boolean;
  googleBusiness: boolean;
}

// ─── GBP Data Sync Types (§26.1) ────────────────────────────

/** Syncable fields from Google Business Profile */
export const GBP_SYNC_FIELDS = ['name', 'phone', 'website', 'description', 'address', 'operatingHours', 'categories', 'photos'] as const;
export type GbpSyncField = (typeof GBP_SYNC_FIELDS)[number];

/** Business profile data fetched from the GBP Business Information API */
export interface GbpProfileData {
  name?: string;
  phone?: string;
  website?: string;
  description?: string;
  address?: {
    street: string;
    suburb: string;
    state: string;
    postcode: string;
    country: string;
    latitude?: number;
    longitude?: number;
  };
  operatingHours?: Record<string, { open: string; close: string; closed: boolean }>;
  categories?: string[];
  photos?: Array<{ url: string; category: string }>;
}

/** Result of applying GBP sync fields to a business record */
export interface GbpSyncResult {
  fieldsUpdated: GbpSyncField[];
  syncedAt: string;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  errors?: Array<{ field: string; message: string }>;
}

/** GBP sync connection and status info */
export interface GbpSyncStatus {
  lastSyncAt: string | null;
  syncStatus: string | null;
  isGbpConnected: boolean;
  locationName: string | null;
}
