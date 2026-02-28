/**
 * Unit tests for Australian phone number validator
 */

import { describe, it, expect } from 'vitest';
import { validateAustralianPhone, formatAustralianPhone } from './phone-validator.js';

describe('validateAustralianPhone', () => {
  describe('valid formats', () => {
    it('should accept mobile numbers with +61 prefix', () => {
      expect(validateAustralianPhone('+61412345678')).toBe(true);
      expect(validateAustralianPhone('+61498765432')).toBe(true);
    });

    it('should accept mobile numbers with 0 prefix', () => {
      expect(validateAustralianPhone('0412345678')).toBe(true);
      expect(validateAustralianPhone('0498765432')).toBe(true);
    });

    it('should accept landline numbers with +61 prefix', () => {
      expect(validateAustralianPhone('+61299999999')).toBe(true);
      expect(validateAustralianPhone('+61387654321')).toBe(true);
    });

    it('should accept landline numbers with 0 prefix', () => {
      expect(validateAustralianPhone('0299999999')).toBe(true);
      expect(validateAustralianPhone('0387654321')).toBe(true);
    });

    it('should accept numbers with spaces', () => {
      expect(validateAustralianPhone('04 1234 5678')).toBe(true);
      expect(validateAustralianPhone('02 9999 9999')).toBe(true);
    });

    it('should accept numbers with hyphens', () => {
      expect(validateAustralianPhone('0412-345-678')).toBe(true);
      expect(validateAustralianPhone('02-9999-9999')).toBe(true);
    });

    it('should accept numbers with parentheses', () => {
      expect(validateAustralianPhone('(02) 9999 9999')).toBe(true);
      expect(validateAustralianPhone('(03) 8765 4321')).toBe(true);
    });

    it('should accept mixed formatting', () => {
      expect(validateAustralianPhone('+61 (2) 9999-9999')).toBe(true);
      expect(validateAustralianPhone('0412 345 678')).toBe(true);
    });
  });

  describe('invalid formats', () => {
    it('should reject empty string', () => {
      expect(validateAustralianPhone('')).toBe(false);
    });

    it('should reject numbers with wrong length', () => {
      expect(validateAustralianPhone('041234567')).toBe(false); // Too short
      expect(validateAustralianPhone('04123456789')).toBe(false); // Too long
    });

    it('should reject numbers starting with 0 or 1 area code', () => {
      expect(validateAustralianPhone('0099999999')).toBe(false);
      expect(validateAustralianPhone('0199999999')).toBe(false);
    });

    it('should reject international numbers (non-Australian)', () => {
      expect(validateAustralianPhone('+1234567890')).toBe(false);
      expect(validateAustralianPhone('+44234567890')).toBe(false);
    });

    it('should reject numbers with letters', () => {
      expect(validateAustralianPhone('041234567a')).toBe(false);
      expect(validateAustralianPhone('abc1234567')).toBe(false);
    });

    it('should reject numbers with invalid prefixes', () => {
      expect(validateAustralianPhone('1234567890')).toBe(false);
      expect(validateAustralianPhone('5412345678')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle null-like values', () => {
      expect(validateAustralianPhone(null as unknown as string)).toBe(false);
      expect(validateAustralianPhone(undefined as unknown as string)).toBe(false);
    });

    it('should validate all valid area codes (2-9)', () => {
      expect(validateAustralianPhone('0212345678')).toBe(true); // ACT/NSW
      expect(validateAustralianPhone('0312345678')).toBe(true); // VIC
      expect(validateAustralianPhone('0412345678')).toBe(true); // Mobile
      expect(validateAustralianPhone('0512345678')).toBe(true); // Mobile
      expect(validateAustralianPhone('0712345678')).toBe(true); // QLD
      expect(validateAustralianPhone('0812345678')).toBe(true); // NT/SA
      expect(validateAustralianPhone('0912345678')).toBe(true); // WA
    });
  });
});

describe('formatAustralianPhone', () => {
  describe('mobile number formatting', () => {
    it('should format mobile numbers with spaces', () => {
      expect(formatAustralianPhone('0412345678')).toBe('0412 345 678');
      expect(formatAustralianPhone('0498765432')).toBe('0498 765 432');
    });

    it('should format mobile numbers starting with +61', () => {
      expect(formatAustralianPhone('+61412345678')).toBe('0412 345 678');
      expect(formatAustralianPhone('+61498765432')).toBe('0498 765 432');
    });

    it('should preserve already formatted mobile numbers', () => {
      const formatted = formatAustralianPhone('0412 345 678');
      expect(formatted).toBe('0412 345 678');
    });
  });

  describe('landline number formatting', () => {
    it('should format landline numbers with spaces', () => {
      expect(formatAustralianPhone('0299999999')).toBe('02 9999 9999');
      expect(formatAustralianPhone('0387654321')).toBe('03 8765 4321');
    });

    it('should format landline numbers starting with +61', () => {
      expect(formatAustralianPhone('+61299999999')).toBe('02 9999 9999');
      expect(formatAustralianPhone('+61387654321')).toBe('03 8765 4321');
    });

    it('should handle various landline area codes', () => {
      expect(formatAustralianPhone('0212345678')).toBe('02 1234 5678');
      expect(formatAustralianPhone('0712345678')).toBe('07 1234 5678');
      expect(formatAustralianPhone('0812345678')).toBe('08 1234 5678');
      expect(formatAustralianPhone('0912345678')).toBe('09 1234 5678');
    });
  });

  describe('invalid input handling', () => {
    it('should return original string if empty', () => {
      expect(formatAustralianPhone('')).toBe('');
    });

    it('should return original string if invalid format', () => {
      expect(formatAustralianPhone('invalid')).toBe('invalid');
      expect(formatAustralianPhone('123')).toBe('123');
      expect(formatAustralianPhone('12345678901234')).toBe('12345678901234');
    });

    it('should return original if wrong area code', () => {
      expect(formatAustralianPhone('0199999999')).toBe('0199999999');
    });
  });

  describe('input with existing formatting', () => {
    it('should clean and reformat numbers with spaces', () => {
      expect(formatAustralianPhone('04 12 34 56 78')).toBe('0412 345 678');
      expect(formatAustralianPhone('02 99 99 99 99')).toBe('02 9999 9999');
    });

    it('should clean and reformat numbers with hyphens', () => {
      expect(formatAustralianPhone('0412-345-678')).toBe('0412 345 678');
      expect(formatAustralianPhone('02-9999-9999')).toBe('02 9999 9999');
    });

    it('should clean and reformat numbers with parentheses', () => {
      expect(formatAustralianPhone('(02) 9999 9999')).toBe('02 9999 9999');
      expect(formatAustralianPhone('(03) 8765 4321')).toBe('03 8765 4321');
    });
  });
});
