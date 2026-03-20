/**
 * DealForm Component
 * Phase 10: Promotions & Deals MVP
 * Create and edit deals with comprehensive form validation
 * WCAG 2.1 AA compliant with accessible form fields
 */

import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '../form/Input';
import { Textarea } from '../form/Textarea';
import { Select } from '../form/Select';
import { DatePicker } from '../form/DatePicker';
import { Alert } from '../display/Alert';
import type { Deal, DealCreateInput, DealUpdateInput, DiscountType } from '@community-hub/shared';
import { DEAL_LIMITS } from '@community-hub/shared';

// ─── Types ────────────────────────────────────────────────────

export interface DealFormData {
  title: string;
  description: string;
  price: string;
  originalPrice: string;
  discountType: DiscountType | '';
  discountValue: string;
  duration: string;
  voucherCode: string;
  image: string;
  terms: string;
  validFrom: string;
  validUntil: string;
  featured: boolean;
}

export interface DealFormProps {
  /** Existing deal data for editing */
  deal?: Deal;
  /** Callback when form is submitted */
  onSubmit: (data: DealCreateInput | DealUpdateInput) => Promise<void>;
  /** Callback when form is cancelled */
  onCancel?: () => void;
  /** Loading state */
  loading?: boolean;
  /** Custom class name */
  className?: string;
}

export interface FormErrors {
  [key: string]: string | undefined;
}

// ─── Constants ────────────────────────────────────────────────

const DISCOUNT_TYPES: { value: DiscountType | ''; labelKey: string }[] = [
  { value: '', labelKey: 'deal.discountType.none' },
  { value: 'PERCENTAGE', labelKey: 'deal.discountType.percentage' },
  { value: 'FIXED', labelKey: 'deal.discountType.fixed' },
  { value: 'BOGO', labelKey: 'deal.discountType.bogo' },
  { value: 'FREE_ITEM', labelKey: 'deal.discountType.freeItem' },
];

// ─── Helper Functions ─────────────────────────────────────────

function getInitialFormData(deal?: Deal): DealFormData {
  if (deal) {
    return {
      title: deal.title,
      description: deal.description,
      price: deal.price?.toString() || '',
      originalPrice: deal.originalPrice?.toString() || '',
      discountType: deal.discountType || '',
      discountValue: deal.discountValue?.toString() || '',
      duration: deal.duration || '',
      voucherCode: deal.voucherCode || '',
      image: deal.image || '',
      terms: deal.terms || '',
      validFrom: deal.validFrom.split('T')[0] || '',
      validUntil: deal.validUntil.split('T')[0] || '',
      featured: deal.featured,
    };
  }

  // Default values for new deal
  const today = new Date();
  const nextMonth = new Date(today);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  return {
    title: '',
    description: '',
    price: '',
    originalPrice: '',
    discountType: '',
    discountValue: '',
    duration: '',
    voucherCode: '',
    image: '',
    terms: '',
    validFrom: today.toISOString().split('T')[0] || '',
    validUntil: nextMonth.toISOString().split('T')[0] || '',
    featured: false,
  };
}

