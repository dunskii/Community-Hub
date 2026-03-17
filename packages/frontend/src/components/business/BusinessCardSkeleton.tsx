/**
 * BusinessCardSkeleton Component
 *
 * [UI/UX Spec v2.2 §11.7 - Loading States]
 *
 * Skeleton loading placeholder that matches BusinessCard layout.
 * Uses shimmer animation with prefers-reduced-motion support.
 *
 * @example
 * ```tsx
 * // Single card skeleton
 * <BusinessCardSkeleton />
 *
 * // Grid of skeletons
 * {Array.from({ length: 6 }).map((_, i) => (
 *   <BusinessCardSkeleton key={i} />
 * ))}
 * ```
 */

import { Skeleton } from '../display/Skeleton';

interface BusinessCardSkeletonProps {
  /** Animation type - shimmer (default), pulse, or none */
  animation?: 'shimmer' | 'pulse' | 'none';
  /** Additional CSS classes */
  className?: string;
}

export function BusinessCardSkeleton({
  animation = 'shimmer',
  className = '',
}: BusinessCardSkeletonProps) {
  return (
    <div
      className={`business-card ${className}`}
      role="status"
      aria-busy="true"
      aria-label="Loading business"
    >
      <span className="sr-only">Loading business card</span>

      {/* Business Photo Skeleton */}
      <div className="business-card__image">
        <Skeleton
          variant="rectangular"
          width="100%"
          height={160}
          animation={animation}
          aria-hidden="true"
        />
      </div>

      {/* Business Info Skeleton */}
      <div className="business-card__content">
        {/* Header - Name and Status */}
        <div className="business-card__header">
          <Skeleton
            variant="text"
            width="70%"
            height={24}
            animation={animation}
            aria-hidden="true"
          />
          <Skeleton
            variant="rounded"
            width={60}
            height={22}
            animation={animation}
            aria-hidden="true"
          />
        </div>

        {/* Description - 2 lines */}
        <div className="business-card__description mt-2">
          <Skeleton
            variant="text"
            lines={2}
            animation={animation}
            aria-hidden="true"
          />
        </div>

        {/* Metadata - Category, Price, Distance, Rating */}
        <div className="business-card__meta mt-3 flex gap-2 flex-wrap">
          <Skeleton
            variant="rounded"
            width={80}
            height={20}
            animation={animation}
            aria-hidden="true"
          />
          <Skeleton
            variant="text"
            width={40}
            height={20}
            animation={animation}
            aria-hidden="true"
          />
          <Skeleton
            variant="text"
            width={50}
            height={20}
            animation={animation}
            aria-hidden="true"
          />
          <Skeleton
            variant="text"
            width={60}
            height={20}
            animation={animation}
            aria-hidden="true"
          />
        </div>

        {/* Address */}
        <div className="business-card__address mt-2">
          <Skeleton
            variant="text"
            width="60%"
            height={16}
            animation={animation}
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Grid of BusinessCardSkeletons for loading states
 */
export function BusinessCardSkeletonGrid({
  count = 6,
  animation = 'shimmer',
}: {
  count?: number;
  animation?: 'shimmer' | 'pulse' | 'none';
}) {
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      role="status"
      aria-busy="true"
      aria-label={`Loading ${count} businesses`}
    >
      <span className="sr-only">Loading business listings</span>
      {Array.from({ length: count }).map((_, index) => (
        <BusinessCardSkeleton key={index} animation={animation} />
      ))}
    </div>
  );
}
