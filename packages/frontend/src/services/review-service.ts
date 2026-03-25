/**
 * Review Service
 * API client for review operations
 */

import { apiClient } from './api-client';
import type { ReviewFormData } from '../components/ReviewForm';

export interface Review {
  id: string;
  businessId: string;
  userId: string;
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
    respondedAt: string;
  };
  helpfulCount: number;
  isMarkedHelpful?: boolean;
  isOwnReview?: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DELETED';
  createdAt: string;
  updatedAt?: string;
  publishedAt?: string;
}

export interface ReviewsResponse {
  success: boolean;
  data: {
    reviews: Review[];
    total: number;
    page: number;
    limit: number;
    averageRating: number;
  };
}

export interface ReviewResponse {
  success: boolean;
  data: Review;
}

export type ReviewSortOption = 'recent' | 'helpful' | 'rating_high' | 'rating_low';

export const reviewService = {
  /**
   * Get reviews for a business
   */
  async getBusinessReviews(
    businessId: string,
    options?: {
      page?: number;
      limit?: number;
      sortBy?: ReviewSortOption;
    }
  ): Promise<ReviewsResponse> {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.sortBy) params.append('sortBy', options.sortBy);

    const response = await apiClient.get<ReviewsResponse>(
      `/businesses/${businessId}/reviews?${params.toString()}`
    );
    return response;
  },

  /**
   * Get a single review by ID
   */
  async getReviewById(reviewId: string): Promise<ReviewResponse> {
    const response = await apiClient.get<ReviewResponse>(`/reviews/${reviewId}`);
    return response;
  },

  /**
   * Create a new review
   */
  async createReview(businessId: string, data: ReviewFormData): Promise<ReviewResponse> {
    const formData = new FormData();
    formData.append('businessId', businessId);
    formData.append('rating', data.rating.toString());
    if (data.title) formData.append('title', data.title);
    formData.append('content', data.content);

    if (data.photos && data.photos.length > 0) {
      data.photos.forEach((photo) => {
        formData.append('photos', photo);
      });
    }

    const response = await apiClient.post<ReviewResponse>('/reviews', formData);
    return response;
  },

  /**
   * Update an existing review
   */
  async updateReview(reviewId: string, data: Partial<ReviewFormData>): Promise<ReviewResponse> {
    const formData = new FormData();
    if (data.rating !== undefined) formData.append('rating', data.rating.toString());
    if (data.title !== undefined) formData.append('title', data.title);
    if (data.content !== undefined) formData.append('content', data.content);

    if (data.photos && data.photos.length > 0) {
      data.photos.forEach((photo) => {
        formData.append('photos', photo);
      });
    }

    const response = await apiClient.put<ReviewResponse>(`/reviews/${reviewId}`, formData);
    return response;
  },

  /**
   * Delete a review
   */
  async deleteReview(reviewId: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete<{ success: boolean }>(`/reviews/${reviewId}`);
    return response;
  },

  /**
   * Mark a review as helpful
   */
  async markHelpful(reviewId: string): Promise<{ success: boolean }> {
    const response = await apiClient.post<{ success: boolean }>(`/reviews/${reviewId}/helpful`);
    return response;
  },

  /**
   * Unmark a review as helpful
   */
  async unmarkHelpful(reviewId: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete<{ success: boolean }>(`/reviews/${reviewId}/helpful`);
    return response;
  },

  /**
   * Report a review
   */
  async reportReview(
    reviewId: string,
    data: {
      reason: string;
      details?: string;
    }
  ): Promise<{ success: boolean }> {
    const response = await apiClient.post<{ success: boolean }>(
      `/reviews/${reviewId}/report`,
      data
    );
    return response;
  },

  /**
   * Respond to a review as business owner
   */
  async respondToReview(
    reviewId: string,
    response: string
  ): Promise<ReviewResponse> {
    const result = await apiClient.post<ReviewResponse>(
      `/reviews/${reviewId}/respond`,
      { response }
    );
    return result;
  },
};
