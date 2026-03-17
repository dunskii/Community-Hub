import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme, initializeTheme } from '../useTheme';

const STORAGE_KEY = 'community-hub-theme';

describe('useTheme Hook', () => {
  let matchMediaListeners: Map<string, ((e: MediaQueryListEvent) => void)[]>;
  let isDarkMode: boolean;

  beforeEach(() => {
    // Reset localStorage
    localStorage.clear();

    // Remove dark class from document
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = '';

    // Reset mock state
    matchMediaListeners = new Map();
    isDarkMode = false;

    // Mock matchMedia
    vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
      matches: query === '(prefers-color-scheme: dark)' ? isDarkMode : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((type: string, listener: (e: MediaQueryListEvent) => void) => {
        if (!matchMediaListeners.has(query)) {
          matchMediaListeners.set(query, []);
        }
        matchMediaListeners.get(query)!.push(listener);
      }),
      removeEventListener: vi.fn((type: string, listener: (e: MediaQueryListEvent) => void) => {
        const listeners = matchMediaListeners.get(query) || [];
        const index = listeners.indexOf(listener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }),
      dispatchEvent: vi.fn(),
    })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('initial state', () => {
    it('should default to system theme when no preference stored', () => {
      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBe('system');
    });

    it('should resolve system theme to light when system prefers light', () => {
      isDarkMode = false;
      const { result } = renderHook(() => useTheme());

      expect(result.current.resolvedTheme).toBe('light');
      expect(result.current.isDark).toBe(false);
    });

    it('should resolve system theme to dark when system prefers dark', () => {
      isDarkMode = true;
      const { result } = renderHook(() => useTheme());

      expect(result.current.resolvedTheme).toBe('dark');
      expect(result.current.isDark).toBe(true);
    });

    it('should load stored theme from localStorage', () => {
      localStorage.setItem(STORAGE_KEY, 'dark');
      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBe('dark');
      expect(result.current.resolvedTheme).toBe('dark');
    });

    it('should fallback to system when localStorage has invalid value', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid');
      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBe('system');
    });
  });

  describe('setTheme', () => {
    it('should set theme to light', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('light');
      });

      expect(result.current.theme).toBe('light');
      expect(result.current.resolvedTheme).toBe('light');
      expect(result.current.isDark).toBe(false);
    });

    it('should set theme to dark', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('dark');
      });

      expect(result.current.theme).toBe('dark');
      expect(result.current.resolvedTheme).toBe('dark');
      expect(result.current.isDark).toBe(true);
    });

    it('should set theme to system', () => {
      localStorage.setItem(STORAGE_KEY, 'dark');
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('system');
      });

      expect(result.current.theme).toBe('system');
    });

    it('should persist theme to localStorage', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('dark');
      });

      expect(localStorage.getItem(STORAGE_KEY)).toBe('dark');
    });
  });

  describe('toggleTheme', () => {
    it('should toggle from light to dark', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('light');
      });

      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.theme).toBe('dark');
      expect(result.current.resolvedTheme).toBe('dark');
    });

    it('should toggle from dark to light', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('dark');
      });

      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.theme).toBe('light');
      expect(result.current.resolvedTheme).toBe('light');
    });

    it('should toggle from system to explicit theme', () => {
      isDarkMode = true;
      const { result } = renderHook(() => useTheme());

      // System resolves to dark, so toggle should set to light
      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.theme).toBe('light');
      expect(result.current.resolvedTheme).toBe('light');
    });
  });

  describe('DOM manipulation', () => {
    it('should add dark class to document when dark theme', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('dark');
      });

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should remove dark class from document when light theme', () => {
      document.documentElement.classList.add('dark');
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('light');
      });

      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should set color-scheme style property', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('dark');
      });

      expect(document.documentElement.style.colorScheme).toBe('dark');

      act(() => {
        result.current.setTheme('light');
      });

      expect(document.documentElement.style.colorScheme).toBe('light');
    });
  });

  describe('system preference changes', () => {
    it('should update theme when system preference changes and in system mode', () => {
      isDarkMode = false;
      const { result } = renderHook(() => useTheme());

      expect(result.current.resolvedTheme).toBe('light');

      // Simulate system preference change to dark
      const listeners = matchMediaListeners.get('(prefers-color-scheme: dark)') || [];
      act(() => {
        listeners.forEach(listener => {
          listener({ matches: true } as MediaQueryListEvent);
        });
      });

      expect(result.current.resolvedTheme).toBe('dark');
      expect(result.current.isDark).toBe(true);
    });

    it('should not update when system preference changes but not in system mode', () => {
      isDarkMode = false;
      const { result } = renderHook(() => useTheme());

      // Set explicit light theme
      act(() => {
        result.current.setTheme('light');
      });

      // Simulate system preference change
      const listeners = matchMediaListeners.get('(prefers-color-scheme: dark)') || [];
      act(() => {
        listeners.forEach(listener => {
          listener({ matches: true } as MediaQueryListEvent);
        });
      });

      // Should still be light because we're not in system mode
      expect(result.current.resolvedTheme).toBe('light');
    });
  });

  describe('initializeTheme', () => {
    it('should apply stored theme from localStorage', () => {
      localStorage.setItem(STORAGE_KEY, 'dark');

      initializeTheme();

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should apply light theme when no stored preference', () => {
      isDarkMode = false;

      initializeTheme();

      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should apply system dark preference when in system mode', () => {
      isDarkMode = true;

      initializeTheme();

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });
});
