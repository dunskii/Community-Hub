# Phase 2: Authentication & User System - Comprehensive Study

**Study Date:** 2026-02-07
**Platform:** Community Hub (Location-Agnostic DCIH)
**Specification:** v2.0 (January 2026)
**Current Status:** Phase 1 Foundation 88% complete (sub-phases 1.1-1.7 complete, 1.8 remaining)

---

## EXECUTIVE SUMMARY

**Phase 2: Authentication & User System** is the first major development phase after Phase 1 (Foundation). It encompasses **33 tasks across 2 main subsections** and is critical for enabling user registration, login, role-based access control, and user profile management.

**Status:** Not Started (0/33 tasks, 0% complete)
**Blocks:** Nearly all subsequent phases (3-18)
**Blocked By:** Phase 1.8 (i18n Foundation) - recommended to complete first
**Estimated Effort:** 13-16 days (1 person)

---

## 1. PHASE 2 SCOPE & OVERVIEW

### 1.1 Definition & Purpose

Phase 2 builds the core user identity and authorization infrastructure for Community Hub. It implements:
- User registration and authentication flows (email/password, OAuth)
- JWT-based session management with refresh token rotation
- Role-based access control (RBAC) with 6 user roles
- User profile system with preferences and settings
- Email verification and password reset flows
- Security features: account lockout, bcrypt hashing, CSRF protection

### 1.2 Current Status

- **Progress:** 0/33 tasks (0%)
- **Status:** Not Started
- **Phase 1 Dependency:** Phase 1.1-1.7 complete ✓, Phase 1.8 remaining
- **Recommendation:** Complete Phase 1.8 (i18n Foundation) before starting Phase 2

### 1.3 Key Deliverables

1. Authentication endpoints (8 core endpoints + supporting flows)
2. User entity and role system in database
3. JWT token management with secure cookies
4. Role-based access control middleware
5. User profile management features
6. Notification preferences system
7. Account security features (sessions, deletion, 2FA optional)

---

## 2. DETAILED FEATURE BREAKDOWN

### 2.1 Authentication Subsection (18 tasks)

#### 2.1.1 Core Authentication Endpoints (8 tasks)

| Endpoint | Method | Purpose | Auth Required | Specification |
|----------|--------|---------|---------------|--------------|
| `/auth/register` | POST | User registration with email/password | Public | §12.1, Appendix B.1 |
| `/auth/login` | POST | User login and token issuance | Public | §4.1, Appendix B.1 |
| `/auth/logout` | POST | Revoke user session | User | §4.1, Appendix B.1 |
| `/auth/forgot-password` | POST | Request password reset | Public | §4.1, Appendix B.1 |
| `/auth/reset-password` | POST | Complete password reset | Public | §4.1, Appendix B.1 |
| `/auth/verify-email` | POST | Verify email address | Public | §12.1, Appendix B.1 |
| `/auth/resend-verification` | POST | Resend verification email | Public | §12.1, Appendix B.1 |
| `/auth/me` | GET | Get current user profile | User | §12.2, Appendix B.1 |
| `/auth/refresh` | POST | Refresh JWT token | User | §4.6, Appendix B.1 |

#### 2.1.2 Authentication Features & Flows (10 tasks)

**Registration Flow:**
- Email/password registration form with validation (8+ chars, uppercase, number)
- OAuth integration (Google, Facebook) - optional, can defer
- Email verification (24-hour expiry link)
- Account status set to PENDING until email verified
- User onboarding wizard after registration (§9.1.2)

**Login Flow:**
- Email/password validation
- Failed login lockout (5 attempts = 15-minute lockout)
- "Remember me" option (30-day session vs 24-hour)
- JWT token with secure HTTP-only cookie
- CSRF protection via SameSite=Strict + double-submit (Phase 1.5)

**Password Reset:**
- 1-hour expiry link
- Validation of password requirements
- Email notification
- Rate limiting (3 requests/hour)

**Email Verification:**
- 24-hour expiry verification link
- Resend capability
- Email address must be unique
- PENDING status until verified

**JWT Implementation:**
- Signing algorithm: RS256 (asymmetric)
- Access token lifetime: 15 minutes
- Refresh token lifetime: 7 days (30 days with "remember me")
- Token payload: `sub` (user ID), `role`, `iat`, `exp`
- Refresh token rotation: new refresh token on each use, old invalidated
- Token revocation via Redis blocklist (JTI-based)
- Cookie settings: `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/`

**Session Management:**
- HTTP-only cookies (no JavaScript access)
- Token refresh endpoint
- Active session tracking and revocation
- Session expiry handling with modal

**Two-Factor Authentication (2FA):**
- Optional feature (not required for MVP)
- TOTP-based (Time-based One-Time Password)
- User opt-in during onboarding

---

### 2.2 User System Subsection (15 tasks)

#### 2.2.1 User Model Implementation (6 tasks)

**Database Entity (Appendix A.2 - User):**

