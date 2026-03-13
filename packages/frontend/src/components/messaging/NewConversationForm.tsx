/**
 * NewConversationForm Component
 * Phase 9: Messaging System
 * Form for starting a new conversation with a business
 * WCAG 2.1 AA compliant
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './NewConversationForm.css';

export interface BusinessInfo {
  id: string;
  name: string;
  logo?: string | null;
}

export interface NewConversationFormProps {
  /** Business to contact (optional - if not provided, shows business search) */
  business?: BusinessInfo;
  /** Default business ID to select (for when coming from URL param) */
  defaultBusinessId?: string;
  /** Whether form is submitting */
  isSubmitting?: boolean;
  /** Error message to display */
  error?: string;
  /** Available businesses to select from (if business not provided) */
  businesses?: BusinessInfo[];
  /** Callback to search for businesses */
  onSearchBusinesses?: (query: string) => Promise<BusinessInfo[]>;
  /** Callback when form is submitted */
  onSubmit: (data: {
    businessId: string;
    subject: string;
    subjectCategory: string;
    message: string;
    preferredContact?: string;
  }) => void;
  /** Callback when cancelled */
  onCancel?: () => void;
}

const SUBJECT_CATEGORIES = [
  'GENERAL',
  'PRODUCT_QUESTION',
  'BOOKING',
  'FEEDBACK',
  'OTHER',
] as const;

const PREFERRED_CONTACTS = ['email', 'phone', 'message'] as const;

const MIN_SUBJECT_LENGTH = 5;
const MAX_SUBJECT_LENGTH = 200;
const MIN_MESSAGE_LENGTH = 1;
const MAX_MESSAGE_LENGTH = 1000;

