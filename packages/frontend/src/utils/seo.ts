/**
 * SEO Utilities
 * Helper functions for generating SEO metadata
 */

import type { Business } from '@community-hub/shared';
import { getAppConfig } from '../config/app-config';

interface SchemaOrgLocalBusiness {
  '@context': string;
  '@type': string;
  name: string;
  description?: string;
  image?: string[];
  telephone?: string;
  email?: string;
  url?: string;
  address?: {
    '@type': string;
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  geo?: {
    '@type': string;
    latitude: number;
    longitude: number;
  };
  openingHoursSpecification?: Array<{
    '@type': string;
    dayOfWeek: string[];
    opens: string;
    closes: string;
  }>;
  priceRange?: string;
  aggregateRating?: {
    '@type': string;
    ratingValue: number;
    reviewCount: number;
  };
}

/**
 * Generate Schema.org LocalBusiness structured data for a business
 */
export function generateBusinessSchema(
  business: Business,
  language: string = 'en'
): SchemaOrgLocalBusiness {
  const name = typeof business.name === 'string'
    ? business.name
    : business.name[language] ?? business.name.en ?? '';

  const description = typeof business.description === 'string'
    ? business.description
    : business.description?.[language] ?? business.description?.en;

  const schema: SchemaOrgLocalBusiness = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name,
  };

  if (description) {
    schema.description = description;
  }

  if (business.photos && business.photos.length > 0) {
    schema.image = business.photos;
  }

  if (business.phone) {
    schema.telephone = business.phone;
  }

  if (business.email) {
    schema.email = business.email;
  }

  if (business.website) {
    schema.url = business.website;
  }

  if (business.address) {
    schema.address = {
      '@type': 'PostalAddress',
      streetAddress: business.address.streetAddress ?? business.address.street ?? '',
      addressLocality: business.address.suburb,
      addressRegion: business.address.state,
      postalCode: business.address.postcode,
      addressCountry: 'AU',
    };
  }

  if (business.location?.latitude != null && business.location?.longitude != null) {
    schema.geo = {
      '@type': 'GeoCoordinates',
      latitude: business.location.latitude,
      longitude: business.location.longitude,
    };
  }

  const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
  const anyByAppointment = business.operatingHours
    ? DAYS_OF_WEEK.some(d => business.operatingHours?.[d]?.byAppointment)
    : false;

  if (business.operatingHours && !anyByAppointment) {
    const specs: Array<{
      '@type': string;
      dayOfWeek: string[];
      opens: string;
      closes: string;
    }> = [];

    const daysMap: Record<string, string> = {
      monday: 'Monday',
      tuesday: 'Tuesday',
      wednesday: 'Wednesday',
      thursday: 'Thursday',
      friday: 'Friday',
      saturday: 'Saturday',
      sunday: 'Sunday',
    };

    // Group consecutive days with same hours
    const days = Object.keys(daysMap) as typeof DAYS_OF_WEEK[number][];
    let currentGroup: string[] = [];
    let currentHours: { open: string; close: string } | null = null;

    for (const day of days) {
      const dayHours = business.operatingHours[day];
      const openTime = dayHours?.open;
      const closeTime = dayHours?.close;

      if (openTime && closeTime) {
        const prev = currentHours as { open: string; close: string } | null;
        const prevOpen = prev?.open;
        const prevClose = prev?.close;
        if (prevOpen === openTime && prevClose === closeTime) {
          currentGroup.push(daysMap[day] ?? day);
        } else {
          if (currentGroup.length > 0 && currentHours) {
            specs.push({
              '@type': 'OpeningHoursSpecification',
              dayOfWeek: currentGroup,
              opens: currentHours.open,
              closes: currentHours.close,
            });
          }
          currentGroup = [daysMap[day] ?? day];
          currentHours = { open: openTime, close: closeTime };
        }
      } else {
        if (currentGroup.length > 0 && currentHours) {
          specs.push({
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: currentGroup,
            opens: currentHours.open,
            closes: currentHours.close,
          });
        }
        currentGroup = [];
        currentHours = null;
      }
    }

    // Add last group
    if (currentGroup.length > 0 && currentHours) {
      specs.push({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: currentGroup,
        opens: currentHours.open,
        closes: currentHours.close,
      });
    }

    if (specs.length > 0) {
      schema.openingHoursSpecification = specs;
    }
  }

  if (business.priceRange) {
    schema.priceRange = business.priceRange;
  }

  if (business.rating && business.reviewCount) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: business.rating,
      reviewCount: business.reviewCount,
    };
  }

  return schema;
}

/**
 * Generate page title for a business
 */
export function generateBusinessTitle(business: Business, language: string = 'en'): string {
  const name = typeof business.name === 'string'
    ? business.name
    : business.name[language] ?? business.name.en ?? '';

  const platformName = import.meta.env.VITE_PLATFORM_NAME || 'Community Hub';
  return `${name} | ${platformName}`;
}

/**
 * Generate meta description for a business
 */
export function generateBusinessDescription(
  business: Business,
  language: string = 'en',
  maxLength: number = 155
): string {
  const description = typeof business.description === 'string'
    ? business.description
    : business.description?.[language] ?? business.description?.en;

  if (!description) {
    const name = typeof business.name === 'string'
      ? business.name
      : business.name[language] ?? business.name.en ?? '';

    const category = business.categoryPrimary
      ? typeof business.categoryPrimary.name === 'string'
        ? business.categoryPrimary.name
        : business.categoryPrimary.name[language] ?? business.categoryPrimary.name.en ?? ''
      : '';

    const config = getAppConfig();
    return `${name}${category ? ` - ${category}` : ''} in ${business.address?.suburb || config.location.defaultSuburb}`;
  }

  if (description.length <= maxLength) {
    return description;
  }

  return description.substring(0, maxLength - 3) + '...';
}

/**
 * Generate Open Graph image URL for a business
 */
export function generateBusinessOgImage(business: Business): string | undefined {
  return business.photos?.[0];
}

/**
 * Generate canonical URL for a business
 */
export function generateBusinessCanonicalUrl(slug: string): string {
  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : import.meta.env.VITE_BASE_URL || 'https://example.com';

  return `${baseUrl}/businesses/${slug}`;
}
