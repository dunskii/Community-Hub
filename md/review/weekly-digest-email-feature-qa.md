# Weekly Digest Email Feature - QA Review R1

**Date:** 31 March 2026
**Reviewer:** Claude Code (Opus 4.6)
**Scope:** Follow system removal, weekly digest email implementation, unsubscribe flow
**Files reviewed:** 22 new + modified files

---

## Summary

The feature removes the Follow system (backend + frontend), merges engagement into Save-only, adds weekly digest email preferences to users, and creates a complete weekly digest pipeline (service, scheduler, unsubscribe endpoint, frontend preferences panel, and unsubscribe page).

**Overall Score: 82/100** - Solid implementation with some critical issues to address.

---

## Critical Issues (Must Fix)

### C-1: XSS Vulnerability in Email HTML Rendering

**Files:** `packages/backend/src/services/weekly-digest-service.ts` (lines 199-251)

The `buildDealsHtml()` and `buildEventsHtml()` methods interpolate business names, deal titles, event titles, and venue names directly into HTML strings without HTML-encoding. If a business owner injects malicious content into their business name or deal title (e.g., `<script>alert('xss')</script>`), it will be rendered in digest emails.

```typescript
// Line 204 - deal.title and deal.discount injected raw
<strong style="...">${deal.title}</strong>
${deal.discount ? `<span ...>${deal.discount}</span>` : ''}
<span ...>${deal.businessName}</span>
```

**Fix:** Create an `escapeHtml()` utility and apply it to all user-supplied values before HTML interpolation:
```typescript
function escapeHtml(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
```

### C-2: Unsubscribe Token Has No Expiry

**File:** `packages/backend/src/utils/unsubscribe-token.ts`

The HMAC-based unsubscribe token is stateless and **never expires**. Once generated, a token is valid forever. If a token is leaked (email forwarded, URL logged), anyone can unsubscribe the user at any time.

**Fix:** Include a timestamp in the token payload and validate it during verification (e.g., 90-day expiry):
```typescript
const data = `${userId}:${type}:${Math.floor(Date.now() / 1000)}`;
// In verify: check that timestamp is within MAX_AGE
```

### C-3: HMAC Secret Falls Back to Hardcoded Default

**File:** `packages/backend/src/utils/unsubscribe-token.ts` (line 10)

```typescript
const HMAC_SECRET = process.env['JWT_SECRET'] || 'default-secret-change-in-production';
```

This loads the secret at **module import time**, meaning it uses whatever `JWT_SECRET` is at startup. While using JWT_SECRET is acceptable, the fallback `'default-secret-change-in-production'` is dangerous -- if JWT_SECRET is unset, all tokens are generated with a known secret. In production this should throw.

**Fix:** Remove the fallback and throw if not set:
```typescript
const HMAC_SECRET = process.env['JWT_SECRET'];
if (!HMAC_SECRET) throw new Error('JWT_SECRET is required for unsubscribe token generation');
```

### C-4: Frontend UnsubscribePage Always Shows Success

**File:** `packages/frontend/src/pages/UnsubscribePage.tsx` (lines 36-41)

```typescript
} catch {
  // The unsubscribe endpoint returns HTML, so even a successful response
  // may not parse as JSON. Since the backend handles it, just mark success
  // if we got here (the token was sent).
  setStatus('success');
}
```

The catch block always sets `success`, meaning even if the token is invalid or the server returns an error, the user sees "You have been unsubscribed." This is a correctness bug.

**Root Cause:** The frontend uses `get()` from `api-client` which expects JSON, but the backend unsubscribe route returns HTML. The frontend route and backend route serve different purposes and are architecturally mismatched.

**Fix:** Either:
1. Have the backend return JSON from a `/api/v1/unsubscribe` endpoint and render the UI in React, OR
2. Remove the React `UnsubscribePage` and let the backend HTML response handle it directly (user clicks email link -> backend renders HTML confirmation), OR
3. Create a separate API endpoint that returns JSON (e.g., `POST /api/v1/unsubscribe`) for the React page, distinct from the HTML GET endpoint.

---

## Security Issues

### S-1: Unsubscribe Endpoint Lacks CSRF Protection (Low Risk)

**File:** `packages/backend/src/routes/unsubscribe.ts`

