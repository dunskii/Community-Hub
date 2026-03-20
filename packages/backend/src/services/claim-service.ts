/**
 * Claim Service
 *
 * Handles business claim verification including phone, email, document, and Google Business verification.
 * Spec §13.1: Business Claim & Verification
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../db/index.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/api-error.js';
import { getPlatformConfig } from '../config/platform-loader.js';
// Redis will be used for SMS rate limiting in future
// import { getRedis } from '../cache/redis-client.js';
import {
  VerificationMethod,
  ClaimVerificationStatus,
  ClaimStatus,
} from '../generated/prisma/index.js';

// ─── Types ──────────────────────────────────────────────────

export interface ClaimInitiateInput {
  businessId: string;
  verificationMethod: VerificationMethod;
  phoneNumber?: string; // For PHONE verification
  businessEmail?: string; // For EMAIL verification
  documentType?: string; // For DOCUMENT verification: 'abn' | 'utility_bill' | 'business_registration'
  documentUrls?: string[]; // For DOCUMENT verification
  googleAuthCode?: string; // For GOOGLE_BUSINESS verification
}

export interface ClaimResult {
  claimRequestId: string;
  verificationStatus: ClaimVerificationStatus;
  claimStatus: ClaimStatus;
  verificationMethod: VerificationMethod;
  message: string;
  // Phone-specific
  pinExpiresAt?: Date;
  // Email-specific
  tokenExpiresAt?: Date;
  // Document-specific
  moderationEstimate?: string;
}

export interface AuditContext {
  actorId: string;
  actorRole: string;
  ipAddress?: string;
  userAgent?: string;
}

// ─── Constants ──────────────────────────────────────────────

const PIN_LENGTH = 6;
const PIN_EXPIRY_MINUTES = 10;
const EMAIL_TOKEN_EXPIRY_HOURS = 24;
const MAX_PIN_ATTEMPTS = 3;
const LOCKOUT_MINUTES = 60;
const DOCUMENT_REVIEW_DAYS = 5;
const CLAIM_APPEAL_WINDOW_DAYS = 30;
const CLAIM_RESUBMIT_WAIT_DAYS = 30;

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET or SESSION_SECRET must be set');
}

// ─── Helper Functions ───────────────────────────────────────

/**
 * Generate a random numeric PIN
 */
function generatePIN(length: number = PIN_LENGTH): string {
  let pin = '';
  for (let i = 0; i < length; i++) {
    pin += crypto.randomInt(0, 10).toString();
  }
  return pin;
}

/**
 * Hash a PIN using bcrypt
 */
async function hashPIN(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

/**
 * Verify a PIN against its hash
 */
async function verifyPIN(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

/**
 * Generate email verification token (JWT)
 */
function generateEmailVerificationToken(
  claimId: string,
  businessId: string,
  userId: string,
  email: string
): string {
  const payload = {
    type: 'claim_verification',
    claimId,
    businessId,
    userId,
    email,
    jti: crypto.randomBytes(16).toString('hex'),
  };

  return jwt.sign(payload, JWT_SECRET as string, {
    expiresIn: `${EMAIL_TOKEN_EXPIRY_HOURS}h`,
  });
}

/**
 * Verify email verification token
 */
function verifyEmailVerificationToken(token: string): {
  claimId: string;
  businessId: string;
  userId: string;
  email: string;
} | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET as string) as {
      type: string;
      claimId: string;
      businessId: string;
      userId: string;
      email: string;
    };

    if (payload.type !== 'claim_verification') {
      return null;
    }

    return {
      claimId: payload.claimId,
      businessId: payload.businessId,
      userId: payload.userId,
      email: payload.email,
    };
  } catch {
    return null;
  }
}

// Redis client for future use (rate limiting, caching)
// Currently not used but will be needed for SMS rate limiting
// const getRedisClient = () => { try { return getRedis(); } catch { return null; } };

// ─── Claim Service Class ────────────────────────────────────

