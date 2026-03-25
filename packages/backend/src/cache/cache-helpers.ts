/**
 * Shared Cache Helpers
 * Phase 0: Cross-cutting utility extraction
 *
 * Common cache key generation and Redis access patterns
 * used across multiple services.
 */

import { getRedis } from './redis-client.js';
import { logger } from '../utils/logger.js';

/**
 * Build a namespaced cache key from a prefix, type, and optional segments.
 *
 * @example makeCacheKey('events', 'list', 'page-1') => 'events:list:page-1'
 */
export function makeCacheKey(prefix: string, type: string, ...args: string[]): string {
  return `${prefix}:${type}:${args.join(':')}`;
}

/**
 * Get a Redis client that is confirmed ready, or null if unavailable.
 * Useful for services that should degrade gracefully when Redis is down.
 */
export function getReadyRedis() {
  try {
    const redis = getRedis();
    if (redis.status !== 'ready') return null;
    return redis;
  } catch {
    return null;
  }
}

/**
 * Invalidate a set of cache keys by prefix pattern.
 * Deletes the specified key (if any) plus all keys matching `prefix:pattern:*`.
 *
 * @param prefix   - The cache namespace, e.g. 'events'
 * @param specificKey - An optional specific key to delete first
 * @param patterns - Glob patterns to scan and delete, e.g. ['list:*']
 */
export async function invalidateCacheByPattern(
  prefix: string,
  specificKey?: string,
  patterns: string[] = []
): Promise<void> {
  try {
    const redis = getRedis();
    if (!redis) return;

    if (specificKey) {
      await redis.del(specificKey);
    }

    for (const pattern of patterns) {
      const keys = await redis.keys(`${prefix}:${pattern}`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    }
  } catch (error) {
    logger.error({ error, prefix }, 'Failed to invalidate cache');
  }
}
