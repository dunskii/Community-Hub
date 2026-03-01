/**
 * Application Configuration
 * Runtime configuration for the frontend application
 *
 * IMPORTANT: All values MUST come from environment variables.
 * No hardcoded fallbacks allowed to maintain location-agnostic architecture.
 */

interface AppConfig {
  location: {
    timezone: string;
    defaultSuburb: string;
  };
  api: {
    baseUrl: string;
  };
}

// Load from environment variables (NO DEFAULTS - must be explicitly set)
const appConfig: AppConfig = {
  location: {
    timezone: import.meta.env.VITE_TIMEZONE || (() => {
      throw new Error('VITE_TIMEZONE environment variable is required');
    })(),
    defaultSuburb: import.meta.env.VITE_DEFAULT_SUBURB || (() => {
      throw new Error('VITE_DEFAULT_SUBURB environment variable is required');
    })(),
  },
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  },
};

export function getAppConfig(): AppConfig {
  return appConfig;
}
