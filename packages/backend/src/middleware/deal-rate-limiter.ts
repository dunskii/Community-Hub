import rateLimit from 'express-rate-limit';

/**
 * Deal Rate Limiters
 * Phase 10: Promotions & Deals MVP
 */

/**
 * Rate limiter for deal creation
 * 5 deals per minute per user
 */
export const createDealLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: {
    error: 'TOO_MANY_REQUESTS',
    message: 'Too many deals created. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for deal updates
 * 10 updates per minute per user
 */
export const updateDealLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: {
    error: 'TOO_MANY_REQUESTS',
    message: 'Too many update requests. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for deal deletion
 * 5 deletions per minute per user
 */
export const deleteDealLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: {
    error: 'TOO_MANY_REQUESTS',
    message: 'Too many delete requests. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for listing deals
 * 30 requests per minute
 */
export const listDealsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: {
    error: 'TOO_MANY_REQUESTS',
    message: 'Too many search requests. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for getting deal details
 * 60 requests per minute
 */
export const getDealLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  message: {
    error: 'TOO_MANY_REQUESTS',
    message: 'Too many requests. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for featured deals
 * 30 requests per minute
 */
export const featuredDealsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: {
    error: 'TOO_MANY_REQUESTS',
    message: 'Too many requests. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
