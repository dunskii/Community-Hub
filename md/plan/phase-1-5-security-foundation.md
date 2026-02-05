# Phase 1.5: Security Foundation - Implementation Plan

## Overview

Phase 1.5 implements comprehensive security hardening from Specification Section 4 (Security & Privacy). It follows the completed Phases 1.1-1.4 and prepares the security baseline for authentication (Phase 2) and all subsequent features.

**11 tasks** from TODO.md lines 72-85, organized into 7 implementation steps.

---

## Pre-Implementation Analysis

### Already Done (Phase 1.3)

- `helmet()` called with defaults in `packages/backend/src/app.ts:18` (sets X-Frame-Options: DENY, X-Content-Type-Options: nosniff)
- Rate limiting: 4 tiers in `packages/backend/src/middleware/rate-limiter.ts` (global 30/min, auth 10/15min, API 100/min, uploads 20/hr)
- `ENCRYPTION_KEY` validated as base64 32-byte key in `packages/backend/src/config/env-validate.ts:35-37`
- `SESSION_SECRET` validated as 64+ chars in `packages/backend/src/config/env-validate.ts:34`
- Path traversal prevention in `packages/backend/src/utils/path-validation.ts`
- CORS in `packages/backend/src/middleware/cors-config.ts`
- Zod used extensively for validation

### What Needs to Be Built

1. Custom helmet configuration for CSP, HSTS, Referrer-Policy
2. Verification tests for X-Frame-Options and X-Content-Type-Options
3. Password reset + search + review rate limiters
4. Input validation middleware factory (Zod-based)
5. Input sanitization middleware (server-side DOMPurify)
6. AES-256-GCM encryption utility
7. CSRF protection middleware
8. Config endpoint field filtering (QA item M-01)

### Deferred

- **Task 6 (TLS 1.3):** Deferred to Phase 19 - server/Cloudflare/nginx config, not application code

---

## Task Ordering and Dependencies

```
Step 1: Security Headers (Tasks 1-5)         -- no dependencies
Step 2: Rate Limiting Enhancement (Task 7)    -- no dependencies
Step 3: Input Validation Middleware (Task 8)   -- no dependencies
Step 4: Input Sanitization Middleware (Task 11) -- depends on Step 3
Step 5: AES-256 Encryption Utility (Task 9)   -- no dependencies
Step 6: CSRF Protection Middleware (Task 10)   -- no dependencies
Step 7: Config Endpoint Filtering (bonus)      -- no dependencies
```

Steps 1, 2, 3, 5, 6 can be implemented in parallel. Step 4 depends on Step 3.

---

## Step 1: Security Headers (Tasks 1, 2, 3, 4, 5)

### Goal

Replace the bare `helmet()` call with fully-configured helmet that sets all 5 headers from Spec Section 4.5.

### Files

| File | Action |
|------|--------|
| `packages/backend/src/app.ts` | Modify - replace `helmet()` with configured call |
| `packages/backend/src/__tests__/middleware/security-headers.test.ts` | Create - test all 5 headers |

### Implementation

Replace `app.use(helmet())` in `app.ts` with:

```typescript
const isDev = process.env['NODE_ENV'] !== 'production';

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        imgSrc: ["'self'", 'data:', 'https://api.mapbox.com', 'https://*.tiles.mapbox.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        connectSrc: [
          "'self'",
          'https://api.mapbox.com',
          'https://events.mapbox.com',
          ...(isDev ? ['ws://localhost:*'] : []),
        ],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin',
    },
    frameguard: { action: 'deny' },
    noSniff: true,
  }),
);
```

### CSP Decisions

- `'unsafe-inline'` in styleSrc: Required for Tailwind CSS 4 runtime styles and Google Fonts inline styles. Can be tightened with nonces later.
- `fonts.googleapis.com` / `fonts.gstatic.com`: Frontend loads Montserrat and Open Sans (see `packages/frontend/index.html:15-20`).
- `api.mapbox.com` / `*.tiles.mapbox.com`: Required for Maps integration (Phase 1.7).
- `ws://localhost:*` in dev: Required for Vite HMR.
- `frameSrc: ["'none'"]` and `objectSrc: ["'none'"]`: Block iframes and plugins.

