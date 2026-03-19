/**
 * FollowButton Component
 * Button for following/unfollowing businesses
 * WCAG 2.1 AA compliant with keyboard navigation
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PlusIcon, CheckIcon } from '@heroicons/react/24/outline';
import './FollowButton.css';

export interface FollowButtonProps {
  /**
   * Whether the user is currently following
   */
  isFollowing: boolean;
  /**
   * Callback when button is clicked
   */
  onClick: () => void | Promise<void>;
  /**
   * Button variant
   */
  variant?: 'primary' | 'secondary' | 'text';
  /**
   * Button size
   */
  size?: 'small' | 'medium' | 'large';
  /**
   * Whether the button is disabled
   */
  disabled?: boolean;
  /**
   * Show follower count
   */
  followerCount?: number;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export const FollowButton: React.FC<FollowButtonProps> = ({
  isFollowing,
  onClick,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  followerCount,
  className = '',
}) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (isLoading || disabled) return;

    setIsLoading(true);
    try {
      await onClick();
    } finally {
      setIsLoading(false);
    }
  };

  const getLabel = () => {
    if (isLoading) return t('common.loading', 'Loading...');
    return isFollowing ? t('follow.following', 'Following') : t('follow.follow', 'Follow');
  };

  const formatFollowerCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <div className={`follow-button-wrapper ${className}`}>
      <button
        type="button"
        className={`follow-button follow-button--${variant} follow-button--${size} ${
          isFollowing ? 'follow-button--following' : ''
        } ${isLoading ? 'follow-button--loading' : ''}`}
        onClick={handleClick}
        disabled={disabled || isLoading}
        aria-label={getLabel()}
        aria-pressed={isFollowing}
      >
        <span className="follow-button__icon" aria-hidden="true">
          {isFollowing ? (
            <CheckIcon className="follow-button__check" />
          ) : (
            <PlusIcon className="follow-button__plus" />
          )}
        </span>
        <span className="follow-button__text">{getLabel()}</span>
      </button>
      {followerCount !== undefined && followerCount > 0 && (
        <span className="follow-button__count" aria-label={t('follow.followerCount', { count: followerCount, defaultValue: `${followerCount} followers` })}>
          {formatFollowerCount(followerCount)}
        </span>
      )}
    </div>
  );
};
