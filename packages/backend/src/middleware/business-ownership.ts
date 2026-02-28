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
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
      return;
    }

    // Admins can access any business
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      next();
      return;
    }

    // Check if user owns this business
    const business = await prisma.business.findUnique({
      where: { id: id as string },
      select: {
        claimedBy: true,
        claimed: true,
      },
    });

    if (!business) {
      sendError(res, 'BUSINESS_NOT_FOUND', 'Business not found', 404);
      return;
    }

    // Check ownership
    if (!business.claimed || business.claimedBy !== user.id) {
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
    const { id } = req.params;

    const business = await prisma.business.findUnique({
      where: { id: id as string },
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
