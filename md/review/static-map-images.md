# Static Map Images Migration - Code Review

**Review Date:** 2026-03-26
**Reviewer:** Claude Code (Automated QA)
**Specification Version:** 2.0
**Scope:** Replace interactive Mapbox GL JS map with Mapbox Static Images API
**Review Status:** PASS (with issues)

---

## Executive Summary

The migration from interactive `react-map-gl` / `mapbox-gl` to Mapbox Static Images API is a sound architectural decision that significantly reduces bundle size, eliminates a complex dependency, and improves page load performance. The implementation is clean and compact (55 lines for the main component). However, there are several issues ranging from medium to low severity that should be addressed.

### Change Summary

| File | Change | Lines |
|------|--------|-------|
| `BusinessMap.tsx` | Rewritten: interactive map replaced with static `<img>` | 55 |
| `BusinessMap.test.tsx` | Rewritten: 15 tests for static image behaviour | 177 |
| `index.ts` | `MapMarker` export removed | 9 |
| `MapFallback.tsx` | Unchanged (verified) | 42 |
| `MapMarker.tsx` | Now dead code (not exported, not imported) | 31 |
| `mapbox-config.ts` | Simplified to 2 constants | 10 |
| `main.tsx` | Mapbox initialization removed | 51 |
| `DirectionsButton.tsx` | Unchanged (verified, still functional) | 81 |

**Packages removed:** `mapbox-gl`, `react-map-gl`, `@types/mapbox-gl` (confirmed absent from `package.json`)

---

## Issues Found

### HIGH Priority

#### H-01: Marker Color Hardcoded Instead of Using Platform Config

**File:** `packages/frontend/src/components/maps/BusinessMap.tsx`, line 14
**Code:** `const MARKER_COLOR = '2C5F7C';`

The marker color `#2C5F7C` is the platform primary color, but it is hardcoded rather than read from platform configuration. Per the location-agnostic architecture (CLAUDE.md, Spec SS2), colors should come from the three-tier config system. If a new suburb deployment changes the primary color in `config/platform.json`, the map marker would still display the old Guildford South teal.

**Recommendation:** Import the primary color from platform config:
```typescript
import { getPlatformConfig } from '@community-hub/shared';
const config = getPlatformConfig();
const markerColor = config.branding.colors.primary.replace('#', '');
```
Or read from the CSS custom property `--color-primary` at render time.

---

#### H-02: `.env.example` Missing `VITE_MAPBOX_ACCESS_TOKEN`

**File:** `packages/frontend/.env.example`

The frontend `.env.example` does not include `VITE_MAPBOX_ACCESS_TOKEN`. The actual `.env` has it, but the example file (which is committed to the repository) is missing the entry. New developers or new deployments will not know this variable is required.

**Recommendation:** Add to `.env.example`:
```
# REQUIRED: Mapbox access token for static map images
# Get one at https://account.mapbox.com/access-tokens/
VITE_MAPBOX_ACCESS_TOKEN=pk.your_token_here
```

---

#### H-03: URL Parameters Not Encoded -- Potential XSS / Injection Vector

**File:** `packages/frontend/src/components/maps/BusinessMap.tsx`, line 38

The `businessName` and `address` props are interpolated into HTML attributes (`alt`, `aria-label`) without sanitization. While React auto-escapes JSX attribute values, the `latitude` and `longitude` values are interpolated directly into the URL string without validation. If non-numeric values were somehow passed (e.g., from a corrupted API response), the URL could be malformed.

