import { describe, test, expect } from 'vitest';
import { calculateDistance, formatDistance } from '../../utils/geo';
import type { Coordinates } from '../../types/maps';

describe('calculateDistance', () => {
  test('calculates distance correctly using known coordinates', () => {
    // Guildford to Sydney CBD (approximately 21 km)
    const guildford: Coordinates = { latitude: -33.8567, longitude: 150.9876 };
    const sydney: Coordinates = { latitude: -33.8688, longitude: 151.2093 };

    const distance = calculateDistance(guildford, sydney);

    // Allow 1km margin for Haversine approximation
    expect(distance).toBeGreaterThan(20);
    expect(distance).toBeLessThan(22);
  });

  test('returns 0 for same coordinates', () => {
    const coords: Coordinates = { latitude: -33.8567, longitude: 150.9876 };
    const distance = calculateDistance(coords, coords);

    expect(distance).toBe(0);
  });

  test('calculates short distances accurately', () => {
    // Two points approximately 1km apart
    const point1: Coordinates = { latitude: -33.8567, longitude: 150.9876 };
    const point2: Coordinates = { latitude: -33.8657, longitude: 150.9876 };

    const distance = calculateDistance(point1, point2);

    // Should be around 1km (±0.1km tolerance)
    expect(distance).toBeGreaterThan(0.9);
    expect(distance).toBeLessThan(1.1);
  });

  test('handles distances across hemispheres', () => {
    // Sydney to London (approximately 17,000 km)
    const sydney: Coordinates = { latitude: -33.8688, longitude: 151.2093 };
    const london: Coordinates = { latitude: 51.5074, longitude: -0.1278 };

    const distance = calculateDistance(sydney, london);

    // Allow 500km margin for long distances
    expect(distance).toBeGreaterThan(16500);
    expect(distance).toBeLessThan(17500);
  });

  test('handles crossing the international date line', () => {
    // Fiji (east of date line) to Samoa (west of date line)
    const fiji: Coordinates = { latitude: -18.1248, longitude: 178.4501 };
    const samoa: Coordinates = { latitude: -13.759, longitude: -172.1046 };

    const distance = calculateDistance(fiji, samoa);

    // Approximately 1,120 km (shorter path crosses date line)
    expect(distance).toBeGreaterThan(1000);
    expect(distance).toBeLessThan(1200);
  });

  test('is symmetric (distance A to B equals B to A)', () => {
    const pointA: Coordinates = { latitude: -33.8567, longitude: 150.9876 };
    const pointB: Coordinates = { latitude: -34.9285, longitude: 138.6007 };

    const distanceAB = calculateDistance(pointA, pointB);
    const distanceBA = calculateDistance(pointB, pointA);

    expect(distanceAB).toBe(distanceBA);
  });

  test('handles equatorial crossing', () => {
    // Northern hemisphere to southern hemisphere
    const north: Coordinates = { latitude: 1.3521, longitude: 103.8198 }; // Singapore
    const south: Coordinates = { latitude: -1.2921, longitude: 36.8219 }; // Nairobi

    const distance = calculateDistance(north, south);

    // Approximately 7,455 km
    expect(distance).toBeGreaterThan(7400);
    expect(distance).toBeLessThan(7500);
  });

  test('precision is to 2 decimal places', () => {
    const point1: Coordinates = { latitude: -33.8567, longitude: 150.9876 };
    const point2: Coordinates = { latitude: -33.8568, longitude: 150.9877 };

    const distance = calculateDistance(point1, point2);

    // Should have at most 2 decimal places (10m precision)
    const decimalPlaces = (distance.toString().split('.')[1] || '').length;
    expect(decimalPlaces).toBeLessThanOrEqual(2);
  });

  test('throws error for invalid latitude > 90', () => {
    const invalid: Coordinates = { latitude: 100, longitude: 0 };
    const valid: Coordinates = { latitude: 0, longitude: 0 };

    expect(() => calculateDistance(invalid, valid)).toThrow('Invalid latitude: 100');
  });

  test('throws error for invalid latitude < -90', () => {
    const invalid: Coordinates = { latitude: -100, longitude: 0 };
    const valid: Coordinates = { latitude: 0, longitude: 0 };

    expect(() => calculateDistance(invalid, valid)).toThrow('Invalid latitude: -100');
  });

  test('throws error for invalid longitude > 180', () => {
    const invalid: Coordinates = { latitude: 0, longitude: 200 };
    const valid: Coordinates = { latitude: 0, longitude: 0 };

    expect(() => calculateDistance(invalid, valid)).toThrow('Invalid longitude: 200');
  });

  test('throws error for invalid longitude < -180', () => {
    const invalid: Coordinates = { latitude: 0, longitude: -200 };
    const valid: Coordinates = { latitude: 0, longitude: 0 };

    expect(() => calculateDistance(invalid, valid)).toThrow('Invalid longitude: -200');
  });

  test('throws error for NaN latitude', () => {
    const invalid: Coordinates = { latitude: NaN, longitude: 0 };
    const valid: Coordinates = { latitude: 0, longitude: 0 };

    expect(() => calculateDistance(invalid, valid)).toThrow('Invalid latitude');
  });

  test('throws error for NaN longitude', () => {
    const invalid: Coordinates = { latitude: 0, longitude: NaN };
    const valid: Coordinates = { latitude: 0, longitude: 0 };

    expect(() => calculateDistance(invalid, valid)).toThrow('Invalid longitude');
  });

  test('throws error for Infinity latitude', () => {
    const invalid: Coordinates = { latitude: Infinity, longitude: 0 };
    const valid: Coordinates = { latitude: 0, longitude: 0 };

    expect(() => calculateDistance(invalid, valid)).toThrow('Invalid latitude');
  });

  test('validates both from and to coordinates', () => {
    const valid: Coordinates = { latitude: -33.8567, longitude: 150.9876 };
    const invalid: Coordinates = { latitude: 0, longitude: 500 };

    expect(() => calculateDistance(valid, invalid)).toThrow('Invalid longitude: 500');
  });
});

