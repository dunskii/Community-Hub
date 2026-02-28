/**
 * Unit tests for BusinessCard Component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { BusinessCard } from '../BusinessCard';
import type { Business } from '@community-hub/shared';

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', dir: () => 'ltr' },
  }),
}));

const mockUseIsOpenNow = vi.fn();
vi.mock('../../../hooks/useIsOpenNow', () => ({
  useIsOpenNow: () => mockUseIsOpenNow(),
}));

// Mock business data
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
  photos: [],
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

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('BusinessCard', () => {
  beforeEach(() => {
    // Reset to default mock value
    mockUseIsOpenNow.mockReturnValue({ isOpen: true });
  });

  describe('rendering', () => {
    it('should render business name', () => {
      renderWithRouter(<BusinessCard business={mockBusiness} />);
      expect(screen.getByText('Test Business')).toBeInTheDocument();
    });

    it('should render business description', () => {
      renderWithRouter(<BusinessCard business={mockBusiness} />);
      expect(screen.getByText('A test business description')).toBeInTheDocument();
    });

    it('should render business address', () => {
      renderWithRouter(<BusinessCard business={mockBusiness} />);
      expect(screen.getByText(/123 Main St, Guildford/)).toBeInTheDocument();
    });

    it('should render category name', () => {
      renderWithRouter(<BusinessCard business={mockBusiness} />);
      expect(screen.getByText('Restaurant')).toBeInTheDocument();
    });

    it('should render price range', () => {
      renderWithRouter(<BusinessCard business={mockBusiness} />);
      expect(screen.getByText('$$')).toBeInTheDocument();
    });

    it('should render rating', () => {
      renderWithRouter(<BusinessCard business={mockBusiness} />);
      expect(screen.getByText(/4\.5/)).toBeInTheDocument();
    });

    it('should render review count', () => {
      renderWithRouter(<BusinessCard business={mockBusiness} />);
      expect(screen.getByText('(10)')).toBeInTheDocument();
    });
  });

  describe('status badge', () => {
    it('should show "Open Now" when business is open', () => {
      mockUseIsOpenNow.mockReturnValue({ isOpen: true });
      renderWithRouter(<BusinessCard business={mockBusiness} />);
      expect(screen.getByText('business.openNow')).toBeInTheDocument();
    });

    it('should show "Closed" when business is closed', () => {
      mockUseIsOpenNow.mockReturnValue({ isOpen: false });
      renderWithRouter(<BusinessCard business={mockBusiness} />);
      expect(screen.getByText('business.closed')).toBeInTheDocument();
    });

    it('should show "By Appointment" when business has no regular hours', () => {
      mockUseIsOpenNow.mockReturnValue({ isOpen: null });
      renderWithRouter(<BusinessCard business={mockBusiness} />);
      expect(screen.getByText('business.byAppointment')).toBeInTheDocument();
    });
  });

  describe('distance display', () => {
    it('should render distance in meters when less than 1km', () => {
      renderWithRouter(<BusinessCard business={mockBusiness} distance={0.5} />);
      expect(screen.getByText(/500/)).toBeInTheDocument();
      expect(screen.getByText(/common.meters/)).toBeInTheDocument();
    });

    it('should render distance in kilometers when 1km or more', () => {
      renderWithRouter(<BusinessCard business={mockBusiness} distance={2.5} />);
      expect(screen.getByText(/2.5/)).toBeInTheDocument();
      expect(screen.getByText(/common.kilometers/)).toBeInTheDocument();
    });

    it('should not render distance when not provided', () => {
      renderWithRouter(<BusinessCard business={mockBusiness} />);
      expect(screen.queryByText(/common.meters/)).not.toBeInTheDocument();
      expect(screen.queryByText(/common.kilometers/)).not.toBeInTheDocument();
    });
  });

  describe('photo display', () => {
    it('should render business photo when available', () => {
      const businessWithPhoto = {
        ...mockBusiness,
        photos: ['https://example.com/photo.jpg'],
      };
      const { container } = renderWithRouter(<BusinessCard business={businessWithPhoto} />);
      const img = container.querySelector('.business-card__photo');
      expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg');
      expect(img).toHaveAttribute('loading', 'lazy');
    });

    it('should render avatar when no photo available', () => {
      renderWithRouter(<BusinessCard business={mockBusiness} />);
      // Avatar renders the initials of the name
      expect(screen.getByText('TB')).toBeInTheDocument();
    });
  });

  describe('multilingual support', () => {
    it('should render multilingual name', () => {
      const multilingualBusiness = {
        ...mockBusiness,
        name: { en: 'Test Business', ar: 'اختبار الأعمال' },
      };
      renderWithRouter(<BusinessCard business={multilingualBusiness} />);
      expect(screen.getByText('Test Business')).toBeInTheDocument();
    });

    it('should render multilingual description', () => {
      const multilingualBusiness = {
        ...mockBusiness,
        description: { en: 'A test business', ar: 'اختبار الأعمال' },
      };
      renderWithRouter(<BusinessCard business={multilingualBusiness} />);
      expect(screen.getByText('A test business')).toBeInTheDocument();
    });

    it('should render multilingual category name', () => {
      const multilingualBusiness = {
        ...mockBusiness,
        categoryPrimary: {
          ...mockBusiness.categoryPrimary!,
          name: { en: 'Restaurant', ar: 'مطعم' },
        },
      };
      renderWithRouter(<BusinessCard business={multilingualBusiness} />);
      expect(screen.getByText('Restaurant')).toBeInTheDocument();
    });
  });

  describe('link behavior', () => {
    it('should render as a link by default', () => {
      renderWithRouter(<BusinessCard business={mockBusiness} />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/businesses/test-business');
    });

    it('should render as a button when onClick provided', () => {
      const handleClick = vi.fn();
      renderWithRouter(<BusinessCard business={mockBusiness} onClick={handleClick} />);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    it('should call onClick when button clicked', () => {
      const handleClick = vi.fn();
      renderWithRouter(<BusinessCard business={mockBusiness} onClick={handleClick} />);
      const button = screen.getByRole('button');
      button.click();
      expect(handleClick).toHaveBeenCalledOnce();
    });
  });

  describe('edge cases', () => {
    it('should handle missing description', () => {
      const businessWithoutDesc = { ...mockBusiness, description: '' };
      const { container } = renderWithRouter(<BusinessCard business={businessWithoutDesc} />);
      const description = container.querySelector('.business-card__description');
      expect(description).not.toBeInTheDocument();
    });

    it('should handle missing category', () => {
      const businessWithoutCategory = { ...mockBusiness, categoryPrimary: null };
      renderWithRouter(<BusinessCard business={businessWithoutCategory} />);
      expect(screen.queryByText('Restaurant')).not.toBeInTheDocument();
    });

    it('should handle missing price range', () => {
      const businessWithoutPrice = { ...mockBusiness, priceRange: undefined };
      renderWithRouter(<BusinessCard business={businessWithoutPrice} />);
      expect(screen.queryByText('$$')).not.toBeInTheDocument();
    });

    it('should handle missing rating', () => {
      const businessWithoutRating = { ...mockBusiness, rating: undefined };
      renderWithRouter(<BusinessCard business={businessWithoutRating} />);
      expect(screen.queryByText('4.5')).not.toBeInTheDocument();
    });

    it('should handle missing address', () => {
      const businessWithoutAddress = { ...mockBusiness, address: undefined };
      renderWithRouter(<BusinessCard business={businessWithoutAddress} />);
      expect(screen.queryByText(/123 Main St/)).not.toBeInTheDocument();
    });
  });
});
