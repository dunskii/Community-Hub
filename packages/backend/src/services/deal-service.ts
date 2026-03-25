/**
 * Deal Service
 * Phase 10: Promotions & Deals MVP
 * Spec §17: Deals & Promotions
 *
 * Handles CRUD operations for deals/promotions with ownership verification.
 * Enforces 5 active deal limit per business.
 */

import { prisma } from '../db/index.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/api-error.js';
import { getRedis } from '../cache/redis-client.js';
import type { DealCreateInput, DealUpdateInput, DealFilterInput, Deal } from '@community-hub/shared';
import { DealStatus, DiscountType } from '../generated/prisma/index.js';
import { Decimal } from '../generated/prisma/runtime/client.js';

// ─── Constants ────────────────────────────────────────────────

const MAX_ACTIVE_DEALS_PER_BUSINESS = 5;
const CACHE_PREFIX = 'deals';
const CACHE_TTL = 300; // 5 minutes

import { makeCacheKey } from '../cache/cache-helpers.js';
import type { AuditContext } from '../types/service-types.js';

export type { AuditContext };

export interface DealWithBusiness {
  id: string;
  business_id: string;
  title: string;
  description: string;
  price: Decimal | null;
  original_price: Decimal | null;
  discount_type: DiscountType | null;
  discount_value: Decimal | null;
  duration: string | null;
  voucher_code: string | null;
  image: string | null;
  terms: string | null;
  valid_from: Date;
  valid_until: Date;
  featured: boolean;
  status: DealStatus;
  views: number;
  clicks: number;
  voucher_reveals: number;
  created_at: Date;
  updated_at: Date;
  businesses?: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
  };
}

