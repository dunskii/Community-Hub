/**
 * GbpSyncPanel
 *
 * Allows business owners to fetch their Google Business Profile data,
 * compare it with the current local data, and selectively apply changes.
 *
 * Spec §26.1: Google Business Profile API — Import direction
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { socialApi } from '../../services/social-api';
import { GbpDiffRow } from './GbpDiffRow';
import type { GbpProfileData, GbpSyncField, GbpSyncStatus } from '@community-hub/shared';
import type { FormData, OperatingHoursEntry } from '../../pages/owner/edit-business/types';

interface GbpSyncPanelProps {
  businessId: string;
  formData: FormData;
  onFieldsApplied: (updates: Partial<FormData>) => void;
}

/** Format address fields into a single display string */
function formatAddress(formData: FormData): string {
  const parts = [formData.street, formData.suburb, formData.state, formData.postcode].filter(Boolean);
  return parts.join(', ');
}

/** Format GBP address into a display string */
function formatGbpAddress(addr?: GbpProfileData['address']): string {
  if (!addr) return '';
  const parts = [addr.street, addr.suburb, addr.state, addr.postcode].filter(Boolean);
  return parts.join(', ');
}

/** Format operating hours into a compact display string */
function formatHours(hours: Record<string, OperatingHoursEntry | { open: string; close: string; closed: boolean }>): string {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const parts: string[] = [];
  for (const day of days) {
    const h = hours[day];
    if (!h || h.closed) {
      parts.push(`${day.slice(0, 3)}: closed`);
    } else {
      parts.push(`${day.slice(0, 3)}: ${h.open}-${h.close}`);
    }
  }
  return parts.join(', ');
}

/** Format categories array */
function formatCategories(cats?: string[]): string {
  if (!cats || cats.length === 0) return '';
  return cats.join(', ');
}

/** Get photo count (formatted with i18n in the component) */
function getPhotoCount(photos?: Array<{ url: string; category: string }>): number {
  return photos?.length ?? 0;
}

/** Get the current value for a field from form data as a display string */
function getCurrentFieldValue(field: GbpSyncField, formData: FormData): string {
  switch (field) {
    case 'name':
      return formData.name || '';
    case 'phone':
      return formData.phone || '';
    case 'website':
      return formData.website || '';
    case 'description':
      return formData.description || '';
    case 'address':
      return formatAddress(formData);
    case 'operatingHours':
      return Object.keys(formData.operatingHours).length > 0
        ? formatHours(formData.operatingHours)
        : '';
    case 'categories':
      return ''; // Categories come from DB, not form
    case 'photos':
      return ''; // Photos managed separately
    default:
      return '';
  }
}

/** Get the GBP value for a field as a display string */
function getGbpFieldValue(field: GbpSyncField, gbpData: GbpProfileData): string {
  switch (field) {
    case 'name':
      return gbpData.name || '';
    case 'phone':
      return gbpData.phone || '';
    case 'website':
      return gbpData.website || '';
    case 'description':
      return gbpData.description || '';
    case 'address':
      return formatGbpAddress(gbpData.address);
    case 'operatingHours':
      return gbpData.operatingHours
        ? formatHours(gbpData.operatingHours)
        : '';
    case 'categories':
      return formatCategories(gbpData.categories);
    case 'photos': {
      const count = getPhotoCount(gbpData.photos);
      return count > 0 ? String(count) : '';
    }
    default:
      return '';
  }
}

