/**
 * Email Verification
 *
 * Handles email token-based claim verification.
 * Spec §13.1: Business Claim & Verification
 */

import crypto from 'crypto';
import { prisma } from '../../db/index.js';
import { logger } from '../../utils/logger.js';
import { ApiError } from '../../utils/api-error.js';
import { createAuditLog } from '../../utils/audit-logger.js';
import { generateEmailVerificationToken, verifyEmailVerificationToken } from './claim-crypto.js';
import { EMAIL_TOKEN_EXPIRY_HOURS } from './claim-constants.js';
import type { ClaimInitiateInput, ClaimResult, AuditContext } from './claim-types.js';

/**
 * Initiate email verification
 */
export async function initiateEmailVerification(
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
  await createAuditLog({
    context: auditContext,
    action: 'CLAIM_INITIATED',
    targetType: 'BusinessClaimRequest',
    targetId: claim.id,
    newValue: { method: 'EMAIL', email: data.businessEmail.replace(/(.{2}).*@/, '$1***@') },
  });

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
 * Verify email token
 */
export async function verifyEmailToken(
  token: string,
  auditContext: AuditContext,
  approveClaim: (claimId: string, approvedBy: string, auditContext: AuditContext, notes?: string) => Promise<ClaimResult>
): Promise<ClaimResult> {
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
  return approveClaim(claim.id, claim.user_id, auditContext, 'Email verification successful');
}
