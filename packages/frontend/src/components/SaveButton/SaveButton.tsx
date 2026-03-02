/**
 * SaveButton Component
 * Button for saving/unsaving businesses
 * WCAG 2.1 AA compliant with keyboard navigation
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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

  const getIcon = () => {
    if (isLoading) return '⏳';
    return isSaved ? '❤️' : '🤍';
  };

  const getLabel = () => {
    if (variant === 'icon') {
      return isSaved ? t('saved.unsave') : t('saved.save');
    }
    return isSaved ? t('saved.saved') : t('saved.saveForLater');
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
        {getIcon()}
      </span>
      {variant !== 'icon' && (
        <span className="save-button__text">{getLabel()}</span>
      )}
    </button>
  );
};
