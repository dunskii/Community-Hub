import rateLimit from 'express-rate-limit';

/**
 * Event Rate Limiters
 * Phase 8: Events & Calendar System
 */

/**
 * Rate limiter for event creation
 * 5 events per minute per user
 */
export const createEventLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: {
    error: 'TOO_MANY_REQUESTS',
    message: 'Too many events created. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for RSVP actions
 * 20 RSVPs per minute per user
 */
export const rsvpLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: {
    error: 'TOO_MANY_REQUESTS',
    message: 'Too many RSVP actions. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for listing events
 * 30 requests per minute (global search)
 */
export const listEventsLimiter = rateLimit({
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
 * Rate limiter for getting event details
 * 60 requests per minute per event
 */
export const getEventLimiter = rateLimit({
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
 * Rate limiter for ICS export
 * 20 exports per minute
 */
export const exportICSLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: {
    error: 'TOO_MANY_REQUESTS',
    message: 'Too many export requests. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for event updates
 * 10 updates per minute per user
 */
export const updateEventLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: {
    error: 'TOO_MANY_REQUESTS',
    message: 'Too many update requests. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
