/**
 * OperatingHoursDisplay Component
 * Displays business operating hours in a readable format
 * WCAG 2.1 AA compliant
 */

import { useTranslation } from 'react-i18next';
import type { OperatingHours } from '@community-hub/shared';
import { useIsOpenNow } from '../../hooks/useIsOpenNow';
import { Badge } from '../display/Badge';

interface OperatingHoursDisplayProps {
  operatingHours: OperatingHours | null | undefined;
  /** Show current status badge */
  showStatus?: boolean;
  /** Compact view (current day only) */
  compact?: boolean;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

export function OperatingHoursDisplay({
  operatingHours,
  showStatus = true,
  compact = false,
}: OperatingHoursDisplayProps) {
  const { t } = useTranslation();
  const { isOpen } = useIsOpenNow(operatingHours);

  if (!operatingHours) {
    return (
      <div className="operating-hours">
        <p className="operating-hours__no-data">{t('business.noHoursAvailable')}</p>
      </div>
    );
  }

  // By appointment
  if (operatingHours.byAppointment) {
    return (
      <div className="operating-hours">
        {showStatus && (
          <Badge variant="neutral" size="sm">
            {t('business.byAppointment')}
          </Badge>
        )}
        <p className="operating-hours__appointment">{t('business.callForAppointment')}</p>
      </div>
    );
  }

  // Get current day
  const currentDay = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

  // Compact view - show only current day
  if (compact) {
    const todayHours = operatingHours[currentDay];

    return (
      <div className="operating-hours operating-hours--compact">
        {showStatus && (
          <Badge variant={isOpen ? 'success' : 'neutral'} size="sm">
            {isOpen ? t('business.openNow') : t('business.closed')}
          </Badge>
        )}
        <div className="operating-hours__row">
          <span className="operating-hours__day operating-hours__day--current">
            {t(`common.days.${currentDay}`)}
          </span>
          <span className="operating-hours__time">
            {todayHours?.open && todayHours?.close
              ? `${todayHours.open} - ${todayHours.close}`
              : t('business.closed')}
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
          <Badge variant={isOpen ? 'success' : 'neutral'} size="sm">
            {isOpen ? t('business.openNow') : t('business.closed')}
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
                {t(`common.days.${day}`)}
              </span>
              <span className="operating-hours__time">
                {hours?.open && hours?.close
                  ? `${hours.open} - ${hours.close}`
                  : t('business.closed')}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
