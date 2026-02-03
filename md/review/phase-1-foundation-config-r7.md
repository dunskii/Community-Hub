# QA Review #7 - Phase 1 (Subsections 1.1 + 1.2)

**Date:** 2 February 2026
**Reviewer:** Automated QA
**Scope:** Post-fix re-review after all Review #6 remediation
**Previous Reviews:**
- Review #1: 32 issues (1C, 5H, 14M, 12L) -- all remediated
- Review #2: 25 issues (0C, 1H, 8M, 16L) -- all remediated
- Review #3: 10 issues (0C, 0H, 3M, 7L) -- all remediated
- Review #4: 13 issues (0C, 0H, 5M, 8L) -- all remediated
- Review #5: 11 issues (0C, 1H, 3M, 7L) -- all remediated
- Review #6: 8 issues (0C, 0H, 2M, 6L) -- all remediated

---

## Executive Summary

All 8 issues from Review #6 have been verified as properly resolved. The codebase is in excellent shape after seven rounds of review and six rounds of fixes. This review found **0 Critical, 0 High, 1 Medium, and 3 Low** new issues -- the lowest total yet.

The single Medium issue is a test isolation concern (spy not restored in `afterEach`). The Low issues are documentation/consistency matters with no functional impact.

**This review found: 0 CRITICAL, 0 HIGH, 1 MEDIUM, 3 LOW issues.**

| Severity | Count | Breakdown |
|----------|-------|-----------|
| CRITICAL | 0 | -- |
| HIGH | 0 | -- |
| MEDIUM | 1 | vi.spyOn not restored in afterEach (test isolation) |
| LOW | 3 | .env.example Required/Optional mismatch, platform.json empty analytics ID, validate.test mockPlatform partial |

---

## Review #6 Remediation Status (8/8 Verified)

### MEDIUM (2/2 Fixed)

| ID | Issue | Status |
|----|-------|--------|
| M1 | Missing `backups/` in `.gitignore` | **FIXED** -- Added on line 22 in uploads/media section. |
| M2 | Backend `src/index.ts` entry point missing | **FIXED** -- Placeholder file created with `export {}`. |

### LOW (6/6 Fixed)

| ID | Issue | Status |
|----|-------|--------|
| L1 | No test for post-merge validation failure | **FIXED** -- `vi.spyOn` test added, exercises error path. |
| L2 | Shared index.test.ts missing formatZodErrors | **FIXED** -- Export test added. |
| L3 | No clearPlatformConfigCache invalidation test | **FIXED** -- Test verifies reload from disk after cache clear. |
| L4 | Elasticsearch healthcheck auth comment | **FIXED** -- NOTE comment added. |
| L5 | docker/.env.docker.example copy instructions | **FIXED** -- Clarified to copy to `docker/.env`. |
| L6 | .npmrc contradictory peer settings | **FIXED** -- Removed `strict-peer-dependencies=true`. |

---

## New Issues Found

### MEDIUM (1 issue)

#### M1: `vi.spyOn` on `platformConfigSchema.safeParse` not restored in afterEach

- **File:** `packages/backend/src/__tests__/platform-loader.test.ts`
- **Severity:** MEDIUM
- **Detail:** The post-merge validation test creates a `vi.spyOn(platformConfigSchema, 'safeParse')` with a custom `mockImplementation`. The `afterEach` block only calls `vi.unstubAllEnvs()` and `rmSync` -- it does not call `vi.restoreAllMocks()`. The vitest config does not set `restoreMocks: true` either. The spy leaks into subsequent tests. Currently passes by coincidence due to test order, but could cause failures if tests are reordered or new tests are added.
- **Fix:** Add `vi.restoreAllMocks()` to the `afterEach` block:
  ```typescript
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    rmSync(tempDir, { recursive: true, force: true });
  });
  ```

---

### LOW (3 issues)

#### L1: `.env.example` says "Required" for optional Cloudflare variables

- **File:** `.env.example:95-97`
- **Severity:** LOW
- **Detail:** `CLOUDFLARE_ZONE_ID`, `CLOUDFLARE_API_TOKEN`, and `CDN_URL` are commented as `# Required:` but defined as `z.string().optional()` in `env-validate.ts`. This is misleading.
- **Fix:** Change comments to `# Optional:` for all three variables.

#### L2: `platform.json` has empty `googleAnalyticsId`

- **File:** `config/platform.json`
- **Severity:** LOW
- **Detail:** The committed `platform.json` has `"googleAnalyticsId": ""` while the spec Section 2.4 shows `"googleAnalyticsId": "G-XXXXXXXXXX"`. The placeholder pattern signals "replace me" more clearly.
- **Fix:** Cosmetic -- consider using `"G-XXXXXXXXXX"` to match the spec pattern.

