/**
 * Operating Hours Service
 * Handles business hours calculations and formatting
 */

import type { OperatingHours } from '@community-hub/shared';
import { isOpenNow as calculateOpenNow, getNextOpeningTime } from '@community-hub/shared';

export class OperatingHoursService {
  /**
   * Checks if a business is currently open
   * @param operatingHours - Business operating hours
   * @param timezone - Business timezone (from platform config)
   * @returns true if open, false if closed, null if by appointment
   */
  isOpenNow(operatingHours: OperatingHours | undefined | null, timezone: string): boolean | null {
    return calculateOpenNow(operatingHours, timezone);
  }

  /**
   * Gets the next opening time for a business
   * @param operatingHours - Business operating hours
   * @param timezone - Business timezone
   * @returns Next opening time as Date, or null if unknown
   */
  getNextOpeningTime(
    operatingHours: OperatingHours | undefined | null,
    timezone: string
  ): Date | null {
    return getNextOpeningTime(operatingHours, timezone);
  }

  /**
   * Formats operating hours for display
   * @param operatingHours - Business operating hours
   * @returns Human-readable operating hours
   */
  formatHoursForDisplay(operatingHours: OperatingHours): Record<string, string> {
    const formatted: Record<string, string> = {};
    const days: (keyof Omit<OperatingHours, 'publicHolidays' | 'specialNotes'>)[] = [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ];

    for (const day of days) {
      const dayHours = operatingHours[day];

      if (!dayHours) {
        formatted[day] = 'Unknown';
        continue;
      }

      if (dayHours.closed) {
        formatted[day] = 'Closed';
        continue;
      }

      if (dayHours.byAppointment) {
        formatted[day] = 'By Appointment';
        continue;
      }

      formatted[day] = `${dayHours.open} - ${dayHours.close}`;
    }

    return formatted;
  }

  /**
   * Validates operating hours structure
   * @param operatingHours - Operating hours to validate
   * @returns true if valid, false otherwise
   */
  validateHours(operatingHours: OperatingHours): boolean {
    const days: (keyof Omit<OperatingHours, 'publicHolidays' | 'specialNotes'>)[] = [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ];

    for (const day of days) {
      const dayHours = operatingHours[day];

      if (!dayHours) {
        return false;
      }

      // If not closed and not by appointment, must have valid open/close times
      if (!dayHours.closed && !dayHours.byAppointment) {
        if (!this.isValidTimeFormat(dayHours.open) || !this.isValidTimeFormat(dayHours.close)) {
          return false;
        }

        // For non-overnight hours, open must be before close
        // const openMinutes = this.timeToMinutes(dayHours.open);
        // const closeMinutes = this.timeToMinutes(dayHours.close);

        // Allow overnight hours (close < open is valid, e.g., 22:00 to 02:00)
        // So we don't validate open < close
      }
    }

    return true;
  }

  /**
   * Checks if a time string is in valid HH:MM format
   * @param time - Time string to validate
   * @returns true if valid format
   */
  private isValidTimeFormat(time: string): boolean {
    const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return regex.test(time);
  }

  /**
   * Converts time string to minutes since midnight
   * @param time - Time string in HH:MM format
   * @returns Minutes since midnight
   */
  // private timeToMinutes(time: string): number {
  //   const [hours, minutes] = time.split(':').map(Number);
  //   return (hours ?? 0) * 60 + (minutes ?? 0);
  // }
}

export const operatingHoursService = new OperatingHoursService();
