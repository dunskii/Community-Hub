/**
 * DigestPreferencesPanel
 *
 * Toggles for opting in/out of weekly digest emails
 * containing deals and events from saved businesses.
 * WCAG 2.1 AA compliant.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Toggle } from '../form/Toggle';
import { useAuth } from '../../hooks/useAuth';
import { put } from '../../services/api-client';
import { useToastHelpers } from '../../hooks/useToast';

export function DigestPreferencesPanel() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const toast = useToastHelpers();

  const [receiveDealEmails, setReceiveDealEmails] = useState(user?.receiveDealEmails ?? false);
  const [receiveEventEmails, setReceiveEventEmails] = useState(user?.receiveEventEmails ?? false);
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = async (field: 'receiveDealEmails' | 'receiveEventEmails', value: boolean) => {
    if (!user) return;

    const prev = field === 'receiveDealEmails' ? receiveDealEmails : receiveEventEmails;

    // Optimistic update
    if (field === 'receiveDealEmails') {
      setReceiveDealEmails(value);
    } else {
      setReceiveEventEmails(value);
    }

    setIsSaving(true);

    try {
      await put(`/users/${user.id}/preferences`, {
        [field]: value,
      });
      toast.success(t('digest.saved', 'Preferences saved'));
    } catch {
      // Revert on error
      if (field === 'receiveDealEmails') {
        setReceiveDealEmails(prev);
      } else {
        setReceiveEventEmails(prev);
      }
      toast.error(t('common.error', 'Something went wrong'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section
      className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 mb-6"
      aria-labelledby="digest-preferences-title"
    >
      <h2
        id="digest-preferences-title"
        className="text-lg font-semibold text-slate-900 dark:text-white mb-1"
      >
        {t('digest.title', 'Weekly Email Updates')}
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        {t('digest.description', 'Get a weekly email with the latest deals and events from your saved businesses.')}
      </p>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              {t('digest.dealAlerts', 'Deals & Promotions')}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('digest.dealAlertsDescription', 'Receive weekly deals from your saved businesses')}
            </p>
          </div>
          <Toggle
            id="digest-deals"
            checked={receiveDealEmails}
            onChange={(e) => handleToggle('receiveDealEmails', e.target.checked)}
            disabled={isSaving}
            aria-label={t('digest.dealAlerts', 'Deals & Promotions')}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              {t('digest.eventAlerts', 'Upcoming Events')}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('digest.eventAlertsDescription', 'Receive weekly event updates from your saved businesses')}
            </p>
          </div>
          <Toggle
            id="digest-events"
            checked={receiveEventEmails}
            onChange={(e) => handleToggle('receiveEventEmails', e.target.checked)}
            disabled={isSaving}
            aria-label={t('digest.eventAlerts', 'Upcoming Events')}
          />
        </div>
      </div>
    </section>
  );
}