```typescript
User {
  id: UUID
  email: String (unique)
  password_hash: String (bcrypt, cost factor 12+)
  display_name: String (2-50 chars)
  profile_photo: Image (optional)
  language_preference: String (BCP 47, defaults to browser)
  suburb: String (optional)
  bio: Text (max 500 chars)
  interests: [String] (optional, category IDs)
  notification_preferences: NotificationPrefs
  role: Enum (community, business_owner, moderator, admin)
  status: Enum (active, suspended, pending)
  email_verified: Boolean
  created_at: DateTime
  updated_at: DateTime
  last_login: DateTime
}

NotificationPrefs {
  email_digest: Enum (none, daily, weekly)
  push_enabled: Boolean
  sms_enabled: Boolean
  deal_alerts: Boolean
  event_reminders: Boolean
  business_updates: Boolean
  emergency_alerts: Enum (all, critical_only, none)
}
```

#### 2.2.2 Role System & Permissions (§10.1-10.2)

**6 User Roles:**

1. **Visitor** - Unauthenticated user (read-only public content)
2. **Community Member** - Registered resident (full community features)
3. **Business Owner** - Verified business owner (business management)
4. **Content Moderator** - Platform staff (content management)
5. **Administrator** - Full admin access (platform control)
6. **Chamber/Council Staff** - Partner access (analytics, communications)

**Permission Matrix (Spec §10.2):**

| Function | Visitor | Community | Owner | Moderator | Admin |
|----------|---------|-----------|-------|-----------|-------|
| View profiles | ✓ | ✓ | ✓ | ✓ | ✓ |
| Save/favourite | ✗ | ✓ | ✓ | ✓ | ✓ |
| RSVP events | ✗ | ✓ | ✓ | ✓ | ✓ |
| Submit reviews | ✗ | ✓ | ✓ | ✓ | ✓ |
| Edit own business | ✗ | ✗ | ✓ | ✗ | ✓ |
| View own analytics | ✗ | ✗ | Own only | ✗ | ✓ |
| Approve content | ✗ | ✗ | ✗ | ✓ | ✓ |
| Manage users | ✗ | ✗ | ✗ | ✗ | ✓ |
| Platform settings | ✗ | ✗ | ✗ | ✗ | ✓ |

**RBAC Implementation Requirements:**
- Role-based access control middleware
- Permission matrix validation on endpoints
- Role enum in User model
- Protected routes checking user role and status

#### 2.2.3 User Profile Features (7 tasks, §12.2)

**Profile Information:**
- Display name editing (2-50 chars)
- Profile photo upload with cropping
- Bio field (500 chars max)
- Language preference setting
- Suburb/location selection
- Interest categories selection
- Member since date (read-only)

**Account Management:**
- Password change flow (requires current password)
- Email change with re-verification
- Active sessions management (view and revoke)
- Account deletion with 14-day grace period (§5.2.2)
- Account suspension/reactivation (admin)

**Password Security:**
- bcrypt hashing with cost factor 12+
- Requirements: 8+ chars, uppercase, number
- Change requires current password
- Reset requires email verification

#### 2.2.4 Notification Preferences (2 tasks, §12.3)

**Notification Types:**
- Business updates (default: On)
- Event reminders (default: On)
- Promotions (default: Off)
- Community news (default: On)
- Emergency alerts (default: On, forced for Critical level)

**Notification Channels:**
- Email notifications
- Push notifications
- SMS notifications (if enabled)
- WhatsApp notifications (for alerts)

**Frequency Options:**
- Instant (each notification immediately)
- Daily digest (8am)
- Weekly digest (Monday morning)

---

## 3. DATA MODELS & DATABASE REQUIREMENTS

### 3.1 User Entity (Appendix A.2)

**Prisma Schema Extension:**

```prisma
model User {
  id                      String   @id @default(cuid())
  email                   String   @unique
  password_hash           String
  display_name            String
  profile_photo           String?
  language_preference     String   @default("en")
  suburb                  String?
  bio                     String?  @db.Text
  interests               String[] // Array of category IDs
  role                    UserRole @default(COMMUNITY)
  status                  UserStatus @default(PENDING)
  email_verified          Boolean  @default(false)
  notification_preferences Json    // Nested JSON object
  created_at              DateTime @default(now())
  updated_at              DateTime @updatedAt
  last_login              DateTime?

  // Relations
  UserSession             UserSession[]
  // ... other relations added in later phases
}

enum UserRole {
  COMMUNITY
  BUSINESS_OWNER
  MODERATOR
  ADMIN
  CHAMBER_STAFF
}

enum UserStatus {
  PENDING        // Email not verified
  ACTIVE         // Can use platform
  SUSPENDED      // Admin action
}
```

### 3.2 Session Management

**UserSession Model (exists from Phase 1.3):**
- Track active sessions
- Store JTI (JWT ID) for revocation
- Store refresh tokens with expiry
- Support multi-device login

**Redis Blocklist for Revoked Tokens:**
- Store revoked token JTIs
- Key pattern: `revoked:jti:{jtiValue}`
- TTL matches token expiry

