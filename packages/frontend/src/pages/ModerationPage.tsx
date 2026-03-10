/**
 * ModerationPage
 * Admin page for content moderation
 * WCAG 2.1 AA compliant, requires ADMIN or SUPER_ADMIN role
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { PageContainer } from '../components/layout/PageContainer';
import { ModerationQueue, type ModerationItem } from '../components/ModerationQueue';
import { EmptyState } from '../components/display/EmptyState';
import { Alert } from '../components/display/Alert';
import { Select } from '../components/form/Select';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../services/api-client';
import './ModerationPage.css';

type ModerationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

interface ModerationReviewResponse {
  id: string;
  businessId: string;
  userId: string;
  rating: number;
  title?: string;
  content: string;
  language: string;
  createdAt: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  flagCount?: number;
  business?: {
    name: string;
  };
  user?: {
    name: string;
    avatarUrl?: string;
  };
}

export function ModerationPage() {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();

  const [items, setItems] = useState<ModerationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [status, setStatus] = useState<ModerationStatus>('PENDING');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchModerationQueue();
    }
  }, [isAuthenticated, isAdmin, page, status]);

  const fetchModerationQueue = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('status', status);
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const response = await apiClient.get<{
        success: boolean;
        data: {
          reviews: ModerationReviewResponse[];
          total: number;
          page: number;
          limit: number;
        };
      }>(`/admin/moderation/reviews?${params.toString()}`);

      // Transform API response to ModerationItem format
      const transformedItems: ModerationItem[] = response.data.reviews.map((review) => ({
        id: review.id,
        type: 'review' as const,
        review: {
          id: review.id,
          business: {
            id: review.businessId,
            name: review.business?.name || 'Unknown Business',
          },
          user: {
            id: review.userId,
            name: review.user?.name || 'Anonymous',
            avatarUrl: review.user?.avatarUrl,
          },
          rating: review.rating,
          title: review.title,
          content: review.content,
          language: review.language,
          createdAt: new Date(review.createdAt),
        },
        priority: review.priority || 'MEDIUM',
        flagCount: review.flagCount || 0,
      }));

      setItems(transformedItems);
      setTotal(response.data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch moderation queue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (itemId: string, notes?: string) => {
    try {
      await apiClient.post(`/admin/moderation/reviews/${itemId}/approve`, {
        notes,
      });
      await fetchModerationQueue();
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to approve review');
    }
  };

  const handleReject = async (itemId: string, reason: string, notes?: string) => {
    try {
      await apiClient.post(`/admin/moderation/reviews/${itemId}/reject`, {
        reason,
        notes,
      });
      await fetchModerationQueue();
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to reject review');
    }
  };

  if (!isAuthenticated) {
    return (
      <PageContainer>
        <EmptyState
          title={t('moderation.loginRequired')}
          description={t('moderation.loginRequiredDescription')}
          icon="🔒"
          action={{
            label: t('auth.login'),
            href: '/login',
          }}
        />
      </PageContainer>
    );
  }

  if (!isAdmin) {
    return (
      <PageContainer>
        <EmptyState
          title={t('moderation.accessDenied')}
          description={t('moderation.accessDeniedDescription')}
          icon="🚫"
        />
      </PageContainer>
    );
  }

  const statusOptions = [
    { value: 'PENDING', label: t('moderation.status.pending') },
    { value: 'APPROVED', label: t('moderation.status.approved') },
    { value: 'REJECTED', label: t('moderation.status.rejected') },
  ];

  return (
    <>
      <Helmet>
        <title>{t('moderation.pageTitle')}</title>
        <meta name="description" content={t('moderation.pageDescription')} />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <PageContainer>
        <div className="moderation-page">
          <header className="moderation-page__header">
            <div className="moderation-page__title-section">
              <h1 className="moderation-page__title">{t('moderation.pageTitle')}</h1>
              <p className="moderation-page__subtitle">
                {t('moderation.pageSubtitle')}
              </p>
            </div>

            <div className="moderation-page__filters">
              <Select
                id="moderation-status"
                label={t('moderation.filterByStatus')}
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as ModerationStatus);
                  setPage(1);
                }}
                options={statusOptions}
              />
            </div>
          </header>

          {error && <Alert variant="error" message={error} />}

          <ModerationQueue
            items={items}
            total={total}
            page={page}
            limit={limit}
            isLoading={isLoading}
            onPageChange={setPage}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        </div>
      </PageContainer>
    </>
  );
}
