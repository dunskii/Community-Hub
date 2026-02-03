import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';

interface FormFieldProps {
  /** The label text displayed above the input */
  label: string;
  /** HTML id that associates the label with the input */
  id: string;
  /** Error message to display below the input */
  error?: string;
  /** Hint text displayed below the input */
  hint?: string;
  /** Whether the field is required */
  required?: boolean;
  /** The input/select/textarea element */
  children: ReactNode;
  /** Additional CSS classes for the wrapper */
  className?: string;
}

/**
 * Form field wrapper [Spec §6.3, §7.1].
 *
 * Handles label association, error display, required indicators,
 * and hint text. The actual input element is passed as children.
 *
 * - Label linked to input via htmlFor/id [Spec §3.6]
 * - Error/hint linked to input via aria-describedby
 * - aria-invalid set on input when error is present
 * - Required indicator with visual asterisk
 */
export function FormField({
  label,
  id,
  error,
  hint,
  required = false,
  children,
  className = '',
}: FormFieldProps) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  // Build aria-describedby value based on which helper text is visible
  const describedBy = error ? errorId : hint ? hintId : undefined;

  // Inject aria-describedby and aria-invalid onto the child input element
  const enhancedChildren = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
      })
    : children;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label htmlFor={id} className="text-sm font-semibold text-text-dark">
        {label}
        {required && (
          <span className="text-error ml-1" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {enhancedChildren}
      {hint && !error && (
        <p id={hintId} className="text-caption text-text-light">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-caption text-error">
          {error}
        </p>
      )}
    </div>
  );
}
