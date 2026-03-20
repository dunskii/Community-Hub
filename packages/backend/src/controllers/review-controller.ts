/**
 * Review Controller
 * Handles HTTP requests for review operations
 */

import type { Request, Response } from 'express';
import { reviewService } from '../services/review-service.js';
import { moderationService } from '../services/moderation-service.js';
import { logger } from '../utils/logger.js';

/**
 * Sends success response
 */
function sendSuccess(res: Response, data: unknown, statusCode: number = 200, message?: string): void {
  res.status(statusCode).json({
    success: true,
    data,
    ...(message && { message }),
  });
}

/**
 * Sends error response
 */
function sendError(res: Response, code: string, message: string, statusCode: number = 500): void {
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
    },
  });
}

export class ReviewController {
  /**
   * POST /businesses/:id/reviews
   * Creates a review for a business
   */
  async createReview(req: Request, res: Response): Promise<void> {
    try {
      const businessId = req.params.id as string;
      const userId = req.user!.id;
      const data = req.body;

      const review = await reviewService.createReview(
        { ...data, businessId },
        userId,
        {
          actorId: userId,
          actorRole: req.user!.role,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        }
      );

      sendSuccess(res, review, 201, 'Review submitted successfully and pending approval');
    } catch (error) {
      logger.error({ error, userId: req.user?.id }, 'Failed to create review');
      if (error instanceof Error) {
        sendError(res, 'REVIEW_CREATE_FAILED', error.message, 500);
      } else {
        sendError(res, 'REVIEW_CREATE_FAILED', 'Failed to create review', 500);
      }
    }
  }

  /**
   * PUT /reviews/:id
   * Updates an existing review
   */
  async updateReview(req: Request, res: Response): Promise<void> {
    try {
      const reviewId = req.params.id as string;
      const userId = req.user!.id;
      const data = req.body;

      const review = await reviewService.updateReview(
        reviewId,
        data,
        userId,
        {
          actorId: userId,
          actorRole: req.user!.role,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        }
      );

      sendSuccess(res, review, 200, 'Review updated successfully');
    } catch (error) {
      logger.error({ error, reviewId: req.params.id }, 'Failed to update review');
      if (error instanceof Error) {
        sendError(res, 'REVIEW_UPDATE_FAILED', error.message, 500);
      } else {
        sendError(res, 'REVIEW_UPDATE_FAILED', 'Failed to update review', 500);
      }
    }
  }

  /**
   * DELETE /reviews/:id
   * Deletes a review
   */
  async deleteReview(req: Request, res: Response): Promise<void> {
    try {
      const reviewId = req.params.id as string;
      const userId = req.user!.id;

      await reviewService.deleteReview(
        reviewId,
        userId,
        {
          actorId: userId,
          actorRole: req.user!.role,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        }
      );

      res.status(204).send();
    } catch (error) {
      logger.error({ error, reviewId: req.params.id }, 'Failed to delete review');
      if (error instanceof Error) {
        sendError(res, 'REVIEW_DELETE_FAILED', error.message, 500);
      } else {
        sendError(res, 'REVIEW_DELETE_FAILED', 'Failed to delete review', 500);
      }
    }
  }

  /**
   * POST /reviews/:id/helpful
   * Marks a review as helpful
   */
  async markHelpful(req: Request, res: Response): Promise<void> {
    try {
      const reviewId = req.params.id as string;
      const userId = req.user!.id;

      const result = await reviewService.markHelpful(reviewId, userId);

      sendSuccess(res, result, 200);
    } catch (error) {
      logger.error({ error, reviewId: req.params.id }, 'Failed to mark helpful');
      if (error instanceof Error) {
        sendError(res, 'MARK_HELPFUL_FAILED', error.message, 500);
      } else {
        sendError(res, 'MARK_HELPFUL_FAILED', 'Failed to mark review as helpful', 500);
      }
    }
  }

  /**
   * DELETE /reviews/:id/helpful
   * Removes helpful mark from a review
   */
  async unmarkHelpful(req: Request, res: Response): Promise<void> {
    try {
      const reviewId = req.params.id as string;
      const userId = req.user!.id;

      const result = await reviewService.unmarkHelpful(reviewId, userId);

      sendSuccess(res, result, 200);
    } catch (error) {
      logger.error({ error, reviewId: req.params.id }, 'Failed to unmark helpful');
      if (error instanceof Error) {
        sendError(res, 'UNMARK_HELPFUL_FAILED', error.message, 500);
      } else {
        sendError(res, 'UNMARK_HELPFUL_FAILED', 'Failed to remove helpful mark', 500);
      }
    }
  }

