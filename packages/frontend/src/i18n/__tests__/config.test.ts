import { describe, it, expect } from 'vitest';
import i18n from '../config';

describe('i18n Configuration', () => {
  it('should initialize with default language', () => {
    // Language might include region code like "en-US" in test environment
    expect(i18n.language).toMatch(/^en/);
  });

  it('should have all 10 languages loaded', () => {
    const languages = Object.keys(i18n.store.data);
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

  it('should have translation resources for all languages', () => {
    const languages = ['en', 'ar', 'zh-CN', 'zh-TW', 'vi', 'hi', 'ur', 'ko', 'el', 'it'];

    languages.forEach((lang) => {
      const resource = i18n.store.data[lang];
      expect(resource).toBeDefined();
      expect(resource.translation).toBeDefined();
    });
  });

  it('should use English as fallback language', () => {
    // fallbackLng can be string or array
    const fallback = i18n.options.fallbackLng;
    expect(Array.isArray(fallback) ? fallback[0] : fallback).toBe('en');
  });

  it('should not escape values (React handles escaping)', () => {
    expect(i18n.options.interpolation?.escapeValue).toBe(false);
  });

  it('should have correct language detector order', () => {
    const detectorOptions = i18n.options.detection;
    expect(detectorOptions?.order).toEqual(['querystring', 'localStorage', 'navigator']);
    expect(detectorOptions?.lookupQuerystring).toBe('lang');
    expect(detectorOptions?.lookupLocalStorage).toBe('community-hub-language');
  });

  it('should have useSuspense disabled', () => {
    expect(i18n.options.react?.useSuspense).toBe(false);
  });

  it('should load common translation keys', () => {
    const commonKeys = ['loading', 'error', 'success', 'save', 'cancel'];

    commonKeys.forEach((key) => {
      const translation = i18n.t(`common.${key}`);
      expect(translation).toBeTruthy();
      expect(translation).not.toBe(`common.${key}`); // Should not return the key itself
    });
  });

  it('should load navigation translation keys', () => {
    const navKeys = ['home', 'businesses', 'events', 'deals', 'profile'];

    navKeys.forEach((key) => {
      const translation = i18n.t(`navigation.${key}`);
      expect(translation).toBeTruthy();
      expect(translation).not.toBe(`navigation.${key}`);
    });
  });

  it('should load validation translation keys', () => {
    const validationKeys = ['required', 'invalidEmail', 'invalidPhone'];

    validationKeys.forEach((key) => {
      const translation = i18n.t(`validation.${key}`);
      expect(translation).toBeTruthy();
      expect(translation).not.toBe(`validation.${key}`);
    });
  });

  it('should support interpolation', () => {
    const translation = i18n.t('validation.minLength', { count: 5 });
    expect(translation).toContain('5');
  });
});
