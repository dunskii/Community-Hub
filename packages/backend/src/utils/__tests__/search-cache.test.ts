/**
 * Search Cache Utilities Tests
 * Phase 5: Search & Discovery
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import {
  addRecentSearch,
  getRecentSearches,
  clearRecentSearches,
  trackPopularSearch,
  getPopularSearches,
} from '../search-cache.js';

// Mock Redis client
const mockRedis = {
  zadd: vi.fn().mockResolvedValue(1),
  zremrangebyrank: vi.fn().mockResolvedValue(0),
  expire: vi.fn().mockResolvedValue(1),
  zrevrange: vi.fn().mockResolvedValue([]),
  del: vi.fn().mockResolvedValue(1),
  zincrby: vi.fn().mockResolvedValue('1'),
};

vi.mock('../../cache/redis-client.js', () => ({
  getRedis: vi.fn(() => mockRedis),
}));

describe('addRecentSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('adds search to recent searches', async () => {
    await addRecentSearch('user-123', 'pizza');

    expect(mockRedis.zadd).toHaveBeenCalledWith(
      'recent-searches:user-123',
      expect.any(Number),
      'pizza'
    );
    expect(mockRedis.zremrangebyrank).toHaveBeenCalled();
    expect(mockRedis.expire).toHaveBeenCalled();
  });

  test('skips empty queries', async () => {
    await addRecentSearch('user-123', '');

    expect(mockRedis.zadd).not.toHaveBeenCalled();
  });

  test('skips whitespace-only queries', async () => {
    await addRecentSearch('user-123', '   ');

    expect(mockRedis.zadd).not.toHaveBeenCalled();
  });

  test('handles Redis errors gracefully', async () => {
    mockRedis.zadd.mockRejectedValueOnce(new Error('Redis error'));

    await expect(addRecentSearch('user-123', 'pizza')).resolves.toBeUndefined();
  });
});

describe('getRecentSearches', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns recent searches', async () => {
    mockRedis.zrevrange.mockResolvedValueOnce(['coffee', 'pizza', 'restaurant']);

    const result = await getRecentSearches('user-123');

    expect(result).toEqual(['coffee', 'pizza', 'restaurant']);
    expect(mockRedis.zrevrange).toHaveBeenCalledWith('recent-searches:user-123', 0, 9);
  });

  test('returns empty array on Redis error', async () => {
    mockRedis.zrevrange.mockRejectedValueOnce(new Error('Redis error'));

    const result = await getRecentSearches('user-123');

    expect(result).toEqual([]);
  });
});

describe('clearRecentSearches', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('clears recent searches', async () => {
    await clearRecentSearches('user-123');

    expect(mockRedis.del).toHaveBeenCalledWith('recent-searches:user-123');
  });

  test('handles Redis errors gracefully', async () => {
    mockRedis.del.mockRejectedValueOnce(new Error('Redis error'));

    await expect(clearRecentSearches('user-123')).resolves.toBeUndefined();
  });
});

describe('trackPopularSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('tracks popular search', async () => {
    await trackPopularSearch('pizza');

    expect(mockRedis.zincrby).toHaveBeenCalledWith('popular-searches', 1, 'pizza');
    expect(mockRedis.expire).toHaveBeenCalledWith('popular-searches', 7 * 24 * 60 * 60);
  });

  test('normalizes query to lowercase', async () => {
    await trackPopularSearch('  PIZZA  ');

    expect(mockRedis.zincrby).toHaveBeenCalledWith('popular-searches', 1, 'pizza');
  });

  test('skips empty queries', async () => {
    await trackPopularSearch('');

    expect(mockRedis.zincrby).not.toHaveBeenCalled();
  });

  test('handles Redis errors gracefully', async () => {
    mockRedis.zincrby.mockRejectedValueOnce(new Error('Redis error'));

    await expect(trackPopularSearch('pizza')).resolves.toBeUndefined();
  });
});

describe('getPopularSearches', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns popular searches', async () => {
    mockRedis.zrevrange.mockResolvedValueOnce(['pizza', 'coffee', 'restaurant']);

    const result = await getPopularSearches(10);

    expect(result).toEqual(['pizza', 'coffee', 'restaurant']);
    expect(mockRedis.zrevrange).toHaveBeenCalledWith('popular-searches', 0, 9);
  });

  test('respects custom limit', async () => {
    mockRedis.zrevrange.mockResolvedValueOnce(['pizza', 'coffee']);

    await getPopularSearches(2);

    expect(mockRedis.zrevrange).toHaveBeenCalledWith('popular-searches', 0, 1);
  });

  test('returns empty array on Redis error', async () => {
    mockRedis.zrevrange.mockRejectedValueOnce(new Error('Redis error'));

    const result = await getPopularSearches(10);

    expect(result).toEqual([]);
  });
});
