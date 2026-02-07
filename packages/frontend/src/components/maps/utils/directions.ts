import type { Coordinates } from '@community-hub/shared';

/**
 * Platform detection for deep link generation
 */
function detectPlatform(): 'ios' | 'android' | 'desktop' {
  const userAgent = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(userAgent)) return 'ios';
  if (/android/.test(userAgent)) return 'android';
  return 'desktop';
}

/**
 * Generate platform-specific directions deep link
 * Spec §26.4 Maps Integration - Directions Deep Links
 *
 * @param coords - Destination coordinates
 * @param address - Destination address (for fallback)
 * @returns Deep link URL
 */
export function generateDirectionsLink(coords: Coordinates, address: string): string {
  const platform = detectPlatform();
  const { latitude, longitude } = coords;

  switch (platform) {
    case 'ios':
      // Apple Maps (iOS native)
      // Format: maps://maps.apple.com/?daddr=lat,lng
      return `maps://maps.apple.com/?daddr=${latitude},${longitude}`;

    case 'android':
      // Google Maps intent (Android)
      // Format: geo:lat,lng?q=lat,lng(label)
      const label = encodeURIComponent(address);
      return `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`;

    case 'desktop':
    default:
      // Google Maps web (universal fallback)
      // Format: https://www.google.com/maps/dir/?api=1&destination=lat,lng
      return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  }
}

/**
 * Open directions in native app or new tab
 * @returns true if opened successfully, false if blocked by popup blocker
 */
export function openDirections(coords: Coordinates, address: string): boolean {
  const url = generateDirectionsLink(coords, address);
  const newWindow = window.open(url, '_blank', 'noopener,noreferrer');

  // Check if popup was blocked
  if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
    // Popup was blocked - could show user a message or provide alternative
    return false;
  }

  return true;
}
