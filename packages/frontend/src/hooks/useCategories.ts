/**
 * useCategories Hook
 * Fetches and manages category list
 */

import { useState, useEffect, useCallback } from 'react';
import { businessApi, type Category, type CategoryListParams } from '../services/business-api';

interface UseCategoriesState {
  categories: Category[];
  loading: boolean;
  error: string | null;
}

interface UseCategoriesReturn extends UseCategoriesState {
  refetch: () => Promise<void>;
  /** Get category by ID from cached list */
  getCategoryById: (id: string) => Category | undefined;
  /** Get top-level categories (no parent) */
  getTopLevelCategories: () => Category[];
  /** Get children of a category */
  getChildCategories: (parentId: string) => Category[];
}

/**
 * Hook to fetch and manage category list
 *
 * @example
 * ```tsx
 * // Fetch all active categories
 * const { categories, loading } = useCategories();
 *
 * // Fetch specific type
 * const { categories } = useCategories({ type: 'BUSINESS' });
 *
 * // Fetch top-level only
 * const { categories } = useCategories({ parent: 'null' });
 *
 * // Get top-level categories
 * const { getTopLevelCategories } = useCategories();
 * const topLevel = getTopLevelCategories();
 * ```
 */
export function useCategories(params: CategoryListParams = {}): UseCategoriesReturn {
  const [state, setState] = useState<UseCategoriesState>({
    categories: [],
    loading: true,
    error: null,
  });

  const fetchCategories = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const categories = await businessApi.listCategories(params);
      setState({
        categories,
        loading: false,
        error: null,
      });
    } catch (err) {
      setState({
        categories: [],
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch categories',
      });
    }
  }, [params.type, params.parent, params.active, params.withBusinesses]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const getCategoryById = useCallback(
    (id: string): Category | undefined => {
      return state.categories.find(cat => cat.id === id);
    },
    [state.categories]
  );

  const getTopLevelCategories = useCallback((): Category[] => {
    return state.categories.filter(cat => cat.parentId === null);
  }, [state.categories]);

  const getChildCategories = useCallback(
    (parentId: string): Category[] => {
      return state.categories.filter(cat => cat.parentId === parentId);
    },
    [state.categories]
  );

  return {
    ...state,
    refetch: fetchCategories,
    getCategoryById,
    getTopLevelCategories,
    getChildCategories,
  };
}
