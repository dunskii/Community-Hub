/**
 * Saved Business Service
 * Handles saving/unsaving businesses and managing custom lists
 */

import { getPlatformConfig } from '@community-hub/shared';
import { prisma } from '../db/index.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/api-error.js';

export interface PaginationOptions {
  page: number;
  limit: number;
}

export class SavedService {
  /**
   * Saves a business to a list (default or custom)
   */
  async saveBusiness(
    userId: string,
    businessId: string,
    listId: string | null,
    notes: string | null
  ): Promise<Record<string, unknown>> {
    const config = getPlatformConfig();

    // Check if already saved
    const existing = await prisma.savedBusiness.findUnique({
      where: {
        userId_businessId: {
          userId,
          businessId,
        },
      },
    });

    if (existing) {
      throw ApiError.conflict('ALREADY_SAVED', 'Business already saved');
    }

    // Verify business exists
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw ApiError.notFound('BUSINESS_NOT_FOUND', 'Business not found');
    }

    // Check saved count limit
    const savedCount = await prisma.savedBusiness.count({
      where: { userId },
    });

    if (savedCount >= config.limits.maxSavedBusinessesPerUser) {
      throw ApiError.badRequest(
        'SAVED_LIMIT_REACHED',
        `Cannot save more than ${config.limits.maxSavedBusinessesPerUser} businesses`
      );
    }

    // Validate notes length
    if (notes && notes.length > 500) {
      throw ApiError.badRequest('NOTES_TOO_LONG', 'Notes cannot exceed 500 characters');
    }

    // If no listId provided, use default list
    let targetListId = listId;
    if (!targetListId) {
      const defaultList = await this.getDefaultList(userId);
      targetListId = defaultList.id as string;
    } else {
      // Verify list exists and belongs to user
      const list = await prisma.savedList.findUnique({
        where: { id: listId },
      });

      if (!list || list.userId !== userId) {
        throw ApiError.notFound('LIST_NOT_FOUND', 'List not found or does not belong to you');
      }
    }

    const saved = await prisma.savedBusiness.create({
      data: {
        userId,
        businessId,
        listId: targetListId,
        notes,
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            address: true,
            categoryPrimary: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        list: {
          select: {
            id: true,
            name: true,
            isDefault: true,
          },
        },
      },
    });

    logger.info({ userId, businessId, listId: targetListId }, 'Business saved');

    return saved;
  }

  /**
   * Removes a business from saved list
   */
  async unsaveBusiness(userId: string, businessId: string): Promise<void> {
    const saved = await prisma.savedBusiness.findUnique({
      where: {
        userId_businessId: {
          userId,
          businessId,
        },
      },
    });

    if (!saved) {
      throw ApiError.notFound('NOT_SAVED', 'Business not saved');
    }

    await prisma.savedBusiness.delete({
      where: {
        userId_businessId: {
          userId,
          businessId,
        },
      },
    });

    logger.info({ userId, businessId }, 'Business unsaved');
  }

  /**
   * Gets all saved businesses for a user, optionally filtered by list
   */
  async getSavedBusinesses(
    userId: string,
    listId: string | null,
    pagination: PaginationOptions
  ): Promise<{
    savedBusinesses: Record<string, unknown>[];
    lists: Record<string, unknown>[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (listId) {
      where.listId = listId;
    }

    // Get saved businesses and lists in parallel
    const [savedBusinesses, total, lists] = await Promise.all([
      prisma.savedBusiness.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          business: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
              address: true,
              phone: true,
              categoryPrimary: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          list: {
            select: {
              id: true,
              name: true,
              isDefault: true,
            },
          },
        },
      }),
      prisma.savedBusiness.count({ where }),
      prisma.savedList.findMany({
        where: { userId },
        orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
        include: {
          _count: {
            select: {
              savedBusinesses: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      savedBusinesses,
      lists,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Gets or creates the default list for a user
   */
  async getDefaultList(userId: string): Promise<Record<string, unknown>> {
    let defaultList = await prisma.savedList.findFirst({
      where: {
        userId,
        isDefault: true,
      },
    });

    if (!defaultList) {
      defaultList = await prisma.savedList.create({
        data: {
          userId,
          name: 'Saved Businesses',
          isDefault: true,
        },
      });

      logger.info({ userId, listId: defaultList.id }, 'Default list created');
    }

    return defaultList;
  }

  /**
   * Creates a custom list
   */
  async createList(userId: string, name: string): Promise<Record<string, unknown>> {
    const config = getPlatformConfig();

    // Validate name length
    if (name.length < 1 || name.length > config.limits.maxListNameLength) {
      throw ApiError.badRequest(
        'INVALID_NAME',
        `List name must be between 1 and ${config.limits.maxListNameLength} characters`
      );
    }

    // Check list count limit
    const listCount = await prisma.savedList.count({
      where: { userId },
    });

    if (listCount >= config.limits.maxCustomLists) {
      throw ApiError.badRequest(
        'LIST_LIMIT_REACHED',
        `Cannot create more than ${config.limits.maxCustomLists} lists`
      );
    }

    const list = await prisma.savedList.create({
      data: {
        userId,
        name,
        isDefault: false,
      },
      include: {
        _count: {
          select: {
            savedBusinesses: true,
          },
        },
      },
    });

    logger.info({ userId, listId: list.id, name }, 'Custom list created');

    return list;
  }

  /**
   * Updates a custom list name
   */
  async updateList(
    userId: string,
    listId: string,
    name: string
  ): Promise<Record<string, unknown>> {
    const config = getPlatformConfig();

    // Validate name length
    if (name.length < 1 || name.length > config.limits.maxListNameLength) {
      throw ApiError.badRequest(
        'INVALID_NAME',
        `List name must be between 1 and ${config.limits.maxListNameLength} characters`
      );
    }

    // Verify list exists and belongs to user
    const list = await prisma.savedList.findUnique({
      where: { id: listId },
    });

    if (!list || list.userId !== userId) {
      throw ApiError.notFound('LIST_NOT_FOUND', 'List not found or does not belong to you');
    }

    const updatedList = await prisma.savedList.update({
      where: { id: listId },
      data: { name },
      include: {
        _count: {
          select: {
            savedBusinesses: true,
          },
        },
      },
    });

    logger.info({ userId, listId, name }, 'List updated');

    return updatedList;
  }

  /**
   * Deletes a custom list (default list cannot be deleted)
   */
  async deleteList(userId: string, listId: string): Promise<void> {
    // Verify list exists and belongs to user
    const list = await prisma.savedList.findUnique({
      where: { id: listId },
    });

    if (!list || list.userId !== userId) {
      throw ApiError.notFound('LIST_NOT_FOUND', 'List not found or does not belong to you');
    }

    if (list.isDefault) {
      throw ApiError.badRequest('CANNOT_DELETE_DEFAULT', 'Cannot delete default list');
    }

    // Delete list (cascade will remove associated SavedBusiness entries via SetNull)
    await prisma.savedList.delete({
      where: { id: listId },
    });

    logger.info({ userId, listId }, 'List deleted');
  }
}

export const savedService = new SavedService();
