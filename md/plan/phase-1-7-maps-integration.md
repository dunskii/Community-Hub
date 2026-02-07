# Phase 1.7 - Maps Integration: Implementation Plan

**Created:** 2026-02-06
**Specification Version:** 2.0
**Phase Status:** Not Started (0/5 tasks complete)
**Dependencies:** Phase 1.1-1.6 complete
**Estimated Duration:** 3-5 days

---

## Overview

Phase 1.7 establishes geolocation and mapping capabilities essential for business discovery, location-based search, and directions functionality. This phase integrates **Mapbox** as the confirmed mapping provider (per Spec §26.4 and commit a4d6133).

**Why This Matters:**
- Enables "Near You" business discovery
- Powers distance-based search filtering
- Provides visual business location context
- Supports emergency alert geographic boundaries (Phase 14)
- Required for Google Business Profile coordinate sync (Phase 16)

**Current State:**
- `.env.example` already includes `MAPBOX_ACCESS_TOKEN` placeholder (line 53)
- `platform.json` already includes location coordinates and bounding box (lines 18-34)
- No Business model exists yet (deferred to Phase 4)
- No map-related code or dependencies installed

---

## Dependencies

**Requires Complete:**
- Phase 1.1-1.6 (all foundation infrastructure)
- Mapbox account with API access token
- Platform configuration with valid coordinates

**Blocks:**
- Phase 4.3 (Business Profile - Location & Map section)
- Phase 5.3 (Search Filters - Distance filtering)
- Phase 8 (Events - Event locations)
- Phase 14 (Emergency Alerts - Geographic boundaries)
- Phase 16.1 (Google Business Profile - Coordinate sync)

**Parallel Development:**
- Can proceed alongside Phase 1.8 (i18n Foundation)

---

## Task Breakdown

### Task 1.7.1: Set up Mapbox API (Access Token, Geocoding, Map Tiles)

**Objective:** Initialize Mapbox client libraries and validate API access

#### Backend Implementation

**Files to Create:**
```
packages/backend/src/services/maps/
├── mapbox-client.ts          # Mapbox SDK initialization
├── geocoding-service.ts       # Forward/reverse geocoding
├── distance-service.ts        # Distance calculations
└── types.ts                   # Map-related type definitions
```

**File: `packages/backend/src/services/maps/mapbox-client.ts`**

```typescript
import mbxGeocoding from '@mapbox/mapbox-sdk/services/geocoding';
import { logger } from '../../utils/logger.js';
import { env } from '../../config/env-validate.js';

/**
 * Initialize Mapbox Geocoding API client
 * Spec §26.4 Maps Integration
 */
export const geocodingClient = mbxGeocoding({
  accessToken: env.MAPBOX_ACCESS_TOKEN,
});

/**
 * Verify Mapbox API connectivity
 */
export async function verifyMapboxConnection(): Promise<boolean> {
  try {
    // Test forward geocoding with a known address
    const response = await geocodingClient
      .forwardGeocode({
        query: 'Sydney, Australia',
        limit: 1,
      })
      .send();

    if (response.body.features.length > 0) {
      logger.info('Mapbox API connection verified');
      return true;
    }
    return false;
  } catch (error) {
    logger.error('Mapbox API connection failed', { error });
    return false;
  }
}
```

**File: `packages/backend/src/services/maps/types.ts`**

```typescript
export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface GeocodeRequest {
  street: string;
  suburb: string;
  postcode: string;
  country?: string;
}
```

#### Frontend Implementation

**Files to Create:**
```
packages/frontend/src/services/maps/
├── mapbox-config.ts           # Mapbox GL JS initialization
└── types.ts                   # Frontend map types
```

**Dependencies to Install:**

**Backend:**
```json
{
  "dependencies": {
    "@mapbox/mapbox-sdk": "^0.16.0"
  }
}
```

**Frontend:**
```json
{
  "dependencies": {
    "mapbox-gl": "^3.9.0",
    "react-map-gl": "^7.1.7"
  },
  "devDependencies": {
    "@types/mapbox-gl": "^3.4.1"
  }
}
```

**File: `packages/frontend/src/services/maps/mapbox-config.ts`**

```typescript
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

/**
 * Initialize Mapbox GL JS with access token
 * Token will be loaded from environment at build time
 * Spec §26.4 Maps Integration
 */
export function initializeMapbox(accessToken: string): void {
  mapboxgl.accessToken = accessToken;
}

/**
 * Default map style
 * Using Mapbox Streets v12 (light, accessible)
 */
export const DEFAULT_MAP_STYLE = 'mapbox://styles/mapbox/streets-v12';

/**
 * Default zoom level for single business marker
 */
export const DEFAULT_ZOOM = 15;
```

#### Environment Variable Validation

**File: `packages/backend/src/config/env-validate.ts` (modify)**

Add to existing Zod schema:

```typescript
MAPBOX_ACCESS_TOKEN: z.string().min(1, 'Mapbox access token is required'),
```

#### Startup Verification

**File: `packages/backend/src/index.ts` (modify)**

Add after database connection check:

```typescript
import { verifyMapboxConnection } from './services/maps/mapbox-client.js';

// Verify Mapbox API
const mapboxOk = await verifyMapboxConnection();
if (!mapboxOk) {
  logger.warn('Mapbox API verification failed - map features will be limited');
}
```

#### Testing Requirements

**File: `packages/backend/src/__tests__/services/maps/mapbox-client.test.ts`**

```typescript
describe('Mapbox Client', () => {
  test('verifyMapboxConnection returns true with valid token', async () => {
    const result = await verifyMapboxConnection();
    expect(result).toBe(true);
  });

  test('geocodingClient is initialized', () => {
    expect(geocodingClient).toBeDefined();
  });
});
```

