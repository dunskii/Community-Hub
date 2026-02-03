# QA Review #6 - Phase 1 (Subsections 1.1 + 1.2)

**Date:** 2 February 2026
**Reviewer:** Automated QA
**Scope:** Post-fix re-review after all Review #5 remediation
**Previous Reviews:**
- Review #1: 32 issues (1C, 5H, 14M, 12L) -- all remediated
- Review #2: 25 issues (0C, 1H, 8M, 16L) -- all remediated
- Review #3: 10 issues (0C, 0H, 3M, 7L) -- all remediated
- Review #4: 13 issues (0C, 0H, 5M, 8L) -- all remediated
- Review #5: 11 issues (0C, 1H, 3M, 7L) -- all remediated

---

## Executive Summary

All 11 issues from Review #5 have been verified as properly resolved. The codebase is in strong shape after six rounds of review and five rounds of fixes. This review found **0 Critical, 0 High, 2 Medium, and 6 Low** new issues.

The remaining issues are moderate infrastructure hygiene items and low-severity test coverage gaps. No bugs, security vulnerabilities, or specification violations were found.

**This review found: 0 CRITICAL, 0 HIGH, 2 MEDIUM, 6 LOW issues.**

| Severity | Count | Breakdown |
|----------|-------|-----------|
| CRITICAL | 0 | -- |
| HIGH | 0 | -- |
| MEDIUM | 2 | Missing backups/ in .gitignore, backend src/index.ts entry point missing |
| LOW | 6 | No post-merge validation failure test, missing formatZodErrors export test, no clearPlatformConfigCache test, ES healthcheck auth comment, .env.docker copy instructions, .npmrc contradictory peer settings |

---

## Review #5 Remediation Status (11/11 Verified)

### HIGH (1/1 Fixed)

| ID | Issue | Status |
|----|-------|--------|
| H1 | Merged config not re-validated after deepMerge | **FIXED** -- `platformConfigSchema.safeParse(mergedRaw)` added at line 64 of platform-loader.ts. Error message includes env name and formatted Zod errors. |

### MEDIUM (3/3 Fixed)

| ID | Issue | Status |
|----|-------|--------|
| M1 | Backend/Vite port collision | **FIXED** -- Backend PORT defaults to `3002`, Vite port set to `4002`, `.env.example` updated. |
| M2 | Redis healthcheck variable expansion | **FIXED** -- `environment:` block added with `REDIS_PASSWORD`, healthcheck uses `$$REDIS_PASSWORD` for container shell expansion. |
| M3 | docker/.env.docker missing ELASTIC_PASSWORD | **FIXED** -- `ELASTIC_PASSWORD=CHANGEME` added. |

### LOW (7/7 Fixed)

| ID | Issue | Status |
|----|-------|--------|
| L1 | No PORT test coverage | **FIXED** -- 5 test cases added (default 3002, custom valid, 0, 65536, non-numeric). |
| L2 | validate.test.ts mockEnv missing PORT | **FIXED** -- `PORT: 3002` added to mockEnv. |
| L3 | Coverage exclude patterns | **FIXED** -- All 3 vitest configs have `coverage.exclude` patterns. |
| L4 | Nested prototype pollution test | **FIXED** -- Test for nested `__proto__` key blocking added. |
| L5 | CI doesn't enforce coverage thresholds | **FIXED** -- CI changed to `pnpm test:coverage`. |
| L6 | Pino logger pollutes test output | **FIXED** -- pino level set to `'silent'` when `NODE_ENV=test`. |
| L7 | formatZodErrors empty path display | **FIXED** -- Uses `(root)` label for empty paths. Test updated. |

---

## New Issues Found

### MEDIUM (2 issues)

#### M1: Missing `backups/` directory in `.gitignore`

- **File:** `.gitignore`
- **Severity:** MEDIUM
- **Detail:** The `.env.example` defines `STORAGE_BACKUP_PATH=./backups` as the default backup directory. The `.gitignore` properly ignores `uploads/` and `storage/` but does not ignore `backups/`. If a developer runs a local backup, the backup files (which may contain sensitive database dumps or user data) could be inadvertently staged and committed.
- **Fix:** Add `backups/` to the `.gitignore` file in the uploads/media section:
  ```
  uploads/
  storage/
  backups/
  ```

#### M2: Backend `src/index.ts` entry point missing

- **File:** `packages/backend/package.json`, `packages/backend/src/`
- **Severity:** MEDIUM
- **Detail:** The backend `package.json` defines scripts that reference an entry point that does not exist: `"dev": "tsx watch src/index.ts"` and `"start": "node dist/index.js"`. Running `pnpm dev` or `pnpm start` in the backend package would fail immediately. While this is Phase 1 scaffolding, it produces confusing errors for developers.
- **Fix:** Create a minimal `packages/backend/src/index.ts` placeholder:
  ```typescript
  // Backend entry point - server setup will be implemented in Phase 1.3
  export {};
  ```

---

### LOW (6 issues)

#### L1: No test for merged config post-validation failure

- **File:** `packages/backend/src/__tests__/platform-loader.test.ts`
- **Severity:** LOW
- **Detail:** The H1 fix from R5 added post-merge re-validation, but there is no test where an override passes partial schema validation but the merged result fails cross-field `.refine()` constraints. For example, an override setting `defaultSearchRadiusKm: 100` when base `maxSearchRadiusKm` is `20` should fail after merge.
- **Fix:** Add a test case:
  ```typescript
  it('should throw when merged config violates cross-field constraints', () => {
    writeJson(tempDir, 'platform.json', createValidPlatformConfig());
    writeJson(tempDir, 'platform.development.json', {
      location: { defaultSearchRadiusKm: 100 },
    });
    expect(() => loadPlatformConfig(tempDir)).toThrow('Invalid merged platform config');
  });
  ```

