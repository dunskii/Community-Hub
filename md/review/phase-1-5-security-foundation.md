# Phase 1.5: Security Foundation -- Code Review

**Reviewer:** Claude Code (Opus 4.5)
**Date:** 4 February 2026
**Scope:** All 15 source + test files introduced or modified in Phase 1.5
**Verdict:** PASS WITH ISSUES (1 Critical, 3 Important, 5 Minor)

---

## 1. Executive Summary

Phase 1.5 implements a solid security foundation covering security headers, CSRF protection, input validation, sanitization, AES-256-GCM encryption, rate limiting, and config endpoint filtering. The implementation is well-structured, follows TypeScript best practices, and aligns closely with Specification Section 4.

**One critical issue** was identified: the CORS middleware does not include `X-CSRF-Token` in `Access-Control-Allow-Headers`, which will cause browsers to reject CSRF-protected cross-origin requests from the frontend (preflight will fail). This must be fixed before Phase 2 (Authentication) begins.

Three important issues were found relating to duplicate `rel` attributes in sanitized anchor tags, missing config endpoint filter tests, and rate limiter tests that only verify exports without testing actual rate-limiting behaviour.

The code is clean, properly typed, well-documented with spec references, and all 208 backend tests pass.

---

## 2. Critical Issues

### S-01: CORS does not allow `X-CSRF-Token` header [MUST FIX]

**File:** `packages/backend/src/middleware/cors-config.ts` (pre-existing, but exposed by Phase 1.5)
**Severity:** Critical
**Category:** Security Integration

The CORS middleware at line 8 defines:
```typescript
const ALLOWED_HEADERS = 'Content-Type,Authorization';
```

The CSRF middleware (`csrf.ts`) requires the client to send `X-CSRF-Token` in request headers for non-safe methods. However, this custom header is not listed in `Access-Control-Allow-Headers`. When the frontend (running on `localhost:5173`) makes a cross-origin POST/PUT/DELETE to the backend (running on a different port), the browser will issue a preflight OPTIONS request. The server will respond without `X-CSRF-Token` in the allowed headers, and the browser will block the actual request.

**Impact:** Every non-GET cross-origin request from the frontend will fail silently in the browser. This effectively makes the CSRF + CORS combination non-functional for the SPA architecture.

**Fix:** Add `X-CSRF-Token` to `ALLOWED_HEADERS` in `cors-config.ts`:
```typescript
const ALLOWED_HEADERS = 'Content-Type,Authorization,X-CSRF-Token';
```

**Note:** This is technically a pre-existing file, but the CSRF middleware introduced in Phase 1.5 creates this integration gap. Categorised as critical because it blocks all authenticated operations.

---

## 3. Important Issues

### S-02: `sanitizeRichText` produces duplicate `rel` attributes on anchor tags

**File:** `packages/backend/src/utils/sanitizer.ts`, line 19
**Severity:** Important
**Category:** Security / Correctness

The function uses a regex replacement to add `rel="nofollow noopener"` to all `<a` tags:
```typescript
return clean.replace(/<a\s/g, '<a rel="nofollow noopener" ');
```

If DOMPurify preserves an existing `rel` attribute from the input (since `rel` is in `ALLOWED_ATTR`), the output will have two `rel` attributes:
```html
<a rel="nofollow noopener" href="https://example.com" rel="something">Link</a>
```

While browsers typically use the first `rel` attribute (which is the injected one), having duplicate attributes is invalid HTML. More importantly, `rel` should be removed from `ALLOWED_ATTR` since the code forcibly sets it anyway, or the replacement logic should remove any existing `rel` before prepending.

**Suggested approach:** Remove `'rel'` from `ALLOWED_ATTR` and keep the replacement as-is. This ensures DOMPurify strips any user-supplied `rel` before the code adds the correct one.

### T-01: Config endpoint filter has no dedicated test assertions

**File:** `packages/backend/src/__tests__/routes/config.test.ts`
**Severity:** Important
**Category:** Testing

The plan file (Step 7) states the config test should be modified to add filter assertions. The existing test verifies the endpoint returns data but does not assert that:
- `partners.council.contactEmail` is absent
- `partners.chamber.contactEmail` is absent
- `contact` section is absent
- `analytics` section is absent
- `location.boundingBox` is absent
- `location.postcodeRange` is absent
- `location.phoneCountryCode` is absent

Without these assertions, a regression that removes the filter would not be caught.