function validateForm(data: DealFormData, t: (key: string) => string): FormErrors {
  const errors: FormErrors = {};

  // Title validation
  if (!data.title.trim()) {
    errors.title = t('deal.validation.titleRequired');
  } else if (data.title.length > DEAL_LIMITS.maxTitleLength) {
    errors.title = t('deal.validation.titleTooLong');
  }

  // Description validation
  if (!data.description.trim()) {
    errors.description = t('deal.validation.descriptionRequired');
  } else if (data.description.length < DEAL_LIMITS.minDescriptionLength) {
    errors.description = t('deal.validation.descriptionTooShort');
  } else if (data.description.length > DEAL_LIMITS.maxDescriptionLength) {
    errors.description = t('deal.validation.descriptionTooLong');
  }

  // Price validation
  if (data.price && isNaN(Number(data.price))) {
    errors.price = t('deal.validation.invalidPrice');
  } else if (Number(data.price) < 0) {
    errors.price = t('deal.validation.priceNegative');
  }

  // Original price validation
  if (data.originalPrice && isNaN(Number(data.originalPrice))) {
    errors.originalPrice = t('deal.validation.invalidPrice');
  } else if (Number(data.originalPrice) < 0) {
    errors.originalPrice = t('deal.validation.priceNegative');
  }

  // Price comparison
  if (data.price && data.originalPrice) {
    if (Number(data.price) >= Number(data.originalPrice)) {
      errors.price = t('deal.validation.priceMustBeLower');
    }
  }

  // Discount value validation
  if (data.discountType === 'PERCENTAGE' && data.discountValue) {
    const value = Number(data.discountValue);
    if (value < 0 || value > 100) {
      errors.discountValue = t('deal.validation.percentageRange');
    }
  }

  // Date validation
  if (!data.validFrom) {
    errors.validFrom = t('deal.validation.startDateRequired');
  }
  if (!data.validUntil) {
    errors.validUntil = t('deal.validation.endDateRequired');
  }
  if (data.validFrom && data.validUntil) {
    const start = new Date(data.validFrom);
    const end = new Date(data.validUntil);
    if (start >= end) {
      errors.validUntil = t('deal.validation.endAfterStart');
    }
  }

  // Image URL validation
  if (data.image && !isValidUrl(data.image)) {
    errors.image = t('deal.validation.invalidUrl');
  }

  return errors;
}

function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}

// ─── Component ────────────────────────────────────────────────

