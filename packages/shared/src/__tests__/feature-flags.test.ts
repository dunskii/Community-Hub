import { describe, it, expect } from 'vitest';

import { isFeatureEnabled, FEATURE_FLAGS } from '../config/feature-flags.js';

import { allEnabledFeatures } from './fixtures.js';

describe('isFeatureEnabled', () => {
  it('should return true for enabled features', () => {
    expect(isFeatureEnabled(allEnabledFeatures, 'dealsHub')).toBe(true);
  });

  it('should return false for disabled features', () => {
    const features = { ...allEnabledFeatures, dealsHub: false };
    expect(isFeatureEnabled(features, 'dealsHub')).toBe(false);
  });
});

describe('FEATURE_FLAGS', () => {
  it('should contain all 16 feature flags', () => {
    expect(FEATURE_FLAGS).toHaveLength(16);
  });

  it('should include key features', () => {
    expect(FEATURE_FLAGS).toContain('businessDirectory');
    expect(FEATURE_FLAGS).toContain('emergencyAlerts');
    expect(FEATURE_FLAGS).toContain('multilingual');
  });
});
