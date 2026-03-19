import mbxGeocoding from '@mapbox/mapbox-sdk/services/geocoding';
import type { GeocodeRequest } from '@mapbox/mapbox-sdk/services/geocoding';
import { logger } from '../../utils/logger.js';
import { env } from '../../config/env-validate.js';
import { getPlatformConfig } from '../../config/platform-loader.js';

/**
 * Lazy-initialized Mapbox Geocoding API client
 * Spec §26.4 Maps Integration
 *
 * The client is created on first use to avoid startup errors when MAPBOX_ACCESS_TOKEN
 * is not configured. This allows the server to start in development mode without
 * requiring all external API keys.
 */
let _geocodingClient: ReturnType<typeof mbxGeocoding> | null = null;

function getGeocodingClient(): ReturnType<typeof mbxGeocoding> {
  if (!_geocodingClient) {
    if (!env.MAPBOX_ACCESS_TOKEN) {
      throw new Error(
        'MAPBOX_ACCESS_TOKEN is not configured. Set it in your .env file to use maps functionality. ' +
        'Get a free token at https://account.mapbox.com/'
      );
    }
    _geocodingClient = mbxGeocoding({
      accessToken: env.MAPBOX_ACCESS_TOKEN,
    });
    logger.info('Mapbox geocoding client initialized');
  }
  return _geocodingClient;
}

/**
 * Export geocoding client that initializes lazily on first access
 */
export const geocodingClient = {
  forwardGeocode: (options: GeocodeRequest) => getGeocodingClient().forwardGeocode(options),
  reverseGeocode: (options: GeocodeRequest) => getGeocodingClient().reverseGeocode(options),
};

/**
 * Verify Mapbox API connectivity
 * Tests with platform's configured location to ensure API is accessible
 */
export async function verifyMapboxConnection(): Promise<boolean> {
  // Skip verification if token is not configured
  if (!env.MAPBOX_ACCESS_TOKEN) {
    logger.warn('Mapbox token not configured - skipping API verification');
    return false;
  }

  try {
    const config = getPlatformConfig();
    // Test with platform's configured location
    const testQuery = `${config.location.suburbName}, ${config.location.country}`;

    const response = await geocodingClient
      .forwardGeocode({
        query: testQuery,
        limit: 1,
      })
      .send();

    if (response.body.features && response.body.features.length > 0) {
      logger.info('Mapbox API connection verified');
      return true;
    }
    logger.warn('Mapbox API returned empty results');
    return false;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    logger.error({ err: { message: errorMessage, stack: errorStack } }, 'Mapbox API connection failed');
    return false;
  }
}
