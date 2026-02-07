import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useLanguage } from '../useLanguage';
import i18n from '../../i18n/config';

describe('useLanguage Hook', () => {
  beforeEach(() => {
    // Reset to English
    i18n.changeLanguage('en');
    localStorage.clear();
    document.documentElement.setAttribute('lang', 'en');
    document.documentElement.setAttribute('dir', 'ltr');
  });

  it('should return current language', async () => {
    const { result } = renderHook(() => useLanguage());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.currentLanguage).toBe('en');
  });

  it('should return available languages', async () => {
    const { result } = renderHook(() => useLanguage());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.availableLanguages).toHaveLength(10);
    expect(result.current.availableLanguages).toContain('en');
    expect(result.current.availableLanguages).toContain('ar');
    expect(result.current.availableLanguages).toContain('zh-CN');
  });

  it('should change language', async () => {
    const { result } = renderHook(() => useLanguage());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.changeLanguage('ar');
    });

    expect(result.current.currentLanguage).toBe('ar');
    expect(document.documentElement.getAttribute('lang')).toBe('ar');
    expect(document.documentElement.getAttribute('dir')).toBe('rtl');
  });

  it('should persist language to localStorage', async () => {
    const { result } = renderHook(() => useLanguage());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.changeLanguage('vi');
    });

    expect(localStorage.getItem('community-hub-language')).toBe('vi');
  });

  it('should detect RTL languages', async () => {
    const { result } = renderHook(() => useLanguage());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // English is LTR
    expect(result.current.isRTL).toBe(false);

    // Change to Arabic (RTL)
    await act(async () => {
      await result.current.changeLanguage('ar');
    });

    expect(result.current.isRTL).toBe(true);

    // Change to Urdu (RTL)
    await act(async () => {
      await result.current.changeLanguage('ur');
    });

    expect(result.current.isRTL).toBe(true);

    // Change back to Chinese (LTR)
    await act(async () => {
      await result.current.changeLanguage('zh-CN');
    });

    expect(result.current.isRTL).toBe(false);
  });

  it('should validate language codes and fallback to default', async () => {
    const { result } = renderHook(() => useLanguage());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.changeLanguage('invalid');
    });

    // Should fallback to English
    expect(result.current.currentLanguage).toBe('en');
  });

  it('should update HTML attributes on language change', async () => {
    const { result } = renderHook(() => useLanguage());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.changeLanguage('ar');
    });

    expect(document.documentElement.getAttribute('lang')).toBe('ar');
    expect(document.documentElement.getAttribute('dir')).toBe('rtl');

    await act(async () => {
      await result.current.changeLanguage('ko');
    });

    expect(document.documentElement.getAttribute('lang')).toBe('ko');
    expect(document.documentElement.getAttribute('dir')).toBe('ltr');
  });

  it('should handle multiple language changes', async () => {
    const { result } = renderHook(() => useLanguage());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const languages = ['ar', 'zh-CN', 'vi', 'ur', 'en'];

    for (const lang of languages) {
      await act(async () => {
        await result.current.changeLanguage(lang);
      });

      expect(result.current.currentLanguage).toBe(lang);
      expect(document.documentElement.getAttribute('lang')).toBe(lang);
      expect(localStorage.getItem('community-hub-language')).toBe(lang);
    }
  });

  it('should eventually have isLoading false', async () => {
    const { result } = renderHook(() => useLanguage());

    // i18n initializes synchronously in test environment, so isLoading may already be false
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });
});
