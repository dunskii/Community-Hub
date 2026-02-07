/**
 * Authentication Middleware
 *
 * Middleware for verifying JWT tokens and attaching user to request.
 * Spec §4.6: Session Security
 */

import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/token-service';
import { prisma } from '../db/index';
import { UserStatus } from '../generated/prisma';
import { AuthUser } from '../types/auth';
import { logger } from '../utils/logger';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Extract JWT token from request
 *
 * Checks:
 * 1. Authorization header (Bearer token)
 * 2. Cookie (access_token)
 *
 * @param req - Express request
 * @returns Token string or null
 */
function extractToken(req: Request): string | null {
  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check cookie
  if (req.cookies && req.cookies.access_token) {
    return req.cookies.access_token;
  }

  return null;
}

/**
 * Require authentication middleware
 *
 * Verifies JWT token and attaches user to request.
 * Returns 401 if token is missing, invalid, or user is not active.
 *
 * Usage:
 *   router.post('/protected', requireAuth, handler);
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract token
    const token = extractToken(req);
    if (!token) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }

    // Verify token
    const payload = await verifyAccessToken(token);
    if (!payload) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      });
      return;
    }

    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
      },
    });

    if (!user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found',
      });
      return;
    }

    // Check user status
    if (user.status === UserStatus.SUSPENDED) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Account suspended',
      });
      return;
    }

    if (user.status === UserStatus.DELETED) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Account deleted',
      });
      return;
    }

    if (user.status === UserStatus.PENDING) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Please verify your email address',
      });
      return;
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      jti: payload.jti,
    };

    next();
  } catch (error) {
    logger.error({ error }, 'Auth middleware error');
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication error',
    });
  }
}

/**
 * Optional authentication middleware
 *
 * Same as requireAuth but doesn't fail if no token.
 * Used for public endpoints that show personalized content if logged in.
 *
 * Usage:
 *   router.get('/businesses/:id', optionalAuth, handler);
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract token
    const token = extractToken(req);
    if (!token) {
      next();
      return;
    }

    // Verify token
    const payload = await verifyAccessToken(token);
    if (!payload) {
      next();
      return;
    }

    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
      },
    });

    if (user && user.status === UserStatus.ACTIVE) {
      // Attach user to request
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        jti: payload.jti,
      };
    }

    next();
  } catch (error) {
    logger.error({ error }, 'Optional auth middleware error');
    // Don't fail request - just continue without user
    next();
  }
}
