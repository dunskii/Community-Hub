import rateLimit from 'express-rate-limit';

// TODO: Replace in-memory store with Redis store (`rate-limit-redis`) for multi-instance deployments

const RATE_LIMIT_MESSAGE = {
  success: false,
  error: { code: 'RATE_LIMITED', message: 'Too many requests' },
};

/**
 * Rate limit configuration per Spec Section 4.8.
 * Exported for testing; consumed by the limiter factories below.
 */
export const RATE_LIMIT_CONFIG = {
  global:             { windowMs: 1 * 60 * 1000,      limit: 30  },  // 30 req / 1 min (anonymous baseline)
  auth:               { windowMs: 15 * 60 * 1000,     limit: 10  },  // 10 req / 15 min
  api:                { windowMs: 1 * 60 * 1000,      limit: 100 },  // 100 req / 1 min (authenticated)
  upload:             { windowMs: 60 * 60 * 1000,     limit: 20  },  // 20 req / 1 hr
  forgotPassword:     { windowMs: 60 * 60 * 1000,     limit: 3   },  // 3 req / 1 hr
  resetPassword:      { windowMs: 60 * 60 * 1000,     limit: 5   },  // 5 req / 1 hr
  search:             { windowMs: 1 * 60 * 1000,      limit: 30  },  // 30 req / 1 min
  review:             { windowMs: 24 * 60 * 60 * 1000, limit: 5   },  // 5 req / 24 hrs
} as const;

function createLimiter(config: { windowMs: number; limit: number }) {
  return rateLimit({
    ...config,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: RATE_LIMIT_MESSAGE,
  });
}

/** Global rate limiter -- applies to all routes as a baseline. */
export const rateLimiter = createLimiter(RATE_LIMIT_CONFIG.global);

/** Strict rate limiter for auth endpoints (login, register). */
export const authRateLimiter = createLimiter(RATE_LIMIT_CONFIG.auth);

/** Standard rate limiter for authenticated API endpoints. */
export const apiRateLimiter = createLimiter(RATE_LIMIT_CONFIG.api);

/** Upload rate limiter for file upload endpoints. */
export const uploadRateLimiter = createLimiter(RATE_LIMIT_CONFIG.upload);

/** Forgot password rate limiter (initiating reset). */
export const forgotPasswordRateLimiter = createLimiter(RATE_LIMIT_CONFIG.forgotPassword);

/** Reset password rate limiter (completing reset with token). */
export const resetPasswordRateLimiter = createLimiter(RATE_LIMIT_CONFIG.resetPassword);

/** @deprecated Use forgotPasswordRateLimiter instead */
export const passwordResetRateLimiter = forgotPasswordRateLimiter;

/** Search rate limiter. */
export const searchRateLimiter = createLimiter(RATE_LIMIT_CONFIG.search);

/** Review submission rate limiter. */
export const reviewRateLimiter = createLimiter(RATE_LIMIT_CONFIG.review);

// TODO: Add conversationRateLimiter (10/day) in Phase 9 (Messaging)
// TODO: Add flashDealRateLimiter (2/week) in Phase 10 (Deals)