#### L3: `validate.test.ts` mockPlatform is a partial stub, not a full PlatformConfig

- **File:** `packages/backend/src/__tests__/validate.test.ts:42-45`
- **Severity:** LOW
- **Detail:** `mockPlatform` only has `platform.id`, `platform.version`, and `location.suburbName`. If `validateAllConfig` is later extended to access other fields, the partial mock would silently produce `undefined`. Other test files use `createValidPlatformConfig()` from the shared fixture.
- **Fix:** Use the shared fixture for consistency:
  ```typescript
  import { createValidPlatformConfig } from '@community-hub/shared/testing';
  const mockPlatform = createValidPlatformConfig();
  ```

---

## Code Quality Metrics

| Metric | Value | Assessment |
|--------|-------|------------|
| Total source files | 18 | Well within limits |
| Total test files | 14 + 1 fixture | Comprehensive |
| Tests passing | 89/89 | All green (up from 86) |
| Files > 1000 lines | 0 | No monolithic files |
| Largest source file | 192 lines (platform-schema.ts) | Acceptable |
| `any` type usage | 0 | Excellent |
| `@ts-ignore` usage | 0 | Excellent |
| `@ts-expect-error` usage | 0 | Excellent |
| `console.log` in source | 0 | Uses Pino logger |
| `process.exit` in source | 0 | Throws instead |
| ESLint warnings/errors | 0 | Clean |
| Prettier violations | 0 | Clean |
| `no-explicit-any` rule | `error` | Enforced |

---

## Specification Compliance

| Area | Status | Notes |
|------|--------|-------|
| Spec Section 2.3 (env vars) | PASS | 33 variables present and validated |
| Spec Section 2.4 (platform.json schema) | PASS | All 11 sections, all fields, cross-field validations |
| Spec Section 2.5 (feature flags) | PASS | All 16 flags with gating |
| Spec Section 2.8 (config access pattern) | PASS | Merge + post-merge re-validation working |
| Spec Section 2.9 (validation rules) | PASS | All validations enforced |
| Spec Section 2.10 (security) | PASS | No secrets in source, prototype pollution protection |
| Spec Section 2.7 (deployment checklist) | PASS | Superset of spec requirements |
| Location-agnostic architecture | PASS | No hardcoded location data |
| SESSION_SECRET minimum | PASS | 64 chars enforced |

---

## Security Assessment

| Check | Status | Detail |
|-------|--------|--------|
| No hardcoded secrets | PASS | All passwords use `${VAR:?}` in Docker, no secrets in source |
| Prototype pollution protection | PASS | 3 DANGEROUS_KEYS blocked at all recursion levels, tested |
| Input validation | PASS | Zod schemas for all config |
| Cross-field validation | PASS | Search radius and language refinements enforced after merge |
| Redis healthcheck password | PASS | Via container environment with `$$` expansion |
| .env file protection | PASS | `.env.*` gitignored, backups/ gitignored |

---

## Issue Trend Across Reviews

| Review | CRITICAL | HIGH | MEDIUM | LOW | Total |
|--------|----------|------|--------|-----|-------|
| Review #1 | 1 | 5 | 14 | 12 | 32 |
| Review #2 | 0 | 1 | 8 | 16 | 25 |
| Review #3 | 0 | 0 | 3 | 7 | 10 |
| Review #4 | 0 | 0 | 5 | 8 | 13 |
| Review #5 | 0 | 1 | 3 | 7 | 11 |
| Review #6 | 0 | 0 | 2 | 6 | 8 |
| **Review #7** | **0** | **0** | **1** | **3** | **4** |

All issues from Reviews #1 through #6 have been verified as properly resolved.

---

## Recommendations

### Before Next Commit

1. **Fix M1** -- Add `vi.restoreAllMocks()` to platform-loader.test.ts afterEach

### During Phase 1.3

2. **Fix L1** -- Update `.env.example` Cloudflare comments to "Optional"
3. **Fix L2** -- Consider using spec placeholder for googleAnalyticsId
4. **Fix L3** -- Replace partial mockPlatform with createValidPlatformConfig()

---

## Overall Assessment

Phase 1 (Subsections 1.1 + 1.2) has reached near-clean state after seven rounds of review. The issue count has dropped from 32 to 4, with zero Critical or High issues remaining. The single Medium issue is a test isolation fix. The foundation is solid and ready for Phase 1.3 (Backend Infrastructure).
