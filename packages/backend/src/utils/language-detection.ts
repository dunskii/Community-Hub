import { franc } from 'franc';
import { logger } from './logger.js';

/**
 * Detects the language of the given text using franc library
 * Returns ISO 639-1 language code (e.g., 'en', 'ar', 'zh')
 * Fallback to provided defaultLanguage if detection fails
 *
 * @param text - The text to detect language from
 * @param defaultLanguage - Fallback language code (default: 'en')
 * @returns ISO 639-1 language code
 */
export function detectLanguage(
  text: string,
  defaultLanguage: string = 'en'
): string {
  if (!text || text.trim().length < 10) {
    return defaultLanguage;
  }

  try {
    // franc returns ISO 639-3 codes, convert to ISO 639-1
    const detected = franc(text, { minLength: 10 });

    // Map common ISO 639-3 to ISO 639-1
    const iso6393to6391: Record<string, string> = {
      'eng': 'en',
      'ara': 'ar',
      'cmn': 'zh',
      'vie': 'vi',
      'hin': 'hi',
      'urd': 'ur',
      'kor': 'ko',
      'ell': 'el',
      'ita': 'it',
      'spa': 'es',
      'fra': 'fr',
      'deu': 'de',
      'por': 'pt',
      'rus': 'ru',
      'jpn': 'ja',
    };

    const language = iso6393to6391[detected] || defaultLanguage;

    logger.debug({ detected, language, textLength: text.length }, 'Language detected');

    return language;
  } catch (error) {
    logger.warn({ error }, 'Language detection failed, using default');
    return defaultLanguage;
  }
}
