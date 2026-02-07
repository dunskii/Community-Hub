# Phase 2: Authentication & User System - Implementation Plan

**Plan Date:** 2026-02-07
**Platform:** Community Hub (Location-Agnostic DCIH)
**Specification:** v2.0 (January 2026)
**Current Status:** Phase 1 Complete (59/59 tasks, 575 tests passing)

---

## EXECUTIVE SUMMARY

Phase 2 implements the core user identity and authorization infrastructure for Community Hub. This phase encompasses **33 tasks across 2 main subsections** (Authentication and User System) and is foundational for all subsequent user-dependent features.

**Status:** Ready to Start (Phase 1 complete)
**Estimated Effort:** 13-16 days (1 developer)
**Blocks:** Phases 4-18 (nearly all platform features depend on auth)
**Risk Level:** Medium (critical security implementation, JWT complexity)

### Key Deliverables

1. **Authentication System** (18 tasks)
   - 9 RESTful auth endpoints (register, login, logout, password reset, email verification, token refresh)
   - JWT-based session management with refresh token rotation
   - Email verification flow (24-hour expiry)
   - Password reset flow (1-hour expiry)
   - Account lockout after 5 failed login attempts
   - OAuth integration foundations (Google, Facebook - can defer to post-MVP)

2. **User Management System** (15 tasks)
   - Extended User model with 6 roles (Community, Business Owner, Moderator, Admin, Super Admin, Chamber Staff)
   - Role-based access control (RBAC) middleware
   - User profile CRUD endpoints
   - Notification preferences system
   - Active session management with multi-device support
   - Account deletion with 14-day grace period

---

## 1. PHASE BREAKDOWN: SUB-PHASES

### Sub-Phase 2.1: Authentication Core (Days 1-5)

**Goal:** Implement all authentication endpoints and token management

#### 2.1.1 Database Schema Extension (Day 1 - Morning)

**Files:**
- `C:\Users\dunsk\code\community hub\packages\backend\prisma\schema.prisma`
- `C:\Users\dunsk\code\community hub\packages\backend\prisma\migrations\`

**Tasks:**
1. User model already has all required fields (Phase 1.3) ✓
2. Create migration for any missing indexes
3. Verify UserSession model supports JTI storage
4. Add PasswordResetToken model (optional - can use Redis instead)
5. Add EmailVerificationToken model (optional - can use Redis instead)

**Prisma Schema Additions:**

```prisma
// Optional: Database-stored tokens (alternative to Redis)
model PasswordResetToken {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token     String   @unique
  expiresAt DateTime @map("expires_at")
  used      Boolean  @default(false)
  createdAt DateTime @default(now()) @map("created_at")

  @@index([userId])
  @@index([expiresAt])
  @@map("password_reset_tokens")
}

model EmailVerificationToken {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token     String   @unique
  expiresAt DateTime @map("expires_at")
  used      Boolean  @default(false)
  createdAt DateTime @default(now()) @map("created_at")

  @@index([userId])
  @@index([expiresAt])
  @@map("email_verification_tokens")
}
```

**Decision:** Use Redis for tokens (simpler, auto-expiry) or database (persistent audit trail)?
- **Recommendation:** Redis for MVP (faster, auto-cleanup), database for production audit

**Dependencies:**
- Phase 1.3 PostgreSQL + Prisma ✓
- Phase 1.3 Redis ✓

**Success Criteria:**
- Schema compiles
- Migrations run successfully
- User model has all required fields for auth
- 0 TypeScript errors after regenerating Prisma Client

---

#### 2.1.2 Authentication Service Layer (Day 1 - Afternoon to Day 2)

**Files to Create:**
- `packages/backend/src/services/auth-service.ts` (NEW)
- `packages/backend/src/services/token-service.ts` (NEW)
- `packages/backend/src/utils/password.ts` (NEW)
- `packages/backend/src/types/auth.ts` (NEW)

**Dependencies to Install:**

```bash
cd packages/backend
pnpm add bcrypt jsonwebtoken
pnpm add -D @types/bcrypt @types/jsonwebtoken
```

**Service Architecture:**

```
auth-service.ts
├── registerUser(email, password, displayName, preferences)
├── loginUser(email, password, rememberMe)
├── verifyEmail(token)
├── initiatePasswordReset(email)
├── completePasswordReset(token, newPassword)
├── resendVerificationEmail(email)
└── validatePassword(password) -> PasswordValidation

token-service.ts
├── generateAccessToken(userId, role) -> JWT
├── generateRefreshToken(userId) -> JWT
├── verifyAccessToken(token) -> Payload
├── verifyRefreshToken(token) -> Payload
├── rotateRefreshToken(oldToken) -> NewToken
├── revokeToken(jti) -> void
├── isTokenRevoked(jti) -> boolean
└── generateEmailToken() -> RandomToken

password.ts
├── hashPassword(plainText) -> bcrypt hash
├── comparePassword(plainText, hash) -> boolean
└── validatePasswordStrength(password) -> ValidationResult
```

**Token Service Implementation Details:**

**JWT Structure (Access Token):**
```json
{
  "sub": "user-uuid",
  "role": "COMMUNITY",
  "email": "user@example.com",
  "iat": 1707300000,
  "exp": 1707300900,
  "jti": "unique-token-id"
}
```

**JWT Structure (Refresh Token):**
```json
{
  "sub": "user-uuid",
  "type": "refresh",
  "iat": 1707300000,
  "exp": 1707904800,
  "jti": "unique-refresh-token-id"
}
```

**Token Configuration (from .env):**
```env
# Already exists from Phase 1.3
JWT_SECRET=<existing-secret>

# Add these
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d
JWT_REFRESH_TOKEN_EXPIRY_REMEMBER_ME=30d
BCRYPT_COST_FACTOR=12
```

**Redis Token Storage Patterns:**

```typescript
// Revoked tokens (JTI blocklist)
await redis.setex(`revoked:jti:${jti}`, ttl, '1');

// Email verification tokens (24h expiry)
await redis.setex(`verify:${userId}:${token}`, 86400, JSON.stringify({userId, email}));

// Password reset tokens (1h expiry)
await redis.setex(`reset:${userId}:${token}`, 3600, JSON.stringify({userId, email}));

// Failed login attempts (15min lockout)
await redis.setex(`lockout:${userId}`, 900, attemptCount);
```

**Success Criteria:**
- All 9 service methods implemented
- Password hashing with bcrypt cost factor 12+
- JWT tokens signed with RS256 or HS256
- Token expiry configurable via env
- Token revocation via Redis JTI blocklist
- Email token generation (secure random)
- Failed login lockout logic (5 attempts = 15min)

---

#### 2.1.3 Authentication Middleware (Day 2 - Afternoon)

**Files to Create:**
- `packages/backend/src/middleware/auth-middleware.ts` (NEW)
- `packages/backend/src/middleware/rbac-middleware.ts` (NEW)

**Middleware Architecture:**

```typescript
// auth-middleware.ts
export const requireAuth = async (req, res, next) => {
  // 1. Extract JWT from Authorization header or cookies
  // 2. Verify token signature
  // 3. Check if token is revoked (Redis lookup)
  // 4. Check if user still exists and is ACTIVE
  // 5. Attach user to req.user
  // 6. Call next() or return 401
};

