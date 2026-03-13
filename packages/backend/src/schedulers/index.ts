/**
 * Schedulers Index
 * Phase 8-9: Events & Calendar System, Messaging System
 *
 * Central export for all background schedulers/jobs.
 */

import { eventReminderScheduler } from './event-reminder-scheduler.js';
import { dataRetentionScheduler } from './data-retention-scheduler.js';

export { eventReminderScheduler, EventReminderScheduler } from './event-reminder-scheduler.js';
export { dataRetentionScheduler, DataRetentionScheduler } from './data-retention-scheduler.js';

/**
 * Starts all schedulers
 */
export function startSchedulers(): void {
  eventReminderScheduler.start();
  dataRetentionScheduler.start();
}

/**
 * Stops all schedulers
 */
export function stopSchedulers(): void {
  eventReminderScheduler.stop();
  dataRetentionScheduler.stop();
}
