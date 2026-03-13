/**
 * useUnreadCount Hook
 * Phase 9: Messaging System
 * Tracks unread message count for user
 */

import { useState, useEffect, useCallback } from 'react';
import { messagingService } from '../services/messaging-service';
import { useAuth } from './useAuth';

export interface UseUnreadCountReturn {
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useUnreadCount(): UseUnreadCountReturn {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const count = await messagingService.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get unread count');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchUnreadCount();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  return {
    unreadCount,
    isLoading,
    error,
    refresh: fetchUnreadCount,
  };
}
