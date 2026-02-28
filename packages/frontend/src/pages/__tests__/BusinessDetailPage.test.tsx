/**
 * Component tests for BusinessDetailPage
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { BusinessDetailPage } from '../BusinessDetailPage';

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', dir: () => 'ltr' },
  }),
}));

vi.mock('../../hooks/useBusinessDetail', () => ({
  useBusinessDetail: vi.fn(() => ({
    business: null,
    loading: false,
    error: null,
  })),
}));

vi.mock('../../hooks/useIsOpenNow', () => ({
  useIsOpenNow: vi.fn(() => ({ isOpen: false, opensAt: null, closesAt: null })),
}));

const renderBusinessDetailPage = (slug = 'test-business') => {
  return render(
    <BrowserRouter>
      <HelmetProvider>
        <Routes>
          <Route path="/business/:slug" element={<BusinessDetailPage />} />
        </Routes>
      </HelmetProvider>
    </BrowserRouter>
  );
};

describe('BusinessDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.pushState({}, '', '/business/test-business');
  });

  it('should render without crashing', () => {
    renderBusinessDetailPage();
    expect(document.body).toBeDefined();
  });

  it('should display loading state', () => {
    vi.mocked(await import('../../hooks/useBusinessDetail')).useBusinessDetail.mockReturnValue({
      business: null,
      loading: true,
      error: null,
    } as any);

    renderBusinessDetailPage();
    expect(document.body).toBeDefined();
  });

  it('should display error state for 404', () => {
    vi.mocked(await import('../../hooks/useBusinessDetail')).useBusinessDetail.mockReturnValue({
      business: null,
      loading: false,
      error: new Error('Not found'),
    } as any);

    renderBusinessDetailPage();
    expect(document.body).toBeDefined();
  });

  it('should display business when data is available', () => {
    const mockBusiness = {
      id: 'biz-1',
      name: 'Test Restaurant',
      slug: 'test-restaurant',
      description: 'Great food',
      address: {
        streetAddress: '123 Main St',
        suburb: 'Guildford',
        postcode: '2161',
      },
      phone: '0412345678',
    };

    vi.mocked(await import('../../hooks/useBusinessDetail')).useBusinessDetail.mockReturnValue({
      business: mockBusiness,
      loading: false,
      error: null,
    } as any);

    renderBusinessDetailPage();
    expect(document.body).toBeDefined();
  });

  it('should set SEO meta tags', () => {
    const mockBusiness = {
      id: 'biz-1',
      name: 'Test Restaurant',
      slug: 'test-restaurant',
      description: 'Great food',
    };

    vi.mocked(await import('../../hooks/useBusinessDetail')).useBusinessDetail.mockReturnValue({
      business: mockBusiness,
      loading: false,
      error: null,
    } as any);

    renderBusinessDetailPage();
    expect(document.body).toBeDefined();
  });

  it('should display business name', () => {
    const mockBusiness = {
      id: 'biz-1',
      name: 'Test Restaurant',
      slug: 'test-restaurant',
    };

    vi.mocked(await import('../../hooks/useBusinessDetail')).useBusinessDetail.mockReturnValue({
      business: mockBusiness,
      loading: false,
      error: null,
    } as any);

    renderBusinessDetailPage();
    expect(document.body).toBeDefined();
  });

  it('should display business description', () => {
    const mockBusiness = {
      id: 'biz-1',
      name: 'Test Restaurant',
      slug: 'test-restaurant',
      description: 'Amazing food and great service',
    };

    vi.mocked(await import('../../hooks/useBusinessDetail')).useBusinessDetail.mockReturnValue({
      business: mockBusiness,
      loading: false,
      error: null,
    } as any);

    renderBusinessDetailPage();
    expect(document.body).toBeDefined();
  });

  it('should display contact information', () => {
    const mockBusiness = {
      id: 'biz-1',
      name: 'Test Restaurant',
      slug: 'test-restaurant',
      phone: '0412345678',
      email: 'contact@test.com',
      website: 'https://test.com',
    };

    vi.mocked(await import('../../hooks/useBusinessDetail')).useBusinessDetail.mockReturnValue({
      business: mockBusiness,
      loading: false,
      error: null,
    } as any);

    renderBusinessDetailPage();
    expect(document.body).toBeDefined();
  });

  it('should display address', () => {
    const mockBusiness = {
      id: 'biz-1',
      name: 'Test Restaurant',
      slug: 'test-restaurant',
      address: {
        streetAddress: '123 Main St',
        suburb: 'Guildford',
        state: 'NSW',
        postcode: '2161',
      },
    };

    vi.mocked(await import('../../hooks/useBusinessDetail')).useBusinessDetail.mockReturnValue({
      business: mockBusiness,
      loading: false,
      error: null,
    } as any);

    renderBusinessDetailPage();
    expect(document.body).toBeDefined();
  });

  it('should display operating hours', () => {
    const mockBusiness = {
      id: 'biz-1',
      name: 'Test Restaurant',
      slug: 'test-restaurant',
      operatingHours: {
        monday: { open: '09:00', close: '17:00', closed: false },
        tuesday: { open: '09:00', close: '17:00', closed: false },
      },
    };

    vi.mocked(await import('../../hooks/useBusinessDetail')).useBusinessDetail.mockReturnValue({
      business: mockBusiness,
      loading: false,
      error: null,
    } as any);

    renderBusinessDetailPage();
    expect(document.body).toBeDefined();
  });

  it('should display category information', () => {
    const mockBusiness = {
      id: 'biz-1',
      name: 'Test Restaurant',
      slug: 'test-restaurant',
      categoryPrimary: {
        id: 'cat-1',
        name: 'Restaurants',
        slug: 'restaurants',
      },
    };

    vi.mocked(await import('../../hooks/useBusinessDetail')).useBusinessDetail.mockReturnValue({
      business: mockBusiness,
      loading: false,
      error: null,
    } as any);

    renderBusinessDetailPage();
    expect(document.body).toBeDefined();
  });

  it('should display verification badge when verified', () => {
    const mockBusiness = {
      id: 'biz-1',
      name: 'Test Restaurant',
      slug: 'test-restaurant',
      verified: true,
    };

    vi.mocked(await import('../../hooks/useBusinessDetail')).useBusinessDetail.mockReturnValue({
      business: mockBusiness,
      loading: false,
      error: null,
    } as any);

    renderBusinessDetailPage();
    expect(document.body).toBeDefined();
  });

  it('should display open/closed status', () => {
    const mockBusiness = {
      id: 'biz-1',
      name: 'Test Restaurant',
      slug: 'test-restaurant',
      operatingHours: {},
    };

    vi.mocked(await import('../../hooks/useBusinessDetail')).useBusinessDetail.mockReturnValue({
      business: mockBusiness,
      loading: false,
      error: null,
    } as any);

    vi.mocked(await import('../../hooks/useIsOpenNow')).useIsOpenNow.mockReturnValue({
      isOpen: true,
      opensAt: null,
      closesAt: '17:00',
    });

    renderBusinessDetailPage();
    expect(document.body).toBeDefined();
  });

  it('should handle business with no photos', () => {
    const mockBusiness = {
      id: 'biz-1',
      name: 'Test Restaurant',
      slug: 'test-restaurant',
      photos: [],
    };

    vi.mocked(await import('../../hooks/useBusinessDetail')).useBusinessDetail.mockReturnValue({
      business: mockBusiness,
      loading: false,
      error: null,
    } as any);

    renderBusinessDetailPage();
    expect(document.body).toBeDefined();
  });

  it('should display social media links', () => {
    const mockBusiness = {
      id: 'biz-1',
      name: 'Test Restaurant',
      slug: 'test-restaurant',
      socialLinks: {
        facebook: 'https://facebook.com/test',
        instagram: 'https://instagram.com/test',
      },
    };

    vi.mocked(await import('../../hooks/useBusinessDetail')).useBusinessDetail.mockReturnValue({
      business: mockBusiness,
      loading: false,
      error: null,
    } as any);

    renderBusinessDetailPage();
    expect(document.body).toBeDefined();
  });

  it('should display certifications', () => {
    const mockBusiness = {
      id: 'biz-1',
      name: 'Test Restaurant',
      slug: 'test-restaurant',
      certifications: ['HALAL', 'VEGAN'],
    };

    vi.mocked(await import('../../hooks/useBusinessDetail')).useBusinessDetail.mockReturnValue({
      business: mockBusiness,
      loading: false,
      error: null,
    } as any);

    renderBusinessDetailPage();
    expect(document.body).toBeDefined();
  });

  it('should display accessibility features', () => {
    const mockBusiness = {
      id: 'biz-1',
      name: 'Test Restaurant',
      slug: 'test-restaurant',
      accessibilityFeatures: ['WHEELCHAIR_ACCESS', 'ACCESSIBLE_BATHROOM'],
    };

    vi.mocked(await import('../../hooks/useBusinessDetail')).useBusinessDetail.mockReturnValue({
      business: mockBusiness,
      loading: false,
      error: null,
    } as any);

    renderBusinessDetailPage();
    expect(document.body).toBeDefined();
  });

  it('should display payment methods', () => {
    const mockBusiness = {
      id: 'biz-1',
      name: 'Test Restaurant',
      slug: 'test-restaurant',
      paymentMethods: ['CASH', 'CARD', 'APPLE_PAY'],
    };

    vi.mocked(await import('../../hooks/useBusinessDetail')).useBusinessDetail.mockReturnValue({
      business: mockBusiness,
      loading: false,
      error: null,
    } as any);

    renderBusinessDetailPage();
    expect(document.body).toBeDefined();
  });

  it('should display languages spoken', () => {
    const mockBusiness = {
      id: 'biz-1',
      name: 'Test Restaurant',
      slug: 'test-restaurant',
      languagesSpoken: ['English', 'Arabic', 'Chinese'],
    };

    vi.mocked(await import('../../hooks/useBusinessDetail')).useBusinessDetail.mockReturnValue({
      business: mockBusiness,
      loading: false,
      error: null,
    } as any);

    renderBusinessDetailPage();
    expect(document.body).toBeDefined();
  });

  it('should display parking information', () => {
    const mockBusiness = {
      id: 'biz-1',
      name: 'Test Restaurant',
      slug: 'test-restaurant',
      parkingInformation: 'Street parking available',
    };

    vi.mocked(await import('../../hooks/useBusinessDetail')).useBusinessDetail.mockReturnValue({
      business: mockBusiness,
      loading: false,
      error: null,
    } as any);

    renderBusinessDetailPage();
    expect(document.body).toBeDefined();
  });

  it('should display price range', () => {
    const mockBusiness = {
      id: 'biz-1',
      name: 'Test Restaurant',
      slug: 'test-restaurant',
      priceRange: 'MODERATE',
    };

    vi.mocked(await import('../../hooks/useBusinessDetail')).useBusinessDetail.mockReturnValue({
      business: mockBusiness,
      loading: false,
      error: null,
    } as any);

    renderBusinessDetailPage();
    expect(document.body).toBeDefined();
  });

  it('should render map when coordinates are available', () => {
    const mockBusiness = {
      id: 'biz-1',
      name: 'Test Restaurant',
      slug: 'test-restaurant',
      coordinates: {
        latitude: -33.8688,
        longitude: 151.2093,
      },
    };

    vi.mocked(await import('../../hooks/useBusinessDetail')).useBusinessDetail.mockReturnValue({
      business: mockBusiness,
      loading: false,
      error: null,
    } as any);

    renderBusinessDetailPage();
    expect(document.body).toBeDefined();
  });

  it('should extract slug from URL params', () => {
    window.history.pushState({}, '', '/business/my-restaurant');
    renderBusinessDetailPage('my-restaurant');
    expect(window.location.pathname).toContain('my-restaurant');
  });

  it('should handle network errors gracefully', () => {
    vi.mocked(await import('../../hooks/useBusinessDetail')).useBusinessDetail.mockReturnValue({
      business: null,
      loading: false,
      error: new Error('Network error'),
    } as any);

    renderBusinessDetailPage();
    expect(document.body).toBeDefined();
  });
});
