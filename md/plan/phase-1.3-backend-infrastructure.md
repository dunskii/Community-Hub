# Phase 1.3: Backend Infrastructure - Implementation Plan

## Scope

9 tasks that establish the server-side foundation: PostgreSQL + Prisma ORM, Redis caching, local media storage, Express API scaffolding, Elasticsearch search, API versioning, and structured logging.

**Prerequisite check:** Phase 1.1 (Dev Environment) and 1.2 (Configuration Architecture) are 100% complete. Docker services (PG 16, Redis 7, ES 8.17.0) are configured. Express 5, Pino 9, and Zod 3 are already installed in the backend package.

---

## Implementation Sequence

The tasks are reordered from their numbering to respect build dependencies:

```
Step 1:  1.3.9  Logging          (pino already installed, everything else uses it)
Step 2:  1.3.2  Install Prisma   (install packages)
Step 3:  1.3.3  Prisma schema    (create models, generate client)
Step 4:  1.3.1  PostgreSQL setup (seed data, Prisma client singleton)
Step 5:  1.3.4  Redis            (caching + sessions)
Step 6:  1.3.6  API scaffolding  (Express app, routes, middleware)
Step 7:  1.3.8  API versioning   (integrated with 1.3.6 route setup)
Step 8:  1.3.5  Media storage    (Sharp image processing)
Step 9:  1.3.7  Elasticsearch    (search client, indices)
Step 10: Tests  All unit + integration tests
```

---

## Step 1: Logging Infrastructure (Task 1.3.9)

### Create `packages/backend/src/utils/logger.ts`

Pino logger with environment-aware configuration. `pino` ^9.6.0 and `pino-pretty` ^13.0.0 are already installed.

```typescript
import pino from 'pino';

const level = process.env['LOG_LEVEL'] ?? 'info';
const isDev = (process.env['NODE_ENV'] ?? 'development') !== 'production';

export const logger = pino({
  level,
  ...(isDev && {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true },
    },
  }),
});
```

**What to log (Spec Section 29.1):**
- HTTP requests: method, path, status code, duration, requestId
- Authentication events: login, logout, failed attempts
- Errors: message, stack, requestId
- Configuration warnings
- Slow database queries (> 100ms)

**What NOT to log:** passwords, payment data, full request bodies with PII.

**Log levels:** ERROR, WARN, INFO, DEBUG -- controlled by `LOG_LEVEL` env var.

### Success criteria
- `logger.info('test')` produces structured JSON in production, pretty output in development
- Log level respects `LOG_LEVEL` environment variable

---

## Step 2: Install Prisma ORM (Task 1.3.2)

### Install dependencies

```bash
cd packages/backend
pnpm add @prisma/client
pnpm add -D prisma
```

**Version requirement:** Prisma >= 7.3.0 per specification. If 7.3.0 is not yet published (Prisma 6.x is current as of early 2026), install the latest available stable version and document the deviation. The version check should validate against whatever minimum version is actually installed.

### Add package.json scripts and seed config

Add to `packages/backend/package.json`:

```json
{
  "scripts": {
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio",
    "db:seed": "prisma db seed",
    "db:reset": "prisma migrate reset"
  },
  "prisma": {
    "schema": "prisma/schema.prisma",
    "seed": "tsx src/db/seed.ts"
  }
}
```

### Create version check utility

Create `packages/backend/src/utils/prisma-version-check.ts`:

```typescript
import { execSync } from 'node:child_process';
import { logger } from './logger.js';

const MINIMUM_VERSION = '6.0.0'; // Adjust when 7.3.0 is available

export function checkPrismaVersion(): void {
  try {
    const output = execSync('npx prisma --version', { encoding: 'utf-8' });
    const match = output.match(/prisma\s*:\s*(\d+\.\d+\.\d+)/i)
      ?? output.match(/(\d+\.\d+\.\d+)/);

    if (!match) {
      logger.warn('Could not determine Prisma version from output');
      return;
    }

    const version = match[1];
    const [major, minor, patch] = version.split('.').map(Number);
    const [reqMajor, reqMinor, reqPatch] = MINIMUM_VERSION.split('.').map(Number);

    if (
      major < reqMajor ||
      (major === reqMajor && minor < reqMinor) ||
      (major === reqMajor && minor === reqMinor && patch < reqPatch)
    ) {
      throw new Error(
        `Prisma ${MINIMUM_VERSION}+ required, found ${version}`,
      );
    }

    logger.info(`Prisma version: ${version}`);
  } catch (err) {
    if (err instanceof Error && err.message.includes('required')) throw err;
    logger.warn('Prisma version check skipped:', (err as Error).message);
  }
}
```

### Success criteria
- `npx prisma --version` runs in the backend package
- Version check logs the installed version at startup

---

## Step 3: Prisma Schema (Task 1.3.3)

### Create `packages/backend/prisma/schema.prisma`

6 initial models from the specification (Appendix A): User, Category, UserSession, AuditLog, EmailTemplate, SystemSetting.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Enums ───────────────────────────────────────────────

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

enum CategoryType {
  BUSINESS
  EVENT
  DEAL
  NOTICE
  GROUP
}

enum ActorRole {
  USER
  BUSINESS_OWNER
  MODERATOR
  ADMIN
  SYSTEM
}

// ─── Models ──────────────────────────────────────────────

