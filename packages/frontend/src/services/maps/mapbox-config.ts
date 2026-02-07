import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

/**
 * Initialize Mapbox GL JS with access token
 * Token will be loaded from environment at build time
 * Spec §26.4 Maps Integration
 */
export function initializeMapbox(accessToken: string): void {
  mapboxgl.accessToken = accessToken;
}

/**
 * Default map style
 * Using Mapbox Streets v12 (light, accessible)
 */
export const DEFAULT_MAP_STYLE = 'mapbox://styles/mapbox/streets-v12';

/**
 * Default zoom level for single business marker
 */
export const DEFAULT_ZOOM = 15;
