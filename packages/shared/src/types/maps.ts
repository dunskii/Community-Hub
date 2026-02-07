/**
 * Shared Maps Type Definitions
 * Used by both frontend and backend
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface DistanceFilter {
  userLocation: Coordinates;
  maxDistanceKm: number;
}
