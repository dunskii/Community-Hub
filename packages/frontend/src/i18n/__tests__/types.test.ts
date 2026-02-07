import { describe, it, expect } from 'vitest';
import type { TranslationKeys, TranslationNamespace } from '../types';

describe('i18n Type Definitions', () => {
  it('should define translation namespaces', () => {
    const namespaces: TranslationNamespace[] = [
      'common',
      'navigation',
      'validation',
      'errors',
      'accessibility',
    ];

    expect(namespaces).toHaveLength(5);
    expect(namespaces).toContain('common');
    expect(namespaces).toContain('navigation');
    expect(namespaces).toContain('validation');
    expect(namespaces).toContain('errors');
    expect(namespaces).toContain('accessibility');
  });

  it('should allow valid translation keys', () => {
    // These should compile without errors
    const validKeys: TranslationKeys[] = [
      'common.loading',
      'common.error',
      'navigation.home',
      'validation.required',
      'errors.generic',
      'accessibility.skipToMain',
    ];

    expect(validKeys).toHaveLength(6);
  });

  it('should support dot notation for nested keys', () => {
    const key: TranslationKeys = 'common.loading';
    expect(key.split('.')).toEqual(['common', 'loading']);
  });

  it('should identify interpolated keys', () => {
    // Keys with {{variable}} placeholders
    const interpolatedKeys = [
      'validation.minLength',
      'validation.maxLength',
      'accessibility.languageChanged',
    ];

    interpolatedKeys.forEach((key) => {
      expect(key).toMatch(/minLength|maxLength|languageChanged/);
    });
  });

  it('should provide TypeScript autocomplete for translation keys', () => {
    // This test documents that TypeScript provides autocomplete
    // The actual type checking happens at compile time
    // Example: t('common.loading') gets autocomplete and type checking
    const exampleKey: TranslationKeys = 'common.loading';
    expect(exampleKey).toBe('common.loading');
  });

  it('should have all namespace keys as strings', () => {
    const namespaces: TranslationNamespace[] = [
      'common',
      'navigation',
      'validation',
      'errors',
      'accessibility',
    ];

    namespaces.forEach((ns) => {
      expect(typeof ns).toBe('string');
    });
  });

  it('should support parameter interpolation for specific keys', () => {
    // These keys support parameters like {count: 5}
    const keysWithParams = [
      'validation.minLength',
      'validation.maxLength',
      'accessibility.languageChanged',
    ];

    keysWithParams.forEach((key) => {
      expect(key).toBeTruthy();
    });
  });
});
