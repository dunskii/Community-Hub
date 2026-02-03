# Phase 1.3: Backend Infrastructure - Study Notes

## Overview

Phase 1.3 establishes the server-side technical foundation for the Community Hub platform. It does NOT deliver user-facing features -- it sets up core systems that all subsequent phases depend on: database, caching, file storage, API framework, search, and logging.

**Status:** Not started (0/9 tasks complete)
**Dependencies:** Phase 1.1 (Dev Environment) and 1.2 (Configuration Architecture) -- both 100% complete
**Blocks:** Phase 1.5 (Security), 1.6 (Email), Phase 2 (Auth & Users), Phase 4+ (all features)
**Milestone:** "API Responds" -- `GET /api/v1/health` returns 200 with DB/Redis/ES status

---

## 9 Tasks Breakdown

### Task 1.3.1: Set up PostgreSQL database

**Files to create:**
- `packages/backend/src/db/index.ts` -- Prisma client singleton
- `packages/backend/src/db/seed.ts` -- Database seeder
- `packages/backend/prisma/schema.prisma` -- Initial schema

**Initial models (from Appendix A):** User (A.2), Category (A.14), SystemSetting (A.24), AuditLog (A.18), EmailTemplate (A.19), UserSession (A.17)

**Seed data:**
- Default business categories: Restaurant, Retail, Services, Health, Entertainment, Education, Professional
- Default event categories: Music, Community, Sports, Markets, Workshop
- System settings: `maintenance_mode: false`, `registration_enabled: true`
- Admin user account
- Email template stubs: welcome, verify_email, password_reset

**Success criteria:** `pnpm prisma migrate dev` creates tables; `pnpm prisma db seed` populates initial data.

---

### Task 1.3.2: Install Prisma ORM >= 7.3.0

**Dependencies to install in `packages/backend`:**
- `prisma` >= 7.3.0 (devDependency)
- `@prisma/client` >= 7.3.0 (dependency)

**Version verification:** Startup check that reads Prisma version and fails if below 7.3.0. Add CI check as well.

**Success criteria:** `npx prisma --version` outputs >= 7.3.0; CI verifies this.

---

### Task 1.3.3: Create initial database schema and migrations

**Prisma schema models for Phase 1:**

```prisma
model User {
  id                    String     @id @default(uuid())
  email                 String     @unique
  passwordHash          String     @map("password_hash")
  displayName           String     @map("display_name")
  profilePhoto          String?    @map("profile_photo")
  languagePreference    String     @default("en") @map("language_preference")
  suburb                String?
  bio                   String?    @db.VarChar(500)
  interests             String[]
  notificationPreferences Json?    @map("notification_preferences")
  role                  UserRole   @default(COMMUNITY)
  status                UserStatus @default(ACTIVE)
  emailVerified         Boolean    @default(false) @map("email_verified")
  createdAt             DateTime   @default(now()) @map("created_at")
  updatedAt             DateTime   @updatedAt @map("updated_at")
  lastLogin             DateTime?  @map("last_login")

  sessions              UserSession[]
  auditLogs             AuditLog[]

  @@map("users")
}

enum UserRole {
  COMMUNITY
  BUSINESS_OWNER
  MODERATOR
  ADMIN
  SUPER_ADMIN
}

enum UserStatus {
  ACTIVE
  SUSPENDED
  PENDING
  DELETED
}
```

Plus: Category, SystemSetting, AuditLog, EmailTemplate, UserSession models.

**Category model notes:**
- `name` field is JSON multilingual: `{"en": "Restaurant", "ar": "..."}`
- `type` enum: business, event, deal, notice, group
- Hierarchical via `parent_id` self-reference
- `slug` field for URL-safe names

**Success criteria:** `prisma migrate dev --name init` generates and applies migration; `prisma generate` produces typed client.

---

### Task 1.3.4: Set up Redis for caching and sessions

