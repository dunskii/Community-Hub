/**
 * PlatformApprovalNotice
 *
 * Displays a banner on the admin dashboard reminding about pending
 * social media platform API approvals.
 * Spec §20: Social Media Integration
 */

import { useTranslation } from 'react-i18next';

const PLATFORM_APPROVALS = [
  {
    name: 'Facebook / Instagram',
    description: 'Meta App Review required for pages_manage_posts scope',
    url: 'https://developers.facebook.com/apps/',
  },
  {
    name: 'X',
    description: 'Elevated API access for posting',
    url: 'https://developer.x.com/en/portal/dashboard',
  },
  {
    name: 'LinkedIn',
    description: 'Community Management API partner program',
    url: 'https://www.linkedin.com/developers/apps',
  },
  {
    name: 'Google Business Profile',
    description: 'GBP API access approval',
    url: 'https://console.cloud.google.com/',
  },
];

export function PlatformApprovalNotice() {
  const { t } = useTranslation();

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
      <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2">
        {t('admin.social.approvalTitle', 'Social Media Integration: API Approval Required')}
      </h3>
      <p className="text-xs text-amber-700 dark:text-amber-400 mb-3">
        {t('admin.social.approvalDescription', 'Businesses can connect accounts, but posting requires platform approval. Submit applications for each platform below.')}
      </p>
      <div className="space-y-2">
        {PLATFORM_APPROVALS.map(platform => (
          <div key={platform.name} className="flex items-center justify-between text-xs">
            <div>
              <span className="font-medium text-amber-800 dark:text-amber-300">{platform.name}</span>
              <span className="text-amber-600 dark:text-amber-500 ml-2">{platform.description}</span>
            </div>
            <a
              href={platform.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline shrink-0 ml-4"
            >
              {t('admin.social.applyButton', 'Apply')}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
