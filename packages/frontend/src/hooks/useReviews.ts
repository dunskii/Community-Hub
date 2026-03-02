/**
 * useReviews Hook
 * Manages review state and operations for a business
 */

import { useState, useEffect, useCallback } from 'react';
import { reviewService, type Review, type ReviewSortOption } from '../services/review-service';
import { useAuth } from '../contexts/AuthContext';
import type { ReviewFormData } from '../components/ReviewForm';

export interface UseReviewsOptions {
  businessId: string;
  initialPage?: number;
  initialLimit?: number;
  initialSortBy?: ReviewSortOption;
}

export interface UseReviewsReturn {
  reviews: Review[];
  total: number;
  averageRating: number;
  page: number;
  limit: number;
  sortBy: ReviewSortOption;
  isLoading: boolean;
  error: string | null;
  hasUserReviewed: boolean;
  userReview: Review | null;
  fetchReviews: () => Promise<void>;
  setPage: (page: number) => void;
  setSortBy: (sortBy: ReviewSortOption) => void;
  createReview: (data: ReviewFormData) => Promise<void>;
  updateReview: (reviewId: string, data: Partial<ReviewFormData>) => Promise<void>;
  deleteReview: (reviewId: string) => Promise<void>;
  toggleHelpful: (reviewId: string) => Promise<void>;
  reportReview: (reviewId: string, reason: string, details?: string) => Promise<void>;
}

export function useReviews({
  businessId,
  initialPage = 1,
  initialLimit = 10,
  initialSortBy = 'recent',
}: UseReviewsOptions): UseReviewsReturn {
  const { user } = useAuth();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [page, setPage] = useState(initialPage);
  const [limit] = useState(initialLimit);
  const [sortBy, setSortBy] = useState<ReviewSortOption>(initialSortBy);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userReview = reviews.find((r) => r.isOwnReview) || null;
  const hasUserReviewed = userReview !== null;

  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await reviewService.getBusinessReviews(businessId, {
        page,
        limit,
        sortBy,
      });

      setReviews(response.data.reviews);
      setTotal(response.data.total);
      setAverageRating(response.data.averageRating);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reviews');
    } finally {
      setIsLoading(false);
    }
  }, [businessId, page, limit, sortBy]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const createReview = async (data: ReviewFormData) => {
    try {
      await reviewService.createReview(businessId, data);
      await fetchReviews();
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to create review');
    }
  };

  const updateReview = async (reviewId: string, data: Partial<ReviewFormData>) => {
    try {
      await reviewService.updateReview(reviewId, data);
      await fetchReviews();
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to update review');
    }
  };

  const deleteReview = async (reviewId: string) => {
    try {
      await reviewService.deleteReview(reviewId);
      await fetchReviews();
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to delete review');
    }
  };

  const toggleHelpful = async (reviewId: string) => {
    const review = reviews.find((r) => r.id === reviewId);
    if (!review) return;

    try {
      if (review.isMarkedHelpful) {
        await reviewService.unmarkHelpful(reviewId);
      } else {
        await reviewService.markHelpful(reviewId);
      }
      await fetchReviews();
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to toggle helpful');
    }
  };

  const reportReview = async (reviewId: string, reason: string, details?: string) => {
    try {
      await reviewService.reportReview(reviewId, { reason, details });
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to report review');
    }
  };

  return {
    reviews,
    total,
    averageRating,
    page,
    limit,
    sortBy,
    isLoading,
    error,
    hasUserReviewed,
    userReview,
    fetchReviews,
    setPage,
    setSortBy,
    createReview,
    updateReview,
    deleteReview,
    toggleHelpful,
    reportReview,
  };
}
