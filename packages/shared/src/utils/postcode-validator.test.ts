/**
 * Unit tests for Australian postcode validator
 */

import { describe, it, expect } from 'vitest';
import { validateAustralianPostcode, formatAustralianPostcode } from './postcode-validator.js';

describe('validateAustralianPostcode', () => {
  describe('valid postcodes', () => {
    it('should accept 4-digit postcodes as strings', () => {
      expect(validateAustralianPostcode('2000')).toBe(true);
      expect(validateAustralianPostcode('3000')).toBe(true);
      expect(validateAustralianPostcode('4000')).toBe(true);
    });

    it('should accept 4-digit postcodes as numbers', () => {
      expect(validateAustralianPostcode(2000)).toBe(true);
      expect(validateAustralianPostcode(3000)).toBe(true);
      expect(validateAustralianPostcode(4000)).toBe(true);
    });

    it('should accept ACT postcodes (0200-0299)', () => {
      expect(validateAustralianPostcode('0200')).toBe(true);
      expect(validateAustralianPostcode('0250')).toBe(true);
      expect(validateAustralianPostcode('0299')).toBe(true);
    });

    it('should accept NSW postcodes (2000-2999)', () => {
      expect(validateAustralianPostcode('2000')).toBe(true);
      expect(validateAustralianPostcode('2161')).toBe(true); // Guildford
      expect(validateAustralianPostcode('2999')).toBe(true);
    });

    it('should accept VIC postcodes (3000-3999)', () => {
      expect(validateAustralianPostcode('3000')).toBe(true);
      expect(validateAustralianPostcode('3500')).toBe(true);
      expect(validateAustralianPostcode('3999')).toBe(true);
    });

    it('should accept QLD postcodes (4000-4999)', () => {
      expect(validateAustralianPostcode('4000')).toBe(true);
      expect(validateAustralianPostcode('4500')).toBe(true);
      expect(validateAustralianPostcode('4999')).toBe(true);
    });

    it('should accept SA postcodes (5000-5999)', () => {
      expect(validateAustralianPostcode('5000')).toBe(true);
      expect(validateAustralianPostcode('5500')).toBe(true);
      expect(validateAustralianPostcode('5999')).toBe(true);
    });

    it('should accept WA postcodes (6000-6999)', () => {
      expect(validateAustralianPostcode('6000')).toBe(true);
      expect(validateAustralianPostcode('6500')).toBe(true);
      expect(validateAustralianPostcode('6999')).toBe(true);
    });

    it('should accept TAS postcodes (7000-7999)', () => {
      expect(validateAustralianPostcode('7000')).toBe(true);
      expect(validateAustralianPostcode('7500')).toBe(true);
      expect(validateAustralianPostcode('7999')).toBe(true);
    });

    it('should accept NT postcodes (0800-0999)', () => {
      expect(validateAustralianPostcode('0800')).toBe(true);
      expect(validateAustralianPostcode('0850')).toBe(true);
      expect(validateAustralianPostcode('0999')).toBe(true);
    });

    it('should accept maximum valid postcode', () => {
      expect(validateAustralianPostcode('9999')).toBe(true);
    });
  });

  describe('invalid postcodes', () => {
    it('should reject empty string', () => {
      expect(validateAustralianPostcode('')).toBe(false);
    });

    it('should reject postcodes below 0200', () => {
      expect(validateAustralianPostcode('0000')).toBe(false);
      expect(validateAustralianPostcode('0100')).toBe(false);
      expect(validateAustralianPostcode('0199')).toBe(false);
    });

    it('should reject postcodes with wrong length', () => {
      expect(validateAustralianPostcode('200')).toBe(false); // Too short
      expect(validateAustralianPostcode('20000')).toBe(false); // Too long
    });

    it('should reject non-numeric postcodes', () => {
      expect(validateAustralianPostcode('abcd')).toBe(false);
      expect(validateAustralianPostcode('20a0')).toBe(false);
      expect(validateAustralianPostcode('NSW2')).toBe(false);
    });

    it('should reject postcodes with spaces or special characters', () => {
      expect(validateAustralianPostcode('2 000')).toBe(false);
      expect(validateAustralianPostcode('2,000')).toBe(false);
      expect(validateAustralianPostcode('2-000')).toBe(false);
    });
  });

  describe('allowed range filtering', () => {
    it('should accept postcode in allowed range', () => {
      const allowedRange = ['2161', '2162', '2163'];
      expect(validateAustralianPostcode('2161', allowedRange)).toBe(true);
      expect(validateAustralianPostcode('2162', allowedRange)).toBe(true);
    });

    it('should reject postcode not in allowed range', () => {
      const allowedRange = ['2161', '2162', '2163'];
      expect(validateAustralianPostcode('2000', allowedRange)).toBe(false);
      expect(validateAustralianPostcode('3000', allowedRange)).toBe(false);
    });

    it('should accept any valid postcode if allowed range is empty', () => {
      expect(validateAustralianPostcode('2000', [])).toBe(true);
      expect(validateAustralianPostcode('3000', [])).toBe(true);
    });

    it('should accept any valid postcode if allowed range is undefined', () => {
      expect(validateAustralianPostcode('2000', undefined)).toBe(true);
      expect(validateAustralianPostcode('3000', undefined)).toBe(true);
    });

    it('should handle number input with allowed range', () => {
      const allowedRange = ['2161', '2162', '2163'];
      expect(validateAustralianPostcode(2161, allowedRange)).toBe(true);
      expect(validateAustralianPostcode(2000, allowedRange)).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle null-like values', () => {
      expect(validateAustralianPostcode(null as unknown as string)).toBe(false);
      expect(validateAustralianPostcode(undefined as unknown as string)).toBe(false);
    });

    it('should handle zero as number', () => {
      expect(validateAustralianPostcode(0)).toBe(false);
    });

    it('should handle leading zeros in string format', () => {
      expect(validateAustralianPostcode('0200')).toBe(true);
      expect(validateAustralianPostcode('0800')).toBe(true);
    });
  });
});

