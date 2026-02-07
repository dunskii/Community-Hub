import { logger } from '../utils/logger.js';

import { getRedis } from './redis-client.js';

const ENV_PREFIX = `${process.env['NODE_ENV'] ?? 'dev'}:`;

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export const cacheService = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await getRedis().get(ENV_PREFIX + key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch (err) {
      logger.error({ cache: true }, `get failed for "${key}": ${errorMessage(err)}`);
      return null;
    }
  },

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    try {
      const json = JSON.stringify(value);
      if (ttlSeconds !== undefined && ttlSeconds > 0) {
        await getRedis().setex(ENV_PREFIX + key, ttlSeconds, json);
      } else {
        await getRedis().set(ENV_PREFIX + key, json);
      }
    } catch (err) {
      logger.error({ cache: true }, `set failed for "${key}": ${errorMessage(err)}`);
    }
  },

  async del(key: string): Promise<void> {
    try {
      await getRedis().del(ENV_PREFIX + key);
    } catch (err) {
      logger.error({ cache: true }, `del failed for "${key}": ${errorMessage(err)}`);
    }
  },

  async invalidatePattern(pattern: string): Promise<number> {
    try {
      const redis = getRedis();
      const keys: string[] = [];
      await new Promise<void>((resolve, reject) => {
        const stream = redis.scanStream({ match: ENV_PREFIX + pattern, count: 100 });
        stream.on('data', (batch: string[]) => keys.push(...batch));
        stream.on('end', resolve);
        stream.on('error', reject);
      });
      if (keys.length === 0) return 0;
      return await redis.del(...keys);
    } catch (err) {
      logger.error({ cache: true }, `invalidatePattern failed: ${errorMessage(err)}`);
      return 0;
    }
  },
};

// Legacy export for backwards compatibility
export const cache = cacheService;
