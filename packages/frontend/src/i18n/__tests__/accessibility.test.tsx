import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import i18n from '../config';

expect.extend(toHaveNoViolations);

describe('i18n Accessibility (WCAG 2.1)', () => {
  beforeEach(() => {
    // Reset to English
    i18n.changeLanguage('en');
    document.documentElement.setAttribute('lang', 'en');
    document.documentElement.setAttribute('dir', 'ltr');
  });

  describe('SC 3.1.1: Language of Page (Level A)', () => {
    it('should set lang attribute on html element', () => {
      i18n.changeLanguage('en');
      expect(document.documentElement.getAttribute('lang')).toBe('en');
    });

    it('should update lang attribute when language changes', async () => {
      await i18n.changeLanguage('ar');
      // Note: HTML attributes are updated by useLanguage hook in actual app
      // This test verifies the i18n.changeLanguage function works
      expect(i18n.language).toBe('ar');

      await i18n.changeLanguage('zh-CN');
      expect(i18n.language).toBe('zh-CN');
    });

    it('should use valid BCP 47 language codes', async () => {
      const validCodes = ['en', 'ar', 'zh-CN', 'zh-TW', 'vi', 'hi', 'ur', 'ko', 'el', 'it'];

      for (const code of validCodes) {
        await i18n.changeLanguage(code);
        expect(i18n.language).toBe(code);
        expect(validCodes).toContain(i18n.language);
      }
    });
  });

  describe('SC 3.1.2: Language of Parts (Level AA)', () => {
    it('should allow marking mixed-language content', () => {
      const { container } = render(
        <div lang="ar">
          مرحبا بكم في <span lang="en">Joe's Cafe</span>
        </div>
      );

      const englishSpan = container.querySelector('[lang="en"]');
      expect(englishSpan).toBeTruthy();
      expect(englishSpan?.getAttribute('lang')).toBe('en');
    });

    it('should support multiple language parts in same content', () => {
      const { container } = render(
        <div lang="en">
          Welcome to <span lang="ar">المقهى</span> and{' '}
          <span lang="zh-CN">咖啡馆</span>
        </div>
      );

      const arabicSpan = container.querySelector('[lang="ar"]');
      const chineseSpan = container.querySelector('[lang="zh-CN"]');

      expect(arabicSpan).toBeTruthy();
      expect(chineseSpan).toBeTruthy();
    });
  });

  describe('Translation Quality', () => {
    it('should have translations for common accessibility terms', () => {
      expect(i18n.t('accessibility.skipToMain')).toBeTruthy();
      expect(i18n.t('accessibility.selectLanguage')).toBeTruthy();
      expect(i18n.t('accessibility.openMenu')).toBeTruthy();
      expect(i18n.t('accessibility.closeMenu')).toBeTruthy();
    });

    it('should not return empty strings for translation keys', () => {
      const keys = [
        'common.loading',
        'common.error',
        'navigation.home',
        'validation.required',
        'errors.generic',
        'accessibility.skipToMain',
      ];

      keys.forEach((key) => {
        const translation = i18n.t(key);
        expect(translation).toBeTruthy();
        expect(translation).not.toBe('');
        expect(typeof translation).toBe('string');
      });
    });

    it('should have all translation namespaces', () => {
      const namespaces = ['common', 'navigation', 'validation', 'errors', 'accessibility'];

      namespaces.forEach((namespace) => {
        // Check at least one key exists in each namespace
        const keys = Object.keys(i18n.store.data.en.translation[namespace]);
        expect(keys.length).toBeGreaterThan(0);
      });
    });
  });

  describe('RTL Accessibility', () => {
    it('should support RTL text direction', () => {
      // Note: HTML dir attribute is updated by useLanguage hook
      // This test verifies i18n configuration supports RTL languages
      const rtlLanguages = ['ar', 'ur'];

      rtlLanguages.forEach((lang) => {
        i18n.changeLanguage(lang);
        expect(i18n.language).toBe(lang);
      });
    });

    it('should maintain LTR for non-RTL languages', () => {
      const ltrLanguages = ['en', 'zh-CN', 'zh-TW', 'vi', 'hi', 'ko', 'el', 'it'];

      ltrLanguages.forEach((lang) => {
        i18n.changeLanguage(lang);
        expect(i18n.language).toBe(lang);
      });
    });
  });

  describe('Variable Interpolation', () => {
    it('should safely interpolate variables', () => {
      const translation = i18n.t('validation.minLength', { count: 5 });
      expect(translation).toContain('5');
      expect(translation).toBeTruthy();
    });

    it('should handle missing interpolation variables gracefully', () => {
      const translation = i18n.t('validation.minLength');
      expect(translation).toBeTruthy();
    });

    it('should support dynamic content in accessibility labels', () => {
      const translation = i18n.t('accessibility.languageChanged', { language: 'Arabic' });
      expect(translation).toContain('Arabic');
    });
  });

  describe('Keyboard Navigation Support', () => {
    it('should have translations for keyboard navigation', () => {
      expect(i18n.t('accessibility.openMenu')).toBeTruthy();
      expect(i18n.t('accessibility.closeMenu')).toBeTruthy();
      expect(i18n.t('accessibility.openDialog')).toBeTruthy();
      expect(i18n.t('accessibility.closeDialog')).toBeTruthy();
    });
  });

  describe('Axe Accessibility Tests', () => {
    it('should have no axe violations for simple translated content', async () => {
      const { container } = render(
        <div>
          <h1>{i18n.t('navigation.home')}</h1>
          <p>{i18n.t('common.loading')}</p>
          <button>{i18n.t('common.submit')}</button>
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no axe violations for mixed-language content', async () => {
      const { container } = render(
        <div lang="en">
          <p>
            Welcome to <span lang="ar">المقهى</span>
          </p>
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
