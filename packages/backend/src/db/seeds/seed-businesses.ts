/**
 * Seed sample businesses and link business owner claim.
 * Spec Appendix A.1: Business model, A.10: BusinessClaimRequest model.
 */

import {
  VerificationMethod,
  ClaimVerificationStatus,
  ClaimStatus,
} from '../../generated/prisma/client.js';
import type { Prisma, PrismaClient } from '../../generated/prisma/client.js';
import { logger } from '../../utils/logger.js';

interface SampleBusiness {
  name: string;
  slug: string;
  description: { en: string };
  categorySlug: string;
  address: {
    street: string;
    suburb: string;
    state: string;
    postcode: string;
    country: string;
    latitude: number;
    longitude: number;
  };
  phone: string;
  email?: string;
  website?: string;
  operatingHours: Record<string, { open?: string; close?: string; closed?: boolean }>;
  priceRange: 'BUDGET' | 'MODERATE' | 'PREMIUM' | 'LUXURY';
  languagesSpoken: string[];
  paymentMethods: string[];
  accessibilityFeatures?: string[];
  certifications?: string[];
  yearEstablished?: number;
}

const SAMPLE_BUSINESSES: SampleBusiness[] = [
  {
    name: 'Guildford Grill House',
    slug: 'guildford-grill-house',
    description: {
      en: 'Authentic Mediterranean cuisine with a modern twist. Family-owned restaurant serving fresh grilled meats, seafood, and vegetarian options. Daily lunch specials available.',
    },
    categorySlug: 'restaurant',
    address: {
      street: '123 Woodville Road',
      suburb: 'Guildford',
      state: 'NSW',
      postcode: '2161',
      country: 'Australia',
      latitude: -33.8522,
      longitude: 150.9878,
    },
    phone: '+61 2 9632 1234',
    email: 'info@guildfordgrill.com.au',
    website: 'https://guildfordgrill.com.au',
    operatingHours: {
      monday: { open: '11:00', close: '22:00', closed: false },
      tuesday: { open: '11:00', close: '22:00', closed: false },
      wednesday: { open: '11:00', close: '22:00', closed: false },
      thursday: { open: '11:00', close: '22:00', closed: false },
      friday: { open: '11:00', close: '23:00', closed: false },
      saturday: { open: '11:00', close: '23:00', closed: false },
      sunday: { open: '12:00', close: '21:00', closed: false },
    },
    priceRange: 'MODERATE',
    languagesSpoken: ['en', 'ar'],
    paymentMethods: ['CASH', 'CREDIT_CARD', 'DEBIT_CARD'],
    accessibilityFeatures: ['WHEELCHAIR_ACCESSIBLE', 'ACCESSIBLE_PARKING'],
  },
  {
    name: 'The Daily Grind Cafe',
    slug: 'daily-grind-cafe',
    description: {
      en: 'Artisan coffee roasted on-site. Specialty coffee, fresh pastries, and light meals. Free WiFi and outdoor seating available.',
    },
    categorySlug: 'cafe',
    address: {
      street: '45 Railway Terrace',
      suburb: 'Guildford',
      state: 'NSW',
      postcode: '2161',
      country: 'Australia',
      latitude: -33.8515,
      longitude: 150.989,
    },
    phone: '+61 2 9632 5678',
    email: 'hello@dailygrindcafe.com.au',
    website: 'https://dailygrindcafe.com.au',
    operatingHours: {
      monday: { open: '06:00', close: '15:00', closed: false },
      tuesday: { open: '06:00', close: '15:00', closed: false },
      wednesday: { open: '06:00', close: '15:00', closed: false },
      thursday: { open: '06:00', close: '15:00', closed: false },
      friday: { open: '06:00', close: '15:00', closed: false },
      saturday: { open: '07:00', close: '14:00', closed: false },
      sunday: { open: '08:00', close: '13:00', closed: false },
    },
    priceRange: 'BUDGET',
    languagesSpoken: ['en'],
    paymentMethods: ['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'MOBILE_PAYMENT'],
    accessibilityFeatures: ['WHEELCHAIR_ACCESSIBLE'],
  },
  {
    name: 'Golden Crust Bakery',
    slug: 'golden-crust-bakery',
    description: {
      en: "Traditional Lebanese bakery baking fresh bread daily. Specialty items include man'oush, spinach pies, and sweet pastries. Established 1995.",
    },
    categorySlug: 'bakery',
    address: {
      street: '78 Woodville Road',
      suburb: 'Guildford',
      state: 'NSW',
      postcode: '2161',
      country: 'Australia',
      latitude: -33.853,
      longitude: 150.9865,
    },
    phone: '+61 2 9632 9012',
    operatingHours: {
      monday: { open: '05:00', close: '18:00', closed: false },
      tuesday: { open: '05:00', close: '18:00', closed: false },
      wednesday: { open: '05:00', close: '18:00', closed: false },
      thursday: { open: '05:00', close: '18:00', closed: false },
      friday: { open: '05:00', close: '18:00', closed: false },
      saturday: { open: '05:00', close: '17:00', closed: false },
      sunday: { open: '06:00', close: '14:00', closed: false },
    },
    priceRange: 'BUDGET',
    languagesSpoken: ['en', 'ar'],
    paymentMethods: ['CASH', 'CREDIT_CARD'],
    yearEstablished: 1995,
  },
  {
    name: 'Guildford Medical Centre',
    slug: 'guildford-medical-centre',
    description: {
      en: 'Comprehensive family medical practice. Bulk billing available. Services include general consultations, vaccinations, health checks, and chronic disease management.',
    },
    categorySlug: 'medical',
    address: {
      street: '156 Guildford Road',
      suburb: 'Guildford',
      state: 'NSW',
      postcode: '2161',
      country: 'Australia',
      latitude: -33.851,
      longitude: 150.99,
    },
    phone: '+61 2 9632 3456',
    email: 'reception@guildfordmedical.com.au',
    website: 'https://guildfordmedical.com.au',
    operatingHours: {
      monday: { open: '08:00', close: '18:00', closed: false },
      tuesday: { open: '08:00', close: '18:00', closed: false },
      wednesday: { open: '08:00', close: '18:00', closed: false },
      thursday: { open: '08:00', close: '18:00', closed: false },
      friday: { open: '08:00', close: '18:00', closed: false },
      saturday: { open: '09:00', close: '13:00', closed: false },
      sunday: { closed: true },
    },
    priceRange: 'MODERATE',
    languagesSpoken: ['en', 'ar', 'zh-CN', 'vi', 'hi'],
    paymentMethods: ['CREDIT_CARD', 'DEBIT_CARD', 'MEDICARE'],
    accessibilityFeatures: ['WHEELCHAIR_ACCESSIBLE', 'ACCESSIBLE_PARKING', 'HEARING_LOOP'],
    certifications: ['MEDICARE_PROVIDER'],
  },
  {
    name: 'Tech Hub Electronics',
    slug: 'tech-hub-electronics',
    description: {
      en: 'Computer repairs, sales, and IT services. Specializing in laptop repairs, custom PC builds, and networking solutions. Same-day service available.',
    },
    categorySlug: 'electronics',
    address: {
      street: '234 Woodville Road',
      suburb: 'Guildford',
      state: 'NSW',
      postcode: '2161',
      country: 'Australia',
      latitude: -33.854,
      longitude: 150.985,
    },
    phone: '+61 2 9632 7890',
    email: 'support@techhubguildford.com.au',
    website: 'https://techhubguildford.com.au',
    operatingHours: {
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '18:00', closed: false },
      saturday: { open: '10:00', close: '16:00', closed: false },
      sunday: { closed: true },
    },
    priceRange: 'MODERATE',
    languagesSpoken: ['en'],
    paymentMethods: ['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER'],
    accessibilityFeatures: ['WHEELCHAIR_ACCESSIBLE'],
  },
  {
    name: 'Fitness First Guildford',
    slug: 'fitness-first-guildford',
    description: {
      en: '24/7 gym with state-of-the-art equipment. Group fitness classes, personal training, and nutritional guidance. Student and senior discounts available.',
    },
    categorySlug: 'fitness',
    address: {
      street: '89 Railway Terrace',
      suburb: 'Guildford',
      state: 'NSW',
      postcode: '2161',
      country: 'Australia',
      latitude: -33.8518,
      longitude: 150.9885,
    },
    phone: '+61 2 9632 4567',
    email: 'guildford@fitnessfirst.com.au',
    website: 'https://fitnessfirst.com.au/guildford',
    operatingHours: {
      monday: { open: '00:00', close: '23:59', closed: false },
      tuesday: { open: '00:00', close: '23:59', closed: false },
      wednesday: { open: '00:00', close: '23:59', closed: false },
      thursday: { open: '00:00', close: '23:59', closed: false },
      friday: { open: '00:00', close: '23:59', closed: false },
      saturday: { open: '00:00', close: '23:59', closed: false },
      sunday: { open: '00:00', close: '23:59', closed: false },
    },
    priceRange: 'MODERATE',
    languagesSpoken: ['en'],
    paymentMethods: ['CREDIT_CARD', 'DEBIT_CARD', 'DIRECT_DEBIT'],
    accessibilityFeatures: ['WHEELCHAIR_ACCESSIBLE', 'ACCESSIBLE_PARKING'],
  },
  {
    name: 'Guildford Pharmacy Plus',
    slug: 'guildford-pharmacy-plus',
    description: {
      en: 'Full-service pharmacy with prescription services, health advice, and vaccinations. Home delivery available for seniors and those with mobility issues.',
    },
    categorySlug: 'pharmacy',
    address: {
      street: '12 Guildford Road',
      suburb: 'Guildford',
      state: 'NSW',
      postcode: '2161',
      country: 'Australia',
      latitude: -33.8525,
      longitude: 150.9895,
    },
    phone: '+61 2 9632 6789',
    email: 'info@guildfordpharmacy.com.au',
    website: 'https://guildfordpharmacy.com.au',
    operatingHours: {
      monday: { open: '08:00', close: '20:00', closed: false },
      tuesday: { open: '08:00', close: '20:00', closed: false },
      wednesday: { open: '08:00', close: '20:00', closed: false },
      thursday: { open: '08:00', close: '20:00', closed: false },
      friday: { open: '08:00', close: '20:00', closed: false },
      saturday: { open: '09:00', close: '18:00', closed: false },
      sunday: { open: '10:00', close: '17:00', closed: false },
    },
    priceRange: 'MODERATE',
    languagesSpoken: ['en', 'ar', 'zh-CN'],
    paymentMethods: ['CASH', 'CREDIT_CARD', 'DEBIT_CARD'],
    accessibilityFeatures: ['WHEELCHAIR_ACCESSIBLE'],
    certifications: ['PBS_PROVIDER'],
  },
  {
    name: 'Styles Hair Salon',
    slug: 'styles-hair-salon',
    description: {
      en: "Professional hair styling, coloring, and treatments. Experienced stylists specializing in men's, women's, and children's cuts. Bridal packages available.",
    },
    categorySlug: 'haircut-salon',
    address: {
      street: '67 Woodville Road',
      suburb: 'Guildford',
      state: 'NSW',
      postcode: '2161',
      country: 'Australia',
      latitude: -33.8535,
      longitude: 150.987,
    },
    phone: '+61 2 9632 8901',
    operatingHours: {
      monday: { closed: true },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '20:00', closed: false },
      friday: { open: '09:00', close: '20:00', closed: false },
      saturday: { open: '08:00', close: '17:00', closed: false },
      sunday: { open: '10:00', close: '16:00', closed: false },
    },
    priceRange: 'MODERATE',
    languagesSpoken: ['en', 'it', 'el'],
    paymentMethods: ['CASH', 'CREDIT_CARD', 'DEBIT_CARD'],
  },
];

