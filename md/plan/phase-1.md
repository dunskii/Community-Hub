# Phase 1: Foundation & Core Infrastructure -- Implementation Plan

## Document Metadata

- **Specification Version:** 2.0
- **Plan Created:** 2 February 2026
- **Phase Duration:** January 2026 -- July 2026
- **Total Tasks:** 59 across 8 subsections
- **Spec References:** Sections 2-8, 26, 27, 29, Appendix A, Appendix B
- **Current Status:** Not Started (0/59 tasks complete)

---

## Technical Architecture Decisions

### Decision 1: Monorepo Structure -- pnpm Workspaces

**Decision:** pnpm with workspace protocol.

**Rationale:** pnpm provides strict dependency isolation (phantom dependency prevention), disk space efficiency through content-addressable storage, and native workspace support. The project needs shared types between frontend and backend, making a monorepo essential. pnpm outperforms npm on install speed and is more mature than Yarn Berry for workspaces.

**Structure:**
```
community-hub/
  packages/
    backend/          # Express + Prisma API server
    frontend/         # React + Vite SPA
    shared/           # TypeScript types, validation schemas, constants
  config/             # platform.json, platform.development.json, platform.staging.json
  docker/             # Docker Compose, Dockerfiles
  .github/            # GitHub Actions workflows
  docs/               # Migrated from Docs/
```

### Decision 2: Backend Framework -- Express.js with TypeScript

**Decision:** Express.js (not NestJS, not Fastify).

**Rationale:** Express has the largest ecosystem for middleware (helmet, cors, express-rate-limit, multer), the broadest community knowledge, and the most straightforward integration with Prisma. NestJS adds decorator complexity and an opinionated module system that is heavier than needed for a RESTful API. Fastify's speed advantage is marginal for this scale (500 businesses, 10K users). Express with TypeScript provides sufficient structure through explicit typing without framework overhead.

### Decision 3: Frontend -- React + Vite + React Query + Context

**Decision:** Vite for build tooling, TanStack React Query for server state, React Context + useReducer for UI state.

**Rationale:** Vite provides fast HMR, native ESM, and built-in code splitting. React Query handles caching, background refetching, and optimistic updates for API data -- eliminating the need for Redux. React Context with useReducer handles the small amount of pure UI state (language, theme, sidebar open). This avoids the boilerplate of Redux while providing excellent dev tools through React Query DevTools.

### Decision 4: CSS Approach -- Tailwind CSS

**Decision:** Tailwind CSS v4 with a custom theme from `config/platform.json`.

**Rationale:** Tailwind enforces utility-first composition, produces small bundles through purging, has excellent RTL support via the `rtl:` variant, and maps naturally to design tokens. The specification's colour palette, typography, spacing, and component specs all translate directly to Tailwind configuration. Tailwind v4 uses a CSS-first configuration approach and works natively with Vite.

### Decision 5: Testing Framework -- Vitest

**Decision:** Vitest for unit and integration tests, Playwright for E2E.

**Rationale:** Vitest is Vite-native, shares the same transform pipeline, supports TypeScript out of the box, is Jest-compatible in API, and is significantly faster than Jest for Vite projects. Playwright handles E2E tests with multi-browser support matching the specification's testing matrix (Chrome, Firefox, Safari, Edge).

### Decision 6: i18n Library -- react-i18next

**Decision:** i18next + react-i18next with JSON namespace files.

**Rationale:** i18next is the most mature i18n library with built-in pluralization, interpolation, context-aware translations, namespace splitting, lazy loading, and RTL detection. It supports the exact JSON-per-language file structure described in the specification. The `i18next-browser-languagedetector` plugin handles browser preference detection, and `i18next-http-backend` enables lazy loading of translation files.

---

## Implementation Sequence Overview

The 8 subsections must be implemented in a specific order due to dependencies:

```
Step 1: Development Environment (1.1)
   |
   v
Step 2: Configuration Architecture (1.2)  -- depends on 1.1
   |
   v
Step 3: Backend Infrastructure (1.3)       -- depends on 1.1, 1.2
   |
   +---> Step 4: Frontend Infrastructure (1.4)  -- depends on 1.1, 1.2
   |
   v
Step 5: Security Foundation (1.5)          -- depends on 1.3
   |
   +---> Step 6: Email Service (1.6)       -- depends on 1.3, 1.5
   |
   +---> Step 7: Maps Integration (1.7)    -- depends on 1.4
   |
   v
Step 8: i18n Foundation (1.8)              -- depends on 1.4
```

Steps 3 and 4 can proceed in parallel. Steps 6, 7, and 8 can proceed in parallel once their dependencies are met.

---

## Subsection 1.1: Development Environment (10 tasks)

### Prerequisites
- GitHub repository exists (current repo)
- pnpm installed globally
- Docker Desktop installed
- Node.js >= 20 LTS installed

### Implementation Order

#### Task 1.1.1: Set up monorepo structure

**Files to create:**
```
pnpm-workspace.yaml
package.json                          # Root workspace config
packages/backend/package.json
packages/backend/tsconfig.json
packages/frontend/package.json
packages/frontend/tsconfig.json
packages/shared/package.json
packages/shared/tsconfig.json
packages/shared/src/index.ts
tsconfig.base.json                    # Shared TS config
.npmrc                                # pnpm configuration
.nvmrc                                # Node.js version pinning
```

**Key content for `pnpm-workspace.yaml`:**
```yaml
packages:
  - 'packages/*'
```

**Key content for root `package.json`:**
```json
{
  "name": "community-hub",
  "private": true,
  "scripts": {
    "dev": "pnpm --parallel --filter './packages/*' dev",
    "build": "pnpm --filter @community-hub/shared build && pnpm --parallel --filter './packages/{backend,frontend}' build",
    "test": "pnpm --parallel --filter './packages/*' test",
    "lint": "pnpm --parallel --filter './packages/*' lint",
    "format": "prettier --write .",
    "typecheck": "pnpm --parallel --filter './packages/*' typecheck"
  },
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=9.0.0"
  }
}
```

**Success criteria:** `pnpm install` completes without errors; each package can reference `@community-hub/shared`.

#### Task 1.1.2: Configure Git repository and branching strategy

**Files to create:**
```
.gitignore                            # Comprehensive ignore list
.gitattributes                        # Line ending normalization
```

**`.gitignore` must include:**
```
node_modules/
dist/
.env
.env.local
.env.*.local
*.log
.DS_Store
coverage/
.turbo/
packages/backend/prisma/*.db
packages/backend/uploads/
```

**Branching strategy:**
- `main` -- production-ready code, protected
- `develop` -- integration branch
- `feature/*` -- feature branches from `develop`
- `fix/*` -- bug fix branches
- `release/*` -- release preparation

**Success criteria:** `.gitignore` prevents secrets and build artifacts from being committed; branch protection rules configured on GitHub.

#### Task 1.1.3: Configure CI/CD pipelines (GitHub Actions)

**Files to create:**
```
.github/workflows/ci.yml             # PR validation (lint, test, typecheck, build)
.github/workflows/security.yml       # Dependency scanning
.github/dependabot.yml               # Automated dependency updates
```

**CI workflow stages:**
1. Install dependencies (`pnpm install --frozen-lockfile`)
2. Lint (`pnpm lint`)
3. Type check (`pnpm typecheck`)
4. Unit tests with coverage (`pnpm test -- --coverage`)
5. Build all packages (`pnpm build`)
6. Accessibility checks (axe-core on built frontend, when applicable)

**Success criteria:** PRs cannot merge without passing CI; coverage report generated.

