import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { GeocodeResult } from '../../services/maps/types.js';

// Mock dependencies before import
const mockGeocodeAddress = vi.fn();

vi.mock('../../services/maps/geocoding-service.js', () => ({
  geocodeAddress: (...args: unknown[]) => mockGeocodeAddress(...args),
}));

vi.mock('../../utils/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// Mock validation middleware to pass through
vi.mock('../../middleware/validate.js', () => ({
  validate: () => (req: any, res: any, next: any) => next(),
}));

// Import router after mocks
const { geocodingRouter } = await import('../../routes/geocoding.js');

// Minimal Express-like test harness
type Handler = (req: unknown, res: unknown, next?: unknown) => void;

interface RouteLayer {
  route?: {
    path: string;
    method?: string;
    stack: Array<{ handle: Handler; method?: string }>;
  };
}

function createTestApp() {
  const routes = new Map<string, { handler: Handler; method: string }>();

  // Walk the router stack to extract route handlers
  const stack = (geocodingRouter as unknown as { stack: RouteLayer[] }).stack;
  for (const layer of stack) {
    if (layer.route) {
      // Find POST handlers
      for (const layerHandler of layer.route.stack) {
        if (layerHandler.handle) {
          const method = layerHandler.method || 'get';
          routes.set(layer.route.path, {
            handler: layerHandler.handle,
            method: method.toLowerCase(),
          });
        }
      }
    }
  }

  return {
    async post(path: string, body: unknown) {
      const route = routes.get(path);
      if (!route) throw new Error(`No route for ${path}`);
      if (route.method !== 'post') throw new Error(`Route ${path} is not POST`);

      let statusCode = 200;
      let responseBody: unknown;
      const req = { body };
      const res = {
        status(code: number) {
          statusCode = code;
          return res;
        },
        json(data: unknown) {
          responseBody = data;
          return res;
        },
      };

      await route.handler(req as unknown, res);
      return { statusCode, body: responseBody as Record<string, unknown> };
    },
  };
}

describe('geocoding routes', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();
  });

  describe('POST /geocode', () => {
    it('should geocode a valid address', async () => {
      const requestBody = {
        street: '123 Main Street',
        suburb: 'Guildford',
        postcode: '2161',
        country: 'Australia',
      };

      const mockResult: GeocodeResult = {
        latitude: -33.8567,
        longitude: 150.9876,
        formattedAddress: '123 Main Street, Guildford NSW 2161, Australia',
        confidence: 'high',
      };

      mockGeocodeAddress.mockResolvedValue(mockResult);

      const { statusCode, body } = await app.post('/geocode', requestBody);

      expect(statusCode).toBe(200);
      expect(body).toMatchObject({
        success: true,
        data: mockResult,
      });

      expect(mockGeocodeAddress).toHaveBeenCalledWith(requestBody);
    });

    it('should handle geocoding without country (defaults to Australia)', async () => {
      const requestBody = {
        street: '456 Park Avenue',
        suburb: 'Guildford',
        postcode: '2161',
      };

      const mockResult: GeocodeResult = {
        latitude: -33.86,
        longitude: 150.99,
        formattedAddress: '456 Park Avenue, Guildford NSW 2161, Australia',
        confidence: 'medium',
      };

      mockGeocodeAddress.mockResolvedValue(mockResult);

      const { statusCode, body } = await app.post('/geocode', requestBody);

      expect(statusCode).toBe(200);
      expect(body).toMatchObject({
        success: true,
        data: mockResult,
      });
    });

    it('should return medium confidence result', async () => {
      const requestBody = {
        street: '789 Test Road',
        suburb: 'Guildford',
        postcode: '2161',
      };

      const mockResult: GeocodeResult = {
        latitude: -33.85,
        longitude: 150.98,
        formattedAddress: '789 Test Road, Guildford NSW 2161, Australia',
        confidence: 'medium',
      };

      mockGeocodeAddress.mockResolvedValue(mockResult);

      const { statusCode, body } = await app.post('/geocode', requestBody);

      expect(statusCode).toBe(200);
      const data = body['data'] as GeocodeResult;
      expect(data.confidence).toBe('medium');
    });

    it('should return low confidence result', async () => {
      const requestBody = {
        street: '999 Vague Address',
        suburb: 'Guildford',
        postcode: '2161',
      };

      const mockResult: GeocodeResult = {
        latitude: -33.85,
        longitude: 150.98,
        formattedAddress: 'Guildford NSW 2161, Australia',
        confidence: 'low',
      };

      mockGeocodeAddress.mockResolvedValue(mockResult);

      const { statusCode, body } = await app.post('/geocode', requestBody);

      expect(statusCode).toBe(200);
      const data = body['data'] as GeocodeResult;
      expect(data.confidence).toBe('low');
    });

    it('should return 400 when address not found', async () => {
      const requestBody = {
        street: 'Nonexistent Street',
        suburb: 'Nowhere',
        postcode: '9999',
      };

      mockGeocodeAddress.mockRejectedValue(new Error('Address not found'));

      const { statusCode, body } = await app.post('/geocode', requestBody);

      expect(statusCode).toBe(400);
      expect(body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'GEOCODING_FAILED',
          message: 'Address not found',
        }),
      });
    });

    it('should return 400 when address outside coverage area', async () => {
      const requestBody = {
        street: '123 Far Street',
        suburb: 'Melbourne',
        postcode: '3000',
      };

      mockGeocodeAddress.mockRejectedValue(
        new Error('Failed to geocode address: 123 Far Street, Melbourne 3000, Australia')
      );

      const { statusCode, body } = await app.post('/geocode', requestBody);

      expect(statusCode).toBe(400);
      expect(body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'GEOCODING_FAILED',
        }),
      });
    });

    it('should return 400 when Mapbox API fails', async () => {
      const requestBody = {
        street: '123 Error Street',
        suburb: 'Guildford',
        postcode: '2161',
      };

      mockGeocodeAddress.mockRejectedValue(new Error('Mapbox API error'));

      const { statusCode, body } = await app.post('/geocode', requestBody);

      expect(statusCode).toBe(400);
      expect(body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'GEOCODING_FAILED',
          message: 'Mapbox API error',
        }),
      });
    });

    it('should handle generic errors', async () => {
      const requestBody = {
        street: '123 Test Street',
        suburb: 'Guildford',
        postcode: '2161',
      };

      // Non-Error thrown
      mockGeocodeAddress.mockRejectedValue('Unexpected error');

      const { statusCode, body } = await app.post('/geocode', requestBody);

      expect(statusCode).toBe(400);
      expect(body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'GEOCODING_FAILED',
          message: 'Geocoding failed',
        }),
      });
    });

    it('should return coordinates within valid range', async () => {
      const requestBody = {
        street: '123 Valid Street',
        suburb: 'Guildford',
        postcode: '2161',
      };

      const mockResult: GeocodeResult = {
        latitude: -33.8567,
        longitude: 150.9876,
        formattedAddress: '123 Valid Street, Guildford NSW 2161, Australia',
        confidence: 'high',
      };

      mockGeocodeAddress.mockResolvedValue(mockResult);

      const { statusCode, body } = await app.post('/geocode', requestBody);

      expect(statusCode).toBe(200);
      const data = body['data'] as GeocodeResult;

      // Validate coordinate ranges
      expect(data.latitude).toBeGreaterThanOrEqual(-90);
      expect(data.latitude).toBeLessThanOrEqual(90);
      expect(data.longitude).toBeGreaterThanOrEqual(-180);
      expect(data.longitude).toBeLessThanOrEqual(180);
    });

    it('should include formatted address in response', async () => {
      const requestBody = {
        street: '123 Test Street',
        suburb: 'Guildford',
        postcode: '2161',
      };

      const mockResult: GeocodeResult = {
        latitude: -33.8567,
        longitude: 150.9876,
        formattedAddress: '123 Test Street, Guildford NSW 2161, Australia',
        confidence: 'high',
      };

      mockGeocodeAddress.mockResolvedValue(mockResult);

      const { statusCode, body } = await app.post('/geocode', requestBody);

      expect(statusCode).toBe(200);
      const data = body['data'] as GeocodeResult;
      expect(data.formattedAddress).toBeTruthy();
      expect(data.formattedAddress).toContain('Guildford');
      expect(data.formattedAddress).toContain('2161');
    });
  });
});
