/**
 * HomePage Component Tests
 * Phase 5: Search & Discovery
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HomePage } from '../HomePage.js';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock geolocation API
const mockGeolocation = {
  getCurrentPosition: vi.fn((success) => {
    success({
      coords: {
        latitude: -33.8688,
        longitude: 151.2093,
      },
    });
  }),
};

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

// Mock child components
vi.mock('../components/search/SearchBar.js', () => ({
  SearchBar: () => <div data-testid="search-bar">SearchBar</div>,
}));

vi.mock('../components/home/HeroSection.js', () => ({
  HeroSection: () => <div data-testid="hero-section">Hero</div>,
}));

vi.mock('../components/home/StatsStrip.js', () => ({
  StatsStrip: () => <div data-testid="stats-strip">Stats</div>,
}));

vi.mock('../components/home/FeaturedBusinesses.js', () => ({
  FeaturedBusinesses: () => <div data-testid="featured-businesses">Featured</div>,
}));

vi.mock('../components/home/NearYouSection.js', () => ({
  NearYouSection: ({ latitude, longitude }: any) => (
    <div data-testid="near-you-section">
      Near You: {latitude},{longitude}
    </div>
  ),
}));

vi.mock('../components/home/HighlyRatedSection.js', () => ({
  HighlyRatedSection: () => <div data-testid="highly-rated-section">Highly Rated</div>,
}));

vi.mock('../components/home/NewBusinessesSection.js', () => ({
  NewBusinessesSection: () => <div data-testid="new-businesses-section">New</div>,
}));

vi.mock('../components/home/CategoryShowcase.js', () => ({
  CategoryShowcase: () => <div data-testid="category-showcase">Categories</div>,
}));

vi.mock('../components/home/QuickFilters.js', () => ({
  QuickFilters: () => <div data-testid="quick-filters">Quick Filters</div>,
}));

describe('HomePage', () => {
  describe('Rendering', () => {
    it('should render all main sections', async () => {
      render(<HomePage />);

      expect(screen.getByTestId('hero-section')).toBeInTheDocument();
      expect(screen.getByTestId('quick-filters')).toBeInTheDocument();
      expect(screen.getByTestId('stats-strip')).toBeInTheDocument();
      expect(screen.getByTestId('featured-businesses')).toBeInTheDocument();
      expect(screen.getByTestId('highly-rated-section')).toBeInTheDocument();
      expect(screen.getByTestId('new-businesses-section')).toBeInTheDocument();
      expect(screen.getByTestId('category-showcase')).toBeInTheDocument();
    });

    it('should render Near You section with geolocation', async () => {
      render(<HomePage />);

      // Wait for geolocation
      await vi.waitFor(() => {
        expect(screen.getByTestId('near-you-section')).toBeInTheDocument();
      });

      expect(screen.getByText(/Near You: -33.8688,151.2093/)).toBeInTheDocument();
    });

    it('should not render Near You section without geolocation', () => {
      const mockGeoFail = {
        getCurrentPosition: vi.fn((success, error) => {
          error({ message: 'Permission denied' });
        }),
      };

      Object.defineProperty(global.navigator, 'geolocation', {
        value: mockGeoFail,
        writable: true,
      });

      render(<HomePage />);

      expect(screen.queryByTestId('near-you-section')).not.toBeInTheDocument();
    });
  });

  describe('Page Structure', () => {
    it('should have proper layout structure', () => {
      render(<HomePage />);

      expect(screen.getByTestId('hero-section')).toBeInTheDocument();
      expect(screen.getByTestId('stats-strip')).toBeInTheDocument();
    });
  });

  describe('Responsive Layout', () => {
    it('should apply responsive container classes', () => {
      const { container } = render(<HomePage />);

      const mainContent = container.querySelector('.max-w-screen-xl');
      expect(mainContent).toBeInTheDocument();
      expect(mainContent).toHaveClass('mx-auto', 'px-4', 'sm:px-6', 'lg:px-8');
    });
  });
});
