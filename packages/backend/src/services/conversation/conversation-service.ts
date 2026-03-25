/**
 * Conversation Service — Orchestrator
 * Phase 9: Messaging System
 * Spec §16: Messaging & Communication System
 *
 * Thin facade that owns creation logic and delegates reads / status
 * transitions to the specialised sub-services.
 *
 * NOTE: addMessageToConversation lives here for now but should eventually
 * migrate to message-service once a shared transaction helper is available.
 */

import crypto from 'crypto';
import { prisma } from '../../db/index.js';
import { logger } from '../../utils/logger.js';
import { ApiError } from '../../utils/api-error.js';
import { createAuditLog } from '../../utils/audit-logger.js';
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
} from '../../generated/prisma/index.js';
import { invalidateConversationCache } from './conversation-cache.js';
import { conversationQueryService } from './conversation-query-service.js';
import { conversationStatusService } from './conversation-status-service.js';
import type {
  AuditContext,
  ConversationWithMessages,
  PaginatedConversations,
} from './conversation-types.js';

// ─── Service Implementation ───────────────────────────────────

class ConversationService {
  // ─── Creation ────────────────────────────────────────────────

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

      return conversationQueryService.getConversationById(existingConversation.id, userId);
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
    await createAuditLog({
      context: auditContext,
      action: 'conversation.create',
      targetType: 'Conversation',
      targetId: conversation.id,
      newValue: {
        businessId: input.businessId,
        subject: input.subject,
        subjectCategory: input.subjectCategory,
      },
    });

    // Invalidate cache
    await invalidateConversationCache(userId, input.businessId);

    return conversationQueryService.getConversationById(conversation.id, userId);
  }

  /**
   * Add a message to an existing conversation.
   *
   * NOTE: This helper is private and used only during createConversation
   * when re-activating an existing conversation.  General message sending
   * goes through message-service.
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

  // ─── Delegated reads ─────────────────────────────────────────

  async getConversationById(
    conversationId: string,
    userId: string,
    isBusinessOwner: boolean = false
  ): Promise<ConversationWithMessages> {
    return conversationQueryService.getConversationById(conversationId, userId, isBusinessOwner);
  }

  async getUserConversations(
    userId: string,
    filters: ConversationFilterInput
  ): Promise<PaginatedConversations> {
    return conversationQueryService.getUserConversations(userId, filters);
  }

  async getBusinessConversations(
    businessId: string,
    ownerId: string,
    filters: BusinessInboxFilterInput
  ): Promise<PaginatedConversations> {
    return conversationQueryService.getBusinessConversations(businessId, ownerId, filters);
  }

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
    return conversationQueryService.getBusinessInbox(businessId, ownerId, filters);
  }

  async getBusinessUnreadCount(businessId: string, ownerId: string): Promise<number> {
    return conversationQueryService.getBusinessUnreadCount(businessId, ownerId);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return conversationQueryService.getUnreadCount(userId);
  }

  // ─── Delegated status transitions ────────────────────────────

  async archiveConversation(
    conversationId: string,
    userId: string,
    auditContext: AuditContext
  ): Promise<void> {
    return conversationStatusService.archiveConversation(conversationId, userId, auditContext);
  }

  async unarchiveConversation(
    conversationId: string,
    userId: string,
    auditContext: AuditContext
  ): Promise<void> {
    return conversationStatusService.unarchiveConversation(conversationId, userId, auditContext);
  }

  async blockConversation(
    conversationId: string,
    ownerId: string,
    auditContext: AuditContext
  ): Promise<void> {
    return conversationStatusService.blockConversation(conversationId, ownerId, auditContext);
  }

  async unblockConversation(
    conversationId: string,
    ownerId: string,
    auditContext: AuditContext
  ): Promise<void> {
    return conversationStatusService.unblockConversation(conversationId, ownerId, auditContext);
  }

  async reportConversation(
    conversationId: string,
    userId: string,
    input: ReportConversationInput,
    auditContext: AuditContext
  ): Promise<void> {
    return conversationStatusService.reportConversation(conversationId, userId, input, auditContext);
  }
}

export const conversationService = new ConversationService();
