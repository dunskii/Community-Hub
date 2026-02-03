import { resolve } from 'node:path';

/**
 * Validates that a filename does not contain path traversal sequences or separators.
 * Throws if the filename is unsafe.
 */
export function assertSafeFilename(filename: string): void {
  if (
    filename.includes('..') ||
    filename.includes('/') ||
    filename.includes('\\') ||
    filename.includes('\0')
  ) {
    throw new Error('Invalid filename');
  }
}

/**
 * Resolves a filename within a base directory and verifies the result
 * stays within that directory. Throws on path traversal attempts.
 */
export function safeResolvePath(baseDir: string, filename: string): string {
  assertSafeFilename(filename);
  const base = resolve(baseDir);
  const resolved = resolve(base, filename);
  if (!resolved.startsWith(base)) {
    throw new Error('Invalid filename');
  }
  return resolved;
}
