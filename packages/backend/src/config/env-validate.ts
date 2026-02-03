import { formatZodErrors } from '@community-hub/shared';
import { z } from 'zod';

export const envSchema = z.object({
  // Server
  PORT: z.string().transform(Number).pipe(z.number().int().min(1).max(65535)).default('3002'),

  // Environment
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  ENABLE_DEBUG_MODE: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),

  // CORS
  ALLOWED_ORIGINS: z.string().default('http://localhost:5173'),

  // Database
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required')
    .startsWith('postgresql://', 'DATABASE_URL must start with postgresql://'),

  // Cache & Sessions
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),

  // Search
  ELASTICSEARCH_URL: z.string().min(1, 'ELASTICSEARCH_URL is required'),
  ELASTICSEARCH_API_KEY: z.string().optional(),
  ES_NUMBER_OF_REPLICAS: z.string().transform(Number).pipe(z.number().int().min(0)).default('0'),

  // Security
  SESSION_SECRET: z.string().min(64, 'SESSION_SECRET must be at least 64 characters'),
  ENCRYPTION_KEY: z
    .string()
    .min(44, 'ENCRYPTION_KEY must be a base64-encoded 32-byte key (44+ chars)'),

  // Maps
  MAPBOX_ACCESS_TOKEN: z.string().min(1, 'MAPBOX_ACCESS_TOKEN is required'),

  // Translation
  GOOGLE_TRANSLATE_API_KEY: z.string().min(1, 'GOOGLE_TRANSLATE_API_KEY is required'),

  // Auth (Google OAuth)
  GOOGLE_OAUTH_CLIENT_ID: z.string().min(1, 'GOOGLE_OAUTH_CLIENT_ID is required'),
  GOOGLE_OAUTH_CLIENT_SECRET: z.string().min(1, 'GOOGLE_OAUTH_CLIENT_SECRET is required'),

  // Social (optional)
  FACEBOOK_APP_ID: z.string().optional(),
  FACEBOOK_APP_SECRET: z.string().optional(),

  // Email
  MAILGUN_API_KEY: z.string().min(1, 'MAILGUN_API_KEY is required'),
  MAILGUN_DOMAIN: z.string().min(1, 'MAILGUN_DOMAIN is required'),

  // SMS & WhatsApp
  TWILIO_ACCOUNT_SID: z.string().min(1, 'TWILIO_ACCOUNT_SID is required'),
  TWILIO_AUTH_TOKEN: z.string().min(1, 'TWILIO_AUTH_TOKEN is required'),
  TWILIO_PHONE_NUMBER: z.string().min(1, 'TWILIO_PHONE_NUMBER is required'),
  TWILIO_WHATSAPP_NUMBER: z.string().min(1, 'TWILIO_WHATSAPP_NUMBER is required'),

  // Push Notifications
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),

  // Google Business Profile
  GOOGLE_BUSINESS_API_KEY: z.string().min(1, 'GOOGLE_BUSINESS_API_KEY is required'),

  // CDN & Cloudflare
  CLOUDFLARE_ZONE_ID: z.string().optional(),
  CLOUDFLARE_API_TOKEN: z.string().optional(),
  CDN_URL: z.string().optional(),
  CDN_ENABLED: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),

  // Storage
  STORAGE_PATH: z.string().default('./uploads'),
  STORAGE_MAX_SIZE_GB: z.string().transform(Number).pipe(z.number().positive()).default('50'),
  STORAGE_BACKUP_PATH: z.string().default('./backups'),
});

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Validate environment variables. Returns parsed config or throws with details.
 */
export function validateEnv(env: Record<string, string | undefined> = process.env): EnvConfig {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    throw new Error(`Environment validation failed:\n${formatZodErrors(result.error.issues)}`);
  }
  return result.data;
}
