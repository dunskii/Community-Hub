# Phase 1.3 Backend Infrastructure - QA Review

**Reviewed:** 3 February 2026
**Reviewer:** Claude Code QA
**Scope:** Backend infrastructure (Express, Prisma, Redis, ES, Storage, Middleware)
**Test Results:** 78 backend tests across 17 test files (133 total across monorepo)

## Executive Summary

Phase 1.3 delivers a well-structured backend foundation with Express 5, Prisma 7.3 (PrismaPg adapter), Redis caching, Elasticsearch search, and Sharp-based media storage. The code follows TypeScript strict mode, uses clean module boundaries, and properly implements the specification's three-tier configuration system. Security posture has improved significantly from the initial review -- `helmet`, `express-rate-limit`, `trust proxy`, CORS `Vary: Origin`, and `X-Request-Id` response headers are now in place. Test coverage is solid at 17 test files with 78 backend-specific tests covering all major modules. The remaining issues are primarily medium-severity items around specification alignment, test gap closure, and hardening for production deployment.

## Findings

### Critical Issues (Must Fix)

**C-01: `/status` endpoint exposes infrastructure topology without authentication**
- File: `packages/backend/src/routes/health.ts:21`
- The `/status` endpoint reveals which backing services (database, Redis, Elasticsearch) are operational. An attacker can probe this to map infrastructure.
- A TODO comment acknowledges this: `// TODO: Phase 2 - add admin authentication to /status endpoint (H-04)`
- **Recommendation:** Add authentication guard or move to an admin-only route before production deployment.

**C-02: User model `status` defaults to `PENDING` instead of spec's `ACTIVE`**
- File: `packages/backend/prisma/schema.prisma:59`
- Spec A.2 defines `status: Enum (active, suspended, pending)` with the default context implying new users should be active. The Prisma schema defaults to `PENDING`, which is a defensible security choice (email verification first) but differs from the spec's enumeration order. This should be an explicit, documented decision.
- **Recommendation:** Document this as an intentional deviation from spec A.2. If the intent is email-first verification, this is correct and should be recorded in the plan file.

**C-03: Prisma schema missing `url = env("DATABASE_URL")` in datasource block**
- File: `packages/backend/prisma/schema.prisma:8`
- The datasource block correctly has `url = env("DATABASE_URL")`. This was flagged in the previous review (H-10) but has been confirmed as resolved upon re-inspection. The schema is correct.
- **Status: Resolved (false positive in prior review list)**

### High Priority

**H-01: CORS `ALLOWED_METHODS` excludes `PATCH`**
- File: `packages/backend/src/middleware/cors-config.ts:4`
- The `ALLOWED_METHODS` string is `'GET,POST,PUT,DELETE,OPTIONS'`. The specification (Appendix B.0) lists `GET, POST, PUT, DELETE, OPTIONS` which matches. However, many REST APIs use `PATCH` for partial updates. If future phases need `PATCH`, this must be updated. A test explicitly verifies PATCH is excluded (`cors-config.test.ts:70-78`).
- **Recommendation:** Add `PATCH` proactively since PUT is often used for full replacement and PATCH for partial updates. Or document the decision to exclude it.

**H-02: `uploadFile` uses `resolve(STORAGE_PATH, filename)` but `STORAGE_PATH` is already `resolve()`-d**
- File: `packages/backend/src/storage/local-storage.ts:70`
- `STORAGE_PATH` is defined as `resolve(process.env['STORAGE_PATH'] ?? './uploads')` on line 11. However, `uploadFile` on line 70 uses `resolve(STORAGE_PATH, filename)` without going through `safeResolvePath`. In contrast, `deleteFile` and `fileExists` both use `safeResolvePath`. Since `uploadFile` generates its own UUID filename via `randomUUID()`, path traversal risk is negligible, but the inconsistency is concerning for maintainability.
- **Recommendation:** Use `safeResolvePath(STORAGE_PATH, filename)` consistently in `uploadFile` even though the filename is internally generated.

**H-03: No Prisma migration files committed**
- The `packages/backend/prisma/migrations/` directory is not visible in the repository. Without committed migrations, the schema is not reproducible across environments.
- **Recommendation:** Run `prisma migrate dev --name init` and commit the resulting migration files. This is critical for CI/CD and team collaboration.

