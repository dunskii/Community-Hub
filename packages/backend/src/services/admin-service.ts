/**
 * Admin Service — Re-export shim
 *
 * The monolithic admin-service has been decomposed into focused sub-services
 * under `./admin/`. This file re-exports the facade and types for backward
 * compatibility with any consumers that import from this path.
 */

export {
  AdminService,
  adminService,
  type DashboardOverview,
  type PlatformAnalyticsResponse,
  type AdminUserListItem,
  type AdminBusinessListItem,
  type AdminEventListItem,
  type AdminActionContext,
} from './admin/index.js';
