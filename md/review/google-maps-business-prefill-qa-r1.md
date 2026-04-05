# Google Maps Business Prefill - QA Review R1

**Date:** 2026-04-05
**Reviewer:** Claude Code
**Scope:** Google Places API integration for CSV import and business owner profile prefill
**Score:** 74/100

## Summary

The feature delivers two related capabilities: (1) an admin/curator CSV bulk import page with optional Google Places enrichment, and (2) a business owner panel to import profile data from Google Maps into the edit form. The backend uses the Places API (New) Text Search endpoint and returns enriched data. The frontend implementation is clean, well-structured, and follows existing patterns. However, there are several issues that need attention before production deployment, particularly around location-agnostic compliance, missing i18n translation keys, absent rate limiting on admin enrichment endpoints, and zero test coverage.

---

## Critical Issues (Must Fix)

### C-1. No Rate Limiting on Admin Enrich/Bulk-Import Endpoints

**Files:** `packages/backend/src/routes/admin.ts` (lines 43-44)

The `/admin/businesses/enrich` and `/admin/businesses/bulk-import` routes have no rate limiting middleware applied. While they require curator/admin auth, the enrich endpoint proxies to the Google Places API (up to 100 sequential calls per request). A compromised admin session or accidental repeated clicks could exhaust the Google Places API quota or generate significant billing. Other admin routes also lack rate limiters, but these two are especially sensitive because they make external API calls.

**Recommendation:** Add a dedicated rate limiter (e.g., 5 requests per minute) to both bulk endpoints.

### C-2. Hardcoded `'Australia'` Country Default in Two Places

**Files:**
- `packages/backend/src/services/maps/google-places-service.ts` (line 199): `const country = extractComponent(components, 'country') || 'Australia';`
- `packages/backend/src/controllers/admin-controller.ts` (line 334): `country: row.country || 'Australia',`

The CLAUDE.md and spec are explicit: **"NEVER hardcode location-specific data."** The platform has a `config/platform.json` with `location.country: "Australia"`. Both of these should read from the platform config instead.

**Recommendation:** Import `getPlatformConfig` from `@community-hub/shared` and use `config.location.country` as the fallback.

### C-3. Hardcoded Australian State Dropdown in ContactLocationTab

**File:** `packages/frontend/src/pages/owner/edit-business/ContactLocationTab.tsx` (lines 133-149)

The state `<select>` dropdown hardcodes all eight Australian state/territory abbreviations (NSW, VIC, QLD, WA, SA, TAS, ACT, NT). This is a pre-existing issue in the codebase, but the Google Maps import feature now feeds data into this field. If deployed to a non-Australian location, state values from Google Places API will not match any dropdown option.

**Note:** This is a pre-existing issue, not introduced by this feature, but it impacts the feature's location-agnostic compliance.

---

## High Priority Issues

### H-1. Zero Test Coverage for All New Code

No test files exist for any of the new code:
- No unit tests for `google-places-service.ts`
- No unit tests for `enrichBusinesses` or `bulkImportBusinesses` controller methods
- No unit tests for `lookupGoogle` controller method
- No component tests for `AdminCSVImportPage.tsx` (891 lines)
- No component tests for `GoogleMapsImportPanel.tsx` (401 lines)
- No API client tests for new functions in `admin-api.ts` or `business-api.ts`

The project targets >80% coverage. The `google-places-service.ts` in particular should have unit tests with mocked `fetch` calls to verify data mapping, error handling, and edge cases.

**Recommendation:** Add at minimum:
- Backend unit tests for `searchAndEnrichBusiness`, `batchEnrichBusinesses`, `mapPlaceToEnrichedData`, `parseOpeningHours`
- Backend integration tests for the three new endpoints
- Frontend component tests for `GoogleMapsImportPanel` and key flows in `AdminCSVImportPage`

### H-2. Translation Keys Not Added to Locale Files

All new user-facing strings use `t()` with inline English fallbacks but **none of the translation keys have been added to the locale JSON files** (checked `en/translation.json`, `en/owner.json`, and all 10 language directories). Keys affected include:

- `editBusiness.googleImport.*` (~12 keys) - used in `GoogleMapsImportPanel`
- `admin.businesses.import.*` (~30+ keys) - used in `AdminCSVImportPage`
- `owner.googleImport.*` (~3 keys) - used in `OwnerDashboardPage`
- `admin.businesses.importCSV` - used in `AdminBusinessesPage`

While the fallback strings make the English UI functional, the 9 non-English locales will display only English text. This violates the multilingual requirement.

**Recommendation:** Add all keys to `en/translation.json` (or the appropriate namespace file), then add translations for all 10 supported languages.

### H-3. Hardcoded Location-Specific Examples in CSV Format Guide

**File:** `packages/frontend/src/pages/admin/AdminCSVImportPage.tsx` (lines 507-512)

The CSV format guide table contains hardcoded examples: `'Guildford Bakery'`, `'(02) 9632 1234'`, `'123 Main St'`, `'Guildford'`, `'NSW'`, `'2161'`. These should either come from platform config or use generic/translatable examples.

