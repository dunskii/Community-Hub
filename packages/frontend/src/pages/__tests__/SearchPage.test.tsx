/**
 * SearchPage Component Tests
 * Phase 5: Search & Discovery
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { SearchPage } from '../SearchPage.js';

// Mock react-router-dom
const mockNavigate = vi.fn();
const mockSearchParams = new URLSearchParams();
const mockSetSearchParams = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useSearchParams: () => [mockSearchParams, mockSetSearchParams],
}));

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock API
vi.mock('../services/search-api.js', () => ({
  searchBusinesses: vi.fn(() => Promise.resolve({
    results: [],
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  })),
}));

// Mock child components
vi.mock('../components/search/SearchBar.js', () => ({
  SearchBar: ({ onSearch, initialValue }: any) => (
    <div data-testid="search-bar">
      <input
        type="text"
        defaultValue={initialValue}
        onChange={(e) => onSearch?.(e.target.value)}
      />
    </div>
  ),
}));

vi.mock('../components/search/SearchFilters.js', () => ({
  SearchFilters: ({ filters, onChange }: any) => (
    <div data-testid="search-filters">Filters</div>
  ),
}));

vi.mock('../components/search/SearchResults.js', () => ({
  SearchResults: ({ results, isLoading, error }: any) => (
    <div data-testid="search-results">
      {isLoading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}
      {results && <div>Results: {results.total}</div>}
    </div>
  ),
}));

vi.mock('../components/search/FilterChips.js', () => ({
  FilterChips: () => <div data-testid="filter-chips">Chips</div>,
}));

vi.mock('../components/layout/PageContainer.js', () => ({
  PageContainer: ({ children }: any) => <div data-testid="page-container">{children}</div>,
}));

describe('SearchPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockSetSearchParams.mockClear();
    mockSearchParams.delete('q');
    mockSearchParams.delete('category');
  });

  describe('Rendering', () => {
    it('should render main components', () => {
      render(<SearchPage />);

      expect(screen.getByTestId('page-container')).toBeInTheDocument();
      expect(screen.getByTestId('search-bar')).toBeInTheDocument();
      expect(screen.getByTestId('search-filters')).toBeInTheDocument();
      expect(screen.getByTestId('search-results')).toBeInTheDocument();
      expect(screen.getByTestId('filter-chips')).toBeInTheDocument();
    });

    it('should render with loading state initially', async () => {
      render(<SearchPage />);

      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeInTheDocument();
      });
    });
  });

  describe('Page Structure', () => {
    it('should have proper page container', () => {
      render(<SearchPage />);

      expect(screen.getByTestId('page-container')).toBeInTheDocument();
    });
  });

  describe('URL Parameters', () => {
    it('should parse query from URL', () => {
      mockSearchParams.set('q', 'pizza');

      render(<SearchPage />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('pizza');
    });
  });
});
