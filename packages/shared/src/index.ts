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

// Business
export type {
  Address,
  SocialLinks,
  DayHours,
  OperatingHours,
  GalleryPhoto,
  Business,
  BusinessCreateInput,
  BusinessUpdateInput,
} from './types/business.js';

export {
  BusinessStatus,
  PriceRange,
  CERTIFICATIONS,
  PAYMENT_METHODS,
  ACCESSIBILITY_FEATURES,
  GALLERY_CATEGORIES,
} from './constants/business.constants.js';

export type {
  Certification,
  PaymentMethod,
  AccessibilityFeature,
  GalleryCategory,
} from './constants/business.constants.js';

export {
  addressSchema,
  operatingHoursSchema,
  socialLinksSchema,
  businessCreateSchema,
  businessUpdateSchema,
  businessStatusUpdateSchema,
} from './validators/business.validator.js';

export { validateAustralianPhone, formatAustralianPhone } from './utils/phone-validator.js';
export {
  validateAustralianPostcode,
  formatAustralianPostcode,
} from './utils/postcode-validator.js';
export { isOpenNow, getNextOpeningTime } from './utils/open-now.js';
