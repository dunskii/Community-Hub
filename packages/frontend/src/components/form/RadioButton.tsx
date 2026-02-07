import React, { forwardRef, InputHTMLAttributes } from 'react';

interface RadioButtonProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Radio button label */
  label: string;
  /** Error message to display */
  error?: string;
}

export const RadioButton = forwardRef<HTMLInputElement, RadioButtonProps>(function RadioButton(
  {
    label,
    error,
    id,
    className = '',
    ...props
  },
  ref
) {
  const radioId = id || `radio-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = error ? `${radioId}-error` : undefined;

  return (
    <div className={className}>
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            ref={ref}
            type="radio"
            id={radioId}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={errorId}
            className={`
              w-5 h-5 border transition-colors cursor-pointer
              ${
                error
                  ? 'border-error text-error focus:ring-error'
                  : 'border-gray-300 text-primary focus:ring-primary'
              }
              focus:outline-none focus:ring-2 focus:ring-offset-2
              disabled:bg-gray-100 disabled:cursor-not-allowed
            `}
            style={{ minWidth: '20px', minHeight: '20px' }}
            {...props}
          />
        </div>
        <div className="ml-3 text-sm">
          <label htmlFor={radioId} className="font-medium text-gray-700 cursor-pointer">
            {label}
          </label>
        </div>
      </div>

      {error && (
        <p id={errorId} className="mt-1 text-sm text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});
