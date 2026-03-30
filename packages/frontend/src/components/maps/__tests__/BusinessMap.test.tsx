import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { BusinessMap } from '../BusinessMap';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) => {
      const translations: Record<string, string> = {
        mapShowingLocation: `Map showing location of ${params?.name ?? ''}`,
        mapAlt: `Map showing ${params?.name ?? ''} at ${params?.address ?? ''}`,
        mapUnavailable: 'Business location (map unavailable)',
      };
      return translations[key] ?? key;
    },
    i18n: { language: 'en', dir: () => 'ltr' },
  }),
}));

// Mock platform config
vi.mock('../../../config/platform-loader', () => ({
  getPlatformConfig: () => ({
    branding: {
      colors: { primary: '#2C5F7C' },
    },
  }),
}));

// Mock MapFallback
vi.mock('../MapFallback', () => ({
  MapFallback: ({ address }: { address: string }) => (
    <div data-testid="map-fallback" role="region" aria-label="Business location (map unavailable)">
      {address}
    </div>
  ),
}));

describe('BusinessMap', () => {
  const defaultProps = {
    latitude: -33.8567,
    longitude: 150.9876,
    businessName: 'Test Business',
    address: '123 Test Street, Sydney NSW 2000',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    import.meta.env.VITE_MAPBOX_ACCESS_TOKEN = 'pk.test_token';
  });

  afterEach(() => {
    cleanup();
  });

  describe('rendering', () => {
    test('renders map container with correct ARIA label', () => {
      render(<BusinessMap {...defaultProps} />);

      const container = screen.getByRole('region', {
        name: 'Map showing location of Test Business',
      });
      expect(container).toBeInTheDocument();
    });

    test('renders static map image', () => {
      render(<BusinessMap {...defaultProps} />);

      const img = screen.getByRole('img');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('alt', 'Map showing Test Business at 123 Test Street, Sydney NSW 2000');
    });

    test('image src contains correct coordinates', () => {
      render(<BusinessMap {...defaultProps} />);

      const img = screen.getByRole('img');
      const src = img.getAttribute('src') || '';
      expect(src).toContain('150.9876,-33.8567');
    });

    test('image src contains marker pin with config color', () => {
      render(<BusinessMap {...defaultProps} />);

      const img = screen.getByRole('img');
      const src = img.getAttribute('src') || '';
      expect(src).toContain('pin-l+2C5F7C');
    });

    test('image uses lazy loading', () => {
      render(<BusinessMap {...defaultProps} />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('loading', 'lazy');
    });

    test('image src uses retina @2x', () => {
      render(<BusinessMap {...defaultProps} />);

      const img = screen.getByRole('img');
      const src = img.getAttribute('src') || '';
      expect(src).toContain('@2x');
    });

    test('applies custom className', () => {
      const { container } = render(<BusinessMap {...defaultProps} className="custom-class" />);

      const mapContainer = container.querySelector('.custom-class');
      expect(mapContainer).toBeInTheDocument();
    });

    test('applies responsive height classes when no className provided', () => {
      const { container } = render(<BusinessMap {...defaultProps} />);

      const mapContainer = container.querySelector('[role="region"]');
      expect(mapContainer?.className).toContain('h-64');
      expect(mapContainer?.className).toContain('sm:h-80');
      expect(mapContainer?.className).toContain('md:h-96');
    });
  });

  describe('error handling', () => {
    test('shows MapFallback when image fails to load', () => {
      render(<BusinessMap {...defaultProps} />);

      const img = screen.getByRole('img');
      fireEvent.error(img);

      const fallback = screen.getByTestId('map-fallback');
      expect(fallback).toBeInTheDocument();
      expect(fallback).toHaveTextContent(defaultProps.address);
    });

    test('shows MapFallback when no token is configured', () => {
      import.meta.env.VITE_MAPBOX_ACCESS_TOKEN = '';

      render(<BusinessMap {...defaultProps} />);

      const fallback = screen.getByTestId('map-fallback');
      expect(fallback).toBeInTheDocument();
    });

    test('does not render image when showing fallback', () => {
      render(<BusinessMap {...defaultProps} />);

      const img = screen.getByRole('img');
      fireEvent.error(img);

      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    test('shows MapFallback for NaN latitude', () => {
      render(<BusinessMap {...defaultProps} latitude={NaN} />);

      const fallback = screen.getByTestId('map-fallback');
      expect(fallback).toBeInTheDocument();
    });

    test('shows MapFallback for Infinity longitude', () => {
      render(<BusinessMap {...defaultProps} longitude={Infinity} />);

      const fallback = screen.getByTestId('map-fallback');
      expect(fallback).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    test('has region role with descriptive label', () => {
      render(<BusinessMap {...defaultProps} />);

      const region = screen.getByRole('region', {
        name: 'Map showing location of Test Business',
      });
      expect(region).toBeInTheDocument();
    });

    test('image has descriptive alt text', () => {
      render(<BusinessMap {...defaultProps} />);

      const img = screen.getByAltText('Map showing Test Business at 123 Test Street, Sydney NSW 2000');
      expect(img).toBeInTheDocument();
    });

    test('fallback has accessible region role', () => {
      import.meta.env.VITE_MAPBOX_ACCESS_TOKEN = '';

      render(<BusinessMap {...defaultProps} />);

      const fallbackRegion = screen.getByRole('region', {
        name: 'Business location (map unavailable)',
      });
      expect(fallbackRegion).toBeInTheDocument();
    });
  });

  describe('prop updates', () => {
    test('updates image when coordinates change', () => {
      const { rerender } = render(<BusinessMap {...defaultProps} />);

      const newProps = {
        ...defaultProps,
        latitude: -34.0,
        longitude: 151.0,
      };

      rerender(<BusinessMap {...newProps} />);

      const img = screen.getByRole('img');
      const src = img.getAttribute('src') || '';
      expect(src).toContain('151,-34');
    });

    test('updates aria-label when business name changes', () => {
      const { rerender } = render(<BusinessMap {...defaultProps} />);

      rerender(<BusinessMap {...defaultProps} businessName="New Business Name" />);

      const region = screen.getByRole('region', {
        name: 'Map showing location of New Business Name',
      });
      expect(region).toBeInTheDocument();
    });
  });
});
