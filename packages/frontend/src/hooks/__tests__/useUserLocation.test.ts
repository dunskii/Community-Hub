import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useUserLocation } from '../useUserLocation';
import type { Coordinates } from '@community-hub/shared';

describe('useUserLocation', () => {
  let mockGeolocation: {
    getCurrentPosition: ReturnType<typeof vi.fn>;
  };

  let localStorageData: Map<string, string>;

  beforeEach(() => {
    // Mock localStorage
    localStorageData = new Map();
    global.localStorage = {
      getItem: vi.fn((key: string) => localStorageData.get(key) || null),
      setItem: vi.fn((key: string, value: string) => localStorageData.set(key, value)),
      removeItem: vi.fn((key: string) => localStorageData.delete(key)),
      clear: vi.fn(() => localStorageData.clear()),
      length: 0,
      key: vi.fn(),
    };

    // Mock navigator.geolocation
    mockGeolocation = {
      getCurrentPosition: vi.fn(),
    };
    Object.defineProperty(global.navigator, 'geolocation', {
      writable: true,
      value: mockGeolocation,
    });

    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorageData.clear();
  });

  describe('initialization', () => {
    test('initializes with null location when no cached data', () => {
      const { result } = renderHook(() => useUserLocation());

      expect(result.current.location).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.requestPermission).toBeInstanceOf(Function);
    });

    test('loads cached location from localStorage', () => {
      const cachedLocation: Coordinates = {
        latitude: -33.8567,
        longitude: 150.9876,
      };

      localStorageData.set('userLocation', JSON.stringify(cachedLocation));

      const { result } = renderHook(() => useUserLocation());

      expect(result.current.location).toEqual(cachedLocation);
    });

    test('handles invalid cached data gracefully', () => {
      localStorageData.set('userLocation', 'invalid json');

      const { result } = renderHook(() => useUserLocation());

      expect(result.current.location).toBeNull();
    });
  });

  describe('requestPermission', () => {
    test('successfully retrieves user location', async () => {
      const mockPosition: GeolocationPosition = {
        coords: {
          latitude: -33.8567,
          longitude: 150.9876,
          accuracy: 100,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      const { result } = renderHook(() => useUserLocation());

      await act(async () => {
        await result.current.requestPermission();
      });

      await waitFor(() => {
        expect(result.current.location).toEqual({
          latitude: -33.8567,
          longitude: 150.9876,
        });
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    test('caches location in localStorage on success', async () => {
      const mockPosition: GeolocationPosition = {
        coords: {
          latitude: -33.86,
          longitude: 150.99,
          accuracy: 50,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      const { result } = renderHook(() => useUserLocation());

      await act(async () => {
        await result.current.requestPermission();
      });

      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith(
          'userLocation',
          JSON.stringify({ latitude: -33.86, longitude: 150.99 })
        );
      });
    });

    test('sets loading state during request', async () => {
      let resolvePosition: ((pos: GeolocationPosition) => void) | null = null;

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        resolvePosition = success;
      });

      const { result } = renderHook(() => useUserLocation());

      act(() => {
        result.current.requestPermission();
      });

      // Should be loading immediately
      expect(result.current.loading).toBe(true);

      // Resolve the position
      const mockPosition: GeolocationPosition = {
        coords: {
          latitude: -33.8567,
          longitude: 150.9876,
          accuracy: 100,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      };

      await act(async () => {
        resolvePosition?.(mockPosition);
      });

      // Should no longer be loading
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    test('handles permission denied error', async () => {
      const mockError: GeolocationPositionError = {
        code: 1, // PERMISSION_DENIED
        message: 'User denied Geolocation',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };

      mockGeolocation.getCurrentPosition.mockImplementation((_, error) => {
        error(mockError);
      });

      const { result } = renderHook(() => useUserLocation());

      await act(async () => {
        await result.current.requestPermission();
      });

      await waitFor(() => {
        expect(result.current.error).toBe(
          'Location permission denied. Enable in browser settings.'
        );
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.location).toBeNull();
    });

    test('clears cached location when permission is denied', async () => {
      // Set up cached location
      const cachedLocation = { latitude: -33.8567, longitude: 150.9876 };
      localStorageData.set('userLocation', JSON.stringify(cachedLocation));

      const mockError: GeolocationPositionError = {
        code: 1, // PERMISSION_DENIED
        message: 'User denied Geolocation',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };

      mockGeolocation.getCurrentPosition.mockImplementation((_, error) => {
        error(mockError);
      });

      const { result } = renderHook(() => useUserLocation());

      // Should initially have cached location
      expect(result.current.location).toEqual(cachedLocation);

      await act(async () => {
        await result.current.requestPermission();
      });

      await waitFor(() => {
        // Location should be cleared
        expect(result.current.location).toBeNull();
        expect(localStorage.removeItem).toHaveBeenCalledWith('userLocation');
      });
    });

    test('handles position unavailable error', async () => {
      const mockError: GeolocationPositionError = {
        code: 2, // POSITION_UNAVAILABLE
        message: 'Position unavailable',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };

      mockGeolocation.getCurrentPosition.mockImplementation((_, error) => {
        error(mockError);
      });

      const { result } = renderHook(() => useUserLocation());

      await act(async () => {
        await result.current.requestPermission();
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Location information unavailable');
      });

      expect(result.current.loading).toBe(false);
    });

    test('handles timeout error', async () => {
      const mockError: GeolocationPositionError = {
        code: 3, // TIMEOUT
        message: 'Timeout',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };

      mockGeolocation.getCurrentPosition.mockImplementation((_, error) => {
        error(mockError);
      });

      const { result } = renderHook(() => useUserLocation());

      await act(async () => {
        await result.current.requestPermission();
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Location request timed out');
      });

      expect(result.current.loading).toBe(false);
    });

    test('handles unknown error code', async () => {
      const mockError: GeolocationPositionError = {
        code: 99, // Unknown
        message: 'Unknown error',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };

      mockGeolocation.getCurrentPosition.mockImplementation((_, error) => {
        error(mockError);
      });

      const { result } = renderHook(() => useUserLocation());

      await act(async () => {
        await result.current.requestPermission();
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Unable to retrieve your location');
      });
    });

    test('handles browser without geolocation support', async () => {
      Object.defineProperty(global.navigator, 'geolocation', {
        writable: true,
        value: undefined,
      });

      const { result } = renderHook(() => useUserLocation());

      await act(async () => {
        await result.current.requestPermission();
      });

      expect(result.current.error).toBe('Geolocation is not supported by your browser');
      expect(result.current.loading).toBe(false);
    });

    test('clears previous error on new request', async () => {
      const mockError: GeolocationPositionError = {
        code: 1,
        message: 'Permission denied',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };

      // First request fails
      mockGeolocation.getCurrentPosition.mockImplementationOnce((_, error) => {
        error(mockError);
      });

      const { result } = renderHook(() => useUserLocation());

      await act(async () => {
        await result.current.requestPermission();
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      // Second request succeeds
      const mockPosition: GeolocationPosition = {
        coords: {
          latitude: -33.8567,
          longitude: 150.9876,
          accuracy: 100,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      };

      mockGeolocation.getCurrentPosition.mockImplementationOnce((success) => {
        success(mockPosition);
      });

      await act(async () => {
        await result.current.requestPermission();
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
        expect(result.current.location).toEqual({
          latitude: -33.8567,
          longitude: 150.9876,
        });
      });
    });

    test('calls getCurrentPosition with correct options', async () => {
      const mockPosition: GeolocationPosition = {
        coords: {
          latitude: -33.8567,
          longitude: 150.9876,
          accuracy: 100,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      const { result } = renderHook(() => useUserLocation());

      await act(async () => {
        await result.current.requestPermission();
      });

      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000,
        }
      );
    });
  });

  describe('edge cases', () => {
    test('handles multiple rapid permission requests', async () => {
      const mockPosition: GeolocationPosition = {
        coords: {
          latitude: -33.8567,
          longitude: 150.9876,
          accuracy: 100,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        setTimeout(() => success(mockPosition), 10);
      });

      const { result } = renderHook(() => useUserLocation());

      // Request multiple times rapidly
      act(() => {
        result.current.requestPermission();
        result.current.requestPermission();
        result.current.requestPermission();
      });

      await waitFor(() => {
        expect(result.current.location).toEqual({
          latitude: -33.8567,
          longitude: 150.9876,
        });
      });

      // Should have called getCurrentPosition 3 times
      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledTimes(3);
    });

    test('handles coordinates at boundary values', async () => {
      const mockPosition: GeolocationPosition = {
        coords: {
          latitude: 90, // North pole
          longitude: -180, // Date line
          accuracy: 100,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      const { result } = renderHook(() => useUserLocation());

      await act(async () => {
        await result.current.requestPermission();
      });

      await waitFor(() => {
        expect(result.current.location).toEqual({
          latitude: 90,
          longitude: -180,
        });
      });
    });

    test('handles zero coordinates (equator/prime meridian)', async () => {
      const mockPosition: GeolocationPosition = {
        coords: {
          latitude: 0,
          longitude: 0,
          accuracy: 100,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      const { result } = renderHook(() => useUserLocation());

      await act(async () => {
        await result.current.requestPermission();
      });

      await waitFor(() => {
        expect(result.current.location).toEqual({
          latitude: 0,
          longitude: 0,
        });
      });
    });
  });
});