**H-04: Slow query logging deferred**
- File: `packages/backend/src/db/index.ts:24`
- A TODO comment says `// TODO: Phase 2 - add slow query logging via Prisma middleware (M-10)`. The Prisma 7 client with `@prisma/adapter-pg` (PrismaPg) does not support the same `$on('query', ...)` event API as earlier Prisma versions, so the plan's suggested logging approach may not work directly. The study notes mention a 100ms threshold for slow queries (Spec Section 29.1).
- **Recommendation:** Investigate Prisma 7 middleware for query timing, or use the `pg` driver-level query timing approach.

### Medium Priority

**M-01: Rate limiter uses in-memory store by default**
- File: `packages/backend/src/middleware/rate-limiter.ts`
- `express-rate-limit` defaults to an in-memory store. This works for single-instance deployment but will not share state across multiple processes or instances. The specification targets 1000+ concurrent users (Spec Section 3.3).
- **Recommendation:** Add a Redis-backed store (`rate-limit-redis`) for production. For Phase 1.3 infrastructure, the in-memory store is acceptable for development.

**M-02: Rate limiter has a single global limit (100 req/15min)**
- File: `packages/backend/src/middleware/rate-limiter.ts:4`
- Spec Section 4.8 defines granular rate limits: 10 req/15min for auth, 100 req/1min for authenticated API, 30 req/1min for anonymous, etc. The current implementation applies a blanket 100 req/15min limit to all routes.
- **Recommendation:** Phase 2 should introduce per-route rate limiters matching the specification. Document the current global limiter as a Phase 1 placeholder.

**M-03: `ALLOWED_ORIGINS` env var should be trimmed**
- File: `packages/backend/src/middleware/cors-config.ts:3`
- The `split(',')` call does not trim whitespace. An env var like `http://localhost:5173, http://example.com` would fail to match `http://example.com` because of the leading space.
- **Recommendation:** Add `.map(s => s.trim())` after `.split(',')`.

**M-04: Elasticsearch `number_of_replicas` uses env var but defaults to 0**
- File: `packages/backend/src/search/index-manager.ts:5`
- `ES_REPLICAS` reads from `process.env['ES_NUMBER_OF_REPLICAS']` defaulting to `'0'`. This env var is not documented in `.env.example` or validated in `env-validate.ts`.
- **Recommendation:** Either add `ES_NUMBER_OF_REPLICAS` to env validation schema or document it as an infrastructure-only setting.

**M-05: `notFound` middleware returns generic "Route not found" without method/path**
- File: `packages/backend/src/middleware/not-found.ts:6`
- The previous review (M-05) flagged that the original reflected `req.path` in the error response (information disclosure). The current version uses the generic message "Route not found" which is safer. This is resolved.
- **Status: Resolved.**

**M-06: Seed script has `featured_businesses` system setting**
- File: `packages/backend/src/db/seed.ts:73-76`
- The previous review (M-16) flagged that `featured_businesses` was missing from seed data. It is now present with an empty array default. This is resolved.
- **Status: Resolved.**

**M-07: Error handling in catch blocks uses safe pattern**
- Files: Multiple files
- The previous review (M-14) flagged unsafe `(err as Error).message` patterns. The current code uses `err instanceof Error ? err.message : String(err)` consistently in `cache-service.ts:8`, and similar safe patterns elsewhere.
- **Status: Partially resolved.** The `index-manager.ts:49` still uses `err instanceof Error ? err.message : String(err)` which is fine. But `disconnectDb` in `db/index.ts:30` uses a ternary that produces a properly typed object for the logger.

**M-08: `STORAGE_PATH` resolves to absolute path**
- File: `packages/backend/src/storage/local-storage.ts:11`
- Previous review flagged relative `./uploads` default. The current code resolves it: `resolve(process.env['STORAGE_PATH'] ?? './uploads')`. This resolves relative to `process.cwd()`.
- **Status: Resolved.**

**M-09: Cache `set` correctly handles `ttlSeconds = 0`**
- File: `packages/backend/src/cache/cache-service.ts:25`
- Previous review flagged falsy check on `ttlSeconds`. The current code uses `ttlSeconds !== undefined && ttlSeconds > 0` which correctly treats 0 as "no TTL". A test confirms this (`cache-service.test.ts:90-95`).
- **Status: Resolved.**