### 3.3 Email Templates (implemented in Phase 1.6)

Phase 1.6 already created EmailTemplate model with:
- Verification email template (10 languages)
- Password reset template (10 languages)
- Base HTML template with Handlebars rendering
- Bounce handling framework

**Phase 2 Usage:**
- Use existing email service from Phase 1.6
- Render templates with user data
- Queue emails via Redis

---

## 4. API ENDPOINTS & REQUEST/RESPONSE SPECIFICATIONS

### 4.1 Authentication Endpoints (Appendix B.1)

#### POST /auth/register

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "display_name": "John Doe",
  "language_preference": "en",
  "suburb": "Guildford",
  "interests": ["category_id_1", "category_id_2"]
}
```

**Validation:**
- Email: valid format, unique (Zod)
- Password: 8+ chars, uppercase, number
- Display name: 2-50 chars
- Language preference: supported language
- Suburb: optional, from dropdown
- Interests: optional, valid category IDs

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "display_name": "John Doe",
    "role": "community",
    "status": "pending"
  },
  "message": "Registration successful. Please verify your email."
}
```

**Errors:**
- 400: Validation error (Spec §27)
- 409: Email already exists

#### POST /auth/login

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "remember_me": true
}
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "community",
    "status": "active"
  },
  "access_token": "eyJhbGc...", // 15 min expiry
  "expires_in": 900
}
```

**Cookies Set:**
- `refresh_token`: 7 days (30 days if remember_me), HttpOnly, Secure, SameSite=Strict
- `CSRF-Token`: Double-submit (already implemented Phase 1.5)

**Errors:**
- 400: Missing fields
- 401: Invalid credentials
- 429: Too many failed attempts (rate limit: 10/15min)
- 423: Account locked (5 failed attempts = 15-min lockout)

#### POST /auth/logout

**Request:** Empty body (auth required)

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

**Side effects:**
- Revoke refresh token (add JTI to Redis blocklist)
- Clear cookies

#### POST /auth/forgot-password

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "If an account exists, password reset link sent"
}
```

**Implementation:**
- Generate 1-hour expiry reset token
- Send email with reset link: `/reset-password?token={token}`
- Rate limit: 3 requests/hour
- Silent failure (don't reveal if email exists)

#### POST /auth/reset-password

**Request:**
```json
{
  "token": "reset_token_from_email",
  "new_password": "NewSecurePass123"
}
```

**Validation:**
- Token must be valid and not expired (< 1 hour old)
- New password: 8+ chars, uppercase, number
- Hash with bcrypt cost factor 12+

**Response (200):**
```json
{
  "message": "Password reset successfully. Please login with your new password."
}
```

**Errors:**
- 400: Invalid/expired token
- 400: Validation error on password

#### POST /auth/verify-email

**Request:**
```json
{
  "token": "verification_token_from_email"
}
```

**Implementation:**
- Verify token (24-hour expiry)
- Set `email_verified = true`
- Set `status = ACTIVE`

**Response (200):**
```json
{
  "message": "Email verified successfully. You can now use all platform features."
}
```

#### POST /auth/resend-verification

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "Verification email sent"
}
```

#### GET /auth/me

**Request:** (auth required)

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "display_name": "John Doe",
    "profile_photo": "url",
    "language_preference": "en",
    "suburb": "Guildford",
    "bio": "...",
    "role": "community",
    "status": "active",
    "email_verified": true,
    "created_at": "2026-02-07T10:00:00Z"
  }
}
```

#### POST /auth/refresh

**Request:** (auth required via refresh token cookie)

**Response (200):**
```json
{
  "access_token": "new_access_token",
  "expires_in": 900
}
```

**Refresh token rotation:**
- Issue new refresh token
- Invalidate old refresh token (add JTI to blocklist)
- Update cookie with new refresh token

---

### 4.2 User Profile Endpoints (Appendix B.4)

#### GET /users/:id

