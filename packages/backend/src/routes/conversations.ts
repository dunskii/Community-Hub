/**
 * Conversations Router
 * Phase 9: Messaging System
 * API endpoints for conversations and messages
 */

import { Router } from 'express';
import { conversationController } from '../controllers/conversation-controller.js';
import { quickReplyController } from '../controllers/quick-reply-controller.js';
import { messagingAnalyticsController } from '../controllers/messaging-analytics-controller.js';
import { requireAuth } from '../middleware/auth-middleware.js';
import { validate } from '../middleware/validate.js';
import {
  createConversationLimiter,
  sendMessageLimiter,
  readConversationsLimiter,
  reportConversationLimiter,
  quickReplyLimiter,
  businessInboxLimiter,
} from '../middleware/messaging-rate-limiter.js';
import {
  createConversationSchema,
  sendMessageSchema,
  conversationFilterSchema,
  businessInboxFilterSchema,
  reportConversationSchema,
  messagePaginationSchema,
  quickReplyTemplateSchema,
  reorderTemplatesSchema,
  messagingStatsQuerySchema,
} from '@community-hub/shared';

const router = Router();

// ─── User Conversations ───────────────────────────────────────

/**
 * GET /conversations/unread-count
 * Get unread conversation count for authenticated user
 */
router.get(
  '/conversations/unread-count',
  requireAuth,
  readConversationsLimiter,
  (req, res) => conversationController.getUnreadCount(req, res)
);

/**
 * GET /conversations
 * Get user's conversations with pagination and filters
 */
router.get(
  '/conversations',
  requireAuth,
  readConversationsLimiter,
  validate({ query: conversationFilterSchema }),
  (req, res) => conversationController.getUserConversations(req, res)
);

/**
 * POST /conversations
 * Create a new conversation with a business
 */
router.post(
  '/conversations',
  requireAuth,
  createConversationLimiter,
  validate({ body: createConversationSchema }),
  (req, res) => conversationController.createConversation(req, res)
);

/**
 * GET /conversations/:id
 * Get a single conversation
 */
router.get(
  '/conversations/:id',
  requireAuth,
  readConversationsLimiter,
  (req, res) => conversationController.getConversation(req, res)
);

/**
 * PATCH /conversations/:id/archive
 * Archive a conversation
 */
router.patch(
  '/conversations/:id/archive',
  requireAuth,
  readConversationsLimiter,
  (req, res) => conversationController.archiveConversation(req, res)
);

/**
 * PATCH /conversations/:id/unarchive
 * Unarchive a conversation
 */
router.patch(
  '/conversations/:id/unarchive',
  requireAuth,
  readConversationsLimiter,
  (req, res) => conversationController.unarchiveConversation(req, res)
);

/**
 * POST /conversations/:id/report
 * Report a conversation
 */
router.post(
  '/conversations/:id/report',
  requireAuth,
  reportConversationLimiter,
  validate({ body: reportConversationSchema }),
  (req, res) => conversationController.reportConversation(req, res)
);

/**
 * PATCH /conversations/:id/read
 * Mark conversation as read
 */
router.patch(
  '/conversations/:id/read',
  requireAuth,
  readConversationsLimiter,
  (req, res) => conversationController.markAsRead(req, res)
);

// ─── Messages ─────────────────────────────────────────────────

/**
 * GET /conversations/:id/messages
 * Get messages for a conversation
 */
router.get(
  '/conversations/:id/messages',
  requireAuth,
  readConversationsLimiter,
  validate({ query: messagePaginationSchema }),
  (req, res) => conversationController.getMessages(req, res)
);

/**
 * POST /conversations/:id/messages
 * Send a message in a conversation
 */
router.post(
  '/conversations/:id/messages',
  requireAuth,
  sendMessageLimiter,
  validate({ body: sendMessageSchema }),
  (req, res) => conversationController.sendMessage(req, res)
);

/**
 * DELETE /messages/:id
 * Delete a message (soft delete within 24h window)
 */
