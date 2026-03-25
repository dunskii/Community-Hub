/**
 * AdminEventCreatePage
 *
 * Admin page for creating platform events.
 * Uses the existing EventForm component.
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { PageContainer } from '../../components/layout/PageContainer';
import { EventForm } from '../../components/events/EventForm';
import { eventService, type EventCategory } from '../../services/event-service';
import { businessApi } from '../../services/business-api';
import { Skeleton } from '../../components/display/Skeleton';
import { ExclamationTriangleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import type { EventCreateInput, EventUpdateInput } from '@community-hub/shared';

export function AdminEventCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCategories() {
      try {
        const cats = await businessApi.listCategories({ type: 'EVENT' });
        setCategories(
          cats.map((c) => ({
            id: c.id,
            name: typeof c.name === 'object' ? c.name as Record<string, string> : { en: String(c.name) },
            slug: c.slug,
            icon: c.icon || 'default',
          }))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load categories');
      } finally {
        setLoading(false);
      }
    }
    loadCategories();
  }, []);

  const handleSubmit = async (data: EventCreateInput | EventUpdateInput) => {
    try {
      setSubmitting(true);
      setError(null);
      await eventService.createEvent(data as EventCreateInput);
      navigate('/admin/events');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
      setSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <Helmet>
        <title>{t('admin.events.createEvent')} | Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="max-w-4xl mx-auto space-y-6">
        <button
          type="button"
          onClick={() => navigate('/admin/events')}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          {t('admin.events.backToEvents')}
        </button>

        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          {t('admin.events.createEvent')}
        </h1>

        {error && (
          <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 p-4 text-red-600 dark:text-red-400">
            <ExclamationTriangleIcon className="h-5 w-5 inline mr-2" />
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
            onCancel={() => navigate('/admin/events')}
            loading={submitting}
          />
        )}
      </div>
    </PageContainer>
  );
}