export interface PaginatedDeals {
  deals: Deal[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// ─── Cache Keys ───────────────────────────────────────────────

function getCacheKey(type: string, ...args: string[]): string {
  return makeCacheKey(CACHE_PREFIX, type, ...args);
}

// ─── Helper Functions ─────────────────────────────────────────

function decimalToNumber(value: Decimal | null): number | null {
  if (value === null) return null;
  return Number(value);
}

function formatDealResponse(deal: DealWithBusiness): Deal {
  return {
    id: deal.id,
    businessId: deal.business_id,
    title: deal.title,
    description: deal.description,
    price: decimalToNumber(deal.price),
    originalPrice: decimalToNumber(deal.original_price),
    discountType: deal.discount_type as Deal['discountType'],
    discountValue: decimalToNumber(deal.discount_value),
    duration: deal.duration,
    voucherCode: deal.voucher_code,
    image: deal.image,
    terms: deal.terms,
    validFrom: deal.valid_from.toISOString(),
    validUntil: deal.valid_until.toISOString(),
    featured: deal.featured,
    status: deal.status as Deal['status'],
    views: deal.views,
    clicks: deal.clicks,
    voucherReveals: deal.voucher_reveals,
    createdAt: deal.created_at.toISOString(),
    updatedAt: deal.updated_at.toISOString(),
    business: deal.businesses
      ? {
          id: deal.businesses.id,
          name: deal.businesses.name,
          slug: deal.businesses.slug,
          logo: deal.businesses.logo,
        }
      : undefined,
  };
}

// ─── Service Class ────────────────────────────────────────────

export class DealService {
  /**
   * Verify user owns the business
   */
  private async verifyBusinessOwnership(businessId: string, userId: string): Promise<void> {
    const business = await prisma.businesses.findUnique({
      where: { id: businessId },
      select: { claimed_by: true, claimed: true },
    });

    if (!business) {
      throw ApiError.notFound('BUSINESS_NOT_FOUND', 'Business not found');
    }

    if (!business.claimed || business.claimed_by !== userId) {
      throw ApiError.forbidden('NOT_BUSINESS_OWNER', 'You do not own this business');
    }
  }

  /**
   * Get count of active deals for a business
   */
  private async getActiveDealsCount(businessId: string): Promise<number> {
    const now = new Date();
    return prisma.deals.count({
      where: {
        business_id: businessId,
        status: DealStatus.ACTIVE,
        valid_until: { gte: now },
      },
    });
  }

  /**
   * Invalidate deal-related caches
   */
  private async invalidateCache(businessId?: string): Promise<void> {
    try {
      const redis = getRedis();
      const patterns = [
        getCacheKey('featured', '*'),
        getCacheKey('active', '*'),
      ];

      if (businessId) {
        patterns.push(getCacheKey('business', businessId, '*'));
      }

      for (const pattern of patterns) {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      }
    } catch (error) {
      logger.warn({ error }, 'Failed to invalidate deal cache');
    }
  }

  /**
   * Auto-expire past deals
   */
  async expirePastDeals(): Promise<number> {
    const now = new Date();
    const result = await prisma.deals.updateMany({
      where: {
        status: DealStatus.ACTIVE,
        valid_until: { lt: now },
      },
      data: {
        status: DealStatus.EXPIRED,
      },
    });

    if (result.count > 0) {
      logger.info({ count: result.count }, 'Expired past deals');
      await this.invalidateCache();
    }

    return result.count;
  }

  /**
   * Create a new deal
   */
  async createDeal(
    businessId: string,
    data: DealCreateInput,
    userId: string
  ): Promise<Deal> {
    // Verify ownership
    await this.verifyBusinessOwnership(businessId, userId);

    // Check active deals limit
    const activeCount = await this.getActiveDealsCount(businessId);
    if (activeCount >= MAX_ACTIVE_DEALS_PER_BUSINESS) {
      throw ApiError.badRequest(
        'MAX_DEALS_REACHED',
        `Maximum of ${MAX_ACTIVE_DEALS_PER_BUSINESS} active deals per business`
      );
    }

    // Create deal
    const deal = await prisma.deals.create({
      data: {
        business_id: businessId,
        title: data.title,
        description: data.description,
        price: data.price ? new Decimal(data.price) : null,
        original_price: data.originalPrice ? new Decimal(data.originalPrice) : null,
        discount_type: data.discountType as DiscountType | undefined,
        discount_value: data.discountValue ? new Decimal(data.discountValue) : null,
        duration: data.duration ?? null,
        voucher_code: data.voucherCode ?? null,
        image: data.image ?? null,
        terms: data.terms ?? null,
        valid_from: new Date(data.validFrom),
        valid_until: new Date(data.validUntil),
        featured: data.featured ?? false,
        status: DealStatus.ACTIVE,
      },
      include: {
        businesses: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
      },
    });

    logger.info({ dealId: deal.id, businessId }, 'Deal created');
    await this.invalidateCache(businessId);

    return formatDealResponse(deal as DealWithBusiness);
  }

  /**
   * Update an existing deal
   */
  async updateDeal(
    businessId: string,
    dealId: string,
    data: DealUpdateInput,
    userId: string
  ): Promise<Deal> {
    // Verify ownership
    await this.verifyBusinessOwnership(businessId, userId);

    // Verify deal exists and belongs to business
    const existingDeal = await prisma.deals.findUnique({
      where: { id: dealId },
    });

    if (!existingDeal) {
      throw ApiError.notFound('DEAL_NOT_FOUND', 'Deal not found');
    }

    if (existingDeal.business_id !== businessId) {
      throw ApiError.forbidden('DEAL_NOT_OWNED', 'Deal does not belong to this business');
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (data.title !== undefined) updateData['title'] = data.title;
    if (data.description !== undefined) updateData['description'] = data.description;
    if (data.price !== undefined) updateData['price'] = data.price ? new Decimal(data.price) : null;
    if (data.originalPrice !== undefined) updateData['original_price'] = data.originalPrice ? new Decimal(data.originalPrice) : null;
    if (data.discountType !== undefined) updateData['discount_type'] = data.discountType as DiscountType | null;
    if (data.discountValue !== undefined) updateData['discount_value'] = data.discountValue ? new Decimal(data.discountValue) : null;
    if (data.duration !== undefined) updateData['duration'] = data.duration;
    if (data.voucherCode !== undefined) updateData['voucher_code'] = data.voucherCode;
    if (data.image !== undefined) updateData['image'] = data.image;
    if (data.terms !== undefined) updateData['terms'] = data.terms;
    if (data.validFrom !== undefined) updateData['valid_from'] = new Date(data.validFrom);
    if (data.validUntil !== undefined) updateData['valid_until'] = new Date(data.validUntil);
    if (data.featured !== undefined) updateData['featured'] = data.featured;
    if (data.status !== undefined) updateData['status'] = data.status as DealStatus;

    const deal = await prisma.deals.update({
      where: { id: dealId },
      data: updateData,
      include: {
        businesses: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
      },
    });

    logger.info({ dealId, businessId }, 'Deal updated');
    await this.invalidateCache(businessId);

    return formatDealResponse(deal as DealWithBusiness);
  }

  /**
   * Delete a deal
   */
  async deleteDeal(businessId: string, dealId: string, userId: string): Promise<void> {
    // Verify ownership
    await this.verifyBusinessOwnership(businessId, userId);

    // Verify deal exists and belongs to business
    const existingDeal = await prisma.deals.findUnique({
      where: { id: dealId },
    });

    if (!existingDeal) {
      throw ApiError.notFound('DEAL_NOT_FOUND', 'Deal not found');
    }

    if (existingDeal.business_id !== businessId) {
      throw ApiError.forbidden('DEAL_NOT_OWNED', 'Deal does not belong to this business');
    }

    await prisma.deals.delete({
      where: { id: dealId },
    });

    logger.info({ dealId, businessId }, 'Deal deleted');
    await this.invalidateCache(businessId);
  }

  /**
   * Get a deal by ID
   */
  async getDealById(dealId: string): Promise<Deal | null> {
    const deal = await prisma.deals.findUnique({
      where: { id: dealId },
      include: {
        businesses: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
      },
    });

    if (!deal) return null;

    return formatDealResponse(deal as DealWithBusiness);
  }

  /**
   * Get deals for a specific business
   */
  async getBusinessDeals(
    businessId: string,
    options: { includeExpired?: boolean } = {}
  ): Promise<Deal[]> {
    const { includeExpired = false } = options;
    const now = new Date();

    const deals = await prisma.deals.findMany({
      where: {
        business_id: businessId,
        ...(includeExpired
          ? {}
          : {
              status: DealStatus.ACTIVE,
              valid_until: { gte: now },
            }),
      },
      include: {
        businesses: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
      },
      orderBy: [
        { featured: 'desc' },
        { valid_until: 'asc' },
      ],
    });

    return deals.map((deal) => formatDealResponse(deal as DealWithBusiness));
  }

  /**
   * Get featured deals
   */
  async getFeaturedDeals(limit: number = 6): Promise<Deal[]> {
    const cacheKey = getCacheKey('featured', String(limit));

    try {
      const redis = getRedis();
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn({ error }, 'Failed to get featured deals from cache');
    }

    const now = new Date();
    const deals = await prisma.deals.findMany({
      where: {
        status: DealStatus.ACTIVE,
        featured: true,
        valid_from: { lte: now },
        valid_until: { gte: now },
      },
      include: {
        businesses: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
      },
      orderBy: [
        { valid_until: 'asc' },
        { created_at: 'desc' },
      ],
      take: limit,
    });

    const formattedDeals = deals.map((deal) => formatDealResponse(deal as DealWithBusiness));

    try {
      const redis = getRedis();
      await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(formattedDeals));
    } catch (error) {
      logger.warn({ error }, 'Failed to cache featured deals');
    }

    return formattedDeals;
  }

  /**
   * Get active deals with pagination and filtering
   */
  async getActiveDeals(filters: DealFilterInput): Promise<PaginatedDeals> {
    const {
      status,
      featured,
      businessId,
      validNow = true,
      page = 1,
      limit = 20,
      sort = 'newest',
    } = filters;

    const now = new Date();

    // Build where clause
    const where: Record<string, unknown> = {};

    if (status) {
      where['status'] = status;
    } else if (validNow) {
      where['status'] = DealStatus.ACTIVE;
      where['valid_from'] = { lte: now };
      where['valid_until'] = { gte: now };
    }

    if (featured !== undefined) {
      where['featured'] = featured;
    }

    if (businessId) {
      where['business_id'] = businessId;
    }

    // Build orderBy
    let orderBy: Record<string, string>[];
    switch (sort) {
      case 'endingSoon':
        orderBy = [{ valid_until: 'asc' }];
        break;
      case 'featured':
        orderBy = [{ featured: 'desc' }, { created_at: 'desc' }];
        break;
      case 'discount':
        orderBy = [{ discount_value: 'desc' }, { created_at: 'desc' }];
        break;
      case 'newest':
      default:
        orderBy = [{ created_at: 'desc' }];
        break;
    }

    // Get total count
    const total = await prisma.deals.count({ where });

    // Get deals
    const deals = await prisma.deals.findMany({
      where,
      include: {
        businesses: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

    const formattedDeals = deals.map((deal) => formatDealResponse(deal as DealWithBusiness));

    const totalPages = Math.ceil(total / limit);

    return {
      deals: formattedDeals,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  }

  /**
   * Increment view count for a deal
   */
  async incrementViews(dealId: string): Promise<void> {
    try {
      await prisma.deals.update({
        where: { id: dealId },
        data: {
          views: { increment: 1 },
        },
      });
    } catch (error) {
      // Don't throw for view count failures
      logger.warn({ dealId, error }, 'Failed to increment deal views');
    }
  }

  /**
   * Increment click count for a deal (modal opened)
   */
  async incrementClicks(dealId: string): Promise<void> {
    try {
      await prisma.deals.update({
        where: { id: dealId },
        data: { clicks: { increment: 1 } },
      });
    } catch (error) {
      logger.warn({ dealId, error }, 'Failed to increment deal clicks');
    }
  }

  /**
   * Increment voucher reveal count for a deal
   */
  async incrementVoucherReveals(dealId: string): Promise<void> {
    try {
      await prisma.deals.update({
        where: { id: dealId },
        data: { voucher_reveals: { increment: 1 } },
      });
    } catch (error) {
      logger.warn({ dealId, error }, 'Failed to increment voucher reveals');
    }
  }

  /**
   * Get promotion stats for a business
   */
  async getPromotionStats(businessId: string): Promise<{
    totalViews: number;
    totalClicks: number;
    totalVoucherReveals: number;
    activeDeals: number;
  }> {
    const aggregates = await prisma.deals.aggregate({
      where: { business_id: businessId },
      _sum: {
        views: true,
        clicks: true,
        voucher_reveals: true,
      },
    });

    const activeCount = await this.getActiveDealsCount(businessId);

    return {
      totalViews: aggregates._sum.views || 0,
      totalClicks: aggregates._sum.clicks || 0,
      totalVoucherReveals: aggregates._sum.voucher_reveals || 0,
      activeDeals: activeCount,
    };
  }

  /**
   * Get active deals count for a business (for limit indicator)
   */
  async getActiveDealsCountForBusiness(businessId: string): Promise<{
    active: number;
    max: number;
  }> {
    const count = await this.getActiveDealsCount(businessId);
    return {
      active: count,
      max: MAX_ACTIVE_DEALS_PER_BUSINESS,
    };
  }
}

// Export singleton instance
export const dealService = new DealService();