The GET endpoint modifies state (updates user preferences). While the HMAC token provides authentication, GET requests that modify state violate REST conventions and can be triggered by prefetch/preload behavior in email clients and browsers. RFC 8058 recommends POST for one-click unsubscribe.

**Recommendation:** Add a POST handler for actual state change; the GET should render a confirmation page with a "Confirm Unsubscribe" button that POSTs.

### S-2: Potential Information Disclosure in Unsubscribe Error

**File:** `packages/backend/src/routes/unsubscribe.ts` (line 79)

```typescript
logger.error({ error, userId: payload.userId }, 'Failed to process unsubscribe');
```

If the Prisma `update` fails because the `userId` does not exist in the database, this leaks that the user ID from the token was valid (the HMAC verified) but the user record is gone. This is low risk but worth noting.

### S-3: `notificationPreferences` Stored with `as any` Cast

**File:** `packages/backend/src/services/user-service.ts` (line 460)

```typescript
notification_preferences: preferences as any,
```

The entire `preferences` object (including `receiveDealEmails` and `receiveEventEmails`) is being stored in the JSON `notification_preferences` column. Only the top-level `receive_deal_emails` and `receive_event_emails` fields get extracted. However, the `as any` cast bypasses type safety and could allow unexpected data into the JSON column.

**Pre-existing issue** - not introduced by this feature, but the feature extends this pattern.

---

## Specification Deviations

### SD-1: Hardcoded Locale in Date Formatting

**File:** `packages/backend/src/services/weekly-digest-service.ts` (lines 125, 177-182)

```typescript
deal.valid_until.toLocaleDateString('en-AU', { ... })
event.start_time.toLocaleDateString('en-AU', { ... })
```

Dates are hardcoded to `en-AU` locale. The user's `language_preference` is available but not used for date formatting. Per the i18n spec, user-facing content should respect language preferences.

**Fix:** Use `user.language_preference` to determine the locale for date formatting, or use the platform timezone from config.

### SD-2: Discount Labels Are English-Only

**File:** `packages/backend/src/services/weekly-digest-service.ts` (lines 109-118)

```typescript
discount = `${deal.discount_value}% off`;
discount = `$${deal.discount_value} off`;
discount = 'Buy one get one';
discount = 'Free item';
```

These strings are hardcoded in English and not translated. For a platform supporting 10 languages, these should be localized in the email templates or use a server-side i18n approach.

### SD-3: Currency Symbol Hardcoded to `$`

**File:** `packages/backend/src/services/weekly-digest-service.ts` (line 113)

```typescript
discount = `$${deal.discount_value} off`;
```

The currency symbol should come from `config.location.currencySymbol` to maintain location-agnosticism.

---

## Remaining Follow References (Incomplete Cleanup)

### RF-1: Frontend analytics-service.ts still references FOLLOW/UNFOLLOW

**File:** `packages/frontend/src/services/analytics-service.ts` (lines 22-23, 58, 75)

- `AnalyticsEventType` still includes `'FOLLOW'` and `'UNFOLLOW'`
- `AnalyticsResponse.summary` still has `follows: MetricSummary`
- `AnalyticsResponse.timeseries` still has `follows: number`

### RF-2: Shared analytics schema still includes FOLLOW/UNFOLLOW

**File:** `packages/shared/src/schemas/analytics-schemas.ts` (lines 29-30)

```typescript
'FOLLOW',
'UNFOLLOW',
```

These values were removed from the Prisma enum in the migration but remain in the Zod validation schema.

### RF-3: OwnerDashboardPage still shows followerCount

**File:** `packages/frontend/src/pages/owner/OwnerDashboardPage.tsx` (lines 59, 371)

- `OwnedBusiness` interface still has `followerCount: number`
- Line 371 displays: `{selectedBusiness.followerCount} {t('owner.followers', 'followers')}`

### RF-4: claim-queries.ts still returns hardcoded followerCount: 0

**File:** `packages/backend/src/services/claim/claim-queries.ts` (line 111)

```typescript
followerCount: 0,
```

### RF-5: Backend analytics test still mocks businessFollow

**File:** `packages/backend/src/services/analytics-service.test.ts` (line 33)

```typescript
businessFollow: {
  count: vi.fn(),
},
```

