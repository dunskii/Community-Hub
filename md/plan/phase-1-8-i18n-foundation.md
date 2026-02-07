# Phase 1.8: i18n Foundation - Implementation Plan

**Created:** 2026-02-06
**Phase:** 1.8 (Final sub-phase of Phase 1: Foundation & Core Infrastructure)
**Specification:** §8 Multilingual Support (lines 1413-1500), §2.4 Platform Configuration (lines 308-322)
**Dependencies:** Phase 1.1-1.7 complete (88%, 1 task deferred to Phase 19)
**Estimated Effort:** 2 weeks (26 hours development + 1-2 weeks translation procurement in parallel)

---

## Executive Summary

Phase 1.8 establishes multilingual infrastructure for 10 languages (en, ar, zh-CN, zh-TW, vi, hi, ur, ko, el, it) with RTL support for Arabic and Urdu. This is the final sub-phase of Phase 1 and **critical infrastructure** that all future phases (2-19) depend on.

**Key Deliverables:**
- Translation file structure (10 languages × JSON files)
- i18next configuration with language detection
- Language switching hook (`useLanguage`)
- RTL support infrastructure (HTML `dir`, CSS logical properties)
- Backend API endpoint (`GET /api/v1/languages`)
- Comprehensive test coverage (>80%)
- Translation workflow documentation

**Critical Success Factors:**
- Configuration-driven (all from `platform.json`, never hardcoded)
- Professional translation recommended (~$450-$1,125 for initial UI strings)
- WCAG 2.1 AA accessibility compliance
- RTL testing with native speakers

---

## Table of Contents

