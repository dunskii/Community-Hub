import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, it, expect } from 'vitest';

import { platformConfigSchema, platformConfigOverrideSchema } from '../config/platform-schema.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

function loadTestConfig(): unknown {
  const configPath = resolve(__dirname, '../../../../config/platform.json');
  return JSON.parse(readFileSync(configPath, 'utf-8'));
}

describe('platformConfigSchema', () => {
  it('should validate the default platform.json', () => {
    const config = loadTestConfig();
    const result = platformConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
  });

  it('should reject missing required fields', () => {
    const result = platformConfigSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should reject invalid latitude', () => {
    const config = loadTestConfig() as Record<string, unknown>;
    const location = { ...(config['location'] as Record<string, unknown>) };
    location['coordinates'] = { latitude: 100, longitude: 150.9876 };
    config['location'] = location;

    const result = platformConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('location.coordinates.latitude');
    }
  });

  it('should reject invalid longitude', () => {
    const config = loadTestConfig() as Record<string, unknown>;
    const location = { ...(config['location'] as Record<string, unknown>) };
    location['coordinates'] = { latitude: -33.8567, longitude: 200 };
    config['location'] = location;

    const result = platformConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('location.coordinates.longitude');
    }
  });

  it('should reject invalid hex colors', () => {
    const config = loadTestConfig() as Record<string, unknown>;
    const branding = { ...(config['branding'] as Record<string, unknown>) };
    branding['colors'] = {
      primary: 'not-a-color',
      secondary: '#E67E22',
      accent: '#F39C12',
      success: '#27AE60',
      error: '#E74C3C',
      warning: '#F39C12',
      info: '#3498DB',
    };
    config['branding'] = branding;

    const result = platformConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it('should reject invalid timezone', () => {
    const config = loadTestConfig() as Record<string, unknown>;
    const location = { ...(config['location'] as Record<string, unknown>) };
    location['timezone'] = 'Invalid/Timezone';
    config['location'] = location;

    const result = platformConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('location.timezone');
    }
  });

  it('should reject defaultSearchRadiusKm > maxSearchRadiusKm', () => {
    const config = loadTestConfig() as Record<string, unknown>;
    const location = { ...(config['location'] as Record<string, unknown>) };
    location['defaultSearchRadiusKm'] = 100;
    location['maxSearchRadiusKm'] = 20;
    config['location'] = location;

    const result = platformConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('location.defaultSearchRadiusKm');
    }
  });

  it('should reject defaultLanguage not in supportedLanguages', () => {
    const config = loadTestConfig() as Record<string, unknown>;
    config['multilingual'] = {
      defaultLanguage: 'fr',
      supportedLanguages: [
        { code: 'en', name: 'English', nativeName: 'English', rtl: false, enabled: true },
      ],
      autoTranslationEnabled: true,
    };

    const result = platformConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('multilingual.defaultLanguage');
    }
  });

  it('should reject invalid email addresses', () => {
    const config = loadTestConfig() as Record<string, unknown>;
    config['contact'] = {
      supportEmail: 'not-an-email',
      generalEmail: 'hello@example.com',
      feedbackEmail: 'feedback@example.com',
      privacyEmail: 'privacy@example.com',
    };

    const result = platformConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });
});

describe('platformConfigOverrideSchema', () => {
  it('should accept partial configs', () => {
    const result = platformConfigOverrideSchema.safeParse({
      platform: { id: 'test-dev' },
    });
    expect(result.success).toBe(true);
  });

  it('should accept empty objects', () => {
    const result = platformConfigOverrideSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should still validate field types in overrides', () => {
    const result = platformConfigOverrideSchema.safeParse({
      location: { coordinates: { latitude: 999 } },
    });
    expect(result.success).toBe(false);
  });
});