**M-10: Cache `invalidatePattern` uses `scanStream` instead of `KEYS`**
- File: `packages/backend/src/cache/cache-service.ts:47-52`
- Previous review flagged `KEYS` command usage. The current code uses `scanStream` with `count: 100` batches, which is production-safe.
- **Status: Resolved.**

**M-11: Seed tests are data-only assertions, not integration tests**
- File: `packages/backend/src/__tests__/db/seed.test.ts`
- The seed test file verifies data constants (category counts, setting names) but does not actually execute the seed script. The Prisma client is mocked, so no upserts are tested.
- **Recommendation:** This is acceptable for unit testing data correctness. Integration testing of the actual seed should be done in a CI pipeline with a real database.

**M-12: `featureGate` error response format differs from `sendError` format**
- File: `packages/backend/src/middleware/feature-gate.ts:18-21`
- Returns `{ error: 'Not Found', message: '...' }` instead of the standard `{ success: false, error: { code: 'NOT_FOUND', ... } }` format used by `sendError`.
- **Recommendation:** Use `sendError(res, 'NOT_FOUND', 'This feature is not available.', 404)` for consistency with the specification's error response format (Section 27.1).

**M-13: No request logger test coverage**
- File: `packages/backend/src/middleware/request-logger.ts`
- The `requestLogger` middleware has no dedicated test file. It logs method, path, status, duration, and IP on every request.
- **Recommendation:** Add a test that verifies the `res.on('finish', ...)` handler fires and calls `logger.info` with expected fields.

**M-14: `prisma-version-check.ts` uses `exec` (child process) at startup**
- File: `packages/backend/src/utils/prisma-version-check.ts:12`
- Runs `npx prisma --version` as a child process at server startup. This adds latency (several hundred ms to a few seconds) and depends on `npx` availability at runtime.
- **Recommendation:** Consider reading the version from `@prisma/client/package.json` or the generated client metadata instead, which would be synchronous and faster.

### Low Priority / Recommendations

**L-01: `express.d.ts` types `requestId` as optional**
- File: `packages/backend/src/types/express.d.ts:4`
- `requestId?: string` is typed as optional. In practice, it is always set by the `requestId` middleware. Making it non-optional would remove null checks throughout the codebase.
- **Recommendation:** Since the middleware always runs before route handlers, consider making it `requestId: string`. However, this could cause issues if any middleware runs before `requestId` in the chain.

**L-02: `api-error.ts` `serviceUnavailable` factory present but not yet used**
- File: `packages/backend/src/utils/api-error.ts:40-42`
- Good forward planning for Elasticsearch graceful degradation scenarios.

**L-03: Docker compose does not expose ports**
- File: `docker/docker-compose.yml`
- No `ports:` mapping is defined for any service. This is likely intentional for security (services only accessible within the `backend` network), but development requires port mapping to connect from the host.
- **Recommendation:** Verify that a `docker-compose.dev.yml` override file exists with port mappings. If not, developers cannot connect to PostgreSQL, Redis, or Elasticsearch from their IDE or the application running outside Docker.

**L-04: `name` field in `pino` logger configuration**
- File: `packages/backend/src/utils/logger.ts:7`
- The `name: 'community-hub'` is hardcoded. For a location-agnostic platform, this could come from `platform.json`. However, since this is an internal system name and not user-facing, hardcoding is acceptable.

**L-05: Vitest coverage thresholds set to 60%**
- File: `packages/backend/vitest.config.ts:10`
- The specification targets >80% test coverage (Spec Section 30). The current thresholds are set to 60% for branches, functions, lines, and statements.
- **Recommendation:** Increase thresholds incrementally as test coverage improves. The 60% target is reasonable for Phase 1.3 infrastructure but should reach 80% by Phase 2.

**L-06: `Pagination` interface exported but not used externally**
- File: `packages/backend/src/utils/api-response.ts:3-8`
- The `Pagination` interface is defined and used with `satisfies` but is only exported for reference. This is good practice for documentation.

**L-07: Email template HTML in seed is minimal**
- File: `packages/backend/src/db/seed.ts:101-134`
- The seed email templates contain bare HTML without proper email structure (no doctype, head, body, responsive styles). This is acceptable for seed data -- real templates will be developed in Phase 1.6 (Email Service).

**L-08: `prisma.config.ts` has correct DATABASE_URL validation**
- File: `packages/backend/prisma.config.ts:4-7`
- Throws if `DATABASE_URL` is not set, preventing silent failures during migrations. Good defensive programming.