export const optionalAuth = async (req, res, next) => {
  // Same as requireAuth but doesn't fail if no token
  // Used for public endpoints that show personalized content if logged in
};

// rbac-middleware.ts
export const requireRole = (allowedRoles: UserRole[]) => {
  return async (req, res, next) => {
    // 1. Requires auth middleware to run first
    // 2. Check if req.user.role is in allowedRoles
    // 3. Call next() or return 403
  };
};

export const requirePermission = (action: string, resourceType: string) => {
  return async (req, res, next) => {
    // Check permission matrix (Spec §10.2)
    // e.g., action="edit", resourceType="business" -> only owner or admin
  };
};
```

**Usage Example:**

```typescript
// Public endpoint
router.get('/businesses/:id', async (req, res) => { ... });

// User-only endpoint
router.post('/businesses/:id/save', requireAuth, async (req, res) => { ... });

// Business owner or admin only
router.put('/businesses/:id', requireAuth, requireRole(['BUSINESS_OWNER', 'ADMIN']), async (req, res) => { ... });

// Admin only
router.get('/admin/users', requireAuth, requireRole(['ADMIN']), async (req, res) => { ... });
```

**Success Criteria:**
- requireAuth extracts JWT from Authorization header
- Verifies token with jsonwebtoken
- Checks Redis blocklist for revoked tokens
- Attaches user to req.user
- requireRole enforces role-based access
- Returns 401 for unauthenticated
- Returns 403 for unauthorized (wrong role)

---

#### 2.1.4 Authentication Routes (Day 3 - Day 4 Morning)

**Files to Create:**
- `packages/backend/src/routes/auth.ts` (NEW)

**Endpoints to Implement:**

```typescript
// 1. POST /auth/register
router.post('/register',
  validate(registerSchema),
  authRateLimiter,  // Already exists from Phase 1.5
  async (req, res) => {
    // 1. Validate input (Zod)
    // 2. Check email uniqueness
    // 3. Hash password (bcrypt)
    // 4. Create user (status = PENDING)
    // 5. Generate email verification token
    // 6. Send verification email (Phase 1.6 email service)
    // 7. Return 201 + user object (no password)
  }
);

// 2. POST /auth/login
router.post('/login',
  validate(loginSchema),
  authRateLimiter,
  async (req, res) => {
    // 1. Validate input
    // 2. Find user by email
    // 3. Check lockout (Redis: lockout:${userId})
    // 4. Compare password (bcrypt)
    // 5. If fail: increment lockout counter
    // 6. If success: generate tokens
    // 7. Create UserSession record
    // 8. Set HttpOnly cookies (refresh_token)
    // 9. Return access_token + user object
  }
);

// 3. POST /auth/logout
router.post('/logout',
  requireAuth,
  async (req, res) => {
    // 1. Get JTI from req.user
    // 2. Add to Redis blocklist
    // 3. Delete UserSession record
    // 4. Clear cookies
    // 5. Return 200
  }
);

// 4. POST /auth/forgot-password
router.post('/forgot-password',
  validate(forgotPasswordSchema),
  passwordResetRateLimiter, // 3/hour from Phase 1.5
  async (req, res) => {
    // 1. Find user by email (silent failure)
    // 2. Generate reset token (crypto.randomBytes)
    // 3. Store in Redis: reset:${userId}:${token} (1h expiry)
    // 4. Send reset email with link
    // 5. Return 200 generic message
  }
);

// 5. POST /auth/reset-password
router.post('/reset-password',
  validate(resetPasswordSchema),
  async (req, res) => {
    // 1. Validate token from Redis
    // 2. Check not expired (<1h)
    // 3. Validate new password
    // 4. Hash new password
    // 5. Update user.password_hash
    // 6. Delete reset token from Redis
    // 7. Revoke all user sessions (force re-login)
    // 8. Send confirmation email
    // 9. Return 200
  }
);

// 6. POST /auth/verify-email
router.post('/verify-email',
  validate(verifyEmailSchema),
  async (req, res) => {
    // 1. Validate token from Redis
    // 2. Check not expired (<24h)
    // 3. Set user.email_verified = true
    // 4. Set user.status = ACTIVE
    // 5. Delete token from Redis
    // 6. Send welcome email
    // 7. Return 200
  }
);

// 7. POST /auth/resend-verification
router.post('/resend-verification',
  validate(resendVerificationSchema),
  authRateLimiter,
  async (req, res) => {
    // 1. Find user by email
    // 2. Check if already verified
    // 3. Generate new token
    // 4. Send verification email
    // 5. Return 200
  }
);

// 8. GET /auth/me
router.get('/me',
  requireAuth,
  async (req, res) => {
    // 1. Return req.user (already populated by middleware)
    // 2. Omit password_hash
    // 3. Include notification preferences
  }
);

// 9. POST /auth/refresh
router.post('/refresh',
  async (req, res) => {
    // 1. Extract refresh_token from cookies
    // 2. Verify refresh token
    // 3. Check if revoked
    // 4. Generate new access token
    // 5. Rotate refresh token (new JTI)
    // 6. Revoke old refresh token
    // 7. Update UserSession
    // 8. Set new refresh_token cookie
    // 9. Return new access_token
  }
);
```

**Validation Schemas (Zod):**

```typescript
const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
    displayName: z.string().min(2).max(50),
    languagePreference: z.string().optional(),
    suburb: z.string().optional(),
    interests: z.array(z.string()).optional(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string(),
    rememberMe: z.boolean().optional(),
  }),
});

// ... similar schemas for other endpoints
```

**Success Criteria:**
- All 9 endpoints implemented
- Input validation with Zod
- Rate limiting enforced (authRateLimiter, passwordResetRateLimiter)
- Emails sent via Phase 1.6 email service
- Passwords hashed with bcrypt
- Tokens stored in Redis
- UserSession records created/deleted
- HttpOnly cookies set correctly
- Error responses follow Spec §27 format

---

#### 2.1.5 Session Management (Day 4 - Afternoon)

**Extend User Routes:**
- `packages/backend/src/routes/users.ts` (NEW - or extend if exists)

**Endpoints:**

```typescript
// GET /users/:id/sessions
router.get('/:id/sessions',
  requireAuth,
  async (req, res) => {
    // 1. Verify user can only view own sessions (or admin)
    // 2. Query UserSession table
    // 3. Return sessions with device info
    // 4. Mark current session (req.user.jti)
  }
);

// DELETE /users/:id/sessions/:sessionId
router.delete('/:id/sessions/:sessionId',
  requireAuth,
  async (req, res) => {
    // 1. Verify ownership
    // 2. Get session JTI
    // 3. Add to Redis blocklist
    // 4. Delete UserSession record
    // 5. Return 200
  }
);

