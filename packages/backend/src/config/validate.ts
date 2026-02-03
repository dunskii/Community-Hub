import type { PlatformConfig } from '@community-hub/shared';

import { logger } from '../utils/logger.js';

import type { EnvConfig } from './env-validate.js';
import { validateEnv } from './env-validate.js';
import { loadPlatformConfig } from './platform-loader.js';

export interface AppConfig {
  env: EnvConfig;
  platform: PlatformConfig;
}

/**
 * Validate all configuration at startup.
 * Throws a ConfigurationError if required config is missing or invalid.
 * The caller (server entry point) is responsible for catching and exiting.
 */
export function validateAllConfig(): AppConfig {
  logger.info('Validating environment variables...');
  const env = validateEnv();

  logger.info('Loading platform configuration...');
  const platform = loadPlatformConfig();

  logger.info(
    { platformId: platform.platform.id, suburb: platform.location.suburbName },
    'Config loaded',
  );

  return { env, platform };
}
