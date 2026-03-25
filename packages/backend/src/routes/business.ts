/**
 * Business Routes
 * RESTful API endpoints for business directory
 * Spec Appendix B.2: Business Endpoints
 */

import { Router } from 'express';
import { businessController } from '../controllers/business-controller.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth-middleware.js';
import { requireRole } from '../middleware/rbac-middleware.js';
import { requireBusinessOwnership } from '../middleware/business-ownership.js';
import { languageNegotiation } from '../middleware/language-negotiation.js';
import {
  listBusinessesLimiter,
  getBusinessLimiter,
  createBusinessLimiter,
  updateBusinessLimiter,
  deleteBusinessLimiter,
} from '../middleware/business-rate-limiter.js';
import { businessCreateSchema, businessUpdateSchema } from '@community-hub/shared';

const router: ReturnType<typeof Router> = Router();

// Apply language negotiation to all routes
router.use(languageNegotiation);

// ─── Public Routes ────────────────────────────────────────────────

/**
 * GET /businesses
 * List businesses with pagination and filtering
 * Public access
 * Rate limit: 30 requests per minute
 */
router.get(
  '/businesses',
  listBusinessesLimiter,
  businessController.listBusinesses.bind(businessController)
);

/**
 * GET /businesses/:id
 * Get business by ID
 * Public access
 * Rate limit: 60 requests per minute
 */
router.get(
  '/businesses/:id',
  getBusinessLimiter,
  businessController.getBusinessById.bind(businessController)
);

/**
 * GET /businesses/slug/:slug
 * Get business by slug (for SEO URLs)
 * Public access
 * Rate limit: 60 requests per minute
 */
router.get(
  '/businesses/slug/:slug',
  getBusinessLimiter,
  businessController.getBusinessBySlug.bind(businessController)
);

// ─── Protected Routes (Admin Only) ────────────────────────────────

/**
 * POST /businesses
 * Create new business
 * Admin only
 * Rate limit: 1 request per minute
 */
router.post(
  '/businesses',
  requireAuth,
  requireRole(['CURATOR', 'ADMIN', 'SUPER_ADMIN']),
  createBusinessLimiter,
  validate({ body: businessCreateSchema }),
  businessController.createBusiness.bind(businessController)
);

/**
 * DELETE /businesses/:id
 * Delete business (soft delete)
 * Admin only
 * Rate limit: 1 request per minute
 */
router.delete(
  '/businesses/:id',
  requireAuth,
  requireRole(['CURATOR', 'ADMIN', 'SUPER_ADMIN']),
  deleteBusinessLimiter,
  businessController.deleteBusiness.bind(businessController)
);

// ─── Protected Routes (Owner or Admin) ────────────────────────────

/**
 * PUT /businesses/:id
 * Update business
 * Business owner or admin
 * Rate limit: 5 requests per minute per business
 */
router.put(
  '/businesses/:id',
  requireAuth,
  requireBusinessOwnership,
  updateBusinessLimiter,
  validate({ body: businessUpdateSchema }),
  businessController.updateBusiness.bind(businessController)
);

export default router;
