/**
 * SEO Service for metadata generation
 * Spec §2.4 - SEO Configuration
 */

import type { Business } from '@community-hub/shared';
import { generateSlug, ensureUniqueSlug } from '../utils/slug.js';
import { prisma } from '../db/index.js';

export class SEOService {
  /**
   * Generates a unique slug for a business
   * @param name - Business name
   * @returns Unique slug
   */
  async generateBusinessSlug(name: string): Promise<string> {
    const baseSlug = generateSlug(name);

    // Check if slug already exists
    const existingBusiness = await prisma.businesses.findUnique({
      where: { slug: baseSlug },
    });

    if (!existingBusiness) {
      return baseSlug;
    }

    // Slug exists, find a unique one
    const existingSlugs = await prisma.businesses.findMany({
      where: {
        slug: {
          startsWith: baseSlug,
        },
      },
      select: { slug: true },
    });

    return ensureUniqueSlug(
      baseSlug,
      existingSlugs.map((b: { slug: string }) => b.slug)
    );
  }

  /**
   * Validates if a slug is available
   * @param slug - Slug to check
   * @param excludeBusinessId - Business ID to exclude from check (for updates)
   * @returns true if slug is available
   */
  async isSlugAvailable(slug: string, excludeBusinessId?: string): Promise<boolean> {
    const existing = await prisma.businesses.findUnique({
      where: { slug },
    });

    if (!existing) {
      return true;
    }

    // If updating the same business, slug is available
    return excludeBusinessId === existing.id;
  }

  /**
   * Generates Schema.org LocalBusiness structured data
   * @param business - Business entity
   * @param platformName - Platform name from config
   * @returns Schema.org JSON-LD object
   */
  generateSchemaOrg(business: Partial<Business>, _platformName: string): Record<string, unknown> {
    const address = business.address as Record<string, unknown> | undefined;
    const operatingHours = business.operatingHours as Record<string, unknown> | undefined;

    const schema: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: business.name,
      description:
        typeof business.description === 'object'
          ? (business.description as Record<string, string>)['en']
          : business.description,
      telephone: business.phone,
      url: business.website,
    };

    // Address
    if (address) {
      schema.address = {
        '@type': 'PostalAddress',
        streetAddress: address.street,
        addressLocality: address.suburb,
        addressRegion: address.state,
        postalCode: address.postcode,
        addressCountry: address.country,
      };
    }

    // Geo coordinates
    if (address?.latitude && address?.longitude) {
      schema.geo = {
        '@type': 'GeoCoordinates',
        latitude: address.latitude,
        longitude: address.longitude,
      };
    }

    // Price range
    if (business.priceRange) {
      const priceRangeMap: Record<string, string> = {
        BUDGET: '$',
        MODERATE: '$$',
        PREMIUM: '$$$',
        LUXURY: '$$$$',
      };
      schema.priceRange = priceRangeMap[business.priceRange] || '$$';
    }

    // Opening hours
    if (operatingHours) {
      const openingHoursSpec: string[] = [];
      const days = [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday',
      ];

      for (const day of days) {
        const dayHours = operatingHours[day] as
          | { open: string; close: string; closed: boolean }
          | undefined;
        if (dayHours && !dayHours.closed) {
          const dayAbbrev = day.substring(0, 2).toUpperCase();
          openingHoursSpec.push(`${dayAbbrev} ${dayHours.open}-${dayHours.close}`);
        }
      }

      if (openingHoursSpec.length > 0) {
        schema.openingHours = openingHoursSpec;
      }
    }

    // Image
    if (business.logo) {
      schema.image = business.logo;
    }

    return schema;
  }

  /**
   * Generates page title for SEO
   * @param businessName - Business name
   * @param platformName - Platform name from config
   * @returns SEO-optimized title
   */
  generateTitle(businessName: string, platformName: string): string {
    return `${businessName} | ${platformName}`;
  }

  /**
   * Generates meta description for SEO
   * @param description - Business description (multilingual object or string)
   * @param maxLength - Maximum description length (default 160)
   * @returns Truncated description
   */
  generateDescription(
    description: Record<string, string> | string | undefined,
    maxLength: number = 160
  ): string {
    if (!description) {
      return '';
    }

    const text = typeof description === 'object' ? description['en'] || '' : description;

    if (text.length <= maxLength) {
      return text;
    }

    // Truncate at word boundary
    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');

    if (lastSpace > 0) {
      return truncated.substring(0, lastSpace) + '...';
    }

    return truncated + '...';
  }

  /**
   * Generates keywords for SEO
   * @param businessName - Business name
   * @param categoryName - Category name
   * @param suburb - Suburb name
   * @returns Comma-separated keywords
   */
  generateKeywords(businessName: string, categoryName: string, suburb: string): string {
    return [businessName, categoryName, suburb, 'local business', 'community'].join(', ');
  }
}

export const seoService = new SEOService();
