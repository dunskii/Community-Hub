/**
 * Conversation Service
 * Phase 9: Messaging System
 * Spec §16: Messaging & Communication System
 *
 * Handles conversation CRUD operations, archiving, blocking, and reporting.
 * Message operations are in message-service.ts
 * Quick reply templates are in quick-reply-service.ts
 */

import { prisma } from '../db/index.js';
import { Prisma } from '../generated/prisma/index.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/api-error.js';
import { getRedis } from '../cache/redis-client.js';
import type {
  CreateConversationInput,
  ConversationFilterInput,
  BusinessInboxFilterInput,
  ReportConversationInput,
  MessageAttachmentInput,
} from '@community-hub/shared';
import {
  ConversationStatus,
  SenderType,
  SubjectCategory,
  ContentType,
  ReportReason,
} from '../generated/prisma/index.js';

// ─── Types ────────────────────────────────────────────────────

export interface AuditContext {
  actorId: string;
  actorRole: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface ConversationSummary {
  id: string;
  businessId: string;
  business: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
  };
  userId: string;
  user: {
    id: string;
    displayName: string;
    profilePhoto: string | null;
  };
  subject: string;
  subjectCategory: SubjectCategory;
  status: ConversationStatus;
  lastMessageAt: Date | null;
  lastMessagePreview: string | null;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationWithMessages {
  id: string;
  businessId: string;
  business: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    email: string | null;
    phone: string;
  };
  userId: string;
  user: {
    id: string;
    displayName: string;
    profilePhoto: string | null;
  };
  subject: string;
  subjectCategory: SubjectCategory;
  status: ConversationStatus;
  lastMessageAt: Date | null;
  unreadCountBusiness: number;
  unreadCountUser: number;
  createdAt: Date;
  updatedAt: Date;
  messages: MessageWithAttachments[];
}

export interface MessageWithAttachments {
  id: string;
  conversationId: string;
  senderType: SenderType;
  senderId: string;
  content: string;
  readAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  attachments: {
    id: string;
    url: string;
    altText: string | null;
    sizeBytes: number;
    mimeType: string;
  }[];
}

export interface PaginatedConversations {
  conversations: ConversationSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// ─── Cache Keys ───────────────────────────────────────────────

const CACHE_PREFIX = 'conversations';
const CACHE_TTL = 300; // 5 minutes

function getCacheKey(type: string, ...args: string[]): string {
  return `${CACHE_PREFIX}:${type}:${args.join(':')}`;
}

// ─── Service Implementation ───────────────────────────────────

class ConversationService {
  /**
   * Create a new conversation with initial message
   */
  async createConversation(
    input: CreateConversationInput,
    userId: string,
    auditContext: AuditContext
  ): Promise<ConversationWithMessages> {
    logger.info({ businessId: input.businessId, userId }, 'Creating conversation');

    // Check if business exists
    const business = await prisma.business.findUnique({
      where: { id: input.businessId },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        email: true,
        phone: true,
        status: true,
      },
    });

    if (!business) {
      throw ApiError.notFound('BUSINESS_NOT_FOUND', 'Business not found');
    }

    if (business.status !== 'ACTIVE') {
      throw ApiError.badRequest('BUSINESS_NOT_ACTIVE', 'Cannot message an inactive business');
    }

    // Check for existing conversation (only one per user-business pair)
    const existingConversation = await prisma.conversation.findUnique({
      where: {
        businessId_userId: {
          businessId: input.businessId,
          userId: userId,
        },
      },
    });

    if (existingConversation) {
      // Return existing conversation instead of creating new one
      // If blocked, throw error
      if (existingConversation.status === ConversationStatus.BLOCKED) {
        throw ApiError.forbidden(
          'CONVERSATION_BLOCKED',
          'You are blocked from messaging this business'
        );
      }

      // Unarchive if archived and add message
      if (existingConversation.status === ConversationStatus.ARCHIVED) {
        await prisma.conversation.update({
          where: { id: existingConversation.id },
          data: { status: ConversationStatus.ACTIVE },
        });
      }

      // Add the new message to existing conversation
      await this.addMessageToConversation(
        existingConversation.id,
        input.message,
        SenderType.USER,
        userId,
        input.attachments
      );

      return this.getConversationById(existingConversation.id, userId);
    }

