import React, { forwardRef, InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Input label */
  label?: string;
  /** Error message to display */
  error?: string;
  /** Helper text to display below input */
  helperText?: string;
  /** Icon to display before input */
  icon?: React.ReactNode;
  /** Icon to display after input */
  iconAfter?: React.ReactNode;
  /** Full width input */
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    error,
    helperText,
    icon,
    iconAfter,
    fullWidth = false,
    id,
    className = '',
    ...props
  },
  ref
) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = error ? `${inputId}-error` : undefined;
  const helperId = helperText ? `${inputId}-helper` : undefined;

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={[errorId, helperId].filter(Boolean).join(' ') || undefined}
          className={`
            w-full px-4 py-2 rounded-md border transition-colors
            ${icon ? 'pl-10' : ''}
            ${iconAfter ? 'pr-10' : ''}
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

        {iconAfter && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {iconAfter}
          </div>
        )}
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
