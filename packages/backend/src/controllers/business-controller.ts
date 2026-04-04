/**
 * Business Controller
 * Handles HTTP requests for business endpoints
 */

import type { Request, Response, NextFunction } from 'express';
import { businessService } from '../services/business-service.js';
import { sendSuccess, sendError } from '../utils/api-response.js';
import { searchAndEnrichBusiness } from '../services/maps/google-places-service.js';
import type { BusinessCreateInput, BusinessUpdateInput, BusinessStatus } from '@community-hub/shared';

export class BusinessController {
  /**
   * GET /businesses - List businesses with pagination and filtering
   */
  async listBusinesses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category, status, open_now, search, page, limit, sort } = req.query;

      const filters = {
        category: category as string | undefined,
        status: status ? (status as BusinessStatus) : undefined,
        openNow: open_now === 'true' ? true : undefined,
        search: search as string | undefined,
      };

      const options = {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
        sortBy: (sort as string)?.replace(/^[-+]/, '') as 'createdAt' | 'name' | 'rating' | undefined,
        sortOrder: (sort as string)?.startsWith('-') ? ('desc' as const) : ('asc' as const),
      };

      const result = await businessService.listBusinesses(filters, options);

      sendSuccess(res, {
        businesses: result.businesses,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /businesses/:id - Get business by ID
   */
  async getBusinessById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      if (!id) {
        sendError(res, 'INVALID_REQUEST', 'Business ID is required', 400);
        return;
      }
      const business = await businessService.getBusinessById(id);

      if (!business) {
        sendError(res, 'BUSINESS_NOT_FOUND', 'Business not found', 404);
        return;
      }

      sendSuccess(res, business);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /businesses/slug/:slug - Get business by slug
   */
  async getBusinessBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
      if (!slug) {
        sendError(res, 'INVALID_REQUEST', 'Business slug is required', 400);
        return;
      }
      const business = await businessService.getBusinessBySlug(slug);

      if (!business) {
        sendError(res, 'BUSINESS_NOT_FOUND', 'Business not found', 404);
        return;
      }

      sendSuccess(res, business);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /businesses - Create new business (admin only)
   */
  async createBusiness(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = req.body as BusinessCreateInput;
      const auditContext = {
        actorId: req.user?.id || 'system',
        actorRole: req.user?.role || 'SYSTEM',
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get('user-agent'),
      };

      const business = await businessService.createBusiness(data, auditContext);

      sendSuccess(res, business, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /businesses/:id - Update business (owner or admin)
   */
  async updateBusiness(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      if (!id) {
        sendError(res, 'INVALID_REQUEST', 'Business ID is required', 400);
        return;
      }
      const data = req.body as BusinessUpdateInput;
      const auditContext = {
        actorId: req.user?.id || 'system',
        actorRole: req.user?.role || 'SYSTEM',
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get('user-agent'),
      };

      const business = await businessService.updateBusiness(id, data, auditContext);

      sendSuccess(res, business);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /businesses/:id - Delete business (admin only)
   */
  async deleteBusiness(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      if (!id) {
        sendError(res, 'INVALID_REQUEST', 'Business ID is required', 400);
        return;
      }
      const auditContext = {
        actorId: req.user?.id || 'system',
        actorRole: req.user?.role || 'SYSTEM',
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get('user-agent'),
      };

      await businessService.deleteBusiness(id, auditContext);

      sendSuccess(res, { message: 'Business deleted successfully' }, 200);
    } catch (error) {
      next(error);
    }
  }
  /**
   * POST /businesses/:id/lookup-google - Look up business on Google Places for enrichment
   * Returns enriched data without modifying the business. Owner applies fields via normal update.
   */
  async lookupGoogle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      if (!id) {
        sendError(res, 'INVALID_REQUEST', 'Business ID is required', 400);
        return;
      }

      const business = await businessService.getBusinessById(id);
      if (!business) {
        sendError(res, 'BUSINESS_NOT_FOUND', 'Business not found', 404);
        return;
      }

      // Build search query from existing business data
      const address = business.address as Record<string, string> | null;
      const addressParts = address
        ? [address.street, address.suburb, address.state, address.postcode].filter(Boolean).join(', ')
        : undefined;

      const enriched = await searchAndEnrichBusiness({
        name: business.name as string,
        address: addressParts,
        phone: (business.phone as string) || undefined,
      });

      if (!enriched) {
        sendError(res, 'GOOGLE_NO_MATCH', 'No matching business found on Google Maps', 404);
        return;
      }

      sendSuccess(res, enriched);
    } catch (error) {
      next(error);
    }
  }
}

export const businessController = new BusinessController();
