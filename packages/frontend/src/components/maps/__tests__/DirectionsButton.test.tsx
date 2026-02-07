import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DirectionsButton } from '../DirectionsButton';

// Mock the directions utility
vi.mock('../utils/directions', () => ({
  openDirections: vi.fn(),
}));

import { openDirections } from '../utils/directions';

describe('DirectionsButton', () => {
  const defaultProps = {
    latitude: -33.8567,
    longitude: 150.9876,
    address: '123 Main Street, Guildford NSW 2161',
    businessName: 'Test Business',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('rendering', () => {
    test('renders button with "Get Directions" text', () => {
      render(<DirectionsButton {...defaultProps} />);

      const button = screen.getByRole('button', { name: /get directions to test business/i });
      expect(button).toBeInTheDocument();
      expect(screen.getByText('Get Directions')).toBeInTheDocument();
    });

    test('renders with map pin icon', () => {
      const { container } = render(<DirectionsButton {...defaultProps} />);

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('w-5', 'h-5');
    });

    test('has accessible ARIA label with business name', () => {
      render(<DirectionsButton {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Get directions to Test Business');
    });

    test('icon is hidden from screen readers', () => {
      const { container } = render(<DirectionsButton {...defaultProps} />);

      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });

    test('has type="button" to prevent form submission', () => {
      render(<DirectionsButton {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
    });
  });

  describe('styling variants', () => {
    test('applies primary variant styles by default', () => {
      render(<DirectionsButton {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary', 'text-white');
    });

    test('applies primary variant when explicitly specified', () => {
      render(<DirectionsButton {...defaultProps} variant="primary" />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary', 'text-white');
    });

    test('applies secondary variant styles', () => {
      render(<DirectionsButton {...defaultProps} variant="secondary" />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-white', 'text-primary', 'border-2', 'border-primary');
    });

    test('applies full width when fullWidth is true', () => {
      render(<DirectionsButton {...defaultProps} fullWidth={true} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-full');
    });

    test('does not apply full width by default', () => {
      render(<DirectionsButton {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button).not.toHaveClass('w-full');
    });
  });

  describe('accessibility', () => {
    test('meets WCAG 2.1 AA minimum touch target size (44px)', () => {
      render(<DirectionsButton {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('min-h-[44px]');
    });

    test('has focus ring for keyboard navigation', () => {
      render(<DirectionsButton {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus:ring-2', 'focus:ring-offset-2', 'focus:ring-primary');
    });

    test('has focus outline removal for mouse users', () => {
      render(<DirectionsButton {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus:outline-none');
    });

    test('is keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<DirectionsButton {...defaultProps} />);

      const button = screen.getByRole('button');

      // Tab to focus
      await user.tab();
      expect(button).toHaveFocus();

      // Enter to click
      await user.keyboard('{Enter}');
      expect(openDirections).toHaveBeenCalledTimes(1);
    });

    test('can be activated with Space key', async () => {
      const user = userEvent.setup();
      render(<DirectionsButton {...defaultProps} />);

      const button = screen.getByRole('button');

      await user.tab();
      await user.keyboard(' ');

      expect(openDirections).toHaveBeenCalledTimes(1);
    });
  });

  describe('interaction', () => {
    test('calls openDirections when clicked', async () => {
      const user = userEvent.setup();
      render(<DirectionsButton {...defaultProps} />);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(openDirections).toHaveBeenCalledTimes(1);
      expect(openDirections).toHaveBeenCalledWith(
        { latitude: -33.8567, longitude: 150.9876 },
        '123 Main Street, Guildford NSW 2161'
      );
    });

    test('passes correct coordinates to openDirections', async () => {
      const user = userEvent.setup();
      const customProps = {
        ...defaultProps,
        latitude: -37.8136,
        longitude: 144.9631,
      };

      render(<DirectionsButton {...customProps} />);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(openDirections).toHaveBeenCalledWith(
        { latitude: -37.8136, longitude: 144.9631 },
        '123 Main Street, Guildford NSW 2161'
      );
    });

    test('passes correct address to openDirections', async () => {
      const user = userEvent.setup();
      const customProps = {
        ...defaultProps,
        address: '456 Different Street, Melbourne VIC 3000',
      };

      render(<DirectionsButton {...customProps} />);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(openDirections).toHaveBeenCalledWith(
        { latitude: -33.8567, longitude: 150.9876 },
        '456 Different Street, Melbourne VIC 3000'
      );
    });

    test('handles multiple clicks', async () => {
      const user = userEvent.setup();
      render(<DirectionsButton {...defaultProps} />);

      const button = screen.getByRole('button');

      await user.click(button);
      await user.click(button);
      await user.click(button);

      expect(openDirections).toHaveBeenCalledTimes(3);
    });
  });

  describe('prop variations', () => {
    test('updates aria-label when businessName changes', () => {
      const { rerender } = render(<DirectionsButton {...defaultProps} />);

      let button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Get directions to Test Business');

      rerender(<DirectionsButton {...defaultProps} businessName="New Business" />);

      button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Get directions to New Business');
    });

    test('handles special characters in business name', () => {
      const props = {
        ...defaultProps,
        businessName: "Joe's Café & Bar",
      };

      render(<DirectionsButton {...props} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', "Get directions to Joe's Café & Bar");
    });

    test('handles empty string business name gracefully', () => {
      const props = {
        ...defaultProps,
        businessName: '',
      };

      render(<DirectionsButton {...props} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Get directions to ');
    });
  });

  describe('coordinate edge cases', () => {
    test('handles zero coordinates (equator/prime meridian)', async () => {
      const user = userEvent.setup();
      const props = {
        ...defaultProps,
        latitude: 0,
        longitude: 0,
      };

      render(<DirectionsButton {...props} />);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(openDirections).toHaveBeenCalledWith(
        { latitude: 0, longitude: 0 },
        props.address
      );
    });

    test('handles maximum latitude (90°)', async () => {
      const user = userEvent.setup();
      const props = {
        ...defaultProps,
        latitude: 90,
        longitude: 0,
      };

      render(<DirectionsButton {...props} />);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(openDirections).toHaveBeenCalledWith(
        { latitude: 90, longitude: 0 },
        props.address
      );
    });

    test('handles minimum latitude (-90°)', async () => {
      const user = userEvent.setup();
      const props = {
        ...defaultProps,
        latitude: -90,
        longitude: 0,
      };

      render(<DirectionsButton {...props} />);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(openDirections).toHaveBeenCalledWith(
        { latitude: -90, longitude: 0 },
        props.address
      );
    });

    test('handles date line crossing (±180° longitude)', async () => {
      const user = userEvent.setup();
      const props = {
        ...defaultProps,
        latitude: 0,
        longitude: 180,
      };

      render(<DirectionsButton {...props} />);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(openDirections).toHaveBeenCalledWith(
        { latitude: 0, longitude: 180 },
        props.address
      );
    });

    test('handles high precision coordinates', async () => {
      const user = userEvent.setup();
      const props = {
        ...defaultProps,
        latitude: -33.856789123,
        longitude: 150.987654321,
      };

      render(<DirectionsButton {...props} />);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(openDirections).toHaveBeenCalledWith(
        { latitude: -33.856789123, longitude: 150.987654321 },
        props.address
      );
    });
  });

  describe('visual styling', () => {
    test('has transition classes for smooth interactions', () => {
      render(<DirectionsButton {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('transition-colors');
    });

    test('has rounded corners', () => {
      render(<DirectionsButton {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('rounded-lg');
    });

    test('has padding for comfortable touch area', () => {
      render(<DirectionsButton {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-4', 'py-2');
    });

    test('has flex layout for icon and text alignment', () => {
      render(<DirectionsButton {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('inline-flex', 'items-center', 'justify-center', 'gap-2');
    });

    test('text has medium font weight', () => {
      render(<DirectionsButton {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('font-medium');
    });
  });
});
