import React, { forwardRef, InputHTMLAttributes } from 'react';

interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Toggle label */
  label?: string;
  /** Error message to display */
  error?: string;
  /** Label position */
  labelPosition?: 'left' | 'right';
}

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(function Toggle(
  {
    label,
    error,
    labelPosition = 'right',
    id,
    className = '',
    checked,
    ...props
  },
  ref
) {
  const toggleId = id || `toggle-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = error ? `${toggleId}-error` : undefined;

  return (
    <div className={className}>
      <div className={`flex items-center ${labelPosition === 'left' ? 'flex-row-reverse justify-end' : ''}`}>
        <div className="relative inline-block">
          <input
            ref={ref}
            type="checkbox"
            id={toggleId}
            role="switch"
            aria-checked={checked}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={errorId}
            aria-label={label}
            checked={checked}
            className="sr-only peer"
            {...props}
          />
          <label
            htmlFor={toggleId}
            aria-hidden="true"
            className={`
              block w-11 h-6 rounded-full cursor-pointer transition-colors
              ${
                error
                  ? 'bg-error'
                  : 'bg-gray-300 peer-checked:bg-primary'
              }
              peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary peer-focus:ring-offset-2
              peer-disabled:bg-gray-200 peer-disabled:cursor-not-allowed
            `}
            style={{ minWidth: '44px', minHeight: '24px' }}
          >
            <span
              className={`
                absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200
                peer-checked:translate-x-5
              `}
            />
          </label>
        </div>
        {label && (
          <span className={`text-sm font-medium text-gray-700 ${labelPosition === 'left' ? 'mr-3' : 'ml-3'}`}>
            {label}
          </span>
        )}
      </div>

      {error && (
        <p id={errorId} className="mt-1 text-sm text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});
