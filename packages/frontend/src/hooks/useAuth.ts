/**
 * useAuth Hook
 *
 * Hook for accessing authentication context.
 */

import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from '../contexts/AuthContext';

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  // Context now always has a value (default or from provider)
  return context;
}
