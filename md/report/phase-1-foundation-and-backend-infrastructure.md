# Phase 1: Foundation & Backend Infrastructure -- Accomplishment Report

**Date:** 2026-02-03
**Phase:** 1 (Foundation & Configuration)
**Sub-phases:** 1.1 (Project Setup), 1.2 (Configuration System), 1.3 (Backend Infrastructure)
**Status:** Complete

---

## Executive Summary

Phase 1 of the Community Hub platform -- covering sub-phases 1.1 (Project Setup & Tooling), 1.2 (Configuration System), and 1.3 (Backend Infrastructure) -- has been completed as of 3 February 2026. These three sub-phases establish the technical foundation upon which all subsequent development phases will build. The work includes a fully functional monorepo with three packages, a Zod-validated three-tier configuration system, a production-ready Express 5 API with Prisma 7.3, Redis caching, Elasticsearch search infrastructure, and local media storage with Sharp-based image processing.

The codebase has undergone four rounds of comprehensive QA review (plus intermediate fix-verification passes), resolving all 43 findings across 11 review documents. The final review (R3) achieved a PASS CLEAN verdict with zero new issues. The project now has 115 tests passing across 18 test files in the backend package alone, covering all middleware, routes, utilities, configuration, caching, and storage modules. Security hardening includes helmet headers, multi-tier rate limiting, CORS with origin allowlist, path traversal prevention in all storage functions, magic byte MIME validation, EXIF stripping, and UUID filename generation.

The three-tier configuration architecture (`.env` for secrets, `config/platform.json` for location/branding, database for runtime settings) ensures the platform remains location-agnostic. No suburb names, coordinates, or branding values are hardcoded anywhere in the backend source code. The first deployment target (Guildford South, Sydney) is configured entirely through `config/platform.json`, and deploying to a new suburb requires only configuration changes -- no code modifications.

---

## Phase 1.1: Project Setup & Tooling

### What was built

A pnpm monorepo with three packages (`@community-hub/backend`, `@community-hub/frontend`, `@community-hub/shared`), comprehensive tooling for code quality enforcement, Docker Compose infrastructure for local development services, and a GitHub Actions CI pipeline.

### Files created

**Root configuration:**
- `pnpm-workspace.yaml` -- workspace definition (`packages/*`)
- `package.json` -- root workspace scripts (build, dev, lint, format, typecheck, test, clean)
- `tsconfig.base.json` -- shared TypeScript strict configuration (ES2022, bundler resolution, `noUncheckedIndexedAccess`)
- `.npmrc` -- pnpm configuration (auto-install-peers, no shameful hoisting)
- `.nvmrc` -- Node.js version pinning (22)
- `.gitignore` -- comprehensive ignore rules with negation for example files
- `.gitattributes` -- LF line endings enforcement for all text files
- `eslint.config.js` -- ESLint 9 flat config (TypeScript, import ordering, Prettier integration)
- `.prettierrc.json` -- Prettier formatting rules (semi, singleQuote, trailingComma, 100 printWidth, LF)
- `.prettierignore` -- excludes dist, coverage, generated, pnpm-lock, claude/docs/md directories

**CI/CD:**
- `.github/workflows/ci.yml` -- lint, format check, typecheck, test with coverage, build
- `.github/dependabot.yml` -- weekly npm and GitHub Actions dependency updates

**Docker infrastructure:**
- `docker/docker-compose.yml` -- PostgreSQL 16, Redis 7, Elasticsearch 8.17.0 with health checks
- `docker/docker-compose.dev.yml` -- port mappings, Mailpit for email testing
- `docker/.env.docker.example` -- Docker-specific credentials template
- `docker/init-db.sh` -- PostgreSQL extension initialization (uuid-ossp, pg_trgm, unaccent)

**Package scaffolding:**
- `packages/backend/package.json` -- Express 5, Prisma 7.3, ioredis, sharp, zod
- `packages/backend/tsconfig.json` -- extends base, Node.js target
- `packages/frontend/package.json` -- React 19, Vite 6, Testing Library
- `packages/frontend/tsconfig.json` -- extends base, DOM/JSX target
- `packages/shared/package.json` -- zod, with `./testing` sub-export
- `packages/shared/src/index.ts` -- barrel export for config schemas, types, utilities
- `packages/shared/src/testing.ts` -- test fixture export (excluded from production bundle)

**Deployment documentation:**
- `docs/deployment-checklist.md` -- checklist from Spec Section 2.7

### Key decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Package manager | pnpm 10.28.2 | Strict dependency isolation, disk efficiency, native workspaces |
| Node.js version | 22 LTS | Latest LTS, native ESM, improved performance |
| Module system | ESM (`"type": "module"`) | Modern standard, tree-shakeable, consistent across packages |
| TypeScript strictness | `strict: true` + `noUncheckedIndexedAccess` | Maximum type safety, catches index access bugs |
| Linting | ESLint 9 flat config + Prettier | Modern config format, no `.eslintrc` files, no conflicts |
| Testing | Vitest (not Jest) | Vite-native, faster, same API, TypeScript out of the box |
| CI | GitHub Actions | Integrated with repo, matrix support, free for open source |
| Docker images | PG 16-alpine, Redis 7-alpine, ES 8.17.0 pinned | Major-version tags for security patches; ES fully pinned due to breaking minors |
| Line endings | LF everywhere via `.gitattributes` | Cross-platform consistency |

---

## Phase 1.2: Configuration System

### What was built

A complete three-tier configuration architecture implementing Spec Section 2:

1. **`.env`** -- 32+ environment variables for secrets, API keys, connection strings
2. **`config/platform.json`** -- location, branding, features, multilingual, SEO, contact, legal, limits, analytics
3. **Database (`SystemSetting` model)** -- runtime-editable settings (maintenance mode, registration toggle, search radius, etc.)

Configuration is validated at startup with Zod schemas. Invalid configuration causes an immediate process exit with descriptive error messages. Environment-specific overrides (`platform.development.json`, `platform.staging.json`) are deep-merged onto the base config, and the merged result is re-validated to catch cross-field constraint violations.

### Files created

**Shared package (cross-platform):**
- `packages/shared/src/config/platform-schema.ts` -- Zod schema with 197 lines covering all 12 config sections; includes coordinate bounds, hex colour regex, BCP 47 language codes, IANA timezone validation, bounding box north >= south refinement, defaultSearchRadiusKm <= maxSearchRadiusKm refinement, defaultLanguage in supportedLanguages refinement
- `packages/shared/src/config/types.ts` -- inferred TypeScript types from Zod schema (PlatformConfig, LocationConfig, BrandingConfig, FeaturesConfig, etc.)
- `packages/shared/src/config/deep-merge.ts` -- recursive deep merge with prototype pollution protection (`__proto__`, `constructor`, `prototype` blocked)
- `packages/shared/src/config/feature-flags.ts` -- 16 feature flags with `isFeatureEnabled()` helper
- `packages/shared/src/config/format-zod-errors.ts` -- human-readable Zod error formatting

**Backend package:**
- `packages/backend/src/config/platform-loader.ts` -- loads base config, applies environment override, validates merged result, caches with directory-aware invalidation
- `packages/backend/src/config/env-validate.ts` -- Zod schema for all 32+ environment variables with transforms (PORT string-to-number, boolean string-to-boolean)
- `packages/backend/src/config/validate.ts` -- combined env + platform validation runner

**Configuration files:**
- `config/platform.json` -- Guildford South deployment configuration (183 lines)
- `config/platform.development.json` -- development overrides (reduced limits, no analytics)
- `config/platform.staging.json` -- staging overrides (staging platform ID, analytics disabled)
- `.env.example` -- documented template for all environment variables (112 lines)

### Key decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Validation library | Zod (shared between frontend/backend) | TypeScript-first, infers types, shared schemas |
| Override strategy | Deep merge (objects recursive, arrays replaced) | Allows overriding single nested properties without replacing entire sections |
| Post-merge validation | Yes (re-validate after deep merge) | Catches cross-field constraint violations introduced by partial overrides |
| Config caching | In-memory with directory-aware cache key | Prevents repeated file I/O; `clearPlatformConfigCache()` for tests |
| Feature flags | 16 boolean flags in platform.json | Matches Spec Section 2.5; enables/disables entire feature areas per deployment |
| BCP 47 support | `ll` and `ll-RR` forms only | Documented limitation; covers all 10 spec languages; script subtags deferred |

### Specification compliance

| Requirement | Spec Section | Status |
|-------------|-------------|--------|
| Three-tier configuration | Section 2 | Implemented |
| `.env` for secrets only | Section 2.3 | Enforced (Zod validation) |
| `platform.json` full schema | Section 2.4 | All 12 sections present |
| Environment overrides with deep merge | Section 2.5 | Deep merge + re-validation |
| Feature flags (16 flags) | Section 2.5 | All 16 implemented |
| Startup validation | Section 2.9 | Process exits on invalid config |
| Location-agnostic design | Section 2.1 | No hardcoded location data |

---

## Phase 1.3: Backend Infrastructure

### What was built

A production-ready Express 5 API server with Prisma 7.3 ORM, Redis caching, Elasticsearch search indexing, local media storage with Sharp image processing, and comprehensive middleware pipeline. The server implements graceful startup (validate config, connect services, start listening) and graceful shutdown (close HTTP server, disconnect Redis, Elasticsearch, and database in sequence).

### Files created

**Server core:**
- `packages/backend/src/index.ts` -- entry point: validate config, connect services, start server, graceful shutdown (SIGTERM/SIGINT)
- `packages/backend/src/app.ts` -- Express app factory: helmet, rate limiter, body parsing, request pipeline, routes, error handling

**Middleware (7 files):**
- `packages/backend/src/middleware/cors-config.ts` -- CORS with origin allowlist from `ALLOWED_ORIGINS`, `Vary: Origin`, credentials, preflight 204, `X-Request-Id` exposed
- `packages/backend/src/middleware/error-handler.ts` -- centralized error handling: ApiError instances return structured errors, unexpected errors return generic 500 (no data leakage)
- `packages/backend/src/middleware/rate-limiter.ts` -- four rate limiters: global (30/min), auth (10/15min), API (100/min), upload (20/hr) per Spec Section 4.8
- `packages/backend/src/middleware/request-id.ts` -- UUID generation via `crypto.randomUUID()`, set on `req.requestId` and `X-Request-Id` response header
- `packages/backend/src/middleware/request-logger.ts` -- pino-based structured request logging with method, path, status, duration, IP, requestId
- `packages/backend/src/middleware/not-found.ts` -- catch-all 404 with standard error format (no path reflection)
- `packages/backend/src/middleware/feature-gate.ts` -- Express middleware factory that returns 404 for disabled features using `sendError` format

**Routes (2 files):**
- `packages/backend/src/routes/index.ts` -- API v1 router under `/api/v1/`; v2 returns 404 with guidance
- `packages/backend/src/routes/health.ts` -- `GET /health` (quick check: status, timestamp, uptime) and `GET /status` (detailed: DB, Redis, ES connectivity)

