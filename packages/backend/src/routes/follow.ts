/**
 * Follow Routes
 * RESTful API endpoints for business following operations
 */

import { Router } from 'express';
import { followController } from '../controllers/follow-controller.js';
import { requireAuth } from '../middleware/auth-middleware.js';
import { requireRole } from '../middleware/rbac-middleware.js';
import { resolveMe } from '../middleware/resolve-me.js';
import { followBusinessLimiter } from '../middleware/review-rate-limiter.js';

const router: ReturnType<typeof Router> = Router();

/**
 * GET /businesses/:id/followers/count
 * Get follower count for business
 * Public access
 */
router.get('/businesses/:id/followers/count', followController.getFollowerCount.bind(followController));

/**
 * GET /businesses/:id/follow/status
 * Check if current user is following business
 * Optional auth (returns false if not authenticated)
 */
router.get('/businesses/:id/follow/status', followController.getFollowStatus.bind(followController));

/**
 * POST /businesses/:id/follow
 * Follow a business
 * User auth required
 * Rate limit: 30 per minute
 */
router.post(
  '/businesses/:id/follow',
  requireAuth,
  followBusinessLimiter,
  followController.followBusiness.bind(followController)
);

/**
 * DELETE /businesses/:id/follow
 * Unfollow a business
 * User auth required
 */
router.delete('/businesses/:id/follow', requireAuth, followController.unfollowBusiness.bind(followController));

/**
 * GET /users/:id/following
 * Get businesses user is following
 * User auth required (can only view own following list)
 * Supports /users/me/following as alias
 */
router.get('/users/:id/following', requireAuth, resolveMe, followController.getFollowedBusinesses.bind(followController));

/**
 * GET /businesses/:id/followers
 * Get followers for business
 * Admin/business owner auth required
 */
router.get(
  '/businesses/:id/followers',
  requireAuth,
  requireRole(['BUSINESS_OWNER', 'ADMIN', 'SUPER_ADMIN']),
  followController.getBusinessFollowers.bind(followController)
);

export { router as followRouter };
