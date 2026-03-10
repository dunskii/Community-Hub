/**
 * ReviewCard Component Tests
 * Phase 6: User Engagement Features
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ReviewCard, ReviewCardProps } from './ReviewCard';

expect.extend(toHaveNoViolations);

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'reviews.edited': '(edited)',
        'reviews.reviewPhoto': 'Review photo',
        'reviews.showMorePhotos': `+${params?.count} more photos`,
        'reviews.businessResponse': 'Business Response',
        'reviews.helpful': 'Helpful',
        'reviews.markHelpful': 'Mark as helpful',
        'reviews.unmarkHelpful': 'Remove helpful mark',
        'reviews.report': 'Report',
        'common.edit': 'Edit',
        'common.delete': 'Delete',
        'time.justNow': 'Just now',
        'time.minutesAgo': `${params?.count} minutes ago`,
        'time.hoursAgo': `${params?.count} hours ago`,
        'time.daysAgo': `${params?.count} days ago`,
      };
      return translations[key] || key;
    },
    i18n: {
      language: 'en',
    },
  }),
}));

// Mock StarRating component
vi.mock('../StarRating', () => ({
  StarRating: ({ value, readOnly, size }: { value: number; readOnly: boolean; size: string }) => (
    <div data-testid="star-rating" data-value={value} data-readonly={readOnly} data-size={size}>
      Rating: {value} stars
    </div>
  ),
}));

// Mock Avatar component
vi.mock('../display/Avatar', () => ({
  Avatar: ({ src, alt, size }: { src?: string; alt: string; size: string }) => (
    <img data-testid="avatar" src={src || '/default-avatar.png'} alt={alt} data-size={size} />
  ),
}));

// Mock Badge component
vi.mock('../display/Badge', () => ({
  Badge: ({ children, variant, className }: { children: React.ReactNode; variant: string; className?: string }) => (
    <span data-testid="badge" data-variant={variant} className={className}>
      {children}
    </span>
  ),
}));

describe('ReviewCard', () => {
  const defaultProps: ReviewCardProps = {
    id: 'review-123',
    user: {
      id: 'user-456',
      name: 'John Doe',
      avatarUrl: '/avatars/john.jpg',
    },
    rating: 4,
    content: 'Great business with excellent service!',
    helpfulCount: 5,
    createdAt: new Date('2025-03-01T10:00:00Z'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render user information', () => {
      render(<ReviewCard {...defaultProps} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByTestId('avatar')).toHaveAttribute('src', '/avatars/john.jpg');
    });

    it('should render rating', () => {
      render(<ReviewCard {...defaultProps} />);

      const rating = screen.getByTestId('star-rating');
      expect(rating).toHaveAttribute('data-value', '4');
      expect(rating).toHaveAttribute('data-readonly', 'true');
    });

    it('should render review content', () => {
      render(<ReviewCard {...defaultProps} />);

      expect(screen.getByText('Great business with excellent service!')).toBeInTheDocument();
    });

    it('should render title when provided', () => {
      render(<ReviewCard {...defaultProps} title="Amazing Experience" />);

      expect(screen.getByText('Amazing Experience')).toBeInTheDocument();
    });

    it('should not render title when not provided', () => {
      render(<ReviewCard {...defaultProps} />);

      const titles = screen.queryAllByRole('heading', { level: 4 });
      expect(titles).toHaveLength(0);
    });

    it('should render creation date', () => {
      render(<ReviewCard {...defaultProps} />);

      // Should have a time element with datetime attribute
      const timeElement = screen.getByRole('time');
      expect(timeElement).toHaveAttribute('datetime');
    });

    it('should show edited indicator when updated', () => {
      const updatedDate = new Date('2025-03-02T10:00:00Z');
      render(<ReviewCard {...defaultProps} updatedAt={updatedDate} />);

      expect(screen.getByText('(edited)')).toBeInTheDocument();
    });

    it('should not show edited indicator when not updated', () => {
      render(<ReviewCard {...defaultProps} />);

      expect(screen.queryByText('(edited)')).not.toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<ReviewCard {...defaultProps} className="custom-review" />);

      expect(container.firstChild).toHaveClass('custom-review');
    });
  });

  describe('Photos Display', () => {
    const photosProps: ReviewCardProps = {
      ...defaultProps,
      photos: [
        { id: 'photo-1', url: '/photos/1.jpg', alt: 'Photo 1' },
        { id: 'photo-2', url: '/photos/2.jpg', alt: 'Photo 2' },
        { id: 'photo-3', url: '/photos/3.jpg', alt: 'Photo 3' },
        { id: 'photo-4', url: '/photos/4.jpg', alt: 'Photo 4' },
        { id: 'photo-5', url: '/photos/5.jpg', alt: 'Photo 5' },
      ],
    };

    it('should render photos when provided', () => {
      render(<ReviewCard {...photosProps} />);

      // Should show first 3 photos by default
      expect(screen.getByAltText('Photo 1')).toBeInTheDocument();
      expect(screen.getByAltText('Photo 2')).toBeInTheDocument();
      expect(screen.getByAltText('Photo 3')).toBeInTheDocument();
    });

    it('should limit displayed photos to 3 initially', () => {
      render(<ReviewCard {...photosProps} />);

      // Photos 4 and 5 should not be visible initially
      expect(screen.queryByAltText('Photo 4')).not.toBeInTheDocument();
      expect(screen.queryByAltText('Photo 5')).not.toBeInTheDocument();
    });

    it('should show "more photos" button when more than 3 photos', () => {
      render(<ReviewCard {...photosProps} />);

      const moreButton = screen.getByRole('button', { name: /more photos/i });
      expect(moreButton).toBeInTheDocument();
      expect(moreButton).toHaveTextContent('+2');
    });

    it('should show all photos when "more" button is clicked', async () => {
      const user = userEvent.setup();
      render(<ReviewCard {...photosProps} />);

      const moreButton = screen.getByRole('button', { name: /more photos/i });
      await user.click(moreButton);

      // All photos should now be visible
      expect(screen.getByAltText('Photo 4')).toBeInTheDocument();
      expect(screen.getByAltText('Photo 5')).toBeInTheDocument();
    });

    it('should use default alt text when not provided', () => {
      const propsWithoutAlt: ReviewCardProps = {
        ...defaultProps,
        photos: [{ id: 'photo-1', url: '/photos/1.jpg' }],
      };
      render(<ReviewCard {...propsWithoutAlt} />);

      expect(screen.getByAltText('Review photo')).toBeInTheDocument();
    });

    it('should not render photo section when no photos', () => {
      render(<ReviewCard {...defaultProps} />);

      const photos = screen.queryAllByRole('img', { name: /photo/i });
      // Avatar is also an img, so filter by alt containing 'photo'
      const reviewPhotos = photos.filter(img => img.getAttribute('alt')?.includes('photo'));
      expect(reviewPhotos).toHaveLength(0);
    });
  });

  describe('Business Response', () => {
    const responseProps: ReviewCardProps = {
      ...defaultProps,
      businessResponse: {
        content: 'Thank you for your feedback!',
        respondedAt: new Date('2025-03-02T14:00:00Z'),
      },
    };

    it('should render business response when provided', () => {
      render(<ReviewCard {...responseProps} />);

      expect(screen.getByText('Thank you for your feedback!')).toBeInTheDocument();
      expect(screen.getByText('Business Response')).toBeInTheDocument();
    });

    it('should show response badge', () => {
      render(<ReviewCard {...responseProps} />);

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveAttribute('data-variant', 'info');
    });

    it('should show response date', () => {
      render(<ReviewCard {...responseProps} />);

      const timeElements = screen.getAllByRole('time');
      // Second time element should be the response date
      expect(timeElements.length).toBeGreaterThanOrEqual(2);
    });

    it('should not render response section when no response', () => {
      render(<ReviewCard {...defaultProps} />);

      expect(screen.queryByText('Business Response')).not.toBeInTheDocument();
    });
  });

  describe('Helpful Button', () => {
    it('should render helpful button when onMarkHelpful is provided', () => {
      const onMarkHelpful = vi.fn();
      render(<ReviewCard {...defaultProps} onMarkHelpful={onMarkHelpful} />);

      expect(screen.getByRole('button', { name: /helpful/i })).toBeInTheDocument();
    });

    it('should display helpful count', () => {
      render(<ReviewCard {...defaultProps} onMarkHelpful={vi.fn()} />);

      expect(screen.getByText(/Helpful \(5\)/)).toBeInTheDocument();
    });

    it('should call onMarkHelpful when clicked', async () => {
      const user = userEvent.setup();
      const onMarkHelpful = vi.fn();
      render(<ReviewCard {...defaultProps} onMarkHelpful={onMarkHelpful} />);

      await user.click(screen.getByRole('button', { name: /helpful/i }));

      expect(onMarkHelpful).toHaveBeenCalledTimes(1);
    });

    it('should have aria-pressed true when marked helpful', () => {
      render(
        <ReviewCard
          {...defaultProps}
          onMarkHelpful={vi.fn()}
          isMarkedHelpful={true}
        />
      );

      const helpfulButton = screen.getByRole('button', { name: /helpful/i });
      expect(helpfulButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should have aria-pressed false when not marked helpful', () => {
      render(
        <ReviewCard
          {...defaultProps}
          onMarkHelpful={vi.fn()}
          isMarkedHelpful={false}
        />
      );

      const helpfulButton = screen.getByRole('button', { name: /helpful/i });
      expect(helpfulButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('should have active class when marked helpful', () => {
      render(
        <ReviewCard
          {...defaultProps}
          onMarkHelpful={vi.fn()}
          isMarkedHelpful={true}
        />
      );

      const helpfulButton = screen.getByRole('button', { name: /helpful/i });
      expect(helpfulButton).toHaveClass('review-card__action--active');
    });

    it('should not render helpful button when onMarkHelpful not provided', () => {
      render(<ReviewCard {...defaultProps} />);

      expect(screen.queryByRole('button', { name: /helpful/i })).not.toBeInTheDocument();
    });
  });

  describe('Edit and Delete Actions (Own Review)', () => {
    it('should show edit button for own review', () => {
      render(
        <ReviewCard
          {...defaultProps}
          isOwnReview={true}
          onEdit={vi.fn()}
        />
      );

      expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    });

    it('should show delete button for own review', () => {
      render(
        <ReviewCard
          {...defaultProps}
          isOwnReview={true}
          onDelete={vi.fn()}
        />
      );

      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });

    it('should call onEdit when edit button clicked', async () => {
      const user = userEvent.setup();
      const onEdit = vi.fn();
      render(
        <ReviewCard
          {...defaultProps}
          isOwnReview={true}
          onEdit={onEdit}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Edit' }));

      expect(onEdit).toHaveBeenCalledTimes(1);
    });

    it('should call onDelete when delete button clicked', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      render(
        <ReviewCard
          {...defaultProps}
          isOwnReview={true}
          onDelete={onDelete}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Delete' }));

      expect(onDelete).toHaveBeenCalledTimes(1);
    });

    it('should not show edit/delete for non-own reviews', () => {
      render(
        <ReviewCard
          {...defaultProps}
          isOwnReview={false}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
    });
  });

  describe('Report Action (Other Reviews)', () => {
    it('should show report button for non-own reviews', () => {
      render(
        <ReviewCard
          {...defaultProps}
          isOwnReview={false}
          onReport={vi.fn()}
        />
      );

      expect(screen.getByRole('button', { name: 'Report' })).toBeInTheDocument();
    });

    it('should call onReport when report button clicked', async () => {
      const user = userEvent.setup();
      const onReport = vi.fn();
      render(
        <ReviewCard
          {...defaultProps}
          isOwnReview={false}
          onReport={onReport}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Report' }));

      expect(onReport).toHaveBeenCalledTimes(1);
    });

    it('should not show report button for own reviews', () => {
      render(
        <ReviewCard
          {...defaultProps}
          isOwnReview={true}
          onReport={vi.fn()}
        />
      );

      expect(screen.queryByRole('button', { name: 'Report' })).not.toBeInTheDocument();
    });
  });

  describe('Article Semantics', () => {
    it('should render as article element', () => {
      render(<ReviewCard {...defaultProps} />);

      expect(screen.getByRole('article')).toBeInTheDocument();
    });

    it('should have aria-labelledby pointing to title', () => {
      render(<ReviewCard {...defaultProps} title="Great Experience" />);

      const article = screen.getByRole('article');
      expect(article).toHaveAttribute('aria-labelledby', 'review-review-123-title');
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations (basic review)', async () => {
      const { container } = render(<ReviewCard {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations (with title)', async () => {
      const { container } = render(
        <ReviewCard {...defaultProps} title="Great Service" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations (with photos)', async () => {
      const { container } = render(
        <ReviewCard
          {...defaultProps}
          photos={[
            { id: 'photo-1', url: '/photos/1.jpg', alt: 'Business exterior' },
          ]}
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations (with business response)', async () => {
      const { container } = render(
        <ReviewCard
          {...defaultProps}
          businessResponse={{
            content: 'Thank you!',
            respondedAt: new Date(),
          }}
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations (with all actions)', async () => {
      const { container } = render(
        <ReviewCard
          {...defaultProps}
          isOwnReview={true}
          onMarkHelpful={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      const onMarkHelpful = vi.fn();
      render(
        <ReviewCard
          {...defaultProps}
          isOwnReview={true}
          onMarkHelpful={onMarkHelpful}
          onEdit={vi.fn()}
        />
      );

      // Tab through interactive elements
      await user.tab();
      expect(document.activeElement).toHaveAttribute('aria-label');
    });
  });

  describe('Date Formatting', () => {
    it('should display relative time for recent reviews', () => {
      // Create a date 30 minutes ago
      const thirtyMinutesAgo = new Date();
      thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30);

      render(<ReviewCard {...defaultProps} createdAt={thirtyMinutesAgo} />);

      // Should show relative time
      const timeElement = screen.getByRole('time');
      expect(timeElement).toBeInTheDocument();
    });

    it('should have ISO datetime attribute', () => {
      render(<ReviewCard {...defaultProps} />);

      const timeElement = screen.getByRole('time');
      expect(timeElement.getAttribute('datetime')).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });
});
