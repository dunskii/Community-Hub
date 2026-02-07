/**
 * Authentication Types
 *
 * Type definitions for authentication and authorization system
 */

import { UserRole, UserStatus } from '../generated/prisma';

/**
 * JWT Access Token Payload
 */
export interface AccessTokenPayload {
  sub: string; // User ID
  role: UserRole;
  email: string;
  iat: number;
  exp: number;
  jti: string; // Unique token ID for revocation
}

/**
 * JWT Refresh Token Payload
 */
export interface RefreshTokenPayload {
  sub: string; // User ID
  type: 'refresh';
  iat: number;
  exp: number;
  jti: string; // Unique token ID for revocation
}

/**
 * User registration data
 */
export interface RegisterData {
  email: string;
  password: string;
  displayName: string;
  languagePreference?: string;
  suburb?: string;
  interests?: string[];
}

/**
 * User login data
 */
export interface LoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Login response
 */
export interface LoginResponse {
  accessToken: string;
  user: UserPublic;
}

/**
 * Public user data (no password hash)
 */
export interface UserPublic {
  id: string;
  email: string;
  displayName: string;
  profilePhoto: string | null;
  languagePreference: LanguageCode;
  suburb: string | null;
  bio: string | null;
  interests: string[];
  notificationPreferences: NotificationPreferences | null;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin: Date | null;
}

/**
 * Authenticated request user (attached by auth middleware)
 */
export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  jti: string; // Current token JTI for revocation
}

/**
 * Email verification token data
 */
export interface EmailVerificationToken {
  userId: string;
  email: string;
  token: string;
}

/**
 * Password reset token data
 */
export interface PasswordResetToken {
  userId: string;
  email: string;
  token: string;
}

/**
 * Device information for session tracking
 */
export interface DeviceInfo {
  userAgent: string;
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  os: string;
  browser: string;
}

/**
 * Session data
 */
export interface SessionData {
  id: string;
  deviceInfo: DeviceInfo;
  ipAddress: string;
  location: string | null;
  isCurrent: boolean;
  lastActiveAt: Date;
  expiresAt: Date;
  createdAt: Date;
}

/**
 * Supported language codes
 */
export type LanguageCode =
  | 'en'
  | 'ar'
  | 'zh'
  | 'es'
  | 'hi'
  | 'vi'
  | 'ko'
  | 'tl'
  | 'ur'
  | 'it';

/**
 * Notification preferences
 */
export interface NotificationPreferences {
  emailDigest: 'daily' | 'weekly' | 'never';
  pushEnabled: boolean;
  smsEnabled: boolean;
  dealAlerts: boolean;
  eventReminders: boolean;
  businessUpdates: boolean;
  emergencyAlerts: 'all' | 'critical_only' | 'none';
}
