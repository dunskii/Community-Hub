# QA Review #4 - Phase 1 (Subsections 1.1 + 1.2)

**Date:** 2 February 2026
**Reviewer:** Automated QA
**Scope:** Post-fix re-review after all Review #3 remediation
**Previous Reviews:**
- Review #1: 32 issues (1C, 5H, 14M, 12L) -- all remediated
- Review #2: 25 issues (0C, 1H, 8M, 16L) -- all remediated
- Review #3: 10 issues (0C, 0H, 3M, 7L) -- all remediated

---

## Executive Summary

All 10 issues from Review #3 have been verified as properly resolved. The codebase is in excellent shape after four rounds of review and three rounds of fixes. This review found **0 Critical, 0 High, 5 Medium, and 8 Low** new issues.

The most actionable finding is the `.prettierignore` scope causing `pnpm format:check` to fail on 70 files, which blocks CI. This should be fixed before the next commit.

**This review found: 0 CRITICAL, 0 HIGH, 5 MEDIUM, 8 LOW issues.**

| Severity | Count | Breakdown |
|----------|-------|-----------|
| CRITICAL | 0 | -- |
| HIGH | 0 | -- |
| MEDIUM | 5 | Prettier scope blocks CI, nul artifact, Redis healthcheck password, search radius cross-validation, defaultLanguage cross-validation |
| LOW | 8 | Shared tsconfig exclude inconsistency, missing @types/node devDep, __dirname in ESM test, no formatZodErrors tests, useFeatureFlag memoization untested, no coverage thresholds, no PORT env var, Docker image pinning inconsistency |

---

## Review #3 Remediation Status (10/10 Verified)

### MEDIUM (3/3 Fixed)

| ID | Issue | Status |
|----|-------|--------|
| M1 | .gitignore blocks docker/.env.docker.example | **FIXED** -- Added `!docker/.env.docker.example` negation and removed redundant `docker/.env.docker` line. |
| M2 | docker/.env.docker.example missing ELASTIC_PASSWORD | **FIXED** -- Added `ELASTIC_PASSWORD=CHANGEME` with comment noting it is required for staging/prod. |
| M3 | Test fixtures exported from production barrel | **FIXED** -- Created `src/testing.ts` entry point, added `./testing` export path in `package.json`, removed test fixture exports from `src/index.ts`, updated 4 consumer test files to import from `@community-hub/shared/testing`. Updated `tsconfig.json` exclude to compile `fixtures.ts` while still excluding test files. |

### LOW (7/7 Fixed)

| ID | Issue | Status |
|----|-------|--------|
| L1 | Redundant docker/.env.docker gitignore line | **FIXED** -- Removed (merged with M1 fix). |
| L2 | validate.test.ts missing afterEach | **FIXED** -- Added `afterEach(() => { vi.restoreAllMocks(); })` and imported `afterEach`. |
| L3 | Location-specific 'guildford' in deep-merge test | **FIXED** -- Replaced with `'test'` and `'test-dev'`. |
| L4 | defaultKeywords allows empty strings | **FIXED** -- Changed to `z.array(z.string().min(1))`. |
| L5 | featureGate missing explicit return type | **FIXED** -- Added `(req: Request, res: Response, next: NextFunction) => void` return type. |
| L6 | globals: true unused in vitest configs | **FIXED** -- Removed from all 3 vitest.config.ts files. |
| L7 | BCP 47 regex is a subset | **FIXED** -- Added comment documenting that only `ll` and `ll-RR` forms are supported. Updated error message. |

---

## New Issues Found

### MEDIUM (5 issues)

#### M1: `.prettierignore` scope causes `pnpm format:check` to fail on 70 files

- **File:** `.prettierignore`
- **Severity:** MEDIUM
- **Detail:** The `.prettierignore` only excludes `dist`, `coverage`, `pnpm-lock.yaml`, and `node_modules`. Running `pnpm format:check` reports 70 files with formatting issues across `docs/`, `md/`, `.claude/`, `PROGRESS.md`, `TODO.md`, and several source files. This blocks CI since the workflow runs `format:check`. The source file warnings may be legitimate formatting issues, while the markdown/doc files should be excluded from Prettier's scope entirely.
- **Fix:** Two-part fix:
  1. Add non-source directories to `.prettierignore`:
     ```
     .claude/
     docs/
     md/
     ```
  2. Run `pnpm format` to auto-fix the source files that have legitimate formatting issues.

