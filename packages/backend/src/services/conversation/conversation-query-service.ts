/**
 * Conversation Query Service
 * Phase 9: Messaging System — Read operations
 *
 * All read / query operations on conversations.  getBusinessConversations()
 * and getBusinessInbox() have been deduplicated into a single
 * getBusinessConversations() implementation.
 */

import { prisma } from '../../db/index.js';
import { ApiError } from '../../utils/api-error.js';
import { getRedis } from '../../cache/redis-client.js';
import { ConversationStatus } from '../../generated/prisma/index.js';
import type {
  ConversationFilterInput,
  BusinessInboxFilterInput,
} from '@community-hub/shared';
import { getCacheKey, CACHE_TTL } from './conversation-cache.js';
import {
  mapConversationSummary,
  mapConversationWithMessages,
} from './conversation-mappers.js';
import type { RawConversationSummary, RawConversationWithMessages } from './conversation-mappers.js';
import type {
  ConversationWithMessages,
  PaginatedConversations,
} from './conversation-types.js';

// ─── Prisma include fragments (shared between queries) ──────

const SUMMARY_INCLUDE = {
  businesses: {
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
    },
  },
  users: {
    select: {
      id: true,
      display_name: true,
      profile_photo: true,
    },
  },
  messages: {
    where: { deleted_at: null },
    orderBy: { created_at: 'desc' as const },
    take: 1,
    select: { content: true },
  },
};

const DETAIL_INCLUDE = {
  businesses: {
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      email: true,
      phone: true,
      claimed_by: true,
    },
  },
  users: {
    select: {
      id: true,
      display_name: true,
      profile_photo: true,
    },
  },
  messages: {
    where: { deleted_at: null },
    orderBy: { created_at: 'asc' as const },
    include: {
      message_attachments: {
        select: {
          id: true,
          url: true,
          alt_text: true,
          size_bytes: true,
          mime_type: true,
        },
      },
    },
  },
};

// ─── Service ─────────────────────────────────────────────────

export class ConversationQueryService {
  /**
   * Get conversation by ID with messages
   */
  async getConversationById(
    conversationId: string,
    userId: string,
    isBusinessOwner: boolean = false
  ): Promise<ConversationWithMessages> {
    const conversation = await prisma.conversations.findUnique({
      where: { id: conversationId },
      include: DETAIL_INCLUDE,
    });

    if (!conversation) {
      throw ApiError.notFound('CONVERSATION_NOT_FOUND', 'Conversation not found');
    }

    // Check authorization
    const isParticipant = conversation.user_id === userId;
    const isOwner = conversation.businesses.claimed_by === userId;

    if (!isParticipant && !isOwner && !isBusinessOwner) {
      throw ApiError.forbidden('NOT_AUTHORIZED', 'You are not authorized to view this conversation');
    }

    return mapConversationWithMessages(conversation as unknown as RawConversationWithMessages);
  }

