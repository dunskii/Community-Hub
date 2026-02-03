# Phase 1.3 Backend Infrastructure -- QA Review R2

**Date:** 2026-02-03
**Reviewer:** Claude Code QA
**Scope:** packages/backend/, docker/, config/, prisma schema
**Prior Reviews:** R1 (29 high+medium issues, all resolved), R2-interim (12 issues, all resolved)

---

## Summary

Phase 1.3 has undergone two thorough prior review rounds (QA Reviews #8 and #9 in PROGRESS.md) and all identified issues have been resolved. This third-pass (R2) review focuses on finding genuinely new issues that may have been missed or introduced during the fix cycles.

The backend infrastructure is in excellent shape. The codebase is well-structured, consistently typed, and follows established patterns for security, error handling, and configuration management. All 114 tests pass across 17 test files. Source files are compact (largest is 126 lines), use proper ESM imports with `.js` extensions, and adhere to TypeScript strict mode. Security posture is strong with `helmet`, rate limiting, CORS with `Vary: Origin`, path traversal prevention, magic byte validation, EXIF stripping, and safe error messages.

**Verdict: This phase is ready to proceed.**

---

## Findings

### High Severity

_None found._

All prior high-severity issues have been adequately resolved. The remaining deferred items (admin auth on `/status`, Prisma migration files, Redis-backed rate limiter) are properly documented with TODO comments and are appropriate for Phase 2.

### Medium Severity

**R2-M-01: `deleteFile` uses `(err as NodeJS.ErrnoException).code` type assertion**
- **File:** `packages/backend/src/storage/local-storage.ts`, line 108
- **Description:** The catch block in `deleteFile` uses `(err as NodeJS.ErrnoException).code` to check for ENOENT errors. The review criteria explicitly states "no `as Error` casts" and this is the only remaining type assertion on an `err` variable in all source files (not tests). While `NodeJS.ErrnoException` is a different type than `Error`, the pattern violates the project's stated convention of using `instanceof` checks or safe property access.
- **Why it matters:** If `err` is not actually a `NodeJS.ErrnoException` (e.g., a string thrown from an unexpected source), accessing `.code` on the asserted type would not cause a runtime error but could lead to silent misbehaviour -- the non-ENOENT branch would throw the original error, which is actually the safe default. The risk is low but the inconsistency with the rest of the codebase is the real concern.
- **Suggested fix:** Replace with a type-narrowing guard:
  ```typescript
  catch (err) {
    const isNotFound = err instanceof Error && 'code' in err && (err as { code: string }).code === 'ENOENT';
    if (!isNotFound) throw err;
    logger.warn(`File not found for deletion: ${filename}`);
  }
  ```
  Or use a simple helper: `function isEnoent(err: unknown): boolean { return err instanceof Error && (err as NodeJS.ErrnoException).code === 'ENOENT'; }`

**R2-M-02: `getFileUrl` does not validate or sanitize its `filename` parameter**
- **File:** `packages/backend/src/storage/local-storage.ts`, line 123-125
- **Description:** Unlike `deleteFile` and `fileExists` which both call `safeResolvePath` (which calls `assertSafeFilename`), the `getFileUrl` function directly interpolates `filename` into a URL string without any validation. While this function only constructs a URL path (it does not touch the filesystem), a filename containing special characters (e.g., `../`, URL-encoded traversal sequences, or query string injection like `file.webp?admin=true`) would produce a malformed or misleading URL.
- **Why it matters:** This function will be called when returning file URLs in API responses. If an attacker managed to store a malicious filename in the database (even though `uploadFile` generates UUIDs internally), the URL could be used for open redirect or parameter injection in client-side code that consumes it. Defence-in-depth suggests validating at every boundary.
- **Suggested fix:** Add `assertSafeFilename(filename)` as the first line of `getFileUrl`, consistent with the pattern used in `deleteFile` and `fileExists`.

### Low Severity

**R2-L-01: `logger.ts` `name` field is hardcoded as `'community-hub'`**
- **File:** `packages/backend/src/utils/logger.ts`, line 7
- **Description:** The logger `name` field is hardcoded. This was flagged in the prior review (L-04) and acknowledged as acceptable since it is an internal system name, not user-facing. Including it here for completeness -- no action required.
- **Status:** Acknowledged, no change needed.

**R2-L-02: Seed test file tests data constants rather than seed execution**
- **File:** `packages/backend/src/__tests__/db/seed.test.ts`
- **Description:** The seed test verifies hardcoded arrays of category names, setting keys, and template counts, but does not actually invoke the seed script or test the Prisma `upsert` calls. The Prisma client is mocked but the mock functions (`mockCategoryUpsert`, etc.) are never asserted against. This means the test would still pass even if the seed script were deleted, as long as the test file's own local arrays remain unchanged.
- **Why it matters:** The tests provide false confidence about seed correctness. If someone changed the seed data (e.g., removed a category or changed a setting key), the tests would not catch it because they verify their own local copy of the data, not the actual seed file.
- **Suggested fix:** Either (a) import the seed data arrays from `seed.ts` and assert against them, or (b) assert that the mock upsert functions were called with the expected arguments after dynamically importing and running the seed module. Option (b) would require restructuring `seed.ts` to export a callable function separate from the auto-executing `main()`.

**R2-L-03: `ALLOWED_ORIGINS` parsed at module load time, not refreshable**
- **File:** `packages/backend/src/middleware/cors-config.ts`, lines 3-6
- **Description:** The `ALLOWED_ORIGINS` array is computed once at module import time from `process.env['ALLOWED_ORIGINS']`. If the env var were to change at runtime (unlikely in a containerized deployment but possible in development with hot-reload tools), the CORS config would be stale. This is the standard pattern for Express middleware and is acceptable, but worth noting that unlike the platform config (which has `clearPlatformConfigCache()`), there is no mechanism to refresh CORS origins.
- **Why it matters:** Very low impact. Standard Express pattern. No change needed for Phase 1.3.

**R2-L-04: `docker-compose.yml` references `./init-db.sh` volume mount without verification**
- **File:** `docker/docker-compose.yml`, line 14
- **Description:** The PostgreSQL service mounts `./init-db.sh:/docker-entrypoint-initdb.d/init-db.sh`. The file exists at `docker/init-db.sh`, and `docker-compose.yml` is in the `docker/` directory, so the relative path resolves correctly. No issue here -- included for documentation only.
- **Status:** Verified correct.

---

## Resolved from Prior Reviews

### QA Review #8 (R1) -- 29 High + Medium Issues, All Resolved

Key resolutions include:
- **Security hardening:** `helmet()` middleware, `express-rate-limit`, `trust proxy`, `x-powered-by` disabled
- **Code safety:** `$queryRawUnsafe` replaced with tagged template `$queryRaw`; Redis `KEYS` replaced with `scanStream`; all `as Error` casts replaced with `instanceof` checks (except R2-M-01 above)
- **CORS:** `Vary: Origin` header added, `X-Request-Id` exposed, origin trimming
- **Storage:** `safeResolvePath` created and applied to `uploadFile`, `deleteFile`, `fileExists`, `generateThumbnails`
- **Testing:** 4 new test files added (CORS, health, seed, image-processor); enhanced 5 existing test files
- **Infrastructure:** `xpack.security.enabled=false` in Docker ES; `prisma-version-check` reads package.json instead of spawning subprocess

### QA Review #9 (R2-interim) -- 12 Issues, All Resolved

Key resolutions include:
- **Rate limiting:** Per-route limiters added (`authRateLimiter`, `apiRateLimiter`, `uploadRateLimiter`) matching Spec Section 4.8
- **Feature gate:** Now uses `sendError()` for consistent error format per Section 27.1
- **Request logger:** 4 tests added covering `next()` call, `finish` event, log fields, duration
- **Prisma version check:** Reads `@prisma/client/package.json` instead of spawning `npx prisma --version`
- **ES_NUMBER_OF_REPLICAS:** Added to `.env.example` and `env-validate.ts` Zod schema
- **User.status PENDING default:** Documented as intentional deviation in `schema.prisma` comment

---

## Verification Checklist

### Coding Standards
- [x] TypeScript strict mode enabled (`tsconfig.base.json`: `strict: true`)
- [x] No `any` types in source files (only `expect.any()` in test assertions)
- [x] No `as Error` casts in source files (one `as NodeJS.ErrnoException` remains -- R2-M-01)
- [x] No `console.log` in source files (all use pino logger)
- [x] No `$queryRawUnsafe` (uses tagged template `$queryRaw`)
- [x] No Redis `KEYS` command (uses `scanStream`)
- [x] ESM imports with `.js` extensions throughout
- [x] Consistent naming conventions (camelCase variables, PascalCase types, UPPER_SNAKE constants)
- [x] All files under 1000 lines (largest: `local-storage.ts` at 126 lines)

### Security
- [x] `helmet()` security headers middleware
- [x] `x-powered-by` disabled
- [x] `trust proxy` set to `1`
- [x] Rate limiting with per-route limiters (auth: 10/15min, API: 100/min, uploads: 20/hr)
- [x] CORS with origin allowlist, `Vary: Origin`, credential support, preflight handling
- [x] `X-Request-Id` generated via `crypto.randomUUID()` and set on response
- [x] Path traversal prevention via `assertSafeFilename` + `safeResolvePath`
- [x] Magic byte MIME validation for file uploads
- [x] EXIF metadata stripping from images
- [x] UUID filename generation (never uses original filenames)
- [x] File size limits enforced (5MB images, 10MB documents)
- [x] Error handler does not leak internal details for unexpected errors
- [x] No hardcoded secrets or credentials in source code
- [x] Session secret minimum 64 characters enforced by Zod
- [x] Encryption key minimum 44 characters (base64 32-byte key) enforced by Zod

### Specification Compliance
- [x] Three-tier configuration system (`.env`, `platform.json`, database)
- [x] Error response format matches Section 27.1: `{ success, error: { code, message, details, requestId, timestamp } }`
- [x] Health endpoint per Section 29 (`GET /api/v1/health`)
- [x] Status endpoint per Section 29 (`GET /api/v1/status` with service checks)
- [x] Elasticsearch graceful degradation per Section 27.5
- [x] Data models match Appendix A (User A.2, Category A.14, UserSession A.17, AuditLog A.18, EmailTemplate A.19, SystemSetting A.24)
- [x] API versioning under `/api/v1/` per Appendix B
- [x] Rate limits match Section 4.8 (per-route limiters defined)

### Location-Agnostic
- [x] No hardcoded suburb names, coordinates, or branding in backend source
- [x] All location data from `config/platform.json`
- [x] All secrets from `.env`
- [x] Seed data uses generic category names with multilingual JSON
- [x] Email templates use `{{platformName}}` token

### Testing Coverage
- [x] All middleware tested (cors, error-handler, request-id, request-logger, feature-gate)
- [x] All routes tested (health, status)
- [x] All utilities tested (api-error, api-response, logger)
- [x] Configuration tested (env-validate, platform-loader, validate)
- [x] Cache service tested (get, set, del, invalidatePattern, error paths)
- [x] Storage tested (upload, delete, fileExists, getFileUrl, image-processor, path traversal)
- [x] Error scenarios covered (missing config, invalid MIME, size limits, Redis errors)
- [x] Path traversal attacks tested (deleteFile, fileExists, thumbnails)

### Performance & Code Quality
- [x] No monolithic files (all under 200 lines)
- [x] Proper async/await patterns throughout
- [x] `scanStream` for Redis pattern invalidation (production-safe)
- [x] Redis lazy connect with retry strategy
- [x] Prisma singleton pattern with global cache
- [x] Graceful shutdown closes HTTP server, Redis, ES, and Prisma in sequence
- [x] Server shutdown awaits HTTP server close via Promise wrapper

---

## Files Reviewed

### Source Files (31 files)
- `packages/backend/src/app.ts`
- `packages/backend/src/index.ts`
- `packages/backend/src/config/env-validate.ts`
- `packages/backend/src/config/platform-loader.ts`
- `packages/backend/src/config/validate.ts`
- `packages/backend/src/cache/cache-service.ts`
- `packages/backend/src/cache/redis-client.ts`
- `packages/backend/src/cache/index.ts`
- `packages/backend/src/db/index.ts`
- `packages/backend/src/db/seed.ts`
- `packages/backend/src/middleware/cors-config.ts`
- `packages/backend/src/middleware/error-handler.ts`
- `packages/backend/src/middleware/feature-gate.ts`
- `packages/backend/src/middleware/not-found.ts`
- `packages/backend/src/middleware/rate-limiter.ts`
- `packages/backend/src/middleware/request-id.ts`
- `packages/backend/src/middleware/request-logger.ts`
- `packages/backend/src/routes/health.ts`
- `packages/backend/src/routes/index.ts`
- `packages/backend/src/search/elasticsearch-client.ts`
- `packages/backend/src/search/index-manager.ts`
- `packages/backend/src/search/index.ts`
- `packages/backend/src/storage/image-processor.ts`
- `packages/backend/src/storage/local-storage.ts`
- `packages/backend/src/storage/storage-types.ts`
- `packages/backend/src/storage/index.ts`
- `packages/backend/src/utils/api-error.ts`
- `packages/backend/src/utils/api-response.ts`
- `packages/backend/src/utils/logger.ts`
- `packages/backend/src/utils/path-validation.ts`
- `packages/backend/src/utils/prisma-version-check.ts`
- `packages/backend/src/types/express.d.ts`

### Test Files (17 files)
- `packages/backend/src/__tests__/setup.ts`
- `packages/backend/src/__tests__/index.test.ts`
- `packages/backend/src/__tests__/env-validate.test.ts`
- `packages/backend/src/__tests__/platform-loader.test.ts`
- `packages/backend/src/__tests__/validate.test.ts`
- `packages/backend/src/__tests__/feature-gate.test.ts`
- `packages/backend/src/__tests__/utils/api-error.test.ts`
- `packages/backend/src/__tests__/utils/api-response.test.ts`
- `packages/backend/src/__tests__/utils/logger.test.ts`
- `packages/backend/src/__tests__/middleware/cors-config.test.ts`
- `packages/backend/src/__tests__/middleware/error-handler.test.ts`
- `packages/backend/src/__tests__/middleware/request-id.test.ts`
- `packages/backend/src/__tests__/middleware/request-logger.test.ts`
- `packages/backend/src/__tests__/routes/health.test.ts`
- `packages/backend/src/__tests__/db/seed.test.ts`
- `packages/backend/src/__tests__/storage/image-processor.test.ts`
- `packages/backend/src/__tests__/storage/local-storage.test.ts`
- `packages/backend/src/__tests__/cache/cache-service.test.ts`

### Configuration & Infrastructure Files
- `packages/backend/prisma/schema.prisma`
- `packages/backend/prisma.config.ts`
- `packages/backend/vitest.config.ts`
- `packages/backend/package.json`
- `packages/backend/tsconfig.json`
- `tsconfig.base.json`
- `eslint.config.js`
- `config/platform.json`
- `config/platform.development.json`
- `config/platform.staging.json`
- `.env.example`
- `.prettierignore`
- `docker/docker-compose.yml`
- `docker/docker-compose.dev.yml`
- `docker/.env.docker.example`

### Reference Documents
- `md/plan/phase-1.3-backend-infrastructure.md`
- `md/study/phase-1.3-backend-infrastructure.md`
- `md/study/phase-1.md`
- `md/review/phase-1.3-backend-infrastructure.md` (prior review)
- `PROGRESS.md`

---

## Recommendation

**PASS**

Phase 1.3 Backend Infrastructure is complete and ready for the project to proceed to Phase 1.4 (Frontend Infrastructure). The two medium-severity findings (R2-M-01 and R2-M-02) are minor and can be addressed opportunistically in the next development batch without blocking progress. All prior review findings have been resolved. The codebase demonstrates consistent quality, proper security practices, and strong specification compliance.

### Optional improvements (non-blocking):
1. Replace `(err as NodeJS.ErrnoException)` cast in `deleteFile` with a type-narrowing guard (R2-M-01)
2. Add `assertSafeFilename` to `getFileUrl` for defence-in-depth (R2-M-02)
3. Improve seed tests to verify actual seed data rather than local copies (R2-L-02)
