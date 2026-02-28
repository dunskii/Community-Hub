import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';
import { defineConfig } from 'prisma/config';

// Load .env from monorepo root
dotenvConfig({ path: resolve(__dirname, '../../.env') });

const databaseUrl = process.env['DATABASE_URL'];
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set');
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx src/db/seed.ts',
  },
  datasource: {
    url: databaseUrl,
  },
});
