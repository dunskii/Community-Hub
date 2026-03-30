# Business Owner Events Feature - Code Review

**Date:** 2026-03-30
**Reviewer:** Claude Code (Opus 4.6)
**Scope:** Frontend-only feature allowing business owners to create, edit, and manage events linked to their business

## Files Reviewed

### New Files
- `packages/frontend/src/pages/owner/OwnerEventCreatePage.tsx` (134 lines)
- `packages/frontend/src/pages/owner/OwnerEventEditPage.tsx` (135 lines)
- `packages/frontend/src/pages/owner/OwnerEventsPage.tsx` (271 lines)

### Modified Files
- `packages/frontend/src/App.tsx` (3 new routes)
- `packages/frontend/src/pages/owner/OwnerDashboardPage.tsx` (events quick action)
- `packages/frontend/src/i18n/locales/en/owner.json` (new i18n keys)
- All 9 other language `owner.json` files (ar, el, hi, it, ko, ur, vi, zh-CN, zh-TW)

### Backend Context (read-only verification)
- `packages/backend/src/routes/events.ts`
- `packages/backend/src/services/events/event-crud-service.ts`

---

## Critical Issues (Must Fix)

### C1. Hardcoded English string in OwnerEventsPage.tsx (line 264)

```tsx
{total} {total === 1 ? 'event' : 'events'}
```

This pluralized string is not using i18n. Should use a translation key with count interpolation:

```tsx
{t('owner.events.totalCount', { count: total })}
```

A corresponding key must be added to all 10 language files.

### C2. Hardcoded fallback string in error handlers

In `OwnerEventCreatePage.tsx` (line 53), `OwnerEventEditPage.tsx` (line 51), and `OwnerEventsPage.tsx` (line 65):

```tsx
setError(err instanceof Error ? err.message : 'Failed to load data');
setError(err instanceof Error ? err.message : 'Failed to load event');
setError(err instanceof Error ? err.message : 'Failed to load events');
```

These fallback strings are hardcoded English. If the `err` is not an `Error` instance, the user sees English regardless of locale. Use `t()` for fallbacks:

```tsx
setError(err instanceof Error ? err.message : t('common.errorGeneric'));
```

Note: The `err.message` from API calls likely comes from the backend in English too, but that is a broader issue. At minimum the fallbacks should be translated.

### C3. OwnerEventEditPage does not verify business ownership on the frontend

The edit page fetches the event by `eventId` but never checks that `event.linkedBusinessId === businessId` (from the URL param). A user could navigate to `/business/manage/BUSINESS_A/events/EVENT_FROM_BUSINESS_B/edit` and the page would load the event form for an event belonging to a different business.

The backend does enforce `created_by_id` ownership on the PUT endpoint, so the actual update would fail. However, the frontend should validate this for a clean UX:

```tsx
// After loading the event, verify it belongs to this business
if (eventRes.data.linkedBusinessId !== businessId) {
  setError(t('owner.events.eventNotFound'));
  setLoading(false);
  return;
}
```

---

## Warnings (Should Fix)

### W1. `createSuccess` and `updateSuccess` i18n keys are defined but never used

The English `owner.json` defines `owner.events.createSuccess` and `owner.events.updateSuccess`, but neither `OwnerEventCreatePage` nor `OwnerEventEditPage` shows a success toast/message. Both pages navigate away immediately on success. Either:
- Show a toast notification before navigating (better UX), or
- Remove the unused keys to avoid confusion

### W2. Missing `aria-label` on the back button

All three pages use a back button (`<button>` with `ArrowLeftIcon` + text). While the text is visible, the button lacks an explicit `aria-label`. The visible text should suffice for screen readers, but ensure the icon is decorative (`aria-hidden="true"`). The `ArrowLeftIcon` from Heroicons should have this by default, but verify.

### W3. Edit page does not check `businessId` in the useEffect dependency

In `OwnerEventEditPage.tsx` (line 57), the `useEffect` depends only on `[eventId]` but does not include `businessId`. If the `businessId` param changed (unlikely but possible in edge cases), the business verification mentioned in C3 would not re-run.

### W4. No loading/error state when submitting fails in Create page

In `OwnerEventCreatePage.tsx`, when `handleSubmit` catches an error (line 72), `setSubmitting(false)` is called so the user can retry. However, the page does not scroll to the error message. On mobile, the error banner at the top may be offscreen. Consider scrolling to the error or using a toast.

### W5. OwnerEventsPage does not filter by PENDING status for the owner's own events

The `listEvents` call uses `linkedBusinessId` filter but does not pass `status` filter. The backend list endpoint may not return PENDING events to non-admin users by default (depending on implementation). If that's the case, newly created events would not appear in the owner's list until approved. Verify backend behavior and consider passing `createdById` filter or ensuring the backend returns PENDING events to their creator.

### W6. `ml-2` hardcoded in business name display (RTL concern)

In `OwnerEventCreatePage.tsx` (line 99) and `OwnerEventEditPage.tsx` (line 94):

```tsx
<span className="text-slate-400 font-normal text-lg ml-2">
```

`ml-2` (margin-left) does not flip for RTL languages (Arabic, Urdu). Should use `ms-2` (margin-inline-start) for proper bidirectional support, or Tailwind's `rtl:` variant.

---

## Recommendations (Nice to Have)

