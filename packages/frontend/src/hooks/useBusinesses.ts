/**
 * useBusinesses Hook
 * Fetches and manages business list with pagination and filtering
 */

import { useState, useEffect, useCallback } from 'react';
import { businessApi, type BusinessListParams, type BusinessListResponse } from '../services/business-api';
import type { Business } from '@community-hub/shared';

interface UseBusinessesState {
  businesses: Business[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  loading: boolean;
  error: string | null;
}

interface UseBusinessesReturn extends UseBusinessesState {
  refetch: () => Promise<void>;
  setPage: (page: number) => void;
  setFilters: (filters: Partial<BusinessListParams>) => void;
}

/**
 * Hook to fetch and manage business list
 *
 * @example
 * ```tsx
 * const { businesses, loading, error, pagination, setPage, setFilters } = useBusinesses({
 *   category: 'restaurant',
 *   openNow: true,
 *   page: 1,
 *   limit: 20
 * });
 * ```
 */
export function useBusinesses(initialParams: BusinessListParams = {}): UseBusinessesReturn {
  const [params, setParams] = useState<BusinessListParams>(initialParams);
  const [state, setState] = useState<UseBusinessesState>({
    businesses: [],
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    },
    loading: true,
    error: null,
  });

  const fetchBusinesses = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response: BusinessListResponse = await businessApi.listBusinesses(params);
      setState({
        businesses: response.businesses,
        pagination: response.pagination,
        loading: false,
        error: null,
      });
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch businesses',
      }));
    }
  }, [params.category, params.status, params.openNow, params.search, params.page, params.limit, params.sort]);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  const setPage = useCallback((page: number) => {
    setParams(prev => ({ ...prev, page }));
  }, []);

  const setFilters = useCallback((filters: Partial<BusinessListParams>) => {
    setParams(prev => ({ ...prev, ...filters, page: 1 })); // Reset to page 1 on filter change
  }, []);

  return {
    ...state,
    refetch: fetchBusinesses,
    setPage,
    setFilters,
  };
}
