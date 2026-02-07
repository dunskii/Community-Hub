/**
 * RBAC Middleware Tests
 *
 * Tests for role-based access control middleware.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { UserRole, UserStatus } from '../../generated/prisma';
import {
  requireRole,
  requireAdmin,
  requireModerator,
  requireOwnershipOrAdmin,
} from '../../middleware/rbac-middleware';

describe('RBAC Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: any;
  let statusMock: any;

  beforeEach(() => {
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });

    mockRequest = {
      params: {},
    };

    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    mockNext = vi.fn();

    vi.clearAllMocks();
  });

  describe('requireRole', () => {
    it('should allow user with required role', () => {
      mockRequest.user = {
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        jti: 'jti-123',
      };

      const middleware = requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should reject user without required role', () => {
      mockRequest.user = {
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.COMMUNITY,
        status: UserStatus.ACTIVE,
        jti: 'jti-123',
      };

      const middleware = requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Forbidden',
        message: 'Insufficient permissions',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject if user not authenticated', () => {
      mockRequest.user = undefined;

      const middleware = requireRole([UserRole.ADMIN]);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should allow user with any of multiple required roles', () => {
      mockRequest.user = {
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.MODERATOR,
        status: UserStatus.ACTIVE,
        jti: 'jti-123',
      };

      const middleware = requireRole([
        UserRole.MODERATOR,
        UserRole.ADMIN,
        UserRole.SUPER_ADMIN,
      ]);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('requireAdmin', () => {
    it('should allow ADMIN role', () => {
      mockRequest.user = {
        id: 'user-123',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        jti: 'jti-123',
      };

      requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should allow SUPER_ADMIN role', () => {
      mockRequest.user = {
        id: 'user-123',
        email: 'superadmin@example.com',
        role: UserRole.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
        jti: 'jti-123',
      };

      requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject non-admin roles', () => {
      mockRequest.user = {
        id: 'user-123',
        email: 'user@example.com',
        role: UserRole.COMMUNITY,
        status: UserStatus.ACTIVE,
        jti: 'jti-123',
      };

      requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireModerator', () => {
    it('should allow MODERATOR role', () => {
      mockRequest.user = {
        id: 'user-123',
        email: 'mod@example.com',
        role: UserRole.MODERATOR,
        status: UserStatus.ACTIVE,
        jti: 'jti-123',
      };

      requireModerator(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should allow ADMIN role', () => {
      mockRequest.user = {
        id: 'user-123',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        jti: 'jti-123',
      };

      requireModerator(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should allow SUPER_ADMIN role', () => {
      mockRequest.user = {
        id: 'user-123',
        email: 'superadmin@example.com',
        role: UserRole.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
        jti: 'jti-123',
      };

      requireModerator(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject COMMUNITY and BUSINESS_OWNER roles', () => {
      mockRequest.user = {
        id: 'user-123',
        email: 'user@example.com',
        role: UserRole.COMMUNITY,
        status: UserStatus.ACTIVE,
        jti: 'jti-123',
      };

      requireModerator(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireOwnershipOrAdmin', () => {
    it('should allow resource owner', () => {
      mockRequest.user = {
        id: 'user-123',
        email: 'user@example.com',
        role: UserRole.COMMUNITY,
        status: UserStatus.ACTIVE,
        jti: 'jti-123',
      };
      mockRequest.params = { id: 'user-123' };

      const middleware = requireOwnershipOrAdmin();
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should allow ADMIN even if not owner', () => {
      mockRequest.user = {
        id: 'admin-123',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        jti: 'jti-123',
      };
      mockRequest.params = { id: 'user-456' };

      const middleware = requireOwnershipOrAdmin();
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should allow SUPER_ADMIN even if not owner', () => {
      mockRequest.user = {
        id: 'superadmin-123',
        email: 'superadmin@example.com',
        role: UserRole.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
        jti: 'jti-123',
      };
      mockRequest.params = { id: 'user-456' };

      const middleware = requireOwnershipOrAdmin();
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject non-owner non-admin', () => {
      mockRequest.user = {
        id: 'user-123',
        email: 'user@example.com',
        role: UserRole.COMMUNITY,
        status: UserStatus.ACTIVE,
        jti: 'jti-123',
      };
      mockRequest.params = { id: 'user-456' };

      const middleware = requireOwnershipOrAdmin();
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Forbidden',
        message: 'You can only access your own resources',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should use custom resource ID parameter', () => {
      mockRequest.user = {
        id: 'user-123',
        email: 'user@example.com',
        role: UserRole.COMMUNITY,
        status: UserStatus.ACTIVE,
        jti: 'jti-123',
      };
      mockRequest.params = { userId: 'user-123' };

      const middleware = requireOwnershipOrAdmin('userId');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should fall back to userId param if custom param not found', () => {
      mockRequest.user = {
        id: 'user-123',
        email: 'user@example.com',
        role: UserRole.COMMUNITY,
        status: UserStatus.ACTIVE,
        jti: 'jti-123',
      };
      mockRequest.params = { userId: 'user-123' };

      const middleware = requireOwnershipOrAdmin('customId');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject if user not authenticated', () => {
      mockRequest.user = undefined;
      mockRequest.params = { id: 'user-123' };

      const middleware = requireOwnershipOrAdmin();
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