### Tests (`security-headers.test.ts`)

- Response includes `Content-Security-Policy` with expected directives
- Response includes `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- Response includes `X-Frame-Options: DENY`
- Response includes `X-Content-Type-Options: nosniff`
- Response includes `Referrer-Policy: strict-origin-when-cross-origin`
- CSP `script-src` does not contain `'unsafe-inline'`
- CSP allows Google Fonts
- CSP `frame-src` is `'none'`

### Dependencies

None - `helmet` 8.1.0 already installed.

### Task 6 Note

Add comment in `app.ts`: `// TLS 1.3: Configured at reverse proxy level (Cloudflare/nginx). See Phase 19.`

---

## Step 2: Rate Limiting Enhancement (Task 7)

### Goal

Add 3 missing rate limiters per Spec Section 4.8. Defer 2 feature-specific limiters.

### Files

| File | Action |
|------|--------|
| `packages/backend/src/middleware/rate-limiter.ts` | Modify - add 3 new limiters + TODO comments |
| `packages/backend/src/__tests__/middleware/rate-limiter.test.ts` | Create |

### New Limiters

```typescript
/** Spec Section 4.8: 3 requests per 1 hour */
export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 3,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: RATE_LIMIT_MESSAGE,
});

/** Spec Section 4.8: 30 requests per 1 minute */
export const searchRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: RATE_LIMIT_MESSAGE,
});

/** Spec Section 4.8: 5 reviews per 24 hours */
export const reviewRateLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: RATE_LIMIT_MESSAGE,
});
```

### Deferred (TODO comments)

- `conversationRateLimiter` - 10/day, Phase 9 (Messaging)
- `flashDealRateLimiter` - 2/week, Phase 10 (Deals)

### Tests (`rate-limiter.test.ts`)

- All 7 limiters are exported
- Each limiter has correct windowMs and limit values
- All use `standardHeaders: 'draft-7'` and `legacyHeaders: false`

### Dependencies

None - `express-rate-limit` 7.5.0 already installed.

---

## Step 3: Input Validation Middleware (Task 8)

### Goal

Create a Zod-based validation middleware factory for body, query, and params.

### Files

| File | Action |
|------|--------|
| `packages/backend/src/middleware/validate.ts` | Create |
| `packages/backend/src/__tests__/middleware/validate.test.ts` | Create |

### Implementation

```typescript
import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema, ZodError } from 'zod';
import { ApiError } from '../utils/api-error.js';

interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

function formatValidationErrors(error: ZodError): Array<{ field: string; message: string }> {
  return error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));
}

export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        throw ApiError.validation('Invalid path parameters', formatValidationErrors(result.error));
      }
      req.params = result.data;
    }
    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        throw ApiError.validation('Invalid query parameters', formatValidationErrors(result.error));
      }
      (req as any).query = result.data;
    }
    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        throw ApiError.validation('Invalid request body', formatValidationErrors(result.error));
      }
      req.body = result.data;
    }
    next();
  };
}
```

### Key Decisions

- Replaces `req.body/query/params` with parsed Zod output (coerced, transformed values)
- Errors thrown as `ApiError.validation()` - existing error handler formats per Spec Section 27.1
- Error details: `[{ field, message }]` format for field-level feedback
- No new dependencies - uses Zod (installed) and existing ApiError

### Tests (`validate.test.ts`)

- Body validation success (req.body replaced with parsed data)
- Body validation failure (throws ApiError with 400)
- Query validation success/failure
- Params validation success/failure
- Combined body + query + params validation
- Zod transforms applied (e.g., string to number coercion)
- Unknown fields stripped
- Error details contain field path and message

### Dependencies

None.

---

## Step 4: Input Sanitization Middleware (Task 11)

### Goal

Server-side HTML sanitization for rich text fields and plain text stripping per Spec Section 4.9.

### Technical Decision: `isomorphic-dompurify`

DOMPurify requires a DOM. `isomorphic-dompurify` wraps DOMPurify + jsdom for server-side use. 1M+ weekly npm downloads, standard approach.

### Files

