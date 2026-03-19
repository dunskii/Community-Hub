/**
 * EditBusinessPage
 *
 * Business owner page for editing business profile details.
 * Spec §13.2: Business Owner Dashboard - Profile Management
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { PageContainer } from '../../components/layout/PageContainer';
import { Skeleton } from '../../components/display/Skeleton';
import { Alert } from '../../components/display/Alert';
import { useAuth } from '../../hooks/useAuth';
import { businessApi } from '../../services/business-api';
import {
  ArrowLeftIcon,
  BuildingStorefrontIcon,
  ClockIcon,
  PhoneIcon,
  GlobeAltIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import type { Business as SharedBusiness } from '@community-hub/shared';

// Extended Business type with additional fields that may come from API
interface Business extends Omit<SharedBusiness, 'name' | 'description'> {
  name: string;
  description: Record<string, string>;
  detailedDescription?: Record<string, string>;
  socialLinks?: Record<string, string>;
}

interface Category {
  id: string;
  name: Record<string, string>;
  slug: string;
}

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const PRICE_RANGES = ['BUDGET', 'MODERATE', 'PREMIUM', 'LUXURY'];

const PAYMENT_METHODS = [
  'CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'EFTPOS', 'PAYPAL',
  'AFTERPAY', 'APPLE_PAY', 'GOOGLE_PAY', 'BANK_TRANSFER'
];

const ACCESSIBILITY_FEATURES = [
  'WHEELCHAIR_ACCESSIBLE', 'ACCESSIBLE_PARKING', 'ACCESSIBLE_BATHROOM',
  'HEARING_LOOP', 'BRAILLE_SIGNAGE', 'SERVICE_ANIMALS_WELCOME'
];

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'ar', name: 'Arabic' },
  { code: 'zh-CN', name: 'Chinese (Simplified)' },
  { code: 'zh-TW', name: 'Chinese (Traditional)' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ur', name: 'Urdu' },
  { code: 'ko', name: 'Korean' },
  { code: 'el', name: 'Greek' },
  { code: 'it', name: 'Italian' },
];

export function EditBusinessPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [business, setBusiness] = useState<Business | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'contact' | 'hours' | 'details'>('basic');

  // Quick set hours state
  const [quickSetOpen, setQuickSetOpen] = useState('09:00');
  const [quickSetClose, setQuickSetClose] = useState('17:00');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    detailedDescription: '',
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
    languagesSpoken: [] as string[],
    paymentMethods: [] as string[],
    accessibilityFeatures: [] as string[],
    operatingHours: {} as Record<string, { open: string; close: string; closed: boolean }>,
    socialLinks: {
      facebook: '',
      instagram: '',
      twitter: '',
      linkedin: '',
      youtube: '',
    },
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/owner/business/${businessId}/edit` } });
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
          businessApi.listCategories({ type: 'BUSINESS' }),
        ]);

        setBusiness(biz as Business);
        setCategories(cats as Category[]);

        // Initialize form data - handle both string and object description formats
        const desc = typeof biz.description === 'string'
          ? biz.description
          : (biz.description?.en || '');
        const detailedDesc = typeof (biz as Business).detailedDescription === 'string'
          ? (biz as Business).detailedDescription
          : ((biz as Business).detailedDescription?.en || '');

        setFormData({
          name: biz.name || '',
          description: desc,
          detailedDescription: detailedDesc || '',
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
          paymentMethods: biz.paymentMethods || [],
          accessibilityFeatures: biz.accessibilityFeatures || [],
          operatingHours: DAYS_OF_WEEK.reduce((acc, day) => {
            const hours = biz.operatingHours?.[day];
            acc[day] = {
              open: hours?.open || '09:00',
              close: hours?.close || '17:00',
              closed: hours?.closed || false,
            };
            return acc;
          }, {} as Record<string, { open: string; close: string; closed: boolean }>),
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

  const handleCheckboxChange = (field: 'languagesSpoken' | 'paymentMethods' | 'accessibilityFeatures', value: string) => {
    setFormData(prev => {
      const current = prev[field];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [field]: updated };
    });
    setSuccess(false);
  };

  const handleHoursChange = (day: string, field: 'open' | 'close' | 'closed', value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: {
          ...prev.operatingHours[day],
          [field]: value,
        },
      },
    }));
    setSuccess(false);
  };

  // Apply same hours to all days (weekdays only or all days)
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
          acc[day] = { open: openTime, close: closeTime, closed: false };
        } else {
          acc[day] = prev.operatingHours[day] || { open: '09:00', close: '17:00', closed: false };
        }
        return acc;
      }, {} as Record<string, { open: string; close: string; closed: boolean }>),
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) return;

    try {
      setSaving(true);
      setError(null);

      const updateData = {
        name: formData.name,
        description: { en: formData.description },
        detailedDescription: formData.detailedDescription ? { en: formData.detailedDescription } : undefined,
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
        operatingHours: formData.operatingHours,
        socialLinks: Object.fromEntries(
          Object.entries(formData.socialLinks).filter(([_, v]) => v)
        ),
      };

      await businessApi.updateBusiness(businessId, updateData);
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update business');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton variant="text" width="200px" height="32px" />
          <Skeleton variant="rectangular" width="100%" height="400px" />
        </div>
      </PageContainer>
    );
  }

  if (error || !business) {
    return (
      <PageContainer>
        <div className="max-w-4xl mx-auto text-center py-12">
          <BuildingStorefrontIcon className="w-16 h-16 mx-auto text-slate-400 mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {error ? 'Error Loading Business' : 'Business Not Found'}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {error || "The business you're looking for doesn't exist or you don't have permission to edit it."}
          </p>
          <Link
            to="/owner/dashboard"
            className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Back to Dashboard
          </Link>
        </div>
      </PageContainer>
    );
  }

  const tabs = [
    { id: 'basic', label: t('editBusiness.tabs.basic', 'Basic Info'), icon: BuildingStorefrontIcon },
    { id: 'contact', label: t('editBusiness.tabs.contact', 'Contact & Location'), icon: PhoneIcon },
    { id: 'hours', label: t('editBusiness.tabs.hours', 'Operating Hours'), icon: ClockIcon },
    { id: 'details', label: t('editBusiness.tabs.details', 'Details & Features'), icon: GlobeAltIcon },
  ];

  return (
    <>
      <Helmet>
        <title>{t('editBusiness.title', 'Edit Business')} - {business.name} | Community Hub</title>
      </Helmet>

      <PageContainer>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              to="/owner/dashboard"
              className="inline-flex items-center text-sm text-slate-600 dark:text-slate-400 hover:text-primary mb-4"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-1" />
              {t('editBusiness.backToDashboard', 'Back to Dashboard')}
            </Link>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              {t('editBusiness.title', 'Edit Business')}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              {business.name}
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <Alert variant="success" className="mb-6">
              <CheckCircleIcon className="w-5 h-5 mr-2" />
              {t('editBusiness.success', 'Business profile updated successfully!')}
            </Alert>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="error" className="mb-6">
              {error}
            </Alert>
          )}

          {/* Tabs */}
          <div className="border-b border-slate-200 dark:border-slate-700 mb-6">
            <nav className="flex gap-4 overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                    {t('editBusiness.basicInfo', 'Basic Information')}
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        {t('editBusiness.fields.name', 'Business Name')} *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        maxLength={100}
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        {t('editBusiness.fields.description', 'Short Description')} *
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        required
                        rows={3}
                        maxLength={500}
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                      <p className="text-xs text-slate-500 mt-1">{formData.description.length}/500</p>
                    </div>

                    <div>
                      <label htmlFor="detailedDescription" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        {t('editBusiness.fields.detailedDescription', 'Detailed Description')}
                      </label>
                      <textarea
                        id="detailedDescription"
                        name="detailedDescription"
                        value={formData.detailedDescription}
                        onChange={handleInputChange}
                        rows={5}
                        maxLength={2000}
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                      <p className="text-xs text-slate-500 mt-1">{formData.detailedDescription.length}/2000</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="priceRange" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          {t('editBusiness.fields.priceRange', 'Price Range')}
                        </label>
                        <select
                          id="priceRange"
                          name="priceRange"
                          value={formData.priceRange}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                          <option value="">Select...</option>
                          {PRICE_RANGES.map(range => (
                            <option key={range} value={range}>
                              {t(`editBusiness.priceRange.${range.toLowerCase()}`, range)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="yearEstablished" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          {t('editBusiness.fields.yearEstablished', 'Year Established')}
                        </label>
                        <input
                          type="number"
                          id="yearEstablished"
                          name="yearEstablished"
                          value={formData.yearEstablished}
                          onChange={handleInputChange}
                          min={1800}
                          max={new Date().getFullYear()}
                          className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Contact & Location Tab */}
            {activeTab === 'contact' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                    {t('editBusiness.contactInfo', 'Contact Information')}
                  </h2>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          {t('editBusiness.fields.phone', 'Phone Number')} *
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label htmlFor="secondaryPhone" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          {t('editBusiness.fields.secondaryPhone', 'Secondary Phone')}
                        </label>
                        <input
                          type="tel"
                          id="secondaryPhone"
                          name="secondaryPhone"
                          value={formData.secondaryPhone}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          {t('editBusiness.fields.email', 'Email')}
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label htmlFor="website" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          {t('editBusiness.fields.website', 'Website')}
                        </label>
                        <input
                          type="url"
                          id="website"
                          name="website"
                          value={formData.website}
                          onChange={handleInputChange}
                          placeholder="https://"
                          className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                    {t('editBusiness.address', 'Address')}
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="street" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        {t('editBusiness.fields.street', 'Street Address')} *
                      </label>
                      <input
                        type="text"
                        id="street"
                        name="street"
                        value={formData.street}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="col-span-2">
                        <label htmlFor="suburb" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          {t('editBusiness.fields.suburb', 'Suburb')} *
                        </label>
                        <input
                          type="text"
                          id="suburb"
                          name="suburb"
                          value={formData.suburb}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label htmlFor="state" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          {t('editBusiness.fields.state', 'State')} *
                        </label>
                        <select
                          id="state"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                          <option value="">...</option>
                          <option value="NSW">NSW</option>
                          <option value="VIC">VIC</option>
                          <option value="QLD">QLD</option>
                          <option value="WA">WA</option>
                          <option value="SA">SA</option>
                          <option value="TAS">TAS</option>
                          <option value="ACT">ACT</option>
                          <option value="NT">NT</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="postcode" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          {t('editBusiness.fields.postcode', 'Postcode')} *
                        </label>
                        <input
                          type="text"
                          id="postcode"
                          name="postcode"
                          value={formData.postcode}
                          onChange={handleInputChange}
                          required
                          pattern="[0-9]{4}"
                          maxLength={4}
                          className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="parkingInformation" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        {t('editBusiness.fields.parkingInformation', 'Parking Information')}
                      </label>
                      <textarea
                        id="parkingInformation"
                        name="parkingInformation"
                        value={formData.parkingInformation}
                        onChange={handleInputChange}
                        rows={2}
                        maxLength={500}
                        placeholder="e.g., Free parking available behind the building"
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                    {t('editBusiness.socialMedia', 'Social Media')}
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.keys(formData.socialLinks).map(platform => (
                      <div key={platform}>
                        <label htmlFor={platform} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 capitalize">
                          {platform}
                        </label>
                        <input
                          type="url"
                          id={platform}
                          value={formData.socialLinks[platform as keyof typeof formData.socialLinks]}
                          onChange={(e) => handleSocialChange(platform, e.target.value)}
                          placeholder={`https://${platform}.com/...`}
                          className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Operating Hours Tab */}
            {activeTab === 'hours' && (
              <div className="space-y-6">
                {/* Quick Set Section */}
                <div className="bg-primary/5 dark:bg-primary/10 rounded-xl p-4 border border-primary/20">
                  <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-3">
                    {t('editBusiness.quickSetHours', 'Quick Set Hours')}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={quickSetOpen}
                        onChange={(e) => setQuickSetOpen(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                        aria-label={t('editBusiness.openTime', 'Opening time')}
                      />
                      <span className="text-slate-500 dark:text-slate-400 text-sm">to</span>
                      <input
                        type="time"
                        value={quickSetClose}
                        onChange={(e) => setQuickSetClose(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                        aria-label={t('editBusiness.closeTime', 'Closing time')}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => applyHoursToAll(quickSetOpen, quickSetClose, 'all')}
                        className="px-3 py-1.5 text-sm font-medium text-primary bg-white dark:bg-slate-800 border border-primary rounded-lg hover:bg-primary hover:text-white transition-colors"
                      >
                        {t('editBusiness.applyToAll', 'Apply to All')}
                      </button>
                      <button
                        type="button"
                        onClick={() => applyHoursToAll(quickSetOpen, quickSetClose, 'weekdays')}
                        className="px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:border-primary hover:text-primary transition-colors"
                      >
                        {t('editBusiness.applyToWeekdays', 'Weekdays Only')}
                      </button>
                      <button
                        type="button"
                        onClick={() => applyHoursToAll(quickSetOpen, quickSetClose, 'weekends')}
                        className="px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:border-primary hover:text-primary transition-colors"
                      >
                        {t('editBusiness.applyToWeekends', 'Weekends Only')}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Hours Grid */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                    {t('editBusiness.operatingHours', 'Operating Hours')}
                  </h2>

                  {/* Header Row - Desktop */}
                  <div className="hidden sm:grid sm:grid-cols-[120px_80px_1fr] gap-4 pb-2 mb-2 border-b border-slate-200 dark:border-slate-700">
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {t('editBusiness.day', 'Day')}
                    </div>
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {t('editBusiness.status', 'Status')}
                    </div>
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {t('editBusiness.hours', 'Hours')}
                    </div>
                  </div>

                  <div className="space-y-1">
                    {DAYS_OF_WEEK.map(day => {
                      const isClosed = formData.operatingHours[day]?.closed || false;
                      return (
                        <div
                          key={day}
                          className={`grid grid-cols-1 sm:grid-cols-[120px_80px_1fr] gap-2 sm:gap-4 py-3 px-2 rounded-lg transition-colors ${
                            isClosed ? 'bg-slate-50 dark:bg-slate-800/50' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          {/* Day Name */}
                          <div className="font-medium text-slate-900 dark:text-white capitalize flex items-center">
                            {t(`common.days.${day}`, day)}
                          </div>

                          {/* Closed Toggle */}
                          <div className="flex items-center">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isClosed}
                                onChange={(e) => handleHoursChange(day, 'closed', e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-red-500"></div>
                              <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">
                                {isClosed ? t('editBusiness.closed', 'Closed') : t('editBusiness.open', 'Open')}
                              </span>
                            </label>
                          </div>

                          {/* Time Inputs */}
                          <div className="flex items-center gap-2">
                            {isClosed ? (
                              <span className="text-sm text-slate-400 dark:text-slate-500 italic">
                                {t('editBusiness.closedAllDay', 'Closed all day')}
                              </span>
                            ) : (
                              <>
                                <input
                                  type="time"
                                  value={formData.operatingHours[day]?.open || '09:00'}
                                  onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                                  aria-label={t('editBusiness.openTimeFor', 'Opening time for {{day}}', { day })}
                                />
                                <span className="text-slate-400 dark:text-slate-500">—</span>
                                <input
                                  type="time"
                                  value={formData.operatingHours[day]?.close || '17:00'}
                                  onChange={(e) => handleHoursChange(day, 'close', e.target.value)}
                                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                                  aria-label={t('editBusiness.closeTimeFor', 'Closing time for {{day}}', { day })}
                                />
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Details & Features Tab */}
            {activeTab === 'details' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                    {t('editBusiness.languagesSpoken', 'Languages Spoken')}
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {LANGUAGES.map(lang => (
                      <label key={lang.code} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.languagesSpoken.includes(lang.code)}
                          onChange={() => handleCheckboxChange('languagesSpoken', lang.code)}
                          className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300">{lang.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                    {t('editBusiness.paymentMethods', 'Payment Methods')}
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {PAYMENT_METHODS.map(method => (
                      <label key={method} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.paymentMethods.includes(method)}
                          onChange={() => handleCheckboxChange('paymentMethods', method)}
                          className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          {method.replace(/_/g, ' ')}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                    {t('editBusiness.accessibilityFeatures', 'Accessibility Features')}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ACCESSIBILITY_FEATURES.map(feature => (
                      <label key={feature} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.accessibilityFeatures.includes(feature)}
                          onChange={() => handleCheckboxChange('accessibilityFeatures', feature)}
                          className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          {feature.replace(/_/g, ' ')}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 sm:flex-none inline-flex items-center justify-center px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? t('common.saving', 'Saving...') : t('common.saveChanges', 'Save Changes')}
              </button>
              <Link
                to="/owner/dashboard"
                className="flex-1 sm:flex-none inline-flex items-center justify-center px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                {t('common.cancel', 'Cancel')}
              </Link>
            </div>
          </form>
        </div>
      </PageContainer>
    </>
  );
}
