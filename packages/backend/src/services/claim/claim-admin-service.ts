/**
 * Claim Admin Service
 *
 * Moderator/admin actions for business claim management.
 * Spec §13.1: Business Claim & Verification
 */

import { prisma } from '../../db/index.js';
import { ApiError } from '../../utils/api-error.js';
import { createAuditLog } from '../../utils/audit-logger.js';
import { CLAIM_APPEAL_WINDOW_DAYS } from './claim-constants.js';
import type { ClaimResult, AuditContext } from './claim-types.js';
import type {
  VerificationMethod,
  ClaimStatus,
} from '../../generated/prisma/index.js';

/**
 * Approve a claim (internal - used after verification or by moderator)
 */
export async function approveClaim(
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
  await createAuditLog({
    context: auditContext,
    action: 'CLAIM_APPROVED',
    targetType: 'BusinessClaimRequest',
    targetId: claimId,
    previousValue: { claimStatus: 'PENDING' },
    newValue: { claimStatus: 'APPROVED', businessId: claim.business_id },
  });

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
export async function rejectClaim(
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
  await createAuditLog({
    context: auditContext,
    action: 'CLAIM_REJECTED',
    targetType: 'BusinessClaimRequest',
    targetId: claimId,
    previousValue: { claimStatus: 'PENDING' },
    newValue: { claimStatus: 'REJECTED', reason },
  });

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
 * Get pending claims for moderation queue
 */
export async function getPendingClaims(options: {
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