// DELETE /users/:id/sessions (revoke all sessions)
router.delete('/:id/sessions',
  requireAuth,
  async (req, res) => {
    // Used for "logout from all devices"
    // or on password change
  }
);
```

**Success Criteria:**
- Users can view their active sessions
- Users can revoke individual sessions
- Session revocation adds JTI to Redis blocklist
- Force logout on password change

---

### Sub-Phase 2.2: User Profile System (Days 5-7)

**Goal:** Implement user profile management and notification preferences

#### 2.2.1 User CRUD Endpoints (Day 5)

**Files:**
- `packages/backend/src/routes/users.ts` (extend)
- `packages/backend/src/services/user-service.ts` (NEW)

**Endpoints:**

```typescript
// GET /users/:id
router.get('/:id',
  requireAuth,
  async (req, res) => {
    // 1. Fetch user from database
    // 2. Omit password_hash
    // 3. Check visibility (own profile or admin)
    // 4. Return user object
  }
);

// PUT /users/:id
router.put('/:id',
  requireAuth,
  validate(updateUserSchema),
  async (req, res) => {
    // 1. Verify ownership (own profile only, or admin)
    // 2. Validate input
    // 3. Update allowed fields only:
    //    - displayName, bio, suburb, languagePreference, interests
    // 4. Cannot change: email, role, status (admin only)
    // 5. Return updated user
  }
);

// PUT /users/:id/photo
router.put('/:id/photo',
  requireAuth,
  uploadRateLimiter, // Phase 1.5
  async (req, res) => {
    // 1. Verify ownership
    // 2. Upload to local storage (Phase 1.3)
    // 3. Crop/resize to 400x400 (Sharp)
    // 4. Update user.profile_photo
    // 5. Return URL
  }
);

// PUT /users/:id/password
router.put('/:id/password',
  requireAuth,
  validate(changePasswordSchema),
  async (req, res) => {
    // 1. Verify ownership
    // 2. Verify current password
    // 3. Validate new password
    // 4. Hash new password
    // 5. Update user.password_hash
    // 6. Revoke all sessions (force re-login)
    // 7. Send confirmation email
    // 8. Return 200
  }
);

// PUT /users/:id/email
router.put('/:id/email',
  requireAuth,
  validate(changeEmailSchema),
  async (req, res) => {
    // 1. Verify ownership
    // 2. Check new email uniqueness
    // 3. Update email
    // 4. Set email_verified = false
    // 5. Set status = PENDING
    // 6. Send verification email to new address
    // 7. Return 200
  }
);

// DELETE /users/:id (account deletion)
router.delete('/:id',
  requireAuth,
  async (req, res) => {
    // 1. Verify ownership
    // 2. Set user.status = DELETED
    // 3. Set deletion_requested_at timestamp
    // 4. Schedule cleanup job (14 days)
    // 5. Send confirmation email
    // 6. Return 200
  }
);

// POST /users/:id/cancel-deletion
router.post('/:id/cancel-deletion',
  requireAuth,
  async (req, res) => {
    // 1. Verify ownership
    // 2. Check within 14-day grace period
    // 3. Restore user.status = ACTIVE
    // 4. Clear deletion_requested_at
    // 5. Return 200
  }
);
```

**Success Criteria:**
- All user CRUD endpoints implemented
- Validation enforces field constraints
- Users can only edit own profiles (or admin)
- Profile photo upload works
- Password change requires current password
- Email change triggers re-verification
- Account deletion with 14-day grace period

---

#### 2.2.2 Notification Preferences (Day 6)

**Endpoint:**

```typescript
// PUT /users/:id/preferences
router.put('/:id/preferences',
  requireAuth,
  validate(preferencesSchema),
  async (req, res) => {
    // 1. Verify ownership
    // 2. Validate preferences object
    // 3. Update user.notification_preferences (JSON field)
    // 4. Return updated preferences
  }
);
```

**Preferences Schema:**

```typescript
const preferencesSchema = z.object({
  body: z.object({
    emailDigest: z.enum(['none', 'daily', 'weekly']).optional(),
    pushEnabled: z.boolean().optional(),
    smsEnabled: z.boolean().optional(),
    dealAlerts: z.boolean().optional(),
    eventReminders: z.boolean().optional(),
    businessUpdates: z.boolean().optional(),
    emergencyAlerts: z.enum(['all', 'critical_only', 'none']).optional(),
  }),
});
```

**Default Preferences (on registration):**

```json
{
  "emailDigest": "daily",
  "pushEnabled": true,
  "smsEnabled": false,
  "dealAlerts": false,
  "eventReminders": true,
  "businessUpdates": true,
  "emergencyAlerts": "all"
}
```

**Success Criteria:**
- Preferences stored in User.notification_preferences JSON field
- Validation enforces allowed values
- Defaults applied on registration

---

### Sub-Phase 2.3: Frontend Authentication (Days 7-10)

**Goal:** Build user-facing authentication UI with i18n

#### 2.3.1 Auth Context & State Management (Day 7)

**Files to Create:**
- `packages/frontend/src/contexts/AuthContext.tsx` (NEW)
- `packages/frontend/src/hooks/useAuth.ts` (NEW)
- `packages/frontend/src/services/auth-api.ts` (NEW)

**AuthContext Architecture:**

```typescript
interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  refreshToken: () => Promise<void>;
}

