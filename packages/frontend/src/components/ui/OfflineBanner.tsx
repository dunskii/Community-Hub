/**
 * OfflineBanner Component
 *
 * [UI/UX Spec v2.2 §12.3 - Offline Behaviour]
 *
 * Persistent banner shown when user is offline.
 * Features:
 * - Fixed at top of viewport
 * - Dismissible (but reappears on navigation)
 * - Accent color background with offline icon
 * - Accessible with ARIA live region
 *
 * @example
 * ```tsx
 * function App() {
 *   const { isOnline } = useOnlineStatus();
 *
 *   return (
 *     <>
 *       <OfflineBanner isOffline={!isOnline} />
 *       <MainContent />
 *     </>
 *   );
 * }
 * ```
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

interface OfflineBannerProps {
  /** Whether the user is offline */
  isOffline: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function OfflineBanner({ isOffline, className = '' }: OfflineBannerProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const [isDismissed, setIsDismissed] = useState(false);

  // Reset dismissed state on navigation
  useEffect(() => {
    setIsDismissed(false);
  }, [location.pathname]);

  // Reset dismissed state when coming back online then going offline again
  useEffect(() => {
    if (isOffline) {
      setIsDismissed(false);
    }
  }, [isOffline]);

  // Don't render if online or dismissed
  if (!isOffline || isDismissed) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={`offline-banner fixed top-0 left-0 right-0 z-[60] bg-warning dark:bg-warning/90 text-warning-content px-4 py-3 shadow-md ${className}`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Offline icon */}
          <svg
            className="w-5 h-5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
            />
          </svg>

          {/* Message */}
          <p className="text-sm font-medium">
            {t('offline.banner', "You're offline. Some features may be limited.")}
          </p>
        </div>

        {/* Dismiss button */}
        <button
          onClick={() => setIsDismissed(true)}
          className="flex-shrink-0 text-warning-content/80 hover:text-warning-content focus:outline-none focus:ring-2 focus:ring-warning-content focus:ring-offset-2 focus:ring-offset-warning rounded p-1 transition-colors"
          aria-label={t('offline.dismiss', 'Dismiss')}
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

/**
 * Compact offline indicator for inline use
 */
export function OfflineIndicator({ className = '' }: { className?: string }) {
  const { t } = useTranslation();

  return (
    <div
      className={`inline-flex items-center gap-1.5 text-warning text-sm ${className}`}
      role="status"
      aria-label={t('offline.status', 'Offline')}
    >
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
          d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
        />
      </svg>
      <span>{t('offline.status', 'Offline')}</span>
    </div>
  );
}
