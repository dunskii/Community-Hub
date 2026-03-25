/**
 * Claim Service Types
 *
 * Shared interfaces for business claim verification.
 * Spec §13.1: Business Claim & Verification
 */

import type {
  VerificationMethod,
  ClaimVerificationStatus,
  ClaimStatus,
} from '../../generated/prisma/index.js';

export type { AuditContext } from '../../types/service-types.js';

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
