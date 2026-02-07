/**
 * Supported language codes (BCP 47 format)
 */
export type LanguageCode =
  | 'en'
  | 'ar'
  | 'zh-CN'
  | 'zh-TW'
  | 'vi'
  | 'hi'
  | 'ur'
  | 'ko'
  | 'el'
  | 'it';

/**
 * Language configuration from platform.json
 */
export interface LanguageConfig {
  code: LanguageCode;
  name: string;
  nativeName: string;
  rtl: boolean;
  enabled: boolean;
}

/**
 * Multilingual configuration
 */
export interface MultilingualConfig {
  defaultLanguage: LanguageCode;
  supportedLanguages: LanguageConfig[];
  autoTranslationEnabled: boolean;
}

/**
 * API response for GET /api/v1/languages
 */
export interface LanguagesResponse {
  defaultLanguage: LanguageCode;
  languages: Array<{
    code: LanguageCode;
    name: string;
    nativeName: string;
    rtl: boolean;
  }>;
}
