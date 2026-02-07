import React, { forwardRef, InputHTMLAttributes, useState } from 'react';

interface FileUploadProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** FileUpload label */
  label?: string;
  /** Error message to display */
  error?: string;
  /** Helper text to display below input */
  helperText?: string;
  /** Full width input */
  fullWidth?: boolean;
  /** Show file preview */
  showPreview?: boolean;
  /** Max file size in MB */
  maxSizeMB?: number;
}

export const FileUpload = forwardRef<HTMLInputElement, FileUploadProps>(function FileUpload(
  {
    label,
    error,
    helperText,
    fullWidth = false,
    showPreview = true,
    maxSizeMB,
    id,
    className = '',
    onChange,
    ...props
  },
  ref
) {
  const fileId = id || `file-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = error ? `${fileId}-error` : undefined;
  const helperId = helperText ? `${fileId}-helper` : undefined;
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
    if (onChange) {
      onChange(e);
    }
  };

  const handleFiles = (files: FileList) => {
    const file = files[0];
    setFileName(file.name);

    // Show preview for images
    if (showPreview && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
      {label && (
        <label
          htmlFor={fileId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
      )}

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-6 transition-colors
          ${dragActive ? 'border-primary bg-primary-tint-90' : 'border-gray-300'}
          ${error ? 'border-error' : ''}
        `}
      >
        <input
          ref={ref}
          type="file"
          id={fileId}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={[errorId, helperId].filter(Boolean).join(' ') || undefined}
          onChange={handleChange}
          className="sr-only"
          {...props}
        />

        <label
          htmlFor={fileId}
          className="flex flex-col items-center cursor-pointer"
        >
          <svg
            className="w-12 h-12 text-gray-400 mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>

          {fileName ? (
            <p className="text-sm font-medium text-gray-900">{fileName}</p>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-900">
                Drop files here or click to upload
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {maxSizeMB && `Max file size: ${maxSizeMB}MB`}
              </p>
            </>
          )}
        </label>

        {/* Preview */}
        {showPreview && previewUrl && (
          <div className="mt-4">
            <img
              src={previewUrl}
              alt="Preview"
              className="max-h-48 mx-auto rounded"
            />
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
