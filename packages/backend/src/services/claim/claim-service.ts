/**
 * Claim Service (Orchestrator)
 *
 * Thin orchestrator that delegates to verification sub-modules.
 * Maintains the same public API as the original monolithic service.
 * Spec §13.1: Business Claim & Verification
 */

import { prisma } from '../../db/index.js';
import { ApiError } from '../../utils/api-error.js';
import { getPlatformConfig } from '../../config/platform-loader.js';
import type { VerificationMethod } from '../../generated/prisma/index.js';
import { CLAIM_RESUBMIT_WAIT_DAYS } from './claim-constants.js';
import type { ClaimInitiateInput, ClaimResult, AuditContext } from './claim-types.js';

// Sub-modules
import { initiatePhoneVerification, verifyPhonePIN as phoneVerifyPIN, resendPhonePIN as phoneResendPIN } from './phone-verification.js';
import { initiateEmailVerification, verifyEmailToken as emailVerifyToken } from './email-verification.js';
import { initiateDocumentVerification, initiateGoogleBusinessVerification } from './document-verification.js';
import { approveClaim as adminApproveClaim, rejectClaim as adminRejectClaim, getPendingClaims as adminGetPendingClaims } from './claim-admin-service.js';
import { appealClaim as claimAppeal } from './claim-appeal-service.js';
import { getClaimStatus as queryClaimStatus } from './claim-queries.js';

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
        return initiatePhoneVerification(data, userId, auditContext);
      case 'EMAIL':
        return initiateEmailVerification(data, userId, business, auditContext);
      case 'DOCUMENT':
        return initiateDocumentVerification(data, userId, auditContext);
      case 'GOOGLE_BUSINESS':
        return initiateGoogleBusinessVerification(data, userId, auditContext);
      default:
        throw ApiError.badRequest('INVALID_VERIFICATION_METHOD', 'Invalid verification method');
    }
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
    return phoneVerifyPIN(claimId, pin, userId, auditContext, adminApproveClaim);
  }

  /**
   * Verify email token
   */
  async verifyEmailToken(token: string, auditContext: AuditContext): Promise<ClaimResult> {
    return emailVerifyToken(token, auditContext, adminApproveClaim);
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
    return adminApproveClaim(claimId, approvedBy, auditContext, notes);
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
    return adminRejectClaim(claimId, moderatorId, reason, auditContext);
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
    return claimAppeal(claimId, userId, appealReason, auditContext);
  }

  /**
   * Get claim status
   */
  async getClaimStatus(businessId: string, userId: string) {
    return queryClaimStatus(businessId, userId);
  }

  /**
   * Get pending claims for moderation queue
   */
  async getPendingClaims(options: {
    page: number;
    limit: number;
    method?: VerificationMethod;
  }) {
    return adminGetPendingClaims(options);
  }

  /**
   * Request new verification PIN (resend)
   */
  async resendPhonePIN(
    claimId: string,
    userId: string,
    auditContext: AuditContext
  ): Promise<ClaimResult> {
    return phoneResendPIN(claimId, userId, auditContext);
  }
}

// Export singleton instance
export const claimService = new ClaimService();
