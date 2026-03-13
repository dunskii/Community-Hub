/**
 * Messaging Analytics Controller
 * Phase 9: Messaging System
 * Handles HTTP requests for messaging analytics operations
 */

import type { Request, Response } from 'express';
import { messagingAnalyticsService } from '../services/messaging-analytics-service.js';
import { ApiError } from '../utils/api-error.js';

// ─── Helper Functions ─────────────────────────────────────────

/**
 * Gets string parameter from request (handles string | string[] case)
 */
function getStringParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

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
    sendError(res, defaultCode, error.message, 500);
  } else {
    sendError(res, defaultCode, 'An unexpected error occurred', 500);
  }
}

// ─── Controller Class ─────────────────────────────────────────

export class MessagingAnalyticsController {
  /**
   * GET /businesses/:businessId/messaging-stats
   * Get messaging statistics for a business
   */
  async getMessagingStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }

      const businessId = getStringParam(req.params.businessId);
      if (!businessId) {
        sendError(res, 'BAD_REQUEST', 'Business ID is required', 400);
        return;
      }

      const query = {
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
      };

      const stats = await messagingAnalyticsService.getMessagingStats(
        businessId,
        userId,
        query
      );

      sendSuccess(res, stats);
    } catch (error) {
      handleError(res, error, 'GET_MESSAGING_STATS_FAILED');
    }
  }
}

export const messagingAnalyticsController = new MessagingAnalyticsController();