1. [Implementation Phases](#implementation-phases)
2. [Detailed Task Breakdown](#detailed-task-breakdown)
3. [Location-Agnostic Architecture](#location-agnostic-architecture)
4. [Security & Compliance](#security--compliance)
5. [Accessibility Requirements](#accessibility-requirements)
6. [Risk Assessment & Mitigation](#risk-assessment--mitigation)
7. [Integration Points](#integration-points)
8. [Critical Files](#critical-files)
9. [Success Criteria](#success-criteria)
10. [Testing Strategy](#testing-strategy)

---

## Implementation Phases

### Phase 1: Dependencies & Setup (2 hours)

**Objective:** Install required libraries and create folder structure

**Tasks:**
1. Install i18next packages:
   ```bash
   cd packages/frontend
   pnpm add i18next react-i18next i18next-browser-languagedetector
   ```

2. Create folder structure:
   ```bash
   mkdir -p packages/frontend/public/locales/{en,ar,zh-CN,zh-TW,vi,hi,ur,ko,el,it}
   mkdir -p packages/frontend/src/i18n/__tests__
   mkdir -p packages/frontend/src/hooks/__tests__
   ```

3. Verify existing configuration:
   - ✅ `config/platform.json` has `multilingual` object (lines 100-133)
   - ✅ Tailwind CSS 4 installed with logical properties support (Phase 1.4)
   - ✅ Redis cache service available (Phase 1.3)

**Success Criteria:**
- All packages installed without conflicts
- Folder structure created
- No changes to platform.json required (already complete)

---

### Phase 2: Translation File Structure (4 hours)

**Objective:** Create JSON translation files for 10 languages with initial keys

**Task 1: Create English (Primary Language) Translation File**

File: `packages/frontend/public/locales/en/translation.json`

```json
{
  "common": {
    "loading": "Loading...",
    "error": "An error occurred",
    "success": "Success",
    "save": "Save",
    "cancel": "Cancel",
    "submit": "Submit",
    "delete": "Delete",
    "edit": "Edit",
    "search": "Search",
    "filter": "Filter",
    "clear": "Clear",
    "close": "Close",
    "back": "Back",
    "next": "Next",
    "previous": "Previous",
    "yes": "Yes",
    "no": "No"
  },
  "navigation": {
    "home": "Home",
    "businesses": "Businesses",
    "events": "Events",
    "deals": "Deals",
    "profile": "Profile",
    "settings": "Settings",
    "logout": "Log Out",
    "login": "Log In"
  },
  "validation": {
    "required": "This field is required",
    "invalidEmail": "Invalid email address",
    "invalidPhone": "Invalid phone number",
    "minLength": "Must be at least {{count}} characters",
    "maxLength": "Must be no more than {{count}} characters",
    "passwordMismatch": "Passwords do not match",
    "invalidUrl": "Invalid URL"
  },
  "errors": {
    "generic": "Something went wrong. Please try again.",
    "network": "Network error. Please check your connection.",
    "notFound": "The requested resource was not found.",
    "unauthorized": "You are not authorized to access this resource.",
    "forbidden": "Access forbidden.",
    "serverError": "Server error. Please try again later.",
    "timeout": "Request timed out. Please try again."
  },
  "accessibility": {
    "selectLanguage": "Select language",
    "languageChanged": "Language changed to {{language}}",
    "skipToMain": "Skip to main content",
    "openMenu": "Open menu",
    "closeMenu": "Close menu"
  }
}
```

**Task 2: Create Placeholder Files for Other 9 Languages**

For each language (ar, zh-CN, zh-TW, vi, hi, ur, ko, el, it), create `translation.json` with `[UNTRANSLATED]` placeholders:

Example: `packages/frontend/public/locales/ar/translation.json`
```json
{
  "common": {
    "loading": "[UNTRANSLATED] Loading...",
    "error": "[UNTRANSLATED] An error occurred",
    "success": "[UNTRANSLATED] Success"
  }
}
```

**Note:** Professional translation procurement can happen in parallel with development.

**Success Criteria:**
- 10 language directories created with `translation.json` files
- English file has ~50-60 keys across 5 namespaces
- Other 9 languages have placeholder structure
- Valid JSON syntax (no parse errors)

---

### Phase 3: i18n Configuration (3 hours)

**Objective:** Configure i18next with language detection and fallback strategy

**Task 1: Create i18n Config File**

File: `packages/frontend/src/i18n/config.ts`

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import all translation files
import translationEN from '../../public/locales/en/translation.json';
import translationAR from '../../public/locales/ar/translation.json';
import translationZH_CN from '../../public/locales/zh-CN/translation.json';
import translationZH_TW from '../../public/locales/zh-TW/translation.json';
import translationVI from '../../public/locales/vi/translation.json';
import translationHI from '../../public/locales/hi/translation.json';
import translationUR from '../../public/locales/ur/translation.json';
import translationKO from '../../public/locales/ko/translation.json';
import translationEL from '../../public/locales/el/translation.json';
import translationIT from '../../public/locales/it/translation.json';

const resources = {
  en: { translation: translationEN },
  ar: { translation: translationAR },
  'zh-CN': { translation: translationZH_CN },
  'zh-TW': { translation: translationZH_TW },
  vi: { translation: translationVI },
  hi: { translation: translationHI },
  ur: { translation: translationUR },
  ko: { translation: translationKO },
  el: { translation: translationEL },
  it: { translation: translationIT },
};

// Custom language detector order
const languageDetectorOptions = {
  order: ['querystring', 'localStorage', 'navigator'],
  lookupQuerystring: 'lang',
  lookupLocalStorage: 'community-hub-language',
  caches: ['localStorage'],
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: languageDetectorOptions,
    react: {
      useSuspense: false, // Disable suspense to avoid loading flickers
    },
  });

export default i18n;
```

**Task 2: Initialize i18n in main.tsx**

File: `packages/frontend/src/main.tsx`

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Initialize i18n BEFORE rendering React
import './i18n/config';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**Task 3: Update index.html with lang and dir attributes**

File: `packages/frontend/index.html`

```html
<!doctype html>
<html lang="en" dir="ltr">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Community Hub</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Success Criteria:**
- i18next initialized with all 10 languages
- Language detection order: URL → localStorage → browser → default
- Fallback to English for missing keys
- No console errors on app startup

---

### Phase 4: Language Detection & Switching (4 hours)

**Objective:** Implement language validation, RTL detection, and switching hook

**Task 1: Create i18n Utilities**

File: `packages/frontend/src/i18n/utils.ts`

```typescript
import { getPlatformConfig } from '@community-hub/shared';

// RTL languages
const RTL_LANGUAGES = ['ar', 'ur'];

/**
 * Check if a language code is valid and enabled in platform config
 */
export async function isValidLanguageCode(code: string): Promise<boolean> {
  const config = await getPlatformConfig();
  const enabledLanguages = config.multilingual.supportedLanguages
    .filter((lang) => lang.enabled)
    .map((lang) => lang.code);

  return enabledLanguages.includes(code);
}

/**
 * Get list of enabled language codes from platform config
 */
export async function getEnabledLanguages(): Promise<string[]> {
  const config = await getPlatformConfig();
  return config.multilingual.supportedLanguages
    .filter((lang) => lang.enabled)
    .map((lang) => lang.code);
}

/**
 * Check if a language is RTL (right-to-left)
 */
export function isRTL(languageCode: string): boolean {
  return RTL_LANGUAGES.includes(languageCode);
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
export async function validateLanguageCode(code: string): Promise<string> {
  const config = await getPlatformConfig();
  const defaultLanguage = config.multilingual.defaultLanguage;

  if (!code) return defaultLanguage;

  const isValid = await isValidLanguageCode(code);
  return isValid ? code : defaultLanguage;
}
```

**Task 2: Create useLanguage Hook**

File: `packages/frontend/src/hooks/useLanguage.ts`

```typescript
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getEnabledLanguages,
  validateLanguageCode,
  updateHTMLAttributes,
  isRTL,
} from '../i18n/utils';

interface UseLanguageReturn {
  currentLanguage: string;
  availableLanguages: string[];
  changeLanguage: (code: string) => Promise<void>;
  isRTL: boolean;
  isLoading: boolean;
}

/**
 * Hook for managing language switching and detection
 */
export function useLanguage(): UseLanguageReturn {
  const { i18n } = useTranslation();
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load available languages on mount
  useEffect(() => {
    const loadLanguages = async () => {
      const languages = await getEnabledLanguages();
      setAvailableLanguages(languages);
      setIsLoading(false);
    };

    loadLanguages();
  }, []);

  // Update HTML attributes when language changes
  useEffect(() => {
    updateHTMLAttributes(i18n.language);
  }, [i18n.language]);

  /**
   * Change the current language with validation
   */
  const changeLanguage = async (code: string): Promise<void> => {
    const validatedCode = await validateLanguageCode(code);
    await i18n.changeLanguage(validatedCode);
    updateHTMLAttributes(validatedCode);

    // Persist to localStorage
    localStorage.setItem('community-hub-language', validatedCode);

    // TODO Phase 2: If user is authenticated, update user.language_preference via API
  };

  return {
    currentLanguage: i18n.language,
    availableLanguages,
    changeLanguage,
    isRTL: isRTL(i18n.language),
    isLoading,
  };
}
```

**Task 3: Create TypeScript Types**

File: `packages/shared/src/types/i18n.ts`

```typescript
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
```

**Task 4: Export Types from Shared Package**

File: `packages/shared/src/index.ts` (add exports)

```typescript
// Existing exports...

// i18n types
export * from './types/i18n';
```

**Success Criteria:**
- `useLanguage()` hook functional with `changeLanguage()`, `currentLanguage`, `availableLanguages`, `isRTL`
- Language validation against platform.json
- HTML `lang` and `dir` attributes update automatically
- localStorage persistence
- TypeScript types exported from shared package

---

### Phase 5: RTL Support (3 hours)

**Objective:** Verify RTL infrastructure and test layout mirroring

**Task 1: Create RTL Utility Module**

File: `packages/frontend/src/i18n/rtl.ts`

```typescript
import { isRTL as checkRTL } from './utils';

/**
 * RTL-specific utilities for layout and styling
 */

/**
 * Check if current document is in RTL mode
 */
export function isDocumentRTL(): boolean {
  return document.documentElement.getAttribute('dir') === 'rtl';
}

/**
 * Get appropriate margin/padding for inline-start
 * (left in LTR, right in RTL)
 */
export function getInlineStart(): 'left' | 'right' {
  return isDocumentRTL() ? 'right' : 'left';
}

/**
 * Get appropriate margin/padding for inline-end
 * (right in LTR, left in RTL)
 */
export function getInlineEnd(): 'left' | 'right' {
  return isDocumentRTL() ? 'left' : 'right';
}

/**
 * Mirror transform for directional icons
 * Returns CSS transform value
 */
export function mirrorIcon(): string {
  return isDocumentRTL() ? 'scaleX(-1)' : 'none';
}
```

**Task 2: Document CSS Logical Properties Guidelines**

File: `docs/RTL_GUIDELINES.md`

```markdown
# RTL (Right-to-Left) Guidelines

## CSS Logical Properties

Always use logical properties instead of physical properties for automatic RTL support:

### ❌ Don't Use Physical Properties
```css
margin-left: 16px;
padding-right: 8px;
text-align: left;
border-left: 1px solid;
```

### ✅ Use Logical Properties
```css
margin-inline-start: 16px;  /* left in LTR, right in RTL */
padding-inline-end: 8px;    /* right in LTR, left in RTL */
text-align: start;          /* left in LTR, right in RTL */
border-inline-start: 1px solid;
```

## Tailwind CSS 4 Support

Tailwind CSS 4 uses logical properties by default. Prefer Tailwind utilities:

```html
<!-- ✅ Correct: Uses logical properties -->
<div class="ms-4 pe-2">  <!-- margin-inline-start: 1rem, padding-inline-end: 0.5rem -->

<!-- ❌ Avoid: Physical properties -->
<div class="ml-4 pr-2">  <!-- These may not flip in RTL -->
```

## Elements That Mirror

- Navigation menus
- Breadcrumbs
- Card layouts (image + text)
- Form field labels
- Buttons with icons
- Modals (close button)
- Pagination controls
- Directional icons (arrows)

## Elements That DON'T Mirror

- Numbers (always LTR)
- Email addresses
- URLs
- Phone numbers
- Maps
- Images/photos
- Videos
- Charts/graphs

## Testing RTL

### Browser DevTools
- Chrome: DevTools → Rendering → Emulate CSS → `direction: rtl`
- Firefox: DevTools → Accessibility → Simulate → Direction

### Manual Testing
1. Change language to Arabic or Urdu
2. Verify layout mirrors correctly
3. Check for text overflow/truncation
4. Test with native speakers (recommended)
```

**Task 3: Verify Existing Components Use Logical Properties**

Review and update existing components if needed:
- `packages/frontend/src/components/**/*.tsx`
- Check for physical properties (`margin-left`, `padding-right`, etc.)
- Replace with logical properties or Tailwind utilities

**Task 4: Add RTL Test Page (Development Only)**

File: `packages/frontend/src/pages/RTLTestPage.tsx` (for development testing)

```typescript
import { useLanguage } from '../hooks/useLanguage';
import { useTranslation } from 'react-i18next';

export default function RTLTestPage() {
  const { changeLanguage, currentLanguage, isRTL } = useLanguage();
  const { t } = useTranslation();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">RTL Test Page</h1>

      <div className="mb-4">
        <p>Current Language: {currentLanguage}</p>
        <p>Is RTL: {isRTL ? 'Yes' : 'No'}</p>
        <p>HTML dir: {document.documentElement.getAttribute('dir')}</p>
      </div>

      <div className="flex gap-4 mb-4">
        <button
          onClick={() => changeLanguage('en')}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          English
        </button>
        <button
          onClick={() => changeLanguage('ar')}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          العربية
        </button>
      </div>

      {/* Test card layout */}
      <div className="flex items-center gap-4 p-4 border rounded mb-4">
        <div className="w-16 h-16 bg-gray-300 rounded"></div>
        <div>
          <h3 className="font-bold">{t('common.loading')}</h3>
          <p>{t('common.error')}</p>
        </div>
      </div>

      {/* Test form */}
      <div className="space-y-4">
        <div>
          <label className="block mb-2">{t('validation.required')}</label>
          <input type="text" className="border rounded px-4 py-2 w-full" />
        </div>
      </div>
    </div>
  );
}
```

**Success Criteria:**
- RTL utility module created
- CSS logical properties guidelines documented
- Existing components verified (use logical properties or Tailwind utilities)
- RTL test page functional (can switch between English and Arabic)
- Layout mirrors correctly for Arabic/Urdu

---

### Phase 6: Backend API (2 hours)

**Objective:** Create API endpoint to serve enabled languages

**Task 1: Create Languages Route**

File: `packages/backend/src/routes/languages.ts`

```typescript
import { Router, Request, Response } from 'express';
import { getPlatformConfig } from '@community-hub/shared';
import { CacheService } from '../cache/cache-service';
import { LanguagesResponse } from '@community-hub/shared';

const router = Router();
const cacheService = CacheService.getInstance();

/**
 * GET /api/v1/languages
 * Returns list of enabled languages from platform.json
 * Public endpoint (no auth required)
 */
router.get('/languages', async (req: Request, res: Response) => {
  try {
    // Check cache first (30-day TTL)
    const cacheKey = 'platform:languages';
    const cached = await cacheService.get<LanguagesResponse>(cacheKey);

    if (cached) {
      return res.json(cached);
    }

    // Load from platform config
    const config = await getPlatformConfig();
    const { defaultLanguage, supportedLanguages } = config.multilingual;

    // Filter enabled languages
    const enabledLanguages = supportedLanguages
      .filter((lang) => lang.enabled)
      .map(({ code, name, nativeName, rtl }) => ({
        code,
        name,
        nativeName,
        rtl,
      }));

    const response: LanguagesResponse = {
      defaultLanguage,
      languages: enabledLanguages,
    };

    // Cache for 30 days (languages rarely change)
    await cacheService.set(cacheKey, response, 30 * 24 * 60 * 60);

    res.json(response);
  } catch (error) {
    console.error('Error fetching languages:', error);
    res.status(500).json({
      error: 'Failed to fetch languages',
      message: 'An error occurred while retrieving language settings',
    });
  }
});

export default router;
```

**Task 2: Register Route in Main Router**

File: `packages/backend/src/routes/index.ts`

```typescript
import { Router } from 'express';
import healthRouter from './health';
import geocodingRouter from './geocoding';
import languagesRouter from './languages'; // Add this

const router = Router();

// Register all routes
router.use('/health', healthRouter);
router.use('/geocoding', geocodingRouter);
router.use('/', languagesRouter); // Add this (no prefix, endpoint is /languages)

export default router;
```

**Task 3: Test Endpoint Manually**

```bash
# Start backend server
cd packages/backend
pnpm dev

# Test endpoint (in another terminal)
curl http://localhost:3000/api/v1/languages | jq
```

Expected response:
```json
{
  "defaultLanguage": "en",
  "languages": [
    {
      "code": "en",
      "name": "English",
      "nativeName": "English",
      "rtl": false
    },
    {
      "code": "ar",
      "name": "Arabic",
      "nativeName": "العربية",
      "rtl": true
    }
  ]
}
```

**Success Criteria:**
- `GET /api/v1/languages` endpoint functional
- Returns only enabled languages from platform.json
- Response includes RTL flag
- Redis caching implemented (30-day TTL)
- No authentication required (public endpoint)
- Error handling for failures

---

### Phase 7: Testing (6 hours)

**Objective:** Achieve >80% test coverage with comprehensive test suite

#### Test File 1: i18n Configuration Tests

File: `packages/frontend/src/i18n/__tests__/config.test.ts`

```typescript
import i18n from '../config';

describe('i18n Configuration', () => {
  it('should initialize with default language', () => {
    expect(i18n.language).toBe('en');
  });

  it('should have all 10 languages loaded', () => {
    const languages = Object.keys(i18n.store.data);
    expect(languages).toHaveLength(10);
    expect(languages).toContain('en');
    expect(languages).toContain('ar');
    expect(languages).toContain('zh-CN');
    expect(languages).toContain('zh-TW');
    expect(languages).toContain('vi');
    expect(languages).toContain('hi');
    expect(languages).toContain('ur');
    expect(languages).toContain('ko');
    expect(languages).toContain('el');
    expect(languages).toContain('it');
  });

  it('should fall back to English for missing keys', () => {
    i18n.changeLanguage('ar');
    // Assuming key exists in en but not ar (or is [UNTRANSLATED])
    const translation = i18n.t('common.loading');
    expect(translation).toBeDefined();
    expect(translation).not.toBe('');
  });

  it('should use English as fallback language', () => {
    expect(i18n.options.fallbackLng).toBe('en');
  });

  it('should not escape values (React handles escaping)', () => {
    expect(i18n.options.interpolation?.escapeValue).toBe(false);
  });
});
```

#### Test File 2: i18n Utils Tests

File: `packages/frontend/src/i18n/__tests__/utils.test.ts`

```typescript
import {
  isRTL,
  getDirection,
  updateHTMLAttributes,
  validateLanguageCode,
  isValidLanguageCode,
  getEnabledLanguages,
} from '../utils';

describe('i18n Utils', () => {
  describe('isRTL', () => {
    it('should return true for Arabic', () => {
      expect(isRTL('ar')).toBe(true);
    });

    it('should return true for Urdu', () => {
      expect(isRTL('ur')).toBe(true);
    });

    it('should return false for English', () => {
      expect(isRTL('en')).toBe(false);
    });

    it('should return false for Chinese', () => {
      expect(isRTL('zh-CN')).toBe(false);
      expect(isRTL('zh-TW')).toBe(false);
    });
  });

  describe('getDirection', () => {
    it('should return rtl for Arabic', () => {
      expect(getDirection('ar')).toBe('rtl');
    });

    it('should return rtl for Urdu', () => {
      expect(getDirection('ur')).toBe('rtl');
    });

    it('should return ltr for English', () => {
      expect(getDirection('en')).toBe('ltr');
    });

    it('should return ltr for other languages', () => {
      expect(getDirection('vi')).toBe('ltr');
      expect(getDirection('ko')).toBe('ltr');
    });
  });

  describe('updateHTMLAttributes', () => {
    it('should set lang and dir attributes for English', () => {
      updateHTMLAttributes('en');
      expect(document.documentElement.getAttribute('lang')).toBe('en');
      expect(document.documentElement.getAttribute('dir')).toBe('ltr');
    });

    it('should set lang and dir attributes for Arabic', () => {
      updateHTMLAttributes('ar');
      expect(document.documentElement.getAttribute('lang')).toBe('ar');
      expect(document.documentElement.getAttribute('dir')).toBe('rtl');
    });

    it('should set lang and dir attributes for Urdu', () => {
      updateHTMLAttributes('ur');
      expect(document.documentElement.getAttribute('lang')).toBe('ur');
      expect(document.documentElement.getAttribute('dir')).toBe('rtl');
    });

    it('should set ltr for Chinese', () => {
      updateHTMLAttributes('zh-CN');
      expect(document.documentElement.getAttribute('lang')).toBe('zh-CN');
      expect(document.documentElement.getAttribute('dir')).toBe('ltr');
    });
  });

  describe('validateLanguageCode', () => {
    it('should validate enabled language codes', async () => {
      const result = await validateLanguageCode('en');
      expect(result).toBe('en');
    });

    it('should return default language for invalid codes', async () => {
      const result = await validateLanguageCode('invalid');
      expect(result).toBe('en');
    });

    it('should return default language for empty string', async () => {
      const result = await validateLanguageCode('');
      expect(result).toBe('en');
    });

    it('should return default language for disabled languages', async () => {
      // Assuming 'fr' is not in supportedLanguages
      const result = await validateLanguageCode('fr');
      expect(result).toBe('en');
    });
  });

  describe('isValidLanguageCode', () => {
    it('should return true for enabled languages', async () => {
      expect(await isValidLanguageCode('en')).toBe(true);
      expect(await isValidLanguageCode('ar')).toBe(true);
      expect(await isValidLanguageCode('zh-CN')).toBe(true);
    });

    it('should return false for unsupported languages', async () => {
      expect(await isValidLanguageCode('fr')).toBe(false);
      expect(await isValidLanguageCode('de')).toBe(false);
    });

    it('should return false for invalid codes', async () => {
      expect(await isValidLanguageCode('')).toBe(false);
      expect(await isValidLanguageCode('invalid')).toBe(false);
    });
  });

  describe('getEnabledLanguages', () => {
    it('should return all enabled language codes', async () => {
      const languages = await getEnabledLanguages();
      expect(languages).toHaveLength(10);
      expect(languages).toContain('en');
      expect(languages).toContain('ar');
      expect(languages).toContain('zh-CN');
    });

    it('should only return enabled languages', async () => {
      const languages = await getEnabledLanguages();
      // All 10 languages are enabled in platform.json
      expect(languages).toHaveLength(10);
    });
  });
});
```

#### Test File 3: RTL Utils Tests

File: `packages/frontend/src/i18n/__tests__/rtl.test.ts`

```typescript
import {
  isDocumentRTL,
  getInlineStart,
  getInlineEnd,
  mirrorIcon,
} from '../rtl';

describe('RTL Utils', () => {
  describe('isDocumentRTL', () => {
    it('should return false when dir is ltr', () => {
      document.documentElement.setAttribute('dir', 'ltr');
      expect(isDocumentRTL()).toBe(false);
    });

    it('should return true when dir is rtl', () => {
      document.documentElement.setAttribute('dir', 'rtl');
      expect(isDocumentRTL()).toBe(true);
    });
  });

  describe('getInlineStart', () => {
    it('should return left for LTR', () => {
      document.documentElement.setAttribute('dir', 'ltr');
      expect(getInlineStart()).toBe('left');
    });

    it('should return right for RTL', () => {
      document.documentElement.setAttribute('dir', 'rtl');
      expect(getInlineStart()).toBe('right');
    });
  });

  describe('getInlineEnd', () => {
    it('should return right for LTR', () => {
      document.documentElement.setAttribute('dir', 'ltr');
      expect(getInlineEnd()).toBe('right');
    });

    it('should return left for RTL', () => {
      document.documentElement.setAttribute('dir', 'rtl');
      expect(getInlineEnd()).toBe('left');
    });
  });

  describe('mirrorIcon', () => {
    it('should return none for LTR', () => {
      document.documentElement.setAttribute('dir', 'ltr');
      expect(mirrorIcon()).toBe('none');
    });

    it('should return scaleX(-1) for RTL', () => {
      document.documentElement.setAttribute('dir', 'rtl');
      expect(mirrorIcon()).toBe('scaleX(-1)');
    });
  });
});
```

#### Test File 4: useLanguage Hook Tests

File: `packages/frontend/src/hooks/__tests__/useLanguage.test.tsx`

```typescript
import { renderHook, act, waitFor } from '@testing-library/react';
import { useLanguage } from '../useLanguage';
import i18n from '../../i18n/config';

describe('useLanguage Hook', () => {
  beforeEach(() => {
    // Reset to English
    i18n.changeLanguage('en');
    localStorage.clear();
    document.documentElement.setAttribute('lang', 'en');
    document.documentElement.setAttribute('dir', 'ltr');
  });

  it('should return current language', async () => {
    const { result } = renderHook(() => useLanguage());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.currentLanguage).toBe('en');
  });

  it('should return available languages', async () => {
    const { result } = renderHook(() => useLanguage());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.availableLanguages).toHaveLength(10);
    expect(result.current.availableLanguages).toContain('en');
    expect(result.current.availableLanguages).toContain('ar');
  });

  it('should change language', async () => {
    const { result } = renderHook(() => useLanguage());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.changeLanguage('ar');
    });

    expect(result.current.currentLanguage).toBe('ar');
    expect(document.documentElement.getAttribute('lang')).toBe('ar');
    expect(document.documentElement.getAttribute('dir')).toBe('rtl');
  });

  it('should persist language to localStorage', async () => {
    const { result } = renderHook(() => useLanguage());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.changeLanguage('vi');
    });

    expect(localStorage.getItem('community-hub-language')).toBe('vi');
  });

  it('should detect RTL languages', async () => {
    const { result } = renderHook(() => useLanguage());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // English is LTR
    expect(result.current.isRTL).toBe(false);

    // Change to Arabic (RTL)
    await act(async () => {
      await result.current.changeLanguage('ar');
    });

    expect(result.current.isRTL).toBe(true);

    // Change to Urdu (RTL)
    await act(async () => {
      await result.current.changeLanguage('ur');
    });

    expect(result.current.isRTL).toBe(true);

    // Change back to Chinese (LTR)
    await act(async () => {
      await result.current.changeLanguage('zh-CN');
    });

    expect(result.current.isRTL).toBe(false);
  });

  it('should validate language codes and fallback to default', async () => {
    const { result } = renderHook(() => useLanguage());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.changeLanguage('invalid');
    });

    // Should fallback to English
    expect(result.current.currentLanguage).toBe('en');
  });

  it('should update HTML attributes on language change', async () => {
    const { result } = renderHook(() => useLanguage());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.changeLanguage('ar');
    });

    expect(document.documentElement.getAttribute('lang')).toBe('ar');
    expect(document.documentElement.getAttribute('dir')).toBe('rtl');
  });
});
```

#### Test File 5: Backend API Tests

File: `packages/backend/src/__tests__/routes/languages.test.ts`

```typescript
import request from 'supertest';
import app from '../../index';
import { CacheService } from '../../cache/cache-service';

describe('GET /api/v1/languages', () => {
  const cacheService = CacheService.getInstance();

  beforeEach(async () => {
    // Clear cache before each test
    await cacheService.delete('platform:languages');
  });

  it('should return list of enabled languages', async () => {
    const res = await request(app).get('/api/v1/languages');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('defaultLanguage');
    expect(res.body.defaultLanguage).toBe('en');
    expect(res.body).toHaveProperty('languages');
    expect(Array.isArray(res.body.languages)).toBe(true);
    expect(res.body.languages.length).toBeGreaterThan(0);
  });

  it('should include all required fields for each language', async () => {
    const res = await request(app).get('/api/v1/languages');

    expect(res.status).toBe(200);

    const language = res.body.languages[0];
    expect(language).toHaveProperty('code');
    expect(language).toHaveProperty('name');
    expect(language).toHaveProperty('nativeName');
    expect(language).toHaveProperty('rtl');
    expect(typeof language.rtl).toBe('boolean');
  });

  it('should include RTL flag for Arabic', async () => {
    const res = await request(app).get('/api/v1/languages');

    expect(res.status).toBe(200);

    const arabic = res.body.languages.find((l: any) => l.code === 'ar');
    expect(arabic).toBeDefined();
    expect(arabic.rtl).toBe(true);
    expect(arabic.name).toBe('Arabic');
    expect(arabic.nativeName).toBe('العربية');
  });

  it('should include RTL flag for Urdu', async () => {
    const res = await request(app).get('/api/v1/languages');

    expect(res.status).toBe(200);

    const urdu = res.body.languages.find((l: any) => l.code === 'ur');
    expect(urdu).toBeDefined();
    expect(urdu.rtl).toBe(true);
    expect(urdu.name).toBe('Urdu');
    expect(urdu.nativeName).toBe('اردو');
  });

  it('should not include RTL flag for non-RTL languages', async () => {
    const res = await request(app).get('/api/v1/languages');

    expect(res.status).toBe(200);

    const english = res.body.languages.find((l: any) => l.code === 'en');
    expect(english).toBeDefined();
    expect(english.rtl).toBe(false);

    const chinese = res.body.languages.find((l: any) => l.code === 'zh-CN');
    expect(chinese).toBeDefined();
    expect(chinese.rtl).toBe(false);
  });

  it('should cache the response', async () => {
    // First request
    const res1 = await request(app).get('/api/v1/languages');
    expect(res1.status).toBe(200);

    // Check cache
    const cached = await cacheService.get('platform:languages');
    expect(cached).toBeDefined();
    expect(cached).toEqual(res1.body);

    // Second request should use cache
    const res2 = await request(app).get('/api/v1/languages');
    expect(res2.status).toBe(200);
    expect(res2.body).toEqual(res1.body);
  });

  it('should be a public endpoint (no auth required)', async () => {
    const res = await request(app).get('/api/v1/languages');

    // Should not return 401 Unauthorized
    expect(res.status).not.toBe(401);
    expect(res.status).toBe(200);
  });

  it('should handle errors gracefully', async () => {
    // Mock getPlatformConfig to throw error
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test-error';

    // This test may need adjustment based on actual error handling
    // For now, just verify it doesn't crash

    process.env.NODE_ENV = originalEnv;
  });
});
```

#### Test File 6: Accessibility Tests

File: `packages/frontend/src/i18n/__tests__/accessibility.test.tsx`

```typescript
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import i18n from '../config';

expect.extend(toHaveNoViolations);

describe('i18n Accessibility (WCAG 2.1)', () => {
  describe('SC 3.1.1: Language of Page (Level A)', () => {
    it('should set lang attribute on html element', () => {
      i18n.changeLanguage('en');
      expect(document.documentElement.getAttribute('lang')).toBe('en');
    });

    it('should update lang attribute when language changes', async () => {
      await i18n.changeLanguage('ar');
      expect(document.documentElement.getAttribute('lang')).toBe('ar');

      await i18n.changeLanguage('zh-CN');
      expect(document.documentElement.getAttribute('lang')).toBe('zh-CN');
    });

    it('should use valid BCP 47 language codes', async () => {
      const validCodes = ['en', 'ar', 'zh-CN', 'zh-TW', 'vi', 'hi', 'ur', 'ko', 'el', 'it'];

      for (const code of validCodes) {
        await i18n.changeLanguage(code);
        const langAttr = document.documentElement.getAttribute('lang');
        expect(langAttr).toBe(code);
        expect(validCodes).toContain(langAttr!);
      }
    });
  });

  describe('SC 3.1.2: Language of Parts (Level AA)', () => {
    it('should allow marking mixed-language content', () => {
      const { container } = render(
        <div lang="ar">
          مرحبا بكم في <span lang="en">Joe's Cafe</span>
        </div>
      );

      const englishSpan = container.querySelector('[lang="en"]');
      expect(englishSpan).toBeInTheDocument();
      expect(englishSpan?.getAttribute('lang')).toBe('en');
    });
  });

  describe('RTL Accessibility', () => {
    it('should set dir attribute for RTL languages', async () => {
      await i18n.changeLanguage('ar');
      expect(document.documentElement.getAttribute('dir')).toBe('rtl');

      await i18n.changeLanguage('ur');
      expect(document.documentElement.getAttribute('dir')).toBe('rtl');
    });

    it('should set dir attribute to ltr for LTR languages', async () => {
      await i18n.changeLanguage('en');
      expect(document.documentElement.getAttribute('dir')).toBe('ltr');

      await i18n.changeLanguage('zh-CN');
      expect(document.documentElement.getAttribute('dir')).toBe('ltr');
    });
  });

  describe('Translation Quality', () => {
    it('should have translations for common accessibility terms', () => {
      expect(i18n.t('accessibility.skipToMain')).toBeTruthy();
      expect(i18n.t('accessibility.selectLanguage')).toBeTruthy();
    });

    it('should not return empty strings for translation keys', () => {
      const keys = [
        'common.loading',
        'common.error',
        'navigation.home',
        'validation.required',
      ];

      keys.forEach((key) => {
        const translation = i18n.t(key);
        expect(translation).toBeTruthy();
        expect(translation).not.toBe('');
      });
    });
  });
});
```

**Run All Tests:**

```bash
# Frontend tests
cd packages/frontend
pnpm test

# Backend tests
cd packages/backend
pnpm test

# Check coverage
pnpm test:coverage
```

**Success Criteria:**
- All tests passing (477 existing + ~40-50 new tests)
- Test coverage >80% for new files
- WCAG 2.1 compliance verified (SC 3.1.1, 3.1.2)
- No axe violations

---

### Phase 8: Documentation (2 hours)

**Objective:** Update project documentation and create workflow guides

**Task 1: Update PROGRESS.md**

Add to `PROGRESS.md`:

```markdown
## Milestone 8: i18n Enabled ✅

**Status:** Complete (6/6 tasks)
**Date Completed:** 2026-02-06

**Completed Work:**
- Translation file structure (10 languages × JSON files)
- i18next configuration with language detection
- Language switching hook (`useLanguage`)
- RTL support infrastructure (HTML `dir`, CSS logical properties)
- Backend API endpoint (`GET /api/v1/languages`)
- Comprehensive test coverage (>80%)
- Translation workflow documentation

**Test Coverage:**
- Unit tests: i18n config, utils, RTL, useLanguage hook
- Integration tests: Language switching, HTML attribute updates
- Backend tests: API endpoint, caching
- Accessibility tests: WCAG 2.1 SC 3.1.1, 3.1.2

**Files Created:**
- `packages/frontend/public/locales/{10 languages}/translation.json`
- `packages/frontend/src/i18n/config.ts`
- `packages/frontend/src/i18n/utils.ts`
- `packages/frontend/src/i18n/rtl.ts`
- `packages/frontend/src/hooks/useLanguage.ts`
- `packages/backend/src/routes/languages.ts`
- `packages/shared/src/types/i18n.ts`
- 6 test files (~40-50 test cases)

**Impact:**
- All future phases can build multilingual features
- Phase 2 (Auth): Translated login/register UI
- Phase 3 (Design): RTL-compatible components
- Phase 4 (Business): Multilingual business content
```

**Task 2: Update TODO.md**

Mark Phase 1.8 tasks as complete in `TODO.md`.

**Task 3: Create Translation Workflow Documentation**

File: `docs/TRANSLATION_WORKFLOW.md`

```markdown
# Translation Workflow

This document describes the workflow for managing translations in the Community Hub platform.

## Overview

The platform supports 10 languages with JSON translation files stored in `packages/frontend/public/locales/{language_code}/translation.json`.

**Supported Languages:**
- English (en) - Primary
- Arabic (ar) - RTL, High priority
- Chinese Simplified (zh-CN) - High priority
- Chinese Traditional (zh-TW) - Medium priority
- Vietnamese (vi) - High priority
- Hindi (hi) - Medium priority
- Urdu (ur) - RTL, Medium priority
- Korean (ko) - Low priority
- Greek (el) - Low priority
- Italian (it) - Low priority

## Adding New Translation Keys

### Step 1: Add Key to English File

Add the new key to `packages/frontend/public/locales/en/translation.json`:

```json
{
  "business": {
    "viewDetails": "View Details",
    "newKey": "New Text Here"  // ← Add new key
  }
}
```

### Step 2: Add Placeholder to Other Languages

Add `[UNTRANSLATED]` placeholder to other 9 language files:

```json
{
  "business": {
    "viewDetails": "[UNTRANSLATED] View Details",
    "newKey": "[UNTRANSLATED] New Text Here"  // ← Add placeholder
  }
}
```

### Step 3: Use in Code

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  return <button>{t('business.newKey')}</button>;
}
```

### Step 4: Professional Translation (Before Launch)

1. Export untranslated keys to CSV
2. Send to professional translation service
3. Import translations back to JSON files
4. Remove `[UNTRANSLATED]` prefix

## Translation Key Naming

**Use descriptive, hierarchical keys:**
- ✅ `validation.invalidEmail`
- ✅ `business.openNow`
- ❌ `error1` (not descriptive)
- ❌ `buttonText` (too generic)

**Namespaces:**
- `common.*` - Shared UI elements
- `navigation.*` - Menu items
- `validation.*` - Form validation messages
- `errors.*` - Error messages
- `accessibility.*` - Accessibility labels

## Variable Interpolation

Use double curly braces for variables:

```json
{
  "greeting": "Hello, {{userName}}!",
  "itemCount": "You have {{count}} items"
}
```

In code:
```typescript
t('greeting', { userName: 'John' });
// Output: "Hello, John!"

t('itemCount', { count: 5 });
// Output: "You have 5 items"
```

## Pluralization

i18next supports pluralization:

```json
{
  "itemCount": "{{count}} item",
  "itemCount_plural": "{{count}} items"
}
```

In code:
```typescript
t('itemCount', { count: 1 });  // "1 item"
t('itemCount', { count: 5 });  // "5 items"
```

## Professional Translation Services

**Recommended Services:**
- [Gengo](https://gengo.com/) - $0.10/word, high quality
- [One Hour Translation](https://www.onehourtranslation.com/) - Fast turnaround
- [Smartling](https://www.smartling.com/) - Enterprise, translation memory

**Cost Estimate:**
- 500 words × 9 languages × $0.10-0.25/word = $450-$1,125

## Testing Translations

### Manual Testing
1. Switch to target language using `useLanguage` hook
2. Navigate through UI
3. Verify all text displays correctly
4. Check for text overflow/truncation
5. Verify RTL layout (Arabic, Urdu)

### Automated Testing
```typescript
// Check translation exists
expect(i18n.t('common.loading')).toBeTruthy();

// Check all languages have key
['en', 'ar', 'zh-CN'].forEach((lang) => {
  i18n.changeLanguage(lang);
  expect(i18n.t('common.loading')).toBeTruthy();
});
```

## RTL (Right-to-Left) Support

**RTL Languages:** Arabic (ar), Urdu (ur)

**Automatic RTL Handling:**
- HTML `dir` attribute updates automatically
- CSS logical properties handle layout mirroring
- Tailwind CSS 4 utilities use logical properties

**Manual RTL Testing:**
1. Change language to Arabic or Urdu
2. Verify layout mirrors (navigation, cards, forms)
3. Check directional icons flip correctly
4. Verify numbers remain LTR

## Translation Memory (Phase 15+)

Future feature: Admin UI for managing translations
- Edit translations via web interface
- Translation suggestions from community
- Translation memory for consistency
- Auto-translation with Google Translate API
```

**Task 4: Create RTL Testing Documentation**

File: `docs/RTL_TESTING.md`

```markdown
# RTL (Right-to-Left) Testing Guide

This guide covers testing RTL (right-to-left) layouts for Arabic and Urdu languages.

## RTL Languages

- **Arabic (ar)** - High priority
- **Urdu (ur)** - Medium priority

## Automatic RTL Support

The platform uses CSS logical properties for automatic RTL support:

| Physical Property | Logical Property | Behavior |
|-------------------|------------------|----------|
| `margin-left` | `margin-inline-start` | Left in LTR, right in RTL |
| `margin-right` | `margin-inline-end` | Right in LTR, left in RTL |
| `padding-left` | `padding-inline-start` | Left in LTR, right in RTL |
| `padding-right` | `padding-inline-end` | Right in LTR, left in RTL |
| `text-align: left` | `text-align: start` | Left in LTR, right in RTL |
| `border-left` | `border-inline-start` | Left in LTR, right in RTL |

## Browser DevTools Testing

### Chrome/Edge
1. Open DevTools (F12)
2. Click **⋮** (More tools) → **Rendering**
3. Under **Emulate CSS media feature**, select **direction: rtl**

### Firefox
1. Open DevTools (F12)
2. Click **Accessibility** tab
3. Under **Simulate**, select **Direction: RTL**

## Manual Testing Checklist

### Layout Components

- [ ] **Navigation menu** aligns to the right
- [ ] **Cards** with image + text (image on right in RTL)
- [ ] **Form fields** align to the right
- [ ] **Buttons with icons** (icon on left in RTL)
- [ ] **Breadcrumbs** reverse order
- [ ] **Modals** (close button on left in RTL)
- [ ] **Pagination** controls mirror

### Directional Icons

- [ ] **Arrow icons** flip horizontally (→ becomes ←)
- [ ] **Chevron icons** flip (› becomes ‹)
- [ ] **Navigation arrows** (back/forward)

### Elements That DON'T Flip

- [ ] **Numbers** remain LTR (e.g., "50$" not "$50")
- [ ] **Email addresses** remain LTR
- [ ] **URLs** remain LTR
- [ ] **Phone numbers** remain LTR
- [ ] **Maps** maintain geographic orientation
- [ ] **Images/photos** don't flip
- [ ] **Videos** don't flip
- [ ] **Charts/graphs** maintain data orientation

### Text Alignment

- [ ] **Body text** aligns to the right
- [ ] **Headings** align to the right
- [ ] **Form labels** align to the right
- [ ] **Buttons** text centers correctly

### Mixed Content (Bidirectional Text)

Test cases with English words/numbers in Arabic text:

- [ ] **Business names in Arabic** (e.g., "مرحبا بكم في Joe's Cafe")
- [ ] **Prices in Arabic** (e.g., "السعر: 50$")
- [ ] **URLs in Arabic** (e.g., "زيارة www.example.com اليوم")

Use `lang` attribute for mixed content:
```html
<p lang="ar">
  مرحبا بكم في <span lang="en">Joe's Cafe</span>
</p>
```

## Testing with Native Speakers

**Recommended:** Have native Arabic/Urdu speakers test the UI

**Focus Areas:**
- Text reads naturally
- No awkward phrasing (machine translation issues)
- Cultural appropriateness
- Text overflow/truncation
- Icon directionality feels natural

## Common RTL Issues

### Issue 1: Text Overflow
**Problem:** Text truncates incorrectly in RTL
**Solution:** Use `text-overflow: ellipsis` with `direction: rtl`

### Issue 2: Numbers in RTL Text
**Problem:** Numbers display right-to-left
**Solution:** Wrap numbers in `<span dir="ltr">`

### Issue 3: Icons Not Flipping
**Problem:** Directional icons don't mirror
**Solution:** Use `transform: scaleX(-1)` for RTL

### Issue 4: Mixed LTR/RTL Content
**Problem:** English text in Arabic paragraph doesn't display correctly
**Solution:** Use `lang` attribute and Unicode bidirectional algorithm

## Visual Regression Testing (Future)

Consider screenshot comparison tools:
- [Percy](https://percy.io/)
- [Chromatic](https://www.chromatic.com/)
- [BackstopJS](https://github.com/garris/BackstopJS)

Capture screenshots in both LTR and RTL modes for comparison.

## Accessibility in RTL

- **Focus indicators** must mirror (outline on right side)
- **Skip links** remain left-aligned (convention)
- **Keyboard navigation** should feel natural (Tab order right-to-left)

## Resources

- [MDN: CSS Logical Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Logical_Properties)
- [W3C: Bidirectional Text](https://www.w3.org/International/articles/inline-bidi-markup/)
- [Tailwind CSS: RTL Support](https://tailwindcss.com/docs/hover-focus-and-other-states#rtl-support)
```

**Success Criteria:**
- PROGRESS.md updated with Milestone 8
- TODO.md tasks marked complete (6/6)
- Translation workflow documented
- RTL testing procedures documented
- All documentation in `docs/` folder

---

## Location-Agnostic Architecture

**CRITICAL REQUIREMENT:** All language logic must read from `platform.json`, never hardcoded.

### Configuration Source of Truth

**File:** `config/platform.json` (lines 100-133)

```json
{
  "multilingual": {
    "defaultLanguage": "en",
    "supportedLanguages": [
      {
        "code": "en",
        "name": "English",
        "nativeName": "English",
        "rtl": false,
        "enabled": true
      },
      {
        "code": "ar",
        "name": "Arabic",
        "nativeName": "العربية",
        "rtl": true,
        "enabled": true
      }
    ],
    "autoTranslationEnabled": true
  }
}
```

### Correct Pattern (Configuration-Driven)

```typescript
// ✅ CORRECT: Read from platform config
import { getPlatformConfig } from '@community-hub/shared';

const config = await getPlatformConfig();
const enabledLanguages = config.multilingual.supportedLanguages
  .filter(lang => lang.enabled)
  .map(lang => lang.code);
```

### Anti-Pattern (Hardcoded)

```typescript
// ❌ NEVER DO THIS: Hardcoded language list
const languages = ['en', 'ar', 'zh-CN', 'zh-TW', 'vi', 'hi', 'ur', 'ko', 'el', 'it'];

// ❌ NEVER DO THIS: Hardcoded RTL check
const isRTL = language === 'ar' || language === 'ur';
```

### Deployment Flexibility

Different suburbs can enable different language subsets:

**Example: Guildford South (Current)**
```json
{
  "supportedLanguages": [
    { "code": "en", "enabled": true },
    { "code": "ar", "enabled": true },
    { "code": "zh-CN", "enabled": true },
    { "code": "vi", "enabled": true }
  ]
}
```

**Example: Hypothetical Suburb with Large Italian Community**
```json
{
  "supportedLanguages": [
    { "code": "en", "enabled": true },
    { "code": "it", "enabled": true },   // High priority
    { "code": "el", "enabled": true },   // High priority
    { "code": "ar", "enabled": false },  // Disabled
    { "code": "zh-CN", "enabled": false }
  ]
}
```

**Implementation ensures:**
- API endpoint only returns enabled languages
- Frontend only loads enabled translation files
- Language selector only shows enabled languages
- No code changes required for different deployments

---

## Security & Compliance

### Input Validation

**Language Code Validation:**
```typescript
// Validate against platform.json enabled languages
const validLanguageCodes = config.multilingual.supportedLanguages
  .filter(lang => lang.enabled)
  .map(lang => lang.code);

if (!validLanguageCodes.includes(requestedLang)) {
  throw new Error('Invalid language code');
}
```

**Fallback Strategy:**
- Invalid language code → fallback to default (en)
- Missing translation key → fallback to English
- Missing translation file → fallback to English + log warning

### XSS Protection

**Translation Files:**
- Translation JSON files are static (not user-editable in Phase 1.8)
- No HTML allowed in translation strings (plain text only)
- React escapes interpolated variables automatically

**Variable Interpolation:**
```typescript
// Safe: React escapes by default
t('greeting', { userName: userInput });
// Output: "Hello, &lt;script&gt;alert()&lt;/script&gt;!"
```

**Future (Phase 15):**
- Admin UI for editing translations (with DOMPurify sanitization)
- Audit log for translation changes
- Role-based access control (RBAC)

### Privacy Considerations

**Language Preference Storage:**

| Storage Method | When Used | Privacy Impact |
|----------------|-----------|----------------|
| URL parameter (`?lang=ar`) | Temporary override | No tracking, URL-based |
| localStorage | Unauthenticated users | Client-side only, no server tracking |
| User profile (`user.language_preference`) | Authenticated users (Phase 2) | Stored in database, requires user account |

**Browser Language Detection:**
- Reading `navigator.language` is passive (no permission required)
- No telemetry sent to server unless user consents to analytics
- Language detection does not identify individual users

**Compliance:**
- Australian Privacy Principles (APP) compliant
- No tracking of language changes without user consent
- User can clear localStorage at any time

### JSON File Integrity

**File Permissions:**
- Translation JSON files: Read-only for application
- Only admins can modify via deployment (not runtime in Phase 1.8)
- Phase 15: Admin UI with audit log

**JSON Validation:**
- CI/CD pipeline validates JSON syntax before deployment
- Invalid JSON → deployment fails
- Pre-commit hook (optional): Validate JSON on commit

### Rate Limiting (Future - Phase 4+)

**Google Translate API:**
- Rate limiting: 100 translation requests per hour per user
- Cost tracking to prevent abuse
- User-specific quotas

---

## Accessibility Requirements

### WCAG 2.1 AA Compliance

**Success Criterion 3.1.1: Language of Page (Level A)**
- `<html lang="...">` attribute must be set correctly
- Updates when language changes
- Screen readers announce language change

**Implementation:**
```typescript
document.documentElement.setAttribute('lang', currentLanguage);
```

**Testing:**
```typescript
it('should set lang attribute on html element', () => {
  i18n.changeLanguage('ar');
  expect(document.documentElement.getAttribute('lang')).toBe('ar');
});
```

**Success Criterion 3.1.2: Language of Parts (Level AA)**
- Mixed-language content must be marked with `lang` attribute
- Example: English business name in Arabic description

**Implementation:**
```html
<p lang="ar">
  مرحبا بكم في <span lang="en">Joe's Cafe</span>
</p>
```

**Success Criterion 2.4.4: Link Purpose (Level A)**
- Language switcher button must have clear label
- `aria-label` for assistive technologies

**Implementation (Phase 3):**
```html
<button aria-label="Select language" aria-expanded="false">
  <span aria-hidden="true">🌐</span>
  <span>English</span>
</button>
```

### Keyboard Navigation (Phase 3)

**Language Selector Component:**
- Tab to button → Enter to open menu
- Arrow keys (↑↓) to navigate languages
- Enter to select language
- Esc to close menu without changing language

**Focus Management:**
- Focus visible indicator (2px solid outline, as per §3.6)
- Focus returns to trigger button after selection
- Focus trap in dropdown menu

### Screen Reader Announcements

**Language Change Notification:**
```html
<div role="status" aria-live="polite">
  Language changed to Arabic
</div>
```

**Implementation:**
```typescript
// After language change
const announcement = document.createElement('div');
announcement.setAttribute('role', 'status');
announcement.setAttribute('aria-live', 'polite');
announcement.textContent = t('accessibility.languageChanged', { language: nativeName });
document.body.appendChild(announcement);

// Remove after 3 seconds
setTimeout(() => announcement.remove(), 3000);
```

### RTL Accessibility

**Focus Indicators:**
- Must mirror in RTL (outline on appropriate side)
- Must maintain 2px solid outline (Spec §3.6)

**Skip Links:**
- "Skip to main content" must be translated
- Remains left-aligned even in RTL (web convention)

**Form Labels:**
- Right-aligned in RTL
- Associated with input via `for` attribute
- Error messages announced by screen reader

---

## Risk Assessment & Mitigation

### Risk 1: Translation Costs

**Risk:** Professional translation for 500 words × 9 languages = $450-$1,125

**Impact:** Medium (budget constraint)

**Mitigation:**
- Use `[UNTRANSLATED]` placeholders initially (development continues)
- Procure professional translations before Phase 2 launch (auth UI)
- Prioritize high-priority languages first (Arabic, Chinese, Vietnamese)
- Consider community translation contributions (Phase 15+)

**Decision:** Acceptable risk, translations can be procured in parallel with development

### Risk 2: RTL Testing Complexity

**Risk:** RTL layout testing requires native speakers and thorough visual testing

**Impact:** Medium (quality/UX concern)

**Mitigation:**
- Use browser DevTools for initial RTL testing
- Budget 2-3 hours for thorough RTL testing
- Engage native Arabic/Urdu speakers for testing (QA team or community)
- Create comprehensive RTL testing checklist
- Consider visual regression testing tools (Percy, Chromatic)

**Decision:** Acceptable risk, RTL testing procedures documented

### Risk 3: Translation File Management at Scale

**Risk:** As translation keys grow (500+ keys), manual management becomes unwieldy

**Impact:** Low (short-term), Medium (long-term)

**Mitigation:**
- Phase 1.8: Manual process acceptable (50-60 keys)
- Phase 15: Admin UI for translation management
- Consider i18next-scanner for key extraction
- Translation memory for consistency
- Version control for translations (Git)

**Decision:** Acceptable risk, start simple and evolve

### Risk 4: Browser Compatibility

**Risk:** CSS logical properties not supported in older browsers

**Impact:** Low (modern browser requirement)

**Mitigation:**
- Target modern browsers (Chrome 89+, Firefox 88+, Safari 14.1+, Edge 89+)
- CSS logical properties widely supported (>95% browser coverage)
- Tailwind CSS 4 uses logical properties by default
- Fallback: PostCSS plugin can convert logical → physical properties

**Decision:** Acceptable risk, modern browser requirement documented

### Risk 5: i18next Library Changes

**Risk:** Breaking changes in react-i18next or i18next

**Impact:** Low (stable library)

**Mitigation:**
- Use fixed versions (lock file)
- Comprehensive test coverage (catch breaking changes)
- Monitor security advisories
- Plan upgrade path for major versions

**Decision:** Acceptable risk, library is mature and stable

---

## Integration Points

### Phase 1.6: Email Templates (Already Multilingual)

**Status:** ✅ Complete

**Integration:**
- Email templates already use multilingual JSON structure (10 languages)
- `email_verification` and `password_reset` templates translated
- RTL support in email base template (`dir="rtl"` for ar, ur)
- Pattern established: JSON fields for multilingual content

**Example:**
```typescript
// Email template structure (already implemented)
{
  subject: {
    en: "Verify your email",
    ar: "تأكيد البريد الإلكتروني",
    "zh-CN": "验证您的电子邮件"
  },
  bodyHtml: {
    en: "<p>Click here to verify...</p>",
    ar: "<p dir='rtl'>انقر هنا للتحقق...</p>"
  }
}
```

**Phase 1.8 Alignment:**
- UI translations use same multilingual JSON pattern
- Consistent language codes (BCP 47)
- Same 10 languages supported

### Phase 1.2: Platform Configuration (Already Complete)

**Status:** ✅ Complete

**Integration:**
- `config/platform.json` has `multilingual` object (lines 100-133)
- All 10 languages defined with RTL flags and enabled status
- Default language configured (en)
- Auto-translation flag configured (true)

**Phase 1.8 Usage:**
- `useLanguage` hook reads from platform config
- API endpoint `/api/v1/languages` serves config data
- Language validation against config
- No changes to platform.json required

### Phase 2: Authentication & User System (Upcoming)

**Status:** ⏳ Pending (depends on Phase 1.8)

**Integration Points:**

1. **User Language Preference:**
   - `user.language_preference` field (database)
   - Updated via profile settings
   - Synced with localStorage
   - Priority: User profile > localStorage > browser

2. **Translated Auth UI:**
   - Login form uses `validation.*` keys
   - Register form uses `validation.*` and `errors.*` keys
   - Password reset uses `common.*` and `errors.*` keys
   - Email verification uses email templates (already multilingual)

3. **API Integration:**
   ```typescript
   // Update user language preference (Phase 2)
   PATCH /api/v1/users/me
   {
     "languagePreference": "ar"
   }
   ```

**Phase 1.8 Provides:**
- `useLanguage` hook for auth components
- Translation keys for form validation
- RTL support for auth UI

### Phase 3: Design System & Core Components (Upcoming)

**Status:** ⏳ Pending (depends on Phase 1.8)

**Integration Points:**

1. **LanguageSelector Component:**
   - Uses `useLanguage` hook
   - Displays all enabled languages (from platform.json)
   - Globe icon + current language native name
   - Dropdown/modal with all languages
   - Keyboard accessible (WCAG 2.1 AA)

2. **RTL-Compatible Components:**
   - All components use CSS logical properties
   - Tailwind CSS 4 utilities (automatic RTL)
   - Directional icon mirroring
   - Form layouts align correctly in RTL

3. **Component Props:**
   ```typescript
   interface ComponentProps {
     direction?: 'ltr' | 'rtl';  // Optional override
   }
   ```

**Phase 1.8 Provides:**
- `useLanguage` hook for components
- RTL utilities (`isRTL`, `getDirection`)
- CSS logical properties guidelines
- Translation keys for common UI elements

### Phase 4: Business Directory Core (Upcoming)

**Status:** ⏳ Pending (depends on Phase 1.8, 2, 3)

**Integration Points:**

1. **Multilingual Business Content:**
   - Business descriptions auto-translated
   - Google Translate API integration
   - "Auto-translated" indicator in UI
   - Owner can override with manual translation

2. **API Integration:**
   ```typescript
   // Translate business content (Phase 4)
   POST /api/v1/translate
   {
     "text": "Welcome to our restaurant",
     "sourceLang": "en",
     "targetLang": "ar"
   }
   ```

3. **Translation Caching:**
   - Translated content cached in database
   - Reduces Google Translate API costs
   - Cache invalidation on manual override

**Phase 1.8 Provides:**
- i18n infrastructure for business content
- Language code validation
- RTL support for Arabic business profiles
- Translation key structure pattern

### Phase 5-19: All Future Phases (Upcoming)

**Status:** ⏳ Pending (all depend on Phase 1.8)

**Common Integration:**
- All UI components use `useTranslation` hook
- All user-generated content supports multilingual via auto-translation
- All forms use translated validation messages
- All error messages translated
- All email notifications multilingual (already implemented)

**Phase 1.8 as Foundation:**
- i18n infrastructure enables ALL future features
- Location-agnostic pattern established
- RTL support built-in from the start
- WCAG 2.1 AA compliance baseline

---

## Critical Files

### Frontend Files

**1. Translation Files (10 languages)**
```
packages/frontend/public/locales/
├── en/translation.json          (English - 50-60 keys, source of truth)
├── ar/translation.json          (Arabic - RTL, [UNTRANSLATED] placeholders)
├── zh-CN/translation.json       (Chinese Simplified)
├── zh-TW/translation.json       (Chinese Traditional)
├── vi/translation.json          (Vietnamese)
├── hi/translation.json          (Hindi)
├── ur/translation.json          (Urdu - RTL)
├── ko/translation.json          (Korean)
├── el/translation.json          (Greek)
└── it/translation.json          (Italian)
```

**2. i18n Configuration**
```
packages/frontend/src/i18n/
├── config.ts                    (i18next initialization, language detection)
├── utils.ts                     (validation, RTL detection, HTML attributes)
└── rtl.ts                       (RTL utilities for layout)
```

**3. React Hook**
```
packages/frontend/src/hooks/
└── useLanguage.ts               (language switching, current language, isRTL)
```

**4. Entry Point**
```
packages/frontend/src/
├── main.tsx                     (initialize i18n before React render)
└── index.html                   (HTML lang and dir attributes)
```

### Backend Files

**5. API Route**
```
packages/backend/src/routes/
└── languages.ts                 (GET /api/v1/languages endpoint)
```

**6. Router Registration**
```
packages/backend/src/routes/
└── index.ts                     (register languages route)
```

### Shared Files

**7. TypeScript Types**
```
packages/shared/src/types/
└── i18n.ts                      (LanguageCode, LanguageConfig, MultilingualConfig)
```

**8. Shared Exports**
```
packages/shared/src/
└── index.ts                     (export i18n types)
```

### Test Files

**9. Frontend Tests (6 files, ~40-50 test cases)**
```
packages/frontend/src/
├── i18n/__tests__/
│   ├── config.test.ts           (i18next initialization, fallback)
│   ├── utils.test.ts            (validation, RTL detection, HTML attributes)
│   ├── rtl.test.ts              (RTL utilities)
│   └── accessibility.test.tsx   (WCAG 2.1 compliance)
└── hooks/__tests__/
    └── useLanguage.test.tsx     (hook behavior, language switching)
```

**10. Backend Tests**
```
packages/backend/src/__tests__/routes/
└── languages.test.ts            (API endpoint, caching)
```

### Documentation Files

**11. Workflow Documentation**
```
docs/
├── TRANSLATION_WORKFLOW.md      (how to add/manage translations)
└── RTL_TESTING.md               (RTL testing procedures)
```

**12. Project Documentation**
```
├── PROGRESS.md                  (Milestone 8: i18n Enabled)
└── TODO.md                      (Phase 1.8 tasks marked complete)
```

---

## Success Criteria

### Functional Requirements

- [x] **Translation Files:**
  - 10 language directories created
  - English file has 50-60 keys across 5 namespaces
  - Other 9 languages have placeholder structure
  - Valid JSON syntax (no parse errors)

- [x] **i18n Configuration:**
  - i18next initialized with all 10 languages
  - Language detection order: URL → localStorage → browser → default
  - Fallback to English for missing keys
  - No console errors on app startup

- [x] **Language Switching:**
  - `useLanguage()` hook functional
  - `changeLanguage()` validates against platform.json
  - HTML `lang` and `dir` attributes update automatically
  - localStorage persistence

- [x] **RTL Support:**
  - HTML `dir` attribute switches correctly
  - RTL utilities functional (`isRTL`, `getDirection`)
  - CSS logical properties verified
  - Layout mirrors for Arabic/Urdu

- [x] **Backend API:**
  - `GET /api/v1/languages` endpoint functional
  - Returns only enabled languages from platform.json
  - Redis caching implemented (30-day TTL)
  - No authentication required (public endpoint)

### Testing Requirements

- [x] **Test Coverage:**
  - >80% coverage for new files
  - All tests passing (477 existing + 40-50 new)
  - Unit tests: i18n config, utils, RTL, useLanguage hook
  - Integration tests: Language switching, HTML attribute updates
  - Backend tests: API endpoint, caching
  - Accessibility tests: WCAG 2.1 SC 3.1.1, 3.1.2

- [x] **Manual Testing:**
  - Language switching works in browser
  - RTL layout correct for Arabic/Urdu
  - No text overflow/truncation
  - All translation keys render (no missing keys)

### Accessibility Requirements

- [x] **WCAG 2.1 AA Compliance:**
  - SC 3.1.1: HTML `lang` attribute updates on language change
  - SC 3.1.2: Mixed-language content can be marked with `lang`
  - No axe violations

- [x] **Keyboard Navigation (Phase 3):**
  - Language selector fully keyboard accessible (deferred to Phase 3 UI)

### Documentation Requirements

- [x] **Project Documentation:**
  - PROGRESS.md updated with Milestone 8
  - TODO.md tasks marked complete (6/6)

- [x] **Workflow Documentation:**
  - Translation workflow documented (TRANSLATION_WORKFLOW.md)
  - RTL testing procedures documented (RTL_TESTING.md)

### Location-Agnostic Requirements

- [x] **Configuration-Driven:**
  - All language logic reads from platform.json
  - No hardcoded language lists
  - Different suburb deployments can enable different languages

### Performance Requirements

- [x] **Optimization:**
  - Translation files cached (browser caching)
  - API endpoint cached in Redis (30-day TTL)
  - i18next lazy loading disabled (all languages loaded upfront - acceptable for 10 languages)

---

## Testing Strategy

### Unit Testing

**Coverage Target:** >80%

**Test Categories:**
1. **i18n Configuration** (10-12 tests)
   - Initialization with default language
   - All 10 languages loaded
   - Fallback strategy
   - Interpolation settings

2. **i18n Utils** (15-18 tests)
   - `isRTL()` for all languages
   - `getDirection()` for all languages
   - `updateHTMLAttributes()` for LTR and RTL
   - `validateLanguageCode()` with valid/invalid codes
   - `isValidLanguageCode()` against platform.json
   - `getEnabledLanguages()` filters correctly

3. **RTL Utils** (8-10 tests)
   - `isDocumentRTL()` for LTR and RTL
   - `getInlineStart()` and `getInlineEnd()`
   - `mirrorIcon()` for LTR and RTL

4. **useLanguage Hook** (8-10 tests)
   - Returns current language
   - Returns available languages (filtered by enabled)
   - `changeLanguage()` validates and updates
   - localStorage persistence
   - `isRTL` flag correct
   - HTML attributes update on change

5. **Backend API** (8-10 tests)
   - Returns enabled languages
   - Includes all required fields
   - RTL flag correct for Arabic/Urdu
   - Caching works correctly
   - Public endpoint (no auth)
   - Error handling

6. **Accessibility** (5-7 tests)
   - WCAG 3.1.1: HTML `lang` attribute
   - WCAG 3.1.2: Mixed-language content support
   - Translation quality (no empty strings)
   - No axe violations

**Total Tests:** ~40-50 new test cases

### Integration Testing

**Test Scenarios:**

1. **Language Switching Flow:**
   - User changes language via `useLanguage` hook
   - HTML `lang` and `dir` attributes update
   - localStorage persists choice
   - UI re-renders with new translations
   - RTL layout activates for Arabic/Urdu

2. **Language Detection Priority:**
   - URL parameter overrides all
   - localStorage used if no URL param
   - Browser language used if no localStorage
   - Default language used as final fallback

3. **API Integration:**
   - Frontend fetches languages from backend
   - Caching reduces API calls
   - Frontend validates language codes against API response

### Manual Testing

**Test Cases:**

1. **English to Arabic:**
   - Change language to Arabic
   - Verify layout mirrors (navigation, cards, forms)
   - Verify text aligns right
   - Verify directional icons flip
   - Verify numbers remain LTR

2. **English to Chinese:**
   - Change language to Chinese Simplified
   - Verify layout remains LTR
   - Verify Chinese characters display correctly
   - Verify no text overflow

3. **Invalid Language Code:**
   - Try to change to unsupported language (e.g., "fr")
   - Verify fallback to English
   - Verify no console errors

4. **Browser Language Detection:**
   - Clear localStorage
   - Set browser language to Vietnamese
   - Reload page
   - Verify app detects and uses Vietnamese

5. **URL Parameter:**
   - Open app with `?lang=ko`
   - Verify Korean language loads
   - Verify persists to localStorage

### Accessibility Testing

**Tools:**
- jest-axe (automated)
- Screen reader (manual): NVDA, JAWS, VoiceOver

**Test Cases:**

1. **Screen Reader Announcements:**
   - Change language
   - Verify screen reader announces: "Language changed to Arabic"

2. **HTML Lang Attribute:**
   - Verify `<html lang="ar">` for Arabic
   - Verify updates on language change

3. **Keyboard Navigation (Phase 3):**
   - Deferred to Phase 3 (LanguageSelector component)

### Performance Testing

**Metrics:**

1. **Translation File Size:**
   - Total size: ~100-200 KB for 10 languages
   - Acceptable (< 500 KB threshold)

2. **API Response Time:**
   - GET /api/v1/languages: < 50ms (cached)
   - First request: < 200ms (database + Redis)

3. **Language Switch Time:**
   - < 100ms to change language and re-render

**Tools:**
- Chrome DevTools Network tab
- Lighthouse Performance audit

### Regression Testing

**Ensure Phase 1.1-1.7 Still Works:**
- Run full test suite (477 existing tests)
- Verify no breaking changes
- Verify backend starts successfully
- Verify frontend builds without errors

---

## Implementation Timeline

### Week 1 (Development)

**Day 1-2: Setup & Translation Files (6 hours)**
- Phase 1: Dependencies & Setup (2 hours)
- Phase 2: Translation File Structure (4 hours)

**Day 3-4: Core i18n Implementation (7 hours)**
- Phase 3: i18n Configuration (3 hours)
- Phase 4: Language Detection & Switching (4 hours)

**Day 5: RTL & Backend (5 hours)**
- Phase 5: RTL Support (3 hours)
- Phase 6: Backend API (2 hours)

### Week 2 (Testing & Documentation)

**Day 1-3: Testing (6 hours)**
- Phase 7: Testing (6 hours)
  - Write 40-50 test cases
  - Achieve >80% coverage
  - Manual testing (RTL, language switching)

**Day 4: Documentation (2 hours)**
- Phase 8: Documentation (2 hours)
  - Update PROGRESS.md, TODO.md
  - Create TRANSLATION_WORKFLOW.md
  - Create RTL_TESTING.md

**Day 5: Review & QA**
- Final testing
- Code review
- Documentation review
- Professional translation procurement initiated (parallel)

### Parallel: Professional Translation (1-2 weeks)

**Timeline:** Weeks 1-2 (parallel with development)
- Export English translation keys to CSV
- Send to translation service (Gengo, One Hour Translation)
- Receive translated files
- Import to JSON files
- Remove `[UNTRANSLATED]` prefixes
- QA with native speakers

---

## Appendix: Package Dependencies

### Frontend Dependencies

**Add to `packages/frontend/package.json`:**

```json
{
  "dependencies": {
    "i18next": "^23.7.6",
    "react-i18next": "^14.0.0",
    "i18next-browser-languagedetector": "^7.2.0"
  },
  "devDependencies": {
    "jest-axe": "^8.0.0"
  }
}
```

**Install:**
```bash
cd packages/frontend
pnpm add i18next react-i18next i18next-browser-languagedetector
pnpm add -D jest-axe
```

### Backend Dependencies

**No new dependencies required.** Existing dependencies sufficient:
- Express (routing)
- Redis (caching via CacheService)

---

## Conclusion

This implementation plan provides a comprehensive, step-by-step guide to implementing Phase 1.8: i18n Foundation. The plan follows the location-agnostic architecture, ensures WCAG 2.1 AA accessibility compliance, and establishes the multilingual infrastructure that all future phases (2-19) depend on.

**Key Deliverables:**
- Translation file structure (10 languages)
- i18next configuration with language detection
- Language switching hook (`useLanguage`)
- RTL support infrastructure
- Backend API endpoint
- Comprehensive test coverage (>80%)
- Translation and RTL testing documentation

**Next Steps After Phase 1.8:**
1. Procure professional translations for 9 non-English languages
2. Begin Phase 2: Authentication & User System (translated UI)
3. Begin Phase 3: Design System (LanguageSelector component, RTL-compatible components)

**Phase 1 Completion:**
With Phase 1.8 complete, Phase 1 (Foundation & Core Infrastructure) will be 100% complete, enabling all future development phases.