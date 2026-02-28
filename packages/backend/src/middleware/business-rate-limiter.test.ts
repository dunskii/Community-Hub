/**
 * Unit tests for Business Rate Limiters
 * Tests exports of rate limiter middleware
 */

import { describe, it, expect } from 'vitest';
import {
  createBusinessLimiter,
  updateBusinessLimiter,
  deleteBusinessLimiter,
  listBusinessesLimiter,
  getBusinessLimiter,
} from './business-rate-limiter.js';

describe('Business Rate Limiters', () => {
  it('should export createBusinessLimiter middleware', () => {
    expect(createBusinessLimiter).toBeDefined();
    expect(typeof createBusinessLimiter).toBe('function');
  });

  it('should export updateBusinessLimiter middleware', () => {
    expect(updateBusinessLimiter).toBeDefined();
    expect(typeof updateBusinessLimiter).toBe('function');
  });

  it('should export deleteBusinessLimiter middleware', () => {
    expect(deleteBusinessLimiter).toBeDefined();
    expect(typeof deleteBusinessLimiter).toBe('function');
  });

  it('should export listBusinessesLimiter middleware', () => {
    expect(listBusinessesLimiter).toBeDefined();
    expect(typeof listBusinessesLimiter).toBe('function');
  });

  it('should export getBusinessLimiter middleware', () => {
    expect(getBusinessLimiter).toBeDefined();
    expect(typeof getBusinessLimiter).toBe('function');
  });

  it('should have all 5 rate limiters defined', () => {
    const limiters = [
      createBusinessLimiter,
      updateBusinessLimiter,
      deleteBusinessLimiter,
      listBusinessesLimiter,
      getBusinessLimiter,
    ];

    limiters.forEach((limiter) => {
      expect(limiter).toBeDefined();
      expect(typeof limiter).toBe('function');
    });
  });
});
