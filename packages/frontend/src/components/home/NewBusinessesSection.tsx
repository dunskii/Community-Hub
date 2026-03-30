/**
 * NewBusinessesSection Component
 * Phase 5: Search & Discovery - Homepage Discovery
 *
 * Displays recently added businesses
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { searchBusinesses } from '../../services/search-api.js';
import { logger } from '../../utils/logger.js';
import type { BusinessSearchResult } from '@community-hub/shared';

export function NewBusinessesSection() {
  const { t } = useTranslation('home');
  const [businesses, setBusinesses] = useState<BusinessSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNew = async () => {
      try {
        const response = await searchBusinesses({
          sort: 'newest',
          limit: 4,
        });
        setBusinesses(response.results);
      } catch (error) {
        logger.error('Failed to fetch new businesses', error instanceof Error ? error : undefined);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNew();
  }, []);

  if (isLoading) {
    return (
      <section>
        <h2 className="text-3xl font-bold text-dark mb-6">{t('newBusinesses.title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-40 bg-neutral-light rounded-lg mb-4" />
              <div className="h-4 bg-neutral-light rounded w-3/4 mb-2" />
              <div className="h-3 bg-neutral-light rounded w-1/2" />
            </div>
          ))}
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
        <div>
          <h2 className="text-3xl font-bold text-dark mb-1">{t('newBusinesses.title')}</h2>
          <p className="text-neutral-dark">{t('newBusinesses.subtitle')}</p>
        </div>
        <a
          href="/businesses?sort=newest"
          className="text-primary hover:text-primary-shade-10 font-medium text-sm transition-colors"
        >
          {t('newBusinesses.viewAll')} →
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {businesses.map((business) => (
          <a
            key={business.id}
            href={`/businesses/${business.id}`}
            className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
          >
            {/* Business Image */}
            <div className="h-40 bg-neutral-light relative overflow-hidden">
              {business.photos && business.photos.length > 0 ? (
                <img
                  src={business.photos[0]}
                  alt={business.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent-tint-90 to-accent-tint-80">
                  <span className="text-5xl text-accent opacity-30">
                    {business.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}

              {/* New Badge */}
              <div className="absolute top-2 left-2 bg-accent text-white px-3 py-1 rounded-full text-xs font-bold uppercase">
                {t('newBusinesses.badge')}
              </div>
            </div>

            {/* Business Info */}
            <div className="p-4">
              <h3 className="text-lg font-semibold text-dark line-clamp-1 mb-1">
                {business.name}
              </h3>
              <p className="text-sm text-neutral-dark mb-2">{business.categoryName}</p>
              <p className="text-sm text-dark line-clamp-2">
                {business.description}
              </p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
