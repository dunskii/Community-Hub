/**
 * Conversation Cache
 * Phase 9: Messaging System — Cache key management and invalidation
 */

import { getRedis } from '../../cache/redis-client.js';
import { makeCacheKey } from '../../cache/cache-helpers.js';

// ─── Constants ───────────────────────────────────────────────

export const CACHE_PREFIX = 'conversations';
export const CACHE_TTL = 300; // 5 minutes

// ─── Key helpers ─────────────────────────────────────────────

export function getCacheKey(type: string, ...args: string[]): string {
  return makeCacheKey(CACHE_PREFIX, type, ...args);
}

// ─── Invalidation ────────────────────────────────────────────

export async function invalidateConversationCache(
  userId?: string,
  businessId?: string
): Promise<void> {
  const redis = getRedis();

  if (userId) {
    await redis.del(getCacheKey('unread', userId));
  }

  if (businessId) {
    await redis.del(getCacheKey('business_unread', businessId));
  }
}
