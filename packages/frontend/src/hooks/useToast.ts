/**
 * useToast Hook
 *
 * [UI/UX Spec v2.2 §11.5 - Toast Notifications]
 *
 * Hook for showing toast notifications imperatively.
 * Must be used within a ToastProvider.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { showToast, dismissToast, dismissAll } = useToast();
 *
 *   const handleSave = async () => {
 *     try {
 *       await saveData();
 *       showToast({ message: 'Saved successfully!', type: 'success' });
 *     } catch (error) {
 *       showToast({
 *         message: 'Failed to save. Please try again.',
 *         type: 'error',
 *         persistent: true,
 *         action: { label: 'Retry', onClick: handleSave },
 *       });
 *     }
 *   };
 *
 *   return <button onClick={handleSave}>Save</button>;
 * }
 * ```
 */

import { useContext } from 'react';
import { ToastContext } from '../contexts/ToastContext';
import type { ToastType, ToastAction } from '../components/display/Toast';

export interface ShowToastOptions {
  /** Toast message */
  message: string;
  /** Toast type (default: 'info') */
  type?: ToastType;
  /** Custom duration in ms (uses type defaults if not specified) */
  duration?: number;
  /** If true, toast won't auto-dismiss */
  persistent?: boolean;
  /** Optional action button */
  action?: ToastAction;
}

export interface UseToastReturn {
  /** Show a new toast notification. Returns the toast ID. */
  showToast: (options: ShowToastOptions) => string;
  /** Dismiss a specific toast by ID */
  dismissToast: (id: string) => void;
  /** Dismiss all toasts */
  dismissAll: () => void;
}

/**
 * Hook for showing toast notifications
 */
export function useToast(): UseToastReturn {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return context;
}

/**
 * Convenience functions for common toast types
 */
export function useToastHelpers() {
  const { showToast, dismissToast, dismissAll } = useToast();

  return {
    success: (message: string, options?: Omit<ShowToastOptions, 'message' | 'type'>) =>
      showToast({ message, type: 'success', ...options }),

    error: (message: string, options?: Omit<ShowToastOptions, 'message' | 'type'>) =>
      showToast({ message, type: 'error', ...options }),

    warning: (message: string, options?: Omit<ShowToastOptions, 'message' | 'type'>) =>
      showToast({ message, type: 'warning', ...options }),

    info: (message: string, options?: Omit<ShowToastOptions, 'message' | 'type'>) =>
      showToast({ message, type: 'info', ...options }),

    dismissToast,
    dismissAll,
  };
}