**Recommendation:** Use `t()` with interpolation pulling from platform config, or use clearly generic examples.

---

## Medium Priority Issues

### M-1. Sequential N+1 Pattern in Bulk Import

**File:** `packages/backend/src/controllers/admin-controller.ts` (lines 319-351)

The `bulkImportBusinesses` method creates businesses one-at-a-time in a `for` loop with individual `businessService.createBusiness()` calls. For 100 rows, this means 100 sequential database transactions. While this is acceptable for an admin-only operation with a 100-row limit, it could be slow.

**Recommendation:** This is acceptable for MVP but consider a `createMany` approach or wrapping in a single transaction for better performance and atomicity in a future iteration.

### M-2. Google Places API Error Not Surfaced for Individual Batch Failures

**File:** `packages/backend/src/services/maps/google-places-service.ts` (lines 170-187)

In `batchEnrichBusinesses`, if the API key is missing, the error thrown by `getApiKey()` will propagate from the first call and abort the entire batch. But if an individual search fails (network error, rate limit), it silently returns `null` with only a server-side log. The admin has no way to know *why* a specific row was not enriched (API error vs. genuinely not found).

**Recommendation:** Consider returning a richer result object like `{ data: PlacesEnrichedData | null; error?: string }` so the frontend can distinguish "not found" from "API error."

### M-3. CSV Parser Does Not Handle BOM (Byte Order Mark)

**File:** `packages/frontend/src/pages/admin/AdminCSVImportPage.tsx` (lines 66-130)

The CSV parser does not strip UTF-8 BOM (`\uFEFF`) that Excel commonly adds to CSV exports. This could cause the first header column to not match (e.g., `"\uFEFFname"` instead of `"name"`), resulting in the `name` column not being mapped.

**Recommendation:** Add `text = text.replace(/^\uFEFF/, '');` at the start of `parseCSV`.

### M-4. `formatHoursSummary` Helper Uses Hardcoded English

**File:** `packages/frontend/src/components/business/GoogleMapsImportPanel.tsx` (lines 383-401)

The helper function returns strings like `"(all days)"` and day abbreviations like `"mon"`, `"tue"` that are not translatable. This is displayed in the diff table.

**Recommendation:** Pass `t` to the helper or use translated day names.

### M-5. AdminCSVImportPage is 891 Lines

While under the 1000-line threshold, this is a large single-file component. The CSV parser (lines 66-163), the upload step, preview step, and results step could each be extracted into separate components for maintainability.

**Recommendation:** Consider extracting `CSVUploadStep`, `CSVPreviewStep`, `CSVResultsStep`, and `parseCSV` into separate files.

---

## Low Priority Issues

### L-1. Missing `title` Attribute on Truncated Table Cells

**File:** `packages/frontend/src/pages/admin/AdminCSVImportPage.tsx` (lines 681, 689, 694)

Table cells with `truncate` class and `max-w-[200px]`/`max-w-[250px]` do not have `title` attributes, so the full text cannot be seen on hover.

### L-2. Checkbox Touch Targets May Be Below 44px

**Files:** Both `AdminCSVImportPage.tsx` and `GoogleMapsImportPanel.tsx`

The checkboxes in both components use default browser checkbox sizing. The table rows have `py-3 px-3` padding which helps, but the checkbox itself is likely smaller than the 44px minimum touch target required by the design system.

### L-3. `type="button"` Correctly Used on Non-Submit Buttons

Good practice observed - all buttons that should not submit the form have `type="button"` set.

### L-4. Enrichment 100ms Delay is Fixed

**File:** `packages/backend/src/services/maps/google-places-service.ts` (line 183)

The 100ms delay between Google Places API calls is hardcoded. Google Places API (New) has a documented rate limit that may require more or less delay depending on the plan. This is fine for now but could be made configurable.

---

## Security Review

### Positive Findings

1. **API key never exposed to frontend:** The Google Places API key stays server-side. Frontend calls go through authenticated backend endpoints that proxy to Google.
2. **Zod validation on all inputs:** Both `enrichBusinesses` and `bulkImportBusinesses` use inline Zod schemas to validate request bodies with proper constraints (`.min(1).max(100)` on arrays, `.min(1)` on required strings, `.email()` on email fields).
3. **Authorization enforced:** Admin routes require `CURATOR`, `ADMIN`, or `SUPER_ADMIN` roles. Business owner lookup requires `requireAuth` + `requireBusinessOwnership`.
4. **No `dangerouslySetInnerHTML`** in any new components.
5. **No `console.log` statements** in any new code (frontend or backend).
6. **Error messages are sanitized:** Google API errors are logged server-side only; generic error messages returned to client.
7. **File upload validation:** CSV file restricted to `.csv` extension and 5MB size limit.
8. **Row limit:** Both frontend (parseCSV) and backend (Zod schema) enforce max 100 rows.

### Concerns

