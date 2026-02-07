import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  platformConfigSchema,
  platformConfigOverrideSchema,
  deepMerge,
  formatZodErrors,
} from '@community-hub/shared';
import type { PlatformConfig } from '@community-hub/shared';

let cachedConfig: PlatformConfig | null = null;
let cachedConfigDir: string | null = null;

function readJsonFile(filePath: string): unknown {
  const content = readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Load and validate platform configuration.
 *
 * Merge order:
 * 1. config/platform.json (base)
 * 2. config/platform.{NODE_ENV}.json (environment override, if exists)
 */
export function loadPlatformConfig(configDir?: string): PlatformConfig {
  const baseDir = configDir ?? resolve(process.cwd(), 'config');

  if (cachedConfig && cachedConfigDir === baseDir) {
    return cachedConfig;
  }

  const env = process.env['NODE_ENV'] ?? 'development';

  // Load base config
  const basePath = resolve(baseDir, 'platform.json');
  if (!existsSync(basePath)) {
    throw new Error(`Platform config not found: ${basePath}`);
  }

  const baseRaw = readJsonFile(basePath);
  const baseResult = platformConfigSchema.safeParse(baseRaw);
  if (!baseResult.success) {
    throw new Error(
      `Invalid platform config (${basePath}):\n${formatZodErrors(baseResult.error.issues)}`,
    );
  }

  let config = baseResult.data;

  // Load environment override if it exists
  const overridePath = resolve(baseDir, `platform.${env}.json`);
  if (existsSync(overridePath)) {
    const overrideRaw = readJsonFile(overridePath);
    const overrideResult = platformConfigOverrideSchema.safeParse(overrideRaw);
    if (!overrideResult.success) {
      throw new Error(
        `Invalid platform config override (${overridePath}):\n${formatZodErrors(overrideResult.error.issues)}`,
      );
    }

    const mergedRaw = deepMerge(config, overrideResult.data as Record<string, unknown>);
    const mergedResult = platformConfigSchema.safeParse(mergedRaw);
    if (!mergedResult.success) {
      throw new Error(
        `Invalid merged platform config after applying ${env} override:\n${formatZodErrors(mergedResult.error.issues)}`,
      );
    }
    config = mergedResult.data;
  }

  cachedConfig = config;
  cachedConfigDir = baseDir;
  return config;
}

/**
 * Clear the cached config (useful for testing).
 */
export function clearPlatformConfigCache(): void {
  cachedConfig = null;
  cachedConfigDir = null;
}

/**
 * Get the loaded platform config
 */
export function getPlatformConfig(): PlatformConfig {
  if (!cachedConfig) {
    return loadPlatformConfig();
  }
  return cachedConfig;
}
