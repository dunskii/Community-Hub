/**
 * EventFilters Component Tests
 * Phase 8: Events & Calendar System
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { EventFilters } from '../EventFilters';

expect.extend(toHaveNoViolations);

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'events.filters.title': 'Filters',
        'events.filters.sortBy': 'Sort by',
        'events.filters.dateFrom': 'From',
        'events.filters.dateTo': 'To',
        'events.filters.category': 'Category',
        'events.filters.locationType': 'Location Type',
        'events.filters.distance': 'Distance',
        'events.filters.status': 'Status',
        'events.filters.freeOnly': 'Free events only',
        'events.filters.includePast': 'Include past events',
        'events.filters.clear': 'Clear filters',
        'events.filters.anyLocationType': 'Any location',
        'events.filters.anyDistance': 'Any distance',
        'events.filters.anyStatus': 'Any status',
        'events.filters.allCategories': 'All categories',
        'events.locationType.physical': 'In Person',
        'events.locationType.online': 'Online',
        'events.locationType.hybrid': 'Hybrid',
        'events.sort.upcoming': 'Upcoming',
        'events.sort.popular': 'Popular',
        'events.sort.newest': 'Newest',
        'events.sort.distance': 'Distance',
        'events.status.pending': 'Pending',
        'events.status.active': 'Active',
        'events.status.cancelled': 'Cancelled',
        'events.status.past': 'Past',
      };
      return translations[key] || key;
    },
  }),
}));

describe('EventFilters', () => {
  const mockOnChange = vi.fn();
  const mockCategories = [
    { id: 'cat-1', name: 'Community', slug: 'community' },
    { id: 'cat-2', name: 'Sports', slug: 'sports' },
    { id: 'cat-3', name: 'Music', slug: 'music' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders filter title', () => {
    render(<EventFilters filters={{}} onChange={mockOnChange} />);
    expect(screen.getAllByText('Filters')[0]).toBeInTheDocument();
  });

  it('renders sort options', () => {
    render(<EventFilters filters={{}} onChange={mockOnChange} />);
    expect(screen.getByLabelText('Sort by')).toBeInTheDocument();
  });

  it('renders date pickers', () => {
    render(<EventFilters filters={{}} onChange={mockOnChange} />);
    expect(screen.getByLabelText('From')).toBeInTheDocument();
    expect(screen.getByLabelText('To')).toBeInTheDocument();
  });

  it('renders category filter when categories provided', () => {
    render(
      <EventFilters
        filters={{}}
        onChange={mockOnChange}
        categories={mockCategories}
      />
    );
    expect(screen.getByLabelText('Category')).toBeInTheDocument();
  });

  it('renders location type filter', () => {
    render(<EventFilters filters={{}} onChange={mockOnChange} />);
    expect(screen.getByLabelText('Location Type')).toBeInTheDocument();
  });

  it('renders distance filter when user location provided', () => {
    render(
      <EventFilters
        filters={{}}
        onChange={mockOnChange}
        userLocation={{ lat: -33.8, lng: 151.0 }}
      />
    );
    expect(screen.getByLabelText('Distance')).toBeInTheDocument();
  });

  it('does not render distance filter when no user location', () => {
    render(<EventFilters filters={{}} onChange={mockOnChange} />);
    expect(screen.queryByLabelText('Distance')).not.toBeInTheDocument();
  });

  it('renders status filter when showStatus is true', () => {
    render(
      <EventFilters filters={{}} onChange={mockOnChange} showStatus />
    );
    expect(screen.getByLabelText('Status')).toBeInTheDocument();
  });

  it('renders free only checkbox', () => {
    render(<EventFilters filters={{}} onChange={mockOnChange} />);
    expect(screen.getByLabelText('Free events only')).toBeInTheDocument();
  });

  it('renders include past checkbox', () => {
    render(<EventFilters filters={{}} onChange={mockOnChange} />);
    expect(screen.getByLabelText('Include past events')).toBeInTheDocument();
  });

  it('shows clear button when filters are applied', () => {
    render(
      <EventFilters
        filters={{ freeOnly: true }}
        onChange={mockOnChange}
      />
    );
    expect(screen.getByText('Clear filters')).toBeInTheDocument();
  });

  it('hides clear button when no filters applied', () => {
    render(<EventFilters filters={{}} onChange={mockOnChange} />);
    expect(screen.queryByText('Clear filters')).not.toBeInTheDocument();
  });

  it('calls onChange when sort changes', () => {
    render(
      <EventFilters filters={{}} onChange={mockOnChange} />
    );
    const sortSelect = screen.getByLabelText('Sort by');
    fireEvent.change(sortSelect, { target: { value: 'popular' } });
    expect(mockOnChange).toHaveBeenCalledWith({ sort: 'popular' });
  });

  it('calls onChange when free only checkbox toggled', () => {
    render(<EventFilters filters={{}} onChange={mockOnChange} />);
    const checkbox = screen.getByLabelText('Free events only');
    fireEvent.click(checkbox);
    expect(mockOnChange).toHaveBeenCalledWith({ freeOnly: true });
  });

  it('calls onChange when include past checkbox toggled', () => {
    render(<EventFilters filters={{}} onChange={mockOnChange} />);
    const checkbox = screen.getByLabelText('Include past events');
    fireEvent.click(checkbox);
    expect(mockOnChange).toHaveBeenCalledWith({ includePast: true });
  });

  it('calls onChange with empty object when clear clicked', () => {
    render(
      <EventFilters
        filters={{ freeOnly: true, includePast: true }}
        onChange={mockOnChange}
      />
    );
    fireEvent.click(screen.getByText('Clear filters'));
    expect(mockOnChange).toHaveBeenCalledWith({});
  });

  it('preserves existing filters when adding new ones', () => {
    render(
      <EventFilters
        filters={{ freeOnly: true }}
        onChange={mockOnChange}
      />
    );
    const checkbox = screen.getByLabelText('Include past events');
    fireEvent.click(checkbox);
    expect(mockOnChange).toHaveBeenCalledWith({
      freeOnly: true,
      includePast: true,
    });
  });

  it('removes filter when set to empty/false', () => {
    render(
      <EventFilters
        filters={{ freeOnly: true }}
        onChange={mockOnChange}
      />
    );
    const checkbox = screen.getByLabelText('Free events only');
    fireEvent.click(checkbox);
    expect(mockOnChange).toHaveBeenCalledWith({});
  });

  describe('Mobile responsiveness', () => {
    it('renders collapsible header on mobile', () => {
      render(<EventFilters filters={{}} onChange={mockOnChange} />);
      const mobileHeader = screen.getByRole('button', { name: /filters/i });
      expect(mobileHeader).toBeInTheDocument();
    });

    it('has aria-expanded attribute on mobile header', () => {
      render(<EventFilters filters={{}} onChange={mockOnChange} />);
      const mobileHeader = screen.getByRole('button', { name: /filters/i });
      expect(mobileHeader).toHaveAttribute('aria-expanded', 'false');
    });

    it('toggles expansion on click', () => {
      render(<EventFilters filters={{}} onChange={mockOnChange} />);
      const mobileHeader = screen.getByRole('button', { name: /filters/i });
      fireEvent.click(mobileHeader);
      expect(mobileHeader).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <EventFilters
          filters={{}}
          onChange={mockOnChange}
          categories={mockCategories}
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations with all options', async () => {
      const { container } = render(
        <EventFilters
          filters={{ freeOnly: true }}
          onChange={mockOnChange}
          categories={mockCategories}
          userLocation={{ lat: -33.8, lng: 151.0 }}
          showStatus
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper labels for all form controls', () => {
      render(
        <EventFilters
          filters={{}}
          onChange={mockOnChange}
          categories={mockCategories}
          userLocation={{ lat: -33.8, lng: 151.0 }}
          showStatus
        />
      );

      expect(screen.getByLabelText('Sort by')).toBeInTheDocument();
      expect(screen.getByLabelText('From')).toBeInTheDocument();
      expect(screen.getByLabelText('To')).toBeInTheDocument();
      expect(screen.getByLabelText('Category')).toBeInTheDocument();
      expect(screen.getByLabelText('Location Type')).toBeInTheDocument();
      expect(screen.getByLabelText('Distance')).toBeInTheDocument();
      expect(screen.getByLabelText('Status')).toBeInTheDocument();
      expect(screen.getByLabelText('Free events only')).toBeInTheDocument();
      expect(screen.getByLabelText('Include past events')).toBeInTheDocument();
    });

    it('has minimum touch target size on buttons', () => {
      render(
        <EventFilters
          filters={{ freeOnly: true }}
          onChange={mockOnChange}
        />
      );
      const clearButton = screen.getByText('Clear filters');
      expect(clearButton).toHaveClass('min-h-[44px]');
    });
  });
});
