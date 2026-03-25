/**
 * Seed business and event categories.
 * Spec Appendix A.2: Category model.
 */

import type { PrismaClient } from '../../generated/prisma/client.js';
import { logger } from '../../utils/logger.js';
import { multilingualName } from './seed-helpers.js';

interface CategoryDef {
  slug: string;
  name: string;
  icon: string;
  parentSlug: string | null;
}

const BUSINESS_CATEGORIES: CategoryDef[] = [
  // Food & Beverage (parent)
  { slug: 'food-beverage', name: 'Food & Beverage', icon: 'utensils', parentSlug: null },
  { slug: 'restaurant', name: 'Restaurant', icon: 'utensils', parentSlug: 'food-beverage' },
  { slug: 'cafe', name: 'Cafe', icon: 'coffee', parentSlug: 'food-beverage' },
  { slug: 'bakery', name: 'Bakery', icon: 'bread-slice', parentSlug: 'food-beverage' },
  { slug: 'fast-food', name: 'Fast Food', icon: 'burger', parentSlug: 'food-beverage' },

  // Retail (parent)
  { slug: 'retail', name: 'Retail', icon: 'shopping-bag', parentSlug: null },
  { slug: 'clothing', name: 'Clothing', icon: 'shirt', parentSlug: 'retail' },
  { slug: 'electronics', name: 'Electronics', icon: 'laptop', parentSlug: 'retail' },
  { slug: 'grocery', name: 'Grocery', icon: 'shopping-cart', parentSlug: 'retail' },
  { slug: 'books', name: 'Books', icon: 'book', parentSlug: 'retail' },

  // Services (parent)
  { slug: 'services', name: 'Services', icon: 'wrench', parentSlug: null },
  { slug: 'haircut-salon', name: 'Haircut & Salon', icon: 'scissors', parentSlug: 'services' },
  { slug: 'auto-repair', name: 'Auto Repair', icon: 'car', parentSlug: 'services' },
  { slug: 'home-repair', name: 'Home Repair', icon: 'hammer', parentSlug: 'services' },

  // Health & Wellness (parent)
  { slug: 'health', name: 'Health & Wellness', icon: 'heart-pulse', parentSlug: null },
  { slug: 'medical', name: 'Medical', icon: 'stethoscope', parentSlug: 'health' },
  { slug: 'dental', name: 'Dental', icon: 'tooth', parentSlug: 'health' },
  { slug: 'pharmacy', name: 'Pharmacy', icon: 'pills', parentSlug: 'health' },
  { slug: 'fitness', name: 'Fitness', icon: 'dumbbell', parentSlug: 'health' },

  // Professional Services (parent)
  { slug: 'professional', name: 'Professional Services', icon: 'briefcase', parentSlug: null },
  { slug: 'legal', name: 'Legal', icon: 'gavel', parentSlug: 'professional' },
  { slug: 'accounting', name: 'Accounting', icon: 'calculator', parentSlug: 'professional' },
  { slug: 'real-estate', name: 'Real Estate', icon: 'home', parentSlug: 'professional' },

  // Education & Training (parent)
  { slug: 'education', name: 'Education & Training', icon: 'graduation-cap', parentSlug: null },
  { slug: 'tutoring', name: 'Tutoring', icon: 'book-open', parentSlug: 'education' },
  { slug: 'language-school', name: 'Language School', icon: 'globe', parentSlug: 'education' },

  // Entertainment (parent)
  { slug: 'entertainment', name: 'Entertainment', icon: 'music', parentSlug: null },
  { slug: 'cinema', name: 'Cinema', icon: 'film', parentSlug: 'entertainment' },
  { slug: 'arts-crafts', name: 'Arts & Crafts', icon: 'palette', parentSlug: 'entertainment' },
];

const EVENT_CATEGORIES = [
  { slug: 'music', name: 'Music', icon: 'music' },
  { slug: 'community', name: 'Community', icon: 'users' },
  { slug: 'sports', name: 'Sports', icon: 'trophy' },
  { slug: 'markets', name: 'Markets', icon: 'store' },
  { slug: 'workshop', name: 'Workshop', icon: 'hammer' },
];

/**
 * Seed categories and return a slug-to-id map for business categories.
 */
export async function seedCategories(prisma: PrismaClient): Promise<Map<string, string>> {
  const categoryMap = new Map<string, string>();

  // Create parents first, then children (array is ordered correctly)
  for (const [i, cat] of BUSINESS_CATEGORIES.entries()) {
    const category = await prisma.categories.upsert({
      where: { type_slug: { type: 'BUSINESS', slug: cat.slug } },
      update: {},
      create: {
        id: crypto.randomUUID(),
        slug: cat.slug,
        name: multilingualName(cat.name),
        icon: cat.icon,
        type: 'BUSINESS',
        display_order: i,
        parent_id: cat.parentSlug ? categoryMap.get(cat.parentSlug) : null,
        updated_at: new Date(),
      },
    });
    categoryMap.set(cat.slug, category.id);
  }

  for (const [i, cat] of EVENT_CATEGORIES.entries()) {
    await prisma.categories.upsert({
      where: { type_slug: { type: 'EVENT', slug: cat.slug } },
      update: {},
      create: {
        id: crypto.randomUUID(),
        slug: cat.slug,
        name: { en: cat.name },
        icon: cat.icon,
        type: 'EVENT',
        display_order: i,
        updated_at: new Date(),
      },
    });
  }

  logger.info('Categories seeded');
  return categoryMap;
}