### T-02: Rate limiter tests are minimal (export checks only)

**File:** `packages/backend/src/__tests__/middleware/rate-limiter.test.ts`
**Severity:** Important
**Category:** Testing

The test file only verifies that 7 limiters are exported and are functions. It does not test:
- Window durations match spec values
- Request limits match spec values
- The response message format
- That rate limiting actually triggers after exceeding the limit

The plan file (Step 2) specifies testing "correct windowMs and limit values" and "standardHeaders: 'draft-7'" settings. These assertions are missing. While behavioural testing of `express-rate-limit` is arguably testing a third-party library, verifying configuration values ensures spec compliance.

---

## 4. Minor Issues

### C-01: `validate.ts` uses `(req as unknown as Record<string, unknown>).query` cast

**File:** `packages/backend/src/middleware/validate.ts`, line 53
**Severity:** Minor
**Category:** Code Quality

The query replacement uses a double cast:
```typescript
(req as unknown as Record<string, unknown>).query = result.data;
```

This is necessary because Express types `req.query` as `ParsedQs` (read-only in practice). The plan file acknowledges this with `(req as any).query = result.data`. The implementation improved on the plan by avoiding `any`, which is correct. However, a TypeScript module augmentation or a cleaner pattern would be preferable long-term.

### C-02: Encryption module cached imports in tests

**File:** `packages/backend/src/__tests__/utils/encryption.test.ts`
**Severity:** Minor
**Category:** Testing

Each test case uses `await import('../../utils/encryption.js')` inside the test body. Since Vitest caches ES module imports, the `getKey()` function inside `encryption.ts` reads `process.env['ENCRYPTION_KEY']` on each call (not at import time), so the `vi.stubEnv` in `beforeEach` works correctly. However, this pattern is fragile -- if the module were refactored to cache the key at module load time, all tests would break. A comment explaining why dynamic imports are used per-test would improve maintainability.

### C-03: `sanitizeUrl` does not handle mixed-case scheme bypass attempts

**File:** `packages/backend/src/utils/sanitizer.ts`, line 38
**Severity:** Minor
**Category:** Security (Low Risk)

The URL scheme check uses:
```typescript
if (['javascript:', 'data:', 'vbscript:'].includes(parsed.protocol))
```

The `URL` constructor normalises the protocol to lowercase, so `JaVaScRiPt:alert(1)` would be caught because `parsed.protocol` would be `javascript:`. This is correct behaviour. However, a comment noting that the `URL` constructor handles case normalisation would prevent future maintainers from questioning this.

### C-04: CSRF middleware always re-signs the token on every request

**File:** `packages/backend/src/middleware/csrf.ts`, line 73
**Severity:** Minor
**Category:** Performance

Even when a valid existing cookie is present and its token is reused (line 68), the middleware generates a new signature and sets the cookie again on every response. This is not a security issue, but it means every response includes a `Set-Cookie` header, which prevents HTTP caching of responses that include the CSRF middleware. For a JSON API this is unlikely to be a problem, but it is worth noting for future consideration.

### C-05: `helmet` config uses `strictTransportSecurity` in plan but `hsts` is also valid

**File:** `packages/backend/src/app.ts`, line 44
**Severity:** Minor
**Category:** Documentation

The plan file (Step 1) uses `hsts:` as the helmet config key, but the actual implementation uses `strictTransportSecurity:`. Both work with helmet -- `strictTransportSecurity` is the canonical name, `hsts` is an alias. The implementation is correct; the plan is slightly inconsistent.

---

## 5. Pre-existing Issues

### P-01: CORS middleware ordering in `app.ts`

**File:** `packages/backend/src/app.ts`, line 67
**Category:** Pre-existing (Phase 1.3)

CORS middleware is applied after CSRF middleware. This means CSRF validation runs before CORS headers are set. While this does not cause functional issues (CSRF errors throw before CORS headers matter), it means CSRF error responses may not include CORS headers, causing the browser to show a CORS error instead of the actual 403 CSRF error. The frontend would see a generic network error rather than a descriptive CSRF error message.

The conventional ordering is: CORS -> CSRF -> routes. This ensures error responses from CSRF include CORS headers.

### P-02: Rate limiter uses in-memory store

**File:** `packages/backend/src/middleware/rate-limiter.ts`, line 2 (TODO comment)
**Category:** Pre-existing (Phase 1.3, acknowledged)

