/**
 * Review Routes
 * RESTful API endpoints for review operations
 */

import { Router } from 'express';
import { reviewController } from '../controllers/review-controller.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth-middleware.js';
import { requireRole } from '../middleware/rbac-middleware.js';
import {
  createReviewLimiter,
  helpfulVoteLimiter,
  reportContentLimiter,
  businessResponseLimiter,
} from '../middleware/review-rate-limiter.js';
import {
  reviewCreateSchema,
  reviewUpdateSchema,
  businessResponseSchema,
  reportReviewSchema,
} from '@community-hub/shared';

const router: ReturnType<typeof Router> = Router();

// ─── Public Routes ────────────────────────────────────────────────

/**
 * GET /reviews/:id
 * Get single review
 * Public access
 */
router.get('/reviews/:id', reviewController.getReviewById.bind(reviewController));

/**
 * GET /businesses/:id/reviews
 * List reviews for business
 * Public access
 * Query params: ?sort=newest|helpful|highest|lowest&rating=1-5&page=1&limit=10
 */
router.get(
  '/businesses/:id/reviews',
  reviewController.getBusinessReviews.bind(reviewController)
);

/**
 * GET /users/:id/reviews
 * List reviews written by user
 * Public access
 */
router.get('/users/:id/reviews', reviewController.getUserReviews.bind(reviewController));

// ─── Protected Routes (Authenticated Users) ───────────────────────

/**
 * POST /businesses/:id/reviews
 * Create review for business
 * User auth required
 * Rate limit: 5 per hour (configurable)
 */
router.post(
  '/businesses/:id/reviews',
  requireAuth,
  createReviewLimiter,
  validate({ body: reviewCreateSchema }),
  reviewController.createReview.bind(reviewController)
);

/**
 * PUT /reviews/:id
 * Update own review (within 7 days)
 * User auth required
 */
router.put(
  '/reviews/:id',
  requireAuth,
  validate({ body: reviewUpdateSchema }),
  reviewController.updateReview.bind(reviewController)
);

/**
 * DELETE /reviews/:id
 * Delete own review
 * User auth required
 */
router.delete('/reviews/:id', requireAuth, reviewController.deleteReview.bind(reviewController));

/**
 * POST /reviews/:id/helpful
 * Mark review as helpful
 * User auth required
 * Rate limit: 30 per minute
 */
router.post(
  '/reviews/:id/helpful',
  requireAuth,
  helpfulVoteLimiter,
  reviewController.markHelpful.bind(reviewController)
);

/**
 * DELETE /reviews/:id/helpful
 * Remove helpful mark
 * User auth required
 */
router.delete('/reviews/:id/helpful', requireAuth, reviewController.unmarkHelpful.bind(reviewController));

/**
 * POST /reviews/:id/report
 * Report review
 * User auth required
 * Rate limit: 10 per hour (configurable)
 */
router.post(
  '/reviews/:id/report',
  requireAuth,
  reportContentLimiter,
  validate({ body: reportReviewSchema }),
  reviewController.reportReview.bind(reviewController)
);

/**
 * POST /reviews/:id/respond
 * Business owner response to review
 * Business owner auth required
 * Rate limit: 10 per hour
 */
router.post(
  '/reviews/:id/respond',
  requireAuth,
  requireRole(['BUSINESS_OWNER', 'ADMIN', 'SUPER_ADMIN']),
  businessResponseLimiter,
  validate({ body: businessResponseSchema }),
  reviewController.respondToReview.bind(reviewController)
);

export { router as reviewRouter };
