/**
 * GBP Profile Service Tests
 *
 * Tests the Google Business Profile data fetch and sync functionality.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma
const mockFindFirst = vi.fn();
const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();
vi.mock('../../../db/index.js', () => ({
  prisma: {
    social_accounts: { findFirst: (...args: unknown[]) => mockFindFirst(...args) },
    businesses: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
}));

// Mock SocialTokenService
const mockGetValidToken = vi.fn();
vi.mock('../../../services/social-token-service.js', () => ({
  SocialTokenService: vi.fn().mockImplementation(() => ({
    getValidToken: mockGetValidToken,
  })),
}));

// Mock audit logger
const mockCreateAuditLog = vi.fn();
vi.mock('../../../utils/audit-logger.js', () => ({
  createAuditLog: (...args: unknown[]) => mockCreateAuditLog(...args),
}));

// Mock logger
vi.mock('../../../utils/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { fetchGbpProfile, applySyncFields, getSyncStatus } from '../../../services/gbp-profile-service.js';

const MOCK_ACCOUNT = {
  id: 'account-1',
  business_id: 'biz-1',
  platform: 'GOOGLE_BUSINESS',
  platform_account_id: 'accounts/123/locations/456',
  platform_account_name: 'My Business',
  is_active: true,
};

const MOCK_GBP_LOCATION = {
  name: 'accounts/123/locations/456',
  title: 'Google Business Name',
  storefrontAddress: {
    addressLines: ['123 Main St'],
    locality: 'Guildford',
    administrativeArea: 'NSW',
    postalCode: '2161',
    regionCode: 'AU',
  },
  phoneNumbers: {
    primaryPhone: '+61 2 9876 5432',
  },
  websiteUri: 'https://example.com',
  regularHours: {
    periods: [
      { openDay: 'MONDAY', openTime: { hours: 9, minutes: 0 }, closeDay: 'MONDAY', closeTime: { hours: 17, minutes: 0 } },
      { openDay: 'TUESDAY', openTime: { hours: 9, minutes: 0 }, closeDay: 'TUESDAY', closeTime: { hours: 17, minutes: 0 } },
      { openDay: 'WEDNESDAY', openTime: { hours: 9, minutes: 30 }, closeDay: 'WEDNESDAY', closeTime: { hours: 16, minutes: 0 } },
    ],
  },
  categories: {
    primaryCategory: { displayName: 'Restaurant', name: 'categories/restaurant' },
    additionalCategories: [
      { displayName: 'Cafe', name: 'categories/cafe' },
    ],
  },
  profile: {
    description: 'A lovely restaurant in Guildford.',
  },
  latlng: {
    latitude: -33.8568,
    longitude: 151.0123,
  },
};

describe('GBP Profile Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchGbpProfile', () => {
    it('throws if no GBP account is connected', async () => {
      mockFindFirst.mockResolvedValue(null);

      await expect(fetchGbpProfile('biz-1')).rejects.toThrow('No active Google Business Profile account');
    });

    it('fetches and maps GBP location data correctly', async () => {
      mockFindFirst.mockResolvedValue(MOCK_ACCOUNT);
      mockGetValidToken.mockResolvedValue('valid-token');

      // Mock location fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_GBP_LOCATION),
      });

      // Mock media fetch (no photos)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ mediaItems: [] }),
      });

      const result = await fetchGbpProfile('biz-1');

      expect(result.name).toBe('Google Business Name');
      expect(result.phone).toBe('+61 2 9876 5432');
      expect(result.website).toBe('https://example.com');
      expect(result.description).toBe('A lovely restaurant in Guildford.');
      expect(result.address).toEqual({
        street: '123 Main St',
        suburb: 'Guildford',
        state: 'NSW',
        postcode: '2161',
        country: 'AU',
        latitude: -33.8568,
        longitude: 151.0123,
      });
      expect(result.categories).toEqual(['Restaurant', 'Cafe']);
    });

    it('maps operating hours with correct day formatting', async () => {
      mockFindFirst.mockResolvedValue(MOCK_ACCOUNT);
      mockGetValidToken.mockResolvedValue('valid-token');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_GBP_LOCATION),
      });
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await fetchGbpProfile('biz-1');

      expect(result.operatingHours).toBeDefined();
      expect(result.operatingHours!.monday).toEqual({ open: '09:00', close: '17:00', closed: false });
      expect(result.operatingHours!.tuesday).toEqual({ open: '09:00', close: '17:00', closed: false });
      expect(result.operatingHours!.wednesday).toEqual({ open: '09:30', close: '16:00', closed: false });
      // Days without periods should be closed
      expect(result.operatingHours!.thursday).toEqual({ open: '09:00', close: '17:00', closed: true });
      expect(result.operatingHours!.sunday).toEqual({ open: '09:00', close: '17:00', closed: true });
    });

    it('handles GBP API auth failure', async () => {
      mockFindFirst.mockResolvedValue(MOCK_ACCOUNT);
      mockGetValidToken.mockResolvedValue('expired-token');

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ error: { message: 'Invalid token' } }),
      });

      await expect(fetchGbpProfile('biz-1')).rejects.toThrow('authorization failed');
    });

    it('handles GBP API server error', async () => {
      mockFindFirst.mockResolvedValue(MOCK_ACCOUNT);
      mockGetValidToken.mockResolvedValue('valid-token');

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ error: { message: 'Server error' } }),
      });

      await expect(fetchGbpProfile('biz-1')).rejects.toThrow('Failed to fetch Google Business Profile');
    });

    it('continues if photo fetch fails (non-critical)', async () => {
      mockFindFirst.mockResolvedValue(MOCK_ACCOUNT);
      mockGetValidToken.mockResolvedValue('valid-token');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_GBP_LOCATION),
      });
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await fetchGbpProfile('biz-1');
      expect(result.name).toBe('Google Business Name');
      expect(result.photos).toBeUndefined();
    });

    it('includes photos when media fetch succeeds', async () => {
      mockFindFirst.mockResolvedValue(MOCK_ACCOUNT);
      mockGetValidToken.mockResolvedValue('valid-token');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_GBP_LOCATION),
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          mediaItems: [
            { googleUrl: 'https://lh3.googleusercontent.com/photo1', locationAssociation: { category: 'COVER' } },
            { sourceUrl: 'https://lh3.googleusercontent.com/photo2', locationAssociation: { category: 'ADDITIONAL' } },
          ],
        }),
      });

      const result = await fetchGbpProfile('biz-1');
      expect(result.photos).toHaveLength(2);
      expect(result.photos![0]).toEqual({ url: 'https://lh3.googleusercontent.com/photo1', category: 'COVER' });
    });
  });

  describe('applySyncFields', () => {
    const auditContext = { actorId: 'user-1', actorRole: 'BUSINESS_OWNER' };

    const mockBusiness = {
      id: 'biz-1',
      name: 'Old Name',
      phone: '0400000000',
      website: 'https://old.com',
      description: { en: 'Old description' },
      address: { street: '1 Old St', suburb: 'Old', state: 'NSW', postcode: '2000' },
      operating_hours: {},
      categories_secondary: [],
      gallery: [],
    };

    it('updates selected fields only', async () => {
      mockFindUnique.mockResolvedValue(mockBusiness);
      mockUpdate.mockResolvedValue({ ...mockBusiness, name: 'New Name' });
      mockCreateAuditLog.mockResolvedValue(undefined);

      const result = await applySyncFields(
        'biz-1',
        ['name', 'phone'],
        { name: 'New Name', phone: '+61 2 1234 5678' },
        auditContext,
      );

      expect(result.status).toBe('SUCCESS');
      expect(result.fieldsUpdated).toEqual(['name', 'phone']);

      const updateCall = mockUpdate.mock.calls[0][0];
      expect(updateCall.data.name).toBe('New Name');
      expect(updateCall.data.phone).toBe('+61 2 1234 5678');
      expect(updateCall.data.gbp_sync_status).toBe('SUCCESS');
    });

    it('records audit log with previous values', async () => {
      mockFindUnique.mockResolvedValue(mockBusiness);
      mockUpdate.mockResolvedValue(mockBusiness);
      mockCreateAuditLog.mockResolvedValue(undefined);

      await applySyncFields('biz-1', ['name'], { name: 'New Name' }, auditContext);

      expect(mockCreateAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'business.gbp_sync',
          targetType: 'Business',
          targetId: 'biz-1',
          previousValue: expect.objectContaining({ name: 'Old Name' }),
        }),
      );
    });

    it('throws if business not found', async () => {
      mockFindUnique.mockResolvedValue(null);

      await expect(
        applySyncFields('biz-missing', ['name'], { name: 'X' }, auditContext),
      ).rejects.toThrow('Business not found');
    });

    it('maps description to multilingual format', async () => {
      mockFindUnique.mockResolvedValue(mockBusiness);
      mockUpdate.mockResolvedValue(mockBusiness);
      mockCreateAuditLog.mockResolvedValue(undefined);

      await applySyncFields(
        'biz-1',
        ['description'],
        { description: 'New Google description' },
        auditContext,
      );

      const updateCall = mockUpdate.mock.calls[0][0];
      expect(updateCall.data.description).toEqual({ en: 'New Google description' });
    });

    it('adds byAppointment:false to operating hours', async () => {
      mockFindUnique.mockResolvedValue(mockBusiness);
      mockUpdate.mockResolvedValue(mockBusiness);
      mockCreateAuditLog.mockResolvedValue(undefined);

      await applySyncFields(
        'biz-1',
        ['operatingHours'],
        { operatingHours: { monday: { open: '09:00', close: '17:00', closed: false } } },
        auditContext,
      );

      const updateCall = mockUpdate.mock.calls[0][0];
      expect(updateCall.data.operating_hours.monday).toEqual({
        open: '09:00',
        close: '17:00',
        closed: false,
        byAppointment: false,
      });
    });

    it('skips fields with no GBP data', async () => {
      mockFindUnique.mockResolvedValue(mockBusiness);
      mockUpdate.mockResolvedValue(mockBusiness);
      mockCreateAuditLog.mockResolvedValue(undefined);

      const result = await applySyncFields(
        'biz-1',
        ['name', 'website'],
        { name: 'New Name' }, // website not provided
        auditContext,
      );

      expect(result.fieldsUpdated).toEqual(['name']);
      const updateCall = mockUpdate.mock.calls[0][0];
      expect(updateCall.data.website).toBeUndefined();
    });
  });

  describe('getSyncStatus', () => {
    it('returns status for a business with GBP connected', async () => {
      mockFindUnique.mockResolvedValue({
        gbp_last_sync_at: new Date('2026-03-26T10:00:00Z'),
        gbp_sync_status: 'SUCCESS',
      });
      mockFindFirst.mockResolvedValue({
        platform_account_name: 'My Business',
      });

      const result = await getSyncStatus('biz-1');

      expect(result.isGbpConnected).toBe(true);
      expect(result.syncStatus).toBe('SUCCESS');
      expect(result.locationName).toBe('My Business');
      expect(result.lastSyncAt).toBe('2026-03-26T10:00:00.000Z');
    });

    it('returns disconnected status when no GBP account', async () => {
      mockFindUnique.mockResolvedValue({
        gbp_last_sync_at: null,
        gbp_sync_status: null,
      });
      mockFindFirst.mockResolvedValue(null);

      const result = await getSyncStatus('biz-1');

      expect(result.isGbpConnected).toBe(false);
      expect(result.syncStatus).toBeNull();
      expect(result.locationName).toBeNull();
    });

    it('throws if business not found', async () => {
      mockFindUnique.mockResolvedValue(null);

      await expect(getSyncStatus('biz-missing')).rejects.toThrow('Business not found');
    });
  });
});
