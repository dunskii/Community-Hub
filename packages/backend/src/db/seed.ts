import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../generated/prisma/client.js';
import { logger } from '../utils/logger.js';

const connectionString = process.env['DATABASE_URL'];
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  logger.info('Seeding database...');

  // ── Categories ───────────────────────────────────────

  const businessCategories = [
    { slug: 'restaurant', name: { en: 'Restaurant' }, icon: 'utensils' },
    { slug: 'retail', name: { en: 'Retail' }, icon: 'shopping-bag' },
    { slug: 'services', name: { en: 'Services' }, icon: 'wrench' },
    { slug: 'health', name: { en: 'Health' }, icon: 'heart-pulse' },
    { slug: 'entertainment', name: { en: 'Entertainment' }, icon: 'music' },
    { slug: 'education', name: { en: 'Education' }, icon: 'graduation-cap' },
    { slug: 'professional', name: { en: 'Professional' }, icon: 'briefcase' },
  ];

  for (const [i, cat] of businessCategories.entries()) {
    await prisma.category.upsert({
      where: { type_slug: { type: 'BUSINESS', slug: cat.slug } },
      update: {},
      create: { ...cat, type: 'BUSINESS', displayOrder: i },
    });
  }

  const eventCategories = [
    { slug: 'music', name: { en: 'Music' }, icon: 'music' },
    { slug: 'community', name: { en: 'Community' }, icon: 'users' },
    { slug: 'sports', name: { en: 'Sports' }, icon: 'trophy' },
    { slug: 'markets', name: { en: 'Markets' }, icon: 'store' },
    { slug: 'workshop', name: { en: 'Workshop' }, icon: 'hammer' },
  ];

  for (const [i, cat] of eventCategories.entries()) {
    await prisma.category.upsert({
      where: { type_slug: { type: 'EVENT', slug: cat.slug } },
      update: {},
      create: { ...cat, type: 'EVENT', displayOrder: i },
    });
  }

  logger.info('Categories seeded');

  // ── System Settings ──────────────────────────────────

  const settings = [
    { key: 'maintenance_mode', value: false, description: 'Enable maintenance mode' },
    { key: 'registration_enabled', value: true, description: 'Allow new user registration' },
    { key: 'max_upload_size_mb', value: 5, description: 'Maximum upload size in MB' },
    {
      key: 'default_search_radius_km',
      value: 5,
      description: 'Default search radius in km',
    },
    {
      key: 'max_active_deals_per_business',
      value: 3,
      description: 'Max active deals per business',
    },
    {
      key: 'featured_businesses',
      value: [],
      description: 'List of featured business IDs for homepage',
    },
  ];

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: {
        key: setting.key,
        value: setting.value,
        description: setting.description,
      },
    });
  }

  logger.info('System settings seeded');

  // ── Email Templates ──────────────────────────────────

  const templates = [
    {
      templateKey: 'welcome',
      name: 'Welcome Email',
      description: 'Sent to new users after registration',
      subject: { en: 'Welcome to {{platformName}}' },
      bodyHtml: {
        en: '<h1>Welcome, {{displayName}}!</h1><p>Thank you for joining our community.</p>',
      },
      bodyText: {
        en: 'Welcome, {{displayName}}! Thank you for joining our community.',
      },
      variables: ['platformName', 'displayName'],
    },
    {
      templateKey: 'verify_email',
      name: 'Email Verification',
      description: 'Sent to verify user email address',
      subject: { en: 'Verify your email address' },
      bodyHtml: {
        en: '<p>Please verify your email by clicking: <a href="{{verificationLink}}">Verify Email</a></p>',
      },
      bodyText: {
        en: 'Please verify your email by visiting: {{verificationLink}}',
      },
      variables: ['verificationLink', 'displayName'],
    },
    {
      templateKey: 'password_reset',
      name: 'Password Reset',
      description: 'Sent when user requests a password reset',
      subject: { en: 'Reset your password' },
      bodyHtml: {
        en: '<p>Click here to reset your password: <a href="{{resetLink}}">Reset Password</a></p>',
      },
      bodyText: {
        en: 'Reset your password by visiting: {{resetLink}}',
      },
      variables: ['resetLink', 'displayName'],
    },
  ];

  for (const tmpl of templates) {
    await prisma.emailTemplate.upsert({
      where: { templateKey: tmpl.templateKey },
      update: {},
      create: tmpl,
    });
  }

  logger.info('Email templates seeded');
  logger.info('Database seeded successfully.');
}

main()
  .catch((e) => {
    logger.error(e, 'Seed failed');
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
