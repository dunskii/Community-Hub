import React from 'react';

interface AlertProps {
  /** Alert message */
  message: string;
  /** Alert title */
  title?: string;
  /** Alert type (based on spec §22.2 alert colors) */
  type: 'critical' | 'warning' | 'advisory' | 'info';
  /** Dismissible alert */
  dismissible?: boolean;
  /** Close handler */
  onClose?: () => void;
  /** Additional actions */
  actions?: React.ReactNode;
}

export function Alert({
  message,
  title,
  type,
  dismissible = false,
  onClose,
  actions,
}: AlertProps) {
  const typeStyles = {
    critical: 'bg-red-50 border-red-500 text-red-900',
    warning: 'bg-orange-50 border-orange-500 text-orange-900',
    advisory: 'bg-yellow-50 border-yellow-500 text-yellow-900',
    info: 'bg-blue-50 border-blue-500 text-blue-900',
  };

  const iconPaths = {
    critical: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
    warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    advisory: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  };

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-4 rounded-lg border-l-4 ${typeStyles[type]}`}
    >
      <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPaths[type]} />
      </svg>

      <div className="flex-1">
        {title && (
          <h3 className="text-sm font-semibold mb-1">{title}</h3>
        )}
        <p className="text-sm">{message}</p>
        {actions && (
          <div className="mt-3">
            {actions}
          </div>
        )}
      </div>

      {dismissible && onClose && (
        <button
          onClick={onClose}
          aria-label="Dismiss alert"
          className="flex-shrink-0 text-current opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-current focus:ring-offset-2 rounded p-1"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
