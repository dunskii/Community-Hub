import { useEffect, RefObject } from 'react';

/**
 * Focus trap hook for modals and dialogs
 * Ensures keyboard focus stays within a container element
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement>,
  isActive: boolean = true
) {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const previouslyFocused = document.activeElement as HTMLElement;

    // Get all focusable elements
    const getFocusableElements = (): HTMLElement[] => {
      const elements = container.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      return Array.from(elements).filter(
        el => !el.hasAttribute('disabled') && el.offsetParent !== null
      );
    };

    // Focus first element
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    // Handle tab key
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) {
        e.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTab);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleTab);
      previouslyFocused?.focus();
    };
  }, [containerRef, isActive]);
}