    // Create new conversation with initial message
    const conversation = await prisma.$transaction(async (tx) => {
      const conv = await tx.conversation.create({
        data: {
          businessId: input.businessId,
          userId: userId,
          subject: input.subject,
          subjectCategory: input.subjectCategory as SubjectCategory,
          status: ConversationStatus.ACTIVE,
          lastMessageAt: new Date(),
          unreadCountBusiness: 1,
          unreadCountUser: 0,
        },
      });

      // Create initial message
      const message = await tx.message.create({
        data: {
          conversationId: conv.id,
          senderType: SenderType.USER,
          senderId: userId,
          content: input.message,
        },
      });

      // Create attachments if any
      if (input.attachments && input.attachments.length > 0) {
        await tx.messageAttachment.createMany({
          data: input.attachments.map((att) => ({
            messageId: message.id,
            url: att.url,
            altText: att.altText || null,
            sizeBytes: att.sizeBytes,
            mimeType: att.mimeType,
          })),
        });
      }

      return conv;
    });

    // Log audit
    await this.createAuditLog(
      'conversation.create',
      conversation.id,
      null,
      {
        businessId: input.businessId,
        subject: input.subject,
        subjectCategory: input.subjectCategory,
      },
      auditContext
    );

    // Invalidate cache
    await this.invalidateCache(userId, input.businessId);

    return this.getConversationById(conversation.id, userId);
  }

