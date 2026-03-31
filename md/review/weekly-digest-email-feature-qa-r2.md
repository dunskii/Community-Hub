# Weekly Digest Email Feature - QA R2 Review

**Date:** 2026-03-31
**Reviewer:** Claude (Opus 4.6)
**Review Type:** R2 Re-review (post-critical-fix)
**Feature:** Weekly Digest Email + Follow System Removal
**Score: 88/100** (up from R1)

---

## R1 Critical Fix Verification

### C-1: XSS in Email HTML -- FIXED
`escapeHtml()` function added at lines 21-28 of `weekly-digest-service.ts`. All user-sourced content in `buildDealsHtml()` and `buildEventsHtml()` is escaped: `deal.title`, `deal.dealUrl`, `deal.discount`, `deal.businessName`, `deal.validUntil`, `event.title`, `event.eventUrl`, `event.date`, `event.time`, `event.location`, `event.businessName`. Correctly handles `&`, `<`, `>`, `"`, `'`.

**Verdict: PASS**

### C-2: Unsubscribe Tokens Never Expire -- FIXED
`TOKEN_EXPIRY_MS` = 30 days at line 14. `verifyUnsubscribeToken()` checks expiry at line 69: `Date.now() - tokenTime > TOKEN_EXPIRY_MS`. Timestamp encoded in base-36 within the token payload.

**Verdict: PASS**

### C-3: HMAC Secret Hardcoded Fallback -- FIXED
`getHmacSecret()` at lines 24-34 throws `Error('JWT_SECRET must be set in production')` when `NODE_ENV === 'production'` and secret is missing. Development fallback only used in non-production with a `logger.warn()`. Uses `JWT_SECRET` which is already a required env var.

**Verdict: PASS**

### C-4: UnsubscribePage Always Shows Success -- FIXED
`UnsubscribePage.tsx` now uses raw `fetch()` (line 36) and checks `response.ok` (line 37). On non-OK responses, sets `status('error')` with appropriate error message. Network errors caught in catch block. Three distinct UI states: loading, success, error.

**Verdict: PASS**

---

## New Issues Found in R2

### HIGH Priority

#### H-1: Stale `follows` field in frontend analytics-service.ts
**File:** `packages/frontend/src/services/analytics-service.ts`, lines 56 and 73
**Issue:** The `AnalyticsResponse` type still contains `follows: MetricSummary` in `summary` and `follows: number` in `timeseries`. The Follow system has been removed -- the backend no longer returns these fields. This will cause TypeScript type mismatches or undefined values at runtime when rendering the AnalyticsDashboardPage.
**Fix:** Remove `follows` from the `AnalyticsResponse` type definition.

#### H-2: Stale follow-related i18n keys across all 10 languages
**Files:** All `packages/frontend/src/i18n/locales/*/translation.json` and `*/owner.json`
**Issue:** Every language still has `"followers"` keys in `translation.json` (line ~158/229) and both `"followers"` and `"follows"` keys in `owner.json` (lines ~8 and ~103-104). These are dead keys from the removed Follow system. While harmless at runtime, they add confusion and translation maintenance burden.
**Fix:** Remove the stale `followers` and `follows` keys from all 10 language files (20 files total: 10 `translation.json` + 10 `owner.json`).

#### H-3: Frontend test setup missing `digest` config
**File:** `packages/frontend/src/__tests__/setup.ts`
**Issue:** The `mockPlatformConfig` object (which is used by all frontend tests) does not include the `digest` block. The `platformConfigSchema` has `digest` as optional with defaults, but the mock config will silently lack `digest.enabled`, `digest.weeklyDigestDay`, `digest.weeklyDigestHourUTC`. Any test or component that reads `config.digest` may fail or get undefined.
**Fix:** Add `digest: { enabled: true, weeklyDigestDay: 1, weeklyDigestHourUTC: 21 }` to `mockPlatformConfig`.

### MEDIUM Priority

#### M-1: Hardcoded `'en-AU'` locale in date formatting
**File:** `packages/backend/src/services/weekly-digest-service.ts`, lines 139, 191, 196
**Issue:** `toLocaleDateString('en-AU', ...)` and `toLocaleTimeString('en-AU', ...)` are hardcoded rather than using the user's `language_preference` or the platform's `location.locale` from config. Users who prefer Korean, Arabic, etc. will still see dates formatted in Australian English in their digest emails. This violates the project's location-agnostic and multilingual requirements.
**Fix:** Use `user.language_preference` (or a BCP-47 to locale mapping) when formatting dates/times. Fall back to `config.location.locale` for the platform default.

