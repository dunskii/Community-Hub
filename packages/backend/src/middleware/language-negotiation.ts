/**
 * Language Negotiation Middleware
 * Detects preferred language from Accept-Language header
 */

import type { Request, Response, NextFunction } from 'express';

const SUPPORTED_LANGUAGES = ['en', 'ar', 'zh-CN', 'zh-TW', 'vi', 'hi', 'ur', 'ko', 'el', 'it'];

/**
 * Parse Accept-Language header and return best match
 * Format: "en-US,en;q=0.9,ar;q=0.8"
 */
function parseAcceptLanguage(header: string | undefined): string {
  if (!header) return 'en';

  const languages = header
    .split(',')
    .map((lang) => {
      const [code, qPart] = lang.trim().split(';');
      const q = qPart ? parseFloat(qPart.split('=')[1] ?? '1.0') : 1.0;
      return { code: code?.trim() ?? '', q };
    })
    .sort((a, b) => b.q - a.q);

  // Find first supported language
  for (const { code } of languages) {
    // Exact match
    if (SUPPORTED_LANGUAGES.includes(code)) {
      return code;
    }

    // Language family match (e.g., "en-US" → "en")
    const langFamily = code.split('-')[0];
    if (langFamily && SUPPORTED_LANGUAGES.includes(langFamily)) {
      return langFamily;
    }

    // Chinese special case: "zh-CN" or "zh-TW"
    if (langFamily === 'zh') {
      if (code.toLowerCase().includes('cn') || code.toLowerCase().includes('hans')) {
        return 'zh-CN';
      }
      if (code.toLowerCase().includes('tw') || code.toLowerCase().includes('hant')) {
        return 'zh-TW';
      }
      // Default to simplified
      return 'zh-CN';
    }
  }

  // Default to English
  return 'en';
}

/**
 * Middleware to detect and set preferred language
 * Adds req.language property based on Accept-Language header
 */
export function languageNegotiation(req: Request, _res: Response, next: NextFunction): void {
  const acceptLanguage = req.get('Accept-Language');

  if (acceptLanguage) {
    req.language = parseAcceptLanguage(acceptLanguage);
  } else {
    req.language = 'en'; // Default
  }

  next();
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      language?: string;
    }
  }
}
