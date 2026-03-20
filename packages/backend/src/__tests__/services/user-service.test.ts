/**
 * User Service Tests
 *
 * Comprehensive tests for user service functions.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UserStatus, UserRole } from '../../generated/prisma';

// Mock dependencies
vi.mock('../../db/index', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    userSession: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
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

vi.mock('../../services/session-service', () => ({
  revokeAllUserSessions: vi.fn().mockResolvedValue(0),
}));

vi.mock('../../cache/redis-client', () => ({
  getRedis: vi.fn(() => ({
    setex: vi.fn().mockResolvedValue('OK'),
    get: vi.fn().mockResolvedValue(null),
    del: vi.fn().mockResolvedValue(1),
  })),
}));

vi.mock('../../services/token-service', () => ({
  generateEmailToken: vi.fn(() => 'mock-token-123'),
  storeEmailVerificationToken: vi.fn().mockResolvedValue(undefined),
  verifyEmailVerificationToken: vi.fn().mockResolvedValue('new@example.com'),
}));

vi.mock('../../utils/image-processor', () => ({
  processProfilePhoto: vi.fn((buffer) => Promise.resolve(buffer)),
  validateImageDimensions: vi.fn(() => Promise.resolve(true)),
}));

vi.mock('fs/promises', () => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
  unlink: vi.fn().mockResolvedValue(undefined),
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

import { prisma } from '../../db/index';
import * as emailModule from '../../email/email-service';
import * as passwordUtils from '../../utils/password';
import {
  getUserById,
  updateUserProfile,
  updateProfilePhoto,
  changePassword,
  changeEmail,
  updateNotificationPreferences,
  requestAccountDeletion,
  cancelAccountDeletion,
} from '../../services/user-service';

// Get the mock function
const mockSendTemplatedEmail = (emailModule as any).__mockSendTemplatedEmail;

describe('User Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (mockSendTemplatedEmail) {
      mockSendTemplatedEmail.mockResolvedValue(undefined);
    }
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserById', () => {
    it('should return user by ID', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        profilePhoto: null,
        languagePreference: 'en',
        suburb: 'Guildford South',
        bio: 'Test bio',
        interests: ['food', 'shopping'],
        notificationPreferences: { emailDigest: 'daily' },
        role: UserRole.COMMUNITY,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        passwordHash: 'hashed_password',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: new Date(),
      };

      (prisma.users.findUnique as any).mockResolvedValue(mockUser);

      const result = await getUserById('user-123');

      expect(result).toBeDefined();
      expect(result!.id).toBe('user-123');
      expect(result!.email).toBe('test@example.com');
      // Password hash should not be included
      expect((result as any).passwordHash).toBeUndefined();

      expect(prisma.users.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
    });

    it('should return null for non-existent user', async () => {
      (prisma.users.findUnique as any).mockResolvedValue(null);

      const result = await getUserById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile successfully', async () => {
      const updateData = {
        displayName: 'Updated Name',
        bio: 'Updated bio',
        suburb: 'New Suburb',
        languagePreference: 'es',
        interests: ['art', 'music'],
      };

      const mockUpdatedUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'hashed',
        ...updateData,
        role: UserRole.COMMUNITY,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        profilePhoto: null,
        notificationPreferences: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: null,
      };

      (prisma.users.update as any).mockResolvedValue(mockUpdatedUser);

      const result = await updateUserProfile('user-123', updateData);

      expect(result).toBeDefined();
      expect(result.displayName).toBe('Updated Name');
      expect(result.bio).toBe('Updated bio');
      expect(result.languagePreference).toBe('es');

      expect(prisma.users.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: updateData,
      });
    });

    it('should update partial profile data', async () => {
      const updateData = {
        displayName: 'New Name Only',
      };

      const mockUpdatedUser = {
        id: 'user-123',
        email: 'test@example.com',
        displayName: 'New Name Only',
        passwordHash: 'hashed',
        role: UserRole.COMMUNITY,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        profilePhoto: null,
        languagePreference: 'en',
        suburb: null,
        bio: null,
        interests: [],
        notificationPreferences: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: null,
      };

      (prisma.users.update as any).mockResolvedValue(mockUpdatedUser);

      const result = await updateUserProfile('user-123', updateData);

      expect(result.displayName).toBe('New Name Only');
    });
  });

  describe('updateProfilePhoto', () => {
    it('should update profile photo', async () => {
      const expectedPhotoUrl = '/uploads/profiles/user-123.webp';

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        profilePhoto: null,
        passwordHash: 'hashed',
        role: UserRole.COMMUNITY,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        languagePreference: 'en',
        suburb: null,
        bio: null,
        interests: [],
        notificationPreferences: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: null,
      };

      const mockUpdatedUser = {
        ...mockUser,
        profilePhoto: expectedPhotoUrl,
      };

      // Mock findUnique to return the user
      (prisma.users.findUnique as any).mockResolvedValue(mockUser);
      // Mock update to return the updated user
      (prisma.users.update as any).mockResolvedValue(mockUpdatedUser);

      const result = await updateProfilePhoto('user-123', Buffer.from('fake-image'));

      expect(result.profilePhoto).toBe(expectedPhotoUrl);

      expect(prisma.users.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { profilePhoto: expectedPhotoUrl },
      });
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        passwordHash: 'hashed_OldPass123',
        languagePreference: 'en',
        role: UserRole.COMMUNITY,
        status: UserStatus.ACTIVE,
      };

      (prisma.users.findUnique as any).mockResolvedValue(mockUser);
      (prisma.users.update as any).mockResolvedValue({
        ...mockUser,
        passwordHash: 'hashed_NewPass123',
      });

      await changePassword('user-123', 'OldPass123', 'NewPass123');

      // Verify password comparison
      expect(passwordUtils.comparePassword).toHaveBeenCalledWith(
        'OldPass123',
        'hashed_OldPass123'
      );

      // Verify new password validation
      expect(passwordUtils.validatePasswordStrength).toHaveBeenCalledWith('NewPass123');

      // Verify password was hashed
      expect(passwordUtils.hashPassword).toHaveBeenCalledWith('NewPass123');

      // Verify database update
      expect(prisma.users.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { passwordHash: 'hashed_NewPass123' },
      });

      // Verify confirmation email
      expect(mockSendTemplatedEmail).toHaveBeenCalledWith(
        'password_changed',
        'test@example.com',
        expect.any(Object),
        'en'
      );
    });

    it('should reject incorrect current password', async () => {
      const mockUser = {
        id: 'user-123',
        passwordHash: 'hashed_CorrectPass123',
      };

      (prisma.users.findUnique as any).mockResolvedValue(mockUser);

      await expect(
        changePassword('user-123', 'WrongPass123', 'NewPass123')
      ).rejects.toThrow('Current password is incorrect');
    });

    it('should reject weak new password', async () => {
      const mockUser = {
        id: 'user-123',
        passwordHash: 'hashed_OldPass123',
      };

      (prisma.users.findUnique as any).mockResolvedValue(mockUser);

      await expect(changePassword('user-123', 'OldPass123', 'weak')).rejects.toThrow(
        'Password must be at least 8 characters'
      );
    });

    it('should throw error for non-existent user', async () => {
      (prisma.users.findUnique as any).mockResolvedValue(null);

      await expect(
        changePassword('non-existent', 'OldPass123', 'NewPass123')
      ).rejects.toThrow('User not found');
    });
  });

  describe('changeEmail', () => {
    it('should change email successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'old@example.com',
        displayName: 'Test User',
        languagePreference: 'en',
      };

      (prisma.users.findUnique as any)
        .mockResolvedValueOnce(null) // New email not taken
        .mockResolvedValueOnce(mockUser); // Current user

      (prisma.users.update as any).mockResolvedValue({
        ...mockUser,
        pendingEmail: 'new@example.com',
      });

      await changeEmail('user-123', 'new@example.com');

      expect(prisma.users.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          pendingEmail: 'new@example.com',
        },
      });
    });

    it('should reject email already in use', async () => {
      (prisma.users.findUnique as any).mockResolvedValue({
        id: 'other-user',
        email: 'taken@example.com',
      });

      await expect(changeEmail('user-123', 'taken@example.com')).rejects.toThrow(
        'Email already in use'
      );
    });

    it('should allow changing to same email (case change)', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        languagePreference: 'en',
      };

      (prisma.users.findUnique as any)
        .mockResolvedValueOnce(mockUser) // Same user
        .mockResolvedValueOnce(mockUser); // Current user

      (prisma.users.update as any).mockResolvedValue({
        ...mockUser,
        pendingEmail: 'test@example.com',
      });

      await expect(changeEmail('user-123', 'Test@Example.com')).resolves.not.toThrow();
    });

    it('should lowercase new email', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'old@example.com',
        displayName: 'Test User',
        languagePreference: 'en',
      };

      (prisma.users.findUnique as any)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockUser);

      (prisma.users.update as any).mockResolvedValue({
        ...mockUser,
        pendingEmail: 'new@example.com',
      });

      await changeEmail('user-123', 'NEW@EXAMPLE.COM');

      expect(prisma.users.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: expect.objectContaining({
          pendingEmail: 'new@example.com',
        }),
      });
    });
  });

  describe('updateNotificationPreferences', () => {
    it('should update notification preferences', async () => {
      const preferences = {
        emailDigest: 'weekly',
        pushEnabled: false,
        dealAlerts: true,
        emergencyAlerts: 'critical_only',
      };

      const mockUpdatedUser = {
        id: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        notificationPreferences: preferences,
        passwordHash: 'hashed',
        role: UserRole.COMMUNITY,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        profilePhoto: null,
        languagePreference: 'en',
        suburb: null,
        bio: null,
        interests: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: null,
      };

      (prisma.users.update as any).mockResolvedValue(mockUpdatedUser);

      const result = await updateNotificationPreferences('user-123', preferences);

      expect(result.notificationPreferences).toEqual(preferences);

      expect(prisma.users.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { notificationPreferences: preferences },
      });
    });
  });

  describe('requestAccountDeletion', () => {
    it('should set deletion timestamp', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        status: UserStatus.ACTIVE,
        languagePreference: 'en',
        deletionRequestedAt: new Date(),
      };

      (prisma.users.update as any).mockResolvedValue(mockUser);

      await requestAccountDeletion('user-123');

      expect(prisma.users.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: expect.objectContaining({
          deletionRequestedAt: expect.any(Date),
        }),
      });

      // Verify email was sent
      expect(mockSendTemplatedEmail).toHaveBeenCalled();
    });
  });

  describe('cancelAccountDeletion', () => {
    it('should clear deletion timestamp', async () => {
      const mockUser = {
        id: 'user-123',
        status: UserStatus.ACTIVE,
        deletionRequestedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      };

      (prisma.users.findUnique as any).mockResolvedValue(mockUser);
      (prisma.users.update as any).mockResolvedValue({
        ...mockUser,
        deletionRequestedAt: null,
      });

      await cancelAccountDeletion('user-123');

      expect(prisma.users.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: expect.objectContaining({
          deletionRequestedAt: null,
        }),
      });
    });
  });
});
