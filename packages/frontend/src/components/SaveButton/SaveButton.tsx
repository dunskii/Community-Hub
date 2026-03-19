/**
 * SaveButton Component
 * Button for saving/unsaving businesses
 * WCAG 2.1 AA compliant with keyboard navigation
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HeartIcon as HeartOutline } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import './SaveButton.css';

export interface SaveButtonProps {
  /**
   * Whether the business is currently saved
   */
  isSaved: boolean;
  /**
   * Callback when button is clicked
   */
  onClick: () => void | Promise<void>;
  /**
   * Button variant
   */
  variant?: 'icon' | 'text' | 'full';
  /**
   * Button size
   */
  size?: 'small' | 'medium' | 'large';
  /**
   * Whether the button is disabled
   */
  disabled?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export const SaveButton: React.FC<SaveButtonProps> = ({
  isSaved,
  onClick,
  variant = 'icon',
  size = 'medium',
  disabled = false,
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
    if (variant === 'icon') {
      return isSaved ? t('saved.unsave', 'Unsave') : t('saved.save', 'Save');
    }
    return isSaved ? t('saved.saved', 'Saved') : t('saved.saveForLater', 'Save');
  };

  return (
    <button
      type="button"
      className={`save-button save-button--${variant} save-button--${size} ${
        isSaved ? 'save-button--saved' : ''
      } ${isLoading ? 'save-button--loading' : ''} ${className}`}
      onClick={handleClick}
      disabled={disabled || isLoading}
      aria-label={getLabel()}
      aria-pressed={isSaved}
    >
      <span className="save-button__icon" aria-hidden="true">
        {isLoading ? (
          <svg className="save-button__spinner" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : isSaved ? (
          <HeartSolid className="save-button__heart" />
        ) : (
          <HeartOutline className="save-button__heart" />
        )}
      </span>
      {variant !== 'icon' && (
        <span className="save-button__text">{getLabel()}</span>
      )}
    </button>
  );
};