| File | Action |
|------|--------|
| `packages/backend/src/utils/sanitizer.ts` | Create - core sanitization functions |
| `packages/backend/src/middleware/sanitize.ts` | Create - Express middleware |
| `packages/backend/src/__tests__/utils/sanitizer.test.ts` | Create |
| `packages/backend/src/__tests__/middleware/sanitize.test.ts` | Create |
| `packages/backend/package.json` | Modify - add dependency |

### Dependencies to Install

```bash
pnpm --filter @community-hub/backend add isomorphic-dompurify
pnpm --filter @community-hub/backend add -D @types/dompurify
```

### Core Utility (`utils/sanitizer.ts`)

```typescript
import DOMPurify from 'isomorphic-dompurify';

const ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a'];
const ALLOWED_ATTR = ['href', 'rel', 'target'];

export function sanitizeRichText(dirty: string): string {
  const clean = DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  });
  return clean.replace(/<a\s/g, '<a rel="nofollow noopener" ');
}

export function stripHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] });
}

export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (['javascript:', 'data:', 'vbscript:'].includes(parsed.protocol)) {
      return null;
    }
    return parsed.href;
  } catch {
    return null;
  }
}
```

### Middleware (`middleware/sanitize.ts`)

```typescript
import type { Request, Response, NextFunction } from 'express';
import { sanitizeRichText, stripHtml } from '../utils/sanitizer.js';

interface SanitizeOptions {
  richTextFields?: string[];
  plainTextFields?: string[];
}

export function sanitize(options: SanitizeOptions) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (req.body && typeof req.body === 'object') {
      for (const field of options.richTextFields ?? []) {
        if (typeof req.body[field] === 'string') {
          req.body[field] = sanitizeRichText(req.body[field]);
        }
      }
      for (const field of options.plainTextFields ?? []) {
        if (typeof req.body[field] === 'string') {
          req.body[field] = stripHtml(req.body[field]);
        }
      }
    }
    next();
  };
}
```

### Spec Section 4.9 Requirements

| Requirement | Implementation |
|-------------|---------------|
| Allowed HTML tags | `p`, `br`, `strong`, `em`, `ul`, `ol`, `li`, `a` (with `rel="nofollow"`) |
| Blocked content | `script`, `iframe`, `object`, `embed`, `style`, event handlers |
| Plain text fields | Strip all HTML |
| URL fields | Block `javascript:`, `data:`, `vbscript:` schemes |

### Tests (`sanitizer.test.ts`)

- `sanitizeRichText`: allows all 8 permitted tags
- `sanitizeRichText`: strips `<script>`, `<iframe>`, `<object>`, `<embed>`, `<style>`
- `sanitizeRichText`: strips `onclick` and all event handlers
- `sanitizeRichText`: adds `rel="nofollow noopener"` to `<a>` tags
- `sanitizeRichText`: handles empty string
- `stripHtml`: removes all HTML, preserves text content
- `stripHtml`: handles entities correctly
- `sanitizeUrl`: accepts `http://` and `https://`
- `sanitizeUrl`: rejects `javascript:` and `data:` URLs
- `sanitizeUrl`: returns null for invalid URLs

### Tests (`sanitize.test.ts`)

- Rich text fields sanitized in req.body
- Plain text fields stripped in req.body
- Non-string fields left untouched
- Missing fields don't cause errors
- Middleware calls next()

---

## Step 5: AES-256 Encryption Utility (Task 9)

### Goal

Encryption utility for sensitive data at rest per Spec Section 4.2.

### Technical Decision: AES-256-GCM

Using `node:crypto` with AES-256-GCM (authenticated encryption). GCM preferred over CBC because:
- Built-in authentication (integrity + confidentiality)
- Detects tampering without separate HMAC
- NIST recommended standard

### Files

| File | Action |
|------|--------|
| `packages/backend/src/utils/encryption.ts` | Create |
| `packages/backend/src/__tests__/utils/encryption.test.ts` | Create |

### Implementation (`utils/encryption.ts`)

