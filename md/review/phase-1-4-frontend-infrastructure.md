# Phase 1.4 Frontend Infrastructure -- Code Review

**Reviewer:** Claude Opus 4.5
**Date:** 3 February 2026
**Files Reviewed:** 26
**Specification Reference:** `Docs/Community_Hub_Specification_v2.md` v2.0

---

## Summary

**Verdict: PASS with conditions**

Phase 1.4 is solid work overall. The implementation follows the plan closely, uses proper TypeScript typing throughout, correctly implements the Tailwind CSS 4 `@theme` pattern for design tokens, and builds an appropriate foundation of accessible, well-tested UI components. The architecture is location-agnostic as required.

There are **zero critical security issues**. The primary concerns are:

1. A high-priority accessibility gap where `FormField` declares `aria-describedby` support in its JSDoc but does not actually wire the attribute to child inputs.
2. A high-priority spec inconsistency where the warning colour in platform.json (#F39C12) differs from Spec 6.5's Warning alert colour (#E67E22).
3. A medium-priority observation where the config endpoint serves the full `platform.json` without field filtering.
4. A medium-priority spec deviation where Card is missing the hover translate per Spec 7.1.3.
5. A medium-priority PWA concern where the manifest has only SVG icon placeholders (no PNG sizes).

Quality assessment: **Good**. Code is clean, well-typed, documented with spec references, and follows consistent patterns. Test coverage is thorough for the components created.

---

## Critical Issues

*None.*

No security vulnerabilities, no hardcoded secrets, no data leaks, and no blocking bugs.

---

## High Priority

**H-01: FormField does not wire `aria-describedby` to child inputs**

- **File:** `packages/frontend/src/components/ui/FormField.tsx`
- **Issue:** The component defines `errorId` and `hintId` variables but never injects `aria-describedby` onto the child input element. Screen readers will not associate error/hint messages with the input. WCAG 2.1 AA gap (SC 1.3.1).
- **Fix:** Use `React.cloneElement` to inject `aria-describedby` and `aria-invalid` onto the child.

**H-02: FormField tests do not cover aria-describedby linkage**

- **File:** `packages/frontend/src/__tests__/components/FormField.test.tsx`
- **Issue:** No test asserts `aria-describedby` or `aria-invalid` on the input, allowing H-01 to pass undetected.
- **Fix:** Add tests for `aria-describedby` pointing to error/hint IDs and `aria-invalid` when error present.

**H-03: Warning colour inconsistency with Spec 6.5**

- **File:** `packages/frontend/src/styles/app.css`, `config/platform.json`
- **Issue:** `platform.json` defines `warning: "#F39C12"` but Spec 6.5 Alert Colours says Warning = `#E67E22` (orange) while Advisory = `#F39C12` (yellow/gold). The current value matches "Advisory" rather than "Warning."
- **Fix:** Clarify in a code comment. The platform.json value serves as the "generic UI warning" colour (not the emergency alert-level "Warning"). The alert system (Phase 14) will reference Spec 6.5 alert colours directly.

---

## Medium Priority

**M-01: Config endpoint serves entire platform.json without field filtering**

- **File:** `packages/backend/src/routes/config.ts`
- **Issue:** Sends the entire config to the frontend including `contact.*`, `partners.*`, `analytics.*` fields that the frontend doesn't need. Plan Step 11 explicitly states "Strip any sensitive fields."
- **Fix:** Create a whitelist of frontend-needed sections.

**M-02: Card hover state missing `-translate-y-0.5` lift per Spec 7.1.3**

- **File:** `packages/frontend/src/components/ui/Card.tsx`
- **Issue:** Spec states hover cards should have "slight lift (-2px Y transform)" alongside shadow. Only shadow is implemented.
- **Fix:** Add `hover:-translate-y-0.5` to hoverable classes.

**M-03: PWA manifest uses only SVG icon placeholder**

- **File:** `packages/frontend/vite.config.ts`
- **Issue:** Spec 3.7 requires "All required sizes (72px to 512px)." Only SVG with `sizes: 'any'` is provided. Older devices need PNG raster icons.
- **Fix:** Generate placeholder PNGs at minimum 192px and 512px. Full set deferred to design asset creation.

**M-04: Missing favicon.ico and apple-touch-icon.png**

- **Files:** `packages/frontend/index.html`, `packages/frontend/public/`
- **Issue:** HTML references `/favicon.ico` and `/apple-touch-icon.png` but neither exists. Causes 404 errors.
- **Fix:** Add placeholder files or use the SVG icon as favicon.

**M-05: `injectDesignTokens` has no colour format validation**

- **File:** `packages/frontend/src/utils/inject-design-tokens.ts`
- **Issue:** Sets CSS properties from config without hex validation. Mitigated by upstream Zod validation in platform-loader.
- **Fix:** Add comment noting validation is handled upstream. Low concern.

**M-07: No error boundary in main.tsx**

- **File:** `packages/frontend/src/main.tsx`
- **Issue:** If config loading or injection fails when wired up, app will white-screen.
- **Fix:** Plan to add error boundary in Phase 3 when routing and layout are built.

---

## Low Priority

**L-01: SkipLink uses `focus:fixed` instead of plan's `focus:absolute`**

- **File:** `packages/frontend/src/components/ui/SkipLink.tsx`
- **Status:** Acceptable. `fixed` keeps the link visible regardless of scroll position.

**L-03: Spinner lacks `role="status"` for standalone use**

- **File:** `packages/frontend/src/components/ui/Spinner.tsx`
- **Issue:** Has `aria-hidden="true"` (correct when inside Button), but has no accessible alternative for standalone use.
- **Fix:** Consider wrapping in `<span role="status">` with an `aria-label` prop for standalone contexts.

---

## Specification Compliance Checklist

| Requirement | Spec | Status | Notes |
|---|---|---|---|
| Primary #2C5F7C | 6.1 | PASS | CSS @theme + platform.json |
| Secondary #E67E22 | 6.1 | PASS | |
| Accent #F39C12 | 6.1 | PASS | |
| Success #27AE60 | 6.1 | PASS | |
| Error #E74C3C | 6.1 | PASS | |
| Neutral Light #F5F5F5 | 6.1 | PASS | |
| Neutral Medium #CCCCCC | 6.1 | PASS | |
| Text Dark #2C3E50 | 6.1 | PASS | |
| Text Light #7F8C8D | 6.1 | PASS | |
| Warning colour | 6.5 | H-03 | platform.json #F39C12 vs spec #E67E22 |
| Montserrat headings | 6.2 | PASS | |
| Open Sans body | 6.2 | PASS | |
| H1 32px Bold | 6.2 | PASS | |
| H2 26px Bold | 6.2 | PASS | |
| H3 22px Semi-bold | 6.2 | PASS | |
| Body 16px Regular | 6.2 | PASS | |
| Small 14px | 6.2 | PASS | |
| Caption 12px | 6.2 | PASS | |
| Button Primary | 6.3 | PASS | bg-secondary text-white |
| Button Secondary | 6.3 | PASS | bg-white text-primary border |
| Button Tertiary | 6.3 | PASS | bg-transparent text-primary |
| Button Disabled | 6.3 | PASS | bg-neutral-medium text-text-light |
| Button hover 10% darken | 7.1 | PASS | hover:brightness-90 |
| Button active 15% + 0.98 | 7.1 | PASS | active:brightness-85 scale-[0.98] |
| Button focus ring | 7.1 | PASS | focus-visible:focus-ring |
| Button disabled 50% | 7.1 | PASS | disabled:opacity-50 |
| Button loading spinner | 7.1 | PASS | Spinner + "Loading..." |
| Card white 8px radius | 6.3 | PASS | bg-white rounded-md |
| Card shadow | 6.3 | PASS | shadow-card token |
| Card 16px padding | 6.3 | PASS | p-4 |
| Card hover shadow | 6.3 | PASS | hover:shadow-card-hover |
| Card hover translate | 7.1 | M-02 | Missing -translate-y-0.5 |
| Form label association | 3.6 | PASS | htmlFor={id} |
| Form error role="alert" | 3.6 | PASS | |
| Form aria-describedby | 3.6 | H-01 | Not wired to children |
| Breakpoint mobile <768 | 3.4 | PASS | --breakpoint-md: 768px |
| Breakpoint tablet 768-1199 | 3.4 | PASS | |
| Breakpoint desktop >=1200 | 3.4 | PASS | --breakpoint-lg: 1200px |
| 44px touch targets | 3.4 | PASS | min-h-[2.75rem] |
| Skip to main content | 3.6 | PASS | SkipLink component |
| Focus indicators | 3.6 | PASS | focus-ring utility |
| PWA manifest | 3.7 | M-03 | SVG-only icons |
| Service worker | 3.7 | PASS | Workbox 4 strategies |
| Code splitting | 3.2 | PASS | react-vendor chunk |
| Location-agnostic | 2 | PASS | All from platform.json |

---

## Plan Completion Verification

### 14 Steps: All completed

### 7 TODO Tasks: All completed

### Scope Boundaries: All respected (no Router, no full design system, no i18n, no auth)

---

## Test Coverage Assessment

| Component | Tests | Rating | Gaps |
|---|---|---|---|
| Button | 13 | Excellent | sm/lg size classes untested |
| Card | 8 | Good | Extra HTML attribute spread untested |
| FormField | 8 | Good | Missing aria-describedby tests (H-02) |
| SkipLink | 5 | Good | |
| Spinner | 5 | Good | |
| inject-design-tokens | 2 | Adequate | Missing empty/undefined colour test |
| config endpoint | 3 | Adequate | No field-filtering test (tied to M-01) |

**Frontend:** 57 tests, 9 files
**Backend:** 118 tests, 19 files (3 new for config)
**Total:** 175 tests

---

## Findings Summary

| ID | Severity | Description |
|---|---|---|
| H-01 | High | FormField: aria-describedby not wired to children |
| H-02 | High | FormField: tests missing aria-describedby coverage |
| H-03 | High | Warning colour: platform.json #F39C12 vs Spec 6.5 #E67E22 |
| M-01 | Medium | Config endpoint: no field filtering |
| M-02 | Medium | Card: missing hover translate per Spec 7.1.3 |
| M-03 | Medium | PWA: SVG-only icons, no PNG sizes |
| M-04 | Medium | Missing favicon.ico and apple-touch-icon.png files |
| M-05 | Medium | inject-design-tokens: no format validation (mitigated) |
| M-07 | Medium | No error boundary in main.tsx |
| L-01 | Low | SkipLink: fixed vs absolute (acceptable) |
| L-03 | Low | Spinner: no role="status" for standalone use |

**Actionable items for immediate fix: H-01, H-02, M-02, M-04**
**Items for Phase 1.5+: M-01, M-07, H-03 (clarify)**
**Deferred: M-03 (design assets), M-05 (mitigated), L-03 (future)**
