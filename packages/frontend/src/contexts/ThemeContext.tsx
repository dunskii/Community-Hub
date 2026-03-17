/**
 * Theme Context
 *
 * Provides global theme state and methods for light/dark mode switching.
 * [UI/UX Spec v2.2 §1 - Dark Mode]
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ThemeMode, ResolvedTheme } from '../hooks/useTheme';

interface ThemeContextValue {
  /** Current theme setting (light/dark/system) */
  theme: ThemeMode;
  /** Actual theme being displayed (light/dark) */
  resolvedTheme: ResolvedTheme;
  /** Change the theme setting */
  setTheme: (theme: ThemeMode) => void;
  /** Whether dark mode is currently active */
  isDark: boolean;
  /** Toggle between light and dark */
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

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

interface ThemeProviderProps {
  children: React.ReactNode;
  /** Default theme if no preference is stored */
  defaultTheme?: ThemeMode;
}

/**
 * Theme Provider Component
 *
 * Wrap your app with this provider to enable theme switching.
 *
 * @example
 * ```tsx
 * // In App.tsx
 * import { ThemeProvider } from './contexts/ThemeContext';
 *
 * function App() {
 *   return (
 *     <ThemeProvider>
 *       <YourApp />
 *     </ThemeProvider>
 *   );
 * }
 * ```
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'system',
}) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const stored = getStoredTheme();
    return stored || defaultTheme;
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    resolveTheme(theme)
  );

  // Apply theme on mount and when it changes
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

  const value: ThemeContextValue = {
    theme,
    resolvedTheme,
    setTheme,
    isDark: resolvedTheme === 'dark',
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

/**
 * Hook to access theme context
 *
 * @throws Error if used outside ThemeProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isDark, toggleTheme, setTheme } = useThemeContext();
 *
 *   return (
 *     <button onClick={toggleTheme}>
 *       {isDark ? 'Switch to Light' : 'Switch to Dark'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useThemeContext(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}

export { ThemeContext };
export type { ThemeContextValue, ThemeProviderProps };