### R1. Extract shared loading skeleton pattern

All three pages use the same Skeleton loading pattern (4 skeleton rows). Consider extracting a `FormSkeleton` or `EventFormSkeleton` component to reduce duplication.

### R2. Add delete/cancel event functionality

The events list shows edit actions but no delete or cancel functionality. Business owners may need to cancel events. The backend already supports `DELETE /events/:id`. This could be a follow-up task.

### R3. Consider `useCallback` for `handleSubmit`

In `OwnerEventCreatePage` and `OwnerEventEditPage`, `handleSubmit` is recreated on every render and passed to `EventForm`. If `EventForm` uses `React.memo`, wrapping `handleSubmit` in `useCallback` would prevent unnecessary re-renders. Currently acceptable since the pages are simple.

### R4. Consider toast notification for success feedback

After successful creation/editing, navigating immediately to the events list provides no feedback. Using the existing `useToast` hook (from v2.2 UX-5) would improve UX:

```tsx
const { showToast } = useToast();
// On success:
showToast({ type: 'success', message: t('owner.events.createSuccess') });
navigate(backUrl);
```

### R5. The `en-AU` locale fallback in formatEventDate

In `OwnerEventsPage.tsx` (line 172):

```tsx
const dateInfo = formatEventDate(event.startTime, event.endTime, i18n.language === 'en' ? 'en-AU' : i18n.language);
```

The `en-AU` fallback is hardcoded for the first deployment (Guildford South, Sydney). While not a spec violation per se (date formatting uses Intl which handles locale gracefully), consider deriving this from the platform config locale rather than hardcoding `en-AU`.

### R6. Add confirmation dialog for navigating away from unsaved form

If a user partially fills the EventForm and clicks "Back to Events", all data is lost. Consider using a `beforeunload` handler or a confirmation dialog. This is a UX enhancement, not a requirement.

---

## Missing Items

### M1. No tests written

No test files were created for any of the three new pages. Per project standards (>80% coverage target), tests should be written. At minimum:

- **OwnerEventsPage**: Test loading state, empty state, event list rendering, pagination, error state
- **OwnerEventCreatePage**: Test form rendering, submission, error handling, pending notice display
- **OwnerEventEditPage**: Test event loading, form pre-fill, submission, event-not-found state

Recommended test file locations:
- `packages/frontend/src/pages/owner/__tests__/OwnerEventsPage.test.tsx`
- `packages/frontend/src/pages/owner/__tests__/OwnerEventCreatePage.test.tsx`
- `packages/frontend/src/pages/owner/__tests__/OwnerEventEditPage.test.tsx`

### M2. No E2E test coverage

No end-to-end tests for the business owner event creation flow.

---

## Checklist Results

| Category | Status | Notes |
|---|---|---|
| TypeScript & Code Quality | PASS | No `any` types, proper error handling, consistent patterns |
| Security | PASS | No hardcoded secrets, no XSS vectors, backend validates ownership, rate limiting on POST/PUT, CSRF via api-client |
| Specification Compliance | PASS | Events created with PENDING status for non-admins (line 108-110 of backend), business ownership validated server-side (line 74-80 of backend) |
| i18n Completeness | FAIL | 1 hardcoded English string (line 264), 3 hardcoded error fallbacks, `ml-2` RTL issue. All 10 language files have matching keys for the events section. |
| Accessibility (WCAG 2.1 AA) | PASS (minor) | Interactive elements are keyboard accessible, touch targets adequate (buttons use padding), no focus traps. Minor: verify `aria-hidden` on decorative icons. |
| Location-Agnostic | PASS (minor) | No hardcoded suburb/coordinates. Minor: `en-AU` locale fallback in date formatting. |
| Performance | PASS | `useCallback` for `fetchEvents`, `Promise.all` for parallel data loading, pagination implemented. |
| Edge Cases | PARTIAL | Empty state handled. Invalid businessId returns error from API. Missing: frontend ownership cross-check on edit page (C3). |
| Route Structure | PASS | Routes follow `/business/manage/:businessId/*` pattern, wrapped in `ProtectedRoute`. |
| Tests | FAIL | No tests written for any of the 3 new pages. |

---

## Overall Assessment

**Score: 7.5/10 - Good with required fixes**

The implementation is clean, well-structured, and follows the existing patterns in the codebase. The three pages appropriately reuse existing components (`EventForm`, `PageContainer`, `Badge`, `Pagination`, `EmptyState`, `Skeleton`), and the backend integration is correct with proper PENDING status flow.

**Strengths:**
- Clean component architecture following existing patterns
- Proper use of existing EventForm component (no duplication)
- Correct backend API integration (linkedBusinessId injection, PENDING status)
- Complete i18n across all 10 languages (except for 1 hardcoded string)
- Dark mode support throughout
- Loading skeletons and empty states
- noindex/nofollow meta tags on management pages

**Must-fix before merge:**
1. Translate the hardcoded "event/events" count string (C1)
2. Translate error fallback strings (C2)
3. Add frontend cross-check for event-business ownership on edit page (C3)

**Should-fix soon:**
1. Fix RTL margin issue (`ml-2` -> `ms-2`) (W6)
2. Verify PENDING events appear in owner's list (W5)
3. Add success toast notifications (R4 + W1)

**Required follow-up:**
1. Write unit tests for all 3 new pages (M1)
