/**
 * Claim Service Constants
 *
 * Configuration values for business claim verification.
 * Spec §13.1: Business Claim & Verification
 */

export const PIN_LENGTH = 6;
export const PIN_EXPIRY_MINUTES = 10;
export const EMAIL_TOKEN_EXPIRY_HOURS = 24;
export const MAX_PIN_ATTEMPTS = 3;
export const LOCKOUT_MINUTES = 60;
export const DOCUMENT_REVIEW_DAYS = 5;
export const CLAIM_APPEAL_WINDOW_DAYS = 30;
export const CLAIM_RESUBMIT_WAIT_DAYS = 30;

export const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET or SESSION_SECRET must be set');
}
