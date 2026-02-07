/**
 * Password Utility Tests
 */

import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  comparePassword,
  validatePasswordStrength,
} from '../../utils/password';

describe('Password Utils', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const plainText = 'TestPassword123';
      const hash = await hashPassword(plainText);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(plainText);
      expect(hash).toMatch(/^\$2[ayb]\$.{56}$/); // bcrypt format
    });

    it('should generate different hashes for same password', async () => {
      const plainText = 'TestPassword123';
      const hash1 = await hashPassword(plainText);
      const hash2 = await hashPassword(plainText);

      expect(hash1).not.toBe(hash2); // Salt should be different
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password', async () => {
      const plainText = 'TestPassword123';
      const hash = await hashPassword(plainText);

      const result = await comparePassword(plainText, hash);
      expect(result).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const plainText = 'TestPassword123';
      const hash = await hashPassword(plainText);

      const result = await comparePassword('WrongPassword123', hash);
      expect(result).toBe(false);
    });

    it('should be case sensitive', async () => {
      const plainText = 'TestPassword123';
      const hash = await hashPassword(plainText);

      const result = await comparePassword('testpassword123', hash);
      expect(result).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should accept valid password', () => {
      const result = validatePasswordStrength('ValidPass123');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject password shorter than 8 characters', () => {
      const result = validatePasswordStrength('Short1');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should reject password without uppercase letter', () => {
      const result = validatePasswordStrength('lowercase123');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Password must contain at least one uppercase letter'
      );
    });

    it('should reject password without number', () => {
      const result = validatePasswordStrength('NoNumbers');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should return multiple errors for invalid password', () => {
      const result = validatePasswordStrength('short');

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors).toContain('Password must be at least 8 characters long');
      expect(result.errors).toContain(
        'Password must contain at least one uppercase letter'
      );
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should accept password with special characters', () => {
      const result = validatePasswordStrength('Pass123!@#');

      expect(result.valid).toBe(true);
    });

    it('should accept password with exactly 8 characters', () => {
      const result = validatePasswordStrength('Pass1234');

      expect(result.valid).toBe(true);
    });
  });
});