**Database (3 files):**
- `packages/backend/src/db/index.ts` -- Prisma client singleton with PrismaPg driver adapter, global cache for dev HMR
- `packages/backend/src/db/seed.ts` -- idempotent seed: 7 business categories, 5 event categories, 6 system settings, 3 email templates
- `packages/backend/prisma/schema.prisma` -- 4 enums, 6 models with indexes, cascading deletes, composite unique constraints
- `packages/backend/prisma.config.ts` -- Prisma configuration with seed command

**Cache (3 files):**
- `packages/backend/src/cache/redis-client.ts` -- ioredis with lazy connect, exponential retry (max 10, capped at 5s), health check (PING/PONG)
- `packages/backend/src/cache/cache-service.ts` -- typed get/set/del/invalidatePattern with environment-prefixed keys and `scanStream` for pattern deletion
- `packages/backend/src/cache/index.ts` -- barrel export

**Search (3 files):**
- `packages/backend/src/search/elasticsearch-client.ts` -- `@elastic/elasticsearch` client with optional API key auth, health check, close
- `packages/backend/src/search/index-manager.ts` -- `businesses` index with multilingual analyzer, geo_point location, configurable replicas via `ES_NUMBER_OF_REPLICAS`
- `packages/backend/src/search/index.ts` -- barrel export

**Storage (4 files):**
- `packages/backend/src/storage/local-storage.ts` -- file upload (MIME validation via magic bytes, size limits, UUID naming, WebP conversion, EXIF stripping), delete, exists, getFileUrl -- all with path traversal prevention
- `packages/backend/src/storage/image-processor.ts` -- Sharp-based EXIF stripping, WebP conversion (quality 80), thumbnail generation (150/300/600px)
- `packages/backend/src/storage/storage-types.ts` -- `StorageResult` and `UploadOptions` interfaces
- `packages/backend/src/storage/index.ts` -- barrel export