#### Task 1.1.4: Set up development environment (Docker)

**Files to create:**
```
docker/docker-compose.yml            # PostgreSQL, Redis, Elasticsearch
docker/docker-compose.dev.yml        # Dev overrides (volumes, ports)
docker/.env.docker                   # Docker-specific env vars
docker/init-db.sh                    # Database initialization script
```

**Docker Compose services:**
- `postgres` -- PostgreSQL 16, port 5432, persistent volume
- `redis` -- Redis 7, port 6379
- `elasticsearch` -- Elasticsearch 8.x, port 9200
- `mailhog` -- Email testing (catches all outbound email), port 1025/8025

**Success criteria:** `docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up -d` starts all services; all ports accessible from host.

#### Task 1.1.5: Set up staging environment

**Files to create:**
```
docker/docker-compose.staging.yml    # Staging overrides
```

**Note:** Staging mirrors production but with reduced resources. Full staging deployment on DigitalOcean is deferred to Phase 19. For now, the staging compose file enables local staging-mode testing.

**Success criteria:** Staging compose can start with `NODE_ENV=staging`.

#### Task 1.1.6: Set up production environment

**Files to create:**
```
docker/docker-compose.prod.yml       # Production overrides (no debug, no mailhog)
```

**Note:** Same as staging -- actual production deployment is Phase 19. This file defines production-appropriate settings for local testing.

**Success criteria:** Production compose can start with `NODE_ENV=production`.

#### Task 1.1.7: Configure ESLint

**Files to create:**
```
eslint.config.js                      # Flat config (ESLint 9+)
packages/backend/eslint.config.js     # Backend-specific rules
packages/frontend/eslint.config.js    # Frontend-specific rules (react plugin)
```

**Key rules:**
- `@typescript-eslint/strict-type-checked` preset
- `eslint-plugin-react` with hooks rules
- `eslint-plugin-jsx-a11y` for accessibility linting
- `eslint-plugin-import` for import ordering
- No unused variables, no `any` type, explicit return types on exports

**Success criteria:** `pnpm lint` passes with zero warnings on initial empty project.

#### Task 1.1.8: Configure Prettier

**Files to create:**
```
.prettierrc.json
.prettierignore
```

**Configuration:**
```json
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "endOfLine": "lf"
}
```

**Success criteria:** `pnpm format` reformats all files consistently; no conflicts between ESLint and Prettier.

#### Task 1.1.9: Configure TypeScript

**Files to create (already listed in 1.1.1):**
```
tsconfig.base.json                    # Shared strict settings
packages/backend/tsconfig.json        # Extends base, Node.js target
packages/frontend/tsconfig.json       # Extends base, DOM types
packages/shared/tsconfig.json         # Extends base, declaration emit
```

**`tsconfig.base.json` key settings:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "moduleResolution": "bundler",
    "target": "ES2022",
    "module": "ES2022"
  }
}
```

**Success criteria:** `pnpm typecheck` passes; all packages can import from `@community-hub/shared` with full type resolution.

#### Task 1.1.10: Set up testing framework (Vitest)

**Files to create:**
```
packages/backend/vitest.config.ts
packages/frontend/vitest.config.ts
packages/shared/vitest.config.ts
packages/backend/src/__tests__/setup.ts      # Test setup (DB mocking)
packages/frontend/src/__tests__/setup.ts     # Test setup (jsdom, RTL)
```

**Dependencies:**
- `vitest` -- test runner
- `@testing-library/react` -- component testing
- `@testing-library/jest-dom` -- DOM matchers
- `@testing-library/user-event` -- user interaction simulation
- `msw` -- API mocking (Mock Service Worker)
- `@playwright/test` -- E2E tests (installed but not configured until needed)

**Success criteria:** `pnpm test` runs a trivial passing test in each package; coverage thresholds configured at 80%.

### Testing Requirements for 1.1
- Verify `pnpm install` from clean state succeeds
- Verify `pnpm build` produces artifacts for all packages
- Verify `pnpm test` runs and passes
- Verify `pnpm lint` runs without errors
- Verify Docker services start and are accessible
- Verify CI workflow runs on a test PR

---

## Subsection 1.2: Configuration Architecture (6 tasks)

### Prerequisites
- Subsection 1.1 complete (monorepo structure exists)

### Implementation Order

#### Task 1.2.1: Create `.env.example` template

**Files to create:**
```
.env.example
```

**Content must include every variable from Spec Section 2.3:**
- Database: `DATABASE_URL`, `REDIS_URL`, `ELASTICSEARCH_URL`
- Secrets: `SESSION_SECRET`, `ENCRYPTION_KEY`
- API Keys: `MAPBOX_ACCESS_TOKEN`, `GOOGLE_TRANSLATE_API_KEY`, `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `TWILIO_WHATSAPP_NUMBER`, `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`, `GOOGLE_BUSINESS_API_KEY`
- Storage: `STORAGE_PATH`, `STORAGE_MAX_SIZE_GB`, `STORAGE_BACKUP_PATH`
- Cloudflare: `CLOUDFLARE_ZONE_ID`, `CLOUDFLARE_API_TOKEN`, `CDN_URL`, `CDN_ENABLED`
- Environment: `NODE_ENV`, `LOG_LEVEL`, `ENABLE_DEBUG_MODE`
- Optional: `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`, `ELASTICSEARCH_API_KEY`

All values must be placeholder comments, never real credentials.

**Success criteria:** `.env.example` is committed; `.env` is in `.gitignore`; every variable from the spec is present.

#### Task 1.2.2: Implement `config/platform.json` schema and loader

**Files to create:**
```
config/platform.json                                    # Full schema from Spec Section 2.4
config/platform.development.json                        # Dev overrides (smaller limits, debug)
config/platform.staging.json                            # Staging overrides
packages/shared/src/config/platform-schema.ts           # Zod validation schema
packages/shared/src/config/types.ts                     # PlatformConfig TypeScript types
packages/backend/src/config/platform-loader.ts          # Node.js config loader
packages/frontend/src/config/platform-loader.ts         # Browser config loader (fetched at init)
```

**The `platform.json` file must contain the complete schema from Spec Section 2.4**, including all sections: `platform`, `location`, `branding`, `partners`, `features`, `multilingual`, `seo`, `contact`, `legal`, `limits`, `analytics`.

**The Zod schema validates:**
- `location.suburbName` -- non-empty string
- `location.coordinates.latitude` -- number between -90 and 90
- `location.coordinates.longitude` -- number between -180 and 180
- `location.timezone` -- valid IANA timezone string
- `branding.platformName` -- non-empty string
- `branding.colors.primary` -- valid hex colour regex
- `contact.supportEmail` -- valid email format

**Success criteria:** Importing the config loader in both backend and frontend resolves and validates the config; invalid configs cause a startup failure with a descriptive error.

#### Task 1.2.3: Implement environment-specific config overrides

**Files to modify:**
```
packages/backend/src/config/platform-loader.ts          # Deep-merge logic
```

**Logic:** Load `config/platform.json` as base, then deep-merge `config/platform.{NODE_ENV}.json` if it exists. The merge must handle nested objects (e.g., overriding a single colour without replacing the entire `branding.colors` object).

**Success criteria:** Setting `NODE_ENV=development` causes development overrides to apply; setting `NODE_ENV=production` uses base config only.

#### Task 1.2.4: Create configuration validation on startup

**Files to create:**
```
packages/backend/src/config/validate.ts                 # Startup validation runner
packages/backend/src/config/env-validate.ts             # .env validation with Zod
```

