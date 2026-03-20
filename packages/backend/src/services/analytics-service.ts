/**
 * Analytics Service
 *
 * Handles business analytics event tracking, aggregation, and reporting.
 * Spec §13.4: Business Analytics
 */

import { prisma } from '../db/index.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/api-error.js';
import { getRedis } from '../cache/redis-client.js';
import { AnalyticsEventType, ReviewStatus } from '../generated/prisma/index.js';
import crypto from 'crypto';

// ─── Types ──────────────────────────────────────────────────

export interface TrackEventInput {
  businessId: string;
  eventType: AnalyticsEventType;
  userId?: string;
  sessionId?: string;
  referralSource?: 'search' | 'homepage' | 'saved_list' | 'direct' | 'external';
  searchTerm?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export interface AnalyticsQueryOptions {
  startDate: Date;
  endDate: Date;
  granularity?: 'day' | 'week' | 'month';
}

export interface MetricSummary {
  current: number;
  previous: number;
  changePercent: number;
  trend: 'up' | 'down' | 'flat';
}

export interface AnalyticsResponse {
  businessId: string;
  businessName: string;
  period: {
    startDate: Date;
    endDate: Date;
    previousStart: Date;
    previousEnd: Date;
    daysInPeriod: number;
  };
  summary: {
    profileViews: MetricSummary;
    uniqueViews: MetricSummary;
    searchAppearances: MetricSummary;
    clicks: {
      website: MetricSummary;
      phone: MetricSummary;
      directions: MetricSummary;
      total: MetricSummary;
    };
    photoViews: MetricSummary;
    saves: MetricSummary;
    follows: MetricSummary;
    reviews: {
      count: MetricSummary;
      averageRating: number;
      newReviews: number;
    };
  };
  timeseries: Array<{
    date: string;
    profileViews: number;
    uniqueViews: number;
    searchAppearances: number;
    websiteClicks: number;
    phoneClicks: number;
    directionsClicks: number;
    photoViews: number;
    saves: number;
    follows: number;
    reviews: number;
  }>;
  insights: {
    topSearchTerms: Array<{ term: string; count: number }>;
    referralSources: Array<{ source: string; count: number; percentage: number }>;
    peakActivityTimes: Array<{ dayOfWeek: string; hour: number; count: number }>;
  };
}

// ─── Constants ──────────────────────────────────────────────

const CACHE_TTL_SECONDS = 300; // 5 minutes
const MAX_DATE_RANGE_DAYS = 1095; // 3 years
const IP_HASH_RETENTION_DAYS = 90;

// ─── Helper Functions ───────────────────────────────────────

/**
 * Get Redis client with fallback
 * Returns null if Redis is not available or not connected
 */
function getRedisClient() {
  try {
    const redis = getRedis();
    // Check if connection is actually open
    if (redis.status !== 'ready') {
      return null;
    }
    return redis;
  } catch {
    logger.warn('Redis not available for analytics caching');
    return null;
  }
}

/**
 * Hash IP address for privacy
 */
function hashIPAddress(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16);
}

/**
 * Calculate previous period dates for comparison
 */
function getPreviousPeriod(startDate: Date, endDate: Date): { start: Date; end: Date } {
  const durationMs = endDate.getTime() - startDate.getTime();
  const previousEnd = new Date(startDate.getTime() - 1); // Day before start
  const previousStart = new Date(previousEnd.getTime() - durationMs);
  return { start: previousStart, end: previousEnd };
}

/**
 * Calculate metric summary with trend
 */
function calculateMetricSummary(current: number, previous: number): MetricSummary {
  const changePercent = previous === 0 ? (current > 0 ? 100 : 0) : ((current - previous) / previous) * 100;
  const trend: 'up' | 'down' | 'flat' = changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : 'flat';

  return {
    current,
    previous,
    changePercent: Math.round(changePercent * 10) / 10,
    trend,
  };
}

/**
 * Get day of week name
 */
function getDayOfWeek(dayIndex: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayIndex] || 'Unknown';
}

// ─── Analytics Service Class ────────────────────────────────

