/**
 * useOnlineStatus Hook
 *
 * [UI/UX Spec v2.2 §12.3 - Offline Behaviour]
 *
 * Detects online/offline status and tracks state transitions.
 * Uses navigator.onLine API with online/offline event listeners.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isOnline, wasOffline } = useOnlineStatus();
 *
 *   useEffect(() => {
 *     if (isOnline && wasOffline) {
 *       // Just came back online - sync data
 *       syncPendingChanges();
 *     }
 *   }, [isOnline, wasOffline]);
 *
 *   if (!isOnline) {
 *     return <OfflineBanner />;
 *   }
 *
 *   return <MainContent />;
 * }
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseOnlineStatusReturn {
  /** Current online status */
  isOnline: boolean;
  /** Whether the user was previously offline (for showing "back online" messages) */
  wasOffline: boolean;
  /** Timestamp of last online transition */
  lastOnlineAt: number | null;
  /** Timestamp of last offline transition */
  lastOfflineAt: number | null;
  /** Reset the wasOffline flag (call after showing reconnection message) */
  clearWasOffline: () => void;
}

/**
 * Hook for detecting online/offline status
 */
export function useOnlineStatus(): UseOnlineStatusReturn {
  // Initial state from navigator.onLine (may not be 100% accurate but good starting point)
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof navigator !== 'undefined') {
      return navigator.onLine;
    }
    return true; // Assume online in SSR
  });

  const [wasOffline, setWasOffline] = useState(false);
  const [lastOnlineAt, setLastOnlineAt] = useState<number | null>(null);
  const [lastOfflineAt, setLastOfflineAt] = useState<number | null>(null);

  // Track if we've been offline at least once
  const hasBeenOffline = useRef(false);

  // Handle going online
  const handleOnline = useCallback(() => {
    setIsOnline(true);
    setLastOnlineAt(Date.now());

    // Only set wasOffline if we actually were offline
    if (hasBeenOffline.current) {
      setWasOffline(true);
    }
  }, []);

  // Handle going offline
  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setLastOfflineAt(Date.now());
    hasBeenOffline.current = true;
  }, []);

  // Clear the wasOffline flag
  const clearWasOffline = useCallback(() => {
    setWasOffline(false);
  }, []);

  // Set up event listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial state
    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return {
    isOnline,
    wasOffline,
    lastOnlineAt,
    lastOfflineAt,
    clearWasOffline,
  };
}

/**
 * Simple hook that just returns online status boolean
 */
export function useIsOnline(): boolean {
  const { isOnline } = useOnlineStatus();
  return isOnline;
}
