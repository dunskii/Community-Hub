/**
 * useFollowBusiness Hook
 * Manages follow state for a single business
 */

import { useState, useEffect, useCallback } from 'react';
import { followService } from '../services/follow-service';
import { useAuth } from '../contexts/AuthContext';

export interface UseFollowBusinessReturn {
  isFollowing: boolean;
  followerCount: number;
  isLoading: boolean;
  error: string | null;
  toggleFollow: () => Promise<void>;
}

export function useFollowBusiness(businessId: string): UseFollowBusinessReturn {
  const { isAuthenticated } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFollowData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [followStatus, count] = await Promise.all([
        isAuthenticated ? followService.getFollowStatus(businessId) : Promise.resolve(false),
        followService.getFollowerCount(businessId),
      ]);

      setIsFollowing(followStatus);
      setFollowerCount(count);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch follow data');
    } finally {
      setIsLoading(false);
    }
  }, [businessId, isAuthenticated]);

  useEffect(() => {
    fetchFollowData();
  }, [fetchFollowData]);

  const toggleFollow = async () => {
    if (!isAuthenticated) {
      setError('Please log in to follow businesses');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (isFollowing) {
        await followService.unfollowBusiness(businessId);
        setIsFollowing(false);
        setFollowerCount((prev) => Math.max(0, prev - 1));
      } else {
        await followService.followBusiness(businessId);
        setIsFollowing(true);
        setFollowerCount((prev) => prev + 1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle follow status');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isFollowing,
    followerCount,
    isLoading,
    error,
    toggleFollow,
  };
}
