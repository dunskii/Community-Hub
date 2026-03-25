/**
 * Seed test users.
 * Spec Appendix A.1: User model.
 */

import bcrypt from 'bcrypt';

import { UserRole, UserStatus } from '../../generated/prisma/client.js';
import type { PrismaClient } from '../../generated/prisma/client.js';
import { logger } from '../../utils/logger.js';

const TEST_USERS = [
  {
    email: 'user@test.com',
    display_name: 'Test User',
    role: UserRole.COMMUNITY,
    status: UserStatus.ACTIVE,
    email_verified: true,
  },
  {
    email: 'owner@test.com',
    display_name: 'Business Owner',
    role: UserRole.BUSINESS_OWNER,
    status: UserStatus.ACTIVE,
    email_verified: true,
  },
  {
    email: 'curator@test.com',
    display_name: 'Curator User',
    role: UserRole.CURATOR,
    status: UserStatus.ACTIVE,
    email_verified: true,
  },
  {
    email: 'admin@test.com',
    display_name: 'Admin User',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    email_verified: true,
  },
];

export async function seedUsers(prisma: PrismaClient): Promise<void> {
  const testPassword = await bcrypt.hash('Password123!', 12);

  for (const user of TEST_USERS) {
    await prisma.users.upsert({
      where: { email: user.email },
      update: {},
      create: {
        id: crypto.randomUUID(),
        ...user,
        password_hash: testPassword,
        updated_at: new Date(),
      },
    });
  }

  logger.info('Test users seeded');
}