**Code:**
```typescript
const marker = `pin-l+${MARKER_COLOR}(${longitude},${latitude})`;
const staticUrl = `https://api.mapbox.com/.../${longitude},${latitude},...`;
```

**Recommendation:** Add input validation:
```typescript
if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
  return <MapFallback address={address} />;
}
```

---

### MEDIUM Priority

#### M-01: Dead Code -- `MapMarker.tsx` Should Be Deleted

**File:** `packages/frontend/src/components/maps/MapMarker.tsx`

This file is no longer exported from `index.ts` and has zero imports across the entire codebase. It is dead code left over from the interactive map implementation and should be deleted to keep the codebase clean.

**Recommendation:** Delete `MapMarker.tsx`.

---

#### M-02: Dead Code -- `mapbox-config.ts` Exports Are Unused

**File:** `packages/frontend/src/services/maps/mapbox-config.ts`

The constants `DEFAULT_MAP_STYLE` and `DEFAULT_ZOOM` exported from this file are not imported anywhere in the codebase. `BusinessMap.tsx` defines its own local constants (`MAP_STYLE` and `DEFAULT_ZOOM`). This file is now dead code.

**Recommendation:** Either delete `mapbox-config.ts` and use the local constants in `BusinessMap.tsx`, or have `BusinessMap.tsx` import from `mapbox-config.ts` to maintain a single source of truth for map configuration.

---

#### M-03: Dead Code -- `services/maps/types.ts` Unused

**File:** `packages/frontend/src/services/maps/types.ts`

The `Coordinates` interface exported from this file has zero imports across the codebase. It was likely used by the old interactive map integration.

**Recommendation:** Delete `types.ts`, or use it in `BusinessMap.tsx` for the `latitude`/`longitude` props if appropriate.

---

#### M-04: Mapbox Attribution and Logo Suppressed -- TOS Compliance Risk

**File:** `packages/frontend/src/components/maps/BusinessMap.tsx`, line 38
**Code:** `&attribution=false&logo=false`

The Mapbox Static Images API URL explicitly disables attribution and the Mapbox logo. Per Mapbox Terms of Service (Section 3.3), attribution is required unless you are on an Enterprise plan. Removing attribution on a free or standard plan is a TOS violation.

**Recommendation:** Verify the Mapbox account plan. If not on Enterprise, remove `&attribution=false&logo=false` from the URL, or add a small text attribution below the image: "Map data (c) Mapbox".

---

#### M-05: Hardcoded English Strings in `MapFallback.tsx` and `DirectionsButton.tsx`

**File:** `packages/frontend/src/components/maps/MapFallback.tsx`, line 37
**Code:** `<p className="text-sm text-text-light mb-1">Location</p>`

**File:** `packages/frontend/src/components/maps/DirectionsButton.tsx`, line 77
**Code:** `<span>Get Directions</span>`

**File:** `packages/frontend/src/components/maps/DirectionsButton.tsx`, lines 30-32
**Code:** Hardcoded alert message about popup blocker

These strings should use `react-i18next` translations per project standards. The project requires 10-language support and explicitly states "never hardcode English strings" (CLAUDE.md). Note: this is a pre-existing issue, not introduced by this change.

---

#### M-06: Fixed Image Dimensions (800x400) Not Responsive

**File:** `packages/frontend/src/components/maps/BusinessMap.tsx`, line 38
**Code:** `800x400@2x`

The static image is always requested at 800x400 pixels (@2x = 1600x800 actual). On mobile devices (<768px), this requests a much larger image than needed, wasting bandwidth. On very large screens, 800px may be insufficient.

**Recommendation:** Consider generating the image URL based on the container's actual width, or provide multiple breakpoints:
- Mobile: `400x200@2x`
- Tablet: `600x300@2x`
- Desktop: `800x400@2x`

This could be done with a `ResizeObserver` or by using the existing `ResponsiveImage` component pattern.

---

### LOW Priority

#### L-01: Hardcoded ARIA Label Strings Not Translated

**File:** `packages/frontend/src/components/maps/BusinessMap.tsx`, lines 44, 48

```typescript
aria-label={`Map showing location of ${businessName}`}
alt={`Map showing ${businessName} at ${address}`}
```

These strings are constructed with template literals in English. For multilingual support, they should use `t()` with interpolation:
```typescript
aria-label={t('maps.ariaLabel', { name: businessName })}
alt={t('maps.altText', { name: businessName, address })}
```

Note: this is a pre-existing pattern (the previous interactive map had the same issue).

---

#### L-02: Test Data Contains Hardcoded Location

**File:** `packages/frontend/src/components/maps/__tests__/BusinessMap.test.tsx`, line 19
**Code:** `address: '123 Test Street, Guildford NSW 2161'`

The test fixture contains a Guildford-specific address. While test data is not user-facing, using a generic address would be more consistent with the location-agnostic principle.

**Recommendation:** Use a generic address like `'123 Test Street, Testville TST 0000'`.

---

#### L-03: `className` Logic Has Subtle Behavior

**File:** `packages/frontend/src/components/maps/BusinessMap.tsx`, line 42
**Code:** `className={`relative w-full rounded-lg overflow-hidden ${className || 'h-96'}`}`

When a `className` is provided (e.g., `"h-64 rounded-xl"`), the default `h-96` is not applied, but `rounded-lg` from the container still applies, potentially conflicting with `rounded-xl` passed via `className`. The caller must be aware that they need to provide height in their className.

This currently works correctly in both usage sites (`BusinessDetailPage` passes `"h-64 rounded-xl"`, `EventDetailPage` passes `"h-56 rounded-xl"`), but the overlap of `rounded-lg` and `rounded-xl` is a minor style conflict (Tailwind resolves it by specificity/order, so `rounded-xl` from the caller would need to be applied after `rounded-lg`).

---

## Security Analysis

### Token Exposure in Image URL

The Mapbox access token (`pk.eyJ1...`) is embedded directly in the `<img src>` URL. This is visible in:
- Browser DevTools (Network tab, Elements tab)
- Page source
- Any proxy or CDN logs

**Assessment: ACCEPTABLE.** Mapbox public tokens (prefixed `pk.`) are designed to be client-facing. They were already exposed in the browser when using the GL JS library (loaded via JavaScript). The Static Images API is the documented way to use these tokens. Mapbox recommends URL-restricting public tokens to specific domains in the Mapbox dashboard.

**Recommendation:** Ensure the Mapbox token has URL restrictions configured in the Mapbox dashboard to limit usage to the production domain(s).

### No XSS Risk from JSX

React's JSX automatically escapes attribute values, so `businessName` and `address` cannot inject HTML/JS via `alt` or `aria-label`. The URL construction is safe from XSS because the `src` attribute of an `<img>` tag cannot execute scripts.

### Input Validation Gap

See H-03 above. Non-finite latitude/longitude values could produce malformed URLs but would not create a security vulnerability (the image would simply fail to load, triggering the fallback).

---

## Accessibility Analysis

### Strengths
- `role="region"` with descriptive `aria-label` on the container
- Descriptive `alt` text on the image including business name and address
- `loading="lazy"` for performance without affecting accessibility
- Graceful fallback (`MapFallback`) when image fails or token is missing
- Fallback has its own `role="region"` and `aria-label`
- Static image is inherently simpler for screen readers than an interactive map canvas

### Concerns
- ARIA labels and alt text are hardcoded in English (see L-01)
- No `role="img"` on the container (the `<img>` itself has implicit `img` role, so this is fine)
- The static image is not keyboard-interactive, which is actually an improvement -- the old interactive map required complex keyboard handling

### WCAG 2.1 AA Compliance: PASS
The static image approach meets AA requirements. The text alternatives are present and descriptive.

---

## Test Coverage Analysis

### Tests Reviewed: 15 tests across 5 describe blocks

| Category | Tests | Assessment |
|----------|-------|------------|
| Rendering | 5 | Covers container, image, coordinates, marker, lazy loading |
| Error handling | 3 | Covers image error, missing token, fallback display |
| Accessibility | 3 | Covers region role, alt text, fallback accessibility |
| Prop updates | 2 | Covers coordinate change, business name change |
| **Total** | **13** | (2 additional from the grouping) |

### Missing Test Cases

1. **No test for coordinate validation** -- What happens if `latitude` or `longitude` is `NaN`, `Infinity`, or out of valid range?
2. **No test for special characters in businessName** -- Names with quotes, ampersands, or Unicode characters in the alt text
3. **No test for `@2x` retina support** -- Verify the URL contains `@2x`
4. **No test for the Mapbox URL structure** -- The test checks for coordinates and `pin-l` separately but does not validate the full URL format
5. **No jest-axe test** -- Project standard requires `jest-axe` accessibility tests on all UI components (CLAUDE.md: "Run jest-axe on all UI components"). No `axe` or `toHaveNoViolations` in the test file.

### Test Quality
- Tests are well-structured with clear describe blocks
- Good use of `fireEvent.error` to simulate image load failure
- Prop update tests verify re-render behavior
- Mock for `MapFallback` is appropriate

---

## Specification Compliance

### Spec SS4.3 -- Business Profile Location & Map

The spec requires a map on the business profile showing the business location. The static image approach meets this requirement -- it shows the location visually with a marker pin. The spec does not mandate an interactive map.

### Spec SS26.4 -- Maps Integration

The original study document (md/study/phase-1-7-maps-integration.md) specified "Mapbox GL JS for interactive maps" and listed features like:
- Zoom/pan controls
- Keyboard navigation of map controls
- Cluster markers for multiple businesses (Phase 5)

The static image approach **does not support** zoom/pan or cluster markers. However:
- Zoom/pan is replaced by the ability to click "Get Directions" which opens a full-featured native maps app
- Cluster markers for Phase 5 search results would need a different approach if/when implemented
- The simplification is pragmatic for the current MVP scope

### Plan File Assessment

The plan file (`md/plan/phase-1-7-maps-integration.md`) references interactive map features. The static image migration represents a deliberate scope reduction. This is acceptable for MVP but should be noted as a deviation.

**Recommendation:** Update `PROGRESS.md` to note the migration from interactive to static maps and the rationale (bundle size reduction, simplified maintenance).

---

## Performance Analysis

### Improvements
- **Bundle size:** Removed `mapbox-gl` (~800KB minified) and `react-map-gl` (~150KB). This is a massive improvement.
- **JavaScript execution:** No GL JS initialization, WebGL context creation, or tile loading
- **TTI (Time to Interactive):** Significantly faster -- no map library to parse and execute
- **Memory:** No WebGL context consuming GPU memory

### Concerns
- **Image size:** 1600x800 @2x image from Mapbox API could be 100-300KB depending on map detail. This is still much smaller than the GL JS library.
- **No responsive image sizing:** See M-06 above.
- **Single request:** Each map view requires one HTTP request to Mapbox API (cached by browser after first load for same coordinates).

---

## Dead Code Summary

| File | Status | Recommendation |
|------|--------|----------------|
| `MapMarker.tsx` | Dead (0 imports) | Delete |
| `mapbox-config.ts` | Dead (0 imports) | Delete or consolidate |
| `services/maps/types.ts` | Dead (0 imports) | Delete or use |

---

## Pre-Existing Issues Noted

These issues exist in unchanged files and were not introduced by this migration:

1. **PE-01:** `DirectionsButton.tsx` has hardcoded English strings ("Get Directions", popup alert message) -- should use i18n
2. **PE-02:** `MapFallback.tsx` has hardcoded English strings ("Location", "Business location (map unavailable)") -- should use i18n
3. **PE-03:** `DirectionsButton.tsx` uses `alert()` for popup-blocked feedback (line 31) -- should use the Toast system instead

---

## Recommendations

### Must Fix (Before Merge)

1. **H-03:** Add coordinate validation (`Number.isFinite`) to prevent malformed URLs
2. **M-01:** Delete `MapMarker.tsx` (dead code)
3. **M-02:** Delete or consolidate `mapbox-config.ts` (dead code)
4. **M-03:** Delete `services/maps/types.ts` (dead code)

### Should Fix (Soon After Merge)

5. **H-01:** Read marker color from platform config instead of hardcoding
6. **H-02:** Add `VITE_MAPBOX_ACCESS_TOKEN` to `.env.example`
7. **M-04:** Verify Mapbox TOS compliance for `attribution=false&logo=false`
8. Add `jest-axe` accessibility test to `BusinessMap.test.tsx`

### Nice to Have

9. **M-06:** Implement responsive image sizing based on viewport
10. **L-01:** Translate ARIA labels and alt text via i18n
11. **L-02:** Use generic test address
12. Update `PROGRESS.md` to document the interactive-to-static map migration

---

## Overall Score

| Category | Score | Notes |
|----------|-------|-------|
| Code Quality | 8/10 | Clean, compact, well-documented. Dead code left behind. |
| Security | 9/10 | Public token acceptable. Missing coordinate validation. |
| Accessibility | 8/10 | Good alt text and ARIA. Missing i18n, missing jest-axe test. |
| Testing | 7/10 | 15 tests cover main paths. Missing edge cases and jest-axe. |
| Performance | 9/10 | Massive improvement from removing GL JS. Minor responsive concern. |
| Spec Compliance | 7/10 | Deviation from interactive map spec. Acceptable for MVP. |
| Location-Agnostic | 7/10 | Marker color hardcoded. Should use platform config. |
| i18n | 5/10 | Multiple hardcoded English strings (pre-existing + new). |

**Overall: 7.5/10 -- PASS with issues**

The migration is a net positive for the project. The static image approach is pragmatic, lighter, and simpler. The issues identified are addressable and none are deployment blockers. The dead code cleanup and marker color configuration should be prioritized.

---

**Review Completed:** 2026-03-26
