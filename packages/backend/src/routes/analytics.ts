/**
 * Business Analytics Routes
 * RESTful API endpoints for business analytics
 * Spec §13.4: Business Analytics
 */

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/analytics-service.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, optionalAuth } from '../middleware/auth-middleware.js';
import { requireBusinessOwnership, attachBusiness } from '../middleware/business-ownership.js';
import { rateLimit } from 'express-rate-limit';
import { sendSuccess, sendError } from '../utils/api-response.js';
import { logger } from '../utils/logger.js';
import {
  analyticsQuerySchema,
  analyticsExportSchema,
  trackEventSchema,
  inboxAnalyticsQuerySchema,
} from '@community-hub/shared';

const router: ReturnType<typeof Router> = Router();

// ─── Rate Limiters ──────────────────────────────────────────────

/**
 * Rate limiter for analytics queries
 * 60 per minute per user
 */
const analyticsQueryLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip || 'anonymous',
});

/**
 * Rate limiter for analytics exports
 * 10 per hour per user
 */
const analyticsExportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Export limit reached. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip || 'anonymous',
});

/**
 * Rate limiter for event tracking
 * 100 per minute per IP
 */
const trackEventLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || 'anonymous',
});

// ─── Owner/Admin Routes ──────────────────────────────────────────────

/**
 * GET /businesses/:businessId/analytics
 * Get business analytics for date range
 */
router.get(
  '/businesses/:businessId/analytics',
  requireAuth,
  requireBusinessOwnership,
  analyticsQueryLimiter,
  validate({ query: analyticsQuerySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const businessId = req.params.businessId as string;
      const { startDate, endDate, granularity } = req.query;

      const analytics = await analyticsService.getAnalytics(businessId, {
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
        granularity: granularity as 'day' | 'week' | 'month' | undefined,
      });

      sendSuccess(res, analytics);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /businesses/:businessId/analytics/export
 * Export business analytics as CSV or PDF
 */
router.get(
  '/businesses/:businessId/analytics/export',
  requireAuth,
  requireBusinessOwnership,
  analyticsExportLimiter,
  validate({ query: analyticsExportSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const businessId = req.params.businessId as string;
      const { startDate, endDate, format } = req.query;

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      if (format === 'pdf') {
        // TODO: Implement PDF export
        sendError(res, 'NOT_IMPLEMENTED', 'PDF export is not yet available', 501);
        return;
      }

      // CSV export
      const csv = await analyticsService.exportCSV(businessId, start, end);

      // Set headers for file download
      const filename = `analytics-${businessId}-${startDate}-${endDate}.csv`;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      logger.info(
        { userId: req.user?.id, businessId, format, startDate, endDate },
        'Analytics export'
      );

      res.send(csv);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /businesses/:businessId/inbox/analytics
 * Get messaging analytics for business
 */
router.get(
  '/businesses/:businessId/inbox/analytics',
  requireAuth,
  requireBusinessOwnership,
  analyticsQueryLimiter,
  validate({ query: inboxAnalyticsQuerySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const businessId = req.params.businessId as string;
      const { period } = req.query;

      // TODO: Implement inbox analytics when messaging is available
      // For now, return placeholder data
      sendSuccess(res, {
        businessId,
        period: period || 'last_30_days',
        unreadCount: 0,
        totalConversations: 0,
        messageCount: 0,
        averageResponseTime: 0,
        responseRate: 0,
        conversionRate: 0,
        topInquiryTypes: [],
      });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Event Tracking Routes (Internal/Public) ──────────────────────────

/**
 * POST /analytics/track
 * Track an analytics event
 * Can be called with or without authentication
 */
router.post(
  '/analytics/track/:businessId',
  optionalAuth,
  trackEventLimiter,
  attachBusiness,
  validate({ body: trackEventSchema }),
  async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const businessId = req.params.businessId as string;
      const { eventType, referralSource, searchTerm, metadata } = req.body;

      await analyticsService.trackEvent({
        businessId,
        eventType,
        userId: req.user?.id,
        referralSource,
        searchTerm,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        metadata,
      });

      // Return 202 Accepted (fire and forget)
      res.status(202).json({ success: true });
    } catch (error) {
      // Don't fail the request if tracking fails
      logger.error({ error }, 'Failed to track analytics event');
      res.status(202).json({ success: true });
    }
  }
);

/**
 * POST /analytics/profile-view/:businessId
 * Track a profile view (with deduplication)
 */
router.post(
  '/analytics/profile-view/:businessId',
  optionalAuth,
  trackEventLimiter,
  attachBusiness,
  async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const businessId = req.params.businessId as string;
      const { referralSource, searchTerm } = req.body;

      // Generate session ID from cookies or create one
      const sessionId = req.cookies?.sessionId || undefined;

      await analyticsService.trackProfileView(
        businessId,
        req.user?.id,
        sessionId,
        referralSource,
        searchTerm,
        req.ip,
        req.headers['user-agent']
      );

      res.status(202).json({ success: true });
    } catch (error) {
      logger.error({ error }, 'Failed to track profile view');
      res.status(202).json({ success: true });
    }
  }
);

export default router;
