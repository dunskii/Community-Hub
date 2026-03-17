/**
 * ToastContext and ToastProvider
 *
 * [UI/UX Spec v2.2 §11.5 - Toast Notifications]
 *
 * Provides global toast notification state and management.
 * Renders ToastContainer to display active toasts.
 *
 * @example
 * ```tsx
 * // In App.tsx
 * import { ToastProvider } from './contexts/ToastContext';
 *
 * function App() {
 *   return (
 *     <ToastProvider position="top-right" maxVisible={3}>
 *       <YourApp />
 *     </ToastProvider>
 *   );
 * }
 *
 * // In components
 * import { useToast } from '../hooks/useToast';
 *
 * function MyComponent() {
 *   const { showToast } = useToast();
 *   return <button onClick={() => showToast({ message: 'Hello!', type: 'success' })}>Click</button>;
 * }
 * ```
 */

import React, { createContext, useState, useCallback, useMemo } from 'react';
import { ToastContainer, type ToastItem } from '../components/display/ToastContainer';
import type { ToastPosition } from '../components/display/Toast';
import type { ShowToastOptions, UseToastReturn } from '../hooks/useToast';

// Generate unique IDs
let toastIdCounter = 0;
function generateToastId(): string {
  return `toast-${++toastIdCounter}-${Date.now()}`;
}

// Context type
export const ToastContext = createContext<UseToastReturn | null>(null);

interface ToastProviderProps {
  children: React.ReactNode;
  /** Default position for toasts */
  position?: ToastPosition;
  /** Maximum visible toasts (default: 3) */
  maxVisible?: number;
}

export function ToastProvider({
  children,
  position = 'top-right',
  maxVisible = 3,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Show a new toast
  const showToast = useCallback((options: ShowToastOptions): string => {
    const id = generateToastId();
    const newToast: ToastItem = {
      id,
      message: options.message,
      type: options.type || 'info',
      duration: options.duration,
      persistent: options.persistent,
      action: options.action,
      createdAt: Date.now(),
    };

    setToasts((prev) => [...prev, newToast]);
    return id;
  }, []);

  // Dismiss a specific toast
  const dismissToast = useCallback((id: string): void => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // Dismiss all toasts
  const dismissAll = useCallback((): void => {
    setToasts([]);
  }, []);

  // Memoize context value
  const contextValue = useMemo<UseToastReturn>(
    () => ({
      showToast,
      dismissToast,
      dismissAll,
    }),
    [showToast, dismissToast, dismissAll]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer
        toasts={toasts}
        onDismiss={dismissToast}
        position={position}
        maxVisible={maxVisible}
      />
    </ToastContext.Provider>
  );
}
