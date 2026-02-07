/**
 * Session Service Tests
 *
 * Tests for session management functionality.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createSession,
  listUserSessions,
  revokeSession,
  revokeAllUserSessions,
  updateSessionActivity,
  findSessionByJti,
  cleanupExpiredSessions,
  hashJti,
} from '../../services/session-service';

// Mock dependencies
vi.mock('../../db/index', () => ({
  prisma: {
    userSession: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock('../../services/token-service', () => ({
  revokeToken: vi.fn(),
}));

import { prisma } from '../../db/index';
import { revokeToken } from '../../services/token-service';

describe('Session Service', () => {
  const mockPrisma = prisma as any;
  const mockRevokeToken = revokeToken as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createSession', () => {
    it('should create a session with correct data', async () => {
      const userId = 'user-123';
      const jti = 'test-jti-123';
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0';
      const ipAddress = '192.168.1.1';
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const mockSession = {
        id: 'session-123',
        userId,
        tokenHash: hashJti(jti),
        deviceInfo: {
          user_agent: userAgent,
          device_type: 'desktop',
          os: 'Windows',
          browser: 'Chrome',
        },
        ipAddress,
        isCurrent: true,
        lastActiveAt: new Date(),
        expiresAt,
        createdAt: new Date(),
      };

      mockPrisma.userSession.create.mockResolvedValue(mockSession);

      const session = await createSession(
        userId,
        jti,
        userAgent,
        ipAddress,
        expiresAt
      );

      expect(session).toEqual(mockSession);
      expect(mockPrisma.userSession.create).toHaveBeenCalledWith({
        data: {
          userId,
          tokenHash: hashJti(jti),
          deviceInfo: {
            user_agent: userAgent,
            device_type: 'desktop',
            os: 'Windows',
            browser: 'Chrome',
          },
          ipAddress,
          isCurrent: true,
          lastActiveAt: expect.any(Date),
          expiresAt,
        },
      });
    });

    it('should parse mobile device info correctly', async () => {
      const userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) Safari/605.1';
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      mockPrisma.userSession.create.mockResolvedValue({
        id: 'session-mobile',
        userId: 'user-123',
        tokenHash: 'hash',
        deviceInfo: {
          user_agent: userAgent,
          device_type: 'mobile',
          os: 'iOS',
          browser: 'Safari',
        },
        ipAddress: '192.168.1.1',
        isCurrent: true,
        lastActiveAt: new Date(),
        expiresAt,
        createdAt: new Date(),
      });

      await createSession('user-123', 'jti', userAgent, '192.168.1.1', expiresAt);

      expect(mockPrisma.userSession.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          deviceInfo: expect.objectContaining({
            device_type: 'mobile',
            os: 'iOS',
            browser: 'Safari',
          }),
        }),
      });
    });

    it('should parse tablet device info correctly', async () => {
      const userAgent = 'Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) Safari/605.1';
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      mockPrisma.userSession.create.mockResolvedValue({
        id: 'session-tablet',
        userId: 'user-123',
        tokenHash: 'hash',
        deviceInfo: {
          user_agent: userAgent,
          device_type: 'tablet',
          os: 'iOS',
          browser: 'Safari',
        },
        ipAddress: '192.168.1.1',
        isCurrent: true,
        lastActiveAt: new Date(),
        expiresAt,
        createdAt: new Date(),
      });

      await createSession('user-123', 'jti', userAgent, '192.168.1.1', expiresAt);

      expect(mockPrisma.userSession.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          deviceInfo: expect.objectContaining({
            device_type: 'tablet',
          }),
        }),
      });
    });
  });

  describe('listUserSessions', () => {
    it('should list only active sessions', async () => {
      const userId = 'user-123';
      const mockSessions = [
        {
          id: 'session-1',
          userId,
          tokenHash: 'hash1',
          deviceInfo: { user_agent: 'Chrome', device_type: 'desktop', os: 'Windows', browser: 'Chrome' },
          ipAddress: '192.168.1.1',
          isCurrent: true,
          lastActiveAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
        },
        {
          id: 'session-2',
          userId,
          tokenHash: 'hash2',
          deviceInfo: { user_agent: 'Firefox', device_type: 'desktop', os: 'Linux', browser: 'Firefox' },
          ipAddress: '192.168.1.2',
          isCurrent: false,
          lastActiveAt: new Date(Date.now() - 1000),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
        },
      ];

      mockPrisma.userSession.findMany.mockResolvedValue(mockSessions);

      const sessions = await listUserSessions(userId);

      expect(sessions).toHaveLength(2);
      expect(mockPrisma.userSession.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          expiresAt: {
            gt: expect.any(Date),
          },
        },
        orderBy: {
          lastActiveAt: 'desc',
        },
      });
    });

    it('should return empty array for user with no sessions', async () => {
      mockPrisma.userSession.findMany.mockResolvedValue([]);

      const sessions = await listUserSessions('user-no-sessions');

      expect(sessions).toHaveLength(0);
    });
  });

  describe('revokeSession', () => {
    it('should revoke a session successfully', async () => {
      const sessionId = 'session-123';
      const userId = 'user-123';
      const mockSession = {
        id: sessionId,
        userId,
        tokenHash: 'hash',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ipAddress: '192.168.1.1',
      };

      mockPrisma.userSession.findUnique.mockResolvedValue(mockSession);
      mockPrisma.userSession.delete.mockResolvedValue(mockSession);

      const revoked = await revokeSession(sessionId, userId);

      expect(revoked).toBe(true);
      expect(mockPrisma.userSession.findUnique).toHaveBeenCalledWith({
        where: { id: sessionId },
      });
      expect(mockRevokeToken).toHaveBeenCalled();
      expect(mockPrisma.userSession.delete).toHaveBeenCalledWith({
        where: { id: sessionId },
      });
    });

    it('should return false for non-existent session', async () => {
      mockPrisma.userSession.findUnique.mockResolvedValue(null);

      const revoked = await revokeSession('non-existent', 'user-123');

      expect(revoked).toBe(false);
    });

    it('should return false when userId does not match', async () => {
      const mockSession = {
        id: 'session-123',
        userId: 'user-123',
        tokenHash: 'hash',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      mockPrisma.userSession.findUnique.mockResolvedValue(mockSession);

      const revoked = await revokeSession('session-123', 'wrong-user');

      expect(revoked).toBe(false);
      expect(mockPrisma.userSession.delete).not.toHaveBeenCalled();
    });
  });

  describe('revokeAllUserSessions', () => {
    it('should revoke all sessions for a user', async () => {
      const userId = 'user-123';
      const mockSessions = [
        {
          id: 'session-1',
          userId,
          tokenHash: 'hash1',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
        {
          id: 'session-2',
          userId,
          tokenHash: 'hash2',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      ];

      mockPrisma.userSession.findMany.mockResolvedValue(mockSessions);
      mockPrisma.userSession.deleteMany.mockResolvedValue({ count: 2 });

      const count = await revokeAllUserSessions(userId);

      expect(count).toBe(2);
      expect(mockRevokeToken).toHaveBeenCalledTimes(2);
      expect(mockPrisma.userSession.deleteMany).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it('should exclude specified session when provided', async () => {
      const userId = 'user-123';
      const excludeId = 'session-keep';
      const mockSessions = [
        {
          id: 'session-1',
          userId,
          tokenHash: 'hash1',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      ];

      mockPrisma.userSession.findMany.mockResolvedValue(mockSessions);
      mockPrisma.userSession.deleteMany.mockResolvedValue({ count: 1 });

      const count = await revokeAllUserSessions(userId, excludeId);

      expect(count).toBe(1);
      expect(mockPrisma.userSession.deleteMany).toHaveBeenCalledWith({
        where: {
          userId,
          id: { not: excludeId },
        },
      });
    });

    it('should return 0 for user with no sessions', async () => {
      mockPrisma.userSession.findMany.mockResolvedValue([]);
      mockPrisma.userSession.deleteMany.mockResolvedValue({ count: 0 });

      const count = await revokeAllUserSessions('user-no-sessions');

      expect(count).toBe(0);
    });
  });

  describe('updateSessionActivity', () => {
    it('should update lastActiveAt timestamp', async () => {
      const jti = 'test-jti';
      const mockSession = {
        id: 'session-123',
        lastActiveAt: new Date(),
        isCurrent: true,
      };

      mockPrisma.userSession.update.mockResolvedValue(mockSession);

      await updateSessionActivity(jti);

      expect(mockPrisma.userSession.update).toHaveBeenCalledWith({
        where: { tokenHash: hashJti(jti) },
        data: {
          lastActiveAt: expect.any(Date),
          isCurrent: true,
        },
      });
    });

    it('should not throw error for non-existent JTI', async () => {
      mockPrisma.userSession.update.mockRejectedValue(new Error('Not found'));

      await expect(updateSessionActivity('non-existent')).resolves.not.toThrow();
    });
  });

  describe('findSessionByJti', () => {
    it('should find session by JTI', async () => {
      const jti = 'test-jti';
      const mockSession = {
        id: 'session-123',
        userId: 'user-123',
        tokenHash: hashJti(jti),
      };

      mockPrisma.userSession.findUnique.mockResolvedValue(mockSession);

      const session = await findSessionByJti(jti);

      expect(session).toEqual(mockSession);
      expect(mockPrisma.userSession.findUnique).toHaveBeenCalledWith({
        where: { tokenHash: hashJti(jti) },
      });
    });

    it('should return null for non-existent JTI', async () => {
      mockPrisma.userSession.findUnique.mockResolvedValue(null);

      const session = await findSessionByJti('non-existent');

      expect(session).toBeNull();
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should delete only expired sessions', async () => {
      mockPrisma.userSession.deleteMany.mockResolvedValue({ count: 5 });

      const count = await cleanupExpiredSessions();

      expect(count).toBe(5);
      expect(mockPrisma.userSession.deleteMany).toHaveBeenCalledWith({
        where: {
          expiresAt: {
            lt: expect.any(Date),
          },
        },
      });
    });

    it('should return 0 when no expired sessions exist', async () => {
      mockPrisma.userSession.deleteMany.mockResolvedValue({ count: 0 });

      const count = await cleanupExpiredSessions();

      expect(count).toBe(0);
    });
  });

  describe('hashJti', () => {
    it('should produce consistent hashes', () => {
      const jti = 'test-jti-123';
      const hash1 = hashJti(jti);
      const hash2 = hashJti(jti);

      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different JTIs', () => {
      const hash1 = hashJti('jti-1');
      const hash2 = hashJti('jti-2');

      expect(hash1).not.toBe(hash2);
    });

    it('should produce SHA-256 hash (64 characters)', () => {
      const hash = hashJti('test-jti');
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });
});
