/**
 * ModerationQueue Component
 * Admin interface for reviewing and moderating content
 * WCAG 2.1 AA compliant
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StarRating } from '../StarRating';
import { Avatar } from '../display/Avatar';
import { Badge } from '../display/Badge';
import { Textarea } from '../form/Textarea';
import { Modal } from '../display/Modal';
import { Pagination } from '../display/Pagination';
import { EmptyState } from '../display/EmptyState';
import './ModerationQueue.css';

export interface ModerationItem {
  id: string;
  type: 'review';
  review: {
    id: string;
    business: {
      id: string;
      name: string;
    };
    user: {
      id: string;
      name: string;
      avatarUrl?: string;
    };
    rating: number;
    title?: string;
    content: string;
    language: string;
    createdAt: Date;
  };
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  flagCount?: number;
}

export interface ModerationQueueProps {
  /**
   * Array of items to moderate
   */
  items: ModerationItem[];
  /**
   * Total number of items (for pagination)
   */
  total: number;
  /**
   * Current page (1-indexed)
   */
  page: number;
  /**
   * Items per page
   */
  limit: number;
  /**
   * Whether items are loading
   */
  isLoading?: boolean;
  /**
   * Callback when page changes
   */
  onPageChange: (page: number) => void;
  /**
   * Callback when item is approved
   */
  onApprove: (itemId: string, notes?: string) => Promise<void>;
  /**
   * Callback when item is rejected
   */
  onReject: (itemId: string, reason: string, notes?: string) => Promise<void>;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export const ModerationQueue: React.FC<ModerationQueueProps> = ({
  items,
  total,
  page,
  limit,
  isLoading = false,
  onPageChange,
  onApprove,
  onReject,
  className = '',
}) => {
  const { t, i18n } = useTranslation();
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [notes, setNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat(i18n.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const handleApprove = (item: ModerationItem) => {
    setSelectedItem(item);
    setAction('approve');
    setNotes('');
  };

  const handleReject = (item: ModerationItem) => {
    setSelectedItem(item);
    setAction('reject');
    setNotes('');
    setRejectReason('');
  };

  const handleSubmit = async () => {
    if (!selectedItem || !action) return;

    setIsSubmitting(true);
    try {
      if (action === 'approve') {
        await onApprove(selectedItem.id, notes || undefined);
      } else if (action === 'reject' && rejectReason) {
        await onReject(selectedItem.id, rejectReason, notes || undefined);
      }
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedItem(null);
    setAction(null);
    setNotes('');
    setRejectReason('');
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, 'error' | 'warning' | 'primary'> = {
      HIGH: 'error',
      MEDIUM: 'warning',
      LOW: 'primary',
    };
    return (
      <Badge variant={variants[priority] || 'primary'}>
        {t(`moderation.priority.${priority.toLowerCase()}`)}
      </Badge>
    );
  };

  const rejectReasons = [
    'SPAM',
    'OFFENSIVE',
    'IRRELEVANT',
    'DUPLICATE',
    'FAKE',
    'OTHER',
  ];

  const totalPages = Math.ceil(total / limit);

  if (items.length === 0 && !isLoading) {
    return (
      <div className={`moderation-queue ${className}`}>
        <EmptyState
          icon="✅"
          title={t('moderation.noItems')}
          description={t('moderation.noItemsDescription')}
        />
      </div>
    );
  }

  return (
    <div className={`moderation-queue ${className}`}>
      <div className="moderation-queue__header">
        <h2 className="moderation-queue__title">
          {t('moderation.queueTitle', { count: total })}
        </h2>
      </div>

      <div className="moderation-queue__items">
        {items.map((item) => (
          <article key={item.id} className="moderation-queue__item">
            <div className="moderation-queue__item-header">
              <div className="moderation-queue__item-meta">
                {getPriorityBadge(item.priority)}
                {item.flagCount && item.flagCount > 0 && (
                  <Badge variant="error">
                    {t('moderation.flags', { count: item.flagCount })}
                  </Badge>
                )}
                <span className="moderation-queue__item-type">
                  {t(`moderation.type.${item.type}`)}
                </span>
              </div>
              <time className="moderation-queue__item-date">
                {formatDate(item.review.createdAt)}
              </time>
            </div>

            <div className="moderation-queue__item-content">
              <div className="moderation-queue__item-business">
                <strong>{item.review.business.name}</strong>
              </div>

              <div className="moderation-queue__item-user">
                <Avatar
                  src={item.review.user.avatarUrl}
                  name={item.review.user.name}
                  alt={item.review.user.name}
                  size="sm"
                />
                <span>{item.review.user.name}</span>
                <StarRating value={item.review.rating} readOnly size="small" />
              </div>

              {item.review.title && (
                <h4 className="moderation-queue__item-title">{item.review.title}</h4>
              )}
              <p className="moderation-queue__item-text">{item.review.content}</p>

              <div className="moderation-queue__item-info">
                <span className="moderation-queue__item-language">
                  {t('moderation.language')}: {item.review.language.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="moderation-queue__item-actions">
              <button
                type="button"
                className="moderation-queue__action moderation-queue__action--approve"
                onClick={() => handleApprove(item)}
                disabled={isSubmitting}
              >
                {t('moderation.approve')}
              </button>
              <button
                type="button"
                className="moderation-queue__action moderation-queue__action--reject"
                onClick={() => handleReject(item)}
                disabled={isSubmitting}
              >
                {t('moderation.reject')}
              </button>
            </div>
          </article>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="moderation-queue__pagination">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}

      {/* Approval/Rejection Modal */}
      <Modal
        isOpen={selectedItem !== null && action !== null}
        onClose={handleClose}
        title={
          action === 'approve'
            ? t('moderation.approveTitle')
            : t('moderation.rejectTitle')
        }
      >
        <div className="moderation-queue__modal-content">
          {action === 'reject' && (
            <div className="moderation-queue__modal-field">
              <label htmlFor="reject-reason" className="moderation-queue__modal-label">
                {t('moderation.rejectReason')} <span className="required">*</span>
              </label>
              <select
                id="reject-reason"
                className="moderation-queue__modal-select"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                required
              >
                <option value="">{t('moderation.selectReason')}</option>
                {rejectReasons.map((reason) => (
                  <option key={reason} value={reason}>
                    {t(`moderation.reasons.${reason.toLowerCase()}`)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="moderation-queue__modal-field">
            <Textarea
              id="moderation-notes"
              label={t('moderation.notes')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('moderation.notesPlaceholder')}
              rows={4}
              maxLength={500}
            />
          </div>

          <div className="moderation-queue__modal-actions">
            <button
              type="button"
              className="moderation-queue__modal-button moderation-queue__modal-button--secondary"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              className={`moderation-queue__modal-button ${
                action === 'approve'
                  ? 'moderation-queue__modal-button--approve'
                  : 'moderation-queue__modal-button--reject'
              }`}
              onClick={handleSubmit}
              disabled={isSubmitting || (action === 'reject' && !rejectReason)}
            >
              {isSubmitting
                ? t('common.submitting')
                : action === 'approve'
                ? t('moderation.confirmApprove')
                : t('moderation.confirmReject')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