export class AnalyticsService {
  /**
   * Track an analytics event
   */
  async trackEvent(data: TrackEventInput): Promise<void> {
    try {
      // Hash IP address for privacy
      const ipAddressHash = data.ipAddress ? hashIPAddress(data.ipAddress) : null;

      // Generate session ID if not provided (for unique view tracking)
      const sessionId = data.sessionId || (data.ipAddress ? hashIPAddress(data.ipAddress + new Date().toDateString()) : null);

      await prisma.business_analytics_events.create({
        data: {
          id: crypto.randomUUID(),
          business_id: data.businessId,
          event_type: data.eventType,
          user_id: data.userId,
          session_id: sessionId,
          referral_source: data.referralSource,
          search_term: data.searchTerm,
          ip_address_hash: ipAddressHash,
          user_agent: data.userAgent?.substring(0, 500),
          metadata: data.metadata as object | undefined,
        },
      });

      // Update daily aggregates asynchronously
      this.updateDailyAggregates(data.businessId, data.eventType).catch((error) => {
        logger.error({ error, businessId: data.businessId }, 'Failed to update daily aggregates');
      });

      // Invalidate cache
      const redis = getRedisClient();
      if (redis) {
        const cacheKeyPattern = `analytics:${data.businessId}:*`;
        // Note: In production, use SCAN instead of KEYS
        try {
          const keys = await redis.keys(cacheKeyPattern);
          if (keys.length > 0) {
            await redis.del(...keys);
          }
        } catch (error) {
          logger.warn({ error }, 'Failed to invalidate analytics cache');
        }
      }
    } catch (error) {
      logger.error({ error, data }, 'Failed to track analytics event');
      // Don't throw - analytics should not break user experience
    }
  }

  /**
   * Update daily aggregates
   */
  private async updateDailyAggregates(businessId: string, eventType: AnalyticsEventType): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Map event type to field
    const fieldMap: Record<AnalyticsEventType, string> = {
      PROFILE_VIEW: 'profileViews',
      SEARCH_APPEARANCE: 'searchAppearances',
      WEBSITE_CLICK: 'websiteClicks',
      PHONE_CLICK: 'phoneClicks',
      DIRECTIONS_CLICK: 'directionsClicks',
      PHOTO_VIEW: 'photoViews',
      SAVE: 'saves',
      UNSAVE: 'saves', // Decrement handled separately
      FOLLOW: 'follows',
      UNFOLLOW: 'follows', // Decrement handled separately
      REVIEW_CREATED: 'reviews',
      MESSAGE_SENT: 'messages',
    };

    const field = fieldMap[eventType];
    if (!field) return;

    // For UNSAVE/UNFOLLOW, we should decrement, but for simplicity we track net
    // In production, consider tracking separately or using signed values

    await prisma.business_analytics_daily.upsert({
      where: {
        business_id_date: {
          business_id: businessId,
          date: today,
        },
      },
      create: {
        id: crypto.randomUUID(),
        business_id: businessId,
        date: today,
        [field]: 1,
      },
      update: {
        [field]: {
          increment: eventType === 'UNSAVE' || eventType === 'UNFOLLOW' ? -1 : 1,
        },
      },
    });