**Behaviour per Spec Section 2.9:**
- Missing required field: process exits with code 1 and clear error message
- Invalid value: process exits with code 1 and validation error details
- Missing optional field: use default value, log warning at INFO level

**Both `.env` and `platform.json` are validated before the server starts.**

**Success criteria:** Server refuses to start with missing `DATABASE_URL`; server logs warnings for missing optional fields.

#### Task 1.2.5: Implement feature flags system from config

**Files to create:**
```
packages/shared/src/config/feature-flags.ts             # Feature flag types and helpers
packages/backend/src/middleware/feature-gate.ts          # Express middleware to gate routes
packages/frontend/src/hooks/useFeatureFlag.ts            # React hook for feature checks
```

**Feature flags from Spec Section 2.5:** `businessDirectory`, `eventsCalendar`, `communityNoticeboard`, `communityGroups`, `localHistory`, `messaging`, `dealsHub`, `b2bNetworking`, `emergencyAlerts`, `socialFeedAggregation`, `surveySystem`, `reviewsAndRatings`, `multilingual`, `pwaInstallation`, `smsAlerts`, `whatsappAlerts`.

**Backend usage:** Middleware wraps route groups -- if a feature flag is `false`, all routes for that feature return 404.
**Frontend usage:** `useFeatureFlag('dealsHub')` returns boolean; components conditionally render.

**Success criteria:** Disabling `eventsCalendar` in config hides all event routes and UI elements.

#### Task 1.2.6: Create deployment checklist documentation

**Files to create:**
```
docs/deployment-checklist.md                            # From Spec Section 2.7
```

**Content:** The complete checklist from Spec Section 2.7 (Environment Setup, Platform Configuration, Assets, Database Seeding, Cloudflare/DNS/SSL, Testing).

**Success criteria:** Document exists and covers all items from the spec.

### Testing Requirements for 1.2
- Unit tests for Zod schema validation (valid config passes, invalid configs produce specific errors)
- Unit tests for deep-merge logic (nested overrides, array replacement)
- Unit tests for feature flag middleware (gated routes return 404)
- Integration test: server startup with valid config succeeds
- Integration test: server startup with invalid config fails with descriptive message

---

## Subsection 1.3: Backend Infrastructure (9 tasks)

### Prerequisites
- Subsection 1.1 complete (monorepo, TypeScript configured)
- Subsection 1.2 complete (config loader, `.env` template)

### Implementation Order

#### Task 1.3.1: Set up PostgreSQL database

**Files to create:**
```
packages/backend/src/db/index.ts                        # Database connection (Prisma client)
packages/backend/src/db/seed.ts                         # Database seeder
packages/backend/prisma/schema.prisma                   # Initial Prisma schema
```

**Initial schema must include from Appendix A:** User (A.2), Category (A.14), SystemSetting (A.24), AuditLog (A.18), EmailTemplate (A.19). Additional models (Business, Event, etc.) will be added in later phases.

**Seed data:**
- Default categories (business: Restaurant, Retail, Services, Health, Entertainment, Education, Professional; event: Music, Community, Sports, Markets, Workshop)
- System settings defaults (`maintenance_mode: false`, `registration_enabled: true`)
- Admin user account
- Email template stubs (welcome, verify_email, password_reset)

**Success criteria:** `pnpm prisma migrate dev` creates tables; `pnpm prisma db seed` populates initial data.

#### Task 1.3.2: Install Prisma ORM >= 7.3.0 and verify version

**Dependencies to install in `packages/backend`:**
```
prisma >= 7.3.0
@prisma/client >= 7.3.0
```

**Version verification:** Add a startup check that reads `prisma --version` and fails if below 7.3.0. Add to CI as well.

**Success criteria:** `npx prisma --version` outputs >= 7.3.0; CI verifies this.

#### Task 1.3.3: Create initial database schema and migrations

**Files to create:**
```
packages/backend/prisma/schema.prisma                   # Full Phase 1 schema
packages/backend/prisma/migrations/                     # Generated migration files
```

**Phase 1 models in Prisma schema:**

```prisma
model User {
  id                    String   @id @default(uuid())
  email                 String   @unique
  passwordHash          String   @map("password_hash")
  displayName           String   @map("display_name")
  profilePhoto          String?  @map("profile_photo")
  languagePreference    String   @default("en") @map("language_preference")
  suburb                String?
  bio                   String?  @db.VarChar(500)
  interests             String[]
  notificationPreferences Json?  @map("notification_preferences")
  role                  UserRole @default(COMMUNITY)
  status                UserStatus @default(ACTIVE)
  emailVerified         Boolean  @default(false) @map("email_verified")
  createdAt             DateTime @default(now()) @map("created_at")
  updatedAt             DateTime @updatedAt @map("updated_at")
  lastLogin             DateTime? @map("last_login")

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

(Plus Category, SystemSetting, AuditLog, EmailTemplate, UserSession models.)

**Success criteria:** `prisma migrate dev --name init` generates and applies migration; `prisma generate` produces client with full types.

#### Task 1.3.4: Set up Redis for caching and sessions

**Files to create:**
```
packages/backend/src/cache/redis-client.ts              # Redis connection
packages/backend/src/cache/cache-service.ts             # Generic cache get/set/invalidate
packages/backend/src/cache/rate-limit-store.ts          # Redis store for rate limiting
```

**Dependencies:** `ioredis` (mature, TypeScript-first Redis client).

**Features:**
- Connection with retry logic
- Generic `get<T>(key)`, `set(key, value, ttlSeconds)`, `del(key)` methods
- Key prefix by environment (`dev:`, `staging:`, `prod:`)
- Health check method

**Success criteria:** Cache service can store and retrieve values; connection handles Redis being temporarily unavailable.

#### Task 1.3.5: Configure local media storage

**Files to create:**
```
packages/backend/src/storage/local-storage.ts           # File storage service
packages/backend/src/storage/storage-interface.ts       # Storage abstraction interface
packages/backend/src/storage/image-processor.ts         # Sharp-based image processing
```

**Dependencies:** `sharp` (image resizing, WebP conversion, EXIF stripping), `uuid` (filename generation).

**Features per Spec Section 4.10:**
- UUID filename generation (never use original filename)
- MIME validation via magic bytes
- Accepted types: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`
- Size limits: 5MB images, 10MB documents
- EXIF metadata stripping
- Path traversal rejection
- WebP conversion for optimized delivery
- Thumbnail generation (150px, 300px, 600px widths)

**Storage path:** Read from `STORAGE_PATH` env variable.

**Success criteria:** Upload an image, verify UUID filename, verify EXIF stripped, verify thumbnails generated.

#### Task 1.3.6: Implement RESTful API scaffolding

**Files to create:**
```
packages/backend/src/index.ts                           # Server entry point
packages/backend/src/app.ts                             # Express app setup
packages/backend/src/routes/index.ts                    # Route aggregator
packages/backend/src/routes/health.ts                   # GET /health, GET /status
packages/backend/src/middleware/error-handler.ts         # Global error handler
packages/backend/src/middleware/request-logger.ts        # Request logging
packages/backend/src/middleware/cors.ts                  # CORS configuration
packages/backend/src/middleware/not-found.ts             # 404 handler
packages/backend/src/utils/api-response.ts              # Standardized response helpers
packages/backend/src/utils/api-error.ts                 # Custom API error class
packages/backend/src/types/express.d.ts                 # Express type augmentation
```

**API response format per Spec Section B.0:**

Success:
```json
{ "success": true, "data": { ... } }
```