/// Spec A.2 - Platform user accounts
model User {
  id                      String     @id @default(uuid())
  email                   String     @unique
  passwordHash            String     @map("password_hash")
  displayName             String     @map("display_name")
  profilePhoto            String?    @map("profile_photo")
  languagePreference      String     @default("en") @map("language_preference")
  suburb                  String?
  bio                     String?    @db.VarChar(500)
  interests               String[]
  notificationPreferences Json?      @map("notification_preferences")
  role                    UserRole   @default(COMMUNITY)
  status                  UserStatus @default(PENDING)
  emailVerified           Boolean    @default(false) @map("email_verified")
  createdAt               DateTime   @default(now()) @map("created_at")
  updatedAt               DateTime   @updatedAt @map("updated_at")
  lastLogin               DateTime?  @map("last_login")

  sessions  UserSession[]
  auditLogs AuditLog[]

  @@map("users")
}

/// Spec A.14 - Hierarchical taxonomy for businesses, events, deals, etc.
model Category {
  id           String       @id @default(uuid())
  type         CategoryType
  name         Json         // Multilingual: {"en": "Restaurant", "ar": "مطعم"}
  slug         String
  icon         String       @default("default")
  parentId     String?      @map("parent_id")
  parent       Category?    @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children     Category[]   @relation("CategoryHierarchy")
  displayOrder Int          @default(0) @map("display_order")
  active       Boolean      @default(true)
  createdAt    DateTime     @default(now()) @map("created_at")
  updatedAt    DateTime     @updatedAt @map("updated_at")

  @@unique([type, slug])
  @@index([type, active])
  @@map("categories")
}

/// Spec A.17 - Active user sessions for security audit
model UserSession {
  id           String   @id @default(uuid())
  userId       String   @map("user_id")
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  tokenHash    String   @unique @map("token_hash")
  deviceInfo   Json     @map("device_info") // {user_agent, device_type, os, browser}
  ipAddress    String   @map("ip_address")
  location     String?  // city/country from IP
  isCurrent    Boolean  @default(false) @map("is_current")
  lastActiveAt DateTime @map("last_active_at")
  expiresAt    DateTime @map("expires_at")
  createdAt    DateTime @default(now()) @map("created_at")

  @@index([userId])
  @@index([expiresAt])
  @@map("user_sessions")
}

/// Spec A.18 - Immutable audit trail (7-year retention)
model AuditLog {
  id            String    @id @default(uuid())
  actorId       String?   @map("actor_id")
  actor         User?     @relation(fields: [actorId], references: [id], onDelete: SetNull)
  actorRole     ActorRole @map("actor_role")
  action        String    // e.g. "review.delete", "user.suspend"
  targetType    String    @map("target_type") // e.g. "Review", "User"
  targetId      String    @map("target_id")
  previousValue Json?     @map("previous_value")
  newValue      Json?     @map("new_value")
  reason        String?
  ipAddress     String    @map("ip_address")
  userAgent     String    @map("user_agent")
  createdAt     DateTime  @default(now()) @map("created_at")

  @@index([actorId])
  @@index([targetType, targetId])
  @@index([createdAt])
  @@map("audit_logs")
}

/// Spec A.19 - Multilingual email templates (runtime-editable)
model EmailTemplate {
  id          String   @id @default(uuid())
  templateKey String   @unique @map("template_key") // e.g. "welcome", "password_reset"
  name        String
  description String
  subject     Json     // Multilingual: {"en": "Welcome!", "ar": "..."}
  bodyHtml    Json     @map("body_html") // Multilingual HTML
  bodyText    Json     @map("body_text") // Multilingual plain text
  variables   String[] // ["userName", "verificationLink"]
  active      Boolean  @default(true)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@map("email_templates")
}

/// Spec A.24 - Runtime-editable platform settings
model SystemSetting {
  key         String   @id
  value       Json
  description String
  updatedBy   String?  @map("updated_by")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@map("system_settings")
}
```

**Key design decisions:**
- `Category` uses `@@unique([type, slug])` so slugs are unique per category type, not globally
- `UserSession.tokenHash` stores SHA-256 of JWT, not the raw token (Spec A.17)
- `AuditLog` uses `onDelete: SetNull` so logs survive user deletion
- `SystemSetting` uses `key` as primary key (not UUID) per spec A.24
- All table names use `@@map()` for snake_case in PostgreSQL
- All column names use `@map()` for snake_case in PostgreSQL

### Generate migration

```bash
cd packages/backend
npx prisma migrate dev --name init
```

### Update `packages/backend/tsconfig.json`

Add prisma output to the include path if needed. The generated client lives in `node_modules/.prisma/client` so no tsconfig change is needed.

### Success criteria
- `npx prisma migrate dev --name init` creates all 6 tables
- `npx prisma generate` produces typed client without errors
- `npx prisma studio` shows the tables in the browser

---

## Step 4: PostgreSQL Setup (Task 1.3.1)

### Create `packages/backend/src/db/index.ts`

Prisma client singleton with logging integration.

```typescript
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: [
      { level: 'error', emit: 'event' },
      { level: 'warn', emit: 'event' },
      { level: 'query', emit: 'event' },
    ],
  });

