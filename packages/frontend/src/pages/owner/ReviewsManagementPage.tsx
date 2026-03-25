/**
 * ReviewsManagementPage
 *
 * Business owner page for managing and responding to reviews.
 * Spec §13.2: Business Owner Dashboard - Review Management
 */

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { PageContainer } from '../../components/layout/PageContainer';
import { Skeleton } from '../../components/display/Skeleton';
import { Alert } from '../../components/display/Alert';
import { StarRating } from '../../components/StarRating';
import { ReviewCard } from '../../components/ReviewCard';
import { Pagination } from '../../components/display/Pagination';
import { Select } from '../../components/form/Select';
import { Modal } from '../../components/display/Modal';
import { useAuth } from '../../hooks/useAuth';
import { useReviews } from '../../hooks/useReviews';
import { reviewService } from '../../services/review-service';
import { get } from '../../services/api-client';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface Business {
  id: string;
  name: string;
  slug: string;
  rating: number | null;
  reviewCount: number;
}

export function ReviewsManagementPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [business, setBusiness] = useState<Business | null>(null);
  const [businessLoading, setBusinessLoading] = useState(true);
  const [businessError, setBusinessError] = useState<string | null>(null);

  // Response modal state
  const [respondingToReviewId, setRespondingToReviewId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);
  const [responseError, setResponseError] = useState<string | null>(null);

  const {
    reviews,
    total,
    averageRating,
    page,
    limit,
    sortBy,
    isLoading,
    error,
    setPage,
    setSortBy,
    fetchReviews,
    toggleHelpful,
  } = useReviews({ businessId: businessId || '' });

  // Load business info
  useEffect(() => {
    if (!businessId) return;

    const loadBusiness = async () => {
      setBusinessLoading(true);
      try {
        const response = await get<{ success: boolean; data: Business }>(
          `/businesses/${businessId}`
        );
        setBusiness(response.data);
      } catch (err) {
        setBusinessError(
          err instanceof Error ? err.message : 'Failed to load business'
        );
      } finally {
        setBusinessLoading(false);
      }
    };

    loadBusiness();
  }, [businessId]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', {
        state: { from: `/business/manage/${businessId}/reviews` },
      });
    }
  }, [isAuthenticated, navigate, businessId]);

  const handleRespondToReview = (reviewId: string) => {
    // Find the review to check if it already has a response
    const review = reviews.find((r) => r.id === reviewId);
    if (review?.businessResponse) {
      // Already responded - could show existing response
      return;
    }
    setRespondingToReviewId(reviewId);
    setResponseText('');
    setResponseError(null);
  };

  const handleSubmitResponse = async () => {
    if (!respondingToReviewId || !responseText.trim()) return;

    setIsSubmittingResponse(true);
    setResponseError(null);

    try {
      await reviewService.respondToReview(respondingToReviewId, responseText.trim());
      setRespondingToReviewId(null);
      setResponseText('');
      await fetchReviews();
    } catch (err) {
      setResponseError(
        err instanceof Error ? err.message : 'Failed to post response'
      );
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  const sortOptions = [
    { value: 'recent', label: t('reviews.sort.recent', 'Most Recent') },
    { value: 'helpful', label: t('reviews.sort.helpful', 'Most Helpful') },
    { value: 'rating_high', label: t('reviews.sort.ratingHigh', 'Highest Rating') },
    { value: 'rating_low', label: t('reviews.sort.ratingLow', 'Lowest Rating') },
  ];

  const totalPages = Math.ceil(total / limit);

  // Count reviews needing response
  const unrepliedCount = reviews.filter((r) => !r.businessResponse).length;

  if (businessLoading) {
    return (
      <PageContainer>
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton variant="rectangular" width="100%" height="40px" />
          <Skeleton variant="rectangular" width="100%" height="200px" />
        </div>
      </PageContainer>
    );
  }

  if (businessError || !business) {
    return (
      <PageContainer>
        <div className="max-w-4xl mx-auto">
          <Alert
            type="critical"
            message={businessError || 'Business not found'}
          />
          <Link
            to="/business/dashboard"
            className="inline-flex items-center gap-2 mt-4 text-primary hover:underline"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            {t('analytics.backToDashboard', 'Back to Dashboard')}
          </Link>
        </div>
      </PageContainer>
    );
  }

  return (
    <>
      <Helmet>
        <title>
          {t('owner.actions.reviews', 'Manage Reviews')} - {business.name}
        </title>
      </Helmet>

      <PageContainer>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link
              to="/business/dashboard"
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              aria-label={t('analytics.backToDashboard', 'Back to Dashboard')}
            >
              <ArrowLeftIcon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {t('owner.actions.reviews', 'Manage Reviews')}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {business.name}
              </p>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {t('reviews.totalReviews', { count: total, defaultValue: `${total} Reviews` })}
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {total}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {t('analytics.metrics.averageRating', 'Average Rating')}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {averageRating.toFixed(1)}
                </span>
                <StarRating value={averageRating} readOnly size="small" />
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {t('owner.reviewsNeedingResponse', 'Needs Response')}
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {unrepliedCount}
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && <Alert type="critical" message={error} />}

          {/* Sort Controls */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {t('owner.allReviews', 'All Reviews')}
            </h2>
            <Select
              id="review-sort"
              label={t('reviews.sortBy', 'Sort by')}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'recent' | 'helpful' | 'rating_high' | 'rating_low')}
              options={sortOptions}
              className="w-48"
            />
          </div>

          {/* Reviews List */}
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} variant="rectangular" width="100%" height="200px" />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-8 text-center">
              <p className="text-slate-600 dark:text-slate-400">
                {t('reviews.noReviews', 'No reviews yet')}
              </p>
            </div>
          ) : (
            <div className="space-y-4" role="list">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4"
                  role="listitem"
                >
                  <ReviewCard
                    id={review.id}
                    user={review.user}
                    rating={review.rating}
                    title={review.title}
                    content={review.content}
                    photos={review.photos}
                    businessResponse={
                      review.businessResponse
                        ? {
                            content: review.businessResponse.content,
                            respondedAt: new Date(review.businessResponse.respondedAt),
                          }
                        : undefined
                    }
                    helpfulCount={review.helpfulCount}
                    isMarkedHelpful={review.isMarkedHelpful}
                    isOwnReview={false}
                    createdAt={new Date(review.createdAt)}
                    updatedAt={review.updatedAt ? new Date(review.updatedAt) : undefined}
                    onMarkHelpful={() => toggleHelpful(review.id)}
                  />

                  {/* Respond Button for reviews without a response */}
                  {!review.businessResponse && (
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                      <button
                        type="button"
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                        onClick={() => handleRespondToReview(review.id)}
                      >
                        {t('owner.respondToReview', 'Respond to Review')}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      </PageContainer>

      {/* Response Modal */}
      <Modal
        isOpen={respondingToReviewId !== null}
        onClose={() => {
          setRespondingToReviewId(null);
          setResponseText('');
          setResponseError(null);
        }}
        title={t('owner.respondToReview', 'Respond to Review')}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {t(
              'owner.respondToReviewDescription',
              'Your response will be publicly visible below the review.'
            )}
          </p>

          {responseError && <Alert type="critical" message={responseError} />}

          <textarea
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent resize-y"
            rows={4}
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            placeholder={t(
              'owner.responsePlaceholder',
              'Write your response...'
            )}
            maxLength={1000}
            aria-label={t('owner.respondToReview', 'Respond to Review')}
          />

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {responseText.length}/1000
            </span>
            <div className="flex gap-3">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                onClick={() => {
                  setRespondingToReviewId(null);
                  setResponseText('');
                  setResponseError(null);
                }}
                disabled={isSubmittingResponse}
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                onClick={handleSubmitResponse}
                disabled={isSubmittingResponse || !responseText.trim()}
              >
                {isSubmittingResponse
                  ? t('common.submitting', 'Submitting...')
                  : t('owner.postResponse', 'Post Response')}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
