/**
 * Deal Controller
 * Phase 10: Promotions & Deals MVP
 * Handles HTTP requests for deal operations
 */

import type { Request, Response } from 'express';
import { dealService } from '../services/deal-service.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/api-error.js';
import type { DealFilterInput } from '@community-hub/shared';

/**
 * Sends success response
 */
function sendSuccess(
  res: Response,
  data: unknown,
  statusCode: number = 200,
  message?: string
): void {
  res.status(statusCode).json({
    success: true,
    data,
    ...(message && { message }),
  });
}

/**
 * Sends error response
 */
function sendError(
  res: Response,
  code: string,
  message: string,
  statusCode: number = 500
): void {
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
    },
  });
}

/**
 * Handles ApiError instances
 */
function handleError(res: Response, error: unknown, defaultCode: string): void {
  if (error instanceof ApiError) {
    sendError(res, error.code, error.message, error.statusCode);
  } else if (error instanceof Error) {
    logger.error({ error }, 'Unexpected error in deal controller');
    sendError(res, defaultCode, error.message, 500);
  } else {
    sendError(res, defaultCode, 'An unexpected error occurred', 500);
  }
}

export class DealController {
  // ─── Public Routes ─────────────────────────────────────────────

  /**
   * GET /deals
   * List active deals with filtering and pagination
   */
  async listDeals(req: Request, res: Response): Promise<void> {
    try {
      const filters: DealFilterInput = {
        status: req.query.status as DealFilterInput['status'],
        featured: req.query.featured === 'true' ? true : req.query.featured === 'false' ? false : undefined,
        businessId: req.query.businessId as string | undefined,
        validNow: req.query.validNow !== 'false',
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Math.min(Number(req.query.limit), 50) : 20,
        sort: (req.query.sort as DealFilterInput['sort']) || 'newest',
      };

      const result = await dealService.getActiveDeals(filters);
      sendSuccess(res, result);
    } catch (error) {
      handleError(res, error, 'LIST_DEALS_ERROR');
    }
  }

  /**
   * GET /deals/featured
   * Get featured deals (for homepage)
   */
  async getFeaturedDeals(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? Math.min(Number(req.query.limit), 12) : 6;
      const deals = await dealService.getFeaturedDeals(limit);
      sendSuccess(res, { deals });
    } catch (error) {
      handleError(res, error, 'FEATURED_DEALS_ERROR');
    }
  }

  /**
   * GET /deals/:id
   * Get single deal details
   */
  async getDeal(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const deal = await dealService.getDealById(id);

      if (!deal) {
        sendError(res, 'DEAL_NOT_FOUND', 'Deal not found', 404);
        return;
      }

      // Increment view count
      await dealService.incrementViews(id);

      sendSuccess(res, { deal });
    } catch (error) {
      handleError(res, error, 'GET_DEAL_ERROR');
    }
  }

  // ─── Business Deal Routes ──────────────────────────────────────

  /**
   * GET /businesses/:businessId/deals
   * Get all deals for a business
   */
  async getBusinessDeals(req: Request, res: Response): Promise<void> {
    try {
      const businessId = req.params.businessId as string;
      const includeExpired = req.query.includeExpired === 'true';

      const deals = await dealService.getBusinessDeals(businessId, { includeExpired });
      const counts = await dealService.getActiveDealsCountForBusiness(businessId);

      sendSuccess(res, {
        deals,
        activeCount: counts.active,
        maxDeals: counts.max,
      });
    } catch (error) {
      handleError(res, error, 'GET_BUSINESS_DEALS_ERROR');
    }
  }

  /**
   * POST /businesses/:businessId/deals
   * Create a new deal for a business
   */
  async createDeal(req: Request, res: Response): Promise<void> {
    try {
      const businessId = req.params.businessId as string;
      const userId = req.user!.id;

      const deal = await dealService.createDeal(businessId, req.body, userId);
      sendSuccess(res, { deal }, 201, 'Deal created successfully');
    } catch (error) {
      handleError(res, error, 'CREATE_DEAL_ERROR');
    }
  }

  /**
   * PUT /businesses/:businessId/deals/:dealId
   * Update a deal
   */
  async updateDeal(req: Request, res: Response): Promise<void> {
    try {
      const businessId = req.params.businessId as string;
      const dealId = req.params.dealId as string;
      const userId = req.user!.id;

      const deal = await dealService.updateDeal(businessId, dealId, req.body, userId);
      sendSuccess(res, { deal }, 200, 'Deal updated successfully');
    } catch (error) {
      handleError(res, error, 'UPDATE_DEAL_ERROR');
    }
  }

  /**
   * DELETE /businesses/:businessId/deals/:dealId
   * Delete a deal
   */
  async deleteDeal(req: Request, res: Response): Promise<void> {
    try {
      const businessId = req.params.businessId as string;
      const dealId = req.params.dealId as string;
      const userId = req.user!.id;

      await dealService.deleteDeal(businessId, dealId, userId);
      sendSuccess(res, null, 200, 'Deal deleted successfully');
    } catch (error) {
      handleError(res, error, 'DELETE_DEAL_ERROR');
    }
  }

  /**
   * GET /businesses/:businessId/deals/count
   * Get active deal count for a business
   */
  async getDealsCount(req: Request, res: Response): Promise<void> {
    try {
      const businessId = req.params.businessId as string;
      const counts = await dealService.getActiveDealsCountForBusiness(businessId);
      sendSuccess(res, counts);
    } catch (error) {
      handleError(res, error, 'GET_DEALS_COUNT_ERROR');
    }
  }
}

// Export singleton instance
export const dealController = new DealController();
