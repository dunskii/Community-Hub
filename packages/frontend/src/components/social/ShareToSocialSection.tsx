/**
 * ShareToSocialSection
 *
 * Allows business owners to share deals/events to connected social media accounts.
 * Shows platform checkboxes, caption preview, and post controls.
 * Spec §20: Social Media Integration
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { socialApi } from '../../services/social-api';
import { PLATFORM_META, CAPTION_LIMITS } from '@community-hub/shared';
import type { SocialAccount, SocialPlatform } from '@community-hub/shared';

interface ShareToSocialSectionProps {
  businessId: string;
  contentType: 'DEAL' | 'EVENT';
  contentId: string;
  imageUrl?: string;
  onPostsCreated?: (count: number) => void;
}

export function ShareToSocialSection({
  businessId,
  contentType,
  contentId,
  imageUrl,
  onPostsCreated,
}: ShareToSocialSectionProps) {
  const { t } = useTranslation();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<SocialPlatform>>(new Set());
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch connected accounts
  useEffect(() => {
    async function fetch() {
      try {
        const data = await socialApi.getAccounts(businessId);
        const activeAccounts = data.accounts.filter(a => a.isActive);
        setAccounts(activeAccounts);
        // Pre-select all connected active accounts
        setSelectedPlatforms(new Set(activeAccounts.map(a => a.platform)));
      } catch {
        // Silently fail - social sharing is optional
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [businessId]);

  // Generate caption preview on first load
  const generateCaption = useCallback(async () => {
    if (accounts.length === 0) return;
    try {
      // Use the first platform's caption as the default
      const preview = await socialApi.previewCaption(
        businessId, contentType, contentId, accounts[0]!.platform
      );
      setCaption(preview.caption);
    } catch {
      // Use empty caption - user can type one
    }
  }, [businessId, contentType, contentId, accounts]);

  useEffect(() => {
    if (!loading && accounts.length > 0 && !caption) {
      generateCaption();
    }
  }, [loading, accounts, caption, generateCaption]);

  const handleTogglePlatform = (platform: SocialPlatform) => {
    setSelectedPlatforms(prev => {
      const next = new Set(prev);
      if (next.has(platform)) {
        next.delete(platform);
      } else {
        next.add(platform);
      }
      return next;
    });
  };

  const handleShare = async () => {
    if (selectedPlatforms.size === 0) return;

    try {
      setPosting(true);
      setError(null);
      const results = await socialApi.createPosts(businessId, {
        platforms: Array.from(selectedPlatforms),
        contentType,
        contentId,
        caption: caption || undefined,
        imageUrl,
      });
      setSuccess(true);
      onPostsCreated?.(results.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share');
    } finally {
      setPosting(false);
    }
  };

  // Don't render if no connected accounts
  if (loading) {
    return (
      <div className="animate-pulse h-20 bg-slate-100 dark:bg-slate-800 rounded-lg" />
    );
  }

  if (accounts.length === 0) {
    return null;
  }

  if (success) {
    return (
      <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
        <p className="text-green-700 dark:text-green-400 text-sm font-medium">
          {t('social.post.success', 'Shared to social media! Posts are being published.')}
        </p>
      </div>
    );
  }

  // Find the shortest limit among selected platforms
  const minLimit = selectedPlatforms.size > 0
    ? Math.min(...Array.from(selectedPlatforms).map(p => CAPTION_LIMITS[p]))
    : 2200;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
        {t('social.share.title', 'Share to Social Media')}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        {t('social.share.description', 'Post this promotion to your connected social media accounts.')}
      </p>

      {error && (
        <div className="mb-4 p-3 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg">
          {error}
        </div>
      )}

      {/* Platform checkboxes */}
      <div className="space-y-2 mb-4">
        {accounts.map(account => {
          const meta = PLATFORM_META[account.platform];
          const isSelected = selectedPlatforms.has(account.platform);

          return (
            <label
              key={account.id}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                isSelected
                  ? 'border-primary bg-primary/5 dark:bg-primary/10'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleTogglePlatform(account.platform)}
                className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary"
              />
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: meta.color }}
              >
                {meta.name.charAt(0)}
              </div>
              <span className="text-sm font-medium text-slate-900 dark:text-white">
                {meta.name}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {account.platformAccountName}
              </span>
            </label>
          );
        })}
      </div>

      {/* Caption editor */}
      <div className="mb-4">
        <label htmlFor="social-caption" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          {t('social.caption.label', 'Post Caption')}
        </label>
        <textarea
          id="social-caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={4}
          maxLength={minLimit}
          className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
          placeholder={t('social.caption.placeholder', 'Write your post caption...')}
        />
        <div className="flex justify-between mt-1">
          <button
            type="button"
            onClick={generateCaption}
            className="text-xs text-primary hover:underline"
          >
            {t('social.caption.regenerate', 'Auto-generate caption')}
          </button>
          <span className={`text-xs ${caption.length > minLimit * 0.9 ? 'text-amber-500' : 'text-slate-400'}`}>
            {caption.length}/{minLimit}
          </span>
        </div>
      </div>

      {/* Share button */}
      <button
        type="button"
        onClick={handleShare}
        disabled={posting || selectedPlatforms.size === 0}
        className="w-full px-4 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {posting
          ? t('social.share.posting', 'Sharing...')
          : t('social.share.button', `Share to ${selectedPlatforms.size} platform${selectedPlatforms.size !== 1 ? 's' : ''}`)
        }
      </button>
    </div>
  );
}
