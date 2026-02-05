# Phase 1.5: Security Foundation - Study Notes

## Overview

Phase 1.5 implements comprehensive security hardening for the Community Hub platform. It follows the completed Phases 1.1-1.4 (Project Setup, Configuration, Backend Infrastructure, Frontend Infrastructure) and focuses on **Specification Section 4 (Security & Privacy)**.

## The 11 Tasks (from TODO.md lines 72-85)

1. Implement Content-Security-Policy header
2. Implement X-Frame-Options header (DENY)
3. Implement X-Content-Type-Options header (nosniff)
4. Implement HSTS header (max-age=31536000)
5. Implement Referrer-Policy header
6. Configure TLS 1.3
7. Set up rate limiting middleware [Spec S4.8] (partially done)
8. Implement input validation middleware
9. Set up AES-256 encryption for sensitive data at rest
10. Implement CSRF protection
11. Implement input sanitization middleware (DOMPurify or equivalent)

## What's Already Done (Phase 1.3)

- Helmet.js installed (sets X-Frame-Options: DENY, X-Content-Type-Options: nosniff by default)
- Rate limiting: 4 tiers (global 30/min, auth 10/15min, API 100/min, uploads 20/hour)
- Path traversal prevention via `safeResolvePath()`
- EXIF stripping with Sharp
- Magic byte validation for file uploads
- CORS configuration with origin allowlist
- Request ID tracking (X-Request-Id)
- X-Powered-By disabled

## What Phase 1.5 Must Implement

### 1. Security Headers (Tasks 1-5)

**File:** `packages/backend/src/middleware/security-headers.ts` (new)
**Modify:** `packages/backend/src/app.ts` (replace `helmet()` with custom config)

| Header | Value | Status |
|--------|-------|--------|
| Content-Security-Policy | Strict CSP (self-only scripts/styles) | Needs config |
| X-Frame-Options | DENY | Already set by helmet |
| X-Content-Type-Options | nosniff | Already set by helmet |
| Strict-Transport-Security | max-age=31536000; includeSubDomains | Needs config |
| Referrer-Policy | strict-origin-when-cross-origin | Needs config |

### 2. CSRF Protection (Task 10)

**Spec S4.7 Requirements:**
- SameSite=Strict cookies + CSRF token for non-GET requests
- Token: server-generated, stored in session, validated per request
- Exempt: public GET endpoints, OAuth callbacks

**Files:**
- `packages/backend/src/utils/csrf.ts` (new)
- `packages/backend/src/middleware/csrf-protection.ts` (new)

### 3. Input Validation Middleware (Task 8)

**Dependencies:** zod (already installed)

**Files:**
- `packages/backend/src/middleware/input-validator.ts` (new)
- `packages/shared/src/validation/schemas.ts` (new - reusable Zod schemas)

**Patterns:** Email, URL, phone, UUID validation; 400 errors per Spec S27.1

### 4. Input Sanitization (Task 11)

**Spec S4.9 Requirements:**
- Rich text: DOMPurify allowlist (`p`, `br`, `strong`, `em`, `ul`, `ol`, `li`, `a` with `rel="nofollow"`)
- Blocked: `script`, `iframe`, `object`, `embed`, `style`, event handlers
- Plain text: strip all HTML
- URLs: validate scheme (block `javascript:`, `data:`)

**Files:**
- `packages/backend/src/utils/sanitize.ts` (new)
- `packages/backend/src/middleware/sanitize.ts` (new)

**New dependency:** `dompurify` + `@types/dompurify`

### 5. AES-256 Encryption at Rest (Task 9)

**Using:** Node.js built-in `crypto` module (aes-256-cbc with random IV)

**Files:**
- `packages/backend/src/services/encryption.ts` (new)
- `.env.example` (document ENCRYPTION_KEY - 32 bytes, base64)

**Sensitive data candidates:** password reset tokens, email verification tokens, API keys in DB, user phone numbers

