/**
 * Language Code Validator
 *
 * Validates language codes against platform configuration.
 * Ensures only supported and enabled languages are accepted.
 */

import { getPlatformConfig } from '../config/platform-loader';

/**
 * Get list of supported language codes from platform config
 *
 * @returns Array of enabled language codes
 */
export function getSupportedLanguageCodes(): string[] {
  const config = getPlatformConfig();
  return config.multilingual.supportedLanguages
    .filter((lang) => lang.enabled)
    .map((lang) => lang.code);
}

/**
 * Get default language code from platform config
 *
 * @returns Default language code
 */
export function getDefaultLanguageCode(): string {
  const config = getPlatformConfig();
  return config.multilingual.defaultLanguage;
}

/**
 * Validate language code against platform configuration
 *
 * @param languageCode - Language code to validate
 * @returns true if language is supported and enabled, false otherwise
 */
export function isValidLanguageCode(languageCode: string): boolean {
  const supportedLanguages = getSupportedLanguageCodes();
  return supportedLanguages.includes(languageCode);
}

/**
 * Validate language code and return default if invalid
 *
 * @param languageCode - Language code to validate
 * @returns Validated language code or default if invalid
 */
export function validateLanguageCode(languageCode: string | undefined): string {
  if (!languageCode) {
    return getDefaultLanguageCode();
  }

  if (isValidLanguageCode(languageCode)) {
    return languageCode;
  }

  return getDefaultLanguageCode();
}

/**
 * Get language details from code
 *
 * @param languageCode - Language code
 * @returns Language details or null if not found
 */
export function getLanguageDetails(languageCode: string) {
  const config = getPlatformConfig();
  return (
    config.multilingual.supportedLanguages.find((lang) => lang.code === languageCode) ||
    null
  );
}
