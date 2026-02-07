/**
 * Type declarations for @mapbox/mapbox-sdk
 * The installed @types package doesn't work correctly, so we declare it manually
 */

declare module '@mapbox/mapbox-sdk/services/geocoding' {
  interface GeocodeFeature {
    center: [number, number];
    place_name: string;
    relevance: number;
  }

  interface GeocodeResponse {
    body: {
      features: GeocodeFeature[];
    };
  }

  interface GeocodeRequest {
    query: string | [number, number];
    limit?: number;
    countries?: string[];
  }

  interface GeocodingService {
    forwardGeocode(request: GeocodeRequest): {
      send(): Promise<GeocodeResponse>;
    };
    reverseGeocode(request: GeocodeRequest): {
      send(): Promise<GeocodeResponse>;
    };
  }

  export default function geocoding(config: { accessToken: string }): GeocodingService;
}
