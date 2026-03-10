/**
 * useSavedBusiness Hook
 * Manages saved business state for a single business
 */

import { useState, useEffect, useCallback } from 'react';
import { savedService } from '../services/saved-service';
import { useAuth } from './useAuth';

export interface UseSavedBusinessReturn {
  isSaved: boolean;
  isLoading: boolean;
  error: string | null;
  toggleSaved: () => Promise<void>;
}

export function useSavedBusiness(businessId: string): UseSavedBusinessReturn {
  const { isAuthenticated } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkSavedStatus = useCallback(async () => {
    if (!isAuthenticated) {
      setIsSaved(false);
      return;
    }

    setIsLoading(true);
    try {
      const saved = await savedService.isSaved(businessId);
      setIsSaved(saved);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check saved status');
    } finally {
      setIsLoading(false);
    }
  }, [businessId, isAuthenticated]);

  useEffect(() => {
    checkSavedStatus();
  }, [checkSavedStatus]);

  const toggleSaved = async () => {
    if (!isAuthenticated) {
      setError('Please log in to save businesses');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (isSaved) {
        await savedService.unsaveBusiness(businessId);
        setIsSaved(false);
      } else {
        await savedService.saveBusiness(businessId);
        setIsSaved(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle saved status');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isSaved,
    isLoading,
    error,
    toggleSaved,
  };
}
