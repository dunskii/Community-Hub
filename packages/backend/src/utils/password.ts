/**
 * Password Utility Functions
 *
 * Provides secure password hashing and validation using bcrypt.
 * Spec §4.1: Password Security Requirements
 */

import bcrypt from 'bcrypt';

/**
 * Password validation result
 */
export interface PasswordValidation {
  valid: boolean;
  errors: string[];
}

/**
 * Get bcrypt cost factor from environment (default: 12)
 * Higher values = more secure but slower
 */
const BCRYPT_COST_FACTOR = parseInt(process.env.BCRYPT_COST_FACTOR || '12', 10);

/**
 * Hash a plain text password using bcrypt
 *
 * @param plainText - The plain text password
 * @returns Promise<string> - The bcrypt hash
 */
export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, BCRYPT_COST_FACTOR);
}

/**
 * Compare a plain text password with a bcrypt hash
 *
 * @param plainText - The plain text password
 * @param hash - The bcrypt hash to compare against
 * @returns Promise<boolean> - True if passwords match
 */
export async function comparePassword(
  plainText: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

/**
 * Validate password strength according to Spec §4.1
 *
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one number
 *
 * @param password - The password to validate
 * @returns PasswordValidation - Validation result with errors
 */
export function validatePasswordStrength(password: string): PasswordValidation {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
