/**
 * Conversation Status Service
 * Phase 9: Messaging System — State transitions
 *
 * Handles archive, unarchive, block, unblock, and report operations.
 */

import crypto from 'crypto';
import { prisma } from '../../db/index.js';
import { logger } from '../../utils/logger.js';
import { ApiError } from '../../utils/api-error.js';
import { createAuditLog } from '../../utils/audit-logger.js';
import { ConversationStatus, ContentType, ReportReason } from '../../generated/prisma/index.js';
import type { ReportConversationInput } from '@community-hub/shared';
import { invalidateConversationCache } from './conversation-cache.js';
import type { AuditContext } from './conversation-types.js';

// ─── Service ─────────────────────────────────────────────────

export class ConversationStatusService {
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

    await createAuditLog({
      context: auditContext,
      action: 'conversation.archive',
      targetType: 'Conversation',
      targetId: conversationId,
      previousValue: { status: conversation.status },
      newValue: { status: ConversationStatus.ARCHIVED },
    });

    await invalidateConversationCache(userId);
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

    await createAuditLog({
      context: auditContext,
      action: 'conversation.unarchive',
      targetType: 'Conversation',
      targetId: conversationId,
      previousValue: { status: ConversationStatus.ARCHIVED },
      newValue: { status: ConversationStatus.ACTIVE },
    });

    await invalidateConversationCache(userId);
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

    await createAuditLog({
      context: auditContext,
      action: 'conversation.block',
      targetType: 'Conversation',
      targetId: conversationId,
      previousValue: { status: conversation.status },
      newValue: { status: ConversationStatus.BLOCKED },
    });

    await invalidateConversationCache(conversation.user_id, conversation.business_id);
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

    await createAuditLog({
      context: auditContext,
      action: 'conversation.unblock',
      targetType: 'Conversation',
      targetId: conversationId,
      previousValue: { status: ConversationStatus.BLOCKED },
      newValue: { status: ConversationStatus.ACTIVE },
    });

    await invalidateConversationCache(conversation.user_id, conversation.business_id);
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

    await createAuditLog({
      context: auditContext,
      action: 'conversation.report',
      targetType: 'Conversation',
      targetId: conversationId,
      newValue: { reason: input.reason, details: input.details },
    });

    logger.info({ conversationId, userId, reason: input.reason }, 'Conversation reported');
  }
}

export const conversationStatusService = new ConversationStatusService();
