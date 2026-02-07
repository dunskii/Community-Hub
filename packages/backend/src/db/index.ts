import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../generated/prisma/client.js';
import { logger } from '../utils/logger.js';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createClient(): PrismaClient {
  const connectionString = process.env['DATABASE_URL'];
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env['NODE_ENV'] !== 'production') {
  globalForPrisma.prisma = prisma;
}

// TODO: Phase 2 - add slow query logging via Prisma middleware (M-10)
export async function connectDb(): Promise<void> {
  logger.info('Connecting to database...');
  try {
    await prisma.$connect();
  } catch (err) {
    logger.error(err instanceof Error ? { err } : { err: String(err) }, 'Error connecting to database');
    throw err;
  }
}

export async function disconnectDb(): Promise<void> {
  logger.info('Disconnecting database...');
  try {
    await prisma.$disconnect();
  } catch (err) {
    logger.error(err instanceof Error ? { err } : { err: String(err) }, 'Error disconnecting database');
  }
}
