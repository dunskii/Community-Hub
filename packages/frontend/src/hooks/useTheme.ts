import { useEffect, useState, useCallback } from 'react';

/**
 * Theme mode options
 * - 'light': Always use light theme
 * - 'dark': Always use dark theme
 * - 'system': Follow system preference (prefers-color-scheme)
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Resolved theme (actual theme being displayed)
 */
export type ResolvedTheme = 'light' | 'dark';

interface UseThemeReturn {
  /** Current theme setting (light/dark/system) */
  theme: ThemeMode;
  /** Actual theme being displayed (light/dark) */
  resolvedTheme: ResolvedTheme;
  /** Change the theme setting */
  setTheme: (theme: ThemeMode) => void;
  /** Whether dark mode is currently active */
  isDark: boolean;
  /** Toggle between light and dark (ignores system) */
  toggleTheme: () => void;
}

const STORAGE_KEY = 'community-hub-theme';
const DARK_CLASS = 'dark';

/**
 * Get the system's preferred color scheme
 */
function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

/**
 * Get the stored theme preference from localStorage
 */
function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }
  return 'system';
}

/**
 * Resolve the actual theme based on mode and system preference
 */
function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === 'system') {
    return getSystemTheme();
  }
  return mode;
}

/**
 * Apply theme to the document
 */
function applyTheme(resolvedTheme: ResolvedTheme): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  if (resolvedTheme === 'dark') {
    root.classList.add(DARK_CLASS);
  } else {
    root.classList.remove(DARK_CLASS);
  }

  // Set color-scheme for native form elements
  root.style.colorScheme = resolvedTheme;
}

/**
 * Hook for managing theme (light/dark mode)
 *
 * Features:
 * - Persists preference to localStorage
 * - Supports 'system' mode that follows OS preference
 * - Listens for system preference changes
 * - Applies .dark class to <html> element
 *
 * @example
 * ```tsx
 * const { theme, resolvedTheme, setTheme, isDark, toggleTheme } = useTheme();
 *
 * // Check current theme
 * console.log(isDark ? 'Dark mode' : 'Light mode');
 *
 * // Change theme
 * setTheme('dark');
 * setTheme('light');
 * setTheme('system');
 *
 * // Quick toggle
 * toggleTheme();
 * ```
 */
export function useTheme(): UseThemeReturn {
  const [theme, setThemeState] = useState<ThemeMode>(getStoredTheme);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    resolveTheme(getStoredTheme())
  );

  // Apply theme on initial mount and when it changes
  useEffect(() => {
    const resolved = resolveTheme(theme);
    setResolvedTheme(resolved);
    applyTheme(resolved);
  }, [theme]);

  // Listen for system preference changes when in 'system' mode
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      const newResolved: ResolvedTheme = e.matches ? 'dark' : 'light';
      setResolvedTheme(newResolved);
      applyTheme(newResolved);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  /**
   * Set the theme mode and persist to localStorage
   */
  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
  }, []);

  /**
   * Toggle between light and dark (sets explicit mode, not system)
   */
  const toggleTheme = useCallback(() => {
    const newTheme: ThemeMode = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  }, [resolvedTheme, setTheme]);

  return {
    theme,
    resolvedTheme,
    setTheme,
    isDark: resolvedTheme === 'dark',
    toggleTheme,
  };
}

/**
 * Initialize theme before React hydration to prevent flash
 * Call this in main.tsx before createRoot().render()
 *
 * @example
 * ```ts
 * // In main.tsx
 * import { initializeTheme } from './hooks/useTheme';
 *
 * initializeTheme();
 * createRoot(document.getElementById('root')!).render(<App />);
 * ```
 */
export function initializeTheme(): void {
  const stored = getStoredTheme();
  const resolved = resolveTheme(stored);
  applyTheme(resolved);
}

export default useTheme;
