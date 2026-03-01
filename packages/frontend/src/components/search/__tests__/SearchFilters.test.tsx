/**
 * SearchFilters Component Tests
 * Phase 5: Search & Discovery
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchFilters } from '../SearchFilters.js';
import type { SearchParams } from '@community-hub/shared';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        filters: 'Filters',
        sortBy: 'Sort by',
        categories: 'Category',
        distance: 'Distance',
        rating: 'Rating',
        openNow: 'Open now',
        verifiedOnly: 'Verified only',
        hasPromotions: 'Has promotions',
        hasEvents: 'Has events',
        clearFilters: 'Clear filters',
        anyDistance: 'Any distance',
        'sort.relevance': 'Relevance',
        'sort.distance': 'Distance',
        'sort.rating': 'Rating',
        'sort.reviews': 'Reviews',
        'sort.updated': 'Recently updated',
        'sort.name': 'Name',
        'sort.newest': 'Newest',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock child components
vi.mock('../form/Select.js', () => ({
  Select: ({ label, value, onChange, options, disabled }: any) => (
    <div data-testid={`select-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <label>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  ),
}));

vi.mock('../form/Checkbox.js', () => ({
  Checkbox: ({ id, label, checked, onChange }: any) => (
    <div data-testid={`checkbox-${id}`}>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <label htmlFor={id}>{label}</label>
    </div>
  ),
}));

describe('SearchFilters', () => {
  const mockOnChange = vi.fn();
  const mockCategories = [
    { slug: 'restaurant', name: 'Restaurant' },
    { slug: 'cafe', name: 'Cafe' },
    { slug: 'retail', name: 'Retail' },
  ];
  const mockUserLocation = { lat: -33.8688, lng: 151.2093 };

  const defaultProps = {
    filters: {},
    onChange: mockOnChange,
  };

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('Rendering', () => {
    it('should render filter panel', () => {
      render(<SearchFilters {...defaultProps} />);

      expect(screen.getByText('Filters')).toBeInTheDocument();
    });

    it('should render sort select', () => {
      render(<SearchFilters {...defaultProps} />);

      expect(screen.getByTestId('select-sort-by')).toBeInTheDocument();
    });

    it('should render rating select', () => {
      render(<SearchFilters {...defaultProps} />);

      expect(screen.getByTestId('select-rating')).toBeInTheDocument();
    });

    it('should render category select when categories provided', () => {
      render(<SearchFilters {...defaultProps} categories={mockCategories} />);

      expect(screen.getByTestId('select-category')).toBeInTheDocument();
    });

    it('should not render category select when no categories', () => {
      render(<SearchFilters {...defaultProps} categories={[]} />);

      expect(screen.queryByTestId('select-category')).not.toBeInTheDocument();
    });

    it('should render distance filter when showDistance and userLocation provided', () => {
      render(
        <SearchFilters
          {...defaultProps}
          showDistance={true}
          userLocation={mockUserLocation}
        />
      );

      expect(screen.getByTestId('select-distance')).toBeInTheDocument();
    });

    it('should not render distance filter without userLocation', () => {
      render(<SearchFilters {...defaultProps} showDistance={true} />);

      expect(screen.queryByTestId('select-distance')).not.toBeInTheDocument();
    });

    it('should not render distance filter when showDistance is false', () => {
      render(
        <SearchFilters
          {...defaultProps}
          showDistance={false}
          userLocation={mockUserLocation}
        />
      );

      expect(screen.queryByTestId('select-distance')).not.toBeInTheDocument();
    });

    it('should render boolean filter checkboxes', () => {
      render(<SearchFilters {...defaultProps} />);

      expect(screen.getByTestId('checkbox-filter-open-now')).toBeInTheDocument();
      expect(screen.getByTestId('checkbox-filter-verified')).toBeInTheDocument();
      expect(screen.getByTestId('checkbox-filter-promotions')).toBeInTheDocument();
      expect(screen.getByTestId('checkbox-filter-events')).toBeInTheDocument();
    });
  });

  describe('Filter Changes', () => {
    it('should call onChange when sort changes', () => {
      render(<SearchFilters {...defaultProps} />);

      const sortSelect = screen.getByTestId('select-sort-by').querySelector('select');
      fireEvent.change(sortSelect!, { target: { value: 'rating' } });

      expect(mockOnChange).toHaveBeenCalledWith({
        sort: 'rating',
      });
    });

    it('should call onChange when category changes', () => {
      render(<SearchFilters {...defaultProps} categories={mockCategories} />);

      const categorySelect = screen.getByTestId('select-category').querySelector('select');
      fireEvent.change(categorySelect!, { target: { value: 'restaurant' } });

      expect(mockOnChange).toHaveBeenCalledWith({
        category: 'restaurant',
      });
    });

    it('should call onChange when distance changes', () => {
      render(
        <SearchFilters
          {...defaultProps}
          showDistance={true}
          userLocation={mockUserLocation}
        />
      );

      const distanceSelect = screen.getByTestId('select-distance').querySelector('select');
      fireEvent.change(distanceSelect!, { target: { value: '5' } });

      expect(mockOnChange).toHaveBeenCalledWith({
        distance: 5,
        lat: mockUserLocation.lat,
        lng: mockUserLocation.lng,
      });
    });

    it('should clear location when distance cleared', () => {
      const initialFilters = {
        distance: 5,
        lat: mockUserLocation.lat,
        lng: mockUserLocation.lng,
      };

      render(
        <SearchFilters
          filters={initialFilters}
          onChange={mockOnChange}
          showDistance={true}
          userLocation={mockUserLocation}
        />
      );

      const distanceSelect = screen.getByTestId('select-distance').querySelector('select');
      fireEvent.change(distanceSelect!, { target: { value: '' } });

      expect(mockOnChange).toHaveBeenCalledWith({
        distance: 5,
        lat: mockUserLocation.lat,
        lng: mockUserLocation.lng,
        distance: undefined,
        lat: undefined,
        lng: undefined,
      });
    });

    it('should call onChange when rating changes', () => {
      render(<SearchFilters {...defaultProps} />);

      const ratingSelect = screen.getByTestId('select-rating').querySelector('select');
      fireEvent.change(ratingSelect!, { target: { value: '4' } });

      expect(mockOnChange).toHaveBeenCalledWith({
        rating: 4,
      });
    });

    it('should call onChange when checkbox toggled', () => {
      render(<SearchFilters {...defaultProps} />);

      const openNowCheckbox = screen.getByTestId('checkbox-filter-open-now').querySelector('input');
      fireEvent.click(openNowCheckbox!);

      expect(mockOnChange).toHaveBeenCalledWith({
        openNow: true,
      });
    });

    it('should maintain existing filters when updating', () => {
      const initialFilters: Partial<SearchParams> = {
        sort: 'rating',
        category: 'restaurant',
      };

      render(<SearchFilters filters={initialFilters} onChange={mockOnChange} />);

      const openNowCheckbox = screen.getByTestId('checkbox-filter-open-now').querySelector('input');
      fireEvent.click(openNowCheckbox!);

      expect(mockOnChange).toHaveBeenCalledWith({
        sort: 'rating',
        category: 'restaurant',
        openNow: true,
      });
    });
  });

  describe('Clear Filters', () => {
    it('should show clear button when filters exist', () => {
      const filters: Partial<SearchParams> = {
        sort: 'rating',
        verifiedOnly: true,
      };

      render(<SearchFilters filters={filters} onChange={mockOnChange} />);

      expect(screen.getByText('Clear filters')).toBeInTheDocument();
    });

    it('should not show clear button when no filters', () => {
      render(<SearchFilters {...defaultProps} />);

      expect(screen.queryByText('Clear filters')).not.toBeInTheDocument();
    });

    it('should clear all filters when button clicked', () => {
      const filters: Partial<SearchParams> = {
        sort: 'rating',
        category: 'restaurant',
        verifiedOnly: true,
      };

      render(<SearchFilters filters={filters} onChange={mockOnChange} />);

      const clearButton = screen.getByText('Clear filters');
      fireEvent.click(clearButton);

      expect(mockOnChange).toHaveBeenCalledWith({});
    });
  });

  describe('Mobile Behavior', () => {
    it('should render collapsible header for mobile', () => {
      render(<SearchFilters {...defaultProps} />);

      const mobileToggle = screen.getAllByText('Filters')[0];
      expect(mobileToggle).toBeInTheDocument();
    });

    it('should toggle expanded state on mobile', () => {
      render(<SearchFilters {...defaultProps} />);

      const mobileToggle = screen.getAllByRole('button')[0];

      // Initially collapsed on mobile
      expect(mobileToggle).toHaveAttribute('aria-expanded', 'false');

      // Click to expand
      fireEvent.click(mobileToggle);
      expect(mobileToggle).toHaveAttribute('aria-expanded', 'true');

      // Click to collapse
      fireEvent.click(mobileToggle);
      expect(mobileToggle).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      const { container } = render(<SearchFilters {...defaultProps} className="custom-class" />);

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Accessibility', () => {
    it('should have aria-expanded on mobile toggle', () => {
      render(<SearchFilters {...defaultProps} />);

      const mobileToggle = screen.getAllByRole('button')[0];
      expect(mobileToggle).toHaveAttribute('aria-expanded');
    });

    it('should have proper labels on form controls', () => {
      render(<SearchFilters {...defaultProps} />);

      expect(screen.getByText('Sort by')).toBeInTheDocument();
      expect(screen.getByText('Rating')).toBeInTheDocument();
    });
  });

  describe('Filter Values', () => {
    it('should display current sort value', () => {
      const filters: Partial<SearchParams> = { sort: 'rating' };

      render(<SearchFilters filters={filters} onChange={mockOnChange} />);

      const sortSelect = screen.getByTestId('select-sort-by').querySelector('select');
      expect(sortSelect).toHaveValue('rating');
    });

    it('should display current category value', () => {
      const filters: Partial<SearchParams> = { category: 'restaurant' };

      render(<SearchFilters filters={filters} onChange={mockOnChange} categories={mockCategories} />);

      const categorySelect = screen.getByTestId('select-category').querySelector('select');
      expect(categorySelect).toHaveValue('restaurant');
    });

    it('should display current rating value', () => {
      const filters: Partial<SearchParams> = { rating: 4 };

      render(<SearchFilters filters={filters} onChange={mockOnChange} />);

      const ratingSelect = screen.getByTestId('select-rating').querySelector('select');
      expect(ratingSelect).toHaveValue('4');
    });

    it('should display current checkbox states', () => {
      const filters: Partial<SearchParams> = {
        openNow: true,
        verifiedOnly: true,
      };

      render(<SearchFilters filters={filters} onChange={mockOnChange} />);

      const openNowCheckbox = screen.getByTestId('checkbox-filter-open-now').querySelector('input');
      const verifiedCheckbox = screen.getByTestId('checkbox-filter-verified').querySelector('input');

      expect(openNowCheckbox).toBeChecked();
      expect(verifiedCheckbox).toBeChecked();
    });
  });
});
