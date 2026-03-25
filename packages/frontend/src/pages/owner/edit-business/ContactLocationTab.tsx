/**
 * ContactLocationTab
 *
 * Phone, email, website, address fields, and parking information.
 */

import { FormSection } from './FormSection';
import { INPUT_CLASS_NAME, LABEL_CLASS_NAME } from './constants';
import type { TabProps } from './types';

export function ContactLocationTab({ formData, handleInputChange, t }: TabProps) {
  return (
    <div className="space-y-6">
      <FormSection title={t('editBusiness.contactInfo', 'Contact Information')}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="phone" className={LABEL_CLASS_NAME}>
                {t('editBusiness.fields.phone', 'Phone Number')} *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                className={INPUT_CLASS_NAME}
              />
            </div>

            <div>
              <label htmlFor="secondaryPhone" className={LABEL_CLASS_NAME}>
                {t('editBusiness.fields.secondaryPhone', 'Secondary Phone')}
              </label>
              <input
                type="tel"
                id="secondaryPhone"
                name="secondaryPhone"
                value={formData.secondaryPhone}
                onChange={handleInputChange}
                className={INPUT_CLASS_NAME}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className={LABEL_CLASS_NAME}>
                {t('editBusiness.fields.email', 'Email')}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={INPUT_CLASS_NAME}
              />
            </div>

            <div>
              <label htmlFor="website" className={LABEL_CLASS_NAME}>
                {t('editBusiness.fields.website', 'Website')}
              </label>
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                placeholder="https://"
                className={INPUT_CLASS_NAME}
              />
            </div>
          </div>
        </div>
      </FormSection>

      <FormSection title={t('editBusiness.address', 'Address')}>
        <div className="space-y-4">
          <div>
            <label htmlFor="street" className={LABEL_CLASS_NAME}>
              {t('editBusiness.fields.street', 'Street Address')} *
            </label>
            <input
              type="text"
              id="street"
              name="street"
              value={formData.street}
              onChange={handleInputChange}
              required
              className={INPUT_CLASS_NAME}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="col-span-2">
              <label htmlFor="suburb" className={LABEL_CLASS_NAME}>
                {t('editBusiness.fields.suburb', 'Suburb')} *
              </label>
              <input
                type="text"
                id="suburb"
                name="suburb"
                value={formData.suburb}
                onChange={handleInputChange}
                required
                className={INPUT_CLASS_NAME}
              />
            </div>

            <div>
              <label htmlFor="state" className={LABEL_CLASS_NAME}>
                {t('editBusiness.fields.state', 'State')} *
              </label>
              <select
                id="state"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                required
                className={INPUT_CLASS_NAME}
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
              <label htmlFor="postcode" className={LABEL_CLASS_NAME}>
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
                className={INPUT_CLASS_NAME}
              />
            </div>
          </div>

          <div>
            <label htmlFor="parkingInformation" className={LABEL_CLASS_NAME}>
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
              className={INPUT_CLASS_NAME}
            />
          </div>
        </div>
      </FormSection>
    </div>
  );
}
