/**
 * Saved Business Routes
 * RESTful API endpoints for saved business operations
 */

import { Router } from 'express';
import { savedController } from '../controllers/saved-controller.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth-middleware.js';
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
 */
router.get('/users/:id/saved', requireAuth, savedController.getSavedBusinesses.bind(savedController));

/**
 * POST /users/:id/saved
 * Save a business
 * User auth required
 * Rate limit: 30 per minute
 */
router.post(
  '/users/:id/saved',
  requireAuth,
  saveBusinessLimiter,
  validate({ body: savedBusinessSchema }),
  savedController.saveBusiness.bind(savedController)
);

/**
 * DELETE /users/:id/saved/:businessId
 * Remove saved business
 * User auth required
 */
router.delete('/users/:id/saved/:businessId', requireAuth, savedController.unsaveBusiness.bind(savedController));

/**
 * POST /users/:id/lists
 * Create a custom list
 * User auth required
 */
router.post(
  '/users/:id/lists',
  requireAuth,
  validate({ body: createListSchema }),
  savedController.createList.bind(savedController)
);

/**
 * PUT /users/:id/lists/:listId
 * Update a custom list
 * User auth required
 */
router.put(
  '/users/:id/lists/:listId',
  requireAuth,
  validate({ body: updateListSchema }),
  savedController.updateList.bind(savedController)
);

/**
 * DELETE /users/:id/lists/:listId
 * Delete a custom list
 * User auth required
 */
router.delete('/users/:id/lists/:listId', requireAuth, savedController.deleteList.bind(savedController));

export { router as savedRouter };
