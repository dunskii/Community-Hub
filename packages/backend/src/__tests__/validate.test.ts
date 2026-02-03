import { createValidPlatformConfig } from '@community-hub/shared/testing';
import { afterEach, describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../config/env-validate.js', () => ({
  validateEnv: vi.fn(),
}));

vi.mock('../config/platform-loader.js', () => ({
  loadPlatformConfig: vi.fn(),
}));

import { validateEnv } from '../config/env-validate.js';
import { loadPlatformConfig } from '../config/platform-loader.js';
import { validateAllConfig } from '../config/validate.js';

const mockEnv = {
  PORT: 3002,
  NODE_ENV: 'development' as const,
  LOG_LEVEL: 'debug' as const,
  ENABLE_DEBUG_MODE: true,
  DATABASE_URL: 'postgresql://localhost/test',
  REDIS_URL: 'redis://localhost',
  ELASTICSEARCH_URL: 'http://localhost:9200',
  SESSION_SECRET: 'a'.repeat(64),
  ENCRYPTION_KEY: 'a'.repeat(44),
  MAPBOX_ACCESS_TOKEN: 'pk.test',
  GOOGLE_TRANSLATE_API_KEY: 'key',
  GOOGLE_OAUTH_CLIENT_ID: 'id',
  GOOGLE_OAUTH_CLIENT_SECRET: 'secret',
  MAILGUN_API_KEY: 'key',
  MAILGUN_DOMAIN: 'mg.test.com',
  TWILIO_ACCOUNT_SID: 'AC-test',
  TWILIO_AUTH_TOKEN: 'token',
  TWILIO_PHONE_NUMBER: '+1234567890',
  TWILIO_WHATSAPP_NUMBER: '+1234567890',
  GOOGLE_BUSINESS_API_KEY: 'key',
  CDN_ENABLED: false,
  STORAGE_PATH: './uploads',
  STORAGE_MAX_SIZE_GB: 50,
  STORAGE_BACKUP_PATH: './backups',
};

const mockPlatform = createValidPlatformConfig();

describe('validateAllConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return env and platform config on success', () => {
    vi.mocked(validateEnv).mockReturnValue(mockEnv as ReturnType<typeof validateEnv>);
    vi.mocked(loadPlatformConfig).mockReturnValue(
      mockPlatform as ReturnType<typeof loadPlatformConfig>,
    );

    const result = validateAllConfig();
    expect(result.env).toBe(mockEnv);
    expect(result.platform).toBe(mockPlatform);
  });

  it('should throw when env validation fails', () => {
    vi.mocked(validateEnv).mockImplementation(() => {
      throw new Error('DATABASE_URL is required');
    });

    expect(() => validateAllConfig()).toThrow('DATABASE_URL is required');
  });

  it('should throw when platform config is invalid', () => {
    vi.mocked(validateEnv).mockReturnValue(mockEnv as ReturnType<typeof validateEnv>);
    vi.mocked(loadPlatformConfig).mockImplementation(() => {
      throw new Error('Invalid platform config');
    });

    expect(() => validateAllConfig()).toThrow('Invalid platform config');
  });
});
