/**
 * RSVPButton Component Tests
 * Phase 8: Events & Calendar System
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { RSVPButton } from '../RSVPButton';
import type { RSVPStatus } from '@community-hub/shared';

expect.extend(toHaveNoViolations);

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'events.rsvp.rsvp': 'RSVP',
        'events.rsvp.going': 'Going',
        'events.rsvp.interested': 'Interested',
        'events.rsvp.notGoing': 'Not Going',
        'events.rsvp.cancel': 'Cancel RSVP',
        'events.rsvp.options': 'RSVP Options',
      };
      return translations[key] || key;
    },
  }),
}));

describe('RSVPButton', () => {
  const mockOnRSVP = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Compact variant', () => {
    it('renders RSVP button when no status', () => {
      render(
        <RSVPButton
          currentStatus={null}
          onRSVP={mockOnRSVP}
          variant="compact"
        />
      );
      expect(screen.getByText('RSVP')).toBeInTheDocument();
    });

    it('shows current status when set', () => {
      render(
        <RSVPButton
          currentStatus="GOING"
          onRSVP={mockOnRSVP}
          variant="compact"
        />
      );
      expect(screen.getByText('Going')).toBeInTheDocument();
    });

    it('calls onRSVP with GOING when clicked', async () => {
      render(
        <RSVPButton
          currentStatus={null}
          onRSVP={mockOnRSVP}
          variant="compact"
        />
      );
      fireEvent.click(screen.getByRole('button'));
      await waitFor(() => {
        expect(mockOnRSVP).toHaveBeenCalledWith('GOING');
      });
    });

    it('calls onCancel when clicking same status', async () => {
      render(
        <RSVPButton
          currentStatus="GOING"
          onRSVP={mockOnRSVP}
          onCancel={mockOnCancel}
          variant="compact"
        />
      );
      fireEvent.click(screen.getByRole('button'));
      await waitFor(() => {
        expect(mockOnCancel).toHaveBeenCalled();
      });
    });
  });

  describe('Full variant', () => {
    it('renders all three RSVP options', () => {
      render(
        <RSVPButton
          currentStatus={null}
          onRSVP={mockOnRSVP}
          variant="full"
        />
      );
      expect(screen.getByText('Going')).toBeInTheDocument();
      expect(screen.getByText('Interested')).toBeInTheDocument();
      expect(screen.getByText('Not Going')).toBeInTheDocument();
    });

    it('highlights selected status', () => {
      render(
        <RSVPButton
          currentStatus="INTERESTED"
          onRSVP={mockOnRSVP}
          variant="full"
        />
      );
      const interestedButton = screen.getByRole('button', { name: /interested/i });
      expect(interestedButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('calls onRSVP with correct status', async () => {
      render(
        <RSVPButton
          currentStatus={null}
          onRSVP={mockOnRSVP}
          variant="full"
        />
      );
      fireEvent.click(screen.getByText('Interested'));
      await waitFor(() => {
        expect(mockOnRSVP).toHaveBeenCalledWith('INTERESTED');
      });
    });

    it('has proper group role for accessibility', () => {
      render(
        <RSVPButton
          currentStatus={null}
          onRSVP={mockOnRSVP}
          variant="full"
        />
      );
      expect(screen.getByRole('group')).toBeInTheDocument();
    });
  });

  describe('Dropdown variant', () => {
    it('renders dropdown button', () => {
      render(
        <RSVPButton
          currentStatus={null}
          onRSVP={mockOnRSVP}
          variant="dropdown"
        />
      );
      expect(screen.getByRole('button', { name: /rsvp/i })).toBeInTheDocument();
    });

    it('opens dropdown on click', () => {
      render(
        <RSVPButton
          currentStatus={null}
          onRSVP={mockOnRSVP}
          variant="dropdown"
        />
      );
      fireEvent.click(screen.getByRole('button', { name: /rsvp/i }));
      expect(screen.getByRole('menu')).toBeInTheDocument();
      expect(screen.getAllByRole('menuitem')).toHaveLength(3);
    });

    it('shows cancel option when has status', () => {
      render(
        <RSVPButton
          currentStatus="GOING"
          onRSVP={mockOnRSVP}
          onCancel={mockOnCancel}
          variant="dropdown"
        />
      );
      fireEvent.click(screen.getByRole('button', { expanded: false }));
      expect(screen.getByText('Cancel RSVP')).toBeInTheDocument();
    });

    it('has aria-expanded attribute', () => {
      render(
        <RSVPButton
          currentStatus={null}
          onRSVP={mockOnRSVP}
          variant="dropdown"
        />
      );
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-expanded', 'false');
      fireEvent.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Disabled states', () => {
    it('disables button when disabled prop is true', () => {
      render(
        <RSVPButton
          currentStatus={null}
          onRSVP={mockOnRSVP}
          disabled
          variant="compact"
        />
      );
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('disables button when event is past', () => {
      render(
        <RSVPButton
          currentStatus={null}
          onRSVP={mockOnRSVP}
          isPast
          variant="compact"
        />
      );
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('disables Going button when event is full', () => {
      render(
        <RSVPButton
          currentStatus={null}
          onRSVP={mockOnRSVP}
          isFull
          variant="full"
        />
      );
      // Get the first button which is "Going"
      const buttons = screen.getAllByRole('button');
      const goingButton = buttons[0];
      expect(goingButton).toHaveTextContent('Going');
      expect(goingButton).toBeDisabled();
    });

    it('allows Going if already going even when full', () => {
      render(
        <RSVPButton
          currentStatus="GOING"
          onRSVP={mockOnRSVP}
          isFull
          variant="full"
        />
      );
      // Get the first button which is "Going"
      const buttons = screen.getAllByRole('button');
      const goingButton = buttons[0];
      expect(goingButton).toHaveTextContent('Going');
      expect(goingButton).not.toBeDisabled();
    });
  });

  describe('Loading state', () => {
    it('shows loading indicator during async operation', async () => {
      const slowRSVP = vi.fn(() => new Promise((resolve) => setTimeout(resolve, 100)));
      render(
        <RSVPButton
          currentStatus={null}
          onRSVP={slowRSVP}
          variant="compact"
        />
      );
      fireEvent.click(screen.getByRole('button'));
      expect(screen.getByText('⏳')).toBeInTheDocument();
      await waitFor(() => {
        expect(slowRSVP).toHaveBeenCalled();
      });
    });
  });

  describe('Sizes', () => {
    it('renders small size', () => {
      render(
        <RSVPButton
          currentStatus={null}
          onRSVP={mockOnRSVP}
          size="small"
          variant="compact"
        />
      );
      const button = screen.getByRole('button');
      expect(button.className).toContain('text-sm');
    });

    it('renders large size', () => {
      render(
        <RSVPButton
          currentStatus={null}
          onRSVP={mockOnRSVP}
          size="large"
          variant="compact"
        />
      );
      const button = screen.getByRole('button');
      expect(button.className).toContain('text-lg');
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations - compact variant', async () => {
      const { container } = render(
        <RSVPButton
          currentStatus={null}
          onRSVP={mockOnRSVP}
          variant="compact"
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations - full variant', async () => {
      const { container } = render(
        <RSVPButton
          currentStatus={null}
          onRSVP={mockOnRSVP}
          variant="full"
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations - dropdown variant', async () => {
      const { container } = render(
        <RSVPButton
          currentStatus={null}
          onRSVP={mockOnRSVP}
          variant="dropdown"
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper aria-pressed for toggle buttons', () => {
      render(
        <RSVPButton
          currentStatus="GOING"
          onRSVP={mockOnRSVP}
          variant="compact"
        />
      );
      expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
    });

    it('has proper aria-label', () => {
      render(
        <RSVPButton
          currentStatus={null}
          onRSVP={mockOnRSVP}
          variant="compact"
        />
      );
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'RSVP');
    });
  });
});
