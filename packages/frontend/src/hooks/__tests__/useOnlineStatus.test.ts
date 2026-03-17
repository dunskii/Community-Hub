import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOnlineStatus, useIsOnline } from '../useOnlineStatus';

describe('useOnlineStatus Hook', () => {
  let originalNavigatorOnLine: boolean;
  const onlineListeners: Set<() => void> = new Set();
  const offlineListeners: Set<() => void> = new Set();

  beforeEach(() => {
    // Store original value
    originalNavigatorOnLine = navigator.onLine;

    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
      configurable: true,
    });

    // Clear listener sets
    onlineListeners.clear();
    offlineListeners.clear();

    // Mock window event listeners
    vi.spyOn(window, 'addEventListener').mockImplementation((event, handler) => {
      if (event === 'online') {
        onlineListeners.add(handler as () => void);
      } else if (event === 'offline') {
        offlineListeners.add(handler as () => void);
      }
    });

    vi.spyOn(window, 'removeEventListener').mockImplementation((event, handler) => {
      if (event === 'online') {
        onlineListeners.delete(handler as () => void);
      } else if (event === 'offline') {
        offlineListeners.delete(handler as () => void);
      }
    });
  });

  afterEach(() => {
    // Restore original value
    Object.defineProperty(navigator, 'onLine', {
      value: originalNavigatorOnLine,
      writable: true,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  const goOffline = () => {
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      writable: true,
      configurable: true,
    });
    offlineListeners.forEach((listener) => listener());
  };

  const goOnline = () => {
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
      configurable: true,
    });
    onlineListeners.forEach((listener) => listener());
  };

  describe('initial state', () => {
    it('should return online status when navigator is online', () => {
      Object.defineProperty(navigator, 'onLine', { value: true });
      const { result } = renderHook(() => useOnlineStatus());

      expect(result.current.isOnline).toBe(true);
    });

    it('should return offline status when navigator is offline', () => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      const { result } = renderHook(() => useOnlineStatus());

      expect(result.current.isOnline).toBe(false);
    });

    it('should have wasOffline as false initially', () => {
      const { result } = renderHook(() => useOnlineStatus());

      expect(result.current.wasOffline).toBe(false);
    });

    it('should have null timestamps initially', () => {
      const { result } = renderHook(() => useOnlineStatus());

      expect(result.current.lastOnlineAt).toBe(null);
      expect(result.current.lastOfflineAt).toBe(null);
    });
  });

  describe('online/offline transitions', () => {
    it('should update isOnline when going offline', () => {
      const { result } = renderHook(() => useOnlineStatus());

      expect(result.current.isOnline).toBe(true);

      act(() => {
        goOffline();
      });

      expect(result.current.isOnline).toBe(false);
    });

    it('should update isOnline when going online', () => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      const { result } = renderHook(() => useOnlineStatus());

      expect(result.current.isOnline).toBe(false);

      act(() => {
        goOnline();
      });

      expect(result.current.isOnline).toBe(true);
    });

    it('should set lastOfflineAt when going offline', () => {
      const { result } = renderHook(() => useOnlineStatus());

      const before = Date.now();
      act(() => {
        goOffline();
      });
      const after = Date.now();

      expect(result.current.lastOfflineAt).toBeGreaterThanOrEqual(before);
      expect(result.current.lastOfflineAt).toBeLessThanOrEqual(after);
    });

    it('should set lastOnlineAt when going online', () => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      const { result } = renderHook(() => useOnlineStatus());

      act(() => {
        goOffline(); // Mark as having been offline
      });

      const before = Date.now();
      act(() => {
        goOnline();
      });
      const after = Date.now();

      expect(result.current.lastOnlineAt).toBeGreaterThanOrEqual(before);
      expect(result.current.lastOnlineAt).toBeLessThanOrEqual(after);
    });
  });

  describe('wasOffline tracking', () => {
    it('should set wasOffline when coming back online after being offline', () => {
      const { result } = renderHook(() => useOnlineStatus());

      // Go offline first
      act(() => {
        goOffline();
      });

      expect(result.current.wasOffline).toBe(false);

      // Come back online
      act(() => {
        goOnline();
      });

      expect(result.current.wasOffline).toBe(true);
    });

    it('should not set wasOffline if never went offline', () => {
      const { result } = renderHook(() => useOnlineStatus());

      // Trigger online event without going offline first
      act(() => {
        goOnline();
      });

      expect(result.current.wasOffline).toBe(false);
    });

    it('should clear wasOffline when clearWasOffline is called', () => {
      const { result } = renderHook(() => useOnlineStatus());

      // Go offline then online to set wasOffline
      act(() => {
        goOffline();
      });
      act(() => {
        goOnline();
      });

      expect(result.current.wasOffline).toBe(true);

      act(() => {
        result.current.clearWasOffline();
      });

      expect(result.current.wasOffline).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('should remove event listeners on unmount', () => {
      const { unmount } = renderHook(() => useOnlineStatus());

      expect(onlineListeners.size).toBe(1);
      expect(offlineListeners.size).toBe(1);

      unmount();

      expect(onlineListeners.size).toBe(0);
      expect(offlineListeners.size).toBe(0);
    });
  });
});

describe('useIsOnline Hook', () => {
  let originalNavigatorOnLine: boolean;

  beforeEach(() => {
    originalNavigatorOnLine = navigator.onLine;
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'onLine', {
      value: originalNavigatorOnLine,
      writable: true,
      configurable: true,
    });
  });

  it('should return true when online', () => {
    Object.defineProperty(navigator, 'onLine', { value: true });
    const { result } = renderHook(() => useIsOnline());

    expect(result.current).toBe(true);
  });

  it('should return false when offline', () => {
    Object.defineProperty(navigator, 'onLine', { value: false });
    const { result } = renderHook(() => useIsOnline());

    expect(result.current).toBe(false);
  });
});
