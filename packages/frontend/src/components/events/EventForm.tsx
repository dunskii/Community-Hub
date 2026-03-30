/**
 * EventForm Component
 * Phase 8: Events & Calendar System
 * Create and edit events with comprehensive form validation
 * WCAG 2.1 AA compliant with accessible form fields
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '../form/Input';
import { Textarea } from '../form/Textarea';
import { Select } from '../form/Select';
import { DatePicker } from '../form/DatePicker';
import { TimePicker } from '../form/TimePicker';
import { Checkbox } from '../form/Checkbox';
import { RadioButton } from '../form/RadioButton';
import { Alert } from '../display/Alert';
import { EventBannerPicker } from './EventBannerPicker';
import type { Event, EventCategory } from '../../services/event-service';
import type { LocationType, VenueInput, EventCreateInput, EventUpdateInput } from '@community-hub/shared';

// ─── Types ────────────────────────────────────────────────────

export interface EventFormData {
  title: string;
  description: string;
  categoryId: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  timezone: string;
  locationType: LocationType;
  venue: {
    name: string;
    street: string;
    suburb: string;
    state: string;
    postcode: string;
    country: string;
  };
  onlineUrl: string;
  imageUrl: string;
  ticketUrl: string;
  cost: string;
  capacity: string;
  ageRestriction: string;
  accessibility: string[];
}

export interface EventFormProps {
  /** Existing event data for editing */
  event?: Event;
  /** Available categories */
  categories: EventCategory[];
  /** Callback when form is submitted */
  onSubmit: (data: EventCreateInput | EventUpdateInput) => Promise<void>;
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

const LOCATION_TYPES: { value: LocationType; labelKey: string }[] = [
  { value: 'PHYSICAL', labelKey: 'events.locationType.physical' },
  { value: 'ONLINE', labelKey: 'events.locationType.online' },
  { value: 'HYBRID', labelKey: 'events.locationType.hybrid' },
];

const ACCESSIBILITY_OPTIONS = [
  { value: 'wheelchair', label: 'Wheelchair accessible' },
  { value: 'hearing-loop', label: 'Hearing loop available' },
  { value: 'sign-language', label: 'Sign language interpreter' },
  { value: 'accessible-parking', label: 'Accessible parking' },
  { value: 'guide-dogs', label: 'Guide dogs welcome' },
  { value: 'large-print', label: 'Large print materials' },
  { value: 'seated', label: 'Seated event' },
];

const AUSTRALIAN_STATES = [
  { value: 'NSW', label: 'New South Wales' },
  { value: 'VIC', label: 'Victoria' },
  { value: 'QLD', label: 'Queensland' },
  { value: 'WA', label: 'Western Australia' },
  { value: 'SA', label: 'South Australia' },
  { value: 'TAS', label: 'Tasmania' },
  { value: 'ACT', label: 'Australian Capital Territory' },
  { value: 'NT', label: 'Northern Territory' },
];

const TIMEZONES = [
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
  { value: 'Australia/Melbourne', label: 'Melbourne (AEST/AEDT)' },
  { value: 'Australia/Brisbane', label: 'Brisbane (AEST)' },
  { value: 'Australia/Perth', label: 'Perth (AWST)' },
  { value: 'Australia/Adelaide', label: 'Adelaide (ACST/ACDT)' },
  { value: 'Australia/Darwin', label: 'Darwin (ACST)' },
  { value: 'Australia/Hobart', label: 'Hobart (AEST/AEDT)' },
];

// ─── Helper Functions ─────────────────────────────────────────

