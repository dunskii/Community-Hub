/**
 * OperatingHoursTab
 *
 * Hours grid with quick-set buttons for weekdays/weekends/all.
 */

import { FormSection } from './FormSection';
import { DAYS_OF_WEEK } from './constants';
import type { TabProps } from './types';

interface OperatingHoursTabProps extends TabProps {
  quickSetOpen: string;
  quickSetClose: string;
  setQuickSetOpen: (value: string) => void;
  setQuickSetClose: (value: string) => void;
  handleHoursChange: (day: string, field: 'open' | 'close' | 'closed' | 'byAppointment', value: string | boolean) => void;
  applyHoursToAll: (openTime: string, closeTime: string, daysToApply: 'all' | 'weekdays' | 'weekends') => void;
}

export function OperatingHoursTab({
  formData,
  t,
  quickSetOpen,
  quickSetClose,
  setQuickSetOpen,
  setQuickSetClose,
  handleHoursChange,
  applyHoursToAll,
}: OperatingHoursTabProps) {
  return (
    <div className="space-y-6">
      {/* Quick Set Section */}
      <div className="bg-primary/5 dark:bg-primary/10 rounded-xl p-4 border border-primary/20">
        <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-3">
          {t('editBusiness.quickSetHours', 'Quick Set Hours')}
        </h3>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <input
              type="time"
              value={quickSetOpen}
              onChange={(e) => setQuickSetOpen(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              aria-label={t('editBusiness.openTime', 'Opening time')}
            />
            <span className="text-slate-500 dark:text-slate-400 text-sm">to</span>
            <input
              type="time"
              value={quickSetClose}
              onChange={(e) => setQuickSetClose(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              aria-label={t('editBusiness.closeTime', 'Closing time')}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => applyHoursToAll(quickSetOpen, quickSetClose, 'all')}
              className="px-3 py-1.5 text-sm font-medium text-primary bg-white dark:bg-slate-800 border border-primary rounded-lg hover:bg-primary hover:text-white transition-colors"
            >
              {t('editBusiness.applyToAll', 'Apply to All')}
            </button>
            <button
              type="button"
              onClick={() => applyHoursToAll(quickSetOpen, quickSetClose, 'weekdays')}
              className="px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:border-primary hover:text-primary transition-colors"
            >
              {t('editBusiness.applyToWeekdays', 'Weekdays Only')}
            </button>
            <button
              type="button"
              onClick={() => applyHoursToAll(quickSetOpen, quickSetClose, 'weekends')}
              className="px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:border-primary hover:text-primary transition-colors"
            >
              {t('editBusiness.applyToWeekends', 'Weekends Only')}
            </button>
          </div>
        </div>
      </div>

      {/* Hours Grid */}
      <FormSection title={t('editBusiness.operatingHours', 'Operating Hours')}>
        {/* Header Row - Desktop */}
        <div className="hidden sm:grid sm:grid-cols-[120px_80px_1fr] gap-4 pb-2 mb-2 border-b border-slate-200 dark:border-slate-700">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {t('editBusiness.day', 'Day')}
          </div>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {t('editBusiness.status', 'Status')}
          </div>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {t('editBusiness.hours', 'Hours')}
          </div>
        </div>

        <div className="space-y-1">
          {DAYS_OF_WEEK.map(day => {
            const isClosed = formData.operatingHours[day]?.closed || false;
            return (
              <div
                key={day}
                className={`grid grid-cols-1 sm:grid-cols-[120px_80px_1fr] gap-2 sm:gap-4 py-3 px-2 rounded-lg transition-colors ${
                  isClosed ? 'bg-slate-50 dark:bg-slate-800/50' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                {/* Day Name */}
                <div className="font-medium text-slate-900 dark:text-white capitalize flex items-center">
                  {t(`common.days.${day}`, day)}
                </div>

                {/* Closed Toggle */}
                <div className="flex items-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isClosed}
                      onChange={(e) => handleHoursChange(day, 'closed', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-red-500"></div>
                    <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">
                      {isClosed ? t('editBusiness.closed', 'Closed') : t('editBusiness.open', 'Open')}
                    </span>
                  </label>
                </div>

                {/* Time Inputs */}
                <div className="flex items-center gap-2">
                  {isClosed ? (
                    <span className="text-sm text-slate-400 dark:text-slate-500 italic">
                      {t('editBusiness.closedAllDay', 'Closed all day')}
                    </span>
                  ) : (
                    <>
                      <input
                        type="time"
                        value={formData.operatingHours[day]?.open || '09:00'}
                        onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                        aria-label={t('editBusiness.openTimeFor', 'Opening time for {{day}}', { day })}
                      />
                      <span className="text-slate-400 dark:text-slate-500">{'\u2014'}</span>
                      <input
                        type="time"
                        value={formData.operatingHours[day]?.close || '17:00'}
                        onChange={(e) => handleHoursChange(day, 'close', e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                        aria-label={t('editBusiness.closeTimeFor', 'Closing time for {{day}}', { day })}
                      />
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </FormSection>
    </div>
  );
}
