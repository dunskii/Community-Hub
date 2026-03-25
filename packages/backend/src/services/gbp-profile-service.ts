/**
 * GBP Profile Service
 *
 * Fetches business profile data from Google Business Profile API
 * and maps it to the Community Hub business model for selective sync.
 *
 * Spec §26.1: Google Business Profile API — Import direction
 */

import { prisma } from '../db/index.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/api-error.js';
import { createAuditLog } from '../utils/audit-logger.js';
import { SocialTokenService } from './social-token-service.js';
import { getPlatformConfig } from '../config/platform-loader.js';
import { formatAustralianPhone } from '@community-hub/shared';
import type { GbpProfileData, GbpSyncField, GbpSyncResult, GbpSyncStatus } from '@community-hub/shared';
import type { AuditContext } from '../types/service-types.js';

const GBP_API_BASE = 'https://mybusinessbusinessinformation.googleapis.com/v1';

const READ_MASK = [
  'name',
  'title',
  'storefrontAddress',
  'phoneNumbers',
  'websiteUri',
  'regularHours',
  'categories',
  'profile',
  'latlng',
].join(',');

/** GBP day enum → lowercase day name */
const GBP_DAY_MAP: Record<string, string> = {
  MONDAY: 'monday',
  TUESDAY: 'tuesday',
  WEDNESDAY: 'wednesday',
  THURSDAY: 'thursday',
  FRIDAY: 'friday',
  SATURDAY: 'saturday',
  SUNDAY: 'sunday',
};

const ALL_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

// ─── GBP API response types ─────────────────────────────────

/** Allowed Google media URL domains to prevent SSRF/XSS from untrusted URLs */
const ALLOWED_GOOGLE_DOMAINS = [
  'lh3.googleusercontent.com',
  'lh4.googleusercontent.com',
  'lh5.googleusercontent.com',
  'lh6.googleusercontent.com',
  'streetviewpixels-pa.googleapis.com',
  'maps.googleapis.com',
];

/**
 * Check if a URL is from a known Google media domain.
 * NOTE: Photos are stored as external URLs, not downloaded locally.
 * This is a known limitation — local download can be added in a future iteration.
 */
function isAllowedGoogleMediaUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_GOOGLE_DOMAINS.some((domain) => parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

interface GbpTimePart {
  hours?: number;
  minutes?: number;
}

interface GbpPeriod {
  openDay: string;
  openTime: GbpTimePart;
  closeDay: string;
  closeTime: GbpTimePart;
}

interface GbpCategory {
  displayName: string;
  name?: string;
}

interface GbpLocationResponse {
  name?: string;
  title?: string;
  storefrontAddress?: {
    addressLines?: string[];
    locality?: string;
    administrativeArea?: string;
    postalCode?: string;
    regionCode?: string;
  };
  phoneNumbers?: {
    primaryPhone?: string;
    additionalPhones?: string[];
  };
  websiteUri?: string;
  regularHours?: {
    periods?: GbpPeriod[];
  };
  categories?: {
    primaryCategory?: GbpCategory;
    additionalCategories?: GbpCategory[];
  };
  profile?: {
    description?: string;
  };
  latlng?: {
    latitude?: number;
    longitude?: number;
  };
}

interface GbpMediaItem {
  name?: string;
  mediaFormat?: string;
  sourceUrl?: string;
  googleUrl?: string;
  locationAssociation?: {
    category?: string;
  };
}

interface GbpMediaResponse {
  mediaItems?: GbpMediaItem[];
}

// ─── Service ─────────────────────────────────────────────────

const tokenService = new SocialTokenService();

/**
 * Find the active GBP social account for a business.
 */
async function getGbpAccount(businessId: string) {
  const account = await prisma.social_accounts.findFirst({
    where: {
      business_id: businessId,
      platform: 'GOOGLE_BUSINESS',
      is_active: true,
    },
  });

  if (!account) {
    throw ApiError.badRequest(
      'GBP_NOT_CONNECTED',
      'No active Google Business Profile account is connected. Connect your account in the Social Media tab first.',
    );
  }

  return account;
}

/**
 * Format GBP time parts (hours, minutes) into HH:MM string.
 */
function formatTime(time: GbpTimePart): string {
  const h = String(time.hours ?? 0).padStart(2, '0');
  const m = String(time.minutes ?? 0).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Map GBP regularHours periods to platform operatingHours format.
 */
function mapOperatingHours(periods?: GbpPeriod[]): Record<string, { open: string; close: string; closed: boolean }> {
  const hours: Record<string, { open: string; close: string; closed: boolean }> = {};

  // Initialize all days as closed
  for (const day of ALL_DAYS) {
    hours[day] = { open: '09:00', close: '17:00', closed: true };
  }

  if (!periods || periods.length === 0) {
    return hours;
  }

  // Group periods by open day and use the first period for each day
  for (const period of periods) {
    const day = GBP_DAY_MAP[period.openDay];
    if (day && hours[day]?.closed) {
      hours[day] = {
        open: formatTime(period.openTime),
        close: formatTime(period.closeTime),
        closed: false,
      };
    }
  }

  return hours;
}

/**
 * Map GBP location response to GbpProfileData.
 */
function mapLocationToProfile(location: GbpLocationResponse): GbpProfileData {
  const profile: GbpProfileData = {};

  if (location.title) {
    profile.name = location.title;
  }

  if (location.phoneNumbers?.primaryPhone) {
    profile.phone = location.phoneNumbers.primaryPhone;
  }

  if (location.websiteUri) {
    profile.website = location.websiteUri;
  }

  if (location.profile?.description) {
    profile.description = location.profile.description;
  }

  if (location.storefrontAddress) {
    const addr = location.storefrontAddress;
    profile.address = {
      street: addr.addressLines?.join(', ') || '',
      suburb: addr.locality || '',
      state: addr.administrativeArea || '',
      postcode: addr.postalCode || '',
      country: addr.regionCode || getPlatformConfig().location.countryCode || 'AU',
      latitude: location.latlng?.latitude,
      longitude: location.latlng?.longitude,
    };
  }

  if (location.regularHours) {
    profile.operatingHours = mapOperatingHours(location.regularHours.periods);
  }

  if (location.categories) {
    const cats: string[] = [];
    if (location.categories.primaryCategory?.displayName) {
      cats.push(location.categories.primaryCategory.displayName);
    }
    if (location.categories.additionalCategories) {
      for (const cat of location.categories.additionalCategories) {
        if (cat.displayName) cats.push(cat.displayName);
      }
    }
    if (cats.length > 0) {
      profile.categories = cats;
    }
  }

  return profile;
}

/**
 * Fetch business profile data from Google Business Profile API.
 */
export async function fetchGbpProfile(businessId: string): Promise<GbpProfileData> {
  const account = await getGbpAccount(businessId);
  const accessToken = await tokenService.getValidToken(account.id);
  const locationName = account.platform_account_id;

  // Fetch location data
  const locationRes = await fetch(
    `${GBP_API_BASE}/${locationName}?readMask=${READ_MASK}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!locationRes.ok) {
    const err = await locationRes.json().catch(() => ({})) as { error?: { message?: string; status?: string } };
    logger.error({ businessId, status: locationRes.status, error: err }, 'GBP profile fetch failed');

    if (locationRes.status === 401 || locationRes.status === 403) {
      throw ApiError.forbidden('GBP_AUTH_FAILED', 'Google Business Profile authorization failed. Please reconnect your account.');
    }
    throw ApiError.internal(`Failed to fetch Google Business Profile data: ${err.error?.message || locationRes.statusText}`);
  }

  const locationData = (await locationRes.json()) as GbpLocationResponse;
  const profile = mapLocationToProfile(locationData);

  // Fetch photos (separate endpoint)
  try {
    const mediaRes = await fetch(
      `${GBP_API_BASE}/${locationName}/media`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (mediaRes.ok) {
      const mediaData = (await mediaRes.json()) as GbpMediaResponse;
      if (mediaData.mediaItems && mediaData.mediaItems.length > 0) {
        profile.photos = mediaData.mediaItems
          .filter((item) => {
            const url = item.googleUrl || item.sourceUrl || '';
            // Only allow URLs from known Google media domains to prevent SSRF/XSS
            return url && isAllowedGoogleMediaUrl(url);
          })
          .map((item) => ({
            url: item.googleUrl || item.sourceUrl || '',
            category: item.locationAssociation?.category || 'ADDITIONAL',
          }));
      }
    }
  } catch (mediaErr) {
    // Photo fetch is non-critical — log and continue
    logger.warn({ businessId, error: mediaErr }, 'GBP media fetch failed (non-critical)');
  }

  logger.info({ businessId, fieldsFound: Object.keys(profile) }, 'GBP profile fetched');
  return profile;
}

/**
 * Apply selected GBP fields to the business record.
 */
export async function applySyncFields(
  businessId: string,
  fields: GbpSyncField[],
  gbpData: GbpProfileData,
  auditContext: AuditContext,
): Promise<GbpSyncResult> {
  const business = await prisma.businesses.findUnique({ where: { id: businessId } });
  if (!business) {
    throw ApiError.notFound('BUSINESS_NOT_FOUND', 'Business not found');
  }

  const updateData: Record<string, unknown> = {};
  const fieldsUpdated: GbpSyncField[] = [];
  const errors: Array<{ field: string; message: string }> = [];
  const previousValues: Record<string, unknown> = {};

  for (const field of fields) {
    try {
      switch (field) {
        case 'name':
          if (gbpData.name) {
            previousValues.name = business.name;
            updateData.name = gbpData.name.substring(0, 100); // VarChar(100)
            fieldsUpdated.push('name');
          }
          break;

        case 'phone':
          if (gbpData.phone) {
            previousValues.phone = business.phone;
            // Format phone number using existing validator
            const formatted = formatAustralianPhone(gbpData.phone);
            updateData.phone = formatted || gbpData.phone;
            fieldsUpdated.push('phone');
          }
          break;

        case 'website':
          if (gbpData.website) {
            previousValues.website = business.website;
            updateData.website = gbpData.website;
            fieldsUpdated.push('website');
          }
          break;

        case 'description':
          if (gbpData.description) {
            previousValues.description = business.description;
            // Store as multilingual JSON with 'en' key
            const existingDesc = (business.description as Record<string, string>) || {};
            updateData.description = { ...existingDesc, en: gbpData.description };
            fieldsUpdated.push('description');
          }
          break;

        case 'address':
          if (gbpData.address) {
            previousValues.address = business.address;
            updateData.address = {
              street: gbpData.address.street,
              suburb: gbpData.address.suburb,
              state: gbpData.address.state,
              postcode: gbpData.address.postcode,
              country: gbpData.address.country,
              latitude: gbpData.address.latitude,
              longitude: gbpData.address.longitude,
            };
            fieldsUpdated.push('address');
          }
          break;

        case 'operatingHours':
          if (gbpData.operatingHours) {
            previousValues.operating_hours = business.operating_hours;
            // Add byAppointment: false to each day to match platform format
            const hoursWithAppointment: Record<string, unknown> = {};
            for (const [day, hours] of Object.entries(gbpData.operatingHours)) {
              hoursWithAppointment[day] = { ...hours, byAppointment: false };
            }
            updateData.operating_hours = hoursWithAppointment;
            fieldsUpdated.push('operatingHours');
          }
          break;

        case 'categories':
          if (gbpData.categories && gbpData.categories.length > 0) {
            previousValues.categories_secondary = business.categories_secondary;
            // Store GBP categories as secondary categories (strings)
            // Primary category mapping requires matching to platform categories table
            updateData.categories_secondary = gbpData.categories;
            fieldsUpdated.push('categories');
          }
          break;

        case 'photos':
          if (gbpData.photos && gbpData.photos.length > 0) {
            previousValues.gallery = business.gallery;
            // Filter to only allowed Google domains and store URLs
            // NOTE: Photos stored as external URLs (not downloaded locally yet)
            const existingGallery = (business.gallery as Array<{ url: string; category: string }>) || [];
            const newPhotos = gbpData.photos
              .filter((p) => isAllowedGoogleMediaUrl(p.url))
              .map((p) => ({
                url: p.url,
                category: p.category,
              }));
            if (newPhotos.length > 0) {
              updateData.gallery = [...existingGallery, ...newPhotos];
              fieldsUpdated.push('photos');
            }
          }
          break;
      }
    } catch (fieldErr) {
      logger.warn({ businessId, field, error: fieldErr }, 'Failed to map GBP field');
      errors.push({ field, message: fieldErr instanceof Error ? fieldErr.message : 'Unknown error' });
    }
  }

  if (fieldsUpdated.length === 0 && errors.length > 0) {
    // All fields failed
    await prisma.businesses.update({
      where: { id: businessId },
      data: { gbp_sync_status: 'FAILED', gbp_last_sync_at: new Date(), updated_at: new Date() },
    });
    return { fieldsUpdated: [], syncedAt: new Date().toISOString(), status: 'FAILED', errors };
  }

  // Apply the update
  const syncStatus = errors.length > 0 ? 'PARTIAL' : 'SUCCESS';
  await prisma.businesses.update({
    where: { id: businessId },
    data: {
      ...updateData,
      gbp_last_sync_at: new Date(),
      gbp_sync_status: syncStatus,
      updated_at: new Date(),
    },
  });

  // Audit log
  await createAuditLog({
    context: auditContext,
    action: 'business.gbp_sync',
    targetType: 'Business',
    targetId: businessId,
    previousValue: previousValues,
    newValue: { fieldsUpdated, syncStatus },
  });

  logger.info({ businessId, fieldsUpdated, syncStatus }, 'GBP sync applied');

  return {
    fieldsUpdated,
    syncedAt: new Date().toISOString(),
    status: syncStatus,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Get GBP sync status for a business.
 */
export async function getSyncStatus(businessId: string): Promise<GbpSyncStatus> {
  const business = await prisma.businesses.findUnique({
    where: { id: businessId },
    select: { gbp_last_sync_at: true, gbp_sync_status: true },
  });

  if (!business) {
    throw ApiError.notFound('BUSINESS_NOT_FOUND', 'Business not found');
  }

  const account = await prisma.social_accounts.findFirst({
    where: {
      business_id: businessId,
      platform: 'GOOGLE_BUSINESS',
      is_active: true,
    },
    select: { platform_account_name: true },
  });

  return {
    lastSyncAt: business.gbp_last_sync_at?.toISOString() ?? null,
    syncStatus: business.gbp_sync_status ?? null,
    isGbpConnected: !!account,
    locationName: account?.platform_account_name ?? null,
  };
}
