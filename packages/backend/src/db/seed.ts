import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../generated/prisma/client.js';
import { logger } from '../utils/logger.js';
import { seedCategories } from './seeds/seed-categories.js';
import { seedSystemSettings } from './seeds/seed-system-settings.js';
import { seedEmailTemplates } from './seeds/email-templates.js';
import { seedUsers } from './seeds/seed-users.js';
import { seedBusinesses } from './seeds/seed-businesses.js';
import { seedDeals } from './seeds/seed-deals.js';

const connectionString = process.env['DATABASE_URL'];
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  logger.info('Seeding database...');

  const categoryMap = await seedCategories(prisma);
  await seedSystemSettings(prisma);
  await seedEmailTemplates();
  await seedUsers(prisma);
  await seedBusinesses(prisma, categoryMap);
  await seedDeals(prisma);

  logger.info('Database seeded successfully.');
}

main()
  .catch((e) => {
    logger.error(e, 'Seed failed');
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