### RF-6: i18n translation files still contain follow-related keys

All 10 language `reviews.json` files contain a `"follow"` section with keys: `follow`, `following`, `unfollow`, `followerCount`, `followerCount_plural`.

All 10 language `owner.json` files contain `"followers"`, `"newFollowers"`, `"follows"` keys.

All 10 language `translation.json` files contain `"followers"` and `"newFollowers"` keys.

These are dead translations that should be cleaned up.

---

## Missing i18n Keys

### I-1: No digest translation keys in any language file

The `DigestPreferencesPanel` component uses translation keys like `digest.title`, `digest.description`, `digest.dealAlerts`, etc. with English fallbacks. However, **no translation files contain a `digest` section** for any of the 10 supported languages.

This means all non-English users will see English fallback text for digest preferences. Translation keys that need to be added to all 10 locale files:

- `digest.title`
- `digest.description`
- `digest.dealAlerts`
- `digest.dealAlertsDescription`
- `digest.eventAlerts`
- `digest.eventAlertsDescription`
- `digest.saved`
- `digest.unsubscribeTitle`
- `digest.unsubscribed`
- `digest.unsubscribedDescription`
- `digest.resubscribe`
- `digest.managePreferences`
- `digest.unsubscribeError`
- `digest.unsubscribeErrorDescription`
- `digest.invalidToken`

---

## Missing Tests

### T-1: No tests for WeeklyDigestService

No test file exists for `weekly-digest-service.ts`. Needs tests for:
- `getDigestUsers()` - filters correctly (verified, active, opted-in)
- `getDealsForUser()` - returns only active deals from saved businesses
- `getEventsForUser()` - returns only upcoming events from saved businesses
- `buildDealsHtml()` / `buildEventsHtml()` - edge cases (empty, HTML escaping)
- `sendDigestForUser()` - skip when no content, send when content exists

### T-2: No tests for WeeklyDigestScheduler

No test file exists for `weekly-digest-scheduler.ts`. Needs tests for:
- `checkAndSend()` - only sends on configured day/hour
- Deduplication (Redis + DB fallback)
- `getYearWeek()` - year boundary edge cases
- Batch processing
- Error handling for individual users

### T-3: No tests for unsubscribe-token.ts

No test file exists. Needs tests for:
- Token generation and verification round-trip
- Tampered token rejection
- Invalid format handling
- Timing-safe comparison verification

### T-4: No tests for unsubscribe route

No test file exists. Needs tests for:
- Valid token -> 200 with success HTML
- Invalid token -> 400
- Missing token -> 400
- Rate limiting
- Database update verification

### T-5: No tests for DigestPreferencesPanel

No test file exists. Needs tests for:
- Renders toggles with correct initial state
- Toggle triggers API call
- Optimistic update + revert on error
- Disabled state during save
- Accessibility (ARIA labels, keyboard nav)

### T-6: No tests for UnsubscribePage

No test file exists. Needs tests for:
- Loading state
- Success state
- Error state (missing token)
- Accessibility

---

## Accessibility Issues

### A-1: UnsubscribePage SVG icons lack aria-hidden

**File:** `packages/frontend/src/pages/UnsubscribePage.tsx` (lines 64, 86)

The decorative SVG checkmark and X icons lack `aria-hidden="true"`, so screen readers may attempt to describe them.

### A-2: UnsubscribePage loading state lacks live region

**File:** `packages/frontend/src/pages/UnsubscribePage.tsx`

The status transitions (loading -> success/error) should be announced to screen readers. The container should have `role="status"` or `aria-live="polite"`.

### A-3: DigestPreferencesPanel has no error announcement

**File:** `packages/frontend/src/components/DigestPreferencesPanel/DigestPreferencesPanel.tsx`

When the toast shows an error after API failure, there is no `aria-live` region ensuring screen readers announce it. The `useToastHelpers` may handle this, but should be verified.

---

## Performance Issues

### P-1: N+1 Query Pattern in Digest Processing

**File:** `packages/backend/src/schedulers/weekly-digest-scheduler.ts` (lines 130-147)

Each user in the batch triggers 2 separate database queries (deals + events) sequentially. For 1000 opted-in users, this means 2000+ individual queries. While batching is implemented (50 users per batch), the queries within each batch are sequential.

