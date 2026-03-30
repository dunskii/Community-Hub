/**
 * useEditBusinessForm hook
 *
 * Manages all form state, data fetching, and handlers for the EditBusinessPage.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { businessApi } from '../../../services/business-api';
import type { Category } from '../../../services/business-api';
import { DAYS_OF_WEEK, PAYMENT_METHODS, ACCESSIBILITY_FEATURES } from './constants';
import type { Business, FormData, CheckboxField } from './types';
import type { BusinessUpdateInput, DayHours } from '@community-hub/shared';

const INITIAL_FORM_DATA: FormData = {
  name: '',
  description: '',
  detailedDescription: '',
  categoryPrimaryId: '',
  categoriesSecondary: [],
  phone: '',
  secondaryPhone: '',
  email: '',
  website: '',
  street: '',
  suburb: '',
  state: '',
  postcode: '',
  priceRange: '',
  yearEstablished: '',
  parkingInformation: '',
  languagesSpoken: [],
  paymentMethods: [],
  accessibilityFeatures: [],
  operatingHours: {},
  publicHolidays: { open: '09:00', close: '17:00', closed: true, byAppointment: false },
  specialNotes: '',
  socialLinks: {
    facebook: '',
    instagram: '',
    twitter: '',
    linkedin: '',
    youtube: '',
  },
};

export function useEditBusinessForm(businessId: string | undefined) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [business, setBusiness] = useState<Business | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [quickSetOpen, setQuickSetOpen] = useState('09:00');
  const [quickSetClose, setQuickSetClose] = useState('17:00');

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/business/manage/${businessId}/edit` } });
    }
  }, [isAuthenticated, navigate, businessId]);

  // Fetch business data
  useEffect(() => {
    async function fetchData() {
      if (!businessId) return;

      try {
        setLoading(true);
        const [biz, cats] = await Promise.all([
          businessApi.getBusinessById(businessId),
          businessApi.listCategories({ active: true }),
        ]);
        setCategories(cats);

        setBusiness(biz as Business);

        // Initialize form data - handle both string and object description formats
        const desc = typeof biz.description === 'string'
          ? biz.description
          : (biz.description?.en || '');
        const bizAny = biz as unknown as Record<string, unknown>;
        const detailedDescRaw = bizAny.detailedDescription;
        const detailedDesc = typeof detailedDescRaw === 'string'
          ? detailedDescRaw
          : (detailedDescRaw && typeof detailedDescRaw === 'object' ? (detailedDescRaw as Record<string, string>).en || '' : '');

        setFormData({
          name: typeof biz.name === 'string' ? biz.name : (biz.name as Record<string, string>).en ?? '',
          description: desc,
          detailedDescription: detailedDesc,
          categoryPrimaryId: biz.categoryPrimaryId || '',
          categoriesSecondary: biz.categoriesSecondary || [],
          phone: biz.phone || '',
          secondaryPhone: biz.secondaryPhone || '',
          email: biz.email || '',
          website: biz.website || '',
          street: biz.address?.street || '',
          suburb: biz.address?.suburb || '',
          state: biz.address?.state || '',
          postcode: biz.address?.postcode || '',
          priceRange: biz.priceRange || '',
          yearEstablished: biz.yearEstablished?.toString() || '',
          parkingInformation: biz.parkingInformation || '',
          languagesSpoken: biz.languagesSpoken || [],
          // Transform old payment method values to new schema values
          paymentMethods: (biz.paymentMethods || []).map(pm => {
            const mapping: Record<string, string> = {
              'CREDIT_CARD': 'CARD',
              'DEBIT_CARD': 'CARD',
              'BANK_TRANSFER': 'EFTPOS',
            };
            return mapping[pm] || pm;
          }).filter((pm, index, self) => PAYMENT_METHODS.includes(pm) && self.indexOf(pm) === index),
          // Transform old accessibility values to new schema values
          accessibilityFeatures: (biz.accessibilityFeatures || []).map(af => {
            const mapping: Record<string, string> = {
              'WHEELCHAIR_ACCESSIBLE': 'WHEELCHAIR_ACCESS',
              'ACCESSIBLE_PARKING': 'WHEELCHAIR_ACCESS',
              'BRAILLE_SIGNAGE': 'BRAILLE',
              'SERVICE_ANIMALS_WELCOME': 'WHEELCHAIR_ACCESS',
            };
            return mapping[af] || af;
          }).filter((af, index, self) => ACCESSIBILITY_FEATURES.includes(af) && self.indexOf(af) === index),
          operatingHours: DAYS_OF_WEEK.reduce((acc, day) => {
            const rawHours = biz.operatingHours?.[day as keyof typeof biz.operatingHours];
            const hours = typeof rawHours === 'object' && rawHours !== null ? rawHours as DayHours : undefined;
            acc[day] = {
              open: hours?.open || '09:00',
              close: hours?.close || '17:00',
              closed: hours?.closed || false,
              byAppointment: hours?.byAppointment || false,
            };
            return acc;
          }, {} as Record<string, { open: string; close: string; closed: boolean; byAppointment: boolean }>),
          publicHolidays: {
            open: biz.operatingHours?.publicHolidays?.open || '09:00',
            close: biz.operatingHours?.publicHolidays?.close || '17:00',
            closed: biz.operatingHours?.publicHolidays?.closed ?? true,
            byAppointment: biz.operatingHours?.publicHolidays?.byAppointment || false,
          },
          specialNotes: biz.operatingHours?.specialNotes || '',
          socialLinks: {
            facebook: (biz as Business).socialLinks?.facebook || '',
            instagram: (biz as Business).socialLinks?.instagram || '',
            twitter: (biz as Business).socialLinks?.twitter || '',
            linkedin: (biz as Business).socialLinks?.linkedin || '',
            youtube: (biz as Business).socialLinks?.youtube || '',
          },
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load business');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [businessId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setSuccess(false);
  };

  const handleCheckboxChange = (field: CheckboxField, value: string) => {
    setFormData(prev => {
      const current = prev[field];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [field]: updated };
    });
    setSuccess(false);
  };

  const handleSecondaryCategoryToggle = (categoryId: string) => {
    setFormData(prev => {
      const current = prev.categoriesSecondary;
      const updated = current.includes(categoryId)
        ? current.filter(id => id !== categoryId)
        : [...current, categoryId];
      return { ...prev, categoriesSecondary: updated };
    });
    setSuccess(false);
  };

  const handleHoursChange = (day: string, field: 'open' | 'close' | 'closed' | 'byAppointment', value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: {
          open: prev.operatingHours[day]?.open || '09:00',
          close: prev.operatingHours[day]?.close || '17:00',
          closed: prev.operatingHours[day]?.closed || false,
          byAppointment: prev.operatingHours[day]?.byAppointment || false,
          [field]: value,
        },
      },
    }));
    setSuccess(false);
  };

  const applyHoursToAll = (openTime: string, closeTime: string, daysToApply: 'all' | 'weekdays' | 'weekends') => {
    const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const weekends = ['saturday', 'sunday'];

    let targetDays: string[];
    if (daysToApply === 'weekdays') {
      targetDays = weekdays;
    } else if (daysToApply === 'weekends') {
      targetDays = weekends;
    } else {
      targetDays = DAYS_OF_WEEK;
    }

    setFormData(prev => ({
      ...prev,
      operatingHours: DAYS_OF_WEEK.reduce((acc, day) => {
        if (targetDays.includes(day)) {
          acc[day] = { open: openTime, close: closeTime, closed: false, byAppointment: false };
        } else {
          acc[day] = prev.operatingHours[day] || { open: '09:00', close: '17:00', closed: false, byAppointment: false };
        }
        return acc;
      }, {} as Record<string, { open: string; close: string; closed: boolean; byAppointment: boolean }>),
    }));
    setSuccess(false);
  };

  const handleSocialChange = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value,
      },
    }));
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent, activeTab: string) => {
    e.preventDefault();
    if (!businessId) return;
    // Don't submit business profile when on promotions tab
    if (activeTab === 'promotions') return;

    try {
      setSaving(true);
      setSaveError(null);

      // Build complete operatingHours structure with all required fields
      const operatingHours = {
        ...DAYS_OF_WEEK.reduce((acc, day) => {
          const hours = formData.operatingHours[day];
          acc[day] = {
            open: hours?.open || '09:00',
            close: hours?.close || '17:00',
            closed: hours?.closed || false,
            byAppointment: hours?.byAppointment || false,
          };
          return acc;
        }, {} as Record<string, { open: string; close: string; closed: boolean; byAppointment: boolean }>),
        publicHolidays: formData.publicHolidays,
        specialNotes: formData.specialNotes || undefined,
      };

      // Build update data matching businessUpdateSchema
      const updateData = {
        name: formData.name,
        description: { en: formData.description },
        categoryPrimaryId: formData.categoryPrimaryId || undefined,
        categoriesSecondary: formData.categoriesSecondary.length > 0 ? formData.categoriesSecondary : undefined,
        phone: formData.phone,
        secondaryPhone: formData.secondaryPhone || undefined,
        email: formData.email || undefined,
        website: formData.website || undefined,
        address: {
          street: formData.street,
          suburb: formData.suburb,
          state: formData.state,
          postcode: formData.postcode,
          country: 'Australia',
        },
        priceRange: formData.priceRange || undefined,
        yearEstablished: formData.yearEstablished ? parseInt(formData.yearEstablished) : undefined,
        parkingInformation: formData.parkingInformation || undefined,
        languagesSpoken: formData.languagesSpoken,
        paymentMethods: formData.paymentMethods,
        accessibilityFeatures: formData.accessibilityFeatures,
        operatingHours,
        socialLinks: (() => {
          const links = Object.fromEntries(
            Object.entries(formData.socialLinks).filter(([_, v]) => v)
          );
          return Object.keys(links).length > 0 ? links : undefined;
        })(),
      };

      // Debug: log update data in development
      if (import.meta.env.DEV) {
        console.log('[EditBusiness] Sending update data:', JSON.stringify(updateData, null, 2));
      }

      await businessApi.updateBusiness(businessId, updateData as unknown as BusinessUpdateInput);
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      let message = err instanceof Error ? err.message : 'Failed to update business';
      // If authentication failed, suggest re-logging in
      if (message.includes('Authentication') || message.includes('Unauthorized')) {
        setSaveError('Your session has expired. Please refresh the page and log in again.');
      } else {
        // Check for validation error details
        const httpErr = err as { details?: Array<{ field: string; message: string }> };
        if (httpErr.details && Array.isArray(httpErr.details)) {
          const validationErrors = httpErr.details.map(d => `${d.field}: ${d.message}`).join(', ');
          message = `${message} (${validationErrors})`;
        }
        setSaveError(message);
      }
    } finally {
      setSaving(false);
    }
  };

  /** Merge GBP sync field updates into the form state */
  const handleGbpFieldsApplied = useCallback((updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    setSuccess(false);
  }, []);

  return {
    business,
    categories,
    loading,
    saving,
    error,
    saveError,
    success,
    formData,
    quickSetOpen,
    quickSetClose,
    setQuickSetOpen,
    setQuickSetClose,
    handleInputChange,
    handleCheckboxChange,
    handleSecondaryCategoryToggle,
    handleHoursChange,
    applyHoursToAll,
    handleSocialChange,
    handleGbpFieldsApplied,
    handleSubmit,
  };
}
