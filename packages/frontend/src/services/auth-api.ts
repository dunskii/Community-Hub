/**
 * Authentication API Service
 *
 * API calls for user authentication.
 */

import { get, post, ApiResponse } from './api-client';

export interface User {
  id: string;
  email: string;
  displayName: string;
  profilePhoto: string | null;
  languagePreference: string;
  suburb: string | null;
  bio: string | null;
  interests: string[];
  notificationPreferences: Record<string, any> | null;
  role: string;
  status: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin: string | null;
}

export interface RegisterData {
  email: string;
  password: string;
  displayName: string;
  languagePreference?: string;
  suburb?: string;
  interests?: string[];
}

export interface LoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: User;
}

/**
 * Register a new user
 */
export async function register(
  data: RegisterData
): Promise<ApiResponse<{ user: User; message: string }>> {
  return post('/auth/register', data);
}

/**
 * Login user
 */
export async function login(
  data: LoginData
): Promise<ApiResponse<LoginResponse>> {
  return post('/auth/login', data);
}

/**
 * Logout user
 */
export async function logout(): Promise<ApiResponse<{ message: string }>> {
  return post('/auth/logout');
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
  return get('/auth/me');
}

/**
 * Refresh access token
 *
 * Token is automatically set in HttpOnly cookie by server.
 */
export async function refreshToken(): Promise<
  ApiResponse<{ message: string }>
> {
  return post('/auth/refresh');
}

/**
 * Request password reset
 */
export async function forgotPassword(
  email: string
): Promise<ApiResponse<{ message: string }>> {
  return post('/auth/forgot-password', { email });
}

/**
 * Complete password reset
 */
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<ApiResponse<{ message: string }>> {
  return post('/auth/reset-password', { token, newPassword });
}

/**
 * Verify email address
 */
export async function verifyEmail(
  userId: string,
  token: string
): Promise<ApiResponse<{ user: User; message: string }>> {
  return post('/auth/verify-email', { userId, token });
}

/**
 * Resend verification email
 */
export async function resendVerification(
  email: string
): Promise<ApiResponse<{ message: string }>> {
  return post('/auth/resend-verification', { email });
}
