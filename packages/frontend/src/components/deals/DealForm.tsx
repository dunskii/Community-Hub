/**
 * DealForm Component
 * Phase 10: Promotions & Deals MVP
 * Create and edit deals with comprehensive form validation
 * WCAG 2.1 AA compliant with accessible form fields
 */

import { useState, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '../form/Input';
import { Textarea } from '../form/Textarea';
import { Select } from '../form/Select';
import { DatePicker } from '../form/DatePicker';
import { Alert } from '../display/Alert';
import { Skeleton } from '../display/Skeleton';
import type { Deal, DealCreateInput, DealUpdateInput, DiscountType } from '@community-hub/shared';
import { DEAL_LIMITS } from '@community-hub/shared';
import {
  PhotoIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

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

// ─── Pixabay Types ────────────────────────────────────────────

interface PixabayImage {
  id: number;
  webformatURL: string;
  largeImageURL: string;
  tags: string;
  user: string;
}

// ─── Deal Image Picker ────────────────────────────────────────

interface DealImagePickerProps {
  image: string;
  onChange: (url: string) => void;
  error?: string;
  disabled?: boolean;
}

function DealImagePicker({ image, onChange, error, disabled }: DealImagePickerProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [stockQuery, setStockQuery] = useState('');
  const [stockPhotos, setStockPhotos] = useState<PixabayImage[]>([]);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null);

  const PIXABAY_API_KEY = import.meta.env.VITE_PIXABAY_API_KEY || '';

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) return;
    const url = URL.createObjectURL(file as Blob);
    onChange(url);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const searchStock = async (query: string) => {
    if (!query.trim() || !PIXABAY_API_KEY) return;
    setStockLoading(true);
    setStockError(null);
    try {
      const response = await fetch(
        `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(query)}&image_type=photo&per_page=12&safesearch=true`
      );
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setStockPhotos(data.hits || []);
    } catch {
      setStockError(t('deal.form.stockSearchError', 'Failed to search stock photos'));
      setStockPhotos([]);
    } finally {
      setStockLoading(false);
    }
  };

  const handleStockSearch = (e?: React.SyntheticEvent) => {
    e?.preventDefault();
    searchStock(stockQuery);
  };

  const selectStockPhoto = (photo: PixabayImage) => {
    onChange(photo.largeImageURL);
    setStockModalOpen(false);
    setStockPhotos([]);
    setStockQuery('');
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
          <PhotoIcon className="w-5 h-5" />
          {t('deal.form.dealImage', 'Deal Image')}
        </h3>

        {/* Current Image Preview */}
        {image ? (
          <div className="mb-4">
            <div className="relative inline-block">
              <img
                src={image}
                alt={t('deal.form.imagePreview', 'Deal image preview')}
                className="w-full max-w-md h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
              />
              <button
                type="button"
                onClick={() => onChange('')}
                disabled={disabled}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors disabled:opacity-50"
                title={t('deal.form.removeImage', 'Remove image')}
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-4 w-full max-w-md h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
            <PhotoIcon className="w-12 h-12 mb-2" />
            <p className="text-sm">{t('deal.form.noImage', 'No image added')}</p>
          </div>
        )}

        {error && (
          <p className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        {/* Image Source Options */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors"
          >
            <ArrowUpTrayIcon className="w-4 h-4" />
            {t('deal.form.uploadImage', 'Upload')}
          </button>

          {PIXABAY_API_KEY && (
            <button
              type="button"
              onClick={() => setStockModalOpen(true)}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors"
            >
              <MagnifyingGlassIcon className="w-4 h-4" />
              {t('deal.form.stockPhotos', 'Stock Photos')}
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            disabled={disabled}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors"
          >
            {t('deal.form.pasteUrl', 'Paste URL')}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* URL Input (toggled) */}
        {showUrlInput && (
          <div className="mt-3">
            <Input
              id="image-url"
              label={t('deal.form.imageUrl', 'Image URL')}
              type="url"
              value={image}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
              placeholder="https://..."
            />
          </div>
        )}
      </div>

      {/* Stock Photo Modal */}
      {stockModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/50 transition-opacity"
              onClick={() => setStockModalOpen(false)}
            />
            <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {t('deal.form.searchStockPhotos', 'Search Stock Photos')}
                </h2>
                <button
                  type="button"
                  onClick={() => setStockModalOpen(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Search */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={stockQuery}
                      onChange={(e) => setStockQuery(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleStockSearch(e); } }}
                      placeholder={t('deal.form.searchPlaceholder', 'Search for images (e.g., food, sale, discount)')}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleStockSearch}
                    disabled={stockLoading || !stockQuery.trim()}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    {t('common.search', 'Search')}
                  </button>
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {t('deal.form.suggestions', 'Try:')}
                  </span>
                  {['sale', 'discount', 'food', 'deal', 'offer', 'promotion'].map(term => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => { setStockQuery(term); searchStock(term); }}
                      className="px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>

              {/* Results */}
              <div className="flex-1 overflow-y-auto p-4">
                {stockError && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                    {stockError}
                  </div>
                )}

                {stockLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <Skeleton key={i} variant="rectangular" width="100%" height="120px" className="rounded-lg" />
                    ))}
                  </div>
                ) : stockPhotos.length === 0 ? (
                  <div className="text-center py-12">
                    <PhotoIcon className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                    <p className="text-slate-600 dark:text-slate-400">
                      {stockQuery
                        ? t('deal.form.noResults', 'No photos found. Try a different search term.')
                        : t('deal.form.searchPrompt', 'Search for photos to get started')}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {stockPhotos.map(photo => (
                      <button
                        key={photo.id}
                        type="button"
                        onClick={() => selectStockPhoto(photo)}
                        className="relative aspect-[4/3] rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-all focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <img
                          src={photo.webformatURL}
                          alt={photo.tags}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                          <CheckCircleIcon className="w-8 h-8 text-white opacity-0 hover:opacity-100 drop-shadow-lg" />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                          <p className="text-xs text-white truncate">
                            {t('deal.form.by', 'by')} {photo.user}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <span>{t('deal.form.poweredBy', 'Powered by')}</span>
                  <a href="https://pixabay.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    Pixabay
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => setStockModalOpen(false)}
                  className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
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
    async () => {
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
    <div
      className={`deal-form space-y-6 ${className}`}
      dir={isRtl ? 'rtl' : 'ltr'}
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

      {/* Deal Image Section */}
      <DealImagePicker
        image={formData.image}
        onChange={(url) => handleChange('image', url)}
        error={errors.image}
        disabled={loading}
      />

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
          type="button"
          onClick={handleSubmit}
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
    </div>
  );
}
