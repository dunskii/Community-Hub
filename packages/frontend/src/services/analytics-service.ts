/**
 * Analytics Service
 *
 * Frontend API client for business analytics.
 * Spec §13.4: Business Analytics
 */

import { get, post } from './api-client';

// ─── Types ──────────────────────────────────────────────────

export type Granularity = 'day' | 'week' | 'month';
export type AnalyticsEventType =
  | 'PROFILE_VIEW'
  | 'SEARCH_APPEARANCE'
  | 'WEBSITE_CLICK'
  | 'PHONE_CLICK'
  | 'DIRECTIONS_CLICK'
  | 'PHOTO_VIEW'
  | 'SAVE'
  | 'UNSAVE'
  | 'FOLLOW'
  | 'UNFOLLOW'
  | 'REVIEW_CREATED'
  | 'MESSAGE_SENT';

export type ReferralSource = 'search' | 'homepage' | 'saved_list' | 'direct' | 'external';

export interface MetricSummary {
  current: number;
  previous: number;
  changePercent: number;
  trend: 'up' | 'down' | 'flat';
}

export interface AnalyticsResponse {
  businessId: string;
  businessName: string;
  period: {
    startDate: string;
    endDate: string;
    previousStart: string;
    previousEnd: string;
    daysInPeriod: number;
  };
  summary: {
    profileViews: MetricSummary;
    uniqueViews: MetricSummary;
    searchAppearances: MetricSummary;
    clicks: {
      website: MetricSummary;
      phone: MetricSummary;
      directions: MetricSummary;
      total: MetricSummary;
    };
    photoViews: MetricSummary;
    saves: MetricSummary;
    follows: MetricSummary;
    reviews: {
      count: MetricSummary;
      averageRating: number;
      newReviews: number;
    };
  };
  timeseries: Array<{
    date: string;
    profileViews: number;
    uniqueViews: number;
    searchAppearances: number;
    websiteClicks: number;
    phoneClicks: number;
    directionsClicks: number;
    photoViews: number;
    saves: number;
    follows: number;
    reviews: number;
  }>;
  insights: {
    topSearchTerms: Array<{ term: string; count: number }>;
    referralSources: Array<{ source: string; count: number; percentage: number }>;
    peakActivityTimes: Array<{ dayOfWeek: string; hour: number; count: number }>;
  };
}

export interface AnalyticsQueryOptions {
  startDate: string;
  endDate: string;
  granularity?: Granularity;
}

// ─── API Functions ──────────────────────────────────────────

/**
 * Get business analytics for date range
 */
export async function getAnalytics(
  businessId: string,
  options: AnalyticsQueryOptions
): Promise<AnalyticsResponse> {
  const params = new URLSearchParams({
    startDate: options.startDate,
    endDate: options.endDate,
    ...(options.granularity && { granularity: options.granularity }),
  });

  const response = await get<{ success: boolean; data: AnalyticsResponse }>(
    `/businesses/${businessId}/analytics?${params}`
  );
  return response.data;
}

/**
 * Export analytics as CSV
 */
export function getAnalyticsExportUrl(
  businessId: string,
  startDate: string,
  endDate: string,
  format: 'csv' | 'pdf' = 'csv'
): string {
  const params = new URLSearchParams({
    startDate,
    endDate,
    format,
  });
  const baseUrl = import.meta.env.VITE_API_URL || '/api/v1';
  return `${baseUrl}/businesses/${businessId}/analytics/export?${params}`;
}

/**
 * Track an analytics event
 */
export async function trackEvent(
  businessId: string,
  eventType: AnalyticsEventType,
  options?: {
    referralSource?: ReferralSource;
    searchTerm?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  await post(`/analytics/track/${businessId}`, {
    eventType,
    ...options,
  });
}

/**
 * Track a profile view
 */
export async function trackProfileView(
  businessId: string,
  referralSource?: ReferralSource,
  searchTerm?: string
): Promise<void> {
  await post(`/analytics/profile-view/${businessId}`, {
    referralSource,
    searchTerm,
  });
}

/**
 * Get default date range (last 30 days)
 */
export function getDefaultDateRange(): { startDate: string; endDate: string } {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  return {
    startDate: startDate.toISOString().split('T')[0] ?? '',
    endDate: endDate.toISOString().split('T')[0] ?? '',
  };
}

/**
 * Format number with trend indicator
 */
export function formatMetricWithTrend(metric: MetricSummary): {
  value: string;
  trend: string;
  trendClass: string;
} {
  const value = metric.current.toLocaleString();
  const changeAbs = Math.abs(metric.changePercent);
  const changeStr = changeAbs > 0 ? `${changeAbs}%` : '0%';

  let trend: string;
  let trendClass: string;

  switch (metric.trend) {
    case 'up':
      trend = `+${changeStr}`;
      trendClass = 'trend-up';
      break;
    case 'down':
      trend = `-${changeStr}`;
      trendClass = 'trend-down';
      break;
    default:
      trend = changeStr;
      trendClass = 'trend-flat';
  }

  return { value, trend, trendClass };
}
