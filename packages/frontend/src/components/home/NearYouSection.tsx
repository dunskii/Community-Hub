/**
 * NearYouSection Component
 * Phase 5: Search & Discovery - Homepage Discovery
 *
 * Displays businesses near user's location
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { searchBusinesses } from '../../services/search-api.js';
import { logger } from '../../utils/logger.js';
import type { BusinessSearchResult } from '@community-hub/shared';

export interface NearYouSectionProps {
  /** User's latitude */
  latitude: number;
  /** User's longitude */
  longitude: number;
}

export function NearYouSection({ latitude, longitude }: NearYouSectionProps) {
  const { t } = useTranslation('home');
  const [businesses, setBusinesses] = useState<BusinessSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNearby = async () => {
      try {
        const response = await searchBusinesses({
          lat: latitude,
          lng: longitude,
          distance: 5, // 5km radius
          sort: 'distance',
          limit: 6,
        });
        setBusinesses(response.results);
      } catch (error) {
        logger.error('Failed to fetch nearby businesses', error instanceof Error ? error : undefined);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNearby();
  }, [latitude, longitude]);

  if (isLoading) {
    return (
      <section>
        <h2 className="text-3xl font-bold text-dark mb-6">{t('nearYou.title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-48 bg-neutral-light rounded-lg mb-4" />
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
          <h2 className="text-3xl font-bold text-dark mb-1">{t('nearYou.title')}</h2>
          <p className="text-neutral-dark">{t('nearYou.subtitle')}</p>
        </div>
        <a
          href={`/search?lat=${latitude}&lng=${longitude}&distance=5&sort=distance`}
          className="text-primary hover:text-primary-shade-10 font-medium text-sm transition-colors"
        >
          {t('nearYou.viewAll')} →
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {businesses.map((business) => (
          <a
            key={business.id}
            href={`/businesses/${business.id}`}
            className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
          >
            {/* Business Image */}
            <div className="h-40 bg-neutral-light relative">
              {business.photos && business.photos.length > 0 ? (
                <img
                  src={business.photos[0]}
                  alt={business.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary-tint-90 to-secondary-tint-80">
                  <span className="text-5xl text-secondary opacity-30">
                    {business.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Business Info */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold text-dark line-clamp-1 flex-1">
                  {business.name}
                </h3>
                {business.verified && (
                  <svg className="h-5 w-5 text-primary flex-shrink-0 ml-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>

              <p className="text-sm text-neutral-dark mb-2">{business.categoryName}</p>

              {/* Rating & Distance */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <svg className="h-4 w-4 text-warning" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-sm text-dark font-medium">{business.rating.toFixed(1)}</span>
                  <span className="text-xs text-neutral-dark">({business.reviewCount})</span>
                </div>

                {business.distance !== undefined && (
                  <div className="flex items-center gap-1 text-sm text-neutral-dark">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {business.distance.toFixed(1)} km
                  </div>
                )}
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
