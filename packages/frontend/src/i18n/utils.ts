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
    console.error('Error validating language code:', error);
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
      .map((lang) => lang.code);
  } catch (error) {
    console.error('Error getting enabled languages:', error);
    return ['en']; // Fallback to English
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
    console.error('Error checking RTL status:', error);
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
    console.error('Error validating language code:', error);
    return 'en'; // Fallback to English
  }
}
