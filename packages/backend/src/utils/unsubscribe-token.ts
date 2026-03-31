/**
 * Unsubscribe Token Utility
 *
 * Generates and verifies HMAC-based tokens for one-click email unsubscribe.
 * Tokens are stateless (no database storage required) with 30-day expiry.
 */

import crypto from 'crypto';
import { logger } from './logger.js';

export type UnsubscribeType = 'deals' | 'events' | 'all';

// Token validity period: 30 days
const TOKEN_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;

interface UnsubscribePayload {
  userId: string;
  type: UnsubscribeType;
}

/**
 * Get the HMAC secret. Throws if not configured in production.
 */
function getHmacSecret(): string {
  const secret = process.env['JWT_SECRET'];
  if (!secret) {
    if (process.env['NODE_ENV'] === 'production') {
      throw new Error('JWT_SECRET must be set in production');
    }
    logger.warn('JWT_SECRET not set - using development fallback for unsubscribe tokens');
    return 'dev-only-unsubscribe-secret';
  }
  return secret;
}

/**
 * Generate an HMAC-based unsubscribe token with expiry.
 * Format: base64url(userId:type:timestamp:hmac)
 */
export function generateUnsubscribeToken(userId: string, type: UnsubscribeType): string {
  const secret = getHmacSecret();
  const timestamp = Date.now().toString(36);
  const data = `${userId}:${type}:${timestamp}`;
  const hmac = crypto.createHmac('sha256', secret).update(data).digest('hex');
  const payload = `${data}:${hmac}`;
  return Buffer.from(payload).toString('base64url');
}

/**
 * Verify and decode an unsubscribe token.
 * Returns the payload if valid and not expired, null otherwise.
 */
export function verifyUnsubscribeToken(token: string): UnsubscribePayload | null {
  try {
    const secret = getHmacSecret();
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    const parts = decoded.split(':');

    if (parts.length !== 4) return null;

    const [userId, type, timestamp, providedHmac] = parts;
    if (!userId || !type || !timestamp || !providedHmac) return null;

    // Validate type
    if (!['deals', 'events', 'all'].includes(type)) return null;

    // Check expiry
    const tokenTime = parseInt(timestamp, 36);
    if (isNaN(tokenTime) || Date.now() - tokenTime > TOKEN_EXPIRY_MS) {
      return null;
    }

    // Verify HMAC
    const data = `${userId}:${type}:${timestamp}`;
    const expectedHmac = crypto.createHmac('sha256', secret).update(data).digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(providedHmac), Buffer.from(expectedHmac))) {
      return null;
    }

    return { userId, type: type as UnsubscribeType };
  } catch {
    return null;
  }
}
