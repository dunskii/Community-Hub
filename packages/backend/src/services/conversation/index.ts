/**
 * Conversation Module — Barrel exports
 * Phase 9: Messaging System
 *
 * Re-exports the public API of the conversation service module.
 */

// Singleton service (the main entry point for consumers)
export { conversationService } from './conversation-service.js';

// Types
export type {
  AuditContext,
  PaginationOptions,
  ConversationSummary,
  ConversationWithMessages,
  MessageWithAttachments,
  PaginatedConversations,
} from './conversation-types.js';

// Sub-services (for advanced / direct usage)
export { conversationQueryService } from './conversation-query-service.js';
export { conversationStatusService } from './conversation-status-service.js';

// Mappers (for reuse in tests or other services)
export {
  mapConversationSummary,
  mapConversationWithMessages,
  mapMessageWithAttachments,
} from './conversation-mappers.js';

// Cache helpers
export { invalidateConversationCache, getCacheKey, CACHE_PREFIX, CACHE_TTL } from './conversation-cache.js';
