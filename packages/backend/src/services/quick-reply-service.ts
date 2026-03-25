/**
 * Quick Reply Service
 * Phase 9: Messaging System
 * Spec §16.2: Quick Reply Templates
 *
 * Handles CRUD operations for business quick reply templates.
 */

import crypto from 'crypto';
import { prisma } from '../db/index.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/api-error.js';
import { createAuditLog } from '../utils/audit-logger.js';
import type { QuickReplyTemplateInput, ReorderTemplatesInput } from '@community-hub/shared';
import type { AuditContext } from '../types/service-types.js';

export type { AuditContext };

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

    // Check template limit
    const existingCount = await prisma.quick_reply_templates.count({
      where: { business_id: businessId },
    });

    if (existingCount >= MAX_TEMPLATES_PER_BUSINESS) {
      throw ApiError.badRequest(
        'TEMPLATE_LIMIT_REACHED',
        `Maximum ${MAX_TEMPLATES_PER_BUSINESS} templates allowed per business`
      );
    }

    // Get next order value
    const maxOrder = await prisma.quick_reply_templates.aggregate({
      where: { business_id: businessId },
      _max: { order: true },
    });

    const nextOrder = (maxOrder._max.order ?? -1) + 1;

    // Create template
    const template = await prisma.quick_reply_templates.create({
      data: {
        id: crypto.randomUUID(),
        business_id: businessId,
        name: input.name,
        content: input.content,
        order: nextOrder,
        updated_at: new Date(),
      },
    });

    // Log audit
    await createAuditLog({
      context: auditContext,
      action: 'quickReply.create',
      targetType: 'QuickReplyTemplate',
      targetId: template.id,
      newValue: { name: input.name, businessId },
    });

    return {
      id: template.id,
      businessId: template.business_id,
      name: template.name,
      content: template.content,
      order: template.order,
      createdAt: template.created_at,
      updatedAt: template.updated_at,
    };
  }

  /**
   * Get all templates for a business
   */
  async getTemplates(businessId: string, ownerId: string): Promise<QuickReplyTemplate[]> {
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

    const templates = await prisma.quick_reply_templates.findMany({
      where: { business_id: businessId },
      orderBy: { order: 'asc' },
    });

    return templates.map((t) => ({
      id: t.id,
      businessId: t.business_id,
      name: t.name,
      content: t.content,
      order: t.order,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    }));
  }

  /**
   * Get a single template by ID
   */
  async getTemplateById(templateId: string, ownerId: string): Promise<QuickReplyTemplate> {
    const template = await prisma.quick_reply_templates.findUnique({
      where: { id: templateId },
      include: {
        businesses: {
          select: { claimed_by: true },
        },
      },
    });

    if (!template) {
      throw ApiError.notFound('TEMPLATE_NOT_FOUND', 'Template not found');
    }

    if (template.businesses.claimed_by !== ownerId) {
      throw ApiError.forbidden('NOT_OWNER', 'You do not own this business');
    }

    return {
      id: template.id,
      businessId: template.business_id,
      name: template.name,
      content: template.content,
      order: template.order,
      createdAt: template.created_at,
      updatedAt: template.updated_at,
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

    const template = await prisma.quick_reply_templates.findUnique({
      where: { id: templateId },
      include: {
        businesses: {
          select: { claimed_by: true },
        },
      },
    });

    if (!template) {
      throw ApiError.notFound('TEMPLATE_NOT_FOUND', 'Template not found');
    }

    if (template.businesses.claimed_by !== ownerId) {
      throw ApiError.forbidden('NOT_OWNER', 'You do not own this business');
    }

    const previousValue = { name: template.name, content: template.content };

    const updatedTemplate = await prisma.quick_reply_templates.update({
      where: { id: templateId },
      data: {
        name: input.name,
        content: input.content,
        updated_at: new Date(),
      },
    });

    // Log audit
    await createAuditLog({
      context: auditContext,
      action: 'quickReply.update',
      targetType: 'QuickReplyTemplate',
      targetId: templateId,
      previousValue,
      newValue: { name: input.name, content: input.content },
    });

    return {
      id: updatedTemplate.id,
      businessId: updatedTemplate.business_id,
      name: updatedTemplate.name,
      content: updatedTemplate.content,
      order: updatedTemplate.order,
      createdAt: updatedTemplate.created_at,
      updatedAt: updatedTemplate.updated_at,
    };
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

    const template = await prisma.quick_reply_templates.findUnique({
      where: { id: templateId },
      include: {
        businesses: {
          select: { claimed_by: true },
        },
      },
    });

    if (!template) {
      throw ApiError.notFound('TEMPLATE_NOT_FOUND', 'Template not found');
    }

    if (template.businesses.claimed_by !== ownerId) {
      throw ApiError.forbidden('NOT_OWNER', 'You do not own this business');
    }

    await prisma.quick_reply_templates.delete({
      where: { id: templateId },
    });

    // Log audit
    await createAuditLog({
      context: auditContext,
      action: 'quickReply.delete',
      targetType: 'QuickReplyTemplate',
      targetId: templateId,
      previousValue: { name: template.name, businessId: template.business_id },
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

    // Verify all template IDs belong to this business
    const templates = await prisma.quick_reply_templates.findMany({
      where: { business_id: businessId },
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
        prisma.quick_reply_templates.update({
          where: { id: templateId },
          data: { order: index },
        })
      )
    );

    // Log audit
    await createAuditLog({
      context: auditContext,
      action: 'quickReply.reorder',
      targetType: 'Business',
      targetId: businessId,
      newValue: { templateIds: input.templateIds },
    });

    // Return updated templates
    return this.getTemplates(businessId, ownerId);
  }
}

export const quickReplyService = new QuickReplyService();
