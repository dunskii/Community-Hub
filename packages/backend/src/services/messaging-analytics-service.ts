/**
 * Messaging Analytics Service
 * Phase 9: Messaging System
 * Spec §16.2: Response Time Tracking
 *
 * Tracks messaging statistics: response time, response rate, volume.
 */

import { prisma } from '../db/index.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/api-error.js';
import { getRedis } from '../cache/redis-client.js';
import type { MessagingStatsQueryInput } from '@community-hub/shared';
import { SenderType, ConversationStatus } from '../generated/prisma/index.js';

// ─── Types ────────────────────────────────────────────────────

export interface MessagingStats {
  totalConversations: number;
  activeConversations: number;
  archivedConversations: number;
  blockedConversations: number;
  totalMessages: number;
  messagesReceived: number;
  messagesSent: number;
  averageResponseTimeMinutes: number | null;
  responseRate: number; // Percentage 0-100
  unreadCount: number;
}

export interface DailyStats {
  date: string;
  conversationsStarted: number;
  messagesReceived: number;
  messagesSent: number;
  averageResponseTimeMinutes: number | null;
}

export interface MessagingAnalytics {
  overview: MessagingStats;
  daily: DailyStats[];
  period: {
    startDate: string;
    endDate: string;
  };
}

// ─── Cache Keys ───────────────────────────────────────────────

const CACHE_PREFIX = 'messaging_stats';
const CACHE_TTL = 300; // 5 minutes

function getCacheKey(businessId: string, ...args: string[]): string {
  return `${CACHE_PREFIX}:${businessId}:${args.join(':')}`;
}

// ─── Service Implementation ───────────────────────────────────

