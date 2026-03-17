/**
 * Toast Component
 *
 * [UI/UX Spec v2.2 §11.5 - Toast Notifications]
 *
 * Enhanced toast notifications with:
 * - Type-specific default durations
 * - Persistent option for errors requiring action
 * - Optional action button support
 * - Dark mode compatible
 * - WCAG 2.1 AA compliant
 *
 * @example
 * ```tsx
 * // Simple toast
 * <Toast message="Saved successfully" type="success" isVisible={show} onClose={() => setShow(false)} />
 *
 * // With action button
 * <Toast
 *   message="Item deleted"
 *   type="info"
 *   isVisible={show}
 *   onClose={() => setShow(false)}
 *   action={{ label: "Undo", onClick: handleUndo }}
 * />
 *
 * // Persistent error
 * <Toast
 *   message="Failed to save. Please try again."
 *   type="error"
 *   persistent
 *   isVisible={show}
 *   onClose={() => setShow(false)}
 * />
 * ```
 */

import React, { useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';

export interface ToastAction {
  /** Button label */
  label: string;
  /** Click handler */
  onClick: () => void;
}

export interface ToastProps {
  /** Unique identifier for the toast */
  id?: string;
  /** Toast message */
  message: string;
  /** Toast type - affects styling and default duration */
  type?: ToastType;
  /** Toast visible state */
  isVisible: boolean;
  /** Close handler */
  onClose: () => void;
  /**
   * Auto-dismiss duration in ms.
   * If not specified, uses type-specific defaults:
   * - success: 4000ms
   * - info: 4000ms
   * - warning: 6000ms
   * - error: 8000ms
   * Set to 0 or use persistent=true to disable auto-dismiss.
   */
  duration?: number;
  /** If true, toast won't auto-dismiss. Use for errors requiring user action. */
  persistent?: boolean;
  /** Position on screen */
  position?: ToastPosition;
  /** Optional action button */
  action?: ToastAction;
  /** Additional CSS classes */
  className?: string;
}

/** Default durations by toast type (in ms) */
const DEFAULT_DURATIONS: Record<ToastType, number> = {
  success: 4000,
  info: 4000,
  warning: 6000,
  error: 8000,
};

export function Toast({
  id,
  message,
  type = 'info',
  isVisible,
  onClose,
  duration,
  persistent = false,
  position = 'top-right',
  action,
  className = '',
}: ToastProps) {
  const { t } = useTranslation();

  // Calculate effective duration
  const effectiveDuration = persistent ? 0 : (duration ?? DEFAULT_DURATIONS[type]);

  // Handle auto-dismiss
  useEffect(() => {
    if (isVisible && effectiveDuration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, effectiveDuration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, effectiveDuration, onClose]);

  // Handle action click
  const handleActionClick = useCallback(() => {
    action?.onClick();
    onClose();
  }, [action, onClose]);

  if (!isVisible) return null;

  // Type-specific styles with dark mode support
  const typeStyles: Record<ToastType, string> = {
    success: 'bg-green-50 dark:bg-green-900/30 border-green-500 text-green-800 dark:text-green-200',
    error: 'bg-red-50 dark:bg-red-900/30 border-red-500 text-red-800 dark:text-red-200',
    warning: 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-500 text-yellow-800 dark:text-yellow-200',
    info: 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-800 dark:text-blue-200',
  };

  const iconPaths: Record<ToastType, string> = {
    success: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    error: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
    warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  };

  const positionClasses: Record<ToastPosition, string> = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  const actionButtonStyles: Record<ToastType, string> = {
    success: 'text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-800/50',
    error: 'text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-800/50',
    warning: 'text-yellow-700 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-800/50',
    info: 'text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800/50',
  };

  return (
    <div
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
      data-toast-id={id}
      className={`fixed z-50 ${positionClasses[position]} animate-slide-in ${className}`}
    >
      <div
        className={`flex items-center gap-3 p-4 rounded-lg border-l-4 shadow-lg max-w-md ${typeStyles[type]}`}
      >
        {/* Icon */}
        <svg
          className="w-6 h-6 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={iconPaths[type]}
          />
        </svg>

        {/* Message */}
        <p className="flex-1 text-sm font-medium">{message}</p>

        {/* Action button */}
        {action && (
          <button
            onClick={handleActionClick}
            className={`flex-shrink-0 text-sm font-semibold px-3 py-1 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-current focus:ring-offset-2 ${actionButtonStyles[type]}`}
          >
            {action.label}
          </button>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          aria-label={t('toast.close', 'Close notification')}
          className="flex-shrink-0 text-current opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-current focus:ring-offset-2 rounded p-1 transition-opacity"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Export types and constants for use by ToastContainer and useToast
export { DEFAULT_DURATIONS };
