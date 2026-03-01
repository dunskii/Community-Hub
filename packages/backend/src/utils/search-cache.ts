/**
 * Search Cache Utilities
 * Phase 5: Search & Discovery
 *
 * Redis-based utilities for recent and popular searches
 */

import { getRedis } from '../cache/redis-client.js';
import { logger } from './logger.js';

const RECENT_SEARCHES_PREFIX = 'recent-searches:';
const POPULAR_SEARCHES_KEY = 'popular-searches';
const RECENT_SEARCHES_TTL = 30 * 24 * 60 * 60; // 30 days in seconds
const MAX_RECENT_SEARCHES = 10;

/**
 * Add a search query to user's recent searches
 * @param userId User ID
 * @param query Search query
 */
export async function addRecentSearch(userId: string, query: string): Promise<void> {
  if (!query || !query.trim()) {
    return;
  }

  const redis = getRedis();
  const key = `${RECENT_SEARCHES_PREFIX}${userId}`;

  try {
    // Add to sorted set with current timestamp as score
    await redis.zadd(key, Date.now(), query);

    // Keep only last 10 searches
    await redis.zremrangebyrank(key, 0, -(MAX_RECENT_SEARCHES + 1));

    // Set expiry
    await redis.expire(key, RECENT_SEARCHES_TTL);

    logger.debug(`Added recent search for user ${userId}: ${query}`);
  } catch (error) {
    // Don't fail the request if Redis is down
    logger.error({ error }, 'Failed to add recent search');
  }
}

/**
 * Get user's recent searches (most recent first)
 * @param userId User ID
 * @returns Array of recent search queries
 */
export async function getRecentSearches(userId: string): Promise<string[]> {
  const redis = getRedis();
  const key = `${RECENT_SEARCHES_PREFIX}${userId}`;

  try {
    // Get all searches, most recent first
    const searches = await redis.zrevrange(key, 0, MAX_RECENT_SEARCHES - 1);
    return searches;
  } catch (error) {
    logger.error({ error }, 'Failed to get recent searches');
    return [];
  }
}

/**
 * Clear user's recent searches
 * @param userId User ID
 */
export async function clearRecentSearches(userId: string): Promise<void> {
  const redis = getRedis();
  const key = `${RECENT_SEARCHES_PREFIX}${userId}`;

  try {
    await redis.del(key);
    logger.debug(`Cleared recent searches for user ${userId}`);
  } catch (error) {
    logger.error({ error }, 'Failed to clear recent searches');
  }
}

/**
 * Track a search query for popular searches calculation
 * @param query Search query
 */
export async function trackPopularSearch(query: string): Promise<void> {
  if (!query || !query.trim()) {
    return;
  }

  const redis = getRedis();

  try {
    // Increment score for this query
    await redis.zincrby(POPULAR_SEARCHES_KEY, 1, query.trim().toLowerCase());

    // Set expiry for 7 days (rolling window)
    await redis.expire(POPULAR_SEARCHES_KEY, 7 * 24 * 60 * 60);

    logger.debug(`Tracked popular search: ${query}`);
  } catch (error) {
    // Don't fail the request if Redis is down
    logger.error({ error }, 'Failed to track popular search');
  }
}

/**
 * Get popular searches (top N by frequency)
 * @param limit Number of popular searches to return
 * @returns Array of popular search queries
 */
export async function getPopularSearches(limit: number = 10): Promise<string[]> {
  const redis = getRedis();

  try {
    // Get top searches by score (descending)
    const searches = await redis.zrevrange(POPULAR_SEARCHES_KEY, 0, limit - 1);
    return searches;
  } catch (error) {
    logger.error({ error }, 'Failed to get popular searches');
    return [];
  }
}