### 6. Rate Limiting Enhancement (Task 7)

**Add:** Password reset limiter (3 requests/hour per Spec S4.8)
**Defer:** Review (5/24h), conversation (10/24h), flash deal (2/7d) limiters to their feature phases

**File:** `packages/backend/src/middleware/rate-limiter.ts` (enhance)

### 7. TLS 1.3 (Task 6)

**Deferred to Phase 19 (Deployment)** - this is server/Nginx/Cloudflare configuration, not application code.

## Specification References

| Section | Topic | Phase 1.5 Relevance |
|---------|-------|---------------------|
| S4.2 | Data Protection | AES-256 encryption service |
| S4.5 | Security Headers | CSP, HSTS, Referrer-Policy |
| S4.7 | CSRF Protection | Token generation and validation |
| S4.8 | Rate Limiting | Password reset limiter |
| S4.9 | Input Sanitization | DOMPurify, HTML allowlist |
| S27.1 | Error Handling | Validation error format |

## Data Models (Appendix A)

- **User (A.2):** password_hash (bcrypt 12+), email, status
- **UserSession (A.17):** tokenHash, deviceInfo, ipAddress, expiresAt
- **AuditLog (A.18):** action, targetType, ipAddress, userAgent

All already present in Prisma schema from Phase 1.3.

## API Endpoints (Appendix B)

Phase 1.5 doesn't create endpoints but prepares middleware for:
- `POST /auth/*` endpoints (Phase 2) - CSRF, validation, rate limiting
- All POST/PUT/PATCH routes - input validation and sanitization

## Testing Strategy

Target: >80% coverage for all new middleware/utilities.

Test files to create:
- `packages/backend/src/__tests__/middleware/security-headers.test.ts`
- `packages/backend/src/__tests__/middleware/csrf-protection.test.ts`
- `packages/backend/src/__tests__/middleware/input-validator.test.ts`
- `packages/backend/src/__tests__/utils/sanitize.test.ts`
- `packages/backend/src/__tests__/services/encryption.test.ts`

## File Structure After Phase 1.5

```
packages/backend/src/
  middleware/
    security-headers.ts     (NEW - helmet custom config)
    csrf-protection.ts      (NEW - CSRF token middleware)
    input-validator.ts      (NEW - Zod validation middleware)
    sanitize.ts             (NEW - sanitization middleware)
    rate-limiter.ts         (ENHANCED - add password reset limiter)
  services/
    encryption.ts           (NEW - AES-256 encrypt/decrypt)
  utils/
    sanitize.ts             (NEW - DOMPurify wrapper)
    csrf.ts                 (NEW - token generation)
  __tests__/
    middleware/             (NEW test files)
    services/              (NEW test files)
    utils/                 (NEW test files)

packages/shared/src/
  validation/
    schemas.ts             (NEW - reusable Zod schemas)
```

## Dependencies

**Existing:** helmet, express-rate-limit, zod, crypto (built-in)
**New:** dompurify, @types/dompurify (possibly jsdom for server-side DOMPurify)

## Blockers

None. Phase 1.5 depends only on Phase 1.3 (complete).

## What Comes After

- Phase 1.6: Email Service (Mailgun)
- Phase 1.7: Maps Integration (Mapbox)
- Phase 1.8: i18n Foundation (react-i18next, RTL)
- Phase 2: Authentication (JWT, bcrypt, login/register)

## Key Considerations

1. **Location-agnostic:** Security config doesn't involve location data - no concerns
2. **i18n:** Validation/sanitization error messages should use translation keys (prepare for Phase 1.8)
3. **Accessibility:** CSP must not break ARIA; sanitization must preserve semantic HTML tags
4. **Note:** X-Frame-Options and X-Content-Type-Options are already handled by helmet defaults - tasks 2 and 3 just need verification, not new implementation
5. **Note:** TLS 1.3 (task 6) is deferred to Phase 19 deployment infrastructure
