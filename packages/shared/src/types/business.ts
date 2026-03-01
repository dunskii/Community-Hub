/**
 * Business types for Community Hub
 * Spec A.1 - Business entity
 */

import type { BusinessStatus, PriceRange } from '../constants/business.constants.js';

export interface Address {
  street: string;
  suburb: string;
  state: string;
  postcode: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  linkedin?: string;
  youtube?: string;
  googleBusiness?: string;
}

export interface DayHours {
  open: string; // HH:MM format (e.g., "09:00")
  close: string; // HH:MM format (e.g., "17:00")
  closed: boolean;
  byAppointment: boolean;
}

export interface OperatingHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
  publicHolidays: DayHours;
  specialNotes?: string;
}

export interface GalleryPhoto {
  url: string;
  alt: string;
  category: 'interior' | 'exterior' | 'products' | 'menu' | 'team' | 'events';
  order: number;
}

export interface Business {
  id: string;
  name: string;
  slug: string;
  description: Record<string, string>; // Multilingual: {"en": "...", "ar": "..."}

  // Categories
  categoryPrimaryId: string;
  categoriesSecondary: string[];

  // Location
  address: Address;

  // Contact
  phone: string;
  email?: string;
  website?: string;
  secondaryPhone?: string;

  // Hours
  operatingHours?: OperatingHours;

  // Media
  logo?: string;
  coverPhoto?: string;
  gallery?: GalleryPhoto[];

  // Social
  socialLinks?: SocialLinks;

  // Business Info
  languagesSpoken: string[];
  certifications: string[];
  paymentMethods: string[];
  accessibilityFeatures: string[];

  // Optional Fields
  priceRange?: PriceRange;
  parkingInformation?: string;
  yearEstablished?: number;

  // Status & Ownership
  status: BusinessStatus;
  claimed: boolean;
  claimedBy?: string;
  verifiedAt?: Date;

  // Phase 5: Search & Discovery Fields
  timezone: string; // IANA timezone (e.g., "Australia/Sydney")
  featured: boolean; // For homepage featured carousel
  displayOrder: number; // Order in featured list (lower = first)

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface BusinessCreateInput {
  name: string;
  description: Record<string, string>;
  categoryPrimaryId: string;
  categoriesSecondary?: string[];
  address: Omit<Address, 'latitude' | 'longitude'>; // Coordinates added by geocoding
  phone: string;
  email?: string;
  website?: string;
  secondaryPhone?: string;
  operatingHours?: OperatingHours;
  languagesSpoken?: string[];
  certifications?: string[];
  paymentMethods?: string[];
  accessibilityFeatures?: string[];
  priceRange?: PriceRange;
  parkingInformation?: string;
  yearEstablished?: number;
  timezone?: string; // Optional, defaults to platform config timezone
  featured?: boolean; // Optional, defaults to false
  displayOrder?: number; // Optional, defaults to 0
}

export interface BusinessUpdateInput {
  name?: string;
  description?: Record<string, string>;
  categoryPrimaryId?: string;
  categoriesSecondary?: string[];
  address?: Omit<Address, 'latitude' | 'longitude'>;
  phone?: string;
  email?: string;
  website?: string;
  secondaryPhone?: string;
  operatingHours?: OperatingHours;
  languagesSpoken?: string[];
  certifications?: string[];
  paymentMethods?: string[];
  accessibilityFeatures?: string[];
  priceRange?: PriceRange;
  parkingInformation?: string;
  yearEstablished?: number;
  timezone?: string;
  featured?: boolean;
  displayOrder?: number;
}
