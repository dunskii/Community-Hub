/**
 * Business constants for Community Hub
 */

// Business status enum
export enum BusinessStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
}

// Price range enum
export enum PriceRange {
  BUDGET = 'BUDGET',
  MODERATE = 'MODERATE',
  PREMIUM = 'PREMIUM',
  LUXURY = 'LUXURY',
}

// Certification options
export const CERTIFICATIONS = [
  'HALAL',
  'KOSHER',
  'VEGAN',
  'VEGETARIAN',
  'ORGANIC',
  'GLUTEN_FREE',
] as const;

export type Certification = (typeof CERTIFICATIONS)[number];

// Payment methods
export const PAYMENT_METHODS = [
  'CASH',
  'CARD',
  'EFTPOS',
  'PAYPAL',
  'AFTERPAY',
  'APPLE_PAY',
  'GOOGLE_PAY',
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

// Accessibility features
export const ACCESSIBILITY_FEATURES = [
  'WHEELCHAIR_ACCESS',
  'ACCESSIBLE_BATHROOM',
  'HEARING_LOOP',
  'RAMP',
  'ELEVATOR',
  'BRAILLE',
] as const;

export type AccessibilityFeature = (typeof ACCESSIBILITY_FEATURES)[number];

// Gallery photo categories
export const GALLERY_CATEGORIES = [
  'INTERIOR',
  'EXTERIOR',
  'PRODUCTS',
  'MENU',
  'TEAM',
  'EVENTS',
] as const;

export type GalleryCategory = (typeof GALLERY_CATEGORIES)[number];
