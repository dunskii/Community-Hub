import { describe, it, expect } from 'vitest';

import {
  platformConfigSchema,
  platformConfigOverrideSchema,
  deepMerge,
  isFeatureEnabled,
  FEATURE_FLAGS,
  formatZodErrors,
} from '../index.js';

describe('shared package exports', () => {
  it('should export platformConfigSchema', () => {
    expect(platformConfigSchema).toBeDefined();
    expect(typeof platformConfigSchema.safeParse).toBe('function');
  });

  it('should export platformConfigOverrideSchema', () => {
    expect(platformConfigOverrideSchema).toBeDefined();
  });

  it('should export deepMerge', () => {
    expect(typeof deepMerge).toBe('function');
  });

  it('should export isFeatureEnabled', () => {
    expect(typeof isFeatureEnabled).toBe('function');
  });

  it('should export FEATURE_FLAGS', () => {
    expect(Array.isArray(FEATURE_FLAGS)).toBe(true);
  });

  it('should export formatZodErrors', () => {
    expect(typeof formatZodErrors).toBe('function');
  });
});
