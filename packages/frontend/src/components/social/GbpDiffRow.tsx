/**
 * GbpDiffRow
 *
 * Displays a single field comparison between current business data
 * and Google Business Profile data, with a checkbox to select for sync.
 */

import { useTranslation } from 'react-i18next';
import type { GbpSyncField } from '@community-hub/shared';

interface GbpDiffRowProps {
  field: GbpSyncField;
  currentValue: string;
  googleValue: string;
  selected: boolean;
  onToggle: (field: GbpSyncField) => void;
}

const FIELD_LABEL_KEYS: Record<GbpSyncField, string> = {
  name: 'social.gbp.fieldName',
  phone: 'social.gbp.fieldPhone',
  website: 'social.gbp.fieldWebsite',
  description: 'social.gbp.fieldDescription',
  address: 'social.gbp.fieldAddress',
  operatingHours: 'social.gbp.fieldHours',
  categories: 'social.gbp.fieldCategories',
  photos: 'social.gbp.fieldPhotos',
};

export function GbpDiffRow({ field, currentValue, googleValue, selected, onToggle }: GbpDiffRowProps) {
  const { t } = useTranslation();
  const checkboxId = `gbp-sync-${field}`;
  const hasChange = currentValue !== googleValue;

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
        selected
          ? 'border-primary bg-primary/5 dark:bg-primary/10'
          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
      }`}
    >
      <div className="flex items-center pt-0.5">
        <input
          type="checkbox"
          id={checkboxId}
          checked={selected}
          onChange={() => onToggle(field)}
          className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
          aria-describedby={`${checkboxId}-desc`}
        />
      </div>

      <label htmlFor={checkboxId} className="flex-1 cursor-pointer min-w-0">
        <span className="block text-sm font-medium text-slate-900 dark:text-white">
          {t(FIELD_LABEL_KEYS[field], field)}
        </span>

        <div id={`${checkboxId}-desc`} className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          {/* Current value */}
          <div className="min-w-0">
            <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              {t('social.gbp.currentValue', 'Current')}
            </span>
            <p className={`mt-0.5 truncate ${hasChange ? 'text-slate-500 dark:text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>
              {currentValue || <span className="italic text-slate-400">{t('social.gbp.notSet', 'Not set')}</span>}
            </p>
          </div>

          {/* Google value */}
          <div className="min-w-0">
            <span className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wide">
              {t('social.gbp.googleValue', 'Google')}
            </span>
            <p className={`mt-0.5 truncate ${hasChange ? 'text-blue-700 dark:text-blue-300 font-medium' : 'text-slate-700 dark:text-slate-300'}`}>
              {googleValue || <span className="italic text-slate-400">{t('social.gbp.notSet', 'Not set')}</span>}
            </p>
          </div>
        </div>
      </label>
    </div>
  );
}
