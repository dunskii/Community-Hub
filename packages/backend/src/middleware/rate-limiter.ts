import rateLimit from 'express-rate-limit';

// TODO: Replace in-memory store with Redis store (`rate-limit-redis`) for multi-instance deployments

const RATE_LIMIT_MESSAGE = {
  success: false,
  error: { code: 'RATE_LIMITED', message: 'Too many requests' },
};

/**
 * Global rate limiter -- applies to all routes as a baseline.
 * Spec Section 4.8: 30 req/min for anonymous, 100 req/min for authenticated.
 * Using the lower anonymous limit globally; per-route limiters below provide tighter controls.
 */
export const rateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: RATE_LIMIT_MESSAGE,
});

/**
 * Strict rate limiter for auth endpoints (login, register, password reset).
 * Spec Section 4.8: 10 requests per 15 minutes.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: RATE_LIMIT_MESSAGE,
});

/**
 * Standard rate limiter for authenticated API endpoints.
 * Spec Section 4.8: 100 requests per minute.
 */
export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  limit: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: RATE_LIMIT_MESSAGE,
});

/**
 * Upload rate limiter for file upload endpoints.
 * Spec Section 4.8: 20 uploads per hour.
 */
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: RATE_LIMIT_MESSAGE,
});
