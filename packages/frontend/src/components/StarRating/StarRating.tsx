/**
 * StarRating Component
 * Displays and allows selection of star ratings (1-5 stars)
 * WCAG 2.1 AA compliant with keyboard navigation
 */

import React, { useState, useId } from 'react';
import { useTranslation } from 'react-i18next';
import './StarRating.css';

export interface StarRatingProps {
  /**
   * Current rating value (1-5)
   */
  value?: number;
  /**
   * Callback when rating changes (interactive mode)
   */
  onChange?: (rating: number) => void;
  /**
   * Display size
   */
  size?: 'small' | 'medium' | 'large';
  /**
   * Whether the rating is read-only (display mode)
   */
  readOnly?: boolean;
  /**
   * Show numeric value next to stars
   */
  showValue?: boolean;
  /**
   * Show count of ratings (e.g., "(123)")
   */
  count?: number;
  /**
   * Accessible label for the rating input
   */
  label?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
  value = 0,
  onChange,
  size = 'medium',
  readOnly = false,
  showValue = false,
  count,
  label,
  className = '',
}) => {
  const { t } = useTranslation();
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const id = useId();

  const isInteractive = !readOnly && onChange !== undefined;
  const displayRating = hoveredRating !== null ? hoveredRating : value;

  const handleClick = (rating: number) => {
    if (isInteractive && onChange) {
      onChange(rating);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, rating: number) => {
    if (!isInteractive) return;

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick(rating);
    }
  };

  const getAriaLabel = (rating: number): string => {
    if (label) {
      return `${label}: ${rating} ${t('reviews.outOfFive')}`;
    }
    return `${rating} ${t('reviews.outOfFive')}`;
  };

  const stars = [1, 2, 3, 4, 5].map((rating) => {
    const isFilled = rating <= displayRating;
    const isHalf = !isFilled && rating - 0.5 <= displayRating;

    return (
      <span
        key={rating}
        className={`star-rating__star ${isFilled ? 'star-rating__star--filled' : ''} ${
          isHalf ? 'star-rating__star--half' : ''
        } ${isInteractive ? 'star-rating__star--interactive' : ''}`}
        onClick={() => handleClick(rating)}
        onMouseEnter={() => isInteractive && setHoveredRating(rating)}
        onMouseLeave={() => isInteractive && setHoveredRating(null)}
        onKeyDown={(e) => handleKeyDown(e, rating)}
        role={isInteractive ? 'button' : undefined}
        tabIndex={isInteractive ? 0 : -1}
        aria-label={getAriaLabel(rating)}
      >
        {isFilled ? '★' : isHalf ? '⯨' : '☆'}
      </span>
    );
  });

  return (
    <div
      className={`star-rating star-rating--${size} ${
        isInteractive ? 'star-rating--interactive' : ''
      } ${className}`}
      role={isInteractive ? 'group' : undefined}
      aria-label={label || t('reviews.rating')}
    >
      <div className="star-rating__stars" aria-hidden={isInteractive}>
        {stars}
      </div>
      {showValue && (
        <span className="star-rating__value" aria-live="polite">
          {value.toFixed(1)}
        </span>
      )}
      {count !== undefined && count > 0 && (
        <span className="star-rating__count">({count})</span>
      )}
      {isInteractive && (
        <input
          type="hidden"
          id={id}
          name="rating"
          value={value}
          aria-label={label || t('reviews.rating')}
        />
      )}
    </div>
  );
};
