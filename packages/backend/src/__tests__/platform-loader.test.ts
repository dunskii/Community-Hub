import { randomUUID } from 'node:crypto';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import { platformConfigSchema } from '@community-hub/shared';
import { createValidPlatformConfig } from '@community-hub/shared/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { loadPlatformConfig, clearPlatformConfigCache } from '../config/platform-loader.js';

function createTempDir(): string {
  const dir = resolve(tmpdir(), `ch-test-${randomUUID()}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function writeJson(dir: string, filename: string, data: unknown): void {
  writeFileSync(resolve(dir, filename), JSON.stringify(data, null, 2));
}

describe('loadPlatformConfig', () => {
  let tempDir: string;

  beforeEach(() => {
    clearPlatformConfigCache();
    tempDir = createTempDir();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('should load a valid platform.json', () => {
    writeJson(tempDir, 'platform.json', createValidPlatformConfig());
    const config = loadPlatformConfig(tempDir);
    expect(config.platform.id).toBe('test');
    expect(config.location.suburbName).toBe('Test');
  });

  it('should throw when platform.json is missing', () => {
    expect(() => loadPlatformConfig(tempDir)).toThrow('Platform config not found');
  });

  it('should throw for invalid platform.json', () => {
    writeJson(tempDir, 'platform.json', { invalid: true });
    expect(() => loadPlatformConfig(tempDir)).toThrow('Invalid platform config');
  });

  it('should deep merge environment override', () => {
    vi.stubEnv('NODE_ENV', 'development');

    writeJson(tempDir, 'platform.json', createValidPlatformConfig());
    writeJson(tempDir, 'platform.development.json', {
      platform: { id: 'test-dev' },
      limits: { maxBusinessPhotos: 10 },
    });

    const config = loadPlatformConfig(tempDir);
    expect(config.platform.id).toBe('test-dev');
    expect(config.platform.version).toBe('1.0.0'); // kept from base
    expect(config.limits.maxBusinessPhotos).toBe(10); // overridden
    expect(config.limits.maxPhotoSizeMb).toBe(5); // kept from base
  });

  it('should work without an environment override file', () => {
    vi.stubEnv('NODE_ENV', 'production');

    writeJson(tempDir, 'platform.json', createValidPlatformConfig());
    const config = loadPlatformConfig(tempDir);
    expect(config.platform.id).toBe('test');
  });

  it('should throw for invalid override file', () => {
    vi.stubEnv('NODE_ENV', 'development');

    writeJson(tempDir, 'platform.json', createValidPlatformConfig());
    writeJson(tempDir, 'platform.development.json', {
      location: { coordinates: { latitude: 999 } },
    });

    expect(() => loadPlatformConfig(tempDir)).toThrow('Invalid platform config override');
  });

  it('should cache the config on subsequent calls', () => {
    writeJson(tempDir, 'platform.json', createValidPlatformConfig());

    const config1 = loadPlatformConfig(tempDir);
    const config2 = loadPlatformConfig(tempDir);
    expect(config1).toBe(config2); // same reference
  });

  it('should throw when merged config fails post-merge validation', () => {
    vi.stubEnv('NODE_ENV', 'development');

    writeJson(tempDir, 'platform.json', createValidPlatformConfig());
    writeJson(tempDir, 'platform.development.json', {
      platform: { id: 'test-dev' },
    });

    // First safeParse call validates the base config (should succeed),
    // second call validates the merged result (force failure to test the error path)
    let callCount = 0;
    const originalSafeParse = platformConfigSchema.safeParse.bind(platformConfigSchema);
    vi.spyOn(platformConfigSchema, 'safeParse').mockImplementation((data: unknown) => {
      callCount++;
      if (callCount === 2) {
        return { success: false, error: { issues: [{ path: ['test'], message: 'mock error' }] } };
      }
      return originalSafeParse(data);
    });

    expect(() => loadPlatformConfig(tempDir)).toThrow(
      'Invalid merged platform config after applying development override',
    );
  });

  it('should reload config from disk after cache is cleared', () => {
    writeJson(tempDir, 'platform.json', createValidPlatformConfig());
    const config1 = loadPlatformConfig(tempDir);

    // Modify the file on disk
    const modified = createValidPlatformConfig();
    modified.platform.id = 'reloaded';
    writeJson(tempDir, 'platform.json', modified);

    clearPlatformConfigCache();
    const config2 = loadPlatformConfig(tempDir);
    expect(config2.platform.id).toBe('reloaded');
    expect(config1).not.toBe(config2);
  });
});
