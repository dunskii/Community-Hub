/**
 * Delete Expired Accounts Script
 *
 * Deletes user accounts where deletionRequestedAt is >= 30 days ago.
 * Should be run as a scheduled cron job (e.g., daily at midnight).
 *
 * Usage:
 *   node dist/scripts/delete-expired-accounts.js
 *   OR
 *   tsx src/scripts/delete-expired-accounts.ts
 *
 * Recommended cron schedule:
 *   0 0 * * * cd /path/to/backend && node dist/scripts/delete-expired-accounts.js
 */

import 'dotenv/config';
import { deleteExpiredAccounts } from '../services/user-service';
import { connectDb, disconnectDb } from '../db/index';
import { logger } from '../utils/logger';

async function main() {
  try {
    // Connect to database
    await connectDb();

    logger.info('Starting expired account deletion...');

    // Delete expired accounts
    const count = await deleteExpiredAccounts();

    logger.info({ count }, 'Expired account deletion completed');

    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Failed to delete expired accounts');
    process.exit(1);
  } finally {
    await disconnectDb();
  }
}

main();
