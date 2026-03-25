/**
 * FeaturedBusinesses Component
 * Phase 5: Search & Discovery - Homepage Discovery
 *
 * Carousel of admin-selected featured businesses
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Carousel } from '../display/Carousel.js';
import { get } from '../../services/api-client.js';
import { logger } from '../../utils/logger.js';
import type { BusinessSearchResult } from '@community-hub/shared';

/**
 * Extract the best image URL from a business record.
 * The /businesses API returns snake_case fields (cover_photo, gallery)
 * while the search API returns camelCase (photos).
 */
function getBusinessImageUrl(business: BusinessSearchResult): string | undefined {
  const biz = business as unknown as Record<string, unknown>;
  // 1. cover_photo (set by owner as featured image)
  if (biz.cover_photo && typeof biz.cover_photo === 'string') return biz.cover_photo;
  // 2. photos array (from normalized data or search results)
  if (business.photos && business.photos.length > 0) return business.photos[0];
  // 3. gallery JSON array (raw Prisma data)
  if (biz.gallery && Array.isArray(biz.gallery) && biz.gallery.length > 0) {
    const first = biz.gallery[0] as string | { url: string };
    return typeof first === 'string' ? first : first?.url;
  }
  return undefined;
}

export function FeaturedBusinesses() {
  const { t } = useTranslation('home');
  const [businesses, setBusinesses] = useState<BusinessSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const response = await get<{ success: boolean; data: { results?: BusinessSearchResult[]; businesses?: BusinessSearchResult[] } }>(
          '/businesses?featured=true&sort=displayOrder&limit=10'
        );
        setBusinesses(response.data.results || response.data.businesses || []);
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
              {pageBiz.map((business) => {
                const imageUrl = getBusinessImageUrl(business);
                return (
                  <a
                    key={business.id}
                    href={`/businesses/${(business as unknown as Record<string, unknown>).slug || business.id}`}
                    className="block bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-700"
                  >
                    {/* Business Image */}
                    <div className="h-48 bg-neutral-light relative overflow-hidden">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={business.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '';
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                            (e.currentTarget.nextElementSibling as HTMLElement)?.style.setProperty('display', 'flex');
                          }}
                        />
                      ) : null}
                      <div
                        className="w-full h-full items-center justify-center bg-gradient-to-br from-primary-tint-90 to-primary-tint-80 absolute inset-0"
                        style={{ display: imageUrl ? 'none' : 'flex' }}
                      >
                        <span className="text-6xl text-primary opacity-30">
                          {business.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      {business.verified && (
                        <div className="absolute top-2 right-2 bg-primary text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          {t('featured.verified')}
                        </div>
                      )}
                    </div>

                    {/* Business Info */}
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-dark mb-1 line-clamp-1">
                        {business.name}
                      </h3>
                      <p className="text-sm text-neutral-dark mb-2">{business.categoryName}</p>
                      <p className="text-sm text-dark line-clamp-2 mb-3">
                        {typeof business.description === 'string'
                          ? business.description
                          : (business.description as Record<string, string>)?.en || ''}
                      </p>

                      {/* Rating */}
                      {(business.rating != null) && (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`h-4 w-4 ${i < Math.floor(business.rating ?? 0) ? 'text-warning' : 'text-neutral-light'}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="text-sm text-neutral-dark">
                            {(business.rating ?? 0).toFixed(1)} ({business.reviewCount ?? 0})
                          </span>
                        </div>
                      )}
                    </div>
                  </a>
                );
              })}
            </div>
          );
        })}
      </Carousel>
    </section>
  );
}
