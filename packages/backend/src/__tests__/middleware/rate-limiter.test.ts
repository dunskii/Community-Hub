import { describe, it, expect } from 'vitest';

import {
  RATE_LIMIT_CONFIG,
  rateLimiter,
  authRateLimiter,
  apiRateLimiter,
  uploadRateLimiter,
  forgotPasswordRateLimiter,
  resetPasswordRateLimiter,
  searchRateLimiter,
  reviewRateLimiter,
} from '../../middleware/rate-limiter.js';

describe('rate limiters', () => {
  it('should export all 8 limiters as functions', () => {
    expect(typeof rateLimiter).toBe('function');
    expect(typeof authRateLimiter).toBe('function');
    expect(typeof apiRateLimiter).toBe('function');
    expect(typeof uploadRateLimiter).toBe('function');
    expect(typeof forgotPasswordRateLimiter).toBe('function');
    expect(typeof resetPasswordRateLimiter).toBe('function');
    expect(typeof searchRateLimiter).toBe('function');
    expect(typeof reviewRateLimiter).toBe('function');
  });

  describe('configuration values match Spec Section 4.8', () => {
    it('global: 30 req / 1 minute', () => {
      expect(RATE_LIMIT_CONFIG.global.windowMs).toBe(60_000);
      expect(RATE_LIMIT_CONFIG.global.limit).toBe(30);
    });

    it('auth: 10 req / 15 minutes', () => {
      expect(RATE_LIMIT_CONFIG.auth.windowMs).toBe(15 * 60_000);
      expect(RATE_LIMIT_CONFIG.auth.limit).toBe(10);
    });

    it('api (authenticated): 100 req / 1 minute', () => {
      expect(RATE_LIMIT_CONFIG.api.windowMs).toBe(60_000);
      expect(RATE_LIMIT_CONFIG.api.limit).toBe(100);
    });

    it('upload: 20 req / 1 hour', () => {
      expect(RATE_LIMIT_CONFIG.upload.windowMs).toBe(3_600_000);
      expect(RATE_LIMIT_CONFIG.upload.limit).toBe(20);
    });

    it('forgot password: 3 req / 1 hour', () => {
      expect(RATE_LIMIT_CONFIG.forgotPassword.windowMs).toBe(3_600_000);
      expect(RATE_LIMIT_CONFIG.forgotPassword.limit).toBe(3);
    });

    it('reset password: 5 req / 1 hour', () => {
      expect(RATE_LIMIT_CONFIG.resetPassword.windowMs).toBe(3_600_000);
      expect(RATE_LIMIT_CONFIG.resetPassword.limit).toBe(5);
    });

    it('search: 30 req / 1 minute', () => {
      expect(RATE_LIMIT_CONFIG.search.windowMs).toBe(60_000);
      expect(RATE_LIMIT_CONFIG.search.limit).toBe(30);
    });

    it('review: 5 req / 24 hours', () => {
      expect(RATE_LIMIT_CONFIG.review.windowMs).toBe(86_400_000);
      expect(RATE_LIMIT_CONFIG.review.limit).toBe(5);
    });
  });
});
