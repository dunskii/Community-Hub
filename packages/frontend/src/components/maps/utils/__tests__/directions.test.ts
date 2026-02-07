import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateDirectionsLink, openDirections } from '../directions';
import type { Coordinates } from '@community-hub/shared';

describe('directions utility', () => {
  const mockCoords: Coordinates = {
    latitude: -33.8567,
    longitude: 150.9876,
  };
  const mockAddress = '123 Main Street, Guildford NSW 2161';

  let originalUserAgent: string;
  let windowOpenSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    originalUserAgent = navigator.userAgent;
    windowOpenSpy = vi.fn();
    window.open = windowOpenSpy;
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      writable: true,
      configurable: true,
    });
    vi.clearAllMocks();
  });

  describe('generateDirectionsLink', () => {
    describe('iOS platform', () => {
      beforeEach(() => {
        Object.defineProperty(navigator, 'userAgent', {
          value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
          writable: true,
          configurable: true,
        });
      });

      test('generates Apple Maps deep link for iPhone', () => {
        const link = generateDirectionsLink(mockCoords, mockAddress);
        expect(link).toBe('maps://maps.apple.com/?daddr=-33.8567,150.9876');
      });

      test('uses correct format with negative coordinates', () => {
        const link = generateDirectionsLink(mockCoords, mockAddress);
        expect(link).toContain('daddr=-33.8567,150.9876');
      });

      test('detects iPad as iOS', () => {
        Object.defineProperty(navigator, 'userAgent', {
          value: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X)',
          writable: true,
          configurable: true,
        });

        const link = generateDirectionsLink(mockCoords, mockAddress);
        expect(link).toMatch(/^maps:\/\//);
      });

      test('detects iPod as iOS', () => {
        Object.defineProperty(navigator, 'userAgent', {
          value: 'Mozilla/5.0 (iPod touch; CPU iPhone OS 15_0 like Mac OS X)',
          writable: true,
          configurable: true,
        });

        const link = generateDirectionsLink(mockCoords, mockAddress);
        expect(link).toMatch(/^maps:\/\//);
      });

      test('handles positive coordinates', () => {
        const coords: Coordinates = { latitude: 51.5074, longitude: -0.1278 };
        const link = generateDirectionsLink(coords, 'London');
        expect(link).toBe('maps://maps.apple.com/?daddr=51.5074,-0.1278');
      });

      test('handles zero coordinates', () => {
        const coords: Coordinates = { latitude: 0, longitude: 0 };
        const link = generateDirectionsLink(coords, 'Equator');
        expect(link).toBe('maps://maps.apple.com/?daddr=0,0');
      });
    });

    describe('Android platform', () => {
      beforeEach(() => {
        Object.defineProperty(navigator, 'userAgent', {
          value: 'Mozilla/5.0 (Linux; Android 12; Pixel 6)',
          writable: true,
          configurable: true,
        });
      });

      test('generates Google Maps intent for Android', () => {
        const link = generateDirectionsLink(mockCoords, mockAddress);
        expect(link).toContain('geo:-33.8567,150.9876');
        expect(link).toContain('q=-33.8567,150.9876');
      });

      test('URL encodes the address label', () => {
        const addressWithSpaces = '123 Main Street, Guildford NSW 2161';
        const link = generateDirectionsLink(mockCoords, addressWithSpaces);
        expect(link).toContain(encodeURIComponent(addressWithSpaces));
      });

      test('handles special characters in address', () => {
        const specialAddress = "Joe's Café & Bar, St. Mary's Road";
        const link = generateDirectionsLink(mockCoords, specialAddress);
        expect(link).toContain(encodeURIComponent(specialAddress));
        // Spaces and special characters should be encoded
        expect(link).toContain('%20'); // Space encoded
        expect(link).toContain('%C3%A9'); // é encoded
        expect(link).toContain('%26'); // & encoded
      });

      test('uses correct geo intent format', () => {
        const link = generateDirectionsLink(mockCoords, mockAddress);
        expect(link).toMatch(/^geo:-?\d+\.?\d*,-?\d+\.?\d*\?q=/);
      });

      test('detects various Android user agents', () => {
        const androidAgents = [
          'Mozilla/5.0 (Linux; Android 12; SM-G991B)',
          'Mozilla/5.0 (Linux; Android 11; OnePlus 9)',
          'Mozilla/5.0 (Linux; Android 13; Pixel 7 Pro)',
        ];

        androidAgents.forEach((agent) => {
          Object.defineProperty(navigator, 'userAgent', {
            value: agent,
            writable: true,
            configurable: true,
          });

          const link = generateDirectionsLink(mockCoords, mockAddress);
          expect(link).toMatch(/^geo:/);
        });
      });
    });

    describe('Desktop platform', () => {
      beforeEach(() => {
        Object.defineProperty(navigator, 'userAgent', {
          value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
          writable: true,
          configurable: true,
        });
      });

      test('generates Google Maps web link for desktop', () => {
        const link = generateDirectionsLink(mockCoords, mockAddress);
        expect(link).toBe(
          'https://www.google.com/maps/dir/?api=1&destination=-33.8567,150.9876'
        );
      });

      test('uses HTTPS protocol', () => {
        const link = generateDirectionsLink(mockCoords, mockAddress);
        expect(link).toMatch(/^https:\/\//);
      });

      test('includes Google Maps Directions API v1', () => {
        const link = generateDirectionsLink(mockCoords, mockAddress);
        expect(link).toContain('api=1');
      });

      test('detects macOS as desktop', () => {
        Object.defineProperty(navigator, 'userAgent', {
          value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          writable: true,
          configurable: true,
        });

        const link = generateDirectionsLink(mockCoords, mockAddress);
        expect(link).toMatch(/^https:\/\/www\.google\.com\/maps/);
      });

      test('detects Linux as desktop', () => {
        Object.defineProperty(navigator, 'userAgent', {
          value: 'Mozilla/5.0 (X11; Linux x86_64)',
          writable: true,
          configurable: true,
        });

        const link = generateDirectionsLink(mockCoords, mockAddress);
        expect(link).toMatch(/^https:\/\/www\.google\.com\/maps/);
      });

      test('handles unknown user agents as desktop', () => {
        Object.defineProperty(navigator, 'userAgent', {
          value: 'CustomBrowser/1.0',
          writable: true,
          configurable: true,
        });

        const link = generateDirectionsLink(mockCoords, mockAddress);
        expect(link).toMatch(/^https:\/\/www\.google\.com\/maps/);
      });
    });

    describe('coordinate edge cases', () => {
      test('handles maximum latitude (90°)', () => {
        Object.defineProperty(navigator, 'userAgent', {
          value: 'Desktop',
          writable: true,
          configurable: true,
        });

        const coords: Coordinates = { latitude: 90, longitude: 0 };
        const link = generateDirectionsLink(coords, 'North Pole');
        expect(link).toContain('destination=90,0');
      });

      test('handles minimum latitude (-90°)', () => {
        Object.defineProperty(navigator, 'userAgent', {
          value: 'Desktop',
          writable: true,
          configurable: true,
        });

        const coords: Coordinates = { latitude: -90, longitude: 0 };
        const link = generateDirectionsLink(coords, 'South Pole');
        expect(link).toContain('destination=-90,0');
      });

      test('handles maximum longitude (180°)', () => {
        Object.defineProperty(navigator, 'userAgent', {
          value: 'Desktop',
          writable: true,
          configurable: true,
        });

        const coords: Coordinates = { latitude: 0, longitude: 180 };
        const link = generateDirectionsLink(coords, 'Date Line East');
        expect(link).toContain('destination=0,180');
      });

      test('handles minimum longitude (-180°)', () => {
        Object.defineProperty(navigator, 'userAgent', {
          value: 'Desktop',
          writable: true,
          configurable: true,
        });

        const coords: Coordinates = { latitude: 0, longitude: -180 };
        const link = generateDirectionsLink(coords, 'Date Line West');
        expect(link).toContain('destination=0,-180');
      });

      test('handles high precision coordinates', () => {
        Object.defineProperty(navigator, 'userAgent', {
          value: 'Desktop',
          writable: true,
          configurable: true,
        });

        const coords: Coordinates = { latitude: -33.856789123, longitude: 150.987654321 };
        const link = generateDirectionsLink(coords, 'Precise Location');
        expect(link).toContain('destination=-33.856789123,150.987654321');
      });
    });
  });

  describe('openDirections', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Desktop',
        writable: true,
        configurable: true,
      });
    });

    test('calls window.open with generated link', () => {
      windowOpenSpy.mockReturnValue({ closed: false } as Window);

      const result = openDirections(mockCoords, mockAddress);

      expect(windowOpenSpy).toHaveBeenCalledWith(
        'https://www.google.com/maps/dir/?api=1&destination=-33.8567,150.9876',
        '_blank',
        'noopener,noreferrer'
      );
      expect(result).toBe(true);
    });

    test('opens link in new tab (_blank)', () => {
      windowOpenSpy.mockReturnValue({ closed: false } as Window);

      openDirections(mockCoords, mockAddress);

      const [, target] = windowOpenSpy.mock.calls[0];
      expect(target).toBe('_blank');
    });

    test('uses secure window features (noopener,noreferrer)', () => {
      windowOpenSpy.mockReturnValue({ closed: false } as Window);

      openDirections(mockCoords, mockAddress);

      const [, , features] = windowOpenSpy.mock.calls[0];
      expect(features).toBe('noopener,noreferrer');
    });

    test('opens iOS deep link on iPhone', () => {
      windowOpenSpy.mockReturnValue({ closed: false } as Window);

      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
        writable: true,
        configurable: true,
      });

      openDirections(mockCoords, mockAddress);

      expect(windowOpenSpy).toHaveBeenCalledWith(
        'maps://maps.apple.com/?daddr=-33.8567,150.9876',
        '_blank',
        'noopener,noreferrer'
      );
    });

    test('opens Android intent on Android device', () => {
      windowOpenSpy.mockReturnValue({ closed: false } as Window);

      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 12; Pixel 6)',
        writable: true,
        configurable: true,
      });

      openDirections(mockCoords, mockAddress);

      const [url] = windowOpenSpy.mock.calls[0];
      expect(url).toMatch(/^geo:/);
      expect(url).toContain(encodeURIComponent(mockAddress));
    });

    test('handles multiple calls correctly', () => {
      windowOpenSpy.mockReturnValue({ closed: false } as Window);

      openDirections(mockCoords, mockAddress);
      openDirections(mockCoords, 'Different Address');

      expect(windowOpenSpy).toHaveBeenCalledTimes(2);
    });

    test('returns false when popup is blocked (null)', () => {
      windowOpenSpy.mockReturnValue(null);

      const result = openDirections(mockCoords, mockAddress);

      expect(result).toBe(false);
    });

    test('returns false when popup is blocked (closed)', () => {
      windowOpenSpy.mockReturnValue({ closed: true } as Window);

      const result = openDirections(mockCoords, mockAddress);

      expect(result).toBe(false);
    });

    test('returns false when popup closed status is undefined', () => {
      const mockWindow = {} as Window;
      Object.defineProperty(mockWindow, 'closed', { value: undefined });
      windowOpenSpy.mockReturnValue(mockWindow);

      const result = openDirections(mockCoords, mockAddress);

      expect(result).toBe(false);
    });

    test('returns true when popup opens successfully', () => {
      windowOpenSpy.mockReturnValue({ closed: false } as Window);

      const result = openDirections(mockCoords, mockAddress);

      expect(result).toBe(true);
    });
  });
});