router.delete(
  '/messages/:id',
  requireAuth,
  readConversationsLimiter,
  (req, res) => conversationController.deleteMessage(req, res)
);

// ─── Business Inbox ───────────────────────────────────────────

/**
 * GET /businesses/:businessId/inbox
 * Get business inbox (for business owners)
 */
router.get(
  '/businesses/:businessId/inbox',
  requireAuth,
  businessInboxLimiter,
  validate({ query: businessInboxFilterSchema }),
  (req, res) => conversationController.getBusinessInbox(req, res)
);

/**
 * GET /businesses/:businessId/inbox/unread-count
 * Get unread count for business inbox
 */
router.get(
  '/businesses/:businessId/inbox/unread-count',
  requireAuth,
  businessInboxLimiter,
  (req, res) => conversationController.getBusinessUnreadCount(req, res)
);

/**
 * PATCH /businesses/:businessId/conversations/:conversationId/block
 * Block a conversation (business owners only)
 */
router.patch(
  '/businesses/:businessId/conversations/:conversationId/block',
  requireAuth,
  businessInboxLimiter,
  (req, res) => conversationController.blockConversation(req, res)
);

/**
 * PATCH /businesses/:businessId/conversations/:conversationId/unblock
 * Unblock a conversation (business owners only)
 */
router.patch(
  '/businesses/:businessId/conversations/:conversationId/unblock',
  requireAuth,
  businessInboxLimiter,
  (req, res) => conversationController.unblockConversation(req, res)
);

// ─── Quick Reply Templates ────────────────────────────────────

/**
 * GET /businesses/:businessId/quick-replies
 * Get all quick reply templates for a business
 */
router.get(
  '/businesses/:businessId/quick-replies',
  requireAuth,
  quickReplyLimiter,
  (req, res) => quickReplyController.getTemplates(req, res)
);

/**
 * POST /businesses/:businessId/quick-replies
 * Create a new quick reply template
 */
router.post(
  '/businesses/:businessId/quick-replies',
  requireAuth,
  quickReplyLimiter,
  validate({ body: quickReplyTemplateSchema }),
  (req, res) => quickReplyController.createTemplate(req, res)
);

/**
 * PUT /businesses/:businessId/quick-replies/reorder
 * Reorder quick reply templates
 */
router.put(
  '/businesses/:businessId/quick-replies/reorder',
  requireAuth,
  quickReplyLimiter,
  validate({ body: reorderTemplatesSchema }),
  (req, res) => quickReplyController.reorderTemplates(req, res)
);

/**
 * GET /businesses/:businessId/quick-replies/:templateId
 * Get a single quick reply template
 */
router.get(
  '/businesses/:businessId/quick-replies/:templateId',
  requireAuth,
  quickReplyLimiter,
  (req, res) => quickReplyController.getTemplate(req, res)
);

/**
 * PUT /businesses/:businessId/quick-replies/:templateId
 * Update a quick reply template
 */
router.put(
  '/businesses/:businessId/quick-replies/:templateId',
  requireAuth,
  quickReplyLimiter,
  validate({ body: quickReplyTemplateSchema }),
  (req, res) => quickReplyController.updateTemplate(req, res)
);

/**
 * DELETE /businesses/:businessId/quick-replies/:templateId
 * Delete a quick reply template
 */
router.delete(
  '/businesses/:businessId/quick-replies/:templateId',
  requireAuth,
  quickReplyLimiter,
  (req, res) => quickReplyController.deleteTemplate(req, res)
);

// ─── Messaging Analytics ──────────────────────────────────────

/**
 * GET /businesses/:businessId/messaging-stats
 * Get messaging statistics for a business
 */
router.get(
  '/businesses/:businessId/messaging-stats',
  requireAuth,
  businessInboxLimiter,
  validate({ query: messagingStatsQuerySchema }),
  (req, res) => messagingAnalyticsController.getMessagingStats(req, res)
);

export const conversationsRouter = router;