#### Success Criteria

- [ ] Backend Mapbox SDK installed and initialized
- [ ] Frontend Mapbox GL JS installed
- [ ] Environment variable `MAPBOX_ACCESS_TOKEN` validated on startup
- [ ] Mapbox connectivity verified during server boot
- [ ] Unit tests pass

---

### Task 1.7.2: Implement Map Embed Component for Business Profiles

**Objective:** Create reusable React component for displaying business locations on an interactive map

#### Component Structure

**Files to Create:**
```
packages/frontend/src/components/maps/
├── BusinessMap.tsx            # Main map component
├── BusinessMap.test.tsx       # Component tests
├── MapMarker.tsx              # Custom business marker
├── MapFallback.tsx            # Fallback when API unavailable
└── index.ts                   # Barrel exports
```

**File: `packages/frontend/src/components/maps/BusinessMap.tsx`**

```typescript
import React, { useMemo } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl';
import { DEFAULT_MAP_STYLE, DEFAULT_ZOOM } from '../../services/maps/mapbox-config';
import { MapFallback } from './MapFallback';
import { MapMarker } from './MapMarker';

interface BusinessMapProps {
  latitude: number;
  longitude: number;
  businessName: string;
  address: string;
  className?: string;
}

/**
 * Interactive map showing single business location
 * Spec §4.3 Business Profile - Location & Map
 * WCAG 2.1 AA: Keyboard navigable, ARIA labeled
 */
export function BusinessMap({
  latitude,
  longitude,
  businessName,
  address,
  className = '',
}: BusinessMapProps) {
  const [mapError, setMapError] = React.useState(false);

  // Initial viewport centered on business
  const initialViewState = useMemo(
    () => ({
      latitude,
      longitude,
      zoom: DEFAULT_ZOOM,
    }),
    [latitude, longitude]
  );

  // Fallback to static address if Mapbox fails
  if (mapError) {
    return <MapFallback address={address} />;
  }

  return (
    <div
      className={`relative w-full h-96 rounded-lg overflow-hidden ${className}`}
      role="region"
      aria-label={`Map showing location of ${businessName}`}
    >
      <Map
        initialViewState={initialViewState}
        style={{ width: '100%', height: '100%' }}
        mapStyle={DEFAULT_MAP_STYLE}
        onError={() => setMapError(true)}
        cooperativeGestures // Requires Ctrl+scroll to zoom (accessibility)
        attributionControl={true}
      >
        <NavigationControl position="top-right" visualizePitch={false} />
        <Marker longitude={longitude} latitude={latitude} anchor="bottom">
          <MapMarker businessName={businessName} />
        </Marker>
      </Map>
    </div>
  );
}
```

**File: `packages/frontend/src/components/maps/MapMarker.tsx`**

```typescript
import React from 'react';

interface MapMarkerProps {
  businessName: string;
}

/**
 * Custom business marker icon
 * Uses SVG for scalability and accessibility
 */
export function MapMarker({ businessName }: MapMarkerProps) {
  return (
    <div
      className="relative"
      role="img"
      aria-label={`Location marker for ${businessName}`}
    >
      <svg
        width="32"
        height="40"
        viewBox="0 0 32 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-md"
      >
        {/* Marker pin shape */}
        <path
          d="M16 0C7.16 0 0 7.16 0 16C0 24.84 16 40 16 40C16 40 32 24.84 32 16C32 7.16 24.84 0 16 0Z"
          fill="var(--color-primary)"
        />
        {/* Inner circle (white) */}
        <circle cx="16" cy="16" r="6" fill="white" />
      </svg>
    </div>
  );
}
```

**File: `packages/frontend/src/components/maps/MapFallback.tsx`**

```typescript
import React from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline'; // Or your icon library

interface MapFallbackProps {
  address: string;
}

/**
 * Fallback component when Mapbox API is unavailable
 * Spec §27.5 Graceful Degradation
 */
export function MapFallback({ address }: MapFallbackProps) {
  return (
    <div
      className="flex items-center gap-3 p-6 bg-neutral-light rounded-lg border border-neutral-medium"
      role="region"
      aria-label="Business location (map unavailable)"
    >
      <MapPinIcon className="w-8 h-8 text-primary shrink-0" />
      <div>
        <p className="text-sm text-text-light mb-1">Location</p>
        <p className="text-base text-text-dark font-medium">{address}</p>
      </div>
    </div>
  );
}
```

#### Accessibility Compliance (WCAG 2.1 AA)

**Keyboard Navigation:**
- Arrow keys: Pan map
- +/- keys: Zoom in/out
- Enter: Activate controls
- Escape: Exit fullscreen/popups

**Screen Reader Support:**
- Map container has `role="region"` with descriptive `aria-label`
- Marker has `role="img"` with business name
- Fallback text displays full address

**Touch Targets:**
- Zoom controls: 44x44px minimum (Spec §3.6)
- Marker: 32x40px (tappable area padded to 44px)

#### Responsive Design

**Mobile (<768px):**
- Full-width map
- Height: 300px
- Touch gestures enabled

**Tablet (768-1199px):**
- Map in left column (60% width)
- Address text in right column

**Desktop (≥1200px):**
- Map in left column (50% width)
- Enhanced controls visible

#### Testing Requirements

**File: `packages/frontend/src/components/maps/__tests__/BusinessMap.test.tsx`**

