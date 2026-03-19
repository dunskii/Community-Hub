/**
 * Token Service
 *
 * Handles JWT token generation, verification, rotation, and revocation.
 * Uses Redis for token revocation blocklist.
 *
 * Spec §4.6: Session Security
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { getRedis } from '../cache/redis-client';
import { UserRole } from '../generated/prisma';
import {
  AccessTokenPayload,
  RefreshTokenPayload,
} from '../types/auth';
import { TIME_SECONDS } from '../constants/time';
import { logger } from '../utils/logger';

// Lazy-load Redis client to avoid startup errors when Redis is not configured
function getRedisClient() {
  try {
    const redis = getRedis();
    // Check if connection is actually open
    if (redis.status !== 'ready' && redis.status !== 'connect') {
      return null;
    }
    return redis;
  } catch (error) {
    logger.warn('Redis not available - token revocation and session management disabled');
    return null;
  }
}

// Token configuration from environment
const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET or SESSION_SECRET must be set in environment');
}

const ACCESS_TOKEN_EXPIRY = process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m';
const REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d';
const REFRESH_TOKEN_EXPIRY_REMEMBER_ME =
  process.env.JWT_REFRESH_TOKEN_EXPIRY_REMEMBER_ME || '30d';

/**
 * Convert time string to seconds
 * Examples: "15m" => 900, "7d" => 604800
 */
function parseExpiry(expiry: string | undefined): number {
  if (!expiry) return 900; // default 15 minutes
  const match = expiry?.match(/^(\d+)([smhd])$/);
  if (!match) return 900; // default 15 minutes

  const [, value, unit] = match;
  const num = parseInt(value ?? '15', 10);

  switch (unit) {
    case 's':
      return num;
    case 'm':
      return num * 60;
    case 'h':
      return num * 3600;
    case 'd':
      return num * 86400;
    default:
      return 900;
  }
}

/**
 * Generate a unique JWT ID (JTI)
 */
function generateJti(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Generate an access token
 *
 * @param userId - User ID
 * @param role - User role
 * @param email - User email
 * @returns JWT access token
 */
export function generateAccessToken(
  userId: string,
  role: UserRole,
  email: string
): string {
  const jti = generateJti();
  const payload: Omit<AccessTokenPayload, 'iat' | 'exp'> = {
    sub: userId,
    role,
    email,
    jti,
  };

  if (!JWT_SECRET) throw new Error('JWT_SECRET is not set');
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: parseExpiry(ACCESS_TOKEN_EXPIRY),
  });
}

/**
 * Generate a refresh token
 *
 * @param userId - User ID
 * @param rememberMe - Whether to use extended expiry (30d vs 7d)
 * @returns JWT refresh token
 */
export function generateRefreshToken(
  userId: string,
  rememberMe: boolean = false
): string {
  const jti = generateJti();
  const expiry = rememberMe
    ? REFRESH_TOKEN_EXPIRY_REMEMBER_ME
    : REFRESH_TOKEN_EXPIRY;

  const payload: Omit<RefreshTokenPayload, 'iat' | 'exp'> = {
    sub: userId,
    type: 'refresh',
    jti,
  };

  if (!JWT_SECRET) throw new Error('JWT_SECRET is not set');
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: parseExpiry(expiry),
  });
}

/**
 * Generate a refresh token and return both token and JTI
 *
 * @param userId - User ID
 * @param rememberMe - Whether to use extended expiry (30d vs 7d)
 * @returns Object with token and JTI
 */
export function generateRefreshTokenWithJti(
  userId: string,
  rememberMe: boolean = false
): { token: string; jti: string; expiresAt: Date } {
  const jti = generateJti();
  const expiry = rememberMe
    ? REFRESH_TOKEN_EXPIRY_REMEMBER_ME
    : REFRESH_TOKEN_EXPIRY;

  const payload: Omit<RefreshTokenPayload, 'iat' | 'exp'> = {
    sub: userId,
    type: 'refresh',
    jti,
  };

  if (!JWT_SECRET) throw new Error('JWT_SECRET is not set');
  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: parseExpiry(expiry),
  });

  // Calculate expiration date
  const expirySeconds = parseExpiry(expiry);
  const expiresAt = new Date(Date.now() + expirySeconds * 1000);

  return { token, jti, expiresAt };
}

/**
 * Verify an access token
 *
 * @param token - JWT access token
 * @returns Decoded payload or null if invalid
 */
