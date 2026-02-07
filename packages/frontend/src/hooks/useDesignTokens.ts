/**
 * Design Tokens Hook
 *
 * React hook to check if design tokens are loaded and ready.
 */

import { useEffect, useState } from 'react';

export function useDesignTokens() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Design tokens should already be injected by main.tsx
    // This hook just provides a way to check if they're ready
    const root = document.documentElement;
    const primaryColor = getComputedStyle(root).getPropertyValue('--color-primary');

    if (primaryColor) {
      setLoaded(true);
    }
  }, []);

  return { loaded };
}
