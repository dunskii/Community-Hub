/**
 * Claim Service
 *
 * Frontend API client for business claim verification.
 * Spec §13.1: Business Claim & Verification
 */

import { get, post } from './api-client';

// ─── Types ──────────────────────────────────────────────────

export type VerificationMethod = 'PHONE' | 'EMAIL' | 'DOCUMENT' | 'GOOGLE_BUSINESS';
export type ClaimStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'APPEALED';
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'EXPIRED' | 'FAILED';

export interface ClaimInitiateInput {
  verificationMethod: VerificationMethod;
  phoneNumber?: string;
  businessEmail?: string;
  documentType?: 'abn' | 'utility_bill' | 'business_registration';
  documentUrls?: string[];
  googleAuthCode?: string;
}

export interface ClaimResult {
  claimRequestId: string;
  verificationStatus: VerificationStatus;
  claimStatus: ClaimStatus;
  verificationMethod: VerificationMethod;
  message: string;
  pinExpiresAt?: string;
  tokenExpiresAt?: string;
  moderationEstimate?: string;
}

export interface ClaimStatusResponse {
  hasClaim: boolean;
  claim?: {
    id: string;
    verificationMethod: VerificationMethod;
    verificationStatus: VerificationStatus;
    claimStatus: ClaimStatus;
    createdAt: string;
    rejectionReason?: string | null;
  };
}

// ─── API Functions ──────────────────────────────────────────

/**
 * Check claim status for a business
 */
export async function getClaimStatus(businessId: string): Promise<ClaimStatusResponse> {
  const response = await get<{ success: boolean; data: ClaimStatusResponse }>(
    `/businesses/${businessId}/claim-status`
  );
  return response.data;
}

/**
 * Initiate a claim for a business
 */
export async function initiateClaim(
  businessId: string,
  data: ClaimInitiateInput
): Promise<ClaimResult> {
  const response = await post<{ success: boolean; data: ClaimResult }>(
    `/businesses/${businessId}/claim`,
    data
  );
  return response.data;
}

/**
 * Verify phone PIN
 */
export async function verifyPhonePIN(
  claimId: string,
  pin: string
): Promise<ClaimResult> {
  const response = await post<{ success: boolean; data: ClaimResult }>(
    `/claims/${claimId}/verify-pin`,
    { pin }
  );
  return response.data;
}

/**
 * Request new PIN
 */
export async function resendPIN(claimId: string): Promise<ClaimResult> {
  const response = await post<{ success: boolean; data: ClaimResult }>(
    `/claims/${claimId}/resend-pin`
  );
  return response.data;
}

/**
 * Appeal a rejected claim
 */
export async function appealClaim(
  claimId: string,
  reason: string
): Promise<ClaimResult> {
  const response = await post<{ success: boolean; data: ClaimResult }>(
    `/claims/${claimId}/appeal`,
    { reason }
  );
  return response.data;
}
