import React from 'react';

interface EmptyStateProps {
  /** Icon or illustration */
  icon?: React.ReactNode;
  /** Headline */
  title: string;
  /** Description */
  description?: string;
  /** Call to action button */
  action?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      {icon && (
        <div className="mb-4 text-gray-400">
          {icon}
        </div>
      )}

      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>

      {description && (
        <p className="text-sm text-gray-500 mb-6 max-w-md">
          {description}
        </p>
      )}

      {action && (
        <div>
          {action}
        </div>
      )}
    </div>
  );
}
