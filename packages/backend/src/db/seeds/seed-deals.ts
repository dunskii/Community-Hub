/**
 * Seed sample deals/promotions.
 * Spec §17: Deals & Promotions.
 */

import { DealStatus, DiscountType } from '../../generated/prisma/client.js';
import type { PrismaClient } from '../../generated/prisma/client.js';
import { logger } from '../../utils/logger.js';
import { daysFromNow } from './seed-helpers.js';

interface DealDef {
  businessSlug: string;
  title: string;
  description: string;
  price?: number;
  original_price?: number;
  discount_type: DiscountType;
  discount_value?: number;
  duration?: string;
  voucher_code?: string;
  terms: string;
  valid_from: Date;
  valid_until: Date;
  featured: boolean;
  status: DealStatus;
}

function buildDeals(): DealDef[] {
  const now = new Date();
  const in7 = daysFromNow(7);
  const in30 = daysFromNow(30);
  const in60 = daysFromNow(60);

  return [
    // Guildford Grill House - 2 deals
    {
      businessSlug: 'guildford-grill-house',
      title: 'Weekday Lunch Special',
      description:
        'Enjoy 20% off all lunch mains Monday to Thursday. Includes complimentary Turkish bread and dips. Perfect for a quick business lunch or catching up with friends.',
      discount_type: DiscountType.PERCENTAGE,
      discount_value: 20,
      valid_from: now,
      valid_until: in30,
      featured: true,
      status: DealStatus.ACTIVE,
      terms: 'Valid Mon-Thu 11am-3pm only. Not valid with other offers.',
      voucher_code: 'LUNCH20',
    },
    {
      businessSlug: 'guildford-grill-house',
      title: 'Family Feast Bundle',
      description:
        'Feed the whole family with our special bundle: Mixed grill platter, 4 sides, garlic bread, and a large salad. Save $25 on regular price.',
      price: 79.99,
      original_price: 104.99,
      discount_type: DiscountType.FIXED,
      discount_value: 25,
      valid_from: now,
      valid_until: in60,
      featured: false,
      status: DealStatus.ACTIVE,
      terms: 'Dine-in only. Serves 4-5 people.',
    },
    // Daily Grind Cafe - 2 deals
    {
      businessSlug: 'daily-grind-cafe',
      title: 'Morning Coffee Deal',
      description:
        'Buy any large coffee and get a pastry of your choice absolutely free! Start your day right with our freshly roasted beans and homemade pastries.',
      discount_type: DiscountType.FREE_ITEM,
      valid_from: now,
      valid_until: in30,
      featured: true,
      status: DealStatus.ACTIVE,
      terms: 'Valid 6am-9am. One per customer per day.',
      voucher_code: 'FREEBIE',
    },
    {
      businessSlug: 'daily-grind-cafe',
      title: 'Loyalty Bonus',
      description:
        'Bring a friend who is new to our cafe and you both get 15% off your entire order. Share the love of great coffee!',
      discount_type: DiscountType.PERCENTAGE,
      discount_value: 15,
      valid_from: now,
      valid_until: in60,
      featured: false,
      status: DealStatus.ACTIVE,
      terms: 'New customer must not have visited before.',
    },
    // Golden Crust Bakery - 1 deal
    {
      businessSlug: 'golden-crust-bakery',
      title: 'Buy 6 Get 2 Free',
      description:
        'Stock up on our famous spinach pies or meat pastries! Buy any 6 and get 2 more free. Perfect for parties or weekly meal prep.',
      discount_type: DiscountType.BOGO,
      valid_from: now,
      valid_until: in30,
      featured: true,
      status: DealStatus.ACTIVE,
      terms: 'Must be same item type. While stocks last.',
    },
    // Fitness First - 2 deals
    {
      businessSlug: 'fitness-first-guildford',
      title: 'New Member Special',
      description:
        'Join now and get your first month at just $29.99! Full access to gym equipment, group classes, and personal training consultation included.',
      price: 29.99,
      original_price: 59.99,
      discount_type: DiscountType.PERCENTAGE,
      discount_value: 50,
      duration: '1 month membership',
      valid_from: now,
      valid_until: in7,
      featured: true,
      status: DealStatus.ACTIVE,
      terms: 'New members only. 12-month commitment required after trial.',
      voucher_code: 'FIT50',
    },
    {
      businessSlug: 'fitness-first-guildford',
      title: 'Personal Training Package',
      description:
        'Get 5 personal training sessions for the price of 4. Kickstart your fitness journey with expert guidance and customized workouts.',
      price: 200,
      original_price: 250,
      discount_type: DiscountType.FIXED,
      discount_value: 50,
      duration: '5 x 1-hour sessions',
      valid_from: now,
      valid_until: in60,
      featured: false,
      status: DealStatus.ACTIVE,
      terms: 'Sessions valid for 3 months from purchase.',
    },
    // Pharmacy - 1 deal
    {
      businessSlug: 'guildford-pharmacy-plus',
      title: 'Senior Discount Day',
      description:
        'Every Tuesday, seniors (65+) receive 10% off all non-prescription items. Stock up on vitamins, health products, and personal care items.',
      discount_type: DiscountType.PERCENTAGE,
      discount_value: 10,
      valid_from: now,
      valid_until: in60,
      featured: false,
      status: DealStatus.ACTIVE,
      terms: 'Valid Tuesdays only. ID required. Excludes prescriptions.',
    },
    // Hair Salon - 1 deal
    {
      businessSlug: 'styles-hair-salon',
      title: 'Colour & Cut Package',
      description:
        'Full colour treatment plus precision cut and blow-dry for just $99. Normally $140! Includes consultation and aftercare advice.',
      price: 99,
      original_price: 140,
      discount_type: DiscountType.FIXED,
      discount_value: 41,
      duration: 'Approximately 2.5 hours',
      valid_from: now,
      valid_until: in30,
      featured: true,
      status: DealStatus.ACTIVE,
      terms: 'Book in advance. Tuesday to Thursday only.',
      voucher_code: 'COLOUR99',
    },
    // Tech Hub - 1 deal
    {
      businessSlug: 'tech-hub-electronics',
      title: 'PC Health Check',
      description:
        'Comprehensive computer diagnostic, virus scan, and performance optimization. Get your PC running like new with our expert service.',
      price: 49,
      original_price: 79,
      discount_type: DiscountType.PERCENTAGE,
      discount_value: 38,
      duration: 'Same-day service',
      valid_from: now,
      valid_until: in30,
      featured: false,
      status: DealStatus.ACTIVE,
      terms: 'Drop-off service. Additional repairs quoted separately.',
      voucher_code: 'CHECKUP49',
    },
  ];
}

export async function seedDeals(prisma: PrismaClient): Promise<void> {
  const deals = buildDeals();

  // Pre-fetch all businesses we need
  const slugs = [...new Set(deals.map((d) => d.businessSlug))];
  const businesses = await prisma.businesses.findMany({
    where: { slug: { in: slugs } },
    select: { id: true, slug: true },
  });
  const slugToId = new Map(businesses.map((b) => [b.slug, b.id]));

  for (const deal of deals) {
    const businessId = slugToId.get(deal.businessSlug);
    if (!businessId) continue;

    const existingDeal = await prisma.deals.findFirst({
      where: { business_id: businessId, title: deal.title },
    });

    if (!existingDeal) {
      await prisma.deals.create({
        data: {
          business_id: businessId,
          title: deal.title,
          description: deal.description,
          price: deal.price,
          original_price: deal.original_price,
          discount_type: deal.discount_type,
          discount_value: deal.discount_value,
          duration: deal.duration,
          voucher_code: deal.voucher_code,
          terms: deal.terms,
          valid_from: deal.valid_from,
          valid_until: deal.valid_until,
          featured: deal.featured,
          status: deal.status,
        },
      });
    }
  }

  logger.info('Sample deals seeded');
}
