import React, { forwardRef, TextareaHTMLAttributes, useEffect, useRef, useState } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Textarea label */
  label?: string;
  /** Error message to display */
  error?: string;
  /** Helper text to display below textarea */
  helperText?: string;
  /** Full width textarea */
  fullWidth?: boolean;
  /** Auto-expand textarea as content grows */
  autoExpand?: boolean;
  /** Character counter (shows current/max) */
  showCounter?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    label,
    error,
    helperText,
    fullWidth = false,
    autoExpand = false,
    showCounter = false,
    id,
    className = '',
    maxLength,
    onChange,
    ...props
  },
  ref
) {
  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = error ? `${textareaId}-error` : undefined;
  const helperId = helperText ? `${textareaId}-helper` : undefined;
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const [charCount, setCharCount] = useState(0);

  // Merge refs
  const textareaRef = (ref || internalRef) as React.RefObject<HTMLTextAreaElement>;

  // Auto-expand functionality
  useEffect(() => {
    if (autoExpand && textareaRef && 'current' in textareaRef && textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [autoExpand, textareaRef, charCount]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCharCount(e.target.value.length);
    if (onChange) {
      onChange(e);
    }
  };

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
      )}

      <textarea
        ref={textareaRef}
        id={textareaId}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={[errorId, helperId].filter(Boolean).join(' ') || undefined}
        maxLength={maxLength}
        onChange={handleChange}
        className={`
          w-full px-4 py-2 rounded-md border transition-colors resize-y
          ${
            error
              ? 'border-error text-error focus:border-error focus:ring-error'
              : 'border-gray-300 focus:border-primary focus:ring-primary'
          }
          focus:outline-none focus:ring-2 focus:ring-offset-0
          disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
          ${autoExpand ? 'resize-none overflow-hidden' : ''}
        `}
        {...props}
      />

      <div className="flex justify-between items-start mt-1">
        <div className="flex-1">
          {error && (
            <p id={errorId} className="text-sm text-error" role="alert">
              {error}
            </p>
          )}

          {helperText && !error && (
            <p id={helperId} className="text-sm text-gray-500">
              {helperText}
            </p>
          )}
        </div>

        {showCounter && maxLength && (
          <p className="text-sm text-gray-500 ml-4 flex-shrink-0">
            {charCount}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
});