List with pagination:
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": { "page": 1, "limit": 20, "total": 156, "totalPages": 8 }
}
```

Error per Spec Section 27.1:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "...",
    "details": [ ... ],
    "requestId": "req_abc123xyz",
    "timestamp": "2026-01-15T10:30:00Z"
  }
}
```

**All endpoints prefixed with `/api/v1/`** per Spec Section B.0.

**Health endpoints:**
- `GET /api/v1/health` -- returns `{ status: "ok", timestamp, uptime }`
- `GET /api/v1/status` -- returns service status (DB, Redis, Elasticsearch connectivity)

**Success criteria:** Server starts, `GET /api/v1/health` returns 200; invalid routes return standardized 404; unhandled errors return standardized 500 with request ID.

#### Task 1.3.7: Set up Elasticsearch for search

**Files to create:**
```
packages/backend/src/search/elasticsearch-client.ts     # ES connection
packages/backend/src/search/index-manager.ts            # Index creation and mapping
packages/backend/src/search/search-service.ts           # Generic search interface
```

**Dependencies:** `@elastic/elasticsearch` (official client).

**Initial setup:**
- Connection with health check
- Index creation for `businesses` (will be populated in Phase 4)
- Multilingual analyzer configuration (for 10 languages)
- Graceful degradation: if ES is down, log warning and fall back to null (PostgreSQL full-text search fallback per Spec Section 27.5)

**Success criteria:** ES client connects; index creation succeeds; health check reports ES status.

#### Task 1.3.8: Implement API versioning strategy

**Files to modify:**
```
packages/backend/src/routes/index.ts                    # Version prefix routing
```

**Strategy:** All routes mounted under `/api/v1/`. The router structure supports future `/api/v2/` by adding a new version router. Version is extracted from URL, not headers.

**Success criteria:** All endpoints are under `/api/v1/`; requesting `/api/v2/` returns 404 with a message about API version not found.

#### Task 1.3.9: Set up logging infrastructure

**Files to create:**
```
packages/backend/src/utils/logger.ts                    # Pino logger
```

**Dependencies:** `pino` (structured JSON logging, high performance) + `pino-pretty` (dev formatting).

**Log levels per Spec Section 29.1:** ERROR, WARN, INFO, DEBUG.
**Log level controlled by:** `LOG_LEVEL` env variable.

**What to log:**
- All HTTP requests (method, path, status, duration, request ID)
- Authentication events (login, logout, failed attempts)
- Errors with stack traces
- Configuration warnings
- Database query warnings (slow queries > 100ms)

**Format:** Structured JSON in production, pretty-printed in development.

**Success criteria:** Requests produce structured log entries; log level respects `LOG_LEVEL` env var.

### Testing Requirements for 1.3
- Unit tests for cache service (get, set, delete, TTL expiry)
- Unit tests for storage service (UUID generation, MIME validation, path traversal rejection)
- Unit tests for API response helpers (success format, error format, pagination)
- Unit tests for API error class (error codes, HTTP status mapping)
- Integration test: health endpoint returns 200 with service status
- Integration test: Prisma client connects and queries
- Integration test: Redis client connects and performs operations

---

## Subsection 1.4: Frontend Infrastructure (7 tasks)

### Prerequisites
- Subsection 1.1 complete (monorepo, TypeScript, Vite)
- Subsection 1.2 complete (config loader, platform.json, feature flags)

### Implementation Order

#### Task 1.4.1: Initialize React frontend with TypeScript

**Files to create:**
```
packages/frontend/vite.config.ts
packages/frontend/index.html
packages/frontend/src/main.tsx                          # React entry point
packages/frontend/src/App.tsx                           # Root component with providers
packages/frontend/src/vite-env.d.ts                     # Vite type declarations
packages/frontend/src/router.tsx                        # React Router setup
packages/frontend/public/robots.txt
```

**Dependencies:**
- `react`, `react-dom` -- UI library
- `react-router-dom` -- client-side routing
- `@tanstack/react-query` -- server state management
- `@tanstack/react-query-devtools` -- dev tools
- `axios` -- HTTP client (consistent with backend API format)

**Root `App.tsx` wraps providers:**
```tsx
<QueryClientProvider>
  <PlatformConfigProvider>
    <I18nProvider>
      <RouterProvider>
        {/* Routes */}
      </RouterProvider>
    </I18nProvider>
  </PlatformConfigProvider>
</QueryClientProvider>
```

**Success criteria:** `pnpm dev` in frontend starts Vite dev server; root page renders with React.

#### Task 1.4.2: Configure responsive design system (mobile-first)

**Files to create:**
```
packages/frontend/tailwind.config.ts                    # Tailwind configuration
packages/frontend/postcss.config.js                     # PostCSS with Tailwind
packages/frontend/src/styles/globals.css                # Global styles, Tailwind directives
packages/frontend/src/styles/fonts.css                  # Font loading
```

**Tailwind breakpoints per Spec Section 3.4:**
```js
screens: {
  'sm': '640px',    // Small mobile
  'md': '768px',    // Tablet
  'lg': '1024px',   // Small desktop
  'xl': '1200px',   // Desktop (spec breakpoint)
  '2xl': '1536px',  // Large desktop
}
```

**Font loading (Spec Section 6.2):**
- Montserrat (headings): weights 600 (semi-bold), 700 (bold)
- Open Sans (body): weights 400 (regular), 600 (semi-bold)
- Use `font-display: swap` for performance (Spec Section 17.3)

**Success criteria:** Tailwind classes compile; breakpoints match specification; fonts load with swap display.

#### Task 1.4.3: Implement design tokens from config

**Files to create:**
```
packages/frontend/src/styles/design-tokens.ts           # Token generation from config
packages/frontend/src/hooks/usePlatformConfig.ts        # Config access hook
packages/frontend/src/providers/PlatformConfigProvider.tsx
```

