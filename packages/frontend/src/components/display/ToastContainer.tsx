/**
 * ToastContainer Component
 *
 * [UI/UX Spec v2.2 §11.5 - Toast Notifications]
 *
 * Manages multiple toast notifications with:
 * - Maximum 3 visible toasts (per spec)
 * - Newest on top stacking
 * - Proper animation for stack changes
 * - Position-based grouping
 *
 * @example
 * ```tsx
 * // Used internally by ToastProvider
 * <ToastContainer toasts={toasts} onDismiss={handleDismiss} position="top-right" />
 * ```
 */

import React from 'react';
import type { ToastType, ToastPosition, ToastAction } from './Toast';

export interface ToastItem {
  /** Unique identifier */
  id: string;
  /** Toast message */
  message: string;
  /** Toast type */
  type: ToastType;
  /** Custom duration (optional) */
  duration?: number;
  /** Persistent toast */
  persistent?: boolean;
  /** Action button */
  action?: ToastAction;
  /** Creation timestamp for ordering */
  createdAt: number;
}

interface ToastContainerProps {
  /** Array of toast items */
  toasts: ToastItem[];
  /** Handler to dismiss a toast by ID */
  onDismiss: (id: string) => void;
  /** Position for all toasts */
  position?: ToastPosition;
  /** Maximum visible toasts */
  maxVisible?: number;
}

/** Default durations by toast type (in ms) */
const DEFAULT_DURATIONS: Record<ToastType, number> = {
  success: 4000,
  info: 4000,
  warning: 6000,
  error: 8000,
};

const positionClasses: Record<ToastPosition, string> = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
};

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

const actionButtonStyles: Record<ToastType, string> = {
  success: 'text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-800/50',
  error: 'text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-800/50',
  warning: 'text-yellow-700 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-800/50',
  info: 'text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800/50',
};

/**
 * Individual toast item within the container
 */
function ToastItemComponent({
  toast,
  index,
  onDismiss,
}: {
  toast: ToastItem;
  index: number;
  onDismiss: (id: string) => void;
}) {
  const { id, message, type, duration, persistent, action } = toast;
  const effectiveDuration = persistent ? 0 : (duration ?? DEFAULT_DURATIONS[type]);

  // Auto-dismiss timer
  React.useEffect(() => {
    if (effectiveDuration > 0) {
      const timer = setTimeout(() => {
        onDismiss(id);
      }, effectiveDuration);
      return () => clearTimeout(timer);
    }
  }, [id, effectiveDuration, onDismiss]);

  const handleActionClick = () => {
    action?.onClick();
    onDismiss(id);
  };

  return (
    <div
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
      data-toast-id={id}
      className="animate-slide-in"
      style={{
        // Stack animation delay based on index
        animationDelay: `${index * 50}ms`,
      }}
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
          onClick={() => onDismiss(id)}
          aria-label="Close notification"
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

export function ToastContainer({
  toasts,
  onDismiss,
  position = 'top-right',
  maxVisible = 3,
}: ToastContainerProps) {
  // Sort by creation time (newest first) and limit to maxVisible
  const visibleToasts = [...toasts]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, maxVisible);

  if (visibleToasts.length === 0) {
    return null;
  }

  // Determine stack direction based on position
  const isTop = position.startsWith('top');
  const stackDirection = isTop ? 'flex-col' : 'flex-col-reverse';

  return (
    <div
      className={`fixed z-50 ${positionClasses[position]} flex ${stackDirection} gap-2 pointer-events-none`}
      aria-label="Notifications"
    >
      {visibleToasts.map((toast, index) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItemComponent
            toast={toast}
            index={index}
            onDismiss={onDismiss}
          />
        </div>
      ))}
    </div>
  );
}