```typescript
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer {
  const keyBase64 = process.env['ENCRYPTION_KEY'];
  if (!keyBase64) throw new Error('ENCRYPTION_KEY environment variable is not set');
  const key = Buffer.from(keyBase64, 'base64');
  if (key.length !== 32) throw new Error('ENCRYPTION_KEY must decode to exactly 32 bytes');
  return key;
}

export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

export function decrypt(encryptedPayload: string): string {
  const parts = encryptedPayload.split(':');
  if (parts.length !== 3) throw new Error('Invalid encrypted payload format');
  const [ivBase64, authTagBase64, ciphertext] = parts;
  const key = getKey();
  const iv = Buffer.from(ivBase64!, 'base64');
  const authTag = Buffer.from(authTagBase64!, 'base64');
  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(ciphertext!, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

### Storage Format

`iv:authTag:ciphertext` (all base64-encoded, colon-separated)

### Sensitive Data Candidates

- Password reset tokens
- Email verification tokens
- API keys in database
- User phone numbers

### Tests (`encryption.test.ts`)

- Encrypt/decrypt round-trip with simple string
- Encrypt/decrypt round-trip with unicode (multilingual)
- Encrypt/decrypt round-trip with empty string
- Different ciphertexts for same plaintext (random IV)
- Decrypt throws on tampered ciphertext
- Decrypt throws on tampered auth tag
- Decrypt throws on invalid format (not 3 parts)
- Decrypt throws on wrong key
- getKey throws when ENCRYPTION_KEY not set
- getKey throws when ENCRYPTION_KEY decodes to wrong length

### Dependencies

None - uses `node:crypto` built-in.

---

## Step 6: CSRF Protection Middleware (Task 10)

### Goal

CSRF protection per Spec Section 4.7.

### Technical Decision: Double-Submit Cookie with Signed Tokens

Since Phase 2 (Auth) hasn't built sessions yet, use the stateless double-submit cookie pattern:
1. Generate random CSRF token, HMAC-sign it with SESSION_SECRET
2. Set signed token in `XSRF-TOKEN` cookie (httpOnly=false so client JS can read it)
3. Client sends the token back via `X-CSRF-Token` header on non-safe requests
4. Middleware validates header matches cookie

Cookie attributes: `SameSite=Strict`, `Secure` (production only), `httpOnly=false`.

### Files

| File | Action |
|------|--------|
| `packages/backend/src/middleware/csrf.ts` | Create |
| `packages/backend/src/__tests__/middleware/csrf.test.ts` | Create |
| `packages/backend/src/app.ts` | Modify - add cookie-parser and CSRF middleware |

### Dependencies to Install

```bash
pnpm --filter @community-hub/backend add cookie-parser
pnpm --filter @community-hub/backend add -D @types/cookie-parser
```

### Implementation (`middleware/csrf.ts`)

```typescript
import { randomBytes, createHmac, timingSafeEqual } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/api-error.js';

const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
const CSRF_HEADER_NAME = 'x-csrf-token';
const TOKEN_LENGTH = 32;
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function getSecret(): string {
  const secret = process.env['SESSION_SECRET'];
  if (!secret) throw new Error('SESSION_SECRET is required for CSRF protection');
  return secret;
}

function generateToken(): string {
  return randomBytes(TOKEN_LENGTH).toString('hex');
}

function signToken(token: string): string {
  const hmac = createHmac('sha256', getSecret());
  hmac.update(token);
  return `${token}.${hmac.digest('hex')}`;
}

function verifySignedToken(signedToken: string): string | null {
  const dotIndex = signedToken.lastIndexOf('.');
  if (dotIndex === -1) return null;
  const token = signedToken.substring(0, dotIndex);
  const signature = signedToken.substring(dotIndex + 1);
  const hmac = createHmac('sha256', getSecret());
  hmac.update(token);
  const expected = hmac.digest('hex');
  try {
    const sigBuf = Buffer.from(signature, 'hex');
    const expBuf = Buffer.from(expected, 'hex');
    if (sigBuf.length !== expBuf.length) return null;
    if (!timingSafeEqual(sigBuf, expBuf)) return null;
  } catch { return null; }
  return token;
}