export const AuthProvider: React.FC = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // On mount: try to refresh token
    // If successful: fetch /auth/me and set user
    // If fail: user stays null
    checkAuthStatus();
  }, []);

  // Token refresh timer (refresh before expiry)
  useEffect(() => {
    if (user) {
      const interval = setInterval(refreshToken, 14 * 60 * 1000); // 14 minutes
      return () => clearInterval(interval);
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, ... }}>
      {children}
    </AuthContext.Provider>
  );
};
```

**Success Criteria:**
- AuthContext provides user state globally
- Token auto-refresh before expiry
- useAuth hook for easy access
- Protected route wrapper component

---

#### 2.3.2 Auth Forms & Pages (Days 8-9)

**Files to Create:**
- `packages/frontend/src/pages/auth/Register.tsx` (NEW)
- `packages/frontend/src/pages/auth/Login.tsx` (NEW)
- `packages/frontend/src/pages/auth/ForgotPassword.tsx` (NEW)
- `packages/frontend/src/pages/auth/ResetPassword.tsx` (NEW)
- `packages/frontend/src/pages/auth/VerifyEmail.tsx` (NEW)
- `packages/frontend/src/components/auth/RegisterForm.tsx` (NEW)
- `packages/frontend/src/components/auth/LoginForm.tsx` (NEW)

**Register Form Features:**
- Email, password, displayName fields
- Password strength indicator
- Language preference dropdown (from Phase 1.8 i18n)
- Suburb selection (optional)
- Interest categories (optional)
- Client-side validation
- Loading state during submission
- Error display (translated)
- Success message → redirect to email verification page

**Login Form Features:**
- Email, password fields
- "Remember me" checkbox
- "Forgot password?" link
- Error display for invalid credentials
- Lockout message (5 failed attempts)
- Loading state
- Redirect to intended page after login

**Success Criteria:**
- All forms accessible (WCAG 2.1 AA)
- All text translated (Phase 1.8 i18n)
- RTL layout for Arabic/Urdu
- Client-side validation matches backend
- Loading states prevent double submission
- Errors displayed inline with ARIA

---

#### 2.3.3 User Profile Pages (Day 10)

**Files to Create:**
- `packages/frontend/src/pages/user/Profile.tsx` (NEW)
- `packages/frontend/src/pages/user/Settings.tsx` (NEW)
- `packages/frontend/src/components/user/ProfileEditor.tsx` (NEW)
- `packages/frontend/src/components/user/NotificationPreferences.tsx` (NEW)
- `packages/frontend/src/components/user/ActiveSessions.tsx` (NEW)

**Profile Page:**
- Display name (editable inline)
- Profile photo (upload & crop)
- Bio (textarea, 500 char limit)
- Language preference dropdown
- Suburb selection
- Interest categories (multi-select)
- "Member since" date (read-only)

**Settings Page:**
- Change password
- Change email
- Notification preferences (toggles)
- Active sessions list (with revoke button)
- Account deletion (with confirmation modal)

**Success Criteria:**
- Profile editing works
- Photo upload with cropping
- Notification preferences save
- Active sessions display
- Account deletion with 14-day grace period confirmation

---

### Sub-Phase 2.4: Testing & Security Audit (Days 11-13)

#### 2.4.1 Backend Unit Tests (Day 11)

**Files to Create:**
- `packages/backend/src/__tests__/services/auth-service.test.ts` (NEW)
- `packages/backend/src/__tests__/services/token-service.test.ts` (NEW)
- `packages/backend/src/__tests__/services/user-service.test.ts` (NEW)
- `packages/backend/src/__tests__/middleware/auth-middleware.test.ts` (NEW)
- `packages/backend/src/__tests__/middleware/rbac-middleware.test.ts` (NEW)
- `packages/backend/src/__tests__/routes/auth.test.ts` (NEW)
- `packages/backend/src/__tests__/routes/users.test.ts` (NEW)

**Test Coverage Targets:**
- auth-service: 100% (all branches)
- token-service: 100%
- password utils: 100%
- auth-middleware: 100%
- rbac-middleware: 100%
- auth routes: >90% (integration tests)
- user routes: >90%

**Critical Test Cases:**

```typescript
// auth-service.test.ts
describe('AuthService', () => {
  it('should register user with PENDING status', ...);
  it('should not register duplicate email', ...);
  it('should hash password with bcrypt', ...);
  it('should send verification email on registration', ...);
  it('should verify email and set status to ACTIVE', ...);
  it('should not verify expired token', ...);
  it('should login with valid credentials', ...);
  it('should not login with invalid password', ...);
  it('should lockout after 5 failed attempts', ...);
  it('should unlock after 15 minutes', ...);
  it('should generate password reset token', ...);
  it('should reset password with valid token', ...);
  it('should not reset with expired token', ...);
});

// token-service.test.ts
describe('TokenService', () => {
  it('should generate valid access token', ...);
  it('should generate valid refresh token', ...);
  it('should verify access token', ...);
  it('should rotate refresh token', ...);
  it('should revoke token (add to blocklist)', ...);
  it('should detect revoked token', ...);
  it('should reject expired token', ...);
  it('should reject invalid signature', ...);
});

// auth-middleware.test.ts
describe('requireAuth', () => {
  it('should attach user to req.user with valid token', ...);
  it('should return 401 with no token', ...);
  it('should return 401 with invalid token', ...);
  it('should return 401 with revoked token', ...);
  it('should return 401 if user is SUSPENDED', ...);
  it('should return 401 if user is DELETED', ...);
});

// rbac-middleware.test.ts
describe('requireRole', () => {
  it('should allow ADMIN to access admin routes', ...);
  it('should deny COMMUNITY to access admin routes', ...);
  it('should return 403 for wrong role', ...);
});

// auth routes integration tests
describe('POST /auth/register', () => {
  it('should create user and return 201', ...);
  it('should return 400 for weak password', ...);
  it('should return 409 for duplicate email', ...);
  it('should send verification email', ...);
});

describe('POST /auth/login', () => {
  it('should return access token with valid credentials', ...);
  it('should set HttpOnly refresh_token cookie', ...);
  it('should return 401 for invalid credentials', ...);
  it('should return 423 after 5 failed attempts', ...);
  it('should respect rememberMe flag (30-day token)', ...);
});

// ... similar tests for all endpoints
```

**Success Criteria:**
- >80% test coverage (Phase requirement)
- All critical paths tested
- Edge cases covered (expired tokens, lockouts, etc.)
- All tests passing

---

#### 2.4.2 Frontend Tests (Day 12 - Morning)

**Files to Create:**
- `packages/frontend/src/__tests__/hooks/useAuth.test.tsx` (NEW)
- `packages/frontend/src/__tests__/pages/auth/Login.test.tsx` (NEW)
- `packages/frontend/src/__tests__/pages/auth/Register.test.tsx` (NEW)
- `packages/frontend/src/__tests__/components/user/ProfileEditor.test.tsx` (NEW)

**Test Coverage:**
- useAuth hook: state management, login/logout flows
- Auth forms: validation, submission, error display
- Protected routes: redirect when unauthenticated
- Profile editing: form validation, save

**Success Criteria:**
- Frontend tests passing
- Accessibility tests with jest-axe
- No a11y violations on auth forms

---

#### 2.4.3 Security Audit (Day 12 - Afternoon to Day 13)

**Security Checklist:**

**Authentication Security:**
- [ ] Passwords hashed with bcrypt cost factor 12+
- [ ] No credentials logged or returned in errors
- [ ] Rate limiting enforced (10/15min auth, 3/1hr password reset)
- [ ] Account lockout after 5 failed attempts (15min)
- [ ] Secure password reset with time-limited tokens
- [ ] Email verification before ACTIVE status

**Token Security:**
- [ ] JWT signed with secure algorithm (RS256 or HS256)
- [ ] Tokens stored in HttpOnly cookies only
- [ ] Refresh token rotation implemented
- [ ] Token revocation via JTI blocklist
- [ ] Short access token lifetime (15 minutes)
- [ ] Refresh token lifetime configurable (7d/30d)

**Session Security:**
- [ ] Secure flag on cookies (HTTPS only)
- [ ] SameSite=Strict on auth cookies
- [ ] HttpOnly flag on refresh token
- [ ] Session revocation works
- [ ] Force logout on password change

**CSRF Protection:**
- [ ] Double-submit cookies (Phase 1.5) still working
- [ ] SameSite=Strict prevents CSRF
- [ ] Exempt public GET endpoints

**Input Validation:**
- [ ] Zod validation on all endpoints
- [ ] Email format validation
- [ ] Password complexity enforcement
- [ ] Display name length validation
- [ ] No SQL injection (Prisma protects)
- [ ] No XSS (DOMPurify from Phase 1.5)

**Privacy:**
- [ ] PII not logged
- [ ] Password hash never returned
- [ ] User can access own data (GET /users/:id)
- [ ] User can delete account (14-day grace)
- [ ] Email verification tokens expire (24h)
- [ ] Password reset tokens expire (1h)

**OWASP Top 10:**
- [ ] A01 Broken Access Control: RBAC enforced
- [ ] A02 Cryptographic Failures: bcrypt, secure tokens
- [ ] A03 Injection: Prisma + Zod validation
- [ ] A04 Insecure Design: Password reset via email
- [ ] A05 Security Misconfiguration: Secure headers (Phase 1.5)
- [ ] A06 Vulnerable Components: Dependencies up to date
- [ ] A07 Identification/Auth Failures: Lockout, strong passwords
- [ ] A08 Software/Data Integrity: N/A
- [ ] A09 Logging Failures: Pino logs auth events
- [ ] A10 SSRF: N/A for auth

**Tools:**
- Run OWASP ZAP scan against auth endpoints
- Check dependencies with Snyk
- Review Pino logs for credential leaks

**Success Criteria:**
- All security checklist items ✓
- No critical vulnerabilities found
- OWASP ZAP scan clean
- Dependencies up to date

---

### Sub-Phase 2.5: Documentation & Deployment (Days 13-14)

#### 2.5.1 API Documentation (Day 13 - Afternoon)

**Files to Create:**
- `docs/api/authentication.md` (NEW)
- OpenAPI/Swagger spec for auth endpoints

**Documentation Content:**
- All 9 auth endpoints with request/response examples
- Error codes and meanings
- Rate limits
- Token lifecycle diagram
- RBAC permission matrix
- Example cURL commands
- Postman collection

**Success Criteria:**
- Complete API docs
- OpenAPI spec validates
- Postman collection works

---

#### 2.5.2 Update Project Docs (Day 14)

**Files to Update:**
- `C:\Users\dunsk\code\community hub\TODO.md` - Mark Phase 2 tasks complete
- `C:\Users\dunsk\code\community hub\PROGRESS.md` - Update Phase 2 status
- `C:\Users\dunsk\code\community hub\CLAUDE.md` - Add Phase 2 notes
- `.env.example` - Add new env variables

**New .env Variables:**

```env
# Authentication
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d
JWT_REFRESH_TOKEN_EXPIRY_REMEMBER_ME=30d
BCRYPT_COST_FACTOR=12