function getInitialFormData(event?: Event): EventFormData {
  if (event) {
    const startDateTime = new Date(event.startTime);
    const endDateTime = new Date(event.endTime);

    return {
      title: event.title,
      description: event.description,
      categoryId: event.categoryId,
      startDate: startDateTime.toISOString().split('T')[0] || '',
      startTime: startDateTime.toTimeString().slice(0, 5) || '',
      endDate: endDateTime.toISOString().split('T')[0] || '',
      endTime: endDateTime.toTimeString().slice(0, 5) || '',
      timezone: event.timezone,
      locationType: event.locationType,
      venue: event.venue ? {
        name: event.venue.name || '',
        street: event.venue.street,
        suburb: event.venue.suburb,
        state: event.venue.state,
        postcode: event.venue.postcode,
        country: event.venue.country,
      } : {
        name: '',
        street: '',
        suburb: '',
        state: 'NSW',
        postcode: '',
        country: 'Australia',
      },
      onlineUrl: event.onlineUrl || '',
      imageUrl: event.imageUrl || '',
      ticketUrl: event.ticketUrl || '',
      cost: event.cost || '',
      capacity: event.capacity?.toString() || '',
      ageRestriction: event.ageRestriction || '',
      accessibility: event.accessibility || [],
    };
  }

  // Default values for new event
  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
  const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  return {
    title: '',
    description: '',
    categoryId: '',
    startDate: oneHourLater.toISOString().split('T')[0] ?? '',
    startTime: oneHourLater.toTimeString().slice(0, 5) ?? '',
    endDate: twoHoursLater.toISOString().split('T')[0] ?? '',
    endTime: twoHoursLater.toTimeString().slice(0, 5) ?? '',
    timezone: 'Australia/Sydney',
    locationType: 'PHYSICAL',
    venue: {
      name: '',
      street: '',
      suburb: '',
      state: 'NSW',
      postcode: '',
      country: 'Australia',
    },
    onlineUrl: '',
    imageUrl: '',
    ticketUrl: '',
    cost: '',
    capacity: '',
    ageRestriction: '',
    accessibility: [],
  };
}

function combineDateAndTime(date: string, time: string): string {
  // Create a date string in the format expected by the API
  const dateTime = new Date(`${date}T${time}:00`);
  return dateTime.toISOString();
}

// ─── Main Component ───────────────────────────────────────────

