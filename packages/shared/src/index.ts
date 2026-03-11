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

// Search (Phase 5)
export type {
  SearchParams,
  SearchResponse,
  BusinessSearchResult,
  AutocompleteSuggestion,
  AutocompleteResponse,
} from './types/search.js';

export { searchBusinessesSchema, autocompleteSuggestionsSchema } from './validators/search.js';

// Reviews (Phase 6)
export {
  reviewCreateSchema,
  reviewUpdateSchema,
  businessResponseSchema,
  reportReviewSchema,
  savedBusinessSchema,
  createListSchema,
  updateListSchema,
  moderationApproveSchema,
  moderationRejectSchema,
} from './schemas/review-schemas.js';

export type {
  ReviewCreateInput,
  ReviewUpdateInput,
  BusinessResponseInput,
  ReportReviewInput,
  SavedBusinessInput,
  CreateListInput,
  UpdateListInput,
  ModerationApproveInput,
  ModerationRejectInput,
} from './schemas/review-schemas.js';

// Claims (Phase 7)
export {
  verificationMethodSchema,
  claimInitiateSchema,
  verifyPhonePINSchema,
  claimAppealSchema,
  claimRejectSchema,
  claimApproveSchema,
} from './schemas/claim-schemas.js';

export type {
  VerificationMethod,
  ClaimInitiateInput,
  VerifyPhonePINInput,
  ClaimAppealInput,
  ClaimRejectInput,
  ClaimApproveInput,
} from './schemas/claim-schemas.js';

// Analytics (Phase 7)
export {
  granularitySchema,
  analyticsEventTypeSchema,
  referralSourceSchema,
  analyticsQuerySchema,
  analyticsExportSchema,
  trackEventSchema,
  inboxAnalyticsQuerySchema,
} from './schemas/analytics-schemas.js';

export type {
  Granularity,
  AnalyticsEventType,
  ReferralSource,
  AnalyticsQueryInput,
  AnalyticsExportInput,
  TrackEventInput,
  InboxAnalyticsQueryInput,
} from './schemas/analytics-schemas.js';

// Events (Phase 8)
export {
  LOCATION_TYPES,
  EVENT_STATUSES,
  RSVP_STATUSES,
  RECURRENCE_FREQUENCIES,
  venueSchema,
  recurrenceRuleSchema,
  eventCreateSchema,
  eventUpdateSchema,
  eventRSVPSchema,
  eventFilterSchema,
  attendeeFilterSchema,
} from './schemas/event-schemas.js';

export type {
  LocationType,
  EventStatus,
  RSVPStatus,
  RecurrenceFrequency,
  VenueInput,
  RecurrenceRuleInput,
  EventCreateInput,
  EventUpdateInput,
  EventRSVPInput,
  EventFilterInput,
  AttendeeFilterInput,
} from './schemas/event-schemas.js';