#### L2: Shared `index.test.ts` does not verify `formatZodErrors` export

- **File:** `packages/shared/src/__tests__/index.test.ts`
- **Severity:** LOW
- **Detail:** The shared package's `index.ts` exports `formatZodErrors`, but the barrel export smoke test does not verify this export. All other exports (`platformConfigSchema`, `deepMerge`, `isFeatureEnabled`, `FEATURE_FLAGS`) are tested.
- **Fix:** Add `formatZodErrors` to the import and add a test assertion.

#### L3: No test for `clearPlatformConfigCache()` invalidation on backend

- **File:** `packages/backend/src/__tests__/platform-loader.test.ts`
- **Severity:** LOW
- **Detail:** `clearPlatformConfigCache()` is used in `beforeEach` for test isolation, but there is no explicit test verifying that clearing the cache forces a reload from disk. The frontend suite tests this pattern, but the backend does not.
- **Fix:** Add a test that loads config, modifies the file on disk, clears cache, reloads, and asserts the new values are returned.

#### L4: Elasticsearch base healthcheck assumes no authentication

- **File:** `docker/docker-compose.yml:48`
- **Severity:** LOW
- **Detail:** The base Elasticsearch healthcheck uses an unauthenticated curl. ES 8.x enables security by default. While dev overrides disable security and staging/prod overrides provide authenticated healthchecks, the base compose healthcheck would fail if used without an environment override.
- **Fix:** Add a comment noting the dependency:
  ```yaml
  # NOTE: This unauthenticated healthcheck requires xpack.security.enabled=false.
  # Staging/prod overrides replace this with an authenticated healthcheck.
  ```

#### L5: Confusing copy instructions in `docker/.env.docker.example`

- **File:** `docker/.env.docker`, `docker/.env.docker.example`
- **Severity:** LOW
- **Detail:** Docker Compose automatically loads `.env` from the compose file directory, not `.env.docker`. The example file's copy instructions could be clearer about the expected target filename.
- **Fix:** Update the header comment to clarify that the file should be copied to `docker/.env`.

#### L6: `.npmrc` has partially contradictory peer dependency settings

- **File:** `.npmrc`
- **Severity:** LOW
- **Detail:** `strict-peer-dependencies=true` and `auto-install-peers=true` work at cross purposes. `auto-install-peers` resolves most conflicts before `strict-peer-dependencies` can trigger, but edge cases produce confusing errors.
- **Fix:** Remove `strict-peer-dependencies=true` since `auto-install-peers=true` is the more practical setting for monorepos.

---

## Code Quality Metrics

| Metric | Value | Assessment |
|--------|-------|------------|
| Total source files | 17 | Well within limits |
| Total test files | 14 + 1 fixture | Comprehensive |
| Tests passing | 86/86 | All green (up from 80) |
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
| Spec Section 2.8 (config access pattern) | PASS | Merge + post-merge re-validation working correctly |
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
| Prototype pollution protection | PASS | 3 DANGEROUS_KEYS blocked at every recursion level, tested nested |
| Input validation | PASS | Zod schemas for all config, regex for locales/countries |
| Cross-field validation | PASS | Search radius and language refinements present + enforced after merge |
| `isPlainObject` defensive check | PASS | Verifies prototype chain, handles `Object.create(null)` |
| SESSION_SECRET strength | PASS | 64-char minimum enforced |
| ENCRYPTION_KEY strength | PASS | 44-char minimum (base64 AES-256) |
| DATABASE_URL format check | PASS | Must start with `postgresql://` |
| Redis healthcheck password | PASS | REDISCLI_AUTH via container environment variable with `$$` expansion |
| .env file protection | PASS | `.env.*` gitignored with correct negations |
| Backup directory protection | **PARTIAL** | `backups/` not in .gitignore (M1) |

---

## Issue Trend Across Reviews

| Review | CRITICAL | HIGH | MEDIUM | LOW | Total |
|--------|----------|------|--------|-----|-------|
| Review #1 | 1 | 5 | 14 | 12 | 32 |
| Review #2 | 0 | 1 | 8 | 16 | 25 |
| Review #3 | 0 | 0 | 3 | 7 | 10 |
| Review #4 | 0 | 0 | 5 | 8 | 13 |
| Review #5 | 0 | 1 | 3 | 7 | 11 |
| **Review #6** | **0** | **0** | **2** | **6** | **8** |

All issues from Reviews #1 through #5 have been verified as properly resolved.

---

## Recommendations

### Before Next Commit

1. **Fix M1** -- Add `backups/` to `.gitignore`
2. **Fix M2** -- Create minimal `packages/backend/src/index.ts` placeholder

### During Phase 1.3-1.4

3. **Fix L1** -- Add post-merge validation failure test
4. **Fix L2** -- Add `formatZodErrors` to shared index export test
5. **Fix L3** -- Add `clearPlatformConfigCache` invalidation test
6. **Fix L4** -- Add Elasticsearch healthcheck auth comment
7. **Fix L5** -- Clarify docker/.env.docker.example copy instructions
8. **Fix L6** -- Remove `strict-peer-dependencies=true` from `.npmrc`
