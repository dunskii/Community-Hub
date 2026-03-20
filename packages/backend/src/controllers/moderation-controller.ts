/**
 * Moderation Controller
 * Handles HTTP requests for moderation operations
 */

import type { Request, Response } from 'express';
import { moderationService } from '../services/moderation-service.js';
import { logger } from '../utils/logger.js';

function sendSuccess(res: Response, data: unknown, statusCode: number = 200, message?: string): void {
  res.status(statusCode).json({
    success: true,
    data,
    ...(message && { message }),
  });
}

function sendError(res: Response, code: string, message: string, statusCode: number = 500): void {
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
    },
  });
}

export class ModerationController {
  /**
   * GET /admin/moderation/reviews
   * Gets the moderation queue
   */
  async getModerationQueue(req: Request, res: Response): Promise<void> {
    try {
      const { status, page = '1', limit = '20' } = req.query;

      const result = await moderationService.getModerationQueue(
        {
          status: status as any,
        },
        {
          page: parseInt(page as string, 10),
          limit: parseInt(limit as string, 10),
        }
      );

      sendSuccess(res, result, 200);
    } catch (error) {
      logger.error({ error }, 'Failed to fetch moderation queue');
      if (error instanceof Error) {
        sendError(res, 'FETCH_QUEUE_FAILED', error.message, 500);
      } else {
        sendError(res, 'FETCH_QUEUE_FAILED', 'Failed to fetch moderation queue', 500);
      }
    }
  }

  /**
   * POST /admin/moderation/reviews/:id/approve
   * Approves a review
   */
  async approveReview(req: Request, res: Response): Promise<void> {
    try {
      const reviewId = req.params.id as string;
      const { notes } = req.body;
      const moderatorId = req.user!.id;

      const review = await moderationService.approveReview(
        reviewId,
        moderatorId,
        notes,
        {
          actorId: moderatorId,
          actorRole: req.user!.role,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        }
      );

      sendSuccess(res, review, 200, 'Review approved successfully');
    } catch (error) {
      logger.error({ error, reviewId: req.params.id }, 'Failed to approve review');
      if (error instanceof Error) {
        sendError(res, 'APPROVE_FAILED', error.message, 500);
      } else {
        sendError(res, 'APPROVE_FAILED', 'Failed to approve review', 500);
      }
    }
  }

  /**
   * POST /admin/moderation/reviews/:id/reject
   * Rejects a review
   */
  async rejectReview(req: Request, res: Response): Promise<void> {
    try {
      const reviewId = req.params.id as string;
      const { reason, notes } = req.body;
      const moderatorId = req.user!.id;

      await moderationService.rejectReview(
        reviewId,
        moderatorId,
        reason,
        notes,
        {
          actorId: moderatorId,
          actorRole: req.user!.role,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        }
      );

      sendSuccess(res, null, 200, 'Review rejected successfully');
    } catch (error) {
      logger.error({ error, reviewId: req.params.id }, 'Failed to reject review');
      if (error instanceof Error) {
        sendError(res, 'REJECT_FAILED', error.message, 500);
      } else {
        sendError(res, 'REJECT_FAILED', 'Failed to reject review', 500);
      }
    }
  }
}

export const moderationController = new ModerationController();