if (process.env['NODE_ENV'] !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Route Prisma logs through Pino
prisma.$on('error', (e) => logger.error({ prisma: true }, e.message));
prisma.$on('warn', (e) => logger.warn({ prisma: true }, e.message));
prisma.$on('query', (e) => {
  if (e.duration > 100) {
    logger.warn({ prisma: true, duration: e.duration }, `Slow query: ${e.query}`);
  }
});

export async function disconnectDb(): Promise<void> {
  await prisma.$disconnect();
}
```

**Note on Prisma `$on` event types:** The exact event API depends on the installed Prisma version. If `$on('query', ...)` is not available, use `log: [{ level: 'query', emit: 'stdout' }]` instead and remove the `$on` calls.

### Create `packages/backend/src/db/seed.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('Seeding database...');

  // ── Categories ───────────────────────────────────────

  const businessCategories = [
    { slug: 'restaurant', name: { en: 'Restaurant' }, icon: 'utensils' },
    { slug: 'retail', name: { en: 'Retail' }, icon: 'shopping-bag' },
    { slug: 'services', name: { en: 'Services' }, icon: 'wrench' },
    { slug: 'health', name: { en: 'Health' }, icon: 'heart-pulse' },
    { slug: 'entertainment', name: { en: 'Entertainment' }, icon: 'music' },
    { slug: 'education', name: { en: 'Education' }, icon: 'graduation-cap' },
    { slug: 'professional', name: { en: 'Professional' }, icon: 'briefcase' },
  ];

  for (const [i, cat] of businessCategories.entries()) {
    await prisma.category.upsert({
      where: { type_slug: { type: 'BUSINESS', slug: cat.slug } },
      update: {},
      create: { ...cat, type: 'BUSINESS', displayOrder: i },
    });
  }

  const eventCategories = [
    { slug: 'music', name: { en: 'Music' }, icon: 'music' },
    { slug: 'community', name: { en: 'Community' }, icon: 'users' },
    { slug: 'sports', name: { en: 'Sports' }, icon: 'trophy' },
    { slug: 'markets', name: { en: 'Markets' }, icon: 'store' },
    { slug: 'workshop', name: { en: 'Workshop' }, icon: 'hammer' },
  ];

  for (const [i, cat] of eventCategories.entries()) {
    await prisma.category.upsert({
      where: { type_slug: { type: 'EVENT', slug: cat.slug } },
      update: {},
      create: { ...cat, type: 'EVENT', displayOrder: i },
    });
  }

  console.log('  Categories seeded');

  // ── System Settings ──────────────────────────────────

  const settings = [
    { key: 'maintenance_mode', value: false, description: 'Enable maintenance mode' },
    { key: 'registration_enabled', value: true, description: 'Allow new user registration' },
    { key: 'max_upload_size_mb', value: 5, description: 'Maximum upload size in MB' },
    { key: 'default_search_radius_km', value: 5, description: 'Default search radius in km' },
    { key: 'max_active_deals_per_business', value: 3, description: 'Max active deals per business' },
  ];

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: {
        key: setting.key,
        value: setting.value,
        description: setting.description,
      },
    });
  }

  console.log('  System settings seeded');

  // ── Email Templates ──────────────────────────────────

  const templates = [
    {
      templateKey: 'welcome',
      name: 'Welcome Email',
      description: 'Sent to new users after registration',
      subject: { en: 'Welcome to {{platformName}}' },
      bodyHtml: { en: '<h1>Welcome, {{displayName}}!</h1><p>Thank you for joining our community.</p>' },
      bodyText: { en: 'Welcome, {{displayName}}! Thank you for joining our community.' },
      variables: ['platformName', 'displayName'],
    },
    {
      templateKey: 'verify_email',
      name: 'Email Verification',
      description: 'Sent to verify user email address',
      subject: { en: 'Verify your email address' },
      bodyHtml: { en: '<p>Please verify your email by clicking: <a href="{{verificationLink}}">Verify Email</a></p>' },
      bodyText: { en: 'Please verify your email by visiting: {{verificationLink}}' },
      variables: ['verificationLink', 'displayName'],
    },
    {
      templateKey: 'password_reset',
      name: 'Password Reset',
      description: 'Sent when user requests a password reset',
      subject: { en: 'Reset your password' },
      bodyHtml: { en: '<p>Click here to reset your password: <a href="{{resetLink}}">Reset Password</a></p>' },
      bodyText: { en: 'Reset your password by visiting: {{resetLink}}' },
      variables: ['resetLink', 'displayName'],
    },
  ];

  for (const tmpl of templates) {
    await prisma.emailTemplate.upsert({
      where: { templateKey: tmpl.templateKey },
      update: {},
      create: tmpl,
    });
  }

  console.log('  Email templates seeded');
  console.log('Database seeded successfully.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

**Design decisions:**
- Uses `upsert` instead of `deleteMany` + `create` so the seed is idempotent and safe to re-run
- Category names start with English only; other languages are added in Phase 1.8 (i18n)
- No admin user created here -- that is Phase 2 (Authentication) which handles password hashing

### Success criteria
- `npx prisma db seed` completes without errors
- Re-running `npx prisma db seed` is idempotent (no duplicates)
- `npx prisma studio` shows seeded categories, settings, and templates

---

## Step 5: Redis Caching (Task 1.3.4)

### Install dependency

```bash
cd packages/backend
pnpm add ioredis
```

### Create `packages/backend/src/cache/redis-client.ts`

```typescript
import Redis from 'ioredis';
import { logger } from '../utils/logger.js';

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    const url = process.env['REDIS_URL'];
    if (!url) throw new Error('REDIS_URL is not set');

    redis = new Redis(url, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 10) return null; // stop retrying
        return Math.min(times * 200, 5000);
      },
      lazyConnect: true,
    });

    redis.on('error', (err) => logger.error({ redis: true }, `Redis error: ${err.message}`));
    redis.on('connect', () => logger.info('Redis connected'));
    redis.on('reconnecting', () => logger.warn('Redis reconnecting...'));
  }
  return redis;
}

export async function connectRedis(): Promise<void> {
  await getRedis().connect();
}

export async function disconnectRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}

export async function redisHealthCheck(): Promise<boolean> {
  try {
    const result = await getRedis().ping();
    return result === 'PONG';
  } catch {
    return false;
  }
}
```

### Create `packages/backend/src/cache/cache-service.ts`

```typescript
import { getRedis } from './redis-client.js';
import { logger } from '../utils/logger.js';

const ENV_PREFIX = `${process.env['NODE_ENV'] ?? 'dev'}:`;

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await getRedis().get(ENV_PREFIX + key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch (err) {
      logger.error({ cache: true }, `get failed for "${key}": ${(err as Error).message}`);
      return null;
    }
  },

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    try {
      const json = JSON.stringify(value);
      if (ttlSeconds) {
        await getRedis().setex(ENV_PREFIX + key, ttlSeconds, json);
      } else {
        await getRedis().set(ENV_PREFIX + key, json);
      }
    } catch (err) {
      logger.error({ cache: true }, `set failed for "${key}": ${(err as Error).message}`);
    }
  },

  async del(key: string): Promise<void> {
    try {
      await getRedis().del(ENV_PREFIX + key);
    } catch (err) {
      logger.error({ cache: true }, `del failed for "${key}": ${(err as Error).message}`);
    }
  },

  async invalidatePattern(pattern: string): Promise<number> {
    try {
      const keys = await getRedis().keys(ENV_PREFIX + pattern);
      if (keys.length === 0) return 0;
      return await getRedis().del(...keys);
    } catch (err) {
      logger.error({ cache: true }, `invalidatePattern failed: ${(err as Error).message}`);
      return 0;
    }
  },
};
```

### Create `packages/backend/src/cache/index.ts`

```typescript
export { getRedis, connectRedis, disconnectRedis, redisHealthCheck } from './redis-client.js';
export { cache } from './cache-service.js';
```

### Success criteria
- `cache.set('test', { data: 1 }, 60)` stores a value
- `cache.get('test')` retrieves the value
- `redisHealthCheck()` returns `true` when Redis is up
- Keys are prefixed with environment name

---

## Step 6: API Scaffolding (Task 1.3.6)

### Create utility files first

**`packages/backend/src/utils/api-error.ts`**

```typescript
export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static validation(message: string, details?: unknown): ApiError {
    return new ApiError('VALIDATION_ERROR', message, 400, details);
  }

  static notFound(message = 'Resource not found'): ApiError {
    return new ApiError('NOT_FOUND', message, 404);
  }

  static unauthorized(message = 'Authentication required'): ApiError {
    return new ApiError('UNAUTHORIZED', message, 401);
  }

  static forbidden(message = 'Insufficient permissions'): ApiError {
    return new ApiError('FORBIDDEN', message, 403);
  }

  static conflict(message: string): ApiError {
    return new ApiError('ALREADY_EXISTS', message, 409);
  }

  static rateLimited(message = 'Too many requests'): ApiError {
    return new ApiError('RATE_LIMITED', message, 429);
  }

  static internal(message = 'An unexpected error occurred'): ApiError {
    return new ApiError('SERVER_ERROR', message, 500);
  }
}
```

**`packages/backend/src/utils/api-response.ts`**

Standardized response format per Spec Section B.0 and 27.1.

```typescript
import type { Response } from 'express';

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function sendSuccess(res: Response, data: unknown, statusCode = 200): void {
  res.status(statusCode).json({ success: true, data });
}

export function sendList(
  res: Response,
  data: unknown[],
  pagination: { page: number; limit: number; total: number },
): void {
  res.status(200).json({
    success: true,
    data,
    pagination: {
      ...pagination,
      totalPages: Math.ceil(pagination.total / pagination.limit),
    } satisfies Pagination,
  });
}

export function sendError(
  res: Response,
  code: string,
  message: string,
  statusCode: number,
  requestId?: string,
  details?: unknown,
): void {
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined && { details }),
      requestId,
      timestamp: new Date().toISOString(),
    },
  });
}
```

### Create middleware files

**`packages/backend/src/middleware/request-id.ts`**

```typescript
import { randomUUID } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';

export function requestId(req: Request, _res: Response, next: NextFunction): void {
  (req as Request & { requestId: string }).requestId = randomUUID();
  next();
}
```

**`packages/backend/src/middleware/request-logger.ts`**

```typescript
import { logger } from '../utils/logger.js';
import type { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const id = (req as Request & { requestId?: string }).requestId;
    logger.info({
      requestId: id,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
    });
  });

  next();
}
```

**`packages/backend/src/middleware/cors-config.ts`**

```typescript
import type { Request, Response, NextFunction } from 'express';

const ALLOWED_ORIGINS = (process.env['ALLOWED_ORIGINS'] ?? 'http://localhost:5173').split(',');
const ALLOWED_METHODS = 'GET,POST,PUT,PATCH,DELETE,OPTIONS';
const ALLOWED_HEADERS = 'Content-Type,Authorization';

export function corsConfig(req: Request, res: Response, next: NextFunction): void {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', ALLOWED_METHODS);
  res.setHeader('Access-Control-Allow-Headers', ALLOWED_HEADERS);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
}
```

**`packages/backend/src/middleware/not-found.ts`**

```typescript
import { sendError } from '../utils/api-response.js';
import type { Request, Response } from 'express';

export function notFound(req: Request, res: Response): void {
  const id = (req as Request & { requestId?: string }).requestId;
  sendError(res, 'NOT_FOUND', `Route not found: ${req.method} ${req.path}`, 404, id);
}
```

**`packages/backend/src/middleware/error-handler.ts`**

```typescript
import { ApiError } from '../utils/api-error.js';
import { sendError } from '../utils/api-response.js';
import { logger } from '../utils/logger.js';
import type { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const id = (req as Request & { requestId?: string }).requestId;

  if (err instanceof ApiError) {
    if (err.statusCode >= 500) {
      logger.error({ requestId: id, err }, err.message);
    }
    sendError(res, err.code, err.message, err.statusCode, id, err.details);
    return;
  }

  // Unexpected errors
  logger.error({ requestId: id, err }, 'Unhandled error');
  sendError(res, 'SERVER_ERROR', 'An unexpected error occurred', 500, id);
}
```

### Create type augmentation

**`packages/backend/src/types/express.d.ts`**

```typescript
declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

export {};
```

### Create routes

**`packages/backend/src/routes/health.ts`**

```typescript
import { Router } from 'express';
import { prisma } from '../db/index.js';
import { redisHealthCheck } from '../cache/index.js';
import { esHealthCheck } from '../search/elasticsearch-client.js';
import { sendSuccess } from '../utils/api-response.js';

const router = Router();

// Basic health check
router.get('/health', (_req, res) => {
  sendSuccess(res, {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
  });
});

// Detailed service status
router.get('/status', async (_req, res) => {
  const [dbOk, redisOk, esOk] = await Promise.all([
    prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false),
    redisHealthCheck(),
    esHealthCheck(),
  ]);

  const services = {
    database: dbOk ? 'ok' : 'error',
    redis: redisOk ? 'ok' : 'error',
    elasticsearch: esOk ? 'ok' : 'unavailable',
  };

  const healthy = dbOk && redisOk; // ES is optional (graceful degradation)
  res.status(healthy ? 200 : 503).json({
    success: true,
    data: {
      status: healthy ? 'healthy' : 'degraded',
      services,
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
```

**`packages/backend/src/routes/index.ts`**

```typescript
import { Router } from 'express';
import type { Express } from 'express';
import healthRouter from './health.js';
import { sendError } from '../utils/api-response.js';

export function setupRoutes(app: Express): void {
  // API v1
  const v1 = Router();
  v1.use('/', healthRouter);
  // Future route modules: auth, businesses, events, users, search, etc.

  app.use('/api/v1', v1);

  // Future API versions return 404 with guidance
  app.use('/api/v2', (_req, res) => {
    sendError(res, 'NOT_FOUND', 'API v2 is not available. Use /api/v1.', 404);
  });
}
```

### Create Express app

**`packages/backend/src/app.ts`**

```typescript
import express from 'express';
import { requestId } from './middleware/request-id.js';
import { requestLogger } from './middleware/request-logger.js';
import { corsConfig } from './middleware/cors-config.js';
import { notFound } from './middleware/not-found.js';
import { errorHandler } from './middleware/error-handler.js';
import { setupRoutes } from './routes/index.js';

export function createApp(): express.Express {
  const app = express();

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request pipeline
  app.use(requestId);
  app.use(corsConfig);
  app.use(requestLogger);

  // Routes
  setupRoutes(app);

  // Error handling (must be after routes)
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
```

### Replace server entry point

**`packages/backend/src/index.ts`** (replaces the current placeholder)

```typescript
import { createApp } from './app.js';
import { validateEnv } from './config/env-validate.js';
import { loadPlatformConfig } from './config/platform-loader.js';
import { connectRedis, disconnectRedis } from './cache/index.js';
import { disconnectDb } from './db/index.js';
import { logger } from './utils/logger.js';

async function main(): Promise<void> {
  // Validate configuration
  const env = validateEnv();
  const config = loadPlatformConfig();
  logger.info(`Platform: ${config.branding.platformName} [${env.NODE_ENV}]`);

  // Connect services
  await connectRedis();

  // Start server
  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info(`Server listening on http://localhost:${env.PORT}`);
    logger.info(`API: http://localhost:${env.PORT}/api/v1`);
  });

  // Graceful shutdown
  async function shutdown(signal: string): Promise<void> {
    logger.info(`${signal} received, shutting down...`);
    server.close();
    await disconnectRedis();
    await disconnectDb();
    process.exit(0);
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  logger.error(err, 'Failed to start server');
  process.exit(1);
});
```

### Success criteria
- `pnpm dev` starts the server on PORT from .env (default 3002)
- `GET /api/v1/health` returns `{ success: true, data: { status: "ok", ... } }`
- `GET /api/v1/status` returns service connectivity status
- `GET /api/v1/nonexistent` returns standardized 404 JSON
- `GET /api/v2/anything` returns "API v2 is not available" message
- Request logger outputs method, path, status, duration for every request
- Graceful shutdown disconnects Redis and Prisma

---

## Step 7: API Versioning (Task 1.3.8)

Already integrated into Step 6 via `routes/index.ts`. All routes under `/api/v1/`. The `/api/v2/` endpoint returns a descriptive 404.

---

## Step 8: Media Storage (Task 1.3.5)

### Install dependencies

```bash
cd packages/backend
pnpm add sharp
```

**Note:** `uuid` is not needed -- use `crypto.randomUUID()` from Node.js 22 (already available).

### Create `packages/backend/src/storage/storage-types.ts`

```typescript
export interface StorageResult {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  thumbnails?: Record<string, string>; // { small: "uuid_small.webp", ... }
}

