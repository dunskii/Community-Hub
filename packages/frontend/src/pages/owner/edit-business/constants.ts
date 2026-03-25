/**
 * EditBusinessPage constants
 *
 * Shared constants for the edit business form tabs.
 */

export const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export const PRICE_RANGES = ['BUDGET', 'MODERATE', 'PREMIUM', 'LUXURY'];

export const PAYMENT_METHODS = [
  'CASH', 'CARD', 'EFTPOS', 'PAYPAL',
  'AFTERPAY', 'APPLE_PAY', 'GOOGLE_PAY'
];

export const ACCESSIBILITY_FEATURES = [
  'WHEELCHAIR_ACCESS', 'ACCESSIBLE_BATHROOM', 'HEARING_LOOP',
  'RAMP', 'ELEVATOR', 'BRAILLE'
];

export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'ar', name: 'Arabic' },
  { code: 'zh-CN', name: 'Chinese (Simplified)' },
  { code: 'zh-TW', name: 'Chinese (Traditional)' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ur', name: 'Urdu' },
  { code: 'ko', name: 'Korean' },
  { code: 'el', name: 'Greek' },
  { code: 'it', name: 'Italian' },
];

export const INPUT_CLASS_NAME =
  'w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent';

export const SECTION_CLASS_NAME =
  'bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700';

export const LABEL_CLASS_NAME =
  'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1';
