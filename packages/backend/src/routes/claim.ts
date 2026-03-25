/**
 * Business Claim Routes
 * RESTful API endpoints for business claim verification
 * Spec §13.1: Business Claim & Verification
 */

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { claimService } from '../services/claim-service.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth-middleware.js';
import { requireRole } from '../middleware/rbac-middleware.js';
import { rateLimit } from 'express-rate-limit';
import { sendSuccess, sendError } from '../utils/api-response.js';
import { logger } from '../utils/logger.js';
import {
  claimInitiateSchema,
  verifyPhonePINSchema,
  claimAppealSchema,
  claimRejectSchema,
  claimApproveSchema,
} from '@community-hub/shared';

const router: ReturnType<typeof Router> = Router();

// ─── Rate Limiters ──────────────────────────────────────────────

/**
 * Rate limiter for claim initiation
 * 3 claims per hour per user
 */
const claimInitiateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many claim requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip || 'anonymous',
});

/**
 * Rate limiter for PIN verification
 * 10 attempts per 15 minutes per user
 */
const pinVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: 'Too many verification attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip || 'anonymous',
});

/**
 * Rate limiter for claim status checks
 * 60 per minute per user
 */
const claimStatusLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip || 'anonymous',
});

// ─── Helper Functions ──────────────────────────────────────────────

function getAuditContext(req: Request) {
  return {
    actorId: req.user?.id || 'anonymous',
    actorRole: req.user?.role || 'USER',
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  };
}

// ─── Public Routes ──────────────────────────────────────────────

/**
 * GET /businesses/:businessId/claim-status
 * Check claim status for a business (public - limited info without auth)
 */
router.get(
  '/businesses/:businessId/claim-status',
  claimStatusLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const businessId = req.params.businessId as string;
      const userId = req.user?.id;

      if (!userId) {
        // Public: Only show if business is claimed
        const business = await claimService.getClaimStatus(businessId, '');
        sendSuccess(res, {
          businessId,
          canClaim: !business.hasClaim,
        });
        return;
      }

      const status = await claimService.getClaimStatus(businessId, userId);
      sendSuccess(res, status);
    } catch (error) {
      next(error);
    }
  }
);

// ─── Protected Routes ──────────────────────────────────────────────

/**
 * POST /businesses/:businessId/claim
 * Initiate a claim for a business
 */
router.post(
  '/businesses/:businessId/claim',
  requireAuth,
  claimInitiateLimiter,
  validate({ body: claimInitiateSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const businessId = req.params.businessId as string;
      const userId = req.user!.id;
      const auditContext = getAuditContext(req);

      const result = await claimService.initiateClaim(
        {
          businessId,
          ...req.body,
        },
        userId,
        auditContext
      );

      logger.info({ businessId, userId }, 'Claim initiated');
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /claims/:claimId/verify-pin
 * Verify phone PIN for a claim
 */
router.post(
  '/claims/:claimId/verify-pin',
  requireAuth,
  pinVerifyLimiter,
  validate({ body: verifyPhonePINSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const claimId = req.params.claimId as string;
      const { pin } = req.body;
      const userId = req.user!.id;
      const auditContext = getAuditContext(req);

      const result = await claimService.verifyPhonePIN(claimId, pin, userId, auditContext);

      logger.info({ claimId }, 'Phone PIN verified');
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /claims/:claimId/verify-email
 * Verify email token (from email link)
 */
router.get(
  '/claims/verify-email',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.query;

      if (!token || typeof token !== 'string') {
        sendError(res, 'TOKEN_REQUIRED', 'Verification token is required', 400);
        return;
      }

      const auditContext = getAuditContext(req);
      const result = await claimService.verifyEmailToken(token, auditContext);

      // For email verification, redirect to success page
      // In production, this would redirect to frontend with success message
      logger.info({ claimId: result.claimRequestId }, 'Email verified');
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /claims/:claimId/resend-pin
 * Request a new PIN for phone verification
 */
router.post(
  '/claims/:claimId/resend-pin',
  requireAuth,
  claimInitiateLimiter, // Same rate limit as initiation
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const claimId = req.params.claimId as string;
      const userId = req.user!.id;
      const auditContext = getAuditContext(req);

      const result = await claimService.resendPhonePIN(claimId, userId, auditContext);

      logger.info({ claimId }, 'PIN resent');
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /claims/:claimId/appeal
 * Appeal a rejected claim
 */
router.post(
  '/claims/:claimId/appeal',
  requireAuth,
  validate({ body: claimAppealSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const claimId = req.params.claimId as string;
      const { reason } = req.body;
      const userId = req.user!.id;
      const auditContext = getAuditContext(req);

      const result = await claimService.appealClaim(claimId, userId, reason, auditContext);

      logger.info({ claimId }, 'Appeal submitted');
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
);

// ─── Moderator Routes ──────────────────────────────────────────────

/**
 * GET /claims/pending
 * Get pending claims for moderation (document verification)
 */
router.get(
  '/claims/pending',
  requireAuth,
  requireRole(['MODERATOR', 'CURATOR', 'ADMIN', 'SUPER_ADMIN']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

      const result = await claimService.getPendingClaims({ page, limit });

      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /claims/:claimId/approve
 * Approve a claim (moderator action)
 */
router.post(
  '/claims/:claimId/approve',
  requireAuth,
  requireRole(['MODERATOR', 'CURATOR', 'ADMIN', 'SUPER_ADMIN']),
  validate({ body: claimApproveSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const claimId = req.params.claimId as string;
      const { notes } = req.body;
      const moderatorId = req.user!.id;
      const auditContext = getAuditContext(req);

      const result = await claimService.approveClaim(claimId, moderatorId, auditContext, notes);

      logger.info({ claimId, moderatorId }, 'Claim approved');
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /claims/:claimId/reject
 * Reject a claim (moderator action)
 */
router.post(
  '/claims/:claimId/reject',
  requireAuth,
  requireRole(['MODERATOR', 'CURATOR', 'ADMIN', 'SUPER_ADMIN']),
  validate({ body: claimRejectSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const claimId = req.params.claimId as string;
      const { reason } = req.body;
      const moderatorId = req.user!.id;
      const auditContext = getAuditContext(req);

      const result = await claimService.rejectClaim(claimId, moderatorId, reason, auditContext);

      logger.info({ claimId, moderatorId }, 'Claim rejected');
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