export interface UploadOptions {
  mimeType: string;
  generateThumbnails?: boolean;
}
```

### Create `packages/backend/src/storage/image-processor.ts`

```typescript
import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const THUMBNAIL_SIZES = { small: 150, medium: 300, large: 600 } as const;

export async function stripExif(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer).rotate().toBuffer(); // rotate() auto-orients and strips EXIF
}

export async function toWebP(buffer: Buffer, quality = 80): Promise<Buffer> {
  return sharp(buffer).webp({ quality }).toBuffer();
}

export async function generateThumbnails(
  buffer: Buffer,
  baseFilename: string,
  storagePath: string,
): Promise<Record<string, string>> {
  const baseName = baseFilename.replace(/\.[^.]+$/, '');
  const thumbnails: Record<string, string> = {};

  for (const [label, width] of Object.entries(THUMBNAIL_SIZES)) {
    const thumbName = `${baseName}_${label}.webp`;
    const thumbBuffer = await sharp(buffer)
      .resize(width, width, { fit: 'cover' })
      .webp({ quality: 75 })
      .toBuffer();
    await writeFile(resolve(storagePath, thumbName), thumbBuffer);
    thumbnails[label] = thumbName;
  }

  return thumbnails;
}
```

### Create `packages/backend/src/storage/local-storage.ts`

Per Spec Section 4.10: UUID filenames, magic byte validation, EXIF stripping, WebP conversion.

```typescript
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, unlink, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { logger } from '../utils/logger.js';
import { stripExif, toWebP, generateThumbnails } from './image-processor.js';
import type { StorageResult, UploadOptions } from './storage-types.js';

