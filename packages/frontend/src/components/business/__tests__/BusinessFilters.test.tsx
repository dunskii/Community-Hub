/**
 * Simplified tests for BusinessFilters Component
 * Focus on rendering and basic structure
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BusinessFilters } from '../BusinessFilters';
import type { BusinessListParams, Category } from '../../../services/business-api';

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', dir: () => 'ltr' },
  }),
}));

// Mock categories
const mockCategories: Category[] = [
  {
    id: 'cat-1',
    name: 'Restaurant',
    slug: 'restaurant',
    icon: '🍽️',
    parentId: null,
    displayOrder: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'cat-2',
    name: 'Cafe',
    slug: 'cafe',
    icon: '☕',
    parentId: null,
    displayOrder: 2,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe('BusinessFilters', () => {
  describe('rendering', () => {
    it('should render search input', () => {
      const filters: BusinessListParams = {};
      const onChange = vi.fn();
      render(<BusinessFilters filters={filters} onChange={onChange} />);

      const searchInput = screen.getByPlaceholderText('business.searchPlaceholder');
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveAttribute('type', 'search');
    });

    it('should render category select', () => {
      const filters: BusinessListParams = {};
      const onChange = vi.fn();
      const { container } = render(<BusinessFilters filters={filters} onChange={onChange} categories={mockCategories} />);

      expect(screen.getByText('business.categoryLabel')).toBeInTheDocument();
      expect(container.querySelector('#category-filter')).toBeInTheDocument();
    });

    it('should render sort select', () => {
      const filters: BusinessListParams = {};
      const onChange = vi.fn();
      const { container } = render(<BusinessFilters filters={filters} onChange={onChange} />);

      expect(screen.getByText('business.sortLabel')).toBeInTheDocument();
      expect(container.querySelector('#sort-filter')).toBeInTheDocument();
    });

    it('should render open now toggle', () => {
      const filters: BusinessListParams = {};
      const onChange = vi.fn();
      const { container } = render(<BusinessFilters filters={filters} onChange={onChange} />);

      expect(screen.getByText('business.openNowOnly')).toBeInTheDocument();
      expect(container.querySelector('#open-now-filter')).toBeInTheDocument();
    });
  });

  describe('initial values', () => {
    it('should display initial search value', () => {
      const filters: BusinessListParams = { search: 'pizza' };
      const onChange = vi.fn();
      render(<BusinessFilters filters={filters} onChange={onChange} />);

      const searchInput = screen.getByPlaceholderText('business.searchPlaceholder') as HTMLInputElement;
      expect(searchInput.value).toBe('pizza');
    });

    it('should display selected category', () => {
      const filters: BusinessListParams = { category: 'cat-1' };
      const onChange = vi.fn();
      const { container } = render(<BusinessFilters filters={filters} onChange={onChange} categories={mockCategories} />);

      const select = container.querySelector('#category-filter') as HTMLSelectElement;
      expect(select.value).toBe('cat-1');
    });

    it('should display selected sort option', () => {
      const filters: BusinessListParams = { sort: 'name' };
      const onChange = vi.fn();
      const { container } = render(<BusinessFilters filters={filters} onChange={onChange} />);

      const select = container.querySelector('#sort-filter') as HTMLSelectElement;
      expect(select.value).toBe('name');
    });

    it('should display toggle state', () => {
      const filters: BusinessListParams = { openNow: true };
      const onChange = vi.fn();
      const { container } = render(<BusinessFilters filters={filters} onChange={onChange} />);

      const toggle = container.querySelector('#open-now-filter') as HTMLInputElement;
      expect(toggle.checked).toBe(true);
    });
  });

  describe('category options', () => {
    it('should include "All Categories" option', () => {
      const filters: BusinessListParams = {};
      const onChange = vi.fn();
      render(<BusinessFilters filters={filters} onChange={onChange} categories={mockCategories} />);

      expect(screen.getByText('business.allCategories')).toBeInTheDocument();
    });

    it('should render all category options', () => {
      const filters: BusinessListParams = {};
      const onChange = vi.fn();
      render(<BusinessFilters filters={filters} onChange={onChange} categories={mockCategories} />);

      expect(screen.getByText('Restaurant')).toBeInTheDocument();
      expect(screen.getByText('Cafe')).toBeInTheDocument();
    });

    it('should render multilingual category names', () => {
      const multilingualCategories: Category[] = [
        {
          id: 'cat-1',
          name: { en: 'Restaurant', ar: 'مطعم' },
          slug: 'restaurant',
          icon: '🍽️',
          parentId: null,
          displayOrder: 1,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      const filters: BusinessListParams = {};
      const onChange = vi.fn();
      render(<BusinessFilters filters={filters} onChange={onChange} categories={multilingualCategories} />);

      expect(screen.getByText('Restaurant')).toBeInTheDocument();
    });
  });

  describe('sort options', () => {
    it('should include all sort options', () => {
      const filters: BusinessListParams = {};
      const onChange = vi.fn();
      render(<BusinessFilters filters={filters} onChange={onChange} />);

      expect(screen.getByText('business.sort.default')).toBeInTheDocument();
      expect(screen.getByText('business.sort.nameAsc')).toBeInTheDocument();
      expect(screen.getByText('business.sort.nameDesc')).toBeInTheDocument();
      expect(screen.getByText('business.sort.ratingAsc')).toBeInTheDocument();
      expect(screen.getByText('business.sort.ratingDesc')).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('should disable search input when loading', () => {
      const filters: BusinessListParams = {};
      const onChange = vi.fn();
      render(<BusinessFilters filters={filters} onChange={onChange} loading={true} />);

      const searchInput = screen.getByPlaceholderText('business.searchPlaceholder');
      expect(searchInput).toBeDisabled();
    });

    it('should disable category select when loading', () => {
      const filters: BusinessListParams = {};
      const onChange = vi.fn();
      const { container } = render(<BusinessFilters filters={filters} onChange={onChange} loading={true} />);

      const select = container.querySelector('#category-filter') as HTMLSelectElement;
      expect(select).toBeDisabled();
    });

    it('should disable sort select when loading', () => {
      const filters: BusinessListParams = {};
      const onChange = vi.fn();
      const { container } = render(<BusinessFilters filters={filters} onChange={onChange} loading={true} />);

      const select = container.querySelector('#sort-filter') as HTMLSelectElement;
      expect(select).toBeDisabled();
    });

    it('should disable toggle when loading', () => {
      const filters: BusinessListParams = {};
      const onChange = vi.fn();
      const { container } = render(<BusinessFilters filters={filters} onChange={onChange} loading={true} />);

      const toggle = container.querySelector('#open-now-filter') as HTMLInputElement;
      expect(toggle).toBeDisabled();
    });
  });

  describe('empty categories', () => {
    it('should render with empty categories array', () => {
      const filters: BusinessListParams = {};
      const onChange = vi.fn();
      const { container } = render(<BusinessFilters filters={filters} onChange={onChange} categories={[]} />);

      expect(container.querySelector('#category-filter')).toBeInTheDocument();
      expect(screen.getByText('business.allCategories')).toBeInTheDocument();
    });

    it('should render with undefined categories', () => {
      const filters: BusinessListParams = {};
      const onChange = vi.fn();
      const { container } = render(<BusinessFilters filters={filters} onChange={onChange} />);

      expect(container.querySelector('#category-filter')).toBeInTheDocument();
      expect(screen.getByText('business.allCategories')).toBeInTheDocument();
    });
  });
});
