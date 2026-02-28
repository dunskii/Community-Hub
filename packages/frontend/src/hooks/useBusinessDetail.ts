/**
 * useBusinessDetail Hook
 * Fetches and manages single business data
 */

import { useState, useEffect, useCallback } from 'react';
import { businessApi } from '../services/business-api';
import type { Business } from '@community-hub/shared';

interface UseBusinessDetailState {
  business: Business | null;
  loading: boolean;
  error: string | null;
}

interface UseBusinessDetailReturn extends UseBusinessDetailState {
  refetch: () => Promise<void>;
}

interface UseBusinessDetailOptions {
  /** Fetch by ID */
  id?: string;
  /** Fetch by slug (for SEO URLs) */
  slug?: string;
  /** Skip initial fetch (useful for conditional fetching) */
  skip?: boolean;
}

/**
 * Hook to fetch and manage single business data
 *
 * @example
 * ```tsx
 * // Fetch by ID
 * const { business, loading, error } = useBusinessDetail({ id: '123' });
 *
 * // Fetch by slug (SEO-friendly)
 * const { business, loading, error } = useBusinessDetail({ slug: 'joes-cafe' });
 *
 * // Conditional fetch
 * const { business, loading, refetch } = useBusinessDetail({
 *   id: businessId,
 *   skip: !businessId
 * });
 * ```
 */
export function useBusinessDetail(options: UseBusinessDetailOptions): UseBusinessDetailReturn {
  const { id, slug, skip = false } = options;

  const [state, setState] = useState<UseBusinessDetailState>({
    business: null,
    loading: !skip,
    error: null,
  });

  const fetchBusiness = useCallback(async () => {
    if (skip || (!id && !slug)) {
      setState({ business: null, loading: false, error: null });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const business = slug
        ? await businessApi.getBusinessBySlug(slug)
        : await businessApi.getBusinessById(id!);

      setState({
        business,
        loading: false,
        error: null,
      });
    } catch (err) {
      setState({
        business: null,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch business',
      });
    }
  }, [id, slug, skip]);

  useEffect(() => {
    fetchBusiness();
  }, [fetchBusiness]);

  return {
    ...state,
    refetch: fetchBusiness,
  };
}
