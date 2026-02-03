import { describe, it, expect } from 'vitest';

import { validateEnv } from '../config/env-validate.js';
import { loadPlatformConfig, clearPlatformConfigCache } from '../config/platform-loader.js';
import { validateAllConfig } from '../config/validate.js';
import { featureGate } from '../middleware/feature-gate.js';

describe('backend package exports', () => {
  it('should export validateEnv', () => {
    expect(typeof validateEnv).toBe('function');
  });

  it('should export loadPlatformConfig', () => {
    expect(typeof loadPlatformConfig).toBe('function');
  });

  it('should export clearPlatformConfigCache', () => {
    expect(typeof clearPlatformConfigCache).toBe('function');
  });

  it('should export validateAllConfig', () => {
    expect(typeof validateAllConfig).toBe('function');
  });

  it('should export featureGate', () => {
    expect(typeof featureGate).toBe('function');
  });
});
