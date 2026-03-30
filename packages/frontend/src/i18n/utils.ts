import type { LanguageCode } from '@community-hub/shared';
import { getPlatformConfig } from '../config/platform-loader';

/**
 * Check if a language code is valid and enabled in platform config
 */
export function isValidLanguageCode(code: string): boolean {
  try {
    const config = getPlatformConfig();
    const enabledLanguages = config.multilingual.supportedLanguages
      .filter((lang) => lang.enabled)
      .map((lang) => lang.code);

    return enabledLanguages.includes(code as LanguageCode);
  } catch (error) {
    // Silently return false if config cannot be loaded
    return false;
  }
}

/**
 * Get list of enabled language codes from platform config
 */
export function getEnabledLanguages(): LanguageCode[] {
  try {
    const config = getPlatformConfig();
    return config.multilingual.supportedLanguages
      .filter((lang) => lang.enabled)
      .map((lang) => lang.code as LanguageCode);
  } catch (error) {
    // Fallback to English if config cannot be loaded
    return ['en' as LanguageCode];
  }
}

/**
 * Check if a language is RTL (right-to-left)
 * Reads from platform configuration instead of hardcoded list
 */
export function isRTL(languageCode: string): boolean {
  try {
    const config = getPlatformConfig();
    const language = config.multilingual.supportedLanguages.find(
      (lang) => lang.code === languageCode
    );
    return language?.rtl ?? false;
  } catch (error) {
    // Silently return false if config cannot be loaded
    return false;
  }
}

/**
 * Get text direction for a language
 */
export function getDirection(languageCode: string): 'ltr' | 'rtl' {
  return isRTL(languageCode) ? 'rtl' : 'ltr';
}

/**
 * Update HTML lang and dir attributes
 */
export function updateHTMLAttributes(languageCode: string): void {
  document.documentElement.setAttribute('lang', languageCode);
  document.documentElement.setAttribute('dir', getDirection(languageCode));
}

/**
 * Native display names for supported languages.
 * Each language is shown in its own script so users can recognise it
 * regardless of the current UI language.
 */
export const LANGUAGE_NATIVE_NAMES: Record<string, string> = {
  en: 'English',
  ar: 'العربية',
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  vi: 'Tiếng Việt',
  hi: 'हिन्दी',
  ur: 'اردو',
  ko: '한국어',
  el: 'Ελληνικά',
  it: 'Italiano',
};

/**
 * Get the native display name for a language code.
 * Falls back to the code itself if not found.
 */
export function getLanguageNativeName(code: string): string {
  return LANGUAGE_NATIVE_NAMES[code] || code;
}

/**
 * Validate and normalize language code
 * Returns normalized code or default language if invalid
 */
export function validateLanguageCode(code: string): string {
  try {
    const config = getPlatformConfig();
    const defaultLanguage = config.multilingual.defaultLanguage;

    if (!code) return defaultLanguage;

    const isValid = isValidLanguageCode(code);
    return isValid ? code : defaultLanguage;
  } catch (error) {
    // Fallback to English if config cannot be loaded
    return 'en';
  }
}