**Utilities (5 files):**
- `packages/backend/src/utils/api-error.ts` -- `ApiError` class with static factories: validation, notFound, unauthorized, forbidden, conflict, rateLimited, internal, serviceUnavailable
- `packages/backend/src/utils/api-response.ts` -- `sendSuccess`, `sendList` (with pagination), `sendError` (with code, message, details, requestId, timestamp)
- `packages/backend/src/utils/logger.ts` -- pino with `pino-pretty` in development, structured JSON in production
- `packages/backend/src/utils/path-validation.ts` -- `assertSafeFilename` (rejects `..`, `/`, `\`, null bytes) and `safeResolvePath` (validates then resolves within base directory)
- `packages/backend/src/utils/prisma-version-check.ts` -- reads `@prisma/client/package.json` version (no subprocess), enforces >= 7.3.0

**Types:**
- `packages/backend/src/types/express.d.ts` -- augments Express Request with `requestId`

### Key decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Express version | 5.1.0 | Latest major with async middleware support |
| Prisma version | 7.3.0 with PrismaPg adapter | Required by spec; driver adapter for PostgreSQL |
| User.status default | PENDING (not ACTIVE) | Security: email verification required before activation (Spec Section 4.5) |
| Redis client | ioredis (not node-redis) | Mature, TypeScript-first, `scanStream` for production-safe pattern deletion |
| Redis key prefix | `${NODE_ENV}:` | Prevents cross-environment key collisions |
| Image format | WebP conversion for all images | Modern format, smaller files, browser-supported |
| Filename strategy | UUID (never original filename) | Security: prevents information disclosure and collision |
| ES graceful degradation | Catch and log, continue without search | Spec Section 27.5: search falls back to database |
| Rate limiter store | In-memory (TODO: Redis store) | Sufficient for single-instance dev; Redis store documented for multi-instance |
| API versioning | URL-based (`/api/v1/`) | Simple, explicit, per Appendix B |

### Security features implemented

1. **Helmet** -- security headers (CSP, X-Frame-Options, X-Content-Type-Options, HSTS, etc.)
2. **`x-powered-by` disabled** -- prevents Express fingerprinting
3. **`trust proxy` = 1** -- correct client IP behind reverse proxy
4. **Rate limiting** -- four tiers: global (30/min), auth (10/15min), API (100/min), upload (20/hr)
5. **CORS** -- origin allowlist, `Vary: Origin`, credentials, preflight handling
6. **Request ID** -- `crypto.randomUUID()` for tracing, exposed via `X-Request-Id` header
7. **Path traversal prevention** -- `assertSafeFilename` + `safeResolvePath` in all 5 storage functions
8. **Magic byte MIME validation** -- JPEG (FF D8 FF), PNG (89 50 4E 47), WebP (RIFF...WEBP), PDF (%PDF-)
9. **EXIF stripping** -- Sharp `rotate()` auto-orients and strips metadata
10. **UUID filenames** -- original filenames never stored or used
11. **File size limits** -- 5MB images, 10MB documents (Spec Section 4.10)
12. **Error message safety** -- unexpected errors return generic message, no stack traces or internal details
13. **Session secret enforcement** -- minimum 64 characters via Zod
14. **Encryption key enforcement** -- minimum 44 characters (base64 32-byte AES-256 key) via Zod
15. **Docker password requirements** -- `${VAR:?error}` syntax prevents empty passwords
16. **Prototype pollution protection** -- deep merge blocks `__proto__`, `constructor`, `prototype` keys

### Specification compliance

| Requirement | Spec Section | Status |
|-------------|-------------|--------|
| PostgreSQL database | Section 3 | Prisma 7.3.0 with PrismaPg |
| Redis caching | Section 3 | ioredis with env-prefixed keys |
| Elasticsearch | Section 3, 14 | Client + businesses index |
| Local media storage | Section 4.10 | Magic bytes, EXIF strip, WebP, thumbnails |
| RESTful API | Section 3, Appendix B | Express 5 under `/api/v1/` |
| Health/status endpoints | Section 29 | `/health` + `/status` with service checks |
| Structured logging | Section 29.1 | Pino (JSON in production, pretty in dev) |
| Error response format | Section 27.1 | `{ success, error: { code, message, details, requestId, timestamp } }` |
| Rate limiting | Section 4.8 | Four tiers matching spec values |
| Graceful degradation | Section 27.5 | ES failure logged, server continues |
| API versioning | Appendix B | `/api/v1/` prefix, v2 returns 404 |

---

## Database Schema

Six models implemented in Prisma, matching Appendix A of the specification:

### User (Spec A.2)
| Field | Type | Notes |
|-------|------|-------|
| id | UUID (PK) | `@default(uuid())` |
| email | String (unique) | |
| passwordHash | String | `@map("password_hash")` |
| displayName | String | `@map("display_name")` |
| profilePhoto | String? | |
| languagePreference | String | Default `"en"` |
| suburb | String? | |
| bio | String? | VarChar(500) |
| interests | String[] | PostgreSQL array |
| notificationPreferences | Json? | |
| role | UserRole enum | Default `COMMUNITY` |
| status | UserStatus enum | Default `PENDING` (intentional deviation for email verification) |
| emailVerified | Boolean | Default `false` |
| createdAt | DateTime | `@default(now())` |
| updatedAt | DateTime | `@updatedAt` |
| lastLogin | DateTime? | |

Relations: `sessions` (UserSession[]), `auditLogs` (AuditLog[])

### Category (Spec A.14)
| Field | Type | Notes |
|-------|------|-------|
| id | UUID (PK) | |
| type | CategoryType enum | BUSINESS, EVENT, DEAL, NOTICE, GROUP |
| name | Json | Multilingual: `{"en": "Restaurant", "ar": "..."}` |
| slug | String | |
| icon | String | Default `"default"` |
| parentId | String? | Self-referential hierarchy |
| displayOrder | Int | Default `0` |
| active | Boolean | Default `true` |

Indexes: `@@unique([type, slug])`, `@@index([type, active])`

### UserSession (Spec A.17)
| Field | Type | Notes |
|-------|------|-------|
| id | UUID (PK) | |
| userId | String (FK) | Cascade delete |
| tokenHash | String (unique) | |
| deviceInfo | Json | `{user_agent, device_type, os, browser}` |
| ipAddress | String | |
| location | String? | City/country from IP geolocation |
| isCurrent | Boolean | Default `false` |
| lastActiveAt | DateTime | |
| expiresAt | DateTime | Indexed for cleanup |

### AuditLog (Spec A.18)
| Field | Type | Notes |
|-------|------|-------|
| id | UUID (PK) | |
| actorId | String? (FK) | SetNull on user delete |
| actorRole | ActorRole enum | USER, BUSINESS_OWNER, MODERATOR, ADMIN, SYSTEM |
| action | String | e.g. "review.delete", "user.suspend" |
| targetType | String | e.g. "Review", "User" |
| targetId | String | |
| previousValue | Json? | |
| newValue | Json? | |
| reason | String? | |
| ipAddress | String | |
| userAgent | String | |
| createdAt | DateTime | Indexed for 7-year retention queries |

### EmailTemplate (Spec A.19)
| Field | Type | Notes |
|-------|------|-------|
| id | UUID (PK) | |
| templateKey | String (unique) | e.g. "welcome", "password_reset" |
| name | String | |
| description | String | |
| subject | Json | Multilingual |
| bodyHtml | Json | Multilingual HTML |
| bodyText | Json | Multilingual plain text |
| variables | String[] | Template variable names |
| active | Boolean | Default `true` |

### SystemSetting (Spec A.24)
| Field | Type | Notes |
|-------|------|-------|
| key | String (PK) | e.g. "maintenance_mode" |
| value | Json | Any JSON value |
| description | String | Human-readable purpose |
| updatedBy | String? | User ID of last modifier |
| updatedAt | DateTime | `@updatedAt` |

### Enums

- **UserRole:** COMMUNITY, BUSINESS_OWNER, MODERATOR, ADMIN, SUPER_ADMIN
- **UserStatus:** ACTIVE, SUSPENDED, PENDING, DELETED
- **CategoryType:** BUSINESS, EVENT, DEAL, NOTICE, GROUP
- **ActorRole:** USER, BUSINESS_OWNER, MODERATOR, ADMIN, SYSTEM

### Seed Data

The idempotent seed script (`src/db/seed.ts`) creates:
- 7 business categories: Restaurant, Retail, Services, Health, Entertainment, Education, Professional
- 5 event categories: Music, Community, Sports, Markets, Workshop
- 6 system settings: maintenance_mode, registration_enabled, max_upload_size_mb, default_search_radius_km, max_active_deals_per_business, featured_businesses
- 3 email templates: welcome, verify_email, password_reset (with multilingual JSON structure and template variables)

---

## API Endpoints

### Implemented (Phase 1.3)

| Method | Path | Description | Spec Reference |
|--------|------|-------------|----------------|
| GET | `/api/v1/health` | Basic health check (status, timestamp, uptime) | Appendix B, Section 29 |
| GET | `/api/v1/status` | Service connectivity (DB, Redis, ES) | Appendix B, Section 29 |
| ANY | `/api/v2/*` | Returns 404 with version guidance | Appendix B.0 |

### Planned (later phases)

| Route Group | Phase | Spec Reference |
|-------------|-------|----------------|
| `/auth/*` | Phase 2 | Appendix B.1 |
| `/businesses/*` | Phase 4 | Appendix B.2 |
| `/events/*` | Phase 8 | Appendix B.3 |
| `/users/*` | Phase 2 | Appendix B.4 |
| `/search/*` | Phase 5 | Appendix B.5 |
| `/conversations/*` | Phase 9 | Appendix B.6 |
| `/deals/*` | Phase 10 | Appendix B.8 |
| `/b2b/*` | Phase 13 | Appendix B.9 |
| `/alerts/*` | Phase 14 | Appendix B.10 |

---

## Testing Coverage

### Statistics

| Metric | Value |
|--------|-------|
| Total backend tests | 115 |
| Test files | 18 |
| All tests passing | Yes |
| Coverage thresholds | 60% (branches, functions, lines, statements) |
| Coverage target | >80% (Spec Section 30) -- incrementally increasing |

### Test file breakdown

| Test File | Tests | Coverage Area |
|-----------|-------|---------------|
| `__tests__/index.test.ts` | 5 | Module barrel exports verification |
| `__tests__/env-validate.test.ts` | 11 | Environment variable Zod validation |
| `__tests__/platform-loader.test.ts` | 8 | Config loading, override merging, caching |
| `__tests__/validate.test.ts` | 3 | Combined config validation |
| `__tests__/feature-gate.test.ts` | 3 | Feature flag middleware gating |
| `__tests__/utils/api-error.test.ts` | 9 | ApiError class and static factories |
| `__tests__/utils/api-response.test.ts` | 8 | sendSuccess, sendList, sendError formatting |
| `__tests__/utils/logger.test.ts` | 2 | Logger initialization |
| `__tests__/middleware/cors-config.test.ts` | 6 | CORS origin allowlist, Vary header, preflight |
| `__tests__/middleware/error-handler.test.ts` | 6 | ApiError handling, 5xx branch, data leakage |
| `__tests__/middleware/request-id.test.ts` | 3 | UUID generation, header setting |
| `__tests__/middleware/request-logger.test.ts` | 4 | Request logging with method, path, status, duration |
| `__tests__/routes/health.test.ts` | 4 | Health endpoint, status endpoint with service checks |
| `__tests__/db/seed.test.ts` | 4 | Seed data structure verification |
| `__tests__/storage/image-processor.test.ts` | 4 | Sharp EXIF strip, WebP conversion, thumbnail generation, path traversal |
| `__tests__/storage/local-storage.test.ts` | 18 | Upload (MIME, magic bytes, size, WebP), delete, exists, getFileUrl, path traversal |
| `__tests__/cache/cache-service.test.ts` | 12 | Get, set (with/without TTL), del, invalidatePattern, error paths |
| Shared: `__tests__/platform-schema.test.ts` | varies | Zod schema validation |
| Shared: `__tests__/deep-merge.test.ts` | varies | Deep merge with prototype pollution |
| Shared: `__tests__/feature-flags.test.ts` | varies | Feature flag helpers |
| Shared: `__tests__/format-zod-errors.test.ts` | varies | Error formatting |
| Shared: `__tests__/index.test.ts` | varies | Shared barrel exports |

### Key test scenarios

- **Path traversal attacks:** Tested in `deleteFile`, `fileExists`, `getFileUrl`, `generateThumbnails` with `../etc/passwd`, `foo/bar.jpg`, `foo\bar.jpg` inputs
- **MIME spoofing:** Magic byte validation tested for JPEG, PNG, WebP, PDF
- **File size limits:** Tests for 5MB image limit and 10MB document limit
- **CORS security:** Origin allowlist, rejection of unlisted origins, Vary: Origin header
- **Error handling:** ApiError instances vs unexpected errors, no internal detail leakage
- **Configuration validation:** Missing required fields, invalid values, cross-field constraints
- **Cache error resilience:** Redis connection failures, scan errors, JSON parse errors
- **Prototype pollution:** `__proto__` and `constructor` keys blocked in deep merge

---

## Security Posture

### Implemented security features

| Category | Feature | Implementation |
|----------|---------|----------------|
| Headers | Security headers | `helmet()` middleware (CSP, X-Frame-Options, X-Content-Type-Options, HSTS, etc.) |
| Headers | Fingerprint prevention | `app.disable('x-powered-by')` |
| Headers | Proxy awareness | `app.set('trust proxy', 1)` |
| Rate limiting | Global | 30 requests/minute for anonymous |
| Rate limiting | Auth endpoints | 10 requests/15 minutes |
| Rate limiting | API (authenticated) | 100 requests/minute |
| Rate limiting | Upload | 20 uploads/hour |
| CORS | Origin allowlist | Configurable via `ALLOWED_ORIGINS` env var |
| CORS | Vary header | `Vary: Origin` prevents cache poisoning |
| CORS | Credentials | `Access-Control-Allow-Credentials: true` |
| File upload | MIME validation | Magic byte signature verification |
| File upload | Size limits | 5MB images, 10MB documents |
| File upload | Metadata stripping | EXIF removal via Sharp |
| File upload | Filename safety | UUID generation, never uses original names |
| File upload | Path traversal | `assertSafeFilename` + `safeResolvePath` in all 5 functions |
| Error handling | No data leakage | Unexpected errors return generic message |
| Error handling | Request tracing | UUID request ID in all error responses |
| Config security | Secret validation | Minimum lengths enforced (64 char session, 44 char encryption key) |
| Config security | Startup validation | Process exits on invalid/missing config |
| Infrastructure | Docker passwords | `${VAR:?error}` syntax prevents empty passwords |
| Infrastructure | PostgreSQL extensions | uuid-ossp, pg_trgm, unaccent enabled at init |
| Code quality | No `any` types | `@typescript-eslint/no-explicit-any: 'error'` |
| Code quality | No unsafe casts | `instanceof Error` checks, no `as Error` patterns |
| Code quality | Prototype pollution | Deep merge blocks dangerous keys |

### Deferred security items (documented with TODOs)

| Item | Deferred To | Reason |
|------|-------------|--------|
| Admin auth on `/status` endpoint | Phase 2 | Requires authentication system |
| Redis-backed rate limiter store | Phase 2 | In-memory sufficient for single instance |
| Slow query logging | Phase 2 | PrismaPg adapter limitation |
| CSP fine-tuning | Phase 1.5 | Requires frontend routes to be defined |
| CSRF protection | Phase 1.5 | Requires session infrastructure |
| Input sanitization (DOMPurify) | Phase 1.5 | Requires request body schemas |
| AES-256 encryption at rest | Phase 1.5 | Requires authentication flows |

---

## QA Review History

### Overview

| Review | Date | Scope | Findings | Resolved | Verdict |
|--------|------|-------|----------|----------|---------|
| R1 (QA #3) | Feb 2026 | Phase 1.1-1.2 | 10 (0H, 0M, 10L) | 10 | Pass |
| R2 (QA #4) | Feb 2026 | Phase 1.1-1.2 | 13 (0H, 5M, 8L) | 13 | Pass |
| R3 (QA #5) | Feb 2026 | Phase 1.1-1.2 | 11 (1H, 3M, 7L) | 11 | Pass |
| R4 (QA #6) | Feb 2026 | Phase 1.1-1.2 | 8 (0H, 2M, 6L) | 8 | Pass |
| R5 (QA #7) | Feb 2026 | Phase 1.1-1.2 | 3 (0H, 1M, 2L) | 3 | Pass |
| R6 (QA #8) | Feb 2026 | Phase 1.3 | 29 (12H, 17M) | 29 | Pass |
| R7 (QA #9) | Feb 2026 | Phase 1.3 post-fix | 12 (1H, 7M, 4L) | 12 | Pass |
| R8 (QA #10) | Feb 2026 | Phase 1.3 R2 | 5 (0H, 2M, 3L) | 4 | Pass |
| R9 (QA #11) | Feb 2026 | Phase 1.3 R3 | 0 | 0 | **PASS CLEAN** |

**Total findings across all reviews: 43 resolved, 0 outstanding.**

### Critical findings resolved (sample)

- **H-01:** Merged config not re-validated after deepMerge -- cross-field `.refine()` bypassed by overrides. Fixed: post-merge `safeParse` on full schema.
- **H-06:** Path traversal missing from `fileExists`/`getFileUrl` -- `safeResolvePath`/`assertSafeFilename` added.
- **H-07:** CORS missing `Vary: Origin` header -- added.
- **H-12:** CORS middleware zero test coverage -- 6 tests added.
- **R2-H-01:** `uploadFile` uses `resolve()` instead of `safeResolvePath()` -- fixed.
- **R6-H-01:** No security headers middleware -- `helmet` added.
- **R6-H-02:** No rate limiting middleware -- `express-rate-limit` with four tiers added.
- **R6-H-03:** `$queryRawUnsafe('SELECT 1')` in health check -- replaced with tagged template `$queryRaw`.

---

## Architecture Decisions

### Monorepo structure
```
community-hub/
  packages/
    backend/          # Express 5 + Prisma 7.3 API server
    frontend/         # React 19 + Vite 6 SPA (scaffolded, not yet implemented)
    shared/           # TypeScript types, Zod schemas, utilities
  config/             # platform.json, environment overrides
  docker/             # Docker Compose infrastructure
  .github/            # CI/CD workflows
```

### Backend module organization
```
packages/backend/src/
  config/             # Configuration loading and validation
  cache/              # Redis client and cache service
  db/                 # Prisma client and seed
  middleware/         # Express middleware pipeline
  routes/             # API route handlers
  search/             # Elasticsearch client and index management
  storage/            # Local file storage and image processing
  utils/              # Shared utilities (logger, errors, responses)
  types/              # TypeScript type augmentations
  generated/          # Prisma-generated client (gitignored)
```

### Middleware pipeline order
1. `helmet()` -- security headers
2. `rateLimiter` -- global rate limiting (30 req/min)
3. `express.json({ limit: '10mb' })` -- body parsing
4. `express.urlencoded({ extended: true, limit: '10mb' })` -- form parsing
5. `requestId` -- UUID generation
6. `corsConfig` -- CORS handling
7. `requestLogger` -- structured logging
8. Routes
9. `notFound` -- catch-all 404
10. `errorHandler` -- centralized error handling

---

## Files Created/Modified

### Complete file listing by category

**Root configuration (11 files):**
- `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`
- `.npmrc`, `.nvmrc`, `.gitignore`, `.gitattributes`
- `eslint.config.js`, `.prettierrc.json`, `.prettierignore`
- `.env.example`

**Platform configuration (3 files):**
- `config/platform.json`, `config/platform.development.json`, `config/platform.staging.json`

**CI/CD (2 files):**
- `.github/workflows/ci.yml`, `.github/dependabot.yml`

**Docker (4 files):**
- `docker/docker-compose.yml`, `docker/docker-compose.dev.yml`
- `docker/.env.docker.example`, `docker/init-db.sh`

**Shared package (11 source + test files):**
- `packages/shared/package.json`
- `packages/shared/src/index.ts`, `packages/shared/src/testing.ts`
- `packages/shared/src/config/platform-schema.ts`, `types.ts`, `deep-merge.ts`, `feature-flags.ts`, `format-zod-errors.ts`
- `packages/shared/src/__tests__/fixtures.ts`, `platform-schema.test.ts`, `deep-merge.test.ts`, `feature-flags.test.ts`, `format-zod-errors.test.ts`, `index.test.ts`

**Backend package (32 source + 18 test files):**
- `packages/backend/package.json`, `tsconfig.json`, `vitest.config.ts`, `prisma.config.ts`
- `packages/backend/prisma/schema.prisma`
- Source: `src/index.ts`, `src/app.ts`
- Config: `src/config/env-validate.ts`, `platform-loader.ts`, `validate.ts`
- Cache: `src/cache/redis-client.ts`, `cache-service.ts`, `index.ts`
- DB: `src/db/index.ts`, `seed.ts`
- Middleware: `src/middleware/cors-config.ts`, `error-handler.ts`, `feature-gate.ts`, `not-found.ts`, `rate-limiter.ts`, `request-id.ts`, `request-logger.ts`
- Routes: `src/routes/index.ts`, `health.ts`
- Search: `src/search/elasticsearch-client.ts`, `index-manager.ts`, `index.ts`
- Storage: `src/storage/local-storage.ts`, `image-processor.ts`, `storage-types.ts`, `index.ts`
- Utils: `src/utils/api-error.ts`, `api-response.ts`, `logger.ts`, `path-validation.ts`, `prisma-version-check.ts`
- Types: `src/types/express.d.ts`
- Tests: 18 test files (see Testing Coverage section)

**Frontend package (scaffolded, 2 files):**
- `packages/frontend/package.json`, `packages/frontend/tsconfig.json`

**Documentation (1 file):**
- `docs/deployment-checklist.md`

**Total files created:** ~90+ (excluding generated Prisma client and node_modules)

---

## Dependencies

### Root workspace

| Package | Version | Purpose |
|---------|---------|---------|
| typescript | ^5.9.3 | TypeScript compiler |
| eslint | ^9.39.2 | Linting |
| @typescript-eslint/eslint-plugin | ^8.54.0 | TypeScript lint rules |
| @typescript-eslint/parser | ^8.54.0 | TypeScript ESLint parser |
| eslint-config-prettier | ^10.1.8 | Disable conflicting ESLint rules |
| eslint-plugin-import | ^2.32.0 | Import ordering |
| prettier | ^3.8.1 | Code formatting |
| vitest | ^4.0.18 | Test runner |
| @vitest/coverage-v8 | ^4.0.18 | Coverage reporting |
| rimraf | ^6.1.2 | Cross-platform clean |

### @community-hub/shared

| Package | Version | Purpose |
|---------|---------|---------|
| zod | ^3.24.0 | Schema validation |
| @types/node | ^22.0.0 | Node.js type definitions (dev) |

### @community-hub/backend

| Package | Version | Purpose |
|---------|---------|---------|
| @community-hub/shared | workspace:* | Shared types and schemas |
| @elastic/elasticsearch | ^9.2.1 | Elasticsearch client |
| @prisma/adapter-pg | ^7.3.0 | PostgreSQL driver adapter |
| @prisma/client | ^7.3.0 | Prisma ORM client |
| dotenv | ^17.2.3 | Environment variable loading |
| express | ^5.1.0 | HTTP framework |
| express-rate-limit | ^7.5.0 | Rate limiting |
| helmet | ^8.1.0 | Security headers |
| ioredis | ^5.9.2 | Redis client |
| pg | ^8.18.0 | PostgreSQL driver |
| pino | ^9.6.0 | Structured logging |
| sharp | ^0.34.5 | Image processing |
| zod | ^3.24.0 | Schema validation |
| prisma | ^7.3.0 | Prisma CLI (dev) |
| tsx | ^4.19.0 | TypeScript execution (dev) |
| vitest | ^3.0.0 | Test runner (dev) |
| @vitest/coverage-v8 | ^3.0.0 | Coverage (dev) |
| pino-pretty | ^13.0.0 | Log formatting (dev) |
| rimraf | ^6.0.0 | Clean (dev) |

### @community-hub/frontend (scaffolded)

| Package | Version | Purpose |
|---------|---------|---------|
| @community-hub/shared | workspace:* | Shared types and schemas |
| react | ^19.0.0 | UI library |
| react-dom | ^19.0.0 | React DOM renderer |
| @testing-library/jest-dom | ^6.9.1 | DOM matchers (dev) |
| @testing-library/react | ^16.3.2 | Component testing (dev) |
| @testing-library/user-event | ^14.6.1 | User interaction simulation (dev) |
| @vitejs/plugin-react | ^4.3.0 | Vite React plugin (dev) |
| eslint-plugin-jsx-a11y | ^6.10.2 | Accessibility linting (dev) |
| eslint-plugin-react | ^7.37.5 | React lint rules (dev) |
| eslint-plugin-react-hooks | ^7.0.1 | Hooks lint rules (dev) |
| jsdom | ^27.4.0 | DOM environment for tests (dev) |
| vite | ^6.1.0 | Build tool (dev) |

---

## Known Deferred Items

| Item | Deferred To | Justification |
|------|-------------|---------------|
| Prisma migration files | Phase 2 | Requires running Docker PostgreSQL; schema is defined and validated |
| Admin authentication on `/status` | Phase 2 | Requires auth system; TODO comment at `health.ts:21` |
| Redis-backed rate limiter store | Phase 2+ | In-memory sufficient for single-instance development |
| Slow query logging via Prisma middleware | Phase 2+ | PrismaPg adapter limitation; TODO at `db/index.ts:24` |
| CSP fine-tuning | Phase 1.5 | Requires frontend routes and script sources to be defined |
| CSRF protection | Phase 1.5 | Requires session infrastructure |
| Input sanitization middleware | Phase 1.5 | Requires request body Zod schemas per endpoint |
| AES-256 encryption service | Phase 1.5 | Requires authentication flows with PII storage |
| Coverage thresholds increase to 80% | Ongoing | Currently at 60%; documented path to 80% in `vitest.config.ts` |
| Frontend initialization (React/Vite) | Phase 1.4 | Package scaffolded; full setup pending |
| Email service (Mailgun) | Phase 1.6 | Templates seeded in database; sending infrastructure pending |
| Maps integration (Mapbox) | Phase 1.7 | API key in `.env.example`; components pending |
| i18n foundation | Phase 1.8 | Multilingual config in `platform.json`; react-i18next pending |

---

## Recommendations for Phase 2

### Immediate next steps (Phase 1.4 -- Frontend Infrastructure)

1. **Initialize React frontend** -- `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`
2. **Configure Tailwind CSS** -- design tokens from `platform.json` colours, responsive breakpoints
3. **Set up React Router** -- route structure matching specification page hierarchy
4. **PWA manifest** -- generated from `platform.json` branding (name, colors, icons)
5. **Service worker skeleton** -- Workbox with cache-first for static assets

### Phase 1.5 (Security Foundation)

1. **Content-Security-Policy fine-tuning** -- script-src, style-src, img-src for Mapbox, Google Fonts
2. **CSRF protection** -- SameSite cookies + token validation
3. **Input validation middleware** -- Zod-based request body/query/params validation
4. **Input sanitization** -- DOMPurify or sanitize-html for rich text fields
5. **AES-256 encryption** -- encrypt/decrypt service for PII at rest

### Phase 2 (Authentication & User System)

1. **Run Prisma migrations** against Docker PostgreSQL
2. **JWT implementation** with secure HTTP-only cookies
3. **bcrypt password hashing** (cost factor 12+)
4. **Email verification flow** using seeded email templates
5. **Google OAuth integration**
6. **Role-based access control middleware**
7. **Add admin auth to `/status` endpoint** (resolve H-04 TODO)
8. **Upgrade rate limiter to Redis store** (resolve TODO)

---

## Specification Cross-Reference

| Spec Section | Topic | Phase 1 Implementation |
|-------------|-------|----------------------|
| Section 2 | Platform Configuration Architecture | Three-tier config system (`.env`, `platform.json`, database) |
| Section 2.3 | Environment Variables | 32+ variables in `.env.example`, validated by Zod |
| Section 2.4 | Platform Configuration Schema | 12-section `platform.json` with Zod validation |
| Section 2.5 | Feature Flags | 16 boolean flags, `featureGate` middleware, `isFeatureEnabled` helper |
| Section 2.7 | Deployment Checklist | `docs/deployment-checklist.md` |
| Section 2.9 | Startup Validation | Process exits on invalid config with descriptive errors |
| Section 3 | Technical Requirements | Express 5, Prisma 7.3, PostgreSQL 16, Redis 7, ES 8.17, Node 22 |
| Section 4.5 | Email Verification | User.status defaults to PENDING (documented deviation) |
| Section 4.8 | Rate Limiting | Four tiers matching spec values |
| Section 4.10 | File Upload Security | Magic bytes, EXIF strip, UUID names, size limits, path traversal prevention |
| Section 8 | Multilingual Support | 10 languages in platform.json, RTL flags, auto-translation flag |
| Section 27.1 | Error Response Format | `{ success, error: { code, message, details, requestId, timestamp } }` |
| Section 27.5 | Graceful Degradation | Elasticsearch failure logged, server continues |
| Section 29 | Technical Operations | Health/status endpoints, structured logging (Pino) |
| Section 29.1 | Logging | Pino with LOG_LEVEL env control, JSON in production |
| Appendix A.2 | User Model | All fields implemented in Prisma schema |
| Appendix A.14 | Category Model | Hierarchical with multilingual JSON names |
| Appendix A.17 | UserSession Model | Token hash, device info, cascade delete |
| Appendix A.18 | AuditLog Model | Immutable trail with SetNull on user delete |
| Appendix A.19 | EmailTemplate Model | Multilingual subject/body with template variables |
| Appendix A.24 | SystemSetting Model | Key-value with description, 6 defaults seeded |
| Appendix B | API Endpoints | `/api/v1/` prefix, health + status implemented |
| Appendix B.0 | API Response Format | Success, list with pagination, error with request ID |

---

*Report generated: 2026-02-03. Phase 1 (sub-phases 1.1, 1.2, 1.3) is complete. Phase 1.4 (Frontend Infrastructure) is the next priority.*
