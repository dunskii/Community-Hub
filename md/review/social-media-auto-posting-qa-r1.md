# Social Media Auto-Posting - QA Review R1
Date: 2026-03-26

## Overall Score: 78/100

## Summary

The Social Media Auto-Posting feature is a substantial, well-architected implementation covering 5 platform adapters, encrypted token storage, queue-based async publishing, and a clean frontend integration. The adapter pattern, Redis queue with DLQ, and CSRF-protected OAuth flows demonstrate solid engineering. However, there are critical security issues in the OAuth callback (XSS), a broken PKCE flow for Twitter, missing feature flag enforcement, no tests at all (0 of ~190 planned), and some spec compliance gaps. The implementation addresses a real need (sharing deals to social platforms) that goes beyond what Spec S20 explicitly defines (which focuses on feed aggregation), but this is a reasonable product extension.

---

## Critical Issues (Must Fix)

### C1: XSS Vulnerability in OAuth Callback HTML

**File:** `packages/backend/src/controllers/social-controller.ts` lines 394-412

The `callbackHTML()` method interpolates user-controlled values (`platform`, `error`) directly into inline JavaScript and HTML without adequate sanitization. The error message from OAuth providers (or attackers manipulating the callback) is only escaped for single quotes but not for other injection vectors.

```typescript
// Current: only escapes single quotes
`{ type: 'social-auth-error', platform: '${platform}', error: '${(error || '').replace(/'/g, "\\'")}' }`
```

An attacker could craft a callback URL with an `error` query parameter containing `</script><script>alert(1)</script>` or similar payloads. The `platform` parameter (from the route) is also interpolated without sanitization.

**Fix:** Escape all values for HTML/JS context using `JSON.stringify()` for the JS values and HTML-encode the display text. Better yet, use `encodeURIComponent` or pass data via `data-*` attributes and read them with DOM APIs.

### C2: Twitter PKCE Flow is Broken

**File:** `packages/backend/src/social/adapters/twitter-adapter.ts` lines 39-56
**File:** `packages/backend/src/controllers/social-controller.ts` lines 148-153

The Twitter adapter's `getAuthUrl()` generates its own PKCE values internally (line 43), but these are **thrown away** and never stored. The controller generates a separate `codeVerifier` (line 151-152) that is stored in Redis via `OAuthState`, but the `codeChallenge` corresponding to that verifier is never passed to `getAuthUrl()`.

The adapter generates `{ codeVerifier, codeChallenge }` locally, uses the local `codeChallenge` in the URL, but the controller stores a different `codeVerifier` in Redis. When the callback comes, the stored `codeVerifier` won't match the `codeChallenge` in the authorization URL, causing token exchange to fail every time.

**Fix:** Either:
1. Have `getAuthUrl()` accept a `codeChallenge` parameter, or
2. Have the adapter return the generated PKCE pair so the controller can store the correct `codeVerifier`.

### C3: No Feature Flag Enforcement

**File:** Plan specified `socialPosting.enabled` flag in `config/platform.json` and platform-schema.ts.

Neither `config/platform.json` nor `packages/shared/src/config/platform-schema.ts` contain the `socialPosting` feature flag. The backend routes and scheduler start unconditionally. There is no way for an administrator to disable social posting without code changes.

**Fix:** Add `socialPosting` to platform.json and platform-schema.ts. Check the flag in the social routes (middleware or controller) and in the scheduler startup.

### C4: No Tests Exist (0 of ~190 Planned)

No test files were found for any part of the social media feature. The plan called for ~190 tests (120 backend, 30 integration, 40 frontend). This is a significant gap given the project's >80% coverage target and the security-sensitive nature of OAuth token handling.

Critical paths that need tests:
- **Encryption:** `encryptToken`/`decryptToken` round-trip, wrong key rejection, malformed input
- **Token service:** Store, retrieve, refresh with lock, expiry detection
- **Queue:** Enqueue/dequeue, retry logic, DLQ overflow, visibility timeout
- **Scheduler:** Rate limiting, scheduled post promotion, error recovery
- **Controller:** CSRF state validation, platform validation, callback error handling
- **Adapters:** OAuth URL generation, token exchange (mocked HTTP), error mapping
- **Frontend components:** jest-axe on all 4 components, SocialAccountsList states, SocialPostHistory actions

---

## High Priority Issues

### H1: Duplicate Type Definitions - `SocialPostCreateInput`

**Files:** `packages/shared/src/types/social.ts` line 71, `packages/shared/src/schemas/social-schemas.ts` line 63

`SocialPostCreateInput` is defined twice - once as a manual interface in `types/social.ts` and once as a Zod-inferred type in `social-schemas.ts`. The shared index exports them under different names (the manual one as `SocialPostCreatePayload`, the Zod one as `SocialPostCreateInput`), but this creates confusion and potential drift. The Zod schema includes `.refine()` for `scheduledAt` that the manual type doesn't capture.

**Fix:** Remove the manual interface from `types/social.ts` and use only the Zod-inferred type. Export it under a single name.

### H2: `console.warn` in Production Code

**File:** `packages/backend/src/utils/social-encryption.ts` line 28

```typescript
console.warn('[social-encryption] SOCIAL_ENCRYPTION_KEY not set, falling back to ENCRYPTION_KEY');
```

Project standard requires using the `logger` utility instead of `console.*` in production code. This was flagged in previous QA reviews.

**Fix:** Import and use `logger.warn()` from `../utils/logger.js`.

### H3: Hardcoded `en-AU` Locale in Caption Generation

**File:** `packages/backend/src/services/social-post-service.ts` lines 318-319, 354-358

The caption generation uses `toLocaleDateString('en-AU', ...)` and `toLocaleTimeString('en-AU', ...)`. This violates the location-agnostic architecture requirement. If deployed to a non-Australian suburb, dates would still format in Australian style.

**Fix:** Read the locale from platform config (e.g., `config.location.locale` or `config.location.timezone`) or accept it as a parameter.

### H4: OAuth Callback Lacks Authentication Check

**File:** `packages/backend/src/routes/social.ts` lines 56-61

The callback route has `requireAuth` applied via `router.use()` at the top, but the comment says "requireBusinessOwnership not used here because the user is returning from the OAuth provider." However, the user returning from OAuth may have an expired JWT (the popup was open for a while). The CSRF state validates `userId`, but the `req.user` may not be set if the auth cookie expired. This could lead to errors or undefined behavior.

**Fix:** Either ensure the callback can function with just the Redis state (no `req.user` needed - which is the current design, since all data comes from the stored state), or explicitly skip `requireAuth` for the callback route and rely solely on the CSRF state. Currently `requireAuth` is applied globally but may reject the callback if the JWT expired during the OAuth flow.

### H5: `EditBusinessPage.tsx` Exceeds 1000 Lines

**File:** `packages/frontend/src/pages/owner/EditBusinessPage.tsx` - 1168 lines

This file exceeds the 1000-line limit set by project standards. The social media integration has added to an already large file.

**Fix:** Extract tab content into separate components (e.g., `SocialMediaTab`, `PromotionsTab`, `DetailsTab`).

### H6: Rate Limiters are IP-Based, Not Business-Based

**File:** `packages/backend/src/middleware/social-rate-limiter.ts`

The `express-rate-limit` defaults to IP-based rate limiting. The `socialPostLimiter` is described as "10 requests per minute per business" but it actually limits by IP. A single business owner could be rate-limited by other users on the same network, or circumvent limits by changing IPs.

**Fix:** Use a custom `keyGenerator` that extracts `req.params.businessId` or `req.user.id` to rate limit per business/user rather than per IP.

---

## Medium Priority Issues

### M1: No Platform Approval Check Before Publishing

**File:** `packages/backend/src/schedulers/social-post-scheduler.ts`

The plan (Step 10) specified that adapters should check platform approval status from `system_settings` before publishing and return a "Platform not yet approved" error. This check is not implemented. The `seed-social-settings.ts` seed file also doesn't exist.

Posts will fail with generic API errors if platforms haven't approved the app, rather than a clear user-facing message.

**Fix:** Check `system_settings` for platform approval status before attempting to publish. Seed the approval settings.

### M2: Instagram Requires Image but No Validation at Creation Time

**File:** `packages/backend/src/social/adapters/instagram-adapter.ts` line 115-117

Instagram throws "Instagram requires an image for every post" at publish time. However, posts are created and queued without this check. A user could select Instagram, not provide an image, and the post would be created, queued, then fail during publish.

**Fix:** Add an upfront validation in `SocialPostService.createPosts()` that checks if Instagram is in the selected platforms and `imageUrl` is not provided.

### M3: Missing `ConnectSocialButton` Component

The implementation plan called for a dedicated `ConnectSocialButton.tsx` component with popup management and mobile fallback (redirect if popup blocked). Instead, the connect logic is inlined in `SocialAccountsList.tsx` (lines 55-67). The mobile fallback for blocked popups is not implemented.

**Fix:** Either create the planned component or add popup-blocked detection with a fallback to full-page redirect.

### M4: Caption Preview Doesn't Verify Content Ownership

**File:** `packages/backend/src/controllers/social-controller.ts` lines 365-389

The `previewCaption` endpoint reads `businessId` from the route (validated by `requireBusinessOwnership`) but the `generateCaption` call fetches the deal/event by `contentId` without verifying it belongs to `businessId`. The service's `generateDealCaption` and `generateEventCaption` methods use `findUnique` (which doesn't filter by business), while `verifyContentExists` (which does check business ownership) is only called in `createPosts`.

**Fix:** Either call `verifyContentExists` in `previewCaption` or pass `businessId` through to the caption generation.

### M5: Scheduler Processes Only One Item Per 30-Second Cycle

**File:** `packages/backend/src/schedulers/social-post-scheduler.ts` line 102

The `processQueue()` method calls `dequeue()` once and processes a single item. With a 30-second interval, this means a maximum throughput of 2 posts per minute, even though the global rate limit allows 10.

If a user shares to 5 platforms simultaneously, it would take 2.5 minutes to publish all posts.

**Fix:** Process multiple items per cycle (e.g., up to `MAX_GLOBAL_POSTS_PER_MINUTE` items per loop).

### M6: Race Condition in Token Refresh Lock

**File:** `packages/backend/src/services/social-token-service.ts` lines 126-132

When the Redis lock is not acquired (another process is refreshing), the code waits 2 seconds and reads the DB. If the other process hasn't finished refreshing within 2 seconds, the returned token may still be the old, expired one.

**Fix:** Use a retry loop with backoff, or wait for the lock to be released using Redis pub/sub or polling the lock key.

### M7: Zod Validation Error Messages Not Translated

**File:** `packages/shared/src/schemas/social-schemas.ts`

Validation error messages are hardcoded in English: "Select at least one platform", "Caption cannot exceed 2200 characters", etc. Other parts of the system use i18n for validation messages.

**Fix:** Use translation keys or accept that Zod schema errors are developer-facing (if they are re-mapped to i18n keys on the frontend).

---

## Low Priority Issues

### L1: Status Badge Labels are Hardcoded in English

**File:** `packages/frontend/src/components/social/SocialPostHistory.tsx` lines 34-41

The `STATUS_BADGES` record has hardcoded English labels ("Pending", "Queued", etc.). While the template does use `t('social.status.${post.status.toLowerCase()}', badge.label)` as a fallback, the hardcoded labels in the record are unnecessary noise.

### L2: Placeholder Platform Icons

**File:** `packages/frontend/src/components/social/SocialAccountsList.tsx` line 128-129

Platform icons are rendered as colored circles with the first letter of the platform name (e.g., "F" for Facebook). This is a placeholder that should eventually use actual platform brand icons (e.g., via react-icons or SVG icons).

### L3: Missing Loading/Error State in ShareToSocialSection Caption Generation

**File:** `packages/frontend/src/components/social/ShareToSocialSection.tsx` lines 58-69

The `generateCaption` callback silently catches errors. If caption generation fails, the user sees an empty textarea with no indication that auto-generation failed.

### L4: Facebook Page Selection - Only First Page Used

**File:** `packages/backend/src/social/adapters/facebook-adapter.ts` lines 79-84

When a user manages multiple Facebook Pages, only the first page is used (line 84). The comment says "in the future, let user choose" but there's no UI for this. This could confuse users who manage multiple pages.

### L5: GBP Post Type Hardcoded to "OFFER"

**File:** `packages/backend/src/social/adapters/google-business-adapter.ts` line 159

The Google Business Profile post type is hardcoded to `OFFER`. When sharing events, it should use `EVENT` type.

### L6: LinkedIn `refreshToken` Returns Empty Account Info

**File:** `packages/backend/src/social/adapters/linkedin-adapter.ts` lines 148-149

The `refreshToken` method returns empty strings for `platformAccountId` and `platformAccountName`. The token service should preserve the existing values, which it appears to do via `upsert`, but this is fragile.

### L7: Missing ARIA `role="switch"` on Toggle Button

**File:** `packages/frontend/src/components/social/SocialAccountsList.tsx` lines 159-172

The toggle button that activates/deactivates accounts is styled as a switch but doesn't use `role="switch"` or `aria-checked`. Screen readers won't identify it as a toggle switch.

---

## Security Review

### Strengths
- **Separate encryption key** for social tokens (SOCIAL_ENCRYPTION_KEY) with fallback - limits blast radius
- **AES-256-GCM** with random IV and auth tag - proper authenticated encryption
- **CSRF protection** on OAuth flows via Redis-stored state tokens with 10-minute TTL
- **PKCE** for Twitter OAuth 2.0 (though broken - see C2)
- **Token revocation** on disconnect for all platforms that support it
- **No tokens exposed** in API responses - `listAccounts` explicitly selects non-token fields
- **Redis lock** on token refresh prevents concurrent refresh races
- **Cascade deletes** on social_accounts -> social_posts -> social_post_logs
- **Business ownership verification** on all endpoints except callback
- **Rate limiting** on all endpoint categories (auth, posts, preview, accounts)

### Issues
- **C1:** XSS in OAuth callback HTML (critical)
- **C2:** Broken PKCE flow for Twitter (tokens will never exchange)
- **H4:** Auth middleware on callback may reject legitimate returns
- **H6:** Rate limiters are IP-based, not business-based
- Access tokens are passed in query strings to Facebook Graph API (lines like `?access_token=...`) which may be logged in server access logs on Facebook's side. While this is the standard for Facebook's API, note it for awareness.
- The encryption `getKey()` function parses the key on every encrypt/decrypt call rather than caching it. Minor performance concern under high load.

### Compliance
- Tokens are encrypted at rest (AES-256-GCM) per Spec S4.2
- Token revocation on disconnect aligns with Australian Privacy Principles
- No PII is stored beyond what's necessary (platform account ID/name, encrypted tokens)

---

## Accessibility Review

### Issues Found
- **L7:** Toggle switch missing `role="switch"` and `aria-checked` attributes
- Connect buttons have appropriate disabled state but no explanation why (tooltip or text explaining "not configured")
- The OAuth popup window approach has no fallback for users who have popups blocked or use assistive technology that doesn't support popup windows well
- Loading skeletons lack `aria-busy="true"` on the parent container
- The "Needs attention" warning span (SocialAccountsList line 139) relies on `title` attribute which is not reliably announced by screen readers

### Strengths
- All buttons use `type="button"` to prevent form submission
- The caption textarea has a proper `htmlFor`/`id` association
- Status badges use text labels (not just color)
- External links use `rel="noopener noreferrer"`
- Keyboard navigation works through all interactive elements (standard HTML controls)

---

## Specification Compliance

### S20 Coverage

Spec S20 defines two features:
1. **S20.1 Community Social Feed** - Hashtag aggregation, masonry grid, moderation, location filter. **Not implemented** (this is a separate feature - aggregating external social posts into the platform).
2. **S20.2 Business Social Feeds** - Display latest 3-4 posts on profile, hourly sync. **Not implemented** (this pulls posts from social accounts into the business profile).

The implemented feature (auto-posting from platform to social media) is **not explicitly in S20** - it's an extension/product decision to enable outbound posting to social platforms. This is a reasonable extension that supports business owner engagement, but it should be documented as such.

### Data Model Compliance
- Models follow Appendix A patterns (UUIDs, timestamps, cascading deletes)
- Enums follow existing patterns (PascalCase values)
- Indexes are well-designed for the query patterns used

### API Compliance
- Endpoints follow Appendix B patterns (RESTful, versioned, auth-required)
- Error responses follow S27 patterns (code + message)
- All mutation endpoints have Zod validation

---

## i18n Review

### Strengths
- All user-facing strings use `t()` with fallback values
- Platform brand names kept in English (correct - they're proper nouns)
- Arabic translation file includes complete `social.*` and `admin.social.*` keys
- English translation file has ~50 social-related keys organized under `social.*` namespace

### Issues
- **H3:** Caption generation hardcodes `en-AU` locale for date formatting
- **M7:** Zod validation error messages are in English only
- The `ShareToSocialSection` share button text interpolates `selectedPlatforms.size` directly in the fallback string, which may not work correctly for RTL languages or languages with different pluralization rules. Should use i18next pluralization.
- `PlatformApprovalNotice` has platform descriptions hardcoded in English (line 14-31 - "Meta App Review required...", "Elevated API access..."). These are admin-facing, so lower priority.

---

## Missing Tests

**Total tests: 0 of ~190 planned**

| Category | Planned | Actual | Priority |
|----------|---------|--------|----------|
| social-encryption | ~10 | 0 | Critical |
| social-token-service | ~20 | 0 | Critical |
| social-post-service | ~20 | 0 | High |
| social-post-queue | ~15 | 0 | High |
| social-post-scheduler | ~15 | 0 | High |
| Platform adapters (5) | ~30 | 0 | High |
| Route/controller integration | ~30 | 0 | High |
| Frontend SocialAccountsList | ~10 | 0 | Medium |
| Frontend ShareToSocialSection | ~10 | 0 | Medium |
| Frontend SocialPostHistory | ~10 | 0 | Medium |
| Frontend PlatformApprovalNotice | ~5 | 0 | Low |
| jest-axe accessibility | ~15 | 0 | Medium |

---

## Files Exceeding 1000 Lines

| File | Lines | Notes |
|------|-------|-------|
| `packages/frontend/src/pages/owner/EditBusinessPage.tsx` | 1168 | Was large before; social integration added ~30 more lines. Should extract tab contents. |

All other new files are well within limits (largest is `social-post-service.ts` at 407 lines).

---

## Missing Planned Deliverables

| Planned Item | Status | Notes |
|--------------|--------|-------|
| `ConnectSocialButton.tsx` | Missing | Logic inlined in SocialAccountsList instead |
| `seed-social-settings.ts` | Missing | Platform approval seed data not created |
| `socialPosting` feature flag in platform.json | Missing | Not added to config or schema |
| `socialPosting` Zod schema in platform-schema.ts | Missing | Config validation not updated |
| OwnerDashboardPage social activity section | Not verified | Not in diff - may be missing |
| ~190 tests | Missing | 0 tests created |

---

## Recommendations

### Immediate (Before Merge)
1. **Fix C1:** Sanitize all values in the callback HTML to prevent XSS
2. **Fix C2:** Repair the Twitter PKCE flow so the code verifier matches the code challenge
3. **Fix C3:** Add the `socialPosting` feature flag and enforce it
4. **Fix H2:** Replace `console.warn` with `logger.warn` in social-encryption.ts
5. **Fix H3:** Remove hardcoded `en-AU` locale, use config-driven locale

### Short-Term (Next Sprint)
6. Write at minimum: encryption round-trip tests, token service tests, queue tests, and controller integration tests (~80 tests)
7. Fix H4 (callback auth), H6 (business-based rate limiting)
8. Add Instagram image requirement validation at post creation time
9. Implement platform approval checking before publish
10. Extract EditBusinessPage tabs into separate components

### Medium-Term
11. Add multi-page/multi-account selection for Facebook and Instagram
12. Implement mobile fallback for popup-blocked scenarios
13. Increase scheduler throughput (process batch per cycle)
14. Add jest-axe tests for all frontend components
15. Add `role="switch"` and `aria-checked` to toggle buttons
16. Implement the spec's S20.1 and S20.2 features (inbound social feed aggregation)