  /**
   * POST /reviews/:id/report
   * Reports a review for moderation
   */
  async reportReview(req: Request, res: Response): Promise<void> {
    try {
      const reviewId = req.params.id as string;
      const { reason, details } = req.body;
      const userId = req.user!.id;

      const report = await moderationService.reportContent(
        'REVIEW',
        reviewId,
        reason,
        details,
        userId
      );

      sendSuccess(res, report, 201, 'Review reported successfully');
    } catch (error) {
      logger.error({ error, reviewId: req.params.id }, 'Failed to report review');
      if (error instanceof Error) {
        sendError(res, 'REPORT_FAILED', error.message, 500);
      } else {
        sendError(res, 'REPORT_FAILED', 'Failed to report review', 500);
      }
    }
  }

  /**
   * POST /reviews/:id/respond
   * Business owner responds to a review
   */
  async respondToReview(req: Request, res: Response): Promise<void> {
    try {
      const reviewId = req.params.id as string;
      const { response } = req.body;
      const userId = req.user!.id;

      const review = await reviewService.respondToReview(
        reviewId,
        response,
        userId,
        {
          actorId: userId,
          actorRole: req.user!.role,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        }
      );

      sendSuccess(res, review, 200, 'Response posted successfully');
    } catch (error) {
      logger.error({ error, reviewId: req.params.id }, 'Failed to respond to review');
      if (error instanceof Error) {
        sendError(res, 'RESPONSE_FAILED', error.message, 500);
      } else {
        sendError(res, 'RESPONSE_FAILED', 'Failed to post response', 500);
      }
    }
  }

  /**
   * GET /businesses/:id/reviews
   * Gets reviews for a business
   */
  async getBusinessReviews(req: Request, res: Response): Promise<void> {
    try {
      const businessId = req.params.id as string;
      const { sort = 'newest', rating, page = '1', limit = '10' } = req.query;

      const reviews = await reviewService.getBusinessReviews(
        businessId,
        {
          sort: sort as 'newest' | 'helpful' | 'highest' | 'lowest' | undefined,
          rating: rating ? parseInt(rating as string, 10) : undefined,
        },
        {
          page: parseInt(page as string, 10),
          limit: parseInt(limit as string, 10),
        }
      );

      sendSuccess(res, reviews, 200);
    } catch (error) {
      logger.error({ error, businessId: req.params.id }, 'Failed to fetch reviews');
      if (error instanceof Error) {
        sendError(res, 'FETCH_REVIEWS_FAILED', error.message, 500);
      } else {
        sendError(res, 'FETCH_REVIEWS_FAILED', 'Failed to fetch reviews', 500);
      }
    }
  }

  /**
   * GET /reviews/:id
   * Gets a single review
   */
  async getReviewById(req: Request, res: Response): Promise<void> {
    try {
      const reviewId = req.params.id as string;

      const review = await reviewService.getReviewById(reviewId);

      if (!review) {
        sendError(res, 'REVIEW_NOT_FOUND', 'Review not found', 404);
        return;
      }

      sendSuccess(res, review, 200);
    } catch (error) {
      logger.error({ error, reviewId: req.params.id }, 'Failed to fetch review');
      if (error instanceof Error) {
        sendError(res, 'FETCH_REVIEW_FAILED', error.message, 500);
      } else {
        sendError(res, 'FETCH_REVIEW_FAILED', 'Failed to fetch review', 500);
      }
    }
  }

  /**
   * GET /users/:id/reviews
   * Gets reviews written by a user
   */
  async getUserReviews(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.id as string;
      const { page = '1', limit = '10' } = req.query;

      const reviews = await reviewService.getUserReviews(
        userId,
        {
          page: parseInt(page as string, 10),
          limit: parseInt(limit as string, 10),
        }
      );

      sendSuccess(res, reviews, 200);
    } catch (error) {
      logger.error({ error, userId: req.params.id }, 'Failed to fetch user reviews');
      if (error instanceof Error) {
        sendError(res, 'FETCH_USER_REVIEWS_FAILED', error.message, 500);
      } else {
        sendError(res, 'FETCH_USER_REVIEWS_FAILED', 'Failed to fetch user reviews', 500);
      }
    }
  }
}

export const reviewController = new ReviewController();
