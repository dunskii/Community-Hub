#!/usr/bin/env node
/**
 * CLI script to bulk reindex all businesses in Elasticsearch
 *
 * Usage:
 *   pnpm tsx src/search/refresh-index.ts
 */

import 'dotenv/config';
import { bulkReindexBusinesses } from './indexing-service.js';
import { logger } from '../utils/logger.js';

async function main() {
  try {
    logger.info('=== Starting Elasticsearch Bulk Reindex ===');
    await bulkReindexBusinesses();
    logger.info('=== Bulk Reindex Complete ===');
    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Bulk reindex failed');
    process.exit(1);
  }
}

main();
