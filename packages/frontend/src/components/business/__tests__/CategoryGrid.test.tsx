/**
 * Unit tests for CategoryGrid Component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { CategoryGrid } from '../CategoryGrid';
import type { Category } from '../../../services/business-api';

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

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('CategoryGrid', () => {
  describe('loading state', () => {
    it('should render loading skeletons', () => {
      renderWithRouter(<CategoryGrid categories={[]} loading={true} />);
      expect(screen.getByText('common.loading')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
    });

    it('should render 8 skeleton items', () => {
      const { container } = renderWithRouter(<CategoryGrid categories={[]} loading={true} />);
      const skeletons = container.querySelectorAll('.category-card--skeleton');
      expect(skeletons).toHaveLength(8);
    });
  });

  describe('error state', () => {
    it('should render error message', () => {
      renderWithRouter(<CategoryGrid categories={[]} error="Failed to load" />);
      expect(screen.getByText('category.errorTitle')).toBeInTheDocument();
      expect(screen.getByText('Failed to load')).toBeInTheDocument();
    });

    it('should render error icon', () => {
      renderWithRouter(<CategoryGrid categories={[]} error="Error message" />);
      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('should render empty message', () => {
      renderWithRouter(<CategoryGrid categories={[]} />);
      expect(screen.getByText('category.noCategoriesTitle')).toBeInTheDocument();
      expect(screen.getByText('category.noCategoriesDescription')).toBeInTheDocument();
    });

    it('should render empty icon', () => {
      renderWithRouter(<CategoryGrid categories={[]} />);
      expect(screen.getByText('📂')).toBeInTheDocument();
    });
  });

  describe('category list', () => {
    it('should render single category', () => {
      renderWithRouter(<CategoryGrid categories={[mockCategories[0]]} />);
      expect(screen.getByText('Restaurant')).toBeInTheDocument();
    });

    it('should render multiple categories', () => {
      renderWithRouter(<CategoryGrid categories={mockCategories} />);
      expect(screen.getByText('Restaurant')).toBeInTheDocument();
      expect(screen.getByText('Cafe')).toBeInTheDocument();
    });

    it('should render category icons', () => {
      renderWithRouter(<CategoryGrid categories={mockCategories} />);
      expect(screen.getByText('🍽️')).toBeInTheDocument();
      expect(screen.getByText('☕')).toBeInTheDocument();
    });

    it('should render categories as links', () => {
      renderWithRouter(<CategoryGrid categories={mockCategories} />);
      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(2);
      expect(links[0]).toHaveAttribute('href', '/businesses?category=cat-1');
      expect(links[1]).toHaveAttribute('href', '/businesses?category=cat-2');
    });
  });

  describe('subcategories', () => {
    it('should display subcategory count', () => {
      const categoriesWithChildren: Category[] = [
        {
          ...mockCategories[0],
          children: [
            {
              id: 'cat-1-1',
              name: 'Italian',
              slug: 'italian',
              icon: '🍝',
              parentId: 'cat-1',
              displayOrder: 1,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            {
              id: 'cat-1-2',
              name: 'Chinese',
              slug: 'chinese',
              icon: '🥢',
              parentId: 'cat-1',
              displayOrder: 2,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        },
      ];
      renderWithRouter(<CategoryGrid categories={categoriesWithChildren} />);
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should not display count for categories without children', () => {
      renderWithRouter(<CategoryGrid categories={mockCategories} />);
      const { container } = renderWithRouter(<CategoryGrid categories={mockCategories} />);
      const counts = container.querySelectorAll('.category-card__count');
      expect(counts).toHaveLength(0);
    });

    it('should have accessible label for subcategory count', () => {
      const categoriesWithChildren: Category[] = [
        {
          ...mockCategories[0],
          children: [mockCategories[1]],
        },
      ];
      renderWithRouter(<CategoryGrid categories={categoriesWithChildren} />);
      const count = screen.getByLabelText('category.subcategories');
      expect(count).toBeInTheDocument();
    });
  });

  describe('multilingual support', () => {
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
      renderWithRouter(<CategoryGrid categories={multilingualCategories} />);
      expect(screen.getByText('Restaurant')).toBeInTheDocument();
    });

    it('should fall back to English if translation missing', () => {
      const multilingualCategories: Category[] = [
        {
          id: 'cat-1',
          name: { en: 'Restaurant' },
          slug: 'restaurant',
          icon: '🍽️',
          parentId: null,
          displayOrder: 1,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      renderWithRouter(<CategoryGrid categories={multilingualCategories} />);
      expect(screen.getByText('Restaurant')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should hide icon from screen readers', () => {
      const { container } = renderWithRouter(<CategoryGrid categories={mockCategories} />);
      const icons = container.querySelectorAll('.category-card__icon');
      icons.forEach(icon => {
        expect(icon).toHaveAttribute('aria-hidden', 'true');
      });
    });

    it('should render categories with accessible names', () => {
      renderWithRouter(<CategoryGrid categories={mockCategories} />);
      const links = screen.getAllByRole('link');
      expect(links[0]).toHaveTextContent('Restaurant');
      expect(links[1]).toHaveTextContent('Cafe');
    });
  });

  describe('state priority', () => {
    it('should show error over loading', () => {
      renderWithRouter(<CategoryGrid categories={[]} loading={true} error="Error" />);
      expect(screen.getByText('category.errorTitle')).toBeInTheDocument();
      expect(screen.queryByText('common.loading')).not.toBeInTheDocument();
    });

    it('should show error over empty state', () => {
      renderWithRouter(<CategoryGrid categories={[]} error="Error" />);
      expect(screen.getByText('category.errorTitle')).toBeInTheDocument();
      expect(screen.queryByText('category.noCategoriesTitle')).not.toBeInTheDocument();
    });

    it('should show loading over empty state', () => {
      renderWithRouter(<CategoryGrid categories={[]} loading={true} />);
      expect(screen.getByText('common.loading')).toBeInTheDocument();
      expect(screen.queryByText('category.noCategoriesTitle')).not.toBeInTheDocument();
    });
  });

  describe('category without icon', () => {
    it('should render category without icon', () => {
      const categoriesWithoutIcon: Category[] = [
        {
          ...mockCategories[0],
          icon: undefined,
        },
      ];
      renderWithRouter(<CategoryGrid categories={categoriesWithoutIcon} />);
      expect(screen.getByText('Restaurant')).toBeInTheDocument();
      const { container } = renderWithRouter(<CategoryGrid categories={categoriesWithoutIcon} />);
      const icons = container.querySelectorAll('.category-card__icon');
      expect(icons).toHaveLength(0);
    });
  });
});