#### M2: Windows `nul` artifact file in project root

- **File:** `nul` (0 bytes, project root)
- **Severity:** MEDIUM
- **Detail:** A 0-byte file named `nul` exists in the project root. This is a Windows artifact created when something attempted to write to the Windows `NUL` device but created a literal file instead. It shows up as an untracked file in `git status` and should not be committed.
- **Fix:** Delete the file and add `nul` to `.gitignore`:
  ```bash
  rm nul
  ```
  ```gitignore
  # Windows artifacts
  nul
  ```

#### M3: Redis healthcheck exposes password via command-line argument

- **File:** `docker/docker-compose.yml` (Redis service healthcheck)
- **Severity:** MEDIUM
- **Detail:** The Redis healthcheck uses `redis-cli -a '${REDIS_PASSWORD}' ping` which passes the password as a command-line argument. On Linux, this is visible in `/proc/<pid>/cmdline` and `docker inspect` output. Redis documentation recommends using the `REDISCLI_AUTH` environment variable instead. While the exposure is limited to within the container, it is a security best practice violation.
- **Fix:** Change the healthcheck to:
  ```yaml
  healthcheck:
    test: ['CMD-SHELL', 'REDISCLI_AUTH=$REDIS_PASSWORD redis-cli ping']
    interval: 10s
    timeout: 5s
    retries: 5
  ```

#### M4: Missing cross-field validation: `defaultSearchRadiusKm <= maxSearchRadiusKm`

- **File:** `packages/shared/src/config/platform-schema.ts:71-72`
- **Severity:** MEDIUM
- **Detail:** The schema validates `defaultSearchRadiusKm` and `maxSearchRadiusKm` independently as positive numbers, but does not enforce that `defaultSearchRadiusKm <= maxSearchRadiusKm`. A config with `defaultSearchRadiusKm: 100` and `maxSearchRadiusKm: 20` would pass validation but produce undefined behaviour in the search system. The pattern for cross-field validation is already established with the bounding box `.refine()` on line 17.
- **Fix:** Add a `.refine()` on the location object:
  ```typescript
  .refine(
    (loc) => loc.defaultSearchRadiusKm <= loc.maxSearchRadiusKm,
    {
      message: 'defaultSearchRadiusKm must be <= maxSearchRadiusKm',
      path: ['defaultSearchRadiusKm'],
    },
  )
  ```

#### M5: Missing cross-field validation: `defaultLanguage` must exist in `supportedLanguages`

- **File:** `packages/shared/src/config/platform-schema.ts:129-132`
- **Severity:** MEDIUM
- **Detail:** The `multilingual` section validates `defaultLanguage` as a BCP 47 string and `supportedLanguages` as an array of language objects, but does not enforce that `defaultLanguage` refers to a code present in the `supportedLanguages` array. A config with `defaultLanguage: "fr"` but no French entry in `supportedLanguages` would pass validation but break the multilingual system at runtime.
- **Fix:** Add a `.refine()` on the multilingual object:
  ```typescript
  .refine(
    (ml) => ml.supportedLanguages.some((lang) => lang.code === ml.defaultLanguage),
    {
      message: 'defaultLanguage must be one of the codes in supportedLanguages',
      path: ['defaultLanguage'],
    },
  )
  ```

---

### LOW (8 issues)

#### L1: Shared tsconfig exclude pattern inconsistency

- **File:** `packages/shared/tsconfig.json:10`
- **Severity:** LOW
- **Detail:** The shared tsconfig uses `src/**/__tests__/*.test.ts` as the exclude pattern (to allow `fixtures.ts` to compile for the `./testing` entry point). Backend and frontend use `src/**/__tests__/**`. The difference is intentional and correct, but undocumented. A comment explaining why would help future developers.

#### L2: Shared package missing explicit `@types/node` devDependency

- **File:** `packages/shared/package.json`
- **Severity:** LOW
- **Detail:** Tests in the shared package use Node.js APIs (`readFileSync`, `resolve`, `__dirname`) but `@types/node` is not listed as a devDependency. This works because vitest provides the types via its resolution, but it is an implicit dependency.
- **Fix:** Add `"@types/node": "^22.0.0"` to devDependencies.

#### L3: `__dirname` usage in ESM test file

