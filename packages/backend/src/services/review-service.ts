/**
 * Review Service
 * Handles CRUD operations for reviews, helpful votes, and business responses
 */

import crypto from 'crypto';
import { getPlatformConfig } from '../config/platform-loader.js';
import { prisma } from '../db/index.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/api-error.js';
import { detectLanguage } from '../utils/language-detection.js';

export interface ReviewCreateInput {
  businessId: string;
  rating: number; // 1-5
  title?: string;
  content: string;
  photos?: { url: string; altText: string }[];
}

export interface ReviewUpdateInput {
  rating?: number;
  title?: string;
  content?: string;
}

export interface ReviewFilters {
  sort?: 'newest' | 'helpful' | 'highest' | 'lowest';
  rating?: number; // Filter by specific rating (1-5)
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface AuditContext {
  actorId: string;
  actorRole: string;
  ipAddress?: string;
  userAgent?: string;
}

export class ReviewService {
  /**
   * Creates a new review with PENDING status
   */
  async createReview(
    data: ReviewCreateInput,
    userId: string,
    auditContext: AuditContext
  ): Promise<Record<string, unknown>> {
    const config = getPlatformConfig();

    // Validate review length
    if (data.content.length < config.limits.minReviewLength) {
      throw ApiError.badRequest(
        'REVIEW_TOO_SHORT',
        `Review must be at least ${config.limits.minReviewLength} characters`
      );
    }

    if (data.content.length > config.limits.maxReviewLength) {
      throw ApiError.badRequest(
        'REVIEW_TOO_LONG',
        `Review cannot exceed ${config.limits.maxReviewLength} characters`
      );
    }

    // Validate rating
    if (data.rating < 1 || data.rating > 5) {
      throw ApiError.badRequest('INVALID_RATING', 'Rating must be between 1 and 5');
    }

    // Validate title length if provided
    if (data.title && data.title.length > 100) {
      throw ApiError.badRequest('TITLE_TOO_LONG', 'Title cannot exceed 100 characters');
    }

    // Validate photos count
    if (data.photos && data.photos.length > config.limits.maxReviewPhotos) {
      throw ApiError.badRequest(
        'TOO_MANY_PHOTOS',
        `Cannot upload more than ${config.limits.maxReviewPhotos} photos`
      );
    }

    // Check for duplicate review (one per user per business)
    const existingReview = await prisma.reviews.findUnique({
      where: {
        user_id_business_id: {
          user_id: userId,
          business_id: data.businessId,
        },
      },
    });

    if (existingReview) {
      throw ApiError.conflict(
        'DUPLICATE_REVIEW',
        'You have already reviewed this business'
      );
    }

    // Verify business exists
    const business = await prisma.businesses.findUnique({
      where: { id: data.businessId },
    });

    if (!business) {
      throw ApiError.notFound('BUSINESS_NOT_FOUND', 'Business not found');
    }

    // Detect language
    const language = detectLanguage(data.content, 'en');

    // Create review
    const review = await prisma.reviews.create({
      data: {
        id: crypto.randomUUID(),
        business_id: data.businessId,
        user_id: userId,
        rating: data.rating,
        title: data.title,
        content: data.content,
        language,
        status: 'PENDING', // All reviews start in moderation queue
        updated_at: new Date(),
        review_photos: data.photos
          ? {
              create: data.photos.map((photo, index) => ({
                id: crypto.randomUUID(),
                url: photo.url,
                alt_text: photo.altText,
                order: index,
              })),
            }
          : undefined,
      },
      include: {
        review_photos: true,
        users: {
          select: {
            id: true,
            display_name: true,
            profile_photo: true,
          },
        },
        businesses: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Audit log
    await prisma.audit_logs.create({
      data: {
        id: crypto.randomUUID(),
        actor_id: auditContext.actorId,
        actor_role: auditContext.actorRole as any,
        action: 'review.create',
        target_type: 'Review',
        target_id: review.id,
        new_value: {
          businessId: data.businessId,
          rating: data.rating,
          status: 'PENDING',
        },
        ip_address: auditContext.ipAddress || 'unknown',
        user_agent: auditContext.userAgent || 'unknown',
      },
    });

    logger.info({ reviewId: review.id, userId, businessId: data.businessId }, 'Review created');

    return review;
  }

  /**
   * Updates an existing review (within 7-day window)
   */
  async updateReview(
    reviewId: string,
    data: ReviewUpdateInput,
    userId: string,
    auditContext: AuditContext
  ): Promise<Record<string, unknown>> {
    const config = getPlatformConfig();

    // Fetch review
    const review = await prisma.reviews.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw ApiError.notFound('REVIEW_NOT_FOUND', 'Review not found');
    }

    // Check ownership
    if (review.user_id !== userId) {
      throw ApiError.forbidden('NOT_YOUR_REVIEW', 'You can only edit your own reviews');
    }

    // Check edit window (7 days by default)
    const daysSinceCreation = Math.floor(
      (Date.now() - review.created_at.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceCreation > config.limits.reviewEditWindowDays) {
      throw ApiError.forbidden(
        'EDIT_WINDOW_EXPIRED',
        `Reviews can only be edited within ${config.limits.reviewEditWindowDays} days`
      );
    }

    // Validate content if provided
    if (data.content) {
      if (data.content.length < config.limits.minReviewLength) {
        throw ApiError.badRequest(
          'REVIEW_TOO_SHORT',
          `Review must be at least ${config.limits.minReviewLength} characters`
        );
      }

      if (data.content.length > config.limits.maxReviewLength) {
        throw ApiError.badRequest(
          'REVIEW_TOO_LONG',
          `Review cannot exceed ${config.limits.maxReviewLength} characters`
        );
      }
    }

    // Validate rating if provided
    if (data.rating !== undefined && (data.rating < 1 || data.rating > 5)) {
      throw ApiError.badRequest('INVALID_RATING', 'Rating must be between 1 and 5');
    }

    // Validate title length if provided
    if (data.title && data.title.length > 100) {
      throw ApiError.badRequest('TITLE_TOO_LONG', 'Title cannot exceed 100 characters');
    }

    // Update language if content changed
    const language = data.content ? detectLanguage(data.content, review.language) : review.language;

    // Store previous value for audit
    const previousValue = {
      rating: review.rating,
      title: review.title,
      content: review.content,
      status: review.status,
    };

    // Update review (re-enters moderation queue)
    const updatedReview = await prisma.reviews.update({
      where: { id: reviewId },
      data: {
        rating: data.rating,
        title: data.title,
        content: data.content,
        language,
        status: 'PENDING', // Re-enter moderation after edit
        published_at: null,
        updated_at: new Date(),
      },
      include: {
        review_photos: true,
        users: {
          select: {
            id: true,
            display_name: true,
            profile_photo: true,
          },
        },
        businesses: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Audit log
    await prisma.audit_logs.create({
      data: {
        id: crypto.randomUUID(),
        actor_id: auditContext.actorId,
        actor_role: auditContext.actorRole as any,
        action: 'review.update',
        target_type: 'Review',
        target_id: reviewId,
        previous_value: previousValue,
        new_value: JSON.parse(JSON.stringify({
          changes: data,
          status: 'PENDING',
        })),
        ip_address: auditContext.ipAddress || 'unknown',
        user_agent: auditContext.userAgent || 'unknown',
      },
    });

    logger.info({ reviewId, userId }, 'Review updated');

    return updatedReview;
  }

  /**
   * Soft deletes a review
   */
  async deleteReview(
    reviewId: string,
    userId: string,
    auditContext: AuditContext
  ): Promise<void> {
    // Fetch review
    const review = await prisma.reviews.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw ApiError.notFound('REVIEW_NOT_FOUND', 'Review not found');
    }

    // Check ownership
    if (review.user_id !== userId) {
      throw ApiError.forbidden('NOT_YOUR_REVIEW', 'You can only delete your own reviews');
    }

    // Soft delete (status: deleted)
    await prisma.reviews.update({
      where: { id: reviewId },
      data: {
        status: 'DELETED',
        updated_at: new Date(),
      },
    });

    // Audit log
    await prisma.audit_logs.create({
      data: {
        id: crypto.randomUUID(),
        actor_id: auditContext.actorId,
        actor_role: auditContext.actorRole as any,
        action: 'review.delete',
        target_type: 'Review',
        target_id: reviewId,
        previous_value: {
          businessId: review.business_id,
          status: review.status,
        },
        ip_address: auditContext.ipAddress || 'unknown',
        user_agent: auditContext.userAgent || 'unknown',
      },
    });

    logger.info({ reviewId, userId }, 'Review deleted');
  }

  /**
   * Gets a single review by ID
   */
  async getReviewById(reviewId: string): Promise<Record<string, unknown> | null> {
    const review = await prisma.reviews.findUnique({
      where: { id: reviewId },
      include: {
        review_photos: true,
        users: {
          select: {
            id: true,
            display_name: true,
            profile_photo: true,
          },
        },
        businesses: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return review;
  }

  /**
   * Gets reviews for a business with filtering and pagination
   */
  async getBusinessReviews(
    businessId: string,
    filters: ReviewFilters,
    pagination: PaginationOptions
  ): Promise<{
    reviews: Record<string, unknown>[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { sort = 'newest', rating } = filters;
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      business_id: businessId,
      status: 'PUBLISHED', // Only show published reviews
    };

    if (rating) {
      where.rating = rating;
    }

    // Build orderBy clause
    let orderBy: any = {};
    switch (sort) {
      case 'helpful':
        orderBy = { helpful_count: 'desc' };
        break;
      case 'highest':
        orderBy = { rating: 'desc' };
        break;
      case 'lowest':
        orderBy = { rating: 'asc' };
        break;
      case 'newest':
      default:
        orderBy = { created_at: 'desc' };
        break;
    }

    // Execute queries in parallel
    const [reviews, total] = await Promise.all([
      prisma.reviews.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          review_photos: true,
          users: {
            select: {
              id: true,
              display_name: true,
              profile_photo: true,
            },
          },
        },
      }),
      prisma.reviews.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      reviews,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Gets reviews written by a user
   */
  async getUserReviews(
    userId: string,
    pagination: PaginationOptions
  ): Promise<{
    reviews: Record<string, unknown>[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const where = {
      user_id: userId,
      status: { not: 'DELETED' as const },
    };

    const [reviews, total] = await Promise.all([
      prisma.reviews.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
        include: {
          review_photos: true,
          businesses: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
            },
          },
        },
      }),
      prisma.reviews.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      reviews,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Marks a review as helpful
   */
  async markHelpful(reviewId: string, userId: string): Promise<{ helpfulCount: number }> {
    // Check if already marked helpful
    const existing = await prisma.review_helpful.findUnique({
      where: {
        review_id_user_id: {
          review_id: reviewId,
          user_id: userId,
        },
      },
    });

    if (existing) {
      throw ApiError.conflict('ALREADY_MARKED_HELPFUL', 'You have already marked this review as helpful');
    }

    // Verify review exists
    const review = await prisma.reviews.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw ApiError.notFound('REVIEW_NOT_FOUND', 'Review not found');
    }

    // Create helpful record and increment count
    const [_, updatedReview] = await prisma.$transaction([
      prisma.review_helpful.create({
        data: {
          id: crypto.randomUUID(),
          review_id: reviewId,
          user_id: userId,
        },
      }),
      prisma.reviews.update({
        where: { id: reviewId },
        data: {
          helpful_count: {
            increment: 1,
          },
        },
        select: {
          helpful_count: true,
        },
      }),
    ]);

    logger.info({ reviewId, userId }, 'Review marked helpful');

    return { helpfulCount: updatedReview.helpful_count };
  }

  /**
   * Removes helpful mark from a review
   */
  async unmarkHelpful(reviewId: string, userId: string): Promise<{ helpfulCount: number }> {
    // Check if marked helpful
    const existing = await prisma.review_helpful.findUnique({
      where: {
        review_id_user_id: {
          review_id: reviewId,
          user_id: userId,
        },
      },
    });

    if (!existing) {
      throw ApiError.notFound('NOT_MARKED_HELPFUL', 'You have not marked this review as helpful');
    }

    // Delete helpful record and decrement count
    const [_, updatedReview] = await prisma.$transaction([
      prisma.review_helpful.delete({
        where: {
          review_id_user_id: {
            review_id: reviewId,
            user_id: userId,
          },
        },
      }),
      prisma.reviews.update({
        where: { id: reviewId },
        data: {
          helpful_count: {
            decrement: 1,
          },
        },
        select: {
          helpful_count: true,
        },
      }),
    ]);

    logger.info({ reviewId, userId }, 'Review unmarked helpful');

    return { helpfulCount: updatedReview.helpful_count };
  }

  /**
   * Business owner responds to a review
   */
  async respondToReview(
    reviewId: string,
    response: string,
    businessOwnerId: string,
    auditContext: AuditContext
  ): Promise<Record<string, unknown>> {
    const config = getPlatformConfig();

    // Validate response length
    if (response.length > config.limits.businessResponseMaxLength) {
      throw ApiError.badRequest(
        'RESPONSE_TOO_LONG',
        `Response cannot exceed ${config.limits.businessResponseMaxLength} characters`
      );
    }

    if (response.length < 10) {
      throw ApiError.badRequest('RESPONSE_TOO_SHORT', 'Response must be at least 10 characters');
    }

    // Fetch review
    const review = await prisma.reviews.findUnique({
      where: { id: reviewId },
      include: {
        businesses: true,
      },
    });

    if (!review) {
      throw ApiError.notFound('REVIEW_NOT_FOUND', 'Review not found');
    }

    // Check business ownership
    if (review.businesses.claimed_by !== businessOwnerId) {
      throw ApiError.forbidden('NOT_BUSINESS_OWNER', 'Only the business owner can respond to reviews');
    }

    // Check if already responded
    if (review.business_response) {
      throw ApiError.conflict('ALREADY_RESPONDED', 'You have already responded to this review');
    }

    // Update review with response
    const updatedReview = await prisma.reviews.update({
      where: { id: reviewId },
      data: {
        business_response: response,
        business_response_at: new Date(),
      },
      include: {
        review_photos: true,
        users: {
          select: {
            id: true,
            display_name: true,
            profile_photo: true,
          },
        },
        businesses: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Audit log
    await prisma.audit_logs.create({
      data: {
        id: crypto.randomUUID(),
        actor_id: auditContext.actorId,
        actor_role: auditContext.actorRole as any,
        action: 'review.respond',
        target_type: 'Review',
        target_id: reviewId,
        new_value: {
          responseLength: response.length,
        },
        ip_address: auditContext.ipAddress || 'unknown',
        user_agent: auditContext.userAgent || 'unknown',
      },
    });

    logger.info({ reviewId, businessOwnerId }, 'Business owner responded to review');

    return updatedReview;
  }
}

export const reviewService = new ReviewService();
