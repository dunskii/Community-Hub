/**
 * Admin Service — Barrel / Facade
 *
 * Re-exports all admin sub-services and provides a facade `AdminService` class
 * that delegates to domain-specific services. This preserves the existing API
 * so consumers (admin-controller.ts) can keep calling `adminService.methodName()`.
 */

import { AdminDashboardService } from './admin-dashboard-service.js';
import { AdminAnalyticsService } from './admin-analytics-service.js';
import { AdminUserService } from './admin-user-service.js';
import { AdminBusinessService } from './admin-business-service.js';
import { AdminEventService } from './admin-event-service.js';
import type { UserRole, BusinessStatus } from '../../generated/prisma/index.js';
// Re-export types so existing imports from the old path still resolve
export type {
  DashboardOverview,
  PlatformAnalyticsResponse,
  AdminUserListItem,
  AdminBusinessListItem,
  AdminEventListItem,
  AdminActionContext,
} from './admin-types.js';

// ─── Sub-service singletons ─────────────────────────────────

const dashboardService = new AdminDashboardService();
const analyticsService = new AdminAnalyticsService();
const userService = new AdminUserService();
const businessService = new AdminBusinessService();
const eventService = new AdminEventService();

// ─── Facade Class ───────────────────────────────────────────

export class AdminService {
  // Dashboard
  getDashboardOverview() {
    return dashboardService.getDashboardOverview();
  }

  // Analytics
  getPlatformAnalytics(startDate: Date, endDate: Date, granularity?: 'day' | 'week' | 'month') {
    return analyticsService.getPlatformAnalytics(startDate, endDate, granularity);
  }

  exportPlatformCSV(startDate: Date, endDate: Date) {
    return analyticsService.exportPlatformCSV(startDate, endDate);
  }

  // Users
  listUsers(options: { page: number; limit: number; role?: string; status?: string; search?: string; sort?: string }) {
    return userService.listUsers(options);
  }

  createUser(
    data: { email: string; password: string; displayName: string; role: UserRole },
    adminId: string,
    ipAddress: string,
    userAgent: string
  ) {
    return userService.createUser(data, { adminId, ipAddress, userAgent });
  }

  updateUserRole(userId: string, newRole: UserRole, adminId: string, ipAddress: string, userAgent: string) {
    return userService.updateUserRole(userId, newRole, { adminId, ipAddress, userAgent });
  }

  suspendUser(userId: string, reason: string, adminId: string, ipAddress: string, userAgent: string) {
    return userService.suspendUser(userId, reason, { adminId, ipAddress, userAgent });
  }

  unsuspendUser(userId: string, adminId: string, ipAddress: string, userAgent: string) {
    return userService.unsuspendUser(userId, { adminId, ipAddress, userAgent });
  }

  searchUsers(query: string, limit?: number) {
    return userService.searchUsers(query, limit);
  }

  // Businesses
  listBusinesses(options: { page: number; limit: number; status?: string; category?: string; claimed?: boolean; search?: string; sort?: string }) {
    return businessService.listBusinesses(options);
  }

  updateBusinessStatus(
    businessId: string,
    status: BusinessStatus,
    adminId: string,
    ipAddress: string,
    userAgent: string,
    reason?: string
  ) {
    return businessService.updateBusinessStatus(businessId, status, { adminId, ipAddress, userAgent }, reason);
  }

  assignBusinessOwner(
    businessId: string,
    userId: string | null,
    adminId: string,
    ipAddress: string,
    userAgent: string
  ) {
    return businessService.assignBusinessOwner(businessId, userId, { adminId, ipAddress, userAgent });
  }

  // Events
  listEvents(options: { page: number; limit: number; status?: string; search?: string; sort?: string }) {
    return eventService.listEvents(options);
  }
}

// Export singleton
export const adminService = new AdminService();
