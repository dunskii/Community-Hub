import { describe, it, expect } from 'vitest';

import {
  loadPlatformConfig,
  getPlatformConfig,
  clearPlatformConfigCache,
} from '../config/platform-loader.js';
import { useFeatureFlag } from '../hooks/useFeatureFlag.js';

describe('frontend package exports', () => {
  it('should export loadPlatformConfig', () => {
    expect(typeof loadPlatformConfig).toBe('function');
  });

  it('should export getPlatformConfig', () => {
    expect(typeof getPlatformConfig).toBe('function');
  });

  it('should export clearPlatformConfigCache', () => {
    expect(typeof clearPlatformConfigCache).toBe('function');
  });

  it('should export useFeatureFlag', () => {
    expect(typeof useFeatureFlag).toBe('function');
  });
});
