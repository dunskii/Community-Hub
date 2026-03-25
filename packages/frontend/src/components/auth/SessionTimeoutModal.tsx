/**
 * SessionTimeoutModal Component
 *
 * [UI/UX Spec v2.2 §8.3 - Session Timeout Flow]
 *
 * Displays when a 401 response is detected, giving users options to
 * log in again or continue as guest. Preserves current URL for redirect after login.
 */

import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';

export interface SessionTimeoutModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Optional callback when user chooses to log in */
  onLogin?: () => void;
  /** Optional callback when user chooses to continue as guest */
  onContinueAsGuest?: () => void;
}

export function SessionTimeoutModal({
  isOpen,
  onClose,
  onLogin,
  onContinueAsGuest,
}: SessionTimeoutModalProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Focus trap and escape key handling
  useEffect(() => {
    if (!isOpen) return;

    // Store previously focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Focus modal
    modalRef.current?.focus();

    // Handle escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleContinueAsGuest();
      }
    };

    // Focus trap
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('keydown', handleTab);

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleTab);
      document.body.style.overflow = '';

      // Restore focus
      previousActiveElement.current?.focus();
    };
  }, [isOpen]);

  const handleLogin = () => {
    // Store current URL for redirect after login
    const returnUrl = location.pathname + location.search;
    sessionStorage.setItem('returnUrl', returnUrl);

    onClose();
    onLogin?.();
    navigate('/login');
  };

  const handleContinueAsGuest = () => {
    onClose();
    onContinueAsGuest?.();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-timeout-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 dark:bg-black/70 transition-opacity"
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4"
      >
        <div className="p-6">
          {/* Icon */}
          <div className="mx-auto w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-orange-600 dark:text-orange-400"
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
          </div>

          {/* Title */}
          <h2
            id="session-timeout-title"
            className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-2"
          >
            {t('session.expired', 'Your session has expired')}
          </h2>

          {/* Message */}
          <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
            {t('session.expiredMessage', 'For your security, you have been logged out due to inactivity.')}
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleLogin}
              className="w-full inline-flex items-center justify-center px-6 py-3 min-h-[44px] bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
            >
              <svg
                className="w-5 h-5 ltr:mr-2 rtl:ml-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                />
              </svg>
              {t('session.loginAgain', 'Log in again')}
            </button>

            <button
              onClick={handleContinueAsGuest}
              className="w-full inline-flex items-center justify-center px-6 py-3 min-h-[44px] bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
            >
              {t('session.continueAsGuest', 'Continue as guest')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
