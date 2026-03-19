import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';

import { PrismaClient, UserRole, UserStatus, VerificationMethod, ClaimVerificationStatus, ClaimStatus } from '../generated/prisma/client.js';
import { logger } from '../utils/logger.js';
import { seedEmailTemplates } from './seeds/email-templates.js';

const connectionString = process.env['DATABASE_URL'];
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  logger.info('Seeding database...');

  // ── Categories ───────────────────────────────────────

  // Business Categories (hierarchical with multilingual names)
  const businessCategories = [
    // Food & Beverage (parent)
    {
      slug: 'food-beverage',
      name: {
        en: 'Food & Beverage',
        ar: '[UNTRANSLATED] Food & Beverage',
        'zh-CN': '[UNTRANSLATED] Food & Beverage',
        'zh-TW': '[UNTRANSLATED] Food & Beverage',
        vi: '[UNTRANSLATED] Food & Beverage',
        hi: '[UNTRANSLATED] Food & Beverage',
        ur: '[UNTRANSLATED] Food & Beverage',
        ko: '[UNTRANSLATED] Food & Beverage',
        el: '[UNTRANSLATED] Food & Beverage',
        it: '[UNTRANSLATED] Food & Beverage',
      },
      icon: 'utensils',
      parentSlug: null,
    },
    {
      slug: 'restaurant',
      name: {
        en: 'Restaurant',
        ar: '[UNTRANSLATED] Restaurant',
        'zh-CN': '[UNTRANSLATED] Restaurant',
        'zh-TW': '[UNTRANSLATED] Restaurant',
        vi: '[UNTRANSLATED] Restaurant',
        hi: '[UNTRANSLATED] Restaurant',
        ur: '[UNTRANSLATED] Restaurant',
        ko: '[UNTRANSLATED] Restaurant',
        el: '[UNTRANSLATED] Restaurant',
        it: '[UNTRANSLATED] Restaurant',
      },
      icon: 'utensils',
      parentSlug: 'food-beverage',
    },
    {
      slug: 'cafe',
      name: {
        en: 'Cafe',
        ar: '[UNTRANSLATED] Cafe',
        'zh-CN': '[UNTRANSLATED] Cafe',
        'zh-TW': '[UNTRANSLATED] Cafe',
        vi: '[UNTRANSLATED] Cafe',
        hi: '[UNTRANSLATED] Cafe',
        ur: '[UNTRANSLATED] Cafe',
        ko: '[UNTRANSLATED] Cafe',
        el: '[UNTRANSLATED] Cafe',
        it: '[UNTRANSLATED] Cafe',
      },
      icon: 'coffee',
      parentSlug: 'food-beverage',
    },
    {
      slug: 'bakery',
      name: {
        en: 'Bakery',
        ar: '[UNTRANSLATED] Bakery',
        'zh-CN': '[UNTRANSLATED] Bakery',
        'zh-TW': '[UNTRANSLATED] Bakery',
        vi: '[UNTRANSLATED] Bakery',
        hi: '[UNTRANSLATED] Bakery',
        ur: '[UNTRANSLATED] Bakery',
        ko: '[UNTRANSLATED] Bakery',
        el: '[UNTRANSLATED] Bakery',
        it: '[UNTRANSLATED] Bakery',
      },
      icon: 'bread-slice',
      parentSlug: 'food-beverage',
    },
    {
      slug: 'fast-food',
      name: {
        en: 'Fast Food',
        ar: '[UNTRANSLATED] Fast Food',
        'zh-CN': '[UNTRANSLATED] Fast Food',
        'zh-TW': '[UNTRANSLATED] Fast Food',
        vi: '[UNTRANSLATED] Fast Food',
        hi: '[UNTRANSLATED] Fast Food',
        ur: '[UNTRANSLATED] Fast Food',
        ko: '[UNTRANSLATED] Fast Food',
        el: '[UNTRANSLATED] Fast Food',
        it: '[UNTRANSLATED] Fast Food',
      },
      icon: 'burger',
      parentSlug: 'food-beverage',
    },

    // Retail (parent)
    {
      slug: 'retail',
      name: {
        en: 'Retail',
        ar: '[UNTRANSLATED] Retail',
        'zh-CN': '[UNTRANSLATED] Retail',
        'zh-TW': '[UNTRANSLATED] Retail',
        vi: '[UNTRANSLATED] Retail',
        hi: '[UNTRANSLATED] Retail',
        ur: '[UNTRANSLATED] Retail',
        ko: '[UNTRANSLATED] Retail',
        el: '[UNTRANSLATED] Retail',
        it: '[UNTRANSLATED] Retail',
      },
      icon: 'shopping-bag',
      parentSlug: null,
    },
    {
      slug: 'clothing',
      name: {
        en: 'Clothing',
        ar: '[UNTRANSLATED] Clothing',
        'zh-CN': '[UNTRANSLATED] Clothing',
        'zh-TW': '[UNTRANSLATED] Clothing',
        vi: '[UNTRANSLATED] Clothing',
        hi: '[UNTRANSLATED] Clothing',
        ur: '[UNTRANSLATED] Clothing',
        ko: '[UNTRANSLATED] Clothing',
        el: '[UNTRANSLATED] Clothing',
        it: '[UNTRANSLATED] Clothing',
      },
      icon: 'shirt',
      parentSlug: 'retail',
    },
    {
      slug: 'electronics',
      name: {
        en: 'Electronics',
        ar: '[UNTRANSLATED] Electronics',
        'zh-CN': '[UNTRANSLATED] Electronics',
        'zh-TW': '[UNTRANSLATED] Electronics',
        vi: '[UNTRANSLATED] Electronics',
        hi: '[UNTRANSLATED] Electronics',
        ur: '[UNTRANSLATED] Electronics',
        ko: '[UNTRANSLATED] Electronics',
        el: '[UNTRANSLATED] Electronics',
        it: '[UNTRANSLATED] Electronics',
      },
      icon: 'laptop',
      parentSlug: 'retail',
    },
    {
      slug: 'grocery',
      name: {
        en: 'Grocery',
        ar: '[UNTRANSLATED] Grocery',
        'zh-CN': '[UNTRANSLATED] Grocery',
        'zh-TW': '[UNTRANSLATED] Grocery',
        vi: '[UNTRANSLATED] Grocery',
        hi: '[UNTRANSLATED] Grocery',
        ur: '[UNTRANSLATED] Grocery',
        ko: '[UNTRANSLATED] Grocery',
        el: '[UNTRANSLATED] Grocery',
        it: '[UNTRANSLATED] Grocery',
      },
      icon: 'shopping-cart',
      parentSlug: 'retail',
    },
    {
      slug: 'books',
      name: {
        en: 'Books',
        ar: '[UNTRANSLATED] Books',
        'zh-CN': '[UNTRANSLATED] Books',
        'zh-TW': '[UNTRANSLATED] Books',
        vi: '[UNTRANSLATED] Books',
        hi: '[UNTRANSLATED] Books',
        ur: '[UNTRANSLATED] Books',
        ko: '[UNTRANSLATED] Books',
        el: '[UNTRANSLATED] Books',
        it: '[UNTRANSLATED] Books',
      },
      icon: 'book',
      parentSlug: 'retail',
    },

    // Services (parent)
    {
      slug: 'services',
      name: {
        en: 'Services',
        ar: '[UNTRANSLATED] Services',
        'zh-CN': '[UNTRANSLATED] Services',
        'zh-TW': '[UNTRANSLATED] Services',
        vi: '[UNTRANSLATED] Services',
        hi: '[UNTRANSLATED] Services',
        ur: '[UNTRANSLATED] Services',
        ko: '[UNTRANSLATED] Services',
        el: '[UNTRANSLATED] Services',
        it: '[UNTRANSLATED] Services',
      },
      icon: 'wrench',
      parentSlug: null,
    },
    {
      slug: 'haircut-salon',
      name: {
        en: 'Haircut & Salon',
        ar: '[UNTRANSLATED] Haircut & Salon',
        'zh-CN': '[UNTRANSLATED] Haircut & Salon',
        'zh-TW': '[UNTRANSLATED] Haircut & Salon',
        vi: '[UNTRANSLATED] Haircut & Salon',
        hi: '[UNTRANSLATED] Haircut & Salon',
        ur: '[UNTRANSLATED] Haircut & Salon',
        ko: '[UNTRANSLATED] Haircut & Salon',
        el: '[UNTRANSLATED] Haircut & Salon',
        it: '[UNTRANSLATED] Haircut & Salon',
      },
      icon: 'scissors',
      parentSlug: 'services',
    },
    {
      slug: 'auto-repair',
      name: {
        en: 'Auto Repair',
        ar: '[UNTRANSLATED] Auto Repair',
        'zh-CN': '[UNTRANSLATED] Auto Repair',
        'zh-TW': '[UNTRANSLATED] Auto Repair',
        vi: '[UNTRANSLATED] Auto Repair',
        hi: '[UNTRANSLATED] Auto Repair',
        ur: '[UNTRANSLATED] Auto Repair',
        ko: '[UNTRANSLATED] Auto Repair',
        el: '[UNTRANSLATED] Auto Repair',
        it: '[UNTRANSLATED] Auto Repair',
      },
      icon: 'car',
      parentSlug: 'services',
    },
    {
      slug: 'home-repair',
      name: {
        en: 'Home Repair',
        ar: '[UNTRANSLATED] Home Repair',
        'zh-CN': '[UNTRANSLATED] Home Repair',
        'zh-TW': '[UNTRANSLATED] Home Repair',
        vi: '[UNTRANSLATED] Home Repair',
        hi: '[UNTRANSLATED] Home Repair',
        ur: '[UNTRANSLATED] Home Repair',
        ko: '[UNTRANSLATED] Home Repair',
        el: '[UNTRANSLATED] Home Repair',
        it: '[UNTRANSLATED] Home Repair',
      },
      icon: 'hammer',
      parentSlug: 'services',
    },

    // Health & Wellness (parent)
    {
      slug: 'health',
      name: {
        en: 'Health & Wellness',
        ar: '[UNTRANSLATED] Health & Wellness',
        'zh-CN': '[UNTRANSLATED] Health & Wellness',
        'zh-TW': '[UNTRANSLATED] Health & Wellness',
        vi: '[UNTRANSLATED] Health & Wellness',
        hi: '[UNTRANSLATED] Health & Wellness',
        ur: '[UNTRANSLATED] Health & Wellness',
        ko: '[UNTRANSLATED] Health & Wellness',
        el: '[UNTRANSLATED] Health & Wellness',
        it: '[UNTRANSLATED] Health & Wellness',
      },
      icon: 'heart-pulse',
      parentSlug: null,
    },
    {
      slug: 'medical',
      name: {
        en: 'Medical',
        ar: '[UNTRANSLATED] Medical',
        'zh-CN': '[UNTRANSLATED] Medical',
        'zh-TW': '[UNTRANSLATED] Medical',
        vi: '[UNTRANSLATED] Medical',
        hi: '[UNTRANSLATED] Medical',
        ur: '[UNTRANSLATED] Medical',
        ko: '[UNTRANSLATED] Medical',
        el: '[UNTRANSLATED] Medical',
        it: '[UNTRANSLATED] Medical',
      },
      icon: 'stethoscope',
      parentSlug: 'health',
    },
    {
      slug: 'dental',
      name: {
        en: 'Dental',
        ar: '[UNTRANSLATED] Dental',
        'zh-CN': '[UNTRANSLATED] Dental',
        'zh-TW': '[UNTRANSLATED] Dental',
        vi: '[UNTRANSLATED] Dental',
        hi: '[UNTRANSLATED] Dental',
        ur: '[UNTRANSLATED] Dental',
        ko: '[UNTRANSLATED] Dental',
        el: '[UNTRANSLATED] Dental',
        it: '[UNTRANSLATED] Dental',
      },
      icon: 'tooth',
      parentSlug: 'health',
    },
    {
      slug: 'pharmacy',
      name: {
        en: 'Pharmacy',
        ar: '[UNTRANSLATED] Pharmacy',
        'zh-CN': '[UNTRANSLATED] Pharmacy',
        'zh-TW': '[UNTRANSLATED] Pharmacy',
        vi: '[UNTRANSLATED] Pharmacy',
        hi: '[UNTRANSLATED] Pharmacy',
        ur: '[UNTRANSLATED] Pharmacy',
        ko: '[UNTRANSLATED] Pharmacy',
        el: '[UNTRANSLATED] Pharmacy',
        it: '[UNTRANSLATED] Pharmacy',
      },
      icon: 'pills',
      parentSlug: 'health',
    },
    {
      slug: 'fitness',
      name: {
        en: 'Fitness',
        ar: '[UNTRANSLATED] Fitness',
        'zh-CN': '[UNTRANSLATED] Fitness',
        'zh-TW': '[UNTRANSLATED] Fitness',
        vi: '[UNTRANSLATED] Fitness',
        hi: '[UNTRANSLATED] Fitness',
        ur: '[UNTRANSLATED] Fitness',
        ko: '[UNTRANSLATED] Fitness',
        el: '[UNTRANSLATED] Fitness',
        it: '[UNTRANSLATED] Fitness',
      },
      icon: 'dumbbell',
      parentSlug: 'health',
    },

    // Professional Services (parent)
    {
      slug: 'professional',
      name: {
        en: 'Professional Services',
        ar: '[UNTRANSLATED] Professional Services',
        'zh-CN': '[UNTRANSLATED] Professional Services',
        'zh-TW': '[UNTRANSLATED] Professional Services',
        vi: '[UNTRANSLATED] Professional Services',
        hi: '[UNTRANSLATED] Professional Services',
        ur: '[UNTRANSLATED] Professional Services',
        ko: '[UNTRANSLATED] Professional Services',
        el: '[UNTRANSLATED] Professional Services',
        it: '[UNTRANSLATED] Professional Services',
      },
      icon: 'briefcase',
      parentSlug: null,
    },
    {
      slug: 'legal',
      name: {
        en: 'Legal',
        ar: '[UNTRANSLATED] Legal',
        'zh-CN': '[UNTRANSLATED] Legal',
        'zh-TW': '[UNTRANSLATED] Legal',
        vi: '[UNTRANSLATED] Legal',
        hi: '[UNTRANSLATED] Legal',
        ur: '[UNTRANSLATED] Legal',
        ko: '[UNTRANSLATED] Legal',
        el: '[UNTRANSLATED] Legal',
        it: '[UNTRANSLATED] Legal',
      },
      icon: 'gavel',
      parentSlug: 'professional',
    },
    {
      slug: 'accounting',
      name: {
        en: 'Accounting',
        ar: '[UNTRANSLATED] Accounting',
        'zh-CN': '[UNTRANSLATED] Accounting',
        'zh-TW': '[UNTRANSLATED] Accounting',
        vi: '[UNTRANSLATED] Accounting',
        hi: '[UNTRANSLATED] Accounting',
        ur: '[UNTRANSLATED] Accounting',
        ko: '[UNTRANSLATED] Accounting',
        el: '[UNTRANSLATED] Accounting',
        it: '[UNTRANSLATED] Accounting',
      },
      icon: 'calculator',
      parentSlug: 'professional',
    },
    {
      slug: 'real-estate',
      name: {
        en: 'Real Estate',
        ar: '[UNTRANSLATED] Real Estate',
        'zh-CN': '[UNTRANSLATED] Real Estate',
        'zh-TW': '[UNTRANSLATED] Real Estate',
        vi: '[UNTRANSLATED] Real Estate',
        hi: '[UNTRANSLATED] Real Estate',
        ur: '[UNTRANSLATED] Real Estate',
        ko: '[UNTRANSLATED] Real Estate',
        el: '[UNTRANSLATED] Real Estate',
        it: '[UNTRANSLATED] Real Estate',
      },
      icon: 'home',
      parentSlug: 'professional',
    },

    // Education & Training (parent)
    {
      slug: 'education',
      name: {
        en: 'Education & Training',
        ar: '[UNTRANSLATED] Education & Training',
        'zh-CN': '[UNTRANSLATED] Education & Training',
        'zh-TW': '[UNTRANSLATED] Education & Training',
        vi: '[UNTRANSLATED] Education & Training',
        hi: '[UNTRANSLATED] Education & Training',
        ur: '[UNTRANSLATED] Education & Training',
        ko: '[UNTRANSLATED] Education & Training',
        el: '[UNTRANSLATED] Education & Training',
        it: '[UNTRANSLATED] Education & Training',
      },
      icon: 'graduation-cap',
      parentSlug: null,
    },
    {
      slug: 'tutoring',
      name: {
        en: 'Tutoring',
        ar: '[UNTRANSLATED] Tutoring',
        'zh-CN': '[UNTRANSLATED] Tutoring',
        'zh-TW': '[UNTRANSLATED] Tutoring',
        vi: '[UNTRANSLATED] Tutoring',
        hi: '[UNTRANSLATED] Tutoring',
        ur: '[UNTRANSLATED] Tutoring',
        ko: '[UNTRANSLATED] Tutoring',
        el: '[UNTRANSLATED] Tutoring',
        it: '[UNTRANSLATED] Tutoring',
      },
      icon: 'book-open',
      parentSlug: 'education',
    },
    {
      slug: 'language-school',
      name: {
        en: 'Language School',
        ar: '[UNTRANSLATED] Language School',
        'zh-CN': '[UNTRANSLATED] Language School',
        'zh-TW': '[UNTRANSLATED] Language School',
        vi: '[UNTRANSLATED] Language School',
        hi: '[UNTRANSLATED] Language School',
        ur: '[UNTRANSLATED] Language School',
        ko: '[UNTRANSLATED] Language School',
        el: '[UNTRANSLATED] Language School',
        it: '[UNTRANSLATED] Language School',
      },
      icon: 'globe',
      parentSlug: 'education',
    },

    // Entertainment (parent)
    {
      slug: 'entertainment',
      name: {
        en: 'Entertainment',
        ar: '[UNTRANSLATED] Entertainment',
        'zh-CN': '[UNTRANSLATED] Entertainment',
        'zh-TW': '[UNTRANSLATED] Entertainment',
        vi: '[UNTRANSLATED] Entertainment',
        hi: '[UNTRANSLATED] Entertainment',
        ur: '[UNTRANSLATED] Entertainment',
        ko: '[UNTRANSLATED] Entertainment',
        el: '[UNTRANSLATED] Entertainment',
        it: '[UNTRANSLATED] Entertainment',
      },
      icon: 'music',
      parentSlug: null,
    },
    {
      slug: 'cinema',
      name: {
        en: 'Cinema',
        ar: '[UNTRANSLATED] Cinema',
        'zh-CN': '[UNTRANSLATED] Cinema',
        'zh-TW': '[UNTRANSLATED] Cinema',
        vi: '[UNTRANSLATED] Cinema',
        hi: '[UNTRANSLATED] Cinema',
        ur: '[UNTRANSLATED] Cinema',
        ko: '[UNTRANSLATED] Cinema',
        el: '[UNTRANSLATED] Cinema',
        it: '[UNTRANSLATED] Cinema',
      },
      icon: 'film',
      parentSlug: 'entertainment',
    },
    {
      slug: 'arts-crafts',
      name: {
        en: 'Arts & Crafts',
        ar: '[UNTRANSLATED] Arts & Crafts',
        'zh-CN': '[UNTRANSLATED] Arts & Crafts',
        'zh-TW': '[UNTRANSLATED] Arts & Crafts',
        vi: '[UNTRANSLATED] Arts & Crafts',
        hi: '[UNTRANSLATED] Arts & Crafts',
        ur: '[UNTRANSLATED] Arts & Crafts',
        ko: '[UNTRANSLATED] Arts & Crafts',
        el: '[UNTRANSLATED] Arts & Crafts',
        it: '[UNTRANSLATED] Arts & Crafts',
      },
      icon: 'palette',
      parentSlug: 'entertainment',
    },
  ];

  // Create parents first, then children
  const categoryMap = new Map<string, string>();

  for (const [i, cat] of businessCategories.entries()) {
    const category = await prisma.category.upsert({
      where: { type_slug: { type: 'BUSINESS', slug: cat.slug } },
      update: {},
      create: {
        slug: cat.slug,
        name: cat.name,
        icon: cat.icon,
        type: 'BUSINESS',
        displayOrder: i,
        parentId: cat.parentSlug ? categoryMap.get(cat.parentSlug) : null,
      },
    });
    categoryMap.set(cat.slug, category.id);
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

  await seedEmailTemplates();

  // ── Test Users ──────────────────────────────────────

  const testPassword = await bcrypt.hash('Password123!', 12);

  const testUsers = [
    {
      email: 'user@test.com',
      passwordHash: testPassword,
      displayName: 'Test User',
      role: UserRole.COMMUNITY,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    },
    {
      email: 'owner@test.com',
      passwordHash: testPassword,
      displayName: 'Business Owner',
      role: UserRole.BUSINESS_OWNER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    },
    {
      email: 'admin@test.com',
      passwordHash: testPassword,
      displayName: 'Admin User',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    },
  ];

  for (const user of testUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
  }

  logger.info('Test users seeded');

  // ── Sample Businesses ────────────────────────────────

  const sampleBusinesses = [
    {
      name: "Guilford Grill House",
      slug: "guildford-grill-house",
      description: {
        en: "Authentic Mediterranean cuisine with a modern twist. Family-owned restaurant serving fresh grilled meats, seafood, and vegetarian options. Daily lunch specials available.",
      },
      categorySlug: "restaurant",
      address: {
        street: "123 Woodville Road",
        suburb: "Guilford",
        state: "NSW",
        postcode: "2161",
        country: "Australia",
        latitude: -33.8522,
        longitude: 150.9878,
      },
      phone: "+61 2 9632 1234",
      email: "info@guildfordgrill.com.au",
      website: "https://guildfordgrill.com.au",
      operatingHours: {
        monday: { open: "11:00", close: "22:00", closed: false },
        tuesday: { open: "11:00", close: "22:00", closed: false },
        wednesday: { open: "11:00", close: "22:00", closed: false },
        thursday: { open: "11:00", close: "22:00", closed: false },
        friday: { open: "11:00", close: "23:00", closed: false },
        saturday: { open: "11:00", close: "23:00", closed: false },
        sunday: { open: "12:00", close: "21:00", closed: false },
      },
      priceRange: "MODERATE" as const,
      languagesSpoken: ["en", "ar"],
      paymentMethods: ["CASH", "CREDIT_CARD", "DEBIT_CARD"],
      accessibilityFeatures: ["WHEELCHAIR_ACCESSIBLE", "ACCESSIBLE_PARKING"],
    },
    {
      name: "The Daily Grind Cafe",
      slug: "daily-grind-cafe",
      description: {
        en: "Artisan coffee roasted on-site. Specialty coffee, fresh pastries, and light meals. Free WiFi and outdoor seating available.",
      },
      categorySlug: "cafe",
      address: {
        street: "45 Railway Terrace",
        suburb: "Guilford",
        state: "NSW",
        postcode: "2161",
        country: "Australia",
        latitude: -33.8515,
        longitude: 150.9890,
      },
      phone: "+61 2 9632 5678",
      email: "hello@dailygrindcafe.com.au",
      website: "https://dailygrindcafe.com.au",
      operatingHours: {
        monday: { open: "06:00", close: "15:00", closed: false },
        tuesday: { open: "06:00", close: "15:00", closed: false },
        wednesday: { open: "06:00", close: "15:00", closed: false },
        thursday: { open: "06:00", close: "15:00", closed: false },
        friday: { open: "06:00", close: "15:00", closed: false },
        saturday: { open: "07:00", close: "14:00", closed: false },
        sunday: { open: "08:00", close: "13:00", closed: false },
      },
      priceRange: "BUDGET" as const,
      languagesSpoken: ["en"],
      paymentMethods: ["CASH", "CREDIT_CARD", "DEBIT_CARD", "MOBILE_PAYMENT"],
      accessibilityFeatures: ["WHEELCHAIR_ACCESSIBLE"],
    },
    {
      name: "Golden Crust Bakery",
      slug: "golden-crust-bakery",
      description: {
        en: "Traditional Lebanese bakery baking fresh bread daily. Specialty items include man'oush, spinach pies, and sweet pastries. Established 1995.",
      },
      categorySlug: "bakery",
      address: {
        street: "78 Woodville Road",
        suburb: "Guilford",
        state: "NSW",
        postcode: "2161",
        country: "Australia",
        latitude: -33.8530,
        longitude: 150.9865,
      },
      phone: "+61 2 9632 9012",
      operatingHours: {
        monday: { open: "05:00", close: "18:00", closed: false },
        tuesday: { open: "05:00", close: "18:00", closed: false },
        wednesday: { open: "05:00", close: "18:00", closed: false },
        thursday: { open: "05:00", close: "18:00", closed: false },
        friday: { open: "05:00", close: "18:00", closed: false },
        saturday: { open: "05:00", close: "17:00", closed: false },
        sunday: { open: "06:00", close: "14:00", closed: false },
      },
      priceRange: "BUDGET" as const,
      languagesSpoken: ["en", "ar"],
      paymentMethods: ["CASH", "CREDIT_CARD"],
      yearEstablished: 1995,
    },
    {
      name: "Guilford Medical Centre",
      slug: "guildford-medical-centre",
      description: {
        en: "Comprehensive family medical practice. Bulk billing available. Services include general consultations, vaccinations, health checks, and chronic disease management.",
      },
      categorySlug: "medical",
      address: {
        street: "156 Guilford Road",
        suburb: "Guilford",
        state: "NSW",
        postcode: "2161",
        country: "Australia",
        latitude: -33.8510,
        longitude: 150.9900,
      },
      phone: "+61 2 9632 3456",
      email: "reception@guildfordmedical.com.au",
      website: "https://guildfordmedical.com.au",
      operatingHours: {
        monday: { open: "08:00", close: "18:00", closed: false },
        tuesday: { open: "08:00", close: "18:00", closed: false },
        wednesday: { open: "08:00", close: "18:00", closed: false },
        thursday: { open: "08:00", close: "18:00", closed: false },
        friday: { open: "08:00", close: "18:00", closed: false },
        saturday: { open: "09:00", close: "13:00", closed: false },
        sunday: { closed: true },
      },
      priceRange: "MODERATE" as const,
      languagesSpoken: ["en", "ar", "zh-CN", "vi", "hi"],
      paymentMethods: ["CREDIT_CARD", "DEBIT_CARD", "MEDICARE"],
      accessibilityFeatures: ["WHEELCHAIR_ACCESSIBLE", "ACCESSIBLE_PARKING", "HEARING_LOOP"],
      certifications: ["MEDICARE_PROVIDER"],
    },
    {
      name: "Tech Hub Electronics",
      slug: "tech-hub-electronics",
      description: {
        en: "Computer repairs, sales, and IT services. Specializing in laptop repairs, custom PC builds, and networking solutions. Same-day service available.",
      },
      categorySlug: "electronics",
      address: {
        street: "234 Woodville Road",
        suburb: "Guilford",
        state: "NSW",
        postcode: "2161",
        country: "Australia",
        latitude: -33.8540,
        longitude: 150.9850,
      },
      phone: "+61 2 9632 7890",
      email: "support@techhubguildford.com.au",
      website: "https://techhubguildford.com.au",
      operatingHours: {
        monday: { open: "09:00", close: "18:00", closed: false },
        tuesday: { open: "09:00", close: "18:00", closed: false },
        wednesday: { open: "09:00", close: "18:00", closed: false },
        thursday: { open: "09:00", close: "18:00", closed: false },
        friday: { open: "09:00", close: "18:00", closed: false },
        saturday: { open: "10:00", close: "16:00", closed: false },
        sunday: { closed: true },
      },
      priceRange: "MODERATE" as const,
      languagesSpoken: ["en"],
      paymentMethods: ["CASH", "CREDIT_CARD", "DEBIT_CARD", "BANK_TRANSFER"],
      accessibilityFeatures: ["WHEELCHAIR_ACCESSIBLE"],
    },
    {
      name: "Fitness First Guilford",
      slug: "fitness-first-guildford",
      description: {
        en: "24/7 gym with state-of-the-art equipment. Group fitness classes, personal training, and nutritional guidance. Student and senior discounts available.",
      },
      categorySlug: "fitness",
      address: {
        street: "89 Railway Terrace",
        suburb: "Guilford",
        state: "NSW",
        postcode: "2161",
        country: "Australia",
        latitude: -33.8518,
        longitude: 150.9885,
      },
      phone: "+61 2 9632 4567",
      email: "guildford@fitnessfirst.com.au",
      website: "https://fitnessfirst.com.au/guildford",
      operatingHours: {
        monday: { open: "00:00", close: "23:59", closed: false },
        tuesday: { open: "00:00", close: "23:59", closed: false },
        wednesday: { open: "00:00", close: "23:59", closed: false },
        thursday: { open: "00:00", close: "23:59", closed: false },
        friday: { open: "00:00", close: "23:59", closed: false },
        saturday: { open: "00:00", close: "23:59", closed: false },
        sunday: { open: "00:00", close: "23:59", closed: false },
      },
      priceRange: "MODERATE" as const,
      languagesSpoken: ["en"],
      paymentMethods: ["CREDIT_CARD", "DEBIT_CARD", "DIRECT_DEBIT"],
      accessibilityFeatures: ["WHEELCHAIR_ACCESSIBLE", "ACCESSIBLE_PARKING"],
    },
    {
      name: "Guilford Pharmacy Plus",
      slug: "guildford-pharmacy-plus",
      description: {
        en: "Full-service pharmacy with prescription services, health advice, and vaccinations. Home delivery available for seniors and those with mobility issues.",
      },
      categorySlug: "pharmacy",
      address: {
        street: "12 Guilford Road",
        suburb: "Guilford",
        state: "NSW",
        postcode: "2161",
        country: "Australia",
        latitude: -33.8525,
        longitude: 150.9895,
      },
      phone: "+61 2 9632 6789",
      email: "info@guildfordpharmacy.com.au",
      website: "https://guildfordpharmacy.com.au",
      operatingHours: {
        monday: { open: "08:00", close: "20:00", closed: false },
        tuesday: { open: "08:00", close: "20:00", closed: false },
        wednesday: { open: "08:00", close: "20:00", closed: false },
        thursday: { open: "08:00", close: "20:00", closed: false },
        friday: { open: "08:00", close: "20:00", closed: false },
        saturday: { open: "09:00", close: "18:00", closed: false },
        sunday: { open: "10:00", close: "17:00", closed: false },
      },
      priceRange: "MODERATE" as const,
      languagesSpoken: ["en", "ar", "zh-CN"],
      paymentMethods: ["CASH", "CREDIT_CARD", "DEBIT_CARD"],
      accessibilityFeatures: ["WHEELCHAIR_ACCESSIBLE"],
      certifications: ["PBS_PROVIDER"],
    },
    {
      name: "Styles Hair Salon",
      slug: "styles-hair-salon",
      description: {
        en: "Professional hair styling, coloring, and treatments. Experienced stylists specializing in men's, women's, and children's cuts. Bridal packages available.",
      },
      categorySlug: "haircut-salon",
      address: {
        street: "67 Woodville Road",
        suburb: "Guilford",
        state: "NSW",
        postcode: "2161",
        country: "Australia",
        latitude: -33.8535,
        longitude: 150.9870,
      },
      phone: "+61 2 9632 8901",
      operatingHours: {
        monday: { closed: true },
        tuesday: { open: "09:00", close: "18:00", closed: false },
        wednesday: { open: "09:00", close: "18:00", closed: false },
        thursday: { open: "09:00", close: "20:00", closed: false },
        friday: { open: "09:00", close: "20:00", closed: false },
        saturday: { open: "08:00", close: "17:00", closed: false },
        sunday: { open: "10:00", close: "16:00", closed: false },
      },
      priceRange: "MODERATE" as const,
      languagesSpoken: ["en", "it", "el"],
      paymentMethods: ["CASH", "CREDIT_CARD", "DEBIT_CARD"],
    },
  ];

  for (const business of sampleBusinesses) {
    const categoryId = categoryMap.get(business.categorySlug);
    if (!categoryId) {
      logger.warn(`Category not found: ${business.categorySlug}`);
      continue;
    }

    await prisma.business.upsert({
      where: { slug: business.slug },
      update: {},
      create: {
        name: business.name,
        slug: business.slug,
        description: business.description,
        categoryPrimaryId: categoryId,
        address: business.address as any,
        phone: business.phone,
        email: business.email,
        website: business.website,
        operatingHours: business.operatingHours as any,
        priceRange: business.priceRange,
        languagesSpoken: business.languagesSpoken || [],
        paymentMethods: business.paymentMethods || [],
        accessibilityFeatures: business.accessibilityFeatures || [],
        certifications: business.certifications || [],
        yearEstablished: business.yearEstablished,
        status: "ACTIVE", // Active and ready for display
        claimed: false,
        verifiedAt: new Date(), // Verified for demo purposes
      },
    });
  }

  logger.info('Sample businesses seeded');

  // ── Link Business Owner to a Business ────────────────────

  // Get the business owner user
  const businessOwner = await prisma.user.findUnique({
    where: { email: 'owner@test.com' },
  });

  // Get the first business (Guildford Grill House)
  const firstBusiness = await prisma.business.findUnique({
    where: { slug: 'guildford-grill-house' },
  });

  if (businessOwner && firstBusiness) {
    // Create an approved claim request
    await prisma.businessClaimRequest.upsert({
      where: {
        businessId_userId: {
          businessId: firstBusiness.id,
          userId: businessOwner.id,
        },
      },
      update: {},
      create: {
        businessId: firstBusiness.id,
        userId: businessOwner.id,
        verificationMethod: VerificationMethod.EMAIL,
        verificationStatus: ClaimVerificationStatus.VERIFIED,
        claimStatus: ClaimStatus.APPROVED,
        decisionAt: new Date(),
      },
    });

    // Mark the business as claimed
    await prisma.business.update({
      where: { id: firstBusiness.id },
      data: { claimed: true },
    });

    logger.info('Business owner linked to Guildford Grill House');
  }

  logger.info('Database seeded successfully.');
}

main()
  .catch((e) => {
    logger.error(e, 'Seed failed');
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
