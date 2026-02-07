import React, { forwardRef, InputHTMLAttributes } from 'react';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Checkbox label */
  label?: string;
  /** Error message to display */
  error?: string;
  /** Indeterminate state */
  indeterminate?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  {
    label,
    error,
    indeterminate = false,
    id,
    className = '',
    ...props
  },
  ref
) {
  const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = error ? `${checkboxId}-error` : undefined;

  // Handle indeterminate state
  React.useEffect(() => {
    if (ref && 'current' in ref && ref.current) {
      ref.current.indeterminate = indeterminate;
    }
  }, [ref, indeterminate]);

  return (
    <div className={className}>
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={errorId}
            className={`
              w-5 h-5 rounded border transition-colors cursor-pointer
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
        {label && (
          <div className="ml-3 text-sm">
            <label htmlFor={checkboxId} className="font-medium text-gray-700 cursor-pointer">
              {label}
            </label>
          </div>
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