const STORAGE_PATH = process.env['STORAGE_PATH'] ?? './uploads';

// Spec Section 4.10: size limits
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;  // 5 MB
const MAX_DOC_BYTES = 10 * 1024 * 1024;   // 10 MB

// Spec Section 4.10: accepted MIME types
const ACCEPTED_IMAGES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const ACCEPTED_DOCS = ['application/pdf'] as const;
const ACCEPTED_TYPES = [...ACCEPTED_IMAGES, ...ACCEPTED_DOCS] as const;

// Magic byte signatures
const SIGNATURES: Record<string, (buf: Buffer) => boolean> = {
  'image/jpeg': (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/png': (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  'image/webp': (b) =>
    b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP',
  'application/pdf': (b) => b.toString('ascii', 0, 5) === '%PDF-',
};

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.webp',  // converted to WebP
  'image/png': '.webp',   // converted to WebP
  'image/webp': '.webp',
  'application/pdf': '.pdf',
};

function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const check = SIGNATURES[mimeType];
  return check ? check(buffer) : false;
}

function isImage(mimeType: string): boolean {
  return (ACCEPTED_IMAGES as readonly string[]).includes(mimeType);
}

export async function uploadFile(
  buffer: Buffer,
  options: UploadOptions,
): Promise<StorageResult> {
  // Validate MIME type is accepted
  if (!(ACCEPTED_TYPES as readonly string[]).includes(options.mimeType)) {
    throw new Error(`File type not accepted: ${options.mimeType}`);
  }

  // Validate magic bytes match declared MIME type
  if (!validateMagicBytes(buffer, options.mimeType)) {
    throw new Error('File content does not match declared MIME type');
  }

  // Validate size limits
  const maxBytes = isImage(options.mimeType) ? MAX_IMAGE_BYTES : MAX_DOC_BYTES;
  if (buffer.length > maxBytes) {
    throw new Error(`File exceeds ${maxBytes / (1024 * 1024)}MB limit`);
  }

  // Generate UUID filename (never use original filename)
  const ext = EXTENSIONS[options.mimeType] ?? '.bin';
  const filename = `${randomUUID()}${ext}`;
  const filepath = resolve(STORAGE_PATH, filename);

  // Process images
  let output = buffer;
  let finalMime = options.mimeType;
  if (isImage(options.mimeType)) {
    output = await stripExif(output);
    output = await toWebP(output);
    finalMime = 'image/webp';
  }

  // Write file
  await mkdir(STORAGE_PATH, { recursive: true });
  await writeFile(filepath, output);

  // Generate thumbnails if requested
  let thumbnails: Record<string, string> | undefined;
  if (options.generateThumbnails && isImage(options.mimeType)) {
    thumbnails = await generateThumbnails(output, filename, STORAGE_PATH);
  }

  logger.info(`File uploaded: ${filename} (${output.length} bytes)`);

  return {
    filename,
    mimeType: finalMime,
    sizeBytes: output.length,
    thumbnails,
  };
}

