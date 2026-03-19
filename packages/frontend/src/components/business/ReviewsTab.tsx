/**
 * ReviewsTab Component
 * Complete reviews section for business detail page
 * WCAG 2.1 AA compliant
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StarRating } from '../StarRating';
import { ReviewForm, type ReviewFormData } from '../ReviewForm';
import { ReviewList } from '../ReviewList';
import { Modal } from '../display/Modal';
import { Alert } from '../display/Alert';
import { useAuth } from '../../hooks/useAuth';
import { useReviews } from '../../hooks/useReviews';
import './ReviewsTab.css';

export interface ReviewsTabProps {
  businessId: string;
  businessName: string;
}

export const ReviewsTab: React.FC<ReviewsTabProps> = ({ businessId, businessName }) => {
  const { t } = useTranslation('reviews');
  const { user, isAuthenticated } = useAuth();

  const {
    reviews,
    total,
    averageRating,
    page,
    limit,
    sortBy,
    isLoading,
    error,
    hasUserReviewed,
    userReview,
    setPage,
    setSortBy,
    createReview,
    updateReview,
    deleteReview,
    toggleHelpful,
    reportReview,
  } = useReviews({ businessId });

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);

  const handleWriteReview = () => {
    if (!isAuthenticated) {
      // TODO: Show login modal or redirect to login
      return;
    }
    setShowReviewForm(true);
    setEditingReviewId(null);
  };

  const handleEditReview = (reviewId: string) => {
    setEditingReviewId(reviewId);
    setShowReviewForm(true);
  };

  const handleDeleteReview = (reviewId: string) => {
    setDeletingReviewId(reviewId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deletingReviewId) return;

    setIsSubmitting(true);
    try {
      await deleteReview(deletingReviewId);
      setShowDeleteConfirm(false);
      setDeletingReviewId(null);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to delete review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReview = async (data: ReviewFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (editingReviewId) {
        await updateReview(editingReviewId, data);
      } else {
        await createReview(data);
      }
      setShowReviewForm(false);
      setEditingReviewId(null);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit review');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelReview = () => {
    setShowReviewForm(false);
    setEditingReviewId(null);
    setSubmitError(null);
  };

  const handleMarkHelpful = async (reviewId: string) => {
    if (!isAuthenticated) {
      // TODO: Show login modal
      return;
    }
    try {
      await toggleHelpful(reviewId);
    } catch (err) {
      // Handle error silently or show toast
      console.error('Failed to toggle helpful:', err);
    }
  };

  const handleReport = async (reviewId: string) => {
    if (!isAuthenticated) {
      // TODO: Show login modal
      return;
    }
    // TODO: Show report modal with reason selection
    try {
      await reportReview(reviewId, 'INAPPROPRIATE', 'User reported this review');
    } catch (err) {
      console.error('Failed to report review:', err);
    }
  };

  const getRatingDistribution = () => {
    // Calculate distribution of ratings (1-5 stars)
    const distribution = [0, 0, 0, 0, 0];
    reviews.forEach((review) => {
      if (review.rating >= 1 && review.rating <= 5) {
        distribution[review.rating - 1]++;
      }
    });
    return distribution;
  };

  const ratingDistribution = getRatingDistribution();

  return (
    <div className="reviews-tab">
      {/* Reviews Summary */}
      <div className="reviews-tab__summary">
        <div className="reviews-tab__summary-rating">
          <div className="reviews-tab__average">{averageRating.toFixed(1)}</div>
          <StarRating value={averageRating} readOnly size="large" />
          <div className="reviews-tab__total">
            {t('reviews.basedOn', { count: total, defaultValue: `Based on ${total} reviews` })}
          </div>
        </div>

        <div className="reviews-tab__distribution">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = ratingDistribution[stars - 1];
            const percentage = total > 0 ? (count / total) * 100 : 0;

            return (
              <div key={stars} className="reviews-tab__distribution-row">
                <span className="reviews-tab__distribution-label">
                  {stars} {t('reviews.stars', 'stars')}
                </span>
                <div className="reviews-tab__distribution-bar">
                  <div
                    className="reviews-tab__distribution-fill"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="reviews-tab__distribution-count">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Write Review Button */}
      <div className="reviews-tab__actions">
        {!hasUserReviewed && (
          <button
            type="button"
            className="reviews-tab__write-button"
            onClick={handleWriteReview}
            disabled={!isAuthenticated}
          >
            {t('reviews.writeReview', 'Write a Review')}
          </button>
        )}
        {hasUserReviewed && userReview && (
          <Alert variant="info" message={t('reviews.alreadyReviewed', 'You have already reviewed this business.')} />
        )}
      </div>

      {/* Error Display */}
      {error && <Alert variant="error" message={error} />}

      {/* Review List */}
      <ReviewList
        reviews={reviews}
        total={total}
        page={page}
        limit={limit}
        sortBy={sortBy}
        isLoading={isLoading}
        onPageChange={setPage}
        onSortChange={setSortBy}
        onMarkHelpful={handleMarkHelpful}
        onEdit={handleEditReview}
        onDelete={handleDeleteReview}
        onReport={handleReport}
      />

      {/* Review Form Modal */}
      <Modal
        isOpen={showReviewForm}
        onClose={handleCancelReview}
        title={
          editingReviewId
            ? t('reviews.editReview', 'Edit Review')
            : t('reviews.writeReviewFor', { business: businessName, defaultValue: `Write a Review for ${businessName}` })
        }
        size="large"
      >
        <ReviewForm
          initialData={
            editingReviewId && userReview
              ? {
                  rating: userReview.rating,
                  title: userReview.title,
                  content: userReview.content,
                }
              : undefined
          }
          onSubmit={handleSubmitReview}
          onCancel={handleCancelReview}
          isLoading={isSubmitting}
          error={submitError}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title={t('reviews.deleteConfirmTitle', 'Delete Review?')}
      >
        <div className="reviews-tab__delete-confirm">
          <p>{t('reviews.deleteConfirmMessage', 'Are you sure you want to delete your review? This action cannot be undone.')}</p>
          <div className="reviews-tab__delete-actions">
            <button
              type="button"
              className="reviews-tab__button reviews-tab__button--secondary"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isSubmitting}
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              type="button"
              className="reviews-tab__button reviews-tab__button--danger"
              onClick={confirmDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? t('common.deleting', 'Deleting...') : t('common.delete', 'Delete')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