export class ClaimService {
  /**
   * Initiate a business claim request
   */
  async initiateClaim(
    data: ClaimInitiateInput,
    userId: string,
    auditContext: AuditContext
  ): Promise<ClaimResult> {
    const config = getPlatformConfig();

    // Check if business directory feature is enabled (claiming requires business directory)
    if (!config.features?.businessDirectory) {
      throw ApiError.forbidden('FEATURE_DISABLED', 'Business claiming is not enabled');
    }

    // Get business
    const business = await prisma.businesses.findUnique({
      where: { id: data.businessId },
      select: {
        id: true,
        name: true,
        claimed: true,
        claimed_by: true,
        email: true,
        website: true,
      },
    });

    if (!business) {
      throw ApiError.notFound('BUSINESS_NOT_FOUND', 'Business not found');
    }

    // Check if business is already claimed
    if (business.claimed) {
      throw ApiError.conflict('BUSINESS_ALREADY_CLAIMED', 'This business has already been claimed');
    }

    // Check for existing pending claim by this user
    const existingClaim = await prisma.business_claim_requests.findUnique({
      where: {
        business_id_user_id: {
          business_id: data.businessId,
          user_id: userId,
        },
      },
    });

    if (existingClaim) {
      // Check if user can resubmit
      if (existingClaim.claim_status === 'REJECTED') {
        const resubmitAfter = new Date(existingClaim.decision_at || existingClaim.created_at);
        resubmitAfter.setDate(resubmitAfter.getDate() + CLAIM_RESUBMIT_WAIT_DAYS);

        if (new Date() < resubmitAfter) {
          throw ApiError.conflict(
            'CLAIM_RESUBMIT_TOO_SOON',
            `You can resubmit a claim after ${resubmitAfter.toISOString().split('T')[0]}`
          );
        }

        // Delete old rejected claim to allow resubmission
        await prisma.business_claim_requests.delete({
          where: { id: existingClaim.id },
        });
      } else if (existingClaim.claim_status === 'PENDING') {
        throw ApiError.conflict('CLAIM_ALREADY_PENDING', 'You already have a pending claim for this business');
      } else if (existingClaim.claim_status === 'APPROVED') {
        throw ApiError.conflict('CLAIM_ALREADY_APPROVED', 'Your claim for this business has already been approved');
      }
    }

    // Create claim based on verification method
    switch (data.verificationMethod) {
      case 'PHONE':
        return this.initiatePhoneVerification(data, userId, auditContext);
      case 'EMAIL':
        return this.initiateEmailVerification(data, userId, business, auditContext);
      case 'DOCUMENT':
        return this.initiateDocumentVerification(data, userId, auditContext);
      case 'GOOGLE_BUSINESS':
        return this.initiateGoogleBusinessVerification(data, userId, auditContext);
      default:
        throw ApiError.badRequest('INVALID_VERIFICATION_METHOD', 'Invalid verification method');
    }
  }

  /**
   * Initiate phone PIN verification
   */
  private async initiatePhoneVerification(
    data: ClaimInitiateInput,
    userId: string,
    auditContext: AuditContext
  ): Promise<ClaimResult> {
    if (!data.phoneNumber) {
      throw ApiError.badRequest('PHONE_REQUIRED', 'Phone number is required for phone verification');
    }

    // Validate phone format (E.164)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(data.phoneNumber)) {
      throw ApiError.badRequest('INVALID_PHONE', 'Phone number must be in E.164 format (e.g., +61412345678)');
    }

    // Generate PIN
    const pin = generatePIN();
    const hashedPIN = await hashPIN(pin);
    const expiresAt = new Date(Date.now() + PIN_EXPIRY_MINUTES * 60 * 1000);

    // Create claim request
    const claim = await prisma.business_claim_requests.create({
      data: {
        id: crypto.randomUUID(),
        business_id: data.businessId,
        user_id: userId,
        verification_method: 'PHONE',
        verification_status: 'PENDING',
        claim_status: 'PENDING',
        verification_code: hashedPIN,
        verification_expires_at: expiresAt,
        ip_address: auditContext.ipAddress,
        user_agent: auditContext.userAgent,
        updated_at: new Date(),
      },
    });

    // Log audit
    await this.logAudit(
      auditContext,
      'CLAIM_INITIATED',
      'BusinessClaimRequest',
      claim.id,
      null,
      { method: 'PHONE', phoneNumber: data.phoneNumber.slice(-4) }
    );

    // TODO: Send SMS via Twilio (Phase 7.2)
    // For now, log the PIN for development only
    if (process.env.NODE_ENV === 'development') {
      logger.info(`[CLAIM] Phone verification PIN for claim ${claim.id}: ${pin}`);
    }

