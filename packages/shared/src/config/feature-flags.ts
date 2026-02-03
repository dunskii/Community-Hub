import type { FeaturesConfig, FeatureFlag } from './types.js';

/**
 * All known feature flags.
 */
export const FEATURE_FLAGS = [
  'businessDirectory',
  'eventsCalendar',
  'communityNoticeboard',
  'communityGroups',
  'localHistory',
  'messaging',
  'dealsHub',
  'b2bNetworking',
  'emergencyAlerts',
  'socialFeedAggregation',
  'surveySystem',
  'reviewsAndRatings',
  'multilingual',
  'pwaInstallation',
  'smsAlerts',
  'whatsappAlerts',
] as const satisfies readonly FeatureFlag[];

/**
 * Check if a feature is enabled in the given config.
 */
export function isFeatureEnabled(features: FeaturesConfig, flag: FeatureFlag): boolean {
  return features[flag] === true;
}
