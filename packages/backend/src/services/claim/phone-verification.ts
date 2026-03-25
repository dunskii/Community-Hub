/**
 * Phone Verification
 *
 * Handles phone PIN-based claim verification.
 * Spec §13.1: Business Claim & Verification
 */

import crypto from 'crypto';
import { prisma } from '../../db/index.js';
import { logger } from '../../utils/logger.js';
import { ApiError } from '../../utils/api-error.js';
import { createAuditLog } from '../../utils/audit-logger.js';
import { generatePIN, hashPIN, verifyPIN } from './claim-crypto.js';
import { PIN_EXPIRY_MINUTES, MAX_PIN_ATTEMPTS, LOCKOUT_MINUTES } from './claim-constants.js';
import type { ClaimInitiateInput, ClaimResult, AuditContext } from './claim-types.js';

/**
 * Initiate phone PIN verification
 */
export async function initiatePhoneVerification(
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
  await createAuditLog({
    context: auditContext,
    action: 'CLAIM_INITIATED',
    targetType: 'BusinessClaimRequest',
    targetId: claim.id,
    newValue: { method: 'PHONE', phoneNumber: data.phoneNumber.slice(-4) },
  });

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
 * Verify phone PIN
 */
export async function verifyPhonePIN(
  claimId: string,
  pin: string,
  userId: string,
  auditContext: AuditContext,
  approveClaim: (claimId: string, approvedBy: string, auditContext: AuditContext, notes?: string) => Promise<ClaimResult>
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
  return approveClaim(claim.id, userId, auditContext, 'Phone verification successful');
}

/**
 * Request new verification PIN (resend)
 */
export async function resendPhonePIN(
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
