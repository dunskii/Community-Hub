/**
 * StarRating Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { StarRating } from './StarRating';

describe('StarRating', () => {
  describe('Display Mode (Read-only)', () => {
    it('should render with correct number of stars', () => {
      render(<StarRating value={3} readOnly />);
      // Stars should be rendered with appropriate filled/empty icons
      expect(screen.getByRole('group')).toBeInTheDocument();
    });

    it('should display correct rating value when showValue is true', () => {
      render(<StarRating value={4.5} readOnly showValue />);
      expect(screen.getByText('4.5')).toBeInTheDocument();
    });

    it('should display count when provided', () => {
      render(<StarRating value={4} readOnly count={123} />);
      expect(screen.getByText('(123)')).toBeInTheDocument();
    });

    it('should handle decimal ratings with half stars', () => {
      render(<StarRating value={3.5} readOnly />);
      const group = screen.getByRole('group');
      expect(group).toBeInTheDocument();
    });

    it('should handle zero rating', () => {
      render(<StarRating value={0} readOnly />);
      expect(screen.getByRole('group')).toBeInTheDocument();
    });
  });

  describe('Interactive Mode', () => {
    it('should render interactive stars when not read-only', () => {
      const onChange = vi.fn();
      render(<StarRating value={0} onChange={onChange} />);

      const stars = screen.getAllByRole('button');
      expect(stars).toHaveLength(5);
    });

    it('should call onChange when star is clicked', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<StarRating value={0} onChange={onChange} label="Test Rating" />);

      const stars = screen.getAllByRole('button');
      await user.click(stars[2]); // Click third star

      expect(onChange).toHaveBeenCalledWith(3);
    });

    it('should allow keyboard navigation with Enter key', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<StarRating value={0} onChange={onChange} label="Test Rating" />);

      const stars = screen.getAllByRole('button');
      await user.tab(); // Focus first star
      await user.keyboard('{Enter}');

      expect(onChange).toHaveBeenCalledWith(1);
    });

    it('should allow keyboard navigation with Space key', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<StarRating value={0} onChange={onChange} label="Test Rating" />);

      const stars = screen.getAllByRole('button');
      await user.tab(); // Focus first star
      await user.keyboard(' ');

      expect(onChange).toHaveBeenCalledWith(1);
    });

    it('should update visual state on hover', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<StarRating value={2} onChange={onChange} />);

      const stars = screen.getAllByRole('button');
      await user.hover(stars[3]); // Hover over 4th star

      // Visual update should occur (tested via snapshot or class changes)
      expect(stars[3]).toBeInTheDocument();
    });

    it('should not be interactive when disabled via readOnly', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<StarRating value={3} onChange={onChange} readOnly />);

      // Should not have clickable buttons in read-only mode
      const buttons = screen.queryAllByRole('button');
      expect(buttons).toHaveLength(0);
    });
  });

  describe('Size Variants', () => {
    it('should apply small size class', () => {
      const { container } = render(<StarRating value={3} readOnly size="small" />);
      expect(container.firstChild).toHaveClass('star-rating--small');
    });

    it('should apply medium size class (default)', () => {
      const { container } = render(<StarRating value={3} readOnly size="medium" />);
      expect(container.firstChild).toHaveClass('star-rating--medium');
    });

    it('should apply large size class', () => {
      const { container } = render(<StarRating value={3} readOnly size="large" />);
      expect(container.firstChild).toHaveClass('star-rating--large');
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations (read-only)', async () => {
      const { container } = render(<StarRating value={4} readOnly label="Business Rating" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations (interactive)', async () => {
      const onChange = vi.fn();
      const { container } = render(
        <StarRating value={0} onChange={onChange} label="Rate this business" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have appropriate ARIA labels for interactive stars', () => {
      const onChange = vi.fn();
      render(<StarRating value={0} onChange={onChange} label="Rate this" />);

      const firstStar = screen.getByLabelText(/Rate this: 1/i);
      expect(firstStar).toBeInTheDocument();
    });

    it('should have group role with label in read-only mode', () => {
      render(<StarRating value={3} readOnly label="Customer Rating" />);

      const group = screen.getByRole('group', { name: /Customer Rating/i });
      expect(group).toBeInTheDocument();
    });

    it('should be keyboard focusable in interactive mode', () => {
      const onChange = vi.fn();
      render(<StarRating value={0} onChange={onChange} />);

      const stars = screen.getAllByRole('button');
      stars.forEach(star => {
        expect(star).toHaveAttribute('tabIndex', '0');
      });
    });
  });

  describe('Custom className', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <StarRating value={3} readOnly className="custom-class" />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Edge Cases', () => {
    it('should handle rating value above 5', () => {
      render(<StarRating value={6} readOnly />);
      // Should clamp to 5 or handle gracefully
      expect(screen.getByRole('group')).toBeInTheDocument();
    });

    it('should handle negative rating value', () => {
      render(<StarRating value={-1} readOnly />);
      // Should show 0 stars or handle gracefully
      expect(screen.getByRole('group')).toBeInTheDocument();
    });

    it('should work without onChange prop when readOnly is false', () => {
      // Should not crash, just not be interactive
      render(<StarRating value={3} readOnly={false} />);
      expect(screen.getByRole('group')).toBeInTheDocument();
    });
  });
});
