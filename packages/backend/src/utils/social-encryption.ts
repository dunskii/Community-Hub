/**
 * Social Token Encryption
 *
 * Uses AES-256-GCM with a SEPARATE encryption key for social media tokens.
 * This limits blast radius if one key is compromised.
 *
 * Spec §4.2: AES-256 encryption for sensitive data at rest.
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { logger } from './logger.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

let warnedFallback = false;

/**
 * Get the social token encryption key.
 * Uses SOCIAL_ENCRYPTION_KEY if set, falls back to ENCRYPTION_KEY with a warning.
 */
function getKey(): Buffer {
  let keyBase64 = process.env['SOCIAL_ENCRYPTION_KEY'];

  if (!keyBase64) {
    keyBase64 = process.env['ENCRYPTION_KEY'];
    if (!warnedFallback && keyBase64) {
      logger.warn('SOCIAL_ENCRYPTION_KEY not set, falling back to ENCRYPTION_KEY');
      warnedFallback = true;
    }
  }

  if (!keyBase64) {
    throw new Error('Neither SOCIAL_ENCRYPTION_KEY nor ENCRYPTION_KEY environment variable is set');
  }

  const key = Buffer.from(keyBase64, 'base64');
  if (key.length !== 32) {
    throw new Error('Social encryption key must decode to exactly 32 bytes');
  }
  return key;
}

/**
 * Encrypt a social media token using AES-256-GCM.
 * Returns a string in format: iv:authTag:ciphertext (all base64-encoded).
 */
export function encryptToken(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag();

  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

/**
 * Decrypt a social media token encrypted with encryptToken().
 * Expects format: iv:authTag:ciphertext (all base64-encoded).
 */
export function decryptToken(encryptedPayload: string): string {
  const parts = encryptedPayload.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted token format');
  }

  const [ivBase64, authTagBase64, ciphertext] = parts;
  const key = getKey();
  const iv = Buffer.from(ivBase64!, 'base64');
  const authTag = Buffer.from(authTagBase64!, 'base64');

  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext!, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
