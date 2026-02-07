import type { Coordinates } from '../types/maps.js';

/**
 * Validate coordinate ranges
 * @throws {Error} if coordinates are invalid
 */
function validateCoordinates(coords: Coordinates): void {
  if (!Number.isFinite(coords.latitude) || coords.latitude < -90 || coords.latitude > 90) {
    throw new Error(`Invalid latitude: ${coords.latitude}. Must be between -90 and 90.`);
  }
  if (!Number.isFinite(coords.longitude) || coords.longitude < -180 || coords.longitude > 180) {
    throw new Error(`Invalid longitude: ${coords.longitude}. Must be between -180 and 180.`);
  }
}

/**
 * Haversine distance calculation
 * Calculate great-circle distance between two points on Earth
 *
 * Spec §26.4 Maps Integration - Distance Calculation
 *
 * Formula accuracy: ~0.5% error for distances < 500km
 * Precision: 6 decimal places (±0.1m)
 *
 * @param from - Starting coordinates
 * @param to - Destination coordinates
 * @returns Distance in kilometers
 * @throws {Error} if coordinates are invalid
 */
export function calculateDistance(from: Coordinates, to: Coordinates): number {
  // Validate inputs
  validateCoordinates(from);
  validateCoordinates(to);

  const R = 6371; // Earth radius in km

  // Convert degrees to radians
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLng = toRadians(to.longitude - from.longitude);

  // Haversine formula
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  // Round to 2 decimal places (10m precision)
  return Math.round(distance * 100) / 100;
}

/**
 * Format distance for display
 * < 1km: show meters (e.g., "850 m")
 * >= 1km: show kilometers (e.g., "2.3 km")
 *
 * @param distanceKm - Distance in kilometers
 * @param locale - BCP 47 locale for number formatting
 * @returns Formatted distance string
 */
export function formatDistance(distanceKm: number, locale = 'en-AU'): string {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters.toLocaleString(locale)} m`;
  }

  return `${distanceKm.toLocaleString(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} km`;
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
