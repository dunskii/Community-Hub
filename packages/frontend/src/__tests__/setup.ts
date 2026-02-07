import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, vi } from 'vitest';
import { loadPlatformConfig } from '../config/platform-loader';

// Complete mock platform config that passes schema validation
const mockPlatformConfig = {
  platform: {
    id: 'guildford-south',
    version: '2.0.0',
  },
  location: {
    suburbName: 'Guildford South',
    suburbNameShort: 'Guildford S',
    region: 'Cumberland',
    city: 'Sydney',
    state: 'NSW',
    stateFullName: 'New South Wales',
    country: 'Australia',
    countryCode: 'AU',
    postcode: '2161',
    postcodeRange: ['2161'],
    coordinates: { latitude: -33.8526, longitude: 150.9875 },
    boundingBox: {
      north: -33.8426,
      south: -33.8626,
      east: 150.9975,
      west: 150.9775,
    },
    timezone: 'Australia/Sydney',
    locale: 'en-AU',
    currency: 'AUD',
    currencySymbol: '$',
    phoneCountryCode: '+61',
    defaultSearchRadiusKm: 2,
    maxSearchRadiusKm: 10,
  },
  branding: {
    platformName: 'Guildford South Community Hub',
    platformNameShort: 'GSCH',
    tagline: 'Discover Local. Support Local.',
    description: 'Your digital gateway to Guildford South',
    legalEntityName: 'Guildford South Community Hub',
    copyrightHolder: 'Guildford South Community Hub',
    colors: {
      primary: '#2C5F7C',
      secondary: '#E67E22',
      accent: '#F39C12',
      success: '#28A745',
      error: '#DC3545',
      warning: '#FFC107',
      info: '#17A2B8',
    },
    logos: {
      primary: '/logos/primary.svg',
      light: '/logos/light.svg',
      dark: '/logos/dark.svg',
      favicon: '/favicon.ico',
      appleTouchIcon: '/apple-touch-icon.png',
    },
    socialHashtags: {
      primary: '#GuildfordSouth',
      secondary: ['#SupportLocal', '#CommunityHub'],
    },
  },
  partners: {
    council: {
      name: 'Cumberland City Council',
      website: 'https://www.cumberland.nsw.gov.au',
      logo: '/partners/cumberland-council.png',
      contactEmail: 'council@example.com',
    },
    chamber: {
      name: 'Guildford Chamber of Commerce',
      website: 'https://example.com',
      logo: '/partners/chamber.png',
      contactEmail: 'chamber@example.com',
    },
  },
  features: {
    businessDirectory: true,
    eventsCalendar: true,
    communityNoticeboard: true,
    communityGroups: true,
    localHistory: true,
    messaging: true,
    dealsHub: true,
    b2bNetworking: true,
    emergencyAlerts: true,
    socialFeedAggregation: true,
    surveySystem: true,
    reviewsAndRatings: true,
    multilingual: true,
    pwaInstallation: true,
    smsAlerts: true,
    whatsappAlerts: true,
  },
  multilingual: {
    defaultLanguage: 'en',
    supportedLanguages: [
      { code: 'en', name: 'English', nativeName: 'English', rtl: false, enabled: true },
      { code: 'ar', name: 'Arabic', nativeName: 'العربية', rtl: true, enabled: true },
      { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文', rtl: false, enabled: true },
      { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文', rtl: false, enabled: true },
      { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', rtl: false, enabled: true },
      { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', rtl: false, enabled: true },
      { code: 'ur', name: 'Urdu', nativeName: 'اردو', rtl: true, enabled: true },
      { code: 'ko', name: 'Korean', nativeName: '한국어', rtl: false, enabled: true },
      { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', rtl: false, enabled: true },
      { code: 'it', name: 'Italian', nativeName: 'Italiano', rtl: false, enabled: true },
    ],
    autoTranslationEnabled: true,
  },
  seo: {
    titleTemplate: '%s | Guildford South Community Hub',
    defaultTitle: 'Guildford South Community Hub',
    defaultDescription: 'Your digital gateway to Guildford South',
    defaultKeywords: ['community', 'local business', 'Guildford South'],
    ogImage: '/og-image.png',
    twitterHandle: '@guildfordsouth',
  },
  contact: {
    supportEmail: 'support@example.com',
    generalEmail: 'info@example.com',
    feedbackEmail: 'feedback@example.com',
    privacyEmail: 'privacy@example.com',
  },
  legal: {
    termsUrl: '/legal/terms',
    privacyUrl: '/legal/privacy',
    cookieUrl: '/legal/cookies',
    accessibilityUrl: '/legal/accessibility',
    abn: '12345678901',
  },
  limits: {
    maxBusinessPhotos: 20,
    maxPhotoSizeMb: 5,
    maxMenuFileSizeMb: 10,
    maxActivePromotions: 5,
    maxNoticeboardPostsPerUser: 10,
    noticeboardExpiryDays: 30,
    maxNewConversationsPerDay: 10,
    maxFlashDealsPerWeek: 3,
    reviewEditWindowDays: 7,
    accountDeletionGracePeriodDays: 30,
  },
  analytics: {
    googleAnalyticsId: '',
    enableCookieConsent: true,
  },
};

// Mock fetch to return platform config
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => mockPlatformConfig,
}) as any;

// Cleanup after each test to prevent DOM pollution
afterEach(() => {
  cleanup();
});

// Load platform config before tests run
beforeAll(async () => {
  await loadPlatformConfig();
});
