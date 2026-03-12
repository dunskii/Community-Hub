/**
 * Schedulers Index
 * Phase 8: Events & Calendar System
 *
 * Central export for all background schedulers/jobs.
 */

import { eventReminderScheduler } from './event-reminder-scheduler.js';

export { eventReminderScheduler, EventReminderScheduler } from './event-reminder-scheduler.js';

/**
 * Starts all schedulers
 */
export function startSchedulers(): void {
  eventReminderScheduler.start();
}

/**
 * Stops all schedulers
 */
export function stopSchedulers(): void {
  eventReminderScheduler.stop();
}
