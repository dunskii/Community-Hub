/**
 * ReviewList Component
 * Displays a paginated list of reviews with sorting and filtering
 * WCAG 2.1 AA compliant
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { ReviewCard } from '../ReviewCard';
import { Pagination } from '../display/Pagination';
import { EmptyState } from '../display/EmptyState';
import { Skeleton } from '../display/Skeleton';
import { Select } from '../form/Select';
import './ReviewList.css';

export interface Review {
  id: string;
  user: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  rating: number;
  title?: string;
  content: string;
  photos?: Array<{
    id: string;
    url: string;
    alt?: string;
  }>;
  businessResponse?: {
    content: string;
    respondedAt: Date;
  };
  helpfulCount: number;
  isMarkedHelpful?: boolean;
  isOwnReview?: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export type ReviewSortOption = 'recent' | 'helpful' | 'rating_high' | 'rating_low';

export interface ReviewListProps {
  /**
   * Array of reviews to display
   */
  reviews: Review[];
  /**
   * Total number of reviews (for pagination)
   */
  total: number;
  /**
   * Current page (1-indexed)
   */
  page: number;
  /**
   * Reviews per page
   */
  limit: number;
  /**
   * Current sort option
   */
  sortBy: ReviewSortOption;
  /**
   * Whether reviews are loading
   */
  isLoading?: boolean;
  /**
   * Callback when page changes
   */
  onPageChange: (page: number) => void;
  /**
   * Callback when sort option changes
   */
  onSortChange: (sortBy: ReviewSortOption) => void;
  /**
   * Callback when helpful button clicked
   */
  onMarkHelpful?: (reviewId: string) => void;
  /**
   * Callback when edit button clicked
   */
  onEdit?: (reviewId: string) => void;
  /**
   * Callback when delete button clicked
   */
  onDelete?: (reviewId: string) => void;
  /**
   * Callback when report button clicked
   */
  onReport?: (reviewId: string) => void;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export const ReviewList: React.FC<ReviewListProps> = ({
  reviews,
  total,
  page,
  limit,
  sortBy,
  isLoading = false,
  onPageChange,
  onSortChange,
  onMarkHelpful,
  onEdit,
  onDelete,
  onReport,
  className = '',
}) => {
  const { t } = useTranslation();

  const sortOptions = [
    { value: 'recent', label: t('reviews.sort.recent') },
    { value: 'helpful', label: t('reviews.sort.helpful') },
    { value: 'rating_high', label: t('reviews.sort.ratingHigh') },
    { value: 'rating_low', label: t('reviews.sort.ratingLow') },
  ];

  const totalPages = Math.ceil(total / limit);

  if (isLoading) {
    return (
      <div className={`review-list ${className}`}>
        <div className="review-list__header">
          <Skeleton width={200} height={24} />
          <Skeleton width={150} height={40} />
        </div>
        <div className="review-list__items">
          {[...Array(limit)].map((_, index) => (
            <div key={index} className="review-list__skeleton">
              <Skeleton width="100%" height={200} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className={`review-list ${className}`}>
        <EmptyState
          icon="📝"
          title={t('reviews.noReviews')}
          description={t('reviews.noReviewsDescription')}
        />
      </div>
    );
  }

  return (
    <div className={`review-list ${className}`}>
      <div className="review-list__header">
        <h2 className="review-list__title">
          {t('reviews.totalReviews', { count: total })}
        </h2>
        <Select
          id="review-sort"
          label={t('reviews.sortBy')}
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as ReviewSortOption)}
          options={sortOptions}
          className="review-list__sort"
        />
      </div>

      <div className="review-list__items" role="list">
        {reviews.map((review) => (
          <div key={review.id} className="review-list__item" role="listitem">
            <ReviewCard
              {...review}
              onMarkHelpful={onMarkHelpful ? () => onMarkHelpful(review.id) : undefined}
              onEdit={onEdit && review.isOwnReview ? () => onEdit(review.id) : undefined}
              onDelete={onDelete && review.isOwnReview ? () => onDelete(review.id) : undefined}
              onReport={onReport && !review.isOwnReview ? () => onReport(review.id) : undefined}
            />
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="review-list__pagination">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
};