/** Map GBP data to form data fields for the callback */
function mapGbpToFormUpdates(fields: GbpSyncField[], gbpData: GbpProfileData): Partial<FormData> {
  const updates: Partial<FormData> = {};

  for (const field of fields) {
    switch (field) {
      case 'name':
        if (gbpData.name) updates.name = gbpData.name;
        break;
      case 'phone':
        if (gbpData.phone) updates.phone = gbpData.phone;
        break;
      case 'website':
        if (gbpData.website) updates.website = gbpData.website;
        break;
      case 'description':
        if (gbpData.description) updates.description = gbpData.description;
        break;
      case 'address':
        if (gbpData.address) {
          updates.street = gbpData.address.street || '';
          updates.suburb = gbpData.address.suburb || '';
          updates.state = gbpData.address.state || '';
          updates.postcode = gbpData.address.postcode || '';
        }
        break;
      case 'operatingHours':
        if (gbpData.operatingHours) {
          const mapped: Record<string, OperatingHoursEntry> = {};
          for (const [day, hours] of Object.entries(gbpData.operatingHours)) {
            mapped[day] = { ...hours, byAppointment: false };
          }
          updates.operatingHours = mapped;
        }
        break;
      // categories and photos are applied via API only, not form state
    }
  }

  return updates;
}

const ALL_FIELDS: GbpSyncField[] = ['name', 'phone', 'website', 'description', 'address', 'operatingHours', 'categories', 'photos'];

