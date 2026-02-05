import { randomBytes } from 'node:crypto';

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Generate a valid 32-byte key for testing
const TEST_KEY = randomBytes(32).toString('base64');

// Dynamic imports (await import) are used per-test because getKey() reads
// process.env['ENCRYPTION_KEY'] on each call, not at module load time.
// This lets vi.stubEnv in beforeEach/individual tests override the key.
describe('encryption utility', () => {
  beforeEach(() => {
    vi.stubEnv('ENCRYPTION_KEY', TEST_KEY);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should encrypt and decrypt a string round-trip', async () => {
    const { encrypt, decrypt } = await import('../../utils/encryption.js');
    const plaintext = 'Hello, world!';
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it('should encrypt and decrypt unicode content', async () => {
    const { encrypt, decrypt } = await import('../../utils/encryption.js');
    const plaintext = 'Bonjour le monde! \u0645\u0631\u062D\u0628\u0627 \u4F60\u597D';
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it('should encrypt and decrypt empty string', async () => {
    const { encrypt, decrypt } = await import('../../utils/encryption.js');
    const encrypted = encrypt('');
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe('');
  });

  it('should produce different ciphertexts for same plaintext (random IV)', async () => {
    const { encrypt } = await import('../../utils/encryption.js');
    const plaintext = 'Same text';
    const encrypted1 = encrypt(plaintext);
    const encrypted2 = encrypt(plaintext);
    expect(encrypted1).not.toBe(encrypted2);
  });

  it('should produce output in iv:authTag:ciphertext format', async () => {
    const { encrypt } = await import('../../utils/encryption.js');
    const encrypted = encrypt('test');
    const parts = encrypted.split(':');
    expect(parts.length).toBe(3);
    // Each part should be valid base64
    for (const part of parts) {
      expect(() => Buffer.from(part!, 'base64')).not.toThrow();
    }
  });

  it('should throw on tampered ciphertext', async () => {
    const { encrypt, decrypt } = await import('../../utils/encryption.js');
    const encrypted = encrypt('test data');
    const parts = encrypted.split(':');
    // Tamper with the ciphertext portion
    const tampered = `${parts[0]}:${parts[1]}:${Buffer.from('tampered').toString('base64')}`;
    expect(() => decrypt(tampered)).toThrow();
  });

  it('should throw on tampered auth tag', async () => {
    const { encrypt, decrypt } = await import('../../utils/encryption.js');
    const encrypted = encrypt('test data');
    const parts = encrypted.split(':');
    // Tamper with the auth tag
    const fakeTag = randomBytes(16).toString('base64');
    const tampered = `${parts[0]}:${fakeTag}:${parts[2]}`;
    expect(() => decrypt(tampered)).toThrow();
  });

  it('should throw on invalid format (not 3 parts)', async () => {
    const { decrypt } = await import('../../utils/encryption.js');
    expect(() => decrypt('only-one-part')).toThrow('Invalid encrypted payload format');
    expect(() => decrypt('two:parts')).toThrow('Invalid encrypted payload format');
  });

  it('should throw when ENCRYPTION_KEY is not set', async () => {
    vi.stubEnv('ENCRYPTION_KEY', '');
    const { encrypt } = await import('../../utils/encryption.js');
    expect(() => encrypt('test')).toThrow();
  });

  it('should throw when ENCRYPTION_KEY decodes to wrong length', async () => {
    vi.stubEnv('ENCRYPTION_KEY', Buffer.from('too-short').toString('base64'));
    const { encrypt } = await import('../../utils/encryption.js');
    expect(() => encrypt('test')).toThrow('ENCRYPTION_KEY must decode to exactly 32 bytes');
  });
});
