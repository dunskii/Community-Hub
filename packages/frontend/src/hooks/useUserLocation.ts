import { useState } from 'react';
import type { Coordinates } from '@community-hub/shared';

interface UseUserLocationReturn {
  location: Coordinates | null;
  error: string | null;
  loading: boolean;
  requestPermission: () => Promise<void>;
}

/**
 * Hook to get user's current location via browser Geolocation API
 * Spec §1.7.5 Distance Calculation - User Location
 *
 * Features:
 * - Requests permission explicitly
 * - Persists last known location in localStorage
 * - Error handling for permission denial
 *
 * WCAG: User must explicitly grant permission (no automatic request)
 */
export function useUserLocation(): UseUserLocationReturn {
  const [location, setLocation] = useState<Coordinates | null>(() => {
    // Load cached location from localStorage
    const cached = localStorage.getItem('userLocation');
    if (cached) {
      try {
        return JSON.parse(cached) as Coordinates;
      } catch {
        return null;
      }
    }
    return null;
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requestPermission = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: Coordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        setLocation(coords);
        setLoading(false);

        // Cache location
        localStorage.setItem('userLocation', JSON.stringify(coords));
      },
      (err) => {
        let message = 'Unable to retrieve your location';
        if (err.code === err.PERMISSION_DENIED) {
          message = 'Location permission denied. Enable in browser settings.';
          // Clear cached location when permission is explicitly denied
          localStorage.removeItem('userLocation');
          setLocation(null);
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          message = 'Location information unavailable';
        } else if (err.code === err.TIMEOUT) {
          message = 'Location request timed out';
        }

        setError(message);
        setLoading(false);
      },
      {
        enableHighAccuracy: false, // Save battery
        timeout: 10000, // 10 second timeout
        maximumAge: 300000, // Accept 5-minute-old cached position
      }
    );
  };

  return { location, error, loading, requestPermission };
}
