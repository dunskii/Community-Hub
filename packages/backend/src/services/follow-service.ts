/**
 * Follow Service
 * Handles following/unfollowing businesses
 */

import { prisma } from '../db/index.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/api-error.js';

export interface PaginationOptions {
  page: number;
  limit: number;
}

export class FollowService {
  /**
   * Follows a business
   */
  async followBusiness(userId: string, businessId: string): Promise<Record<string, unknown>> {
    // Check if already following
    const existing = await prisma.businessFollow.findUnique({
      where: {
        userId_businessId: {
          userId,
          businessId,
        },
      },
    });

    if (existing) {
      throw ApiError.conflict('ALREADY_FOLLOWING', 'Already following this business');
    }

    // Verify business exists
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw ApiError.notFound('BUSINESS_NOT_FOUND', 'Business not found');
    }

    const follow = await prisma.businessFollow.create({
      data: {
        userId,
        businessId,
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
      },
    });

    logger.info({ userId, businessId }, 'Business followed');

    return follow;
  }

  /**
   * Unfollows a business
   */
  async unfollowBusiness(userId: string, businessId: string): Promise<void> {
    const existing = await prisma.businessFollow.findUnique({
      where: {
        userId_businessId: {
          userId,
          businessId,
        },
      },
    });

    if (!existing) {
      throw ApiError.notFound('NOT_FOLLOWING', 'Not following this business');
    }

    await prisma.businessFollow.delete({
      where: {
        userId_businessId: {
          userId,
          businessId,
        },
      },
    });

    logger.info({ userId, businessId }, 'Business unfollowed');
  }

  /**
   * Gets follower count for a business
   */
  async getFollowerCount(businessId: string): Promise<number> {
    return prisma.businessFollow.count({
      where: { businessId },
    });
  }

  /**
   * Checks if a user is following a business
   */
  async isFollowing(userId: string, businessId: string): Promise<boolean> {
    const follow = await prisma.businessFollow.findUnique({
      where: {
        userId_businessId: {
          userId,
          businessId,
        },
      },
    });

    return !!follow;
  }

  /**
   * Gets all businesses a user is following
   */
  async getFollowedBusinesses(
    userId: string,
    pagination: PaginationOptions
  ): Promise<{
    following: Record<string, unknown>[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const [following, total] = await Promise.all([
      prisma.businessFollow.findMany({
        where: { userId },
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
        },
      }),
      prisma.businessFollow.count({ where: { userId } }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      following,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Gets followers for a business (admin/business owner only)
   */
  async getBusinessFollowers(
    businessId: string,
    pagination: PaginationOptions
  ): Promise<{
    followers: Record<string, unknown>[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const [followers, total] = await Promise.all([
      prisma.businessFollow.findMany({
        where: { businessId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              profilePhoto: true,
            },
          },
        },
      }),
      prisma.businessFollow.count({ where: { businessId } }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      followers,
      total,
      page,
      limit,
      totalPages,
    };
  }
}

export const followService = new FollowService();
