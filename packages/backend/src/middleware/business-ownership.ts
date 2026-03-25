/**
 * Business Ownership Middleware
 * Verifies that the authenticated user owns the business or is an admin
 */

import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/index.js';
import { sendError } from '../utils/api-response.js';

/**
 * Middleware to verify business ownership
 * User must be:
 * 1. The business owner (claimedBy === user.id)
 * 2. OR an admin/super admin
 *
 * Requires: requireAuth middleware to run first
 */
export async function requireBusinessOwnership(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Support both :id and :businessId param names
    const businessId = req.params.businessId || req.params.id;
    const user = req.user;

    if (!user) {
      sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
      return;
    }

    // Admins and curators can access any business
    if (user.role === 'CURATOR' || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      next();
      return;
    }

    // Check if user owns this business
    const business = await prisma.businesses.findUnique({
      where: { id: businessId as string },
      select: {
        claimed_by: true,
        claimed: true,
      },
    });

    if (!business) {
      sendError(res, 'BUSINESS_NOT_FOUND', 'Business not found', 404);
      return;
    }

    // Check ownership
    if (!business.claimed || business.claimed_by !== user.id) {
      sendError(res, 'FORBIDDEN', 'You do not have permission to modify this business', 403);
      return;
    }

    // User owns the business
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware to verify business exists and attach to request
 * Does not check ownership, just validates business exists
 */
export async function attachBusiness(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Support both :id and :businessId param names
    const businessId = req.params.businessId || req.params.id;

    const business = await prisma.businesses.findUnique({
      where: { id: businessId as string },
    });

    if (!business) {
      sendError(res, 'BUSINESS_NOT_FOUND', 'Business not found', 404);
      return;
    }

    // Attach business to request for downstream use
    req.business = business;
    next();
  } catch (error) {
    next(error);
  }
}

// Extend Express Request type to include business
declare global {
  namespace Express {
    interface Request {
      business?: Record<string, unknown>;
    }
  }
}