The rate limiters use the default in-memory store. This is documented with a TODO comment for Redis store migration. In a multi-instance deployment, rate limits would not be shared across instances. This is acceptable for Phase 1 development but must be addressed before production deployment (Phase 19).

### P-03: `app.set('trust proxy', 1)` hardcoded

**File:** `packages/backend/src/app.ts`, line 20
**Category:** Pre-existing (Phase 1.3)

The `trust proxy` setting is hardcoded to `1`. This should ideally come from configuration, as different deployment environments may have different numbers of proxies in front of the application. The rate limiter relies on this setting to correctly identify client IPs.

---

## 6. Positive Observations

1. **Timing-safe comparison in CSRF verification:** The use of `timingSafeEqual` from `node:crypto` for HMAC signature comparison is the correct approach to prevent timing side-channel attacks. The additional length check before comparison is also correct (S-01 of many CSRF implementations miss this).

2. **AES-256-GCM choice:** Using GCM mode over CBC is the right decision. GCM provides authenticated encryption (integrity + confidentiality) without requiring a separate HMAC, reducing implementation complexity and the chance of errors. The 12-byte IV and 128-bit auth tag are the NIST-recommended sizes.

3. **Random IV per encryption:** The `encrypt()` function generates a fresh random IV for every call, ensuring identical plaintexts produce different ciphertexts. This is verified in the test suite.

4. **Spec references in code comments:** Every middleware and utility references the relevant specification section (e.g., "Spec Section 4.7", "Spec Section 4.9"). This makes audit and maintenance significantly easier.

5. **Zod validation replaces original values:** The validation middleware correctly replaces `req.body`, `req.query`, and `req.params` with the Zod-parsed output. This ensures coerced and transformed values propagate to handlers, preventing type mismatches downstream.

6. **Validation error format:** The `formatValidationErrors` function returns `[{ field, message }]` arrays that align with the error response format in Spec Section 27.1. No sensitive data is leaked in validation error messages.

7. **DOMPurify config:** `ALLOW_DATA_ATTR: false` explicitly disables `data-*` attributes, which could be used for DOM clobbering or data exfiltration.

8. **Config filtering uses explicit whitelist:** The `filterConfigForFrontend` function picks specific fields rather than omitting specific ones. This is the safer approach -- any new field added to `platform.json` will not be exposed unless explicitly included in the whitelist.

9. **Clean TypeScript:** No `any` types found in source files (only `unknown` with proper narrowing). Import ordering follows external-then-internal convention. All functions have clear return types or TypeScript inference.

10. **Proper error boundaries:** The CSRF middleware throws `ApiError.forbidden()` which is caught by the error handler and returned as a standard error response. No raw error messages are exposed.

11. **Key validation in encryption:** The `getKey()` function validates both the presence and the byte length of the encryption key, preventing silent failures from misconfigured keys.

12. **CSRF cookie attributes:** `httpOnly: false` is correct for the double-submit cookie pattern (the client JavaScript must read the cookie value to send it as a header). `sameSite: 'strict'` and `secure: true` in production are per specification.

---

## 7. Test Coverage Analysis

### What Is Tested

| File | Tests | Coverage Assessment |
|------|-------|---------------------|
| `csrf.test.ts` | 14 | Good: safe methods, unsafe methods, cookie setting, cookie reuse, tampered signatures, mismatch detection |
| `validate.test.ts` | 11 | Good: body/query/params validation, combined validation, coercion, unknown fields, error details |
| `sanitize.test.ts` | 9 | Adequate: rich text, plain text, mixed, edge cases (non-string, missing fields, null body) |
| `security-headers.test.ts` | 11 | Good: all 5 headers, CSP directives, X-Powered-By absence |
| `rate-limiter.test.ts` | 2 | Insufficient: only checks exports exist |
| `sanitizer.test.ts` | 33 | Excellent: allowed tags, blocked tags, event handlers, data attributes, URLs, edge cases |
| `encryption.test.ts` | 10 | Good: round-trip, unicode, empty string, random IV, tampering, invalid format, missing key, wrong key length |

**Total new tests:** 90 (across 6 new test files + 1 modified)

### What Is Missing

