/**
 * Auth Service Tests
 *
 * Comprehensive tests for authentication service functions.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UserStatus, UserRole } from '../../generated/prisma';

// Mock dependencies
vi.mock('../../db/index', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    userSession: {
      findMany: vi.fn(() => Promise.resolve([])),
      deleteMany: vi.fn(() => Promise.resolve({ count: 0 })),
    },
  },
}));

vi.mock('../../email/email-service', () => {
  const mockSendTemplatedEmail = vi.fn().mockResolvedValue(undefined);
  return {
    EmailService: vi.fn().mockImplementation(() => ({
      sendTemplatedEmail: mockSendTemplatedEmail,
    })),
    // Export the mock so we can access it
    __mockSendTemplatedEmail: mockSendTemplatedEmail,
  };
});

vi.mock('../../cache/redis-client', () => ({
  getRedis: vi.fn(() => ({
    setex: vi.fn(),
    get: vi.fn(),
    del: vi.fn(),
    incr: vi.fn(),
  })),
}));

vi.mock('../../utils/password', () => ({
  hashPassword: vi.fn((password) => Promise.resolve(`hashed_${password}`)),
  comparePassword: vi.fn((password, hash) =>
    Promise.resolve(hash === `hashed_${password}`)
  ),
  validatePasswordStrength: vi.fn((password) => {
    if (password.length < 8) {
      return { valid: false, errors: ['Password must be at least 8 characters'] };
    }
    if (!/[A-Z]/.test(password)) {
      return {
        valid: false,
        errors: ['Password must contain at least one uppercase letter'],
      };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, errors: ['Password must contain at least one number'] };
    }
    return { valid: true, errors: [] };
  }),
}));

vi.mock('../../services/token-service', () => ({
  generateAccessToken: vi.fn(() => 'access-token-123'),
  generateEmailToken: vi.fn(() => 'email-token-123'),
  storeEmailVerificationToken: vi.fn(),
  verifyEmailVerificationToken: vi.fn(),
  storePasswordResetToken: vi.fn(),
  verifyPasswordResetToken: vi.fn(),
  incrementFailedLoginAttempts: vi.fn(() => Promise.resolve(1)),
  getFailedLoginAttempts: vi.fn(() => Promise.resolve(0)),
  clearFailedLoginAttempts: vi.fn(),
}));

import { prisma } from '../../db/index';
import * as emailModule from '../../email/email-service';
import * as tokenService from '../../services/token-service';
import * as passwordUtils from '../../utils/password';
import {
  registerUser,
  loginUser,
  verifyEmail,
  resendVerificationEmail,
  initiatePasswordReset,
  completePasswordReset,
} from '../../services/auth-service';

// Get the mock function
const mockSendTemplatedEmail = (emailModule as any).__mockSendTemplatedEmail;

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (mockSendTemplatedEmail) {
      mockSendTemplatedEmail.mockResolvedValue(undefined);
    }
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('registerUser', () => {
    const validRegistrationData = {
      email: 'test@example.com',
      password: 'ValidPass123',
      displayName: 'Test User',
      languagePreference: 'en',
      suburb: 'Guildford South',
      interests: ['food', 'shopping'],
    };

    it('should register a new user successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        passwordHash: 'hashed_ValidPass123',
        languagePreference: 'en',
        suburb: 'Guildford South',
        interests: ['food', 'shopping'],
        status: UserStatus.PENDING,
        emailVerified: false,
        role: UserRole.COMMUNITY,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as any).mockResolvedValue(null);
      (prisma.user.create as any).mockResolvedValue(mockUser);

      const result = await registerUser(validRegistrationData);

      expect(result).toBeDefined();
      expect(result.email).toBe('test@example.com');
      expect(result.displayName).toBe('Test User');
      expect(result.status).toBe(UserStatus.PENDING);
      expect(result.emailVerified).toBe(false);

      // Verify password was hashed
      expect(passwordUtils.hashPassword).toHaveBeenCalledWith('ValidPass123');

      // Verify user was created
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'test@example.com',
          displayName: 'Test User',
          languagePreference: 'en',
          status: UserStatus.PENDING,
          emailVerified: false,
        }),
      });

      // Verify verification email was sent
      expect(mockSendTemplatedEmail).toHaveBeenCalledWith(
        'email_verification',
        'test@example.com',
        expect.objectContaining({
          userName: 'Test User',
          verificationLink: expect.stringContaining('token='),
        }),
        'en'
      );
    });

    it('should reject weak password', async () => {
      const weakPasswordData = {
        ...validRegistrationData,
        password: 'weak',
      };

      await expect(registerUser(weakPasswordData)).rejects.toThrow(
        'Password must be at least 8 characters'
      );
    });

    it('should reject duplicate email', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: 'existing-user',
        email: 'test@example.com',
      });

      await expect(registerUser(validRegistrationData)).rejects.toThrow(
        'Email already registered'
      );
    });

    it('should lowercase email address', async () => {
      const upperCaseEmailData = {
        ...validRegistrationData,
        email: 'Test@EXAMPLE.COM',
      };

      (prisma.user.findUnique as any).mockResolvedValue(null);
      (prisma.user.create as any).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        ...validRegistrationData,
      });

      await registerUser(upperCaseEmailData);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should set default notification preferences', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);
      (prisma.user.create as any).mockResolvedValue({
        id: 'user-123',
        ...validRegistrationData,
      });

      await registerUser(validRegistrationData);

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          notificationPreferences: expect.objectContaining({
            emailDigest: 'daily',
            pushEnabled: true,
            eventReminders: true,
          }),
        }),
      });
    });
  });

  describe('loginUser', () => {
    const validLoginData = {
      email: 'test@example.com',
      password: 'ValidPass123',
    };

    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      displayName: 'Test User',
      passwordHash: 'hashed_ValidPass123',
      role: UserRole.COMMUNITY,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      lastLogin: new Date(),
    };

    it('should login successfully with valid credentials', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      (prisma.user.update as any).mockResolvedValue({
        ...mockUser,
        lastLogin: new Date(),
      });
      (tokenService.getFailedLoginAttempts as any).mockResolvedValue(0);

      const result = await loginUser(validLoginData);

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('access-token-123');
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('test@example.com');

      // Verify lastLogin was updated
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { lastLogin: expect.any(Date) },
      });

      // Verify failed attempts were cleared
      expect(tokenService.clearFailedLoginAttempts).toHaveBeenCalledWith('user-123');
    });

    it('should reject invalid email', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);

      await expect(loginUser(validLoginData)).rejects.toThrow(
        'Invalid email or password'
      );
    });

    it('should reject invalid password', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      (tokenService.getFailedLoginAttempts as any).mockResolvedValue(0);

      const invalidPasswordData = {
        ...validLoginData,
        password: 'WrongPassword123',
      };

      await expect(loginUser(invalidPasswordData)).rejects.toThrow(
        'Invalid email or password'
      );

      // Verify failed attempts were incremented
      expect(tokenService.incrementFailedLoginAttempts).toHaveBeenCalledWith('user-123');
    });

    it('should lock account after 5 failed attempts', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      (tokenService.getFailedLoginAttempts as any).mockResolvedValue(5);

      await expect(loginUser(validLoginData)).rejects.toThrow(
        'Account locked due to too many failed login attempts'
      );
    });

    it('should reject PENDING users', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        ...mockUser,
        status: UserStatus.PENDING,
      });
      (tokenService.getFailedLoginAttempts as any).mockResolvedValue(0);

      await expect(loginUser(validLoginData)).rejects.toThrow(
        'Please verify your email address before logging in'
      );
    });

    it('should reject SUSPENDED users', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        ...mockUser,
        status: UserStatus.SUSPENDED,
      });
      (tokenService.getFailedLoginAttempts as any).mockResolvedValue(0);

      await expect(loginUser(validLoginData)).rejects.toThrow(
        'Account suspended. Please contact support.'
      );
    });

    it('should reject DELETED users', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        ...mockUser,
        status: UserStatus.DELETED,
      });
      (tokenService.getFailedLoginAttempts as any).mockResolvedValue(0);

      await expect(loginUser(validLoginData)).rejects.toThrow('Account deleted.');
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      const userId = 'user-123';
      const token = 'valid-token-123';
      const email = 'test@example.com';

      (tokenService.verifyEmailVerificationToken as any).mockResolvedValue(email);

      const mockUser = {
        id: userId,
        email,
        displayName: 'Test User',
        emailVerified: true,
        status: UserStatus.ACTIVE,
        languagePreference: 'en',
      };

      (prisma.user.update as any).mockResolvedValue(mockUser);

      const result = await verifyEmail(userId, token);

      expect(result).toBeDefined();
      expect(result.emailVerified).toBe(true);
      expect(result.status).toBe(UserStatus.ACTIVE);

      // Verify user was updated
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          emailVerified: true,
          status: UserStatus.ACTIVE,
        },
      });

      // Verify welcome email was sent
      expect(mockSendTemplatedEmail).toHaveBeenCalledWith(
        'welcome',
        email,
        expect.objectContaining({
          userName: 'Test User',
        }),
        'en'
      );
    });

    it('should reject invalid token', async () => {
      (tokenService.verifyEmailVerificationToken as any).mockResolvedValue(null);

      await expect(verifyEmail('user-123', 'invalid-token')).rejects.toThrow(
        'Invalid or expired verification token'
      );
    });
  });

  describe('resendVerificationEmail', () => {
    it('should resend verification email', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        emailVerified: false,
        languagePreference: 'en',
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);

      await resendVerificationEmail('test@example.com');

      expect(tokenService.generateEmailToken).toHaveBeenCalled();
      expect(tokenService.storeEmailVerificationToken).toHaveBeenCalledWith(
        'user-123',
        'test@example.com',
        'email-token-123'
      );
      expect(mockSendTemplatedEmail).toHaveBeenCalledWith(
        'email_verification',
        'test@example.com',
        expect.any(Object),
        'en'
      );
    });

    it('should fail silently for non-existent email', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);

      await expect(
        resendVerificationEmail('nonexistent@example.com')
      ).resolves.toBeUndefined();

      expect(mockSendTemplatedEmail).not.toHaveBeenCalled();
    });

    it('should reject if email already verified', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        emailVerified: true,
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);

      await expect(resendVerificationEmail('test@example.com')).rejects.toThrow(
        'Email already verified'
      );
    });
  });

  describe('initiatePasswordReset', () => {
    it('should initiate password reset', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        languagePreference: 'en',
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);

      await initiatePasswordReset('test@example.com');

      expect(tokenService.generateEmailToken).toHaveBeenCalled();
      expect(tokenService.storePasswordResetToken).toHaveBeenCalledWith(
        'user-123',
        'test@example.com',
        'email-token-123'
      );
      expect(mockSendTemplatedEmail).toHaveBeenCalledWith(
        'password_reset',
        'test@example.com',
        expect.objectContaining({
          userName: 'Test User',
          resetLink: expect.stringContaining('token='),
        }),
        'en'
      );
    });

    it('should fail silently for non-existent email', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);

      await expect(
        initiatePasswordReset('nonexistent@example.com')
      ).resolves.toBeUndefined();

      expect(mockSendTemplatedEmail).not.toHaveBeenCalled();
    });
  });

  describe('completePasswordReset', () => {
    it('should reset password successfully', async () => {
      const token = 'valid-reset-token';
      const newPassword = 'NewValidPass123';
      const userId = 'user-123';

      (tokenService.verifyPasswordResetToken as any).mockResolvedValue({
        userId,
        email: 'test@example.com',
      });

      const mockUser = {
        id: userId,
        email: 'test@example.com',
        displayName: 'Test User',
        languagePreference: 'en',
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      (prisma.user.update as any).mockResolvedValue(mockUser);

      await completePasswordReset(token, newPassword);

      // Verify password was validated
      expect(passwordUtils.validatePasswordStrength).toHaveBeenCalledWith(newPassword);

      // Verify password was hashed
      expect(passwordUtils.hashPassword).toHaveBeenCalledWith(newPassword);

      // Verify user password was updated
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { passwordHash: 'hashed_NewValidPass123' },
      });

      // Verify confirmation email was sent
      expect(mockSendTemplatedEmail).toHaveBeenCalledWith(
        'password_changed',
        'test@example.com',
        expect.any(Object),
        'en'
      );
    });

    it('should reject invalid token', async () => {
      (tokenService.verifyPasswordResetToken as any).mockResolvedValue(null);

      await expect(
        completePasswordReset('invalid-token', 'NewValidPass123')
      ).rejects.toThrow('Invalid or expired reset token');
    });

    it('should reject weak new password', async () => {
      (tokenService.verifyPasswordResetToken as any).mockResolvedValue({
        userId: 'user-123',
        email: 'test@example.com',
      });

      await expect(completePasswordReset('valid-token', 'weak')).rejects.toThrow(
        'Password must be at least 8 characters'
      );
    });
  });
});
