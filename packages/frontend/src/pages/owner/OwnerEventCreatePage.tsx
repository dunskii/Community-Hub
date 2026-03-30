/**
 * OwnerEventCreatePage
 *
 * Business owner page for creating events linked to their business.
 * Events are created with PENDING status and require admin/curator approval.
 * Uses the existing EventForm component.
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { PageContainer } from '../../components/layout/PageContainer';
import { EventForm } from '../../components/events/EventForm';
import { eventService, type EventCategory } from '../../services/event-service';
import { businessApi } from '../../services/business-api';
import { Skeleton } from '../../components/display/Skeleton';
import { ExclamationTriangleIcon, ArrowLeftIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { useToast } from '../../hooks/useToast';
import type { EventCreateInput, EventUpdateInput } from '@community-hub/shared';

export function OwnerEventCreatePage() {
  const { t } = useTranslation();
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const backUrl = `/business/manage/${businessId}/events`;

  useEffect(() => {
    async function loadData() {
      if (!businessId) return;
      try {
        const [cats, businessRes] = await Promise.all([
          businessApi.listCategories({ type: 'EVENT' }),
          businessApi.getBusinessById(businessId),
        ]);
        setCategories(
          cats.map((c) => ({
            id: c.id,
            name: typeof c.name === 'object' ? c.name as Record<string, string> : { en: String(c.name) },
            slug: c.slug,
            icon: c.icon || 'default',
          }))
        );
        const name = businessRes.name;
        setBusinessName(typeof name === 'string' ? name : name?.en || '');
      } catch (err) {
        setError(err instanceof Error ? err.message : t('common.error', 'Something went wrong'));
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [businessId]);

  const handleSubmit = async (data: EventCreateInput | EventUpdateInput) => {
    if (!businessId) return;
    try {
      setSubmitting(true);
      setError(null);
      await eventService.createEvent({
        ...(data as EventCreateInput),
        linkedBusinessId: businessId,
      });
      showToast({ message: t('owner.events.createSuccess'), type: 'success' });
      navigate(backUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error', 'Something went wrong'));
      setSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const platformName = import.meta.env.VITE_PLATFORM_NAME || 'Community Hub';

  return (
    <PageContainer>
      <Helmet>
        <title>{t('owner.events.createEvent')} | {platformName}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="max-w-4xl mx-auto space-y-6">
        <button
          type="button"
          onClick={() => navigate(backUrl)}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          {t('owner.events.backToEvents')}
        </button>

        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          {t('owner.events.createEvent')}
          {businessName && (
            <span className="text-slate-400 font-normal text-lg ms-2">— {businessName}</span>
          )}
        </h1>

        {/* Pending approval notice */}
        <div className="flex items-start gap-3 rounded-2xl bg-blue-50 dark:bg-blue-900/20 p-4 text-blue-700 dark:text-blue-300">
          <InformationCircleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{t('owner.events.pendingNotice')}</p>
        </div>

        {error && (
          <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 p-4 text-red-600 dark:text-red-400">
            <ExclamationTriangleIcon className="h-5 w-5 inline me-2" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            <Skeleton width="100%" height="48px" />
            <Skeleton width="100%" height="120px" />
            <Skeleton width="100%" height="48px" />
            <Skeleton width="100%" height="48px" />
          </div>
        ) : (
          <EventForm
            categories={categories}
            onSubmit={handleSubmit}
            onCancel={() => navigate(backUrl)}
            loading={submitting}
          />
        )}
      </div>
    </PageContainer>
  );
}
