import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

import { logger } from './logger.js';

const MINIMUM_VERSION = '7.3.0';

export async function checkPrismaVersion(): Promise<void> {
  try {
    // Read version from @prisma/client's package.json instead of spawning a subprocess
    const require = createRequire(import.meta.url);
    const pkgPath = require.resolve('@prisma/client/package.json');
    const pkg = JSON.parse(await readFile(pkgPath, 'utf-8')) as { version?: string };
    const version = pkg.version ?? '';

    if (!version) {
      logger.warn('Could not determine Prisma version from @prisma/client/package.json');
      return;
    }

    const parts = version.split('.').map(Number);
    const reqParts = MINIMUM_VERSION.split('.').map(Number);
    const major = parts[0] ?? 0;
    const minor = parts[1] ?? 0;
    const patch = parts[2] ?? 0;
    const reqMajor = reqParts[0] ?? 0;
    const reqMinor = reqParts[1] ?? 0;
    const reqPatch = reqParts[2] ?? 0;

    if (
      major < reqMajor ||
      (major === reqMajor && minor < reqMinor) ||
      (major === reqMajor && minor === reqMinor && patch < reqPatch)
    ) {
      throw new Error(`Prisma ${MINIMUM_VERSION}+ required, found ${version}`);
    }

    logger.info(`Prisma version: ${version}`);
  } catch (err) {
    if (err instanceof Error && err.message.includes('required')) throw err;
    const message = err instanceof Error ? err.message : String(err);
    logger.warn(`Prisma version check skipped: ${message}`);
  }
}
