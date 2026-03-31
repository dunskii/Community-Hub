/**
 * Schedulers Index
 * Phase 8-9: Events & Calendar System, Messaging System
 *
 * Central export for all background schedulers/jobs.
 */

import { eventReminderScheduler } from './event-reminder-scheduler.js';
import { dataRetentionScheduler } from './data-retention-scheduler.js';
import { socialPostScheduler } from './social-post-scheduler.js';
import { weeklyDigestScheduler } from './weekly-digest-scheduler.js';
import { initializeAdapters } from '../social/adapter-registry.js';
import { getPlatformConfig } from '../config/platform-loader.js';

export { eventReminderScheduler, EventReminderScheduler } from './event-reminder-scheduler.js';
export { dataRetentionScheduler, DataRetentionScheduler } from './data-retention-scheduler.js';
export { socialPostScheduler, SocialPostScheduler } from './social-post-scheduler.js';
export { weeklyDigestScheduler, WeeklyDigestScheduler } from './weekly-digest-scheduler.js';

/**
 * Starts all schedulers
 */
export function startSchedulers(): void {
  eventReminderScheduler.start();
  dataRetentionScheduler.start();
  weeklyDigestScheduler.start();

  // Initialize social media adapters and start post scheduler (if enabled)
  const config = getPlatformConfig();
  if (config.features.socialPosting) {
    initializeAdapters();
    socialPostScheduler.start();
  }
}

/**
 * Stops all schedulers
 */
export function stopSchedulers(): void {
  eventReminderScheduler.stop();
  dataRetentionScheduler.stop();
  socialPostScheduler.stop();
  weeklyDigestScheduler.stop();
}
