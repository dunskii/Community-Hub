/**
 * Admin Types
 *
 * Shared type definitions for admin sub-services.
 * Extracted from the monolithic admin-service.ts during Phase 3 decomposition.
 */

import type { UserRole, UserStatus, BusinessStatus, EventStatus } from '../../generated/prisma/index.js';

// ─── Dashboard Types ────────────────────────────────────────

export interface DashboardOverview {
  activeUsers: number;
  totalUsers: number;
  newRegistrations: number;
  pendingApprovals: {
    businesses: number;
    reviews: number;
    events: number;
    claims: number;
    total: number;
  };
  activeBusinesses: number;
  totalBusinesses: number;
  upcomingEvents: number;
  totalDeals: number;
  recentActivity: Array<{
    id: string;
    action: string;
    targetType: string;
    targetId: string;
    targetName: string | null;
    actorRole: string;
    actorName: string | null;
    createdAt: Date;
  }>;
}

// ─── Analytics Types ────────────────────────────────────────

export interface PlatformAnalyticsResponse {
  period: {
    startDate: Date;
    endDate: Date;
    daysInPeriod: number;
  };
  summary: {
    totalProfileViews: number;
    totalUniqueViews: number;
    totalSearchAppearances: number;
    totalWebsiteClicks: number;
    totalPhoneClicks: number;
    totalDirectionsClicks: number;
    totalPhotoViews: number;
    totalSaves: number;
    totalReviews: number;
    totalMessages: number;
    totalDealClicks: number;
    totalVoucherReveals: number;
  };
  topBusinesses: Array<{
    id: string;
    name: string;
    slug: string;
    profileViews: number;
    phoneClicks: number;
    websiteClicks: number;
  }>;
  timeseries: Array<{
    date: string;
    profileViews: number;
    phoneClicks: number;
    websiteClicks: number;
    directionsClicks: number;
    searchAppearances: number;
  }>;
  growth: {
    newUsers: number;
    newBusinesses: number;
    newReviews: number;
    newEvents: number;
  };
}

// ─── User List Types ────────────────────────────────────────

export interface AdminUserListItem {
  id: string;
  email: string;
  displayName: string;
  profilePhoto: string | null;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  createdAt: Date;
  lastLogin: Date | null;
  businessCount: number;
}

// ─── Business List Types ────────────────────────────────────

export interface AdminBusinessListItem {
  id: string;
  name: string;
  slug: string;
  status: BusinessStatus;
  claimed: boolean;
  claimedBy: string | null;
  categoryName: string;
  phone: string;
  email: string | null;
  featured: boolean;
  createdAt: Date;
  reviewCount: number;
  dealCount: number;
  ownerName: string | null;
}

// ─── Event List Types ───────────────────────────────────────

export interface AdminEventListItem {
  id: string;
  title: string;
  slug: string | null;
  status: EventStatus;
  startTime: Date;
  endTime: Date;
  locationType: string;
  capacity: number | null;
  rsvpCount: number;
  createdByName: string;
  businessName: string | null;
  createdAt: Date;
}

// ─── Admin Action Context ───────────────────────────────────

export interface AdminActionContext {
  adminId: string;
  ipAddress: string;
  userAgent: string;
}
