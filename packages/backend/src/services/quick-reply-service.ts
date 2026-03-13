/**
 * Quick Reply Service
 * Phase 9: Messaging System
 * Spec §16.2: Quick Reply Templates
 *
 * Handles CRUD operations for business quick reply templates.
 */

import { prisma } from '../db/index.js';
import { Prisma } from '../generated/prisma/index.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/api-error.js';
import type { QuickReplyTemplateInput, ReorderTemplatesInput } from '@community-hub/shared';
import { ActorRole } from '../generated/prisma/index.js';

// ─── Types ────────────────────────────────────────────────────

export interface AuditContext {
  actorId: string;
  actorRole: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface QuickReplyTemplate {
  id: string;
  businessId: string;
  name: string;
  content: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Constants ────────────────────────────────────────────────

const MAX_TEMPLATES_PER_BUSINESS = 10;

// ─── Service Implementation ───────────────────────────────────

class QuickReplyService {
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
   * Create a new quick reply template
   */
  async createTemplate(
    businessId: string,
    ownerId: string,
    input: QuickReplyTemplateInput,
    auditContext: AuditContext
  ): Promise<QuickReplyTemplate> {
    logger.info({ businessId, ownerId }, 'Creating quick reply template');

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

    // Check template limit
    const existingCount = await prisma.quickReplyTemplate.count({
      where: { businessId },
    });

    if (existingCount >= MAX_TEMPLATES_PER_BUSINESS) {
      throw ApiError.badRequest(
        'TEMPLATE_LIMIT_REACHED',
        `Maximum ${MAX_TEMPLATES_PER_BUSINESS} templates allowed per business`
      );
    }

    // Get next order value
    const maxOrder = await prisma.quickReplyTemplate.aggregate({
      where: { businessId },
      _max: { order: true },
    });

    const nextOrder = (maxOrder._max.order ?? -1) + 1;

    // Create template
    const template = await prisma.quickReplyTemplate.create({
      data: {
        businessId,
        name: input.name,
        content: input.content,
        order: nextOrder,
      },
    });

    // Log audit
    await this.createAuditLog({
      actorId: auditContext.actorId,
      actorRole: auditContext.actorRole,
      action: 'quickReply.create',
      targetType: 'QuickReplyTemplate',
      targetId: template.id,
      newValue: { name: input.name, businessId },
      ipAddress: auditContext.ipAddress || '',
      userAgent: auditContext.userAgent || '',
    });

    return template;
  }

  /**
   * Get all templates for a business
   */
  async getTemplates(businessId: string, ownerId: string): Promise<QuickReplyTemplate[]> {
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

    const templates = await prisma.quickReplyTemplate.findMany({
      where: { businessId },
      orderBy: { order: 'asc' },
    });

    return templates;
  }

  /**
   * Get a single template by ID
   */
  async getTemplateById(templateId: string, ownerId: string): Promise<QuickReplyTemplate> {
    const template = await prisma.quickReplyTemplate.findUnique({
      where: { id: templateId },
      include: {
        business: {
          select: { claimedBy: true },
        },
      },
    });

    if (!template) {
      throw ApiError.notFound('TEMPLATE_NOT_FOUND', 'Template not found');
    }

    if (template.business.claimedBy !== ownerId) {
      throw ApiError.forbidden('NOT_OWNER', 'You do not own this business');
    }

    return {
      id: template.id,
      businessId: template.businessId,
      name: template.name,
      content: template.content,
      order: template.order,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }

  /**
   * Update a template
   */
  async updateTemplate(
    templateId: string,
    ownerId: string,
    input: QuickReplyTemplateInput,
    auditContext: AuditContext
  ): Promise<QuickReplyTemplate> {
    logger.info({ templateId, ownerId }, 'Updating quick reply template');

    const template = await prisma.quickReplyTemplate.findUnique({
      where: { id: templateId },
      include: {
        business: {
          select: { claimedBy: true },
        },
      },
    });

    if (!template) {
      throw ApiError.notFound('TEMPLATE_NOT_FOUND', 'Template not found');
    }

    if (template.business.claimedBy !== ownerId) {
      throw ApiError.forbidden('NOT_OWNER', 'You do not own this business');
    }

    const previousValue = { name: template.name, content: template.content };

    const updatedTemplate = await prisma.quickReplyTemplate.update({
      where: { id: templateId },
      data: {
        name: input.name,
        content: input.content,
      },
    });

    // Log audit
    await this.createAuditLog({
      actorId: auditContext.actorId,
      actorRole: auditContext.actorRole,
      action: 'quickReply.update',
      targetType: 'QuickReplyTemplate',
      targetId: templateId,
      previousValue,
      newValue: { name: input.name, content: input.content },
      ipAddress: auditContext.ipAddress || '',
      userAgent: auditContext.userAgent || '',
    });

    return updatedTemplate;
  }

  /**
   * Delete a template
   */
  async deleteTemplate(
    templateId: string,
    ownerId: string,
    auditContext: AuditContext
  ): Promise<void> {
    logger.info({ templateId, ownerId }, 'Deleting quick reply template');

    const template = await prisma.quickReplyTemplate.findUnique({
      where: { id: templateId },
      include: {
        business: {
          select: { claimedBy: true },
        },
      },
    });

    if (!template) {
      throw ApiError.notFound('TEMPLATE_NOT_FOUND', 'Template not found');
    }

    if (template.business.claimedBy !== ownerId) {
      throw ApiError.forbidden('NOT_OWNER', 'You do not own this business');
    }

    await prisma.quickReplyTemplate.delete({
      where: { id: templateId },
    });

    // Log audit
    await this.createAuditLog({
      actorId: auditContext.actorId,
      actorRole: auditContext.actorRole,
      action: 'quickReply.delete',
      targetType: 'QuickReplyTemplate',
      targetId: templateId,
      previousValue: { name: template.name, businessId: template.businessId },
      ipAddress: auditContext.ipAddress || '',
      userAgent: auditContext.userAgent || '',
    });
  }

  /**
   * Reorder templates
   */
  async reorderTemplates(
    businessId: string,
    ownerId: string,
    input: ReorderTemplatesInput,
    auditContext: AuditContext
  ): Promise<QuickReplyTemplate[]> {
    logger.info({ businessId, ownerId }, 'Reordering quick reply templates');

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

    // Verify all template IDs belong to this business
    const templates = await prisma.quickReplyTemplate.findMany({
      where: { businessId },
    });

    const templateIds = new Set(templates.map((t) => t.id));

    for (const id of input.templateIds) {
      if (!templateIds.has(id)) {
        throw ApiError.badRequest('INVALID_TEMPLATE_ID', `Template ${id} does not belong to this business`);
      }
    }

    // Update order in transaction
    await prisma.$transaction(
      input.templateIds.map((templateId, index) =>
        prisma.quickReplyTemplate.update({
          where: { id: templateId },
          data: { order: index },
        })
      )
    );

    // Log audit
    await this.createAuditLog({
      actorId: auditContext.actorId,
      actorRole: auditContext.actorRole,
      action: 'quickReply.reorder',
      targetType: 'Business',
      targetId: businessId,
      newValue: { templateIds: input.templateIds },
      ipAddress: auditContext.ipAddress || '',
      userAgent: auditContext.userAgent || '',
    });

    // Return updated templates
    return this.getTemplates(businessId, ownerId);
  }
}

export const quickReplyService = new QuickReplyService();
