/**
 * Admin Business Service
 *
 * Business listing, status management, and owner assignment.
 * Spec §23: Administration & Moderation
 */

import { prisma } from '../../db/index.js';
import { logger } from '../../utils/logger.js';
import { ApiError } from '../../utils/api-error.js';
import { getReadyRedis } from '../../cache/cache-helpers.js';
import { UserRole, BusinessStatus } from '../../generated/prisma/index.js';
import crypto from 'crypto';
import type { AdminBusinessListItem, AdminActionContext } from './admin-types.js';

export class AdminBusinessService {
  /**
   * List all businesses with filtering and pagination
   */
  async listBusinesses(options: {
    page: number;
    limit: number;
    status?: string;
    category?: string;
    claimed?: boolean;
    search?: string;
    sort?: string;
  }): Promise<{ businesses: AdminBusinessListItem[]; total: number }> {
    const where: Record<string, unknown> = {};

    if (options.status) where.status = options.status;
    if (options.category) where.category_primary_id = options.category;
    if (options.claimed !== undefined) where.claimed = options.claimed;
    if (options.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { phone: { contains: options.search } },
        { email: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Record<string, string> = {};
    switch (options.sort) {
      case 'oldest': orderBy.created_at = 'asc'; break;
      case 'name': orderBy.name = 'asc'; break;
      default: orderBy.created_at = 'desc';
    }

    const [businesses, total] = await Promise.all([
      prisma.businesses.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          claimed: true,
          claimed_by: true,
          phone: true,
          email: true,
          featured: true,
          created_at: true,
          categories: { select: { name: true } },
          users: { select: { display_name: true } },
          _count: { select: { reviews: true, deals: true } },
        },
        orderBy,
        skip: (options.page - 1) * options.limit,
        take: options.limit,
      }),
      prisma.businesses.count({ where }),
    ]);

    return {
      businesses: businesses.map((b) => {
        // Category name is stored as JSON - extract English name
        const catName = b.categories.name;
        const categoryName = typeof catName === 'object' && catName !== null && 'en' in catName
          ? String((catName as Record<string, string>).en)
          : String(catName);

        return {
          id: b.id,
          name: b.name,
          slug: b.slug,
          status: b.status,
          claimed: b.claimed,
          claimedBy: b.claimed_by,
          categoryName,
          phone: b.phone,
          email: b.email,
          featured: b.featured,
          createdAt: b.created_at,
          reviewCount: b._count.reviews,
          dealCount: b._count.deals,
          ownerName: b.users?.display_name || null,
        };
      }),
      total,
    };
  }

  /**
   * Update business status
   */
  async updateBusinessStatus(
    businessId: string,
    status: BusinessStatus,
    ctx: AdminActionContext,
    reason?: string
  ): Promise<void> {
    const business = await prisma.businesses.findUnique({
      where: { id: businessId },
      select: { id: true, status: true },
    });
    if (!business) throw ApiError.notFound('BUSINESS_NOT_FOUND', 'Business not found');

    await prisma.$transaction([
      prisma.businesses.update({
        where: { id: businessId },
        data: { status, updated_at: new Date() },
      }),
      prisma.audit_logs.create({
        data: {
          id: crypto.randomUUID(),
          actor_id: ctx.adminId,
          actor_role: 'ADMIN',
          action: 'business.status_change',
          target_type: 'Business',
          target_id: businessId,
          previous_value: { status: business.status },
          new_value: { status },
          reason: reason || null,
          ip_address: ctx.ipAddress,
          user_agent: ctx.userAgent,
        },
      }),
    ]);

    // Invalidate cache
    const redis = getReadyRedis();
    if (redis) {
      try {
        await redis.del('admin:dashboard:overview');
      } catch (e) {
        logger.warn({ error: e }, 'Failed to invalidate admin cache');
      }
    }
  }

  /**
   * Assign or unassign a business owner
   */
  async assignBusinessOwner(
    businessId: string,
    userId: string | null,
    ctx: AdminActionContext
  ): Promise<void> {
    const business = await prisma.businesses.findUnique({
      where: { id: businessId },
      select: { id: true, name: true, claimed: true, claimed_by: true },
    });
    if (!business) throw ApiError.notFound('BUSINESS_NOT_FOUND', 'Business not found');

    if (userId) {
      const user = await prisma.users.findUnique({ where: { id: userId }, select: { id: true, role: true } });
      if (!user) throw ApiError.notFound('USER_NOT_FOUND', 'User not found');

      await prisma.$transaction([
        prisma.businesses.update({
          where: { id: businessId },
          data: { claimed: true, claimed_by: userId, updated_at: new Date() },
        }),
        // Set user role to BUSINESS_OWNER if they're a regular COMMUNITY user
        ...(user.role === UserRole.COMMUNITY
          ? [prisma.users.update({ where: { id: userId }, data: { role: UserRole.BUSINESS_OWNER, updated_at: new Date() } })]
          : []),
        prisma.audit_logs.create({
          data: {
            id: crypto.randomUUID(),
            actor_id: ctx.adminId,
            actor_role: 'ADMIN',
            action: 'business.assign_owner',
            target_type: 'Business',
            target_id: businessId,
            previous_value: { claimed: business.claimed, claimedBy: business.claimed_by },
            new_value: { claimed: true, claimedBy: userId },
            ip_address: ctx.ipAddress,
            user_agent: ctx.userAgent,
          },
        }),
      ]);

      logger.info({ businessId, userId }, 'Business owner assigned');
    } else {
      // Unassign owner
      await prisma.$transaction([
        prisma.businesses.update({
          where: { id: businessId },
          data: { claimed: false, claimed_by: null, updated_at: new Date() },
        }),
        prisma.audit_logs.create({
          data: {
            id: crypto.randomUUID(),
            actor_id: ctx.adminId,
            actor_role: 'ADMIN',
            action: 'business.unassign_owner',
            target_type: 'Business',
            target_id: businessId,
            previous_value: { claimed: business.claimed, claimedBy: business.claimed_by },
            new_value: { claimed: false, claimedBy: null },
            ip_address: ctx.ipAddress,
            user_agent: ctx.userAgent,
          },
        }),
      ]);

      logger.info({ businessId }, 'Business owner unassigned');
    }
  }
}
