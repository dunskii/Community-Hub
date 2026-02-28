/**
 * Accessibility Audit for Phase 4 Business Components
 * WCAG 2.1 AA Compliance Testing
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { BrowserRouter } from 'react-router-dom';
import { BusinessCard } from '../BusinessCard';
import { BusinessList } from '../BusinessList';
import { BusinessFilters } from '../BusinessFilters';
import { CategoryGrid } from '../CategoryGrid';
import type { Business, Category } from '@community-hub/shared';

expect.extend(toHaveNoViolations);

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', dir: () => 'ltr' },
  }),
}));

vi.mock('../../../hooks/useIsOpenNow', () => ({
  useIsOpenNow: () => ({ isOpen: true }),
}));

// Mock data
const mockBusiness: Business = {
  id: 'biz-1',
  slug: 'test-business',
  name: 'Test Business',
  description: 'A test business description',
  categoryPrimaryId: 'cat-1',
  categoryPrimary: {
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
  address: {
    streetAddress: '123 Main St',
    suburb: 'Guildford',
    state: 'NSW',
    postcode: '2161',
    country: 'Australia',
  },
  coordinates: {
    latitude: -33.8688,
    longitude: 151.2093,
  },
  phone: '0412345678',
  email: 'test@example.com',
  website: 'https://example.com',
  operatingHours: {
    monday: { open: '09:00', close: '17:00', closed: false, byAppointment: false },
  },
  photos: ['https://example.com/photo.jpg'],
  verified: true,
  featured: false,
  claimStatus: 'UNCLAIMED',
  ownerId: null,
  priceRange: '$$',
  rating: 4.5,
  reviewCount: 10,
  createdAt: new Date(),
  updatedAt: new Date(),
};

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

describe('Phase 4 Accessibility Audit - WCAG 2.1 AA', () => {
  describe('BusinessCard Component', () => {
    it('should have no axe violations', async () => {
      const { container } = renderWithRouter(<BusinessCard business={mockBusiness} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no axe violations with distance', async () => {
      const { container } = renderWithRouter(
        <BusinessCard business={mockBusiness} distance={1.5} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no axe violations as button', async () => {
      const { container } = renderWithRouter(
        <BusinessCard business={mockBusiness} onClick={() => {}} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no axe violations without photo', async () => {
      const businessWithoutPhoto = { ...mockBusiness, photos: [] };
      const { container } = renderWithRouter(<BusinessCard business={businessWithoutPhoto} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no axe violations with minimal data', async () => {
      const minimalBusiness = {
        ...mockBusiness,
        description: '',
        priceRange: undefined,
        rating: undefined,
        address: undefined,
      };
      const { container } = renderWithRouter(<BusinessCard business={minimalBusiness} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('BusinessList Component', () => {
    it('should have no axe violations with businesses', async () => {
      const { container } = renderWithRouter(
        <BusinessList businesses={[mockBusiness]} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no axe violations with multiple businesses', async () => {
      const businesses = [
        { ...mockBusiness, id: 'biz-1' },
        { ...mockBusiness, id: 'biz-2' },
        { ...mockBusiness, id: 'biz-3' },
      ];
      const { container } = renderWithRouter(
        <BusinessList businesses={businesses} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no axe violations in loading state', async () => {
      const { container } = renderWithRouter(
        <BusinessList businesses={[]} loading={true} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no axe violations in error state', async () => {
      const { container } = renderWithRouter(
        <BusinessList businesses={[]} error="Something went wrong" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no axe violations in empty state', async () => {
      const { container } = renderWithRouter(
        <BusinessList businesses={[]} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('BusinessFilters Component', () => {
    it('should have no axe violations', async () => {
      const { container } = render(
        <BusinessFilters
          filters={{}}
          onChange={() => {}}
          categories={mockCategories}
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no axe violations with filters applied', async () => {
      const { container } = render(
        <BusinessFilters
          filters={{
            search: 'pizza',
            category: 'cat-1',
            openNow: true,
            sort: 'name',
          }}
          onChange={() => {}}
          categories={mockCategories}
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no axe violations in loading state', async () => {
      const { container } = render(
        <BusinessFilters
          filters={{}}
          onChange={() => {}}
          categories={mockCategories}
          loading={true}
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no axe violations without categories', async () => {
      const { container } = render(
        <BusinessFilters
          filters={{}}
          onChange={() => {}}
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('CategoryGrid Component', () => {
    it('should have no axe violations with categories', async () => {
      const { container } = renderWithRouter(
        <CategoryGrid categories={mockCategories} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no axe violations in loading state', async () => {
      const { container } = renderWithRouter(
        <CategoryGrid categories={[]} loading={true} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no axe violations in error state', async () => {
      const { container } = renderWithRouter(
        <CategoryGrid categories={[]} error="Failed to load" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no axe violations in empty state', async () => {
      const { container } = renderWithRouter(
        <CategoryGrid categories={[]} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no axe violations with subcategories', async () => {
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
          ],
        },
      ];
      const { container } = renderWithRouter(
        <CategoryGrid categories={categoriesWithChildren} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Combined Scenarios', () => {
    it('should have no axe violations with full page layout', async () => {
      const { container } = renderWithRouter(
        <div>
          <BusinessFilters
            filters={{}}
            onChange={() => {}}
            categories={mockCategories}
          />
          <BusinessList businesses={[mockBusiness, { ...mockBusiness, id: 'biz-2' }]} />
        </div>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no axe violations with category grid and filters', async () => {
      const { container } = renderWithRouter(
        <div>
          <BusinessFilters
            filters={{}}
            onChange={() => {}}
            categories={mockCategories}
          />
          <CategoryGrid categories={mockCategories} />
        </div>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
