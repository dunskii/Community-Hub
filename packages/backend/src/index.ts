import 'dotenv/config';
import { createApp } from './app.js';
import { connectRedis, disconnectRedis } from './cache/index.js';
import { validateEnv } from './config/env-validate.js';
import { loadPlatformConfig } from './config/platform-loader.js';
import { disconnectDb } from './db/index.js';
import { closeEsClient } from './search/elasticsearch-client.js';
import { setupIndices } from './search/index.js';
import { logger } from './utils/logger.js';
import { checkPrismaVersion } from './utils/prisma-version-check.js';
import { verifyMapboxConnection } from './services/maps/mapbox-client.js';

async function main(): Promise<void> {
  // Validate configuration
  const env = validateEnv();
  const config = loadPlatformConfig();
  logger.info(`Platform: ${config.branding.platformName} [${env.NODE_ENV}]`);

  await checkPrismaVersion();

  // Connect services
  await connectRedis();

  // Verify Mapbox API (optional -- graceful degradation)
  try {
    const mapboxOk = await verifyMapboxConnection();
    if (!mapboxOk) {
      logger.warn('Mapbox API verification failed -- map features will be limited');
    }
  } catch {
    logger.warn('Mapbox API connection check failed -- map features will be limited');
  }

  // Set up Elasticsearch indices (optional -- graceful degradation)
  try {
    await setupIndices();
  } catch {
    logger.warn('Elasticsearch setup failed -- search will use database fallback');
  }

  // Start server
  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info(`Server listening on http://localhost:${env.PORT}`);
    logger.info(`API: http://localhost:${env.PORT}/api/v1`);
  });

  // Graceful shutdown
  async function shutdown(signal: string): Promise<void> {
    logger.info(`${signal} received, shutting down...`);
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
    await disconnectRedis();
    await closeEsClient();
    await disconnectDb();
    process.exit(0);
  }

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

main().catch((err) => {
  logger.error(err, 'Failed to start server');
  process.exit(1);
});
