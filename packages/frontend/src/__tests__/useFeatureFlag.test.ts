import { allEnabledFeatures } from '@community-hub/shared/testing';
import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { useFeatureFlag } from '../hooks/useFeatureFlag.js';

describe('useFeatureFlag', () => {
  it('should return true for enabled features', () => {
    const { result } = renderHook(() => useFeatureFlag(allEnabledFeatures, 'dealsHub'));
    expect(result.current).toBe(true);
  });

  it('should return false for disabled features', () => {
    const features = { ...allEnabledFeatures, dealsHub: false };
    const { result } = renderHook(() => useFeatureFlag(features, 'dealsHub'));
    expect(result.current).toBe(false);
  });

  it('should update when features config changes', () => {
    let features = { ...allEnabledFeatures };
    const { result, rerender } = renderHook(() => useFeatureFlag(features, 'messaging'));

    expect(result.current).toBe(true);

    features = { ...allEnabledFeatures, messaging: false };
    rerender();

    expect(result.current).toBe(false);
  });

  it('should return stable value on re-render with same inputs', () => {
    const features = { ...allEnabledFeatures };
    const { result, rerender } = renderHook(() => useFeatureFlag(features, 'dealsHub'));

    const firstResult = result.current;
    rerender();
    expect(result.current).toBe(firstResult);
  });
});
