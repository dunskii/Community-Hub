/**
 * Social Media Rate Limiters
 *
 * Rate limiting for social media OAuth and posting endpoints.
 * Uses business ID or user ID as key (not IP) for accurate per-business limiting.
 */

import rateLimit from 'express-rate-limit';
import type { Request } from 'express';

/** Key generator: use businessId from route params, fallback to user ID, then IP */
function businessKeyGenerator(req: Request): string {
  const businessId = req.params['businessId'];
  if (typeof businessId === 'string') return `biz:${businessId}`;
  const userId = req.user?.id;
  if (userId) return `user:${userId}`;
  return req.ip || 'unknown';
}

/** OAuth auth endpoint: 5 requests per minute per business */
export const socialAuthLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  keyGenerator: businessKeyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'RATE_LIMITED', message: 'Too many auth requests. Please try again in a minute.' },
});

/** Post creation: 10 requests per minute per business */
export const socialPostLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: businessKeyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'RATE_LIMITED', message: 'Too many social post requests. Please try again shortly.' },
});

/** Caption preview: 20 requests per minute per business */
export const socialPreviewLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator: businessKeyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'RATE_LIMITED', message: 'Too many preview requests. Please try again shortly.' },
});

/** Account management: 10 requests per minute per business */
export const socialAccountLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: businessKeyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'RATE_LIMITED', message: 'Too many account management requests.' },
});
