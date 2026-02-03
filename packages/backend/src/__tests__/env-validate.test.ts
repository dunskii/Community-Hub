import { describe, it, expect } from 'vitest';

import { validateEnv } from '../config/env-validate.js';

const validEnv = {
  NODE_ENV: 'development',
  LOG_LEVEL: 'debug',
  DATABASE_URL: 'postgresql://user:pass@localhost:5433/db',
  REDIS_URL: 'redis://localhost:6379',
  ELASTICSEARCH_URL: 'http://localhost:9200',
  SESSION_SECRET: 'a'.repeat(64),
  ENCRYPTION_KEY: 'YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY=',
  MAPBOX_ACCESS_TOKEN: 'pk.test',
  GOOGLE_TRANSLATE_API_KEY: 'AIza-test',
  GOOGLE_OAUTH_CLIENT_ID: 'client-id',
  GOOGLE_OAUTH_CLIENT_SECRET: 'client-secret',
  MAILGUN_API_KEY: 'key-test',
  MAILGUN_DOMAIN: 'mg.example.com',
  TWILIO_ACCOUNT_SID: 'AC-test',
  TWILIO_AUTH_TOKEN: 'auth-test',
  TWILIO_PHONE_NUMBER: '+1234567890',
  TWILIO_WHATSAPP_NUMBER: '+1234567890',
  GOOGLE_BUSINESS_API_KEY: 'AIza-test',
};

describe('validateEnv', () => {
  it('should accept valid environment variables', () => {
    const result = validateEnv(validEnv);
    expect(result.NODE_ENV).toBe('development');
    expect(result.DATABASE_URL).toBe(validEnv.DATABASE_URL);
  });

  it('should throw for missing DATABASE_URL', () => {
    const { DATABASE_URL: _, ...env } = validEnv;
    expect(() => validateEnv(env)).toThrow('DATABASE_URL');
  });

  it('should throw for missing REDIS_URL', () => {
    const { REDIS_URL: _, ...env } = validEnv;
    expect(() => validateEnv(env)).toThrow('REDIS_URL');
  });

  it('should throw for short SESSION_SECRET', () => {
    const env = { ...validEnv, SESSION_SECRET: 'too-short' };
    expect(() => validateEnv(env)).toThrow('SESSION_SECRET must be at least 64 characters');
  });

  it('should default NODE_ENV to development', () => {
    const { NODE_ENV: _, ...env } = validEnv;
    const result = validateEnv(env);
    expect(result.NODE_ENV).toBe('development');
  });

  it('should default STORAGE_PATH to ./uploads', () => {
    const result = validateEnv(validEnv);
    expect(result.STORAGE_PATH).toBe('./uploads');
  });

  it('should parse ENABLE_DEBUG_MODE as boolean', () => {
    const env = { ...validEnv, ENABLE_DEBUG_MODE: 'true' };
    const result = validateEnv(env);
    expect(result.ENABLE_DEBUG_MODE).toBe(true);
  });

  it('should throw for short ENCRYPTION_KEY', () => {
    const env = { ...validEnv, ENCRYPTION_KEY: 'too-short' };
    expect(() => validateEnv(env)).toThrow('ENCRYPTION_KEY');
  });

  it('should accept optional fields as undefined', () => {
    const result = validateEnv(validEnv);
    expect(result.FACEBOOK_APP_ID).toBeUndefined();
    expect(result.FIREBASE_PROJECT_ID).toBeUndefined();
  });

  it('should default PORT to 3002', () => {
    const result = validateEnv(validEnv);
    expect(result.PORT).toBe(3002);
  });

  it('should accept a valid custom PORT', () => {
    const env = { ...validEnv, PORT: '8080' };
    const result = validateEnv(env);
    expect(result.PORT).toBe(8080);
  });

  it('should throw for PORT value 0', () => {
    const env = { ...validEnv, PORT: '0' };
    expect(() => validateEnv(env)).toThrow();
  });

  it('should throw for PORT value above 65535', () => {
    const env = { ...validEnv, PORT: '65536' };
    expect(() => validateEnv(env)).toThrow();
  });

  it('should throw for non-numeric PORT', () => {
    const env = { ...validEnv, PORT: 'abc' };
    expect(() => validateEnv(env)).toThrow();
  });
});