export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  const isProduction = process.env['NODE_ENV'] === 'production';

  const existingCookie = req.cookies?.[CSRF_COOKIE_NAME];
  let token: string;
  if (existingCookie) {
    const verified = verifySignedToken(existingCookie);
    token = verified ?? generateToken();
  } else {
    token = generateToken();
  }

  res.cookie(CSRF_COOKIE_NAME, signToken(token), {
    httpOnly: false,
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
  });

  if (SAFE_METHODS.has(req.method)) { next(); return; }

  const headerToken = req.headers[CSRF_HEADER_NAME] as string | undefined;
  if (!headerToken) throw ApiError.forbidden('CSRF token missing');

  const headerVerified = verifySignedToken(headerToken);
  if (!headerVerified || headerVerified !== token) throw ApiError.forbidden('CSRF token invalid');

  next();
}
```

### Integration in `app.ts`

```typescript
import cookieParser from 'cookie-parser';
import { csrfProtection } from './middleware/csrf.js';

// After body parsing:
app.use(cookieParser());
app.use(csrfProtection);
```

### Future Consideration

Phase 2 can add a Bearer token bypass: `if (req.headers.authorization?.startsWith('Bearer ')) { next(); return; }` for API consumers using JWT authentication.

### Tests (`csrf.test.ts`)

- GET requests pass without CSRF token
- HEAD requests pass without CSRF token
- OPTIONS requests pass without CSRF token
- POST without CSRF header returns 403
- POST with invalid CSRF header returns 403
- POST with valid CSRF header passes
- PUT/DELETE require CSRF token
- XSRF-TOKEN cookie set on response
- Cookie has correct attributes (sameSite=strict, httpOnly=false)
- Tampered cookie signature rejected
- Timing-safe comparison works correctly

---

## Step 7: Config Endpoint Filtering (Bonus - QA M-01)

### Goal

Address QA finding M-01: Config endpoint serves full `platform.json` without field filtering.

### Files

| File | Action |
|------|--------|
| `packages/backend/src/routes/config.ts` | Modify - add field filter |
| `packages/backend/src/__tests__/routes/config.test.ts` | Modify - add filter assertions |

### Implementation

Add a whitelist filter function that picks only frontend-safe fields:

```typescript
function filterConfigForFrontend(config: PlatformConfig) {
  return {
    platform: config.platform,
    location: {
      suburbName: config.location.suburbName,
      suburbNameShort: config.location.suburbNameShort,
      region: config.location.region,
      city: config.location.city,
      state: config.location.state,
      coordinates: config.location.coordinates,
      timezone: config.location.timezone,
      locale: config.location.locale,
      currency: config.location.currency,
      currencySymbol: config.location.currencySymbol,
    },
    branding: config.branding,
    features: config.features,
    multilingual: config.multilingual,
    seo: config.seo,
    legal: config.legal,
    limits: config.limits,
  };
}
```

Removes: `partners.*.contactEmail`, `contact.*`, `analytics.googleAnalyticsId`, `location.boundingBox`, `location.postcodeRange`, `location.phoneCountryCode`.

---

## All Files Summary

| # | File | Action | Step |
|---|------|--------|------|
| 1 | `packages/backend/src/app.ts` | Modify | 1, 6 |
| 2 | `packages/backend/src/middleware/rate-limiter.ts` | Modify | 2 |
| 3 | `packages/backend/src/middleware/validate.ts` | Create | 3 |
| 4 | `packages/backend/src/middleware/sanitize.ts` | Create | 4 |
| 5 | `packages/backend/src/middleware/csrf.ts` | Create | 6 |
| 6 | `packages/backend/src/utils/sanitizer.ts` | Create | 4 |
| 7 | `packages/backend/src/utils/encryption.ts` | Create | 5 |
| 8 | `packages/backend/src/routes/config.ts` | Modify | 7 |
| 9 | `packages/backend/src/__tests__/middleware/security-headers.test.ts` | Create | 1 |
| 10 | `packages/backend/src/__tests__/middleware/rate-limiter.test.ts` | Create | 2 |
| 11 | `packages/backend/src/__tests__/middleware/validate.test.ts` | Create | 3 |
| 12 | `packages/backend/src/__tests__/middleware/sanitize.test.ts` | Create | 4 |
| 13 | `packages/backend/src/__tests__/middleware/csrf.test.ts` | Create | 6 |
| 14 | `packages/backend/src/__tests__/utils/sanitizer.test.ts` | Create | 4 |
| 15 | `packages/backend/src/__tests__/utils/encryption.test.ts` | Create | 5 |
| 16 | `packages/backend/src/__tests__/routes/config.test.ts` | Modify | 7 |
| 17 | `packages/backend/package.json` | Modify | 4, 6 |

## New Dependencies

| Package | Type | Purpose | Step |
|---------|------|---------|------|
| `isomorphic-dompurify` | runtime | Server-side HTML sanitization | 4 |
| `@types/dompurify` | dev | TypeScript types for DOMPurify | 4 |
| `cookie-parser` | runtime | Cookie parsing for CSRF | 6 |
| `@types/cookie-parser` | dev | TypeScript types for cookie-parser | 6 |

---

## Success Criteria

1. All 5 security headers verified in responses (CSP, X-Frame-Options, X-Content-Type-Options, HSTS, Referrer-Policy)
2. CSP allows Google Fonts and Mapbox while blocking inline scripts and iframes
3. 7 rate limiters exported (global, auth, api, upload, passwordReset, search, review)
4. Password reset limiter enforces 3 requests per hour
5. Validation middleware validates body, query, params using Zod schemas
6. Sanitization strips `<script>`, `<iframe>`, event handlers from rich text
7. URL sanitization blocks `javascript:` and `data:` schemes
8. AES-256-GCM encrypt/decrypt round-trip works correctly
9. Encryption produces different ciphertext for same plaintext (random IV)
10. Tampered ciphertext detected and rejected
11. CSRF blocks POST/PUT/DELETE without valid token
12. CSRF passes GET/HEAD/OPTIONS without token
13. Config endpoint serves filtered fields only
14. All existing 180 tests continue passing
15. New tests bring total above 220
16. `pnpm lint`, `pnpm typecheck`, and `pnpm test` all pass

---

## TODO.md Task Mapping

| TODO Task | After Phase 1.5 | Step |
|-----------|-----------------|------|
| 1. CSP header | Complete | 1 |
| 2. X-Frame-Options (DENY) | Complete (verify) | 1 |
| 3. X-Content-Type-Options (nosniff) | Complete (verify) | 1 |
| 4. HSTS header | Complete | 1 |
| 5. Referrer-Policy header | Complete | 1 |
| 6. Configure TLS 1.3 | Deferred to Phase 19 | N/A |
| 7. Rate limiting middleware | Complete | 2 |
| 8. Input validation middleware | Complete | 3 |
| 9. AES-256 encryption | Complete | 5 |
| 10. CSRF protection | Complete | 6 |
| 11. Input sanitization | Complete | 4 |

**Result:** 10 of 11 complete (91%), 1 deferred to Phase 19.

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| CSP breaks Vite HMR | Dev workflow blocked | `isDev` check adds `ws://localhost:*` to connectSrc |
| `isomorphic-dompurify` jsdom weight (~5MB) | Backend bundle size | Only in backend package, not in frontend bundle |
| CSRF blocks API consumers | Mobile/third-party integrations fail | Phase 2 adds Bearer token bypass for JWT-authenticated requests |
| Encryption key rotation | Can't decrypt with old key | Document TODO for versioned key scheme in encryption.ts |
| `cookie-parser` integration | Express 5 needs explicit cookie parsing | Minimal dependency, no sub-dependencies |

---

## Critical Reference Files

| File | Relevance |
|------|-----------|
| `packages/backend/src/app.ts` | Express app setup - modify helmet, add CSRF + cookie-parser |
| `packages/backend/src/middleware/rate-limiter.ts` | Existing limiters to extend |
| `packages/backend/src/utils/api-error.ts` | ApiError class used by all new middleware |
| `packages/backend/src/config/env-validate.ts` | Already validates ENCRYPTION_KEY and SESSION_SECRET |
| `packages/backend/src/__tests__/middleware/cors-config.test.ts` | Test pattern to follow (mockReqRes, vi.stubEnv, dynamic imports) |
| `Docs/Community_Hub_Specification_v2.md` | Section 4 (Security & Privacy) |
