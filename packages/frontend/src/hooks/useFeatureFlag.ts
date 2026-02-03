import { isFeatureEnabled } from '@community-hub/shared';
import type { FeatureFlag, FeaturesConfig } from '@community-hub/shared';
import { useMemo } from 'react';

/**
 * React hook that returns whether a feature flag is enabled.
 *
 * @param features - The features config object from platform config
 * @param flag - The feature flag to check
 * @returns true if the feature is enabled
 *
 * @example
 * const dealsEnabled = useFeatureFlag(config.features, 'dealsHub');
 */
export function useFeatureFlag(features: FeaturesConfig, flag: FeatureFlag): boolean {
  return useMemo(() => isFeatureEnabled(features, flag), [features, flag]);
}
