/**
 * OperatingHoursDisplay Component
 * Displays business operating hours in a readable format
 * WCAG 2.1 AA compliant
 */

import { useTranslation } from 'react-i18next';
import type { OperatingHours } from '@community-hub/shared';
import { useIsOpenNow } from '../../hooks/useIsOpenNow';
import { Badge } from '../display/Badge';
import './OperatingHoursDisplay.css';

interface OperatingHoursDisplayProps {
  operatingHours: OperatingHours | null | undefined;
  /** Show current status badge */
  showStatus?: boolean;
  /** Compact view (current day only) */
  compact?: boolean;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

/**
 * Format time string to remove leading zeros
 * "05:00" -> "5:00", "09:30" -> "9:30", "12:00" -> "12:00"
 */
function formatTime(time: string): string {
  return time.replace(/^0/, '');
}

// Day name labels with fallbacks
const DAY_LABELS: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

export function OperatingHoursDisplay({
  operatingHours,
  showStatus = true,
  compact = false,
}: OperatingHoursDisplayProps) {
  const { t } = useTranslation('business');
  const { isOpen } = useIsOpenNow(operatingHours);

  if (!operatingHours) {
    return (
      <div className="operating-hours">
        <p className="operating-hours__no-data">{t('noHoursAvailable', 'Hours not available')}</p>
      </div>
    );
  }

  // Get current day
  const currentDay = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

  // Check if current day is by appointment
  const todayHoursCheck = currentDay ? operatingHours[currentDay] : undefined;
  if (todayHoursCheck?.byAppointment) {
    return (
      <div className="operating-hours">
        {showStatus && (
          <Badge variant="default" size="sm">
            {t('byAppointment', 'By Appointment')}
          </Badge>
        )}
        <p className="operating-hours__appointment">{t('callForAppointment', 'Call to make an appointment')}</p>
      </div>
    );
  }

  // Compact view - show only current day
  if (compact && currentDay) {
    const todayHours = operatingHours[currentDay];

    return (
      <div className="operating-hours operating-hours--compact">
        {showStatus && (
          <Badge variant={isOpen ? 'success' : 'default'} size="sm">
            {isOpen ? t('openNow', 'Open Now') : t('closed', 'Closed')}
          </Badge>
        )}
        <div className="operating-hours__row">
          <span className="operating-hours__day operating-hours__day--current">
            {DAY_LABELS[currentDay]}
          </span>
          <span className="operating-hours__time">
            {todayHours?.open && todayHours?.close
              ? `${formatTime(todayHours.open)} - ${formatTime(todayHours.close)}`
              : t('closed', 'Closed')}
          </span>
        </div>
      </div>
    );
  }

  // Full view - show all days
  return (
    <div className="operating-hours">
      {showStatus && (
        <div className="operating-hours__status">
          <Badge variant={isOpen ? 'success' : 'default'} size="sm">
            {isOpen ? t('openNow', 'Open Now') : t('closed', 'Closed')}
          </Badge>
        </div>
      )}

      <div className="operating-hours__list">
        {DAYS.map(day => {
          const hours = operatingHours[day];
          const isCurrent = day === currentDay;

          return (
            <div
              key={day}
              className={`operating-hours__row ${isCurrent ? 'operating-hours__row--current' : ''}`}
            >
              <span className={`operating-hours__day ${isCurrent ? 'operating-hours__day--current' : ''}`}>
                {DAY_LABELS[day]}
                {isCurrent && (
                  <span className="operating-hours__today-badge">
                    {t('today', 'Today')}
                  </span>
                )}
              </span>
              <span className={`operating-hours__time ${isCurrent ? 'operating-hours__time--current' : ''}`}>
                {hours?.open && hours?.close
                  ? `${formatTime(hours.open)} - ${formatTime(hours.close)}`
                  : t('closed', 'Closed')}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