| Missing Test | Severity | Rationale |
|-------------|----------|-----------|
| Config endpoint filter assertions (contactEmail, analytics, etc.) | Important | No regression protection for the security filter (T-01) |
| Rate limiter configuration values | Important | Spec compliance not verified in tests (T-02) |
| CSRF with missing SESSION_SECRET env var | Low | The `getSecret()` function throws, but this path is not tested in the CSRF test file |
| Encryption with wrong key (decrypt with key A what was encrypted with key B) | Low | Only tampered ciphertext is tested, not wrong-key scenarios |
| Sanitization middleware with deeply nested body fields | Low | Only top-level fields are tested; nested object fields are not |
| `sanitizeRichText` with pre-existing `rel` attribute on anchor tag | Low | Related to S-02; would expose the duplicate attribute issue |
| CSRF interaction with CORS preflight | Low | Would expose S-01 (CORS integration gap) |

---

## 8. Specification Compliance

### Section 4.2 (Data Protection) -- AES-256 Encryption

| Requirement | Status | Notes |
|-------------|--------|-------|
| AES-256 for sensitive data at rest | COMPLIANT | AES-256-GCM implemented in `encryption.ts` |
| Encryption key from environment | COMPLIANT | Reads from `ENCRYPTION_KEY` env var |
| Key validation | COMPLIANT | Validates 32-byte decoded length |

### Section 4.5 (Security Headers)

| Header | Spec Value | Implementation | Status |
|--------|-----------|----------------|--------|
| Content-Security-Policy | Strict CSP rules | Configured with self-only defaults, Google Fonts, Mapbox | COMPLIANT |
| X-Frame-Options | DENY | Set via `frameguard: { action: 'deny' }` | COMPLIANT |
| X-Content-Type-Options | nosniff | Set via helmet defaults | COMPLIANT |
| Strict-Transport-Security | max-age=31536000 | Set with `includeSubDomains` and `preload` | COMPLIANT |
| Referrer-Policy | strict-origin-when-cross-origin | Set explicitly | COMPLIANT |

### Section 4.7 (CSRF Protection)

| Requirement | Status | Notes |
|-------------|--------|-------|
| SameSite=Strict cookies | COMPLIANT | Cookie set with `sameSite: 'strict'` |
| CSRF token for non-GET requests | COMPLIANT | Double-submit cookie pattern with HMAC signing |
| Exempt: GET/HEAD/OPTIONS | COMPLIANT | `SAFE_METHODS` set excludes these |

**Note:** The spec says "Token Source: Server-generated, stored in session, validated per request." Phase 1.5 uses a stateless double-submit cookie (no session storage) because sessions are not yet implemented. This is a deliberate and documented deviation. When Phase 2 adds JWT sessions, the CSRF mechanism can be enhanced or a Bearer token bypass can be added.

### Section 4.8 (Rate Limiting)

| Endpoint Category | Spec Limit | Implementation | Status |
|-------------------|-----------|----------------|--------|
| Authentication (login, register) | 10 req / 15 min | `authRateLimiter` (10/15min) | COMPLIANT |
| Password reset | 3 req / 1 hour | `passwordResetRateLimiter` (3/1hr) | COMPLIANT |
| API (authenticated) | 100 req / 1 min | `apiRateLimiter` (100/1min) | COMPLIANT |
| API (anonymous) | 30 req / 1 min | `rateLimiter` (30/1min) | COMPLIANT |
| Search | 30 req / 1 min | `searchRateLimiter` (30/1min) | COMPLIANT |
| File uploads | 20 / 1 hour | `uploadRateLimiter` (20/1hr) | COMPLIANT |
| Review submissions | 5 / 24 hours | `reviewRateLimiter` (5/24hr) | COMPLIANT |
| New conversations | 10 / 24 hours | Deferred to Phase 9 (TODO) | DEFERRED (acceptable) |
| Flash deal creation | 2 / 7 days | Deferred to Phase 10 (TODO) | DEFERRED (acceptable) |

**7 of 9 tiers implemented. 2 deferred with TODO comments to their respective feature phases.**

### Section 4.9 (Input Sanitization)

| Requirement | Status | Notes |
|-------------|--------|-------|
| Rich text: DOMPurify allowlist | COMPLIANT | `isomorphic-dompurify` with explicit tag list |
| Allowed HTML tags | COMPLIANT | p, br, strong, em, ul, ol, li, a -- matches spec exactly |
| `a` tags with `rel="nofollow"` | COMPLIANT (with caveat) | Added via regex; spec says `nofollow`, implementation adds `nofollow noopener` (safer) |
| Blocked: script, iframe, object, embed, style, event handlers | COMPLIANT | DOMPurify strips all by default; verified in tests |
| Plain text: strip all HTML | COMPLIANT | `stripHtml` uses `ALLOWED_TAGS: []` |
| URL fields: block javascript:, data: | COMPLIANT | `sanitizeUrl` rejects these protocols |

