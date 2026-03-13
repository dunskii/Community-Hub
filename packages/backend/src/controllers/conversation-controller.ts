/**
 * Conversation Controller
 * Phase 9: Messaging System
 * Handles HTTP requests for conversation and message operations
 */

import type { Request, Response } from 'express';
import { conversationService } from '../services/conversation-service.js';
import { messageService } from '../services/message-service.js';
import { ApiError } from '../utils/api-error.js';
import type { AuditContext } from '../services/conversation-service.js';

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

export class ConversationController {
  // ─── Conversation Operations ────────────────────────────────

  /**
   * POST /conversations
   * Create a new conversation with a business
   */
  async createConversation(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }

      const conversation = await conversationService.createConversation(
        req.body,
        userId,
        getAuditContext(req)
      );

      sendSuccess(res, conversation, 201);
    } catch (error) {
      handleError(res, error, 'CREATE_CONVERSATION_FAILED');
    }
  }

  /**
   * GET /conversations
   * Get user's conversations with pagination and filters
   */
  async getUserConversations(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }

      // Query params are validated by middleware, so use them directly
      const filters = {
        status: (req.query.status as 'active' | 'archived' | 'all') ?? 'active',
        search: req.query.search as string | undefined,
        page: Number(req.query.page) || 1,
        limit: Math.min(Number(req.query.limit) || 20, 50),
      };

      const result = await conversationService.getUserConversations(userId, filters);
      sendSuccess(res, result);
    } catch (error) {
      handleError(res, error, 'GET_CONVERSATIONS_FAILED');
    }
  }

  /**
   * GET /conversations/:id
   * Get a single conversation by ID
   */
  async getConversation(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }

      const conversationId = getStringParam(req.params.id);
      if (!conversationId) {
        sendError(res, 'BAD_REQUEST', 'Conversation ID is required', 400);
        return;
      }

      const conversation = await conversationService.getConversationById(
        conversationId,
        userId
      );
      sendSuccess(res, conversation);
    } catch (error) {
      handleError(res, error, 'GET_CONVERSATION_FAILED');
    }
  }

  /**
   * PATCH /conversations/:id/archive
   * Archive a conversation
   */
  async archiveConversation(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }

      const conversationId = getStringParam(req.params.id);
      if (!conversationId) {
        sendError(res, 'BAD_REQUEST', 'Conversation ID is required', 400);
        return;
      }

      await conversationService.archiveConversation(
        conversationId,
        userId,
        getAuditContext(req)
      );
      sendSuccess(res, { archived: true });
    } catch (error) {
      handleError(res, error, 'ARCHIVE_CONVERSATION_FAILED');
    }
  }

  /**
   * PATCH /conversations/:id/unarchive
   * Unarchive a conversation
   */
  async unarchiveConversation(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }

      const conversationId = getStringParam(req.params.id);
      if (!conversationId) {
        sendError(res, 'BAD_REQUEST', 'Conversation ID is required', 400);
        return;
      }

      await conversationService.unarchiveConversation(
        conversationId,
        userId,
        getAuditContext(req)
      );
      sendSuccess(res, { archived: false });
    } catch (error) {
      handleError(res, error, 'UNARCHIVE_CONVERSATION_FAILED');
    }
  }

  /**
   * POST /conversations/:id/report
   * Report a conversation
   */
  async reportConversation(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }

      const conversationId = getStringParam(req.params.id);
      if (!conversationId) {
        sendError(res, 'BAD_REQUEST', 'Conversation ID is required', 400);
        return;
      }

      await conversationService.reportConversation(
        conversationId,
        userId,
        req.body,
        getAuditContext(req)
      );
      sendSuccess(res, { reported: true });
    } catch (error) {
      handleError(res, error, 'REPORT_CONVERSATION_FAILED');
    }
  }

  /**
   * GET /conversations/unread-count
   * Get unread conversation count for user
   */
  async getUnreadCount(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }

      const count = await conversationService.getUnreadCount(userId);
      sendSuccess(res, { unreadCount: count });
    } catch (error) {
      handleError(res, error, 'GET_UNREAD_COUNT_FAILED');
    }
  }

  // ─── Message Operations ─────────────────────────────────────

  /**
   * GET /conversations/:id/messages
   * Get messages for a conversation with pagination
   */
  async getMessages(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }

      const conversationId = getStringParam(req.params.id);
      if (!conversationId) {
        sendError(res, 'BAD_REQUEST', 'Conversation ID is required', 400);
        return;
      }

      const pagination = {
        page: Number(req.query.page) || 1,
        limit: Math.min(Number(req.query.limit) || 50, 100),
      };

      const result = await messageService.getMessages(
        conversationId,
        userId,
        pagination
      );
      sendSuccess(res, result);
    } catch (error) {
      handleError(res, error, 'GET_MESSAGES_FAILED');
    }
  }

  /**
   * POST /conversations/:id/messages
   * Send a message in a conversation
   */
  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }

      const conversationId = getStringParam(req.params.id);
      if (!conversationId) {
        sendError(res, 'BAD_REQUEST', 'Conversation ID is required', 400);
        return;
      }

      const message = await messageService.sendMessage(
        conversationId,
        userId,
        req.body,
        getAuditContext(req)
      );
      sendSuccess(res, message, 201);
    } catch (error) {
      handleError(res, error, 'SEND_MESSAGE_FAILED');
    }
  }

  /**
   * PATCH /conversations/:id/read
   * Mark conversation as read
   */
  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }

      const conversationId = getStringParam(req.params.id);
      if (!conversationId) {
        sendError(res, 'BAD_REQUEST', 'Conversation ID is required', 400);
        return;
      }

      await messageService.markAsRead(
        conversationId,
        userId,
        getAuditContext(req)
      );
      sendSuccess(res, { read: true });
    } catch (error) {
      handleError(res, error, 'MARK_READ_FAILED');
    }
  }

  /**
   * DELETE /messages/:id
   * Delete a message (soft delete within 24h window)
   */
  async deleteMessage(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }

      const messageId = getStringParam(req.params.id);
      if (!messageId) {
        sendError(res, 'BAD_REQUEST', 'Message ID is required', 400);
        return;
      }

      await messageService.deleteMessage(
        messageId,
        userId,
        getAuditContext(req)
      );
      sendSuccess(res, { deleted: true });
    } catch (error) {
      handleError(res, error, 'DELETE_MESSAGE_FAILED');
    }
  }

  // ─── Business Inbox Operations ──────────────────────────────

  /**
   * GET /businesses/:businessId/inbox
   * Get business inbox (for business owners)
   */
  async getBusinessInbox(req: Request, res: Response): Promise<void> {
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

      const filters = {
        status: (req.query.status as 'active' | 'archived' | 'blocked' | 'all') ?? 'active',
        unreadOnly: req.query.unreadOnly === 'true',
        search: req.query.search as string | undefined,
        page: Number(req.query.page) || 1,
        limit: Math.min(Number(req.query.limit) || 20, 50),
      };

      const result = await conversationService.getBusinessInbox(
        businessId,
        userId,
        filters
      );
      sendSuccess(res, result);
    } catch (error) {
      handleError(res, error, 'GET_BUSINESS_INBOX_FAILED');
    }
  }

  /**
   * GET /businesses/:businessId/inbox/unread-count
   * Get unread count for business inbox
   */
  async getBusinessUnreadCount(req: Request, res: Response): Promise<void> {
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

      const count = await conversationService.getBusinessUnreadCount(
        businessId,
        userId
      );
      sendSuccess(res, { unreadCount: count });
    } catch (error) {
      handleError(res, error, 'GET_BUSINESS_UNREAD_COUNT_FAILED');
    }
  }

  /**
   * PATCH /businesses/:businessId/conversations/:conversationId/block
   * Block a conversation (business owners only)
   */
  async blockConversation(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }

      const conversationId = getStringParam(req.params.conversationId);
      if (!conversationId) {
        sendError(res, 'BAD_REQUEST', 'Conversation ID is required', 400);
        return;
      }

      await conversationService.blockConversation(
        conversationId,
        userId,
        getAuditContext(req)
      );
      sendSuccess(res, { blocked: true });
    } catch (error) {
      handleError(res, error, 'BLOCK_CONVERSATION_FAILED');
    }
  }

  /**
   * PATCH /businesses/:businessId/conversations/:conversationId/unblock
   * Unblock a conversation (business owners only)
   */
  async unblockConversation(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }

      const conversationId = getStringParam(req.params.conversationId);
      if (!conversationId) {
        sendError(res, 'BAD_REQUEST', 'Conversation ID is required', 400);
        return;
      }

      await conversationService.unblockConversation(
        conversationId,
        userId,
        getAuditContext(req)
      );
      sendSuccess(res, { blocked: false });
    } catch (error) {
      handleError(res, error, 'UNBLOCK_CONVERSATION_FAILED');
    }
  }
}

export const conversationController = new ConversationController();
