/**
 * Authentication Context
 *
 * Provides global authentication state and methods.
 */

import React, { createContext, useState, useEffect, useCallback } from 'react';
import {
  User,
  RegisterData,
  LoginData,
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  getCurrentUser,
  refreshToken as apiRefreshToken,
} from '../services/auth-api';
import { HttpError } from '../services/api-client';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (data: LoginData) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Refresh access token
   *
   * Token is automatically set in HttpOnly cookie by server.
   */
  const refreshToken = useCallback(async () => {
    try {
      await apiRefreshToken();

      // Fetch updated user info
      const userResponse = await getCurrentUser();
      setUser(userResponse.data.user);
    } catch (err) {
      // Refresh failed - user needs to login again
      setUser(null);
    }
  }, []);

  /**
   * Check authentication status on mount
   *
   * Cookies are sent automatically with requests.
   */
  const checkAuthStatus = useCallback(async () => {
    try {
      // Try to get current user with existing cookie
      const response = await getCurrentUser();
      setUser(response.data.user);
    } catch (err) {
      // Token might be expired, try to refresh
      try {
        await refreshToken();
      } catch (refreshErr) {
        // Refresh failed - user needs to login
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [refreshToken]);

  /**
   * Initialize auth state on mount
   */
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  /**
   * Auto-refresh token before expiry
   * Access tokens expire in 15 minutes, refresh at 14 minutes
   */
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      refreshToken();
    }, 14 * 60 * 1000); // 14 minutes

    return () => clearInterval(interval);
  }, [user, refreshToken]);

  /**
   * Register a new user
   */
  const register = useCallback(async (data: RegisterData) => {
    setIsLoading(true);
    setError(null);

    try {
      await apiRegister(data);
      // Registration successful, but user needs to verify email
      // Don't set user or token yet
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      if (err instanceof HttpError) {
        setError(err.message);
      } else {
        setError('Registration failed. Please try again.');
      }
      throw err;
    }
  }, []);

  /**
   * Login user
   *
   * Tokens are automatically set in HttpOnly cookies by server.
   */
  const login = useCallback(async (data: LoginData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiLogin(data);
      const { user: userData } = response.data;

      // Set user
      setUser(userData);
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      if (err instanceof HttpError) {
        setError(err.message);
      } else {
        setError('Login failed. Please try again.');
      }
      throw err;
    }
  }, []);

  /**
   * Logout user
   *
   * Cookies are automatically cleared by server.
   */
  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await apiLogout();
    } catch (err) {
      // Continue with logout even if API call fails
      console.error('Logout error:', err);
    } finally {
      // Clear local state
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    logout,
    register,
    refreshToken,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
