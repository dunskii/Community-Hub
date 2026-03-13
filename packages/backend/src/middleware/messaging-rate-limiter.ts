import rateLimit from 'express-rate-limit';

/**
 * Messaging Rate Limiters
 * Phase 9: Messaging System
 * Spec §16.3: Max 10 new conversations/day
 */

/**
 * Rate limiter for creating new conversations
 * 10 conversations per day per user (Spec §16.3)
 */
export const createConversationLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 10,
  message: {
    error: 'TOO_MANY_CONVERSATIONS',
    message: 'You have reached the daily limit for new conversations. Please try again tomorrow.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for sending messages
 * 30 messages per hour per user
 */
export const sendMessageLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  message: {
    error: 'TOO_MANY_MESSAGES',
    message: 'Too many messages sent. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for listing/reading conversations
 * 100 requests per hour
 */
export const readConversationsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100,
  message: {
    error: 'TOO_MANY_REQUESTS',
    message: 'Too many requests. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for reporting conversations
 * 10 reports per day per user
 */
export const reportConversationLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 10,
  message: {
    error: 'TOO_MANY_REPORTS',
    message: 'You have reached the daily limit for reports. Please try again tomorrow.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for quick reply template CRUD
 * 20 operations per hour
 */
export const quickReplyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: {
    error: 'TOO_MANY_REQUESTS',
    message: 'Too many template operations. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for business inbox access
 * 100 requests per hour
 */
export const businessInboxLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100,
  message: {
    error: 'TOO_MANY_REQUESTS',
    message: 'Too many inbox requests. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
