/**
 * Messaging Service
 * Phase 9: Messaging System
 * API client for conversation and message operations
 */

import { apiClient } from './api-client';

// ─── Types ────────────────────────────────────────────────────

export interface MessageAttachment {
  id: string;
  url: string;
  altText: string | null;
  sizeBytes: number;
  mimeType: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderType: 'USER' | 'BUSINESS';
  senderId: string;
  content: string;
  readAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  attachments: MessageAttachment[];
  sender: {
    id: string;
    displayName: string;
    profilePhoto: string | null;
  } | null;
}

export interface ConversationSummary {
  id: string;
  businessId: string;
  business: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
  };
  userId: string;
  user: {
    id: string;
    displayName: string;
    profilePhoto: string | null;
  };
  subject: string;
  subjectCategory: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'BLOCKED';
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationDetail extends ConversationSummary {
  messages: Message[];
}

export interface PaginatedConversations {
  conversations: ConversationSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface PaginatedMessages {
  messages: Message[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface CreateConversationInput {
  businessId: string;
  subject: string;
  subjectCategory: string;
  message: string;
  preferredContact?: string;
}

export interface SendMessageInput {
  content: string;
}

export interface QuickReplyTemplate {
  id: string;
  businessId: string;
  name: string;
  content: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface MessagingStats {
  overview: {
    totalConversations: number;
    activeConversations: number;
    archivedConversations: number;
    blockedConversations: number;
    totalMessages: number;
    messagesReceived: number;
    messagesSent: number;
    averageResponseTimeMinutes: number | null;
    responseRate: number;
    unreadCount: number;
  };
  daily: Array<{
    date: string;
    conversationsStarted: number;
    messagesReceived: number;
    messagesSent: number;
    averageResponseTimeMinutes: number | null;
  }>;
  period: {
    startDate: string;
    endDate: string;
  };
}

// ─── User Conversations ───────────────────────────────────────

/**
 * Get user's conversations
 */
export async function getConversations(params: {
  status?: 'active' | 'archived' | 'all';
  search?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedConversations> {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set('status', params.status);
  if (params.search) searchParams.set('search', params.search);
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));

  const response = await apiClient.get<{ data: PaginatedConversations }>(
    `/conversations?${searchParams.toString()}`
  );
  return response.data;
}

/**
 * Get a single conversation with initial messages
 */
export async function getConversation(conversationId: string): Promise<ConversationDetail> {
  const response = await apiClient.get<{ data: ConversationDetail }>(
    `/conversations/${conversationId}`
  );
  return response.data;
}

/**
 * Create a new conversation
 */
export async function createConversation(
  input: CreateConversationInput
): Promise<ConversationDetail> {
  const response = await apiClient.post<{ data: ConversationDetail }>(
    '/conversations',
    input
  );
  return response.data;
}

/**
 * Get messages for a conversation
 */
export async function getMessages(
  conversationId: string,
  params: { page?: number; limit?: number }
): Promise<PaginatedMessages> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));

  const response = await apiClient.get<{ data: PaginatedMessages }>(
    `/conversations/${conversationId}/messages?${searchParams.toString()}`
  );
  return response.data;
}

/**
 * Send a message in a conversation
 */
export async function sendMessage(
  conversationId: string,
  input: SendMessageInput
): Promise<Message> {
  const response = await apiClient.post<{ data: Message }>(
    `/conversations/${conversationId}/messages`,
    input
  );
  return response.data;
}

/**
 * Mark conversation as read
 */
export async function markAsRead(conversationId: string): Promise<void> {
  await apiClient.patch(`/conversations/${conversationId}/read`);
}

/**
 * Delete a message
 */
export async function deleteMessage(messageId: string): Promise<void> {
  await apiClient.delete(`/messages/${messageId}`);
}

/**
 * Archive a conversation
 */
export async function archiveConversation(conversationId: string): Promise<void> {
  await apiClient.patch(`/conversations/${conversationId}/archive`);
}

/**
 * Unarchive a conversation
 */
export async function unarchiveConversation(conversationId: string): Promise<void> {
  await apiClient.patch(`/conversations/${conversationId}/unarchive`);
}

/**
 * Report a conversation
 */
export async function reportConversation(
  conversationId: string,
  input: { reason: string; details?: string }
): Promise<void> {
  await apiClient.post(`/conversations/${conversationId}/report`, input);
}

/**
 * Get unread count
 */
export async function getUnreadCount(): Promise<number> {
  const response = await apiClient.get<{ data: { unreadCount: number } }>(
    '/conversations/unread-count'
  );
  return response.data.unreadCount;
}

// ─── Business Inbox ───────────────────────────────────────────

/**
 * Get business inbox
 */
export async function getBusinessInbox(
  businessId: string,
  params: {
    status?: 'active' | 'archived' | 'blocked' | 'all';
    unreadOnly?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }
): Promise<PaginatedConversations> {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set('status', params.status);
  if (params.unreadOnly) searchParams.set('unreadOnly', 'true');
  if (params.search) searchParams.set('search', params.search);
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));

  const response = await apiClient.get<{ data: PaginatedConversations }>(
    `/businesses/${businessId}/inbox?${searchParams.toString()}`
  );
  return response.data;
}

