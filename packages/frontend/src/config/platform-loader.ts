import { platformConfigSchema } from '@community-hub/shared';
import type { PlatformConfig } from '@community-hub/shared';

let cachedConfig: PlatformConfig | null = null;

const DEFAULT_TIMEOUT_MS = 10_000;

/**
 * Fetch and validate platform configuration from the server.
 * Called once at app initialization.
 */
export async function loadPlatformConfig(
  configUrl = '/api/v1/config',
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

    const json = await response.json() as { success?: boolean; data?: unknown };
    // API wraps config in { success, data } envelope
    const raw: unknown = json.data ?? json;
    const result = platformConfigSchema.safeParse(raw);
    if (!result.success) {
      console.warn('[PlatformConfig] Validation failed, using raw config:', result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`));
      // Schema validation may be stricter than necessary — use the raw config
      cachedConfig = raw as PlatformConfig;
      return cachedConfig;
    }

    cachedConfig = result.data;
    return cachedConfig;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Minimal fallback when backend is unavailable
const FALLBACK_CONFIG = {
  platform: { id: 'community-hub', version: '1.0.0' },
  location: {
    suburbName: 'Your Area',
    suburbNameShort: 'Local',
    region: '',
    city: '',
    state: 'NSW',
    stateFullName: 'New South Wales',
    country: 'Australia',
    countryCode: 'AU',
    postcode: '2000',
    coordinates: { latitude: -33.8688, longitude: 151.2093 },
    timezone: 'Australia/Sydney',
    locale: 'en-AU',
    currency: 'AUD',
    currencySymbol: '$',
    phoneCountryCode: '+61',
    defaultSearchRadiusKm: 5,
    maxSearchRadiusKm: 20,
    serviceRadius: 5,
  },
  branding: {
    platformName: 'Community Hub',
    platformNameShort: 'Hub',
    tagline: 'Your local community',
    description: '',
    legalEntityName: '',
    copyrightHolder: '',
    colors: { primary: '#2C5F7C', secondary: '#4A9B8E', accent: '#F39C12', success: '#27AE60', error: '#E74C3C', warning: '#E67E22', info: '#3498DB' },
    logo: { url: '' },
    logos: { light: '', dark: '', favicon: '' },
    socialHashtags: { primary: '', secondary: '' },
  },
} as unknown as PlatformConfig;

/**
 * Get the cached config. Returns fallback defaults if backend was unavailable.
 */
export function getPlatformConfig(): PlatformConfig {
  return cachedConfig ?? FALLBACK_CONFIG;
}

/**
 * Clear the cached config (useful for testing).
 */
export function clearPlatformConfigCache(): void {
  cachedConfig = null;
}
