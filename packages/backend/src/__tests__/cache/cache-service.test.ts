import { EventEmitter } from 'node:events';

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock methods that our fake Redis instance exposes
const mockGet = vi.fn();
const mockSet = vi.fn();
const mockSetex = vi.fn();
const mockDel = vi.fn();
const mockScanStream = vi.fn();

const fakeRedis = {
  get: mockGet,
  set: mockSet,
  setex: mockSetex,
  del: mockDel,
  scanStream: mockScanStream,
};

// Mock the redis-client module so getRedis() returns our fake instance
vi.mock('../../cache/redis-client.js', () => ({
  getRedis: () => fakeRedis,
}));

vi.mock('../../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Set required env before importing
vi.stubEnv('REDIS_URL', 'redis://localhost:6379');

const { cache } = await import('../../cache/cache-service.js');

function createMockScanStream(batches: string[][]) {
  const emitter = new EventEmitter();
  process.nextTick(() => {
    for (const batch of batches) {
      emitter.emit('data', batch);
    }
    emitter.emit('end');
  });
  return emitter;
}

describe('cache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('get', () => {
    it('should return parsed JSON value', async () => {
      mockGet.mockResolvedValue(JSON.stringify({ name: 'test' }));
      const result = await cache.get<{ name: string }>('key');
      expect(result).toEqual({ name: 'test' });
    });

    it('should return null for missing key', async () => {
      mockGet.mockResolvedValue(null);
      const result = await cache.get('missing');
      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      mockGet.mockRejectedValue(new Error('connection lost'));
      const result = await cache.get('key');
      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should store JSON value without TTL', async () => {
      mockSet.mockResolvedValue('OK');
      await cache.set('key', { data: 1 });
      expect(mockSet).toHaveBeenCalledWith(
        expect.stringContaining('key'),
        JSON.stringify({ data: 1 }),
      );
    });

    it('should use setex with TTL', async () => {
      mockSetex.mockResolvedValue('OK');
      await cache.set('key', { data: 1 }, 3600);
      expect(mockSetex).toHaveBeenCalledWith(expect.stringContaining('key'), 3600, expect.any(String));
    });

    it('should use set (not setex) when TTL is 0', async () => {
      mockSet.mockResolvedValue('OK');
      await cache.set('key', 'val', 0);
      expect(mockSet).toHaveBeenCalled();
      expect(mockSetex).not.toHaveBeenCalled();
    });

    it('should log error on set failure', async () => {
      mockSet.mockRejectedValue(new Error('write error'));
      await cache.set('key', 'val');

      const { logger } = await import('../../utils/logger.js');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('del', () => {
    it('should delete key', async () => {
      mockDel.mockResolvedValue(1);
      await cache.del('key');
      expect(mockDel).toHaveBeenCalledWith(expect.stringContaining('key'));
    });

    it('should log error on del failure', async () => {
      mockDel.mockRejectedValue(new Error('del error'));
      await cache.del('key');

      const { logger } = await import('../../utils/logger.js');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('invalidatePattern', () => {
    it('should delete matching keys via scanStream', async () => {
      mockScanStream.mockReturnValue(createMockScanStream([['dev:user:1', 'dev:user:2']]));
      mockDel.mockResolvedValue(2);
      const count = await cache.invalidatePattern('user:*');
      expect(count).toBe(2);
      expect(mockScanStream).toHaveBeenCalledWith(
        expect.objectContaining({ match: expect.stringContaining('user:*') }),
      );
    });

    it('should return 0 when no keys match', async () => {
      mockScanStream.mockReturnValue(createMockScanStream([[]]));
      const count = await cache.invalidatePattern('nonexistent:*');
      expect(count).toBe(0);
    });

    it('should log error on invalidatePattern failure', async () => {
      const errorStream = new EventEmitter();
      mockScanStream.mockReturnValue(errorStream);
      process.nextTick(() => errorStream.emit('error', new Error('scan error')));

      const count = await cache.invalidatePattern('fail:*');
      expect(count).toBe(0);

      const { logger } = await import('../../utils/logger.js');
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
