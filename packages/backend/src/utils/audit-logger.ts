/**
 * Shared Audit Logger
 * Phase 0: Cross-cutting utility extraction
 *
 * Provides a single createAuditLog() function used by all services
 * to record actions in the audit_logs table.
 */

import crypto from 'crypto';
import { prisma } from '../db/index.js';
import { logger } from './logger.js';
import type { AuditContext } from '../types/service-types.js';

export interface CreateAuditLogParams {
  /** The audit context (actor, IP, user agent) */
  context: AuditContext;
  /** Action identifier, e.g. 'event.create', 'review.approve' */
  action: string;
  /** Entity type, e.g. 'Event', 'Review', 'Business' */
  targetType: string;
  /** Entity ID */
  targetId: string;
  /** State before the action (null for creates) */
  previousValue?: unknown;
  /** State after the action (null for deletes) */
  newValue?: unknown;
}

/**
 * Creates an audit log entry. Never throws — failures are logged and swallowed
 * so that audit logging cannot break the primary operation.
 */
export async function createAuditLog(params: CreateAuditLogParams): Promise<void> {
  try {
    await prisma.audit_logs.create({
      data: {
        id: crypto.randomUUID(),
        actor_id: params.context.actorId,
        actor_role: params.context.actorRole as
          | 'USER'
          | 'BUSINESS_OWNER'
          | 'MODERATOR'
          | 'ADMIN'
          | 'SYSTEM',
        action: params.action,
        target_type: params.targetType,
        target_id: params.targetId,
        previous_value: params.previousValue
          ? JSON.parse(JSON.stringify(params.previousValue))
          : null,
        new_value: params.newValue
          ? JSON.parse(JSON.stringify(params.newValue))
          : null,
        ip_address: params.context.ipAddress || 'unknown',
        user_agent: params.context.userAgent || 'unknown',
      },
    });
  } catch (error) {
    logger.error(
      { error, action: params.action, targetType: params.targetType, targetId: params.targetId },
      'Failed to create audit log'
    );
  }
}
