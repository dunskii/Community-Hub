/**
 * useIsOpenNow Hook
 * Real-time "Open Now" calculation for businesses
 */

import { useState, useEffect } from 'react';
import { isOpenNow } from '@community-hub/shared';
import type { OperatingHours } from '@community-hub/shared';
import { getAppConfig } from '../config/app-config';

interface UseIsOpenNowReturn {
  /** Whether the business is currently open (null if "by appointment") */
  isOpen: boolean | null;
  /** Current time string for display */
  currentTime: string;
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
export function useIsOpenNow(
  operatingHours: OperatingHours | undefined | null,
  timezone?: string
): UseIsOpenNowReturn {
  const config = getAppConfig();
  const tz = timezone || config.location.timezone;

  const [state, setState] = useState<UseIsOpenNowReturn>(() => ({
    isOpen: isOpenNow(operatingHours, tz),
    currentTime: new Date().toLocaleTimeString('en-AU', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
    }),
  }));

  useEffect(() => {
    // Update immediately
    const updateStatus = () => {
      setState({
        isOpen: isOpenNow(operatingHours, tz),
        currentTime: new Date().toLocaleTimeString('en-AU', {
          timeZone: tz,
          hour: '2-digit',
          minute: '2-digit',
        }),
      });
    };

    updateStatus();

    // Update every minute
    const interval = setInterval(updateStatus, 60000);

    return () => clearInterval(interval);
  }, [operatingHours, tz]);

  return state;
}