**Request:** (auth required)

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "display_name": "John Doe",
    "profile_photo": "url",
    "bio": "My bio",
    "suburb": "Guildford",
    "language_preference": "en",
    "interests": ["category_1", "category_2"],
    "notification_preferences": {
      "email_digest": "daily",
      "push_enabled": true,
      "sms_enabled": false,
      "deal_alerts": true,
      "event_reminders": true,
      "business_updates": true,
      "emergency_alerts": "all"
    },
    "role": "community",
    "status": "active",
    "created_at": "2026-02-07T10:00:00Z",
    "last_login": "2026-02-07T14:30:00Z"
  }
}
```

#### PUT /users/:id

**Request:**
```json
{
  "display_name": "John Doe Updated",
  "bio": "New bio",
  "suburb": "Parramatta",
  "language_preference": "ar",
  "interests": ["category_1"]
}
```

**Response (200):** Updated user object

**Errors:**
- 400: Validation error
- 403: Cannot edit another user's profile

#### DELETE /users/:id

**Request:** (auth required)

**Implementation:**
- 14-day grace period (spec §5.2.2)
- Mark status = deleted or create DeletedUser record
- Anonymise associated content (reviews, etc.)
- Send confirmation email
- All data deleted after 14-day window

**Response (200):**
```json
{
  "message": "Account deletion requested. You have 14 days to cancel this request."
}
```

#### PUT /users/:id/alert-preferences

**Request:**
```json
{
  "email_digest": "daily",
  "push_enabled": true,
  "sms_enabled": false,
  "deal_alerts": true,
  "event_reminders": true,
  "business_updates": true,
  "emergency_alerts": "all"
}
```

**Response (200):** Updated notification preferences

#### GET /users/:id/sessions

**Request:** (auth required)

**Response (200):**
```json
{
  "sessions": [
    {
      "id": "session_id",
      "device": "Chrome on Windows",
      "last_active": "2026-02-07T14:30:00Z",
      "ip_address": "192.168.1.1",
      "current": true
    }
  ]
}
```

#### DELETE /users/:id/sessions/:sessionId

**Request:** (auth required)

**Response (200):**
```json
{
  "message": "Session revoked"
}
```

---

## 5. SPECIFICATION REQUIREMENTS & BUSINESS RULES

### 5.1 Security Requirements (Spec §4)

#### Password Requirements (§4.1)
- Minimum 8 characters
- At least one uppercase letter
- At least one number
- Recommended: mix of special characters
- Hashing: bcrypt with cost factor 12+

#### Session Management (§4.1)
- Session timeout: 24 hours (standard)
- Remember me: 30 days
- HTTP-only cookies only
- Cookie settings: `HttpOnly=true`, `Secure=true`, `SameSite=Strict`

#### Failed Login Lockout (§4.1)
- 5 failed attempts = 15-minute account lockout
- User notified via email
- Lockout applies per account, not IP

#### JWT Token Lifecycle (§4.6)
- Signing algorithm: RS256 (asymmetric)
- Access token: 15 minutes
- Refresh token: 7 days (30 days with remember me)
- Refresh token rotation: new issued, old revoked
- Token revocation: Redis blocklist by JTI
- Payload: `sub`, `role`, `iat`, `exp`

#### CSRF Protection (§4.7)
- Already implemented Phase 1.5 (double-submit cookies)
- SameSite=Strict on auth cookies
- CSRF token required for non-GET requests

#### Rate Limiting (§4.8)
- Authentication endpoints: 10 requests / 15 minutes → 429 + lockout
- Password reset: 3 requests / 1 hour → 429 + silent drop
- Already implemented Phase 1.5 (7 tiers, need authRateLimiter + passwordResetRateLimiter)

#### Input Sanitization (§4.9)
- Email validation via Zod
- Display name: 2-50 chars
- Bio: max 500 chars
- Already implemented Phase 1.5 (DOMPurify for rich text)

#### Privacy Compliance (§4.3)
- Australian Privacy Principles (APP) compliance
- Minimise PII collection
- Encrypt sensitive data at rest (AES-256, already Phase 1.5)
- Users can access/correct/delete their data

---

### 5.2 Email Verification Flow (§12.1)

**Timeline:**
1. User registers
2. Email sent with 24-hour expiry verification link
3. User clicks link → account activated (status = ACTIVE)
4. If not verified within 24 hours, account remains PENDING
5. Can resend verification link anytime

**Database Changes:**
- User.email_verified: Boolean (default false)
- User.status: Enum with PENDING state
- Store verification token with expiry (Redis or database)

---

### 5.3 Password Reset Flow (§4.1)

**Timeline:**
1. User requests password reset
2. Email sent with 1-hour expiry reset link
3. User clicks link → enters new password
4. Password reset (hash new password, clear reset token)
5. Send confirmation email
6. User can login with new password

**Rate Limiting:**
- Max 3 password reset requests per hour
- Silent failure (don't reveal if email exists)

---

### 5.4 Account Deletion (§5.2.2)

**Timeline:**
1. User requests account deletion
2. 14-day grace period starts (confirmation email sent)
3. User can cancel deletion during grace period
4. After 14 days: permanent deletion
   - Delete user record
   - Anonymise reviews (remove user association)
   - Anonymise saved businesses
   - Keep audit logs (anonymous)

**Database:**
- User.status: DELETED (during grace period)
- Track deletion_requested_at timestamp
- Cleanup scheduled job runs daily

---

### 5.5 Multi-Device Sessions

**Requirements:**
- Users can be logged in on multiple devices
- Each session tracked separately
- Users can view active sessions
- Users can revoke individual sessions (kill device login)
- Force logout all sessions on password change

**Storage:**
- UserSession model (exists from Phase 1.3)
- Track device info, IP, last_active, jti
- Include "current session" indicator

---

## 6. LOCATION-AGNOSTIC CONFIGURATION

### 6.1 Configuration Requirements

**From platform.json:**
- `supportedLanguages`: Array of language codes (§8)
- `defaultLanguage`: Language code for fallback
- Feature flags:
  - `features.authOAuth`: Enable/disable Google & Facebook OAuth
  - `features.twoFactorAuth`: Enable/disable TOTP 2FA
- Email settings (already Phase 1.6):
  - `integrations.mailgun.domain`
  - `integrations.mailgun.apiKey` (in .env, not platform.json)

### 6.2 No Hardcoded Location Data

- NO hardcoded suburb names in auth logic
- NO hardcoded "Guildford" in user validation
- Suburb selection from platform.json config or database
- Location-based features gated by config

---

## 7. MULTILINGUAL & ACCESSIBILITY REQUIREMENTS

### 7.1 Multilingual Support (§8, Phase 1.8)

**Phase 1.8 (i18n Foundation) provides:**
- Translation file structure (JSON per language)
- Language detection (browser, user preference, URL)
- Language switching UI component
- RTL support infrastructure (Arabic, Urdu)

**Phase 2 Dependencies on i18n:**
- Auth form labels and error messages in all 10 languages
- Email templates in 10 languages (Phase 1.6 already done)
- Notification preference UI in all 10 languages
- User onboarding wizard translations (Phase 9)

**Languages (10 total, from spec):**
1. English (en) - Primary
2. Arabic (ar) - RTL high priority
3. Chinese Simplified (zh-CN) - High priority
4. Vietnamese (vi) - High priority
5. Chinese Traditional (zh-TW) - Medium priority
6. Hindi (hi) - Medium priority
7. Urdu (ur) - RTL medium priority
8. Korean (ko) - Lower priority
9. Greek (el) - Lower priority
10. Italian (it) - Lower priority

### 7.2 Accessibility (§3.6, §7)

**WCAG 2.1 AA Compliance:**
- Form labels properly associated (already Phase 1.4)
- Error messages linked to form fields (aria-describedby)
- Skip to main content link
- Keyboard navigation for all auth forms
- Color contrast 4.5:1 minimum (design system Phase 3)
- Touch targets 44px minimum (mobile)
- Screen reader announcements (aria-live for errors)

---

## 8. DEPENDENCIES & PREREQUISITES

### 8.1 Phase 1 Subsections (Status)

| Phase 1 Subsection | Key Deliverable | Status | Needed For Phase 2 |
|-------------------|-----------------|--------|-------------------|
| 1.1 Project Setup | Git, Docker, CI/CD | ✓ Complete | Build & deployment |
| 1.2 Config Architecture | platform.json, env validation | ✓ Complete | Feature flags, language config |
| 1.3 Backend Infrastructure | Express 5, Prisma, Redis, PostgreSQL | ✓ Complete | Core API, database, caching |
| 1.4 Frontend Infrastructure | React, Tailwind, PWA, build pipeline | ✓ Complete | UI components for auth forms |
| 1.5 Security Foundation | Security headers, CSRF, encryption, rate limiting | ✓ Complete | Password hashing, JWT, CORS |
| 1.6 Email Service | Mailgun integration, templates, queue | ✓ Complete | Send verification & reset emails |
| 1.7 Maps Integration | Mapbox, geocoding, directions | ✓ Complete | Suburb selection in registration |
| 1.8 i18n Foundation | Translation system, RTL | 🔶 Remaining | i18n in auth UI and emails |

**RECOMMENDATION:** Complete Phase 1.8 before starting Phase 2 to avoid rework of auth UI.

### 8.2 External Dependencies

- **Mailgun** (Phase 1.6): Email sending (verification, password reset)
- **Redis** (Phase 1.3): Session/token storage, email queue
- **PostgreSQL** (Phase 1.3): User data persistence
- **Prisma ORM** (Phase 1.3): Database access layer

### 8.3 Phases Blocked by Phase 2

- **Phase 3** (Design System): Can proceed in parallel
- **Phase 4** (Business Directory): Depends on user authentication
- **Phase 6** (User Engagement): Reviews/saved businesses require auth
- **Phase 7** (Business Owner): Claim/dashboard require auth
- **Phase 9** (Messaging): Requires user accounts
- **All other phases** depend indirectly on auth

---

## 9. SECURITY & PRIVACY CONSIDERATIONS

### 9.1 OWASP & Security Best Practices

**Authentication Security:**
- Password hashing: bcrypt with cost factor 12+ (not plain text, not MD5)
- No credentials in logs or errors
- Rate limiting on auth endpoints (10/15min)
- Account lockout on failed attempts (5 failures = 15min lock)
- Secure password reset with time-limited tokens

**Token Security:**
- JWT signed with RS256 (asymmetric, no shared secrets)
- Tokens stored in HTTP-only cookies only
- Refresh token rotation (new issued on each use)
- Token revocation via JTI blocklist in Redis
- Short access token lifetime (15 minutes)

**Session Security:**
- Secure flag (HTTPS only)
- SameSite=Strict (prevent CSRF)
- HttpOnly flag (prevent XSS)
- Path=/

**CSRF Protection:**
- Double-submit cookies (Phase 1.5)
- SameSite=Strict tokens
- Exempt public GET endpoints

**Input Validation:**
- Zod schema validation on all endpoints
- Email format validation
- Password complexity enforcement
- Display name length validation
- No SQL injection (Prisma parameterized queries)

### 9.2 Australian Privacy Principles (APP) Compliance

**Collection (§4.3):**
- Only collect necessary data (email, password, display name, preferences)
- Optional: profile photo, bio, suburb, interests
- Consent checkboxes for notifications, location

**Use:**
- Email: authentication, notifications, password reset
- Display name: public profile
- Preferences: personalization only
- Location: optional, only if user enables

**Disclosure:**
- No third-party sharing without explicit consent
- Business owners don't see customer details in messages
- Admin only sees aggregated analytics

**Access:**
- Users can view their profile (GET /users/:id)
- Data export endpoint (§5.2.2, Appendix B.4)

**Deletion:**
- Users can request account deletion (DELETE /users/:id)
- 14-day grace period
- Complete removal after grace period

### 9.3 Data Retention (§5.2.2)

| Data Type | Retention | Reason |
|-----------|-----------|--------|
| Active user account | Duration of account | Service provision |
| Deleted account | 14 days grace period | Allow cancellation |
| Password hashes | Until account deleted | Authentication |
| Email verification tokens | 24 hours | Security |
| Password reset tokens | 1 hour | Security |
| Session data | 30 days after logout | Audit |
| Audit logs | 7 years | Compliance |

---

## 10. CURRENT IMPLEMENTATION STATUS

### 10.1 Existing Infrastructure (from Phase 1)

**Already implemented:**
- PostgreSQL database (Phase 1.3)
- User model scaffold (basic fields)
- Prisma ORM (Phase 1.3)
- Express 5 API (Phase 1.3)
- Redis caching (Phase 1.3)
- JWT secret in .env (Phase 1.3)
- Security headers (Phase 1.5)
- CSRF protection (Phase 1.5)
- Input validation middleware (Phase 1.5)
- Rate limiting (Phase 1.5) with 7 tiers
- Email service + templates (Phase 1.6)
- Error handling patterns (Phase 1.3)
- Logging via Pino (Phase 1.3)

**Not yet implemented:**
- User.role, User.status, User.email_verified fields
- Auth endpoints (/auth/register, /login, /logout, etc.)
- Password hashing with bcrypt
- JWT token issuance & refresh logic
- Email verification flow
- Account lockout logic
- Role-based access control middleware
- User profile endpoints
- Session management endpoints

### 10.2 Tests to Write

**Auth Endpoint Tests:**
- POST /auth/register: valid, duplicate email, weak password, validation errors
- POST /auth/login: valid, invalid credentials, lockout, rate limiting
- POST /auth/logout: revokes token
- POST /auth/forgot-password: sends email, rate limiting
- POST /auth/reset-password: valid token, expired token, invalid password
- POST /auth/verify-email: valid token, expired token, already verified
- GET /auth/me: returns current user, auth required
- POST /auth/refresh: issues new tokens, rotation

**User Endpoints Tests:**
- GET /users/:id: returns user, auth required, cannot view other users
- PUT /users/:id: updates profile, validates inputs
- DELETE /users/:id: initiates deletion, 14-day grace
- PUT /users/:id/alert-preferences: updates preferences

**Role-Based Tests:**
- Community user permissions
- Business owner permissions
- Moderator permissions
- Admin permissions
- Role matrix enforcement

**Security Tests:**
- Password hashing (bcrypt)
- Rate limiting (10/15min auth, 3/1hr password reset)
- Account lockout (5 failed attempts)
- JWT token expiry
- CSRF protection
- Secure cookies (HttpOnly, Secure, SameSite)

**Target:** 80%+ test coverage (unit + integration)

---

## 11. TECHNICAL ARCHITECTURE DECISIONS

### 11.1 Tech Stack Alignment (from Phase 1)

- **Backend:** Express 5 with TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Session/Token Storage:** Redis
- **Password Hashing:** bcrypt (npm package)
- **JWT Library:** jsonwebtoken (npm package)
- **Email:** Mailgun API (Phase 1.6)
- **Testing:** Vitest

### 11.2 Key Decisions to Make

1. **OAuth Provider Integration**
   - Decision: Use Google and Facebook OAuth (from spec)
   - Action: Install passport.js or similar, configure OAuth apps
   - Defer: OAuth implementation to Phase 2 post-MVP (can do email/password first)

2. **2FA Implementation**
   - Decision: Optional, TOTP-based (spec §4.1)
   - Action: Install otplib package
   - Defer: To Phase 2 post-MVP (focus on email/password first)

3. **Session Storage**
   - Decision: Redis for performance (already Phase 1.3)
   - Store: JTI-based token revocation list
   - TTL: Match token expiry times

4. **Email Verification Token Storage**
   - Decision: Redis (temporary, 24-hour expiry)
   - Key pattern: `verify:{email}:{token_hash}`
   - Alternative: Database with cleanup job

5. **Password Reset Token Storage**
   - Decision: Redis (temporary, 1-hour expiry)
   - Key pattern: `reset:{email}:{token_hash}`

---

## 12. ESTIMATED EFFORT & TIMELINE

### 12.1 Task Breakdown (33 Tasks)

**2.1 Authentication (18 tasks)**
- 8 tasks: Core auth endpoints implementation
- 10 tasks: Feature flows (registration, login, email verification, password reset, JWT, sessions, OAuth prep, 2FA prep)

**2.2 User System (15 tasks)**
- 6 tasks: User model and role system
- 7 tasks: User profile features
- 2 tasks: Notification preferences

**Estimated effort per subsection:**
- Auth endpoints: 4-5 days (frontend/backend validation, email integration, token logic)
- Auth flows: 3-4 days (OAuth setup may need deferral, 2FA optional)
- User model: 2 days (schema, migrations, seed)
- User profiles: 3 days (CRUD endpoints, validation, security)
- Notification preferences: 1 day (simple JSON storage)

**Total Phase 2 estimate:** 13-16 days (assuming 1 person, with pair review)

### 12.2 Blocking Dependencies

- Phase 1.8 (i18n Foundation) — **Recommended to complete before Phase 2 starts**
  - Phase 2 UI will need i18n from day 1
  - Auth forms need multi-language support
  - Can do Phase 2 backend without i18n, but frontend will need rework

---

## 13. KEY SPECIFICATION SECTIONS

### Reference Map

| Phase 2 Feature | Specification Sections | Appendix |
|-----------------|------------------------|----------|
| Registration & Auth | §4.1, §12.1 | B.1 (endpoints) |
| User Roles | §10.1-10.2 | A.2 (User model) |
| Password Security | §4.1 | B.1 |
| Session Management | §4.1, §4.6 | B.1 |
| Email Verification | §12.1 | B.1 |
| User Profile | §12.2-12.5 | A.2, B.4 |
| Notification Prefs | §12.3 | A.2 |
| Account Deletion | §5.2.2 | B.4 |
| Privacy Compliance | §4.3 | — |
| Rate Limiting | §4.8 | — |
| Multilingual | §8 | (Phase 1.8 provides) |
| Accessibility | §3.6, §7 | (Phase 3 provides) |

---

## 14. FILE STRUCTURE & LOCATIONS

### Backend Implementation

```
packages/backend/src/
├── routes/
│   ├── auth.ts              # Auth endpoints
│   └── users.ts             # User profile endpoints
├── services/
│   ├── auth-service.ts      # Auth business logic
│   ├── user-service.ts      # User profile logic
│   └── session-service.ts   # Session/token management
├── middleware/
│   ├── auth-middleware.ts   # JWT verification
│   └── rbac-middleware.ts   # Role-based access control
├── types/
│   └── auth.ts              # Auth-related TypeScript types
└── __tests__/
    ├── routes/
    │   ├── auth.test.ts
    │   └── users.test.ts
    └── services/
        ├── auth-service.test.ts
        └── user-service.test.ts
