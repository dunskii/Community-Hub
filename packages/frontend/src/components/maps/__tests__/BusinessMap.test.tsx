import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { BusinessMap } from '../BusinessMap';

// Mock react-map-gl components
vi.mock('react-map-gl', () => ({
  default: ({ children, onError, initialViewState }: any) => {
    // Store onError for test manipulation
    (global as any).__mapOnError = onError;
    return (
      <div data-testid="mock-map" data-initial-view={JSON.stringify(initialViewState)}>
        {children}
      </div>
    );
  },
  Marker: ({ children, latitude, longitude }: any) => (
    <div data-testid="mock-marker" data-latitude={latitude} data-longitude={longitude}>
      {children}
    </div>
  ),
  NavigationControl: () => <div data-testid="mock-navigation-control">Navigation</div>,
}));

// Mock child components
vi.mock('../MapMarker', () => ({
  MapMarker: ({ businessName }: { businessName: string }) => (
    <div data-testid="map-marker" aria-label={`Location marker for ${businessName}`}>
      Marker
    </div>
  ),
}));

vi.mock('../MapFallback', () => ({
  MapFallback: ({ address }: { address: string }) => (
    <div data-testid="map-fallback" role="region" aria-label="Business location (map unavailable)">
      {address}
    </div>
  ),
}));

// Mock mapbox config
vi.mock('../../../services/maps/mapbox-config', () => ({
  DEFAULT_MAP_STYLE: 'mapbox://styles/mapbox/streets-v12',
  DEFAULT_ZOOM: 15,
}));

describe('BusinessMap', () => {
  const defaultProps = {
    latitude: -33.8567,
    longitude: 150.9876,
    businessName: 'Test Business',
    address: '123 Test Street, Guildford NSW 2161',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    delete (global as any).__mapOnError;
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

    test('renders map component', () => {
      render(<BusinessMap {...defaultProps} />);

      const map = screen.getByTestId('mock-map');
      expect(map).toBeInTheDocument();
    });

    test('renders marker at correct coordinates', () => {
      render(<BusinessMap {...defaultProps} />);

      const marker = screen.getByTestId('mock-marker');
      expect(marker).toHaveAttribute('data-latitude', String(defaultProps.latitude));
      expect(marker).toHaveAttribute('data-longitude', String(defaultProps.longitude));
    });

    test('renders MapMarker component with business name', () => {
      render(<BusinessMap {...defaultProps} />);

      const mapMarker = screen.getByTestId('map-marker');
      expect(mapMarker).toHaveAttribute(
        'aria-label',
        'Location marker for Test Business'
      );
    });

    test('renders navigation control', () => {
      render(<BusinessMap {...defaultProps} />);

      const navControl = screen.getByTestId('mock-navigation-control');
      expect(navControl).toBeInTheDocument();
    });

    test('applies custom className', () => {
      const { container } = render(<BusinessMap {...defaultProps} className="custom-class" />);

      const mapContainer = container.querySelector('.custom-class');
      expect(mapContainer).toBeInTheDocument();
    });

    test('sets initial view state with correct coordinates and zoom', () => {
      render(<BusinessMap {...defaultProps} />);

      const map = screen.getByTestId('mock-map');
      const initialView = JSON.parse(map.getAttribute('data-initial-view') || '{}');

      expect(initialView.latitude).toBe(defaultProps.latitude);
      expect(initialView.longitude).toBe(defaultProps.longitude);
      expect(initialView.zoom).toBe(15);
    });
  });

  describe('error handling', () => {
    test('shows MapFallback when map error occurs', () => {
      render(<BusinessMap {...defaultProps} />);

      // Trigger map error
      const onError = (global as any).__mapOnError;
      expect(onError).toBeDefined();

      // Re-render to simulate error state
      const { rerender } = render(<BusinessMap {...defaultProps} />);
      onError();
      rerender(<BusinessMap {...defaultProps} />);

      // Map should be replaced with fallback
      const fallback = screen.getByTestId('map-fallback');
      expect(fallback).toBeInTheDocument();
      expect(fallback).toHaveTextContent(defaultProps.address);
    });

    test('MapFallback displays correct address', () => {
      // Render and immediately trigger error
      const { rerender } = render(<BusinessMap {...defaultProps} />);
      const onError = (global as any).__mapOnError;
      onError();
      rerender(<BusinessMap {...defaultProps} />);

      const fallback = screen.getByTestId('map-fallback');
      expect(fallback).toHaveTextContent('123 Test Street, Guildford NSW 2161');
    });

    test('does not render map when showing fallback', () => {
      const { rerender } = render(<BusinessMap {...defaultProps} />);
      const onError = (global as any).__mapOnError;
      onError();
      rerender(<BusinessMap {...defaultProps} />);

      expect(screen.queryByTestId('mock-map')).not.toBeInTheDocument();
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

    test('marker has accessible label', () => {
      render(<BusinessMap {...defaultProps} />);

      const marker = screen.getByLabelText('Location marker for Test Business');
      expect(marker).toBeInTheDocument();
    });

    test('fallback has accessible region role', () => {
      const { rerender } = render(<BusinessMap {...defaultProps} />);
      const onError = (global as any).__mapOnError;
      onError();
      rerender(<BusinessMap {...defaultProps} />);

      const fallbackRegion = screen.getByRole('region', {
        name: 'Business location (map unavailable)',
      });
      expect(fallbackRegion).toBeInTheDocument();
    });
  });

  describe('coordinate handling', () => {
    test('handles different coordinate values', () => {
      const props = {
        ...defaultProps,
        latitude: -37.8136,
        longitude: 144.9631,
      };

      render(<BusinessMap {...props} />);

      const marker = screen.getByTestId('mock-marker');
      expect(marker).toHaveAttribute('data-latitude', '-37.8136');
      expect(marker).toHaveAttribute('data-longitude', '144.9631');
    });

    test('handles edge coordinates (near equator)', () => {
      const props = {
        ...defaultProps,
        latitude: 0.1,
        longitude: 100.5,
      };

      render(<BusinessMap {...props} />);

      const marker = screen.getByTestId('mock-marker');
      expect(marker).toHaveAttribute('data-latitude', '0.1');
      expect(marker).toHaveAttribute('data-longitude', '100.5');
    });

    test('handles negative coordinates', () => {
      const props = {
        ...defaultProps,
        latitude: -45.0,
        longitude: -75.0,
      };

      render(<BusinessMap {...props} />);

      const marker = screen.getByTestId('mock-marker');
      expect(marker).toHaveAttribute('data-latitude', '-45');
      expect(marker).toHaveAttribute('data-longitude', '-75');
    });
  });

  describe('prop updates', () => {
    test('updates map when coordinates change', () => {
      const { rerender } = render(<BusinessMap {...defaultProps} />);

      const newProps = {
        ...defaultProps,
        latitude: -34.0,
        longitude: 151.0,
      };

      rerender(<BusinessMap {...newProps} />);

      const marker = screen.getByTestId('mock-marker');
      expect(marker).toHaveAttribute('data-latitude', '-34');
      expect(marker).toHaveAttribute('data-longitude', '151');
    });

    test('updates aria-label when business name changes', () => {
      const { rerender } = render(<BusinessMap {...defaultProps} />);

      const newProps = {
        ...defaultProps,
        businessName: 'New Business Name',
      };

      rerender(<BusinessMap {...newProps} />);

      const region = screen.getByRole('region', {
        name: 'Map showing location of New Business Name',
      });
      expect(region).toBeInTheDocument();
    });
  });
});
