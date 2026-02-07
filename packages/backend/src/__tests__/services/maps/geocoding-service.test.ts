import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { geocodeAddress, reverseGeocode } from '../../../services/maps/geocoding-service.js';
import type { GeocodeRequest, GeocodeResult, BoundingBox } from '../../../services/maps/types.js';

// Mock dependencies
vi.mock('../../../services/maps/mapbox-client.js', () => ({
  geocodingClient: {
    forwardGeocode: vi.fn(),
    reverseGeocode: vi.fn(),
  },
}));

vi.mock('../../../cache/cache-service.js', () => ({
  cacheService: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    invalidatePattern: vi.fn(),
  },
  cache: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    invalidatePattern: vi.fn(),
  },
}));

vi.mock('../../../config/platform-loader.js', () => ({
  getPlatformConfig: vi.fn(() => ({
    location: {
      boundingBox: {
        north: -33.8,
        south: -33.9,
        east: 151.1,
        west: 150.9,
      },
    },
  })),
}));

vi.mock('../../../utils/logger.js', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

import { geocodingClient } from '../../../services/maps/mapbox-client.js';
import { cacheService } from '../../../cache/cache-service.js';
import { getPlatformConfig } from '../../../config/platform-loader.js';

describe('geocodeAddress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('geocodes a valid address successfully', async () => {
    const request: GeocodeRequest = {
      street: '123 Main Street',
      suburb: 'Guildford',
      postcode: '2161',
      country: 'Australia',
    };

    // Mock cache miss
    vi.mocked(cacheService.get).mockResolvedValue(null);

    // Mock Mapbox API response
    const mockResponse = {
      body: {
        features: [
          {
            center: [150.98, -33.85], // [longitude, latitude]
            place_name: '123 Main Street, Guildford NSW 2161, Australia',
            relevance: 0.95,
          },
        ],
      },
    };

    vi.mocked(geocodingClient.forwardGeocode).mockReturnValue({
      send: vi.fn().mockResolvedValue(mockResponse),
    } as any);

    const result = await geocodeAddress(request);

    expect(result).toEqual({
      latitude: -33.85,
      longitude: 150.98,
      formattedAddress: '123 Main Street, Guildford NSW 2161, Australia',
      confidence: 'high',
    });

    // Verify cache was called
    expect(cacheService.set).toHaveBeenCalledWith(
      'geocode:123 main street, guildford 2161, australia',
      result,
      30 * 24 * 60 * 60 // 30 days
    );
  });

  test('returns cached result if available', async () => {
    const request: GeocodeRequest = {
      street: '456 Park Avenue',
      suburb: 'Guildford',
      postcode: '2161',
    };

    const cachedResult: GeocodeResult = {
      latitude: -33.86,
      longitude: 150.99,
      formattedAddress: '456 Park Avenue, Guildford NSW 2161, Australia',
      confidence: 'high',
    };

    // Mock cache hit
    vi.mocked(cacheService.get).mockResolvedValue(cachedResult);

    const result = await geocodeAddress(request);

    expect(result).toEqual(cachedResult);

    // Verify Mapbox API was NOT called
    expect(geocodingClient.forwardGeocode).not.toHaveBeenCalled();
  });

  test('assigns high confidence for relevance > 0.9', async () => {
    const request: GeocodeRequest = {
      street: '789 High Street',
      suburb: 'Guildford',
      postcode: '2161',
    };

    vi.mocked(cacheService.get).mockResolvedValue(null);

    const mockResponse = {
      body: {
        features: [
          {
            center: [150.98, -33.85],
            place_name: '789 High Street, Guildford NSW 2161, Australia',
            relevance: 0.95,
          },
        ],
      },
    };

    vi.mocked(geocodingClient.forwardGeocode).mockReturnValue({
      send: vi.fn().mockResolvedValue(mockResponse),
    } as any);

    const result = await geocodeAddress(request);
    expect(result.confidence).toBe('high');
  });

  test('assigns medium confidence for relevance 0.7-0.9', async () => {
    const request: GeocodeRequest = {
      street: '100 Medium Street',
      suburb: 'Guildford',
      postcode: '2161',
    };

    vi.mocked(cacheService.get).mockResolvedValue(null);

    const mockResponse = {
      body: {
        features: [
          {
            center: [150.98, -33.85],
            place_name: '100 Medium Street, Guildford NSW 2161, Australia',
            relevance: 0.8,
          },
        ],
      },
    };

    vi.mocked(geocodingClient.forwardGeocode).mockReturnValue({
      send: vi.fn().mockResolvedValue(mockResponse),
    } as any);

    const result = await geocodeAddress(request);
    expect(result.confidence).toBe('medium');
  });

  test('assigns low confidence for relevance < 0.7', async () => {
    const request: GeocodeRequest = {
      street: '200 Low Street',
      suburb: 'Guildford',
      postcode: '2161',
    };

    vi.mocked(cacheService.get).mockResolvedValue(null);

    const mockResponse = {
      body: {
        features: [
          {
            center: [150.98, -33.85],
            place_name: '200 Low Street, Guildford NSW 2161, Australia',
            relevance: 0.5,
          },
        ],
      },
    };

    vi.mocked(geocodingClient.forwardGeocode).mockReturnValue({
      send: vi.fn().mockResolvedValue(mockResponse),
    } as any);

    const result = await geocodeAddress(request);
    expect(result.confidence).toBe('low');
  });

  test('rejects address outside bounding box', async () => {
    const request: GeocodeRequest = {
      street: '999 Far Away Street',
      suburb: 'Melbourne',
      postcode: '3000',
      country: 'Australia',
    };

    vi.mocked(cacheService.get).mockResolvedValue(null);

    // Mock response with coordinates outside bounding box
    const mockResponse = {
      body: {
        features: [
          {
            center: [144.96, -37.81], // Melbourne coordinates (outside Guildford bbox)
            place_name: '999 Far Away Street, Melbourne VIC 3000, Australia',
            relevance: 0.95,
          },
        ],
      },
    };

    vi.mocked(geocodingClient.forwardGeocode).mockReturnValue({
      send: vi.fn().mockResolvedValue(mockResponse),
    } as any);

    await expect(geocodeAddress(request)).rejects.toThrow(
      'Failed to geocode address'
    );

    // Verify result was NOT cached
    expect(cacheService.set).not.toHaveBeenCalled();
  });

  test('throws error when address not found', async () => {
    const request: GeocodeRequest = {
      street: 'Nonexistent Street',
      suburb: 'Nowhere',
      postcode: '9999',
    };

    vi.mocked(cacheService.get).mockResolvedValue(null);

    // Mock empty response
    const mockResponse = {
      body: {
        features: [],
      },
    };

    vi.mocked(geocodingClient.forwardGeocode).mockReturnValue({
      send: vi.fn().mockResolvedValue(mockResponse),
    } as any);

    await expect(geocodeAddress(request)).rejects.toThrow('Failed to geocode address');
  });

  test('throws error when Mapbox API fails', async () => {
    const request: GeocodeRequest = {
      street: '123 Error Street',
      suburb: 'Guildford',
      postcode: '2161',
    };

    vi.mocked(cacheService.get).mockResolvedValue(null);

    // Mock API error
    vi.mocked(geocodingClient.forwardGeocode).mockReturnValue({
      send: vi.fn().mockRejectedValue(new Error('Network error')),
    } as any);

    await expect(geocodeAddress(request)).rejects.toThrow('Failed to geocode address');
  });

  test('defaults to Australia when country not provided', async () => {
    const request: GeocodeRequest = {
      street: '123 Default Street',
      suburb: 'Guildford',
      postcode: '2161',
      // country omitted
    };

    vi.mocked(cacheService.get).mockResolvedValue(null);

    const mockResponse = {
      body: {
        features: [
          {
            center: [150.98, -33.85],
            place_name: '123 Default Street, Guildford NSW 2161, Australia',
            relevance: 0.95,
          },
        ],
      },
    };

    const mockForwardGeocode = vi.fn().mockReturnValue({
      send: vi.fn().mockResolvedValue(mockResponse),
    });

    vi.mocked(geocodingClient.forwardGeocode).mockImplementation(mockForwardGeocode);

    await geocodeAddress(request);

    // Verify the query includes "Australia"
    expect(mockForwardGeocode).toHaveBeenCalledWith({
      query: '123 Default Street, Guildford 2161, Australia',
      limit: 1,
      countries: ['AU'],
    });
  });

  test('validates bounding box correctly at edges', async () => {
    const request: GeocodeRequest = {
      street: '1 Edge Street',
      suburb: 'Guildford',
      postcode: '2161',
    };

    vi.mocked(cacheService.get).mockResolvedValue(null);

    // Coordinates exactly on the edge (should pass)
    const mockResponse = {
      body: {
        features: [
          {
            center: [150.9, -33.8], // west, north edges
            place_name: '1 Edge Street, Guildford NSW 2161, Australia',
            relevance: 0.95,
          },
        ],
      },
    };

    vi.mocked(geocodingClient.forwardGeocode).mockReturnValue({
      send: vi.fn().mockResolvedValue(mockResponse),
    } as any);

    const result = await geocodeAddress(request);
    expect(result.latitude).toBe(-33.8);
    expect(result.longitude).toBe(150.9);
  });

  test('handles missing relevance score gracefully', async () => {
    const request: GeocodeRequest = {
      street: '123 No Relevance Street',
      suburb: 'Guildford',
      postcode: '2161',
    };

    vi.mocked(cacheService.get).mockResolvedValue(null);

    const mockResponse = {
      body: {
        features: [
          {
            center: [150.98, -33.85],
            place_name: '123 No Relevance Street, Guildford NSW 2161, Australia',
            // relevance field missing
          },
        ],
      },
    };

    vi.mocked(geocodingClient.forwardGeocode).mockReturnValue({
      send: vi.fn().mockResolvedValue(mockResponse),
    } as any);

    const result = await geocodeAddress(request);
    expect(result.confidence).toBe('low'); // Default to low when relevance is 0 or missing
  });
});