    return {
      claimRequestId: claim.id,
      verificationStatus: 'PENDING',
      claimStatus: 'PENDING',
      verificationMethod: 'PHONE',
      pinExpiresAt: expiresAt,
      message: `A verification PIN has been sent to your phone ending in ${data.phoneNumber.slice(-4)}. Enter it within ${PIN_EXPIRY_MINUTES} minutes.`,
    };
  }

  /**
   * Initiate email verification
   */
  private async initiateEmailVerification(
    data: ClaimInitiateInput,
    userId: string,
    business: { id: string; email: string | null; website: string | null },
    auditContext: AuditContext
  ): Promise<ClaimResult> {
    if (!data.businessEmail) {
      throw ApiError.badRequest('EMAIL_REQUIRED', 'Business email is required for email verification');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.businessEmail)) {
      throw ApiError.badRequest('INVALID_EMAIL', 'Invalid email address format');
    }

    // Optionally validate that email domain matches business website
    // (Relaxed for now - can be stricter in production)
    if (business.website) {
      try {
        const websiteDomain = new URL(business.website).hostname.replace('www.', '');
        const emailDomain = data.businessEmail.split('@')[1];

        if (emailDomain !== websiteDomain) {
          logger.warn(`[CLAIM] Email domain ${emailDomain} does not match website ${websiteDomain}`);
          // Don't block, but log warning - could enforce in production
        }
      } catch {
        // Invalid website URL, skip domain check
      }
    }

    const expiresAt = new Date(Date.now() + EMAIL_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    // Create claim request first to get ID
    const claim = await prisma.business_claim_requests.create({
      data: {
        id: crypto.randomUUID(),
        business_id: data.businessId,
        user_id: userId,
        verification_method: 'EMAIL',
        verification_status: 'PENDING',
        claim_status: 'PENDING',
        token_expires_at: expiresAt,
        ip_address: auditContext.ipAddress,
        user_agent: auditContext.userAgent,
        updated_at: new Date(),
      },
    });

    // Generate token with claim ID
    const token = generateEmailVerificationToken(claim.id, data.businessId, userId, data.businessEmail);

    // Update claim with token
    await prisma.business_claim_requests.update({
      where: { id: claim.id },
      data: { verification_token: token },
    });

    // Log audit
    await this.logAudit(
      auditContext,
      'CLAIM_INITIATED',
      'BusinessClaimRequest',
      claim.id,
      null,
      { method: 'EMAIL', email: data.businessEmail.replace(/(.{2}).*@/, '$1***@') }
    );

    // TODO: Send verification email via Mailgun
    // For now, log the token for development only
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-claim?token=${token}`;
    if (process.env.NODE_ENV === 'development') {
      logger.info(`[CLAIM] Email verification link for claim ${claim.id}: ${verifyUrl}`);
    }

    return {
      claimRequestId: claim.id,
      verificationStatus: 'PENDING',
      claimStatus: 'PENDING',
      verificationMethod: 'EMAIL',
      tokenExpiresAt: expiresAt,
      message: `A verification link has been sent to ${data.businessEmail}. Click it within ${EMAIL_TOKEN_EXPIRY_HOURS} hours to verify your claim.`,
    };
  }

  /**
   * Initiate document verification (requires moderator review)
   */
  private async initiateDocumentVerification(
    data: ClaimInitiateInput,
    userId: string,
    auditContext: AuditContext
  ): Promise<ClaimResult> {
    if (!data.documentType) {
      throw ApiError.badRequest('DOCUMENT_TYPE_REQUIRED', 'Document type is required');
    }

    const validDocTypes = ['abn', 'utility_bill', 'business_registration'];
    if (!validDocTypes.includes(data.documentType)) {
      throw ApiError.badRequest('INVALID_DOCUMENT_TYPE', `Document type must be one of: ${validDocTypes.join(', ')}`);
    }

    if (!data.documentUrls || data.documentUrls.length === 0) {
      throw ApiError.badRequest('DOCUMENTS_REQUIRED', 'At least one document is required');
    }

    if (data.documentUrls.length > 3) {
      throw ApiError.badRequest('TOO_MANY_DOCUMENTS', 'Maximum 3 documents allowed');
    }

    // Create claim request
    const claim = await prisma.business_claim_requests.create({
      data: {
        id: crypto.randomUUID(),
        business_id: data.businessId,
        user_id: userId,
        verification_method: 'DOCUMENT',
        verification_status: 'PENDING',
        claim_status: 'PENDING',
        document_type: data.documentType,
        document_urls: data.documentUrls,
        ip_address: auditContext.ipAddress,
        user_agent: auditContext.userAgent,
        updated_at: new Date(),
      },
    });

    // Log audit
    await this.logAudit(
      auditContext,
      'CLAIM_INITIATED',
      'BusinessClaimRequest',
      claim.id,
      null,
      { method: 'DOCUMENT', documentType: data.documentType, documentCount: data.documentUrls.length }
    );

    return {
      claimRequestId: claim.id,
      verificationStatus: 'PENDING',
      claimStatus: 'PENDING',
      verificationMethod: 'DOCUMENT',
      moderationEstimate: `${DOCUMENT_REVIEW_DAYS} business days`,
      message: `Your documents have been submitted for review. You will receive a decision within ${DOCUMENT_REVIEW_DAYS} business days.`,
    };
  }

  /**
   * Initiate Google Business Profile verification
   */
  private async initiateGoogleBusinessVerification(
    _data: ClaimInitiateInput,
    _userId: string,
    _auditContext: AuditContext
  ): Promise<ClaimResult> {
    // TODO: Implement Google Business Profile OAuth flow
    // This requires Google My Business API integration
    throw ApiError.badRequest(
      'GOOGLE_VERIFICATION_NOT_IMPLEMENTED',
      'Google Business verification is not yet available'
    );
  }

  /**
   * Verify phone PIN
   */
  async verifyPhonePIN(
    claimId: string,
    pin: string,
    userId: string,
    auditContext: AuditContext
  ): Promise<ClaimResult> {
    const claim = await prisma.business_claim_requests.findUnique({
      where: { id: claimId },
      include: {
        businesses: {
          select: { id: true, name: true },
        },
      },
    });

    if (!claim) {
      throw ApiError.notFound('CLAIM_NOT_FOUND', 'Claim request not found');
    }

    // Verify ownership
    if (claim.user_id !== userId) {
      throw ApiError.forbidden('NOT_CLAIM_OWNER', 'You are not authorized to verify this claim');
    }

    // Check method
    if (claim.verification_method !== 'PHONE') {
      throw ApiError.badRequest('INVALID_VERIFICATION_METHOD', 'This claim uses a different verification method');
    }

    // Check if already verified
    if (claim.verification_status === 'VERIFIED') {
      throw ApiError.conflict('ALREADY_VERIFIED', 'This claim has already been verified');
    }

    // Check if expired
    if (claim.verification_expires_at && new Date() > claim.verification_expires_at) {
      await prisma.business_claim_requests.update({
        where: { id: claimId },
        data: { verification_status: 'EXPIRED' },
      });
      throw ApiError.badRequest('PIN_EXPIRED', 'Verification PIN has expired. Please request a new one.');
    }

    // Check lockout
    if (claim.verification_attempts >= MAX_PIN_ATTEMPTS) {
      throw ApiError.rateLimited(
        `Too many failed attempts. Please wait ${LOCKOUT_MINUTES} minutes before trying again.`
      );
    }

    // Verify PIN
    if (!claim.verification_code) {
      throw ApiError.internal('Verification code not found');
    }

    const isValid = await verifyPIN(pin, claim.verification_code);

    if (!isValid) {
      // Increment attempts
      await prisma.business_claim_requests.update({
        where: { id: claimId },
        data: { verification_attempts: claim.verification_attempts + 1 },
      });

      const attemptsRemaining = MAX_PIN_ATTEMPTS - claim.verification_attempts - 1;

      if (attemptsRemaining <= 0) {
        await prisma.business_claim_requests.update({
          where: { id: claimId },
          data: { verification_status: 'FAILED' },
        });
        throw ApiError.rateLimited(
          'Maximum attempts exceeded. Please request a new verification.'
        );
      }

      throw ApiError.badRequest(
        'INVALID_PIN',
        `Invalid PIN. ${attemptsRemaining} attempt${attemptsRemaining === 1 ? '' : 's'} remaining.`
      );
    }

    // PIN is valid - approve claim
    return this.approveClaim(claim.id, userId, auditContext, 'Phone verification successful');
  }

  /**
   * Verify email token
   */
  async verifyEmailToken(token: string, auditContext: AuditContext): Promise<ClaimResult> {
    const payload = verifyEmailVerificationToken(token);

    if (!payload) {
      throw ApiError.badRequest('INVALID_TOKEN', 'Invalid or expired verification token');
    }

    const claim = await prisma.business_claim_requests.findUnique({
      where: { id: payload.claimId },
    });

    if (!claim) {
      throw ApiError.notFound('CLAIM_NOT_FOUND', 'Claim request not found');
    }

    // Verify token matches
    if (claim.verification_token !== token) {
      throw ApiError.badRequest('TOKEN_MISMATCH', 'Token does not match claim');
    }

    // Check if already verified
    if (claim.verification_status === 'VERIFIED') {
      throw ApiError.conflict('ALREADY_VERIFIED', 'This claim has already been verified');
    }

    // Check if token expired
    if (claim.token_expires_at && new Date() > claim.token_expires_at) {
      await prisma.business_claim_requests.update({
        where: { id: claim.id },
        data: { verification_status: 'EXPIRED' },
      });
      throw ApiError.badRequest('TOKEN_EXPIRED', 'Verification token has expired. Please request a new one.');
    }

    // Email verified - approve claim
    return this.approveClaim(claim.id, claim.user_id, auditContext, 'Email verification successful');
  }

  /**
   * Approve a claim (internal - used after verification or by moderator)
   */
  async approveClaim(
    claimId: string,
    approvedBy: string,
    auditContext: AuditContext,
    notes?: string
  ): Promise<ClaimResult> {
    const claim = await prisma.business_claim_requests.findUnique({
      where: { id: claimId },
      include: {
        businesses: true,
        users_business_claim_requests_user_idTousers: true,
      },
    });

    if (!claim) {
      throw ApiError.notFound('CLAIM_NOT_FOUND', 'Claim request not found');
    }

    // Update claim status
    await prisma.business_claim_requests.update({
      where: { id: claimId },
      data: {
        verification_status: 'VERIFIED',
        claim_status: 'APPROVED',
        moderator_id: approvedBy !== claim.user_id ? approvedBy : null,
        moderator_notes: notes,
        decision_at: new Date(),
        updated_at: new Date(),
      },
    });

    // Update business ownership
    await prisma.businesses.update({
      where: { id: claim.business_id },
      data: {
        claimed: true,
        claimed_by: claim.user_id,
        verified_at: new Date(),
      },
    });

    // Upgrade user role if needed
    if (claim.users_business_claim_requests_user_idTousers.role === 'COMMUNITY') {
      await prisma.users.update({
        where: { id: claim.user_id },
        data: { role: 'BUSINESS_OWNER' },
      });
    }

    // Log audit
    await this.logAudit(
      auditContext,
      'CLAIM_APPROVED',
      'BusinessClaimRequest',
      claimId,
      { claimStatus: 'PENDING' },
      { claimStatus: 'APPROVED', businessId: claim.business_id }
    );

    // TODO: Send approval notification email

    // Re-fetch the claim with businesses for the message
    const updatedClaim = await prisma.business_claim_requests.findUnique({
      where: { id: claimId },
      include: { businesses: true },
    });

    return {
      claimRequestId: claim.id,
      verificationStatus: 'VERIFIED',
      claimStatus: 'APPROVED',
      verificationMethod: claim.verification_method,
      message: `Congratulations! Your claim for "${updatedClaim?.businesses.name}" has been approved. You can now manage your business profile.`,
    };
  }

  /**
   * Reject a claim (moderator action for document verification)
   */
  async rejectClaim(
    claimId: string,
    moderatorId: string,
    reason: string,
    auditContext: AuditContext
  ): Promise<ClaimResult> {
    const claim = await prisma.business_claim_requests.findUnique({
      where: { id: claimId },
      include: {
        businesses: true,
      },
    });

    if (!claim) {
      throw ApiError.notFound('CLAIM_NOT_FOUND', 'Claim request not found');
    }

    if (claim.claim_status !== 'PENDING') {
      throw ApiError.conflict('CLAIM_NOT_PENDING', 'Only pending claims can be rejected');
    }

    // Update claim
    await prisma.business_claim_requests.update({
      where: { id: claimId },
      data: {
        verification_status: 'FAILED',
        claim_status: 'REJECTED',
        moderator_id: moderatorId,
        moderator_notes: reason,
        rejection_reason: reason,
        decision_at: new Date(),
        updated_at: new Date(),
      },
    });

    // Log audit
    await this.logAudit(
      auditContext,
      'CLAIM_REJECTED',
      'BusinessClaimRequest',
      claimId,
      { claimStatus: 'PENDING' },
      { claimStatus: 'REJECTED', reason }
    );

    // TODO: Send rejection notification email with reason

    const appealDeadline = new Date();
    appealDeadline.setDate(appealDeadline.getDate() + CLAIM_APPEAL_WINDOW_DAYS);

    return {
      claimRequestId: claim.id,
      verificationStatus: 'FAILED',
      claimStatus: 'REJECTED',
      verificationMethod: claim.verification_method,
      message: `Your claim for "${claim.businesses.name}" has been rejected. Reason: ${reason}. You may appeal within ${CLAIM_APPEAL_WINDOW_DAYS} days.`,
    };
  }

  /**
   * Appeal a rejected claim
   */
  async appealClaim(
    claimId: string,
    userId: string,
    appealReason: string,
    auditContext: AuditContext
  ): Promise<ClaimResult> {
    const claim = await prisma.business_claim_requests.findUnique({
      where: { id: claimId },
      include: {
        businesses: true,
      },
    });

    if (!claim) {
      throw ApiError.notFound('CLAIM_NOT_FOUND', 'Claim request not found');
    }

    // Verify ownership
    if (claim.user_id !== userId) {
      throw ApiError.forbidden('NOT_CLAIM_OWNER', 'You are not authorized to appeal this claim');
    }

    // Check if claim was rejected
    if (claim.claim_status !== 'REJECTED') {
      throw ApiError.badRequest('CLAIM_NOT_REJECTED', 'Only rejected claims can be appealed');
    }

    // Check appeal window
    if (claim.decision_at) {
      const appealDeadline = new Date(claim.decision_at);
      appealDeadline.setDate(appealDeadline.getDate() + CLAIM_APPEAL_WINDOW_DAYS);

      if (new Date() > appealDeadline) {
        throw ApiError.badRequest('APPEAL_WINDOW_CLOSED', 'The appeal window has closed');
      }
    }

    // Check if already appealed
    if (claim.appealed_at) {
      throw ApiError.conflict('ALREADY_APPEALED', 'This claim has already been appealed');
    }

    // Update claim
    await prisma.business_claim_requests.update({
      where: { id: claimId },
      data: {
        claim_status: 'APPEALED',
        appealed_at: new Date(),
        appeal_reason: appealReason,
        updated_at: new Date(),
      },
    });

    // Log audit
    await this.logAudit(
      auditContext,
      'CLAIM_APPEALED',
      'BusinessClaimRequest',
      claimId,
      { claimStatus: 'REJECTED' },
      { claimStatus: 'APPEALED', appealReason }
    );

    return {
      claimRequestId: claim.id,
      verificationStatus: claim.verification_status,
      claimStatus: 'APPEALED',
      verificationMethod: claim.verification_method,
      message: 'Your appeal has been submitted and will be reviewed by our team.',
    };
  }

  /**
   * Get claim status
   */
  async getClaimStatus(businessId: string, userId: string): Promise<{
    hasClaim: boolean;
    claim?: {
      id: string;
      verificationMethod: VerificationMethod;
      verificationStatus: ClaimVerificationStatus;
      claimStatus: ClaimStatus;
      createdAt: Date;
      rejectionReason?: string | null;
    };
  }> {
    const claim = await prisma.business_claim_requests.findUnique({
      where: {
        business_id_user_id: {
          business_id: businessId,
          user_id: userId,
        },
      },
      select: {
        id: true,
        verification_method: true,
        verification_status: true,
        claim_status: true,
        created_at: true,
        rejection_reason: true,
      },
    });

    if (!claim) {
      return { hasClaim: false };
    }

    return {
      hasClaim: true,
      claim: {
        id: claim.id,
        verificationMethod: claim.verification_method,
        verificationStatus: claim.verification_status,
        claimStatus: claim.claim_status,
        createdAt: claim.created_at,
        rejectionReason: claim.rejection_reason,
      },
    };
  }

  /**
   * Get pending claims for moderation queue
   */
  async getPendingClaims(options: {
    page: number;
    limit: number;
    method?: VerificationMethod;
  }) {
    const { page, limit, method } = options;
    const skip = (page - 1) * limit;

    const where = {
      claim_status: 'PENDING' as ClaimStatus,
      verification_method: method ? method : undefined,
      // Only document claims need moderation
      ...(method === undefined && { verification_method: 'DOCUMENT' as VerificationMethod }),
    };

    const [claims, total] = await Promise.all([
      prisma.business_claim_requests.findMany({
        where,
        include: {
          businesses: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          users_business_claim_requests_user_idTousers: {
            select: {
              id: true,
              display_name: true,
              email: true,
            },
          },
        },
        orderBy: { created_at: 'asc' },
        skip,
        take: limit,
      }),
      prisma.business_claim_requests.count({ where }),
    ]);

    return {
      claims,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Request new verification PIN (resend)
   */
  async resendPhonePIN(
    claimId: string,
    userId: string,
    _auditContext: AuditContext
  ): Promise<ClaimResult> {
    const claim = await prisma.business_claim_requests.findUnique({
      where: { id: claimId },
    });

    if (!claim) {
      throw ApiError.notFound('CLAIM_NOT_FOUND', 'Claim request not found');
    }

    if (claim.user_id !== userId) {
      throw ApiError.forbidden('NOT_CLAIM_OWNER', 'You are not authorized to resend verification');
    }

    if (claim.verification_method !== 'PHONE') {
      throw ApiError.badRequest('INVALID_METHOD', 'This claim does not use phone verification');
    }

    if (claim.claim_status !== 'PENDING') {
      throw ApiError.badRequest('CLAIM_NOT_PENDING', 'Cannot resend PIN for non-pending claims');
    }

    // Generate new PIN
    const pin = generatePIN();
    const hashedPIN = await hashPIN(pin);
    const expiresAt = new Date(Date.now() + PIN_EXPIRY_MINUTES * 60 * 1000);

    await prisma.business_claim_requests.update({
      where: { id: claimId },
      data: {
        verification_code: hashedPIN,
        verification_expires_at: expiresAt,
        verification_attempts: 0,
        verification_status: 'PENDING',
        updated_at: new Date(),
      },
    });

    // TODO: Send SMS via Twilio
    // Log PIN only in development
    if (process.env.NODE_ENV === 'development') {
      logger.info(`[CLAIM] New phone verification PIN for claim ${claimId}: ${pin}`);
    }

    return {
      claimRequestId: claimId,
      verificationStatus: 'PENDING',
      claimStatus: 'PENDING',
      verificationMethod: 'PHONE',
      pinExpiresAt: expiresAt,
      message: `A new verification PIN has been sent. Enter it within ${PIN_EXPIRY_MINUTES} minutes.`,
    };
  }

  /**
   * Log audit trail
   */
  private async logAudit(
    context: AuditContext,
    action: string,
    targetType: string,
    targetId: string,
    previousValue: unknown,
    newValue: unknown
  ): Promise<void> {
    try {
      await prisma.audit_logs.create({
        data: {
          id: crypto.randomUUID(),
          actor_id: context.actorId,
          actor_role: context.actorRole as 'USER' | 'BUSINESS_OWNER' | 'MODERATOR' | 'ADMIN' | 'SYSTEM',
          action,
          target_type: targetType,
          target_id: targetId,
          previous_value: previousValue ? JSON.parse(JSON.stringify(previousValue)) : null,
          new_value: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
          ip_address: context.ipAddress || '',
          user_agent: context.userAgent || '',
        },
      });
    } catch (error) {
      logger.error({ error, action, targetType, targetId }, 'Failed to create audit log');
    }
  }
}

// Export singleton instance
export const claimService = new ClaimService();

/**
 * Get businesses owned by a user (via approved claims)
 *
 * @param userId - User ID
 * @returns Array of owned businesses
 */
export async function getOwnedBusinesses(userId: string) {
  const approvedClaims = await prisma.business_claim_requests.findMany({
    where: {
      user_id: userId,
      claim_status: ClaimStatus.APPROVED,
    },
    include: {
      businesses: {
        include: {
          categories: true,
          _count: {
            select: {
              reviews: true,
              business_follows: true,
            },
          },
        },
      },
    },
    orderBy: {
      updated_at: 'desc',
    },
  });

  return approvedClaims.map((claim) => {
    const business = claim.businesses;
    const gallery = business.gallery as Array<{ url: string }> | null;

    return {
      id: business.id,
      name: business.name,
      slug: business.slug,
      status: business.status,
      claimed: business.claimed,
      verifiedAt: claim.decision_at?.toISOString() || null,
      rating: null, // Rating will be calculated separately
      reviewCount: business._count.reviews,
      followerCount: business._count.business_follows,
      photos: gallery?.map((p) => p.url).slice(0, 3) || [],
    };
  });
}
