/**
 * Follow Service Unit Tests
 * Phase 6: User Engagement Features
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FollowService } from '../follow-service.js';
import { ApiError } from '../../utils/api-error.js';

// Mock Prisma
vi.mock('../../db/index.js', () => ({
  prisma: {
    businessFollow: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    business: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock logger
vi.mock('../../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { prisma } from '../../db/index.js';

describe('FollowService', () => {
  let followService: FollowService;
  const mockUserId = 'user-123';
  const mockBusinessId = 'business-456';

  beforeEach(() => {
    followService = new FollowService();
    vi.clearAllMocks();
  });

  describe('followBusiness', () => {
    it('should follow a business successfully', async () => {
      const mockFollow = {
        id: 'follow-789',
        userId: mockUserId,
        businessId: mockBusinessId,
        createdAt: new Date(),
        business: {
          id: mockBusinessId,
          name: 'Test Business',
          slug: 'test-business',
          logo: '/logo.png',
          address: '123 Main St',
          categoryPrimary: { id: 'cat-1', name: 'Restaurant' },
        },
      };

      vi.mocked(prisma.business_follows.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.businesses.findUnique).mockResolvedValue({
        id: mockBusinessId,
        name: 'Test Business',
      } as any);
      vi.mocked(prisma.business_follows.create).mockResolvedValue(mockFollow as any);

      const result = await followService.followBusiness(mockUserId, mockBusinessId);

      expect(result).toEqual(mockFollow);
      expect(prisma.business_follows.create).toHaveBeenCalledWith({
        data: { userId: mockUserId, businessId: mockBusinessId },
        include: expect.any(Object),
      });
    });

    it('should throw error when already following', async () => {
      vi.mocked(prisma.business_follows.findUnique).mockResolvedValue({
        id: 'follow-existing',
        userId: mockUserId,
        businessId: mockBusinessId,
      } as any);

      await expect(
        followService.followBusiness(mockUserId, mockBusinessId)
      ).rejects.toThrow(ApiError);

      expect(prisma.business_follows.create).not.toHaveBeenCalled();
    });

    it('should throw error when business not found', async () => {
      vi.mocked(prisma.business_follows.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.businesses.findUnique).mockResolvedValue(null);

      await expect(
        followService.followBusiness(mockUserId, mockBusinessId)
      ).rejects.toThrow(ApiError);

      expect(prisma.business_follows.create).not.toHaveBeenCalled();
    });
  });

  describe('unfollowBusiness', () => {
    it('should unfollow a business successfully', async () => {
      vi.mocked(prisma.business_follows.findUnique).mockResolvedValue({
        id: 'follow-789',
        userId: mockUserId,
        businessId: mockBusinessId,
      } as any);
      vi.mocked(prisma.business_follows.delete).mockResolvedValue({} as any);

      await followService.unfollowBusiness(mockUserId, mockBusinessId);

      expect(prisma.business_follows.delete).toHaveBeenCalledWith({
        where: {
          userId_businessId: { userId: mockUserId, businessId: mockBusinessId },
        },
      });
    });

    it('should throw error when not following', async () => {
      vi.mocked(prisma.business_follows.findUnique).mockResolvedValue(null);

      await expect(
        followService.unfollowBusiness(mockUserId, mockBusinessId)
      ).rejects.toThrow(ApiError);

      expect(prisma.business_follows.delete).not.toHaveBeenCalled();
    });
  });

  describe('getFollowerCount', () => {
    it('should return follower count', async () => {
      vi.mocked(prisma.business_follows.count).mockResolvedValue(42);

      const count = await followService.getFollowerCount(mockBusinessId);

      expect(count).toBe(42);
      expect(prisma.business_follows.count).toHaveBeenCalledWith({
        where: { businessId: mockBusinessId },
      });
    });
  });

  describe('isFollowing', () => {
    it('should return true when following', async () => {
      vi.mocked(prisma.business_follows.findUnique).mockResolvedValue({
        id: 'follow-789',
      } as any);

      const result = await followService.isFollowing(mockUserId, mockBusinessId);

      expect(result).toBe(true);
    });

    it('should return false when not following', async () => {
      vi.mocked(prisma.business_follows.findUnique).mockResolvedValue(null);

      const result = await followService.isFollowing(mockUserId, mockBusinessId);

      expect(result).toBe(false);
    });
  });

  describe('getFollowedBusinesses', () => {
    it('should return paginated followed businesses', async () => {
      const mockFollowing = [
        {
          id: 'follow-1',
          businessId: 'biz-1',
          business: { id: 'biz-1', name: 'Business 1' },
        },
        {
          id: 'follow-2',
          businessId: 'biz-2',
          business: { id: 'biz-2', name: 'Business 2' },
        },
      ];

      vi.mocked(prisma.business_follows.findMany).mockResolvedValue(mockFollowing as any);
      vi.mocked(prisma.business_follows.count).mockResolvedValue(5);

      const result = await followService.getFollowedBusinesses(mockUserId, {
        page: 1,
        limit: 2,
      });

      expect(result.following).toHaveLength(2);
      expect(result.total).toBe(5);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(2);
      expect(result.totalPages).toBe(3);
    });
  });

  describe('getBusinessFollowers', () => {
    it('should return paginated followers', async () => {
      const mockFollowers = [
        { id: 'follow-1', user: { id: 'user-1', displayName: 'User 1' } },
        { id: 'follow-2', user: { id: 'user-2', displayName: 'User 2' } },
      ];

      vi.mocked(prisma.business_follows.findMany).mockResolvedValue(mockFollowers as any);
      vi.mocked(prisma.business_follows.count).mockResolvedValue(10);

      const result = await followService.getBusinessFollowers(mockBusinessId, {
        page: 1,
        limit: 2,
      });

      expect(result.followers).toHaveLength(2);
      expect(result.total).toBe(10);
      expect(result.totalPages).toBe(5);
    });
  });
});