**Files to create:**
- `packages/backend/src/cache/redis-client.ts` -- Redis connection
- `packages/backend/src/cache/cache-service.ts` -- Generic cache get/set/invalidate
- `packages/backend/src/cache/rate-limit-store.ts` -- Redis store for rate limiting

**Dependency:** `ioredis` (mature, TypeScript-first Redis client)

**Features:**
- Connection with retry logic
- Generic `get<T>(key)`, `set(key, value, ttlSeconds)`, `del(key)` methods
- Key prefix by environment (`dev:`, `staging:`, `prod:`)
- Health check method

**Success criteria:** Cache service stores and retrieves values; handles Redis being temporarily unavailable.

---

### Task 1.3.5: Configure local media storage

**Files to create:**
- `packages/backend/src/storage/storage-interface.ts` -- Storage abstraction interface
- `packages/backend/src/storage/local-storage.ts` -- File storage service
- `packages/backend/src/storage/image-processor.ts` -- Sharp-based image processing

**Dependencies:** `sharp` (image processing), `uuid` (filename generation)

**Features per Spec Section 4.10:**
- UUID filename generation (never use original filename)
- MIME validation via magic bytes
- Accepted types: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`
- Size limits: 5MB images, 10MB documents
- EXIF metadata stripping
- Path traversal rejection (reject `..`, `/`, `\`)
- WebP conversion for optimized delivery
- Thumbnail generation (150px, 300px, 600px widths)

**Storage path:** Read from `STORAGE_PATH` env variable.

**Success criteria:** Upload image -> verify UUID filename, EXIF stripped, thumbnails generated.

---

### Task 1.3.6: Implement RESTful API scaffolding

**Files to create:**
- `packages/backend/src/index.ts` -- Server entry point (replace placeholder)
- `packages/backend/src/app.ts` -- Express app setup
- `packages/backend/src/routes/index.ts` -- Route aggregator
- `packages/backend/src/routes/health.ts` -- Health/status endpoints
- `packages/backend/src/middleware/error-handler.ts` -- Global error handler
- `packages/backend/src/middleware/request-logger.ts` -- Request logging
- `packages/backend/src/middleware/cors.ts` -- CORS configuration
- `packages/backend/src/middleware/not-found.ts` -- 404 handler
- `packages/backend/src/utils/api-response.ts` -- Standardized response helpers
- `packages/backend/src/utils/api-error.ts` -- Custom API error class
- `packages/backend/src/types/express.d.ts` -- Express type augmentation

**API response format (Spec Section B.0):**
```json
// Success
{ "success": true, "data": { ... } }

// List with pagination
{ "success": true, "data": [...], "pagination": { "page": 1, "limit": 20, "total": 156, "totalPages": 8 } }

