/**
 * ErrorBoundary Component
 *
 * [UI/UX Spec v2.2 §8.1 - Error Recovery Flows]
 *
 * Catches JavaScript errors in child components and displays a fallback UI.
 * Provides retry functionality and error reporting.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Custom fallback UI */
  fallback?: ReactNode;
  /** Called when error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Reset on route change */
  resetOnRouteChange?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// Inner class component that catches errors
class ErrorBoundaryInner extends Component<
  ErrorBoundaryProps & { location: string; onReset: () => void },
  ErrorBoundaryState
> {
  private previousLocation: string;

  constructor(props: ErrorBoundaryProps & { location: string; onReset: () => void }) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
    this.previousLocation = props.location;
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Log error to console in development only
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error);
      console.error('Component stack:', errorInfo.componentStack);
    }

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // Report to logging service (placeholder for future integration)
    this.reportError(error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps & { location: string }): void {
    // Reset on route change if enabled
    if (
      this.props.resetOnRouteChange &&
      this.state.hasError &&
      this.props.location !== this.previousLocation
    ) {
      this.previousLocation = this.props.location;
      this.resetError();
    }
  }

  private reportError(error: Error, errorInfo: ErrorInfo): void {
    // Placeholder for error reporting service integration
    // Could send to Sentry, LogRocket, or custom endpoint
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    // Log structured error for debugging
    if (process.env.NODE_ENV === 'development') {
      console.group('Error Report');
      console.log('Error:', errorReport);
      console.groupEnd();
    }
  }

  private resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    this.props.onReset();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          onRetry={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

// Functional fallback component with i18n
interface ErrorFallbackProps {
  error: Error | null;
  onRetry: () => void;
}

function ErrorFallback({ error, onRetry }: ErrorFallbackProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleGoHome = () => {
    onRetry();
    navigate('/');
  };

  return (
    <div
      role="alert"
      className="min-h-[50vh] flex items-center justify-center p-4"
    >
      <div className="max-w-md w-full text-center">
        {/* Error icon */}
        <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
          <svg
            className="w-8 h-8 text-red-600 dark:text-red-400"
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
        </div>

        {/* Error message */}
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {t('errorBoundary.title', 'Something went wrong')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {t('errorBoundary.message', "We're sorry, but something unexpected happened. Please try again.")}
        </p>

        {/* Error details (development only) */}
        {process.env.NODE_ENV === 'development' && error && (
          <details className="mb-6 text-left bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('errorBoundary.details', 'Error details')}
            </summary>
            <pre className="mt-2 text-xs text-red-600 dark:text-red-400 overflow-auto max-h-40">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onRetry}
            className="inline-flex items-center justify-center px-6 py-3 min-h-[44px] bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors"
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
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {t('errorBoundary.tryAgain', 'Try again')}
          </button>
          <button
            onClick={handleGoHome}
            className="inline-flex items-center justify-center px-6 py-3 min-h-[44px] bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors"
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
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            {t('errorBoundary.goHome', 'Go to home')}
          </button>
        </div>
      </div>
    </div>
  );
}

// Wrapper component that provides router context
export function ErrorBoundary({
  children,
  fallback,
  onError,
  resetOnRouteChange = true,
}: ErrorBoundaryProps) {
  const location = useLocation();
  const [resetKey, setResetKey] = React.useState(0);

  const handleReset = () => {
    setResetKey((prev) => prev + 1);
  };

  return (
    <ErrorBoundaryInner
      key={resetKey}
      fallback={fallback}
      onError={onError}
      resetOnRouteChange={resetOnRouteChange}
      location={location.pathname}
      onReset={handleReset}
    >
      {children}
    </ErrorBoundaryInner>
  );
}