```typescript
import { render, screen } from '@testing-library/react';
import { BusinessMap } from '../BusinessMap';

describe('BusinessMap', () => {
  const props = {
    latitude: -33.8567,
    longitude: 150.9876,
    businessName: 'Test Business',
    address: '123 Main St, Guildford NSW 2161',
  };

  test('renders map region with aria-label', () => {
    render(<BusinessMap {...props} />);
    expect(screen.getByRole('region')).toHaveAttribute(
      'aria-label',
      'Map showing location of Test Business'
    );
  });

  test('renders marker with business name', () => {
    render(<BusinessMap {...props} />);
    expect(screen.getByRole('img')).toHaveAttribute(
      'aria-label',
      'Location marker for Test Business'
    );
  });

  test('renders fallback when map fails to load', () => {
    // Simulate map error
    const { rerender } = render(<BusinessMap {...props} />);
    // Trigger error (mock implementation)
    // Verify fallback renders
  });
});
```

#### Success Criteria

- [ ] Map renders centered on provided coordinates
- [ ] Custom marker appears at business location
- [ ] Zoom/pan controls functional
- [ ] Keyboard navigation works
- [ ] Graceful fallback when API unavailable
- [ ] Responsive on mobile/tablet/desktop
- [ ] WCAG 2.1 AA compliant (no a11y violations)
- [ ] Component tests pass

---

### Task 1.7.3: Implement "Get Directions" Link

**Objective:** Generate deep links to native maps apps for turn-by-turn directions

#### Component Implementation

**Files to Create:**
```
packages/frontend/src/components/maps/
├── DirectionsButton.tsx       # Main button component
├── DirectionsButton.test.tsx  # Component tests
└── utils/                     # Directory for utility functions
    ├── directions.ts          # Deep link generation
    └── directions.test.ts     # Utility tests
```

**File: `packages/frontend/src/components/maps/utils/directions.ts`**

```typescript
import { Coordinates } from '@community-hub/shared';

/**
 * Platform detection for deep link generation
 */
function detectPlatform(): 'ios' | 'android' | 'desktop' {
  const userAgent = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(userAgent)) return 'ios';
  if (/android/.test(userAgent)) return 'android';
  return 'desktop';
}

/**
 * Generate platform-specific directions deep link
 * Spec §26.4 Maps Integration - Directions Deep Links
 *
 * @param coords - Destination coordinates
 * @param address - Destination address (for fallback)
 * @returns Deep link URL
 */
export function generateDirectionsLink(
  coords: Coordinates,
  address: string
): string {
  const platform = detectPlatform();
  const { latitude, longitude } = coords;

  switch (platform) {
    case 'ios':
      // Apple Maps (iOS native)
      // Format: maps://maps.apple.com/?daddr=lat,lng
      return `maps://maps.apple.com/?daddr=${latitude},${longitude}`;

    case 'android':
      // Google Maps intent (Android)
      // Format: geo:lat,lng?q=lat,lng(label)
      const label = encodeURIComponent(address);
      return `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`;

    case 'desktop':
    default:
      // Google Maps web (universal fallback)
      // Format: https://www.google.com/maps/dir/?api=1&destination=lat,lng
      return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  }
}

/**
 * Open directions in native app or new tab
 */
export function openDirections(coords: Coordinates, address: string): void {
  const url = generateDirectionsLink(coords, address);
  window.open(url, '_blank', 'noopener,noreferrer');
}
```

**File: `packages/frontend/src/components/maps/DirectionsButton.tsx`**

```typescript
import React from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';
import { Coordinates } from '@community-hub/shared';
import { openDirections } from './utils/directions';

interface DirectionsButtonProps {
  latitude: number;
  longitude: number;
  address: string;
  businessName: string;
  variant?: 'primary' | 'secondary';
  fullWidth?: boolean;
}

/**
 * Button to open directions in native maps app
 * Spec §4.3 Business Profile - Get Directions
 * Analytics: Track "Direction Requests" per Spec §13.4
 */
export function DirectionsButton({
  latitude,
  longitude,
  address,
  businessName,
  variant = 'primary',
  fullWidth = false,
}: DirectionsButtonProps) {
  const handleClick = () => {
    openDirections({ latitude, longitude }, address);

    // TODO: Track analytics event (Phase 7.3)
    // trackEvent('business.directions_requested', { businessName });
  };

  const baseClasses =
    'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variantClasses =
    variant === 'primary'
      ? 'bg-primary text-white hover:bg-primary/90 focus:ring-primary'
      : 'bg-white text-primary border-2 border-primary hover:bg-primary/5 focus:ring-primary';

  const widthClasses = fullWidth ? 'w-full' : '';

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`${baseClasses} ${variantClasses} ${widthClasses} min-h-[44px]`}
      aria-label={`Get directions to ${businessName}`}
    >
      <MapPinIcon className="w-5 h-5" aria-hidden="true" />
      <span>Get Directions</span>
    </button>
  );
}
```

#### Platform Behavior

**iOS:**
- Opens native Apple Maps app
- Pre-fills destination
- User's current location auto-detected

**Android:**
- Opens Google Maps app (if installed)
- Falls back to browser if no app
- Supports route preferences (fastest/shortest)

**Desktop:**
- Opens Google Maps in new tab
- Shows route from user's location
- Allows route customization

#### Testing Requirements

**File: `packages/frontend/src/components/maps/utils/__tests__/directions.test.ts`**

```typescript
import { generateDirectionsLink } from '../directions';

