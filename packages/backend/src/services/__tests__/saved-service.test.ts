/**
 * Saved Service Unit Tests
 * Phase 6: User Engagement Features
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SavedService } from '../saved-service.js';
import { ApiError } from '../../utils/api-error.js';

// Mock platform config
vi.mock('../../config/platform-loader.js', () => ({
  getPlatformConfig: vi.fn(() => ({
    limits: {
      maxSavedBusinessesPerUser: 1000,
      maxCustomLists: 10,
      maxListNameLength: 50,
    },
  })),
}));

// Mock Prisma
vi.mock('../../db/index.js', () => ({
  prisma: {
    savedBusiness: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    savedList: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
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

describe('SavedService', () => {
  let savedService: SavedService;
  const mockUserId = 'user-123';
  const mockBusinessId = 'business-456';
  const mockListId = 'list-789';

  beforeEach(() => {
    savedService = new SavedService();
    vi.clearAllMocks();
  });

  describe('saveBusiness', () => {
    it('should save a business successfully', async () => {
      const mockDefaultList = { id: 'default-list', name: 'Saved Businesses', isDefault: true };
      const mockSaved = {
        id: 'saved-1',
        userId: mockUserId,
        businessId: mockBusinessId,
        listId: 'default-list',
        notes: null,
        business: { id: mockBusinessId, name: 'Test Business' },
        list: mockDefaultList,
      };

      vi.mocked(prisma.savedBusiness.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.business.findUnique).mockResolvedValue({ id: mockBusinessId } as any);
      vi.mocked(prisma.savedBusiness.count).mockResolvedValue(10);
      vi.mocked(prisma.savedList.findFirst).mockResolvedValue(mockDefaultList as any);
      vi.mocked(prisma.savedBusiness.create).mockResolvedValue(mockSaved as any);

      const result = await savedService.saveBusiness(mockUserId, mockBusinessId, null, null);

      expect(result).toEqual(mockSaved);
      expect(prisma.savedBusiness.create).toHaveBeenCalled();
    });

    it('should throw error when already saved', async () => {
      vi.mocked(prisma.savedBusiness.findUnique).mockResolvedValue({
        id: 'existing',
        userId: mockUserId,
        businessId: mockBusinessId,
      } as any);

      await expect(
        savedService.saveBusiness(mockUserId, mockBusinessId, null, null)
      ).rejects.toThrow(ApiError);

      expect(prisma.savedBusiness.create).not.toHaveBeenCalled();
    });

    it('should throw error when business not found', async () => {
      vi.mocked(prisma.savedBusiness.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.business.findUnique).mockResolvedValue(null);

      await expect(
        savedService.saveBusiness(mockUserId, mockBusinessId, null, null)
      ).rejects.toThrow(ApiError);
    });

    it('should throw error when save limit reached', async () => {
      vi.mocked(prisma.savedBusiness.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.business.findUnique).mockResolvedValue({ id: mockBusinessId } as any);
      vi.mocked(prisma.savedBusiness.count).mockResolvedValue(1000); // At limit

      await expect(
        savedService.saveBusiness(mockUserId, mockBusinessId, null, null)
      ).rejects.toThrow(ApiError);
    });

    it('should throw error when notes too long', async () => {
      vi.mocked(prisma.savedBusiness.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.business.findUnique).mockResolvedValue({ id: mockBusinessId } as any);
      vi.mocked(prisma.savedBusiness.count).mockResolvedValue(10);

      const longNotes = 'a'.repeat(501);

      await expect(
        savedService.saveBusiness(mockUserId, mockBusinessId, null, longNotes)
      ).rejects.toThrow(ApiError);
    });

    it('should save to custom list when listId provided', async () => {
      const mockCustomList = { id: mockListId, name: 'My List', userId: mockUserId };
      const mockSaved = {
        id: 'saved-1',
        userId: mockUserId,
        businessId: mockBusinessId,
        listId: mockListId,
        list: mockCustomList,
      };

      vi.mocked(prisma.savedBusiness.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.business.findUnique).mockResolvedValue({ id: mockBusinessId } as any);
      vi.mocked(prisma.savedBusiness.count).mockResolvedValue(10);
      vi.mocked(prisma.savedList.findUnique).mockResolvedValue(mockCustomList as any);
      vi.mocked(prisma.savedBusiness.create).mockResolvedValue(mockSaved as any);

      const result = await savedService.saveBusiness(mockUserId, mockBusinessId, mockListId, null);

      expect(result.listId).toBe(mockListId);
    });

    it('should throw error when list not found or not owned', async () => {
      vi.mocked(prisma.savedBusiness.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.business.findUnique).mockResolvedValue({ id: mockBusinessId } as any);
      vi.mocked(prisma.savedBusiness.count).mockResolvedValue(10);
      vi.mocked(prisma.savedList.findUnique).mockResolvedValue({
        id: mockListId,
        userId: 'other-user', // Different user
      } as any);

      await expect(
        savedService.saveBusiness(mockUserId, mockBusinessId, mockListId, null)
      ).rejects.toThrow(ApiError);
    });
  });

  describe('unsaveBusiness', () => {
    it('should unsave a business successfully', async () => {
      vi.mocked(prisma.savedBusiness.findUnique).mockResolvedValue({
        id: 'saved-1',
        userId: mockUserId,
        businessId: mockBusinessId,
      } as any);
      vi.mocked(prisma.savedBusiness.delete).mockResolvedValue({} as any);

      await savedService.unsaveBusiness(mockUserId, mockBusinessId);

      expect(prisma.savedBusiness.delete).toHaveBeenCalledWith({
        where: {
          userId_businessId: { userId: mockUserId, businessId: mockBusinessId },
        },
      });
    });

    it('should throw error when not saved', async () => {
      vi.mocked(prisma.savedBusiness.findUnique).mockResolvedValue(null);

      await expect(
        savedService.unsaveBusiness(mockUserId, mockBusinessId)
      ).rejects.toThrow(ApiError);

      expect(prisma.savedBusiness.delete).not.toHaveBeenCalled();
    });
  });

  describe('getSavedBusinesses', () => {
    it('should return paginated saved businesses', async () => {
      const mockSaved = [
        { id: 'saved-1', business: { id: 'biz-1', name: 'Business 1' } },
        { id: 'saved-2', business: { id: 'biz-2', name: 'Business 2' } },
      ];

      vi.mocked(prisma.savedBusiness.findMany).mockResolvedValue(mockSaved as any);
      vi.mocked(prisma.savedBusiness.count).mockResolvedValue(5);

      const result = await savedService.getSavedBusinesses(mockUserId, null, {
        page: 1,
        limit: 2,
      });

      expect(result.savedBusinesses).toHaveLength(2);
      expect(result.total).toBe(5);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(3);
    });

    it('should filter by listId when provided', async () => {
      vi.mocked(prisma.savedBusiness.findMany).mockResolvedValue([]);
      vi.mocked(prisma.savedBusiness.count).mockResolvedValue(0);

      await savedService.getSavedBusinesses(mockUserId, mockListId, { page: 1, limit: 10 });

      expect(prisma.savedBusiness.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: mockUserId, listId: mockListId },
        })
      );
    });
  });

  describe('createList', () => {
    it('should create a custom list', async () => {
      const mockList = {
        id: 'new-list',
        userId: mockUserId,
        name: 'My Favorites',
        isDefault: false,
      };

      vi.mocked(prisma.savedList.count).mockResolvedValue(5);
      vi.mocked(prisma.savedList.create).mockResolvedValue(mockList as any);

      const result = await savedService.createList(mockUserId, 'My Favorites');

      expect(result).toEqual(mockList);
      expect(prisma.savedList.create).toHaveBeenCalled();
    });

    it('should throw error when list limit reached', async () => {
      vi.mocked(prisma.savedList.count).mockResolvedValue(10); // At limit

      await expect(
        savedService.createList(mockUserId, 'New List')
      ).rejects.toThrow(ApiError);
    });

    it('should throw error when name too long', async () => {
      vi.mocked(prisma.savedList.count).mockResolvedValue(5);

      const longName = 'a'.repeat(51);

      await expect(
        savedService.createList(mockUserId, longName)
      ).rejects.toThrow(ApiError);
    });
  });

  describe('deleteList', () => {
    it('should delete a custom list', async () => {
      vi.mocked(prisma.savedList.findUnique).mockResolvedValue({
        id: mockListId,
        userId: mockUserId,
        isDefault: false,
      } as any);
      vi.mocked(prisma.savedList.delete).mockResolvedValue({} as any);

      await savedService.deleteList(mockUserId, mockListId);

      expect(prisma.savedList.delete).toHaveBeenCalledWith({
        where: { id: mockListId },
      });
    });

    it('should throw error when trying to delete default list', async () => {
      vi.mocked(prisma.savedList.findUnique).mockResolvedValue({
        id: mockListId,
        userId: mockUserId,
        isDefault: true,
      } as any);

      await expect(
        savedService.deleteList(mockUserId, mockListId)
      ).rejects.toThrow(ApiError);
    });

    it('should throw error when list not found or not owned', async () => {
      vi.mocked(prisma.savedList.findUnique).mockResolvedValue(null);

      await expect(
        savedService.deleteList(mockUserId, mockListId)
      ).rejects.toThrow(ApiError);
    });
  });

  describe('getDefaultList', () => {
    it('should return existing default list', async () => {
      const mockDefaultList = { id: 'default', name: 'Saved Businesses', isDefault: true };

      vi.mocked(prisma.savedList.findFirst).mockResolvedValue(mockDefaultList as any);

      const result = await savedService.getDefaultList(mockUserId);

      expect(result).toEqual(mockDefaultList);
    });

    it('should create default list if not exists', async () => {
      const mockNewDefaultList = { id: 'new-default', name: 'Saved Businesses', isDefault: true };

      vi.mocked(prisma.savedList.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.savedList.create).mockResolvedValue(mockNewDefaultList as any);

      const result = await savedService.getDefaultList(mockUserId);

      expect(result).toEqual(mockNewDefaultList);
      expect(prisma.savedList.create).toHaveBeenCalled();
    });
  });
});