# OAuth (optional - can defer to post-MVP)
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
```

**Success Criteria:**
- TODO.md updated (Phase 2 = 100%)
- PROGRESS.md updated
- .env.example has all new variables
- README has auth setup instructions

---

## 2. CONFIGURATION REQUIREMENTS

### 2.1 Environment Variables (.env)

```env
# Existing from Phase 1
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=<existing>
SESSION_SECRET=<existing>
ENCRYPTION_KEY=<existing>
MAILGUN_API_KEY=<existing>
MAILGUN_DOMAIN=<existing>

# New for Phase 2
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d
JWT_REFRESH_TOKEN_EXPIRY_REMEMBER_ME=30d
BCRYPT_COST_FACTOR=12

# Optional OAuth (can defer)
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
```

### 2.2 Platform Configuration (platform.json)

**No changes required** - Phase 2 uses existing config:
- `multilingual.defaultLanguage`
- `multilingual.supportedLanguages`
- `features.authOAuth` (optional, default false)
- `features.twoFactorAuth` (optional, default false)

### 2.3 Database Seeding

**Add to `packages/backend/prisma/seed.ts`:**

```typescript
// Create admin user for testing
const adminUser = await prisma.user.create({
  data: {
    email: 'admin@example.com',
    passwordHash: await bcrypt.hash('Admin123!', 12),
    displayName: 'Admin User',
    role: 'ADMIN',
    status: 'ACTIVE',
    emailVerified: true,
  },
});

// Create test community user
const testUser = await prisma.user.create({
  data: {
    email: 'user@example.com',
    passwordHash: await bcrypt.hash('User123!', 12),
    displayName: 'Test User',
    role: 'COMMUNITY',
    status: 'ACTIVE',
    emailVerified: true,
  },
});
```

---

## 3. API ENDPOINTS SUMMARY

### 3.1 Authentication Endpoints (Appendix B.1)

| Endpoint | Method | Auth | Rate Limit | Description |
|----------|--------|------|------------|-------------|
| `/auth/register` | POST | Public | 10/15min | User registration |
| `/auth/login` | POST | Public | 10/15min | User login |
| `/auth/logout` | POST | Required | None | Revoke session |
| `/auth/forgot-password` | POST | Public | 3/1hr | Request password reset |
| `/auth/reset-password` | POST | Public | None | Complete password reset |
| `/auth/verify-email` | POST | Public | None | Verify email address |
| `/auth/resend-verification` | POST | Public | 10/15min | Resend verification email |
| `/auth/me` | GET | Required | None | Get current user |
| `/auth/refresh` | POST | Refresh Token | None | Refresh access token |

### 3.2 User Endpoints (Appendix B.4)

| Endpoint | Method | Auth | Rate Limit | Description |
|----------|--------|------|------------|-------------|
| `/users/:id` | GET | Required | None | Get user profile |
| `/users/:id` | PUT | Required | None | Update profile |
| `/users/:id` | DELETE | Required | None | Delete account (14-day grace) |
| `/users/:id/photo` | PUT | Required | 20/hr | Upload profile photo |
| `/users/:id/password` | PUT | Required | None | Change password |
| `/users/:id/email` | PUT | Required | None | Change email (re-verify) |
| `/users/:id/preferences` | PUT | Required | None | Update notification prefs |
| `/users/:id/sessions` | GET | Required | None | List active sessions |
| `/users/:id/sessions/:sessionId` | DELETE | Required | None | Revoke session |
| `/users/:id/cancel-deletion` | POST | Required | None | Cancel account deletion |

**Total Endpoints:** 19 (9 auth + 10 user)

---

## 4. DATA MODELS

### 4.1 User Model (Already in Prisma Schema from Phase 1.3)

```prisma
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

**No changes needed** - all fields already present from Phase 1.3!

### 4.2 UserSession Model (Already in Prisma Schema)

```prisma
model UserSession {
  id           String   @id @default(uuid())
  userId       String   @map("user_id")
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  tokenHash    String   @unique @map("token_hash")
  deviceInfo   Json     @map("device_info")
  ipAddress    String   @map("ip_address")
  location     String?
  isCurrent    Boolean  @default(false) @map("is_current")
  lastActiveAt DateTime @map("last_active_at")
  expiresAt    DateTime @map("expires_at")
  createdAt    DateTime @default(now()) @map("created_at")

  @@index([userId])
  @@index([expiresAt])
  @@map("user_sessions")
}
```

**No changes needed** - all fields present!

### 4.3 Optional: Token Models (If Using Database Instead of Redis)

```prisma
// Only add if NOT using Redis for tokens
model PasswordResetToken {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token     String   @unique
  expiresAt DateTime @map("expires_at")
  used      Boolean  @default(false)
  createdAt DateTime @default(now()) @map("created_at")

  @@index([userId])
  @@index([expiresAt])
  @@map("password_reset_tokens")
}

model EmailVerificationToken {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token     String   @unique
  expiresAt DateTime @map("expires_at")
  used      Boolean  @default(false)
  createdAt DateTime @default(now()) @map("created_at")

  @@index([userId])
  @@index([expiresAt])
  @@map("email_verification_tokens")
}
```

**Decision:** Use Redis (recommended) or database tokens?
- **Redis:** Simpler, auto-expiry via TTL, faster
- **Database:** Persistent audit trail, survives Redis restarts

**Recommendation:** Redis for MVP

---

## 5. DEPENDENCIES & INTEGRATION POINTS

### 5.1 Phase 1 Dependencies (All Complete ✓)