```

### Frontend Implementation

```
packages/frontend/src/
├── components/
│   ├── auth/
│   │   ├── RegisterForm.tsx
│   │   ├── LoginForm.tsx
│   │   ├── ForgotPasswordForm.tsx
│   │   ├── ResetPasswordForm.tsx
│   │   └── EmailVerification.tsx
│   └── user/
│       ├── ProfileEditor.tsx
│       ├── NotificationPreferences.tsx
│       └── AccountSettings.tsx
├── hooks/
│   ├── useAuth.ts           # Auth context/state
│   ├── useUser.ts           # User profile state
│   └── useAuthRedirect.ts   # Protected route logic
├── services/
│   ├── auth-service.ts      # API calls to /auth/*
│   └── user-service.ts      # API calls to /users/*
└── pages/
    ├── auth/
    │   ├── Register.tsx
    │   ├── Login.tsx
    │   ├── ForgotPassword.tsx
    │   ├── ResetPassword.tsx
    │   └── VerifyEmail.tsx
    └── user/
        ├── Profile.tsx
        └── Settings.tsx
```

---

## 15. RISK REGISTER & MITIGATION

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| OAuth integration complexity | Medium | Medium | Defer OAuth to post-MVP, start with email/password |
| Token/session management bugs | Medium | High | Comprehensive testing, use proven libraries (jsonwebtoken) |
| Rate limiting effectiveness | Low | High | Test lockout logic thoroughly, monitor failed attempts |
| Email delivery failures | Low | Medium | Implement bounce handling (Phase 1.6), fallback UI |
| Password hash compatibility | Low | High | Use bcrypt consistently, test hash verification |
| CSRF bypass | Low | Critical | Leverage Phase 1.5 implementation, test all endpoints |
| Timezone issues with token expiry | Low | Medium | Use UTC everywhere, standardise on server timezone |
| PII leakage in logs/errors | Low | Critical | Never log passwords/tokens, sanitise error messages |

---

## 16. SUCCESS CRITERIA & ACCEPTANCE TESTS

### 16.1 Phase 2 Completion Criteria

- [ ] All 33 tasks completed (2.1 + 2.2)
- [ ] User registration flow end-to-end
- [ ] Email verification flow tested
- [ ] Login/logout with JWT tokens
- [ ] Role-based access control enforced
- [ ] User profiles editable
- [ ] Notification preferences saveable
- [ ] Password reset flow tested
- [ ] Account lockout after 5 failed attempts
- [ ] Rate limiting enforced on auth endpoints
- [ ] Session management working (active sessions, revocation)
- [ ] All endpoints responding with spec-compliant error codes (§27)
- [ ] 80%+ test coverage (unit + integration)
- [ ] Security headers in place (Phase 1.5)
- [ ] CSRF protection validated
- [ ] Passwords hashed with bcrypt
- [ ] No credentials in logs
- [ ] Multi-language UI (with Phase 1.8 i18n)
- [ ] Accessible forms (WCAG 2.1 AA)
- [ ] No hardcoded location data

### 16.2 Performance & Security Benchmarks

- Auth endpoints respond < 500ms (typical)
- Password reset email sent < 5 seconds
- JWT validation < 10ms per request
- Rate limiter check < 5ms
- No SQL injection vulnerabilities (Prisma protects)
- No XSS vulnerabilities (DOMPurify Phase 1.5)
- No CSRF vulnerabilities (Phase 1.5 + SameSite)

---

## 17. NEXT STEPS & RECOMMENDATIONS

### 17.1 Immediate Actions

1. **Complete Phase 1.8 (i18n Foundation)** — prioritise this before Phase 2 starts
   - Auth UI will be multilingual from day 1
   - Avoid rework of auth forms

2. **Review Phase 2 spec sections**
   - Read §4, §10, §12 thoroughly
   - Review Appendices A.2 (User), B.1 (Auth endpoints), B.4 (User endpoints)

3. **Plan frontend/backend split**
   - Backend can start auth endpoints immediately after Phase 1.8
   - Frontend can start component scaffolding in parallel
   - Integration test when both ready

4. **Set up auth tooling**
   - npm packages: bcrypt, jsonwebtoken, passport.js (for OAuth later)
   - Update .env.example with JWT_SECRET, BCRYPT_COST_FACTOR
   - Create auth service/middleware scaffolds

### 17.2 Phase 2 Work Order

**Week 1: Backend Auth (5 days)**
1. Extend User schema (role, status, email_verified fields)
2. Implement POST /auth/register with email sending
3. Implement POST /auth/login with JWT issuance
4. Implement POST /auth/verify-email
5. Add rate limiting middleware

**Week 1.5: Email & Token Management (2 days)**
6. Implement POST /auth/forgot-password
7. Implement POST /auth/reset-password
8. Implement token refresh logic (POST /auth/refresh)

**Week 2: User Endpoints & RBAC (3 days)**
9. Implement GET/PUT /users/:id
10. Implement auth middleware with role checking
11. Implement basic moderation queue access control

**Week 2.5: Session & Security (2 days)**
12. Implement active sessions endpoints
13. Implement token revocation
14. Test security features (lockout, rate limiting, CSRF)

**Week 3: Frontend & Integration (4 days)**
15. Build registration/login forms (with i18n)
16. Build email verification page
17. Build password reset flow
18. Integration testing end-to-end

**Week 4: Testing & Polish (2-3 days)**
19. Unit test coverage > 80%
20. Integration tests
21. Security audit (OWASP)
22. QA review cycle
23. Documentation

---

## 18. SUMMARY TABLE

| Aspect | Details |
|--------|---------|
| **Phase Number** | Phase 2 |
| **Title** | Authentication & User System |
| **Status** | Not Started (0/33 tasks) |
| **Spec Sections** | §4 (Security/Auth), §9 (Onboarding), §10 (User Types), §12 (Community User) |
| **Appendices** | A.2 (User model), B.1 (Auth endpoints), B.4 (User endpoints) |
| **Key Dependencies** | Phase 1 complete, Phase 1.8 i18n (recommended) |
| **Blocked By** | Phase 1.8 i18n Foundation (remaining) |
| **Blocks** | Phases 4-18 (most depend on auth) |
| **Database Models** | User (extended), UserSession (exists), UserRole (enum), UserStatus (enum) |
| **API Endpoints** | 9 auth + 8 user endpoints |
| **Estimated Effort** | 13-16 days (1 person) |
| **Test Requirements** | 80%+ coverage, unit + integration |
| **Multilingual** | Depends on Phase 1.8 i18n Foundation |
| **Accessibility** | WCAG 2.1 AA (via Phase 3 design system) |
| **Security** | bcrypt passwords, JWT tokens, rate limiting, CSRF protection, email verification |
| **Success Metric** | All 33 tasks complete, auth flow end-to-end, role-based access control enforced |

---

This comprehensive analysis covers all aspects of Phase 2 implementation, from detailed requirements and API specifications to security considerations and estimated timelines. Phase 2 is foundational for the entire platform and should be carefully planned and executed with thorough testing.
