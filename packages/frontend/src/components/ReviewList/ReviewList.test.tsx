/**
 * ReviewList Component Tests
 * Phase 6: User Engagement Features
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ReviewList, ReviewListProps, Review } from './ReviewList';

expect.extend(toHaveNoViolations);

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'reviews.noReviews': 'No Reviews Yet',
        'reviews.noReviewsDescription': 'Be the first to leave a review!',
        'reviews.totalReviews': `${params?.count} Reviews`,
        'reviews.sortBy': 'Sort by',
        'reviews.sort.recent': 'Most Recent',
        'reviews.sort.helpful': 'Most Helpful',
        'reviews.sort.ratingHigh': 'Highest Rated',
        'reviews.sort.ratingLow': 'Lowest Rated',
      };
      return translations[key] || key;
    },
    i18n: {
      language: 'en',
    },
  }),
}));

// Mock ReviewCard component
vi.mock('../ReviewCard', () => ({
  ReviewCard: ({
    id,
    user,
    rating,
    content,
    onMarkHelpful,
    onEdit,
    onDelete,
    onReport,
  }: any) => (
    <div data-testid={`review-card-${id}`} data-rating={rating}>
      <span data-testid="review-user">{user.name}</span>
      <span data-testid="review-content">{content}</span>
      {onMarkHelpful && (
        <button onClick={onMarkHelpful} data-testid={`helpful-${id}`}>
          Helpful
        </button>
      )}
      {onEdit && (
        <button onClick={onEdit} data-testid={`edit-${id}`}>
          Edit
        </button>
      )}
      {onDelete && (
        <button onClick={onDelete} data-testid={`delete-${id}`}>
          Delete
        </button>
      )}
      {onReport && (
        <button onClick={onReport} data-testid={`report-${id}`}>
          Report
        </button>
      )}
    </div>
  ),
}));

// Mock Pagination component
vi.mock('../display/Pagination', () => ({
  Pagination: ({
    currentPage,
    totalPages,
    onPageChange,
  }: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  }) => (
    <div data-testid="pagination">
      <span data-testid="current-page">{currentPage}</span>
      <span data-testid="total-pages">{totalPages}</span>
      <button onClick={() => onPageChange(currentPage - 1)} data-testid="prev-page">
        Previous
      </button>
      <button onClick={() => onPageChange(currentPage + 1)} data-testid="next-page">
        Next
      </button>
    </div>
  ),
}));

// Mock EmptyState component
vi.mock('../display/EmptyState', () => ({
  EmptyState: ({
    icon,
    title,
    description,
  }: {
    icon: string;
    title: string;
    description: string;
  }) => (
    <div data-testid="empty-state">
      <span data-testid="empty-icon">{icon}</span>
      <h2 data-testid="empty-title">{title}</h2>
      <p data-testid="empty-description">{description}</p>
    </div>
  ),
}));

// Mock Skeleton component
vi.mock('../display/Skeleton', () => ({
  Skeleton: ({ width, height }: { width: number | string; height: number }) => (
    <div data-testid="skeleton" style={{ width, height }} />
  ),
}));

// Mock Select component
vi.mock('../form/Select', () => ({
  Select: ({
    id,
    label,
    value,
    onChange,
    options,
  }: {
    id: string;
    label: string;
    value: string;
    onChange: (e: { target: { value: string } }) => void;
    options: Array<{ value: string; label: string }>;
  }) => (
    <div data-testid="sort-select">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        value={value}
        onChange={onChange}
        data-testid="sort-dropdown"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  ),
}));

describe('ReviewList', () => {
  const createMockReviews = (count: number): Review[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `review-${i + 1}`,
      user: {
        id: `user-${i + 1}`,
        name: `User ${i + 1}`,
      },
      rating: (i % 5) + 1,
      content: `Review content ${i + 1}`,
      helpfulCount: i * 2,
      createdAt: new Date(`2025-03-${String(i + 1).padStart(2, '0')}T10:00:00Z`),
    }));
  };

  const defaultProps: ReviewListProps = {
    reviews: createMockReviews(5),
    total: 15,
    page: 1,
    limit: 5,
    sortBy: 'recent',
    onPageChange: vi.fn(),
    onSortChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render review list', () => {
      render(<ReviewList {...defaultProps} />);

      expect(screen.getByTestId('review-card-review-1')).toBeInTheDocument();
      expect(screen.getByTestId('review-card-review-5')).toBeInTheDocument();
    });

    it('should render total count', () => {
      render(<ReviewList {...defaultProps} />);

      expect(screen.getByText('15 Reviews')).toBeInTheDocument();
    });

    it('should render sort dropdown', () => {
      render(<ReviewList {...defaultProps} />);

      expect(screen.getByTestId('sort-select')).toBeInTheDocument();
    });

    it('should render all reviews in list', () => {
      render(<ReviewList {...defaultProps} />);

      defaultProps.reviews.forEach((review) => {
        expect(screen.getByTestId(`review-card-${review.id}`)).toBeInTheDocument();
      });
    });

    it('should apply custom className', () => {
      const { container } = render(
        <ReviewList {...defaultProps} className="custom-reviews" />
      );

      expect(container.firstChild).toHaveClass('custom-reviews');
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no reviews', () => {
      render(<ReviewList {...defaultProps} reviews={[]} total={0} />);

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByTestId('empty-title')).toHaveTextContent('No Reviews Yet');
      expect(screen.getByTestId('empty-description')).toHaveTextContent(
        'Be the first to leave a review!'
      );
    });

    it('should show notepad icon in empty state', () => {
      render(<ReviewList {...defaultProps} reviews={[]} total={0} />);

      expect(screen.getByTestId('empty-icon')).toHaveTextContent('📝');
    });

    it('should not show pagination in empty state', () => {
      render(<ReviewList {...defaultProps} reviews={[]} total={0} />);

      expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show skeleton loading when isLoading is true', () => {
      render(<ReviewList {...defaultProps} isLoading={true} />);

      const skeletons = screen.getAllByTestId('skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should show correct number of skeleton items', () => {
      render(<ReviewList {...defaultProps} isLoading={true} limit={5} />);

      // Should show limit number of skeleton items plus header skeletons
      const skeletons = screen.getAllByTestId('skeleton');
      // 2 header skeletons + 5 review skeletons
      expect(skeletons).toHaveLength(7);
    });

    it('should not show reviews when loading', () => {
      render(<ReviewList {...defaultProps} isLoading={true} />);

      expect(screen.queryByTestId('review-card-review-1')).not.toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('should display current sort option', () => {
      render(<ReviewList {...defaultProps} sortBy="recent" />);

      const select = screen.getByTestId('sort-dropdown');
      expect(select).toHaveValue('recent');
    });

    it('should call onSortChange when sort option changes', async () => {
      const user = userEvent.setup();
      const onSortChange = vi.fn();
      render(<ReviewList {...defaultProps} onSortChange={onSortChange} />);

      const select = screen.getByTestId('sort-dropdown');
      await user.selectOptions(select, 'helpful');

      expect(onSortChange).toHaveBeenCalledWith('helpful');
    });

    it('should show all sort options', () => {
      render(<ReviewList {...defaultProps} />);

      const select = screen.getByTestId('sort-dropdown');
      const options = within(select).getAllByRole('option');

      expect(options).toHaveLength(4);
      expect(options[0]).toHaveValue('recent');
      expect(options[1]).toHaveValue('helpful');
      expect(options[2]).toHaveValue('rating_high');
      expect(options[3]).toHaveValue('rating_low');
    });
  });

  describe('Pagination', () => {
    it('should show pagination when multiple pages', () => {
      render(<ReviewList {...defaultProps} />);

      expect(screen.getByTestId('pagination')).toBeInTheDocument();
    });

    it('should not show pagination when single page', () => {
      render(<ReviewList {...defaultProps} total={5} limit={10} />);

      expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
    });

    it('should display correct current page', () => {
      render(<ReviewList {...defaultProps} page={2} />);

      expect(screen.getByTestId('current-page')).toHaveTextContent('2');
    });

    it('should display correct total pages', () => {
      render(<ReviewList {...defaultProps} total={15} limit={5} />);

      expect(screen.getByTestId('total-pages')).toHaveTextContent('3');
    });

    it('should call onPageChange when page changes', async () => {
      const user = userEvent.setup();
      const onPageChange = vi.fn();
      render(<ReviewList {...defaultProps} onPageChange={onPageChange} page={2} />);

      await user.click(screen.getByTestId('next-page'));

      expect(onPageChange).toHaveBeenCalledWith(3);
    });
  });

  describe('Review Actions', () => {
    it('should pass onMarkHelpful to ReviewCard', async () => {
      const user = userEvent.setup();
      const onMarkHelpful = vi.fn();
      render(<ReviewList {...defaultProps} onMarkHelpful={onMarkHelpful} />);

      await user.click(screen.getByTestId('helpful-review-1'));

      expect(onMarkHelpful).toHaveBeenCalledWith('review-1');
    });

    it('should pass onEdit to own reviews', async () => {
      const user = userEvent.setup();
      const onEdit = vi.fn();
      const reviewsWithOwn: Review[] = [
        {
          ...defaultProps.reviews[0],
          isOwnReview: true,
        },
      ];
      render(
        <ReviewList
          {...defaultProps}
          reviews={reviewsWithOwn}
          total={1}
          onEdit={onEdit}
        />
      );

      await user.click(screen.getByTestId('edit-review-1'));

      expect(onEdit).toHaveBeenCalledWith('review-1');
    });

    it('should not pass onEdit to non-own reviews', () => {
      const onEdit = vi.fn();
      const reviewsNotOwn: Review[] = [
        {
          ...defaultProps.reviews[0],
          isOwnReview: false,
        },
      ];
      render(
        <ReviewList
          {...defaultProps}
          reviews={reviewsNotOwn}
          total={1}
          onEdit={onEdit}
        />
      );

      expect(screen.queryByTestId('edit-review-1')).not.toBeInTheDocument();
    });

    it('should pass onDelete to own reviews', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      const reviewsWithOwn: Review[] = [
        {
          ...defaultProps.reviews[0],
          isOwnReview: true,
        },
      ];
      render(
        <ReviewList
          {...defaultProps}
          reviews={reviewsWithOwn}
          total={1}
          onDelete={onDelete}
        />
      );

      await user.click(screen.getByTestId('delete-review-1'));

      expect(onDelete).toHaveBeenCalledWith('review-1');
    });

    it('should pass onReport to non-own reviews', async () => {
      const user = userEvent.setup();
      const onReport = vi.fn();
      const reviewsNotOwn: Review[] = [
        {
          ...defaultProps.reviews[0],
          isOwnReview: false,
        },
      ];
      render(
        <ReviewList
          {...defaultProps}
          reviews={reviewsNotOwn}
          total={1}
          onReport={onReport}
        />
      );

      await user.click(screen.getByTestId('report-review-1'));

      expect(onReport).toHaveBeenCalledWith('review-1');
    });

    it('should not pass onReport to own reviews', () => {
      const onReport = vi.fn();
      const reviewsWithOwn: Review[] = [
        {
          ...defaultProps.reviews[0],
          isOwnReview: true,
        },
      ];
      render(
        <ReviewList
          {...defaultProps}
          reviews={reviewsWithOwn}
          total={1}
          onReport={onReport}
        />
      );

      expect(screen.queryByTestId('report-review-1')).not.toBeInTheDocument();
    });
  });

  describe('List Semantics', () => {
    it('should have list role', () => {
      render(<ReviewList {...defaultProps} />);

      expect(screen.getByRole('list')).toBeInTheDocument();
    });

    it('should have listitem role for each review', () => {
      render(<ReviewList {...defaultProps} />);

      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(defaultProps.reviews.length);
    });
  });

  describe('Total Pages Calculation', () => {
    it('should calculate total pages correctly', () => {
      render(<ReviewList {...defaultProps} total={23} limit={5} />);

      // 23 / 5 = 4.6 -> ceil = 5
      expect(screen.getByTestId('total-pages')).toHaveTextContent('5');
    });

    it('should handle exact division', () => {
      render(<ReviewList {...defaultProps} total={20} limit={5} />);

      expect(screen.getByTestId('total-pages')).toHaveTextContent('4');
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<ReviewList {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations in empty state', async () => {
      const { container } = render(
        <ReviewList {...defaultProps} reviews={[]} total={0} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations in loading state', async () => {
      const { container } = render(
        <ReviewList {...defaultProps} isLoading={true} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have heading for review count', () => {
      render(<ReviewList {...defaultProps} />);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('15 Reviews');
    });
  });

  describe('Review Content Display', () => {
    it('should display review user names', () => {
      render(<ReviewList {...defaultProps} />);

      expect(screen.getByText('User 1')).toBeInTheDocument();
      expect(screen.getByText('User 5')).toBeInTheDocument();
    });

    it('should display review content', () => {
      render(<ReviewList {...defaultProps} />);

      expect(screen.getByText('Review content 1')).toBeInTheDocument();
      expect(screen.getByText('Review content 5')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle single review', () => {
      render(<ReviewList {...defaultProps} reviews={[defaultProps.reviews[0]]} total={1} />);

      expect(screen.getByTestId('review-card-review-1')).toBeInTheDocument();
      expect(screen.getByText('1 Reviews')).toBeInTheDocument();
    });

    it('should handle large page numbers', () => {
      render(<ReviewList {...defaultProps} page={100} total={1000} />);

      expect(screen.getByTestId('current-page')).toHaveTextContent('100');
    });
  });
});
