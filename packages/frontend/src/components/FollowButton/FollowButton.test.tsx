/**
 * FollowButton Component Tests
 * Phase 6: User Engagement Features
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { FollowButton, FollowButtonProps } from './FollowButton';

expect.extend(toHaveNoViolations);

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'common.loading': 'Loading...',
        'follow.follow': 'Follow',
        'follow.following': 'Following',
        'follow.followerCount': `${params?.count} followers`,
      };
      return translations[key] || key;
    },
  }),
}));

describe('FollowButton', () => {
  const defaultProps: FollowButtonProps = {
    isFollowing: false,
    onClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render Follow text when not following', () => {
      render(<FollowButton {...defaultProps} />);

      expect(screen.getByText('Follow')).toBeInTheDocument();
    });

    it('should render Following text when following', () => {
      render(<FollowButton {...defaultProps} isFollowing={true} />);

      expect(screen.getByText('Following')).toBeInTheDocument();
    });

    it('should render + icon when not following', () => {
      render(<FollowButton {...defaultProps} />);

      expect(screen.getByText('+')).toBeInTheDocument();
    });

    it('should render checkmark icon when following', () => {
      render(<FollowButton {...defaultProps} isFollowing={true} />);

      expect(screen.getByText('✓')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <FollowButton {...defaultProps} className="custom-follow" />
      );

      expect(container.firstChild).toHaveClass('custom-follow');
    });
  });

  describe('Variants', () => {
    it('should apply primary variant class by default', () => {
      render(<FollowButton {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('follow-button--primary');
    });

    it('should apply secondary variant class', () => {
      render(<FollowButton {...defaultProps} variant="secondary" />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('follow-button--secondary');
    });

    it('should apply text variant class', () => {
      render(<FollowButton {...defaultProps} variant="text" />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('follow-button--text');
    });
  });

  describe('Sizes', () => {
    it('should apply medium size class by default', () => {
      render(<FollowButton {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('follow-button--medium');
    });

    it('should apply small size class', () => {
      render(<FollowButton {...defaultProps} size="small" />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('follow-button--small');
    });

    it('should apply large size class', () => {
      render(<FollowButton {...defaultProps} size="large" />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('follow-button--large');
    });
  });

  describe('Click Handling', () => {
    it('should call onClick when clicked', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(<FollowButton {...defaultProps} onClick={onClick} />);

      await user.click(screen.getByRole('button'));

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should handle async onClick', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn().mockResolvedValue(undefined);
      render(<FollowButton {...defaultProps} onClick={onClick} />);

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(onClick).toHaveBeenCalledTimes(1);
      });
    });

    it('should not call onClick when disabled', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(<FollowButton {...defaultProps} onClick={onClick} disabled={true} />);

      await user.click(screen.getByRole('button'));

      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should show loading text during async operation', async () => {
      const user = userEvent.setup();
      let resolveClick: () => void;
      const onClick = vi.fn().mockImplementation(
        () => new Promise<void>((resolve) => {
          resolveClick = resolve;
        })
      );

      render(<FollowButton {...defaultProps} onClick={onClick} />);

      await user.click(screen.getByRole('button'));

      // During loading
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Resolve the promise
      resolveClick!();

      await waitFor(() => {
        expect(screen.getByText('Follow')).toBeInTheDocument();
      });
    });

    it('should disable button during loading', async () => {
      const user = userEvent.setup();
      let resolveClick: () => void;
      const onClick = vi.fn().mockImplementation(
        () => new Promise<void>((resolve) => {
          resolveClick = resolve;
        })
      );

      render(<FollowButton {...defaultProps} onClick={onClick} />);

      await user.click(screen.getByRole('button'));

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();

      // Resolve to cleanup
      resolveClick!();
      await waitFor(() => {
        expect(button).not.toBeDisabled();
      });
    });

    it('should apply loading class during loading', async () => {
      const user = userEvent.setup();
      let resolveClick: () => void;
      const onClick = vi.fn().mockImplementation(
        () => new Promise<void>((resolve) => {
          resolveClick = resolve;
        })
      );

      render(<FollowButton {...defaultProps} onClick={onClick} />);

      await user.click(screen.getByRole('button'));

      const button = screen.getByRole('button');
      expect(button).toHaveClass('follow-button--loading');

      // Resolve to cleanup
      resolveClick!();
      await waitFor(() => {
        expect(button).not.toHaveClass('follow-button--loading');
      });
    });

    it('should prevent multiple clicks during loading', async () => {
      const user = userEvent.setup();
      let resolveClick: () => void;
      const onClick = vi.fn().mockImplementation(
        () => new Promise<void>((resolve) => {
          resolveClick = resolve;
        })
      );

      render(<FollowButton {...defaultProps} onClick={onClick} />);

      // Click multiple times rapidly
      await user.click(screen.getByRole('button'));
      await user.click(screen.getByRole('button'));
      await user.click(screen.getByRole('button'));

      // Should only be called once
      expect(onClick).toHaveBeenCalledTimes(1);

      // Resolve to cleanup
      resolveClick!();
    });

    it('should reset loading state after onClick completes (success or error)', async () => {
      const user = userEvent.setup();
      let resolveClick: () => void;
      const onClick = vi.fn().mockImplementation(
        () => new Promise<void>((resolve) => {
          resolveClick = resolve;
        })
      );

      render(<FollowButton {...defaultProps} onClick={onClick} />);

      // Click to start loading
      await user.click(screen.getByRole('button'));

      // Should be in loading state
      expect(screen.getByRole('button')).toBeDisabled();

      // Resolve the promise
      resolveClick!();

      // Should reset to normal state
      await waitFor(() => {
        expect(screen.getByText('Follow')).toBeInTheDocument();
        expect(screen.getByRole('button')).not.toBeDisabled();
      });
    });
  });

  describe('Follower Count', () => {
    it('should display follower count when provided', () => {
      render(<FollowButton {...defaultProps} followerCount={100} />);

      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('should format count with K for thousands', () => {
      render(<FollowButton {...defaultProps} followerCount={1500} />);

      expect(screen.getByText('1.5K')).toBeInTheDocument();
    });

    it('should format count with M for millions', () => {
      render(<FollowButton {...defaultProps} followerCount={2500000} />);

      expect(screen.getByText('2.5M')).toBeInTheDocument();
    });

    it('should not display count when zero', () => {
      render(<FollowButton {...defaultProps} followerCount={0} />);

      // Should not have a count element
      const countElements = screen.queryAllByLabelText(/followers/i);
      expect(countElements).toHaveLength(0);
    });

    it('should not display count when undefined', () => {
      render(<FollowButton {...defaultProps} />);

      const countElements = screen.queryAllByLabelText(/followers/i);
      expect(countElements).toHaveLength(0);
    });

    it('should have aria-label for follower count', () => {
      render(<FollowButton {...defaultProps} followerCount={50} />);

      expect(screen.getByLabelText(/50 followers/i)).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<FollowButton {...defaultProps} disabled={true} />);

      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should not be disabled when disabled prop is false', () => {
      render(<FollowButton {...defaultProps} disabled={false} />);

      expect(screen.getByRole('button')).not.toBeDisabled();
    });
  });

  describe('Following State Classes', () => {
    it('should apply following class when following', () => {
      render(<FollowButton {...defaultProps} isFollowing={true} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('follow-button--following');
    });

    it('should not apply following class when not following', () => {
      render(<FollowButton {...defaultProps} isFollowing={false} />);

      const button = screen.getByRole('button');
      expect(button).not.toHaveClass('follow-button--following');
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations (not following)', async () => {
      const { container } = render(<FollowButton {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations (following)', async () => {
      const { container } = render(
        <FollowButton {...defaultProps} isFollowing={true} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations (with follower count)', async () => {
      const { container } = render(
        <FollowButton {...defaultProps} followerCount={100} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations (disabled)', async () => {
      const { container } = render(
        <FollowButton {...defaultProps} disabled={true} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have appropriate aria-label', () => {
      render(<FollowButton {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Follow');
    });

    it('should have aria-pressed attribute', () => {
      const { rerender } = render(<FollowButton {...defaultProps} />);

      let button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-pressed', 'false');

      rerender(<FollowButton {...defaultProps} isFollowing={true} />);

      button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-pressed', 'true');
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(<FollowButton {...defaultProps} onClick={onClick} />);

      await user.tab();
      expect(screen.getByRole('button')).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(onClick).toHaveBeenCalled();
    });

    it('should be activatable with Space key', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(<FollowButton {...defaultProps} onClick={onClick} />);

      await user.tab();
      await user.keyboard(' ');

      expect(onClick).toHaveBeenCalled();
    });
  });

  describe('Button Type', () => {
    it('should have type button to prevent form submission', () => {
      render(<FollowButton {...defaultProps} />);

      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });
  });

  describe('Icon Visibility', () => {
    it('should hide icon from assistive technologies', () => {
      render(<FollowButton {...defaultProps} />);

      const icon = screen.getByText('+');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });
});
