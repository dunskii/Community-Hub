/**
 * Time Constants
 *
 * Centralized time-related constants for consistency across the application.
 * All values are in milliseconds unless otherwise specified.
 */

// Base time units in milliseconds
export const TIME_MS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
} as const;

// Auth-specific time constants
export const AUTH_TIME = {
  /** Access token expiry: 15 minutes */
  ACCESS_TOKEN_EXPIRY: 15 * TIME_MS.MINUTE,
  /** Refresh token expiry: 7 days */
  REFRESH_TOKEN_EXPIRY: 7 * TIME_MS.DAY,
  /** Refresh token expiry with "Remember Me": 30 days */
  REFRESH_TOKEN_EXPIRY_REMEMBER: 30 * TIME_MS.DAY,
  /** Email verification token expiry: 24 hours */
  EMAIL_VERIFICATION_EXPIRY: 24 * TIME_MS.HOUR,
  /** Password reset token expiry: 1 hour */
  PASSWORD_RESET_EXPIRY: 1 * TIME_MS.HOUR,
  /** Account lockout duration after failed login attempts: 15 minutes */
  ACCOUNT_LOCKOUT_DURATION: 15 * TIME_MS.MINUTE,
  /** Account deletion grace period: 30 days */
  ACCOUNT_DELETION_GRACE_PERIOD: 30 * TIME_MS.DAY,
} as const;

// Time constants in seconds (for Redis TTL)
export const TIME_SECONDS = {
  /** 15 minutes in seconds */
  FIFTEEN_MINUTES: 15 * 60,
  /** 1 hour in seconds */
  ONE_HOUR: 60 * 60,
  /** 24 hours in seconds */
  TWENTY_FOUR_HOURS: 24 * 60 * 60,
  /** 7 days in seconds */
  SEVEN_DAYS: 7 * 24 * 60 * 60,
  /** 30 days in seconds */
  THIRTY_DAYS: 30 * 24 * 60 * 60,
} as const;

// Image processing constants
export const IMAGE_CONSTANTS = {
  /** Minimum image width in pixels */
  MIN_WIDTH: 100,
  /** Minimum image height in pixels */
  MIN_HEIGHT: 100,
  /** Maximum image width in pixels */
  MAX_WIDTH: 800,
  /** Maximum image height in pixels */
  MAX_HEIGHT: 800,
  /** WebP quality (0-100) */
  WEBP_QUALITY: 85,
} as const;
