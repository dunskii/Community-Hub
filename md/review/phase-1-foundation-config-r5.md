# QA Review #5 - Phase 1 (Subsections 1.1 + 1.2)

**Date:** 2 February 2026
**Reviewer:** Automated QA
**Scope:** Post-fix re-review after all Review #4 remediation
**Previous Reviews:**
- Review #1: 32 issues (1C, 5H, 14M, 12L) -- all remediated
- Review #2: 25 issues (0C, 1H, 8M, 16L) -- all remediated
- Review #3: 10 issues (0C, 0H, 3M, 7L) -- all remediated
- Review #4: 13 issues (0C, 0H, 5M, 8L) -- all remediated

---

## Executive Summary

All 13 issues from Review #4 have been verified as properly resolved. The codebase is in strong shape after five rounds of review and four rounds of fixes. This review found **0 Critical, 1 High, 3 Medium, and 7 Low** new issues.

The most important finding is that the backend platform-loader does not re-validate merged config after deep-merging an environment override, which means the new cross-field `.refine()` constraints (M4/M5 from Review #4) can be silently bypassed by override files.

**This review found: 0 CRITICAL, 1 HIGH, 3 MEDIUM, 7 LOW issues.**

| Severity | Count | Breakdown |
|----------|-------|-----------|
| CRITICAL | 0 | -- |
| HIGH | 1 | Merged config not re-validated after deepMerge |
| MEDIUM | 3 | Port 3000 collision, Redis healthcheck var expansion, docker/.env.docker missing ELASTIC_PASSWORD |
| LOW | 7 | No PORT tests, validate.test mock data stale, coverage excludes, CI doesn't enforce thresholds, nested proto pollution test, pino pollutes test output, formatZodErrors empty path |

---

## Review #4 Remediation Status (13/13 Verified)

### MEDIUM (5/5 Fixed)

| ID | Issue | Status |
|----|-------|--------|
| M1 | .prettierignore scope blocks CI | **FIXED** -- Added `.claude/`, `docs/`, `md/` to `.prettierignore`. Ran `pnpm format`. `format:check` now passes. |
| M2 | Windows nul artifact | **FIXED** -- Deleted file, added `nul` to `.gitignore`. |
| M3 | Redis healthcheck password exposure | **FIXED** -- Changed to `REDISCLI_AUTH=$REDIS_PASSWORD redis-cli ping`. See new M2 for follow-up. |
| M4 | Missing defaultSearchRadiusKm cross-validation | **FIXED** -- `.refine()` added, test added. See new H1 for follow-up. |
| M5 | Missing defaultLanguage cross-validation | **FIXED** -- `.refine()` added, test added. See new H1 for follow-up. |

### LOW (8/8 Fixed)

| ID | Issue | Status |
|----|-------|--------|
| L1 | Shared tsconfig exclude undocumented | **FIXED** -- Comment added. |
| L2 | Missing @types/node devDep | **FIXED** -- Added to shared package. |
| L3 | __dirname in ESM test | **FIXED** -- Replaced with `import.meta.url`. |
| L4 | No formatZodErrors tests | **FIXED** -- 5 tests added. |
| L5 | useFeatureFlag memoization untested | **FIXED** -- Stability test added. |
| L6 | No coverage thresholds | **FIXED** -- 80% thresholds in all 3 configs. See new L3/L5 for follow-up. |
| L7 | No PORT env variable | **FIXED** -- Added with transform and validation. See new M1/L1 for follow-up. |
| L8 | Docker image pinning undocumented | **FIXED** -- Comment added to docker-compose.yml. |

---

## New Issues Found

### HIGH (1 issue)

#### H1: Merged config not re-validated after deepMerge bypass cross-field `.refine()` constraints

- **File:** `packages/backend/src/config/platform-loader.ts:50-66`
- **Severity:** HIGH
- **Detail:** After deep-merging the base config with an environment override, the merged result is cached without re-validation through `platformConfigSchema`. The base config is validated (line 43), and the override is validated against the deep-partial schema (line 56), but the merged result on line 63 bypasses full-schema validation. This means a valid base + valid partial override could produce a semantically invalid combined config that violates cross-field `.refine()` constraints. For example: `platform.json` has `defaultSearchRadiusKm: 5` and `maxSearchRadiusKm: 20`, but `platform.development.json` overrides only `maxSearchRadiusKm: 3`. The merged config has `defaultSearchRadiusKm: 5 > maxSearchRadiusKm: 3`, violating the refinement. Similarly, an override setting `defaultLanguage: "fr"` without adding French to `supportedLanguages` would pass silently.
- **Fix:** After the `deepMerge` call, re-validate the merged result:
  ```typescript
  const mergedRaw = deepMerge(config, overrideResult.data as Record<string, unknown>);
  const mergedResult = platformConfigSchema.safeParse(mergedRaw);
  if (!mergedResult.success) {
    throw new Error(
      `Invalid merged platform config after applying ${env} override:\n${formatZodErrors(mergedResult.error.issues)}`,
    );
  }
  config = mergedResult.data;
  ```

---

### MEDIUM (3 issues)

#### M1: Backend and Vite frontend both default to port 3000, causing collision on `pnpm dev`

- **File:** `packages/backend/src/config/env-validate.ts:6`, `packages/frontend/vite.config.ts:7`, `.env.example:13`
- **Severity:** MEDIUM
- **Detail:** The root `package.json` script `"dev": "pnpm -r --parallel run dev"` starts both the backend and Vite frontend simultaneously. Both default to port 3000. The backend's `PORT` env var defaults to `'3000'`, and Vite's `server.port` is hardcoded to `3000`. Running `pnpm dev` will cause one process to fail with a port conflict.
- **Fix:** Change the backend default to a different port (e.g., `3001`) and update `.env.example` to match:
  ```typescript
  PORT: z.string().transform(Number).pipe(z.number().int().min(1).max(65535)).default('3001'),
  ```

#### M2: Redis healthcheck `$REDIS_PASSWORD` does not expand inside the container

- **File:** `docker/docker-compose.yml:31`
- **Severity:** MEDIUM
- **Detail:** The healthcheck `REDISCLI_AUTH=$REDIS_PASSWORD redis-cli ping` uses shell expansion inside the Redis container. However, `REDIS_PASSWORD` is not set as an environment variable on the Redis service -- it is only available to Docker Compose interpolation (from `.env.docker`). The `command:` directive uses `${REDIS_PASSWORD:?...}` which is Docker Compose pre-substitution, but the healthcheck `$REDIS_PASSWORD` relies on the container shell, where the variable is undefined.
- **Fix:** Add `REDIS_PASSWORD` to the Redis service's environment block and use `$$` to pass through to the container shell:
  ```yaml
  redis:
    environment:
      REDIS_PASSWORD: ${REDIS_PASSWORD:?REDIS_PASSWORD must be set}
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    healthcheck:
      test: ['CMD-SHELL', 'REDISCLI_AUTH=$$REDIS_PASSWORD redis-cli ping']
  ```

#### M3: `docker/.env.docker` is missing `ELASTIC_PASSWORD` (out of sync with example)

- **File:** `docker/.env.docker`
- **Severity:** MEDIUM
- **Detail:** The `.env.docker.example` file includes `ELASTIC_PASSWORD=CHANGEME` (added in Review #3 fix), but the actual `docker/.env.docker` file on disk does not contain this variable. Running staging or prod compose profiles will fail with `ELASTIC_PASSWORD must be set`. The file is gitignored so this is a local-only issue, but it means Docker will fail for any developer who created `.env.docker` before the example was updated.
- **Fix:** Add `ELASTIC_PASSWORD=CHANGEME` to `docker/.env.docker`. This is a local file change only.

---

### LOW (7 issues)

#### L1: No test coverage for new PORT env variable

- **File:** `packages/backend/src/__tests__/env-validate.test.ts`
- **Severity:** LOW
- **Detail:** The PORT variable was added with a string-to-number transform, integer constraint, and min/max (1-65535). No tests validate the default (3000), valid custom values, or invalid values (0, 65536, "abc"). The `validEnv` fixture does not include PORT, so only the default path is implicitly exercised.
- **Fix:** Add test cases for PORT default, valid transform, and invalid values.

#### L2: `validate.test.ts` mock data does not include PORT and has post-transform types

- **File:** `packages/backend/src/__tests__/validate.test.ts:15-38`
- **Severity:** LOW
- **Detail:** The `mockEnv` object contains `ENABLE_DEBUG_MODE: true` (boolean), `CDN_ENABLED: false` (boolean), and `STORAGE_MAX_SIZE_GB: 50` (number), which are post-transform types rather than raw string env values. It also omits the newly added `PORT` field. Since `validateEnv` is mocked, this works, but the mock is semantically misleading.
- **Fix:** Add `PORT: 3001` to `mockEnv` for completeness.

#### L3: Vitest coverage thresholds missing `exclude` patterns for fixture and setup files

- **File:** All 3 `vitest.config.ts` files
- **Severity:** LOW
- **Detail:** Coverage thresholds are set at 80% but `coverage.exclude` patterns are not specified. Non-production files like `src/__tests__/setup.ts`, `src/__tests__/fixtures.ts`, and `src/testing.ts` will be included in coverage calculations, potentially dragging coverage below thresholds despite not being production code.
- **Fix:** Add `coverage.exclude` patterns: `['src/**/__tests__/**', 'src/testing.ts']` for shared, `['src/**/__tests__/**']` for backend and frontend.

#### L4: Missing test for nested prototype pollution protection in deepMerge

- **File:** `packages/shared/src/__tests__/deep-merge.test.ts`
- **Severity:** LOW
- **Detail:** The existing tests verify top-level `__proto__`, `constructor`, and `prototype` key blocking. The code correctly checks `DANGEROUS_KEYS` at every recursive level, but there is no test proving nested dangerous keys are also blocked (e.g., `{ "outer": { "__proto__": { "polluted": true } } }`).
- **Fix:** Add a test case for nested prototype pollution protection.

#### L5: CI runs `pnpm test` not `pnpm test:coverage`, so 80% thresholds are unenforced

- **File:** `.github/workflows/ci.yml:40`
- **Severity:** LOW
- **Detail:** The CI workflow runs `pnpm test` (which calls `vitest run` without `--coverage`). Coverage thresholds are only enforced when `--coverage` is passed. PRs could drop below 80% coverage without CI failing.
- **Fix:** Change CI test step to `pnpm test:coverage` when coverage enforcement is desired. Note this increases CI runtime.

#### L6: Pino logger output pollutes test stdout

- **File:** `packages/backend/src/__tests__/validate.test.ts`
- **Severity:** LOW
- **Detail:** The `validateAllConfig` function's pino logger writes JSON lines to stdout during tests (`"Validating environment variables..."`, `"Loading platform configuration..."`, `"Config loaded"`). Tests still pass but output is cluttered.
- **Fix:** Mock the pino logger in the test setup, or configure pino to use `level: 'silent'` when `NODE_ENV=test`.

#### L7: `formatZodErrors` produces `"  - : message"` for empty path

- **File:** `packages/shared/src/config/format-zod-errors.ts:7`
- **Severity:** LOW
- **Detail:** When a Zod issue has an empty path (e.g., root-level `.refine()`), the output is `"  - : Root error"` with an empty string before the colon. This is tested and intentional but reads oddly.
- **Fix:** Consider `i.path.length > 0 ? i.path.join('.') : '(root)'` to produce `"  - (root): message"`.

---

## Code Quality Metrics

| Metric | Value | Assessment |
|--------|-------|------------|
| Total source files | 17 | Well within limits |
| Total test files | 14 + 1 fixture | Comprehensive |
| Tests passing | 80/80 | All green (up from 72) |
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
| Spec Section 2.3 (env vars) | PASS | 33 variables (32 + PORT) present and validated |
| Spec Section 2.4 (platform.json schema) | PASS | All 11 sections, all nested fields, cross-field validations |
| Spec Section 2.5 (feature flags) | PASS | All 16 flags with gating |
| Spec Section 2.8 (config access pattern) | PARTIAL | Merge works but lacks post-merge re-validation (H1) |
| Spec Section 2.9 (validation rules) | PASS | All required validations + BCP 47, locale regex, radius/language refinements |
| Spec Section 2.10 (security) | PASS | No secrets in source, prototype pollution protection |
| Spec Section 2.7 (deployment checklist) | PASS | Superset of spec requirements |
| Location-agnostic architecture | PASS | No hardcoded location data in production source |
| SESSION_SECRET minimum | PASS | 64 chars (matches spec) |

---

## Security Assessment

| Check | Status | Detail |
|-------|--------|--------|
| No hardcoded secrets | PASS | All passwords use `${VAR:?}` in Docker, no secrets in source |
| Prototype pollution protection | PASS | 3 DANGEROUS_KEYS blocked at every recursion level |
| Input validation | PASS | Zod schemas for all config, regex for locales/countries |
| Cross-field validation | PASS | Search radius and language refinements present |
| `isPlainObject` defensive check | PASS | Verifies prototype chain, handles `Object.create(null)` |
| SESSION_SECRET strength | PASS | 64-char minimum enforced |
| ENCRYPTION_KEY strength | PASS | 44-char minimum (base64 AES-256) |
| DATABASE_URL format check | PASS | Must start with `postgresql://` |
| Redis healthcheck password | **PARTIAL** | REDISCLI_AUTH used but var may not expand in container (M2) |
| .env file protection | PASS | `.env.*` gitignored with correct negations |

---

## Issue Trend Across Reviews

| Review | CRITICAL | HIGH | MEDIUM | LOW | Total |
|--------|----------|------|--------|-----|-------|
| Review #1 | 1 | 5 | 14 | 12 | 32 |
| Review #2 | 0 | 1 | 8 | 16 | 25 |
| Review #3 | 0 | 0 | 3 | 7 | 10 |
| Review #4 | 0 | 0 | 5 | 8 | 13 |
| **Review #5** | **0** | **1** | **3** | **7** | **11** |

All issues from Reviews #1 through #4 have been verified as properly resolved.

---

## Recommendations

### Before Next Commit

1. **Fix H1** -- Re-validate merged config after deepMerge in platform-loader.ts
2. **Fix M1** -- Change backend PORT default to 3001 (avoid Vite collision)
3. **Fix M2** -- Add REDIS_PASSWORD to Redis service environment, use $$ for container expansion

### During Phase 1.3-1.4

4. **Fix M3** -- Update local docker/.env.docker to include ELASTIC_PASSWORD (local file only)
5. **Fix L1** -- Add PORT test cases to env-validate.test.ts
6. **Fix L2** -- Add PORT to validate.test.ts mockEnv
7. **Fix L3** -- Add coverage.exclude patterns to vitest configs
8. **Fix L4** -- Add nested prototype pollution test
9. **Fix L5** -- Change CI to test:coverage when enforcement is desired

### Ongoing

10. **Fix L6** -- Suppress pino logger in test output
11. **Fix L7** -- Improve formatZodErrors empty path display