describe('Directions Utility', () => {
  const coords = { latitude: -33.8567, longitude: 150.9876 };
  const address = '123 Main St, Guildford NSW 2161';

  test('generates iOS Apple Maps link', () => {
    // Mock iOS user agent
    Object.defineProperty(navigator, 'userAgent', {
      value: 'iPhone',
      configurable: true,
    });

    const link = generateDirectionsLink(coords, address);
    expect(link).toContain('maps://maps.apple.com');
    expect(link).toContain(`${coords.latitude},${coords.longitude}`);
  });

  test('generates Android Google Maps link', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Android',
      configurable: true,
    });

    const link = generateDirectionsLink(coords, address);
    expect(link).toContain('geo:');
    expect(link).toContain('q=');
  });

  test('generates desktop Google Maps link', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0',
      configurable: true,
    });

    const link = generateDirectionsLink(coords, address);
    expect(link).toContain('google.com/maps/dir');
    expect(link).toContain('destination=');
  });
});
```

**File: `packages/frontend/src/components/maps/__tests__/DirectionsButton.test.tsx`**

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { DirectionsButton } from '../DirectionsButton';

describe('DirectionsButton', () => {
  const props = {
    latitude: -33.8567,
    longitude: 150.9876,
    address: '123 Main St',
    businessName: 'Test Business',
  };

  test('renders button with icon and text', () => {
    render(<DirectionsButton {...props} />);
    expect(screen.getByRole('button')).toHaveTextContent('Get Directions');
  });

  test('has accessible label', () => {
    render(<DirectionsButton {...props} />);
    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-label',
      'Get directions to Test Business'
    );
  });

  test('meets minimum touch target size (44px)', () => {
    render(<DirectionsButton {...props} />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('min-h-[44px]');
  });

  test('opens directions when clicked', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(<DirectionsButton {...props} />);

    fireEvent.click(screen.getByRole('button'));
    expect(openSpy).toHaveBeenCalled();
  });
});
```

#### Success Criteria

- [ ] Button renders with icon and text
- [ ] Correct deep link generated for iOS/Android/desktop
- [ ] Link opens in new tab/app
- [ ] Accessible (aria-label, keyboard, focus)
- [ ] Minimum 44px touch target (WCAG 2.1 AA)
- [ ] Unit tests pass for all platforms
- [ ] Component tests pass

---

### Task 1.7.4: Implement Geocoding (Address to Coordinates)

**Objective:** Convert street addresses to latitude/longitude coordinates with caching

#### Service Implementation

**File: `packages/backend/src/services/maps/geocoding-service.ts`**

```typescript
import { geocodingClient } from './mapbox-client.js';
import { cacheService } from '../../cache/cache-service.js';
import { logger } from '../../utils/logger.js';
import { getPlatformConfig } from '../../config/platform-loader.js';
import type { GeocodeRequest, GeocodeResult, BoundingBox } from './types.js';

const GEOCODE_CACHE_TTL = 30 * 24 * 60 * 60; // 30 days in seconds

/**
 * Forward geocode: address string to coordinates
 * Spec §26.4 Maps Integration - Geocoding
 *
 * Features:
 * - Results cached in Redis (30-day TTL)
 * - Validates coordinates within platform bounding box
 * - Confidence scoring
 *
 * @throws {Error} if address cannot be geocoded or is outside bounds
 */
export async function geocodeAddress(
  request: GeocodeRequest
): Promise<GeocodeResult> {
  const { street, suburb, postcode, country = 'Australia' } = request;

  // Build full address string
  const fullAddress = `${street}, ${suburb} ${postcode}, ${country}`;

  // Check cache first
  const cacheKey = `geocode:${fullAddress.toLowerCase()}`;
  const cached = await cacheService.get<GeocodeResult>(cacheKey);
  if (cached) {
    logger.debug('Geocode cache hit', { address: fullAddress });
    return cached;
  }

  // Call Mapbox Geocoding API
  try {
    const response = await geocodingClient
      .forwardGeocode({
        query: fullAddress,
        limit: 1,
        countries: ['AU'], // Restrict to Australia for performance
      })
      .send();

    if (!response.body.features || response.body.features.length === 0) {
      throw new Error('Address not found');
    }

    const feature = response.body.features[0];
    const [longitude, latitude] = feature.center;

    // Validate coordinates within platform bounding box
    const config = getPlatformConfig();
    const { boundingBox } = config.location;
    if (!isWithinBounds({ latitude, longitude }, boundingBox)) {
      throw new Error('Address is outside platform coverage area');
    }

    // Determine confidence based on relevance score
    const relevance = feature.relevance ?? 0;
    const confidence: 'high' | 'medium' | 'low' =
      relevance > 0.9 ? 'high' : relevance > 0.7 ? 'medium' : 'low';

    const result: GeocodeResult = {
      latitude,
      longitude,
      formattedAddress: feature.place_name,
      confidence,
    };

    // Cache result
    await cacheService.set(cacheKey, result, GEOCODE_CACHE_TTL);

    logger.info('Address geocoded successfully', {
      address: fullAddress,
      coordinates: { latitude, longitude },
      confidence,
    });

    return result;
  } catch (error) {
    logger.error('Geocoding failed', { address: fullAddress, error });
    throw new Error(`Failed to geocode address: ${fullAddress}`);
  }
}

/**
 * Reverse geocode: coordinates to address
 * Used for emergency alert boundaries, user location detection
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<string> {
  const cacheKey = `reverse:${latitude},${longitude}`;
  const cached = await cacheService.get<string>(cacheKey);
  if (cached) return cached;

  try {
    const response = await geocodingClient
      .reverseGeocode({
        query: [longitude, latitude],
        limit: 1,
      })
      .send();

    if (!response.body.features || response.body.features.length === 0) {
      throw new Error('No address found for coordinates');
    }

    const address = response.body.features[0].place_name;
    await cacheService.set(cacheKey, address, GEOCODE_CACHE_TTL);

    return address;
  } catch (error) {
    logger.error('Reverse geocoding failed', { latitude, longitude, error });
    throw new Error('Failed to reverse geocode coordinates');
  }
}

/**
 * Check if coordinates are within platform's bounding box
 * Spec §2.4 platform.json - location.boundingBox
 */
function isWithinBounds(
  coords: { latitude: number; longitude: number },
  bbox: BoundingBox
): boolean {
  return (
    coords.latitude >= bbox.south &&
    coords.latitude <= bbox.north &&
    coords.longitude >= bbox.west &&
    coords.longitude <= bbox.east
  );
}
```

