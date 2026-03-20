/**
 * Saved Business Service
 * Handles saving/unsaving businesses and managing custom lists
 */

import crypto from 'crypto';
import { getPlatformConfig } from '../config/platform-loader.js';
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
    const existing = await prisma.saved_businesses.findUnique({
      where: {
        user_id_business_id: {
          user_id: userId,
          business_id: businessId,
        },
      },
    });

    if (existing) {
      throw ApiError.conflict('ALREADY_SAVED', 'Business already saved');
    }

    // Verify business exists
    const business = await prisma.businesses.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw ApiError.notFound('BUSINESS_NOT_FOUND', 'Business not found');
    }

    // Check saved count limit
    const savedCount = await prisma.saved_businesses.count({
      where: { user_id: userId },
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
      const list = await prisma.saved_lists.findUnique({
        where: { id: listId as string },
      });

      if (!list || list.user_id !== userId) {
        throw ApiError.notFound('LIST_NOT_FOUND', 'List not found or does not belong to you');
      }
    }

    const saved = await prisma.saved_businesses.create({
      data: {
        id: crypto.randomUUID(),
        user_id: userId,
        business_id: businessId,
        list_id: targetListId ?? undefined,
        notes: notes ?? undefined,
      },
      include: {
        businesses: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            address: true,
            categories: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        saved_lists: {
          select: {
            id: true,
            name: true,
            is_default: true,
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
    const saved = await prisma.saved_businesses.findUnique({
      where: {
        user_id_business_id: {
          user_id: userId,
          business_id: businessId,
        },
      },
    });

    if (!saved) {
      throw ApiError.notFound('NOT_SAVED', 'Business not saved');
    }

    await prisma.saved_businesses.delete({
      where: {
        user_id_business_id: {
          user_id: userId,
          business_id: businessId,
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

    const where: any = { user_id: userId };
    if (listId) {
      where.list_id = listId;
    }

    // Get saved businesses and lists in parallel
    const [savedBusinesses, total, lists] = await Promise.all([
      prisma.saved_businesses.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
        include: {
          businesses: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
              address: true,
              phone: true,
              categories: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          saved_lists: {
            select: {
              id: true,
              name: true,
              is_default: true,
            },
          },
        },
      }),
      prisma.saved_businesses.count({ where }),
      prisma.saved_lists.findMany({
        where: { user_id: userId },
        orderBy: [{ is_default: 'desc' }, { name: 'asc' }],
        include: {
          _count: {
            select: {
              saved_businesses: true,
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
    let defaultList = await prisma.saved_lists.findFirst({
      where: {
        user_id: userId,
        is_default: true,
      },
    });

    if (!defaultList) {
      defaultList = await prisma.saved_lists.create({
        data: {
          id: crypto.randomUUID(),
          user_id: userId,
          name: 'Saved Businesses',
          is_default: true,
          updated_at: new Date(),
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
    const listCount = await prisma.saved_lists.count({
      where: { user_id: userId },
    });

    if (listCount >= config.limits.maxCustomLists) {
      throw ApiError.badRequest(
        'LIST_LIMIT_REACHED',
        `Cannot create more than ${config.limits.maxCustomLists} lists`
      );
    }

    const list = await prisma.saved_lists.create({
      data: {
        id: crypto.randomUUID(),
        user_id: userId,
        name,
        is_default: false,
        updated_at: new Date(),
      },
      include: {
        _count: {
          select: {
            saved_businesses: true,
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
    const list = await prisma.saved_lists.findUnique({
      where: { id: listId },
    });

    if (!list || list.user_id !== userId) {
      throw ApiError.notFound('LIST_NOT_FOUND', 'List not found or does not belong to you');
    }

    const updatedList = await prisma.saved_lists.update({
      where: { id: listId },
      data: { name },
      include: {
        _count: {
          select: {
            saved_businesses: true,
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
    const list = await prisma.saved_lists.findUnique({
      where: { id: listId },
    });

    if (!list || list.user_id !== userId) {
      throw ApiError.notFound('LIST_NOT_FOUND', 'List not found or does not belong to you');
    }

    if (list.is_default) {
      throw ApiError.badRequest('CANNOT_DELETE_DEFAULT', 'Cannot delete default list');
    }

    // Delete list (cascade will remove associated SavedBusiness entries via SetNull)
    await prisma.saved_lists.delete({
      where: { id: listId },
    });

    logger.info({ userId, listId }, 'List deleted');
  }
}

export const savedService = new SavedService();
