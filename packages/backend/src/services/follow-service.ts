/**
 * Follow Service
 * Handles following/unfollowing businesses
 */

import crypto from 'crypto';
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
    const existing = await prisma.business_follows.findUnique({
      where: {
        user_id_business_id: {
          user_id: userId,
          business_id: businessId,
        },
      },
    });

    if (existing) {
      throw ApiError.conflict('ALREADY_FOLLOWING', 'Already following this business');
    }

    // Verify business exists
    const business = await prisma.businesses.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw ApiError.notFound('BUSINESS_NOT_FOUND', 'Business not found');
    }

    const follow = await prisma.business_follows.create({
      data: {
        id: crypto.randomUUID(),
        user_id: userId,
        business_id: businessId,
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
      },
    });

    logger.info({ userId, businessId }, 'Business followed');

    return follow;
  }

  /**
   * Unfollows a business
   */
  async unfollowBusiness(userId: string, businessId: string): Promise<void> {
    const existing = await prisma.business_follows.findUnique({
      where: {
        user_id_business_id: {
          user_id: userId,
          business_id: businessId,
        },
      },
    });

    if (!existing) {
      throw ApiError.notFound('NOT_FOLLOWING', 'Not following this business');
    }

    await prisma.business_follows.delete({
      where: {
        user_id_business_id: {
          user_id: userId,
          business_id: businessId,
        },
      },
    });

    logger.info({ userId, businessId }, 'Business unfollowed');
  }

  /**
   * Gets follower count for a business
   */
  async getFollowerCount(businessId: string): Promise<number> {
    return prisma.business_follows.count({
      where: { business_id: businessId },
    });
  }

  /**
   * Checks if a user is following a business
   */
  async isFollowing(userId: string, businessId: string): Promise<boolean> {
    const follow = await prisma.business_follows.findUnique({
      where: {
        user_id_business_id: {
          user_id: userId,
          business_id: businessId,
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
      prisma.business_follows.findMany({
        where: { user_id: userId },
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
        },
      }),
      prisma.business_follows.count({ where: { user_id: userId } }),
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
      prisma.business_follows.findMany({
        where: { business_id: businessId },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
        include: {
          users: {
            select: {
              id: true,
              display_name: true,
              profile_photo: true,
            },
          },
        },
      }),
      prisma.business_follows.count({ where: { business_id: businessId } }),
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
