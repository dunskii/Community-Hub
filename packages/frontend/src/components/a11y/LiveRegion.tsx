import React from 'react';

interface LiveRegionProps {
  /** Message to announce */
  message: string;
  /** Politeness level */
  politeness?: 'polite' | 'assertive';
  /** Role */
  role?: 'status' | 'alert';
}

/**
 * ARIA live region for screen reader announcements
 * Use this component to announce dynamic changes to screen reader users
 */
export function LiveRegion({
  message,
  politeness = 'polite',
  role = 'status',
}: LiveRegionProps) {
  if (!message) return null;

  return (
    <div
      role={role}
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}
