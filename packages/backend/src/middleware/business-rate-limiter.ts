/**
 * Business-specific Rate Limiters
 * Custom rate limits for business endpoints
 */

import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for business creation
 * Limit: 1 request per minute (admins creating businesses)
 */
export const createBusinessLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many business creation requests. Please try again in 1 minute.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Don't rate limit super admins
    return req.user?.role === 'SUPER_ADMIN';
  },
});

/**
 * Rate limiter for business updates
 * Limit: 5 requests per minute per business
 */
export const updateBusinessLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many update requests. Please try again in 1 minute.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use business ID + user ID as key
  keyGenerator: (req) => {
    const businessId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = req.user?.id || req.ip;
    return `${businessId}:${userId}`;
  },
});

/**
 * Rate limiter for business deletion
 * Limit: 1 request per minute (admins deleting businesses)
 */
export const deleteBusinessLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many deletion requests. Please try again in 1 minute.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for business listing
 * Limit: 30 requests per minute (disabled in development)
 */
export const listBusinessesLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: process.env.NODE_ENV === 'development' ? 1000 : 30,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again in 1 minute.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for business detail views
 * Limit: 60 requests per minute (disabled in development)
 */
export const getBusinessLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: process.env.NODE_ENV === 'development' ? 1000 : 60,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again in 1 minute.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
