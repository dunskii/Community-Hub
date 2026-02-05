# Phase 1.5: Security Foundation -- QA Review Round 2

**Reviewer:** Claude Code (Sonnet 4.5)
**Date:** 5 February 2026
**Scope:** Verification of fixes from initial Phase 1.5 review
**Initial Review:** `md/review/phase-1-5-security-foundation.md`
**Verdict:** PASS CLEAN

---

## 1. Executive Summary

All critical, important, and minor issues identified in the initial Phase 1.5 Security Foundation review have been successfully fixed and verified. No new issues were introduced by the fixes. The codebase passes all 322 tests (220 backend + 40 shared + 62 frontend), typechecks cleanly, and has no linting errors.

**Fix Summary:**
- 1 Critical issue (S-01): FIXED ✓
- 3 Important issues (S-02, T-01, T-02): FIXED ✓
- 5 Minor issues (C-01 through C-05): FIXED ✓ (C-05 was documentation only)
- 3 Pre-existing issues: VERIFIED as pre-existing, P-01 FIXED ✓

All fixes have been implemented correctly with no regressions. The phase is now ready for completion.

---

## 2. Fix Verification

### S-01: CORS + CSRF Integration [VERIFIED ✓]

**File:** `packages/backend/src/middleware/cors-config.ts`, line 8

**Status:** FIXED

**Verification:**
```typescript
const ALLOWED_HEADERS = 'Content-Type,Authorization,X-CSRF-Token';
```

The `X-CSRF-Token` header is now included in the CORS `Access-Control-Allow-Headers` configuration. This resolves the critical issue where cross-origin CSRF-protected requests from the frontend would fail at preflight.

**Test Coverage:**
File: `packages/backend/src/__tests__/middleware/cors-config.test.ts`, lines 80-88

```typescript
it('should include X-CSRF-Token in allowed headers', () => {
  const { req, res, next } = mockReqRes('http://localhost:5173');
  corsConfig(req, res, next);

  const headersCall = vi.mocked(res.setHeader).mock.calls.find(
    ([header]) => header === 'Access-Control-Allow-Headers',
  );
  expect(headersCall?.[1]).toContain('X-CSRF-Token');
});
```

The test explicitly verifies that `X-CSRF-Token` is present in the allowed headers list. Test passes.

---

### S-02: Duplicate `rel` Attribute [VERIFIED ✓]

**File:** `packages/backend/src/utils/sanitizer.ts`, line 5

**Status:** FIXED

**Verification:**
```typescript
const ALLOWED_ATTR = ['href', 'target'];
```

The `'rel'` attribute has been removed from the DOMPurify `ALLOWED_ATTR` array. This prevents user-supplied `rel` attributes from being preserved, which would have resulted in duplicate `rel` attributes when the regex replacement adds `rel="nofollow noopener"` to anchor tags (line 19).

**Result:** No duplicate `rel` attributes possible. DOMPurify strips any user-supplied `rel`, then the replacement adds the sanitized version.

---

### T-01: Config Endpoint Filter Assertions [VERIFIED ✓]

**File:** `packages/backend/src/__tests__/routes/config.test.ts`, lines 96-134

**Status:** FIXED

**Verification:** Three new test cases added with comprehensive assertions:

1. **Test: "should exclude partner contactEmail fields"** (lines 97-107)
   - Asserts `partners.council.contactEmail` is undefined
   - Asserts `partners.chamber.contactEmail` is undefined
   - Verifies non-sensitive fields (name) are still present

2. **Test: "should exclude contact section entirely"** (lines 109-114)
   - Asserts `data.contact` is undefined

3. **Test: "should exclude analytics section entirely"** (lines 116-121)
   - Asserts `data.analytics` is undefined

4. **Test: "should exclude sensitive location fields"** (lines 123-134)
   - Asserts `location.boundingBox` is undefined
   - Asserts `location.postcodeRange` is undefined
   - Asserts `location.phoneCountryCode` is undefined
   - Verifies non-sensitive fields (suburbName, coordinates) are still present