export async function verifyAccessToken(
  token: string
): Promise<AccessTokenPayload | null> {
  try {
    if (!JWT_SECRET) throw new Error('JWT_SECRET is not set');
    const payload = jwt.verify(token, JWT_SECRET) as AccessTokenPayload;

    // Check if token is revoked
    const isRevoked = await isTokenRevoked(payload.jti);
    if (isRevoked) {
      return null;
    }

    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Verify a refresh token
 *
 * @param token - JWT refresh token
 * @returns Decoded payload or null if invalid
 */
export async function verifyRefreshToken(
  token: string
): Promise<RefreshTokenPayload | null> {
  try {
    if (!JWT_SECRET) throw new Error('JWT_SECRET is not set');
    const payload = jwt.verify(token, JWT_SECRET) as RefreshTokenPayload;

    // Check type
    if (payload.type !== 'refresh') {
      return null;
    }

    // Check if token is revoked
    const isRevoked = await isTokenRevoked(payload.jti);
    if (isRevoked) {
      return null;
    }

    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Rotate refresh token (generate new one and revoke old one)
 *
 * @param oldToken - Old refresh token
 * @param rememberMe - Whether to use extended expiry
 * @returns New refresh token or null if old token invalid
 */
export async function rotateRefreshToken(
  oldToken: string,
  rememberMe: boolean = false
): Promise<string | null> {
  const payload = await verifyRefreshToken(oldToken);
  if (!payload) {
    return null;
  }

  // Revoke old token
  await revokeToken(payload.jti, parseExpiry(REFRESH_TOKEN_EXPIRY_REMEMBER_ME));

  // Generate new token
  return generateRefreshToken(payload.sub, rememberMe);
}

/**
 * Revoke a token by adding its JTI to Redis blocklist
 *
 * @param jti - JWT ID to revoke
 * @param ttl - Time to live in seconds (should match token expiry)
 */
export async function revokeToken(jti: string, ttl: number): Promise<void> {
  const redis = getRedisClient();
  if (!redis) {
    logger.warn('Cannot revoke token - Redis not available');
    return;
  }
  const key = `revoked:jti:${jti}`;
  await redis.setex(key, ttl, '1');
}

/**
 * Check if a token is revoked
 *
 * @param jti - JWT ID to check
 * @returns True if token is revoked
 */
export async function isTokenRevoked(jti: string): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) {
    // If Redis is not available, assume token is not revoked
    return false;
  }
  const key = `revoked:jti:${jti}`;
  const result = await redis.get(key);
  return result === '1';
}

/**
 * Generate a secure random token for email verification/password reset
 *
 * @returns Random token (32 bytes hex = 64 characters)
 */
export function generateEmailToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Store email verification token in Redis
 *
 * @param userId - User ID
 * @param email - User email
 * @param token - Verification token
 * @returns void
 */
export async function storeEmailVerificationToken(
  userId: string,
  email: string,
  token: string
): Promise<void> {
  const redis = getRedisClient();
  if (!redis) {
    logger.warn('Cannot store email verification token - Redis not available');
    return;
  }
  const key = `verify:${userId}:${token}`;
  const data = JSON.stringify({ userId, email });
  // 24 hour expiry
  await redis.setex(key, TIME_SECONDS.TWENTY_FOUR_HOURS, data);
}

/**
 * Verify email verification token
 *
 * @param userId - User ID
 * @param token - Verification token
 * @returns Email if valid, null otherwise
 */
export async function verifyEmailVerificationToken(
  userId: string,
  token: string
): Promise<string | null> {
  const redis = getRedisClient();
  if (!redis) {
    logger.warn('Cannot verify email verification token - Redis not available');
    return null;
  }
  const key = `verify:${userId}:${token}`;
  const data = await redis.get(key);

  if (!data) {
    return null;
  }

  const parsed = JSON.parse(data);
  await redis.del(key); // Delete token after use
  return parsed.email;
}

/**
 * Store password reset token in Redis
 *
 * @param userId - User ID
 * @param email - User email
 * @param token - Reset token
 * @returns void
 */
export async function storePasswordResetToken(
  userId: string,
  email: string,
  token: string
): Promise<void> {
  const redis = getRedisClient();
  if (!redis) {
    logger.warn('Cannot store password reset token - Redis not available');
    return;
  }
  const key = `reset:${userId}:${token}`;
  const data = JSON.stringify({ userId, email });
  // 1 hour expiry
  await redis.setex(key, TIME_SECONDS.ONE_HOUR, data);
}

/**
 * Verify password reset token
 *
 * Note: This is a simplified implementation. For production, consider storing
 * a token->userId mapping separately to avoid scanning all keys.
 *
 * @param token - Reset token
 * @returns { userId, email } if valid, null otherwise
 */
export async function verifyPasswordResetToken(
  token: string
): Promise<{ userId: string; email: string } | null> {
  const redis = getRedisClient();
  if (!redis) {
    logger.warn('Cannot verify password reset token - Redis not available');
    return null;
  }
  // Search for token across all user IDs (we don't know userId from URL)
  // Use SCAN instead of KEYS for production safety
  const pattern = `reset:*:${token}`;
  const keys: string[] = [];

  let cursor = '0';
  do {
    const result = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
    cursor = result[0];
    keys.push(...result[1]);
  } while (cursor !== '0' && keys.length === 0);

  if (keys.length === 0) {
    return null;
  }

  const firstKey = keys[0];
  if (!firstKey) return null;

  const data = await redis.get(firstKey);
  if (!data) {
    return null;
  }

  const parsed = JSON.parse(data);
  await redis.del(firstKey); // Delete token after use
  return parsed;
}

/**
 * Store failed login attempt in Redis
 *
 * @param userId - User ID
 * @returns Current attempt count
 */
export async function incrementFailedLoginAttempts(
  userId: string
): Promise<number> {
  const redis = getRedisClient();
  if (!redis) {
    logger.warn('Cannot increment failed login attempts - Redis not available');
    return 0;
  }
  const key = `lockout:${userId}`;
  const current = await redis.get(key);
  const count = current ? parseInt(current, 10) + 1 : 1;

  // Set with 15 minute expiry
  await redis.setex(key, TIME_SECONDS.FIFTEEN_MINUTES, count.toString());
  return count;
}

/**
 * Get failed login attempt count
 *
 * @param userId - User ID
 * @returns Attempt count
 */
export async function getFailedLoginAttempts(userId: string): Promise<number> {
  const redis = getRedisClient();
  if (!redis) {
    return 0;
  }
  const key = `lockout:${userId}`;
  const result = await redis.get(key);
  return result ? parseInt(result, 10) : 0;
}

/**
 * Clear failed login attempts
 *
 * @param userId - User ID
 */
export async function clearFailedLoginAttempts(userId: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) {
    logger.warn('Cannot clear failed login attempts - Redis not available');
    return;
  }
  const key = `lockout:${userId}`;
  await redis.del(key);
}
