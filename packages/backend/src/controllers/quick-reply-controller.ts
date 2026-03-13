/**
 * Quick Reply Controller
 * Phase 9: Messaging System
 * Handles HTTP requests for quick reply template operations
 */

import type { Request, Response } from 'express';
import { quickReplyService } from '../services/quick-reply-service.js';
import { ApiError } from '../utils/api-error.js';
import type { AuditContext } from '../services/quick-reply-service.js';

// ─── Helper Functions ─────────────────────────────────────────

/**
 * Extracts IP address from request (handles array case)
 */
function getClientIP(req: Request): string {
  const ip = req.ip;
  if (Array.isArray(ip)) {
    return ip[0] ?? 'unknown';
  }
  return ip ?? 'unknown';
}

/**
 * Gets user agent from request
 */
function getUserAgent(req: Request): string {
  return req.get('User-Agent') ?? 'unknown';
}

/**
 * Creates audit context from request
 */
function getAuditContext(req: Request): AuditContext {
  return {
    actorId: req.user?.id ?? '',
    actorRole: req.user?.role ?? 'USER',
    ipAddress: getClientIP(req),
    userAgent: getUserAgent(req),
  };
}

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

export class QuickReplyController {
  /**
   * POST /businesses/:businessId/quick-replies
   * Create a new quick reply template
   */
  async createTemplate(req: Request, res: Response): Promise<void> {
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

      const template = await quickReplyService.createTemplate(
        businessId,
        userId,
        req.body,
        getAuditContext(req)
      );

      sendSuccess(res, template, 201);
    } catch (error) {
      handleError(res, error, 'CREATE_TEMPLATE_FAILED');
    }
  }

  /**
   * GET /businesses/:businessId/quick-replies
   * Get all quick reply templates for a business
   */
  async getTemplates(req: Request, res: Response): Promise<void> {
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

      const templates = await quickReplyService.getTemplates(businessId, userId);
      sendSuccess(res, templates);
    } catch (error) {
      handleError(res, error, 'GET_TEMPLATES_FAILED');
    }
  }

  /**
   * GET /businesses/:businessId/quick-replies/:templateId
   * Get a single quick reply template
   */
  async getTemplate(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }

      const templateId = getStringParam(req.params.templateId);
      if (!templateId) {
        sendError(res, 'BAD_REQUEST', 'Template ID is required', 400);
        return;
      }

      const template = await quickReplyService.getTemplateById(templateId, userId);
      sendSuccess(res, template);
    } catch (error) {
      handleError(res, error, 'GET_TEMPLATE_FAILED');
    }
  }

  /**
   * PUT /businesses/:businessId/quick-replies/:templateId
   * Update a quick reply template
   */
  async updateTemplate(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }

      const templateId = getStringParam(req.params.templateId);
      if (!templateId) {
        sendError(res, 'BAD_REQUEST', 'Template ID is required', 400);
        return;
      }

      const template = await quickReplyService.updateTemplate(
        templateId,
        userId,
        req.body,
        getAuditContext(req)
      );

      sendSuccess(res, template);
    } catch (error) {
      handleError(res, error, 'UPDATE_TEMPLATE_FAILED');
    }
  }

  /**
   * DELETE /businesses/:businessId/quick-replies/:templateId
   * Delete a quick reply template
   */
  async deleteTemplate(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }

      const templateId = getStringParam(req.params.templateId);
      if (!templateId) {
        sendError(res, 'BAD_REQUEST', 'Template ID is required', 400);
        return;
      }

      await quickReplyService.deleteTemplate(
        templateId,
        userId,
        getAuditContext(req)
      );

      sendSuccess(res, { deleted: true });
    } catch (error) {
      handleError(res, error, 'DELETE_TEMPLATE_FAILED');
    }
  }

  /**
   * PUT /businesses/:businessId/quick-replies/reorder
   * Reorder quick reply templates
   */
  async reorderTemplates(req: Request, res: Response): Promise<void> {
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

      const templates = await quickReplyService.reorderTemplates(
        businessId,
        userId,
        req.body,
        getAuditContext(req)
      );

      sendSuccess(res, templates);
    } catch (error) {
      handleError(res, error, 'REORDER_TEMPLATES_FAILED');
    }
  }
}

export const quickReplyController = new QuickReplyController();
