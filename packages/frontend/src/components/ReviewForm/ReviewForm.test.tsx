/**
 * ReviewForm Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { ReviewForm } from './ReviewForm';

// Mock platform config
vi.mock('@community-hub/shared', () => ({
  getPlatformConfig: () => ({
    limits: {
      minReviewLength: 50,
      maxReviewLength: 1000,
      maxReviewPhotos: 3,
    },
    features: {
      reviewPhotos: true,
    },
  }),
}));

describe('ReviewForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
    mockOnCancel.mockClear();
  });

  describe('Rendering', () => {
    it('should render all form fields', () => {
      render(<ReviewForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByLabelText(/your rating/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/your review/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit review/i })).toBeInTheDocument();
    });

    it('should render with initial data when editing', () => {
      const initialData = {
        rating: 4,
        title: 'Great experience',
        content: 'This business exceeded my expectations. The service was excellent and the staff was very friendly.',
      };

      render(
        <ReviewForm
          initialData={initialData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByDisplayValue('Great experience')).toBeInTheDocument();
      expect(screen.getByDisplayValue(/exceeded my expectations/i)).toBeInTheDocument();
    });

    it('should show error message when provided', () => {
      render(
        <ReviewForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          error="Failed to submit review"
        />
      );

      expect(screen.getByText('Failed to submit review')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should require rating selection', async () => {
      const user = userEvent.setup();
      render(<ReviewForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const submitButton = screen.getByRole('button', { name: /submit review/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/please select a rating/i)).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should enforce minimum content length', async () => {
      const user = userEvent.setup();
      render(<ReviewForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      // Select rating
      const stars = screen.getAllByRole('button', { name: /out of 5/i });
      await user.click(stars[3]);

      // Enter short content (less than 50 chars)
      const contentField = screen.getByLabelText(/your review/i);
      await user.type(contentField, 'Too short');

      const submitButton = screen.getByRole('button', { name: /submit review/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/must be at least 50 characters/i)).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should enforce maximum content length', async () => {
      const user = userEvent.setup();
      render(<ReviewForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      // Select rating
      const stars = screen.getAllByRole('button', { name: /out of 5/i });
      await user.click(stars[3]);

      // Enter content exceeding max length
      const longContent = 'a'.repeat(1001);
      const contentField = screen.getByLabelText(/your review/i);
      await user.type(contentField, longContent);

      const submitButton = screen.getByRole('button', { name: /submit review/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/must not exceed 1000 characters/i)).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should show character count', async () => {
      const user = userEvent.setup();
      render(<ReviewForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const contentField = screen.getByLabelText(/your review/i);
      await user.type(contentField, 'This is a test review content.');

      expect(screen.getByText(/\d+ \/ 1000 characters/i)).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      render(<ReviewForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      // Select rating
      const stars = screen.getAllByRole('button', { name: /out of 5/i });
      await user.click(stars[4]);

      // Enter title
      const titleField = screen.getByLabelText(/title/i);
      await user.type(titleField, 'Excellent service');

      // Enter content
      const contentField = screen.getByLabelText(/your review/i);
      await user.type(
        contentField,
        'This business provided exceptional service. The staff was friendly and professional. Highly recommended!'
      );

      // Submit
      const submitButton = screen.getByRole('button', { name: /submit review/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          rating: 5,
          title: 'Excellent service',
          content: expect.stringContaining('exceptional service'),
          photos: undefined,
        });
      });
    });

    it('should submit without title (optional field)', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      render(<ReviewForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      // Select rating
      const stars = screen.getAllByRole('button', { name: /out of 5/i });
      await user.click(stars[2]);

      // Enter content only
      const contentField = screen.getByLabelText(/your review/i);
      await user.type(
        contentField,
        'Good business with friendly staff. Would visit again for sure!'
      );

      // Submit
      const submitButton = screen.getByRole('button', { name: /submit review/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          rating: 3,
          title: undefined,
          content: expect.stringContaining('Good business'),
          photos: undefined,
        });
      });
    });

    it('should disable submit button while loading', async () => {
      render(
        <ReviewForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isLoading={true} />
      );

      const submitButton = screen.getByRole('button', { name: /submitting/i });
      expect(submitButton).toBeDisabled();
    });

    it('should disable submit button when form is invalid', () => {
      render(<ReviewForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const submitButton = screen.getByRole('button', { name: /submit review/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Cancel Button', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<ReviewForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Photo Upload', () => {
    it('should render photo upload field when feature is enabled', () => {
      render(<ReviewForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByText(/add photos/i)).toBeInTheDocument();
    });

    it('should show max photos limit in help text', () => {
      render(<ReviewForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByText(/add up to 3 photos/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <ReviewForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper labels for all form fields', () => {
      render(<ReviewForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByLabelText(/your rating/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/your review/i)).toBeInTheDocument();
    });

    it('should mark required fields with asterisk', () => {
      render(<ReviewForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      // Rating is required
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should show validation errors with role="alert"', async () => {
      const user = userEvent.setup();
      render(<ReviewForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const submitButton = screen.getByRole('button', { name: /submit review/i });
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByRole('alert');
        expect(errorMessage).toBeInTheDocument();
      });
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should render properly on mobile viewport', () => {
      global.innerWidth = 375;
      global.innerHeight = 667;

      const { container } = render(
        <ReviewForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      expect(container.firstChild).toHaveClass('review-form');
    });
  });
});
