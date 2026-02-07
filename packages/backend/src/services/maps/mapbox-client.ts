import mbxGeocoding from '@mapbox/mapbox-sdk/services/geocoding';
import { logger } from '../../utils/logger.js';
import { env } from '../../config/env-validate.js';
import { getPlatformConfig } from '../../config/platform-loader.js';

/**
 * Initialize Mapbox Geocoding API client
 * Spec §26.4 Maps Integration
 */
export const geocodingClient = mbxGeocoding({
  accessToken: env.MAPBOX_ACCESS_TOKEN,
});

/**
 * Verify Mapbox API connectivity
 * Tests with platform's configured location to ensure API is accessible
 */
export async function verifyMapboxConnection(): Promise<boolean> {
  try {
    const config = getPlatformConfig();
    // Test with platform's configured location
    const testQuery = `${config.location.suburb}, ${config.location.country}`;

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
    logger.error({ error }, 'Mapbox API connection failed');
    return false;
  }
}
