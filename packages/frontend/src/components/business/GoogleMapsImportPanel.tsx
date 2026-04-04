/**
 * GoogleMapsImportPanel
 *
 * Allows business owners to import profile data from Google Maps (Places API).
 * Shows a diff of current vs Google data and lets the owner selectively apply fields.
 * No OAuth required - uses server-side Places API key.
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MapPinIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import { businessApi, type GooglePlacesEnrichedData } from '../../services/business-api';
import type { FormData, OperatingHoursEntry } from '../../pages/owner/edit-business/types';

interface GoogleMapsImportPanelProps {
  businessId: string;
  formData: FormData;
  onFieldsApplied: (updates: Partial<FormData>) => void;
}

type ImportableField = 'phone' | 'website' | 'street' | 'suburb' | 'state' | 'postcode' | 'operatingHours';

interface FieldDiff {
  field: ImportableField;
  label: string;
  currentValue: string;
  googleValue: string;
  selected: boolean;
}

export function GoogleMapsImportPanel({ businessId, formData, onFieldsApplied }: GoogleMapsImportPanelProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enrichedData, setEnrichedData] = useState<GooglePlacesEnrichedData | null>(null);
  const [diffs, setDiffs] = useState<FieldDiff[]>([]);
  const [applied, setApplied] = useState(false);
  const [expanded, setExpanded] = useState(true);

  // ─── Fetch from Google ─────────────────────────────────

  const handleLookup = useCallback(async () => {
    setError(null);
    setApplied(false);
    setLoading(true);

    try {
      const data = await businessApi.lookupGoogle(businessId);
      setEnrichedData(data);

      // Build diffs for fields that differ
      const fieldDiffs: FieldDiff[] = [];

      const fields: Array<{ field: ImportableField; label: string; current: string; google: string }> = [
        {
          field: 'phone',
          label: t('editBusiness.fields.phone', 'Phone Number'),
          current: formData.phone,
          google: data.phone,
        },
        {
          field: 'website',
          label: t('editBusiness.fields.website', 'Website'),
          current: formData.website,
          google: data.website,
        },
        {
          field: 'street',
          label: t('editBusiness.fields.street', 'Street Address'),
          current: formData.street,
          google: data.street,
        },
        {
          field: 'suburb',
          label: t('editBusiness.fields.suburb', 'Suburb'),
          current: formData.suburb,
          google: data.suburb,
        },
        {
          field: 'state',
          label: t('editBusiness.fields.state', 'State'),
          current: formData.state,
          google: data.state,
        },
        {
          field: 'postcode',
          label: t('editBusiness.fields.postcode', 'Postcode'),
          current: formData.postcode,
          google: data.postcode,
        },
      ];

      for (const f of fields) {
        // Only show fields where Google has data and it differs from current
        if (f.google && f.google !== f.current) {
          fieldDiffs.push({
            field: f.field,
            label: f.label,
            currentValue: f.current || t('editBusiness.googleImport.empty', '(empty)'),
            googleValue: f.google,
            selected: !f.current, // Auto-select if current field is empty
          });
        }
      }

      // Operating hours
      if (data.operatingHours) {
        const hasHours = Object.values(formData.operatingHours).some(
          (h) => !h.closed && (h.open !== '09:00' || h.close !== '17:00'),
        );
        if (!hasHours) {
          fieldDiffs.push({
            field: 'operatingHours',
            label: t('editBusiness.tabs.hours', 'Operating Hours'),
            currentValue: t('editBusiness.googleImport.defaultHours', 'Default hours'),
            googleValue: formatHoursSummary(data.operatingHours),
            selected: true,
          });
        }
      }

      setDiffs(fieldDiffs);

      if (fieldDiffs.length === 0 && data) {
        setError(t('editBusiness.googleImport.noNewData', 'Google Maps data matches your current profile. No new data to import.'));
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('No matching')) {
        setError(t('editBusiness.googleImport.noMatch', 'Could not find your business on Google Maps. Make sure your business name and address are correct.'));
      } else {
        setError(
          err instanceof Error
            ? err.message
            : t('editBusiness.googleImport.error', 'Failed to look up business on Google Maps'),
        );
      }
    } finally {
      setLoading(false);
    }
  }, [businessId, formData, t]);

  // ─── Toggle field selection ────────────────────────────

  const toggleField = (field: ImportableField) => {
    setDiffs((prev) =>
      prev.map((d) => (d.field === field ? { ...d, selected: !d.selected } : d)),
    );
  };

  // ─── Apply selected fields ────────────────────────────

  const handleApply = useCallback(() => {
    if (!enrichedData) return;

    const updates: Partial<FormData> = {};
    const selectedDiffs = diffs.filter((d) => d.selected);

    for (const diff of selectedDiffs) {
      switch (diff.field) {
        case 'phone':
          updates.phone = enrichedData.phone;
          break;
        case 'website':
          updates.website = enrichedData.website;
          break;
        case 'street':
          updates.street = enrichedData.street;
          break;
        case 'suburb':
          updates.suburb = enrichedData.suburb;
          break;
        case 'state':
          updates.state = enrichedData.state;
          break;
        case 'postcode':
          updates.postcode = enrichedData.postcode;
          break;
        case 'operatingHours':
          if (enrichedData.operatingHours) {
            const hours: Record<string, OperatingHoursEntry> = {};
            const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            for (const day of days) {
              const googleHours = enrichedData.operatingHours[day];
              if (googleHours) {
                hours[day] = {
                  open: googleHours.open,
                  close: googleHours.close,
                  closed: false,
                  byAppointment: false,
                };
              } else {
                hours[day] = { open: '', close: '', closed: true, byAppointment: false };
              }
            }
            updates.operatingHours = hours;
          }
          break;
      }
    }

    onFieldsApplied(updates);
    setApplied(true);
    setDiffs([]);
  }, [enrichedData, diffs, onFieldsApplied]);

  // ─── Render ────────────────────────────────────────────

  const selectedCount = diffs.filter((d) => d.selected).length;

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-blue-100/50 dark:hover:bg-blue-900/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
            <MapPinIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200">
              {t('editBusiness.googleImport.title', 'Import from Google Maps')}
            </h3>
            <p className="text-xs text-blue-700 dark:text-blue-400">
              {t(
                'editBusiness.googleImport.description',
                'Auto-fill your profile with data from Google Maps - phone, address, website, hours',
              )}
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronUpIcon className="h-5 w-5 text-blue-500 flex-shrink-0" />
        ) : (
          <ChevronDownIcon className="h-5 w-5 text-blue-500 flex-shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
              <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Applied success */}
          {applied && (
            <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
              <CheckCircleIcon className="h-5 w-5 flex-shrink-0" />
              <span>
                {t(
                  'editBusiness.googleImport.applied',
                  'Google Maps data applied to your form. Click "Save Changes" below to save.',
                )}
              </span>
            </div>
          )}

          {/* Lookup button (shown when no diffs yet) */}
          {diffs.length === 0 && !applied && (
            <button
              type="button"
              onClick={handleLookup}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <MapPinIcon className="h-4 w-4 mr-2" />
              )}
              {loading
                ? t('editBusiness.googleImport.looking', 'Looking up on Google Maps...')
                : t('editBusiness.googleImport.lookupButton', 'Look up on Google Maps')}
            </button>
          )}

          {/* Google match info */}
          {enrichedData && diffs.length > 0 && (
            <>
              <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100/50 dark:bg-blue-900/30 rounded-lg px-3 py-2">
                {t('editBusiness.googleImport.matchFound', 'Found: {{name}}', { name: enrichedData.name })}
                {enrichedData.rating && (
                  <span className="ml-2">
                    ({enrichedData.rating}/5, {enrichedData.userRatingCount} {t('editBusiness.googleImport.reviews', 'reviews')})
                  </span>
                )}
              </div>

              {/* Diff table */}
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                      <th className="py-2 px-3 text-left w-8"></th>
                      <th className="py-2 px-3 text-left text-xs font-medium text-slate-500 uppercase">
                        {t('editBusiness.googleImport.field', 'Field')}
                      </th>
                      <th className="py-2 px-3 text-left text-xs font-medium text-slate-500 uppercase">
                        {t('editBusiness.googleImport.current', 'Current')}
                      </th>
                      <th className="py-2 px-3 text-left text-xs font-medium text-slate-500 uppercase">
                        {t('editBusiness.googleImport.fromGoogle', 'From Google')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {diffs.map((diff) => (
                      <tr
                        key={diff.field}
                        className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30"
                      >
                        <td className="py-2 px-3">
                          <input
                            type="checkbox"
                            checked={diff.selected}
                            onChange={() => toggleField(diff.field)}
                            className="rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary"
                            aria-label={t('editBusiness.googleImport.selectField', 'Import {{field}}', { field: diff.label })}
                          />
                        </td>
                        <td className="py-2 px-3 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {diff.label}
                        </td>
                        <td className="py-2 px-3 text-slate-500 dark:text-slate-400 max-w-[200px] truncate">
                          {diff.currentValue}
                        </td>
                        <td className="py-2 px-3 text-blue-700 dark:text-blue-300 font-medium max-w-[200px] truncate">
                          {diff.googleValue}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Apply button */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={selectedCount === 0}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  {t('editBusiness.googleImport.applyButton', 'Apply {{count}} Fields', {
                    count: selectedCount,
                  })}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDiffs([]);
                    setEnrichedData(null);
                  }}
                  className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────

function formatHoursSummary(hours: Record<string, { open: string; close: string }>): string {
  const entries = Object.entries(hours);
  if (entries.length === 0) return '';

  // Check if all days have same hours
  const [firstDay] = entries;
  if (!firstDay) return '';
  const allSame = entries.every(
    ([, h]) => h.open === firstDay[1].open && h.close === firstDay[1].close,
  );

  if (allSame) {
    return `${firstDay[1].open} - ${firstDay[1].close} (all days)`;
  }

  return entries
    .map(([day, h]) => `${day.substring(0, 3)}: ${h.open}-${h.close}`)
    .join(', ');
}
