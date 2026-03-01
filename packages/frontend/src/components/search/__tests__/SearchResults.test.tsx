/**
 * SearchResults Component Tests
 * Phase 5: Search & Discovery
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SearchResults } from '../SearchResults.js';
import type { SearchResponse, BusinessSearchResult } from '@community-hub/shared';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      if (key === 'resultsCount') return `${params?.count} results found`;
      if (key === 'errorLoading') return 'Error loading results';
      if (key === 'errorDescription') return 'An error occurred';
      if (key === 'noResults') return 'No results found';
      if (key === 'noResultsDescription') return 'Try adjusting your search';
      return key;
    },
  }),
}));

// Mock child components
vi.mock('../business/BusinessCard.js', () => ({
  BusinessCard: ({ business }: { business: BusinessSearchResult }) => (
    <div data-testid={`business-card-${business.id}`}>{business.name}</div>
  ),
}));

vi.mock('../display/Pagination.js', () => ({
  Pagination: ({ currentPage, totalPages, onPageChange }: any) => (
    <div data-testid="pagination">
      Page {currentPage} of {totalPages}
      <button onClick={() => onPageChange?.(currentPage + 1)}>Next</button>
    </div>
  ),
}));

vi.mock('../display/EmptyState.js', () => ({
  EmptyState: ({ title, description }: any) => (
    <div data-testid="empty-state">
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  ),
}));

vi.mock('../display/Skeleton.js', () => ({
  Skeleton: ({ height, width }: any) => (
    <div data-testid="skeleton" style={{ height, width }} />
  ),
}));

describe('SearchResults', () => {
  const mockResults: SearchResponse<BusinessSearchResult> = {
    results: [
      {
        id: '1',
        name: 'Test Business 1',
        description: 'A great business',
        categorySlug: 'restaurant',
        categoryName: 'Restaurant',
        rating: 4.5,
        reviewCount: 10,
        verified: true,
        featured: false,
        photos: [],
      },
      {
        id: '2',
        name: 'Test Business 2',
        description: 'Another great business',
        categorySlug: 'cafe',
        categoryName: 'Cafe',
        rating: 3.8,
        reviewCount: 5,
        distance: 2.5,
        verified: false,
        featured: true,
        photos: [],
      },
    ],
    total: 2,
    page: 1,
    limit: 20,
    totalPages: 1,
  };

  describe('Rendering States', () => {
    it('should render loading state', () => {
      render(<SearchResults isLoading={true} />);

      const skeletons = screen.getAllByTestId('skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should render error state', () => {
      render(<SearchResults error="Failed to load results" />);

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('Error loading results')).toBeInTheDocument();
      expect(screen.getByText('Failed to load results')).toBeInTheDocument();
    });

    it('should render no results state', () => {
      const emptyResults: SearchResponse<BusinessSearchResult> = {
        results: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      };

      render(<SearchResults results={emptyResults} />);

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('No results found')).toBeInTheDocument();
    });

    it('should render results with count', () => {
      render(<SearchResults results={mockResults} />);

      expect(screen.getByText('2 results found')).toBeInTheDocument();
    });

    it('should render all business cards', () => {
      render(<SearchResults results={mockResults} />);

      expect(screen.getByText('Test Business 1')).toBeInTheDocument();
      expect(screen.getByText('Test Business 2')).toBeInTheDocument();
    });
  });

  describe('Business Display', () => {
    it('should display distance when available', () => {
      render(<SearchResults results={mockResults} />);

      expect(screen.getByText(/2\.5 km/)).toBeInTheDocument();
    });

    it('should display category name', () => {
      render(<SearchResults results={mockResults} />);

      expect(screen.getByText('Restaurant')).toBeInTheDocument();
      expect(screen.getByText('Cafe')).toBeInTheDocument();
    });

    it('should display business names', () => {
      render(<SearchResults results={mockResults} />);

      expect(screen.getByText('Test Business 1')).toBeInTheDocument();
      expect(screen.getByText('Test Business 2')).toBeInTheDocument();
    });

    it('should display descriptions', () => {
      render(<SearchResults results={mockResults} />);

      expect(screen.getByText('A great business')).toBeInTheDocument();
      expect(screen.getByText('Another great business')).toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    it('should show pagination when multiple pages', () => {
      const multiPageResults: SearchResponse<BusinessSearchResult> = {
        ...mockResults,
        totalPages: 3,
      };

      render(<SearchResults results={multiPageResults} page={1} />);

      expect(screen.getByTestId('pagination')).toBeInTheDocument();
      expect(screen.getByText(/Page 1 of 3/)).toBeInTheDocument();
    });

    it('should not show pagination when single page', () => {
      render(<SearchResults results={mockResults} />);

      expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
    });

    it('should call onPageChange when page changes', () => {
      const onPageChange = vi.fn();
      const multiPageResults: SearchResponse<BusinessSearchResult> = {
        ...mockResults,
        totalPages: 3,
      };

      render(<SearchResults results={multiPageResults} page={1} onPageChange={onPageChange} />);

      const nextButton = screen.getByText('Next');
      nextButton.click();

      expect(onPageChange).toHaveBeenCalledWith(2);
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      const { container } = render(<SearchResults results={mockResults} className="custom-class" />);

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      render(<SearchResults results={mockResults} />);

      // Should have links with proper href
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);

      // Should display content text
      expect(screen.getByText('2 results found')).toBeInTheDocument();
    });
  });

  describe('Links', () => {
    it('should have correct business detail links', () => {
      render(<SearchResults results={mockResults} />);

      const links = screen.getAllByRole('link');
      expect(links[0]).toHaveAttribute('href', '/businesses/1');
      expect(links[1]).toHaveAttribute('href', '/businesses/2');
    });
  });

  describe('Responsive Grid', () => {
    it('should apply responsive grid classes', () => {
      const { container } = render(<SearchResults results={mockResults} />);

      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-1');
      expect(grid).toHaveClass('sm:grid-cols-2');
      expect(grid).toHaveClass('lg:grid-cols-3');
    });
  });
});
