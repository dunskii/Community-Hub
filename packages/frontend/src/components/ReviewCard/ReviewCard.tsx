/**
 * ReviewCard Component
 * Displays a single review with rating, content, photos, and actions
 * WCAG 2.1 AA compliant
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StarRating } from '../StarRating';
import { Avatar } from '../Avatar';
import { Badge } from '../Badge';
import './ReviewCard.css';

export interface ReviewCardProps {
  /**
   * Review ID
   */
  id: string;
  /**
   * Reviewer information
   */
  user: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  /**
   * Star rating (1-5)
   */
  rating: number;
  /**
   * Review title (optional)
   */
  title?: string;
  /**
   * Review content
   */
  content: string;
  /**
   * Review photos (optional)
   */
  photos?: Array<{
    id: string;
    url: string;
    alt?: string;
  }>;
  /**
   * Business response (optional)
   */
  businessResponse?: {
    content: string;
    respondedAt: Date;
  };
  /**
   * Number of helpful votes
   */
  helpfulCount: number;
  /**
   * Whether current user marked as helpful
   */
  isMarkedHelpful?: boolean;
  /**
   * Whether current user is the reviewer
   */
  isOwnReview?: boolean;
  /**
   * Review creation date
   */
  createdAt: Date;
  /**
   * Review update date (if edited)
   */
  updatedAt?: Date;
  /**
   * Callback when helpful button clicked
   */
  onMarkHelpful?: () => void;
  /**
   * Callback when edit button clicked
   */
  onEdit?: () => void;
  /**
   * Callback when delete button clicked
   */
  onDelete?: () => void;
  /**
   * Callback when report button clicked
   */
  onReport?: () => void;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  id,
  user,
  rating,
  title,
  content,
  photos,
  businessResponse,
  helpfulCount,
  isMarkedHelpful = false,
  isOwnReview = false,
  createdAt,
  updatedAt,
  onMarkHelpful,
  onEdit,
  onDelete,
  onReport,
  className = '',
}) => {
  const { t, i18n } = useTranslation();
  const [showAllPhotos, setShowAllPhotos] = useState(false);

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat(i18n.language, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return t('time.justNow');
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return t('time.minutesAgo', { count: minutes });
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return t('time.hoursAgo', { count: hours });
    }
    if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return t('time.daysAgo', { count: days });
    }
    return formatDate(date);
  };

  const displayedPhotos = showAllPhotos ? photos : photos?.slice(0, 3);
  const hasMorePhotos = photos && photos.length > 3 && !showAllPhotos;

  return (
    <article className={`review-card ${className}`} aria-labelledby={`review-${id}-title`}>
      <div className="review-card__header">
        <div className="review-card__user">
          <Avatar
            src={user.avatarUrl}
            alt={user.name}
            size="medium"
          />
          <div className="review-card__user-info">
            <h3 className="review-card__user-name">{user.name}</h3>
            <time
              className="review-card__date"
              dateTime={createdAt.toISOString()}
              title={formatDate(createdAt)}
            >
              {formatRelativeTime(createdAt)}
            </time>
            {updatedAt && updatedAt > createdAt && (
              <span className="review-card__edited">
                {t('reviews.edited')}
              </span>
            )}
          </div>
        </div>
        <StarRating value={rating} readOnly size="small" />
      </div>

      <div className="review-card__content">
        {title && (
          <h4 id={`review-${id}-title`} className="review-card__title">
            {title}
          </h4>
        )}
        <p className="review-card__text">{content}</p>
      </div>

      {photos && photos.length > 0 && (
        <div className="review-card__photos">
          {displayedPhotos?.map((photo) => (
            <img
              key={photo.id}
              src={photo.url}
              alt={photo.alt || t('reviews.reviewPhoto')}
              className="review-card__photo"
              loading="lazy"
            />
          ))}
          {hasMorePhotos && (
            <button
              type="button"
              className="review-card__photo-more"
              onClick={() => setShowAllPhotos(true)}
              aria-label={t('reviews.showMorePhotos', { count: photos.length - 3 })}
            >
              +{photos.length - 3}
            </button>
          )}
        </div>
      )}

      {businessResponse && (
        <div className="review-card__response">
          <Badge variant="info" className="review-card__response-badge">
            {t('reviews.businessResponse')}
          </Badge>
          <p className="review-card__response-text">{businessResponse.content}</p>
          <time
            className="review-card__response-date"
            dateTime={businessResponse.respondedAt.toISOString()}
          >
            {formatDate(businessResponse.respondedAt)}
          </time>
        </div>
      )}

      <div className="review-card__footer">
        <div className="review-card__actions">
          {onMarkHelpful && (
            <button
              type="button"
              className={`review-card__action ${
                isMarkedHelpful ? 'review-card__action--active' : ''
              }`}
              onClick={onMarkHelpful}
              aria-label={
                isMarkedHelpful
                  ? t('reviews.unmarkHelpful')
                  : t('reviews.markHelpful')
              }
              aria-pressed={isMarkedHelpful}
            >
              <span className="review-card__action-icon">👍</span>
              <span className="review-card__action-text">
                {t('reviews.helpful')} ({helpfulCount})
              </span>
            </button>
          )}
        </div>

        <div className="review-card__menu">
          {isOwnReview && onEdit && (
            <button
              type="button"
              className="review-card__menu-item"
              onClick={onEdit}
            >
              {t('common.edit')}
            </button>
          )}
          {isOwnReview && onDelete && (
            <button
              type="button"
              className="review-card__menu-item review-card__menu-item--danger"
              onClick={onDelete}
            >
              {t('common.delete')}
            </button>
          )}
          {!isOwnReview && onReport && (
            <button
              type="button"
              className="review-card__menu-item"
              onClick={onReport}
            >
              {t('reviews.report')}
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
