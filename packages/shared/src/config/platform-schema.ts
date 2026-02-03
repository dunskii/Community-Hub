import { z } from 'zod';

const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color');

const coordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

const boundingBoxSchema = z
  .object({
    north: z.number().min(-90).max(90),
    south: z.number().min(-90).max(90),
    east: z.number().min(-180).max(180),
    west: z.number().min(-180).max(180),
  })
  .refine((box) => box.north >= box.south, {
    message: 'Bounding box north must be >= south',
    path: ['north'],
  });

// BCP 47 subset: supports "ll" and "ll-RR" forms only (e.g. "en", "zh-CN").
// Script subtags like "zh-Hant" are not supported. Extend if needed.
const supportedLanguageSchema = z.object({
  code: z
    .string()
    .regex(
      /^[a-z]{2}(-[A-Z]{2})?$/,
      'Must be a BCP 47 language code in ll or ll-RR form (e.g. "en" or "zh-CN")',
    ),
  name: z.string().min(1),
  nativeName: z.string().min(1),
  rtl: z.boolean(),
  enabled: z.boolean(),
});

const partnerSchema = z.object({
  name: z.string().min(1),
  website: z.string().url(),
  logo: z.string().min(1),
  contactEmail: z.string().email(),
});

export const platformConfigSchema = z.object({
  platform: z.object({
    id: z.string().min(1),
    version: z.string().min(1),
  }),

  location: z
    .object({
      suburbName: z.string().min(1),
      suburbNameShort: z.string().min(1),
      region: z.string().min(1),
      city: z.string().min(1),
      state: z.string().min(1),
      stateFullName: z.string().min(1),
      country: z.string().min(1),
      countryCode: z.string().regex(/^[A-Z]{2}$/, 'Must be a 2-letter uppercase ISO 3166-1 code'),
      postcode: z.string().min(1),
      postcodeRange: z.array(z.string().min(1)),
      coordinates: coordinatesSchema,
      boundingBox: boundingBoxSchema,
      timezone: z
        .string()
        .min(1)
        .refine(
          (tz) => {
            try {
              Intl.DateTimeFormat(undefined, { timeZone: tz });
              return true;
            } catch {
              return false;
            }
          },
          { message: 'Must be a valid IANA timezone' },
        ),
      locale: z
        .string()
        .regex(/^[a-z]{2}(-[A-Z]{2})?$/, 'Must be a valid locale (e.g. "en" or "en-AU")'),
      currency: z.string().length(3),
      currencySymbol: z.string().min(1),
      phoneCountryCode: z.string().regex(/^\+\d+$/),
      defaultSearchRadiusKm: z.number().positive(),
      maxSearchRadiusKm: z.number().positive(),
    })
    .refine((loc) => loc.defaultSearchRadiusKm <= loc.maxSearchRadiusKm, {
      message: 'defaultSearchRadiusKm must be <= maxSearchRadiusKm',
      path: ['defaultSearchRadiusKm'],
    }),

  branding: z.object({
    platformName: z.string().min(1),
    platformNameShort: z.string().min(1),
    tagline: z.string().min(1),
    description: z.string().min(1),
    legalEntityName: z.string().min(1),
    copyrightHolder: z.string().min(1),
    colors: z.object({
      primary: hexColor,
      secondary: hexColor,
      accent: hexColor,
      success: hexColor,
      error: hexColor,
      warning: hexColor,
      info: hexColor,
    }),
    logos: z.object({
      primary: z.string().min(1),
      light: z.string().min(1),
      dark: z.string().min(1),
      favicon: z.string().min(1),
      appleTouchIcon: z.string().min(1),
    }),
    socialHashtags: z.object({
      primary: z.string().min(1),
      secondary: z.array(z.string().min(1)),
    }),
  }),

  partners: z.object({
    council: partnerSchema,
    chamber: partnerSchema,
  }),

  features: z.object({
    businessDirectory: z.boolean(),
    eventsCalendar: z.boolean(),
    communityNoticeboard: z.boolean(),
    communityGroups: z.boolean(),
    localHistory: z.boolean(),
    messaging: z.boolean(),
    dealsHub: z.boolean(),
    b2bNetworking: z.boolean(),
    emergencyAlerts: z.boolean(),
    socialFeedAggregation: z.boolean(),
    surveySystem: z.boolean(),
    reviewsAndRatings: z.boolean(),
    multilingual: z.boolean(),
    pwaInstallation: z.boolean(),
    smsAlerts: z.boolean(),
    whatsappAlerts: z.boolean(),
  }),

  multilingual: z
    .object({
      defaultLanguage: z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/, 'Must be a BCP 47 language code'),
      supportedLanguages: z.array(supportedLanguageSchema).min(1),
      autoTranslationEnabled: z.boolean(),
    })
    .refine((ml) => ml.supportedLanguages.some((lang) => lang.code === ml.defaultLanguage), {
      message: 'defaultLanguage must be one of the codes in supportedLanguages',
      path: ['defaultLanguage'],
    }),

  seo: z.object({
    titleTemplate: z.string().min(1),
    defaultTitle: z.string().min(1),
    defaultDescription: z.string().min(1),
    defaultKeywords: z.array(z.string().min(1)),
    ogImage: z.string().min(1),
    twitterHandle: z.string().min(1),
  }),

  contact: z.object({
    supportEmail: z.string().email(),
    generalEmail: z.string().email(),
    feedbackEmail: z.string().email(),
    privacyEmail: z.string().email(),
  }),

  legal: z.object({
    termsUrl: z.string().min(1),
    privacyUrl: z.string().min(1),
    cookieUrl: z.string().min(1),
    accessibilityUrl: z.string().min(1),
    abn: z.string().min(1),
  }),

  limits: z.object({
    maxBusinessPhotos: z.number().int().positive(),
    maxPhotoSizeMb: z.number().positive(),
    maxMenuFileSizeMb: z.number().positive(),
    maxActivePromotions: z.number().int().positive(),
    maxNoticeboardPostsPerUser: z.number().int().positive(),
    noticeboardExpiryDays: z.number().int().positive(),
    maxNewConversationsPerDay: z.number().int().positive(),
    maxFlashDealsPerWeek: z.number().int().positive(),
    reviewEditWindowDays: z.number().int().positive(),
    accountDeletionGracePeriodDays: z.number().int().positive(),
  }),

  analytics: z.object({
    googleAnalyticsId: z.string(),
    enableCookieConsent: z.boolean(),
  }),
});

/**
 * Schema for partial platform config used in environment-specific overrides.
 * Allows any subset of fields to be specified for deep merging.
 */
export const platformConfigOverrideSchema = platformConfigSchema.deepPartial();
