/**
 * useConversations Hook
 * Phase 9: Messaging System
 * Manages conversation list state
 */

import { useState, useEffect, useCallback } from 'react';
import { messagingService, ConversationSummary } from '../services/messaging-service';
import { useAuth } from './useAuth';

export interface UseConversationsReturn {
  conversations: ConversationSummary[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    totalPages: number;
    total: number;
    hasMore: boolean;
  } | null;
  filterStatus: 'active' | 'archived' | 'all';
  searchQuery: string;
  setFilterStatus: (status: 'active' | 'archived' | 'all') => void;
  setSearchQuery: (query: string) => void;
  setPage: (page: number) => void;
  refresh: () => Promise<void>;
}

export function useConversations(): UseConversationsReturn {
  const { isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    totalPages: number;
    total: number;
    hasMore: boolean;
  } | null>(null);
  const [filterStatus, setFilterStatus] = useState<'active' | 'archived' | 'all'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await messagingService.getConversations({
        status: filterStatus,
        search: searchQuery || undefined,
        page,
        limit: 20,
      });

      setConversations(result.conversations);
      setPagination(result.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, filterStatus, searchQuery, page]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Reset page when filter or search changes
  useEffect(() => {
    setPage(1);
  }, [filterStatus, searchQuery]);

  const handleSetFilterStatus = (status: 'active' | 'archived' | 'all') => {
    setFilterStatus(status);
  };

  const handleSetSearchQuery = (query: string) => {
    setSearchQuery(query);
  };

  return {
    conversations,
    isLoading,
    error,
    pagination,
    filterStatus,
    searchQuery,
    setFilterStatus: handleSetFilterStatus,
    setSearchQuery: handleSetSearchQuery,
    setPage,
    refresh: fetchConversations,
  };
}
