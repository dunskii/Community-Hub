import { geocodingClient } from './mapbox-client.js';
import { cacheService } from '../../cache/cache-service.js';
import { logger } from '../../utils/logger.js';
import { getPlatformConfig } from '../../config/platform-loader.js';
import type { GeocodeRequest, GeocodeResult, BoundingBox } from './types.js';

const GEOCODE_CACHE_TTL = 30 * 24 * 60 * 60; // 30 days in seconds

/**
 * Forward geocode: address string to coordinates
 * Spec §26.4 Maps Integration - Geocoding
 *
 * Features:
 * - Results cached in Redis (30-day TTL)
 * - Validates coordinates within platform bounding box
 * - Confidence scoring based on Mapbox relevance
 *
 * @throws {Error} if address cannot be geocoded or is outside bounds
 */
export async function geocodeAddress(request: GeocodeRequest): Promise<GeocodeResult> {
  const { street, suburb, postcode, country = 'Australia' } = request;

  // Sanitize inputs: trim whitespace, normalize spacing, remove control characters
  const cleanStreet = street.trim().replace(/\s+/g, ' ').replace(/[\x00-\x1F\x7F]/g, '');
  const cleanSuburb = suburb.trim().replace(/\s+/g, ' ').replace(/[\x00-\x1F\x7F]/g, '');
  const cleanPostcode = postcode.trim();
  const cleanCountry = country.trim();

  // Build full address string
  const fullAddress = `${cleanStreet}, ${cleanSuburb} ${cleanPostcode}, ${cleanCountry}`;

  // Check cache first
  const cacheKey = `geocode:${fullAddress.toLowerCase()}`;
  const cached = await cacheService.get<GeocodeResult>(cacheKey);
  if (cached) {
    logger.debug({ address: fullAddress }, 'Geocode cache hit');
    return cached;
  }

  // Call Mapbox Geocoding API
  try {
    const response = await geocodingClient
      .forwardGeocode({
        query: fullAddress,
        limit: 1,
        countries: ['AU'], // Restrict to Australia for performance
      })
      .send();

    if (!response.body.features || response.body.features.length === 0) {
      throw new Error('Address not found');
    }

    const feature = response.body.features[0];
    if (!feature) {
      throw new Error('Address not found');
    }

    const [longitude, latitude] = feature.center;

    // Validate coordinates within platform bounding box
    const config = getPlatformConfig();
    const { boundingBox } = config.location;
    if (!isWithinBounds({ latitude, longitude }, boundingBox)) {
      throw new Error('Address is outside platform coverage area');
    }

    // Determine confidence based on relevance score
    const relevance = feature.relevance ?? 0;
    const confidence: 'high' | 'medium' | 'low' =
      relevance > 0.9 ? 'high' : relevance > 0.7 ? 'medium' : 'low';

    const result: GeocodeResult = {
      latitude,
      longitude,
      formattedAddress: feature.place_name,
      confidence,
    };

    // Cache result
    await cacheService.set(cacheKey, result, GEOCODE_CACHE_TTL);

    logger.info(
      {
        address: fullAddress,
        coordinates: { latitude, longitude },
        confidence,
      },
      'Address geocoded successfully'
    );

    return result;
  } catch (error) {
    logger.error({ address: fullAddress, error }, 'Geocoding failed');
    throw new Error(`Failed to geocode address: ${fullAddress}`);
  }
}

/**
 * Reverse geocode: coordinates to address
 * Used for emergency alert boundaries, user location detection
 */
export async function reverseGeocode(latitude: number, longitude: number): Promise<string> {
  const cacheKey = `reverse:${latitude},${longitude}`;
  const cached = await cacheService.get<string>(cacheKey);
  if (cached) return cached;

  try {
    const response = await geocodingClient
      .reverseGeocode({
        query: [longitude, latitude],
        limit: 1,
      })
      .send();

    if (!response.body.features || response.body.features.length === 0) {
      throw new Error('No address found for coordinates');
    }

    const feature = response.body.features[0];
    if (!feature) {
      throw new Error('No address found for coordinates');
    }

    const address = feature.place_name;
    await cacheService.set(cacheKey, address, GEOCODE_CACHE_TTL);

    return address;
  } catch (error) {
    logger.error({ latitude, longitude, error }, 'Reverse geocoding failed');
    throw new Error('Failed to reverse geocode coordinates');
  }
}

/**
 * Check if coordinates are within platform's bounding box
 * Spec §2.4 platform.json - location.boundingBox
 */
function isWithinBounds(
  coords: { latitude: number; longitude: number },
  bbox: BoundingBox
): boolean {
  return (
    coords.latitude >= bbox.south &&
    coords.latitude <= bbox.north &&
    coords.longitude >= bbox.west &&
    coords.longitude <= bbox.east
  );
}
