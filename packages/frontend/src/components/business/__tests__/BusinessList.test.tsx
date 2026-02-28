/**
 * Unit tests for BusinessList Component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { BusinessList } from '../BusinessList';
import type { Business } from '@community-hub/shared';

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

// Mock business data
const mockBusiness: Business = {
  id: 'biz-1',
  slug: 'test-business',
  name: 'Test Business',
  description: 'Test description',
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
  operatingHours: {},
  photos: [],
  verified: true,
  featured: false,
  claimStatus: 'UNCLAIMED',
  ownerId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('BusinessList', () => {
  describe('loading state', () => {
    it('should render loading skeletons', () => {
      renderWithRouter(<BusinessList businesses={[]} loading={true} />);
      expect(screen.getByText('common.loading')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
    });

    it('should render 5 skeleton items', () => {
      const { container } = renderWithRouter(<BusinessList businesses={[]} loading={true} />);
      const skeletons = container.querySelectorAll('.business-list__skeleton');
      expect(skeletons).toHaveLength(5);
    });
  });

  describe('error state', () => {
    it('should render error message', () => {
      renderWithRouter(<BusinessList businesses={[]} error="Something went wrong" />);
      expect(screen.getByText('business.errorTitle')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should render error icon', () => {
      renderWithRouter(<BusinessList businesses={[]} error="Error message" />);
      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('should render default empty message', () => {
      renderWithRouter(<BusinessList businesses={[]} />);
      expect(screen.getByText('business.noBusinessesTitle')).toBeInTheDocument();
      expect(screen.getByText('business.noBusinessesDescription')).toBeInTheDocument();
    });

    it('should render custom empty message', () => {
      renderWithRouter(<BusinessList businesses={[]} emptyMessage="Custom empty message" />);
      expect(screen.getByText('Custom empty message')).toBeInTheDocument();
    });

    it('should render empty icon', () => {
      renderWithRouter(<BusinessList businesses={[]} />);
      expect(screen.getByText('🏪')).toBeInTheDocument();
    });
  });

  describe('business list', () => {
    it('should render single business', () => {
      renderWithRouter(<BusinessList businesses={[mockBusiness]} />);
      expect(screen.getByText('Test Business')).toBeInTheDocument();
    });

    it('should render multiple businesses', () => {
      const businesses = [
        { ...mockBusiness, id: 'biz-1', name: 'Business 1' },
        { ...mockBusiness, id: 'biz-2', name: 'Business 2' },
        { ...mockBusiness, id: 'biz-3', name: 'Business 3' },
      ];
      renderWithRouter(<BusinessList businesses={businesses} />);
      expect(screen.getByText('Business 1')).toBeInTheDocument();
      expect(screen.getByText('Business 2')).toBeInTheDocument();
      expect(screen.getByText('Business 3')).toBeInTheDocument();
    });

    it('should render businesses with unique keys', () => {
      const businesses = [
        { ...mockBusiness, id: 'biz-1', name: 'Business 1' },
        { ...mockBusiness, id: 'biz-2', name: 'Business 2' },
      ];
      const { container } = renderWithRouter(<BusinessList businesses={businesses} />);
      const businessCards = container.querySelectorAll('.business-card-link');
      expect(businessCards).toHaveLength(2);
    });
  });

  describe('distances', () => {
    it('should pass distance to business cards', () => {
      const businesses = [mockBusiness];
      const distances = { 'biz-1': 1.5 };
      renderWithRouter(<BusinessList businesses={businesses} distances={distances} />);
      expect(screen.getByText(/1.5/)).toBeInTheDocument();
    });

    it('should handle missing distance data', () => {
      const businesses = [mockBusiness];
      renderWithRouter(<BusinessList businesses={businesses} />);
      expect(screen.queryByText(/common.kilometers/)).not.toBeInTheDocument();
    });
  });

  describe('click handler', () => {
    it('should call onBusinessClick when provided', () => {
      const handleClick = vi.fn();
      renderWithRouter(
        <BusinessList businesses={[mockBusiness]} onBusinessClick={handleClick} />
      );
      const button = screen.getByRole('button');
      button.click();
      expect(handleClick).toHaveBeenCalledWith(mockBusiness);
    });

    it('should render as link when no click handler', () => {
      renderWithRouter(<BusinessList businesses={[mockBusiness]} />);
      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
    });
  });

  describe('state priority', () => {
    it('should show error over loading', () => {
      renderWithRouter(<BusinessList businesses={[]} loading={true} error="Error" />);
      expect(screen.getByText('business.errorTitle')).toBeInTheDocument();
      expect(screen.queryByText('common.loading')).not.toBeInTheDocument();
    });

    it('should show error over empty state', () => {
      renderWithRouter(<BusinessList businesses={[]} error="Error" />);
      expect(screen.getByText('business.errorTitle')).toBeInTheDocument();
      expect(screen.queryByText('business.noBusinessesTitle')).not.toBeInTheDocument();
    });

    it('should show loading over empty state', () => {
      renderWithRouter(<BusinessList businesses={[]} loading={true} />);
      expect(screen.getByText('common.loading')).toBeInTheDocument();
      expect(screen.queryByText('business.noBusinessesTitle')).not.toBeInTheDocument();
    });
  });
});
