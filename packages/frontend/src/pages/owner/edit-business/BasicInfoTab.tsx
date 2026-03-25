/**
 * BasicInfoTab
 *
 * Business name, description, price range, and year established.
 */

import { FormSection } from './FormSection';
import { PRICE_RANGES, INPUT_CLASS_NAME, LABEL_CLASS_NAME } from './constants';
import type { TabProps } from './types';

export function BasicInfoTab({ formData, handleInputChange, t }: TabProps) {
  return (
    <div className="space-y-6">
      <FormSection title={t('editBusiness.basicInfo', 'Basic Information')}>
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className={LABEL_CLASS_NAME}>
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
              className={INPUT_CLASS_NAME}
            />
          </div>

          <div>
            <label htmlFor="description" className={LABEL_CLASS_NAME}>
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
              className={INPUT_CLASS_NAME}
            />
            <p className="text-xs text-slate-500 mt-1">{formData.description.length}/500</p>
          </div>

          <div>
            <label htmlFor="detailedDescription" className={LABEL_CLASS_NAME}>
              {t('editBusiness.fields.detailedDescription', 'Detailed Description')}
            </label>
            <textarea
              id="detailedDescription"
              name="detailedDescription"
              value={formData.detailedDescription}
              onChange={handleInputChange}
              rows={5}
              maxLength={2000}
              className={INPUT_CLASS_NAME}
            />
            <p className="text-xs text-slate-500 mt-1">{formData.detailedDescription.length}/2000</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="priceRange" className={LABEL_CLASS_NAME}>
                {t('editBusiness.fields.priceRange', 'Price Range')}
              </label>
              <select
                id="priceRange"
                name="priceRange"
                value={formData.priceRange}
                onChange={handleInputChange}
                className={INPUT_CLASS_NAME}
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
              <label htmlFor="yearEstablished" className={LABEL_CLASS_NAME}>
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
                className={INPUT_CLASS_NAME}
              />
            </div>
          </div>
        </div>
      </FormSection>
    </div>
  );
}
