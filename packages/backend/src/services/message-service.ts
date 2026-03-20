/**
 * Message Service
 * Phase 9: Messaging System
 * Spec §16: Messaging & Communication System
 *
 * Handles message operations: send, read, delete, pagination.
 */

import crypto from 'crypto';
import { prisma } from '../db/index.js';
import { Prisma } from '../generated/prisma/index.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/api-error.js';
import { getRedis } from '../cache/redis-client.js';
import type { SendMessageInput, MessagePaginationInput } from '@community-hub/shared';
import { SenderType, ConversationStatus, ActorRole } from '../generated/prisma/index.js';

// ─── Types ────────────────────────────────────────────────────

export interface AuditContext {
  actorId: string;
  actorRole: string;
  ipAddress?: string;
  userAgent?: string;
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
  sender: {
    id: string;
    displayName: string;
    profilePhoto: string | null;
  } | null;
}

export interface PaginatedMessages {
  messages: MessageWithAttachments[];
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

function getCacheKey(type: string, ...args: string[]): string {
  return `${CACHE_PREFIX}:${type}:${args.join(':')}`;
}

// ─── Constants ────────────────────────────────────────────────

const MESSAGE_DELETE_WINDOW_HOURS = 24;

// ─── Service Implementation ───────────────────────────────────

class MessageService {
  /**
   * Create audit log entry
   */
  private async createAuditLog(params: {
    actorId: string;
    actorRole: string;
    action: string;
    targetType: string;
    targetId: string;
    previousValue?: Record<string, unknown>;
    newValue?: Record<string, unknown>;
    ipAddress: string;
    userAgent: string;
  }): Promise<void> {
    try {
      await prisma.audit_logs.create({
        data: {
          id: crypto.randomUUID(),
          actor_id: params.actorId,
          actor_role: params.actorRole as ActorRole,
          action: params.action,
          target_type: params.targetType,
          target_id: params.targetId,
          previous_value: params.previousValue ? JSON.stringify(params.previousValue) : Prisma.DbNull,
          new_value: params.newValue ? JSON.stringify(params.newValue) : Prisma.DbNull,
          ip_address: params.ipAddress,
          user_agent: params.userAgent,
        },
      });
    } catch (error) {
      logger.error({ error, params }, 'Failed to create audit log');
    }
  }