// Error (Spec Section 27.1)
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...], "requestId": "req_abc123xyz", "timestamp": "2026-01-15T10:30:00Z" } }
```

**Health endpoints:**
- `GET /api/v1/health` -- returns `{ status: "ok", timestamp, uptime }`
- `GET /api/v1/status` -- returns service status (DB, Redis, Elasticsearch connectivity)

**Success criteria:** Server starts; health returns 200; invalid routes return 404; unhandled errors return 500 with request ID.

---

### Task 1.3.7: Set up Elasticsearch for search

**Files to create:**
- `packages/backend/src/search/elasticsearch-client.ts` -- ES connection
- `packages/backend/src/search/index-manager.ts` -- Index creation and mapping
- `packages/backend/src/search/search-service.ts` -- Generic search interface

**Dependency:** `@elastic/elasticsearch` (official client)

**Features:**
- Connection with health check
- Index creation for `businesses` (populated in Phase 4)
- Multilingual analyzer configuration (10 languages)
- Graceful degradation: if ES is down, log warning and fall back to null (PostgreSQL full-text search fallback per Spec Section 27.5)

**Success criteria:** ES client connects; index creation succeeds; health check reports ES status.

---

### Task 1.3.8: Implement API versioning strategy

**File to modify:** `packages/backend/src/routes/index.ts`

All routes mounted under `/api/v1/`. Router structure supports future `/api/v2/` by adding a new version router. Version is extracted from URL, not headers.

**Success criteria:** All endpoints under `/api/v1/`; `/api/v2/` returns 404 with "API version not found" message.

---

### Task 1.3.9: Set up logging infrastructure

**File to create:** `packages/backend/src/utils/logger.ts`

**Dependencies:** `pino` (already installed), `pino-pretty` (already installed as devDep)

**Log levels (Spec Section 29.1):** ERROR, WARN, INFO, DEBUG
**Log level controlled by:** `LOG_LEVEL` env variable

**What to log:**
- All HTTP requests (method, path, status, duration, request ID)
- Authentication events (login, logout, failed attempts)
- Errors with stack traces
- Configuration warnings
- Database query warnings (slow queries > 100ms)

**Format:** Structured JSON in production, pretty-printed in development.

**Success criteria:** Requests produce structured log entries; log level respects `LOG_LEVEL` env var.

---

## Testing Requirements

- Unit tests for cache service (get, set, delete, TTL expiry)
- Unit tests for storage service (UUID generation, MIME validation, path traversal rejection)
- Unit tests for API response helpers (success format, error format, pagination)
- Unit tests for API error class (error codes, HTTP status mapping)
- Integration test: health endpoint returns 200 with service status
- Integration test: Prisma client connects and queries
- Integration test: Redis client connects and performs operations

---

## Key Specification References

| Topic | Spec Section |
|-------|-------------|
| Technical stack | Section 3 |
| Security & privacy | Section 4 |
| Data models (Appendix A) | A.2 User, A.14 Category, A.17 UserSession, A.18 AuditLog, A.19 EmailTemplate, A.24 SystemSetting |
| API endpoints (Appendix B) | B.0 Response format, B.1 Auth, all endpoints |
| Error handling | Section 27 |
| Data management | Section 28 |
| Technical operations | Section 29 |
| Rate limiting | Section 4.8 |
| File upload security | Section 4.10 |
| Input validation | Section 4.9 |

---

## Rate Limits (Spec Section 4.8)

| Category | Limit | Window |
|----------|-------|--------|
| Login/register | 10 req | 15 min |
| Password reset | 3 req | 1 hour |
| Authenticated API | 100 req | 1 min |
| Anonymous API | 30 req | 1 min |
| Search | 30 req | 1 min |
| File uploads | 20 uploads | 1 hour |
| Review submissions | 5 reviews | 24 hours |
| New conversations | 10 conversations | 24 hours |

---

## Data Security Requirements

- **Passwords:** bcrypt with cost factor 12+
- **Encryption at rest:** AES-256
- **Transport:** TLS 1.3
- **SQL injection:** Prevented via Prisma parameterized queries
- **Rich text:** DOMPurify allowlist (p, br, strong, em, ul, ol, li, a)
- **File uploads:** MIME magic bytes validation, UUID filenames, EXIF stripping
- **JWT tokens:** RS256, 15-min access / 7-day refresh / 30-day remember-me

---

## Existing Infrastructure (Phase 1.1 & 1.2 Complete)

### Already installed packages
- `express` ^5.1.0, `pino` ^9.6.0, `zod` ^3.24.0 (backend)
- `react` ^19.0.0, `react-dom` ^19.0.0 (frontend)
- TypeScript, ESLint 9, Prettier, Vitest across all packages

### Already implemented
- Monorepo with pnpm workspaces (3 packages: backend, frontend, shared)
- TypeScript strict mode configuration
- Platform config schema (Zod validation, 200+ lines)
- Environment variable validation (32 vars, Zod-based)
- Platform config loader with environment-specific overrides
- Deep merge utility for config overrides
- 16 feature flags with Express middleware and React hook
- Docker Compose: PostgreSQL 16, Redis 7, Elasticsearch 8.17.0
- Database init script (uuid-ossp, pg_trgm, unaccent extensions)
- 42+ passing tests

### Docker services available
- **PostgreSQL 16:** Port 5433, user `community_hub`, DB `community_hub`
- **Redis 7:** Port 6379, password required
- **Elasticsearch 8.17.0:** Port 9200, single-node, 512MB heap

### Backend entry point (current placeholder)
```typescript
// packages/backend/src/index.ts
// Backend entry point - server setup will be implemented in Phase 1.3
export {};
```

---

## New Dependencies to Install

| Package | Where | Purpose |
|---------|-------|---------|
| `prisma` >= 7.3.0 | backend (devDep) | Prisma CLI and migration tool |
| `@prisma/client` >= 7.3.0 | backend (dep) | Database ORM client |
| `ioredis` | backend (dep) | Redis client |
| `sharp` | backend (dep) | Image processing |
| `uuid` | backend (dep) | UUID filename generation |
| `@elastic/elasticsearch` | backend (dep) | Elasticsearch client |
| `@types/uuid` | backend (devDep) | UUID type definitions |

**Note:** `pino` and `pino-pretty` are already installed.

---

## Files to Create (40+ new files)

```
packages/backend/
  prisma/
    schema.prisma                          # Prisma schema
    migrations/                            # Generated migrations
  src/
    index.ts                               # Server entry point (replace placeholder)
    app.ts                                 # Express app setup
    db/
      index.ts                             # Prisma client singleton
      seed.ts                              # Database seeder
    cache/
      redis-client.ts                      # Redis connection
      cache-service.ts                     # Generic cache service
      rate-limit-store.ts                  # Rate limiting store
    storage/
      storage-interface.ts                 # Storage abstraction
      local-storage.ts                     # File storage service
      image-processor.ts                   # Sharp image processing
    search/
      elasticsearch-client.ts              # ES connection
      index-manager.ts                     # Index management
      search-service.ts                    # Search interface
    routes/
      index.ts                             # Route aggregator with versioning
      health.ts                            # Health/status endpoints
    middleware/
      error-handler.ts                     # Global error handler
      request-logger.ts                    # HTTP request logging
      cors.ts                              # CORS configuration
      not-found.ts                         # 404 handler
    utils/
      api-response.ts                      # Standardized response helpers
      api-error.ts                         # Custom API error class
      logger.ts                            # Pino logger setup
    types/
      express.d.ts                         # Express type augmentation