| Phase 1 Subsection | Status | Needed For |
|-------------------|--------|-----------|
| 1.1 Project Setup | ✓ Complete | Build & deployment |
| 1.2 Config Architecture | ✓ Complete | Feature flags, language config |
| 1.3 Backend Infrastructure | ✓ Complete | API, database, Redis |
| 1.4 Frontend Infrastructure | ✓ Complete | UI components |
| 1.5 Security Foundation | ✓ Complete | CSRF, rate limiting, encryption |
| 1.6 Email Service | ✓ Complete | Verification & reset emails |
| 1.7 Maps Integration | ✓ Complete | Suburb selection (optional) |
| 1.8 i18n Foundation | ✓ Complete | Multi-language UI |

**All dependencies satisfied!**

### 5.2 External Dependencies

**NPM Packages to Install:**

```bash
# Backend
cd packages/backend
pnpm add bcrypt jsonwebtoken
pnpm add -D @types/bcrypt @types/jsonwebtoken

# Frontend (if using react-router for protected routes)
cd packages/frontend
pnpm add react-router-dom
pnpm add -D @types/react-router-dom
```

**Already Installed:**
- Express 5 (Phase 1.3)
- Prisma 7.3 (Phase 1.3)
- Redis client (Phase 1.3)
- Mailgun API (Phase 1.6)
- Zod validation (Phase 1.5)
- DOMPurify sanitization (Phase 1.5)

### 5.3 Phase 2 Blocks These Phases

- **Phase 3:** Design System - Can proceed in parallel
- **Phase 4:** Business Directory - Needs auth for claiming
- **Phase 6:** User Engagement - Needs auth for reviews/saved businesses
- **Phase 7:** Business Owner - Needs auth for dashboard
- **Phase 9:** Messaging - Needs auth for conversations
- **All other phases:** Indirectly depend on auth

---

## 6. SECURITY & COMPLIANCE

### 6.1 OWASP Top 10 Coverage

| Risk | Mitigation |
|------|-----------|
| A01 Broken Access Control | RBAC middleware, ownership checks |
| A02 Cryptographic Failures | bcrypt (cost 12+), secure JWT signing, HTTPS cookies |
| A03 Injection | Prisma (parameterized), Zod validation |
| A04 Insecure Design | Email verification, password reset flow, lockout |
| A05 Security Misconfiguration | Secure headers (Phase 1.5), HttpOnly cookies |
| A06 Vulnerable Components | Dependency scanning (Snyk) |
| A07 Identification/Auth Failures | Password strength, lockout, token rotation |
| A08 Software/Data Integrity | N/A for auth |
| A09 Logging Failures | Pino logs auth events (no credentials) |
| A10 SSRF | N/A for auth |

### 6.2 Australian Privacy Principles (APP) Compliance

| Principle | Implementation |
|-----------|----------------|
| APP 1: Open and transparent | Privacy policy (Phase 5) |
| APP 2: Anonymity | Guest access (no account required for browsing) |
| APP 3: Collection | Minimise PII (only email, name, optional suburb) |
| APP 4: Unsolicited info | N/A |
| APP 5: Notification | Privacy policy on registration |
| APP 6: Use/disclosure | Email for auth only, no third-party sharing |
| APP 7: Direct marketing | Opt-out via notification prefs |
| APP 8: Cross-border | No offshore storage (DigitalOcean Sydney) |
| APP 9: Adoption/use | Government ID verification optional for business owners |
| APP 10: Quality | Users can update profile |
| APP 11: Security | Encryption at rest (Phase 1.5), bcrypt, secure sessions |
| APP 12: Access | GET /users/:id |
| APP 13: Correction | PUT /users/:id |
| APP 14: Deletion | DELETE /users/:id (14-day grace) |

### 6.3 Password Security (Spec §4.1)

- **Hashing:** bcrypt with cost factor 12+ (configurable via env)
- **Requirements:** Min 8 chars, uppercase, number
- **Validation:** Client and server-side
- **Reset:** Time-limited tokens (1 hour)
- **Change:** Requires current password

### 6.4 Session Security (Spec §4.6)

- **Token Lifetime:** Access 15min, Refresh 7d (30d with remember me)
- **Storage:** HttpOnly cookies only (no localStorage)
- **Signing:** RS256 or HS256 (configurable)
- **Rotation:** Refresh token rotated on use
- **Revocation:** JTI blocklist in Redis
- **Multi-device:** Supported via UserSession table

### 6.5 Rate Limiting (Spec §4.8, Phase 1.5)

| Endpoint | Limit | Window | Lockout |
|----------|-------|--------|---------|
| POST /auth/register | 10 | 15min | 429 |
| POST /auth/login | 10 | 15min | 423 after 5 failures |
| POST /auth/forgot-password | 3 | 1hr | 429 |
| POST /auth/resend-verification | 10 | 15min | 429 |
| PUT /users/:id/photo | 20 | 1hr | 429 |

**Implementation:** Use existing rate limiters from Phase 1.5:
- `authRateLimiter` (10/15min)
- `passwordResetRateLimiter` (3/1hr) - NEW
- `uploadRateLimiter` (20/hr)

---

## 7. TESTING STRATEGY

### 7.1 Test Coverage Targets

| Layer | Target Coverage | Files |
|-------|----------------|-------|
| Services | 100% | auth-service, token-service, user-service, password utils |
| Middleware | 100% | auth-middleware, rbac-middleware |
| Routes | >90% | auth routes, user routes |
| Frontend | >80% | Auth forms, useAuth hook, profile pages |

### 7.2 Test Types

**Unit Tests:**
- Service layer business logic
- Token generation/verification
- Password hashing/validation
- Middleware request handling

**Integration Tests:**
- Full auth flow (register → verify → login → logout)
- Password reset flow
- Email change flow
- Session management
- Rate limiting enforcement

**E2E Tests (Later, Phase 17):**
- User registration journey
- Login and protected route access
- Password reset journey

**Security Tests:**
- Lockout after 5 failed logins
- Token expiry and revocation
- CSRF protection
- Input validation bypasses (fuzzing)

### 7.3 Test Utilities

**Create Test Helpers:**
- `createTestUser(overrides)` - Factory for test users
- `generateTestToken(userId, role)` - Mock JWT tokens
- `loginAsUser(email, password)` - Helper for integration tests
- `expectAuthError(response, code)` - Assert error format

---

## 8. MULTILINGUAL & ACCESSIBILITY

### 8.1 Multilingual Requirements (Spec §8, Phase 1.8)

**Phase 1.8 provides:**
- Translation infrastructure (react-i18next)
- 10 language files (en, ar, zh-CN, zh-TW, vi, hi, ur, ko, el, it)
- RTL support for Arabic/Urdu
- Language switching hook

**Phase 2 needs:**
- Auth form labels/errors in all 10 languages
- Email templates in all 10 languages (Phase 1.6 already done!)
- Notification preference labels
- User onboarding wizard translations (defer to Phase 9)

**Translation Keys Needed:**

```json
{
  "auth": {
    "register": "Register",
    "login": "Login",
    "logout": "Logout",
    "email": "Email",
    "password": "Password",
    "displayName": "Display Name",
    "rememberMe": "Remember me for 30 days",
    "forgotPassword": "Forgot password?",
    "errors": {
      "invalidCredentials": "Invalid email or password",
      "accountLocked": "Account locked. Try again in {{minutes}} minutes.",
      "emailAlreadyExists": "Email already registered",
      "weakPassword": "Password must be at least 8 characters with uppercase and number",
      "verificationExpired": "Verification link expired. Request a new one.",
      "tokenInvalid": "Invalid or expired token"
    }
  }
}
```

