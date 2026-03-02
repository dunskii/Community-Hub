/**
 * Review Service Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { reviewService } from '../review-service';
import { prisma } from '../../utils/prisma';
import { ApiError } from '../../utils/api-error';

describe('ReviewService', () => {
  const mockUserId = 'user-123';
  const mockBusinessId = 'business-456';
  const mockReviewId = 'review-789';

  beforeEach(async () => {
    // Clear database before each test
    await prisma.review.deleteMany();
    await prisma.reviewPhoto.deleteMany();
  });

  afterEach(async () => {
    // Clean up after tests
    await prisma.review.deleteMany();
    await prisma.reviewPhoto.deleteMany();
  });

  describe('createReview', () => {
    it('should create a review successfully', async () => {
      const reviewData = {
        rating: 5,
        title: 'Excellent service',
        content: 'This business provided exceptional service. The staff was very friendly and helpful.',
      };

      const review = await reviewService.createReview(
        mockBusinessId,
        mockUserId,
        reviewData,
        {
          actorId: mockUserId,
          actorRole: 'USER',
        }
      );

      expect(review).toBeDefined();
      expect(review.rating).toBe(5);
      expect(review.title).toBe('Excellent service');
      expect(review.content).toBe(reviewData.content);
      expect(review.status).toBe('PENDING');
      expect(review.businessId).toBe(mockBusinessId);
      expect(review.userId).toBe(mockUserId);
    });

    it('should auto-detect language', async () => {
      const reviewData = {
        rating: 4,
        content: 'This business has great food and excellent customer service.',
      };

      const review = await reviewService.createReview(
        mockBusinessId,
        mockUserId,
        reviewData,
        {
          actorId: mockUserId,
          actorRole: 'USER',
        }
      );

      expect(review.language).toBe('en');
    });

    it('should enforce minimum content length', async () => {
      const reviewData = {
        rating: 3,
        content: 'Too short',
      };

      await expect(
        reviewService.createReview(mockBusinessId, mockUserId, reviewData, {
          actorId: mockUserId,
          actorRole: 'USER',
        })
      ).rejects.toThrow();
    });

    it('should enforce maximum content length', async () => {
      const longContent = 'a'.repeat(1001);
      const reviewData = {
        rating: 3,
        content: longContent,
      };

      await expect(
        reviewService.createReview(mockBusinessId, mockUserId, reviewData, {
          actorId: mockUserId,
          actorRole: 'USER',
        })
      ).rejects.toThrow();
    });

    it('should prevent duplicate reviews from same user', async () => {
      const reviewData = {
        rating: 4,
        content: 'Great service and friendly staff. Highly recommended!',
      };

      // Create first review
      await reviewService.createReview(mockBusinessId, mockUserId, reviewData, {
        actorId: mockUserId,
        actorRole: 'USER',
      });

      // Attempt to create duplicate
      await expect(
        reviewService.createReview(mockBusinessId, mockUserId, reviewData, {
          actorId: mockUserId,
          actorRole: 'USER',
        })
      ).rejects.toThrow(ApiError);
    });

    it('should validate rating range (1-5)', async () => {
      const reviewData = {
        rating: 6,
        content: 'This is a test review with valid length content here.',
      };

      await expect(
        reviewService.createReview(mockBusinessId, mockUserId, reviewData, {
          actorId: mockUserId,
          actorRole: 'USER',
        })
      ).rejects.toThrow();
    });
  });

  describe('updateReview', () => {
    let reviewId: string;

    beforeEach(async () => {
      const review = await reviewService.createReview(
        mockBusinessId,
        mockUserId,
        {
          rating: 4,
          content: 'Original review content with enough characters to meet minimum.',
        },
        {
          actorId: mockUserId,
          actorRole: 'USER',
        }
      );
      reviewId = review.id;
    });

    it('should update review within 7-day window', async () => {
      const updatedData = {
        rating: 5,
        content: 'Updated review content with improved rating and more details.',
      };

      const updated = await reviewService.updateReview(
        reviewId,
        mockUserId,
        updatedData,
        {
          actorId: mockUserId,
          actorRole: 'USER',
        }
      );

      expect(updated.rating).toBe(5);
      expect(updated.content).toBe(updatedData.content);
      expect(updated.status).toBe('PENDING'); // Re-enters moderation
    });

    it('should prevent updates after 7-day window', async () => {
      // Mock the review to be older than 7 days
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 8);

      await prisma.review.update({
        where: { id: reviewId },
        data: { createdAt: oldDate },
      });

      await expect(
        reviewService.updateReview(
          reviewId,
          mockUserId,
          { content: 'Updated content with sufficient length to meet requirements.' },
          {
            actorId: mockUserId,
            actorRole: 'USER',
          }
        )
      ).rejects.toThrow(ApiError);
    });

    it('should prevent updates by non-owner', async () => {
      const otherUserId = 'other-user-999';

      await expect(
        reviewService.updateReview(
          reviewId,
          otherUserId,
          { content: 'Trying to update someone elses review with enough text.' },
          {
            actorId: otherUserId,
            actorRole: 'USER',
          }
        )
      ).rejects.toThrow(ApiError);
    });
  });

  describe('deleteReview', () => {
    let reviewId: string;

    beforeEach(async () => {
      const review = await reviewService.createReview(
        mockBusinessId,
        mockUserId,
        {
          rating: 3,
          content: 'Test review for deletion with proper length requirements.',
        },
        {
          actorId: mockUserId,
          actorRole: 'USER',
        }
      );
      reviewId = review.id;
    });

    it('should soft delete review', async () => {
      await reviewService.deleteReview(reviewId, mockUserId, {
        actorId: mockUserId,
        actorRole: 'USER',
      });

      const deleted = await prisma.review.findUnique({
        where: { id: reviewId },
      });

      expect(deleted?.status).toBe('DELETED');
    });

    it('should prevent deletion by non-owner', async () => {
      const otherUserId = 'other-user-999';

      await expect(
        reviewService.deleteReview(reviewId, otherUserId, {
          actorId: otherUserId,
          actorRole: 'USER',
        })
      ).rejects.toThrow(ApiError);
    });
  });

  describe('markHelpful / unmarkHelpful', () => {
    let reviewId: string;

    beforeEach(async () => {
      const review = await reviewService.createReview(
        mockBusinessId,
        mockUserId,
        {
          rating: 4,
          content: 'Test review for helpful marking with proper content length.',
        },
        {
          actorId: mockUserId,
          actorRole: 'USER',
        }
      );
      reviewId = review.id;
    });

    it('should mark review as helpful', async () => {
      const otherUserId = 'other-user-888';

      await reviewService.markHelpful(reviewId, otherUserId, {
        actorId: otherUserId,
        actorRole: 'USER',
      });

      const review = await prisma.review.findUnique({
        where: { id: reviewId },
      });

      expect(review?.helpfulCount).toBe(1);
    });

    it('should unmark review as helpful', async () => {
      const otherUserId = 'other-user-888';

      // First mark as helpful
      await reviewService.markHelpful(reviewId, otherUserId, {
        actorId: otherUserId,
        actorRole: 'USER',
      });

      // Then unmark
      await reviewService.unmarkHelpful(reviewId, otherUserId, {
        actorId: otherUserId,
        actorRole: 'USER',
      });

      const review = await prisma.review.findUnique({
        where: { id: reviewId },
      });

      expect(review?.helpfulCount).toBe(0);
    });

    it('should prevent duplicate helpful marks', async () => {
      const otherUserId = 'other-user-888';

      await reviewService.markHelpful(reviewId, otherUserId, {
        actorId: otherUserId,
        actorRole: 'USER',
      });

      await expect(
        reviewService.markHelpful(reviewId, otherUserId, {
          actorId: otherUserId,
          actorRole: 'USER',
        })
      ).rejects.toThrow(ApiError);
    });
  });

  describe('getBusinessReviews', () => {
    beforeEach(async () => {
      // Create multiple reviews
      for (let i = 1; i <= 5; i++) {
        await reviewService.createReview(
          mockBusinessId,
          `user-${i}`,
          {
            rating: i,
            content: `Review ${i} with sufficient content length to meet requirements.`,
          },
          {
            actorId: `user-${i}`,
            actorRole: 'USER',
          }
        );
      }
    });

    it('should return paginated reviews', async () => {
      const result = await reviewService.getBusinessReviews(
        mockBusinessId,
        {},
        { page: 1, limit: 3 }
      );

      expect(result.reviews).toHaveLength(3);
      expect(result.total).toBe(5);
      expect(result.page).toBe(1);
    });

    it('should filter by status', async () => {
      const result = await reviewService.getBusinessReviews(
        mockBusinessId,
        { status: 'PENDING' },
        { page: 1, limit: 10 }
      );

      expect(result.reviews.every(r => r.status === 'PENDING')).toBe(true);
    });

    it('should calculate average rating', async () => {
      // Approve all reviews first
      const allReviews = await prisma.review.findMany({
        where: { businessId: mockBusinessId },
      });

      for (const review of allReviews) {
        await prisma.review.update({
          where: { id: review.id },
          data: { status: 'APPROVED' },
        });
      }

      const result = await reviewService.getBusinessReviews(
        mockBusinessId,
        { status: 'APPROVED' },
        { page: 1, limit: 10 }
      );

      // Average of 1, 2, 3, 4, 5 = 3
      expect(result.averageRating).toBe(3);
    });
  });

  describe('respondToReview', () => {
    let reviewId: string;
    const businessOwnerId = 'business-owner-123';

    beforeEach(async () => {
      const review = await reviewService.createReview(
        mockBusinessId,
        mockUserId,
        {
          rating: 4,
          content: 'Great service and friendly staff with excellent attention.',
        },
        {
          actorId: mockUserId,
          actorRole: 'USER',
        }
      );
      reviewId = review.id;
    });

    it('should add business response', async () => {
      const response = 'Thank you for your feedback!';

      const updated = await reviewService.respondToReview(
        reviewId,
        businessOwnerId,
        response,
        {
          actorId: businessOwnerId,
          actorRole: 'BUSINESS_OWNER',
        }
      );

      expect(updated.businessResponse).toBe(response);
      expect(updated.businessResponseAt).toBeDefined();
    });

    it('should enforce max response length', async () => {
      const longResponse = 'a'.repeat(501);

      await expect(
        reviewService.respondToReview(reviewId, businessOwnerId, longResponse, {
          actorId: businessOwnerId,
          actorRole: 'BUSINESS_OWNER',
        })
      ).rejects.toThrow();
    });
  });
});
