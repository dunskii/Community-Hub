/**
 * Auth Middleware Tests
 *
 * Tests for authentication middleware functions.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { UserRole, UserStatus } from '../../generated/prisma';

// Mock dependencies
vi.mock('../../services/token-service', () => ({
  verifyAccessToken: vi.fn(),
}));

vi.mock('../../db/index', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import { verifyAccessToken } from '../../services/token-service';
import { prisma } from '../../db/index';
import { requireAuth, optionalAuth } from '../../middleware/auth-middleware';

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: any;
  let statusMock: any;

  beforeEach(() => {
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });

    mockRequest = {
      headers: {},
      cookies: {},
    };

    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    mockNext = vi.fn();

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('requireAuth', () => {
    it('should authenticate with valid Bearer token', async () => {
      const mockPayload = {
        sub: 'user-123',
        role: UserRole.COMMUNITY,
        email: 'test@example.com',
        jti: 'token-jti-123',
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.COMMUNITY,
        status: UserStatus.ACTIVE,
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token-123',
      };

      (verifyAccessToken as any).mockResolvedValue(mockPayload);
      (prisma.user.findUnique as any).mockResolvedValue(mockUser);

      await requireAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(verifyAccessToken).toHaveBeenCalledWith('valid-token-123');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
        },
      });

      expect(mockRequest.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.COMMUNITY,
        status: UserStatus.ACTIVE,
        jti: 'token-jti-123',
      });

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should authenticate with valid cookie token', async () => {
      const mockPayload = {
        sub: 'user-123',
        role: UserRole.COMMUNITY,
        email: 'test@example.com',
        jti: 'token-jti-123',
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.COMMUNITY,
        status: UserStatus.ACTIVE,
      };

      mockRequest.cookies = {
        access_token: 'cookie-token-123',
      };

      (verifyAccessToken as any).mockResolvedValue(mockPayload);
      (prisma.user.findUnique as any).mockResolvedValue(mockUser);

      await requireAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(verifyAccessToken).toHaveBeenCalledWith('cookie-token-123');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject request with no token', async () => {
      await requireAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };

      (verifyAccessToken as any).mockResolvedValue(null);

      await requireAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject if user not found', async () => {
      const mockPayload = {
        sub: 'non-existent-user',
        role: UserRole.COMMUNITY,
        email: 'test@example.com',
        jti: 'token-jti-123',
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token-123',
      };

      (verifyAccessToken as any).mockResolvedValue(mockPayload);
      (prisma.user.findUnique as any).mockResolvedValue(null);

      await requireAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'User not found',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject SUSPENDED users', async () => {
      const mockPayload = {
        sub: 'user-123',
        role: UserRole.COMMUNITY,
        email: 'test@example.com',
        jti: 'token-jti-123',
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.COMMUNITY,
        status: UserStatus.SUSPENDED,
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token-123',
      };

      (verifyAccessToken as any).mockResolvedValue(mockPayload);
      (prisma.user.findUnique as any).mockResolvedValue(mockUser);

      await requireAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Account suspended',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject DELETED users', async () => {
      const mockPayload = {
        sub: 'user-123',
        role: UserRole.COMMUNITY,
        email: 'test@example.com',
        jti: 'token-jti-123',
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.COMMUNITY,
        status: UserStatus.DELETED,
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token-123',
      };

      (verifyAccessToken as any).mockResolvedValue(mockPayload);
      (prisma.user.findUnique as any).mockResolvedValue(mockUser);

      await requireAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Account deleted',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject PENDING users', async () => {
      const mockPayload = {
        sub: 'user-123',
        role: UserRole.COMMUNITY,
        email: 'test@example.com',
        jti: 'token-jti-123',
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.COMMUNITY,
        status: UserStatus.PENDING,
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token-123',
      };

      (verifyAccessToken as any).mockResolvedValue(mockPayload);
      (prisma.user.findUnique as any).mockResolvedValue(mockUser);

      await requireAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Please verify your email address',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuth', () => {
    it('should attach user if valid token provided', async () => {
      const mockPayload = {
        sub: 'user-123',
        role: UserRole.COMMUNITY,
        email: 'test@example.com',
        jti: 'token-jti-123',
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.COMMUNITY,
        status: UserStatus.ACTIVE,
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token-123',
      };

      (verifyAccessToken as any).mockResolvedValue(mockPayload);
      (prisma.user.findUnique as any).mockResolvedValue(mockUser);

      await optionalAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.COMMUNITY,
        status: UserStatus.ACTIVE,
        jti: 'token-jti-123',
      });

      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue without user if no token', async () => {
      await optionalAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should continue without user if invalid token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };

      (verifyAccessToken as any).mockResolvedValue(null);

      await optionalAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should continue without user if user is not ACTIVE', async () => {
      const mockPayload = {
        sub: 'user-123',
        role: UserRole.COMMUNITY,
        email: 'test@example.com',
        jti: 'token-jti-123',
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.COMMUNITY,
        status: UserStatus.PENDING,
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token-123',
      };

      (verifyAccessToken as any).mockResolvedValue(mockPayload);
      (prisma.user.findUnique as any).mockResolvedValue(mockUser);

      await optionalAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-token-123',
      };

      (verifyAccessToken as any).mockRejectedValue(new Error('Token verification failed'));

      await optionalAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });
  });
});
