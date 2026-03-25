/**
 * SocialMediaTab
 *
 * Social media URL inputs, GBP data sync, and auto-posting connections.
 */

import { FormSection } from './FormSection';
import { INPUT_CLASS_NAME, LABEL_CLASS_NAME } from './constants';
import { SocialAccountsList } from '../../../components/social/SocialAccountsList';
import { GbpSyncPanel } from '../../../components/social/GbpSyncPanel';
import type { TabProps, FormData } from './types';

interface SocialMediaTabProps extends TabProps {
  businessId: string | undefined;
  handleSocialChange: (platform: string, value: string) => void;
  handleGbpFieldsApplied: (updates: Partial<FormData>) => void;
}

export function SocialMediaTab({ formData, handleSocialChange, handleGbpFieldsApplied, businessId, t }: SocialMediaTabProps) {
  return (
    <div className="space-y-6">
      {/* Social Profile Links */}
      <FormSection title={t('editBusiness.socialMedia', 'Social Media')}>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          {t('editBusiness.socialMediaDescription', 'Add your social media profiles so customers can find and follow you.')}
        </p>

        <div className="max-w-md space-y-4">
          {Object.keys(formData.socialLinks).map(platform => (
            <div key={platform}>
              <label htmlFor={platform} className={`${LABEL_CLASS_NAME} capitalize`}>
                {platform}
              </label>
              <input
                type="url"
                id={platform}
                value={formData.socialLinks[platform as keyof typeof formData.socialLinks]}
                onChange={(e) => handleSocialChange(platform, e.target.value)}
                placeholder={`https://${platform}.com/...`}
                className={INPUT_CLASS_NAME}
              />
            </div>
          ))}
        </div>
      </FormSection>

      {/* Google Business Profile Sync */}
      {businessId && (
        <FormSection title={t('editBusiness.gbpSync', 'Google Business Profile Sync')}>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            {t('editBusiness.gbpSyncDescription', 'Import your business details from Google Business Profile.')}
          </p>
          <GbpSyncPanel
            businessId={businessId}
            formData={formData}
            onFieldsApplied={handleGbpFieldsApplied}
          />
        </FormSection>
      )}

      {/* Auto-Posting Connections */}
      {businessId && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
            {t('editBusiness.socialAutoPost', 'Auto-Post to Social Media')}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            {t('editBusiness.socialAutoPostDescription', 'Connect your accounts to automatically share promotions to your social media.')}
          </p>
          <SocialAccountsList businessId={businessId} />
        </div>
      )}
    </div>
  );
}