- **File:** `packages/shared/src/__tests__/platform-schema.test.ts:9`
- **Severity:** LOW
- **Detail:** The project uses `"type": "module"` (ESM) but the test file uses `__dirname` (a CJS-only global). Vitest provides this via its CJS compatibility shim, so it works, but it is an implicit dependency on Vitest's behaviour. The idiomatic ESM approach uses `import.meta.url`.
- **Fix:** Replace with:
  ```typescript
  import { fileURLToPath } from 'node:url';
  const __dirname = fileURLToPath(new URL('.', import.meta.url));
  ```

#### L4: No dedicated test file for `formatZodErrors`

- **File:** (missing) `packages/shared/src/__tests__/format-zod-errors.test.ts`
- **Severity:** LOW
- **Detail:** `formatZodErrors` is used by both the backend platform loader and env validator, and is exported from the shared package. It has zero direct test coverage. Edge cases not validated: empty issues array, issues with empty `path` array, issues with numeric path segments (array indices).
- **Fix:** Create a small test file covering these edge cases.

#### L5: `useFeatureFlag` test does not verify memoization behaviour

- **File:** `packages/frontend/src/__tests__/useFeatureFlag.test.ts`
- **Severity:** LOW
- **Detail:** The hook wraps `isFeatureEnabled` in `useMemo`, but no test verifies that memoization works (i.e., that re-renders with identical props do not re-invoke the function). The "should update when features config changes" test verifies reactivity, but not memoization stability.

#### L6: No coverage thresholds configured in vitest configs

- **File:** All 3 `vitest.config.ts` files
- **Severity:** LOW
- **Detail:** No coverage thresholds are enforced despite `@vitest/coverage-v8` being available and the spec requiring >80% coverage (Section 30). Acceptable for Phase 1 infrastructure, but should be configured early in Phase 2.

#### L7: No `PORT` env variable in schema or `.env.example`

- **File:** `packages/backend/src/config/env-validate.ts`, `.env.example`
- **Severity:** LOW
- **Detail:** Neither the env validation schema nor the `.env.example` includes a `PORT` variable for the backend server. Acceptable for Phase 1 since no server is running yet, but should be added in Phase 1.3 when the Express entry point is implemented.

#### L8: Docker image pinning strategy is inconsistent

- **File:** `docker/docker-compose.yml`
- **Severity:** LOW
- **Detail:** PostgreSQL (`16-alpine`) and Redis (`7-alpine`) use major-version tags that auto-update minor versions. Elasticsearch (`8.17.0`) is fully pinned. Mailpit (`v1.21`) uses a minor version pin. The inconsistency is not harmful but should be documented.

---

## Code Quality Metrics

| Metric | Value | Assessment |
|--------|-------|------------|
| Total source files | 17 | Well within limits |
| Total test files | 12 + 1 fixture | Comprehensive |
| Tests passing | 72/72 | All green |
| Files > 1000 lines | 0 | No monolithic files |
| Largest source file | 184 lines (platform-schema.ts) | Acceptable |
| `any` type usage | 0 | Excellent |
| `@ts-ignore` usage | 0 | Excellent |
| `@ts-expect-error` usage | 0 | Excellent |
| `console.log` in source | 0 | Uses Pino logger |
| `process.exit` in source | 0 | Throws instead |
| ESLint warnings/errors | 0 | Clean |
| `no-explicit-any` rule | `error` | Enforced |

### TypeScript Strictness

| Setting | Value |
|---------|-------|
| `strict` | true |
| `noUnusedLocals` | true |
| `noUnusedParameters` | true |
| `noFallthroughCasesInSwitch` | true |
| `noUncheckedIndexedAccess` | true |
| `isolatedModules` | true |

### Docker Images

| Image | Version | Pinned |
|-------|---------|--------|
| postgres | 16-alpine | Major version |
| redis | 7-alpine | Major version |
| elasticsearch | 8.17.0 | Fully pinned |
| mailpit | v1.21 | Minor version |

---

## Specification Compliance

| Area | Status | Notes |
|------|--------|-------|
| Spec Section 2.3 (env vars) | PASS | All 32 variables present and validated |
| Spec Section 2.4 (platform.json schema) | PASS | All 11 sections, all nested fields |
| Spec Section 2.5 (feature flags) | PASS | All 16 flags with gating |
| Spec Section 2.8 (config access pattern) | PASS | Load once, cache, merge overrides |
| Spec Section 2.9 (validation rules) | PARTIAL | Missing 2 cross-field refinements (M4, M5) |
| Spec Section 2.10 (security) | PASS | No secrets in source, prototype pollution protection |
| Spec Section 2.7 (deployment checklist) | PASS | Superset of spec requirements |
| Location-agnostic architecture | PASS | No hardcoded location data in production source |
| SESSION_SECRET minimum | PASS | 64 chars (matches spec) |