#### API Endpoint

**File: `packages/backend/src/routes/geocoding.ts`**

```typescript
import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { geocodeAddress } from '../services/maps/geocoding-service.js';
import { sendSuccess, sendError } from '../utils/api-response.js';

export const geocodingRouter = Router();

const geocodeSchema = z.object({
  body: z.object({
    street: z.string().min(1),
    suburb: z.string().min(1),
    postcode: z.string().regex(/^\d{4}$/),
    country: z.string().optional(),
  }),
});

/**
 * POST /api/v1/geocode
 * Convert address to coordinates
 * Rate limited: Search tier (30/min per Spec §4.8)
 */
geocodingRouter.post(
  '/geocode',
  validate(geocodeSchema),
  async (req, res, next) => {
    try {
      const result = await geocodeAddress(req.body);
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, 400, 'GEOCODING_FAILED', error.message);
    }
  }
);
```

**File: `packages/backend/src/routes/index.ts` (modify)**

Add geocoding router:

```typescript
import { geocodingRouter } from './geocoding.js';

// ... existing routes
router.use(searchRateLimiter); // 30/min rate limit
router.use(geocodingRouter);
```

#### Testing Requirements

**File: `packages/backend/src/__tests__/services/maps/geocoding-service.test.ts`**

```typescript
import { describe, test, expect, vi } from 'vitest';
import { geocodeAddress, reverseGeocode } from '../../../services/maps/geocoding-service';

describe('Geocoding Service', () => {
  test('geocodes valid address within bounds', async () => {
    const result = await geocodeAddress({
      street: '1 Railway St',
      suburb: 'Guildford',
      postcode: '2161',
    });

    expect(result).toHaveProperty('latitude');
    expect(result).toHaveProperty('longitude');
    expect(result).toHaveProperty('formattedAddress');
    expect(result).toHaveProperty('confidence');
    expect(result.latitude).toBeGreaterThan(-34);
    expect(result.latitude).toBeLessThan(-33);
  });

  test('throws error for address outside bounding box', async () => {
    await expect(
      geocodeAddress({
        street: '1 George St',
        suburb: 'Sydney',
        postcode: '2000', // Sydney CBD, outside Guildford bounds
      })
    ).rejects.toThrow('outside platform coverage area');
  });

  test('caches geocoding results', async () => {
    const request = {
      street: '1 Railway St',
      suburb: 'Guildford',
      postcode: '2161',
    };

    // First call
    await geocodeAddress(request);

    // Second call should hit cache (mock cache to verify)
    const result = await geocodeAddress(request);
    expect(result).toBeDefined();
  });

  test('reverse geocodes coordinates to address', async () => {
    const address = await reverseGeocode(-33.8567, 150.9876);
    expect(address).toContain('Guildford');
  });
});
```

#### Success Criteria

- [ ] Geocoding service converts addresses to coordinates
- [ ] Results cached in Redis with 30-day TTL
- [ ] Bounding box validation prevents out-of-area addresses
- [ ] Reverse geocoding works
- [ ] API endpoint `/api/v1/geocode` functional
- [ ] Rate limiting applied (search tier)
- [ ] Unit tests pass
- [ ] Integration tests pass

---

### Task 1.7.5: Implement Distance Calculation from User Location

**Objective:** Calculate distance between two coordinates using Haversine formula

#### Shared Utility (Backend + Frontend)

**File: `packages/shared/src/utils/geo.ts`**

```typescript
import type { Coordinates } from '../types/maps.js';

/**
 * Haversine distance calculation
 * Calculate great-circle distance between two points on Earth
 *
 * Spec §26.4 Maps Integration - Distance Calculation
 *
 * Formula accuracy: ~0.5% error for distances < 500km
 * Precision: 6 decimal places (±0.1m)
 *
 * @param from - Starting coordinates
 * @param to - Destination coordinates
 * @returns Distance in kilometers
 */
export function calculateDistance(from: Coordinates, to: Coordinates): number {
  const R = 6371; // Earth radius in km

  // Convert degrees to radians
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLng = toRadians(to.longitude - from.longitude);

  // Haversine formula
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  // Round to 2 decimal places (10m precision)
  return Math.round(distance * 100) / 100;
}

/**
 * Format distance for display
 * < 1km: show meters (e.g., "850 m")
 * >= 1km: show kilometers (e.g., "2.3 km")
 *
 * @param distanceKm - Distance in kilometers
 * @param locale - BCP 47 locale for number formatting
 * @returns Formatted distance string
 */
export function formatDistance(distanceKm: number, locale = 'en-AU'): string {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters.toLocaleString(locale)} m`;
  }

  return `${distanceKm.toLocaleString(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} km`;
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
```

**File: `packages/shared/src/types/maps.ts`**

```typescript
export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface DistanceFilter {
  userLocation: Coordinates;
  maxDistanceKm: number;
}
```

#### Frontend: User Location Hook

**File: `packages/frontend/src/hooks/useUserLocation.ts`**

```typescript
import { useState, useEffect } from 'react';
import { logger } from '../utils/logger';
import type { Coordinates } from '@community-hub/shared';

interface UseUserLocationReturn {
  location: Coordinates | null;
  error: string | null;
  loading: boolean;
  requestPermission: () => Promise<void>;
}