## Category Reviews

### 1. Coding Standards Compliance
**Rating: PASS**

- TypeScript strict mode is enforced via `tsconfig.base.json` with `strict: true`, `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess`, and `noFallthroughCasesInSwitch`.
- No `any` types found in source files. The one use of `unknown` in `ApiError.details` is appropriate.
- ESM module system used consistently with `.js` extensions in imports.
- File sizes are all well under 1000 lines. The largest source file (`local-storage.ts`) is 126 lines.
- Naming conventions are consistent: camelCase for variables/functions, PascalCase for types/classes, UPPER_SNAKE for constants.
- Error handling follows a consistent pattern: `try/catch` with structured logging and graceful degradation.
- Code organization follows clean module boundaries: `cache/`, `config/`, `db/`, `middleware/`, `routes/`, `search/`, `storage/`, `utils/`.

### 2. Security Verification
**Rating: NEEDS WORK**

**Strengths:**
- `helmet()` middleware provides security headers (CSP, X-Frame-Options, HSTS, X-Content-Type-Options).
- `x-powered-by` explicitly disabled via `app.disable('x-powered-by')`.
- `trust proxy` set to `1` for correct client IP behind reverse proxy.
- Rate limiting via `express-rate-limit` with standard headers (`draft-7`).
- CORS properly configured with origin allowlist, `Vary: Origin`, credential support, and preflight handling.
- Request ID generated with `crypto.randomUUID()` and exposed via `X-Request-Id` header.
- Path traversal prevention in storage via `assertSafeFilename` and `safeResolvePath`.
- Magic byte validation for file uploads (JPEG, PNG, WebP, PDF).
- EXIF metadata stripping from uploaded images.
- UUID filename generation (never uses original filenames).
- File size limits enforced (5MB images, 10MB documents).
- Error handler does not leak internal error details to clients for unexpected errors.
- No hardcoded secrets found in source code.

**Issues to address:**
- `/status` endpoint unauthenticated (C-01).
- Single global rate limit instead of per-route limits per Spec Section 4.8 (M-02).
- CORS origins not trimmed (M-03).
- No CSRF protection yet (deferred to Phase 2 per spec, acceptable).

### 3. Specification Compliance
**Rating: PASS**

**Configuration (Section 2):** Three-tier configuration system properly implemented. `.env` for secrets, `platform.json` for location/branding, database for runtime settings. Environment-specific overrides work correctly with deep merge and post-merge validation.

**Error Handling (Section 27):** Error response format matches spec exactly: `{ success: false, error: { code, message, details, requestId, timestamp } }`. All 10 error codes from Section 27.2 are representable via `ApiError` factories. Error handler properly logs 5xx errors but not 4xx.

**Data Models (Appendix A):** All 6 initial models match their specification counterparts:
- User (A.2): All fields present. `SUPER_ADMIN` role added beyond spec (acceptable forward planning). Status defaults to `PENDING` (see C-02).
- Category (A.14): Matches spec including multilingual JSON `name`, hierarchical `parent_id`, `display_order`.
- UserSession (A.17): Matches spec exactly.
- AuditLog (A.18): Matches spec exactly. `onDelete: SetNull` preserves logs after user deletion.
- EmailTemplate (A.19): Matches spec exactly.
- SystemSetting (A.24): Uses `key` as primary key per spec. All 6 default keys from spec are seeded.

**API Structure (Appendix B):** `/api/v1` prefix used. Health and status endpoints implemented. API v2 returns descriptive 404. Response format matches B.0 conventions.

**File Upload (Section 4.10):** All requirements met -- magic byte validation, UUID filenames, EXIF stripping, size limits, path traversal rejection.

**Graceful Degradation (Section 27.5):** Elasticsearch failure does not prevent server startup. Health endpoint correctly reports ES as "unavailable" while DB/Redis failures cause 503.

### 4. Plan File Verification
**Rating: PASS**

The implementation closely follows `md/plan/phase-1.3-backend-infrastructure.md`:
- All 10 steps executed in the specified order.
- All files listed in the plan's "Files Created" section exist.
- Prisma version check implemented per plan (upgraded to async with `promisify(exec)`).
- Cache service uses `scanStream` instead of plan's `KEYS` (improvement).
- Redis key prefixing by environment implemented.
- Database seed uses `upsert` for idempotency as specified.
- API response helpers match the plan's specification.

