/**
 * Shared helpers for database seed files.
 */

/** All supported locales in the platform. */
export const SUPPORTED_LOCALES = [
  'en', 'ar', 'zh-CN', 'zh-TW', 'vi', 'hi', 'ur', 'ko', 'el', 'it',
] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

/**
 * Generate a multilingual name object from an English name.
 * Non-English locales are prefixed with `[UNTRANSLATED]`.
 */
export function multilingualName(englishName: string): Record<SupportedLocale, string> {
  const result: Record<string, string> = {};
  for (const locale of SUPPORTED_LOCALES) {
    result[locale] = locale === 'en' ? englishName : `[UNTRANSLATED] ${englishName}`;
  }
  return result as Record<SupportedLocale, string>;
}

/**
 * Date helper: returns a Date offset from now by the given number of days.
 */
export function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}