#### M-2: Unsubscribe HTML page does not escape `platformName`
**File:** `packages/backend/src/routes/unsubscribe.ts`, line 93
**Issue:** `buildHtmlPage()` injects `platformName` directly into the HTML `<title>` tag without escaping. While `platformName` comes from the trusted platform config (not user input), if the config ever contained characters like `<` or `"`, it could break the HTML. Defense-in-depth suggests escaping all dynamic values in HTML templates.
**Fix:** Apply HTML escaping to `title`, `message`, and `platformName` in `buildHtmlPage()`.

#### M-3: No database indexes on `receive_deal_emails` / `receive_event_emails`
**File:** `packages/backend/prisma/migrations/20260331000000_remove_follows_add_digest_prefs/migration.sql`
**Issue:** The `getDigestUsers()` query filters by `receive_deal_emails` OR `receive_event_emails` (plus `email_verified`, `status`, `deletion_requested_at`). Without indexes on the new boolean columns, this query will do a full table scan on `users`. While acceptable for small deployments, this should be indexed for scalability.
**Fix:** Add a composite or individual index: `CREATE INDEX idx_users_digest_prefs ON users(receive_deal_emails, receive_event_emails) WHERE email_verified = true AND status = 'ACTIVE' AND deletion_requested_at IS NULL;`

#### M-4: `notification_preferences: preferences as any` in user-service.ts
**File:** `packages/backend/src/services/user-service.ts`, line 460
**Issue:** The `updateNotificationPreferences` function casts `preferences` to `any` when saving to Prisma. The function signature accepts `NotificationPreferences & { receiveDealEmails?: boolean; receiveEventEmails?: boolean }`, but the entire object (including `receiveDealEmails`/`receiveEventEmails`) gets stored in the JSON `notification_preferences` column. The digest fields are separately extracted to their own columns (lines 463-468), but the JSON blob will also contain them -- creating data duplication.
**Fix:** Destructure `receiveDealEmails` and `receiveEventEmails` out of `preferences` before storing the JSON, or create a clean object without those fields.

#### M-5: No tests for any new code
**Issue:** Zero test files exist for:
- `WeeklyDigestService`
- `WeeklyDigestScheduler`
- `unsubscribe-token.ts` (generate/verify)
- `unsubscribe.ts` route
- `DigestPreferencesPanel` component
- `UnsubscribePage` component
The project standard is >80% coverage target. These are new, security-sensitive features (HMAC tokens, XSS prevention, user preference management).
**Fix:** Add at minimum:
1. Unit tests for `generateUnsubscribeToken` / `verifyUnsubscribeToken` (expiry, tampering, edge cases)
2. Unit tests for `WeeklyDigestService.buildDealsHtml` / `buildEventsHtml` (XSS escaping)
3. Component tests for `DigestPreferencesPanel` (toggle behavior, error rollback)
4. Component tests for `UnsubscribePage` (loading/success/error states)

### LOW Priority / Recommendations

#### L-1: `followerCount: 0` still in claim-queries.ts
**File:** `packages/backend/src/services/claim/claim-queries.ts`, line 111
**Issue:** Returns a hardcoded `followerCount: 0` field. The property is harmless since the frontend no longer reads it, but it's dead code that will confuse future developers.
**Fix:** Remove `followerCount: 0` from the return object.

#### L-2: `Record<string, any>` in frontend auth-api.ts User type
**File:** `packages/frontend/src/services/auth-api.ts`, line 18
**Issue:** `notificationPreferences: Record<string, any> | null` uses `any`. This predates this feature but is relevant since the type now also carries `receiveDealEmails`/`receiveEventEmails`. Consider typing `notificationPreferences` properly.

#### L-3: DB fallback for digest dedup creates unbounded system_settings rows
**File:** `packages/backend/src/schedulers/weekly-digest-scheduler.ts`, lines 216-228
**Issue:** When Redis is unavailable, the scheduler stores per-user digest markers in `system_settings`. With the format `digest:weekly:sent:{userId}:{yearWeek}`, this creates one row per user per week. These rows are never cleaned up (unlike Redis which has an 8-day TTL). Over months, this table will grow significantly.
**Fix:** Add a cleanup step in the scheduler or data retention scheduler that deletes `system_settings` rows with keys matching `digest:weekly:sent:*` older than 2 weeks.