/**
 * Get business unread count
 */
export async function getBusinessUnreadCount(businessId: string): Promise<number> {
  const response = await apiClient.get<{ data: { unreadCount: number } }>(
    `/businesses/${businessId}/inbox/unread-count`
  );
  return response.data.unreadCount;
}

/**
 * Block a conversation
 */
export async function blockConversation(
  businessId: string,
  conversationId: string
): Promise<void> {
  await apiClient.patch(
    `/businesses/${businessId}/conversations/${conversationId}/block`
  );
}

/**
 * Unblock a conversation
 */
export async function unblockConversation(
  businessId: string,
  conversationId: string
): Promise<void> {
  await apiClient.patch(
    `/businesses/${businessId}/conversations/${conversationId}/unblock`
  );
}

// ─── Quick Replies ────────────────────────────────────────────

/**
 * Get quick reply templates
 */
export async function getQuickReplies(businessId: string): Promise<QuickReplyTemplate[]> {
  const response = await apiClient.get<{ data: QuickReplyTemplate[] }>(
    `/businesses/${businessId}/quick-replies`
  );
  return response.data;
}

/**
 * Create quick reply template
 */
export async function createQuickReply(
  businessId: string,
  input: { name: string; content: string }
): Promise<QuickReplyTemplate> {
  const response = await apiClient.post<{ data: QuickReplyTemplate }>(
    `/businesses/${businessId}/quick-replies`,
    input
  );
  return response.data;
}

/**
 * Update quick reply template
 */
export async function updateQuickReply(
  businessId: string,
  templateId: string,
  input: { name: string; content: string }
): Promise<QuickReplyTemplate> {
  const response = await apiClient.put<{ data: QuickReplyTemplate }>(
    `/businesses/${businessId}/quick-replies/${templateId}`,
    input
  );
  return response.data;
}

/**
 * Delete quick reply template
 */
export async function deleteQuickReply(
  businessId: string,
  templateId: string
): Promise<void> {
  await apiClient.delete(`/businesses/${businessId}/quick-replies/${templateId}`);
}

/**
 * Reorder quick reply templates
 */
export async function reorderQuickReplies(
  businessId: string,
  templateIds: string[]
): Promise<QuickReplyTemplate[]> {
  const response = await apiClient.put<{ data: QuickReplyTemplate[] }>(
    `/businesses/${businessId}/quick-replies/reorder`,
    { templateIds }
  );
  return response.data;
}

// ─── Messaging Stats ──────────────────────────────────────────

/**
 * Get messaging statistics
 */
export async function getMessagingStats(
  businessId: string,
  params?: { startDate?: string; endDate?: string }
): Promise<MessagingStats> {
  const searchParams = new URLSearchParams();
  if (params?.startDate) searchParams.set('startDate', params.startDate);
  if (params?.endDate) searchParams.set('endDate', params.endDate);

  const response = await apiClient.get<{ data: MessagingStats }>(
    `/businesses/${businessId}/messaging-stats?${searchParams.toString()}`
  );
  return response.data;
}

export const messagingService = {
  // User
  getConversations,
  getConversation,
  createConversation,
  getMessages,
  sendMessage,
  markAsRead,
  deleteMessage,
  archiveConversation,
  unarchiveConversation,
  reportConversation,
  getUnreadCount,
  // Business
  getBusinessInbox,
  getBusinessUnreadCount,
  blockConversation,
  unblockConversation,
  // Quick Replies
  getQuickReplies,
  createQuickReply,
  updateQuickReply,
  deleteQuickReply,
  reorderQuickReplies,
  // Stats
  getMessagingStats,
};
