/**
 * Shared Service Types
 * Phase 0: Cross-cutting utility extraction
 *
 * Common interfaces used across multiple backend services.
 */

/**
 * Context for audit log entries.
 * Passed through from middleware to service methods.
 */
export interface AuditContext {
  actorId: string;
  actorRole: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Standard pagination parameters used by list endpoints.
 */
export interface PaginationOptions {
  page: number;
  limit: number;
}