All 7 filter assertions are now present and passing. Regression protection is complete.

---

### T-02: Rate Limiter Configuration Tests [VERIFIED ✓]

**File:** `packages/backend/src/__tests__/middleware/rate-limiter.test.ts`, lines 25-60

**Status:** FIXED

**Verification:**

1. **Export:** `RATE_LIMIT_CONFIG` is now exported from `rate-limiter.ts` (line 14)

2. **Test Coverage:** New test suite added (lines 25-60) with 7 configuration value tests:

```typescript
describe('configuration values match Spec Section 4.8', () => {
  it('global: 30 req / 1 minute', () => {
    expect(RATE_LIMIT_CONFIG.global.windowMs).toBe(60_000);
    expect(RATE_LIMIT_CONFIG.global.limit).toBe(30);
  });

  it('auth: 10 req / 15 minutes', () => {
    expect(RATE_LIMIT_CONFIG.auth.windowMs).toBe(15 * 60_000);
    expect(RATE_LIMIT_CONFIG.auth.limit).toBe(10);
  });

  it('api (authenticated): 100 req / 1 minute', () => {
    expect(RATE_LIMIT_CONFIG.api.windowMs).toBe(60_000);
    expect(RATE_LIMIT_CONFIG.api.limit).toBe(100);
  });

  it('upload: 20 req / 1 hour', () => {
    expect(RATE_LIMIT_CONFIG.upload.windowMs).toBe(3_600_000);
    expect(RATE_LIMIT_CONFIG.upload.limit).toBe(20);
  });

  it('password reset: 3 req / 1 hour', () => {
    expect(RATE_LIMIT_CONFIG.passwordReset.windowMs).toBe(3_600_000);
    expect(RATE_LIMIT_CONFIG.passwordReset.limit).toBe(3);
  });

  it('search: 30 req / 1 minute', () => {
    expect(RATE_LIMIT_CONFIG.search.windowMs).toBe(60_000);
    expect(RATE_LIMIT_CONFIG.search.limit).toBe(30);
  });

  it('review: 5 req / 24 hours', () => {
    expect(RATE_LIMIT_CONFIG.review.windowMs).toBe(86_400_000);
    expect(RATE_LIMIT_CONFIG.review.limit).toBe(5);
  });
});
```

All 7 tiers now have explicit configuration value assertions verifying Spec Section 4.8 compliance. Total test count for rate-limiter increased from 2 to 8 (1 existing + 7 new).

---

### P-01: CORS Middleware Ordering [VERIFIED ✓]

**File:** `packages/backend/src/app.ts`, lines 63-67

**Status:** FIXED

**Verification:**
```typescript
// Request pipeline
app.use(requestId);
app.use(corsConfig);

// Cookies & CSRF (after CORS so error responses include CORS headers)
app.use(cookieParser());
app.use(csrfProtection);
```

The middleware stack now applies CORS (`corsConfig`) **before** CSRF (`csrfProtection`). The comment on line 65 explicitly documents this ordering decision: "after CORS so error responses include CORS headers".

**Impact:** CSRF validation errors will now include CORS headers in their responses, allowing the frontend to receive proper error messages instead of generic CORS errors.

**Previously:** CSRF was applied at line 67 (before the current line 63), before CORS headers were set.

---

### C-01: Express Module Augmentation for `req.query` [VERIFIED ✓]

**File:** `packages/backend/src/middleware/validate.ts`, lines 6-12

**Status:** FIXED

**Verification:**
```typescript
// Module augmentation: allow validated query replacement on Express Request.
// Express types req.query as ParsedQs which is read-only in practice.
declare module 'express' {
  interface Request {
    query: Record<string, unknown>;
  }
}
```

A proper TypeScript module augmentation has been added, declaring `req.query` as `Record<string, unknown>`. This allows the assignment at line 61 to be done cleanly:

```typescript
req.query = result.data;
```

**No double cast needed.** The implementation now uses the augmentation correctly.

**Test Verification:** `packages/backend/src/__tests__/middleware/validate.test.ts`, line 81

```typescript
expect(req.query).toEqual({ page: 2, limit: 50 });
```

The test directly accesses `req.query` without casting, confirming the augmentation works correctly.

---

### C-02: Dynamic Import Comment in Encryption Tests [VERIFIED ✓]

**File:** `packages/backend/src/__tests__/utils/encryption.test.ts`, lines 8-10

**Status:** FIXED

**Verification:**
```typescript
// Dynamic imports (await import) are used per-test because getKey() reads
// process.env['ENCRYPTION_KEY'] on each call, not at module load time.
// This lets vi.stubEnv in beforeEach/individual tests override the key.
```

A clear 3-line comment has been added before the `describe` block explaining why dynamic imports (`await import`) are used in each test case. This prevents future maintainers from "optimizing" the imports to the top level, which would break the `vi.stubEnv` functionality in `beforeEach`.

---

### C-03: URL Constructor Case Normalisation Comment [VERIFIED ✓]

**File:** `packages/backend/src/utils/sanitizer.ts`, lines 36-38

**Status:** FIXED

**Verification:**
```typescript
try {
  // URL constructor normalises protocol to lowercase, so mixed-case
  // bypass attempts like "JaVaScRiPt:" are handled automatically.
  const parsed = new URL(url);
  if (['javascript:', 'data:', 'vbscript:'].includes(parsed.protocol)) {
```

A comment has been added explaining that the `URL` constructor automatically normalises the protocol to lowercase. This prevents future maintainers from questioning why mixed-case schemes like `JaVaScRiPt:` aren't explicitly handled (they are, by the constructor).

---

### C-04: CSRF Cookie Optimization [VERIFIED ✓]

**File:** `packages/backend/src/middleware/csrf.ts`, lines 65-89

**Status:** FIXED

**Verification:**
```typescript
const existingCookie = req.cookies?.[CSRF_COOKIE_NAME] as string | undefined;
let token: string;
let cookieChanged = true;

if (existingCookie) {
  const verified = verifySignedToken(existingCookie);
  if (verified) {
    token = verified;
    cookieChanged = false;  // <-- Flag: cookie is valid, don't re-set
  } else {
    token = generateToken();
  }
} else {
  token = generateToken();
}

// Only set the cookie when it's new or the previous one was invalid,
// avoiding unnecessary Set-Cookie headers on every response.
if (cookieChanged) {
  const signedToken = signToken(token);
  res.cookie(CSRF_COOKIE_NAME, signedToken, {
    httpOnly: false,
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
  });
}
```

The `cookieChanged` flag logic has been implemented. When an existing valid cookie is present, `cookieChanged` is set to `false` (line 71), and the `res.cookie()` call is skipped (conditional at line 81).

**Comment added (lines 79-80):** Explains the optimization and its purpose.

**Test Coverage:** `packages/backend/src/__tests__/middleware/csrf.test.ts`, lines 159-173

```typescript
describe('cookie reuse', () => {
  it('should reuse valid existing cookie token without re-setting cookie', () => {
    // Get initial token
    const getReqRes = mockReqRes('GET');
    csrfProtection(getReqRes.req, getReqRes.res, getReqRes.next);
    const signedToken = getReqRes.res._setCookies[0]!.value;

    // Make another GET with existing valid cookie
    const getReqRes2 = mockReqRes('GET', { 'XSRF-TOKEN': signedToken });
    csrfProtection(getReqRes2.req, getReqRes2.res, getReqRes2.next);

    // No new Set-Cookie header since existing cookie is valid
    expect(getReqRes2.res._setCookies.length).toBe(0);
    expect(getReqRes2.next).toHaveBeenCalled();
  });
});
```

