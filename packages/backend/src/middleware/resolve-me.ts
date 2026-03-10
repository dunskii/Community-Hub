/**
 * Middleware to resolve 'me' to the current user's ID in URL params
 * This allows endpoints like /users/me/saved to work with routes defined as /users/:id/saved
 */

import type { Request, Response, NextFunction } from 'express';

/**
 * Middleware that replaces 'me' in :id param with the authenticated user's ID
 * Must be used AFTER requireAuth middleware
 */
export function resolveMe(req: Request, _res: Response, next: NextFunction): void {
  if (req.params.id === 'me' && req.user) {
    req.params.id = req.user.id;
  }
  next();
}
