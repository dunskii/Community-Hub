import React from 'react';

type SkeletonVariant = 'text' | 'circular' | 'rectangular' | 'rounded';
type SkeletonAnimation = 'shimmer' | 'pulse' | 'none';

interface SkeletonProps {
  /** Skeleton variant */
  variant?: SkeletonVariant;
  /** Width - number (px) or string (any CSS value) */
  width?: string | number;
  /** Height - number (px) or string (any CSS value) */
  height?: string | number;
  /** Number of lines (for text variant) */
  lines?: number;
  /** Animation type - shimmer (gradient sweep), pulse (opacity), or none */
  animation?: SkeletonAnimation;
  /** Additional CSS classes */
  className?: string;
  /** Accessible label for screen readers */
  'aria-label'?: string;
}

/**
 * Skeleton loading placeholder component
 *
 * [UI/UX Spec v2.2 §11.7 - Loading States]
 *
 * Features:
 * - Shimmer animation (default) - smooth gradient sweep
 * - Pulse animation - opacity fade
 * - Respects prefers-reduced-motion
 * - Dark mode compatible via CSS variables
 * - Multiple variants: text, circular, rectangular, rounded
 *
 * @example
 * ```tsx
 * // Text skeleton (default)
 * <Skeleton />
 * <Skeleton lines={3} />
 *
 * // Avatar placeholder
 * <Skeleton variant="circular" width={48} height={48} />
 *
 * // Image placeholder
 * <Skeleton variant="rectangular" width="100%" height={200} />
 *
 * // Card placeholder
 * <Skeleton variant="rounded" width="100%" height={120} />
 * ```
 */
export function Skeleton({
  variant = 'text',
  width,
  height,
  lines = 1,
  animation = 'shimmer',
  className = '',
  'aria-label': ariaLabel,
}: SkeletonProps) {
  const getVariantClasses = (): string => {
    switch (variant) {
      case 'circular':
        return 'rounded-full';
      case 'rectangular':
        return 'rounded-none';
      case 'rounded':
        return 'rounded-lg';
      case 'text':
      default:
        return 'rounded h-4';
    }
  };

  const getAnimationClasses = (): string => {
    switch (animation) {
      case 'shimmer':
        return 'animate-shimmer';
      case 'pulse':
        return 'animate-pulse';
      case 'none':
      default:
        return '';
    }
  };

  const getBaseClasses = (): string => {
    // Use theme-aware colors for dark mode support
    const bgClass = animation === 'shimmer'
      ? '' // shimmer animation applies its own gradient background
      : 'bg-neutral-medium dark:bg-border';

    return [
      bgClass,
      getAnimationClasses(),
      getVariantClasses(),
      className,
    ].filter(Boolean).join(' ');
  };

  const getStyles = (): React.CSSProperties => {
    const styles: React.CSSProperties = {};
    if (width) styles.width = typeof width === 'number' ? `${width}px` : width;
    if (height) styles.height = typeof height === 'number' ? `${height}px` : height;
    return styles;
  };

  // Multi-line text skeleton
  if (variant === 'text' && lines > 1) {
    return (
      <div
        className="space-y-2"
        role="status"
        aria-busy="true"
        aria-live="polite"
        aria-label={ariaLabel || 'Loading content'}
      >
        <span className="sr-only">{ariaLabel || 'Loading content'}</span>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={getBaseClasses()}
            style={{
              ...getStyles(),
              // Last line is shorter for natural text appearance
              width: index === lines - 1 ? '60%' : width || '100%',
            }}
          />
        ))}
      </div>
    );
  }

  // Single skeleton element
  return (
    <div
      className={getBaseClasses()}
      style={getStyles()}
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label={ariaLabel || 'Loading'}
    >
      <span className="sr-only">{ariaLabel || 'Loading'}</span>
    </div>
  );
}

/**
 * Pre-composed skeleton for common use cases
 */
export const SkeletonPresets = {
  /** Avatar skeleton - circular, 40x40px */
  Avatar: ({ size = 40 }: { size?: number }) => (
    <Skeleton variant="circular" width={size} height={size} aria-label="Loading avatar" />
  ),

  /** Thumbnail skeleton - rounded, 80x80px */
  Thumbnail: ({ size = 80 }: { size?: number }) => (
    <Skeleton variant="rounded" width={size} height={size} aria-label="Loading thumbnail" />
  ),

  /** Title skeleton - full width, h6 height */
  Title: () => (
    <Skeleton variant="text" width="70%" height={24} aria-label="Loading title" />
  ),

  /** Paragraph skeleton - 3 lines */
  Paragraph: () => (
    <Skeleton variant="text" lines={3} aria-label="Loading text" />
  ),

  /** Button skeleton */
  Button: ({ width = 100 }: { width?: number }) => (
    <Skeleton variant="rounded" width={width} height={40} aria-label="Loading button" />
  ),

  /** Image skeleton - 16:9 aspect ratio */
  Image: ({ width = '100%' }: { width?: string | number }) => (
    <Skeleton
      variant="rectangular"
      width={width}
      height={0}
      className="aspect-video"
      aria-label="Loading image"
    />
  ),
};

export type { SkeletonProps, SkeletonVariant, SkeletonAnimation };