/**
 * Seed sample businesses and link the business owner to the first business.
 * Requires categories to have been seeded first (categoryMap).
 */
export async function seedBusinesses(
  prisma: PrismaClient,
  categoryMap: Map<string, string>,
): Promise<void> {
  // ── Create businesses ──────────────────────────────
  for (const business of SAMPLE_BUSINESSES) {
    const categoryId = categoryMap.get(business.categorySlug);
    if (!categoryId) {
      logger.warn(`Category not found: ${business.categorySlug}`);
      continue;
    }

    await prisma.businesses.upsert({
      where: { slug: business.slug },
      update: {},
      create: {
        id: crypto.randomUUID(),
        name: business.name,
        slug: business.slug,
        description: business.description,
        category_primary_id: categoryId,
        address: business.address as unknown as Prisma.InputJsonValue,
        phone: business.phone,
        email: business.email,
        website: business.website,
        operating_hours: business.operatingHours as unknown as Prisma.InputJsonValue,
        price_range: business.priceRange,
        languages_spoken: business.languagesSpoken || [],
        payment_methods: business.paymentMethods || [],
        accessibility_features: business.accessibilityFeatures || [],
        certifications: business.certifications || [],
        year_established: business.yearEstablished,
        status: 'ACTIVE',
        claimed: false,
        verified_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  logger.info('Sample businesses seeded');

  // ── Link Business Owner to a Business ──────────────
  const businessOwner = await prisma.users.findUnique({
    where: { email: 'owner@test.com' },
  });

  const firstBusiness = await prisma.businesses.findUnique({
    where: { slug: 'guildford-grill-house' },
  });

  if (businessOwner && firstBusiness) {
    await prisma.business_claim_requests.upsert({
      where: {
        business_id_user_id: {
          business_id: firstBusiness.id,
          user_id: businessOwner.id,
        },
      },
      update: {},
      create: {
        id: crypto.randomUUID(),
        business_id: firstBusiness.id,
        user_id: businessOwner.id,
        verification_method: VerificationMethod.EMAIL,
        verification_status: ClaimVerificationStatus.VERIFIED,
        claim_status: ClaimStatus.APPROVED,
        decision_at: new Date(),
        updated_at: new Date(),
      },
    });

    await prisma.businesses.update({
      where: { id: firstBusiness.id },
      data: {
        claimed: true,
        claimed_by: businessOwner.id,
      },
    });

    logger.info('Business owner linked to Guildford Grill House');
  }
}
