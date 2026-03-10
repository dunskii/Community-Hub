import rateLimit from 'express-rate-limit';
import { getPlatformConfig } from '../config/platform-loader.js';

const config = getPlatformConfig();

/**
 * Rate limiter for review creation
 * Default: 5 reviews per hour per user (configurable)
 */
export const createReviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: config.limits.reviewsPerHour,
  message: 'Too many reviews created. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

/**
 * Rate limiter for helpful votes
 * 30 votes per minute to prevent abuse
 */
export const helpfulVoteLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: 'Too many helpful votes. Please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for content reporting
 * Default: 10 reports per hour per user (configurable)
 */
export const reportContentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: config.limits.reportsPerHour,
  message: 'Too many reports submitted. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for business responses
 * 10 responses per hour per business owner
 */
export const businessResponseLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Too many responses. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for saving businesses
 * 30 saves per minute
 */
export const saveBusinessLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: 'Too many save actions. Please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for following businesses
 * 30 follows per minute
 */
export const followBusinessLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: 'Too many follow actions. Please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
});
