/**
 * Moderation Service
 * Handles review approval, rejection, reporting, and appeals
 */

import crypto from 'crypto';
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
    const review = await prisma.reviews.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw ApiError.notFound('REVIEW_NOT_FOUND', 'Review not found');
    }

    if (review.status !== 'PENDING') {
      throw ApiError.badRequest('INVALID_STATUS', 'Only pending reviews can be approved');
    }

    const updatedReview = await prisma.reviews.update({
      where: { id: reviewId },
      data: {
        status: 'PUBLISHED',
        published_at: new Date(),
        moderation_notes: notes,
      },
      include: {
        users: {
          select: {
            id: true,
            display_name: true,
            email: true,
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
        action: 'review.approve',
        target_type: 'Review',
        target_id: reviewId,
        new_value: {
          moderatorId,
          notes,
        },
        ip_address: auditContext.ipAddress || 'unknown',
        user_agent: auditContext.userAgent || 'unknown',
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
    const review = await prisma.reviews.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw ApiError.notFound('REVIEW_NOT_FOUND', 'Review not found');
    }

    if (review.status !== 'PENDING') {
      throw ApiError.badRequest('INVALID_STATUS', 'Only pending reviews can be rejected');
    }

    await prisma.reviews.update({
      where: { id: reviewId },
      data: {
        status: 'HIDDEN',
        moderation_notes: `${reason}${notes ? `\n\n${notes}` : ''}`,
      },
    });

    // Audit log
    await prisma.audit_logs.create({
      data: {
        id: crypto.randomUUID(),
        actor_id: auditContext.actorId,
        actor_role: auditContext.actorRole as any,
        action: 'review.reject',
        target_type: 'Review',
        target_id: reviewId,
        new_value: {
          moderatorId,
          reason,
          notes,
        },
        ip_address: auditContext.ipAddress || 'unknown',
        user_agent: auditContext.userAgent || 'unknown',
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
      const review = await prisma.reviews.findUnique({
        where: { id: contentId },
      });
      if (!review) {
        throw ApiError.notFound('CONTENT_NOT_FOUND', 'Review not found');
      }
    }

    const report = await prisma.moderation_reports.create({
      data: {
        id: crypto.randomUUID(),
        reporter_id: reporterId,
        content_type: contentType,
        content_id: contentId,
        reason,
        details,
        status: 'PENDING',
      },
      include: {
        users_moderation_reports_reporter_idTousers: {
          select: {
            id: true,
            display_name: true,
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
      prisma.reviews.findMany({
        where,
        orderBy: { created_at: 'asc' }, // Oldest first (FIFO)
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
          businesses: {
            select: {
              id: true,
              name: true,
              slug: true,
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

    const appeal = await prisma.appeals.create({
      data: {
        id: crypto.randomUUID(),
        user_id: userId,
        content_type: contentType,
        content_id: contentId,
        original_action: originalAction,
        reason,
        supporting_evidence: supportingEvidence,
        status: 'PENDING',
      },
      include: {
        users_appeals_user_idTousers: {
          select: {
            id: true,
            display_name: true,
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
    const appeal = await prisma.appeals.findUnique({
      where: { id: appealId },
    });

    if (!appeal) {
      throw ApiError.notFound('APPEAL_NOT_FOUND', 'Appeal not found');
    }

    if (appeal.status !== 'PENDING') {
      throw ApiError.badRequest('INVALID_STATUS', 'Appeal has already been reviewed');
    }

    const updatedAppeal = await prisma.appeals.update({
      where: { id: appealId },
      data: {
        status: decision,
        reviewer_id: reviewerId,
        reviewer_notes: reviewerNotes,
        reviewed_at: new Date(),
      },
      include: {
        users_appeals_user_idTousers: {
          select: {
            id: true,
            display_name: true,
            email: true,
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
        action: 'appeal.review',
        target_type: 'Appeal',
        target_id: appealId,
        new_value: {
          decision,
          reviewerId,
        },
        ip_address: auditContext.ipAddress || 'unknown',
        user_agent: auditContext.userAgent || 'unknown',
      },
    });

    logger.info({ appealId, decision, reviewerId }, 'Appeal reviewed');

    // TODO Phase 16: Send email notification to appellant

    return updatedAppeal;
  }
}

export const moderationService = new ModerationService();