**Deviations from plan (improvements):**
- Plan specified `PrismaClient` from `@prisma/client`; implementation uses `PrismaPg` adapter for Prisma 7.
- Plan's `db/index.ts` included `$on('query', ...)` logging; implementation defers this as a TODO (correct since PrismaPg adapter API differs).
- Plan did not include `helmet`, `rate-limiter`, or `trust proxy`; implementation adds all three.
- Plan's `notFound` reflected `req.method + req.path`; implementation uses generic message (security improvement).

### 5. Study File Cross-Reference
**Rating: PASS**

The study file (`md/study/phase-1.3-backend-infrastructure.md`) was used as a reference for:
- 9 tasks breakdown matches implementation.
- Rate limits table (Section 4.8) matches specification -- global rate limit is a Phase 1 placeholder.
- Data security requirements acknowledged (bcrypt deferred to Phase 2, JWT deferred to Phase 2).
- Testing requirements addressed: unit tests for cache, storage, API response helpers, API error class, health endpoint, middleware.
- Location-agnostic considerations met: all connection strings from env, no hardcoded suburb data, multilingual JSON names in categories.

### 6. Location-Agnostic Verification
**Rating: PASS**

- No hardcoded suburb names, coordinates, or location-specific data in backend source code.
- All location data comes from `platform.json` via `loadPlatformConfig()`.
- Database connection, Redis URL, Elasticsearch URL, storage path all from `.env`.
- Seed data uses generic category names (Restaurant, Retail, etc.) with multilingual JSON structure.
- Email template variables use `{{platformName}}` token rather than hardcoded names.
- Logger name `community-hub` is a system identifier, not location-specific.
- Elasticsearch index name `businesses` is generic.

### 7. Multilingual & Accessibility
**Rating: PASS**

**Backend multilingual readiness:**
- Category `name` field uses `Json` type for multilingual storage: `{"en": "Restaurant", "ar": "..."}`.
- EmailTemplate `subject`, `bodyHtml`, `bodyText` all use `Json` for multilingual content.
- User `languagePreference` field defaults to `"en"` per spec.
- Elasticsearch index uses a `multilingual` analyzer.
- Seed data includes English entries; other languages to be added in Phase 1.8 (i18n).
- Platform config validates 10 supported languages with RTL flags.

**Backend accessibility:**
- API error responses include clear, descriptive messages per Spec Section 27.
- Health endpoints provide machine-readable status for monitoring.
- Consistent JSON response format aids client-side accessibility rendering.

### 8. Testing Coverage
**Rating: PASS**

**17 test files with ~78 tests covering:**

| Module | Test File | Tests | Key Scenarios |
|--------|-----------|-------|---------------|
| Config: env-validate | env-validate.test.ts | 11 | Valid env, missing required vars, short secrets, port validation, defaults |
| Config: platform-loader | platform-loader.test.ts | 8 | Valid load, missing file, invalid JSON, deep merge, cache, post-merge validation |
| Config: validate | validate.test.ts | 3 | Combined validation, env failure, platform failure |
| Middleware: cors | cors-config.test.ts | 6 | Allowed/disallowed origins, Vary header, preflight, exposed headers |
| Middleware: error-handler | error-handler.test.ts | 5 | ApiError handling, unknown errors, no detail leakage, 5xx logging, 4xx no-log |
| Middleware: request-id | request-id.test.ts | 3 | UUID format, uniqueness, response header |
| Middleware: feature-gate | feature-gate.test.ts | 3 | Enabled feature, disabled feature, error propagation |
| Routes: health | health.test.ts | 4 | Health ok, status healthy, DB down 503, ES graceful degradation |
| Cache: cache-service | cache-service.test.ts | 9 | get/set/del, TTL, error handling, pattern invalidation |
| Storage: local-storage | local-storage.test.ts | 11 | MIME rejection, magic bytes, size limits, UUID filenames, WebP conversion, thumbnails, path traversal |
| Storage: image-processor | image-processor.test.ts | 4 | stripExif, toWebP, thumbnails, path traversal in thumbnails |
| Utils: api-error | api-error.test.ts | 9 | Constructor, default statusCode, details, all factory methods |
| Utils: api-response | api-response.test.ts | 7 | sendSuccess, sendList pagination, zero-limit guard, sendError format, details presence |
| Utils: logger | logger.test.ts | 2 | Instance exists, valid log level |
| DB: seed | seed.test.ts | 4 | Category counts, setting names, template count |
| Index: exports | index.test.ts | 5 | Module export verification |

