/**
 * Role-Based Access Control (RBAC) Middleware
 *
 * Middleware for enforcing role-based permissions.
 * Spec §10.2: User Roles & Permissions
 */

import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../generated/prisma';

/**
 * Require specific role(s) middleware
 *
 * Must be used after requireAuth middleware.
 * Returns 403 if user doesn't have required role.
 *
 * Usage:
 *   router.get('/admin/users', requireAuth, requireRole(['ADMIN', 'SUPER_ADMIN']), handler);
 *
 * @param allowedRoles - Array of allowed roles
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Check if user is authenticated (should be set by requireAuth)
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }

    // Check if user has required role
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
}

/**
 * Require admin role (ADMIN or SUPER_ADMIN)
 *
 * Convenience middleware for admin-only routes.
 *
 * Usage:
 *   router.get('/admin/settings', requireAuth, requireAdmin, handler);
 */
export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  return requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN])(req, res, next);
}

/**
 * Require moderator or admin role
 *
 * Convenience middleware for moderation routes.
 *
 * Usage:
 *   router.delete('/reviews/:id', requireAuth, requireModerator, handler);
 */
export function requireModerator(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  return requireRole([
    UserRole.MODERATOR,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  ])(req, res, next);
}

/**
 * Require resource ownership or admin
 *
 * Checks if the authenticated user owns the resource or is an admin.
 * Resource owner is determined by comparing req.params.id (or req.params.userId) with req.user.id.
 *
 * Usage:
 *   router.put('/users/:id', requireAuth, requireOwnershipOrAdmin, handler);
 *
 * @param resourceIdParam - Request parameter name for resource ID (default: 'id')
 */
export function requireOwnershipOrAdmin(resourceIdParam: string = 'id') {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Check if user is authenticated
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }

    // Admin can access any resource
    if (
      req.user.role === UserRole.ADMIN ||
      req.user.role === UserRole.SUPER_ADMIN
    ) {
      next();
      return;
    }

    // Check ownership
    const resourceId = req.params[resourceIdParam] || req.params.userId;
    if (req.user.id !== resourceId) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'You can only access your own resources',
      });
      return;
    }

    next();
  };
}

/**
 * Permission matrix for complex authorization
 *
 * Future enhancement: implement granular permission checks
 * e.g., action="edit", resourceType="business" -> only owner or admin
 *
 * This is a placeholder for Phase 4+ when we have Business entities.
 */
export function requirePermission(_action: string, _resourceType: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // TODO: Implement permission matrix lookup
    // For now, just require authentication
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }

    next();
  };
}