#### L-4: `triggerDigest()` bypasses dedup checks
**File:** `packages/backend/src/schedulers/weekly-digest-scheduler.ts`, lines 234-246
**Issue:** The manual `triggerDigest()` method resets `isProcessing` and sends to all users without checking per-user dedup keys. This means a manual trigger could re-send digests to users who already received one that week.
**Fix:** Either add dedup checking to `triggerDigest()` or document that it is intentionally unchecked (for testing purposes).

#### L-5: Email template `body_text` still contains `{{dealsHtml}}` placeholder
**File:** `packages/backend/src/db/seeds/seed-weekly-digest-template.ts`, lines 163-173
**Issue:** The `body_text` variants contain `{{dealsHtml}}` and `{{eventsHtml}}` which are HTML strings. In a plain-text email context, these will render as raw HTML tags. The email service should either strip HTML from these sections for the text version or provide separate plain-text content.
**Fix:** Generate separate plain-text deal/event lists (title + business name + date, one per line) for the text email body.

#### L-6: Consider List-Unsubscribe header for RFC 8058 compliance
**Issue:** The email template includes an unsubscribe link in the body, but RFC 8058 "One-Click Unsubscribe" compliance also requires a `List-Unsubscribe` and `List-Unsubscribe-Post` header on the email itself. This improves deliverability and allows email clients (Gmail, Outlook) to show native unsubscribe buttons.
**Fix:** Add headers when sending the digest email: `List-Unsubscribe: <unsubscribeUrl>` and `List-Unsubscribe-Post: List-Unsubscribe=One-Click`.

---

## Pre-existing Issues (not from this feature)

#### PE-1: Multiple `as any` casts in user-service.ts and auth-service.ts
`language_preference as any` appears 8+ times across user-service.ts and auth-service.ts. The `LanguageCode` type in `auth.ts` doesn't match the actual supported languages (e.g., `'zh'` instead of `'zh-CN'`). This predates the current feature.

#### PE-2: `notification_preferences` JSON column lacks typed schema
The `notification_preferences` Prisma column stores a raw JSON blob with no database-level validation. The `NotificationPreferences` interface exists in TypeScript but isn't enforced at the DB layer. Predates this feature.

---

## Summary of Findings

| Severity | Count | Items |
|----------|-------|-------|
| Critical | 0 | -- |
| High | 3 | H-1, H-2, H-3 |
| Medium | 5 | M-1, M-2, M-3, M-4, M-5 |
| Low | 6 | L-1, L-2, L-3, L-4, L-5, L-6 |
| Pre-existing | 2 | PE-1, PE-2 |

## What Was Done Well

1. **R1 critical fixes properly applied** -- All four critical issues from R1 are correctly resolved
2. **Clean Follow system removal** -- FollowButton, FollowingPage, follow-service, follow routes, follow rate limiter all properly deleted; Prisma schema updated; migration drops table and enum values correctly
3. **Security-conscious token design** -- HMAC-based stateless tokens with timing-safe comparison, expiry, base64url encoding
4. **Robust scheduler architecture** -- Follows EventReminderScheduler pattern with Redis dedup + DB fallback, batch processing, idempotent processing
5. **Proper i18n approach** -- DigestPreferencesPanel uses `t()` with fallback strings; email templates cover all 10 languages
6. **WCAG 2.1 AA compliance** -- DigestPreferencesPanel has `aria-labelledby`, `aria-label` on toggles, proper section structure
7. **Optimistic UI updates** -- DigestPreferencesPanel does optimistic toggle with rollback on error
8. **Email seed template** -- All 10 languages covered for subject, body_html, and body_text

## Verdict

**CONDITIONAL PASS** -- The R1 critical fixes are all properly resolved. No new critical issues found. The feature is well-architected with good security practices. However, three high-priority items should be addressed before deployment: the stale `follows` type in analytics-service (H-1), dead i18n keys (H-2), and missing test setup config (H-3). The lack of any tests (M-5) is the most significant medium-priority gap for a security-sensitive feature.

**Recommended next steps:**
1. Fix H-1 (stale follows type) -- immediate, prevents potential runtime issues
2. Fix H-3 (test setup config) -- immediate, prevents test failures
3. Add basic tests for token utilities and components (M-5) -- before deployment
4. Address M-1 (locale hardcoding) and M-3 (indexes) -- before production scale
