/**
 * "Open Now" calculation utility
 * Determines if a business is currently open based on operating hours and timezone
 */

import type { OperatingHours } from '../types/business.js';

/**
 * Checks if a business is currently open
 * @param operatingHours - Business operating hours
 * @param timezone - Business timezone (REQUIRED - no default to maintain location-agnostic architecture)
 * @returns true if open, false if closed, null if by appointment only
 */
export function isOpenNow(
  operatingHours: OperatingHours | undefined | null,
  timezone: string
): boolean | null {
  if (!timezone) {
    throw new Error('timezone parameter is required for isOpenNow()');
  }
  if (!operatingHours) {
    return null; // Unknown
  }

  // Get current time in business timezone
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const weekday = parts.find((p) => p.type === 'weekday')?.value.toLowerCase() as keyof Omit<
    OperatingHours,
    'publicHolidays' | 'specialNotes'
  >;
  const hour = Number(parts.find((p) => p.type === 'hour')?.value);
  const minute = Number(parts.find((p) => p.type === 'minute')?.value);
  const currentTime = hour * 60 + minute; // Convert to minutes since midnight

  if (!weekday) {
    return null;
  }

  const dayHours = operatingHours[weekday];

  if (!dayHours) {
    return null;
  }

  // Check if closed or by appointment
  if (dayHours.closed) {
    return false;
  }

  if (dayHours.byAppointment) {
    return null; // "By appointment only"
  }

  // Parse open and close times
  const openTime = parseTime(dayHours.open);
  const closeTime = parseTime(dayHours.close);

  if (openTime === null || closeTime === null) {
    return null; // Invalid time format
  }

  // Handle overnight hours (e.g., open 22:00, close 02:00)
  if (closeTime < openTime) {
    // Open if current time is after open OR before close
    return currentTime >= openTime || currentTime < closeTime;
  }

  // Normal hours: open if current time is between open and close
  return currentTime >= openTime && currentTime < closeTime;
}

/**
 * Parses time string (HH:MM) to minutes since midnight
 * @param timeStr - Time string in HH:MM format
 * @returns Minutes since midnight, or null if invalid
 */
function parseTime(timeStr: string): number | null {
  if (!timeStr) {
    return null;
  }

  const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return null;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  return hour * 60 + minute;
}

/**
 * Gets the next opening time for a business
 * @param operatingHours - Business operating hours
 * @param timezone - Business timezone (REQUIRED - no default to maintain location-agnostic architecture)
 * @returns Next opening time as Date, or null if unknown
 */
export function getNextOpeningTime(
  operatingHours: OperatingHours | undefined | null,
  timezone: string
): Date | null {
  if (!timezone) {
    throw new Error('timezone parameter is required for getNextOpeningTime()');
  }
  if (!operatingHours) {
    return null;
  }

  const now = new Date();
  const daysOfWeek: (keyof Omit<OperatingHours, 'publicHolidays' | 'specialNotes'>)[] = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];

  // Get current day index
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'long',
  });
  const currentDayName = formatter.format(now).toLowerCase() as keyof Omit<
    OperatingHours,
    'publicHolidays' | 'specialNotes'
  >;
  let currentDayIndex = daysOfWeek.indexOf(currentDayName);

  // Check next 7 days
  for (let i = 0; i < 7; i++) {
    const dayIndex = (currentDayIndex + i) % 7;
    const dayName = daysOfWeek[dayIndex];
    if (!dayName) continue;
    const dayHours = operatingHours[dayName];

    if (!dayHours || dayHours.closed || dayHours.byAppointment) {
      continue;
    }

    // If checking today, only return if opening time is in the future
    if (i === 0) {
      const openTime = parseTime(dayHours.open);
      if (openTime === null) {
        continue;
      }

      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).formatToParts(now);

      const hour = Number(parts.find((p) => p.type === 'hour')?.value);
      const minute = Number(parts.find((p) => p.type === 'minute')?.value);
      const currentTime = hour * 60 + minute;

      if (currentTime >= openTime) {
        continue; // Already past opening time today
      }
    }

    // Create Date object for next opening
    const nextOpening = new Date(now);
    nextOpening.setDate(nextOpening.getDate() + i);
    const [openHour, openMinute] = dayHours.open.split(':').map(Number) as [number, number];
    nextOpening.setHours(openHour ?? 0, openMinute ?? 0, 0, 0);

    return nextOpening;
  }

  return null; // No opening found in next 7 days
}
