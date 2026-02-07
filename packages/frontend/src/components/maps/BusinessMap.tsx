import { useMemo, useState } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl';
import { DEFAULT_MAP_STYLE, DEFAULT_ZOOM } from '../../services/maps/mapbox-config';
import { MapFallback } from './MapFallback';
import { MapMarker } from './MapMarker';

interface BusinessMapProps {
  latitude: number;
  longitude: number;
  businessName: string;
  address: string;
  className?: string;
}

/**
 * Interactive map showing single business location
 * Spec §4.3 Business Profile - Location & Map
 * WCAG 2.1 AA: Keyboard navigable, ARIA labeled
 */
export function BusinessMap({
  latitude,
  longitude,
  businessName,
  address,
  className = '',
}: BusinessMapProps) {
  const [mapError, setMapError] = useState(false);

  // Initial viewport centered on business
  const initialViewState = useMemo(
    () => ({
      latitude,
      longitude,
      zoom: DEFAULT_ZOOM,
    }),
    [latitude, longitude]
  );

  // Fallback to static address if Mapbox fails
  if (mapError) {
    return <MapFallback address={address} />;
  }

  return (
    <div
      className={`relative w-full h-96 rounded-lg overflow-hidden ${className}`}
      role="region"
      aria-label={`Map showing location of ${businessName}`}
    >
      <Map
        initialViewState={initialViewState}
        style={{ width: '100%', height: '100%' }}
        mapStyle={DEFAULT_MAP_STYLE}
        onError={() => setMapError(true)}
        cooperativeGestures // Requires Ctrl+scroll to zoom (accessibility)
        attributionControl={true}
      >
        <NavigationControl position="top-right" visualizePitch={false} />
        <Marker longitude={longitude} latitude={latitude} anchor="bottom">
          <MapMarker businessName={businessName} />
        </Marker>
      </Map>
    </div>
  );
}
