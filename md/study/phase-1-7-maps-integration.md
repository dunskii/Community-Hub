# Phase 1.7 - Maps Integration: Comprehensive Research

**Research Date:** 2026-02-05
**Platform:** Community Hub (Location-Agnostic Digital Community Improvement Hub)
**Specification Version:** 2.0 (January 2026)
**Current Status:** Not Started (0/5 tasks complete)

---

## Table of Contents

1. [Overview](#overview)
2. [Specification Reference](#specification-reference)
3. [Components & Requirements](#components--requirements)
4. [Data Models](#data-models)
5. [API Endpoints](#api-endpoints)
6. [Business Rules & Logic](#business-rules--logic)
7. [Location-Agnostic Considerations](#location-agnostic-considerations)
8. [Multilingual & Internationalization](#multilingual--internationalization)
9. [Accessibility (WCAG 2.1 AA)](#accessibility-wcag-21-aa)
10. [Security Requirements](#security-requirements)
11. [Current Status](#current-status)
12. [Dependencies & Relationships](#dependencies--relationships)
13. [Key Files & Locations](#key-files--locations)
14. [Testing Requirements](#testing-requirements)
15. [Known Blockers / Notes](#known-blockers--notes)
16. [Specification Compliance Checklist](#specification-compliance-checklist)
17. [Summary](#summary)

---

## Overview

**Phase 1.7: Maps Integration** is a critical sub-phase of Phase 1 (Foundation & Core Infrastructure) that establishes the geolocation and mapping capabilities required for the platform. This phase is essential for enabling business discovery by location, directions functionality, and distance-based filtering across the platform.

**Current Status:** Not started (0/5 tasks complete)
**Dependencies:** Phase 1.1-1.6 must be complete
**Blocking:** Phase 4 (Business Directory Core), Phase 5 (Search & Discovery), Phase 14 (Emergency & Crisis Communication)

---

## Specification Reference

**Primary Specification:**
- **Document:** `docs/Community_Hub_Specification_v2.md` (v2.0, January 2026)
- **Section:** §26.4 Maps Integration (pages 2577-2586)
- **Related:** §11 (Business Profile Features), §14 (Search & Discovery), §2.3 (Environment Variables)

**Key Specification Details:**

| Feature | Specification |
|---------|---------------|
| Provider | **Mapbox (confirmed in commit a4d6133)** |
| Business Locations | Map markers for business profile display |
| Directions | Links to native navigation apps |
| Geocoding | Convert addresses to latitude/longitude coordinates |
| Distance Calculation | Compute user-to-business distance |
| Environment Variable | `MAPBOX_ACCESS_TOKEN` (required, in `.env`) |

---

## Components & Requirements

### 1. Mapbox API Integration

**What:** Set up Mapbox access token and client library
**Purpose:** Enables map display, geocoding, routing, and distance calculations
**Provider:** Mapbox (confirmed)
**API Key:** `MAPBOX_ACCESS_TOKEN` stored in `.env` (sensitive credential)
**Reference:** Spec §2.3 (Environment Variables, line 140: "MAPBOX_ACCESS_TOKEN - Mapbox maps integration - Yes")

**Frontend Component:**
- Library: `mapbox-gl` (Mapbox GL JS for interactive maps)
- Purpose: Render embedded maps on business profiles
- Usage: Display single business location or multiple business markers

**Backend Service:**
- Mapbox API client initialization
- Geocoding API calls for address validation
- Distance matrix API for user-to-business calculations
- Error handling for API downtime (fallback to address text)

### 2. Geocoding Service

**Purpose:** Convert street addresses to geographic coordinates
**Input:** Street address from business profile
**Output:** `{ latitude, longitude }` coordinates
**Usage:**
- Validate business addresses during profile creation
- Populate Business table with coordinates for location-based search
- Enable distance calculations

**API Endpoint Needed:**
- `POST /api/v1/geocode` - Convert address to coordinates
- Input: `{ street, suburb, postcode }`
- Output: `{ latitude, longitude, formattedAddress }`
- Error cases: Invalid address, API error (fallback to address text per Spec §27)

### 3. Distance Calculation

**Purpose:** Calculate distance between user location and businesses
**Formula:** Haversine distance calculation (sphere-based, ~0.5% error)
**Usage:**
- Display "distance from user" on business cards (Spec Phase 4.2)
- Filter/sort by distance (Spec Phase 5.3)
- Validate distance filters (max 20km in platform.json)

**Frontend Integration:**
- Request user's geolocation (with permission)
- Calculate distance to displayed businesses using coordinates
- Display as "2.3 km away" or similar

**Backend Integration:**
- Store coordinates in Business model (latitude, longitude fields)
- Support distance-based queries in search/filter endpoints
- Cache user location preferences in Redis

### 4. Map Embed Component (Frontend)

**Location:** Business profile page → Overview Tab → Location & Map section
**Spec Reference:** Phase 4.3, Lines 330-336 (TODO.md)
**Component Features:**
- Embedded interactive map using Mapbox GL JS
- Single business marker/pin
- Zoom/pan controls
- Responsive to mobile/tablet/desktop
- Accessibility: keyboard navigation, focus states

**Component Structure:**
```
BusinessProfile
  └── OverviewTab
      └── LocationMap
          ├── MapboxGL (map canvas)
          ├── BusinessMarker (pin/icon)
          ├── MapControls (zoom, etc.)
          └── AddressDisplay
              └── CopyButton
```

**Display Requirements:**
- Business location as primary marker
- Address text below map
- Copy address to clipboard button
- Responsive: full-width on mobile, left/right layout on desktop
- Fallback: Address text only if API down (Spec §27.6 Error Handling)

### 5. Directions Deep Links

**Purpose:** Route users to native maps apps for turn-by-turn directions
**Supported Apps:**
- Apple Maps (iOS native)
- Google Maps (Android, web)
- Mapbox (all platforms)

**Implementation:**
- Generate deep links for each platform
- Example iOS: `maps://maps.apple.com/?address=<address>&daddr=<lat>,<lng>`
- Example Android: `https://maps.google.com/maps?daddr=<lat>,<lng>`
- Button on business profile: "Get Directions" or map icon

**Frontend:**
- Button: "Get Directions" (Spec Phase 4.3, Line 334)
- Opens native map app with business location pre-filled
- Fallback: Opens web maps if no app installed

**User Journey:**
1. User views business profile
2. Clicks "Get Directions" button
3. Native maps app opens with business location
4. User gets turn-by-turn directions
5. Analytics: "Direction Requests" tracked (Spec Phase 13.1, Line 1904)

---

## Data Models

**Business Model Updates (in `packages/backend/prisma/schema.prisma`):**

Already exists in Phase 1.3, but Phase 1.7 validates and uses:

```prisma
model Business {
  id String @id @default(cuid())

  // Existing fields
  name String
  address String
  suburb String
  postcode String

  // Phase 1.7 additions
  latitude Float?      // Geocoded coordinate
  longitude Float?     // Geocoded coordinate

  // Relationships
  category Category @relation(fields: [categoryId], references: [id])
  categoryId String

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Note:** Latitude/longitude fields are optional initially to support businesses without confirmed geocoding. Phase 4 (Business Directory) will require geocoding during profile setup.

---

## API Endpoints

**Geocoding Service (Backend):**

```
POST /api/v1/geocode
Description: Convert address to coordinates
Authentication: None (frontend use)
Rate Limit: Search tier (30/min per Spec §4.8)

Request:
{
  "street": "123 Main St",
  "suburb": "Guildford",
  "postcode": "2161"
}

Response (Success):
{
  "latitude": -33.8567,
  "longitude": 150.9876,
  "formattedAddress": "123 Main Street, Guildford NSW 2161, Australia"
}

Response (Error):
{
  "error": "INVALID_ADDRESS",
  "message": "Address could not be geocoded"
}
```

**No new endpoints strictly required** for Phase 1.7. Directions and map display are frontend-only features using Mapbox SDK directly.

**Backend Support:**
- Geocoding happens during business creation/update (Phase 4)
- Distance calculation in search endpoints (Phase 5)
- Used by emergency alert boundary detection (Phase 14)

---

## Business Rules & Logic

### Geocoding Rules

1. **Validation:** All business addresses must geocode to coordinates within platform's bounding box (from platform.json)
2. **Boundary Check:** Lat/long must fall within `location.boundingBox` in config
3. **Precision:** Coordinates accurate to 6 decimal places (~0.1m accuracy)
4. **Caching:** Cache geocoding results in Redis (TTL: 30 days) to reduce API calls
5. **Fallback:** If Mapbox API down, store address but mark coordinates as pending

### Distance Calculation Rules

1. **Formula:** Haversine formula for great-circle distance
2. **Max Search Radius:** `location.maxSearchRadiusKm` from platform.json (default: 20km)
3. **Default Radius:** `location.defaultSearchRadiusKm` (default: 5km)
4. **User Location:** Optional - requires explicit geolocation permission
5. **Precision:** Display as 1-2 decimal places: "2.3 km away"

### Map Display Rules

1. **Single Business:** Show business marker centered on map
2. **Multiple Businesses:** Show cluster markers (Phase 5 Search Results)
3. **Mobile Responsive:** Full-width on <768px, sidebar on >=768px
4. **Zoom Level:** Auto-zoom to fit business location
5. **Accessibility:** Keyboard navigable, ARIA labels for map regions

---

## Location-Agnostic Considerations

**Phase 1.7 is fully location-agnostic:**

1. **Configuration-Driven:**
   - Mapbox API key in `.env` (not hardcoded)
   - Bounding box in `config/platform.json` (enables new suburbs)
   - Default/max search radii in platform.json
   - No hardcoded coordinates or suburbs

2. **Multi-Suburb Deployment:**
   - Geocoding validates against platform's bounding box
   - Distance calculations use configured defaults
   - Map center/zoom determined by business location (not fixed)

3. **Example:** Deploying to new suburb requires:
   - Update `MAPBOX_ACCESS_TOKEN` in `.env` (if needed)
   - Update `location.boundingBox`, `coordinates`, `defaultSearchRadiusKm` in `config/platform.json`
   - No code changes

---

## Multilingual & Internationalization

**Phase 1.7 has minimal i18n scope** (Phase 1.8 is dedicated i18n):

1. **Mapbox GL JS:** Supports 40+ languages natively
2. **Directions:** Native maps apps handle localization
3. **UI Text:** Minimal
   - "Get Directions" button (translatable in Phase 1.8)
   - "km away" distance unit (phase 1.8: respect locale)
4. **Address Display:** Uses Mapbox's `formattedAddress` response (localized by Mapbox)

---

## Accessibility (WCAG 2.1 AA)

**Map Component Requirements:**

1. **Keyboard Navigation:**
   - Tab through map controls (zoom, pan buttons)
   - Enter key activates controls
   - Escape key dismisses popups

2. **Screen Reader Support:**
   - Map container has `role="region"` or `role="application"`
   - Business marker has aria-label: "Business name, [address]"
   - "Get Directions" button has descriptive text

3. **Focus Indicators:**
   - Visible 2px focus ring on buttons (Spec §3.6, §7.1)
   - High contrast: meets 4.5:1 minimum

4. **Touch Targets:**
   - Buttons: 44px minimum (Spec §3.6)
   - "Get Directions" button: 44x44px minimum

5. **Color Contrast:**
   - Map markers meet 4.5:1 contrast with map background
   - Address text: 4.5:1 minimum

6. **Alternative:** Address text display for users who can't interact with map

---

## Security Requirements

**Phase 1.7 Security Considerations:**

1. **API Key Protection:**
   - `MAPBOX_ACCESS_TOKEN` in `.env` only (not in code/config)
   - Frontend uses public token (Mapbox supports public-key auth)
   - Backend uses secret token (if needed for server-side geocoding)

2. **Input Validation:**
   - Geocode endpoint validates address format (Zod schema)
   - Lat/long validated as valid numbers (-90 to 90, -180 to 180)
   - Boundary validation: coordinates within platform's bounding box

3. **Rate Limiting:**
   - Geocoding subject to search rate limiter (30/min per Spec §4.8)
   - Mapbox API rate limits: 600 requests/minute (free tier)

4. **User Location:**
   - HTTPS required for geolocation permission
   - No location data stored without explicit consent
   - Location used only for distance calculation (not tracked)

5. **Error Handling:**
   - Mapbox API errors don't expose internal data
   - Graceful fallback to address text (Spec §27.6)

---

## Current Status

**Completion:** 0/5 tasks (0%)
**Blocking:** Phases 4, 5, 8, 14+

**Tasks to Complete:**
1. [ ] Set up Mapbox API (access token, geocoding, map tiles)
2. [ ] Implement map embed component for business profiles
3. [ ] Implement "Get Directions" link
4. [ ] Implement geocoding (address to coordinates)
5. [ ] Implement distance calculation from user location

**No Code Yet Implemented:**
- No `services/maps.ts` or `mapbox-client.ts`
- No geocoding endpoint
- No Map React component
- No distance calculation utility
- Mapbox library not in package.json

---

## Dependencies & Relationships

**Depends On:**
- Phase 1.1-1.6 complete (configuration, infrastructure, security, email)
- Mapbox account + API key
- PostgreSQL (Business model with lat/long fields)
- Redis (caching for geocoding results)

**Blocks:**
- Phase 4: Business Directory Core (needs map on business profile)
- Phase 5: Search & Discovery (needs distance calculations for filtering)
- Phase 8: Events System (event locations need geocoding)
- Phase 14: Emergency & Crisis (alert boundaries use coordinates)
- Phase 16: External Integrations (Google Business Profile sync uses coordinates)

**Related Features:**
- Phase 1.8 (i18n): Translates "Get Directions", distance units
- Phase 3 (Design System): Map component styling
- Phase 4.2 (Business Profile): Primary consumer of map component
- Phase 5.3 (Search Filters): Uses distance calculations
- Phase 17 (PWA): Offline maps caching (future enhancement)

---

## Key Files & Locations

**Core Implementation Files (to be created):**

```
packages/backend/src/
├── services/
│   └── maps-service.ts          # Mapbox initialization, geocoding logic
├── utils/
│   ├── geocoding.ts              # Address-to-coordinates conversion
│   └── distance.ts               # Haversine distance calculation
└── __tests__/
    └── services/maps-service.test.ts
    └── utils/geocoding.test.ts
    └── utils/distance.test.ts

packages/frontend/src/
├── components/
│   └── ui/
│       ├── Map.tsx               # Mapbox GL JS wrapper component
│       ├── BusinessMarker.tsx     # Business location marker
│       └── DirectionsButton.tsx   # "Get Directions" button
└── __tests__/
    └── components/ui/
        ├── Map.test.tsx
        ├── BusinessMarker.test.tsx
        └── DirectionsButton.test.tsx
```

**Configuration Files:**
- `.env` - Add `MAPBOX_ACCESS_TOKEN`
- `config/platform.json` - Includes `location.coordinates`, `location.boundingBox`
- `packages/backend/prisma/schema.prisma` - Business model (already has latitude/longitude)

**Reference Files:**
- `docs/Community_Hub_Specification_v2.md` - §26.4 Maps Integration
- `TODO.md` - Lines 94-100 (Phase 1.7 task list)
- `PROGRESS.md` - Lines 158-159 (Phase 1.7 status)

---

## Testing Requirements

**Target Coverage:** >80% (per Phase 1.3 QA)

**Unit Tests:**
- Geocoding validation (valid/invalid addresses)
- Distance calculation (known lat/long pairs)
- Boundary validation (coordinates in/out of bounds)
- Error handling (Mapbox API errors)

**Integration Tests:**
- Geocoding API endpoint (address → coordinates)
- Distance calculation in search endpoint
- Map component renders with coordinates
- Directions link generation

**E2E Tests:**
- User views business profile with map
- User clicks "Get Directions"
- Distance displayed correctly on search results

---

## Known Blockers / Notes

1. **Mapbox Account:** Need to provision Mapbox account and obtain access token
2. **Frontend Library:** Need to add `mapbox-gl` to `packages/frontend/package.json`
3. **Types:** May need `@types/mapbox-gl` for TypeScript support
4. **Public Token:** Frontend uses public token; backend may need secret key for server-side geocoding
5. **Offline Maps:** Phase 17 (PWA) should consider offline map tiles (Mapbox GL JS supports this)

---

## Specification Compliance Checklist

- [x] Location-agnostic configuration
- [x] Environment variable security
- [x] Graceful API error handling
- [x] WCAG 2.1 AA accessibility
- [x] Multilingual support plan (Phase 1.8)
- [x] Mobile-first responsive design
- [x] Rate limiting applied
- [x] Input validation
- [x] Distance calculation logic
- [x] Directions deep linking

---

## Summary

**Phase 1.7 (Maps Integration)** is a 5-task sub-phase that establishes geolocation and mapping capabilities essential for business discovery. It requires:

1. **Mapbox API setup** - Initialize client with API key from environment
2. **Geocoding service** - Convert addresses to coordinates with boundary validation
3. **Distance calculations** - Support location-based filtering and display
4. **Map component** - Embed interactive maps on business profiles
5. **Directions functionality** - Deep links to native maps apps

The phase is **fully location-agnostic**, uses **configuration-driven coordinates**, and **integrates zero new endpoints** (all mapping done client-side or via existing search infrastructure). It **blocks 5+ downstream phases** and should be prioritized after Phase 1.6 (Email Service) is complete.

All requirements are **thoroughly specified** in Spec §26.4, with clear task breakdown in TODO.md lines 94-100.

---

**Research Completed:** 2026-02-05
**Explore Agent ID:** ac49ec8 (for resuming if follow-up needed)
