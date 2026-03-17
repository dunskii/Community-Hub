/**
 * SyncStatus Component
 *
 * [UI/UX Spec v2.2 §12.3 - Offline Behaviour]
 *
 * Visual indicator for sync status of offline actions.
 * States:
 * - syncing: Rotating arrows icon
 * - synced: Checkmark (fades after 2s)
 * - failed: Warning icon with retry button
 * - pending: Clock icon with tooltip
 *
 * @example
 * ```tsx
 * <SyncStatus status="syncing" />
 * <SyncStatus status="synced" />
 * <SyncStatus status="failed" onRetry={handleRetry} failedCount={3} />
 * <SyncStatus status="pending" pendingCount={5} />
 * ```
 */

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export type SyncStatusType = 'idle' | 'syncing' | 'synced' | 'failed' | 'pending';

interface SyncStatusProps {
  /** Current sync status */
  status: SyncStatusType;
  /** Number of pending items (for pending status) */
  pendingCount?: number;
  /** Number of failed items (for failed status) */
  failedCount?: number;
  /** Retry handler (for failed status) */
  onRetry?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Show as compact indicator (icon only) */
  compact?: boolean;
}

export function SyncStatus({
  status,
  pendingCount = 0,
  failedCount = 0,
  onRetry,
  className = '',
  compact = false,
}: SyncStatusProps) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(true);

  // Auto-hide synced status after 2 seconds
  useEffect(() => {
    if (status === 'synced') {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setVisible(true);
    }
  }, [status]);

  // Don't render idle or hidden synced
  if (status === 'idle' || (status === 'synced' && !visible)) {
    return null;
  }

  const statusConfig = {
    syncing: {
      icon: (
        <svg
          className="w-4 h-4 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      ),
      label: t('sync.syncing', 'Syncing...'),
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    synced: {
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      ),
      label: t('sync.synced', 'All changes synced'),
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    failed: {
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      ),
      label: t('sync.failed', '{{count}} items failed to sync', { count: failedCount }),
      color: 'text-error',
      bgColor: 'bg-error/10',
    },
    pending: {
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      label: t('sync.pending', 'Will sync when online'),
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
  };

  const config = statusConfig[status];

  if (compact) {
    return (
      <div
        className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${config.bgColor} ${config.color} ${className}`}
        role="status"
        aria-label={config.label}
        title={config.label}
      >
        {config.icon}
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${config.bgColor} ${config.color} ${className}`}
      role="status"
      aria-live="polite"
    >
      {config.icon}
      <span>{config.label}</span>

      {/* Retry button for failed status */}
      {status === 'failed' && onRetry && (
        <button
          onClick={onRetry}
          className="ml-1 font-medium underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-current focus:ring-offset-2 rounded"
        >
          {t('sync.retry', 'Retry')}
        </button>
      )}

      {/* Pending count badge */}
      {status === 'pending' && pendingCount > 0 && (
        <span className="ml-1 px-1.5 py-0.5 text-xs font-medium bg-warning/20 rounded">
          {pendingCount}
        </span>
      )}
    </div>
  );
}

/**
 * Hook for managing sync status state
 */
export function useSyncStatus() {
  const [status, setStatus] = useState<SyncStatusType>('idle');
  const [pendingCount, setPendingCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  const startSync = () => setStatus('syncing');
  const syncComplete = () => {
    setStatus('synced');
    setPendingCount(0);
    setFailedCount(0);
  };
  const syncFailed = (count: number) => {
    setStatus('failed');
    setFailedCount(count);
  };
  const addPending = (count: number = 1) => {
    setPendingCount((prev) => prev + count);
    setStatus('pending');
  };
  const reset = () => {
    setStatus('idle');
    setPendingCount(0);
    setFailedCount(0);
  };

  return {
    status,
    pendingCount,
    failedCount,
    startSync,
    syncComplete,
    syncFailed,
    addPending,
    reset,
  };
}