1. **No rate limiting on enrich/bulk-import endpoints** (see C-1 above).
2. **CSV content not sanitized against formula injection:** CSV values are used in API calls and displayed in the UI but not checked for CSV injection patterns (e.g., `=CMD(...)`, `+CMD(...)`). Since the CSV is uploaded by admins and displayed in React (which auto-escapes), the risk is low, but worth noting.
3. **Bulk import error messages may leak internal details:** In `admin-controller.ts` line 348, `err.message` from `businessService.createBusiness` is returned directly in the response. If the service throws a Prisma error with SQL details, this could leak schema information. The risk is mitigated by the admin-only access.

---

## Specification Compliance

The implementation aligns well with **Spec section 26.1 (Google Business Profile API)**:

| Spec Requirement | Status |
|---|---|
| Business Name import | Implemented (name field from Places API) |
| Address import | Implemented (full address decomposition) |
| Hours import | Implemented (operating hours parsing) |
| Photos import | **Not implemented** (spec calls for photo import) |
| Reviews import (daily) | **Not implemented** (different scope, likely Phase 7.2+) |
| Rating import (daily) | Partially (rating returned but not stored) |

The implementation uses the **Google Places API (New)** rather than the Google Business Profile API (which requires OAuth). This is a pragmatic choice - Places API provides the needed data (name, address, hours, phone, website) without requiring business owners to go through OAuth. The spec's reference to "Google Business Profile API" appears to mean the data source conceptually, and Places API satisfies the import use case.

**Missing from spec:** The CSV bulk import feature is not explicitly described in the spec but is a reasonable admin tooling addition.

---

## Accessibility Review

### Positive Findings

1. **ARIA labels on checkboxes:** All checkboxes in both components have `aria-label` attributes with translatable text.
2. **Semantic HTML:** Tables use proper `<thead>`, `<tbody>`, `<th>` elements.
3. **Form labels:** All inputs have associated `<label>` elements with `htmlFor`.
4. **Keyboard navigation:** Collapsible panel in `GoogleMapsImportPanel` uses a `<button>` element (keyboard accessible).
5. **Loading states:** Spinner animations with disabled buttons during async operations.
6. **Focus management:** File input has associated label for click-to-upload.

### Concerns

1. **No skip link for the large data table** in `AdminCSVImportPage`.
2. **`role="status"` or `aria-live` missing** for the enrichment/import progress states. Screen readers won't announce when enrichment completes or import finishes.
3. **Table is not responsive on mobile:** Uses `overflow-x-auto` which requires horizontal scrolling. Consider a card layout for mobile breakpoints.
4. **Checkbox touch targets** (see L-2).

---

## Testing Coverage

**Tests found:** 0

No test files exist for any of the new code. The project has 2,387+ tests but none cover:

| Component/Service | Expected Tests | Actual |
|---|---|---|
| `google-places-service.ts` | Unit tests for search, batch, mapping, parsing | 0 |
| `admin-controller.ts` (new methods) | Integration tests for enrich + bulk-import | 0 |
| `business-controller.ts` (lookupGoogle) | Integration test for lookup endpoint | 0 |
| `AdminCSVImportPage.tsx` | Component tests for upload, preview, import flows | 0 |
| `GoogleMapsImportPanel.tsx` | Component tests for lookup, diff, apply flows | 0 |
| `admin-api.ts` (new functions) | API client tests | 0 |
| `business-api.ts` (lookupGoogle) | API client test | 0 |

**Estimated minimum tests needed:** ~40-60 tests to reach adequate coverage.

---

## Plan/Study Verification

**Plan files found:** `md/plan/phase-1-7-maps-integration.md` (general maps integration plan, not specific to this feature)

**Study files found:** None specific to Google Places API, CSV import, or business prefill.

No formal plan or study was created for this feature. This is unusual given the feature's scope (new service, 3 new endpoints, 2 new pages/components). A study of the Google Places API (New) pricing and rate limits would have been beneficial.

---

## Pre-existing Issues

1. **Hardcoded Australian states in ContactLocationTab.tsx** (lines 133-149) - This existed before this feature but directly impacts it.
2. **`parking Information` placeholder in English** (line 183 of ContactLocationTab.tsx): `placeholder="e.g., Free parking available behind the building"` - Not using `t()`.
3. **Inconsistent use of `as string` type assertions** in `business-controller.ts` (e.g., lines 181, 188, 189) for business fields - pre-existing pattern.

---

## Recommendations

1. **Immediate (before deploy):**
   - Add rate limiters to `/admin/businesses/enrich` and `/admin/businesses/bulk-import`
   - Replace hardcoded `'Australia'` with platform config country value
   - Add UTF-8 BOM stripping to CSV parser
   - Add translation keys to all 10 locale files

2. **Short-term (next sprint):**
   - Write unit tests for `google-places-service.ts` (mock fetch)
   - Write component tests for `GoogleMapsImportPanel` and `AdminCSVImportPage`
   - Add `aria-live` regions for async operation completion announcements
   - Consider extracting `AdminCSVImportPage` into smaller sub-components

3. **Future iteration:**
   - Add photo import from Google Places (spec requirement)
   - Make state dropdown configurable from platform config
   - Add CSV formula injection sanitization
   - Consider batch database operations for bulk import performance
   - Add richer error reporting for individual enrichment failures