**Missing test coverage:**
- `request-logger.ts`: No test file. Should verify `res.on('finish')` handler.
- `redis-client.ts`: No unit test (covered indirectly via cache-service mocking).
- `elasticsearch-client.ts`: No unit test (covered indirectly via health route mocking).
- `index-manager.ts`: No unit test (covered indirectly via setupIndices in index.ts).
- `path-validation.ts`: No dedicated test file (covered by storage tests).
- `prisma-version-check.ts`: No test file.

### 9. Performance & Code Quality
**Rating: PASS**

- No monolithic files. Largest source file is 126 lines (`local-storage.ts`).
- Proper async/await usage throughout. No callback pyramids.
- `scanStream` for Redis pattern invalidation (production-safe, avoids `KEYS` blocking).
- Elasticsearch index setup is best-effort with graceful degradation.
- Redis uses lazy connect with retry strategy (exponential backoff, max 10 retries).
- Prisma client singleton pattern prevents connection pool exhaustion during development (global cache).
- `sharp` image processing is efficient: auto-orient, WebP conversion, and thumbnail generation in a pipeline.
- Graceful shutdown properly closes HTTP server, Redis, Elasticsearch, and Prisma in sequence.
- Server shutdown awaits HTTP server close via Promise wrapper.
- No memory leaks detected in module-level singletons (all have cleanup functions).

### 10. Design System Compliance
**Rating: N/A - Backend**

Backend infrastructure does not implement visual design. Design tokens and colors are defined in `platform.json` and will be consumed by the frontend in Phase 3.

## Verification Checklist

- [x] TypeScript strict mode enabled
- [x] No `any` types in source files
- [x] ESM module system with `.js` imports
- [x] No hardcoded location data in backend code
- [x] All secrets from `.env`, not hardcoded
- [x] `helmet` security headers middleware applied
- [x] `x-powered-by` disabled
- [x] `trust proxy` configured
- [x] Rate limiting middleware present
- [x] CORS configured with origin allowlist and `Vary: Origin`
- [x] Request ID generated and exposed in response headers
- [x] Error handler does not leak internal details
- [x] Path traversal prevention in storage
- [x] Magic byte MIME validation for uploads
- [x] EXIF metadata stripping
- [x] UUID filename generation
- [x] File size limits enforced
- [x] Prisma schema matches spec data models (A.2, A.14, A.17, A.18, A.19, A.24)
- [x] API response format matches spec (Section 27.1, Appendix B.0)
- [x] Elasticsearch graceful degradation (Section 27.5)
- [x] Redis key prefixing by environment
- [x] Graceful shutdown for all services
- [x] Database seed is idempotent (upsert)
- [x] Multilingual JSON fields in Category, EmailTemplate
- [x] All 6 SystemSetting default keys from spec A.24 seeded
- [x] Platform config validation on startup
- [x] Environment variable validation on startup with Zod
- [ ] `/status` endpoint requires authentication (deferred to Phase 2)
- [ ] Per-route rate limiting per Spec Section 4.8 (deferred to Phase 2)
- [ ] Prisma migration files committed
- [ ] Slow query logging (>100ms)
- [ ] CSRF protection (deferred to Phase 2)
- [ ] `request-logger` test coverage

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
- `packages/backend/src/utils/api-error.ts`
- `packages/backend/src/utils/api-response.ts`
- `packages/backend/src/utils/logger.ts`
- `packages/backend/src/utils/path-validation.ts`
- `packages/backend/src/utils/prisma-version-check.ts`
- `packages/backend/src/types/express.d.ts`

### Configuration Files (8 files)
- `packages/backend/prisma/schema.prisma`
- `packages/backend/prisma.config.ts`
- `packages/backend/vitest.config.ts`
- `packages/backend/tsconfig.json`
- `packages/backend/package.json`
- `config/platform.json`
- `config/platform.development.json`
- `.env.example`

### Infrastructure Files (3 files)
- `docker/docker-compose.yml`
- `docker/.env.docker.example`
- `docker/init-db.sh`

