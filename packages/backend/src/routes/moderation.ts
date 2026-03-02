/**
 * Moderation Routes
 * RESTful API endpoints for content moderation operations
 */

import { Router } from 'express';
import { moderationController } from '../controllers/moderation-controller.js';
import { requireAuth } from '../middleware/auth-middleware.js';
import { requireRole } from '../middleware/rbac-middleware.js';

const router: ReturnType<typeof Router> = Router();

/**
 * GET /admin/moderation/reviews
 * Get moderation queue
 * Admin/Super Admin auth required
 */
router.get(
  '/admin/moderation/reviews',
  requireAuth,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  moderationController.getModerationQueue.bind(moderationController)
);

/**
 * POST /admin/moderation/reviews/:id/approve
 * Approve a review
 * Admin/Super Admin auth required
 */
router.post(
  '/admin/moderation/reviews/:id/approve',
  requireAuth,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  moderationController.approveReview.bind(moderationController)
);

/**
 * POST /admin/moderation/reviews/:id/reject
 * Reject a review
 * Admin/Super Admin auth required
 */
router.post(
  '/admin/moderation/reviews/:id/reject',
  requireAuth,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  moderationController.rejectReview.bind(moderationController)
);

export { router as moderationRouter };