### 8.2 Accessibility (WCAG 2.1 AA)

**Form Accessibility:**
- Labels associated with inputs (`<label htmlFor="...">`)
- Error messages linked via `aria-describedby`
- Required fields marked with `aria-required="true"`
- Password strength meter has `aria-live="polite"`
- Loading states have `aria-busy="true"`
- Submit buttons disabled during submission

**Keyboard Navigation:**
- Tab order logical (email → password → submit)
- Focus indicators visible (Phase 3 design system)
- Enter key submits forms

**Screen Reader:**
- Form errors announced via `aria-live="assertive"`
- Loading states announced
- Success messages announced

**Color Contrast:**
- Error text meets 4.5:1 ratio (design system Phase 3)
- Link text meets contrast requirements

---

## 9. RISK ASSESSMENT & MITIGATION

### 9.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| OAuth integration complexity | Medium | Medium | **Defer to post-MVP** - Start with email/password only |
| JWT/session management bugs | Medium | High | Use proven libraries (jsonwebtoken), comprehensive testing |
| Token rotation issues | Low | High | Thorough integration tests, monitor production |
| Email delivery failures | Low | Medium | Leverage Phase 1.6 bounce handling, fallback UI messages |
| Password hash compatibility | Low | High | Use bcrypt consistently (cost factor 12), test verification |
| CSRF bypass | Low | Critical | Leverage Phase 1.5 implementation, test all POST endpoints |
| Rate limiting bypass | Low | Medium | Test with multiple requests, monitor production |
| Timezone issues with token expiry | Low | Medium | Use UTC everywhere, server-side validation only |