describe('formatDistance', () => {
  test('formats distance < 1km as meters', () => {
    const formatted = formatDistance(0.85);
    expect(formatted).toBe('850 m');
  });

  test('formats distance >= 1km as kilometers', () => {
    const formatted = formatDistance(2.345);
    expect(formatted).toBe('2.3 km');
  });

  test('formats very small distances', () => {
    const formatted = formatDistance(0.001); // 1 meter
    expect(formatted).toBe('1 m');
  });

  test('formats very large distances', () => {
    const formatted = formatDistance(17234.56);
    expect(formatted).toBe('17,234.6 km');
  });

  test('handles zero distance', () => {
    const formatted = formatDistance(0);
    expect(formatted).toBe('0 m');
  });

  test('rounds meters to nearest integer', () => {
    const formatted = formatDistance(0.8756); // 875.6 meters
    expect(formatted).toBe('876 m');
  });

  test('formats exactly 1km as kilometers', () => {
    const formatted = formatDistance(1.0);
    expect(formatted).toBe('1.0 km');
  });

  test('formats distances with 1 decimal place for km', () => {
    const formatted = formatDistance(5.789);
    expect(formatted).toBe('5.8 km');
  });

  test('respects locale for number formatting (default en-AU)', () => {
    const formatted = formatDistance(1234.56);
    // en-AU uses comma for thousands separator
    expect(formatted).toBe('1,234.6 km');
  });

  test('supports custom locale', () => {
    const formatted = formatDistance(1234.56, 'de-DE');
    // de-DE uses period for thousands separator
    expect(formatted).toBe('1.234,6 km');
  });

  test('handles edge case: 0.999 km (rounds to 999m)', () => {
    const formatted = formatDistance(0.999);
    expect(formatted).toBe('999 m');
  });

  test('handles edge case: 1.001 km', () => {
    const formatted = formatDistance(1.001);
    expect(formatted).toBe('1.0 km');
  });
});

describe('geo utilities integration', () => {
  test('calculate and format distance in one flow', () => {
    const guildford: Coordinates = { latitude: -33.8567, longitude: 150.9876 };
    const sydney: Coordinates = { latitude: -33.8688, longitude: 151.2093 };

    const distance = calculateDistance(guildford, sydney);
    const formatted = formatDistance(distance);

    // Should be around "21.0 km"
    expect(formatted).toContain('km');
    expect(formatted).toMatch(/2\d\.\d km/);
  });

  test('calculate and format short distance', () => {
    const point1: Coordinates = { latitude: -33.8567, longitude: 150.9876 };
    const point2: Coordinates = { latitude: -33.8577, longitude: 150.9876 };

    const distance = calculateDistance(point1, point2);
    const formatted = formatDistance(distance);

    // Should be in meters (< 1km)
    expect(formatted).toContain('m');
    expect(formatted).not.toContain('km');
  });
});