---

## Security Assessment

| Check | Status | Detail |
|-------|--------|--------|
| No hardcoded secrets | PASS | All passwords use `${VAR:?}` in Docker, no secrets in source |
| Prototype pollution protection | PASS | 3 DANGEROUS_KEYS blocked, 3 tests verify |
| Input validation | PASS | Zod schemas for all config, regex for locales/countries |
| `isPlainObject` defensive check | PASS | Verifies prototype chain, handles `Object.create(null)` |
| SESSION_SECRET strength | PASS | 64-char minimum enforced |
| ENCRYPTION_KEY strength | PASS | 44-char minimum (base64 AES-256) |
| DATABASE_URL format check | PASS | Must start with `postgresql://` |
| ES security per environment | PASS | Disabled only in dev overlay |
| Redis authentication | PASS | Required password via `--requirepass` |
| Redis healthcheck password | **FAIL** | Password visible in process args (M3) |
| .env file protection | PASS | `.env.*` gitignored with correct negations |

---

## Barrel Export Integrity

| Check | Status |
|-------|--------|
| `shared/src/index.ts` exports only production code | PASS |
| `shared/src/testing.ts` exports test fixtures | PASS |
| `shared/package.json` has `./testing` export path | PASS |
| All consumer tests import from `@community-hub/shared/testing` | PASS |
| Internal shared tests use relative `./fixtures.js` import | PASS |

---

## Plan Completion Status

| Subsection | Tasks | Complete | Status |
|------------|-------|----------|--------|
| 1.1 Development Environment | 10 | 10 | 100% |
| 1.2 Configuration Architecture | 6 | 6 | 100% |
| 1.3 Backend Infrastructure | 9 | 0 | Not Started |
| 1.4 Frontend Infrastructure | 7 | 0 | Not Started |
| 1.5 Security Foundation | 11 | 0 | Not Started |
| 1.6 Email Service | 5 | 0 | Not Started |
| 1.7 Maps Integration | 5 | 0 | Not Started |
| 1.8 i18n Foundation | 6 | 0 | Not Started |
| **Total Phase 1** | **59** | **16** | **27%** |

---

## Issue Trend Across Reviews

| Review | CRITICAL | HIGH | MEDIUM | LOW | Total |
|--------|----------|------|--------|-----|-------|
| Review #1 | 1 | 5 | 14 | 12 | 32 |
| Review #2 | 0 | 1 | 8 | 16 | 25 |
| Review #3 | 0 | 0 | 3 | 7 | 10 |
| **Review #4** | **0** | **0** | **5** | **8** | **13** |

All issues from Reviews #1, #2, and #3 have been verified as properly resolved.

Note: Review #4 issue count increased vs #3 because the review expanded scope to include Prettier/CI integration, Windows artifacts, cross-field schema validation, and test coverage gaps that were not in scope for prior reviews.

---

## Recommendations

### Before Next Commit

1. **Fix M1** -- Update `.prettierignore` and run `pnpm format` to resolve 70 formatting issues blocking CI
2. **Fix M2** -- Delete `nul` artifact and add to `.gitignore`
3. **Fix M3** -- Switch Redis healthcheck to `REDISCLI_AUTH` env var

### During Phase 1.3-1.4

4. **Fix M4** -- Add `defaultSearchRadiusKm <= maxSearchRadiusKm` cross-field validation
5. **Fix M5** -- Add `defaultLanguage` must exist in `supportedLanguages` cross-field validation
6. **Fix L2** -- Add explicit `@types/node` devDependency to shared package
7. **Fix L4** -- Add `formatZodErrors` test file
8. **Fix L6** -- Configure coverage thresholds in vitest configs
9. **Fix L7** -- Add `PORT` env variable when Express server is implemented

### Ongoing

10. **Fix L1** -- Add comment documenting shared tsconfig exclude pattern difference
11. **Fix L3** -- Replace `__dirname` with `import.meta.url` in ESM test
12. **Fix L5** -- Add memoization test for `useFeatureFlag`
13. **Fix L8** -- Document Docker image pinning strategy