export function DealForm({
  deal,
  onSubmit,
  onCancel,
  loading = false,
  className = '',
}: DealFormProps) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';
  const isEditing = !!deal;

  const [formData, setFormData] = useState<DealFormData>(() => getInitialFormData(deal));
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Memoize discount type options
  const discountTypeOptions = useMemo(
    () =>
      DISCOUNT_TYPES.map((dt) => ({
        value: dt.value,
        label: t(dt.labelKey),
      })),
    [t]
  );

  // Handle field change
  const handleChange = useCallback(
    (field: keyof DealFormData, value: string | boolean) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      // Clear field error on change
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [errors]
  );

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitError(null);

      // Validate form
      const validationErrors = validateForm(formData, t);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }

      // Build submission data
      const submitData: DealCreateInput | DealUpdateInput = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        validFrom: new Date(formData.validFrom).toISOString(),
        validUntil: new Date(formData.validUntil).toISOString(),
        ...(formData.price ? { price: Number(formData.price) } : {}),
        ...(formData.originalPrice ? { originalPrice: Number(formData.originalPrice) } : {}),
        ...(formData.discountType ? { discountType: formData.discountType as DiscountType } : {}),
        ...(formData.discountValue ? { discountValue: Number(formData.discountValue) } : {}),
        ...(formData.duration ? { duration: formData.duration.trim() } : {}),
        ...(formData.voucherCode ? { voucherCode: formData.voucherCode.trim() } : {}),
        ...(formData.image ? { image: formData.image.trim() } : {}),
        ...(formData.terms ? { terms: formData.terms.trim() } : {}),
        featured: formData.featured,
      };

      try {
        await onSubmit(submitData);
      } catch (error) {
        if (error instanceof Error) {
          setSubmitError(error.message);
        } else {
          setSubmitError(t('deal.error.submitFailed'));
        }
      }
    },
    [formData, onSubmit, t]
  );

  return (
    <form
      onSubmit={handleSubmit}
      className={`deal-form space-y-6 ${className}`}
      dir={isRtl ? 'rtl' : 'ltr'}
      noValidate
    >
      {/* Submit error */}
      {submitError && (
        <Alert type="critical" message={submitError} dismissible onClose={() => setSubmitError(null)} />
      )}

      {/* Basic Info Section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          {t('deal.form.basicInfo')}
        </h3>

        <div className="space-y-4">
          <Input
            id="title"
            label={t('deal.form.title')}
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            error={errors.title}
            maxLength={DEAL_LIMITS.maxTitleLength}
            required
            disabled={loading}
          />

          <Textarea
            id="description"
            label={t('deal.form.description')}
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            error={errors.description}
            maxLength={DEAL_LIMITS.maxDescriptionLength}
            rows={4}
            required
            disabled={loading}
            helperText={t('deal.form.descriptionHint', {
              min: DEAL_LIMITS.minDescriptionLength,
              max: DEAL_LIMITS.maxDescriptionLength,
            })}
          />

          <Input
            id="duration"
            label={t('deal.form.duration')}
            value={formData.duration}
            onChange={(e) => handleChange('duration', e.target.value)}
            placeholder={t('deal.form.durationPlaceholder')}
            maxLength={DEAL_LIMITS.maxDurationLength}
            disabled={loading}
          />
        </div>
      </div>

      {/* Pricing Section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          {t('deal.form.pricing')}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="price"
            label={t('deal.form.promoPrice')}
            type="number"
            value={formData.price}
            onChange={(e) => handleChange('price', e.target.value)}
            error={errors.price}
            min={0}
            step={0.01}
            disabled={loading}
          />

          <Input
            id="originalPrice"
            label={t('deal.form.originalPrice')}
            type="number"
            value={formData.originalPrice}
            onChange={(e) => handleChange('originalPrice', e.target.value)}
            error={errors.originalPrice}
            min={0}
            step={0.01}
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Select
            id="discountType"
            label={t('deal.form.discountType')}
            value={formData.discountType}
            onChange={(e) => handleChange('discountType', e.target.value)}
            options={discountTypeOptions}
            disabled={loading}
          />

          {(formData.discountType === 'PERCENTAGE' || formData.discountType === 'FIXED') && (
            <Input
              id="discountValue"
              label={t('deal.form.discountValue')}
              type="number"
              value={formData.discountValue}
              onChange={(e) => handleChange('discountValue', e.target.value)}
              error={errors.discountValue}
              min={0}
              max={formData.discountType === 'PERCENTAGE' ? 100 : undefined}
              disabled={loading}
            />
          )}
        </div>
      </div>

      {/* Validity Period Section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          {t('deal.form.validity')}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DatePicker
            id="validFrom"
            label={t('deal.form.validFrom')}
            value={formData.validFrom}
            onChange={(e) => handleChange('validFrom', e.target.value)}
            error={errors.validFrom}
            required
            disabled={loading}
          />

          <DatePicker
            id="validUntil"
            label={t('deal.form.validUntil')}
            value={formData.validUntil}
            onChange={(e) => handleChange('validUntil', e.target.value)}
            error={errors.validUntil}
            required
            disabled={loading}
            min={formData.validFrom}
          />
        </div>
      </div>

      {/* Additional Details Section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          {t('deal.form.additionalDetails')}
        </h3>

        <div className="space-y-4">
          <Input
            id="voucherCode"
            label={t('deal.form.voucherCode')}
            value={formData.voucherCode}
            onChange={(e) => handleChange('voucherCode', e.target.value)}
            maxLength={DEAL_LIMITS.maxVoucherCodeLength}
            disabled={loading}
            helperText={t('deal.form.voucherCodeHint')}
          />

          <Input
            id="image"
            label={t('deal.form.imageUrl')}
            type="url"
            value={formData.image}
            onChange={(e) => handleChange('image', e.target.value)}
            error={errors.image}
            disabled={loading}
            placeholder="https://..."
          />

          <Textarea
            id="terms"
            label={t('deal.form.terms')}
            value={formData.terms}
            onChange={(e) => handleChange('terms', e.target.value)}
            maxLength={DEAL_LIMITS.maxTermsLength}
            rows={3}
            disabled={loading}
            helperText={t('deal.form.termsHint')}
          />

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="featured"
              checked={formData.featured}
              onChange={(e) => handleChange('featured', e.target.checked)}
              disabled={loading}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label htmlFor="featured" className="text-sm text-gray-700 dark:text-gray-300">
              {t('deal.form.featured')}
            </label>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && (
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
          {isEditing ? t('deal.form.update') : t('deal.form.create')}
        </button>
      </div>
    </form>
  );
}
