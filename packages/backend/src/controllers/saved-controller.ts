/**
 * Saved Business Controller
 * Handles HTTP requests for saved business operations
 */

import type { Request, Response } from 'express';
import { savedService } from '../services/saved-service.js';
import { logger } from '../utils/logger.js';

function sendSuccess(res: Response, data: unknown, statusCode: number = 200, message?: string): void {
  res.status(statusCode).json({
    success: true,
    data,
    ...(message && { message }),
  });
}

function sendError(res: Response, code: string, message: string, statusCode: number = 500): void {
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
    },
  });
}

export class SavedController {
  /**
   * POST /users/:id/saved
   * Saves a business
   */
  async saveBusiness(req: Request, res: Response): Promise<void> {
    try {
      const { id: userId } = req.params;
      const { businessId, listId, notes } = req.body;

      // Ensure user can only save for themselves
      if (userId !== req.user!.id) {
        sendError(res, 'FORBIDDEN', 'You can only save businesses for yourself', 403);
        return;
      }

      const saved = await savedService.saveBusiness(userId, businessId, listId, notes);

      sendSuccess(res, saved, 201, 'Business saved successfully');
    } catch (error) {
      logger.error({ error, userId: req.params.id }, 'Failed to save business');
      if (error instanceof Error) {
        sendError(res, 'SAVE_FAILED', error.message, 500);
      } else {
        sendError(res, 'SAVE_FAILED', 'Failed to save business', 500);
      }
    }
  }

  /**
   * DELETE /users/:id/saved/:businessId
   * Removes a saved business
   */
  async unsaveBusiness(req: Request, res: Response): Promise<void> {
    try {
      const { id: userId, businessId } = req.params;

      // Ensure user can only unsave for themselves
      if (userId !== req.user!.id) {
        sendError(res, 'FORBIDDEN', 'You can only unsave your own businesses', 403);
        return;
      }

      await savedService.unsaveBusiness(userId, businessId);

      res.status(204).send();
    } catch (error) {
      logger.error({ error, userId: req.params.id }, 'Failed to unsave business');
      if (error instanceof Error) {
        sendError(res, 'UNSAVE_FAILED', error.message, 500);
      } else {
        sendError(res, 'UNSAVE_FAILED', 'Failed to unsave business', 500);
      }
    }
  }

  /**
   * GET /users/:id/saved
   * Gets saved businesses
   */
  async getSavedBusinesses(req: Request, res: Response): Promise<void> {
    try {
      const { id: userId } = req.params;
      const { listId, page = '1', limit = '10' } = req.query;

      // Ensure user can only view their own saved businesses
      if (userId !== req.user!.id) {
        sendError(res, 'FORBIDDEN', 'You can only view your own saved businesses', 403);
        return;
      }

      const result = await savedService.getSavedBusinesses(
        userId,
        listId as string | null,
        {
          page: parseInt(page as string, 10),
          limit: parseInt(limit as string, 10),
        }
      );

      sendSuccess(res, result, 200);
    } catch (error) {
      logger.error({ error, userId: req.params.id }, 'Failed to fetch saved businesses');
      if (error instanceof Error) {
        sendError(res, 'FETCH_FAILED', error.message, 500);
      } else {
        sendError(res, 'FETCH_FAILED', 'Failed to fetch saved businesses', 500);
      }
    }
  }

  /**
   * POST /users/:id/lists
   * Creates a custom list
   */
  async createList(req: Request, res: Response): Promise<void> {
    try {
      const { id: userId } = req.params;
      const { name } = req.body;

      // Ensure user can only create lists for themselves
      if (userId !== req.user!.id) {
        sendError(res, 'FORBIDDEN', 'You can only create lists for yourself', 403);
        return;
      }

      const list = await savedService.createList(userId, name);

      sendSuccess(res, list, 201, 'List created successfully');
    } catch (error) {
      logger.error({ error, userId: req.params.id }, 'Failed to create list');
      if (error instanceof Error) {
        sendError(res, 'CREATE_LIST_FAILED', error.message, 500);
      } else {
        sendError(res, 'CREATE_LIST_FAILED', 'Failed to create list', 500);
      }
    }
  }

  /**
   * PUT /users/:id/lists/:listId
   * Updates a custom list
   */
  async updateList(req: Request, res: Response): Promise<void> {
    try {
      const { id: userId, listId } = req.params;
      const { name } = req.body;

      // Ensure user can only update their own lists
      if (userId !== req.user!.id) {
        sendError(res, 'FORBIDDEN', 'You can only update your own lists', 403);
        return;
      }

      const list = await savedService.updateList(userId, listId, name);

      sendSuccess(res, list, 200, 'List updated successfully');
    } catch (error) {
      logger.error({ error, userId: req.params.id, listId: req.params.listId }, 'Failed to update list');
      if (error instanceof Error) {
        sendError(res, 'UPDATE_LIST_FAILED', error.message, 500);
      } else {
        sendError(res, 'UPDATE_LIST_FAILED', 'Failed to update list', 500);
      }
    }
  }

  /**
   * DELETE /users/:id/lists/:listId
   * Deletes a custom list
   */
  async deleteList(req: Request, res: Response): Promise<void> {
    try {
      const { id: userId, listId } = req.params;

      // Ensure user can only delete their own lists
      if (userId !== req.user!.id) {
        sendError(res, 'FORBIDDEN', 'You can only delete your own lists', 403);
        return;
      }

      await savedService.deleteList(userId, listId);

      res.status(204).send();
    } catch (error) {
      logger.error({ error, userId: req.params.id, listId: req.params.listId }, 'Failed to delete list');
      if (error instanceof Error) {
        sendError(res, 'DELETE_LIST_FAILED', error.message, 500);
      } else {
        sendError(res, 'DELETE_LIST_FAILED', 'Failed to delete list', 500);
      }
    }
  }
}

export const savedController = new SavedController();
