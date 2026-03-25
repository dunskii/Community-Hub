/**
 * DetailsTab
 *
 * Payment methods, accessibility features, and languages spoken checkboxes.
 */

import { FormSection } from './FormSection';
import { CheckboxGroup } from './CheckboxGroup';
import { PAYMENT_METHODS, ACCESSIBILITY_FEATURES, LANGUAGES } from './constants';
import type { TabProps, CheckboxField } from './types';

interface DetailsTabProps extends TabProps {
  handleCheckboxChange: (field: CheckboxField, value: string) => void;
}

export function DetailsTab({ formData, handleCheckboxChange, t }: DetailsTabProps) {
  return (
    <div className="space-y-6">
      <FormSection title={t('editBusiness.languagesSpoken', 'Languages Spoken')}>
        <CheckboxGroup
          items={LANGUAGES.map(lang => ({ value: lang.code, label: lang.name }))}
          selectedItems={formData.languagesSpoken}
          onChange={(value) => handleCheckboxChange('languagesSpoken', value)}
          columns={5}
        />
      </FormSection>

      <FormSection title={t('editBusiness.paymentMethods', 'Payment Methods')}>
        <CheckboxGroup
          items={PAYMENT_METHODS.map(method => ({ value: method, label: method.replace(/_/g, ' ') }))}
          selectedItems={formData.paymentMethods}
          onChange={(value) => handleCheckboxChange('paymentMethods', value)}
          columns={3}
        />
      </FormSection>

      <FormSection title={t('editBusiness.accessibilityFeatures', 'Accessibility Features')}>
        <CheckboxGroup
          items={ACCESSIBILITY_FEATURES.map(feature => ({ value: feature, label: feature.replace(/_/g, ' ') }))}
          selectedItems={formData.accessibilityFeatures}
          onChange={(value) => handleCheckboxChange('accessibilityFeatures', value)}
          columns={2}
        />
      </FormSection>
    </div>
  );
}