```

---

## Location-Agnostic Considerations

- Database connection string from `.env` (`DATABASE_URL`)
- Redis URL from `.env` (`REDIS_URL`)
- Elasticsearch URL from `.env` (`ELASTICSEARCH_URL`)
- Storage path from `.env` (`STORAGE_PATH`)
- No suburb names, coordinates, or branding in backend code
- Categories seeded with multilingual JSON names
- All location data accessed via platform config loader (already implemented)

---

## Multilingual Considerations

- Category `name` field stored as JSON: `{"en": "Restaurant", "ar": "...", ...}`
- Email template `subject`, `body_html`, `body_text` stored as multilingual JSON
- Survey fields stored as multilingual JSON
- User `languagePreference` field defaults to "en"
- Elasticsearch multilingual analyzer configuration for 10 languages

---

## Accessibility Considerations

- API error responses must include clear, descriptive error messages
- Health endpoints provide machine-readable status for monitoring
- Response format is consistent and predictable for screen reader users consuming API data
- Rate limit responses include `Retry-After` header

---

## Implementation Order (Recommended)

1. **1.3.9** - Logging (needed by everything else, pino already installed)
2. **1.3.2** - Install Prisma ORM
3. **1.3.1 + 1.3.3** - PostgreSQL schema and migrations
4. **1.3.4** - Redis caching and sessions
5. **1.3.6 + 1.3.8** - API scaffolding and versioning
6. **1.3.5** - Media storage
7. **1.3.7** - Elasticsearch

This order ensures each component can be tested as it's built, with logging available from the start.
