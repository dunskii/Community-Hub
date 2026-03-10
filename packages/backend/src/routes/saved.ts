/**
 * Saved Business Routes
 * RESTful API endpoints for saved business operations
 */

import { Router } from 'express';
import { savedController } from '../controllers/saved-controller.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth-middleware.js';
import { resolveMe } from '../middleware/resolve-me.js';
import { saveBusinessLimiter } from '../middleware/review-rate-limiter.js';
import {
  savedBusinessSchema,
  createListSchema,
  updateListSchema,
} from '@community-hub/shared';

const router: ReturnType<typeof Router> = Router();

/**
 * GET /users/:id/saved
 * Get saved businesses for user
 * User auth required (can only view own saved businesses)
 * Supports /users/me/saved as alias
 */
router.get('/users/:id/saved', requireAuth, resolveMe, savedController.getSavedBusinesses.bind(savedController));

/**
 * POST /users/:id/saved
 * Save a business
 * User auth required
 * Rate limit: 30 per minute
 * Supports /users/me/saved as alias
 */
router.post(
  '/users/:id/saved',
  requireAuth,
  resolveMe,
  saveBusinessLimiter,
  validate({ body: savedBusinessSchema }),
  savedController.saveBusiness.bind(savedController)
);

/**
 * DELETE /users/:id/saved/:businessId
 * Remove saved business
 * User auth required
 * Supports /users/me/saved/:businessId as alias
 */
router.delete('/users/:id/saved/:businessId', requireAuth, resolveMe, savedController.unsaveBusiness.bind(savedController));

/**
 * POST /users/:id/lists
 * Create a custom list
 * User auth required
 * Supports /users/me/lists as alias
 */
router.post(
  '/users/:id/lists',
  requireAuth,
  resolveMe,
  validate({ body: createListSchema }),
  savedController.createList.bind(savedController)
);

/**
 * PUT /users/:id/lists/:listId
 * Update a custom list
 * User auth required
 * Supports /users/me/lists/:listId as alias
 */
router.put(
  '/users/:id/lists/:listId',
  requireAuth,
  resolveMe,
  validate({ body: updateListSchema }),
  savedController.updateList.bind(savedController)
);

/**
 * DELETE /users/:id/lists/:listId
 * Delete a custom list
 * User auth required
 * Supports /users/me/lists/:listId as alias
 */
router.delete('/users/:id/lists/:listId', requireAuth, resolveMe, savedController.deleteList.bind(savedController));

export { router as savedRouter };