class MessagingAnalyticsService {
  /**
   * Get messaging statistics for a business
   */
  async getMessagingStats(
    businessId: string,
    ownerId: string,
    query: MessagingStatsQueryInput
  ): Promise<MessagingAnalytics> {
    logger.info({ businessId, ownerId }, 'Getting messaging stats');

    // Verify business ownership
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, claimedBy: true },
    });

    if (!business) {
      throw ApiError.notFound('BUSINESS_NOT_FOUND', 'Business not found');
    }

    if (business.claimedBy !== ownerId) {
      throw ApiError.forbidden('NOT_OWNER', 'You do not own this business');
    }

    // Default to last 30 days
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    const startDate = query.startDate
      ? new Date(query.startDate)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get overview stats
    const overview = await this.getOverviewStats(businessId);

    // Get daily stats
    const daily = await this.getDailyStats(businessId, startDate, endDate);

    return {
      overview,
      daily,
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    };
  }

  /**
   * Get overview statistics
   */
  private async getOverviewStats(businessId: string): Promise<MessagingStats> {
    const cacheKey = getCacheKey(businessId, 'overview');
    const redis = getRedis();

    // Try cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Get conversation counts by status
    const conversationCounts = await prisma.conversation.groupBy({
      by: ['status'],
      where: { businessId },
      _count: true,
    });

    const statusCounts: Record<string, number> = {};
    let totalConversations = 0;
    for (const item of conversationCounts) {
      statusCounts[item.status] = item._count;
      totalConversations += item._count;
    }

    // Get message counts
    const messageCounts = await prisma.message.groupBy({
      by: ['senderType'],
      where: {
        conversation: { businessId },
        deletedAt: null,
      },
      _count: true,
    });

    let messagesReceived = 0;
    let messagesSent = 0;
    for (const item of messageCounts) {
      if (item.senderType === SenderType.USER) {
        messagesReceived = item._count;
      } else {
        messagesSent = item._count;
      }
    }

    // Get unread count
    const unreadResult = await prisma.conversation.aggregate({
      where: {
        businessId,
        status: { not: ConversationStatus.BLOCKED },
      },
      _sum: {
        unreadCountBusiness: true,
      },
    });

    // Calculate response rate and average response time
    const responseMetrics = await this.calculateResponseMetrics(businessId);

    const stats: MessagingStats = {
      totalConversations,
      activeConversations: statusCounts[ConversationStatus.ACTIVE] || 0,
      archivedConversations: statusCounts[ConversationStatus.ARCHIVED] || 0,
      blockedConversations: statusCounts[ConversationStatus.BLOCKED] || 0,
      totalMessages: messagesReceived + messagesSent,
      messagesReceived,
      messagesSent,
      averageResponseTimeMinutes: responseMetrics.averageResponseTimeMinutes,
      responseRate: responseMetrics.responseRate,
      unreadCount: unreadResult._sum.unreadCountBusiness || 0,
    };

    // Cache for 5 minutes
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(stats));

    return stats;
  }

  /**
   * Calculate response rate and average response time
   */
  private async calculateResponseMetrics(
    businessId: string
  ): Promise<{ averageResponseTimeMinutes: number | null; responseRate: number }> {
    // Get all conversations with at least one user message
    const conversations = await prisma.conversation.findMany({
      where: {
        businessId,
        messages: {
          some: {
            senderType: SenderType.USER,
            deletedAt: null,
          },
        },
      },
      include: {
        messages: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            senderType: true,
            createdAt: true,
          },
        },
      },
    });

    if (conversations.length === 0) {
      return { averageResponseTimeMinutes: null, responseRate: 0 };
    }

    let conversationsWithResponse = 0;
    const responseTimes: number[] = [];

    for (const conv of conversations) {
      // Find first user message and first business response after it
      let firstUserMessageTime: Date | null = null;
      let firstBusinessResponseTime: Date | null = null;

      for (const msg of conv.messages) {
        if (msg.senderType === SenderType.USER && !firstUserMessageTime) {
          firstUserMessageTime = msg.createdAt;
        } else if (
          msg.senderType === SenderType.BUSINESS &&
          firstUserMessageTime &&
          !firstBusinessResponseTime
        ) {
          firstBusinessResponseTime = msg.createdAt;
          break;
        }
      }

      if (firstBusinessResponseTime && firstUserMessageTime) {
        conversationsWithResponse++;
        const responseTime =
          (firstBusinessResponseTime.getTime() - firstUserMessageTime.getTime()) / (1000 * 60);
        responseTimes.push(responseTime);
      }
    }

    const responseRate =
      conversations.length > 0
        ? Math.round((conversationsWithResponse / conversations.length) * 100)
        : 0;

    const averageResponseTimeMinutes =
      responseTimes.length > 0
        ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
        : null;

    return { averageResponseTimeMinutes, responseRate };
  }

  /**
   * Get daily statistics for a date range
   */
  private async getDailyStats(
    businessId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DailyStats[]> {
    // Get conversations started per day
    const conversationsPerDay = await prisma.$queryRaw<
      { date: Date; count: bigint }[]
    >`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM conversations
      WHERE business_id = ${businessId}
        AND created_at >= ${startDate}
        AND created_at <= ${endDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    // Get messages per day
    const messagesPerDay = await prisma.$queryRaw<
      { date: Date; sender_type: SenderType; count: bigint }[]
    >`
      SELECT DATE(m.created_at) as date, m.sender_type, COUNT(*) as count
      FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE c.business_id = ${businessId}
        AND m.created_at >= ${startDate}
        AND m.created_at <= ${endDate}
        AND m.deleted_at IS NULL
      GROUP BY DATE(m.created_at), m.sender_type
      ORDER BY date ASC
    `;

    // Build daily stats
    const dailyMap = new Map<string, DailyStats>();

    // Initialize all days in range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0] ?? '';
      dailyMap.set(dateStr, {
        date: dateStr,
        conversationsStarted: 0,
        messagesReceived: 0,
        messagesSent: 0,
        averageResponseTimeMinutes: null,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Fill in conversation counts
    for (const row of conversationsPerDay) {
      const dateStr = row.date.toISOString().split('T')[0] ?? '';
      const stats = dailyMap.get(dateStr);
      if (stats) {
        stats.conversationsStarted = Number(row.count);
      }
    }

    // Fill in message counts
    for (const row of messagesPerDay) {
      const dateStr = row.date.toISOString().split('T')[0] ?? '';
      const stats = dailyMap.get(dateStr);
      if (stats) {
        if (row.sender_type === SenderType.USER) {
          stats.messagesReceived = Number(row.count);
        } else {
          stats.messagesSent = Number(row.count);
        }
      }
    }

    return Array.from(dailyMap.values());
  }

  /**
   * Track a message sent event (updates analytics daily table)
   */
  async trackMessageSent(conversationId: string, _senderType: SenderType): Promise<void> {
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { businessId: true },
      });

      if (!conversation) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Update or create daily analytics record
      await prisma.businessAnalyticsDaily.upsert({
        where: {
          businessId_date: {
            businessId: conversation.businessId,
            date: today,
          },
        },
        update: {
          messages: { increment: 1 },
        },
        create: {
          businessId: conversation.businessId,
          date: today,
          messages: 1,
        },
      });

      // Invalidate cache
      const redis = getRedis();
      await redis.del(getCacheKey(conversation.businessId, 'overview'));
    } catch (error) {
      logger.error({ conversationId, error }, 'Failed to track message sent');
    }
  }
}

export const messagingAnalyticsService = new MessagingAnalyticsService();
