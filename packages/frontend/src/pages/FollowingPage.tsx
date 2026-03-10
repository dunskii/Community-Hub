/**
 * FollowingPage
 * Page for viewing businesses the user is following
 * WCAG 2.1 AA compliant
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { EmptyState } from '../components/display/EmptyState';
import { Skeleton } from '../components/display/Skeleton';
import { Pagination } from '../components/display/Pagination';
import { FollowButton } from '../components/FollowButton';
import { StarRating } from '../components/StarRating';
import { followService } from '../services/follow-service';
import { useAuth } from '../hooks/useAuth';
import './FollowingPage.css';

interface FollowedBusiness {
  id: string;
  businessId: string;
  followedAt: string;
  business: {
    id: string;
    name: string;
    slug: string;
    categoryPrimary?: {
      name: string;
    };
    rating?: number;
    reviewCount?: number;
    photos?: string[];
  };
}

export function FollowingPage() {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const [following, setFollowing] = useState<FollowedBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 12;

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const fetchFollowing = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await followService.getFollowedBusinesses({ page, limit });
        setFollowing(response.data.businesses || []);
        setTotal(response.data.total || 0);
        setTotalPages(Math.ceil((response.data.total || 0) / limit));
      } catch {
        setError(t('following.fetchError'));
      } finally {
        setLoading(false);
      }
    };

    fetchFollowing();
  }, [isAuthenticated, page, t]);

  const handleUnfollow = async (businessId: string) => {
    try {
      await followService.unfollowBusiness(businessId);
      setFollowing((prev) => prev.filter((f) => f.business.id !== businessId));
      setTotal((prev) => prev - 1);
    } catch {
      // Error handled silently - optimistic update will be reverted on next fetch
    }
  };

  if (!isAuthenticated) {
    return (
      <PageContainer>
        <Helmet>
          <title>{t('following.title')} | {t('common.siteName')}</title>
        </Helmet>
        <EmptyState
          title={t('following.loginRequired')}
          description={t('following.loginDescription')}
          icon="👤"
          action={{
            label: t('common.login'),
            href: '/login',
          }}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Helmet>
        <title>{t('following.title')} | {t('common.siteName')}</title>
        <meta name="description" content={t('following.description')} />
      </Helmet>

      <div className="following-page">
        <header className="following-page__header">
          <h1 className="following-page__title">{t('following.title')}</h1>
          <p className="following-page__subtitle">
            {t('following.subtitle', { count: total })}
          </p>
        </header>

        {loading ? (
          <div className="following-page__loading">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="following-page__skeleton">
                <Skeleton variant="rectangular" width="100%" height="120px" />
                <Skeleton variant="text" width="80%" height="24px" />
                <Skeleton variant="text" width="60%" height="20px" />
              </div>
            ))}
          </div>
        ) : error ? (
          <EmptyState
            title={t('following.errorTitle')}
            description={error}
            icon="⚠️"
          />
        ) : following.length === 0 ? (
          <EmptyState
            title={t('following.emptyTitle')}
            description={t('following.emptyDescription')}
            icon="🏪"
            action={{
              label: t('following.browseBusinesses'),
              href: '/businesses',
            }}
          />
        ) : (
          <>
            <div className="following-page__grid" role="list">
              {following.map((item) => (
                <article
                  key={item.id}
                  className="following-page__card"
                  role="listitem"
                >
                  <Link
                    to={`/businesses/${item.business.slug}`}
                    className="following-page__card-link"
                  >
                    {item.business.photos?.[0] ? (
                      <img
                        src={item.business.photos[0]}
                        alt={item.business.name}
                        className="following-page__card-image"
                        loading="lazy"
                      />
                    ) : (
                      <div className="following-page__card-placeholder">
                        <span aria-hidden="true">🏪</span>
                      </div>
                    )}

                    <div className="following-page__card-content">
                      <h2 className="following-page__card-title">
                        {item.business.name}
                      </h2>

                      {item.business.categoryPrimary && (
                        <span className="following-page__card-category">
                          {item.business.categoryPrimary.name}
                        </span>
                      )}

                      {item.business.rating && (
                        <div className="following-page__card-rating">
                          <StarRating rating={item.business.rating} size="sm" readOnly />
                          {item.business.reviewCount && (
                            <span className="following-page__card-reviews">
                              ({item.business.reviewCount})
                            </span>
                          )}
                        </div>
                      )}

                      <span className="following-page__card-date">
                        {t('following.followedSince', {
                          date: new Date(item.followedAt).toLocaleDateString(),
                        })}
                      </span>
                    </div>
                  </Link>

                  <div className="following-page__card-actions">
                    <FollowButton
                      isFollowing={true}
                      onClick={() => handleUnfollow(item.business.id)}
                      variant="outline"
                      size="sm"
                    />
                  </div>
                </article>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="following-page__pagination">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </PageContainer>
  );
}
