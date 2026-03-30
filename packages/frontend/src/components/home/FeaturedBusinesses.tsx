/**
 * FeaturedBusinesses Component
 * Phase 5: Search & Discovery - Homepage Discovery
 *
 * Grid of admin-selected featured businesses using BusinessCard
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Carousel } from '../display/Carousel.js';
import { BusinessCard } from '../business/BusinessCard.js';
import { get } from '../../services/api-client.js';
import { normalizeBusiness } from '../../services/business-api.js';
import { logger } from '../../utils/logger.js';
import type { Business } from '@community-hub/shared';

export function FeaturedBusinesses() {
  const { t } = useTranslation('home');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const response = await get<{ success: boolean; data: { results?: Business[]; businesses?: Business[] } }>(
          '/businesses?featured=true&sort=displayOrder&limit=10'
        );
        const raw = response.data.results || response.data.businesses || [];
        setBusinesses(raw.map(b => normalizeBusiness(b as unknown as Record<string, unknown>)));
      } catch (error) {
        logger.error('Failed to fetch featured businesses', error instanceof Error ? error : undefined);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeatured();
  }, []);

  if (isLoading) {
    return (
      <section>
        <h2 className="text-3xl font-bold text-dark mb-6">{t('featured.title')}</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-64 bg-neutral-light rounded-lg" />
        </div>
      </section>
    );
  }

  if (businesses.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-dark">{t('featured.title')}</h2>
        <a
          href="/businesses"
          className="text-primary hover:text-primary-shade-10 font-medium text-sm transition-colors"
        >
          {t('featured.viewAll')} &rarr;
        </a>
      </div>

      <Carousel
        autoAdvance={6000}
        showIndicators={true}
        showNavigation={true}
      >
        {/* Group businesses into pages of 2 */}
        {Array.from({ length: Math.ceil(businesses.length / 2) }, (_, pageIndex) => {
          const pageBiz = businesses.slice(pageIndex * 2, pageIndex * 2 + 2);
          return (
            <div key={pageIndex} className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-1">
              {pageBiz.map((business) => (
                <BusinessCard key={business.id} business={business} />
              ))}
            </div>
          );
        })}
      </Carousel>
    </section>
  );
}