export function EventForm({
  event,
  categories,
  onSubmit,
  onCancel,
  loading = false,
  className = '',
}: EventFormProps) {
  const { t } = useTranslation();
  const isEditing = !!event;

  // Form state
  const [formData, setFormData] = useState<EventFormData>(() => getInitialFormData(event));
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Update form if event changes (e.g., when editing)
  useEffect(() => {
    if (event) {
      setFormData(getInitialFormData(event));
    }
  }, [event]);

  // Category options
  const categoryOptions = useMemo(() => {
    return categories.map((cat) => ({
      value: cat.id,
      label: cat.name.en || Object.values(cat.name)[0] || cat.slug,
    }));
  }, [categories]);

  // Field change handler
  const handleChange = useCallback(
    (field: keyof EventFormData) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData((prev) => ({ ...prev, [field]: e.target.value }));
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      },
    []
  );

  // Venue field change handler
  const handleVenueChange = useCallback(
    (field: keyof EventFormData['venue']) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData((prev) => ({
          ...prev,
          venue: { ...prev.venue, [field]: e.target.value },
        }));
        setErrors((prev) => ({ ...prev, [`venue.${field}`]: undefined }));
      },
    []
  );

  // Location type change handler
  const handleLocationTypeChange = useCallback((type: LocationType) => {
    setFormData((prev) => ({ ...prev, locationType: type }));
    setErrors((prev) => ({ ...prev, locationType: undefined, onlineUrl: undefined, venue: undefined }));
  }, []);

  // Accessibility checkbox handler
  const handleAccessibilityChange = useCallback((feature: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      accessibility: checked
        ? [...prev.accessibility, feature]
        : prev.accessibility.filter((f) => f !== feature),
    }));
  }, []);

  // Field blur handler for validation
  const handleBlur = useCallback((field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  // Validate form
  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = t('events.form.errors.titleRequired');
    } else if (formData.title.length > 100) {
      newErrors.title = t('events.form.errors.titleTooLong');
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = t('events.form.errors.descriptionRequired');
    } else if (formData.description.length < 50) {
      newErrors.description = t('events.form.errors.descriptionTooShort');
    } else if (formData.description.length > 5000) {
      newErrors.description = t('events.form.errors.descriptionTooLong');
    }

    // Category validation
    if (!formData.categoryId) {
      newErrors.categoryId = t('events.form.errors.categoryRequired');
    }

    // Date/time validation
    const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
    const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
    const now = new Date();

    if (!isEditing && startDateTime <= now) {
      newErrors.startDate = t('events.form.errors.startTimeInPast');
    }

    if (endDateTime <= startDateTime) {
      newErrors.endDate = t('events.form.errors.endBeforeStart');
    }

    // Location validation
    if (formData.locationType === 'PHYSICAL' || formData.locationType === 'HYBRID') {
      if (!formData.venue.street.trim()) {
        newErrors['venue.street'] = t('events.form.errors.streetRequired');
      }
      if (!formData.venue.suburb.trim()) {
        newErrors['venue.suburb'] = t('events.form.errors.suburbRequired');
      }
      if (!formData.venue.state) {
        newErrors['venue.state'] = t('events.form.errors.stateRequired');
      }
      if (!formData.venue.postcode.trim() || formData.venue.postcode.length < 4) {
        newErrors['venue.postcode'] = t('events.form.errors.postcodeRequired');
      }
    }

    if (formData.locationType === 'ONLINE' || formData.locationType === 'HYBRID') {
      if (!formData.onlineUrl.trim()) {
        newErrors.onlineUrl = t('events.form.errors.onlineUrlRequired');
      } else {
        try {
          new URL(formData.onlineUrl);
        } catch {
          newErrors.onlineUrl = t('events.form.errors.invalidUrl');
        }
      }
    }

    // Capacity validation (if provided)
    if (formData.capacity) {
      const capacity = parseInt(formData.capacity, 10);
      if (isNaN(capacity) || capacity < 1) {
        newErrors.capacity = t('events.form.errors.invalidCapacity');
      }
    }

    // URL validations
    if (formData.ticketUrl) {
      try {
        new URL(formData.ticketUrl);
      } catch {
        newErrors.ticketUrl = t('events.form.errors.invalidUrl');
      }
    }

    if (formData.imageUrl && !formData.imageUrl.startsWith('/uploads/')) {
      try {
        new URL(formData.imageUrl);
      } catch {
        newErrors.imageUrl = t('events.form.errors.invalidUrl');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, isEditing, t]);

  // Form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitError(null);

      if (!validate()) {
        // Scroll to top so user can see validation errors, then focus first error field
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
          const form = e.target as HTMLFormElement;
          const firstInvalid = form.querySelector('[aria-invalid="true"]') as HTMLElement;
          firstInvalid?.focus();
        }, 300);
        return;
      }

      try {
        // Build submit data
        const startTime = combineDateAndTime(formData.startDate, formData.startTime);
        const endTime = combineDateAndTime(formData.endDate, formData.endTime);

        const venue: VenueInput | undefined =
          formData.locationType === 'PHYSICAL' || formData.locationType === 'HYBRID'
            ? {
                name: formData.venue.name || undefined,
                street: formData.venue.street,
                suburb: formData.venue.suburb,
                state: formData.venue.state,
                postcode: formData.venue.postcode,
                country: formData.venue.country,
              }
            : undefined;

        const submitData: EventCreateInput | EventUpdateInput = {
          title: formData.title.trim(),
          description: formData.description.trim(),
          categoryId: formData.categoryId,
          startTime,
          endTime,
          timezone: formData.timezone,
          locationType: formData.locationType,
          venue,
          onlineUrl:
            formData.locationType === 'ONLINE' || formData.locationType === 'HYBRID'
              ? formData.onlineUrl
              : undefined,
          imageUrl: formData.imageUrl || undefined,
          ticketUrl: formData.ticketUrl || undefined,
          cost: formData.cost || undefined,
          capacity: formData.capacity ? parseInt(formData.capacity, 10) : undefined,
          ageRestriction: formData.ageRestriction || undefined,
          accessibility: formData.accessibility.length > 0 ? formData.accessibility : undefined,
        };

        await onSubmit(submitData);
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : t('events.form.errors.submitFailed'));
      }
    },
    [formData, validate, errors, onSubmit, t]
  );

  // Show venue fields based on location type
  const showVenueFields = formData.locationType === 'PHYSICAL' || formData.locationType === 'HYBRID';
  const showOnlineFields = formData.locationType === 'ONLINE' || formData.locationType === 'HYBRID';

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`} noValidate>
      {submitError && (
        <Alert type="critical" message={submitError} dismissible onClose={() => setSubmitError(null)} />
      )}

      {/* Basic Info Section */}
      <section aria-labelledby="basic-info-heading">
        <h2 id="basic-info-heading" className="text-lg font-semibold text-gray-900 mb-4">
          {t('events.form.sections.basicInfo')}
        </h2>

        <div className="space-y-4">
          <Input
            name="title"
            label={t('events.form.fields.title')}
            value={formData.title}
            onChange={handleChange('title')}
            onBlur={() => handleBlur('title')}
            error={touched.title ? errors.title : undefined}
            maxLength={100}
            required
            fullWidth
            placeholder={t('events.form.placeholders.title')}
          />

          <Textarea
            name="description"
            label={t('events.form.fields.description')}
            value={formData.description}
            onChange={handleChange('description')}
            onBlur={() => handleBlur('description')}
            error={touched.description ? errors.description : undefined}
            maxLength={5000}
            rows={5}
            showCounter
            required
            fullWidth
            helperText={t('events.form.helpers.description', { min: 50, max: 5000 })}
          />

          <Select
            name="categoryId"
            label={t('events.form.fields.category')}
            value={formData.categoryId}
            onChange={handleChange('categoryId')}
            onBlur={() => handleBlur('categoryId')}
            error={touched.categoryId ? errors.categoryId : undefined}
            options={categoryOptions}
            placeholder={t('events.form.placeholders.category')}
            required
            fullWidth
          />
        </div>
      </section>

      {/* Date & Time Section */}
      <section aria-labelledby="datetime-heading">
        <h2 id="datetime-heading" className="text-lg font-semibold text-gray-900 mb-4">
          {t('events.form.sections.dateTime')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DatePicker
            name="startDate"
            label={t('events.form.fields.startDate')}
            value={formData.startDate}
            onChange={handleChange('startDate')}
            onBlur={() => handleBlur('startDate')}
            error={touched.startDate ? errors.startDate : undefined}
            min={new Date().toISOString().split('T')[0]}
            required
            fullWidth
          />

          <TimePicker
            name="startTime"
            label={t('events.form.fields.startTime')}
            value={formData.startTime}
            onChange={handleChange('startTime')}
            onBlur={() => handleBlur('startTime')}
            error={touched.startTime ? errors.startTime : undefined}
            required
            fullWidth
          />

          <DatePicker
            name="endDate"
            label={t('events.form.fields.endDate')}
            value={formData.endDate}
            onChange={handleChange('endDate')}
            onBlur={() => handleBlur('endDate')}
            error={touched.endDate ? errors.endDate : undefined}
            min={formData.startDate}
            required
            fullWidth
          />

          <TimePicker
            name="endTime"
            label={t('events.form.fields.endTime')}
            value={formData.endTime}
            onChange={handleChange('endTime')}
            onBlur={() => handleBlur('endTime')}
            error={touched.endTime ? errors.endTime : undefined}
            required
            fullWidth
          />
        </div>

        <div className="mt-4">
          <Select
            name="timezone"
            label={t('events.form.fields.timezone')}
            value={formData.timezone}
            onChange={handleChange('timezone')}
            options={TIMEZONES}
            fullWidth
          />
        </div>
      </section>

      {/* Location Section */}
      <section aria-labelledby="location-heading">
        <h2 id="location-heading" className="text-lg font-semibold text-gray-900 mb-4">
          {t('events.form.sections.location')}
        </h2>

        <fieldset className="mb-4">
          <legend className="text-sm font-medium text-gray-700 mb-2">
            {t('events.form.fields.locationType')}
          </legend>
          <div className="flex flex-wrap gap-4">
            {LOCATION_TYPES.map(({ value, labelKey }) => (
              <RadioButton
                key={value}
                name="locationType"
                value={value}
                checked={formData.locationType === value}
                onChange={() => handleLocationTypeChange(value)}
                label={t(labelKey)}
              />
            ))}
          </div>
        </fieldset>

        {/* Venue fields */}
        {showVenueFields && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700">{t('events.form.sections.venue')}</h3>

            <Input
              name="venue.name"
              label={t('events.form.fields.venueName')}
              value={formData.venue.name}
              onChange={handleVenueChange('name')}
              placeholder={t('events.form.placeholders.venueName')}
              fullWidth
            />

            <Input
              name="venue.street"
              label={t('events.form.fields.street')}
              value={formData.venue.street}
              onChange={handleVenueChange('street')}
              onBlur={() => handleBlur('venue.street')}
              error={touched['venue.street'] ? errors['venue.street'] : undefined}
              required
              fullWidth
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                name="venue.suburb"
                label={t('events.form.fields.suburb')}
                value={formData.venue.suburb}
                onChange={handleVenueChange('suburb')}
                onBlur={() => handleBlur('venue.suburb')}
                error={touched['venue.suburb'] ? errors['venue.suburb'] : undefined}
                required
                fullWidth
              />

              <Select
                name="venue.state"
                label={t('events.form.fields.state')}
                value={formData.venue.state}
                onChange={handleVenueChange('state')}
                onBlur={() => handleBlur('venue.state')}
                error={touched['venue.state'] ? errors['venue.state'] : undefined}
                options={AUSTRALIAN_STATES}
                required
                fullWidth
              />

              <Input
                name="venue.postcode"
                label={t('events.form.fields.postcode')}
                value={formData.venue.postcode}
                onChange={handleVenueChange('postcode')}
                onBlur={() => handleBlur('venue.postcode')}
                error={touched['venue.postcode'] ? errors['venue.postcode'] : undefined}
                required
                fullWidth
                maxLength={4}
                pattern="[0-9]*"
                inputMode="numeric"
              />
            </div>
          </div>
        )}

        {/* Online URL field */}
        {showOnlineFields && (
          <div className="mt-4">
            <Input
              name="onlineUrl"
              label={t('events.form.fields.onlineUrl')}
              value={formData.onlineUrl}
              onChange={handleChange('onlineUrl')}
              onBlur={() => handleBlur('onlineUrl')}
              error={touched.onlineUrl ? errors.onlineUrl : undefined}
              type="url"
              placeholder="https://zoom.us/j/..."
              required
              fullWidth
            />
          </div>
        )}
      </section>

      {/* Additional Details Section */}
      <section aria-labelledby="details-heading">
        <h2 id="details-heading" className="text-lg font-semibold text-gray-900 mb-4">
          {t('events.form.sections.additionalDetails')}
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              name="capacity"
              label={t('events.form.fields.capacity')}
              value={formData.capacity}
              onChange={handleChange('capacity')}
              onBlur={() => handleBlur('capacity')}
              error={touched.capacity ? errors.capacity : undefined}
              type="number"
              min={1}
              placeholder={t('events.form.placeholders.capacity')}
              fullWidth
            />

            <Input
              name="cost"
              label={t('events.form.fields.cost')}
              value={formData.cost}
              onChange={handleChange('cost')}
              placeholder={t('events.form.placeholders.cost')}
              fullWidth
              helperText={t('events.form.helpers.cost')}
            />
          </div>

          <Input
            name="ageRestriction"
            label={t('events.form.fields.ageRestriction')}
            value={formData.ageRestriction}
            onChange={handleChange('ageRestriction')}
            placeholder={t('events.form.placeholders.ageRestriction')}
            maxLength={20}
            fullWidth
          />

          <Input
            name="ticketUrl"
            label={t('events.form.fields.ticketUrl')}
            value={formData.ticketUrl}
            onChange={handleChange('ticketUrl')}
            onBlur={() => handleBlur('ticketUrl')}
            error={touched.ticketUrl ? errors.ticketUrl : undefined}
            type="url"
            placeholder="https://..."
            fullWidth
          />

          <EventBannerPicker
            value={formData.imageUrl}
            onChange={(url) => {
              handleChange('imageUrl')({ target: { name: 'imageUrl', value: url } } as React.ChangeEvent<HTMLInputElement>);
            }}
            error={touched.imageUrl ? errors.imageUrl : undefined}
          />
        </div>
      </section>

      {/* Accessibility Section */}
      <section aria-labelledby="accessibility-heading">
        <h2 id="accessibility-heading" className="text-lg font-semibold text-gray-900 mb-4">
          {t('events.form.sections.accessibility')}
        </h2>

        <fieldset>
          <legend className="sr-only">{t('events.form.fields.accessibilityFeatures')}</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ACCESSIBILITY_OPTIONS.map(({ value, label }) => (
              <Checkbox
                key={value}
                name={`accessibility.${value}`}
                checked={formData.accessibility.includes(value)}
                onChange={(e) => handleAccessibilityChange(value, e.target.checked)}
                label={label}
              />
            ))}
          </div>
        </fieldset>
      </section>

      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
        >
          {loading
            ? t('common.saving')
            : isEditing
            ? t('events.form.buttons.update')
            : t('events.form.buttons.create')}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
          >
            {t('common.cancel')}
          </button>
        )}
      </div>
    </form>
  );
}

export default EventForm;