describe('formatAustralianPostcode', () => {
  describe('padding with leading zeros', () => {
    it('should pad 1-digit numbers with leading zeros', () => {
      expect(formatAustralianPostcode(8)).toBe('0008');
      expect(formatAustralianPostcode('8')).toBe('0008');
    });

    it('should pad 2-digit numbers with leading zeros', () => {
      expect(formatAustralianPostcode(80)).toBe('0080');
      expect(formatAustralianPostcode('80')).toBe('0080');
    });

    it('should pad 3-digit numbers with leading zeros', () => {
      expect(formatAustralianPostcode(800)).toBe('0800');
      expect(formatAustralianPostcode('800')).toBe('0800');
    });

    it('should not pad 4-digit numbers', () => {
      expect(formatAustralianPostcode(2000)).toBe('2000');
      expect(formatAustralianPostcode('2000')).toBe('2000');
    });

    it('should preserve leading zeros', () => {
      expect(formatAustralianPostcode('0200')).toBe('0200');
      expect(formatAustralianPostcode('0800')).toBe('0800');
    });
  });

  describe('invalid input handling', () => {
    it('should return empty string for empty input', () => {
      expect(formatAustralianPostcode('')).toBe('');
    });

    it('should return empty string for null-like values', () => {
      expect(formatAustralianPostcode(null as unknown as string)).toBe('');
      expect(formatAustralianPostcode(undefined as unknown as string)).toBe('');
    });

    it('should handle zero', () => {
      // Zero is falsy, so function returns empty string
      expect(formatAustralianPostcode(0)).toBe('');
    });

    it('should not truncate longer inputs', () => {
      expect(formatAustralianPostcode('20000')).toBe('20000');
    });
  });

  describe('type conversion', () => {
    it('should handle string input', () => {
      expect(formatAustralianPostcode('2161')).toBe('2161');
      expect(formatAustralianPostcode('200')).toBe('0200');
    });

    it('should handle number input', () => {
      expect(formatAustralianPostcode(2161)).toBe('2161');
      expect(formatAustralianPostcode(200)).toBe('0200');
    });
  });
});