### 9.2 Security Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| PII leakage in logs | Low | Critical | Never log passwords/tokens, sanitise error messages |
| Session fixation | Low | High | Regenerate session on login |
| Brute force attacks | Medium | High | Account lockout (5 attempts), rate limiting |
| Token theft (XSS) | Low | High | HttpOnly cookies prevent JavaScript access |
| Token theft (MITM) | Low | Critical | Secure flag (HTTPS only) |
| Credential stuffing | Medium | High | Rate limiting, monitor failed login patterns |
| Email enumeration | Low | Medium | Silent failure on password reset (don't reveal existence) |

### 9.3 Operational Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Email service downtime (Mailgun) | Low | Medium | Graceful degradation, retry queue (Phase 1.6) |
| Redis downtime | Low | High | Token revocation fails → force logout all users on restart |
| Database downtime | Low | Critical | DigitalOcean backups, restore < 1hr |
| Locked out legitimate users | Low | Medium | Admin tool to unlock accounts, clear Redis lockout keys |

---

## 10. PERFORMANCE TARGETS

| Metric | Target | Measurement |
|--------|--------|-------------|
| Registration endpoint | < 500ms | p95 latency |
| Login endpoint | < 300ms | p95 latency |
| Token refresh | < 100ms | p95 latency |
| Password reset email | < 5 seconds | End-to-end |
| JWT verification | < 10ms | Per middleware call |
| Rate limiter check | < 5ms | Per request |
| Bcrypt hash | < 200ms | Cost factor 12 |

**Optimization Strategies:**
- Cache JWT public key for RS256 verification
- Redis connection pooling (Phase 1.3)
- Batch email sending (Phase 1.6 queue)
- Index UserSession.expiresAt for cleanup queries

---

## 11. DEPLOYMENT CHECKLIST

### 11.1 Pre-Deployment

- [ ] All 575 existing tests still passing
- [ ] New Phase 2 tests > 80% coverage
- [ ] Security audit completed (OWASP ZAP)
- [ ] Dependencies up to date (Snyk scan clean)
- [ ] .env.example updated with new variables
- [ ] Prisma migrations generated and tested
- [ ] Email templates tested in all 10 languages
- [ ] API documentation complete
- [ ] Frontend accessible (WCAG 2.1 AA)
- [ ] No hardcoded credentials in code

### 11.2 Database Migrations

```bash
# Generate migration
cd packages/backend
pnpm prisma migrate dev --name phase-2-auth-user-system

# Apply to staging
pnpm prisma migrate deploy

# Verify schema
pnpm prisma validate
```

### 11.3 Environment Setup

**Production .env:**
```env
# Generate secure secrets
JWT_SECRET=$(openssl rand -base64 64)
SESSION_SECRET=$(openssl rand -base64 64)
ENCRYPTION_KEY=$(openssl rand -base64 32)

# Token expiry
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d
JWT_REFRESH_TOKEN_EXPIRY_REMEMBER_ME=30d

# Bcrypt
BCRYPT_COST_FACTOR=12

# OAuth (optional)
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...
```

### 11.4 Post-Deployment Monitoring

**Metrics to Monitor:**
- Failed login rate (alert if > 5%)
- Account lockout rate
- Token refresh errors
- Email delivery failures (Mailgun)
- Rate limit hits (429 responses)
- Password reset requests
- Registration rate

**Logs to Monitor:**
- Authentication errors
- Token verification failures
- Email sending failures
- Rate limit violations

---

## 12. SUCCESS CRITERIA

### 12.1 Phase 2 Completion Checklist

**Authentication (18 tasks):**
- [ ] 9 auth endpoints implemented and tested
- [ ] Email verification flow works (24h expiry)
- [ ] Password reset flow works (1h expiry)
- [ ] JWT token generation and verification
- [ ] Refresh token rotation implemented
- [ ] Account lockout after 5 failed attempts
- [ ] Rate limiting enforced on all auth endpoints
- [ ] Emails sent via Phase 1.6 service
- [ ] OAuth foundations (can defer actual integration)
- [ ] 2FA foundations (can defer actual implementation)

**User System (15 tasks):**
- [ ] User model extended with all fields
- [ ] 6 roles defined (COMMUNITY, BUSINESS_OWNER, MODERATOR, ADMIN, SUPER_ADMIN, CHAMBER_STAFF)
- [ ] RBAC middleware enforces permissions
- [ ] User profile CRUD endpoints
- [ ] Profile photo upload works
- [ ] Password change with re-authentication
- [ ] Email change with re-verification
- [ ] Notification preferences saveable
- [ ] Active sessions management
- [ ] Account deletion with 14-day grace period

**Testing:**
- [ ] > 80% test coverage (unit + integration)
- [ ] All security tests passing
- [ ] No accessibility violations (jest-axe)
- [ ] All endpoints respond with spec-compliant errors (§27)

**Security:**
- [ ] Passwords hashed with bcrypt cost 12+
- [ ] No credentials in logs
- [ ] CSRF protection validated
- [ ] OWASP ZAP scan clean
- [ ] Dependencies up to date (Snyk)

**Documentation:**
- [ ] API documentation complete
- [ ] TODO.md updated (Phase 2 = 100%)
- [ ] PROGRESS.md updated
- [ ] .env.example updated

### 12.2 Performance Benchmarks

- [ ] Auth endpoints respond < 500ms (p95)
- [ ] Password reset email sent < 5 seconds
- [ ] JWT validation < 10ms per request
- [ ] Rate limiter check < 5ms
- [ ] No memory leaks in long-running sessions

### 12.3 User Acceptance

- [ ] User can register and verify email
- [ ] User can login and access protected pages
- [ ] User can reset forgotten password
- [ ] User can edit profile
- [ ] User can change password
- [ ] User can manage active sessions
- [ ] User can delete account (with grace period)
- [ ] All flows work in all 10 languages
- [ ] All flows accessible with keyboard only

---

## 13. NEXT STEPS AFTER PHASE 2

Once Phase 2 is complete:

1. **Phase 3: Design System & Core Components** (can run parallel)
   - Build out full component library
   - Language selector UI component (deferred from Phase 1.8)
   - Design tokens and theming

2. **Phase 4: Business Directory Core** (blocked by Phase 2 ✓)
   - Business model and CRUD
   - Business claiming (needs auth)
   - Business profiles

3. **Phase 6: User Engagement** (blocked by Phase 2 ✓)
   - Saved businesses (needs auth)
   - Reviews and ratings (needs auth)

4. **Phase 7: Business Owner Features** (blocked by Phase 2 ✓)
   - Business dashboard (needs auth)
   - Analytics

---

## 14. FILE STRUCTURE REFERENCE

```
packages/backend/
├── prisma/
│   ├── schema.prisma          # User, UserSession models (already exist)
│   └── migrations/
│       └── YYYYMMDDHHMMSS_phase_2_auth/
├── src/
│   ├── routes/
│   │   ├── auth.ts            # NEW: 9 auth endpoints
│   │   └── users.ts           # NEW: 10 user endpoints
│   ├── services/
│   │   ├── auth-service.ts    # NEW: Auth business logic
│   │   ├── token-service.ts   # NEW: JWT management
│   │   └── user-service.ts    # NEW: User profile logic
│   ├── middleware/
│   │   ├── auth-middleware.ts # NEW: requireAuth, optionalAuth
│   │   └── rbac-middleware.ts # NEW: requireRole, requirePermission
│   ├── utils/
│   │   └── password.ts        # NEW: bcrypt wrapper
│   ├── types/
│   │   └── auth.ts            # NEW: Auth TypeScript types
│   └── __tests__/
│       ├── routes/
│       │   ├── auth.test.ts   # NEW: 200+ test cases
│       │   └── users.test.ts  # NEW: 100+ test cases
│       ├── services/
│       │   ├── auth-service.test.ts
│       │   ├── token-service.test.ts
│       │   └── user-service.test.ts
│       └── middleware/
│           ├── auth-middleware.test.ts
│           └── rbac-middleware.test.ts

packages/frontend/
├── src/
│   ├── contexts/
│   │   └── AuthContext.tsx    # NEW: Global auth state
│   ├── hooks/
│   │   ├── useAuth.ts         # NEW: Auth hook
│   │   └── useProtectedRoute.ts # NEW: Route guard
│   ├── services/
│   │   ├── auth-api.ts        # NEW: API calls to /auth/*
│   │   └── user-api.ts        # NEW: API calls to /users/*
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── Register.tsx   # NEW
│   │   │   ├── Login.tsx      # NEW
│   │   │   ├── ForgotPassword.tsx # NEW
│   │   │   ├── ResetPassword.tsx  # NEW
│   │   │   └── VerifyEmail.tsx    # NEW
│   │   └── user/
│   │       ├── Profile.tsx    # NEW
│   │       └── Settings.tsx   # NEW
│   ├── components/
│   │   ├── auth/
│   │   │   ├── RegisterForm.tsx   # NEW
│   │   │   ├── LoginForm.tsx      # NEW
│   │   │   └── PasswordStrengthIndicator.tsx # NEW
│   │   └── user/
│   │       ├── ProfileEditor.tsx  # NEW
│   │       ├── NotificationPreferences.tsx # NEW
│   │       ├── ActiveSessions.tsx # NEW
│   │       └── AccountDeletion.tsx # NEW
│   └── __tests__/
│       ├── hooks/
│       │   └── useAuth.test.tsx
│       ├── pages/
│       │   └── auth/
│       │       ├── Login.test.tsx
│       │       └── Register.test.tsx
│       └── components/
│           └── user/
│               └── ProfileEditor.test.tsx

docs/
└── api/
    └── authentication.md      # NEW: API documentation
```

---

## 15. SUMMARY TABLE

| Aspect | Details |
|--------|---------|
| **Phase Number** | Phase 2 |
| **Title** | Authentication & User System |
| **Status** | Ready to Start |
| **Tasks** | 33 (18 auth + 15 user) |
| **Estimated Effort** | 13-16 days (1 developer) |
| **Spec Sections** | §4 (Security/Auth), §9 (Onboarding), §10 (User Types), §12 (Community User) |
| **Appendices** | A.2 (User model), B.1 (Auth endpoints), B.4 (User endpoints) |
| **Dependencies** | Phase 1 complete ✓ (all subsections) |
| **Blocks** | Phases 4-18 (nearly all features) |
| **API Endpoints** | 19 (9 auth + 10 user) |
| **Database Models** | User ✓, UserSession ✓, Optional token models |
| **New NPM Packages** | bcrypt, jsonwebtoken |
| **Test Coverage Target** | > 80% (unit + integration) |
| **Security** | bcrypt, JWT, RBAC, rate limiting, lockout, CSRF |
| **Multilingual** | All 10 languages (Phase 1.8) |
| **Accessibility** | WCAG 2.1 AA (keyboard, screen reader, contrast) |
| **Performance** | Auth < 500ms, Login < 300ms, JWT verify < 10ms |
| **Compliance** | APP (Australian Privacy Principles), OWASP Top 10 |

---

### Critical Files for Implementation

Based on this comprehensive plan, the 5 most critical files for implementing Phase 2 are:

1. **C:\Users\dunsk\code\community hub\packages\backend\src\services\auth-service.ts** - Core authentication logic (register, login, email verification, password reset) - this is the heart of Phase 2

2. **C:\Users\dunsk\code\community hub\packages\backend\src\services\token-service.ts** - JWT token generation, verification, rotation, and revocation - critical for session security

3. **C:\Users\dunsk\code\community hub\packages\backend\src\middleware\auth-middleware.ts** - Request authentication middleware (requireAuth, optionalAuth) - used by all protected endpoints

4. **C:\Users\dunsk\code\community hub\packages\backend\src\routes\auth.ts** - All 9 authentication endpoints implementation - API surface for auth flows

5. **C:\Users\dunsk\code\community hub\packages\frontend\src\contexts\AuthContext.tsx** - Global auth state management for frontend - connects all UI components to auth system

---

**This implementation plan provides:**
- Step-by-step breakdown across 14 days
- Detailed technical specifications for all 33 tasks
- Complete file structure with NEW file indicators
- Security checklists and OWASP coverage
- Testing strategy with >80% coverage targets
- Integration points with Phase 1 foundation
- Risk assessment and mitigation strategies
- Success criteria and acceptance tests

**The plan is ready for immediate execution once Phase 1.8 (i18n Foundation) is complete.**