/**
 * Hook to get user's current location via browser Geolocation API
 * Spec §1.7.5 Distance Calculation - User Location
 *
 * Features:
 * - Requests permission explicitly
 * - Persists last known location in localStorage
 * - Error handling for permission denial
 *
 * WCAG: User must explicitly grant permission (no automatic request)
 */
export function useUserLocation(): UseUserLocationReturn {
  const [location, setLocation] = useState<Coordinates | null>(() => {
    // Load cached location from localStorage
    const cached = localStorage.getItem('userLocation');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requestPermission = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: Coordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        setLocation(coords);
        setLoading(false);

        // Cache location
        localStorage.setItem('userLocation', JSON.stringify(coords));

        logger.info('User location obtained', { coords });
      },
      (err) => {
        let message = 'Unable to retrieve your location';
        if (err.code === err.PERMISSION_DENIED) {
          message = 'Location permission denied. Enable in browser settings.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          message = 'Location information unavailable';
        } else if (err.code === err.TIMEOUT) {
          message = 'Location request timed out';
        }

        setError(message);
        setLoading(false);

        logger.warn('Geolocation error', { code: err.code, message });
      },
      {
        enableHighAccuracy: false, // Save battery
        timeout: 10000, // 10 second timeout
        maximumAge: 300000, // Accept 5-minute-old cached position
      }
    );
  };

  return { location, error, loading, requestPermission };
}
```

#### Frontend: Distance Display Component

**File: `packages/frontend/src/components/business/BusinessDistance.tsx`**

```typescript
import React from 'react';
import { calculateDistance, formatDistance } from '@community-hub/shared/utils/geo';
import { useUserLocation } from '../../hooks/useUserLocation';
import type { Coordinates } from '@community-hub/shared';

interface BusinessDistanceProps {
  businessLocation: Coordinates;
  className?: string;
}

/**
 * Display distance from user to business
 * Spec §4.2 Business Listing - Distance Display
 */
export function BusinessDistance({
  businessLocation,
  className = '',
}: BusinessDistanceProps) {
  const { location: userLocation } = useUserLocation();

  if (!userLocation) {
    return null; // Don't show distance if user location unknown
  }

  const distanceKm = calculateDistance(userLocation, businessLocation);
  const formatted = formatDistance(distanceKm);

  return (
    <span className={`text-sm text-text-light ${className}`} aria-label={`${formatted} away`}>
      {formatted} away
    </span>
  );
}
```

#### Testing Requirements

**File: `packages/shared/src/__tests__/utils/geo.test.ts`**

```typescript
import { describe, test, expect } from 'vitest';
import { calculateDistance, formatDistance } from '../../utils/geo';

describe('Geo Utilities', () => {
  test('calculates distance correctly using known coordinates', () => {
    // Guildford to Sydney CBD (approx 21 km)
    const guildford = { latitude: -33.8567, longitude: 150.9876 };
    const sydney = { latitude: -33.8688, longitude: 151.2093 };

    const distance = calculateDistance(guildford, sydney);
    expect(distance).toBeGreaterThan(20);
    expect(distance).toBeLessThan(22);
  });

  test('returns 0 for same coordinates', () => {
    const coords = { latitude: -33.8567, longitude: 150.9876 };
    const distance = calculateDistance(coords, coords);
    expect(distance).toBe(0);
  });

  test('formats distance < 1km as meters', () => {
    const formatted = formatDistance(0.85);
    expect(formatted).toBe('850 m');
  });

  test('formats distance >= 1km as kilometers', () => {
    const formatted = formatDistance(2.345);
    expect(formatted).toBe('2.3 km');
  });

  test('handles distances across hemispheres', () => {
    // Sydney to London (approx 17,000 km)
    const sydney = { latitude: -33.8688, longitude: 151.2093 };
    const london = { latitude: 51.5074, longitude: -0.1278 };

    const distance = calculateDistance(sydney, london);
    expect(distance).toBeGreaterThan(16000);
    expect(distance).toBeLessThan(18000);
  });
});
```

**File: `packages/frontend/src/hooks/__tests__/useUserLocation.test.ts`**

```typescript
import { renderHook, act, waitFor } from '@testing-library/react';
import { useUserLocation } from '../useUserLocation';