**Recommendation:** Consider prefetching all saved business IDs for the batch, then running bulk queries for deals and events across all users in the batch.

### P-2: Config Loaded Per User in Digest

**File:** `packages/backend/src/services/weekly-digest-service.ts` (line 259)

```typescript
const config = loadPlatformConfig();
```

`loadPlatformConfig()` is called once per user in `sendDigestForUser()`. While this is likely cached, it should be loaded once and passed as a parameter.

---

## Code Quality Issues

### Q-1: `as any` Usage in user-service.ts (Pre-existing)

**File:** `packages/backend/src/services/user-service.ts` (line 30)

```typescript
languagePreference: user.language_preference as any,
```

This `as any` cast pre-dates this feature but is used in the new `toUserPublic` mapping. The `LanguageCode` type in `auth.ts` does not include `zh-CN` or `zh-TW` (only `zh`), creating a type mismatch with the actual data.

### Q-2: Backend platform.json Missing `socialPosting` Feature Flag

**File:** `packages/backend/config/platform.json`

The backend config does not include `"socialPosting": false` while the root config does. This could cause a schema validation discrepancy.

### Q-3: Backend platform.json Missing `digest` Section

**File:** `packages/backend/config/platform.json`

Need to verify - the root `config/platform.json` has the `digest` section but the backend copy may not. The scheduler checks `config.digest?.enabled` with optional chaining, which handles this gracefully, but the configs should be in sync.

### Q-4: `Record<string, any>` in auth-api.ts (Pre-existing)

**File:** `packages/frontend/src/services/auth-api.ts` (line 18)

```typescript
notificationPreferences: Record<string, any> | null;
```

TypeScript strict mode violation with `any` type. Should use the proper `NotificationPreferences` interface.

---

## Edge Cases Handled Well

- Empty digests (no content) -> skipped, not sent (line 267-269)
- User with no saved businesses -> empty deals/events -> skip
- Redis unavailable -> DB fallback for deduplication (lines 183-198, 204-228)
- Concurrent processing guard (`isProcessing` flag)
- Per-user deduplication prevents duplicate sends on restart
- 8-day TTL on Redis keys ensures cleanup
- `deletion_requested_at: null` filter excludes users pending deletion
- `email_verified: true` filter ensures only verified users receive emails

---

## Platform Config Changes Review

- `features.businessFollowing` correctly renamed to `features.weeklyDigest`
- New `digest` section with `enabled`, `weeklyDigestDay`, `weeklyDigestHourUTC` added
- Schema in `platform-schema.ts` correctly makes `digest` optional with sensible defaults
- `weeklyDigestDay` validated 0-6, `weeklyDigestHourUTC` validated 0-23

---

## Recommendations

### High Priority
1. Fix C-1 (XSS in email HTML) - **security critical**
2. Fix C-3 (HMAC secret fallback) - **security critical**
3. Fix C-4 (UnsubscribePage always shows success) - **correctness bug**
4. Clean up RF-1 through RF-5 (stale follow references in code)
5. Add i18n keys for digest feature (I-1)
6. Write tests for new files (T-1 through T-6)

### Medium Priority
7. Fix C-2 (add token expiry)
8. Fix SD-1 (locale-aware date formatting)
9. Fix SD-2/SD-3 (hardcoded English/currency in discount labels)
10. Fix S-1 (POST for unsubscribe state change)
11. Add `aria-hidden` to decorative SVGs (A-1)
12. Add live region for status changes (A-2)

### Low Priority
13. Optimize N+1 queries in batch processing (P-1)
14. Load config once per batch (P-2)
15. Clean up stale follow translation keys (RF-6)
16. Sync backend platform.json with root (Q-2, Q-3)

---

## Verdict: CONDITIONAL PASS

The implementation is architecturally sound with good patterns (scheduler following EventReminderScheduler, Redis with DB fallback, batched processing, HMAC-based tokens). However, the XSS vulnerability in email HTML (C-1), the HMAC secret fallback (C-3), and the broken UnsubscribePage (C-4) must be fixed before production. Additionally, zero tests and missing i18n keys need to be addressed per project standards.

**Estimated effort to fix critical issues:** 2-3 hours
**Estimated effort for full R2 PASS:** 6-8 hours (including tests and i18n)