export const NewConversationForm: React.FC<NewConversationFormProps> = ({
  business,
  defaultBusinessId: _defaultBusinessId,
  isSubmitting = false,
  error,
  businesses = [],
  onSearchBusinesses,
  onSubmit,
  onCancel,
}) => {
  const { t } = useTranslation();
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessInfo | undefined>(business);
  const [businessSearch, setBusinessSearch] = useState('');
  const [searchResults, setSearchResults] = useState<BusinessInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [subject, setSubject] = useState('');
  const [subjectCategory, setSubjectCategory] = useState<string>('GENERAL');
  const [message, setMessage] = useState('');
  const [preferredContact, setPreferredContact] = useState<string | undefined>();
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Set business if provided as prop
  useEffect(() => {
    if (business) {
      setSelectedBusiness(business);
    }
  }, [business]);

  // Handle business search
  useEffect(() => {
    const searchTimer = setTimeout(async () => {
      if (businessSearch.length >= 2 && onSearchBusinesses) {
        setIsSearching(true);
        try {
          const results = await onSearchBusinesses(businessSearch);
          setSearchResults(results);
        } catch {
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else if (businessSearch.length < 2) {
        setSearchResults(businesses);
      }
    }, 300);

    return () => clearTimeout(searchTimer);
  }, [businessSearch, onSearchBusinesses, businesses]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedBusiness) {
      newErrors.business = t('messaging.validation.businessRequired');
    }

    if (subject.trim().length < MIN_SUBJECT_LENGTH) {
      newErrors.subject = t('messaging.validation.subjectTooShort', {
        min: MIN_SUBJECT_LENGTH,
      });
    } else if (subject.trim().length > MAX_SUBJECT_LENGTH) {
      newErrors.subject = t('messaging.validation.subjectTooLong', {
        max: MAX_SUBJECT_LENGTH,
      });
    }

    if (message.trim().length < MIN_MESSAGE_LENGTH) {
      newErrors.message = t('messaging.validation.messageRequired');
    } else if (message.trim().length > MAX_MESSAGE_LENGTH) {
      newErrors.message = t('messaging.validation.messageTooLong', {
        max: MAX_MESSAGE_LENGTH,
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate() || !selectedBusiness) return;

    onSubmit({
      businessId: selectedBusiness.id,
      subject: subject.trim(),
      subjectCategory,
      message: message.trim(),
      preferredContact,
    });
  };

  const handleSelectBusiness = (biz: BusinessInfo) => {
    setSelectedBusiness(biz);
    setBusinessSearch('');
    setSearchResults([]);
    setErrors((prev) => ({ ...prev, business: '' }));
  };

  const displayBusinesses = businessSearch.length >= 2 ? searchResults : businesses;

  return (
    <form
      className="new-conversation-form"
      onSubmit={handleSubmit}
      aria-label={t('messaging.newConversation')}
    >
      {/* Error banner */}
      {error && (
        <div className="new-conversation-form__error-banner" role="alert">
          {error}
        </div>
      )}

      {/* Business selection (if not pre-selected) */}
      {!business && (
        <div className="new-conversation-form__field">
          <label
            htmlFor="business-search"
            className="new-conversation-form__label"
          >
            {t('messaging.selectBusiness')}
            <span className="new-conversation-form__required" aria-hidden="true">*</span>
          </label>

          {selectedBusiness ? (
            <div className="new-conversation-form__selected-business">
              <span className="new-conversation-form__selected-name">
                {selectedBusiness.name}
              </span>
              <button
                type="button"
                className="new-conversation-form__change-btn"
                onClick={() => setSelectedBusiness(undefined)}
                aria-label={t('messaging.changeBusiness')}
              >
                {t('common.change')}
              </button>
            </div>
          ) : (
            <>
              <input
                id="business-search"
                type="text"
                className={`new-conversation-form__input ${
                  errors.business ? 'new-conversation-form__input--error' : ''
                }`}
                value={businessSearch}
                onChange={(e) => setBusinessSearch(e.target.value)}
                placeholder={t('messaging.searchBusiness')}
                disabled={isSubmitting}
                aria-invalid={!!errors.business}
                aria-describedby={errors.business ? 'business-error' : undefined}
              />
              {errors.business && (
                <span id="business-error" className="new-conversation-form__error" role="alert">
                  {errors.business}
                </span>
              )}

              {/* Business search results */}
              {(displayBusinesses.length > 0 || isSearching) && (
                <ul
                  className="new-conversation-form__business-list"
                  role="listbox"
                  aria-label={t('messaging.businessResults')}
                >
                  {isSearching ? (
                    <li className="new-conversation-form__business-loading">
                      {t('common.searching')}
                    </li>
                  ) : (
                    displayBusinesses.map((biz) => (
                      <li key={biz.id}>
                        <button
                          type="button"
                          className="new-conversation-form__business-item"
                          onClick={() => handleSelectBusiness(biz)}
                          role="option"
                          aria-selected={false}
                        >
                          {biz.logo && (
                            <img
                              src={biz.logo}
                              alt=""
                              className="new-conversation-form__business-logo"
                            />
                          )}
                          <span className="new-conversation-form__business-name">
                            {biz.name}
                          </span>
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </>
          )}
        </div>
      )}

      {/* Business info (if pre-selected) */}
      {business && (
        <div className="new-conversation-form__header">
          <h2 className="new-conversation-form__title">
            {t('messaging.contactBusiness', { name: business.name })}
          </h2>
          <p className="new-conversation-form__description">
            {t('messaging.contactDescription')}
          </p>
        </div>
      )}

      {/* Subject category */}
      <div className="new-conversation-form__field">
        <label
          htmlFor="subject-category"
          className="new-conversation-form__label"
        >
          {t('messaging.subjectCategory')}
        </label>
        <select
          id="subject-category"
          className="new-conversation-form__select"
          value={subjectCategory}
          onChange={(e) => setSubjectCategory(e.target.value)}
          disabled={isSubmitting}
        >
          {SUBJECT_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {t(`messaging.category.${category.toLowerCase()}`)}
            </option>
          ))}
        </select>
      </div>

      {/* Subject */}
      <div className="new-conversation-form__field">
        <label
          htmlFor="subject"
          className="new-conversation-form__label"
        >
          {t('messaging.subject')}
          <span className="new-conversation-form__required" aria-hidden="true">*</span>
        </label>
        <input
          id="subject"
          type="text"
          className={`new-conversation-form__input ${
            errors.subject ? 'new-conversation-form__input--error' : ''
          }`}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder={t('messaging.subjectPlaceholder')}
          disabled={isSubmitting}
          aria-invalid={!!errors.subject}
          aria-describedby={errors.subject ? 'subject-error' : undefined}
          maxLength={MAX_SUBJECT_LENGTH}
        />
        {errors.subject && (
          <span id="subject-error" className="new-conversation-form__error" role="alert">
            {errors.subject}
          </span>
        )}
        <span className="new-conversation-form__char-count">
          {subject.length}/{MAX_SUBJECT_LENGTH}
        </span>
      </div>

      {/* Message */}
      <div className="new-conversation-form__field">
        <label
          htmlFor="message"
          className="new-conversation-form__label"
        >
          {t('messaging.message')}
          <span className="new-conversation-form__required" aria-hidden="true">*</span>
        </label>
        <textarea
          id="message"
          className={`new-conversation-form__textarea ${
            errors.message ? 'new-conversation-form__textarea--error' : ''
          }`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t('messaging.messagePlaceholder')}
          disabled={isSubmitting}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? 'message-error' : undefined}
          rows={5}
          maxLength={MAX_MESSAGE_LENGTH}
        />
        {errors.message && (
          <span id="message-error" className="new-conversation-form__error" role="alert">
            {errors.message}
          </span>
        )}
        <span className="new-conversation-form__char-count">
          {message.length}/{MAX_MESSAGE_LENGTH}
        </span>
      </div>

      {/* Preferred contact (optional) */}
      <div className="new-conversation-form__field">
        <label
          htmlFor="preferred-contact"
          className="new-conversation-form__label"
        >
          {t('messaging.preferredContact')}
          <span className="new-conversation-form__optional">
            ({t('common.optional')})
          </span>
        </label>
        <select
          id="preferred-contact"
          className="new-conversation-form__select"
          value={preferredContact ?? ''}
          onChange={(e) => setPreferredContact(e.target.value || undefined)}
          disabled={isSubmitting}
        >
          <option value="">{t('messaging.noPreference')}</option>
          {PREFERRED_CONTACTS.map((contact) => (
            <option key={contact} value={contact}>
              {t(`messaging.contact.${contact}`)}
            </option>
          ))}
        </select>
      </div>

      {/* Actions */}
      <div className="new-conversation-form__actions">
        {onCancel && (
          <button
            type="button"
            className="new-conversation-form__btn new-conversation-form__btn--secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {t('common.cancel')}
          </button>
        )}
        <button
          type="submit"
          className="new-conversation-form__btn new-conversation-form__btn--primary"
          disabled={isSubmitting || (!selectedBusiness && !business)}
        >
          {isSubmitting ? t('common.sending') : t('messaging.sendMessage')}
        </button>
      </div>

      {/* Privacy notice */}
      <p className="new-conversation-form__privacy">
        {t('messaging.privacyNotice')}
      </p>
    </form>
  );
};

export default NewConversationForm;
