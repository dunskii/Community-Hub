/**
 * Shared types for the EditBusinessPage modules.
 */

import type { TFunction } from 'i18next';
import type { Business as SharedBusiness } from '@community-hub/shared';

// Extended Business type with additional fields that may come from API
export interface Business extends Omit<SharedBusiness, 'name' | 'description'> {
  name: string;
  description: Record<string, string>;
  detailedDescription?: Record<string, string>;
  socialLinks?: Record<string, string>;
}

export interface OperatingHoursEntry {
  open: string;
  close: string;
  closed: boolean;
  byAppointment: boolean;
}

export interface FormData {
  name: string;
  description: string;
  detailedDescription: string;
  phone: string;
  secondaryPhone: string;
  email: string;
  website: string;
  street: string;
  suburb: string;
  state: string;
  postcode: string;
  priceRange: string;
  yearEstablished: string;
  parkingInformation: string;
  languagesSpoken: string[];
  paymentMethods: string[];
  accessibilityFeatures: string[];
  operatingHours: Record<string, OperatingHoursEntry>;
  publicHolidays: OperatingHoursEntry;
  specialNotes: string;
  socialLinks: {
    facebook: string;
    instagram: string;
    twitter: string;
    linkedin: string;
    youtube: string;
  };
}

export type CheckboxField = 'languagesSpoken' | 'paymentMethods' | 'accessibilityFeatures';

export type TabId = 'basic' | 'contact' | 'hours' | 'details' | 'social' | 'promotions';

/** Common props passed to all tab components */
export interface TabProps {
  formData: FormData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  t: TFunction;
}