export async function deleteFile(filename: string): Promise<void> {
  // Path traversal prevention (Spec Section 4.10)
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    throw new Error('Invalid filename');
  }

  try {
    await unlink(resolve(STORAGE_PATH, filename));
    logger.info(`File deleted: ${filename}`);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
    logger.warn(`File not found for deletion: ${filename}`);
  }
}

export async function fileExists(filename: string): Promise<boolean> {
  try {
    await access(resolve(STORAGE_PATH, filename));
    return true;
  } catch {
    return false;
  }
}

export function getFileUrl(filename: string): string {
  return `/api/v1/media/${filename}`;
}
```

### Create `packages/backend/src/storage/index.ts`

```typescript
export { uploadFile, deleteFile, fileExists, getFileUrl } from './local-storage.js';
export type { StorageResult, UploadOptions } from './storage-types.js';
```

### Success criteria
- Upload a JPEG buffer -> UUID filename with `.webp` extension returned
- EXIF metadata stripped from output
- Thumbnails generated at 150px, 300px, 600px when requested
- Magic byte validation rejects mismatched content
- Path traversal (`../etc/passwd`) rejected by `deleteFile`
- Files larger than 5MB (images) / 10MB (docs) rejected

---

## Step 9: Elasticsearch (Task 1.3.7)

### Install dependency

```bash
cd packages/backend
pnpm add @elastic/elasticsearch
```

### Create `packages/backend/src/search/elasticsearch-client.ts`

```typescript
import { Client } from '@elastic/elasticsearch';
import { logger } from '../utils/logger.js';

