/**
 * PageContainer Component
 *
 * Responsive page container with max-width and padding.
 * Used to wrap page content with consistent margins and responsive sizing.
 */

import React from 'react';

interface PageContainerProps {
  /** Content to wrap */
  children: React.ReactNode;
  /** Max width variant */
  maxWidth?: 'narrow' | 'normal' | 'wide' | 'full';
  /** Additional CSS classes */
  className?: string;
}

export function PageContainer({
  children,
  maxWidth = 'normal',
  className = '',
}: PageContainerProps) {
  const maxWidthClass = {
    narrow: 'max-w-3xl', // 800px
    normal: 'max-w-7xl', // 1200px
    wide: 'max-w-screen-2xl', // 1536px
    full: 'max-w-full',
  }[maxWidth];

  return (
    <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${maxWidthClass} ${className}`}>
      {children}
    </div>
  );
}
