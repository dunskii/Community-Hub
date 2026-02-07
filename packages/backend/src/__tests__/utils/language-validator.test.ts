/**
 * Language Validator Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock platform config
vi.mock('../../config/platform-loader', () => ({
  getPlatformConfig: vi.fn(() => ({
    multilingual: {
      defaultLanguage: 'en',
      supportedLanguages: [
        { code: 'en', name: 'English', nativeName: 'English', rtl: false, enabled: true },
        { code: 'ar', name: 'Arabic', nativeName: 'العربية', rtl: true, enabled: true },
        { code: 'es', name: 'Spanish', nativeName: 'Español', rtl: false, enabled: true },
        { code: 'fr', name: 'French', nativeName: 'Français', rtl: false, enabled: false },
      ],
    },
  })),
}));

import {
  getSupportedLanguageCodes,
  getDefaultLanguageCode,
  isValidLanguageCode,
  validateLanguageCode,
  getLanguageDetails,
} from '../../utils/language-validator';

describe('Language Validator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSupportedLanguageCodes', () => {
    it('should return only enabled language codes', () => {
      const codes = getSupportedLanguageCodes();

      expect(codes).toEqual(['en', 'ar', 'es']);
      expect(codes).not.toContain('fr'); // Disabled
    });
  });

  describe('getDefaultLanguageCode', () => {
    it('should return default language code', () => {
      const code = getDefaultLanguageCode();

      expect(code).toBe('en');
    });
  });

  describe('isValidLanguageCode', () => {
    it('should return true for enabled languages', () => {
      expect(isValidLanguageCode('en')).toBe(true);
      expect(isValidLanguageCode('ar')).toBe(true);
      expect(isValidLanguageCode('es')).toBe(true);
    });

    it('should return false for disabled languages', () => {
      expect(isValidLanguageCode('fr')).toBe(false);
    });

    it('should return false for unsupported languages', () => {
      expect(isValidLanguageCode('de')).toBe(false);
      expect(isValidLanguageCode('ja')).toBe(false);
    });

    it('should return false for invalid codes', () => {
      expect(isValidLanguageCode('invalid')).toBe(false);
      expect(isValidLanguageCode('')).toBe(false);
    });
  });

  describe('validateLanguageCode', () => {
    it('should return valid language code unchanged', () => {
      expect(validateLanguageCode('en')).toBe('en');
      expect(validateLanguageCode('ar')).toBe('ar');
      expect(validateLanguageCode('es')).toBe('es');
    });

    it('should return default for invalid codes', () => {
      expect(validateLanguageCode('fr')).toBe('en'); // Disabled
      expect(validateLanguageCode('de')).toBe('en'); // Unsupported
      expect(validateLanguageCode('invalid')).toBe('en');
    });

    it('should return default for undefined', () => {
      expect(validateLanguageCode(undefined)).toBe('en');
    });

    it('should return default for empty string', () => {
      expect(validateLanguageCode('')).toBe('en');
    });
  });

  describe('getLanguageDetails', () => {
    it('should return language details for valid code', () => {
      const details = getLanguageDetails('en');

      expect(details).toEqual({
        code: 'en',
        name: 'English',
        nativeName: 'English',
        rtl: false,
        enabled: true,
      });
    });

    it('should return language details for Arabic (RTL)', () => {
      const details = getLanguageDetails('ar');

      expect(details).toEqual({
        code: 'ar',
        name: 'Arabic',
        nativeName: 'العربية',
        rtl: true,
        enabled: true,
      });
    });

    it('should return details even for disabled languages', () => {
      const details = getLanguageDetails('fr');

      expect(details).toEqual({
        code: 'fr',
        name: 'French',
        nativeName: 'Français',
        rtl: false,
        enabled: false,
      });
    });

    it('should return null for unsupported codes', () => {
      const details = getLanguageDetails('de');

      expect(details).toBeNull();
    });
  });
});