  /**
   * Add a message to an existing conversation
   */
  private async addMessageToConversation(
    conversationId: string,
    content: string,
    senderType: SenderType,
    senderId: string,
    attachments?: MessageAttachmentInput[]
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // Create message
      const message = await tx.message.create({
        data: {
          conversationId,
          senderType,
          senderId,
          content,
        },
      });

      // Create attachments
      if (attachments && attachments.length > 0) {
        await tx.messageAttachment.createMany({
          data: attachments.map((att) => ({
            messageId: message.id,
            url: att.url,
            altText: att.altText || null,
            sizeBytes: att.sizeBytes,
            mimeType: att.mimeType,
          })),
        });
      }

      // Update conversation
      const updateData: Record<string, unknown> = {
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      };

      if (senderType === SenderType.USER) {
        updateData.unreadCountBusiness = { increment: 1 };
      } else {
        updateData.unreadCountUser = { increment: 1 };
      }

      await tx.conversation.update({
        where: { id: conversationId },
        data: updateData,
      });
    });
  }

  /**
   * Get conversation by ID with messages
   */
  async getConversationById(
    conversationId: string,
    userId: string,
    isBusinessOwner: boolean = false
  ): Promise<ConversationWithMessages> {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            email: true,
            phone: true,
            claimedBy: true,
          },
        },
        user: {
          select: {
            id: true,
            displayName: true,
            profilePhoto: true,
          },
        },
        messages: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
          include: {
            attachments: {
              select: {
                id: true,
                url: true,
                altText: true,
                sizeBytes: true,
                mimeType: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      throw ApiError.notFound('CONVERSATION_NOT_FOUND', 'Conversation not found');
    }

    // Check authorization
    const isParticipant = conversation.userId === userId;
    const isOwner = conversation.business.claimedBy === userId;

    if (!isParticipant && !isOwner && !isBusinessOwner) {
      throw ApiError.forbidden('NOT_AUTHORIZED', 'You are not authorized to view this conversation');
    }

    return {
      id: conversation.id,
      businessId: conversation.businessId,
      business: {
        id: conversation.business.id,
        name: conversation.business.name,
        slug: conversation.business.slug,
        logo: conversation.business.logo,
        email: conversation.business.email,
        phone: conversation.business.phone,
      },
      userId: conversation.userId,
      user: conversation.user,
      subject: conversation.subject,
      subjectCategory: conversation.subjectCategory,
      status: conversation.status,
      lastMessageAt: conversation.lastMessageAt,
      unreadCountBusiness: conversation.unreadCountBusiness,
      unreadCountUser: conversation.unreadCountUser,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      messages: conversation.messages,
    };
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
    const where: Record<string, unknown> = { userId };

    if (status === 'active') {
      where.status = ConversationStatus.ACTIVE;
    } else if (status === 'archived') {
      where.status = ConversationStatus.ARCHIVED;
    }
    // 'all' means no status filter

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { business: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Get total count
    const total = await prisma.conversation.count({ where });

    // Get conversations with last message
    const conversations = await prisma.conversation.findMany({
      where,
      orderBy: { lastMessageAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
        user: {
          select: {
            id: true,
            displayName: true,
            profilePhoto: true,
          },
        },
        messages: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            content: true,
          },
        },
      },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      conversations: conversations.map((conv) => ({
        id: conv.id,
        businessId: conv.businessId,
        business: conv.business,
        userId: conv.userId,
        user: conv.user,
        subject: conv.subject,
        subjectCategory: conv.subjectCategory,
        status: conv.status,
        lastMessageAt: conv.lastMessageAt,
        lastMessagePreview: conv.messages[0]?.content?.substring(0, 100) || null,
        unreadCount: conv.unreadCountUser,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      })),
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
   * Get business inbox conversations
   */
  async getBusinessConversations(
    businessId: string,
    ownerId: string,
    filters: BusinessInboxFilterInput
  ): Promise<PaginatedConversations> {
    // Verify business ownership
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, claimedBy: true, name: true, slug: true, logo: true },
    });

    if (!business) {
      throw ApiError.notFound('BUSINESS_NOT_FOUND', 'Business not found');
    }

    if (business.claimedBy !== ownerId) {
      throw ApiError.forbidden('NOT_OWNER', 'You do not own this business');
    }

    const { status, search, unreadOnly, page, limit } = filters;

    // Build where clause
    const where: Record<string, unknown> = { businessId };

    if (status === 'active') {
      where.status = ConversationStatus.ACTIVE;
    } else if (status === 'archived') {
      where.status = ConversationStatus.ARCHIVED;
    } else if (status === 'blocked') {
      where.status = ConversationStatus.BLOCKED;
    }

    if (unreadOnly) {
      where.unreadCountBusiness = { gt: 0 };
    }

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { user: { displayName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Get total count
    const total = await prisma.conversation.count({ where });

    // Get conversations
    const conversations = await prisma.conversation.findMany({
      where,
      orderBy: { lastMessageAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
        user: {
          select: {
            id: true,
            displayName: true,
            profilePhoto: true,
          },
        },
        messages: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            content: true,
          },
        },
      },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      conversations: conversations.map((conv) => ({
        id: conv.id,
        businessId: conv.businessId,
        business: conv.business,
        userId: conv.userId,
        user: conv.user,
        subject: conv.subject,
        subjectCategory: conv.subjectCategory,
        status: conv.status,
        lastMessageAt: conv.lastMessageAt,
        lastMessagePreview: conv.messages[0]?.content?.substring(0, 100) || null,
        unreadCount: conv.unreadCountBusiness,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      })),
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
   * Get business inbox with filtering and pagination
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

    const { status, unreadOnly, search, page, limit } = filters;

    // Build where clause
    const where: Record<string, unknown> = { businessId };

    if (status === 'active') {
      where.status = ConversationStatus.ACTIVE;
    } else if (status === 'archived') {
      where.status = ConversationStatus.ARCHIVED;
    } else if (status === 'blocked') {
      where.status = ConversationStatus.BLOCKED;
    }
    // 'all' means no status filter

    if (unreadOnly) {
      where.unreadCountBusiness = { gt: 0 };
    }

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { user: { displayName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Get total count
    const total = await prisma.conversation.count({ where });

    // Get conversations with last message
    const conversations = await prisma.conversation.findMany({
      where,
      orderBy: { lastMessageAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
        user: {
          select: {
            id: true,
            displayName: true,
            profilePhoto: true,
          },
        },
        messages: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            content: true,
          },
        },
      },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      conversations: conversations.map((conv) => ({
        id: conv.id,
        businessId: conv.businessId,
        business: conv.business,
        userId: conv.userId,
        user: conv.user,
        subject: conv.subject,
        subjectCategory: conv.subjectCategory,
        status: conv.status,
        lastMessageAt: conv.lastMessageAt,
        lastMessagePreview: conv.messages[0]?.content?.substring(0, 100) || null,
        unreadCount: conv.unreadCountBusiness,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      })),
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
   * Get unread count for business inbox
   */
  async getBusinessUnreadCount(businessId: string, ownerId: string): Promise<number> {
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

    const cacheKey = getCacheKey('business_unread', businessId);
    const redis = getRedis();

    // Try cache first
    const cached = await redis.get(cacheKey);
    if (cached !== null) {
      return Number(cached);
    }

    // Count unread conversations
    const result = await prisma.conversation.aggregate({
      where: {
        businessId,
        status: { not: ConversationStatus.BLOCKED },
      },
      _sum: {
        unreadCountBusiness: true,
      },
    });

    const count = result._sum.unreadCountBusiness ?? 0;

    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, count.toString());

    return count;
  }

  /**
   * Archive a conversation (user action)
   */
  async archiveConversation(
    conversationId: string,
    userId: string,
    auditContext: AuditContext
  ): Promise<void> {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { id: true, userId: true, status: true },
    });

    if (!conversation) {
      throw ApiError.notFound('CONVERSATION_NOT_FOUND', 'Conversation not found');
    }

    if (conversation.userId !== userId) {
      throw ApiError.forbidden('NOT_AUTHORIZED', 'You can only archive your own conversations');
    }

    if (conversation.status === ConversationStatus.BLOCKED) {
      throw ApiError.badRequest('CANNOT_ARCHIVE_BLOCKED', 'Cannot archive a blocked conversation');
    }

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { status: ConversationStatus.ARCHIVED },
    });

    await this.createAuditLog(
      'conversation.archive',
      conversationId,
      { status: conversation.status },
      { status: ConversationStatus.ARCHIVED },
      auditContext
    );

    await this.invalidateCache(userId);
  }

  /**
   * Unarchive a conversation (user action)
   */
  async unarchiveConversation(
    conversationId: string,
    userId: string,
    auditContext: AuditContext
  ): Promise<void> {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { id: true, userId: true, status: true },
    });

    if (!conversation) {
      throw ApiError.notFound('CONVERSATION_NOT_FOUND', 'Conversation not found');
    }

    if (conversation.userId !== userId) {
      throw ApiError.forbidden('NOT_AUTHORIZED', 'You can only unarchive your own conversations');
    }

    if (conversation.status !== ConversationStatus.ARCHIVED) {
      throw ApiError.badRequest('NOT_ARCHIVED', 'Conversation is not archived');
    }

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { status: ConversationStatus.ACTIVE },
    });

    await this.createAuditLog(
      'conversation.unarchive',
      conversationId,
      { status: ConversationStatus.ARCHIVED },
      { status: ConversationStatus.ACTIVE },
      auditContext
    );

    await this.invalidateCache(userId);
  }

  /**
   * Block a user from conversation (business owner action)
   */
  async blockConversation(
    conversationId: string,
    ownerId: string,
    auditContext: AuditContext
  ): Promise<void> {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        business: {
          select: { id: true, claimedBy: true },
        },
      },
    });

    if (!conversation) {
      throw ApiError.notFound('CONVERSATION_NOT_FOUND', 'Conversation not found');
    }

    if (conversation.business.claimedBy !== ownerId) {
      throw ApiError.forbidden('NOT_OWNER', 'Only the business owner can block users');
    }

    if (conversation.status === ConversationStatus.BLOCKED) {
      throw ApiError.badRequest('ALREADY_BLOCKED', 'User is already blocked');
    }

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { status: ConversationStatus.BLOCKED },
    });

    await this.createAuditLog(
      'conversation.block',
      conversationId,
      { status: conversation.status },
      { status: ConversationStatus.BLOCKED },
      auditContext
    );

    await this.invalidateCache(conversation.userId, conversation.businessId);
  }

  /**
   * Unblock a user (business owner action)
   */
  async unblockConversation(
    conversationId: string,
    ownerId: string,
    auditContext: AuditContext
  ): Promise<void> {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        business: {
          select: { id: true, claimedBy: true },
        },
      },
    });

    if (!conversation) {
      throw ApiError.notFound('CONVERSATION_NOT_FOUND', 'Conversation not found');
    }

    if (conversation.business.claimedBy !== ownerId) {
      throw ApiError.forbidden('NOT_OWNER', 'Only the business owner can unblock users');
    }

    if (conversation.status !== ConversationStatus.BLOCKED) {
      throw ApiError.badRequest('NOT_BLOCKED', 'User is not blocked');
    }

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { status: ConversationStatus.ACTIVE },
    });

    await this.createAuditLog(
      'conversation.unblock',
      conversationId,
      { status: ConversationStatus.BLOCKED },
      { status: ConversationStatus.ACTIVE },
      auditContext
    );

    await this.invalidateCache(conversation.userId, conversation.businessId);
  }

  /**
   * Report a conversation
   */
  async reportConversation(
    conversationId: string,
    userId: string,
    input: ReportConversationInput,
    auditContext: AuditContext
  ): Promise<void> {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { id: true, userId: true, businessId: true },
    });

    if (!conversation) {
      throw ApiError.notFound('CONVERSATION_NOT_FOUND', 'Conversation not found');
    }

    // Only participants can report
    if (conversation.userId !== userId) {
      // Check if business owner
      const business = await prisma.business.findUnique({
        where: { id: conversation.businessId },
        select: { claimedBy: true },
      });

      if (business?.claimedBy !== userId) {
        throw ApiError.forbidden('NOT_AUTHORIZED', 'Only participants can report a conversation');
      }
    }

    // Create moderation report
    await prisma.moderationReport.create({
      data: {
        reporterId: userId,
        contentType: ContentType.MESSAGE,
        contentId: conversationId,
        reason: input.reason as ReportReason,
        details: input.details || null,
      },
    });

    await this.createAuditLog(
      'conversation.report',
      conversationId,
      null,
      { reason: input.reason, details: input.details },
      auditContext
    );

    logger.info({ conversationId, userId, reason: input.reason }, 'Conversation reported');
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
    const result = await prisma.conversation.aggregate({
      where: {
        userId,
        status: { not: ConversationStatus.BLOCKED },
        unreadCountUser: { gt: 0 },
      },
      _sum: {
        unreadCountUser: true,
      },
    });

    const count = result._sum.unreadCountUser || 0;

    // Cache for 5 minutes
    await redis.setex(cacheKey, CACHE_TTL, count.toString());

    return count;
  }

  /**
   * Invalidate cache
   */
  private async invalidateCache(userId?: string, businessId?: string): Promise<void> {
    const redis = getRedis();

    if (userId) {
      await redis.del(getCacheKey('unread', userId));
    }

    if (businessId) {
      await redis.del(getCacheKey('business_unread', businessId));
    }
  }

  /**
   * Create audit log entry
   */
  private async createAuditLog(
    action: string,
    targetId: string,
    previousValue: unknown,
    newValue: unknown,
    context: AuditContext
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          actorId: context.actorId,
          actorRole: context.actorRole as 'USER' | 'BUSINESS_OWNER' | 'MODERATOR' | 'ADMIN' | 'SYSTEM',
          action,
          targetType: 'Conversation',
          targetId,
          previousValue: previousValue ? JSON.parse(JSON.stringify(previousValue)) : Prisma.DbNull,
          newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : Prisma.DbNull,
          ipAddress: context.ipAddress || 'unknown',
          userAgent: context.userAgent || 'unknown',
        },
      });
    } catch (error) {
      logger.error({ error, action, targetId }, 'Failed to create audit log');
    }
  }
}

export const conversationService = new ConversationService();
