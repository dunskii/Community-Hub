/**
 * Admin Dashboard Service
 *
 * Dashboard overview with key metrics and recent activity.
 * Spec §23: Administration & Moderation
 */

import { prisma } from '../../db/index.js';
import { logger } from '../../utils/logger.js';
import { getReadyRedis } from '../../cache/cache-helpers.js';
import { UserStatus, BusinessStatus, EventStatus, ReviewStatus } from '../../generated/prisma/index.js';
import { resolveActivityTargets } from './admin-helpers.js';
import type { DashboardOverview } from './admin-types.js';

const CACHE_TTL_OVERVIEW = 60; // 1 minute

export class AdminDashboardService {
  /**
   * Get dashboard overview with key metrics
   */
  async getDashboardOverview(): Promise<DashboardOverview> {
    const redis = getReadyRedis();
    const cacheKey = 'admin:dashboard:overview';

    if (redis) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) return JSON.parse(cached);
      } catch (e) {
        logger.warn({ error: e }, 'Failed to read admin dashboard cache');
      }
    }

    const [
      activeUsers,
      totalUsers,
      newRegistrations,
      pendingBusinesses,
      pendingReviews,
      pendingEvents,
      pendingClaims,
      activeBusinesses,
      totalBusinesses,
      upcomingEvents,
      totalDeals,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.users.count({ where: { status: UserStatus.ACTIVE } }),
      prisma.users.count(),
      prisma.users.count({
        where: {
          created_at: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.businesses.count({ where: { status: BusinessStatus.PENDING } }),
      prisma.reviews.count({ where: { status: ReviewStatus.PENDING } }),
      prisma.events.count({ where: { status: EventStatus.PENDING } }),
      prisma.business_claim_requests.count({ where: { claim_status: 'PENDING' } }),
      prisma.businesses.count({ where: { status: BusinessStatus.ACTIVE } }),
      prisma.businesses.count(),
      prisma.events.count({
        where: { status: EventStatus.ACTIVE, start_time: { gte: new Date() } },
      }),
      prisma.deals.count({ where: { status: 'ACTIVE' } }),
      prisma.audit_logs.findMany({
        orderBy: { created_at: 'desc' },
        take: 10,
        select: {
          id: true,
          action: true,
          target_type: true,
          target_id: true,
          actor_role: true,
          actor_id: true,
          created_at: true,
          users: { select: { display_name: true } },
        },
      }),
    ]);

    // Resolve target names for recent activity
    const resolvedActivity = await resolveActivityTargets(recentAuditLogs);

    const overview: DashboardOverview = {
      activeUsers,
      totalUsers,
      newRegistrations,
      pendingApprovals: {
        businesses: pendingBusinesses,
        reviews: pendingReviews,
        events: pendingEvents,
        claims: pendingClaims,
        total: pendingBusinesses + pendingReviews + pendingEvents + pendingClaims,
      },
      activeBusinesses,
      totalBusinesses,
      upcomingEvents,
      totalDeals,
      recentActivity: resolvedActivity,
    };

    if (redis) {
      try {
        await redis.setex(cacheKey, CACHE_TTL_OVERVIEW, JSON.stringify(overview));
      } catch (e) {
        logger.warn({ error: e }, 'Failed to cache admin dashboard overview');
      }
    }

    return overview;
  }
}
