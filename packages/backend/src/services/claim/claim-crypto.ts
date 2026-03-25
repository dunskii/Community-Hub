/**
 * Claim Crypto Helpers
 *
 * Pure cryptographic functions for PIN and token generation/verification.
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { PIN_LENGTH, EMAIL_TOKEN_EXPIRY_HOURS, JWT_SECRET } from './claim-constants.js';

/**
 * Generate a random numeric PIN
 */
export function generatePIN(length: number = PIN_LENGTH): string {
  let pin = '';
  for (let i = 0; i < length; i++) {
    pin += crypto.randomInt(0, 10).toString();
  }
  return pin;
}

/**
 * Hash a PIN using bcrypt
 */
export async function hashPIN(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

/**
 * Verify a PIN against its hash
 */
export async function verifyPIN(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

/**
 * Generate email verification token (JWT)
 */
export function generateEmailVerificationToken(
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
export function verifyEmailVerificationToken(token: string): {
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
