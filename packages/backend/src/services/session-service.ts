/**
 * Session Service
 *
 * Manages user sessions for security audit and session revocation.
 * Spec §4.6: Session Security, Appendix A.17: UserSession
 */

import { prisma } from '../db/index';
import { UserSession } from '../generated/prisma';
import { revokeToken } from './token-service';
import { logger } from '../utils/logger';
import crypto from 'crypto';

/**
 * Parse device info from User-Agent string
 *
 * Extracts device type, OS, and browser from user agent string
 *
 * @param userAgent - User-Agent header string
 * @returns Parsed device information
 *
 * @example
 * const info = parseDeviceInfo('Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X)...');
 * // { user_agent: '...', device_type: 'mobile', os: 'iOS', browser: 'Safari' }
 */
function parseDeviceInfo(userAgent: string): {
  user_agent: string;
  device_type: string;
  os: string;
  browser: string;
} {
  const ua = userAgent.toLowerCase();

  // Detect device type
  let device_type = 'desktop';
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    device_type = 'tablet';
  } else if (
    /mobile|iphone|ipod|android|blackberry|opera mini|opera mobi|skyfire|maemo|windows phone|palm|iemobile|symbian|symbianos|fennec/i.test(
      ua
    )
  ) {
    device_type = 'mobile';
  }

  // Detect OS (check more specific patterns first)
  let os = 'Unknown';
  if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';

  // Detect browser
  let browser = 'Unknown';
  if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('chrome') && !ua.includes('edg')) browser = 'Chrome';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('edg')) browser = 'Edge';
  else if (ua.includes('opera') || ua.includes('opr')) browser = 'Opera';

  return {
    user_agent: userAgent,
    device_type,
    os,
    browser,
  };
}

/**
 * Hash refresh token JTI for storage
 *
 * Uses SHA-256 hash for secure token matching without storing the actual JTI
 *
 * @param jti - JWT ID to hash
 * @returns SHA-256 hash of the JTI
 */
function hashJti(jti: string): string {
  return crypto.createHash('sha256').update(jti).digest('hex');
}

/**
 * Create a new session record
 *
 * @param userId - User ID
 * @param refreshTokenJti - JTI from refresh token
 * @param deviceInfo - User-Agent string
 * @param ipAddress - Client IP address
 * @param expiresAt - Session expiration timestamp
 * @returns Created session
 */
export async function createSession(
  userId: string,
  refreshTokenJti: string,
  deviceInfo: string,
  ipAddress: string,
  expiresAt: Date
): Promise<UserSession> {
  const tokenHash = hashJti(refreshTokenJti);
  const parsedDeviceInfo = parseDeviceInfo(deviceInfo);

  const session = await prisma.userSession.create({
    data: {
      userId,
      tokenHash,
      deviceInfo: parsedDeviceInfo,
      ipAddress,
      isCurrent: true, // Mark as current session
      lastActiveAt: new Date(),
      expiresAt,
    },
  });

  logger.info(
    {
      userId,
      sessionId: session.id,
      deviceType: parsedDeviceInfo.device_type,
      ipAddress,
    },
    'Session created'
  );

  return session;
}

/**
 * List all active sessions for a user
 *
 * @param userId - User ID
 * @returns Array of active sessions
 */
export async function listUserSessions(userId: string): Promise<UserSession[]> {
  const sessions = await prisma.userSession.findMany({
    where: {
      userId,
      expiresAt: {
        gt: new Date(), // Only active sessions
      },
    },
    orderBy: {
      lastActiveAt: 'desc',
    },
  });

  return sessions;
}

/**
 * Revoke a specific session
 *
 * @param sessionId - Session ID
 * @param userId - User ID (for ownership verification)
 * @returns True if session was revoked
 */
export async function revokeSession(
  sessionId: string,
  userId: string
): Promise<boolean> {
  // Find session
  const session = await prisma.userSession.findUnique({
    where: { id: sessionId },
  });

  if (!session || session.userId !== userId) {
    return false;
  }

  // Calculate TTL for Redis revocation (time until expiry)
  const now = new Date();
  const ttl = Math.max(
    0,
    Math.floor((session.expiresAt.getTime() - now.getTime()) / 1000)
  );

  // Revoke the refresh token in Redis
  // We need to derive the JTI from the hash - but we can't reverse SHA-256
  // Instead, we'll add the tokenHash to Redis blocklist with a special prefix
  if (ttl > 0) {
    await revokeToken(session.tokenHash, ttl);
  }

  // Delete session from database
  await prisma.userSession.delete({
    where: { id: sessionId },
  });

  logger.info(
    { userId, sessionId, ipAddress: session.ipAddress },
    'Session revoked'
  );

  return true;
}

/**
 * Revoke all sessions for a user
 *
 * @param userId - User ID
 * @param excludeSessionId - Optional session ID to exclude (for password change)
 * @returns Number of sessions revoked
 */
export async function revokeAllUserSessions(
  userId: string,
  excludeSessionId?: string
): Promise<number> {
  // Find all sessions
  const sessions = await prisma.userSession.findMany({
    where: {
      userId,
      ...(excludeSessionId ? { id: { not: excludeSessionId } } : {}),
    },
  });

  const now = new Date();

  // Revoke tokens in Redis
  for (const session of sessions) {
    const ttl = Math.max(
      0,
      Math.floor((session.expiresAt.getTime() - now.getTime()) / 1000)
    );
    if (ttl > 0) {
      await revokeToken(session.tokenHash, ttl);
    }
  }

  // Delete sessions from database
  const result = await prisma.userSession.deleteMany({
    where: {
      userId,
      ...(excludeSessionId ? { id: { not: excludeSessionId } } : {}),
    },
  });

  logger.info(
    { userId, count: result.count, excludeSessionId },
    'All user sessions revoked'
  );

  return result.count;
}

/**
 * Update session activity timestamp
 *
 * @param refreshTokenJti - JTI from refresh token
 */
export async function updateSessionActivity(
  refreshTokenJti: string
): Promise<void> {
  const tokenHash = hashJti(refreshTokenJti);

  try {
    await prisma.userSession.update({
      where: { tokenHash },
      data: {
        lastActiveAt: new Date(),
        isCurrent: true,
      },
    });
  } catch (error) {
    // Session might not exist or already expired - non-critical error
    logger.debug({ tokenHash }, 'Failed to update session activity');
  }
}

/**
 * Find session by refresh token JTI
 *
 * @param refreshTokenJti - JTI from refresh token
 * @returns Session or null
 */
export async function findSessionByJti(
  refreshTokenJti: string
): Promise<UserSession | null> {
  const tokenHash = hashJti(refreshTokenJti);

  try {
    const session = await prisma.userSession.findUnique({
      where: { tokenHash },
    });
    return session;
  } catch (error) {
    return null;
  }
}

/**
 * Cleanup expired sessions
 * Should be called by a scheduled job
 *
 * @returns Number of sessions deleted
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const result = await prisma.userSession.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });

  logger.info({ count: result.count }, 'Expired sessions cleaned up');

  return result.count;
}

/**
 * Export hash function for testing
 */
export { hashJti };
