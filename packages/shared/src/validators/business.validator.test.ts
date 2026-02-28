/**
 * Unit tests for Business Validators
 */

import { describe, it, expect } from 'vitest';
import {
  addressSchema,
  operatingHoursSchema,
  socialLinksSchema,
  galleryPhotoSchema,
  businessCreateSchema,
  businessUpdateSchema,
  businessStatusUpdateSchema,
} from './business.validator.js';
import { BusinessStatus, PriceRange } from '../constants/business.constants.js';

describe('Business Validators', () => {
  describe('addressSchema', () => {
    const validAddress = {
      street: '123 Main Street',
      suburb: 'Guildford',
      state: 'NSW',
      postcode: '2161',
      country: 'Australia',
    };

    it('should validate a valid address', () => {
      const result = addressSchema.safeParse(validAddress);
      expect(result.success).toBe(true);
    });

    it('should use default values for state and country', () => {
      const address = {
        street: '123 Main Street',
        suburb: 'Guildford',
        postcode: '2161',
      };
      const result = addressSchema.parse(address);
      expect(result.state).toBe('NSW');
      expect(result.country).toBe('Australia');
    });

    it('should reject street address less than 5 characters', () => {
      const result = addressSchema.safeParse({
        ...validAddress,
        street: 'abc',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 5 characters');
      }
    });

    it('should reject street address over 255 characters', () => {
      const result = addressSchema.safeParse({
        ...validAddress,
        street: 'a'.repeat(256),
      });
      expect(result.success).toBe(false);
    });

    it('should reject suburb less than 2 characters', () => {
      const result = addressSchema.safeParse({
        ...validAddress,
        suburb: 'G',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 2 characters');
      }
    });

    it('should reject suburb over 100 characters', () => {
      const result = addressSchema.safeParse({
        ...validAddress,
        suburb: 'a'.repeat(101),
      });
      expect(result.success).toBe(false);
    });

    it('should reject postcode with non-digits', () => {
      const result = addressSchema.safeParse({
        ...validAddress,
        postcode: 'abcd',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('4 digits');
      }
    });

    it('should reject postcode not exactly 4 digits', () => {
      const result = addressSchema.safeParse({
        ...validAddress,
        postcode: '216',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid Australian postcode', () => {
      const result = addressSchema.safeParse({
        ...validAddress,
        postcode: '0000', // Invalid postcode
      });
      expect(result.success).toBe(false);
    });

    it('should accept optional latitude and longitude', () => {
      const result = addressSchema.parse({
        ...validAddress,
        latitude: -33.8688,
        longitude: 151.2093,
      });
      expect(result.latitude).toBe(-33.8688);
      expect(result.longitude).toBe(151.2093);
    });

    it('should reject latitude outside range', () => {
      const result = addressSchema.safeParse({
        ...validAddress,
        latitude: 100,
      });
      expect(result.success).toBe(false);
    });

    it('should reject longitude outside range', () => {
      const result = addressSchema.safeParse({
        ...validAddress,
        longitude: -200,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('operatingHoursSchema', () => {
    const validDayHours = {
      open: '09:00',
      close: '17:00',
      closed: false,
      byAppointment: false,
    };

    const validOperatingHours = {
      monday: validDayHours,
      tuesday: validDayHours,
      wednesday: validDayHours,
      thursday: validDayHours,
      friday: validDayHours,
      saturday: validDayHours,
      sunday: validDayHours,
      publicHolidays: { ...validDayHours, closed: true },
    };

    it('should validate valid operating hours', () => {
      const result = operatingHoursSchema.safeParse(validOperatingHours);
      expect(result.success).toBe(true);
    });

    it('should reject invalid time format (not HH:MM)', () => {
      const result = operatingHoursSchema.safeParse({
        ...validOperatingHours,
        monday: {
          ...validDayHours,
          open: '9:00', // Missing leading zero
        },
      });
      expect(result.success).toBe(false);
    });

    it('should reject time with hours > 23', () => {
      const result = operatingHoursSchema.safeParse({
        ...validOperatingHours,
        monday: {
          ...validDayHours,
          open: '25:00',
        },
      });
      expect(result.success).toBe(false);
    });

    it('should reject time with minutes > 59', () => {
      const result = operatingHoursSchema.safeParse({
        ...validOperatingHours,
        monday: {
          ...validDayHours,
          close: '17:60',
        },
      });
      expect(result.success).toBe(false);
    });

    it('should accept optional special notes', () => {
      const result = operatingHoursSchema.parse({
        ...validOperatingHours,
        specialNotes: 'Closed on public holidays',
      });
      expect(result.specialNotes).toBe('Closed on public holidays');
    });

    it('should reject special notes over 500 characters', () => {
      const result = operatingHoursSchema.safeParse({
        ...validOperatingHours,
        specialNotes: 'a'.repeat(501),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('socialLinksSchema', () => {
    it('should validate valid social links', () => {
      const socialLinks = {
        facebook: 'https://facebook.com/business',
        instagram: 'https://instagram.com/business',
        twitter: '@business',
        linkedin: 'https://linkedin.com/company/business',
      };
      const result = socialLinksSchema.safeParse(socialLinks);
      expect(result.success).toBe(true);
    });

    it('should transform URLs to lowercase', () => {
      const result = socialLinksSchema.parse({
        facebook: 'https://FACEBOOK.com/Business',
      });
      expect(result.facebook).toBe('https://facebook.com/business');
    });

    it('should accept Instagram handle with @', () => {
      const result = socialLinksSchema.parse({
        instagram: '@businesshandle',
      });
      expect(result.instagram).toBe('@businesshandle');
    });

    it('should accept Twitter handle with @', () => {
      const result = socialLinksSchema.parse({
        twitter: '@businesstweet',
      });
      expect(result.twitter).toBe('@businesstweet');
    });

    it('should reject invalid Facebook URL', () => {
      const result = socialLinksSchema.safeParse({
        facebook: 'not-a-url',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid Instagram handle', () => {
      const result = socialLinksSchema.safeParse({
        instagram: '@invalid handle with spaces',
      });
      expect(result.success).toBe(false);
    });

    it('should accept TikTok URL or handle', () => {
      const result1 = socialLinksSchema.parse({
        tiktok: 'https://tiktok.com/@business',
      });
      expect(result1.tiktok).toBe('https://tiktok.com/@business');

      const result2 = socialLinksSchema.parse({
        tiktok: '@business',
      });
      expect(result2.tiktok).toBe('@business');
    });

    it('should accept all fields as optional', () => {
      const result = socialLinksSchema.parse({});
      expect(result).toEqual({});
    });
  });

  describe('galleryPhotoSchema', () => {
    const validPhoto = {
      url: 'https://example.com/photo.jpg',
      alt: 'Business storefront',
      category: 'EXTERIOR',
      order: 0,
    };

    it('should validate valid gallery photo', () => {
      const result = galleryPhotoSchema.safeParse(validPhoto);
      expect(result.success).toBe(true);
    });

    it('should reject invalid URL', () => {
      const result = galleryPhotoSchema.safeParse({
        ...validPhoto,
        url: 'not-a-url',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty alt text', () => {
      const result = galleryPhotoSchema.safeParse({
        ...validPhoto,
        alt: '',
      });
      expect(result.success).toBe(false);
    });

    it('should reject alt text over 200 characters', () => {
      const result = galleryPhotoSchema.safeParse({
        ...validPhoto,
        alt: 'a'.repeat(201),
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid category', () => {
      const result = galleryPhotoSchema.safeParse({
        ...validPhoto,
        category: 'invalid-category',
      });
      expect(result.success).toBe(false);
    });

    it('should reject negative order', () => {
      const result = galleryPhotoSchema.safeParse({
        ...validPhoto,
        order: -1,
      });
      expect(result.success).toBe(false);
    });

    it('should reject non-integer order', () => {
      const result = galleryPhotoSchema.safeParse({
        ...validPhoto,
        order: 1.5,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('businessCreateSchema', () => {
    const validBusiness = {
      name: 'Test Business',
      description: { en: 'A wonderful test business with great service' },
      categoryPrimaryId: '550e8400-e29b-41d4-a716-446655440000',
      address: {
        street: '123 Main Street',
        suburb: 'Guildford',
        postcode: '2161',
      },
      phone: '+61412345678',
    };

    it('should validate valid business', () => {
      const result = businessCreateSchema.safeParse(validBusiness);
      expect(result.success).toBe(true);
    });

    it('should reject name less than 2 characters', () => {
      const result = businessCreateSchema.safeParse({
        ...validBusiness,
        name: 'A',
      });
      expect(result.success).toBe(false);
    });

    it('should reject name over 100 characters', () => {
      const result = businessCreateSchema.safeParse({
        ...validBusiness,
        name: 'a'.repeat(101),
      });
      expect(result.success).toBe(false);
    });

    it('should reject description less than 10 characters', () => {
      const result = businessCreateSchema.safeParse({
        ...validBusiness,
        description: { en: 'short' },
      });
      expect(result.success).toBe(false);
    });

    it('should reject description over 2000 characters', () => {
      const result = businessCreateSchema.safeParse({
        ...validBusiness,
        description: { en: 'a'.repeat(2001) },
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid category ID (not UUID)', () => {
      const result = businessCreateSchema.safeParse({
        ...validBusiness,
        categoryPrimaryId: 'not-a-uuid',
      });
      expect(result.success).toBe(false);
    });

    it('should reject more than 3 secondary categories', () => {
      const result = businessCreateSchema.safeParse({
        ...validBusiness,
        categoriesSecondary: [
          '550e8400-e29b-41d4-a716-446655440001',
          '550e8400-e29b-41d4-a716-446655440002',
          '550e8400-e29b-41d4-a716-446655440003',
          '550e8400-e29b-41d4-a716-446655440004',
        ],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Maximum 3');
      }
    });

    it('should reject invalid phone number', () => {
      const result = businessCreateSchema.safeParse({
        ...validBusiness,
        phone: '123',
      });
      expect(result.success).toBe(false);
    });

    it('should transform and lowercase email', () => {
      const result = businessCreateSchema.parse({
        ...validBusiness,
        email: 'Test@EXAMPLE.COM',
      });
      expect(result.email).toBe('test@example.com');
    });

    it('should reject invalid email', () => {
      const result = businessCreateSchema.safeParse({
        ...validBusiness,
        email: 'not-an-email',
      });
      expect(result.success).toBe(false);
    });

    it('should normalize website URL (add https://)', () => {
      const result = businessCreateSchema.parse({
        ...validBusiness,
        website: 'https://example.com',
      });
      expect(result.website).toBe('https://example.com');
    });

    it('should lowercase existing website URL', () => {
      const result = businessCreateSchema.parse({
        ...validBusiness,
        website: 'https://EXAMPLE.COM',
      });
      expect(result.website).toBe('https://example.com');
    });

    it('should reject invalid website URL', () => {
      const result = businessCreateSchema.safeParse({
        ...validBusiness,
        website: 'not a url',
      });
      expect(result.success).toBe(false);
    });

    it('should validate secondary phone', () => {
      const result = businessCreateSchema.parse({
        ...validBusiness,
        secondaryPhone: '+61298765432',
      });
      expect(result.secondaryPhone).toBe('+61298765432');
    });

    it('should reject invalid secondary phone', () => {
      const result = businessCreateSchema.safeParse({
        ...validBusiness,
        secondaryPhone: '123',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty secondary phone', () => {
      const result = businessCreateSchema.safeParse({
        ...validBusiness,
        secondaryPhone: '',
      });
      expect(result.success).toBe(false);
    });

    it('should default languagesSpoken to empty array', () => {
      const result = businessCreateSchema.parse(validBusiness);
      expect(result.languagesSpoken).toEqual([]);
    });

    it('should default certifications to empty array', () => {
      const result = businessCreateSchema.parse(validBusiness);
      expect(result.certifications).toEqual([]);
    });

    it('should default paymentMethods to empty array', () => {
      const result = businessCreateSchema.parse(validBusiness);
      expect(result.paymentMethods).toEqual([]);
    });

    it('should default accessibilityFeatures to empty array', () => {
      const result = businessCreateSchema.parse(validBusiness);
      expect(result.accessibilityFeatures).toEqual([]);
    });

    it('should accept valid price range', () => {
      const result = businessCreateSchema.parse({
        ...validBusiness,
        priceRange: PriceRange.MODERATE,
      });
      expect(result.priceRange).toBe(PriceRange.MODERATE);
    });

    it('should reject invalid price range', () => {
      const result = businessCreateSchema.safeParse({
        ...validBusiness,
        priceRange: 'INVALID',
      });
      expect(result.success).toBe(false);
    });

    it('should accept parking information up to 500 characters', () => {
      const parking = 'a'.repeat(500);
      const result = businessCreateSchema.parse({
        ...validBusiness,
        parkingInformation: parking,
      });
      expect(result.parkingInformation).toBe(parking);
    });

    it('should reject parking information over 500 characters', () => {
      const result = businessCreateSchema.safeParse({
        ...validBusiness,
        parkingInformation: 'a'.repeat(501),
      });
      expect(result.success).toBe(false);
    });

    it('should accept year established within valid range', () => {
      const result = businessCreateSchema.parse({
        ...validBusiness,
        yearEstablished: 1990,
      });
      expect(result.yearEstablished).toBe(1990);
    });

    it('should reject year established before 1800', () => {
      const result = businessCreateSchema.safeParse({
        ...validBusiness,
        yearEstablished: 1799,
      });
      expect(result.success).toBe(false);
    });

    it('should reject year established in the future', () => {
      const result = businessCreateSchema.safeParse({
        ...validBusiness,
        yearEstablished: new Date().getFullYear() + 1,
      });
      expect(result.success).toBe(false);
    });

    it('should accept year established as current year', () => {
      const result = businessCreateSchema.parse({
        ...validBusiness,
        yearEstablished: new Date().getFullYear(),
      });
      expect(result.yearEstablished).toBe(new Date().getFullYear());
    });

    it('should reject non-integer year established', () => {
      const result = businessCreateSchema.safeParse({
        ...validBusiness,
        yearEstablished: 1990.5,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('businessUpdateSchema', () => {
    it('should allow partial updates', () => {
      const result = businessUpdateSchema.parse({
        name: 'Updated Name',
      });
      expect(result.name).toBe('Updated Name');
    });

    it('should allow updating only description', () => {
      const result = businessUpdateSchema.parse({
        description: { en: 'Updated description with more details' },
      });
      expect(result.description).toEqual({ en: 'Updated description with more details' });
    });

    it('should allow updating only address', () => {
      const result = businessUpdateSchema.parse({
        address: {
          street: '456 New Street',
          suburb: 'Parramatta',
          postcode: '2150',
        },
      });
      expect(result.address?.street).toBe('456 New Street');
    });

    it('should validate fields when provided', () => {
      const result = businessUpdateSchema.safeParse({
        phone: 'invalid',
      });
      expect(result.success).toBe(false);
    });

    it('should allow empty update object', () => {
      const result = businessUpdateSchema.parse({});
      expect(result).toEqual({});
    });
  });

  describe('businessStatusUpdateSchema', () => {
    it('should accept valid business status', () => {
      const result = businessStatusUpdateSchema.parse({
        status: BusinessStatus.ACTIVE,
      });
      expect(result.status).toBe(BusinessStatus.ACTIVE);
    });

    it('should accept PENDING status', () => {
      const result = businessStatusUpdateSchema.parse({
        status: BusinessStatus.PENDING,
      });
      expect(result.status).toBe(BusinessStatus.PENDING);
    });

    it('should accept SUSPENDED status', () => {
      const result = businessStatusUpdateSchema.parse({
        status: BusinessStatus.SUSPENDED,
      });
      expect(result.status).toBe(BusinessStatus.SUSPENDED);
    });

    it('should accept DELETED status', () => {
      const result = businessStatusUpdateSchema.parse({
        status: BusinessStatus.DELETED,
      });
      expect(result.status).toBe(BusinessStatus.DELETED);
    });

    it('should reject invalid status', () => {
      const result = businessStatusUpdateSchema.safeParse({
        status: 'INVALID_STATUS',
      });
      expect(result.success).toBe(false);
    });

    it('should require status field', () => {
      const result = businessStatusUpdateSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});
