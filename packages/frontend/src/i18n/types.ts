/**
 * i18n Type Definitions
 *
 * Provides type safety for translation keys.
 * Import this file in any component using translations to get autocomplete.
 */

import 'react-i18next';
import type translation from '../../public/locales/en/translation.json';

declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: typeof translation;
    };
  }
}

/**
 * Translation namespace keys
 */
export type TranslationNamespace = 'common' | 'navigation' | 'validation' | 'errors' | 'accessibility';

/**
 * Extract all translation keys from a nested object
 * Supports dot notation (e.g., "common.loading")
 */
export type TranslationKeys =
  | `common.${keyof typeof translation.common & string}`
  | `navigation.${keyof typeof translation.navigation & string}`
  | `validation.${keyof typeof translation.validation & string}`
  | `errors.${keyof typeof translation.errors & string}`
  | `accessibility.${keyof typeof translation.accessibility & string}`;

/**
 * Translation keys that support interpolation (contain {{variable}})
 */
export type InterpolatedKeys =
  | 'validation.minLength'
  | 'validation.maxLength'
  | 'accessibility.languageChanged';

/**
 * Type for translation parameters
 */
export type TranslationParams<K extends TranslationKeys> =
  K extends InterpolatedKeys ? Record<string, string | number> : never;
