import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getPlatformConfig } from '../../config/platform-loader';
import { MapFallback } from './MapFallback';

interface BusinessMapProps {
  latitude: number;
  longitude: number;
  businessName: string;
  address: string;
  className?: string;
}

const MAP_STYLE = 'streets-v12';
const DEFAULT_ZOOM = 15;

/**
 * Static map image showing single business location
 * Uses Mapbox Static Images API for fast, lightweight rendering
 * Spec §4.3 Business Profile - Location & Map
 * WCAG 2.1 AA: Alt text, fallback for load failure
 */
export function BusinessMap({
  latitude,
  longitude,
  businessName,
  address,
  className = '',
}: BusinessMapProps) {
  const { t } = useTranslation('business');
  const [imgError, setImgError] = useState(false);
  const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

  // Validate coordinates are finite numbers
  if (!token || imgError || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return <MapFallback address={address} />;
  }

  // Read primary color from platform config (strip leading #)
  const config = getPlatformConfig();
  const markerColor = config.branding.colors.primary.replace('#', '');

  // Mapbox Static Images API with pin marker
  // Use responsive sizes: 600x300 base, @2x for retina
  const marker = `pin-l+${markerColor}(${longitude},${latitude})`;
  const staticUrl = `https://api.mapbox.com/styles/v1/mapbox/${MAP_STYLE}/static/${marker}/${longitude},${latitude},${DEFAULT_ZOOM},0/600x300@2x?access_token=${token}`;

  return (
    <div
      className={`relative w-full rounded-lg overflow-hidden ${className || 'h-64 sm:h-80 md:h-96'}`}
      role="region"
      aria-label={t('mapShowingLocation', { name: businessName })}
    >
      <img
        src={staticUrl}
        alt={t('mapAlt', { name: businessName, address })}
        className="w-full h-full object-cover"
        loading="lazy"
        onError={() => setImgError(true)}
      />
    </div>
  );
}