describe('reverseGeocode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('reverse geocodes coordinates successfully', async () => {
    const latitude = -33.85;
    const longitude = 150.98;

    // Mock cache miss
    vi.mocked(cacheService.get).mockResolvedValue(null);

    // Mock Mapbox API response
    const mockResponse = {
      body: {
        features: [
          {
            place_name: 'Guildford NSW 2161, Australia',
          },
        ],
      },
    };

    vi.mocked(geocodingClient.reverseGeocode).mockReturnValue({
      send: vi.fn().mockResolvedValue(mockResponse),
    } as any);

    const result = await reverseGeocode(latitude, longitude);

    expect(result).toBe('Guildford NSW 2161, Australia');

    // Verify cache was called
    expect(cacheService.set).toHaveBeenCalledWith(
      'reverse:-33.85,150.98',
      result,
      30 * 24 * 60 * 60 // 30 days
    );
  });

  test('returns cached result if available', async () => {
    const latitude = -33.86;
    const longitude = 150.99;

    const cachedAddress = 'Cached Address, NSW 2161, Australia';

    // Mock cache hit
    vi.mocked(cacheService.get).mockResolvedValue(cachedAddress);

    const result = await reverseGeocode(latitude, longitude);

    expect(result).toBe(cachedAddress);

    // Verify Mapbox API was NOT called
    expect(geocodingClient.reverseGeocode).not.toHaveBeenCalled();
  });

  test('throws error when no address found for coordinates', async () => {
    const latitude = 0;
    const longitude = 0;

    vi.mocked(cacheService.get).mockResolvedValue(null);

    // Mock empty response
    const mockResponse = {
      body: {
        features: [],
      },
    };

    vi.mocked(geocodingClient.reverseGeocode).mockReturnValue({
      send: vi.fn().mockResolvedValue(mockResponse),
    } as any);

    await expect(reverseGeocode(latitude, longitude)).rejects.toThrow(
      'Failed to reverse geocode coordinates'
    );
  });

  test('throws error when Mapbox API fails', async () => {
    const latitude = -33.85;
    const longitude = 150.98;

    vi.mocked(cacheService.get).mockResolvedValue(null);

    // Mock API error
    vi.mocked(geocodingClient.reverseGeocode).mockReturnValue({
      send: vi.fn().mockRejectedValue(new Error('Network error')),
    } as any);

    await expect(reverseGeocode(latitude, longitude)).rejects.toThrow(
      'Failed to reverse geocode coordinates'
    );
  });

  test('calls Mapbox API with correct parameters', async () => {
    const latitude = -33.85;
    const longitude = 150.98;

    vi.mocked(cacheService.get).mockResolvedValue(null);

    const mockResponse = {
      body: {
        features: [
          {
            place_name: 'Test Address',
          },
        ],
      },
    };

    const mockReverseGeocode = vi.fn().mockReturnValue({
      send: vi.fn().mockResolvedValue(mockResponse),
    });

    vi.mocked(geocodingClient.reverseGeocode).mockImplementation(mockReverseGeocode);

    await reverseGeocode(latitude, longitude);

    // Verify correct parameters (note: Mapbox expects [lng, lat])
    expect(mockReverseGeocode).toHaveBeenCalledWith({
      query: [longitude, latitude],
      limit: 1,
    });
  });
});