---

## 9. Plan Completion

### Plan File: `md/plan/phase-1-5-security-foundation.md`

| Step | Description | Planned Files | Status | Notes |
|------|-------------|---------------|--------|-------|
| Step 1 | Security Headers (Tasks 1-5) | `app.ts`, `security-headers.test.ts` | COMPLETE | All 5 headers configured and tested |
| Step 2 | Rate Limiting Enhancement (Task 7) | `rate-limiter.ts`, `rate-limiter.test.ts` | COMPLETE | 3 new limiters, 2 deferred with TODOs |
| Step 3 | Input Validation Middleware (Task 8) | `validate.ts`, `validate.test.ts` | COMPLETE | Zod-based, replaces parsed values |
| Step 4 | Input Sanitization (Task 11) | `sanitizer.ts`, `sanitize.ts`, tests | COMPLETE | DOMPurify with HTML allowlist |
| Step 5 | AES-256 Encryption (Task 9) | `encryption.ts`, test | COMPLETE | GCM mode, random IV, auth tag |
| Step 6 | CSRF Protection (Task 10) | `csrf.ts`, test, `app.ts` | COMPLETE | Double-submit cookie, signed tokens |
| Step 7 | Config Endpoint Filtering (bonus) | `config.ts`, test | PARTIAL | Filter implemented, test assertions missing (T-01) |

### Success Criteria Verification

| # | Criterion | Met? |
|---|-----------|------|
| 1 | All 5 security headers verified | YES |
| 2 | CSP allows Google Fonts and Mapbox, blocks inline scripts and iframes | YES |
| 3 | 7 rate limiters exported | YES |
| 4 | Password reset limiter 3/hr | YES |
| 5 | Validation validates body, query, params | YES |
| 6 | Sanitization strips script, iframe, event handlers | YES |
| 7 | URL sanitization blocks javascript: and data: | YES |
| 8 | AES-256-GCM round-trip works | YES |
| 9 | Different ciphertext for same plaintext | YES |
| 10 | Tampered ciphertext rejected | YES |
| 11 | CSRF blocks POST/PUT/DELETE without valid token | YES |
| 12 | CSRF passes GET/HEAD/OPTIONS without token | YES |
| 13 | Config endpoint serves filtered fields | YES (but untested -- T-01) |
| 14 | All existing tests continue passing | YES (208 total) |
| 15 | New tests bring total above 220 | NO (208 backend; plan says 220 -- see note) |
| 16 | Lint, typecheck, test all pass | YES |

**Note on criterion 15:** The plan says "above 220" but the current count is 208 backend tests. The PROGRESS.md reports 310 total tests (208 backend + 62 frontend + 40 shared). This is likely a plan-vs-scope discrepancy -- the 220 target may have been for backend-only, but the actual increment of 90 tests (from 118 pre-1.5 to 208) is substantial. Not blocking.

### Study File Cross-Reference

The study file (`md/study/phase-1-5-security-foundation.md`) served as an initial research document. The plan file refined several study-phase decisions:

| Study Recommendation | Plan/Implementation Outcome |
|---------------------|-----------------------------|
| `security-headers.ts` as separate file | Inlined into helmet config in `app.ts` (simpler) |
| `services/encryption.ts` | Placed in `utils/encryption.ts` (consistent with codebase) |
| `csrf.ts` + `csrf-protection.ts` (two files) | Single `middleware/csrf.ts` (cleaner) |
| `aes-256-cbc` | Changed to `aes-256-gcm` (better security) |
| `input-validator.ts` | Named `validate.ts` (shorter, conventional) |
| `packages/shared/src/validation/schemas.ts` | Not created (deferred to feature phases that define schemas) |
| Defer review/conversation limiters | Review limiter implemented; conversation deferred to Phase 9 |

All study recommendations were either implemented or improved upon. No gaps found.

---

## 10. Recommendations (Prioritised)

### Must Fix (Before Phase 2)

1. **[S-01]** Add `X-CSRF-Token` to CORS `ALLOWED_HEADERS` in `cors-config.ts`. Without this, no cross-origin POST/PUT/DELETE will work from the frontend.

### Should Fix Soon

