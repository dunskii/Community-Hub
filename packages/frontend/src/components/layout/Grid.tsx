import React from 'react';

interface GridProps {
  /** Child GridItem components */
  children: React.ReactNode;
  /** Gap between grid items (in Tailwind units) */
  gap?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
}

interface GridItemProps {
  /** Child content */
  children: React.ReactNode;
  /** Column span (1-12) */
  span?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  /** Column span on mobile (1-12) */
  spanMobile?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  /** Column span on tablet (1-12) */
  spanTablet?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  /** Column span on desktop (1-12) */
  spanDesktop?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  /** Additional CSS classes */
  className?: string;
}

export function Grid({ children, gap = 'md', className = '' }: GridProps) {
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
  };

  return (
    <div className={`grid grid-cols-12 ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
}

export function GridItem({
  children,
  span = 12,
  spanMobile,
  spanTablet,
  spanDesktop,
  className = '',
}: GridItemProps) {
  const mobileSpan = spanMobile || span;
  const tabletSpan = spanTablet || span;
  const desktopSpan = spanDesktop || span;

  const spanClasses = `col-span-${mobileSpan} md:col-span-${tabletSpan} lg:col-span-${desktopSpan}`;

  return (
    <div className={`${spanClasses} ${className}`}>
      {children}
    </div>
  );
}

// Export both as named exports
Grid.Item = GridItem;