describe('geocoding service integration', () => {
  test('geocoding and reverse geocoding are inverses', async () => {
    // Forward geocode
    const request: GeocodeRequest = {
      street: '123 Test Street',
      suburb: 'Guildford',
      postcode: '2161',
    };

    vi.mocked(cacheService.get).mockResolvedValue(null);

    const mockForwardResponse = {
      body: {
        features: [
          {
            center: [150.98, -33.85],
            place_name: '123 Test Street, Guildford NSW 2161, Australia',
            relevance: 0.95,
          },
        ],
      },
    };

    vi.mocked(geocodingClient.forwardGeocode).mockReturnValue({
      send: vi.fn().mockResolvedValue(mockForwardResponse),
    } as any);

    const forwardResult = await geocodeAddress(request);

    // Clear mocks for reverse geocode
    vi.clearAllMocks();
    vi.mocked(cacheService.get).mockResolvedValue(null);

    const mockReverseResponse = {
      body: {
        features: [
          {
            place_name: '123 Test Street, Guildford NSW 2161, Australia',
          },
        ],
      },
    };

    vi.mocked(geocodingClient.reverseGeocode).mockReturnValue({
      send: vi.fn().mockResolvedValue(mockReverseResponse),
    } as any);

    const reverseResult = await reverseGeocode(forwardResult.latitude, forwardResult.longitude);

    // The reverse geocoded address should match the forward result
    expect(reverseResult).toBe(forwardResult.formattedAddress);
  });
});
