/**
 * SocialAccountsList
 *
 * Displays connected social media accounts with connect/disconnect controls.
 * Used on the EditBusinessPage Social Media tab.
 * Spec §20: Social Media Integration
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { socialApi } from '../../services/social-api';
import { PLATFORM_META, SOCIAL_PLATFORMS } from '@community-hub/shared';
import type { SocialAccount, SocialPlatform } from '@community-hub/shared';

interface SocialAccountsListProps {
  businessId: string;
}

export function SocialAccountsList({ businessId }: SocialAccountsListProps) {
  const { t } = useTranslation();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [configuredPlatforms, setConfiguredPlatforms] = useState<SocialPlatform[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await socialApi.getAccounts(businessId);
      setAccounts(data.accounts);
      setConfiguredPlatforms(data.configuredPlatforms);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Listen for OAuth popup completion
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'social-auth-success') {
        fetchAccounts();
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [fetchAccounts]);

  const handleConnect = (platform: SocialPlatform) => {
    const authUrl = socialApi.getAuthUrl(businessId, platform);
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    window.open(
      authUrl,
      `social-auth-${platform}`,
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
    );
  };

  const handleDisconnect = async (accountId: string, platformName: string) => {
    if (!window.confirm(t('social.disconnect.confirm', `Disconnect ${platformName}? Any pending posts will be cancelled.`))) return;

    try {
      await socialApi.disconnectAccount(businessId, accountId);
      setAccounts(prev => prev.filter(a => a.id !== accountId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect');
    }
  };

  const handleToggle = async (accountId: string, currentActive: boolean) => {
    try {
      await socialApi.toggleAccount(businessId, accountId, !currentActive);
      setAccounts(prev => prev.map(a =>
        a.id === accountId ? { ...a, isActive: !currentActive } : a
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle account');
    }
  };

  const connectedPlatforms = new Set(accounts.map(a => a.platform));

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="p-3 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg">
          {error}
        </div>
      )}

      {SOCIAL_PLATFORMS.map(platform => {
        const meta = PLATFORM_META[platform];
        const account = accounts.find(a => a.platform === platform);
        const isConfigured = configuredPlatforms.includes(platform);
        const isConnected = connectedPlatforms.has(platform);

        return (
          <div
            key={platform}
            className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
          >
            <div className="flex items-center gap-3">
              {/* Platform icon circle */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: meta.color }}
              >
                {meta.name.charAt(0)}
              </div>

              <div>
                <div className="font-medium text-slate-900 dark:text-white">
                  {meta.name}
                </div>
                {isConnected && account ? (
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    {account.platformAccountName}
                    {account.lastError && (
                      <span className="ml-2 text-amber-500" title={account.lastError}>
                        {t('social.status.warning', 'Needs attention')}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-slate-400 dark:text-slate-500">
                    {isConfigured
                      ? t('social.status.notConnected', 'Not connected')
                      : t('social.status.notConfigured', 'Not configured')
                    }
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isConnected && account ? (
                <>
                  {/* Active toggle */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={account.isActive}
                    onClick={() => handleToggle(account.id, account.isActive)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      account.isActive ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                    aria-label={account.isActive ? t('social.deactivate', 'Deactivate') : t('social.activate', 'Activate')}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        account.isActive ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>

                  {/* Disconnect button */}
                  <button
                    type="button"
                    onClick={() => handleDisconnect(account.id, meta.name)}
                    className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 px-2 py-1"
                  >
                    {t('social.disconnect.button', 'Disconnect')}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => handleConnect(platform)}
                  disabled={!isConfigured}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: isConfigured ? meta.color : undefined,
                    color: isConfigured ? 'white' : undefined,
                  }}
                >
                  {t('social.connect.button', `Connect to ${meta.name}`)}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