  /**
   * Send a message in a conversation
   */
  async sendMessage(
    conversationId: string,
    senderId: string,
    input: SendMessageInput,
    auditContext: AuditContext
  ): Promise<MessageWithAttachments> {
    logger.info({ conversationId, senderId }, 'Sending message');

    // Get conversation and verify sender is participant
    const conversation = await prisma.conversations.findUnique({
      where: { id: conversationId },
      include: {
        businesses: {
          select: { id: true, claimed_by: true },
        },
        users: {
          select: { id: true, display_name: true, profile_photo: true },
        },
      },
    });

    if (!conversation) {
      throw ApiError.notFound('CONVERSATION_NOT_FOUND', 'Conversation not found');
    }

    // Determine sender type and verify authorization
    let senderType: SenderType;
    let sender: { id: string; displayName: string; profilePhoto: string | null } | null = null;

    if (conversation.user_id === senderId) {
      // User sending message
      senderType = SenderType.USER;
      sender = {
        id: conversation.users.id,
        displayName: conversation.users.display_name,
        profilePhoto: conversation.users.profile_photo,
      };

      // Check if blocked
      if (conversation.status === ConversationStatus.BLOCKED) {
        throw ApiError.forbidden(
          'CONVERSATION_BLOCKED',
          'You are blocked from messaging this business'
        );
      }
    } else if (conversation.businesses.claimed_by === senderId) {
      // Business owner responding
      senderType = SenderType.BUSINESS;

      // Get business owner info
      const owner = await prisma.users.findUnique({
        where: { id: senderId },
        select: { id: true, display_name: true, profile_photo: true },
      });
      if (owner) {
        sender = {
          id: owner.id,
          displayName: owner.display_name,
          profilePhoto: owner.profile_photo,
        };
      }
    } else {
      throw ApiError.forbidden('NOT_AUTHORIZED', 'You are not a participant in this conversation');
    }

    // Create message with attachments in transaction
    const message = await prisma.$transaction(async (tx) => {
      const msg = await tx.messages.create({
        data: {
          id: crypto.randomUUID(),
          conversation_id: conversationId,
          sender_type: senderType,
          sender_id: senderId,
          content: input.content,
        },
        include: {
          message_attachments: true,
        },
      });

      // Create attachments if any
      if (input.attachments && input.attachments.length > 0) {
        await tx.message_attachments.createMany({
          data: input.attachments.map((att) => ({
            id: crypto.randomUUID(),
            message_id: msg.id,
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

      // If conversation was archived by user, reactivate it
      if (conversation.status === ConversationStatus.ARCHIVED) {
        updateData.status = ConversationStatus.ACTIVE;
      }

      // Update unread count
      if (senderType === SenderType.USER) {
        updateData.unread_count_business = { increment: 1 };
      } else {
        updateData.unread_count_user = { increment: 1 };
      }

      await tx.conversations.update({
        where: { id: conversationId },
        data: updateData,
      });

      // Fetch message with attachments
      return tx.messages.findUnique({
        where: { id: msg.id },
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
      });
    });

    if (!message) {
      throw ApiError.internal('Failed to create message');
    }

    // Invalidate cache
    await this.invalidateCache(conversation.user_id, conversation.business_id);

    // Log audit
    await this.createAuditLog({
      actorId: auditContext.actorId,
      actorRole: auditContext.actorRole,
      action: 'message.send',
      targetType: 'Message',
      targetId: message.id,
      newValue: {
        conversationId,
        senderType,
        contentLength: input.content.length,
        attachmentCount: input.attachments?.length || 0,
      },
      ipAddress: auditContext.ipAddress || '',
      userAgent: auditContext.userAgent || '',
    });

    return {
      id: message.id,
      conversationId: message.conversation_id,
      senderType: message.sender_type,
      senderId: message.sender_id,
      content: message.content,
      readAt: message.read_at,
      deletedAt: message.deleted_at,
      createdAt: message.created_at,
      attachments: message.message_attachments.map((att) => ({
        id: att.id,
        url: att.url,
        altText: att.alt_text,
        sizeBytes: att.size_bytes,
        mimeType: att.mime_type,
      })),
      sender,
    };
  }

  /**
   * Get messages for a conversation (paginated)
   */
  async getMessages(
    conversationId: string,
    userId: string,
    pagination: MessagePaginationInput
  ): Promise<PaginatedMessages> {
    const { page, limit } = pagination;

    // Verify access
    const conversation = await prisma.conversations.findUnique({
      where: { id: conversationId },
      include: {
        businesses: {
          select: { claimed_by: true },
        },
      },
    });

    if (!conversation) {
      throw ApiError.notFound('CONVERSATION_NOT_FOUND', 'Conversation not found');
    }

    const isParticipant = conversation.user_id === userId;
    const isOwner = conversation.businesses.claimed_by === userId;

    if (!isParticipant && !isOwner) {
      throw ApiError.forbidden('NOT_AUTHORIZED', 'You are not authorized to view these messages');
    }

    // Get total count
    const total = await prisma.messages.count({
      where: {
        conversation_id: conversationId,
        deleted_at: null,
      },
    });

    // Get messages (newest first for pagination, reversed for display)
    const messages = await prisma.messages.findMany({
      where: {
        conversation_id: conversationId,
        deleted_at: null,
      },
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
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
    });

    // Batch load all senders in a single query to avoid N+1
    const senderIds = [...new Set(messages.map((msg) => msg.sender_id))];
    const senders = senderIds.length > 0
      ? await prisma.users.findMany({
          where: { id: { in: senderIds } },
          select: { id: true, display_name: true, profile_photo: true },
        })
      : [];

    // Create a map for O(1) sender lookup
    const senderMap = new Map(senders.map((s) => [s.id, {
      id: s.id,
      displayName: s.display_name,
      profilePhoto: s.profile_photo,
    }]));

    // Map messages with their senders
    const messagesWithSenders = messages.map((msg) => ({
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
      sender: senderMap.get(msg.sender_id) || null,
    }));

    const totalPages = Math.ceil(total / limit);

    // Reverse to show oldest first in UI
    return {
      messages: messagesWithSenders.reverse(),
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
   * Mark conversation as read
   */
  async markAsRead(
    conversationId: string,
    userId: string,
    _auditContext: AuditContext
  ): Promise<void> {
    const conversation = await prisma.conversations.findUnique({
      where: { id: conversationId },
      include: {
        businesses: {
          select: { claimed_by: true },
        },
      },
    });

    if (!conversation) {
      throw ApiError.notFound('CONVERSATION_NOT_FOUND', 'Conversation not found');
    }

    const isUser = conversation.user_id === userId;
    const isOwner = conversation.businesses.claimed_by === userId;

    if (!isUser && !isOwner) {
      throw ApiError.forbidden('NOT_AUTHORIZED', 'You are not authorized to mark this as read');
    }

    await prisma.$transaction(async (tx) => {
      // Mark all messages as read
      if (isUser) {
        // Mark business messages as read
        await tx.messages.updateMany({
          where: {
            conversation_id: conversationId,
            sender_type: SenderType.BUSINESS,
            read_at: null,
          },
          data: { read_at: new Date() },
        });

        // Reset user unread count
        await tx.conversations.update({
          where: { id: conversationId },
          data: { unread_count_user: 0 },
        });
      } else {
        // Mark user messages as read
        await tx.messages.updateMany({
          where: {
            conversation_id: conversationId,
            sender_type: SenderType.USER,
            read_at: null,
          },
          data: { read_at: new Date() },
        });

        // Reset business unread count
        await tx.conversations.update({
          where: { id: conversationId },
          data: { unread_count_business: 0 },
        });
      }
    });

    // Invalidate cache
    if (isUser) {
      await this.invalidateCache(userId);
    } else {
      await this.invalidateCache(undefined, conversation.business_id);
    }

    logger.debug({ conversationId, userId }, 'Conversation marked as read');
  }

  /**
   * Delete a message (soft delete, within 24h window)
   */
  async deleteMessage(
    messageId: string,
    userId: string,
    auditContext: AuditContext
  ): Promise<void> {
    const message = await prisma.messages.findUnique({
      where: { id: messageId },
      include: {
        conversations: {
          include: {
            businesses: {
              select: { claimed_by: true },
            },
          },
        },
      },
    });

    if (!message) {
      throw ApiError.notFound('MESSAGE_NOT_FOUND', 'Message not found');
    }

    if (message.deleted_at) {
      throw ApiError.badRequest('ALREADY_DELETED', 'Message is already deleted');
    }

    // Verify sender owns the message
    if (message.sender_id !== userId) {
      throw ApiError.forbidden('NOT_AUTHORIZED', 'You can only delete your own messages');
    }

    // Check 24h window
    const hoursSinceCreation =
      (Date.now() - message.created_at.getTime()) / (1000 * 60 * 60);

    if (hoursSinceCreation > MESSAGE_DELETE_WINDOW_HOURS) {
      throw ApiError.badRequest(
        'DELETE_WINDOW_EXPIRED',
        `Messages can only be deleted within ${MESSAGE_DELETE_WINDOW_HOURS} hours of sending`
      );
    }

    // Soft delete
    await prisma.messages.update({
      where: { id: messageId },
      data: { deleted_at: new Date() },
    });

    // Log audit
    await this.createAuditLog({
      actorId: auditContext.actorId,
      actorRole: auditContext.actorRole,
      action: 'message.delete',
      targetType: 'Message',
      targetId: messageId,
      previousValue: { content: message.content.substring(0, 100) },
      newValue: { deletedAt: new Date().toISOString() },
      ipAddress: auditContext.ipAddress || '',
      userAgent: auditContext.userAgent || '',
    });

    logger.info({ messageId, userId }, 'Message deleted');
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
}

export const messageService = new MessageService();
