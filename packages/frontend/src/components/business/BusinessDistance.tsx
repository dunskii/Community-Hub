import { calculateDistance, formatDistance, type Coordinates } from '@community-hub/shared';
import { useUserLocation } from '../../hooks/useUserLocation';

interface BusinessDistanceProps {
  businessLocation: Coordinates;
  className?: string;
}

/**
 * Display distance from user to business
 * Spec §4.2 Business Listing - Distance Display
 */
export function BusinessDistance({ businessLocation, className = '' }: BusinessDistanceProps) {
  const { location: userLocation } = useUserLocation();

  if (!userLocation) {
    return null; // Don't show distance if user location unknown
  }

  const distanceKm = calculateDistance(userLocation, businessLocation);
  const formatted = formatDistance(distanceKm);

  return (
    <span className={`text-sm text-text-light ${className}`} aria-label={`${formatted} away`}>
      {formatted} away
    </span>
  );
}
