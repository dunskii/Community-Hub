/**
 * EventCardSkeleton Component
 *
 * [UI/UX Spec v2.2 §11.7 - Loading States]
 *
 * Skeleton loading placeholder that matches EventCard layout.
 * Uses shimmer animation with prefers-reduced-motion support.
 *
 * @example
 * ```tsx
 * // Single card skeleton
 * <EventCardSkeleton />
 *
 * // Compact variant
 * <EventCardSkeleton compact />
 *
 * // Grid of skeletons
 * <EventCardSkeletonGrid count={6} />
 * ```
 */

import { Skeleton } from '../display/Skeleton';

interface EventCardSkeletonProps {
  /** Show compact version for lists */
  compact?: boolean;
  /** Animation type - shimmer (default), pulse, or none */
  animation?: 'shimmer' | 'pulse' | 'none';
  /** Additional CSS classes */
  className?: string;
}

export function EventCardSkeleton({
  compact = false,
  animation = 'shimmer',
  className = '',
}: EventCardSkeletonProps) {
  return (
    <article
      className={`event-card bg-white dark:bg-surface rounded-lg shadow-card ${
        compact ? 'flex gap-4' : ''
      } ${className}`}
      role="status"
      aria-busy="true"
      aria-label="Loading event"
    >
      <span className="sr-only">Loading event card</span>

      {/* Event Image Skeleton */}
      <div
        className={`event-card__image relative overflow-hidden ${
          compact ? 'w-24 h-24 shrink-0 rounded-l-lg' : 'w-full h-48 rounded-t-lg'
        }`}
      >
        <Skeleton
          variant="rectangular"
          width="100%"
          height="100%"
          animation={animation}
          aria-hidden="true"
        />

        {/* Date badge overlay skeleton (non-compact only) */}
        {!compact && (
          <div className="absolute top-3 left-3 bg-white dark:bg-surface rounded-lg shadow-md px-3 py-2">
            <Skeleton
              variant="text"
              width={32}
              height={12}
              animation={animation}
              aria-hidden="true"
            />
            <Skeleton
              variant="text"
              width={24}
              height={20}
              animation={animation}
              className="mt-1"
              aria-hidden="true"
            />
          </div>
        )}
      </div>

      {/* Event Info Skeleton */}
      <div className={`event-card__content p-4 ${compact ? 'flex-1 min-w-0' : ''}`}>
        {/* Category and Location Type badges */}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Skeleton
            variant="rounded"
            width={70}
            height={22}
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

        {/* Title */}
        <Skeleton
          variant="text"
          width="85%"
          height={24}
          animation={animation}
          className="mb-2"
          aria-hidden="true"
        />

        {/* Date and Time */}
        <div className="flex items-center gap-2 mb-2">
          <Skeleton
            variant="circular"
            width={16}
            height={16}
            animation={animation}
            aria-hidden="true"
          />
          <Skeleton
            variant="text"
            width="60%"
            height={16}
            animation={animation}
            aria-hidden="true"
          />
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 mb-2">
          <Skeleton
            variant="circular"
            width={16}
            height={16}
            animation={animation}
            aria-hidden="true"
          />
          <Skeleton
            variant="text"
            width="50%"
            height={16}
            animation={animation}
            aria-hidden="true"
          />
        </div>

        {/* Description (non-compact only) */}
        {!compact && (
          <div className="mb-3">
            <Skeleton
              variant="text"
              lines={2}
              animation={animation}
              aria-hidden="true"
            />
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-border">
          <div className="flex items-center gap-3">
            <Skeleton
              variant="text"
              width={60}
              height={16}
              animation={animation}
              aria-hidden="true"
            />
            <Skeleton
              variant="text"
              width={50}
              height={16}
              animation={animation}
              aria-hidden="true"
            />
          </div>
          <Skeleton
            variant="text"
            width={70}
            height={16}
            animation={animation}
            aria-hidden="true"
          />
        </div>
      </div>
    </article>
  );
}

/**
 * Grid of EventCardSkeletons for loading states
 */
export function EventCardSkeletonGrid({
  count = 6,
  compact = false,
  animation = 'shimmer',
}: {
  count?: number;
  compact?: boolean;
  animation?: 'shimmer' | 'pulse' | 'none';
}) {
  return (
    <div
      className={
        compact
          ? 'space-y-4'
          : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
      }
      role="status"
      aria-busy="true"
      aria-label={`Loading ${count} events`}
    >
      <span className="sr-only">Loading event listings</span>
      {Array.from({ length: count }).map((_, index) => (
        <EventCardSkeleton key={index} compact={compact} animation={animation} />
      ))}
    </div>
  );
}