    // Update unique views for PROFILE_VIEW
    if (eventType === 'PROFILE_VIEW') {
      // Count unique sessions for today
      const uniqueCount = await prisma.business_analytics_events.groupBy({
        by: ['session_id'],
        where: {
          business_id: businessId,
          event_type: 'PROFILE_VIEW',
          event_date: {
            gte: today,
            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          },
          session_id: { not: null },
        },
      });

      await prisma.business_analytics_daily.update({
        where: {
          business_id_date: {
            business_id: businessId,
            date: today,
          },
        },
        data: {
          unique_views: uniqueCount.length,
        },
      });
    }
  }

  /**
   * Get business analytics for date range
   */
  async getAnalytics(
    businessId: string,
    options: AnalyticsQueryOptions
  ): Promise<AnalyticsResponse> {
    // Validate date range
    const daysDiff = Math.ceil((options.endDate.getTime() - options.startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > MAX_DATE_RANGE_DAYS) {
      throw ApiError.badRequest('DATE_RANGE_TOO_LARGE', `Date range cannot exceed ${MAX_DATE_RANGE_DAYS} days`);
    }

    if (options.startDate > options.endDate) {
      throw ApiError.badRequest('INVALID_DATE_RANGE', 'Start date must be before end date');
    }

    // Check cache
    const redis = getRedisClient();
    const cacheKey = `analytics:${businessId}:${options.startDate.toISOString()}:${options.endDate.toISOString()}`;

    if (redis) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (cacheError) {
        logger.warn({ error: cacheError }, 'Failed to read analytics from cache');
      }
    }

    // Get business info
    const business = await prisma.businesses.findUnique({
      where: { id: businessId },
      select: { id: true, name: true },
    });

    if (!business) {
      throw ApiError.notFound('BUSINESS_NOT_FOUND', 'Business not found');
    }

    // Calculate previous period
    const previousPeriod = getPreviousPeriod(options.startDate, options.endDate);

    // Get current period aggregates
    const currentAggregates = await this.getAggregatedMetrics(businessId, options.startDate, options.endDate);

    // Get previous period aggregates
    const previousAggregates = await this.getAggregatedMetrics(businessId, previousPeriod.start, previousPeriod.end);

    // Get timeseries data
    const timeseries = await this.getTimeseriesData(businessId, options.startDate, options.endDate, options.granularity);

    // Get insights
    const insights = await this.getInsights(businessId, options.startDate, options.endDate);

    // Get review stats
    const reviewStats = await this.getReviewStats(businessId, options.startDate, options.endDate);

    const response: AnalyticsResponse = {
      businessId,
      businessName: business.name,
      period: {
        startDate: options.startDate,
        endDate: options.endDate,
        previousStart: previousPeriod.start,
        previousEnd: previousPeriod.end,
        daysInPeriod: daysDiff,
      },
      summary: {
        profileViews: calculateMetricSummary(currentAggregates.profileViews, previousAggregates.profileViews),
        uniqueViews: calculateMetricSummary(currentAggregates.uniqueViews, previousAggregates.uniqueViews),
        searchAppearances: calculateMetricSummary(currentAggregates.searchAppearances, previousAggregates.searchAppearances),
        clicks: {
          website: calculateMetricSummary(currentAggregates.websiteClicks, previousAggregates.websiteClicks),
          phone: calculateMetricSummary(currentAggregates.phoneClicks, previousAggregates.phoneClicks),
          directions: calculateMetricSummary(currentAggregates.directionsClicks, previousAggregates.directionsClicks),
          total: calculateMetricSummary(
            currentAggregates.websiteClicks + currentAggregates.phoneClicks + currentAggregates.directionsClicks,
            previousAggregates.websiteClicks + previousAggregates.phoneClicks + previousAggregates.directionsClicks
          ),
        },
        photoViews: calculateMetricSummary(currentAggregates.photoViews, previousAggregates.photoViews),
        saves: calculateMetricSummary(currentAggregates.saves, previousAggregates.saves),
        follows: calculateMetricSummary(currentAggregates.follows, previousAggregates.follows),
        reviews: {
          count: calculateMetricSummary(currentAggregates.reviews, previousAggregates.reviews),
          averageRating: reviewStats.averageRating,
          newReviews: reviewStats.newReviews,
        },
      },
      timeseries,
      insights,
    };

    // Cache response
    if (redis) {
      try {
        await redis.setex(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(response));
      } catch (cacheError) {
        logger.warn({ error: cacheError }, 'Failed to cache analytics response');
      }
    }

    return response;
  }

  /**
   * Get aggregated metrics for a period
   */
  private async getAggregatedMetrics(
    businessId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    profileViews: number;
    uniqueViews: number;
    searchAppearances: number;
    websiteClicks: number;
    phoneClicks: number;
    directionsClicks: number;
    photoViews: number;
    saves: number;
    follows: number;
    reviews: number;
    messages: number;
  }> {
    const aggregates = await prisma.business_analytics_daily.aggregate({
      where: {
        business_id: businessId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
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
    });

    return {
      profileViews: aggregates._sum.profile_views || 0,
      uniqueViews: aggregates._sum.unique_views || 0,
      searchAppearances: aggregates._sum.search_appearances || 0,
      websiteClicks: aggregates._sum.website_clicks || 0,
      phoneClicks: aggregates._sum.phone_clicks || 0,
      directionsClicks: aggregates._sum.directions_clicks || 0,
      photoViews: aggregates._sum.photo_views || 0,
      saves: aggregates._sum.saves || 0,
      follows: aggregates._sum.follows || 0,
      reviews: aggregates._sum.reviews || 0,
      messages: aggregates._sum.messages || 0,
    };
  }

  /**
   * Get timeseries data
   */
  private async getTimeseriesData(
    businessId: string,
    startDate: Date,
    endDate: Date,
    _granularity?: 'day' | 'week' | 'month'
  ): Promise<AnalyticsResponse['timeseries']> {
    const dailyData = await prisma.business_analytics_daily.findMany({
      where: {
        business_id: businessId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    // For now, return daily data
    // TODO: Implement week/month aggregation based on _granularity
    return dailyData.map((day: { date: Date; profile_views: number; unique_views: number; search_appearances: number; website_clicks: number; phone_clicks: number; directions_clicks: number; photo_views: number; saves: number; follows: number; reviews: number }) => ({
      date: day.date.toISOString().split('T')[0] ?? '',
      profileViews: day.profile_views,
      uniqueViews: day.unique_views,
      searchAppearances: day.search_appearances,
      websiteClicks: day.website_clicks,
      phoneClicks: day.phone_clicks,
      directionsClicks: day.directions_clicks,
      photoViews: day.photo_views,
      saves: day.saves,
      follows: day.follows,
      reviews: day.reviews,
    }));
  }

  /**
   * Get analytics insights
   */
  private async getInsights(
    businessId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AnalyticsResponse['insights']> {
    // Top search terms
    const searchTerms = await prisma.business_analytics_events.groupBy({
      by: ['search_term'],
      where: {
        business_id: businessId,
        event_type: 'SEARCH_APPEARANCE',
        search_term: { not: null },
        event_date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: { search_term: true },
      orderBy: { _count: { search_term: 'desc' } },
      take: 10,
    });

    // Referral sources
    const referrals = await prisma.business_analytics_events.groupBy({
      by: ['referral_source'],
      where: {
        business_id: businessId,
        event_type: 'PROFILE_VIEW',
        referral_source: { not: null },
        event_date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: { referral_source: true },
      orderBy: { _count: { referral_source: 'desc' } },
    });

    const totalReferrals = referrals.reduce((sum: number, r: { _count: { referral_source: number } }) => sum + r._count.referral_source, 0);

    // Peak activity times (by hour and day of week)
    const events = await prisma.business_analytics_events.findMany({
      where: {
        business_id: businessId,
        event_type: 'PROFILE_VIEW',
        event_date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: { event_date: true },
    });

    // Aggregate by day and hour
    const activityMap = new Map<string, number>();
    for (const event of events) {
      const date = new Date(event.event_date);
      const key = `${date.getDay()}-${date.getHours()}`;
      activityMap.set(key, (activityMap.get(key) || 0) + 1);
    }

    const peakTimes = Array.from(activityMap.entries())
      .map(([key, count]) => {
        const parts = key.split('-');
        const dayIndex = Number(parts[0]);
        const hour = Number(parts[1]);
        return {
          dayOfWeek: getDayOfWeek(dayIndex),
          hour,
          count,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      topSearchTerms: searchTerms.map((t: { search_term: string | null; _count: { search_term: number } }) => ({
        term: t.search_term!,
        count: t._count.search_term,
      })),
      referralSources: referrals.map((r: { referral_source: string | null; _count: { referral_source: number } }) => ({
        source: r.referral_source!,
        count: r._count.referral_source,
        percentage: totalReferrals > 0 ? Math.round((r._count.referral_source / totalReferrals) * 100) : 0,
      })),
      peakActivityTimes: peakTimes,
    };
  }

  /**
   * Get review statistics
   */
  private async getReviewStats(
    businessId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ averageRating: number; newReviews: number }> {
    const reviews = await prisma.reviews.aggregate({
      where: {
        business_id: businessId,
        status: ReviewStatus.PUBLISHED,
      },
      _avg: { rating: true },
    });

    const newReviews = await prisma.reviews.count({
      where: {
        business_id: businessId,
        status: ReviewStatus.PUBLISHED,
        created_at: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    return {
      averageRating: Math.round((reviews._avg.rating || 0) * 10) / 10,
      newReviews,
    };
  }

  /**
   * Export analytics to CSV
   */
  async exportCSV(businessId: string, startDate: Date, endDate: Date): Promise<string> {
    const analytics = await this.getAnalytics(businessId, { startDate, endDate });

    // Build CSV content
    const headers = [
      'Date',
      'Profile Views',
      'Unique Views',
      'Search Appearances',
      'Website Clicks',
      'Phone Clicks',
      'Directions Clicks',
      'Photo Views',
      'Saves',
      'Follows',
      'Reviews',
    ];

    const rows = analytics.timeseries.map((day) => [
      day.date,
      day.profileViews,
      day.uniqueViews,
      day.searchAppearances,
      day.websiteClicks,
      day.phoneClicks,
      day.directionsClicks,
      day.photoViews,
      day.saves,
      day.follows,
      day.reviews,
    ]);

    // Add summary row
    rows.push([]);
    rows.push(['Summary']);
    rows.push(['Metric', 'Current Period', 'Previous Period', 'Change %']);
    rows.push(['Profile Views', analytics.summary.profileViews.current, analytics.summary.profileViews.previous, `${analytics.summary.profileViews.changePercent}%`]);
    rows.push(['Search Appearances', analytics.summary.searchAppearances.current, analytics.summary.searchAppearances.previous, `${analytics.summary.searchAppearances.changePercent}%`]);
    rows.push(['Website Clicks', analytics.summary.clicks.website.current, analytics.summary.clicks.website.previous, `${analytics.summary.clicks.website.changePercent}%`]);
    rows.push(['Phone Clicks', analytics.summary.clicks.phone.current, analytics.summary.clicks.phone.previous, `${analytics.summary.clicks.phone.changePercent}%`]);
    rows.push(['Directions Clicks', analytics.summary.clicks.directions.current, analytics.summary.clicks.directions.previous, `${analytics.summary.clicks.directions.changePercent}%`]);

    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    return csv;
  }

  /**
   * Track profile view with deduplication
   */
  async trackProfileView(
    businessId: string,
    userId?: string,
    sessionId?: string,
    referralSource?: 'search' | 'homepage' | 'saved_list' | 'direct' | 'external',
    searchTerm?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    // Check if this session already viewed today (simple deduplication)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const effectiveSessionId = sessionId || (ipAddress ? hashIPAddress(ipAddress + today.toDateString()) : null);

    if (effectiveSessionId) {
      const existingView = await prisma.business_analytics_events.findFirst({
        where: {
          business_id: businessId,
          event_type: 'PROFILE_VIEW',
          session_id: effectiveSessionId,
          event_date: {
            gte: today,
          },
        },
      });

      if (existingView) {
        // Already viewed today, don't count again
        return;
      }
    }

    await this.trackEvent({
      businessId,
      eventType: 'PROFILE_VIEW',
      userId,
      sessionId: effectiveSessionId || undefined,
      referralSource,
      searchTerm,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Clean up old IP hashes for privacy compliance
   */
  async cleanupOldIPHashes(): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - IP_HASH_RETENTION_DAYS);

    const result = await prisma.business_analytics_events.updateMany({
      where: {
        event_date: { lt: cutoffDate },
        ip_address_hash: { not: null },
      },
      data: {
        ip_address_hash: null,
      },
    });

    logger.info(`Cleaned up ${result.count} IP hashes older than ${IP_HASH_RETENTION_DAYS} days`);
    return result.count;
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
