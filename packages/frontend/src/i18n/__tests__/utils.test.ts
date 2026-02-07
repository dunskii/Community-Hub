import { describe, it, expect, beforeEach } from 'vitest';
import {
  isRTL,
  getDirection,
  updateHTMLAttributes,
  validateLanguageCode,
  isValidLanguageCode,
  getEnabledLanguages,
} from '../utils';

describe('i18n Utils', () => {
  describe('isRTL', () => {
    it('should return true for Arabic', () => {
      expect(isRTL('ar')).toBe(true);
    });

    it('should return true for Urdu', () => {
      expect(isRTL('ur')).toBe(true);
    });

    it('should return false for English', () => {
      expect(isRTL('en')).toBe(false);
    });

    it('should return false for Chinese', () => {
      expect(isRTL('zh-CN')).toBe(false);
      expect(isRTL('zh-TW')).toBe(false);
    });

    it('should return false for Vietnamese', () => {
      expect(isRTL('vi')).toBe(false);
    });

    it('should return false for Hindi', () => {
      expect(isRTL('hi')).toBe(false);
    });

    it('should return false for Korean', () => {
      expect(isRTL('ko')).toBe(false);
    });

    it('should return false for Greek', () => {
      expect(isRTL('el')).toBe(false);
    });

    it('should return false for Italian', () => {
      expect(isRTL('it')).toBe(false);
    });
  });

  describe('getDirection', () => {
    it('should return rtl for Arabic', () => {
      expect(getDirection('ar')).toBe('rtl');
    });

    it('should return rtl for Urdu', () => {
      expect(getDirection('ur')).toBe('rtl');
    });

    it('should return ltr for English', () => {
      expect(getDirection('en')).toBe('ltr');
    });

    it('should return ltr for Chinese', () => {
      expect(getDirection('zh-CN')).toBe('ltr');
      expect(getDirection('zh-TW')).toBe('ltr');
    });

    it('should return ltr for other languages', () => {
      expect(getDirection('vi')).toBe('ltr');
      expect(getDirection('hi')).toBe('ltr');
      expect(getDirection('ko')).toBe('ltr');
      expect(getDirection('el')).toBe('ltr');
      expect(getDirection('it')).toBe('ltr');
    });
  });

  describe('updateHTMLAttributes', () => {
    beforeEach(() => {
      // Reset HTML attributes before each test
      document.documentElement.setAttribute('lang', 'en');
      document.documentElement.setAttribute('dir', 'ltr');
    });

    it('should set lang and dir attributes for English', () => {
      updateHTMLAttributes('en');
      expect(document.documentElement.getAttribute('lang')).toBe('en');
      expect(document.documentElement.getAttribute('dir')).toBe('ltr');
    });

    it('should set lang and dir attributes for Arabic', () => {
      updateHTMLAttributes('ar');
      expect(document.documentElement.getAttribute('lang')).toBe('ar');
      expect(document.documentElement.getAttribute('dir')).toBe('rtl');
    });

    it('should set lang and dir attributes for Urdu', () => {
      updateHTMLAttributes('ur');
      expect(document.documentElement.getAttribute('lang')).toBe('ur');
      expect(document.documentElement.getAttribute('dir')).toBe('rtl');
    });

    it('should set ltr for Chinese', () => {
      updateHTMLAttributes('zh-CN');
      expect(document.documentElement.getAttribute('lang')).toBe('zh-CN');
      expect(document.documentElement.getAttribute('dir')).toBe('ltr');
    });

    it('should update attributes when switching languages', () => {
      updateHTMLAttributes('en');
      expect(document.documentElement.getAttribute('dir')).toBe('ltr');

      updateHTMLAttributes('ar');
      expect(document.documentElement.getAttribute('dir')).toBe('rtl');

      updateHTMLAttributes('vi');
      expect(document.documentElement.getAttribute('dir')).toBe('ltr');
    });
  });

  describe('validateLanguageCode', () => {
    it('should validate enabled language codes', () => {
      const result = validateLanguageCode('en');
      expect(result).toBe('en');
    });

    it('should return default language for invalid codes', () => {
      const result = validateLanguageCode('invalid');
      expect(result).toBe('en');
    });

    it('should return default language for empty string', () => {
      const result = validateLanguageCode('');
      expect(result).toBe('en');
    });

    it('should return default language for unsupported languages', () => {
      const result = validateLanguageCode('fr');
      expect(result).toBe('en');
    });

    it('should validate all supported language codes', () => {
      const languages = ['en', 'ar', 'zh-CN', 'zh-TW', 'vi', 'hi', 'ur', 'ko', 'el', 'it'];

      for (const lang of languages) {
        const result = validateLanguageCode(lang);
        expect(result).toBe(lang);
      }
    });
  });

  describe('isValidLanguageCode', () => {
    it('should return true for enabled languages', () => {
      expect(isValidLanguageCode('en')).toBe(true);
      expect(isValidLanguageCode('ar')).toBe(true);
      expect(isValidLanguageCode('zh-CN')).toBe(true);
      expect(isValidLanguageCode('vi')).toBe(true);
    });

    it('should return false for unsupported languages', () => {
      expect(isValidLanguageCode('fr')).toBe(false);
      expect(isValidLanguageCode('de')).toBe(false);
      expect(isValidLanguageCode('es')).toBe(false);
    });

    it('should return false for invalid codes', () => {
      expect(isValidLanguageCode('')).toBe(false);
      expect(isValidLanguageCode('invalid')).toBe(false);
      expect(isValidLanguageCode('xyz')).toBe(false);
    });
  });

  describe('getEnabledLanguages', () => {
    it('should return all enabled language codes', () => {
      const languages = getEnabledLanguages();
      expect(languages).toHaveLength(10);
      expect(languages).toContain('en');
      expect(languages).toContain('ar');
      expect(languages).toContain('zh-CN');
      expect(languages).toContain('zh-TW');
      expect(languages).toContain('vi');
      expect(languages).toContain('hi');
      expect(languages).toContain('ur');
      expect(languages).toContain('ko');
      expect(languages).toContain('el');
      expect(languages).toContain('it');
    });

    it('should only return enabled languages', () => {
      const languages = getEnabledLanguages();
      // All 10 languages are enabled in platform.json
      expect(languages).toHaveLength(10);
    });
  });
});
