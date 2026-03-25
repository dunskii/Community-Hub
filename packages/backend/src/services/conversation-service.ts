/**
 * Conversation Service — Backward-compatibility shim
 * Phase 9: Messaging System
 *
 * Re-exports from the decomposed conversation/ module so that existing
 * consumers (controllers, tests, routes) continue to work without changes.
 */

export { conversationService } from './conversation/index.js';

export type {
  AuditContext,
  PaginationOptions,
  ConversationSummary,
  ConversationWithMessages,
  MessageWithAttachments,
  PaginatedConversations,
} from './conversation/index.js';
