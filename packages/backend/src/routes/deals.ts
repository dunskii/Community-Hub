/**
 * Deal Routes
 * Phase 10: Promotions & Deals MVP
 * RESTful API endpoints for deal operations
 */

import { Router } from 'express';
import { dealController } from '../controllers/deal-controller.js';
import { dealService } from '../services/deal-service.js';
import { sendSuccess } from '../utils/api-response.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth-middleware.js';
import {
  createDealLimiter,
  updateDealLimiter,
  deleteDealLimiter,
  listDealsLimiter,
  getDealLimiter,
  featuredDealsLimiter,
} from '../middleware/deal-rate-limiter.js';
import { dealCreateSchema, dealUpdateSchema } from '@community-hub/shared';

const router: ReturnType<typeof Router> = Router();

// ─── Public Routes ────────────────────────────────────────────────

/**
 * GET /deals
 * List active deals with filtering
 * Public access
 * Query params: ?featured=true&businessId=&page=1&limit=20&sort=newest
 */
router.get(
  '/',
  listDealsLimiter,
  dealController.listDeals.bind(dealController)
);

/**
 * GET /deals/featured
 * Get featured deals (for homepage)
 * Public access
 * Query params: ?limit=6
 */
router.get(
  '/featured',
  featuredDealsLimiter,
  dealController.getFeaturedDeals.bind(dealController)
);

/**
 * GET /deals/:id
 * Get single deal details
 * Public access
 */
router.get(
  '/:id',
  getDealLimiter,
  dealController.getDeal.bind(dealController)
);

/**
 * POST /deals/:id/click
 * Track a deal click (modal opened) - public
 */
router.post(
  '/:id/click',
  getDealLimiter,
  async (req, res) => {
    try {
      await dealService.incrementClicks(req.params.id as string);
      sendSuccess(res, { tracked: true });
    } catch { sendSuccess(res, { tracked: false }); }
  }
);

/**
 * POST /deals/:id/voucher-reveal
 * Track a voucher code reveal - public
 */
router.post(
  '/:id/voucher-reveal',
  getDealLimiter,
  async (req, res) => {
    try {
      await dealService.incrementVoucherReveals(req.params.id as string);
      sendSuccess(res, { tracked: true });
    } catch { sendSuccess(res, { tracked: false }); }
  }
);

export { router as dealRouter };

// ─── Business Deal Routes (mounted on /businesses/:businessId/deals) ────

const businessDealRouter: ReturnType<typeof Router> = Router({ mergeParams: true });

/**
 * GET /businesses/:businessId/deals
 * Get all deals for a business
 * Public access
 * Query params: ?includeExpired=true
 */
businessDealRouter.get(
  '/',
  listDealsLimiter,
  dealController.getBusinessDeals.bind(dealController)
);

/**
 * GET /businesses/:businessId/deals/count
 * Get active deal count for a business
 * Public access
 */
businessDealRouter.get(
  '/count',
  getDealLimiter,
  dealController.getDealsCount.bind(dealController)
);

/**
 * POST /businesses/:businessId/deals
 * Create a new deal for a business
 * Owner auth required
 * Rate limit: 5 per minute
 */
businessDealRouter.post(
  '/',
  requireAuth,
  createDealLimiter,
  validate({ body: dealCreateSchema }),
  dealController.createDeal.bind(dealController)
);

/**
 * PUT /businesses/:businessId/deals/:dealId
 * Update a deal
 * Owner auth required
 * Rate limit: 10 per minute
 */
businessDealRouter.put(
  '/:dealId',
  requireAuth,
  updateDealLimiter,
  validate({ body: dealUpdateSchema }),
  dealController.updateDeal.bind(dealController)
);

/**
 * DELETE /businesses/:businessId/deals/:dealId
 * Delete a deal
 * Owner auth required
 * Rate limit: 5 per minute
 */
businessDealRouter.delete(
  '/:dealId',
  requireAuth,
  deleteDealLimiter,
  dealController.deleteDeal.bind(dealController)
);

/**
 * GET /businesses/:businessId/deals/stats
 * Get promotion stats for a business (owner)
 */
businessDealRouter.get(
  '/stats',
  requireAuth,
  getDealLimiter,
  async (req, res) => {
    try {
      const stats = await dealService.getPromotionStats(req.params.businessId as string);
      sendSuccess(res, stats);
    } catch {
      sendSuccess(res, { totalViews: 0, totalClicks: 0, totalVoucherReveals: 0, activeDeals: 0 });
    }
  }
);

export { businessDealRouter };
