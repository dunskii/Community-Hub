import { platformConfigSchema, formatZodErrors } from '@community-hub/shared';
import type { PlatformConfig } from '@community-hub/shared';

let cachedConfig: PlatformConfig | null = null;

const DEFAULT_TIMEOUT_MS = 10_000;

/**
 * Fetch and validate platform configuration from the server.
 * Called once at app initialization.
 */
export async function loadPlatformConfig(
  configUrl = '/api/config',
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<PlatformConfig> {
  if (cachedConfig) {
    return cachedConfig;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(configUrl, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Failed to load platform config: ${response.status} ${response.statusText}`);
    }

    const raw: unknown = await response.json();
    const result = platformConfigSchema.safeParse(raw);
    if (!result.success) {
      throw new Error(
        `Invalid platform config from server:\n${formatZodErrors(result.error.issues)}`,
      );
    }

    cachedConfig = result.data;
    return cachedConfig;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Get the cached config. Throws if loadPlatformConfig hasn't been called yet.
 */
export function getPlatformConfig(): PlatformConfig {
  if (!cachedConfig) {
    throw new Error('Platform config not loaded. Call loadPlatformConfig() first.');
  }
  return cachedConfig;
}

/**
 * Clear the cached config (useful for testing).
 */
export function clearPlatformConfigCache(): void {
  cachedConfig = null;
}