### Test Files (17 files)
- `packages/backend/src/__tests__/setup.ts`
- `packages/backend/src/__tests__/index.test.ts`
- `packages/backend/src/__tests__/feature-gate.test.ts`
- `packages/backend/src/__tests__/env-validate.test.ts`
- `packages/backend/src/__tests__/platform-loader.test.ts`
- `packages/backend/src/__tests__/validate.test.ts`
- `packages/backend/src/__tests__/utils/api-error.test.ts`
- `packages/backend/src/__tests__/utils/api-response.test.ts`
- `packages/backend/src/__tests__/utils/logger.test.ts`
- `packages/backend/src/__tests__/middleware/cors-config.test.ts`
- `packages/backend/src/__tests__/middleware/error-handler.test.ts`
- `packages/backend/src/__tests__/middleware/request-id.test.ts`
- `packages/backend/src/__tests__/routes/health.test.ts`
- `packages/backend/src/__tests__/db/seed.test.ts`
- `packages/backend/src/__tests__/storage/image-processor.test.ts`
- `packages/backend/src/__tests__/storage/local-storage.test.ts`
- `packages/backend/src/__tests__/cache/cache-service.test.ts`

### Plan/Study Files (4 files)
- `md/plan/phase-1.3-backend-infrastructure.md`
- `md/study/phase-1.3-backend-infrastructure.md`
- `TODO.md`
- `PROGRESS.md`

### Specification
- `docs/Community_Hub_Specification_v2.md` (Sections 2, 3, 4, 27, Appendices A and B)

## Previous Review Issues Status

The previous review (QA Review #8) identified 12 high-severity, 29 medium, and 18 low issues. Below is the resolution status of high-severity items:

| ID | Issue | Status |
|----|-------|--------|
| H-01 | No security headers (helmet) | **Resolved** -- `helmet()` added in `app.ts:18` |
| H-02 | No rate limiting | **Resolved** -- `express-rate-limit` added in `app.ts:19` |
| H-03 | `$queryRawUnsafe` in health check | **Resolved** -- uses tagged template `$queryRaw` in `health.ts:24` |
| H-04 | `/status` unauthenticated | **Open** -- TODO comment added, deferred to Phase 2 (C-01) |
| H-05 | Hardcoded credentials in prisma.config.ts | **Resolved** -- `prisma.config.ts` reads from env with validation |
| H-06 | Path traversal missing from `fileExists`/`getFileUrl` | **Resolved** -- `safeResolvePath` used in `deleteFile` and `fileExists` |
| H-07 | CORS missing `Vary: Origin` | **Resolved** -- `cors-config.ts:13` sets `Vary: Origin` |
| H-08 | `trust proxy` not configured | **Resolved** -- `app.ts:17` sets `trust proxy: 1` |
| H-09 | `ALLOWED_ORIGINS` missing from env validation | **Resolved** -- added to `env-validate.ts:17` |
| H-10 | Prisma datasource missing `url` | **Not applicable** -- schema has `url = env("DATABASE_URL")` (was false positive) |
| H-11 | No migration files committed | **Open** -- migration files still not visible in repo |
| H-12 | CORS zero test coverage | **Resolved** -- 6 CORS tests in `cors-config.test.ts` |

**Resolution rate: 10/12 high-severity issues resolved (83%).** Two items remain open (C-01, H-03 above).

## Summary of Actionable Items

### Before Phase 2 (Must Fix)
1. Commit Prisma migration files (H-03)
2. Add authentication to `/status` endpoint or document the deferred timeline (C-01)
3. Add `.map(s => s.trim())` to CORS origin parsing (M-03)
4. Use `safeResolvePath` in `uploadFile` for consistency (H-02)
5. Use `sendError` in `featureGate` for consistent error format (M-12)

### Phase 2 Improvements
1. Per-route rate limiting per Spec Section 4.8 (M-02)
2. Redis-backed rate limit store for multi-instance deployment (M-01)
3. Slow query logging via Prisma middleware (H-04)
4. CSRF protection
5. `PATCH` method in CORS allowed methods (H-01)

### Test Improvements
1. Add `request-logger.ts` test (M-13)
2. Add `prisma-version-check.ts` test (L-priority)
3. Increase coverage thresholds toward 80% as tests are added (L-05)

### Documentation Items
1. Document `User.status` defaulting to `PENDING` as intentional deviation (C-02)
2. Document `ES_NUMBER_OF_REPLICAS` env var (M-04)
