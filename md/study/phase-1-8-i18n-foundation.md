# Phase 1.8 - i18n Foundation: Comprehensive Research

**Research Date:** 2026-02-06
**Platform:** Community Hub (Location-Agnostic Digital Community Improvement Hub)
**Specification Version:** 2.0 (January 2026)
**Current Status:** Not Started (0/6 tasks complete)

---

## Table of Contents

1. [Overview](#overview)
2. [Specification Reference](#specification-reference)
3. [Components & Requirements](#components--requirements)
4. [Data Models](#data-models)
5. [API Endpoints](#api-endpoints)
6. [Business Rules & Logic](#business-rules--logic)
7. [Location-Agnostic Considerations](#location-agnostic-considerations)
8. [Multilingual & Internationalization](#multilingual--internationalization)
9. [Accessibility (WCAG 2.1 AA)](#accessibility-wcag-21-aa)
10. [Security Requirements](#security-requirements)
11. [Current Status](#current-status)
12. [Dependencies & Relationships](#dependencies--relationships)
13. [Key Files & Locations](#key-files--locations)
14. [Testing Requirements](#testing-requirements)
15. [Known Blockers / Notes](#known-blockers--notes)
16. [Specification Compliance Checklist](#specification-compliance-checklist)
17. [Summary](#summary)

---

## Overview

**Phase 1.8: i18n Foundation** is the final sub-phase of Phase 1 (Foundation & Core Infrastructure) that establishes the multilingual infrastructure required for the platform. This phase is **critical** as multilingual support must be built in from the start, not retrofitted. The platform must support 10 languages including RTL (right-to-left) support for Arabic and Urdu.

**Purpose:**
Enable the Community Hub platform to serve diverse multicultural communities by providing full translation infrastructure, language detection, language switching UI, and RTL (right-to-left) layout support.

**Current Status:** Not started (0/6 tasks complete)
**Dependencies:** Phase 1.1-1.7 must be complete (currently at 88%)
**Blocking:** All future phases (Phases 2-19) depend on i18n infrastructure being in place

**Key Principle (from Spec):**
> "Multilingual Support: 10 languages including RTL (Arabic, Urdu) - must be built in from the start, not retrofitted" (CLAUDE.md, line 105)

---

## Specification Reference

**Primary Specification:**
- **Document:** `Docs/Community_Hub_Specification_v2.md` (v2.0, January 2026)
- **Section:** §8 Multilingual Support (lines 1413-1500)
- **Related Sections:**
  - §2.4 Platform Configuration - `multilingual` object (lines 308-322)
  - §6 Design Specifications - Typography for multiple scripts
  - §7 UI States & Components - Direction-aware components
  - §9 Onboarding - Language selection (line 1526)
  - Appendix B.17 Languages & Translations API endpoints (lines 3998-4005)

**Key Specification Details:**

| Feature | Specification |
|---------|---------------|
| Total Languages | 10 (English + 9 others) |
| RTL Languages | 2 (Arabic, Urdu) |
| Default Language | English (en) |
| Translation Format | JSON files per language |
| Auto-Translation | Google Translate API (confirmed) |
| Fallback Strategy | Missing translations fall back to English |
| Translation Management | Admin interface for editing (Phase 15) |

---

## Components & Requirements

### Task 1: Implement Translation File Structure (JSON per language)

**What:** Create structured JSON files for each of the 10 supported languages
**Purpose:** Store all UI strings, messages, labels, and system text in translatable format
**Location:** `packages/frontend/public/locales/{language_code}/translation.json`

**Structure:**
```
packages/frontend/public/locales/
├── en/
│   └── translation.json  (English - Primary)
├── ar/
│   └── translation.json  (Arabic - RTL, High priority)
├── zh-CN/
│   └── translation.json  (Chinese Simplified - High priority)
├── zh-TW/
│   └── translation.json  (Chinese Traditional - Medium priority)
├── vi/
│   └── translation.json  (Vietnamese - High priority)
├── hi/
│   └── translation.json  (Hindi - Medium priority)
├── ur/
│   └── translation.json  (Urdu - RTL, Medium priority)
├── ko/
│   └── translation.json  (Korean - Low priority)
├── el/
│   └── translation.json  (Greek - Low priority)
└── it/
    └── translation.json  (Italian - Low priority)
```

**Supported Languages (from platform.json lines 102-131):**

| Language | Code | Native Name | RTL | Priority | Enabled |
|----------|------|-------------|-----|----------|---------|
| English | en | English | No | Primary | Yes |
| Arabic | ar | العربية | Yes | High | Yes |
| Chinese (Simplified) | zh-CN | 简体中文 | No | High | Yes |
| Chinese (Traditional) | zh-TW | 繁體中文 | No | Medium | Yes |
| Vietnamese | vi | Tiếng Việt | No | High | Yes |
| Hindi | hi | हिन्दी | No | Medium | Yes |
| Urdu | ur | اردو | Yes | Medium | Yes |
| Korean | ko | 한국어 | No | Low | Yes |
| Greek | el | Ελληνικά | No | Low | Yes |
| Italian | it | Italiano | No | Low | Yes |

**Translation Keys Organization:**
```json
{
  "common": {
    "loading": "Loading...",
    "error": "An error occurred",
    "save": "Save",
    "cancel": "Cancel",
    "submit": "Submit"
  },
  "navigation": {
    "home": "Home",
    "businesses": "Businesses",
    "events": "Events",
    "deals": "Deals"
  },
  "auth": {
    "login": "Log In",
    "register": "Sign Up",
    "logout": "Log Out"
  },
  "business": {
    "openNow": "Open Now",
    "closed": "Closed",
    "getDirections": "Get Directions"
  }
}
```

**Initial Translation Scope (Phase 1.8):**
- Common UI elements (buttons, labels, messages)
- Navigation menus
- Form validation messages
- Loading states
- Error messages (client-side)
- Skip link text (already exists: "Skip to main content")

**Note:** Professional translation procurement for non-English languages is recommended (Spec §8.2, line 1450).

### Task 2: Set Up Language Detection (browser, user preference, URL)

**What:** Implement automatic language detection with multiple fallback strategies
**Purpose:** Automatically determine the best language to display based on user context
**Priority Order:**
1. User preference (if logged in and language set in profile)
2. Browser language (navigator.language / navigator.languages)
3. URL parameter (`?lang=ar`)
4. Platform default (en from platform.json)

**Detection Logic:**
```
1. Check if user is authenticated
   └─> If yes: Load user.language_preference from database
       └─> If set: Use that language

2. Check URL query parameter (?lang=CODE)
   └─> If valid language code: Use that language and persist to localStorage

3. Check localStorage ('community-hub-language')
   └─> If set and valid: Use that language

4. Check browser language (navigator.language)
   └─> If supported language: Use that language
   └─> If not supported: Check navigator.languages array
       └─> Find first supported language

5. Fallback to platform default (en)
```

**Implementation Considerations:**
- Must respect user privacy (don't persist without consent)
- Must handle language codes with regions (e.g., "zh-CN", "zh-TW")
- Must validate language code against platform.json supported languages
- Must check `enabled: true` flag for each language

**Browser Language Matching:**
```typescript
// Example: navigator.language = "zh-TW" → match "zh-TW"
// Example: navigator.language = "en-US" → match "en"
// Example: navigator.language = "fr-FR" → fallback to "en" (not supported)
```

### Task 3: Implement Language Switching UI Component

**What:** Create a language selector component in the header
**Purpose:** Allow users to manually switch languages
**Location:** Header component (Phase 3)
**Spec Reference:** §8.5 User Language (lines 1485-1493)

**Component Specifications:**

| Element | Specification |
|---------|---------------|
| Icon | Globe icon (🌐) |
| Label | Current language native name (e.g., "English", "العربية") |
| Trigger | Button or dropdown |
| Menu | All enabled languages from platform.json |
| Display | Native name of each language |
| Selection | Updates app language immediately |
| Persistence | Saves to localStorage (and user profile if logged in) |

**Accessibility Requirements:**
- `<button>` with `aria-label="Select language"` (or translated equivalent)
- `<select>` or ARIA `role="menu"` for dropdown
- Keyboard navigable (↑↓ arrow keys, Enter to select)
- Focus visible indicator
- Screen reader announces current language and available options

**Visual Design (to be implemented in Phase 3):**
- Globe icon 24px × 24px
- Current language text (e.g., "English")
- Dropdown/modal showing all 10 languages
- Native name display (not translated, e.g., "العربية" not "Arabic")
- Checkmark or highlight on current language

**Behavior:**
1. User clicks language selector
2. Dropdown/modal opens with all enabled languages
3. User selects new language
4. UI re-renders in new language immediately
5. Language persisted to localStorage
6. If user is logged in, update user.language_preference via API (Phase 2)

**Phase 1.8 Implementation:**
- Hook/function to change language (`useLanguage` or `i18n.changeLanguage()`)
- Persistence logic (localStorage)
- Language validation
- UI component implementation deferred to Phase 3 (design system)

### Task 4: Configure RTL Support Infrastructure (Arabic, Urdu)

**What:** Implement right-to-left (RTL) layout infrastructure
**Purpose:** Enable correct text direction and layout mirroring for Arabic and Urdu
**Spec Reference:** §8.4 RTL Support (lines 1471-1482)

**RTL Requirements (from Spec):**

| Element | Behaviour |
|---------|-----------|
| Text Direction | Right-to-left for Arabic (ar), Urdu (ur) |
| Layout Mirroring | Navigation, cards, forms flip horizontally |
| Icons | Direction-aware icons mirrored (arrows, etc.) |
| Numbers | Left-to-right within RTL text |
| Mixed Content | Bidirectional text handling (e.g., "Visit www.example.com today") |

**Implementation Strategy:**

**1. HTML `dir` Attribute:**
```html
<html dir="ltr">  <!-- Default: left-to-right -->
<html dir="rtl">  <!-- RTL languages: Arabic, Urdu -->
```

**2. CSS Logical Properties:**
Use logical properties instead of physical properties for automatic RTL support:
```css
/* ❌ Don't use physical properties */
margin-left: 16px;
padding-right: 8px;
text-align: left;

/* ✅ Use logical properties */
margin-inline-start: 16px;  /* left in LTR, right in RTL */
padding-inline-end: 8px;    /* right in LTR, left in RTL */
text-align: start;          /* left in LTR, right in RTL */
```

**3. Tailwind CSS RTL Support:**
Tailwind CSS 4 has built-in RTL support via logical properties. Current implementation uses Tailwind 4 (Phase 1.4).

**4. Direction-Aware Icons:**
```css
/* Mirror directional icons in RTL */
html[dir="rtl"] .icon-arrow-right {
  transform: scaleX(-1);
}
```

**5. Number Direction:**
Numbers should remain LTR even in RTL text:
```html
<!-- Example: "السعر: 50$" (price in Arabic) -->
<span dir="rtl">السعر: <span dir="ltr">50$</span></span>
```

**RTL Testing Checklist:**
- [ ] Navigation menu flips (items align right)
- [ ] Card layouts mirror (image right, text left)
- [ ] Form fields align right
- [ ] Buttons with icons (icon on left in RTL)
- [ ] Modals/dialogs close button position
- [ ] Breadcrumbs reverse order
- [ ] Pagination controls mirror

**Browser Testing:**
- Chrome/Edge DevTools: Rendering → Text direction → RTL
- Firefox DevTools: Accessibility → Simulate → Direction

### Task 5: Set Up Translation Key Management Workflow

**What:** Establish process for adding, updating, and managing translation keys
**Purpose:** Ensure consistency and completeness across all languages
**Scope:** Developer workflow, not admin UI (admin UI in Phase 15)

**Workflow for Adding New Translations:**

1. **Developer adds English key:**
   ```json
   // packages/frontend/public/locales/en/translation.json
   {
     "business": {
       "viewDetails": "View Details"  // ← New key
     }
   }
   ```

2. **Add placeholder to other languages:**
   ```json
   // packages/frontend/public/locales/ar/translation.json
   {
     "business": {
       "viewDetails": "[UNTRANSLATED] View Details"  // ← Placeholder
     }
   }
   ```

3. **Track missing translations:**
   - Script to detect missing keys across languages
   - CI check to warn on untranslated keys
   - Report of keys needing translation

4. **Professional translation:**
   - Export untranslated keys to CSV
   - Send to translation service
   - Import translations back to JSON

**Translation Management Tools (for consideration):**
- `i18next-scanner`: Extract translation keys from code
- `i18next-parser`: Parse code to find translation usage
- Manual review for Phase 1.8 (small scope)

**Fallback Strategy:**
If translation key missing in selected language:
1. Check if key exists in English (default language)
2. If exists: Display English text + log warning
3. If not exists: Display key name (e.g., "business.viewDetails") + error

**Validation:**
- All English keys exist in all language files (can be untranslated placeholder)
- No orphaned keys (keys in non-English files that don't exist in English)
- JSON syntax valid for all files
- Translation variable placeholders match (e.g., `{{userName}}`)

### Task 6: Implement Text Direction Switching (LTR/RTL)

**What:** Dynamic switching of `dir` attribute and CSS direction
**Purpose:** Update layout direction when language changes
**Integration:** Works with language switching (Task 3)

**Implementation:**

**1. Detect if Current Language is RTL:**
```typescript
// Get RTL flag from platform.json supportedLanguages
const rtlLanguages = ['ar', 'ur'];  // Arabic, Urdu
const isRTL = rtlLanguages.includes(currentLanguage);
```

**2. Update HTML `dir` Attribute:**
```typescript
// On language change:
document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
```

**3. Update CSS Variables (if needed):**
```typescript
// Example: Set text-align based on direction
document.documentElement.style.setProperty(
  '--text-align-start',
  isRTL ? 'right' : 'left'
);
```

**4. Re-render Components:**
React components should automatically respond to `dir` attribute changes if using logical CSS properties.

**Testing:**
- Switch from English to Arabic → layout should mirror
- Switch from Arabic to English → layout should flip back
- Switch from English to Chinese → layout stays LTR
- Numbers remain LTR in all languages

**Edge Cases:**
- Mixed LTR/RTL content (e.g., English product name in Arabic description)
- Embedded content (maps, images, videos) should not flip
- Icons should mirror only if directional (arrows, navigation)

---

## Data Models

**No new database models required for Phase 1.8.** However, existing models have multilingual fields:

### Existing Multilingual Fields (from Appendix A)

**Category Model (A.16):**
- `name`: JSON (multilingual: `{ "en": "Restaurants", "ar": "مطاعم" }`)

**EmailTemplate Model (A.19):**
- `subject`: JSON (multilingual)
- `body_html`: JSON (multilingual)
- `body_text`: JSON (multilingual)

**SystemSetting Model (A.20):**
- `title`: JSON (multilingual)
- `description`: JSON (multilingual)

**SurveyQuestion Model (A.21):**
- `question`: JSON (multilingual)

**User Model (A.1) - Language Preference:**
- `language_preference`: String (language code, e.g., "en", "ar")
- Default: null (use browser detection)
- Updated via user profile settings (Phase 2)

### Future Models (Phase 2+) with Multilingual Fields

**Business Model (A.2):**
- `description`: Text (multilingual via auto-translation or manual)

**Event Model (A.3):**
- `description`: Text (multilingual)

**Review Model (A.4):**
- `language`: String (detected from user's language at time of writing)

**Deal Model (A.6):**
- `description`: Text (multilingual)

---

## API Endpoints

**From Appendix B.17 Languages & Translations (lines 3998-4005):**

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /languages | List supported languages | Public |
| GET | /translations/:lang | Get translations for language | Public |
| POST | /translate | Request on-demand translation | User |

### Endpoint 1: GET /api/v1/languages

**Purpose:** Return list of enabled languages from platform.json
**Authentication:** Public (no auth required)
**Response:**
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

**Business Rules:**
- Only return languages where `enabled: true` in platform.json
- Order: Default language first, then by priority (High, Medium, Low), then alphabetically

**Implementation:**
```typescript
// packages/backend/src/routes/languages.ts
import { getPlatformConfig } from '@community-hub/shared';

export async function getLanguages(req, res) {
  const config = await getPlatformConfig();
  const { defaultLanguage, supportedLanguages } = config.multilingual;

  const enabledLanguages = supportedLanguages
    .filter(lang => lang.enabled)
    .map(({ code, name, nativeName, rtl }) => ({
      code, name, nativeName, rtl
    }));

  res.json({
    defaultLanguage,
    languages: enabledLanguages
  });
}
```

### Endpoint 2: GET /api/v1/translations/:lang

**Purpose:** Serve translation JSON for a specific language
**Authentication:** Public
**Parameters:**
- `lang`: Language code (e.g., "en", "ar", "zh-CN")

**Response:**
```json
{
  "language": "en",
  "translations": {
    "common": {},
    "navigation": {}
  }
}
```

**Error Cases:**
- 404: Language code not supported
- 500: Translation file not found or corrupted

**Implementation:**
- Read from `packages/frontend/public/locales/{lang}/translation.json`
- Validate language code against platform.json
- Cache in Redis (30 days TTL, invalidate on file change)

### Endpoint 3: POST /api/v1/translate

**Purpose:** On-demand translation of user content using Google Translate API
**Authentication:** Authenticated user required
**Spec Reference:** §8.3 Auto-Translation (lines 1464-1470)
**Implementation:** **Deferred to Phase 4** (requires business content)

**Request Body:**
```json
{
  "text": "Welcome to our restaurant",
  "sourceLang": "en",
  "targetLang": "ar"
}
```

**Response:**
```json
{
  "originalText": "Welcome to our restaurant",
  "translatedText": "مرحبا بكم في مطعمنا",
  "sourceLang": "en",
  "targetLang": "ar",
  "autoTranslated": true
}
```

**Business Rules (Phase 4+):**
- Translation indicated as "Auto-translated" in UI
- Owner can override with manual translation
- Translations cached in database
- Rate limiting: 100 requests per hour per user

---

## Business Rules & Logic

### Language Selection Priority

1. **User Profile Language (Phase 2+):**
   - If user is authenticated and `user.language_preference` is set
   - Highest priority
   - Persisted across sessions and devices

2. **URL Parameter:**
   - `?lang=ar` overrides all other detection
   - Persists to localStorage
   - Useful for sharing links in specific language

3. **Local Storage:**
   - `localStorage.getItem('community-hub-language')`
   - Persists language choice for unauthenticated users
   - Cleared on browser data clear

4. **Browser Language:**
   - `navigator.language` or `navigator.languages[0]`
   - Automatic detection
   - Fallback if no preference set

5. **Platform Default:**
   - `platform.json → multilingual.defaultLanguage` (always "en")
   - Final fallback

### Fallback Strategy

**Missing Translation Key:**
```
User selects Arabic (ar)
→ App looks for key "business.viewDetails" in ar/translation.json
  → If exists: Display Arabic translation
  → If missing: Check en/translation.json
    → If exists: Display English text + console.warn()
    → If missing: Display key name "business.viewDetails" + console.error()
```

**Missing Translation File:**
```
User selects Italian (it)
→ App tries to load it/translation.json
  → If 404: Fallback to en/translation.json
  → Show notification: "Translations not available, displaying in English"
```

### RTL Layout Rules

**Elements that MUST mirror in RTL:**
- Navigation menus (align right)
- Breadcrumbs (reverse order)
- Cards with image + text (image on right)
- Form field labels (align right)
- Buttons with icons (icon on left)
- Pagination (previous/next swap)
- Modals (close button on left)

**Elements that MUST NOT mirror:**
- Numbers (always LTR)
- Email addresses (always LTR)
- URLs (always LTR)
- Phone numbers (always LTR)
- Maps (geographic orientation)
- Images/photos (don't flip)
- Videos (don't flip)
- Charts/graphs (maintain data orientation)

### Language Code Validation

**Valid Language Codes:**
- Must match one of the 10 supported languages
- Format: `"en"`, `"ar"`, `"zh-CN"`, `"zh-TW"` (BCP 47)
- Case-sensitive (lowercase, except region code)
- Must have `enabled: true` in platform.json

**Invalid Language Codes:**
- `"fr"` (French - not supported)
- `"zh"` (ambiguous - must specify CN or TW)
- `"EN"` (uppercase - invalid)
- `""` (empty string)
- `null`, `undefined`

---

## Location-Agnostic Considerations

**Critical Requirement:**
All language configuration must come from `config/platform.json`, never hardcoded in source code.

### Configuration-Driven Languages

**Source of Truth:**
```json
// config/platform.json
{
  "multilingual": {
    "defaultLanguage": "en",
    "supportedLanguages": [],
    "autoTranslationEnabled": true
  }
}
```

**Deployment Flexibility:**
- Different suburbs may enable different subsets of languages
- Example: A suburb with large Italian community might prioritize Italian over Korean
- Adjust by setting `enabled: false` for languages not needed

**Example: Different Suburb Configuration:**
```json
// config/platform.cabramatta.json (hypothetical)
{
  "multilingual": {
    "defaultLanguage": "en",
    "supportedLanguages": [
      { "code": "en", "enabled": true },
      { "code": "zh-CN", "enabled": true },
      { "code": "vi", "enabled": true },
      { "code": "ko", "enabled": true }
    ]
  }
}
```

### No Hardcoded Language Logic

**❌ Don't Do This:**
```typescript
const languages = ['en', 'ar', 'zh-CN'];  // Hardcoded list
```

**✅ Do This:**
```typescript
import { getPlatformConfig } from '@community-hub/shared';

const config = await getPlatformConfig();
const languages = config.multilingual.supportedLanguages
  .filter(lang => lang.enabled)
  .map(lang => lang.code);
```

---

## Multilingual & Internationalization

This entire phase IS multilingual support. Key i18n principles:

### Content Types

**1. UI Translations (Static):**
- Buttons, labels, navigation
- Success/error messages
- Form validations
- Tooltips, help text
- Managed via JSON translation files

**2. User-Generated Content (Dynamic):**
- Business descriptions (auto-translated on demand)
- Event descriptions (auto-translated on demand)
- Reviews (language detected, stored in original + translated)
- Noticeboard posts (multilingual)
- Managed via Google Translate API (Phase 4+)

**3. System Content (Pre-Translated):**
- Email templates (already implemented in Phase 1.6)
- Category names (seeded in database)
- System settings titles/descriptions
- Managed via database JSON fields

### Translation Quality

**Professional Translation:**
- Initial Phase 1.8 UI strings: Professional translation recommended
- Cost: ~$0.10-0.25 per word × 9 languages × ~500 words = ~$450-$1,125
- Quality: High accuracy, culturally appropriate

**Community Translation (Phase 15+):**
- Community members can suggest translation improvements
- Moderators review and approve changes
- Gamification: Translation contribution points

**Auto-Translation (Phase 4+):**
- Google Translate API for user content
- Indicated as "Auto-translated" in UI
- Users can flag poor translations
- Business owners can override with manual translation

---

## Accessibility (WCAG 2.1 AA)

### Language Switching Accessibility

**WCAG 2.1 Success Criteria:**

**SC 3.1.1 Language of Page (Level A):**
- `<html lang="en">` (or current language code)
- Must update when language changes
- Screen readers announce language change

**Implementation:**
```typescript
document.documentElement.setAttribute('lang', currentLanguage);
```

**SC 3.1.2 Language of Parts (Level AA):**
- Mixed-language content must be marked
- Example: English business name in Arabic description
```html
<p lang="ar">
  مرحبا بكم في <span lang="en">Joe's Cafe</span>
</p>
```

**SC 2.4.4 Link Purpose (Level A):**
- Language switcher button must have clear label
```html
<button aria-label="Select language" aria-expanded="false">
  <span aria-hidden="true">🌐</span>
  <span>English</span>
</button>
```

**Keyboard Navigation:**
- Language selector must be fully keyboard accessible
- Tab to button → Enter to open menu
- Arrow keys to navigate languages
- Enter to select language
- Esc to close menu without changing language

**Screen Reader Announcements:**
```html
<div role="status" aria-live="polite">
  Language changed to Arabic
</div>
```

### RTL Accessibility

**Focus Indicators:**
- Must mirror in RTL (outline on right side for RTL)
- Must maintain 2px solid outline (Spec §3.6)

**Skip Links:**
- Already implemented: "Skip to main content"
- Must translate in all languages
- Must remain left-aligned even in RTL (convention)

**Form Labels:**
- Must align correctly in RTL (right-aligned)
- `<label>` associated with `<input>` via `for` attribute
- Error messages announce in screen reader

---

## Security Requirements

### Input Validation

**Language Code Validation:**
```typescript
// Validate against platform.json supported languages
const validLanguageCodes = config.multilingual.supportedLanguages
  .filter(lang => lang.enabled)
  .map(lang => lang.code);

if (!validLanguageCodes.includes(requestedLang)) {
  throw new Error('Invalid language code');
}
```

**XSS Protection in Translations:**
- Translation JSON files are static (not user-editable in Phase 1.8)
- No HTML allowed in translation strings (plain text only)
- Variable interpolation must escape HTML: `{{userName}}` → escaped
- Rich text translations (email templates) use DOMPurify (already implemented Phase 1.5)

### Translation File Integrity

**File Permissions:**
- Translation JSON files: Read-only for application
- Only admins can modify (via deployment, not runtime in Phase 1.8)
- Phase 15: Admin UI to edit translations (with audit log)

**JSON Validation:**
- All translation files must be valid JSON
- CI/CD pipeline validates JSON syntax before deployment
- Invalid JSON = deployment fails

### Privacy Considerations

**Language Preference Storage:**
- `localStorage` is client-side only (no server tracking without consent)
- If user is not authenticated: Only store in localStorage
- If user is authenticated: Store in `user.language_preference` (requires user account)
- No tracking of language changes without user consent

**Browser Language Detection:**
- Reading `navigator.language` is passive (no permission required)
- No telemetry sent to server (unless user consents to analytics)
- Language detection does not identify individual users

---

## Current Status

**Phase 1 Overall:** 88% complete (52/59 tasks)
**Phase 1.8:** 0% complete (0/6 tasks)

### Completed in Phase 1.1-1.7

**Configuration Infrastructure (Phase 1.2):**
- ✅ `config/platform.json` with `multilingual` object
- ✅ Platform config loader (frontend + backend)
- ✅ Config validation with Zod schema

**Email Templates (Phase 1.6):**
- ✅ Multilingual email templates (10 languages)
- ✅ Email template seeding to database
- ✅ Template rendering with Handlebars
- ✅ RTL support in email base template (`dir="rtl"` for ar, ur)

**Frontend Infrastructure (Phase 1.4):**
- ✅ React 19 with TypeScript
- ✅ Component architecture
- ✅ Tailwind CSS 4 (has built-in RTL support via logical properties)

**Testing Infrastructure:**
- ✅ Vitest testing framework
- ✅ React Testing Library
- ✅ 477 tests passing across 52 test files

### Remaining for Phase 1.8

- [ ] Task 1: Translation file structure (JSON per language)
- [ ] Task 2: Language detection (browser, user preference, URL)
- [ ] Task 3: Language switching UI component
- [ ] Task 4: RTL support infrastructure
- [ ] Task 5: Translation key management workflow
- [ ] Task 6: Text direction switching (LTR/RTL)

---

## Dependencies & Relationships

### Dependencies (Required Before Phase 1.8)

**Phase 1.1-1.7:** Complete (52/53 tasks, 1 deferred to Phase 19)
- ✅ Platform config system (reads multilingual settings)
- ✅ Frontend infrastructure (React, TypeScript, Tailwind)
- ✅ Testing framework (Vitest)
- ✅ Email templates (already multilingual)

### What Phase 1.8 Enables (Blocking)

**ALL Future Phases (Phase 2-19):**
- Phase 2: Authentication UI (login/register forms must be translated)
- Phase 3: Design System (all components must support RTL)
- Phase 4: Business Directory (business content multilingual)
- Phase 5: Search & Discovery (search UI translated)
- Phase 6: Reviews & Ratings (reviews in multiple languages)
- Phase 7: Business Owner Dashboard (translated UI)
- Phase 8: Events (event descriptions multilingual)
- Phase 9: Messaging (messages translated)
- Phase 10: Deals (promotion descriptions multilingual)
- Phase 11-19: All require i18n foundation

**Critical Path:**
```
Phase 1.8 (i18n) → Phase 2 (Auth) + Phase 3 (Design) → Phase 4 (Business) → All other phases
```

### Related Specifications

**Section 2.4 Platform Configuration:**
- `multilingual` object defines languages
- `defaultLanguage` fallback

**Section 8 Multilingual Support:**
- Primary specification for this phase
- Translation management, RTL, language selection

**Section 9 Onboarding:**
- Language selection step in onboarding flow (Step 2)
- Requires language switcher component from Phase 1.8

**Appendix B.17 API Endpoints:**
- `/languages` - list supported languages
- `/translations/:lang` - serve translation JSON
- `/translate` - auto-translation (Phase 4+)

---

## Key Files & Locations

### Files to Create (Phase 1.8)

**Translation Files:**
```
packages/frontend/public/locales/
├── en/translation.json          (English - PRIMARY)
├── ar/translation.json          (Arabic - RTL, High priority)
├── zh-CN/translation.json       (Chinese Simplified - High priority)
├── zh-TW/translation.json       (Chinese Traditional - Medium)
├── vi/translation.json          (Vietnamese - High priority)
├── hi/translation.json          (Hindi - Medium)
├── ur/translation.json          (Urdu - RTL, Medium)
├── ko/translation.json          (Korean - Low)
├── el/translation.json          (Greek - Low)
└── it/translation.json          (Italian - Low)
```

**Frontend Components/Hooks:**
```
packages/frontend/src/
├── i18n/
│   ├── config.ts                (i18next configuration)
│   ├── detect-language.ts       (browser/URL/localStorage detection)
│   └── utils.ts                 (helper functions)
├── hooks/
│   └── useLanguage.ts           (language switching hook)
└── components/ui/
    └── LanguageSelector.tsx     (Phase 3: dropdown component)
```

**Backend API Routes:**
```
packages/backend/src/routes/
└── languages.ts                 (GET /api/v1/languages endpoint)
```

**Shared Types:**
```
packages/shared/src/types/
└── i18n.ts                      (TypeScript types for languages)
```

**Test Files:**
```
packages/frontend/src/
├── i18n/__tests__/
│   ├── config.test.ts
│   ├── detect-language.test.ts
│   └── utils.test.ts
└── hooks/__tests__/
    └── useLanguage.test.ts

packages/backend/src/__tests__/routes/
└── languages.test.ts
```

### Files to Modify (Phase 1.8)

**Platform Configuration:**
- `config/platform.json` - **No changes needed** (already has `multilingual` object)

**Frontend Entry Point:**
- `packages/frontend/src/main.tsx` - Initialize i18next before rendering
- Add language detection and i18n provider

**HTML Template:**
- `packages/frontend/index.html` - Add `lang="en"` and `dir="ltr"` attributes

**Shared Package Exports:**
- `packages/shared/src/index.ts` - Export i18n types

**Package Dependencies:**
- `packages/frontend/package.json` - Add i18next libraries

### Existing Files to Reference

**Configuration:**
- `config/platform.json` (lines 100-133) - `multilingual` object

**Email Templates:**
- `packages/backend/src/db/seeds/email-templates.ts` - Example of multilingual JSON structure

**Platform Config Loader:**
- `packages/frontend/src/config/platform-loader.ts` - Loads config from backend
- `packages/backend/src/config/platform-loader.ts` - Serves config

**Feature Flag Hook:**
- `packages/frontend/src/hooks/useFeatureFlag.ts` - Pattern for React hooks

---

## Testing Requirements

### Unit Tests

**Frontend i18n Configuration:**
```typescript
// packages/frontend/src/i18n/__tests__/config.test.ts
describe('i18n Configuration', () => {
  it('should initialize with default language', () => {
    expect(i18n.language).toBe('en');
  });

  it('should load translation resources for all languages', () => {
    const languages = Object.keys(i18n.store.data);
    expect(languages).toContain('en');
    expect(languages).toContain('ar');
    expect(languages).toContain('zh-CN');
  });

  it('should fall back to English for missing keys', () => {
    i18n.changeLanguage('ar');
    const translation = i18n.t('nonexistent.key');
    expect(translation).toBe('nonexistent.key');
  });
});
```

**Language Detection:**
```typescript
// packages/frontend/src/i18n/__tests__/detect-language.test.ts
describe('detectLanguage', () => {
  it('should detect language from URL parameter', () => {
    window.location.search = '?lang=ar';
    expect(detectLanguage()).toBe('ar');
  });

  it('should detect language from localStorage', () => {
    localStorage.setItem('community-hub-language', 'zh-CN');
    expect(detectLanguage()).toBe('zh-CN');
  });

  it('should detect language from browser', () => {
    Object.defineProperty(navigator, 'language', {
      value: 'vi',
      writable: true
    });
    expect(detectLanguage()).toBe('vi');
  });

  it('should fall back to default language', () => {
    localStorage.clear();
    window.location.search = '';
    Object.defineProperty(navigator, 'language', {
      value: 'fr',
      writable: true
    });
    expect(detectLanguage()).toBe('en');
  });

  it('should validate language code against platform config', () => {
    expect(detectLanguage('invalid')).toBe('en');
  });
});
```

**RTL Support:**
```typescript
// packages/frontend/src/i18n/__tests__/rtl.test.ts
describe('RTL Support', () => {
  it('should set dir="rtl" for Arabic', () => {
    changeLanguage('ar');
    expect(document.documentElement.getAttribute('dir')).toBe('rtl');
  });

  it('should set dir="rtl" for Urdu', () => {
    changeLanguage('ur');
    expect(document.documentElement.getAttribute('dir')).toBe('rtl');
  });

  it('should set dir="ltr" for English', () => {
    changeLanguage('en');
    expect(document.documentElement.getAttribute('dir')).toBe('ltr');
  });

  it('should set dir="ltr" for Chinese', () => {
    changeLanguage('zh-CN');
    expect(document.documentElement.getAttribute('dir')).toBe('ltr');
  });
});
```

**Backend API:**
```typescript
// packages/backend/src/__tests__/routes/languages.test.ts
describe('GET /api/v1/languages', () => {
  it('should return list of enabled languages', async () => {
    const res = await request(app).get('/api/v1/languages');
    expect(res.status).toBe(200);
    expect(res.body.defaultLanguage).toBe('en');
    expect(res.body.languages).toHaveLength(10);
  });

  it('should include RTL flag for Arabic and Urdu', async () => {
    const res = await request(app).get('/api/v1/languages');
    const arabic = res.body.languages.find(l => l.code === 'ar');
    const urdu = res.body.languages.find(l => l.code === 'ur');
    expect(arabic.rtl).toBe(true);
    expect(urdu.rtl).toBe(true);
  });
});
```

### Integration Tests

**Language Switching:**
```typescript
describe('Language Switching Integration', () => {
  it('should update UI when language changes', async () => {
    render(<App />);

    expect(screen.getByText('Home')).toBeInTheDocument();

    await changeLanguage('ar');

    expect(screen.getByText('الرئيسية')).toBeInTheDocument();
    expect(document.documentElement.getAttribute('dir')).toBe('rtl');
    expect(document.documentElement.getAttribute('lang')).toBe('ar');
  });

  it('should persist language to localStorage', async () => {
    changeLanguage('vi');
    expect(localStorage.getItem('community-hub-language')).toBe('vi');
  });
});
```

### Accessibility Tests

**WCAG 2.1 Compliance:**
```typescript
import { axe } from 'jest-axe';

describe('Language Selector Accessibility', () => {
  it('should have no axe violations', async () => {
    const { container } = render(<LanguageSelector />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have correct lang attribute', () => {
    changeLanguage('ar');
    expect(document.documentElement.getAttribute('lang')).toBe('ar');
  });

  it('should be keyboard navigable', async () => {
    render(<LanguageSelector />);
    const button = screen.getByRole('button', { name: /select language/i });

    button.focus();
    expect(button).toHaveFocus();

    fireEvent.keyDown(button, { key: 'Enter' });
    expect(screen.getByRole('menu')).toBeVisible();
  });
});
```

### Visual Regression Tests (Future)

**RTL Layout:**
- Screenshot comparison of LTR vs RTL layouts
- Navigation menu
- Card components
- Form layouts
- Modal dialogs

**Test Coverage Target:** >80% (per project standards, established in Phase 1.3)

---

## Known Blockers / Notes

### Blockers

**None.** Phase 1.8 can proceed once Phase 1.1-1.7 are complete (currently at 88%).

### Notes & Considerations

**1. Library Selection for i18n:**

**Recommended: `react-i18next`**
- Most popular React i18n library (10M+ downloads/week)
- Built on `i18next` core (framework-agnostic)
- React hooks integration (`useTranslation()`)
- SSR support (future consideration)
- Namespace support (organize translations by feature)
- Pluralization, interpolation, formatting

**Installation:**
```bash
pnpm add i18next react-i18next i18next-http-backend i18next-browser-languagedetector
```

**2. Translation File Size:**

Initial scope for Phase 1.8 (UI only):
- ~500-1,000 English words
- JSON file size: ~10-20 KB per language
- Total for 10 languages: ~100-200 KB (acceptable)

Future scope (all phases):
- ~5,000+ English words
- Consider code-splitting translations by feature
- Lazy-load translation namespaces

**3. Professional Translation Budget:**

Estimated cost for Phase 1.8 UI translations:
- 500 English words × 9 languages (exclude English)
- Professional translation: $0.10-0.25/word
- Total: $450-$1,125 for initial UI

**4. RTL Testing Tools:**

**Browser DevTools:**
- Chrome: DevTools → Rendering → Emulate CSS media
- Firefox: DevTools → Accessibility → Simulate → Direction

**Manual Testing:**
- Test with native speakers (Arabic, Urdu)
- Check for text overflow/truncation
- Verify icon mirroring

**5. Email Templates Already Multilingual:**

Email templates (Phase 1.6) already support 10 languages with RTL support. This demonstrates the multilingual JSON structure pattern that Phase 1.8 will use for UI translations.

**6. Google Translate API Costs (Phase 4+):**

- Auto-translation of user content (business descriptions, etc.)
- Pricing: $20 per 1 million characters
- Estimated usage: 1,000 businesses × 500 chars = 500K chars = $10
- Budget allocation: ~$100/month for translation API

**7. Language Code Standards:**

**BCP 47 (RFC 5646) Format:**
- Language: `en`, `ar`, `vi` (ISO 639-1 two-letter codes)
- Language + Region: `zh-CN`, `zh-TW` (language-REGION)
- Used in: `<html lang="">`, `navigator.language`, HTTP `Accept-Language` header

---

## Specification Compliance Checklist

### Section 8: Multilingual Support (lines 1413-1500)

- [ ] **§8.1 Supported Languages:**
  - [ ] 10 languages supported (English + 9 others)
  - [x] English (en) as primary language (already in platform.json)
  - [x] Arabic (ar) - High priority, RTL (already in platform.json)
  - [x] All 10 languages in platform.json

- [ ] **§8.2 UI Translation:**
  - [ ] Translation files per language (JSON format)
  - [ ] All navigation menu items translated
  - [ ] All buttons translated
  - [ ] All form labels translated
  - [ ] Success/error/info messages translated
  - [ ] Tooltips translated
  - [x] Email templates translated (already done in Phase 1.6)
  - [ ] Missing translation fallback to English
  - [ ] Professional translation for initial launch (recommended)

- [ ] **§8.3 Content Translation (Phase 4+):**
  - Deferred to Phase 4

- [ ] **§8.4 RTL Support:**
  - [ ] Text direction: right-to-left for Arabic and Urdu
  - [ ] Layout mirroring: navigation, cards, forms
  - [ ] Direction-aware icons mirrored
  - [ ] Numbers remain left-to-right within RTL text
  - [ ] Bidirectional text handling (mixed LTR/RTL content)

- [ ] **§8.5 Language Selection:**
  - [ ] Header selector: Globe icon + current language
  - [ ] Registration: Language preference question (Phase 2)
  - [ ] Profile settings: Change language preference (Phase 2)
  - [ ] Browser detection: Initial suggestion based on browser language
  - [ ] Display content in user's preferred language
  - [ ] Fallback to English if translation unavailable

### Section 2.4: Platform Configuration (lines 308-322)

- [x] **Multilingual Object:** Already configured in platform.json

### Appendix B.17: API Endpoints (lines 3998-4005)

- [ ] **GET /languages:** List supported languages
- [ ] **GET /translations/:lang:** Serve translation JSON
- [ ] **POST /translate:** Deferred to Phase 4

### WCAG 2.1 AA Compliance

- [ ] **SC 3.1.1 Language of Page (Level A):** `<html lang="...">` attribute
- [ ] **SC 3.1.2 Language of Parts (Level AA):** Mixed-language content marked
- [ ] **SC 2.4.4 Link Purpose (Level A):** Language switcher has clear label
- [ ] **Keyboard Navigation:** Language selector fully keyboard accessible

---

## Summary

**Phase 1.8: i18n Foundation** is the final sub-phase of Phase 1 and establishes the multilingual infrastructure that ALL future phases depend on. This phase involves:

**6 Core Tasks:**
1. Create JSON translation files for 10 languages
2. Implement language detection (browser, URL, localStorage, user preference)
3. Build language switching UI component hook
4. Configure RTL (right-to-left) support for Arabic and Urdu
5. Establish translation key management workflow
6. Implement dynamic text direction switching

**Key Technologies:**
- `react-i18next` - React i18n library (recommended)
- `i18next` - Core i18n framework
- JSON translation files (one per language)
- CSS logical properties (already supported by Tailwind CSS 4)
- HTML `lang` and `dir` attributes

**Critical Success Factors:**
- Configuration-driven languages (from platform.json, not hardcoded)
- Professional translation for UI strings (recommended)
- RTL testing with native Arabic/Urdu speakers
- Accessibility compliance (WCAG 2.1 AA)
- Fallback strategy for missing translations

**Estimated Effort:**
- Development: 3-5 days (translation JSON creation, i18n setup, RTL CSS, testing)
- Translation: 1-2 weeks (if using professional service)
- Testing: 2-3 days (unit, integration, accessibility, RTL visual testing)
- Total: ~2 weeks

**Dependencies:**
- Requires: Phase 1.1-1.7 complete (currently 88% complete, 1 task deferred)
- Enables: ALL future phases (2-19) - i18n is foundation-level infrastructure

**Next Steps After Phase 1.8:**
1. Phase 2: Authentication & User System (translated UI)
2. Phase 3: Design System & Core Components (RTL-compatible components)
3. Phase 4: Business Directory Core (multilingual business content)

**Critical for Platform Success:**
The Community Hub serves multicultural communities. Without i18n foundation, the platform cannot fulfill its mission to serve diverse linguistic communities.

---

**Research Complete.**
**Next Action:** Review findings, then proceed to planning phase.