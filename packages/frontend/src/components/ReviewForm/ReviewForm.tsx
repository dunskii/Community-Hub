/**
 * ReviewForm Component
 * Form for creating and editing business reviews
 * WCAG 2.1 AA compliant with validation and error handling
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StarRating } from '../StarRating';
import { Input } from '../Input';
import { Textarea } from '../Textarea';
import { FileUpload } from '../FileUpload';
import { Alert } from '../Alert';
import { getPlatformConfig } from '@community-hub/shared';
import './ReviewForm.css';

const config = getPlatformConfig();

export interface ReviewFormData {
  rating: number;
  title?: string;
  content: string;
  photos?: File[];
}

export interface ReviewFormProps {
  /**
   * Initial form data (for editing existing reviews)
   */
  initialData?: Partial<ReviewFormData>;
  /**
   * Callback when form is submitted
   */
  onSubmit: (data: ReviewFormData) => Promise<void>;
  /**
   * Callback when form is cancelled
   */
  onCancel: () => void;
  /**
   * Whether the form is in a loading state
   */
  isLoading?: boolean;
  /**
   * Error message to display
   */
  error?: string | null;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  error,
  className = '',
}) => {
  const { t } = useTranslation();

  const [rating, setRating] = useState<number>(initialData?.rating || 0);
  const [title, setTitle] = useState<string>(initialData?.title || '');
  const [content, setContent] = useState<string>(initialData?.content || '');
  const [photos, setPhotos] = useState<File[]>(initialData?.photos || []);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const minLength = config.limits.minReviewLength;
  const maxLength = config.limits.maxReviewLength;
  const maxPhotos = config.limits.maxReviewPhotos;

  useEffect(() => {
    if (initialData) {
      setRating(initialData.rating || 0);
      setTitle(initialData.title || '');
      setContent(initialData.content || '');
      setPhotos(initialData.photos || []);
    }
  }, [initialData]);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (rating === 0) {
      errors.rating = t('reviews.errors.ratingRequired');
    }

    if (content.trim().length < minLength) {
      errors.content = t('reviews.errors.contentTooShort', { min: minLength });
    }

    if (content.trim().length > maxLength) {
      errors.content = t('reviews.errors.contentTooLong', { max: maxLength });
    }

    if (photos.length > maxPhotos) {
      errors.photos = t('reviews.errors.tooManyPhotos', { max: maxPhotos });
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const formData: ReviewFormData = {
      rating,
      title: title.trim() || undefined,
      content: content.trim(),
      photos: photos.length > 0 ? photos : undefined,
    };

    await onSubmit(formData);
  };

  const handlePhotosChange = (files: File[]) => {
    setPhotos(files);
    if (files.length > maxPhotos) {
      setValidationErrors({
        ...validationErrors,
        photos: t('reviews.errors.tooManyPhotos', { max: maxPhotos }),
      });
    } else {
      const { photos: _, ...rest } = validationErrors;
      setValidationErrors(rest);
    }
  };

  const characterCount = content.length;
  const isValid = rating > 0 && characterCount >= minLength && characterCount <= maxLength;

  return (
    <form
      className={`review-form ${className}`}
      onSubmit={handleSubmit}
      noValidate
    >
      {error && (
        <Alert
          variant="error"
          message={error}
          className="review-form__error"
        />
      )}

      <div className="review-form__field">
        <label htmlFor="review-rating" className="review-form__label">
          {t('reviews.yourRating')} <span className="review-form__required">*</span>
        </label>
        <StarRating
          value={rating}
          onChange={setRating}
          size="large"
          label={t('reviews.yourRating')}
        />
        {validationErrors.rating && (
          <span className="review-form__error-text" role="alert">
            {validationErrors.rating}
          </span>
        )}
      </div>

      <div className="review-form__field">
        <Input
          id="review-title"
          label={t('reviews.title')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('reviews.titlePlaceholder')}
          maxLength={100}
          disabled={isLoading}
        />
      </div>

      <div className="review-form__field">
        <Textarea
          id="review-content"
          label={t('reviews.yourReview')}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t('reviews.contentPlaceholder')}
          minLength={minLength}
          maxLength={maxLength}
          rows={6}
          required
          disabled={isLoading}
          error={validationErrors.content}
          helpText={t('reviews.characterCount', {
            current: characterCount,
            min: minLength,
            max: maxLength,
          })}
        />
      </div>

      {config.features.reviewPhotos && (
        <div className="review-form__field">
          <FileUpload
            label={t('reviews.addPhotos')}
            accept="image/*"
            multiple
            maxFiles={maxPhotos}
            onChange={handlePhotosChange}
            disabled={isLoading}
            helpText={t('reviews.photosHelpText', { max: maxPhotos })}
            error={validationErrors.photos}
          />
        </div>
      )}

      <div className="review-form__actions">
        <button
          type="button"
          className="review-form__button review-form__button--secondary"
          onClick={onCancel}
          disabled={isLoading}
        >
          {t('common.cancel')}
        </button>
        <button
          type="submit"
          className="review-form__button review-form__button--primary"
          disabled={isLoading || !isValid}
          aria-busy={isLoading}
        >
          {isLoading ? t('common.submitting') : t('reviews.submitReview')}
        </button>
      </div>
    </form>
  );
};
