/**
 * useIsOpenNow Hook
 * Real-time "Open Now" calculation for businesses
 */

import { useState, useEffect } from 'react';
import { isOpenNow, getNextOpeningTime } from '@community-hub/shared';
import type { OperatingHours } from '@community-hub/shared';
import { getAppConfig } from '../config/app-config';

interface UseIsOpenNowReturn {
  /** Whether the business is currently open (null if "by appointment") */
  isOpen: boolean | null;
  /** Current time string for display */
  currentTime: string;
  /** Next opening time formatted as HH:MM (null if unknown or currently open) */
  nextOpeningTime: string | null;
}

/**
 * Hook to calculate and update "Open Now" status in real-time
 * Updates every minute to keep status current
 *
 * @param operatingHours - Business operating hours
 * @param timezone - Timezone (defaults to platform config timezone)
 *
 * @example
 * ```tsx
 * const { isOpen, currentTime } = useIsOpenNow(business.operatingHours);
 *
 * return (
 *   <div>
 *     {isOpen === null ? (
 *       <Badge variant="neutral">By Appointment</Badge>
 *     ) : isOpen ? (
 *       <Badge variant="success">Open Now</Badge>
 *     ) : (
 *       <Badge variant="neutral">Closed</Badge>
 *     )}
 *     <span>{currentTime}</span>
 *   </div>
 * );
 * ```
 */
/**
 * Formats next opening time as HH:MM string
 */
function formatNextOpening(nextOpening: Date | null, tz: string): string | null {
  if (!nextOpening) return null;
  return nextOpening.toLocaleTimeString('en-AU', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function useIsOpenNow(
  operatingHours: OperatingHours | undefined | null,
  timezone?: string
): UseIsOpenNowReturn {
  const config = getAppConfig();
  const tz = timezone || config.location.timezone;

  const [state, setState] = useState<UseIsOpenNowReturn>(() => {
    const open = isOpenNow(operatingHours, tz);
    return {
      isOpen: open,
      currentTime: new Date().toLocaleTimeString('en-AU', {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
      }),
      nextOpeningTime: open === false ? formatNextOpening(getNextOpeningTime(operatingHours, tz), tz) : null,
    };
  });

  useEffect(() => {
    // Update immediately
    const updateStatus = () => {
      const open = isOpenNow(operatingHours, tz);
      setState({
        isOpen: open,
        currentTime: new Date().toLocaleTimeString('en-AU', {
          timeZone: tz,
          hour: '2-digit',
          minute: '2-digit',
        }),
        nextOpeningTime: open === false ? formatNextOpening(getNextOpeningTime(operatingHours, tz), tz) : null,
      });
    };

    updateStatus();

    // Update every minute
    const interval = setInterval(updateStatus, 60000);

    return () => clearInterval(interval);
  }, [operatingHours, tz]);

  return state;
}
