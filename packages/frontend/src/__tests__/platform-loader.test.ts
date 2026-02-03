import { createValidPlatformConfig } from '@community-hub/shared/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  clearPlatformConfigCache,
  getPlatformConfig,
  loadPlatformConfig,
} from '../config/platform-loader.js';

const validConfig = createValidPlatformConfig();

describe('loadPlatformConfig', () => {
  beforeEach(() => {
    clearPlatformConfigCache();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('should fetch and return valid config', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(validConfig),
      }),
    );

    const config = await loadPlatformConfig('/api/config');
    expect(config.platform.id).toBe('test');
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('should return cached config on subsequent calls', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(validConfig),
      }),
    );

    await loadPlatformConfig('/api/config');
    await loadPlatformConfig('/api/config');
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('should throw on HTTP error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      }),
    );

    await expect(loadPlatformConfig('/api/config')).rejects.toThrow(
      'Failed to load platform config: 500',
    );
  });

  it('should throw on invalid config data', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ invalid: true }),
      }),
    );

    await expect(loadPlatformConfig('/api/config')).rejects.toThrow(
      'Invalid platform config from server',
    );
  });

  it('should abort fetch when timeout expires', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(
        (_url: string, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            init.signal?.addEventListener('abort', () => {
              reject(new DOMException('The operation was aborted.', 'AbortError'));
            });
          }),
      ),
    );

    await expect(loadPlatformConfig('/api/config', 50)).rejects.toThrow('aborted');
  });
});

describe('getPlatformConfig', () => {
  beforeEach(() => {
    clearPlatformConfigCache();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should throw when config is not loaded', () => {
    expect(() => getPlatformConfig()).toThrow('Platform config not loaded');
  });

  it('should return config after loading', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(validConfig),
      }),
    );

    await loadPlatformConfig('/api/config');
    const config = getPlatformConfig();
    expect(config.platform.id).toBe('test');
  });
});