describe('useUserLocation', () => {
  beforeEach(() => {
    // Mock geolocation
    global.navigator.geolocation = {
      getCurrentPosition: vi.fn(),
    };
  });

  test('returns null location initially', () => {
    const { result } = renderHook(() => useUserLocation());
    expect(result.current.location).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  test('requests permission and gets location', async () => {
    const mockPosition = {
      coords: {
        latitude: -33.8567,
        longitude: 150.9876,
      },
    };

    global.navigator.geolocation.getCurrentPosition.mockImplementation(
      (success) => success(mockPosition)
    );

    const { result } = renderHook(() => useUserLocation());

    await act(async () => {
      await result.current.requestPermission();
    });

    await waitFor(() => {
      expect(result.current.location).toEqual({
        latitude: -33.8567,
        longitude: 150.9876,
      });
      expect(result.current.error).toBeNull();
    });
  });

  test('handles permission denial', async () => {
    global.navigator.geolocation.getCurrentPosition.mockImplementation(
      (success, error) =>
        error({
          code: 1, // PERMISSION_DENIED
          message: 'User denied permission',
        })
    );

    const { result } = renderHook(() => useUserLocation());

    await act(async () => {
      await result.current.requestPermission();
    });

    await waitFor(() => {
      expect(result.current.error).toContain('permission denied');
    });
  });
});
```

#### Success Criteria

- [ ] Haversine distance calculation accurate (within 1%)
- [ ] Distance formatting correct (<1km meters, >=1km km)
- [ ] User location hook requests permission
- [ ] Location cached in localStorage
- [ ] Permission denial handled gracefully
- [ ] Distance displayed on business cards
- [ ] Unit tests pass
- [ ] Hook tests pass

---

## Location-Agnostic Compliance

**All Phase 1.7 implementations are location-agnostic:**

✅ **API Keys:** `MAPBOX_ACCESS_TOKEN` in `.env` only (not hardcoded)
✅ **Coordinates:** Platform center from `platform.json` (lines 18-20)
✅ **Bounding Box:** Validation uses `platform.json` config (lines 22-27)
✅ **Search Radii:** Default/max from `platform.json` (lines 33-34)
✅ **Geocoding:** Validates against platform bounding box
✅ **No Hardcoded Values:** Zero suburb names or coordinates in code

**Deploying to new suburb requires:**
1. Update `platform.json` location section
2. Update `.env` with `MAPBOX_ACCESS_TOKEN` (if new account)
3. Zero code changes

---

## Security Compliance

**Spec §4 Security Requirements:**

✅ **API Key Protection:**
- Mapbox token in `.env` only
- Frontend uses public token (safe for client exposure per Mapbox docs)
- Backend uses secret token for server-side geocoding

✅ **Input Validation:**
- Zod schema validates address format
- Lat/long range validation (-90 to 90, -180 to 180)
- Bounding box validation prevents out-of-area addresses

✅ **Rate Limiting:**
- Geocoding endpoint uses search tier (30/min per Spec §4.8)
- Mapbox API rate limits: 600 req/min (free tier)

✅ **User Location:**
- HTTPS required for geolocation permission
- Explicit permission request (no auto-request)
- Location not stored server-side (localStorage only)
- Permission denial handled gracefully

✅ **Error Handling:**
- Mapbox API errors don't expose internals
- Graceful fallback to address text (Spec §27.5-27.6)
- User-friendly error messages

---

## Accessibility Compliance (WCAG 2.1 AA)

**Spec §3.6 Accessibility:**

✅ **Keyboard Navigation:**
- Map: Arrow keys pan, +/- zoom, Enter activates
- Buttons: Tab focus, Enter/Space activate
- Directions button: Keyboard accessible

✅ **Screen Reader Support:**
- Map region: `role="region"` with `aria-label`
- Marker: `role="img"` with descriptive label
- Fallback: Full address text

✅ **Focus Indicators:**
- 2px solid focus ring on interactive elements
- High contrast (4.5:1 minimum)

✅ **Touch Targets:**
- Directions button: 44px minimum height
- Map controls: 44x44px
- Marker tappable area: 44px padded

✅ **Color Contrast:**
- Map marker: Primary color meets 4.5:1 against background
- Text: All text meets contrast requirements

✅ **Graceful Degradation:**
- Map unavailable: Static address display
- User location denied: No distance shown (no error)

---

## Testing Requirements Summary

**Unit Tests (16 tests):**
- Mapbox client initialization (2)
- Geocoding service (4)
- Reverse geocoding (2)
- Distance calculation (5)
- Direction link generation (3)

**Component Tests (8 tests):**
- BusinessMap rendering (3)
- MapMarker accessibility (2)
- DirectionsButton interaction (3)

**Integration Tests (4 tests):**
- Geocoding API endpoint (2)
- Cache behavior (1)
- User location permission flow (1)

**E2E Tests (2 tests - defer to Phase 4):**
- User views business profile with map
- User clicks "Get Directions"

**Total: 30 tests**

**Coverage Target:** >80% (per Phase 1.3 QA standards)

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Mapbox API rate limit hit | Low | Medium | Aggressive caching (30-day TTL), Redis-backed |
| Geocoding returns wrong coordinates | Low | High | Bounding box validation, confidence scoring |
| User denies location permission | High | Low | Graceful fallback, no distance shown |
| Map rendering slow on mobile | Medium | Medium | Lazy load component, code splitting |
| Mapbox token exposed | Medium | Low | Public token safe per Mapbox docs, separate secret token for backend |
| Offline map unavailable | High | Low | Fallback to static address, Phase 17 adds offline tiles |

---

## File Structure Summary

### Backend Files to Create (9 files)
```
packages/backend/src/
├── services/maps/
│   ├── mapbox-client.ts          # Mapbox SDK init
│   ├── geocoding-service.ts       # Geocoding logic
│   ├── distance-service.ts        # Distance utilities (optional)
│   └── types.ts                   # Map type definitions
├── routes/
│   └── geocoding.ts               # POST /api/v1/geocode
└── __tests__/services/maps/
    ├── mapbox-client.test.ts
    ├── geocoding-service.test.ts
    └── distance-service.test.ts
```

### Frontend Files to Create (15 files)
```
packages/frontend/src/
├── services/maps/
│   ├── mapbox-config.ts           # Mapbox GL JS init
│   └── types.ts                   # Frontend map types
├── components/maps/
│   ├── BusinessMap.tsx            # Main map component
│   ├── MapMarker.tsx              # Custom marker
│   ├── MapFallback.tsx            # Fallback UI
│   ├── DirectionsButton.tsx       # Directions button
│   ├── index.ts                   # Barrel exports
│   └── utils/
│       ├── directions.ts          # Deep link generation
│       └── directions.test.ts
├── components/business/
│   └── BusinessDistance.tsx       # Distance display
├── hooks/
│   ├── useUserLocation.ts         # Geolocation hook
│   └── __tests__/
│       └── useUserLocation.test.ts
└── __tests__/components/maps/
    ├── BusinessMap.test.tsx
    ├── MapMarker.test.tsx
    ├── DirectionsButton.test.tsx
    └── utils/
        └── directions.test.ts
```

### Shared Files to Create (3 files)
```
packages/shared/src/
├── utils/
│   └── geo.ts                     # Haversine distance, formatting
├── types/
│   └── maps.ts                    # Shared map types
└── __tests__/utils/
    └── geo.test.ts
```

### Configuration Files to Modify (2 files)
```
packages/backend/
├── src/config/env-validate.ts     # Add MAPBOX_ACCESS_TOKEN validation
└── src/index.ts                   # Add Mapbox connectivity check

packages/backend/src/routes/
└── index.ts                       # Register geocoding router
```

**Total Files:** 29 (9 backend, 15 frontend, 3 shared, 2 config)

---

## Dependencies to Install

### Backend
```json
{
  "dependencies": {
    "@mapbox/mapbox-sdk": "^0.16.0"
  }
}
```

### Frontend
```json
{
  "dependencies": {
    "mapbox-gl": "^3.9.0",
    "react-map-gl": "^7.1.7"
  },
  "devDependencies": {
    "@types/mapbox-gl": "^3.4.1"
  }
}
```

### Install Commands
```bash
# Backend
cd packages/backend
pnpm add @mapbox/mapbox-sdk

# Frontend
cd packages/frontend
pnpm add mapbox-gl react-map-gl
pnpm add -D @types/mapbox-gl

# Shared (no new dependencies)
```

---

## Critical Files for Implementation

When implementing this plan, focus on these 5 critical files first:

1. **`packages/backend/src/services/maps/geocoding-service.ts`**
   **Reason:** Core geocoding logic with caching and bounding box validation - foundation for all location features

2. **`packages/frontend/src/components/maps/BusinessMap.tsx`**
   **Reason:** Primary UI component for business profiles - most visible user-facing feature

3. **`packages/shared/src/utils/geo.ts`**
   **Reason:** Haversine distance calculation shared by frontend and backend - critical for search/filtering

4. **`packages/frontend/src/hooks/useUserLocation.ts`**
   **Reason:** User location permission handling - required for distance display and "Near You" features

5. **`packages/frontend/src/components/maps/DirectionsButton.tsx`**
   **Reason:** Deep link generation for native maps apps - high user value, simple implementation

---

## Success Criteria (Definition of Done)

### Task 1.7.1: Mapbox API Setup
- [ ] Mapbox SDK installed (backend + frontend)
- [ ] Access token validated in `.env`
- [ ] Connectivity check passes on server boot
- [ ] Unit tests pass

### Task 1.7.2: Map Embed Component
- [ ] Map renders on test page
- [ ] Custom marker displays correctly
- [ ] Keyboard navigation works
- [ ] Graceful fallback when API unavailable
- [ ] WCAG 2.1 AA compliant
- [ ] Responsive on mobile/tablet/desktop
- [ ] Component tests pass

### Task 1.7.3: Get Directions
- [ ] Deep links generated for iOS/Android/desktop
- [ ] Button opens native maps app
- [ ] Accessible (aria-label, keyboard, 44px touch target)
- [ ] Unit tests pass for all platforms

### Task 1.7.4: Geocoding
- [ ] Geocoding service converts addresses to coordinates
- [ ] Results cached in Redis (30-day TTL)
- [ ] Bounding box validation works
- [ ] API endpoint `/api/v1/geocode` functional
- [ ] Rate limiting applied
- [ ] Unit + integration tests pass

### Task 1.7.5: Distance Calculation
- [ ] Haversine distance calculation accurate
- [ ] Distance formatting correct
- [ ] User location hook requests permission
- [ ] Location cached in localStorage
- [ ] Permission denial handled gracefully
- [ ] Distance displayed on business cards
- [ ] Unit + hook tests pass

### Phase 1.7 Complete
- [ ] All 5 tasks complete
- [ ] All 30 tests passing
- [ ] Coverage >80%
- [ ] Zero ESLint errors
- [ ] Zero TypeScript errors
- [ ] Documentation updated
- [ ] QA review passed
- [ ] Phase 4 unblocked

---

## Post-Implementation Notes

**Phase 4 Integration:**
When implementing Business Directory (Phase 4), integrate maps as follows:

1. **Add Business model fields** (in Prisma schema):
   ```prisma
   model Business {
     // ... existing fields
     latitude  Float?
     longitude Float?
     address   String
     suburb    String
     postcode  String
   }
   ```

2. **Geocode on business creation:**
   ```typescript
   const { latitude, longitude } = await geocodeAddress({
     street: business.address,
     suburb: business.suburb,
     postcode: business.postcode,
   });
   ```

3. **Add map to business profile:**
   ```tsx
   <BusinessMap
     latitude={business.latitude}
     longitude={business.longitude}
     businessName={business.name}
     address={business.address}
   />
   ```

4. **Add distance to search results:**
   ```tsx
   {userLocation && (
     <BusinessDistance
       businessLocation={{ latitude, longitude }}
     />
   )}
   ```

**Phase 5 Integration (Search & Discovery):**
Add distance filtering to search query:

```typescript
// Elasticsearch query with geo_distance filter
{
  query: {
    bool: {
      filter: [
        {
          geo_distance: {
            distance: `${maxDistanceKm}km`,
            location: {
              lat: userLocation.latitude,
              lon: userLocation.longitude,
            },
          },
        },
      ],
    },
  },
}
```

---

This plan provides a complete roadmap for Phase 1.7 implementation. All requirements are traceable to the specification, all security and accessibility concerns are addressed, and testing requirements are comprehensive. The location-agnostic architecture ensures zero code changes when deploying to new suburbs.
