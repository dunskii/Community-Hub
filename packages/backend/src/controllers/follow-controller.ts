/**
 * Follow Controller
 * Handles HTTP requests for business following operations
 */

import type { Request, Response } from 'express';
import { followService } from '../services/follow-service.js';
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

export class FollowController {
  /**
   * POST /businesses/:id/follow
   * Follows a business
   */
  async followBusiness(req: Request, res: Response): Promise<void> {
    try {
      const businessId = req.params.id as string;
      const userId = req.user!.id;

      const follow = await followService.followBusiness(userId, businessId);

      sendSuccess(res, follow, 201, 'Business followed successfully');
    } catch (error) {
      logger.error({ error, businessId: req.params.id }, 'Failed to follow business');
      if (error instanceof Error) {
        sendError(res, 'FOLLOW_FAILED', error.message, 500);
      } else {
        sendError(res, 'FOLLOW_FAILED', 'Failed to follow business', 500);
      }
    }
  }

  /**
   * DELETE /businesses/:id/follow
   * Unfollows a business
   */
  async unfollowBusiness(req: Request, res: Response): Promise<void> {
    try {
      const businessId = req.params.id as string;
      const userId = req.user!.id;

      await followService.unfollowBusiness(userId, businessId);

      res.status(204).send();
    } catch (error) {
      logger.error({ error, businessId: req.params.id }, 'Failed to unfollow business');
      if (error instanceof Error) {
        sendError(res, 'UNFOLLOW_FAILED', error.message, 500);
      } else {
        sendError(res, 'UNFOLLOW_FAILED', 'Failed to unfollow business', 500);
      }
    }
  }

  /**
   * GET /businesses/:id/followers/count
   * Gets follower count for a business
   */
  async getFollowerCount(req: Request, res: Response): Promise<void> {
    try {
      const businessId = req.params.id as string;

      const count = await followService.getFollowerCount(businessId);

      sendSuccess(res, { count }, 200);
    } catch (error) {
      logger.error({ error, businessId: req.params.id }, 'Failed to get follower count');
      if (error instanceof Error) {
        sendError(res, 'COUNT_FAILED', error.message, 500);
      } else {
        sendError(res, 'COUNT_FAILED', 'Failed to get follower count', 500);
      }
    }
  }

  /**
   * GET /businesses/:id/followers
   * Gets followers for a business (admin/owner only)
   */
  async getBusinessFollowers(req: Request, res: Response): Promise<void> {
    try {
      const businessId = req.params.id as string;
      const { page = '1', limit = '10' } = req.query;

      const result = await followService.getBusinessFollowers(
        businessId,
        {
          page: parseInt(page as string, 10),
          limit: parseInt(limit as string, 10),
        }
      );

      sendSuccess(res, result, 200);
    } catch (error) {
      logger.error({ error, businessId: req.params.id }, 'Failed to get followers');
      if (error instanceof Error) {
        sendError(res, 'FETCH_FOLLOWERS_FAILED', error.message, 500);
      } else {
        sendError(res, 'FETCH_FOLLOWERS_FAILED', 'Failed to get followers', 500);
      }
    }
  }

  /**
   * GET /users/:id/following
   * Gets businesses a user is following
   */
  async getFollowedBusinesses(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.id as string;
      const { page = '1', limit = '10' } = req.query;

      // Ensure user can only view their own following list
      if (userId !== req.user!.id) {
        sendError(res, 'FORBIDDEN', 'You can only view your own following list', 403);
        return;
      }

      const result = await followService.getFollowedBusinesses(
        userId,
        {
          page: parseInt(page as string, 10),
          limit: parseInt(limit as string, 10),
        }
      );

      sendSuccess(res, result, 200);
    } catch (error) {
      logger.error({ error, userId: req.params.id }, 'Failed to get following');
      if (error instanceof Error) {
        sendError(res, 'FETCH_FOLLOWING_FAILED', error.message, 500);
      } else {
        sendError(res, 'FETCH_FOLLOWING_FAILED', 'Failed to get following', 500);
      }
    }
  }

  /**
   * GET /businesses/:id/follow/status
   * Checks if current user is following a business
   */
  async getFollowStatus(req: Request, res: Response): Promise<void> {
    try {
      const businessId = req.params.id as string;
      const userId = req.user?.id;

      if (!userId) {
        sendSuccess(res, { isFollowing: false }, 200);
        return;
      }

      const isFollowing = await followService.isFollowing(userId, businessId);

      sendSuccess(res, { isFollowing }, 200);
    } catch (error) {
      logger.error({ error, businessId: req.params.id }, 'Failed to get follow status');
      if (error instanceof Error) {
        sendError(res, 'STATUS_FAILED', error.message, 500);
      } else {
        sendError(res, 'STATUS_FAILED', 'Failed to get follow status', 500);
      }
    }
  }
}

export const followController = new FollowController();
