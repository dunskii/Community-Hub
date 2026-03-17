/**
 * RetryBanner Component
 *
 * [UI/UX Spec v2.2 §8.6 - Network Retry Banner]
 *
 * Displays a banner when an API call fails, with retry functionality.
 * Shows "Unable to load. Check your connection." with retry button.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';

export interface RetryBannerProps {
  /** Whether the banner is visible */
  isVisible: boolean;
  /** Retry callback */
  onRetry: () => void;
  /** Optional custom message */
  message?: string;
  /** Whether retry is in progress */
  isRetrying?: boolean;
  /** Dismiss callback */
  onDismiss?: () => void;
}

export function RetryBanner({
  isVisible,
  onRetry,
  message,
  isRetrying = false,
  onDismiss,
}: RetryBannerProps) {
  const { t } = useTranslation();

  if (!isVisible) {
    return null;
  }

  return (
    <div
      role="alert"
      className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4"
    >
      <div className="flex items-start gap-3">
        {/* Error icon */}
        <div className="flex-shrink-0">
          <svg
            className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* Message */}
        <div className="flex-1">
          <p className="text-sm text-red-800 dark:text-red-200">
            {message || t('errorBoundary.networkError', 'Unable to load. Check your connection.')}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className="inline-flex items-center px-3 py-1.5 min-h-[36px] text-sm font-medium text-red-700 dark:text-red-200 bg-red-100 dark:bg-red-800/50 rounded-md hover:bg-red-200 dark:hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isRetrying ? (
              <>
                <svg
                  className="w-4 h-4 ltr:mr-1.5 rtl:ml-1.5 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                {t('errorBoundary.retrying', 'Retrying...')}
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 ltr:mr-1.5 rtl:ml-1.5"
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
                {t('sync.retry', 'Retry')}
              </>
            )}
          </button>

          {onDismiss && (
            <button
              onClick={onDismiss}
              aria-label={t('common.close', 'Close')}
              className="p-1.5 min-w-[36px] min-h-[36px] text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-800/50 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors"
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
          )}
        </div>
      </div>
    </div>
  );
}