The test verifies that when a valid cookie is reused, `res._setCookies.length` is 0, confirming no `Set-Cookie` header is sent. Test passes.

---

### C-05: Helmet Config Documentation [VERIFIED ✓]

**File:** Plan file inconsistency (documentation only)

**Status:** NOT AN ISSUE (documentation variance only)

**Verification:** The implementation correctly uses `strictTransportSecurity` (line 44 of `app.ts`), which is the canonical Helmet option name. The plan file used `hsts` (an alias). Both are valid. No code change required. This was a documentation-only observation in the initial review.

---

## 3. New Issues Found

**None.**

All fixes were implemented cleanly with no introduction of new bugs, regressions, or edge cases. The following were verified:

- TypeScript compilation: Clean (0 errors)
- Linting: Clean (0 warnings/errors)
- Tests: 322/322 passing (220 backend + 40 shared + 62 frontend)
- Logic correctness: All conditional flows verified via code inspection and test coverage

---

## 4. Final Verification

### Test Results

```
packages/backend:  220 tests passing
packages/shared:    40 tests passing
packages/frontend:  62 tests passing
────────────────────────────────────
Total:             322 tests passing
```

**Test Execution:** All tests run with `npm run test -- --run`
**Result:** 0 failures, 0 skipped

### Lint Results

```
packages/backend:  Clean
packages/shared:   Clean
packages/frontend: Clean
```

**Lint Execution:** `npm run lint`
**Result:** 0 errors, 0 warnings

### Typecheck Results

```
packages/backend:  Clean
packages/shared:   Clean
packages/frontend: Clean
```

**Typecheck Execution:** `npm run typecheck`
**Result:** 0 type errors

---

## 5. Pre-Existing Issues Verification

The initial review identified 3 pre-existing issues (not introduced by Phase 1.5):

### P-01: CORS Middleware Ordering [FIXED ✓]

**Status:** FIXED in this round (see verification above)

The middleware ordering has been corrected so CORS runs before CSRF.

### P-02: Rate Limiter In-Memory Store [VERIFIED PRE-EXISTING]

**File:** `packages/backend/src/middleware/rate-limiter.ts`, line 3

**Status:** ACKNOWLEDGED with TODO comment

```typescript
// TODO: Replace in-memory store with Redis store (`rate-limit-redis`) for multi-instance deployments
```

This is correctly deferred to Phase 19 (Production Deployment). No action required for Phase 1.5.

### P-03: `trust proxy` Hardcoded [VERIFIED PRE-EXISTING]

**File:** `packages/backend/src/app.ts`, line 20

```typescript
app.set('trust proxy', 1);
```

This is hardcoded to `1` and should ideally come from configuration. This is a valid observation but is beyond the scope of Phase 1.5 (Security Foundation). Can be addressed in a future infrastructure or configuration enhancement phase.

**Recommendation:** Add to TODO.md for future phases (likely Phase 19: Production Deployment).

---

## 6. Final Verdict

**PASS CLEAN**

All issues identified in the initial Phase 1.5 Security Foundation review have been successfully resolved:

- **1 Critical issue:** Fixed and verified
- **3 Important issues:** Fixed and verified
- **5 Minor issues:** Fixed and verified (1 was documentation only)
- **3 Pre-existing issues:** 1 fixed (P-01), 2 remain as acknowledged (P-02, P-03)

No new issues were introduced. The codebase is clean, well-tested (322 passing tests), fully typed, and lint-free.

**Phase 1.5 is complete and ready for final sign-off.**

---

## 7. Recommendations for Next Steps

1. **Close Phase 1.5:** Mark as complete in PROGRESS.md and TODO.md
2. **Phase 2 (Authentication):** Proceed with JWT implementation
3. **Future Enhancement (Phase 19 or later):** Address P-02 (Redis store) and P-03 (trust proxy config)

No blockers remain for Phase 2 development.
