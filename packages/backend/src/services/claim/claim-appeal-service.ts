/**
 * Claim Appeal Service
 *
 * Handles appeals for rejected business claims.
 * Spec §13.1: Business Claim & Verification
 */

import { prisma } from '../../db/index.js';
import { ApiError } from '../../utils/api-error.js';
import { createAuditLog } from '../../utils/audit-logger.js';
import { CLAIM_APPEAL_WINDOW_DAYS } from './claim-constants.js';
import type { ClaimResult, AuditContext } from './claim-types.js';

/**
 * Appeal a rejected claim
 */
export async function appealClaim(
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
  await createAuditLog({
    context: auditContext,
    action: 'CLAIM_APPEALED',
    targetType: 'BusinessClaimRequest',
    targetId: claimId,
    previousValue: { claimStatus: 'REJECTED' },
    newValue: { claimStatus: 'APPEALED', appealReason },
  });

  return {
    claimRequestId: claim.id,
    verificationStatus: claim.verification_status,
    claimStatus: 'APPEALED',
    verificationMethod: claim.verification_method,
    message: 'Your appeal has been submitted and will be reviewed by our team.',
  };
}
