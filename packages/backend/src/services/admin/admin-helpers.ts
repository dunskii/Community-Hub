/**
 * Admin Helpers
 *
 * Shared helper functions for admin sub-services.
 * Extracted from the monolithic admin-service.ts during Phase 3 decomposition.
 */

import { prisma } from '../../db/index.js';
import type { DashboardOverview } from './admin-types.js';

/**
 * Resolve target names for audit log entries by batch-fetching
 * business, user, and event names.
 */
export async function resolveActivityTargets(
  logs: Array<{
    id: string;
    action: string;
    target_type: string;
    target_id: string;
    actor_role: string;
    actor_id: string | null;
    created_at: Date;
    users: { display_name: string } | null;
  }>
): Promise<DashboardOverview['recentActivity']> {
  // Collect target IDs by type
  const businessIds = new Set<string>();
  const userIds = new Set<string>();
  const eventIds = new Set<string>();

  for (const log of logs) {
    switch (log.target_type) {
      case 'Business': businessIds.add(log.target_id); break;
      case 'User': userIds.add(log.target_id); break;
      case 'Event': eventIds.add(log.target_id); break;
    }
  }

  // Batch-fetch names
  const [businesses, users, events] = await Promise.all([
    businessIds.size > 0
      ? prisma.businesses.findMany({ where: { id: { in: [...businessIds] } }, select: { id: true, name: true } })
      : [],
    userIds.size > 0
      ? prisma.users.findMany({ where: { id: { in: [...userIds] } }, select: { id: true, display_name: true } })
      : [],
    eventIds.size > 0
      ? prisma.events.findMany({ where: { id: { in: [...eventIds] } }, select: { id: true, title: true } })
      : [],
  ]);

  const nameMap = new Map<string, string>();
  for (const b of businesses) nameMap.set(b.id, b.name);
  for (const u of users) nameMap.set(u.id, u.display_name);
  for (const e of events) nameMap.set(e.id, e.title);

  return logs.map((log) => ({
    id: log.id,
    action: log.action,
    targetType: log.target_type,
    targetId: log.target_id,
    targetName: nameMap.get(log.target_id) || null,
    actorRole: log.actor_role,
    actorName: log.users?.display_name || null,
    createdAt: log.created_at,
  }));
}