  /**
   * Get user's conversations
   */
  async getUserConversations(
    userId: string,
    filters: ConversationFilterInput
  ): Promise<PaginatedConversations> {
    const { status, search, page, limit } = filters;

    // Build where clause
    const where: Record<string, unknown> = { user_id: userId };

    if (status === 'active') {
      where.status = ConversationStatus.ACTIVE;
    } else if (status === 'archived') {
      where.status = ConversationStatus.ARCHIVED;
    }
    // 'all' means no status filter

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { businesses: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const total = await prisma.conversations.count({ where });

    const conversations = await prisma.conversations.findMany({
      where,
      orderBy: { last_message_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: SUMMARY_INCLUDE,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      conversations: (conversations as unknown as RawConversationSummary[]).map(
        (conv) => mapConversationSummary(conv, 'user')
      ),
      pagination: { page, limit, total, totalPages, hasMore: page < totalPages },
    };
  }

  /**
   * Get business inbox conversations.
   *
   * This is the unified implementation that backs both the old
   * `getBusinessConversations` and `getBusinessInbox` methods — they were
   * nearly identical (~120 lines each).  The only material difference was
   * that `getBusinessConversations` selected extra business fields in its
   * ownership check, but those are not used for the list query itself.
   */
  async getBusinessConversations(
    businessId: string,
    ownerId: string,
    filters: BusinessInboxFilterInput | {
      status?: 'active' | 'archived' | 'blocked' | 'all';
      unreadOnly?: boolean;
      search?: string;
      page: number;
      limit: number;
    }
  ): Promise<PaginatedConversations> {
    // Verify business ownership
    const business = await prisma.businesses.findUnique({
      where: { id: businessId },
      select: { id: true, claimed_by: true },
    });

    if (!business) {
      throw ApiError.notFound('BUSINESS_NOT_FOUND', 'Business not found');
    }

    if (business.claimed_by !== ownerId) {
      throw ApiError.forbidden('NOT_OWNER', 'You do not own this business');
    }

    const { status, search, page, limit } = filters;
    const unreadOnly = 'unreadOnly' in filters ? filters.unreadOnly : undefined;

    // Build where clause
    const where: Record<string, unknown> = { business_id: businessId };

    if (status === 'active') {
      where.status = ConversationStatus.ACTIVE;
    } else if (status === 'archived') {
      where.status = ConversationStatus.ARCHIVED;
    } else if (status === 'blocked') {
      where.status = ConversationStatus.BLOCKED;
    }
    // 'all' means no status filter

    if (unreadOnly) {
      where.unread_count_business = { gt: 0 };
    }

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { users: { display_name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const total = await prisma.conversations.count({ where });

    const conversations = await prisma.conversations.findMany({
      where,
      orderBy: { last_message_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: SUMMARY_INCLUDE,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      conversations: (conversations as unknown as RawConversationSummary[]).map(
        (conv) => mapConversationSummary(conv, 'business')
      ),
      pagination: { page, limit, total, totalPages, hasMore: page < totalPages },
    };
  }

  /**
   * Alias preserved for backward compatibility — delegates to getBusinessConversations.
   */
  async getBusinessInbox(
    businessId: string,
    ownerId: string,
    filters: {
      status?: 'active' | 'archived' | 'blocked' | 'all';
      unreadOnly?: boolean;
      search?: string;
      page: number;
      limit: number;
    }
  ): Promise<PaginatedConversations> {
    return this.getBusinessConversations(businessId, ownerId, filters);
  }

  /**
   * Get unread count for business inbox
   */
  async getBusinessUnreadCount(businessId: string, ownerId: string): Promise<number> {
    // Verify business ownership
    const business = await prisma.businesses.findUnique({
      where: { id: businessId },
      select: { id: true, claimed_by: true },
    });

    if (!business) {
      throw ApiError.notFound('BUSINESS_NOT_FOUND', 'Business not found');
    }

    if (business.claimed_by !== ownerId) {
      throw ApiError.forbidden('NOT_OWNER', 'You do not own this business');
    }

    const cacheKey = getCacheKey('business_unread', businessId);
    const redis = getRedis();

    // Try cache first
    const cached = await redis.get(cacheKey);
    if (cached !== null) {
      return Number(cached);
    }

    // Count unread conversations
    const result = await prisma.conversations.aggregate({
      where: {
        business_id: businessId,
        status: { not: ConversationStatus.BLOCKED },
      },
      _sum: {
        unread_count_business: true,
      },
    });

    const count = result._sum.unread_count_business ?? 0;

    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, count.toString());

    return count;
  }

  /**
   * Get unread count for user
   */
  async getUnreadCount(userId: string): Promise<number> {
    const cacheKey = getCacheKey('unread', userId);
    const redis = getRedis();

    // Try cache first
    const cached = await redis.get(cacheKey);
    if (cached !== null) {
      return parseInt(cached, 10);
    }

    // Count unread conversations
    const result = await prisma.conversations.aggregate({
      where: {
        user_id: userId,
        status: { not: ConversationStatus.BLOCKED },
        unread_count_user: { gt: 0 },
      },
      _sum: {
        unread_count_user: true,
      },
    });

    const count = result._sum.unread_count_user || 0;

    // Cache for 5 minutes
    await redis.setex(cacheKey, CACHE_TTL, count.toString());

    return count;
  }
}

export const conversationQueryService = new ConversationQueryService();
