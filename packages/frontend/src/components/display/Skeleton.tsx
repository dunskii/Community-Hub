import React from 'react';

interface SkeletonProps {
  /** Skeleton variant */
  variant?: 'text' | 'circular' | 'rectangular';
  /** Width */
  width?: string | number;
  /** Height */
  height?: string | number;
  /** Number of lines (for text variant) */
  lines?: number;
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  lines = 1,
}: SkeletonProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'circular':
        return 'rounded-full';
      case 'rectangular':
        return 'rounded';
      case 'text':
      default:
        return 'rounded h-4';
    }
  };

  const getStyles = (): React.CSSProperties => {
    const styles: React.CSSProperties = {};
    if (width) styles.width = typeof width === 'number' ? `${width}px` : width;
    if (height) styles.height = typeof height === 'number' ? `${height}px` : height;
    return styles;
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className="space-y-2" aria-busy="true" aria-live="polite">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`bg-gray-200 animate-pulse ${getVariantClasses()}`}
            style={{
              ...getStyles(),
              width: index === lines - 1 ? '60%' : '100%',
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`bg-gray-200 animate-pulse ${getVariantClasses()}`}
      style={getStyles()}
      aria-busy="true"
      aria-live="polite"
    />
  );
}
