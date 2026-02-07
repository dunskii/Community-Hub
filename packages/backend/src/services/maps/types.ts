/**
 * Maps Service Type Definitions
 * Spec §26.4 Maps Integration
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface GeocodeRequest {
  street: string;
  suburb: string;
  postcode: string;
  country?: string;
}
