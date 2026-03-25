/**
 * SocialPostHistory
 *
 * Displays a list of recent social media posts with status badges and actions.
 * Used on the Owner Dashboard and EditBusinessPage.
 * Spec §20: Social Media Integration
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { socialApi } from '../../services/social-api';
import { PLATFORM_META } from '@community-hub/shared';
import type { SocialPlatform } from '@community-hub/shared';

interface PostItem {
  id: string;
  platform: SocialPlatform;
  accountName: string;
  caption: string;
  status: string;
  platformPostUrl: string | null;
  publishedAt: string | null;
  errorMessage: string | null;
  retryCount: number;
  createdAt: string;
}

interface SocialPostHistoryProps {
  businessId: string;
  limit?: number;
  compact?: boolean;
}

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Pending', className: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300' },
  QUEUED: { label: 'Queued', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  PUBLISHING: { label: 'Publishing', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  PUBLISHED: { label: 'Published', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  FAILED: { label: 'Failed', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  CANCELLED: { label: 'Cancelled', className: 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400' },
};

export function SocialPostHistory({ businessId, limit = 10, compact = false }: SocialPostHistoryProps) {
  const { t } = useTranslation();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const data = await socialApi.getPosts(businessId, { limit });
        setPosts(data.posts as unknown as PostItem[]);
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, [businessId, limit]);

  const handleRetry = async (postId: string) => {
    try {
      await socialApi.retryPost(businessId, postId);
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, status: 'QUEUED', errorMessage: null } : p
      ));
    } catch {
      // Show error in UI
    }
  };

  const handleCancel = async (postId: string) => {
    try {
      await socialApi.cancelPost(businessId, postId);
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, status: 'CANCELLED' } : p
      ));
    } catch {
      // Show error in UI
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-12 bg-slate-200 dark:bg-slate-700 rounded-lg" />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
        {t('social.posts.empty', 'No social media posts yet.')}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {posts.map(post => {
        const meta = PLATFORM_META[post.platform];
        const badge = STATUS_BADGES[post.status] ?? STATUS_BADGES['PENDING']!;

        return (
          <div
            key={post.id}
            className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
          >
            {/* Platform icon */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ backgroundColor: meta.color }}
            >
              {meta.name.charAt(0)}
            </div>

            {/* Post info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                  {compact ? meta.name : post.caption.substring(0, 60) + (post.caption.length > 60 ? '...' : '')}
                </span>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${badge.className}`}>
                  {t(`social.status.${post.status.toLowerCase()}`, badge.label)}
                </span>
              </div>
              {!compact && (
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {post.publishedAt
                    ? new Date(post.publishedAt).toLocaleString()
                    : new Date(post.createdAt).toLocaleString()
                  }
                  {post.errorMessage && (
                    <span className="ml-2 text-red-500" title={post.errorMessage}>
                      {post.errorMessage.substring(0, 50)}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              {post.status === 'PUBLISHED' && post.platformPostUrl && (
                <a
                  href={post.platformPostUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline px-2 py-1"
                >
                  {t('social.posts.view', 'View')}
                </a>
              )}
              {post.status === 'FAILED' && (
                <button
                  type="button"
                  onClick={() => handleRetry(post.id)}
                  className="text-xs text-primary hover:underline px-2 py-1"
                >
                  {t('social.posts.retry', 'Retry')}
                </button>
              )}
              {['PENDING', 'QUEUED'].includes(post.status) && (
                <button
                  type="button"
                  onClick={() => handleCancel(post.id)}
                  className="text-xs text-red-500 hover:underline px-2 py-1"
                >
                  {t('social.posts.cancel', 'Cancel')}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
