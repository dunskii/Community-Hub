/**
 * Conversation Service
 * Phase 9: Messaging System
 * Spec §16: Messaging & Communication System
 *
 * Handles conversation CRUD operations, archiving, blocking, and reporting.
 * Message operations are in message-service.ts
 * Quick reply templates are in quick-reply-service.ts
 */

import crypto from 'crypto';
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
    const business = await prisma.businesses.findUnique({
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
    const existingConversation = await prisma.conversations.findUnique({
      where: {
        business_id_user_id: {
          business_id: input.businessId,
          user_id: userId,
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
        await prisma.conversations.update({
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
      const conv = await tx.conversations.create({
        data: {
          id: crypto.randomUUID(),
          business_id: input.businessId,
          user_id: userId,
          subject: input.subject,
          subject_category: input.subjectCategory as SubjectCategory,
          status: ConversationStatus.ACTIVE,
          last_message_at: new Date(),
          unread_count_business: 1,
          unread_count_user: 0,
          updated_at: new Date(),
        },
      });

      // Create initial message
      const message = await tx.messages.create({
        data: {
          id: crypto.randomUUID(),
          conversation_id: conv.id,
          sender_type: SenderType.USER,
          sender_id: userId,
          content: input.message,
        },
      });

      // Create attachments if any
      if (input.attachments && input.attachments.length > 0) {
        await tx.message_attachments.createMany({
          data: input.attachments.map((att) => ({
            id: crypto.randomUUID(),
            message_id: message.id,
            url: att.url,
            alt_text: att.altText || null,
            size_bytes: att.sizeBytes,
            mime_type: att.mimeType,
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
      const message = await tx.messages.create({
        data: {
          id: crypto.randomUUID(),
          conversation_id: conversationId,
          sender_type: senderType,
          sender_id: senderId,
          content,
        },
      });

      // Create attachments
      if (attachments && attachments.length > 0) {
        await tx.message_attachments.createMany({
          data: attachments.map((att) => ({
            id: crypto.randomUUID(),
            message_id: message.id,
            url: att.url,
            alt_text: att.altText || null,
            size_bytes: att.sizeBytes,
            mime_type: att.mimeType,
          })),
        });
      }

      // Update conversation
      const updateData: Record<string, unknown> = {
        last_message_at: new Date(),
        updated_at: new Date(),
      };

      if (senderType === SenderType.USER) {
        updateData.unread_count_business = { increment: 1 };
      } else {
        updateData.unread_count_user = { increment: 1 };
      }

      await tx.conversations.update({
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
    const conversation = await prisma.conversations.findUnique({
      where: { id: conversationId },
      include: {
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
          orderBy: { created_at: 'asc' },
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
      },
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

    return {
      id: conversation.id,
      businessId: conversation.business_id,
      business: {
        id: conversation.businesses.id,
        name: conversation.businesses.name,
        slug: conversation.businesses.slug,
        logo: conversation.businesses.logo,
        email: conversation.businesses.email,
        phone: conversation.businesses.phone,
      },
      userId: conversation.user_id,
      user: {
        id: conversation.users.id,
        displayName: conversation.users.display_name,
        profilePhoto: conversation.users.profile_photo,
      },
      subject: conversation.subject,
      subjectCategory: conversation.subject_category,
      status: conversation.status,
      lastMessageAt: conversation.last_message_at,
      unreadCountBusiness: conversation.unread_count_business,
      unreadCountUser: conversation.unread_count_user,
      createdAt: conversation.created_at,
      updatedAt: conversation.updated_at,
      messages: conversation.messages.map((msg) => ({
        id: msg.id,
        conversationId: msg.conversation_id,
        senderType: msg.sender_type,
        senderId: msg.sender_id,
        content: msg.content,
        readAt: msg.read_at,
        deletedAt: msg.deleted_at,
        createdAt: msg.created_at,
        attachments: msg.message_attachments.map((att) => ({
          id: att.id,
          url: att.url,
          altText: att.alt_text,
          sizeBytes: att.size_bytes,
          mimeType: att.mime_type,
        })),
      })),
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

    // Get total count
    const total = await prisma.conversations.count({ where });

    // Get conversations with last message
    const conversations = await prisma.conversations.findMany({
      where,
      orderBy: { last_message_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
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
          orderBy: { created_at: 'desc' },
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
        businessId: conv.business_id,
        business: {
          id: conv.businesses.id,
          name: conv.businesses.name,
          slug: conv.businesses.slug,
          logo: conv.businesses.logo,
        },
        userId: conv.user_id,
        user: {
          id: conv.users.id,
          displayName: conv.users.display_name,
          profilePhoto: conv.users.profile_photo,
        },
        subject: conv.subject,
        subjectCategory: conv.subject_category,
        status: conv.status,
        lastMessageAt: conv.last_message_at,
        lastMessagePreview: conv.messages[0]?.content?.substring(0, 100) || null,
        unreadCount: conv.unread_count_user,
        createdAt: conv.created_at,
        updatedAt: conv.updated_at,
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
    const business = await prisma.businesses.findUnique({
      where: { id: businessId },
      select: { id: true, claimed_by: true, name: true, slug: true, logo: true },
    });

    if (!business) {
      throw ApiError.notFound('BUSINESS_NOT_FOUND', 'Business not found');
    }

    if (business.claimed_by !== ownerId) {
      throw ApiError.forbidden('NOT_OWNER', 'You do not own this business');
    }

    const { status, search, unreadOnly, page, limit } = filters;

    // Build where clause
    const where: Record<string, unknown> = { business_id: businessId };

    if (status === 'active') {
      where.status = ConversationStatus.ACTIVE;
    } else if (status === 'archived') {
      where.status = ConversationStatus.ARCHIVED;
    } else if (status === 'blocked') {
      where.status = ConversationStatus.BLOCKED;
    }

    if (unreadOnly) {
      where.unread_count_business = { gt: 0 };
    }

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { users: { display_name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Get total count
    const total = await prisma.conversations.count({ where });

    // Get conversations
    const conversations = await prisma.conversations.findMany({
      where,
      orderBy: { last_message_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
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
          orderBy: { created_at: 'desc' },
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
        businessId: conv.business_id,
        business: {
          id: conv.businesses.id,
          name: conv.businesses.name,
          slug: conv.businesses.slug,
          logo: conv.businesses.logo,
        },
        userId: conv.user_id,
        user: {
          id: conv.users.id,
          displayName: conv.users.display_name,
          profilePhoto: conv.users.profile_photo,
        },
        subject: conv.subject,
        subjectCategory: conv.subject_category,
        status: conv.status,
        lastMessageAt: conv.last_message_at,
        lastMessagePreview: conv.messages[0]?.content?.substring(0, 100) || null,
        unreadCount: conv.unread_count_business,
        createdAt: conv.created_at,
        updatedAt: conv.updated_at,
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

    const { status, unreadOnly, search, page, limit } = filters;

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

    // Get total count
    const total = await prisma.conversations.count({ where });

    // Get conversations with last message
    const conversations = await prisma.conversations.findMany({
      where,
      orderBy: { last_message_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
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
          orderBy: { created_at: 'desc' },
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
        businessId: conv.business_id,
        business: {
          id: conv.businesses.id,
          name: conv.businesses.name,
          slug: conv.businesses.slug,
          logo: conv.businesses.logo,
        },
        userId: conv.user_id,
        user: {
          id: conv.users.id,
          displayName: conv.users.display_name,
          profilePhoto: conv.users.profile_photo,
        },
        subject: conv.subject,
        subjectCategory: conv.subject_category,
        status: conv.status,
        lastMessageAt: conv.last_message_at,
        lastMessagePreview: conv.messages[0]?.content?.substring(0, 100) || null,
        unreadCount: conv.unread_count_business,
        createdAt: conv.created_at,
        updatedAt: conv.updated_at,
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
   * Archive a conversation (user action)
   */
  async archiveConversation(
    conversationId: string,
    userId: string,
    auditContext: AuditContext
  ): Promise<void> {
    const conversation = await prisma.conversations.findUnique({
      where: { id: conversationId },
      select: { id: true, user_id: true, status: true },
    });

    if (!conversation) {
      throw ApiError.notFound('CONVERSATION_NOT_FOUND', 'Conversation not found');
    }

    if (conversation.user_id !== userId) {
      throw ApiError.forbidden('NOT_AUTHORIZED', 'You can only archive your own conversations');
    }

    if (conversation.status === ConversationStatus.BLOCKED) {
      throw ApiError.badRequest('CANNOT_ARCHIVE_BLOCKED', 'Cannot archive a blocked conversation');
    }

    await prisma.conversations.update({
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
    const conversation = await prisma.conversations.findUnique({
      where: { id: conversationId },
      select: { id: true, user_id: true, status: true },
    });

    if (!conversation) {
      throw ApiError.notFound('CONVERSATION_NOT_FOUND', 'Conversation not found');
    }

    if (conversation.user_id !== userId) {
      throw ApiError.forbidden('NOT_AUTHORIZED', 'You can only unarchive your own conversations');
    }

    if (conversation.status !== ConversationStatus.ARCHIVED) {
      throw ApiError.badRequest('NOT_ARCHIVED', 'Conversation is not archived');
    }

    await prisma.conversations.update({
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
    const conversation = await prisma.conversations.findUnique({
      where: { id: conversationId },
      include: {
        businesses: {
          select: { id: true, claimed_by: true },
        },
      },
    });

    if (!conversation) {
      throw ApiError.notFound('CONVERSATION_NOT_FOUND', 'Conversation not found');
    }

    if (conversation.businesses.claimed_by !== ownerId) {
      throw ApiError.forbidden('NOT_OWNER', 'Only the business owner can block users');
    }

    if (conversation.status === ConversationStatus.BLOCKED) {
      throw ApiError.badRequest('ALREADY_BLOCKED', 'User is already blocked');
    }

    await prisma.conversations.update({
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

    await this.invalidateCache(conversation.user_id, conversation.business_id);
  }

  /**
   * Unblock a user (business owner action)
   */
  async unblockConversation(
    conversationId: string,
    ownerId: string,
    auditContext: AuditContext
  ): Promise<void> {
    const conversation = await prisma.conversations.findUnique({
      where: { id: conversationId },
      include: {
        businesses: {
          select: { id: true, claimed_by: true },
        },
      },
    });

    if (!conversation) {
      throw ApiError.notFound('CONVERSATION_NOT_FOUND', 'Conversation not found');
    }

    if (conversation.businesses.claimed_by !== ownerId) {
      throw ApiError.forbidden('NOT_OWNER', 'Only the business owner can unblock users');
    }

    if (conversation.status !== ConversationStatus.BLOCKED) {
      throw ApiError.badRequest('NOT_BLOCKED', 'User is not blocked');
    }

    await prisma.conversations.update({
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

    await this.invalidateCache(conversation.user_id, conversation.business_id);
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
    const conversation = await prisma.conversations.findUnique({
      where: { id: conversationId },
      select: { id: true, user_id: true, business_id: true },
    });

    if (!conversation) {
      throw ApiError.notFound('CONVERSATION_NOT_FOUND', 'Conversation not found');
    }

    // Only participants can report
    if (conversation.user_id !== userId) {
      // Check if business owner
      const business = await prisma.businesses.findUnique({
        where: { id: conversation.business_id },
        select: { claimed_by: true },
      });

      if (business?.claimed_by !== userId) {
        throw ApiError.forbidden('NOT_AUTHORIZED', 'Only participants can report a conversation');
      }
    }

    // Create moderation report
    await prisma.moderation_reports.create({
      data: {
        id: crypto.randomUUID(),
        reporter_id: userId,
        content_type: ContentType.MESSAGE,
        content_id: conversationId,
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
      await prisma.audit_logs.create({
        data: {
          id: crypto.randomUUID(),
          actor_id: context.actorId,
          actor_role: context.actorRole as 'USER' | 'BUSINESS_OWNER' | 'MODERATOR' | 'ADMIN' | 'SYSTEM',
          action,
          target_type: 'Conversation',
          target_id: targetId,
          previous_value: previousValue ? JSON.parse(JSON.stringify(previousValue)) : Prisma.DbNull,
          new_value: newValue ? JSON.parse(JSON.stringify(newValue)) : Prisma.DbNull,
          ip_address: context.ipAddress || 'unknown',
          user_agent: context.userAgent || 'unknown',
        },
      });
    } catch (error) {
      logger.error({ error, action, targetId }, 'Failed to create audit log');
    }
  }
}

export const conversationService = new ConversationService();