**Design tokens from Spec Section 6:**
- Colours: primary (#2C5F7C), secondary (#E67E22), accent (#F39C12), success (#27AE60), error (#E74C3C), neutral-light (#F5F5F5), neutral-medium (#CCCCCC), text-dark (#2C3E50), text-light (#7F8C8D)
- Typography scale: H1 (32px bold), H2 (26px bold), H3 (22px semi-bold), Body (16px), Small (14px), Caption (12px)
- Spacing: 4px base unit (4, 8, 12, 16, 24, 32, 48, 64)
- Border radius: 4px (fields), 8px (cards)
- Shadows: `0 2px 4px rgba(0,0,0,0.1)` (default), `0 4px 8px rgba(0,0,0,0.15)` (hover)

**Colours injected as CSS custom properties from `platform.json`**, making them configurable per deployment:
```css
:root {
  --color-primary: #2C5F7C;
  --color-secondary: #E67E22;
  /* ... */
}
```

**These CSS variables are then referenced in the Tailwind config.**

**Success criteria:** Changing a colour in `platform.json` propagates to the entire UI; no hardcoded colour values in components.

#### Task 1.4.4: Set up component library foundation

**Files to create:**
```
packages/frontend/src/components/ui/Button.tsx
packages/frontend/src/components/ui/Button.test.tsx
packages/frontend/src/components/ui/index.ts            # Barrel export
packages/frontend/src/components/layout/index.ts
packages/frontend/src/components/forms/index.ts
```

**Initial Button component demonstrates the pattern:**
- Props: `variant` (primary/secondary/tertiary), `size` (sm/md/lg), `loading`, `disabled`
- All states from Spec Section 7.1.1 (default, hover, active, focus, disabled, loading)
- Accessible: proper `aria-disabled`, `aria-busy` for loading
- Touch target: min 44px height (Spec Section 3.4)
- Keyboard accessible

**This establishes the component architecture pattern for Phase 3 (full design system).**

**Success criteria:** Button renders with all variants; tests pass; component is accessible (no a11y violations).

#### Task 1.4.5: Configure PWA manifest

**Files to create:**
```
packages/frontend/public/manifest.json                  # Web App Manifest
packages/frontend/public/icons/                         # App icons directory
```

**Manifest per Spec Section 3.7:**
```json
{
  "name": "Guildford Community Hub",
  "short_name": "Community Hub",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FFFFFF",
  "theme_color": "#2C5F7C",
  "icons": [
    { "src": "/icons/icon-72.png", "sizes": "72x72", "type": "image/png" },
    { "src": "/icons/icon-96.png", "sizes": "96x96", "type": "image/png" },
    { "src": "/icons/icon-128.png", "sizes": "128x128", "type": "image/png" },
    { "src": "/icons/icon-144.png", "sizes": "144x144", "type": "image/png" },
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-384.png", "sizes": "384x384", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

**Note:** The `name` and `theme_color` should be dynamically generated from `platform.json` at build time.

**Success criteria:** Lighthouse PWA audit passes manifest checks; browser shows install prompt on HTTPS.

#### Task 1.4.6: Set up service worker skeleton

**Files to create:**
```
packages/frontend/src/sw.ts                             # Service worker (Workbox)
packages/frontend/src/utils/register-sw.ts              # SW registration logic
```

**Dependencies:** `workbox-precaching`, `workbox-routing`, `workbox-strategies`, `workbox-cacheable-response`, `workbox-expiration` (via `vite-plugin-pwa`).

**Caching strategies per Spec Section 3.7:**
- Static assets: Cache-first
- API responses: Network-first with cache fallback
- Images: Cache-first with background update
- User data: IndexedDB with sync (deferred to Phase 17)

**Phase 1 scope:** Skeleton only -- precache app shell, cache static assets. Full offline capability in Phase 17.

**Success criteria:** Service worker registers; static assets cached; dev mode can disable SW for easier development.

#### Task 1.4.7: Configure build optimization

**Files to modify:**
```
packages/frontend/vite.config.ts                        # Build configuration
```

**Optimizations:**
- Code splitting by route (React.lazy + Suspense)
- Vendor chunk splitting (react, react-dom, react-router in separate chunk)
- Tree shaking (enabled by default in Vite)
- CSS minification
- Image optimization via Vite plugin
- Bundle size analysis (`rollup-plugin-visualizer`)
- Gzip/Brotli compression (`vite-plugin-compression`)

**Performance budget:**
- Main JS bundle: < 200KB gzipped
- CSS: < 50KB gzipped
- Total initial load: < 500KB gzipped

**Success criteria:** `pnpm build` produces code-split chunks; bundle visualizer shows no oversized dependencies.

### Testing Requirements for 1.4
- Component test: Button renders all variants correctly
- Component test: Button accessibility (keyboard focus, ARIA attributes)
- Unit test: Design tokens generate correct CSS variables from config
- Unit test: Feature flag hook returns correct values
- Build test: Production build succeeds with code splitting
- Lighthouse test: PWA score passes manifest requirements

---

## Subsection 1.5: Security Foundation (11 tasks)

### Prerequisites
- Subsection 1.3 complete (Express app, middleware pipeline)

### Implementation Order

#### Tasks 1.5.1-1.5.5: Security Headers

**Files to create:**
```
packages/backend/src/middleware/security-headers.ts      # Helmet configuration
```

**Dependencies:** `helmet` (Express security headers middleware).

**Headers per Spec Section 4.5:**

| Header | Value |
|--------|-------|
| Content-Security-Policy | `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://api.mapbox.com https://*.tiles.mapbox.com; connect-src 'self' https://api.mapbox.com https://events.mapbox.com` |
| X-Frame-Options | DENY |
| X-Content-Type-Options | nosniff |
| Strict-Transport-Security | max-age=31536000; includeSubDomains |
| Referrer-Policy | strict-origin-when-cross-origin |

**Success criteria:** All 5 headers present in every response; verified with `curl -I`.

#### Task 1.5.6: Configure TLS 1.3

**Note:** TLS termination is handled by Cloudflare/Nginx in production (Phase 19). For development, this task documents the configuration and ensures the app enforces HTTPS redirects in production mode.

**Files to create:**
```
packages/backend/src/middleware/https-redirect.ts        # HSTS + redirect in production
```

**Success criteria:** In production mode, HTTP requests redirect to HTTPS; HSTS header present.

#### Task 1.5.7: Set up rate limiting middleware

**Files to create:**
```
packages/backend/src/middleware/rate-limiter.ts          # Rate limiting factory
```

**Dependencies:** `express-rate-limit` with `rate-limit-redis` (Redis store for distributed rate limiting).

**Rate limits per Spec Section 4.8:**

```typescript
const rateLimitConfigs = {
  auth:          { windowMs: 15 * 60 * 1000, max: 10 },      // 10 req / 15 min
  passwordReset: { windowMs: 60 * 60 * 1000, max: 3 },       // 3 req / 1 hour
  apiAuth:       { windowMs: 60 * 1000, max: 100 },           // 100 req / 1 min
  apiAnon:       { windowMs: 60 * 1000, max: 30 },            // 30 req / 1 min
  search:        { windowMs: 60 * 1000, max: 30 },            // 30 req / 1 min
  upload:        { windowMs: 60 * 60 * 1000, max: 20 },       // 20 / 1 hour
  reviewSubmit:  { windowMs: 24 * 60 * 60 * 1000, max: 5 },   // 5 / 24 hours
  newConvo:      { windowMs: 24 * 60 * 60 * 1000, max: 10 },  // 10 / 24 hours
  flashDeal:     { windowMs: 7 * 24 * 60 * 60 * 1000, max: 2} // 2 / 7 days
};
```

**Response:** HTTP 429 with standard error format including `Retry-After` header.

**Success criteria:** Exceeding rate limit returns 429; Redis-backed counting survives server restart.

#### Task 1.5.8: Implement input validation middleware

**Files to create:**
```
packages/backend/src/middleware/validate.ts              # Zod-based request validation
packages/shared/src/validation/index.ts                 # Shared validation schemas
packages/shared/src/validation/user.ts                  # User-related schemas
packages/shared/src/validation/common.ts                # Common patterns (email, URL, etc.)
```

**Dependencies:** `zod` (schema validation, shared between frontend and backend via `@community-hub/shared`).

**Validation middleware pattern:**
```typescript
const validate = (schema: ZodSchema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    query: req.query,
    params: req.params,
  });
  if (!result.success) {
    return next(new ValidationError(result.error));
  }
  req.validated = result.data;
  next();
};
```

**Password validation per Spec Section 4.1:** 8+ chars, at least one uppercase, at least one number.

**Success criteria:** Invalid request bodies return 400 with field-specific error messages per Spec Section 27.3.

#### Task 1.5.9: Set up AES-256 encryption for sensitive data at rest

**Files to create:**
```
packages/backend/src/security/encryption.ts             # AES-256-GCM encrypt/decrypt
```

**Uses `ENCRYPTION_KEY` from `.env`.** AES-256-GCM with random IV per encryption operation. Used for encrypting PII stored in database (phone numbers, addresses beyond what is publicly displayed).

**Success criteria:** Encrypt then decrypt returns original value; different IVs per encryption.

#### Task 1.5.10: Implement CSRF protection

**Files to create:**
```
packages/backend/src/middleware/csrf.ts                  # CSRF token middleware
```

**Per Spec Section 4.7:** SameSite=Strict cookies + CSRF token for non-GET requests. Token generated server-side, stored in session, validated per state-changing request. Public GET endpoints and OAuth callbacks are exempt.

**Success criteria:** POST requests without valid CSRF token return 403; GET requests are unaffected.

#### Task 1.5.11: Implement input sanitization middleware

**Files to create:**
```
packages/backend/src/middleware/sanitize.ts              # Input sanitization
packages/backend/src/security/html-sanitizer.ts         # HTML allowlist sanitizer
```

**Dependencies:** `isomorphic-dompurify` or `sanitize-html`.

**Per Spec Section 4.9:**
- Rich text fields: sanitize with allowlist (`p`, `br`, `strong`, `em`, `ul`, `ol`, `li`, `a` with `rel="nofollow"`)
- Blocked: `script`, `iframe`, `object`, `embed`, `style`, `onclick` and all event handlers
- Plain text fields: strip all HTML tags
- URL fields: validate format; block `javascript:` and `data:` schemes

**Success criteria:** `<script>alert('xss')</script>` is stripped; allowed tags pass through; malicious URLs are rejected.

### Testing Requirements for 1.5
- Unit tests for each security header (verify presence and value)
- Unit tests for rate limiter (verify 429 after threshold)
- Unit tests for input validation (valid passes, invalid fails with specific errors)
- Unit tests for encryption (encrypt-decrypt roundtrip, different IVs)
- Unit tests for CSRF (valid token passes, missing/invalid token returns 403)
- Unit tests for HTML sanitizer (XSS payloads stripped, allowed tags preserved)
- Security review: `security-review` skill should audit the entire middleware pipeline

---

## Subsection 1.6: Email Service Setup (5 tasks)

### Prerequisites
- Subsection 1.3 complete (backend infrastructure)
- Subsection 1.5 complete (security foundation)

### Implementation Order

#### Task 1.6.1: Set up Mailgun and configure API key

**Files to create:**
```
packages/backend/src/services/email/email-service.ts    # Email sending service
packages/backend/src/services/email/email-provider.ts   # Mailgun provider implementation
packages/backend/src/services/email/email-queue.ts      # Email queue (Redis-backed)
packages/backend/src/services/email/types.ts            # Email types and interfaces
```

**Dependencies:** `mailgun.js` (official Mailgun SDK), `form-data`.

**Features:**
- Send email via Mailgun API
- Queue emails via Redis for reliability (retry on failure)
- Domain verification status check
- Rate limiting respect

**In development:** Use MailHog (Docker service) instead of Mailgun.

**Success criteria:** Email sends via Mailgun in production; caught by MailHog in development.

#### Task 1.6.2: Create base HTML email template

**Files to create:**
```
packages/backend/src/services/email/templates/base.html # Base email template
packages/backend/src/services/email/template-engine.ts  # Template rendering (Handlebars)
```

**Dependencies:** `handlebars` (template engine).

**Base template includes:**
- Branded header with logo from `platform.json`
- Responsive layout (600px max-width)
- Footer with platform name, support email, unsubscribe link
- Configurable colours from `platform.json`
- Plain text fallback generation

**Success criteria:** Base template renders with branding from config; responsive on mobile email clients.

#### Task 1.6.3: Implement email verification template

**Files to create:**
```
packages/backend/src/services/email/templates/verify-email.html
packages/backend/src/services/email/templates/verify-email.txt
```

**Content:** "Welcome to {platformName}! Please verify your email address." with verification link (24-hour expiry per Spec).

#### Task 1.6.4: Implement password reset template

**Files to create:**
```
packages/backend/src/services/email/templates/password-reset.html
packages/backend/src/services/email/templates/password-reset.txt
```

**Content:** "Password reset requested. Click the link below to reset your password." with reset link (1-hour expiry per Spec).

#### Task 1.6.5: Configure delivery, bounce handling, and one-click unsubscribe

**Files to modify:**
```
packages/backend/src/services/email/email-service.ts    # Add bounce webhook handler
packages/backend/src/routes/webhooks/mailgun.ts         # Mailgun webhook endpoint
```

**Features:**
- Webhook endpoint for Mailgun delivery/bounce events
- Bounce tracking in database
- One-click unsubscribe header per RFC 8058
- Unsubscribe link in all non-transactional emails

**Success criteria:** Bounce events processed; unsubscribe link functional; delivery events logged.

### Testing Requirements for 1.6
- Unit test: template engine renders variables correctly
- Unit test: base template includes branding from config
- Integration test: email sends to MailHog in development
- Unit test: bounce webhook processes events correctly
- Unit test: email queue retries on failure

---

## Subsection 1.7: Maps Integration (5 tasks)

### Prerequisites
- Subsection 1.4 complete (React frontend)

### Implementation Order

#### Task 1.7.1: Set up Mapbox API

**Files to create:**
```
packages/frontend/src/components/maps/MapProvider.tsx   # Mapbox GL JS provider
packages/frontend/src/components/maps/types.ts          # Map types
packages/backend/src/services/geocoding/geocoding-service.ts  # Server-side geocoding
```

**Dependencies (frontend):** `mapbox-gl`, `react-map-gl`.
**Dependencies (backend):** `@mapbox/mapbox-sdk` (for server-side geocoding).

**Configuration:** Access token from `MAPBOX_ACCESS_TOKEN` env var. Map centre defaults to `platform.json` coordinates.

**Success criteria:** Map renders centred on configured coordinates; API key loaded from env.

#### Task 1.7.2: Implement map embed component

**Files to create:**
```
packages/frontend/src/components/maps/BusinessMap.tsx   # Map for business profiles
packages/frontend/src/components/maps/MapMarker.tsx     # Custom marker component
```

**Features:**
- Display map centred on business coordinates
- Custom marker at business location
- Zoom controls
- Mobile-friendly touch interactions
- Fallback to address text if Mapbox unavailable (Spec Section 27.5)

**Success criteria:** Map renders with marker at given coordinates; graceful fallback if API unavailable.

#### Task 1.7.3: Implement "Get Directions" link

**Files to create:**
```
packages/frontend/src/components/maps/DirectionsLink.tsx
packages/frontend/src/utils/maps.ts                     # Map utility functions
```

**Deep links per Spec Section 26.4:**
- iOS: `maps://` or Apple Maps URL
- Android: `geo:` intent or Google Maps URL
- Desktop: Google Maps URL
- Detect platform and use appropriate link

**Success criteria:** Link opens native maps app on mobile; Google Maps on desktop.

#### Task 1.7.4: Implement geocoding

**Files to modify:**
```
packages/backend/src/services/geocoding/geocoding-service.ts  # (extend from 1.7.1)
```

**Features:**
- Address to coordinates (forward geocoding)
- Coordinates to address (reverse geocoding)
- Results cached in Redis (24-hour TTL)
- Rate limiting respect for Mapbox API

**Success criteria:** Given an address string, returns latitude/longitude; results cached.

#### Task 1.7.5: Implement distance calculation

**Files to create:**
```
packages/shared/src/utils/geo.ts                        # Haversine distance calculation
packages/frontend/src/hooks/useUserLocation.ts          # Browser geolocation hook
```

**Features:**
- Haversine formula for distance between two points (shared utility)
- Browser geolocation API integration (with permission request)
- Distance display formatting (< 1km show meters, >= 1km show km)

**Success criteria:** Distance calculation matches expected values for known coordinate pairs; geolocation permission handled gracefully.

### Testing Requirements for 1.7
- Unit test: Haversine distance calculation accuracy
- Unit test: direction link generation for each platform
- Component test: Map renders without error
- Component test: Map fallback renders when Mapbox unavailable
- Unit test: geocoding service caches results

---

## Subsection 1.8: i18n Foundation (6 tasks)

### Prerequisites
- Subsection 1.4 complete (React frontend, Tailwind)

### Implementation Order

#### Task 1.8.1: Implement translation file structure

**Files to create:**
```
packages/frontend/src/i18n/index.ts                     # i18next initialization
packages/frontend/src/i18n/config.ts                    # i18n configuration
packages/frontend/src/i18n/locales/en/common.json       # English (primary)
packages/frontend/src/i18n/locales/en/auth.json
packages/frontend/src/i18n/locales/en/business.json
packages/frontend/src/i18n/locales/en/errors.json
packages/frontend/src/i18n/locales/ar/common.json       # Arabic (stub)
packages/frontend/src/i18n/locales/zh-CN/common.json    # Chinese Simplified (stub)
packages/frontend/src/i18n/locales/vi/common.json       # Vietnamese (stub)
```

**Dependencies:** `i18next`, `react-i18next`, `i18next-browser-languagedetector`, `i18next-http-backend`.

**Namespace structure:**
- `common` -- global UI (nav, buttons, footer, general labels)
- `auth` -- login, register, password reset
- `business` -- business-related strings
- `errors` -- error messages per Spec Section 27.3-27.4
- Additional namespaces added per feature in later phases

**Fallback chain:** User's selected language -> browser language -> `en`.

**Success criteria:** English translation files load; `t('common.save')` returns "Save".

#### Task 1.8.2: Set up language detection

**Detection order per Spec Section 8.5:**
1. URL query parameter (`?lang=ar`)
2. User preference (stored in localStorage or user profile)
3. Browser `navigator.language`
4. Default from `platform.json` (`multilingual.defaultLanguage`)

**Files to create:**
```
packages/frontend/src/i18n/language-detector.ts         # Custom detection logic
```

**Success criteria:** Visiting with `?lang=ar` switches to Arabic; preference persisted in localStorage.

#### Task 1.8.3: Implement language switching UI component

**Files to create:**
```
packages/frontend/src/components/i18n/LanguageSwitcher.tsx
packages/frontend/src/components/i18n/LanguageSwitcher.test.tsx
```

**Per Spec Section 8.5:** Globe icon in header, click reveals dropdown with language options showing native names (e.g., "&#1575;&#1604;&#1593;&#1585;&#1576;&#1610;&#1577;" for Arabic). Current language highlighted. Selection changes language immediately and persists.

**Languages from `platform.json` `multilingual.supportedLanguages`** -- only enabled languages shown.

**Success criteria:** Dropdown lists all enabled languages with native names; selection changes i18n language; RTL languages trigger direction change.

#### Task 1.8.4: Configure RTL support infrastructure

**Files to create:**
```
packages/frontend/src/hooks/useDirection.ts             # Returns 'ltr' or 'rtl'
packages/frontend/src/providers/DirectionProvider.tsx   # Sets dir attribute on html
packages/frontend/src/styles/rtl.css                    # RTL-specific overrides
```

**Tailwind RTL approach:** Use the `rtl:` variant in Tailwind classes. The `<html dir="rtl">` attribute is set dynamically when an RTL language is selected.

**RTL languages per Spec:** Arabic (ar), Urdu (ur).

**What must mirror per Spec Section 8.4:**
- Text direction
- Layout (sidebars, navigation)
- Icons (arrows, navigation icons)
- Numbers remain LTR within RTL text
- Bidirectional text handling (mixed LTR/RTL content)

**Success criteria:** Switching to Arabic sets `dir="rtl"` on `<html>`; layout mirrors; Tailwind RTL variants apply.

#### Task 1.8.5: Set up translation key management workflow

**Files to create:**
```
packages/frontend/src/i18n/scripts/extract-keys.ts      # Extract translation keys from source
packages/frontend/src/i18n/scripts/validate-keys.ts     # Find missing translations
docs/translation-guide.md                               # Translation contributor guide
```

**Workflow:**
1. Developers use `t('namespace.key')` in code
2. `extract-keys` script scans source for `t()` calls
3. `validate-keys` compares extracted keys against each locale file
4. Missing keys reported (CI can fail on missing English keys)

**Success criteria:** Running validation identifies missing translations; English is 100% complete.

#### Task 1.8.6: Implement text direction switching

**Files to modify:**
```
packages/frontend/src/providers/DirectionProvider.tsx   # (extend from 1.8.4)
packages/frontend/src/App.tsx                           # Integrate direction provider
```

**Behaviour:**
- Language change triggers direction check
- `document.documentElement.dir` set to `'rtl'` or `'ltr'`
- `document.documentElement.lang` set to language code
- Body font changes if language-specific font needed (e.g., Noto Sans Arabic for Arabic)
- Smooth transition (no page reload)

**Success criteria:** Switching to Arabic immediately mirrors layout; switching back to English restores LTR; no FOUC (flash of unstyled content).

### Testing Requirements for 1.8
- Unit test: i18next initializes with correct default language
- Unit test: language detection priority (URL > localStorage > browser > default)
- Component test: LanguageSwitcher renders all enabled languages
- Component test: LanguageSwitcher changes language on selection
- Unit test: RTL detection returns correct direction for each language
- Component test: Layout mirrors correctly in RTL mode
- Script test: extract-keys finds all `t()` calls
- Script test: validate-keys reports missing translations accurately

---

## Complete File Index

### Root Level
```
pnpm-workspace.yaml
package.json
tsconfig.base.json
.npmrc
.nvmrc
.gitignore
.gitattributes
.prettierrc.json
.prettierignore
eslint.config.js
.env.example
```

### config/
```
config/platform.json
config/platform.development.json
config/platform.staging.json
```

### .github/
```
.github/workflows/ci.yml
.github/workflows/security.yml
.github/dependabot.yml
```

### docker/
```
docker/docker-compose.yml
docker/docker-compose.dev.yml
docker/docker-compose.staging.yml
docker/docker-compose.prod.yml
docker/.env.docker
docker/init-db.sh
```

### docs/
```
docs/deployment-checklist.md
docs/translation-guide.md
```

### packages/shared/
```
packages/shared/package.json
packages/shared/tsconfig.json
packages/shared/vitest.config.ts
packages/shared/src/index.ts
packages/shared/src/config/platform-schema.ts
packages/shared/src/config/types.ts
packages/shared/src/config/feature-flags.ts
packages/shared/src/validation/index.ts
packages/shared/src/validation/user.ts
packages/shared/src/validation/common.ts
packages/shared/src/utils/geo.ts
```

### packages/backend/
```
packages/backend/package.json
packages/backend/tsconfig.json
packages/backend/vitest.config.ts
packages/backend/eslint.config.js
packages/backend/src/index.ts
packages/backend/src/app.ts
packages/backend/src/__tests__/setup.ts
packages/backend/prisma/schema.prisma
packages/backend/src/config/platform-loader.ts
packages/backend/src/config/validate.ts
packages/backend/src/config/env-validate.ts
packages/backend/src/db/index.ts
packages/backend/src/db/seed.ts
packages/backend/src/cache/redis-client.ts
packages/backend/src/cache/cache-service.ts
packages/backend/src/cache/rate-limit-store.ts
packages/backend/src/storage/storage-interface.ts
packages/backend/src/storage/local-storage.ts
packages/backend/src/storage/image-processor.ts
packages/backend/src/search/elasticsearch-client.ts
packages/backend/src/search/index-manager.ts
packages/backend/src/search/search-service.ts
packages/backend/src/routes/index.ts
packages/backend/src/routes/health.ts
packages/backend/src/routes/webhooks/mailgun.ts
packages/backend/src/middleware/error-handler.ts
packages/backend/src/middleware/request-logger.ts
packages/backend/src/middleware/cors.ts
packages/backend/src/middleware/not-found.ts
packages/backend/src/middleware/security-headers.ts
packages/backend/src/middleware/https-redirect.ts
packages/backend/src/middleware/rate-limiter.ts
packages/backend/src/middleware/validate.ts
packages/backend/src/middleware/csrf.ts
packages/backend/src/middleware/sanitize.ts
packages/backend/src/middleware/feature-gate.ts
packages/backend/src/security/encryption.ts
packages/backend/src/security/html-sanitizer.ts
packages/backend/src/services/email/types.ts
packages/backend/src/services/email/email-service.ts
packages/backend/src/services/email/email-provider.ts
packages/backend/src/services/email/email-queue.ts
packages/backend/src/services/email/template-engine.ts
packages/backend/src/services/email/templates/base.html
packages/backend/src/services/email/templates/verify-email.html
packages/backend/src/services/email/templates/verify-email.txt
packages/backend/src/services/email/templates/password-reset.html
packages/backend/src/services/email/templates/password-reset.txt
packages/backend/src/services/geocoding/geocoding-service.ts
packages/backend/src/utils/api-response.ts
packages/backend/src/utils/api-error.ts
packages/backend/src/utils/logger.ts
packages/backend/src/types/express.d.ts
```

### packages/frontend/
```
packages/frontend/package.json
packages/frontend/tsconfig.json
packages/frontend/vite.config.ts
packages/frontend/vitest.config.ts
packages/frontend/eslint.config.js
packages/frontend/tailwind.config.ts
packages/frontend/postcss.config.js
packages/frontend/index.html
packages/frontend/public/manifest.json
packages/frontend/public/robots.txt
packages/frontend/public/icons/
packages/frontend/src/main.tsx
packages/frontend/src/App.tsx
packages/frontend/src/vite-env.d.ts
packages/frontend/src/router.tsx
packages/frontend/src/sw.ts
packages/frontend/src/__tests__/setup.ts
packages/frontend/src/styles/globals.css
packages/frontend/src/styles/fonts.css
packages/frontend/src/styles/design-tokens.ts
packages/frontend/src/styles/rtl.css
packages/frontend/src/config/platform-loader.ts
packages/frontend/src/providers/PlatformConfigProvider.tsx
packages/frontend/src/providers/DirectionProvider.tsx
packages/frontend/src/hooks/usePlatformConfig.ts
packages/frontend/src/hooks/useFeatureFlag.ts
packages/frontend/src/hooks/useDirection.ts
packages/frontend/src/hooks/useUserLocation.ts
packages/frontend/src/utils/register-sw.ts
packages/frontend/src/utils/maps.ts
packages/frontend/src/components/ui/Button.tsx
packages/frontend/src/components/ui/Button.test.tsx
packages/frontend/src/components/ui/index.ts
packages/frontend/src/components/layout/index.ts
packages/frontend/src/components/forms/index.ts
packages/frontend/src/components/maps/MapProvider.tsx
packages/frontend/src/components/maps/BusinessMap.tsx
packages/frontend/src/components/maps/MapMarker.tsx
packages/frontend/src/components/maps/DirectionsLink.tsx
packages/frontend/src/components/maps/types.ts
packages/frontend/src/components/i18n/LanguageSwitcher.tsx
packages/frontend/src/components/i18n/LanguageSwitcher.test.tsx
packages/frontend/src/i18n/index.ts
packages/frontend/src/i18n/config.ts
packages/frontend/src/i18n/language-detector.ts
packages/frontend/src/i18n/locales/en/common.json
packages/frontend/src/i18n/locales/en/auth.json
packages/frontend/src/i18n/locales/en/business.json
packages/frontend/src/i18n/locales/en/errors.json
packages/frontend/src/i18n/locales/ar/common.json
packages/frontend/src/i18n/locales/zh-CN/common.json
packages/frontend/src/i18n/locales/vi/common.json
packages/frontend/src/i18n/scripts/extract-keys.ts
packages/frontend/src/i18n/scripts/validate-keys.ts
```

---

## Milestone Definitions

### Milestone 1: "Skeleton Boots" (End of Week 2)
Subsection 1.1 complete. Monorepo installs, builds, tests, lints. Docker services start. CI passes.

### Milestone 2: "Config Loads" (End of Week 3)
Subsection 1.2 complete. Platform config validates on startup. Feature flags gate routes and UI.

### Milestone 3: "API Responds" (End of Week 5)
Subsection 1.3 complete. `GET /api/v1/health` returns 200 with database, Redis, and ES status. Prisma migrations run.

### Milestone 4: "UI Renders" (End of Week 5 -- parallel with Milestone 3)
Subsection 1.4 complete. React app renders with design tokens from config. PWA manifest passes Lighthouse. Build produces code-split chunks.

### Milestone 5: "Secured" (End of Week 7)
Subsection 1.5 complete. All security headers present. Rate limiting active. Input validation rejects malformed requests. XSS payloads sanitized.

### Milestone 6: "Emails Send" (End of Week 8)
Subsection 1.6 complete. Verification and password reset emails render and deliver via MailHog in dev.

### Milestone 7: "Maps Work" (End of Week 8 -- parallel with Milestone 6)
Subsection 1.7 complete. Map renders on a test page. Geocoding returns coordinates. Distance calculation accurate.

### Milestone 8: "i18n Ready" (End of Week 9)
Subsection 1.8 complete. Language switcher changes language. RTL layout mirrors correctly for Arabic. Translation validation script identifies missing keys.

**Phase 1 Complete:** All 59 tasks done, all 8 milestones passed, Phase 2 (Auth) and Phase 3 (Design System) are unblocked.

---

## Skill/Agent Assignment Summary

| Subsection | Primary Skill | Supporting Skills |
|------------|--------------|-------------------|
| 1.1 Development Environment | Manual setup | `config-check` |
| 1.2 Configuration Architecture | `config-check` | `api-implement` |
| 1.3 Backend Infrastructure | `api-implement` | `db-migrate`, `security-review` |
| 1.4 Frontend Infrastructure | `component-create` | `config-check` |
| 1.5 Security Foundation | `security-review` | `api-implement` |
| 1.6 Email Service | `api-implement` | `component-create` |
| 1.7 Maps Integration | `component-create` | `api-implement` |
| 1.8 i18n Foundation | `i18n-add` | `component-create` |

After each subsection, `test-write` should generate comprehensive tests, and `security-review` should audit the security posture.

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Prisma 7.3.0 not stable | Low | High | Pin exact version; verify before starting; have downgrade plan |
| Tailwind v4 breaking changes | Low | Medium | Pin version; test RTL support thoroughly |
| Mapbox token rate limits in dev | Low | Low | Use mock map in tests; cache geocoding aggressively |
| Elasticsearch cluster complexity | Medium | Medium | Start with single-node; use Docker; fallback to PostgreSQL FTS |
| i18n key explosion | Medium | Low | Namespace discipline; automated validation in CI |
| Docker performance on Windows | Medium | Medium | Consider WSL2 backend; keep Docker services minimal |