let client: Client | null = null;

export function getEsClient(): Client {
  if (!client) {
    const node = process.env['ELASTICSEARCH_URL'] ?? 'http://localhost:9200';
    const apiKey = process.env['ELASTICSEARCH_API_KEY'];

    client = new Client({
      node,
      ...(apiKey && { auth: { apiKey } }),
    });
  }
  return client;
}

export async function esHealthCheck(): Promise<boolean> {
  try {
    await getEsClient().ping();
    return true;
  } catch {
    return false;
  }
}

export async function closeEsClient(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
  }
}
```

### Create `packages/backend/src/search/index-manager.ts`

```typescript
import { getEsClient } from './elasticsearch-client.js';
import { logger } from '../utils/logger.js';

const INDICES = {
  businesses: {
    settings: {
      number_of_shards: 1,
      number_of_replicas: 0,
      analysis: {
        analyzer: {
          multilingual: { type: 'standard', stopwords: '_english_' },
        },
      },
    },
    mappings: {
      properties: {
        id: { type: 'keyword' },
        name: { type: 'text', analyzer: 'multilingual' },
        description: { type: 'text', analyzer: 'multilingual' },
        categorySlug: { type: 'keyword' },
        suburb: { type: 'keyword' },
        location: { type: 'geo_point' },
        rating: { type: 'float' },
        status: { type: 'keyword' },
        createdAt: { type: 'date' },
        updatedAt: { type: 'date' },
      },
    },
  },
} as const;

export async function setupIndices(): Promise<void> {
  const es = getEsClient();

  for (const [name, config] of Object.entries(INDICES)) {
    try {
      const exists = await es.indices.exists({ index: name });
      if (!exists) {
        await es.indices.create({ index: name, ...config });
        logger.info(`Elasticsearch index created: ${name}`);
      } else {
        logger.info(`Elasticsearch index exists: ${name}`);
      }
    } catch (err) {
      // Graceful degradation per Spec Section 27.5
      logger.warn(`Failed to create ES index "${name}": ${(err as Error).message}`);
    }
  }
}
```

### Create `packages/backend/src/search/index.ts`

```typescript
export { getEsClient, esHealthCheck, closeEsClient } from './elasticsearch-client.js';
export { setupIndices } from './index-manager.js';
```

### Update server entry point

Add ES setup to `packages/backend/src/index.ts` startup:

```typescript
// After connectRedis():
import { setupIndices } from './search/index.js';

// Inside main(), after connectRedis():
try {
  await setupIndices();
} catch {
  logger.warn('Elasticsearch setup failed -- search will use database fallback');
}
```

Also add `closeEsClient` to the shutdown handler.

### Success criteria
- ES client connects when Elasticsearch is running
- `setupIndices()` creates `businesses` index
- `esHealthCheck()` returns true/false based on connectivity
- If ES is down, server starts with a warning (graceful degradation)
- Health status endpoint reports ES status

---

## Step 10: Testing

### Test file locations

```
packages/backend/src/__tests__/
  utils/
    logger.test.ts
    api-error.test.ts
    api-response.test.ts
  cache/
    cache-service.test.ts
  storage/
    local-storage.test.ts
    image-processor.test.ts
  middleware/
    error-handler.test.ts
    request-id.test.ts
  routes/
    health.test.ts
  db/
    seed.test.ts
