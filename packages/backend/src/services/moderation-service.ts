/**
 * Moderation Service
 * Handles review approval, rejection, reporting, and appeals
 */

import { prisma } from '../db/index.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/api-error.js';

export interface AuditContext {
  actorId: string;
  actorRole: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface ModerationQueueFilters {
  status?: 'PENDING' | 'REVIEWED' | 'ACTIONED' | 'DISMISSED';
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export class ModerationService {
  /**
   * Approves a review (sets status to PUBLISHED)
   */
  async approveReview(
    reviewId: string,
    moderatorId: string,
    notes: string | null,
    auditContext: AuditContext
  ): Promise<Record<string, unknown>> {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw ApiError.notFound('REVIEW_NOT_FOUND', 'Review not found');
    }

    if (review.status !== 'PENDING') {
      throw ApiError.badRequest('INVALID_STATUS', 'Only pending reviews can be approved');
    }

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        moderationNotes: notes,
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
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
        action: 'review.approve',
        targetType: 'Review',
        targetId: reviewId,
        newValue: {
          moderatorId,
          notes,
        },
        ipAddress: auditContext.ipAddress || 'unknown',
        userAgent: auditContext.userAgent || 'unknown',
      },
    });

    logger.info({ reviewId, moderatorId }, 'Review approved');

    // TODO Phase 16: Send email notification to reviewer

    return updatedReview;
  }

  /**
   * Rejects a review (sets status to HIDDEN)
   */
  async rejectReview(
    reviewId: string,
    moderatorId: string,
    reason: string,
    notes: string | null,
    auditContext: AuditContext
  ): Promise<void> {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw ApiError.notFound('REVIEW_NOT_FOUND', 'Review not found');
    }

    if (review.status !== 'PENDING') {
      throw ApiError.badRequest('INVALID_STATUS', 'Only pending reviews can be rejected');
    }

    await prisma.review.update({
      where: { id: reviewId },
      data: {
        status: 'HIDDEN',
        moderationNotes: `${reason}${notes ? `\n\n${notes}` : ''}`,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: auditContext.actorId,
        actorRole: auditContext.actorRole as any,
        action: 'review.reject',
        targetType: 'Review',
        targetId: reviewId,
        newValue: {
          moderatorId,
          reason,
          notes,
        },
        ipAddress: auditContext.ipAddress || 'unknown',
        userAgent: auditContext.userAgent || 'unknown',
      },
    });

    logger.info({ reviewId, moderatorId, reason }, 'Review rejected');

    // TODO Phase 16: Send email notification to reviewer with appeal instructions
  }

  /**
   * Reports content for moderation
   */
  async reportContent(
    contentType: 'REVIEW' | 'NOTICE' | 'MESSAGE' | 'BUSINESS' | 'EVENT',
    contentId: string,
    reason: 'SPAM' | 'INAPPROPRIATE' | 'FAKE' | 'HARASSMENT' | 'OTHER',
    details: string | null,
    reporterId: string
  ): Promise<Record<string, unknown>> {
    // Verify content exists based on type
    if (contentType === 'REVIEW') {
      const review = await prisma.review.findUnique({
        where: { id: contentId },
      });
      if (!review) {
        throw ApiError.notFound('CONTENT_NOT_FOUND', 'Review not found');
      }
    }

    const report = await prisma.moderationReport.create({
      data: {
        reporterId,
        contentType,
        contentId,
        reason,
        details,
        status: 'PENDING',
      },
      include: {
        reporter: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
    });

    logger.info({ reportId: report.id, contentType, contentId, reporterId }, 'Content reported');

    // TODO Phase 16: Send email notification to moderators

    return report;
  }

  /**
   * Gets the moderation queue with filters
   */
  async getModerationQueue(
    filters: ModerationQueueFilters,
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

    const where: any = {
      status: filters.status || 'PENDING',
    };

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy: { createdAt: 'asc' }, // Oldest first (FIFO)
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
          business: {
            select: {
              id: true,
              name: true,
              slug: true,
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
   * Creates an appeal for a moderation decision
   */
  async appealRejection(
    contentId: string,
    contentType: string,
    originalAction: string,
    reason: string,
    supportingEvidence: string[],
    userId: string
  ): Promise<Record<string, unknown>> {
    // Validate appeal reason length
    if (reason.length < 10 || reason.length > 1000) {
      throw ApiError.badRequest('INVALID_REASON', 'Appeal reason must be between 10 and 1000 characters');
    }

    const appeal = await prisma.appeal.create({
      data: {
        userId,
        contentType,
        contentId,
        originalAction,
        reason,
        supportingEvidence,
        status: 'PENDING',
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
    });

    logger.info({ appealId: appeal.id, userId, contentId }, 'Appeal created');

    // TODO Phase 16: Send email notification to appeal reviewers

    return appeal;
  }

  /**
   * Reviews an appeal (upholds or rejects)
   */
  async reviewAppeal(
    appealId: string,
    decision: 'UPHELD' | 'REJECTED',
    reviewerNotes: string,
    reviewerId: string,
    auditContext: AuditContext
  ): Promise<Record<string, unknown>> {
    const appeal = await prisma.appeal.findUnique({
      where: { id: appealId },
    });

    if (!appeal) {
      throw ApiError.notFound('APPEAL_NOT_FOUND', 'Appeal not found');
    }

    if (appeal.status !== 'PENDING') {
      throw ApiError.badRequest('INVALID_STATUS', 'Appeal has already been reviewed');
    }

    const updatedAppeal = await prisma.appeal.update({
      where: { id: appealId },
      data: {
        status: decision,
        reviewerId,
        reviewerNotes,
        reviewedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: auditContext.actorId,
        actorRole: auditContext.actorRole as any,
        action: 'appeal.review',
        targetType: 'Appeal',
        targetId: appealId,
        newValue: {
          decision,
          reviewerId,
        },
        ipAddress: auditContext.ipAddress || 'unknown',
        userAgent: auditContext.userAgent || 'unknown',
      },
    });

    logger.info({ appealId, decision, reviewerId }, 'Appeal reviewed');

    // TODO Phase 16: Send email notification to appellant

    return updatedAppeal;
  }
}

export const moderationService = new ModerationService();