export function GbpSyncPanel({ businessId, formData, onFieldsApplied }: GbpSyncPanelProps) {
  const { t } = useTranslation();

  const [syncStatus, setSyncStatus] = useState<GbpSyncStatus | null>(null);
  const [gbpData, setGbpData] = useState<GbpProfileData | null>(null);
  const [selectedFields, setSelectedFields] = useState<Set<GbpSyncField>>(new Set());
  const [fetching, setFetching] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Fetch sync status on mount
  useEffect(() => {
    let cancelled = false;
    async function loadStatus() {
      try {
        const status = await socialApi.getGbpSyncStatus(businessId);
        if (!cancelled) setSyncStatus(status);
      } catch {
        // Non-critical — just means we can't show status
      } finally {
        if (!cancelled) setLoadingStatus(false);
      }
    }
    loadStatus();
    return () => { cancelled = true; };
  }, [businessId]);

  // Fetch GBP profile data
  const handleFetch = useCallback(async () => {
    setFetching(true);
    setError(null);
    setSuccessMessage(null);
    setGbpData(null);
    setSelectedFields(new Set());

    try {
      const profile = await socialApi.fetchGbpProfile(businessId);
      setGbpData(profile);

      // Auto-select fields that differ from current data
      const changed = new Set<GbpSyncField>();
      for (const field of ALL_FIELDS) {
        const current = getCurrentFieldValue(field, formData);
        const google = getGbpFieldValue(field, profile);
        if (google && current !== google) {
          changed.add(field);
        }
      }
      setSelectedFields(changed);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('social.gbp.syncFailed', 'Failed to sync from Google Business Profile.');
      setError(message);
    } finally {
      setFetching(false);
    }
  }, [businessId, formData, t]);

  // Apply selected fields
  const handleApply = useCallback(async () => {
    if (!gbpData || selectedFields.size === 0) return;

    setApplying(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const fields = Array.from(selectedFields);
      const result = await socialApi.applyGbpSync(businessId, fields, gbpData);

      // Update form state with the applied values
      const formUpdates = mapGbpToFormUpdates(fields, gbpData);
      if (Object.keys(formUpdates).length > 0) {
        onFieldsApplied(formUpdates);
      }

      setSyncStatus(prev => prev ? {
        ...prev,
        lastSyncAt: result.syncedAt,
        syncStatus: result.status,
      } : null);

      setSuccessMessage(
        t('social.gbp.syncSuccess', 'Business profile updated from Google Business Profile.') +
        ` (${result.fieldsUpdated.length} field(s))`
      );
      setGbpData(null);
      setSelectedFields(new Set());
    } catch (err) {
      const message = err instanceof Error ? err.message : t('social.gbp.syncFailed', 'Failed to sync.');
      setError(message);
    } finally {
      setApplying(false);
    }
  }, [businessId, gbpData, selectedFields, onFieldsApplied, t]);

  const toggleField = useCallback((field: GbpSyncField) => {
    setSelectedFields(prev => {
      const next = new Set(prev);
      if (next.has(field)) {
        next.delete(field);
      } else {
        next.add(field);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (!gbpData) return;
    const available = ALL_FIELDS.filter(f => getGbpFieldValue(f, gbpData));
    setSelectedFields(new Set(available));
  }, [gbpData]);

  const deselectAll = useCallback(() => {
    setSelectedFields(new Set());
  }, []);

  // Loading state for initial status check
  if (loadingStatus) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-48" />
        <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-40" />
      </div>
    );
  }

  const isConnected = syncStatus?.isGbpConnected ?? false;

  return (
    <div className="space-y-4" role="region" aria-label={t('social.gbp.syncButton', 'Google Business Profile Sync')}>
      {/* Connection Status */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-slate-400'}`}
            aria-hidden="true"
          />
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {isConnected
              ? syncStatus?.locationName || t('social.gbp.connected', 'Connected')
              : t('social.gbp.notConnected', 'Connect your Google Business Profile to sync data.')}
          </span>
        </div>

        {syncStatus?.lastSyncAt && (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {t('social.gbp.lastSync', 'Last synced: {{date}}', {
              date: new Date(syncStatus.lastSyncAt).toLocaleDateString(),
            })}
          </span>
        )}
      </div>

      {/* Fetch Button */}
      {isConnected && !gbpData && (
        <button
          type="button"
          onClick={handleFetch}
          disabled={fetching}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-busy={fetching}
        >
          {fetching ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {t('social.gbp.fetching', 'Fetching data from Google...')}
            </>
          ) : (
            <>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {t('social.gbp.syncButton', 'Sync from Google')}
            </>
          )}
        </button>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800" role="alert">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800" role="status">
          <p className="text-sm text-green-700 dark:text-green-300">{successMessage}</p>
        </div>
      )}

      {/* Diff View */}
      {gbpData && (
        <div className="space-y-3" aria-live="polite">
          {/* Select All / Deselect All */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('social.gbp.selectFields', 'Select fields to import:')}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                {t('social.gbp.selectAll', 'Select All')}
              </button>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <button
                type="button"
                onClick={deselectAll}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                {t('social.gbp.deselectAll', 'Deselect All')}
              </button>
            </div>
          </div>

          {/* Field Rows */}
          <div className="space-y-2">
            {ALL_FIELDS.map(field => {
              const googleValue = getGbpFieldValue(field, gbpData);
              // Only show fields that have GBP data
              if (!googleValue) return null;

              // Format photos with i18n
              const displayGoogleValue = field === 'photos'
                ? t('social.gbp.photoCount', '{{count}} photo(s)', { count: Number(googleValue) })
                : googleValue;

              return (
                <GbpDiffRow
                  key={field}
                  field={field}
                  currentValue={getCurrentFieldValue(field, formData)}
                  googleValue={displayGoogleValue}
                  selected={selectedFields.has(field)}
                  onToggle={toggleField}
                />
              );
            })}
          </div>

          {/* No changes message */}
          {ALL_FIELDS.every(f => !getGbpFieldValue(f, gbpData)) && (
            <p className="text-sm text-slate-500 dark:text-slate-400 italic">
              {t('social.gbp.noChanges', 'Your local data matches Google Business Profile.')}
            </p>
          )}

          {/* Apply Button */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleApply}
              disabled={applying || selectedFields.size === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-busy={applying}
            >
              {applying ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t('social.gbp.applying', 'Applying changes...')}
                </>
              ) : (
                t('social.gbp.syncApply', 'Apply Selected Changes')
              )}
            </button>

            <button
              type="button"
              onClick={() => { setGbpData(null); setSelectedFields(new Set()); }}
              className="px-4 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              {t('common.cancel', 'Cancel')}
            </button>

            {selectedFields.size > 0 && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {selectedFields.size} {t('social.gbp.fieldsSelected', 'field(s) selected')}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
