/**
 * Enquiry Routes
 * Public endpoint for business enquiries (no auth required)
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { enquiryService } from '../services/enquiry-service.js';
import { sendSuccess, sendError } from '../utils/api-response.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, optionalAuth } from '../middleware/auth-middleware.js';
import { requireBusinessOwnership } from '../middleware/business-ownership.js';
import { logger } from '../utils/logger.js';
import rateLimit from 'express-rate-limit';

const router: ReturnType<typeof Router> = Router();

// Rate limit: 5 enquiries per hour per IP
const enquiryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'RATE_LIMIT', message: 'Too many enquiries. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const ENQUIRY_CATEGORIES = ['GENERAL', 'PRODUCT_QUESTION', 'BOOKING', 'FEEDBACK', 'OTHER'] as const;

const createEnquirySchema = z.object({
  businessId: z.string().uuid('Invalid business ID'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().max(20).optional(),
  category: z.enum(ENQUIRY_CATEGORIES).default('GENERAL'),
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(200),
  message: z.string().min(10, 'Message must be at least 10 characters').max(1000),
});

/**
 * POST /enquiries
 * Create a public business enquiry (no auth required)
 */
router.post(
  '/enquiries',
  optionalAuth,
  enquiryLimiter,
  validate({ body: createEnquirySchema }),
  async (req: Request, res: Response) => {
    try {
      const enquiry = await enquiryService.createEnquiry(
        req.body,
        req.ip || req.socket.remoteAddress,
        req.user?.id, // optional — set if user happens to be logged in
      );

      sendSuccess(res, { enquiry }, 201);
    } catch (error) {
      logger.error({ error }, 'Create enquiry error');
      if (error instanceof Error && 'statusCode' in error) {
        const apiErr = error as Error & { statusCode: number; code: string };
        sendError(res, apiErr.code, apiErr.message, apiErr.statusCode);
      } else {
        sendError(res, 'ENQUIRY_FAILED', 'Failed to send enquiry', 500);
      }
    }
  }
);

/**
 * GET /businesses/:businessId/enquiries
 * Get enquiries for a business (owner only)
 */
router.get(
  '/businesses/:businessId/enquiries',
  requireAuth,
  requireBusinessOwnership,
  async (req: Request, res: Response) => {
    try {
      const { businessId } = req.params;
      const page = Number(req.query.page) || 1;
      const limit = Math.min(Number(req.query.limit) || 20, 50);
      const status = req.query.status as string | undefined;

      const result = await enquiryService.getBusinessEnquiries(
        businessId as string,
        { status, page, limit }
      );

      sendSuccess(res, result);
    } catch (error) {
      logger.error({ error }, 'Get business enquiries error');
      sendError(res, 'ENQUIRIES_FETCH_FAILED', 'Failed to fetch enquiries', 500);
    }
  }
);

/**
 * PATCH /businesses/:businessId/enquiries/:enquiryId/status
 * Update enquiry status (owner only)
 */
router.patch(
  '/businesses/:businessId/enquiries/:enquiryId/status',
  requireAuth,
  requireBusinessOwnership,
  validate({ body: z.object({ status: z.enum(['NEW', 'READ', 'REPLIED', 'ARCHIVED']) }) }),
  async (req: Request, res: Response) => {
    try {
      const enquiry = await enquiryService.updateEnquiryStatus(
        req.params.enquiryId as string,
        req.body.status
      );
      sendSuccess(res, { enquiry });
    } catch (error) {
      logger.error({ error }, 'Update enquiry status error');
      sendError(res, 'ENQUIRY_UPDATE_FAILED', 'Failed to update enquiry', 500);
    }
  }
);

/**
 * POST /businesses/:businessId/enquiries/:enquiryId/reply
 * Reply to an enquiry (owner only)
 */
router.post(
  '/businesses/:businessId/enquiries/:enquiryId/reply',
  requireAuth,
  requireBusinessOwnership,
  validate({ body: z.object({ message: z.string().min(1).max(2000) }) }),
  async (req: Request, res: Response) => {
    try {
      const enquiry = await enquiryService.replyToEnquiry(
        req.params.enquiryId as string,
        req.body.message
      );
      sendSuccess(res, { enquiry });
    } catch (error) {
      logger.error({ error }, 'Reply to enquiry error');
      sendError(res, 'ENQUIRY_REPLY_FAILED', 'Failed to reply to enquiry', 500);
    }
  }
);

/**
 * POST /businesses/:businessId/enquiries/:enquiryId/call
 * Record a click-to-call action (owner only)
 */
router.post(
  '/businesses/:businessId/enquiries/:enquiryId/call',
  requireAuth,
  requireBusinessOwnership,
  async (req: Request, res: Response) => {
    try {
      const enquiry = await enquiryService.recordCallClick(
        req.params.enquiryId as string,
      );
      sendSuccess(res, { enquiry });
    } catch (error) {
      logger.error({ error }, 'Record call click error');
      sendError(res, 'CALL_RECORD_FAILED', 'Failed to record call', 500);
    }
  }
);

export { router as enquiryRouter };
