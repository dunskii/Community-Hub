import type { z } from 'zod';

import type { platformConfigSchema } from './platform-schema.js';

export type PlatformConfig = z.infer<typeof platformConfigSchema>;

export type PlatformInfo = PlatformConfig['platform'];
export type LocationConfig = PlatformConfig['location'];
export type BrandingConfig = PlatformConfig['branding'];
export type PartnersConfig = PlatformConfig['partners'];
export type FeaturesConfig = PlatformConfig['features'];
export type MultilingualConfig = PlatformConfig['multilingual'];
export type SeoConfig = PlatformConfig['seo'];
export type ContactConfig = PlatformConfig['contact'];
export type LegalConfig = PlatformConfig['legal'];
export type LimitsConfig = PlatformConfig['limits'];
export type AnalyticsConfig = PlatformConfig['analytics'];

export type FeatureFlag = keyof FeaturesConfig;
export type SupportedLanguage = MultilingualConfig['supportedLanguages'][number];
