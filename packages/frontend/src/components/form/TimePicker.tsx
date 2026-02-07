import React, { forwardRef, InputHTMLAttributes } from 'react';

interface TimePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** TimePicker label */
  label?: string;
  /** Error message to display */
  error?: string;
  /** Helper text to display below input */
  helperText?: string;
  /** Full width input */
  fullWidth?: boolean;
}

export const TimePicker = forwardRef<HTMLInputElement, TimePickerProps>(function TimePicker(
  {
    label,
    error,
    helperText,
    fullWidth = false,
    id,
    className = '',
    ...props
  },
  ref
) {
  const timeId = id || `time-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = error ? `${timeId}-error` : undefined;
  const helperId = helperText ? `${timeId}-helper` : undefined;

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
      {label && (
        <label
          htmlFor={timeId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
      )}

      <div className="relative">
        <input
          ref={ref}
          type="time"
          id={timeId}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={[errorId, helperId].filter(Boolean).join(' ') || undefined}
          className={`
            w-full px-4 py-2 rounded-md border transition-colors
            ${
              error
                ? 'border-error text-error focus:border-error focus:ring-error'
                : 'border-gray-300 focus:border-primary focus:ring-primary'
            }
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
          `}
          {...props}
        />

        {/* Clock icon */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>

      {error && (
        <p id={errorId} className="mt-1 text-sm text-error" role="alert">
          {error}
        </p>
      )}

      {helperText && !error && (
        <p id={helperId} className="mt-1 text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
});
