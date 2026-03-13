/**
 * Message Service
 * Phase 9: Messaging System
 * Spec §16: Messaging & Communication System
 *
 * Handles message operations: send, read, delete, pagination.
 */

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
      await prisma.auditLog.create({
        data: {
          actorId: params.actorId,
          actorRole: params.actorRole as ActorRole,
          action: params.action,
          targetType: params.targetType,
          targetId: params.targetId,
          previousValue: params.previousValue ? JSON.stringify(params.previousValue) : Prisma.DbNull,
          newValue: params.newValue ? JSON.stringify(params.newValue) : Prisma.DbNull,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
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
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        business: {
          select: { id: true, claimedBy: true },
        },
        user: {
          select: { id: true, displayName: true, profilePhoto: true },
        },
      },
    });

    if (!conversation) {
      throw ApiError.notFound('CONVERSATION_NOT_FOUND', 'Conversation not found');
    }

    // Determine sender type and verify authorization
    let senderType: SenderType;
    let sender: { id: string; displayName: string; profilePhoto: string | null } | null = null;

    if (conversation.userId === senderId) {
      // User sending message
      senderType = SenderType.USER;
      sender = conversation.user;

      // Check if blocked
      if (conversation.status === ConversationStatus.BLOCKED) {
        throw ApiError.forbidden(
          'CONVERSATION_BLOCKED',
          'You are blocked from messaging this business'
        );
      }
    } else if (conversation.business.claimedBy === senderId) {
      // Business owner responding
      senderType = SenderType.BUSINESS;

      // Get business owner info
      const owner = await prisma.user.findUnique({
        where: { id: senderId },
        select: { id: true, displayName: true, profilePhoto: true },
      });
      sender = owner;
    } else {
      throw ApiError.forbidden('NOT_AUTHORIZED', 'You are not a participant in this conversation');
    }

    // Create message with attachments in transaction
    const message = await prisma.$transaction(async (tx) => {
      const msg = await tx.message.create({
        data: {
          conversationId,
          senderType,
          senderId,
          content: input.content,
        },
        include: {
          attachments: true,
        },
      });

      // Create attachments if any
      if (input.attachments && input.attachments.length > 0) {
        await tx.messageAttachment.createMany({
          data: input.attachments.map((att) => ({
            messageId: msg.id,
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

      // If conversation was archived by user, reactivate it
      if (conversation.status === ConversationStatus.ARCHIVED) {
        updateData.status = ConversationStatus.ACTIVE;
      }

      // Update unread count
      if (senderType === SenderType.USER) {
        updateData.unreadCountBusiness = { increment: 1 };
      } else {
        updateData.unreadCountUser = { increment: 1 };
      }

      await tx.conversation.update({
        where: { id: conversationId },
        data: updateData,
      });

      // Fetch message with attachments
      return tx.message.findUnique({
        where: { id: msg.id },
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
      });
    });

    if (!message) {
      throw ApiError.internal('Failed to create message');
    }

    // Invalidate cache
    await this.invalidateCache(conversation.userId, conversation.businessId);

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
      conversationId: message.conversationId,
      senderType: message.senderType,
      senderId: message.senderId,
      content: message.content,
      readAt: message.readAt,
      deletedAt: message.deletedAt,
      createdAt: message.createdAt,
      attachments: message.attachments,
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
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        business: {
          select: { claimedBy: true },
        },
      },
    });

    if (!conversation) {
      throw ApiError.notFound('CONVERSATION_NOT_FOUND', 'Conversation not found');
    }

    const isParticipant = conversation.userId === userId;
    const isOwner = conversation.business.claimedBy === userId;

    if (!isParticipant && !isOwner) {
      throw ApiError.forbidden('NOT_AUTHORIZED', 'You are not authorized to view these messages');
    }

    // Get total count
    const total = await prisma.message.count({
      where: {
        conversationId,
        deletedAt: null,
      },
    });

    // Get messages (newest first for pagination, reversed for display)
    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
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
    });

    // Get sender info for each message
    const messagesWithSenders = await Promise.all(
      messages.map(async (msg) => {
        let sender: { id: string; displayName: string; profilePhoto: string | null } | null = null;

        if (msg.senderType === SenderType.USER) {
          const user = await prisma.user.findUnique({
            where: { id: msg.senderId },
            select: { id: true, displayName: true, profilePhoto: true },
          });
          sender = user;
        } else {
          const owner = await prisma.user.findUnique({
            where: { id: msg.senderId },
            select: { id: true, displayName: true, profilePhoto: true },
          });
          sender = owner;
        }

        return {
          id: msg.id,
          conversationId: msg.conversationId,
          senderType: msg.senderType,
          senderId: msg.senderId,
          content: msg.content,
          readAt: msg.readAt,
          deletedAt: msg.deletedAt,
          createdAt: msg.createdAt,
          attachments: msg.attachments,
          sender,
        };
      })
    );

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
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        business: {
          select: { claimedBy: true },
        },
      },
    });

    if (!conversation) {
      throw ApiError.notFound('CONVERSATION_NOT_FOUND', 'Conversation not found');
    }

    const isUser = conversation.userId === userId;
    const isOwner = conversation.business.claimedBy === userId;

    if (!isUser && !isOwner) {
      throw ApiError.forbidden('NOT_AUTHORIZED', 'You are not authorized to mark this as read');
    }

    await prisma.$transaction(async (tx) => {
      // Mark all messages as read
      if (isUser) {
        // Mark business messages as read
        await tx.message.updateMany({
          where: {
            conversationId,
            senderType: SenderType.BUSINESS,
            readAt: null,
          },
          data: { readAt: new Date() },
        });

        // Reset user unread count
        await tx.conversation.update({
          where: { id: conversationId },
          data: { unreadCountUser: 0 },
        });
      } else {
        // Mark user messages as read
        await tx.message.updateMany({
          where: {
            conversationId,
            senderType: SenderType.USER,
            readAt: null,
          },
          data: { readAt: new Date() },
        });

        // Reset business unread count
        await tx.conversation.update({
          where: { id: conversationId },
          data: { unreadCountBusiness: 0 },
        });
      }
    });

    // Invalidate cache
    if (isUser) {
      await this.invalidateCache(userId);
    } else {
      await this.invalidateCache(undefined, conversation.businessId);
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
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          include: {
            business: {
              select: { claimedBy: true },
            },
          },
        },
      },
    });

    if (!message) {
      throw ApiError.notFound('MESSAGE_NOT_FOUND', 'Message not found');
    }

    if (message.deletedAt) {
      throw ApiError.badRequest('ALREADY_DELETED', 'Message is already deleted');
    }

    // Verify sender owns the message
    if (message.senderId !== userId) {
      throw ApiError.forbidden('NOT_AUTHORIZED', 'You can only delete your own messages');
    }

    // Check 24h window
    const hoursSinceCreation =
      (Date.now() - message.createdAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceCreation > MESSAGE_DELETE_WINDOW_HOURS) {
      throw ApiError.badRequest(
        'DELETE_WINDOW_EXPIRED',
        `Messages can only be deleted within ${MESSAGE_DELETE_WINDOW_HOURS} hours of sending`
      );
    }

    // Soft delete
    await prisma.message.update({
      where: { id: messageId },
      data: { deletedAt: new Date() },
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
