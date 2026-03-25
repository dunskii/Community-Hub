/**
 * Document Verification
 *
 * Handles document and Google Business Profile claim verification.
 * Spec §13.1: Business Claim & Verification
 */

import crypto from 'crypto';
import { prisma } from '../../db/index.js';
import { ApiError } from '../../utils/api-error.js';
import { createAuditLog } from '../../utils/audit-logger.js';
import { DOCUMENT_REVIEW_DAYS } from './claim-constants.js';
import type { ClaimInitiateInput, ClaimResult, AuditContext } from './claim-types.js';

/**
 * Initiate document verification (requires moderator review)
 */
export async function initiateDocumentVerification(
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
  await createAuditLog({
    context: auditContext,
    action: 'CLAIM_INITIATED',
    targetType: 'BusinessClaimRequest',
    targetId: claim.id,
    newValue: { method: 'DOCUMENT', documentType: data.documentType, documentCount: data.documentUrls.length },
  });

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
 * Initiate Google Business Profile verification.
 *
 * Uses the existing social account OAuth connection as proof of ownership.
 * If the user has connected their GBP account via the Social Media tab,
 * the successful OAuth proves they manage the Google Business Profile,
 * which is sufficient evidence to auto-approve the claim.
 */
export async function initiateGoogleBusinessVerification(
  data: ClaimInitiateInput,
  userId: string,
  auditContext: AuditContext
): Promise<ClaimResult> {
  // Check if the user has connected a GBP account for this business
  const gbpAccount = await prisma.social_accounts.findFirst({
    where: {
      business_id: data.businessId,
      platform: 'GOOGLE_BUSINESS',
      is_active: true,
      connected_by: userId,
    },
    select: { id: true, platform_account_id: true, platform_account_name: true },
  });

  if (!gbpAccount) {
    throw ApiError.badRequest(
      'GBP_NOT_CONNECTED',
      'Connect your Google Business Profile account in the Social Media tab first, then return here to verify ownership.',
    );
  }

  // GBP OAuth was successful — auto-approve the claim
  const claim = await prisma.business_claim_requests.create({
    data: {
      id: crypto.randomUUID(),
      business_id: data.businessId,
      user_id: userId,
      verification_method: 'GOOGLE_BUSINESS',
      verification_status: 'VERIFIED',
      claim_status: 'APPROVED',
      google_business_id: gbpAccount.platform_account_id,
      decision_at: new Date(),
      ip_address: auditContext.ipAddress,
      user_agent: auditContext.userAgent,
      updated_at: new Date(),
    },
  });

  // Update the business as claimed
  await prisma.businesses.update({
    where: { id: data.businessId },
    data: {
      claimed: true,
      claimed_by: userId,
      verified_at: new Date(),
      updated_at: new Date(),
    },
  });

  // Log audit
  await createAuditLog({
    context: auditContext,
    action: 'CLAIM_APPROVED_GBP',
    targetType: 'BusinessClaimRequest',
    targetId: claim.id,
    newValue: {
      method: 'GOOGLE_BUSINESS',
      googleBusinessId: gbpAccount.platform_account_id,
      locationName: gbpAccount.platform_account_name,
    },
  });

  return {
    claimRequestId: claim.id,
    verificationStatus: 'VERIFIED',
    claimStatus: 'APPROVED',
    verificationMethod: 'GOOGLE_BUSINESS',
    message: 'Your ownership has been verified through Google Business Profile. The business is now claimed.',
  };
}
