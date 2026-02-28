/**
 * Accessibility Tests for Phase 4 Business Components
 * WCAG 2.1 AA Compliance using jest-axe
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { BrowserRouter } from 'react-router-dom';
import { BusinessCard } from '../BusinessCard';
import { BusinessList } from '../BusinessList';
import { BusinessFilters } from '../BusinessFilters';
import { CategoryGrid } from '../CategoryGrid';
import { OperatingHoursDisplay } from '../OperatingHoursDisplay';

expect.extend(toHaveNoViolations);

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', dir: () => 'ltr' },
  }),
}));

vi.mock('../../../hooks/useIsOpenNow', () => ({
  useIsOpenNow: () => ({ isOpen: true, opensAt: null, closesAt: null }),
}));

const mockBusiness = {
  id: 'biz-1',
  slug: 'test-business',
  name: 'Test Business',
  description: { en: 'Test description' },
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
    street: '123 Main St',
    suburb: 'Guildford',
    postcode: '2161',
  },
  phone: '+61412345678',
  verified: true,
  rating: 4.5,
  reviewCount: 10,
  status: 'ACTIVE' as const,
};

const mockCategory = {
  id: 'cat-1',
  name: 'Restaurants',
  slug: 'restaurants',
  icon: '🍽️',
  description: 'Find great restaurants',
  businessCount: 10,
  parentId: null,
  displayOrder: 1,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockOperatingHours = {
  monday: { open: '09:00', close: '17:00', closed: false, byAppointment: false },
  tuesday: { open: '09:00', close: '17:00', closed: false, byAppointment: false },
  wednesday: { open: '09:00', close: '17:00', closed: false, byAppointment: false },
  thursday: { open: '09:00', close: '17:00', closed: false, byAppointment: false },
  friday: { open: '09:00', close: '17:00', closed: false, byAppointment: false },
  saturday: { open: '09:00', close: '17:00', closed: false, byAppointment: false },
  sunday: { open: '09:00', close: '17:00', closed: true, byAppointment: false },
  publicHolidays: { open: '09:00', close: '17:00', closed: true, byAppointment: false },
};

describe('Phase 4 Components - Accessibility Tests', () => {
  describe('BusinessCard', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <BrowserRouter>
          <BusinessCard business={mockBusiness} />
        </BrowserRouter>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have accessible name for business link', async () => {
      const { container } = render(
        <BrowserRouter>
          <BusinessCard business={mockBusiness} />
        </BrowserRouter>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('BusinessList', () => {
    it('should have no accessibility violations with empty list', async () => {
      const { container } = render(
        <BrowserRouter>
          <BusinessList businesses={[]} />
        </BrowserRouter>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations with businesses', async () => {
      const { container } = render(
        <BrowserRouter>
          <BusinessList businesses={[mockBusiness]} />
        </BrowserRouter>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations in loading state', async () => {
      const { container } = render(
        <BrowserRouter>
          <BusinessList businesses={[]} loading={true} />
        </BrowserRouter>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('BusinessFilters', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <BrowserRouter>
          <BusinessFilters
            filters={{}}
            categories={[mockCategory]}
            onFiltersChange={() => {}}
          />
        </BrowserRouter>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have accessible form controls', async () => {
      const { container } = render(
        <BrowserRouter>
          <BusinessFilters
            filters={{}}
            categories={[mockCategory]}
            onFiltersChange={() => {}}
          />
        </BrowserRouter>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('CategoryGrid', () => {
    it('should have no accessibility violations with empty categories', async () => {
      const { container } = render(
        <BrowserRouter>
          <CategoryGrid categories={[]} />
        </BrowserRouter>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations with categories', async () => {
      const { container } = render(
        <BrowserRouter>
          <CategoryGrid categories={[mockCategory]} />
        </BrowserRouter>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have accessible links for category cards', async () => {
      const { container } = render(
        <BrowserRouter>
          <CategoryGrid categories={[mockCategory]} />
        </BrowserRouter>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('OperatingHoursDisplay', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <OperatingHoursDisplay hours={mockOperatingHours} />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have accessible table structure', async () => {
      const { container } = render(
        <OperatingHoursDisplay hours={mockOperatingHours} />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should handle closed days accessibly', async () => {
      const { container } = render(
        <OperatingHoursDisplay
          hours={{
            ...mockOperatingHours,
            sunday: { open: '09:00', close: '17:00', closed: true, byAppointment: false },
          }}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Combined Components', () => {
    it('should have no violations with multiple business cards', async () => {
      const businesses = [
        mockBusiness,
        { ...mockBusiness, id: 'biz-2', slug: 'test-business-2', name: 'Test Business 2' },
        { ...mockBusiness, id: 'biz-3', slug: 'test-business-3', name: 'Test Business 3' },
      ];

      const { container } = render(
        <BrowserRouter>
          <BusinessList businesses={businesses} />
        </BrowserRouter>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations with filters and results', async () => {
      const { container } = render(
        <BrowserRouter>
          <div>
            <BusinessFilters
              filters={{}}
              categories={[mockCategory]}
              onFiltersChange={() => {}}
            />
            <BusinessList businesses={[mockBusiness]} />
          </div>
        </BrowserRouter>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard Navigation', () => {
    it('BusinessCard should be keyboard accessible', async () => {
      const { container } = render(
        <BrowserRouter>
          <BusinessCard business={mockBusiness} />
        </BrowserRouter>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('BusinessFilters controls should be keyboard accessible', async () => {
      const { container } = render(
        <BrowserRouter>
          <BusinessFilters
            filters={{}}
            categories={[mockCategory]}
            onFiltersChange={() => {}}
          />
        </BrowserRouter>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Screen Reader Support', () => {
    it('BusinessCard should have appropriate ARIA labels', async () => {
      const { container } = render(
        <BrowserRouter>
          <BusinessCard business={mockBusiness} />
        </BrowserRouter>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('OperatingHoursDisplay should have accessible table headers', async () => {
      const { container } = render(
        <OperatingHoursDisplay hours={mockOperatingHours} />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
