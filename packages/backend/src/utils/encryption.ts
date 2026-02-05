import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // GCM standard IV length
const AUTH_TAG_LENGTH = 16; // 128-bit auth tag

/**
 * Get the encryption key from environment.
 * Validated at startup by env-validate.ts as a base64-encoded 32-byte key.
 */
function getKey(): Buffer {
  const keyBase64 = process.env['ENCRYPTION_KEY'];
  if (!keyBase64) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }
  const key = Buffer.from(keyBase64, 'base64');
  if (key.length !== 32) {
    throw new Error('ENCRYPTION_KEY must decode to exactly 32 bytes');
  }
  return key;
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns a string in format: iv:authTag:ciphertext (all base64-encoded).
 *
 * Spec Section 4.2: AES-256 encryption for sensitive data at rest.
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag();

  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

/**
 * Decrypt a ciphertext string encrypted with encrypt().
 * Expects format: iv:authTag:ciphertext (all base64-encoded).
 * Throws if decryption fails (wrong key, tampered data, etc.).
 */
export function decrypt(encryptedPayload: string): string {
  const parts = encryptedPayload.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted payload format');
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

// TODO: Key rotation support -- encrypt with current key, decrypt tries current then old key.
// Implement when key rotation policy is defined (Phase 2+).
