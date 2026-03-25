/**
 * StatsStrip Component
 * Phase 5: Search & Discovery - Homepage Discovery
 *
 * Displays platform statistics (businesses, users, categories)
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { get } from '../../services/api-client.js';
import { logger } from '../../utils/logger.js';

interface PlatformStats {
  businessCount: number;
  userCount: number;
  categoryCount: number;
  reviewCount: number;
}

export function StatsStrip() {
  const { t } = useTranslation('home');
  const [stats, setStats] = useState<PlatformStats | null>(null);

  useEffect(() => {
    // Fetch stats from API
    const fetchStats = async () => {
      try {
        const response = await get<{ success: boolean; data: PlatformStats }>('/stats');
        setStats(response.data);
      } catch (error) {
        logger.error('Failed to fetch stats', error instanceof Error ? error : undefined);
        // Use fallback stats
        setStats({
          businessCount: 150,
          userCount: 1200,
          categoryCount: 12,
          reviewCount: 450,
        });
      }
    };

    fetchStats();
  }, []);

  if (!stats) {
    return null; // Or render skeleton
  }

  const statItems = [
    {
      label: t('stats.businesses'),
      value: stats.businessCount.toLocaleString(),
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      label: t('stats.users'),
      value: stats.userCount.toLocaleString(),
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      label: t('stats.categories'),
      value: stats.categoryCount.toLocaleString(),
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
    },
    {
      label: t('stats.reviews'),
      value: stats.reviewCount.toLocaleString(),
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="bg-white border-b border-neutral-light">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {statItems.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="flex justify-center mb-2 text-primary">
                {stat.icon}
              </div>
              <div className="text-3xl font-bold text-dark mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-neutral-dark">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