```

### Testing patterns to follow (from existing tests)

- Import from `vitest`: `describe`, `it`, `expect`, `vi`, `beforeEach`, `afterEach`
- Use `.js` extension in imports (ESM)
- Use `vi.fn()` for mock functions, `vi.spyOn()` for partial mocks
- Use `vi.stubEnv()` for environment variables, `vi.unstubAllEnvs()` in cleanup
- Use factory functions from `@community-hub/shared/testing` for fixtures
- Mock Express `res` with `vi.fn().mockReturnThis()` for method chaining
- Test error cases with `expect(() => fn()).toThrow('message')`

### Key test cases

**api-error.test.ts:**
- Static factory methods return correct codes and status codes
- Custom error preserves code, message, statusCode, details

**api-response.test.ts:**
- `sendSuccess` sends `{ success: true, data }` with correct status
- `sendList` calculates `totalPages` correctly
- `sendError` includes requestId and timestamp

**cache-service.test.ts:**
- `get`/`set`/`del` work with key prefixing
- `set` with TTL calls `setex`
- Operations return null/void on Redis errors (no throws)

**local-storage.test.ts:**
- Rejects invalid MIME types
- Rejects mismatched magic bytes
- Rejects files exceeding size limits
- Rejects path traversal characters in `deleteFile`
- Generates UUID filename, not original

**error-handler.test.ts:**
- `ApiError` instances return structured error with correct status
- Unknown errors return 500 with generic message
- Logs errors via logger

**health.test.ts (integration):**
- Health endpoint returns 200 with status and uptime
- Status endpoint reports service health

### Success criteria
- All tests pass: `pnpm test`
- Coverage meets 80% threshold: `pnpm test:coverage`

---

## New Dependencies Summary

```bash
cd packages/backend
pnpm add @prisma/client ioredis sharp @elastic/elasticsearch
pnpm add -D prisma
```

**No `uuid` package needed** -- Node.js 22 provides `crypto.randomUUID()`.

**No `cors` package needed** -- CORS is handled via a lightweight custom middleware to avoid an extra dependency for simple header management.

---

## Files Created (complete list)

```
packages/backend/
  prisma/
    schema.prisma                              # Step 3
  src/
    index.ts                                   # Step 6 (replaces placeholder)
    app.ts                                     # Step 6
    types/
      express.d.ts                             # Step 6
    utils/
      logger.ts                                # Step 1
      prisma-version-check.ts                  # Step 2
      api-error.ts                             # Step 6
      api-response.ts                          # Step 6
    db/
      index.ts                                 # Step 4
      seed.ts                                  # Step 4
    cache/
      index.ts                                 # Step 5
      redis-client.ts                          # Step 5
      cache-service.ts                         # Step 5
    storage/
      index.ts                                 # Step 8
      storage-types.ts                         # Step 8
      local-storage.ts                         # Step 8
      image-processor.ts                       # Step 8
    search/
      index.ts                                 # Step 9
      elasticsearch-client.ts                  # Step 9
      index-manager.ts                         # Step 9
    routes/
      index.ts                                 # Step 6
      health.ts                                # Step 6
    middleware/
      request-id.ts                            # Step 6
      request-logger.ts                        # Step 6
      cors-config.ts                           # Step 6
      not-found.ts                             # Step 6
      error-handler.ts                         # Step 6
    __tests__/
      utils/
        logger.test.ts                         # Step 10
        api-error.test.ts                      # Step 10
        api-response.test.ts                   # Step 10
      cache/
        cache-service.test.ts                  # Step 10
      storage/
        local-storage.test.ts                  # Step 10
        image-processor.test.ts                # Step 10
      middleware/
        error-handler.test.ts                  # Step 10
        request-id.test.ts                     # Step 10
      routes/
        health.test.ts                         # Step 10
      db/
        seed.test.ts                           # Step 10
```

Total: ~26 source files + ~10 test files

---

## Files Modified

| File | Change |
|------|--------|
| `packages/backend/package.json` | Add dependencies, scripts, prisma config |
| `packages/backend/tsconfig.json` | May need to add `prisma/` to include path for generated types |

---

## Verification Checklist

After all steps are complete, verify:

1. `pnpm install` -- no errors
2. `npx prisma --version` -- reports installed version
3. Docker services running: `docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up -d`
4. `cd packages/backend && npx prisma migrate dev --name init` -- creates tables
5. `cd packages/backend && npx prisma db seed` -- populates seed data
6. `pnpm dev` (from backend) -- server starts on port 3002
7. `curl http://localhost:3002/api/v1/health` -- returns `{ success: true, data: { status: "ok" } }`
8. `curl http://localhost:3002/api/v1/status` -- returns service connectivity
9. `curl http://localhost:3002/api/v1/nonexistent` -- returns 404 JSON
10. `curl http://localhost:3002/api/v2/anything` -- returns version not available
11. `pnpm test` -- all tests pass
12. `pnpm typecheck` -- no TypeScript errors
13. `pnpm lint` -- no ESLint errors

---

## Risk Notes

1. **Prisma version:** The spec requires >= 7.3.0 but Prisma 7.x may not be released yet. Install the latest stable version and update the version check constant. The schema syntax should be compatible across versions.

2. **Sharp on Windows:** Sharp uses native binaries. If installation fails on Windows, try `pnpm add sharp --ignore-scripts` then `npx @mapbox/node-pre-gyp rebuild`. If still problematic, the image processor can be tested on CI (Linux) while development uses a no-op fallback.

3. **Elasticsearch startup time:** ES takes 30-60 seconds to become healthy after Docker starts. The graceful degradation pattern means the server starts immediately; ES index setup is best-effort.

4. **Redis connection on startup:** The `lazyConnect` option means Redis connects on first use, not on `new Redis()`. The explicit `connectRedis()` call in the entry point ensures the connection is established before the server accepts requests.

5. **Express 5 type augmentation:** Express 5 changed some type signatures. The `express.d.ts` augmentation adds `requestId` to the Request interface. If Express 5 types don't support `namespace Express`, use module augmentation with `declare module 'express'` instead.
