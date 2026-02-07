// @community-hub/shared - Shared types, schemas, and utilities

// Config
export { platformConfigSchema, platformConfigOverrideSchema } from './config/platform-schema.js';
export { deepMerge } from './config/deep-merge.js';
export { FEATURE_FLAGS, isFeatureEnabled } from './config/feature-flags.js';
export { formatZodErrors } from './config/format-zod-errors.js';

// Types
export type {
  PlatformConfig,
  PlatformInfo,
  LocationConfig,
  BrandingConfig,
  PartnersConfig,
  FeaturesConfig,
  MultilingualConfig,
  SeoConfig,
  ContactConfig,
  LegalConfig,
  LimitsConfig,
  AnalyticsConfig,
  FeatureFlag,
  SupportedLanguage,
} from './config/types.js';

// Maps
export type { Coordinates, DistanceFilter } from './types/maps.js';
export { calculateDistance, formatDistance } from './utils/geo.js';

// i18n
export type {
  LanguageCode,
  LanguageConfig,
  MultilingualConfig as I18nMultilingualConfig,
  LanguagesResponse,
} from './types/i18n.js';
