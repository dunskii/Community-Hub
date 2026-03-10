/**
 * Review Service
 * Handles CRUD operations for reviews, helpful votes, and business responses
 */

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
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_businessId: {
          userId,
          businessId: data.businessId,
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
    const business = await prisma.business.findUnique({
      where: { id: data.businessId },
    });

    if (!business) {
      throw ApiError.notFound('BUSINESS_NOT_FOUND', 'Business not found');
    }

    // Detect language
    const language = detectLanguage(data.content, 'en');

    // Create review
    const review = await prisma.review.create({
      data: {
        businessId: data.businessId,
        userId,
        rating: data.rating,
        title: data.title,
        content: data.content,
        language,
        status: 'PENDING', // All reviews start in moderation queue
        photos: data.photos
          ? {
              create: data.photos.map((photo, index) => ({
                url: photo.url,
                altText: photo.altText,
                order: index,
              })),
            }
          : undefined,
      },
      include: {
        photos: true,
        user: {
          select: {
            id: true,
            displayName: true,
            profilePhoto: true,
          },
        },
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: auditContext.actorId,
        actorRole: auditContext.actorRole as any,
        action: 'review.create',
        targetType: 'Review',
        targetId: review.id,
        newValue: {
          businessId: data.businessId,
          rating: data.rating,
          status: 'PENDING',
        },
        ipAddress: auditContext.ipAddress || 'unknown',
        userAgent: auditContext.userAgent || 'unknown',
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
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw ApiError.notFound('REVIEW_NOT_FOUND', 'Review not found');
    }

    // Check ownership
    if (review.userId !== userId) {
      throw ApiError.forbidden('NOT_YOUR_REVIEW', 'You can only edit your own reviews');
    }

    // Check edit window (7 days by default)
    const daysSinceCreation = Math.floor(
      (Date.now() - review.createdAt.getTime()) / (1000 * 60 * 60 * 24)
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
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        rating: data.rating,
        title: data.title,
        content: data.content,
        language,
        status: 'PENDING', // Re-enter moderation after edit
        publishedAt: null,
        updatedAt: new Date(),
      },
      include: {
        photos: true,
        user: {
          select: {
            id: true,
            displayName: true,
            profilePhoto: true,
          },
        },
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: auditContext.actorId,
        actorRole: auditContext.actorRole as any,
        action: 'review.update',
        targetType: 'Review',
        targetId: reviewId,
        previousValue,
        newValue: {
          changes: data,
          status: 'PENDING',
        },
        ipAddress: auditContext.ipAddress || 'unknown',
        userAgent: auditContext.userAgent || 'unknown',
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
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw ApiError.notFound('REVIEW_NOT_FOUND', 'Review not found');
    }

    // Check ownership
    if (review.userId !== userId) {
      throw ApiError.forbidden('NOT_YOUR_REVIEW', 'You can only delete your own reviews');
    }

    // Soft delete (status: deleted)
    await prisma.review.update({
      where: { id: reviewId },
      data: {
        status: 'DELETED',
        updatedAt: new Date(),
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: auditContext.actorId,
        actorRole: auditContext.actorRole as any,
        action: 'review.delete',
        targetType: 'Review',
        targetId: reviewId,
        previousValue: {
          businessId: review.businessId,
          status: review.status,
        },
        ipAddress: auditContext.ipAddress || 'unknown',
        userAgent: auditContext.userAgent || 'unknown',
      },
    });

    logger.info({ reviewId, userId }, 'Review deleted');
  }

  /**
   * Gets a single review by ID
   */
  async getReviewById(reviewId: string): Promise<Record<string, unknown> | null> {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        photos: true,
        user: {
          select: {
            id: true,
            displayName: true,
            profilePhoto: true,
          },
        },
        business: {
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
      businessId,
      status: 'PUBLISHED', // Only show published reviews
    };

    if (rating) {
      where.rating = rating;
    }

    // Build orderBy clause
    let orderBy: any = {};
    switch (sort) {
      case 'helpful':
        orderBy = { helpfulCount: 'desc' };
        break;
      case 'highest':
        orderBy = { rating: 'desc' };
        break;
      case 'lowest':
        orderBy = { rating: 'asc' };
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    // Execute queries in parallel
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          photos: true,
          user: {
            select: {
              id: true,
              displayName: true,
              profilePhoto: true,
            },
          },
        },
      }),
      prisma.review.count({ where }),
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
      userId,
      status: { not: 'DELETED' as const },
    };

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          photos: true,
          business: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
            },
          },
        },
      }),
      prisma.review.count({ where }),
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
    const existing = await prisma.reviewHelpful.findUnique({
      where: {
        reviewId_userId: {
          reviewId,
          userId,
        },
      },
    });

    if (existing) {
      throw ApiError.conflict('ALREADY_MARKED_HELPFUL', 'You have already marked this review as helpful');
    }

    // Verify review exists
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw ApiError.notFound('REVIEW_NOT_FOUND', 'Review not found');
    }

    // Create helpful record and increment count
    const [_, updatedReview] = await prisma.$transaction([
      prisma.reviewHelpful.create({
        data: {
          reviewId,
          userId,
        },
      }),
      prisma.review.update({
        where: { id: reviewId },
        data: {
          helpfulCount: {
            increment: 1,
          },
        },
        select: {
          helpfulCount: true,
        },
      }),
    ]);

    logger.info({ reviewId, userId }, 'Review marked helpful');

    return { helpfulCount: updatedReview.helpfulCount };
  }

  /**
   * Removes helpful mark from a review
   */
  async unmarkHelpful(reviewId: string, userId: string): Promise<{ helpfulCount: number }> {
    // Check if marked helpful
    const existing = await prisma.reviewHelpful.findUnique({
      where: {
        reviewId_userId: {
          reviewId,
          userId,
        },
      },
    });

    if (!existing) {
      throw ApiError.notFound('NOT_MARKED_HELPFUL', 'You have not marked this review as helpful');
    }

    // Delete helpful record and decrement count
    const [_, updatedReview] = await prisma.$transaction([
      prisma.reviewHelpful.delete({
        where: {
          reviewId_userId: {
            reviewId,
            userId,
          },
        },
      }),
      prisma.review.update({
        where: { id: reviewId },
        data: {
          helpfulCount: {
            decrement: 1,
          },
        },
        select: {
          helpfulCount: true,
        },
      }),
    ]);

    logger.info({ reviewId, userId }, 'Review unmarked helpful');

    return { helpfulCount: updatedReview.helpfulCount };
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
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        business: true,
      },
    });

    if (!review) {
      throw ApiError.notFound('REVIEW_NOT_FOUND', 'Review not found');
    }

    // Check business ownership
    if (review.business.claimedBy !== businessOwnerId) {
      throw ApiError.forbidden('NOT_BUSINESS_OWNER', 'Only the business owner can respond to reviews');
    }

    // Check if already responded
    if (review.businessResponse) {
      throw ApiError.conflict('ALREADY_RESPONDED', 'You have already responded to this review');
    }

    // Update review with response
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        businessResponse: response,
        businessResponseAt: new Date(),
      },
      include: {
        photos: true,
        user: {
          select: {
            id: true,
            displayName: true,
            profilePhoto: true,
          },
        },
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: auditContext.actorId,
        actorRole: auditContext.actorRole as any,
        action: 'review.respond',
        targetType: 'Review',
        targetId: reviewId,
        newValue: {
          responseLength: response.length,
        },
        ipAddress: auditContext.ipAddress || 'unknown',
        userAgent: auditContext.userAgent || 'unknown',
      },
    });

    logger.info({ reviewId, businessOwnerId }, 'Business owner responded to review');

    return updatedReview;
  }
}

export const reviewService = new ReviewService();
