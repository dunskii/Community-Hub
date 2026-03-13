/**
 * useConversation Hook
 * Phase 9: Messaging System
 * Manages a single conversation with messages
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  messagingService,
  ConversationDetail,
  Message,
} from '../services/messaging-service';
import { useAuth } from './useAuth';

export interface UseConversationReturn {
  conversation: ConversationDetail | null;
  messages: Message[];
  isLoading: boolean;
  isSending: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  loadMore: () => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  archive: () => Promise<void>;
  unarchive: () => Promise<void>;
  report: (reason: string, details?: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useConversation(conversationId: string | null): UseConversationReturn {
  const { isAuthenticated, user } = useAuth();
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const isInitialLoad = useRef(true);

  const fetchConversation = useCallback(async () => {
    if (!isAuthenticated || !conversationId) return;

    setIsLoading(true);
    setError(null);
    isInitialLoad.current = true;

    try {
      const result = await messagingService.getConversation(conversationId);
      setConversation(result);

      // Get initial messages
      const messagesResult = await messagingService.getMessages(conversationId, {
        page: 1,
        limit: 50,
      });

      // Convert string dates to Date objects
      const parsedMessages = messagesResult.messages.map((msg) => ({
        ...msg,
        createdAt: msg.createdAt,
        readAt: msg.readAt,
        deletedAt: msg.deletedAt,
      }));

      setMessages(parsedMessages);
      setHasMore(messagesResult.pagination.hasMore);
      setPage(1);

      // Mark as read
      await messagingService.markAsRead(conversationId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversation');
    } finally {
      setIsLoading(false);
      isInitialLoad.current = false;
    }
  }, [isAuthenticated, conversationId]);

  useEffect(() => {
    if (conversationId) {
      fetchConversation();
    } else {
      setConversation(null);
      setMessages([]);
    }
  }, [conversationId, fetchConversation]);

  const loadMore = async () => {
    if (!conversationId || isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);

    try {
      const nextPage = page + 1;
      const result = await messagingService.getMessages(conversationId, {
        page: nextPage,
        limit: 50,
      });

      const parsedMessages = result.messages.map((msg) => ({
        ...msg,
        createdAt: msg.createdAt,
        readAt: msg.readAt,
        deletedAt: msg.deletedAt,
      }));

      setMessages((prev) => [...parsedMessages, ...prev]);
      setHasMore(result.pagination.hasMore);
      setPage(nextPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more messages');
    } finally {
      setIsLoadingMore(false);
    }
  };

  const sendMessage = async (content: string) => {
    if (!conversationId || !user) return;

    setIsSending(true);
    setError(null);

    try {
      const newMessage = await messagingService.sendMessage(conversationId, { content });

      // Add message to list
      setMessages((prev) => [...prev, newMessage]);

      // Update conversation
      if (conversation) {
        setConversation({
          ...conversation,
          lastMessageAt: newMessage.createdAt,
          lastMessagePreview: content.substring(0, 100),
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      throw err;
    } finally {
      setIsSending(false);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      await messagingService.deleteMessage(messageId);

      // Update message in list
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, deletedAt: new Date().toISOString() }
            : msg
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete message');
      throw err;
    }
  };

  const archive = async () => {
    if (!conversationId) return;

    try {
      await messagingService.archiveConversation(conversationId);
      if (conversation) {
        setConversation({ ...conversation, status: 'ARCHIVED' });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive conversation');
      throw err;
    }
  };

  const unarchive = async () => {
    if (!conversationId) return;

    try {
      await messagingService.unarchiveConversation(conversationId);
      if (conversation) {
        setConversation({ ...conversation, status: 'ACTIVE' });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unarchive conversation');
      throw err;
    }
  };

  const report = async (reason: string, details?: string) => {
    if (!conversationId) return;

    try {
      await messagingService.reportConversation(conversationId, { reason, details });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to report conversation');
      throw err;
    }
  };

  return {
    conversation,
    messages,
    isLoading,
    isSending,
    isLoadingMore,
    hasMore,
    error,
    sendMessage,
    loadMore,
    deleteMessage,
    archive,
    unarchive,
    report,
    refresh: fetchConversation,
  };
}
