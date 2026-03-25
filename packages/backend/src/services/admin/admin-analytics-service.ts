/**
 * Admin Analytics Service
 *
 * Platform-wide analytics aggregation and CSV export.
 * Spec §25: Analytics & Reporting
 */

import { prisma } from '../../db/index.js';
import { logger } from '../../utils/logger.js';
import { ApiError } from '../../utils/api-error.js';
import { getReadyRedis } from '../../cache/cache-helpers.js';
import type { PlatformAnalyticsResponse } from './admin-types.js';

const CACHE_TTL_ANALYTICS = 300; // 5 minutes

export class AdminAnalyticsService {
  /**
   * Get platform-wide analytics (aggregate across all businesses)
   */
  async getPlatformAnalytics(
    startDate: Date,
    endDate: Date,
    granularity: 'day' | 'week' | 'month' = 'day'
  ): Promise<PlatformAnalyticsResponse> {
    if (startDate > endDate) {
      throw ApiError.badRequest('INVALID_DATE_RANGE', 'Start date must be before end date');
    }

    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 1095) {
      throw ApiError.badRequest('DATE_RANGE_TOO_LARGE', 'Date range cannot exceed 3 years');
    }

    const redis = getReadyRedis();
    const cacheKey = `admin:analytics:${startDate.toISOString()}:${endDate.toISOString()}:${granularity}`;

    if (redis) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) return JSON.parse(cached);
      } catch (e) {
        logger.warn({ error: e }, 'Failed to read admin analytics cache');
      }
    }

    // Aggregate all business analytics
    const [aggregates, topBusinesses, timeseries, dealStats, growth] = await Promise.all([
      // Total aggregates across all businesses
      prisma.business_analytics_daily.aggregate({
        where: { date: { gte: startDate, lte: endDate } },
        _sum: {
          profile_views: true,
          unique_views: true,
          search_appearances: true,
          website_clicks: true,
          phone_clicks: true,
          directions_clicks: true,
          photo_views: true,
          saves: true,
          follows: true,
          reviews: true,
          messages: true,
        },
      }),
      // Top 10 businesses by profile views
      prisma.business_analytics_daily.groupBy({
        by: ['business_id'],
        where: { date: { gte: startDate, lte: endDate } },
        _sum: {
          profile_views: true,
          phone_clicks: true,
          website_clicks: true,
        },
        orderBy: { _sum: { profile_views: 'desc' } },
        take: 10,
      }),
      // Daily timeseries (no business_id filter)
      prisma.business_analytics_daily.groupBy({
        by: ['date'],
        where: { date: { gte: startDate, lte: endDate } },
        _sum: {
          profile_views: true,
          phone_clicks: true,
          website_clicks: true,
          directions_clicks: true,
          search_appearances: true,
        },
        orderBy: { date: 'asc' },
      }),
      // Deal click/reveal totals
      prisma.deals.aggregate({
        where: {
          created_at: { gte: startDate, lte: endDate },
        },
        _sum: { clicks: true, voucher_reveals: true },
      }),
      // Growth metrics
      Promise.all([
        prisma.users.count({ where: { created_at: { gte: startDate, lte: endDate } } }),
        prisma.businesses.count({ where: { created_at: { gte: startDate, lte: endDate } } }),
        prisma.reviews.count({ where: { created_at: { gte: startDate, lte: endDate } } }),
        prisma.events.count({ where: { created_at: { gte: startDate, lte: endDate } } }),
      ]),
    ]);

    // Resolve business names for top businesses
    const businessIds = topBusinesses.map((b) => b.business_id);
    const businesses = businessIds.length > 0
      ? await prisma.businesses.findMany({
          where: { id: { in: businessIds } },
          select: { id: true, name: true, slug: true },
        })
      : [];
    const businessMap = new Map(businesses.map((b) => [b.id, b]));

    const response: PlatformAnalyticsResponse = {
      period: { startDate, endDate, daysInPeriod: daysDiff },
      summary: {
        totalProfileViews: aggregates._sum.profile_views || 0,
        totalUniqueViews: aggregates._sum.unique_views || 0,
        totalSearchAppearances: aggregates._sum.search_appearances || 0,
        totalWebsiteClicks: aggregates._sum.website_clicks || 0,
        totalPhoneClicks: aggregates._sum.phone_clicks || 0,
        totalDirectionsClicks: aggregates._sum.directions_clicks || 0,
        totalPhotoViews: aggregates._sum.photo_views || 0,
        totalSaves: aggregates._sum.saves || 0,
        totalFollows: aggregates._sum.follows || 0,
        totalReviews: aggregates._sum.reviews || 0,
        totalMessages: aggregates._sum.messages || 0,
        totalDealClicks: dealStats._sum.clicks || 0,
        totalVoucherReveals: dealStats._sum.voucher_reveals || 0,
      },
      topBusinesses: topBusinesses.map((tb) => {
        const biz = businessMap.get(tb.business_id);
        return {
          id: tb.business_id,
          name: biz?.name || 'Unknown',
          slug: biz?.slug || '',
          profileViews: tb._sum.profile_views || 0,
          phoneClicks: tb._sum.phone_clicks || 0,
          websiteClicks: tb._sum.website_clicks || 0,
        };
      }),
      timeseries: timeseries.map((day) => ({
        date: day.date instanceof Date ? (day.date.toISOString().split('T')[0] ?? '') : String(day.date),
        profileViews: day._sum.profile_views || 0,
        phoneClicks: day._sum.phone_clicks || 0,
        websiteClicks: day._sum.website_clicks || 0,
        directionsClicks: day._sum.directions_clicks || 0,
        searchAppearances: day._sum.search_appearances || 0,
      })),
      growth: {
        newUsers: growth[0],
        newBusinesses: growth[1],
        newReviews: growth[2],
        newEvents: growth[3],
      },
    };

    if (redis) {
      try {
        await redis.setex(cacheKey, CACHE_TTL_ANALYTICS, JSON.stringify(response));
      } catch (e) {
        logger.warn({ error: e }, 'Failed to cache admin analytics');
      }
    }

    return response;
  }

  /**
   * Export platform analytics as CSV
   */
  async exportPlatformCSV(startDate: Date, endDate: Date): Promise<string> {
    const analytics = await this.getPlatformAnalytics(startDate, endDate);

    const headers = ['Date', 'Profile Views', 'Phone Clicks', 'Website Clicks', 'Directions Clicks', 'Search Appearances'];
    const rows = analytics.timeseries.map((day) => [
      day.date, day.profileViews, day.phoneClicks, day.websiteClicks, day.directionsClicks, day.searchAppearances,
    ]);

    rows.push([]);
    rows.push(['Summary']);
    rows.push(['Total Profile Views', analytics.summary.totalProfileViews]);
    rows.push(['Total Phone Clicks', analytics.summary.totalPhoneClicks]);
    rows.push(['Total Website Clicks', analytics.summary.totalWebsiteClicks]);
    rows.push(['Total Directions Clicks', analytics.summary.totalDirectionsClicks]);
    rows.push(['Total Deal Clicks', analytics.summary.totalDealClicks]);
    rows.push(['Total Voucher Reveals', analytics.summary.totalVoucherReveals]);

    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  }
}
