/**
 * HighlyRatedSection Component
 * Phase 5: Search & Discovery - Homepage Discovery
 *
 * Displays highly rated businesses (4.5+ stars)
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { searchBusinesses } from '../../services/search-api.js';
import { logger } from '../../utils/logger.js';
import type { BusinessSearchResult } from '@community-hub/shared';

export function HighlyRatedSection() {
  const { t } = useTranslation('home');
  const [businesses, setBusinesses] = useState<BusinessSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHighlyRated = async () => {
      try {
        const response = await searchBusinesses({
          rating: 4.5,
          sort: 'rating',
          limit: 6,
        });
        setBusinesses(response.results);
      } catch (error) {
        logger.error('Failed to fetch highly rated businesses', error instanceof Error ? error : undefined);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHighlyRated();
  }, []);

  if (isLoading) {
    return (
      <section>
        <h2 className="text-3xl font-bold text-dark mb-6">{t('highlyRated.title')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-neutral-light rounded-lg mb-2" />
              <div className="h-3 bg-neutral-light rounded w-full mb-1" />
              <div className="h-3 bg-neutral-light rounded w-2/3" />
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
          <h2 className="text-3xl font-bold text-dark mb-1">{t('highlyRated.title')}</h2>
          <p className="text-neutral-dark">{t('highlyRated.subtitle')}</p>
        </div>
        <a
          href="/search?rating=4.5&sort=rating"
          className="text-primary hover:text-primary-shade-10 font-medium text-sm transition-colors"
        >
          {t('highlyRated.viewAll')} →
        </a>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {businesses.map((business) => (
          <a
            key={business.id}
            href={`/businesses/${business.id}`}
            className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
          >
            {/* Business Image */}
            <div className="h-32 bg-neutral-light relative">
              {business.photos && business.photos.length > 0 ? (
                <img
                  src={business.photos[0]}
                  alt={business.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-warning-tint-90 to-warning-tint-80">
                  <span className="text-3xl text-warning opacity-40">
                    {business.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}

              {/* Rating Badge */}
              <div className="absolute top-2 right-2 bg-warning text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {business.rating.toFixed(1)}
              </div>
            </div>

            {/* Business Info */}
            <div className="p-3">
              <h3 className="text-sm font-semibold text-dark line-clamp-1 mb-1">
                {business.name}
              </h3>
              <p className="text-xs text-neutral-dark line-clamp-1">
                {business.categoryName}
              </p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