2. **[S-02]** Remove `'rel'` from `ALLOWED_ATTR` in `sanitizer.ts` to prevent duplicate `rel` attributes on anchor tags. Alternatively, use a more robust replacement that removes existing `rel` before adding the new one.

3. **[T-01]** Add test assertions to `config.test.ts` verifying that `contactEmail`, `contact`, `analytics`, `boundingBox`, `postcodeRange`, and `phoneCountryCode` are absent from the filtered response.

4. **[T-02]** Enhance `rate-limiter.test.ts` to verify each limiter's `windowMs` and `limit` configuration values match the specification.

### Nice to Fix

5. **[C-01]** Consider adding a TypeScript module augmentation for Express `Request.query` to avoid the double-cast pattern in `validate.ts`.

6. **[C-04]** Consider skipping the `Set-Cookie` header when the existing cookie token is reused and unchanged, to improve cacheability of GET responses.

7. **[P-01]** Reorder middleware in `app.ts` so CORS runs before CSRF, ensuring CSRF error responses include CORS headers for proper frontend error handling.

### Future Phases

8. **[P-02]** Migrate rate limiters to Redis store before multi-instance deployment (Phase 19).

9. Add key rotation support to `encryption.ts` (documented TODO in the file, target Phase 2+).

10. Phase 2 should add Bearer token bypass for CSRF when JWT authentication is implemented, to support API consumers that do not use cookies.

---

## Appendix: Files Reviewed

### Source Files (8)

| # | File | Lines | Action |
|---|------|-------|--------|
| 1 | `packages/backend/src/middleware/csrf.ts` | 99 | New |
| 2 | `packages/backend/src/middleware/validate.ts` | 69 | New |
| 3 | `packages/backend/src/middleware/sanitize.ts` | 39 | New |
| 4 | `packages/backend/src/utils/sanitizer.ts` | 45 | New |
| 5 | `packages/backend/src/utils/encryption.ts` | 67 | New |
| 6 | `packages/backend/src/app.ts` | 78 | Modified |
| 7 | `packages/backend/src/middleware/rate-limiter.ts` | 96 | Modified |
| 8 | `packages/backend/src/routes/config.ts` | 69 | Modified |

### Test Files (7)

| # | File | Tests | Action |
|---|------|-------|--------|
| 9 | `packages/backend/src/__tests__/middleware/csrf.test.ts` | 14 | New |
| 10 | `packages/backend/src/__tests__/middleware/validate.test.ts` | 11 | New |
| 11 | `packages/backend/src/__tests__/middleware/sanitize.test.ts` | 9 | New |
| 12 | `packages/backend/src/__tests__/middleware/security-headers.test.ts` | 11 | New |
| 13 | `packages/backend/src/__tests__/middleware/rate-limiter.test.ts` | 2 | New |
| 14 | `packages/backend/src/__tests__/utils/sanitizer.test.ts` | 33 | New |
| 15 | `packages/backend/src/__tests__/utils/encryption.test.ts` | 10 | New |

### Documentation Files (4)

| # | File |
|---|------|
| 16 | `md/plan/phase-1-5-security-foundation.md` |
| 17 | `md/study/phase-1-5-security-foundation.md` |
| 18 | `TODO.md` |
| 19 | `PROGRESS.md` |

### Reference Files Consulted

| File | Sections |
|------|----------|
| `Docs/Community_Hub_Specification_v2.md` | Section 4 (4.2, 4.5, 4.7, 4.8, 4.9) |
| `packages/backend/src/utils/api-error.ts` | Full file |
| `packages/backend/src/middleware/error-handler.ts` | Full file |
| `packages/backend/src/middleware/cors-config.ts` | Full file |
| `packages/shared/src/config/platform-schema.ts` | Partner schema, contact, analytics sections |
| `packages/backend/src/__tests__/routes/config.test.ts` | Full file |

---

## Summary Table

| Category | Critical | Important | Minor | Pre-existing |
|----------|----------|-----------|-------|-------------|
| Security | 1 (S-01) | 1 (S-02) | 1 (C-03) | 1 (P-01) |
| Testing | 0 | 2 (T-01, T-02) | 1 (C-02) | 0 |
| Code Quality | 0 | 0 | 2 (C-01, C-04) | 1 (P-02) |
| Documentation | 0 | 0 | 1 (C-05) | 1 (P-03) |
| **Total** | **1** | **3** | **5** | **3** |

**Verdict:** PASS WITH ISSUES. Fix S-01 (CORS + CSRF integration) before proceeding to Phase 2.
