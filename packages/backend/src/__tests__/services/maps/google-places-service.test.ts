/**
 * Unit tests for Google Places Service
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { searchAndEnrichBusiness, batchEnrichBusinesses } from '../../../services/maps/google-places-service.js';

// Mock dependencies
vi.mock('../../../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../../config/platform-loader.js', () => ({
  getPlatformConfig: vi.fn(() => ({
    location: {
      country: 'Australia',
    },
  })),
}));

// ─── Helpers ──────────────────────────────────────────────

const VALID_PLACE_RESPONSE = {
  places: [
    {
      id: 'ChIJ_test123',
      displayName: { text: 'Test Bakery' },
      formattedAddress: '123 Main St, Guildford NSW 2161, Australia',
      addressComponents: [
        { longText: '123', shortText: '123', types: ['street_number'] },
        { longText: 'Main Street', shortText: 'Main St', types: ['route'] },
        { longText: 'Guildford', shortText: 'Guildford', types: ['locality'] },
        { longText: 'New South Wales', shortText: 'NSW', types: ['administrative_area_level_1'] },
        { longText: '2161', shortText: '2161', types: ['postal_code'] },
        { longText: 'Australia', shortText: 'AU', types: ['country'] },
      ],
      location: { latitude: -33.8548, longitude: 150.9915 },
      nationalPhoneNumber: '(02) 9632 1234',
      websiteUri: 'https://testbakery.com.au',
      googleMapsUri: 'https://maps.google.com/?cid=12345',
      regularOpeningHours: {
        periods: [
          { open: { day: 1, hour: 7, minute: 0 }, close: { day: 1, hour: 17, minute: 30 } },
          { open: { day: 2, hour: 7, minute: 0 }, close: { day: 2, hour: 17, minute: 30 } },
          { open: { day: 3, hour: 7, minute: 0 }, close: { day: 3, hour: 17, minute: 30 } },
          { open: { day: 4, hour: 7, minute: 0 }, close: { day: 4, hour: 17, minute: 30 } },
          { open: { day: 5, hour: 7, minute: 0 }, close: { day: 5, hour: 17, minute: 30 } },
          { open: { day: 6, hour: 8, minute: 0 }, close: { day: 6, hour: 14, minute: 0 } },
        ],
      },
      rating: 4.5,
      userRatingCount: 120,
      primaryTypeDisplayName: { text: 'Bakery' },
    },
  ],
};

function mockFetchSuccess(data: unknown) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(data),
  });
}

function mockFetchFailure(status: number) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
    status,
    text: () => Promise.resolve('API error'),
  });
}

// ─── Tests ────────────────────────────────────────────────

describe('google-places-service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, GOOGLE_PLACES_API_KEY: 'test-api-key' };
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('searchAndEnrichBusiness', () => {
    test('returns enriched data for a valid place result', async () => {
      mockFetchSuccess(VALID_PLACE_RESPONSE);

      const result = await searchAndEnrichBusiness({ name: 'Test Bakery', address: 'Guildford' });

      expect(result).not.toBeNull();
      expect(result!.name).toBe('Test Bakery');
      expect(result!.street).toBe('123 Main Street');
      expect(result!.suburb).toBe('Guildford');
      expect(result!.state).toBe('New South Wales');
      expect(result!.postcode).toBe('2161');
      expect(result!.country).toBe('Australia');
      expect(result!.phone).toBe('(02) 9632 1234');
      expect(result!.website).toBe('https://testbakery.com.au');
      expect(result!.googlePlaceId).toBe('ChIJ_test123');
      expect(result!.latitude).toBe(-33.8548);
      expect(result!.longitude).toBe(150.9915);
      expect(result!.rating).toBe(4.5);
      expect(result!.userRatingCount).toBe(120);
      expect(result!.businessType).toBe('Bakery');
    });

    test('correctly parses operating hours', async () => {
      mockFetchSuccess(VALID_PLACE_RESPONSE);

      const result = await searchAndEnrichBusiness({ name: 'Test Bakery' });

      expect(result!.operatingHours).not.toBeNull();
      expect(result!.operatingHours!.monday).toEqual({ open: '07:00', close: '17:30' });
      expect(result!.operatingHours!.saturday).toEqual({ open: '08:00', close: '14:00' });
      expect(result!.operatingHours!.sunday).toBeUndefined();
    });

    test('sends correct API request with field mask', async () => {
      mockFetchSuccess(VALID_PLACE_RESPONSE);

      await searchAndEnrichBusiness({ name: 'Test Bakery', address: '123 Main St' });

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const [url, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain('places.googleapis.com/v1/places:searchText');
      expect(options.method).toBe('POST');
      expect(options.headers).toHaveProperty('X-Goog-Api-Key', 'test-api-key');
      expect(options.headers).toHaveProperty('X-Goog-FieldMask');
      const body = JSON.parse(options.body as string);
      expect(body.textQuery).toBe('Test Bakery, 123 Main St');
    });

    test('returns null when no places found', async () => {
      mockFetchSuccess({ places: [] });

      const result = await searchAndEnrichBusiness({ name: 'NonExistent Business' });
      expect(result).toBeNull();
    });

    test('returns null when API returns empty response', async () => {
      mockFetchSuccess({});

      const result = await searchAndEnrichBusiness({ name: 'Test' });
      expect(result).toBeNull();
    });

    test('returns null on API error', async () => {
      mockFetchFailure(500);

      const result = await searchAndEnrichBusiness({ name: 'Test' });
      expect(result).toBeNull();
    });

    test('returns null on network error', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await searchAndEnrichBusiness({ name: 'Test' });
      expect(result).toBeNull();
    });

    test('throws when API key is missing', async () => {
      delete process.env.GOOGLE_PLACES_API_KEY;
      delete process.env.GOOGLE_BUSINESS_API_KEY;

      await expect(searchAndEnrichBusiness({ name: 'Test' })).rejects.toThrow(
        'GOOGLE_PLACES_API_KEY or GOOGLE_BUSINESS_API_KEY environment variable is required',
      );
    });

    test('falls back to GOOGLE_BUSINESS_API_KEY', async () => {
      delete process.env.GOOGLE_PLACES_API_KEY;
      process.env.GOOGLE_BUSINESS_API_KEY = 'fallback-key';
      mockFetchSuccess(VALID_PLACE_RESPONSE);

      await searchAndEnrichBusiness({ name: 'Test' });

      const [, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(options.headers).toHaveProperty('X-Goog-Api-Key', 'fallback-key');
    });

    test('uses platform config country as fallback when country not in address components', async () => {
      const responseWithoutCountry = {
        places: [{
          id: 'test',
          displayName: { text: 'Test' },
          addressComponents: [
            { longText: 'Sydney', shortText: 'Sydney', types: ['locality'] },
          ],
        }],
      };
      mockFetchSuccess(responseWithoutCountry);

      const result = await searchAndEnrichBusiness({ name: 'Test' });
      expect(result!.country).toBe('Australia');
    });

    test('handles place with minimal data', async () => {
      const minimalResponse = {
        places: [{
          id: 'minimal',
          displayName: { text: 'Minimal Business' },
        }],
      };
      mockFetchSuccess(minimalResponse);

      const result = await searchAndEnrichBusiness({ name: 'Minimal' });

      expect(result).not.toBeNull();
      expect(result!.name).toBe('Minimal Business');
      expect(result!.phone).toBe('');
      expect(result!.website).toBe('');
      expect(result!.operatingHours).toBeNull();
      expect(result!.rating).toBeNull();
    });

    test('handles opening hours with no close time (24h)', async () => {
      const response24h = {
        places: [{
          id: 'test',
          displayName: { text: 'Test' },
          regularOpeningHours: {
            periods: [
              { open: { day: 0, hour: 0, minute: 0 } }, // Sunday, 24h, no close
            ],
          },
        }],
      };
      mockFetchSuccess(response24h);

      const result = await searchAndEnrichBusiness({ name: 'Test' });
      expect(result!.operatingHours!.sunday).toEqual({ open: '00:00', close: '23:59' });
    });
  });

  describe('batchEnrichBusinesses', () => {
    test('enriches multiple businesses sequentially', async () => {
      let callCount = 0;
      global.fetch = vi.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            places: [{
              id: `place-${callCount}`,
              displayName: { text: `Business ${callCount}` },
            }],
          }),
        });
      });

      const results = await batchEnrichBusinesses([
        { name: 'Business 1' },
        { name: 'Business 2' },
      ]);

      expect(results).toHaveLength(2);
      expect(results[0].data).not.toBeNull();
      expect(results[0].data!.name).toBe('Business 1');
      expect(results[1].data).not.toBeNull();
      expect(results[1].data!.name).toBe('Business 2');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    test('returns null data for businesses not found', async () => {
      mockFetchSuccess({ places: [] });

      const results = await batchEnrichBusinesses([{ name: 'Not Found' }]);

      expect(results).toHaveLength(1);
      expect(results[0].data).toBeNull();
      expect(results[0].error).toBeUndefined();
    });

    test('returns error for API key missing', async () => {
      delete process.env.GOOGLE_PLACES_API_KEY;
      delete process.env.GOOGLE_BUSINESS_API_KEY;

      const results = await batchEnrichBusinesses([{ name: 'Test' }]);

      expect(results).toHaveLength(1);
      expect(results[0].data).toBeNull();
      expect(results[0].error).toContain('GOOGLE_PLACES_API_KEY');
    });

    test('handles empty input array', async () => {
      const results = await batchEnrichBusinesses([]);
      expect(results).toHaveLength(0);
    });
  });
});
