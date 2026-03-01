# Phase 5: Search & Discovery - Comprehensive Study

**Date:** March 1, 2026
**Status:** Not Started (Ready for Implementation)
**Task Count:** 34 tasks
**Priority:** High (MVP 2 blocker)
**Dependencies:** Phases 1-4 Complete ✅

---

## EXECUTIVE SUMMARY

Phase 5 implements the complete Search & Discovery infrastructure for the Community Hub platform. This phase enables users to find businesses, events, and other content efficiently through full-text search, autocomplete, advanced filters, sorting, and personalized discovery sections.

**Key Context:**
- Elasticsearch infrastructure already set up (elasticsearch-client.ts, index-manager.ts)
- Business index already created with multilingual analyzer support
- Location-agnostic architecture requirement must be maintained
- Build on top of Phase 4 Business Directory
- Directly enables MVP 2 launch (Search & User Engagement)

---

## TABLE OF CONTENTS

1. [Overview](#overview)
2. [Phase 5 Implementation Breakdown](#phase-5-implementation-breakdown)
3. [Data Models](#data-models)
4. [API Endpoints](#api-endpoints)
5. [Configuration Requirements](#configuration-requirements)
6. [Security & Compliance](#security--compliance)
7. [Technical Architecture](#technical-architecture)
8. [Task List Breakdown](#task-list-breakdown)
9. [Dependencies & Blockers](#dependencies--blockers)
10. [Business Rules](#business-rules--constraints)
11. [Testing Strategy](#testing-strategy)
12. [Location-Agnostic Design](#configuration-location-requirements)
13. [Completion Criteria](#completion-criteria)
14. [Files to Create/Modify](#files-to-createmodify)
15. [Related Specifications](#related-specifications)

---

## OVERVIEW

### What is Phase 5?

Phase 5 (Search & Discovery) is the 5th of 19 phases in the Community Hub platform development. It provides:

1. **Full-Text Search** - Search businesses by name, description, category with relevance scoring
2. **Autocomplete** - Real-time suggestions as users type
3. **Advanced Filters** - 11 filter types (category, distance, open now, rating, etc.)
4. **Sort Options** - 7 sort methods (relevance, distance, rating, newest, etc.)
5. **Homepage Discovery** - 8 curated sections (featured, near you, highly rated, etc.)

### Why Phase 5 is Critical

- **MVP 2 Blocker**: Required for Search & User Engagement milestone
- **User Acquisition**: Homepage is the landing page for all new visitors
- **Business Discoverability**: Primary way users find local businesses
- **Performance**: Elasticsearch provides fast search at scale
- **Personalization**: Location-based and preference-based discovery

### Specification Reference

- **Primary:** Spec §14 (Search & Discovery) - full section
- **Filters:** Spec §14.2 (11 filter types with business rules)
- **Sorting:** Spec §14.3 (7 sort options)
- **Homepage:** Spec §14.4 (8 discovery sections)
- **APIs:** Appendix B.5 (4 search endpoints)
- **Rate Limiting:** Spec §4.8 (30 requests/minute)
- **Accessibility:** Spec §3.6 (WCAG 2.1 AA)

---

## PHASE 5 IMPLEMENTATION BREAKDOWN

### 5.1 Search Infrastructure (6 tasks)

**Elasticsearch Configuration:**

The Elasticsearch infrastructure is already initialized in Phase 1. Phase 5 extends it with:

- **Field Weighting:** Configure scoring to prioritize:
  - Business name: 3x weight
  - Category: 2x weight
  - Description: 1x weight

- **Synonym Matching:** Common business term synonyms
  - "Restaurant" ↔ "Eatery" ↔ "Dining"
  - "Grocery" ↔ "Supermarket" ↔ "Market"
  - "Pharmacy" ↔ "Chemist"

- **Typo Tolerance:** Fuzzy matching for misspellings
  - Edit distance: 1-2 characters
  - Activated for queries >3 characters

- **Multilingual Analyzer:** Already configured, verify:
  - Standard tokenizer
  - Lowercase filter
  - English stopwords
  - ASCII folding (accent removal)

**Existing Infrastructure (packages/backend/src/search/):**

```typescript
// elasticsearch-client.ts
export async function getEsClient(): Promise<Client> {
  // Returns configured Elasticsearch client
  // Uses env vars: ELASTICSEARCH_URL, ELASTICSEARCH_API_KEY
}

// index-manager.ts
export async function ensureBusinessIndex(): Promise<void> {
  // Creates business index with mapping:
  // - name (text, multilingual)
  // - description (text, multilingual)
  // - categorySlug (keyword)
  // - suburb (keyword)
  // - location (geo_point)
  // - rating (float)
  // - status (keyword)
  // - createdAt, updatedAt (date)
}
```

**Tasks:**
1. Configure field weighting in index mapping
2. Add synonym filter to analyzer
3. Configure fuzzy matching parameters
4. Create document indexing sync service
5. Build query builder utility
6. Set up index refresh strategy

---

### 5.2 Search Features (7 tasks)

#### Full-Text Search

**Endpoint:** `GET /api/v1/search/businesses`

**Query Parameters:**
- `q` (string, required): Search query (max 100 chars)
- `category` (string, optional): Category slug filter
- `distance` (number, optional): Radius in km (500m, 1km, 2km, 5km)
- `lat` (number, optional): User latitude
- `lng` (number, optional): User longitude
- `sort` (string, optional): Sort method (default: relevance)
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Results per page (default: 20, max: 100)

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "uuid",
        "name": "Business Name",
        "description": "...",
        "categorySlug": "restaurants",
        "categoryName": "Restaurants",
        "rating": 4.5,
        "distance": 1.2,
        "photos": [...],
        "highlights": {
          "name": "Business <em>Name</em>",
          "description": "Great <em>restaurant</em>..."
        }
      }
    ],
    "total": 156,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

**Business Rules:**
- Min query length: 1 character
- Max query length: 100 characters
- Rate limit: 30 requests/minute
- Timeout: 5 seconds
- Default sort: relevance (if q provided), else rating

#### Autocomplete Suggestions

**Endpoint:** `GET /api/v1/search/suggestions`

**Query Parameters:**
- `q` (string, required): Partial query (min 1 char)
- `limit` (number, optional): Max suggestions (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "type": "business",
        "id": "uuid",
        "name": "Guildford Pizza",
        "categoryName": "Restaurants"
      },
      {
        "type": "category",
        "slug": "restaurants",
        "name": "Restaurants"
      }
    ],
    "recentSearches": ["pizza", "italian"],
    "popularSearches": ["restaurants", "cafes", "groceries"]
  }
}
```

**Business Rules:**
- Debounced frontend calls (300ms)
- Recent searches only for authenticated users
- Recent searches expire after 30 days (Redis TTL)
- Popular searches: top 10 by frequency (last 7 days)

#### Search Result Highlighting

- Highlight matching terms in business name and description
- Use `<em>` tags for highlights
- Strip HTML tags before display (security)
- Don't rely on color alone (WCAG compliance)

#### Frontend Components to Build

1. **SearchBar Component**
   - Input with autocomplete dropdown
   - Recent searches (if logged in)
   - Popular searches
   - Keyboard navigation (up/down/enter/escape)
   - ARIA labels and roles
   - 44px touch target

2. **SearchResultsPage**
   - Grid layout (2-3 columns responsive)
   - Result cards with highlights
   - Pagination controls
   - Filter sidebar (desktop) or modal (mobile)
   - Sort dropdown
   - Result count display

3. **NoResultsState Component**
   - Empty state illustration (per Spec §7)
   - Helpful suggestions (check spelling, try different keywords)
   - Link to browse all businesses

**Accessibility Requirements:**
- `role="searchbox"` on input
- `aria-label="Search businesses"`
- `aria-live="polite"` on result count
- Keyboard navigable suggestions
- Focus management (on search, focus first result)

---

### 5.3 Filters (11 filter types)

All filters are composable (can be combined). Filters are AND-combined with search query.

#### 5.3.1 Category Filter

**Type:** Multi-select
**Options:** All categories from database (hierarchical)
**UI:** Dropdown or expandable tree
**Query:** `term("categorySlug", ["restaurants", "cafes"])`

**Business Rules:**
- Can select multiple categories
- Child categories include parent matches
- Display category count in filter UI

#### 5.3.2 Distance/Radius Filter

**Type:** Radio buttons or slider
**Options:** 500m, 1km, 2km, 5km, Any
**Requires:** User location (lat/lng)
**Query:** `geo_distance` filter

**Business Rules:**
- If no user location, show "Enable location" prompt
- Timeout after 5 seconds if geolocation fails
- Fallback to suburb-based search if precise location unavailable
- Distance displayed in results (e.g., "1.2 km away")

#### 5.3.3 Open Now Filter

**Type:** Toggle
**Label:** "Open Now"
**Query:** Runtime calculation based on operating hours + timezone

**Business Rules:**
- **BREAKING CHANGE:** Requires business timezone field (add to Phase 4 schema)
- Compare current time in business timezone to operating hours
- Account for public holidays (if business.operatingHours includes holiday exceptions)
- Show countdown if closing within 1 hour (e.g., "Closes in 45 min")

**Implementation:**
```typescript
function isOpenNow(business: Business): boolean {
  const now = DateTime.now().setZone(business.timezone);
  const dayOfWeek = now.weekday; // 1-7 (Mon-Sun)
  const currentTime = now.toFormat('HH:mm');

  const hours = business.operatingHours[dayOfWeek];
  if (!hours || hours.closed) return false;

  return currentTime >= hours.open && currentTime <= hours.close;
}
```

#### 5.3.4 Languages Filter

**Type:** Multi-select
**Options:** Languages from business.languagesSpoken
**Query:** `term("languagesSpoken", ["en", "ar"])`

**Business Rules:**
- Only show languages with >0 businesses
- Display language in native script (e.g., "العربية" for Arabic)

#### 5.3.5 Price Range Filter

**Type:** Multi-select
**Options:** $, $$, $$$, $$$$
**Query:** `term("priceRange", [1, 2])`

**Business Rules:**
- Only applicable to certain categories (restaurants, retail)
- Hide if category doesn't support pricing

#### 5.3.6 Rating Filter

**Type:** Radio buttons or slider
**Options:** Any, 3+, 4+, 4.5+ stars
**Query:** `range("rating", gte: 4.0)`

**Business Rules:**
- Only show businesses with >5 reviews (avoid bias)
- Display as stars in UI

#### 5.3.7 Certifications Filter

**Type:** Multi-select
**Options:** Halal, Kosher, Vegan, Organic, Certified, etc.
**Query:** `term("certifications", ["halal", "organic"])`

**Business Rules:**
- Only show certifications with >0 businesses
- Display certification icon/badge in results

#### 5.3.8 Accessibility Filter

**Type:** Multi-select
**Options:** Wheelchair accessible, Hearing loop, Braille menu, etc.
**Query:** `term("accessibilityFeatures", ["wheelchair"])`

**Business Rules:**
- Multiple selections allowed
- Display accessibility icons in results

#### 5.3.9 Has Promotions Filter

**Type:** Toggle
**Label:** "Current Offers"
**Query:** JOIN with Deal table (valid_until > NOW)

**Business Rules:**
- Only show businesses with active deals
- Display deal badge in results
- Link to deals tab on business profile

#### 5.3.10 Has Events Filter

**Type:** Toggle
**Label:** "Upcoming Events"
**Query:** JOIN with Event table (event_start > NOW)

**Business Rules:**
- Only show businesses with future events
- Display event badge in results
- Link to events tab on business profile

#### 5.3.11 Verified Only Filter

**Type:** Toggle
**Label:** "Verified Businesses"
**Query:** `term("verified", true)`

**Business Rules:**
- Show verified badge in results
- Explain what "verified" means (tooltip/help text)

#### Filter UI Components

**FilterPanel Component:**
```tsx
<FilterPanel>
  <FilterSection title="Category">
    <CategoryFilter />
  </FilterSection>
  <FilterSection title="Distance">
    <DistanceFilter />
  </FilterSection>
  <FilterSection title="Open Now">
    <OpenNowToggle />
  </FilterSection>
  {/* ... 8 more filter sections ... */}
  <Button onClick={clearAll}>Clear All Filters</Button>
</FilterPanel>
```

**Active Filter Chips:**
```tsx
<FilterChips>
  <Chip onRemove={removeFilter}>Restaurants</Chip>
  <Chip onRemove={removeFilter}>Within 2km</Chip>
  <Chip onRemove={removeFilter}>Open Now</Chip>
  <Button onClick={clearAll}>Clear All</Button>
</FilterChips>
```

**URL State:**
```
/search/businesses?q=pizza&category=restaurants&distance=2km&openNow=true&rating=4&page=2
```

---

### 5.4 Sort Options (7 sort types)

Sort options apply to both search results and browse pages.

| Sort Option | API Value | Description | Default When | Elasticsearch Query |
|------------|-----------|-------------|--------------|---------------------|
| **Relevance** | `relevance` | Best match to search terms | Search query provided | Sort by `_score` DESC |
| **Distance** | `distance` | Nearest first | User location available | Geo-distance sort ASC |
| **Rating** | `rating` | Highest rated first | No search query | Sort by `rating` DESC |
| **Most Reviewed** | `reviews` | Most reviews first | - | Sort by `reviewCount` DESC |
| **Recently Updated** | `updated` | Latest activity | - | Sort by `updatedAt` DESC |
| **Alphabetical** | `name` | A-Z order | - | Sort by `name.keyword` ASC |
| **Newest First** | `newest` | Recently added | - | Sort by `createdAt` DESC |

**Implementation:**

```typescript
function buildSortQuery(sort: string, userLocation?: Location): SortOption[] {
  switch (sort) {
    case 'relevance':
      return [{ _score: 'desc' }];
    case 'distance':
      if (!userLocation) throw new Error('Location required');
      return [{
        _geo_distance: {
          location: userLocation,
          order: 'asc',
          unit: 'km'
        }
      }];
    case 'rating':
      return [{ rating: 'desc' }, { reviewCount: 'desc' }];
    case 'reviews':
      return [{ reviewCount: 'desc' }];
    case 'updated':
      return [{ updatedAt: 'desc' }];
    case 'name':
      return [{ 'name.keyword': 'asc' }];
    case 'newest':
      return [{ createdAt: 'desc' }];
    default:
      return [{ _score: 'desc' }];
  }
}
```

**UI Component:**

```tsx
<SortDropdown>
  <option value="relevance">Best Match</option>
  <option value="distance">Nearest</option>
  <option value="rating">Highest Rated</option>
  <option value="reviews">Most Reviewed</option>
  <option value="updated">Recently Updated</option>
  <option value="name">A-Z</option>
  <option value="newest">Newest First</option>
</SortDropdown>
```

---

### 5.5 Homepage Discovery (8 sections)

The homepage is the landing page for all visitors. It showcases businesses through curated sections.

#### 5.5.1 Hero Section

**Components:**
- Full-width background image (from platform.json)
- Prominent search bar (large, centered, 60px height on mobile)
- Quick filter chips (Restaurants, Groceries, Services, Health, etc.)
- Stats strip (total businesses, users, categories)

**Configuration:**
```json
{
  "homepage": {
    "hero": {
      "backgroundImage": "https://cdn.example.com/hero-guildford.jpg",
      "title": "Discover Guildford South",
      "subtitle": "Your local business directory",
      "searchPlaceholder": "Search for businesses, services, food..."
    }
  }
}
```

**Stats Display:**
- Total businesses: Count from database
- Total users: Count from User table (privacy: don't expose exact number if <100)
- Total categories: Count from Category table

#### 5.5.2 Featured Businesses Carousel

**Query:** `SELECT * FROM Business WHERE featured = true ORDER BY display_order LIMIT 10`

**UI:** Horizontal scrolling cards (5-10 businesses)

**Business Card:**
- Business photo (16:9 aspect ratio)
- Business name
- Category name
- Rating (stars + count)
- Distance (if user location available)
- Verified badge (if verified)

**Business Rules:**
- Admin sets `featured = true` in business profile
- Display order configurable via `display_order` field
- Refresh featured list monthly (admin curation)

#### 5.5.3 Near You Section

**Label:** "Near You" or "Nearby Businesses"

**Query:**
```sql
SELECT * FROM Business
WHERE status = 'published'
ORDER BY geo_distance(location, user_location) ASC
LIMIT 8
```

**Business Rules:**
- Requires user location permission
- Show location permission prompt if denied
- Fallback to suburb-based if precise location unavailable
- Max radius: 5km (configurable)
- Display distance in results

#### 5.5.4 New to Platform Section

**Label:** "New Businesses" or "Recently Added"

**Query:**
```sql
SELECT * FROM Business
WHERE status = 'published'
  AND createdAt > NOW() - INTERVAL '30 days'
ORDER BY createdAt DESC
LIMIT 8
```

**Business Rules:**
- Show businesses added in last 30 days
- Badge: "New" on business card
- If <8 businesses, hide section

#### 5.5.5 Highly Rated Section

**Label:** "Highly Rated" or "Top Rated"

**Query:**
```sql
SELECT * FROM Business
WHERE status = 'published'
  AND rating >= 4.5
  AND reviewCount >= 5
ORDER BY rating DESC, reviewCount DESC
LIMIT 8
```

**Business Rules:**
- Min 5 reviews to qualify (avoid bias)
- Show 4.5+ star businesses
- Sort by rating, then review count
- Display stars prominently

#### 5.5.6 With Current Offers Section

**Label:** "Current Offers" or "Special Deals"

**Query:**
```sql
SELECT DISTINCT b.* FROM Business b
JOIN Deal d ON d.business_id = b.id
WHERE b.status = 'published'
  AND d.valid_from <= NOW()
  AND d.valid_until >= NOW()
ORDER BY d.createdAt DESC
LIMIT 8
```

**Business Rules:**
- Only show businesses with active deals
- Badge: "Offer" on business card
- Link to deals tab on business profile
- If <8 businesses, hide section

#### 5.5.7 Upcoming Events Preview

**Label:** "Upcoming Events"

**Query:**
```sql
SELECT * FROM Event
WHERE event_start > NOW()
  AND status = 'published'
ORDER BY event_start ASC
LIMIT 5
```

**Event Card:**
- Event image
- Event name
- Business name
- Date & time
- Location (suburb)

**Business Rules:**
- Show next 3-5 events
- Link to full events page (Phase 8)
- If no events, hide section

#### 5.5.8 Category Grid/Showcase

**Label:** "Browse by Category"

**Query:** `SELECT * FROM Category WHERE type = 'business' ORDER BY display_order`

**UI:** Grid of category cards (4 columns desktop, 2 mobile)

**Category Card:**
- Category icon (from database)
- Category name (localized)
- Business count (e.g., "24 businesses")

**Business Rules:**
- Show all categories (even if 0 businesses, say "Coming soon")
- Click → navigate to `/search/businesses?category=slug`
- Icons use design system Icon component

---

## DATA MODELS

### Existing Models (from Phases 1-4)

#### Business (Appendix A.1)

```typescript
interface Business {
  // Core fields
  id: string;
  name: string;
  description: string;
  categoryId: string;

  // Location
  suburb: string;
  location: { lat: number; lng: number };

  // Search-related
  rating: number;
  reviewCount: number;
  status: 'draft' | 'published' | 'suspended';

  // NEW for Phase 5
  featured: boolean;           // For featured carousel
  displayOrder: number;        // For featured ordering
  timezone: string;            // For "Open Now" calculation (e.g., "Australia/Sydney")

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // ... 50+ other fields from Phase 4
}
```

#### Category (Appendix A.14)

```typescript
interface Category {
  id: string;
  type: 'business' | 'event';
  name: Record<string, string>;  // Multilingual: { en: "Restaurants", ar: "مطاعم" }
  slug: string;
  icon: string;
  parentId: string | null;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Deal (Appendix A.6) - Phase 10, but needed for Phase 5 filters

```typescript
interface Deal {
  id: string;
  businessId: string;
  title: string;
  validFrom: Date;
  validUntil: Date;
  status: 'draft' | 'published' | 'expired';
  createdAt: Date;
  updatedAt: Date;
}
```

### Schema Migrations Needed

**Add to Business table:**

```sql
ALTER TABLE "Business"
ADD COLUMN "featured" BOOLEAN DEFAULT false,
ADD COLUMN "displayOrder" INTEGER DEFAULT 0,
ADD COLUMN "timezone" VARCHAR(50) DEFAULT 'Australia/Sydney';

CREATE INDEX idx_business_featured ON "Business"(featured, displayOrder);
CREATE INDEX idx_business_created_at ON "Business"(createdAt DESC);
CREATE INDEX idx_business_rating ON "Business"(rating DESC, reviewCount DESC);
```

### Elasticsearch Document Structure

```json
{
  "id": "uuid",
  "name": "Guildford Pizza",
  "description": "Authentic Italian pizza...",
  "categorySlug": "restaurants",
  "suburb": "Guildford South",
  "location": {
    "lat": -33.9366,
    "lon": 150.6966
  },
  "rating": 4.5,
  "reviewCount": 42,
  "status": "published",
  "featured": true,
  "languagesSpoken": ["en", "it"],
  "certifications": ["halal", "organic"],
  "priceRange": 2,
  "verified": true,
  "createdAt": "2026-02-15T10:00:00Z",
  "updatedAt": "2026-03-01T14:30:00Z"
}
```

---

## API ENDPOINTS

All endpoints from **Appendix B.5** (Search API Endpoints).

### 1. Search Businesses

**Endpoint:** `GET /api/v1/search/businesses`

**Authentication:** Public (no auth required)

**Rate Limit:** 30 requests/minute

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `q` | string | Yes* | - | Search query (max 100 chars) |
| `category` | string | No | - | Category slug filter |
| `distance` | number | No | - | Radius in km (0.5, 1, 2, 5) |
| `lat` | number | No** | - | User latitude (-90 to 90) |
| `lng` | number | No** | - | User longitude (-180 to 180) |
| `openNow` | boolean | No | false | Filter by open now |
| `languages` | string[] | No | - | Languages spoken |
| `priceRange` | number[] | No | - | Price range (1-4) |
| `rating` | number | No | - | Min rating (0-5) |
| `certifications` | string[] | No | - | Certifications |
| `accessibility` | string[] | No | - | Accessibility features |
| `hasPromotions` | boolean | No | false | Has active deals |
| `hasEvents` | boolean | No | false | Has upcoming events |
| `verifiedOnly` | boolean | No | false | Verified businesses only |
| `sort` | string | No | relevance | Sort method |
| `page` | number | No | 1 | Page number (min: 1) |
| `limit` | number | No | 20 | Results per page (max: 100) |

*Either `q` or at least one filter must be provided.
**Both `lat` and `lng` required for distance filter.

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "uuid",
        "name": "Guildford Pizza",
        "description": "Authentic Italian pizza...",
        "categorySlug": "restaurants",
        "categoryName": "Restaurants",
        "rating": 4.5,
        "reviewCount": 42,
        "distance": 1.2,
        "photos": ["url1", "url2"],
        "verified": true,
        "highlights": {
          "name": "Guildford <em>Pizza</em>",
          "description": "Authentic Italian <em>pizza</em>..."
        }
      }
    ],
    "total": 156,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

**Error Responses:**

- `400` - Invalid query parameters
- `429` - Rate limit exceeded
- `500` - Server error

### 2. Search Events

**Endpoint:** `GET /api/v1/search/events`

**Authentication:** Public

**Query Parameters:** Similar to businesses (q, category, distance, sort, page, limit)

**Success Response (200):** Similar structure to businesses

**Note:** Full implementation in Phase 8. Phase 5 can create stub endpoint.

### 3. Autocomplete Suggestions

**Endpoint:** `GET /api/v1/search/suggestions`

**Authentication:** Public (recent searches require auth)

**Rate Limit:** 60 requests/minute (higher for autocomplete)

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `q` | string | Yes | - | Partial query (min 1 char) |
| `limit` | number | No | 10 | Max suggestions (max: 20) |

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "type": "business",
        "id": "uuid",
        "name": "Guildford Pizza",
        "categoryName": "Restaurants"
      },
      {
        "type": "category",
        "slug": "restaurants",
        "name": "Restaurants"
      }
    ],
    "recentSearches": ["pizza", "italian"],
    "popularSearches": ["restaurants", "cafes", "groceries"]
  }
}
```

### 4. Search All (Combined)

**Endpoint:** `GET /api/v1/search/all`

**Authentication:** Public

**Query Parameters:** `q`, `page`, `limit`

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "businesses": [...],
    "events": [...],
    "total": 42
  }
}
```

**Note:** Returns mixed results from multiple content types.

---

## CONFIGURATION REQUIREMENTS

### Environment Variables (.env)

```bash
# Elasticsearch Configuration
ELASTICSEARCH_URL=http://localhost:9200
ELASTICSEARCH_API_KEY=optional-api-key
ES_INDEX_PREFIX=community-hub
ES_NUMBER_OF_SHARDS=1
ES_NUMBER_OF_REPLICAS=0

# Search Settings
SEARCH_RATE_LIMIT=30
SEARCH_RATE_WINDOW=60000
SEARCH_QUERY_TIMEOUT=5000
SEARCH_MAX_RESULTS=100

# Redis (for recent searches)
REDIS_URL=redis://localhost:6379
REDIS_RECENT_SEARCHES_TTL=2592000  # 30 days in seconds
```

### Platform Configuration (config/platform.json)

```json
{
  "location": {
    "name": "Guildford South",
    "suburb": "Guildford",
    "postcode": "2680",
    "coordinates": {
      "lat": -33.9366,
      "lng": 150.6966
    },
    "timezone": "Australia/Sydney"
  },
  "search": {
    "enabled": true,
    "defaultSort": "relevance",
    "defaultRadius": 5,
    "maxRadius": 25,
    "radiusUnits": "km",
    "autocompleteMinLength": 1,
    "autocompleteDebounce": 300,
    "resultsPerPage": 20,
    "elasticsearch": {
      "indexName": "businesses",
      "queryTimeout": "5s",
      "fuzzyEnabled": true,
      "synonymsEnabled": true
    }
  },
  "homepage": {
    "hero": {
      "backgroundImage": "https://cdn.example.com/hero-guildford.jpg",
      "title": "Discover Guildford South",
      "subtitle": "Your local business directory",
      "searchPlaceholder": "Search for businesses, services, food..."
    },
    "sections": {
      "featured": {
        "enabled": true,
        "title": "Featured Businesses",
        "limit": 10
      },
      "nearYou": {
        "enabled": true,
        "title": "Near You",
        "limit": 8,
        "maxRadius": 5
      },
      "newBusinesses": {
        "enabled": true,
        "title": "New Businesses",
        "limit": 8,
        "daysThreshold": 30
      },
      "highlyRated": {
        "enabled": true,
        "title": "Highly Rated",
        "limit": 8,
        "minRating": 4.5,
        "minReviews": 5
      },
      "currentOffers": {
        "enabled": true,
        "title": "Current Offers",
        "limit": 8
      },
      "upcomingEvents": {
        "enabled": true,
        "title": "Upcoming Events",
        "limit": 5
      },
      "categories": {
        "enabled": true,
        "title": "Browse by Category"
      }
    },
    "stats": {
      "showBusinessCount": true,
      "showUserCount": true,
      "showCategoriesCount": true
    }
  }
}
```

---

## SECURITY & COMPLIANCE

### Rate Limiting

**Search Endpoints:**
- `/search/businesses`: 30 requests/minute
- `/search/suggestions`: 60 requests/minute (higher for autocomplete UX)
- `/search/events`: 30 requests/minute
- `/search/all`: 30 requests/minute

**Implementation:**
```typescript
import { createRateLimiter } from '../middleware/rate-limiter.js';

const searchRateLimiter = createRateLimiter({
  windowMs: 60000, // 1 minute
  max: 30,
  message: 'Too many search requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/businesses', searchRateLimiter, searchBusinesses);
```

### Input Validation & Sanitization

**Search Query:**
- Max length: 100 characters
- Strip HTML tags
- Escape special regex characters
- Trim whitespace

**Filters:**
- Validate against allowed values (enum validation)
- Sanitize user input (prevent injection)
- Validate number ranges (lat/lng, rating, distance)

**Implementation:**
```typescript
import { sanitizeInput } from '../middleware/sanitization.js';
import { body, query, validationResult } from 'express-validator';

const validateSearchQuery = [
  query('q').optional().isString().trim().isLength({ min: 1, max: 100 }),
  query('category').optional().isString().matches(/^[a-z0-9-]+$/),
  query('distance').optional().isFloat({ min: 0.5, max: 25 }),
  query('lat').optional().isFloat({ min: -90, max: 90 }),
  query('lng').optional().isFloat({ min: -180, max: 180 }),
  query('rating').optional().isFloat({ min: 0, max: 5 }),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  sanitizeInput(),
];

router.get('/businesses', validateSearchQuery, searchBusinesses);
```

### Privacy & Data Protection

**Recent Searches:**
- Only stored for authenticated users
- Stored in Redis (not database)
- 30-day TTL (auto-expire)
- User can clear recent searches
- Not shared with other users or analytics

**Location Data:**
- User location requires permission
- Not stored server-side (client-side only)
- Used only for distance calculation
- Fallback to suburb-based if permission denied

**Search Analytics:**
- Aggregate search terms (not per-user)
- Popular searches calculated anonymously
- Comply with Australian Privacy Principles (APP)

### Accessibility (WCAG 2.1 AA)

**Search Bar:**
- `role="searchbox"`
- `aria-label="Search businesses"`
- `aria-expanded` for autocomplete dropdown
- `aria-owns` and `aria-activedescendant` for keyboard nav
- 44px minimum touch target

**Search Results:**
- `role="list"` for result list
- `aria-live="polite"` for result count
- Keyboard navigable (Tab, Arrow keys)
- Focus indicators visible (3:1 contrast)
- Highlights don't rely on color alone

**Filters:**
- Fieldsets with legends
- Labels for all inputs
- Error messages linked via `aria-describedby`
- Keyboard accessible (checkboxes, toggles)

**Testing:**
```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('SearchBar is accessible', async () => {
  const { container } = render(<SearchBar />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Internationalization (i18n)

**Translations Required:**

```json
// packages/frontend/src/i18n/locales/en.json
{
  "search": {
    "placeholder": "Search for businesses, services, food...",
    "resultsCount": "{{count}} results found",
    "noResults": "No results found for \"{{query}}\"",
    "suggestions": "Suggestions",
    "recentSearches": "Recent Searches",
    "popularSearches": "Popular Searches",
    "filters": {
      "category": "Category",
      "distance": "Distance",
      "openNow": "Open Now",
      "rating": "Rating",
      "clearAll": "Clear All Filters"
    },
    "sort": {
      "relevance": "Best Match",
      "distance": "Nearest",
      "rating": "Highest Rated",
      "newest": "Newest First"
    }
  },
  "homepage": {
    "hero": {
      "title": "Discover {{location}}",
      "subtitle": "Your local business directory"
    },
    "sections": {
      "featured": "Featured Businesses",
      "nearYou": "Near You",
      "new": "New Businesses",
      "highlyRated": "Highly Rated",
      "offers": "Current Offers",
      "events": "Upcoming Events",
      "categories": "Browse by Category"
    }
  }
}
```

**RTL Support:**
- Search bar layout reverses (icon on left)
- Filter panel slides from left (not right)
- Cards/grids flow right-to-left
- Distance "1.2 km" displays as "كم 1.2"

---

## TECHNICAL ARCHITECTURE

### Backend Flow

```
User Request: GET /api/v1/search/businesses?q=pizza&category=restaurants&distance=2km
  ↓
[1. Rate Limiter] - Check 30/minute limit
  ↓
[2. Input Validation] - Validate query, filters (express-validator)
  ↓
[3. Sanitization] - Strip HTML, escape special chars
  ↓
[4. Search Service] - Business logic layer
  ├── Build Elasticsearch query
  │   ├── Match query for "pizza"
  │   ├── Term filter for category
  │   ├── Geo-distance filter for 2km
  │   └── Sort by relevance
  ├── Execute ES query
  │   └── getEsClient().search({ index: 'businesses', body: {...} })
  └── Format response
      ├── Map ES docs to Business DTOs
      ├── Add highlights
      └── Calculate pagination
  ↓
[5. Response] - sendSuccess(res, data, 200)
```

### Elasticsearch Query Builder

```typescript
interface SearchParams {
  q?: string;
  category?: string;
  distance?: number;
  lat?: number;
  lng?: number;
  openNow?: boolean;
  rating?: number;
  sort?: string;
  page?: number;
  limit?: number;
}

function buildElasticsearchQuery(params: SearchParams) {
  const { q, category, distance, lat, lng, rating, sort, page = 1, limit = 20 } = params;

  const query: any = {
    bool: {
      must: [],
      filter: [],
    },
  };

  // Full-text search
  if (q) {
    query.bool.must.push({
      multi_match: {
        query: q,
        fields: ['name^3', 'categorySlug^2', 'description'],
        type: 'best_fields',
        fuzziness: 'AUTO',
      },
    });
  }

  // Filters
  if (category) {
    query.bool.filter.push({ term: { categorySlug: category } });
  }

  if (distance && lat && lng) {
    query.bool.filter.push({
      geo_distance: {
        distance: `${distance}km`,
        location: { lat, lon: lng },
      },
    });
  }

  if (rating) {
    query.bool.filter.push({ range: { rating: { gte: rating } } });
  }

  // Always filter by published status
  query.bool.filter.push({ term: { status: 'published' } });

  // Sort
  const sortOptions = buildSortQuery(sort, lat && lng ? { lat, lng } : undefined);

  // Pagination
  const from = (page - 1) * limit;

  return {
    index: 'businesses',
    body: {
      query,
      sort: sortOptions,
      from,
      size: limit,
      highlight: {
        fields: {
          name: {},
          description: {},
        },
        pre_tags: ['<em>'],
        post_tags: ['</em>'],
      },
    },
  };
}
```

### Frontend Architecture

**State Management:**

```typescript
// useSearch.ts
interface SearchState {
  query: string;
  filters: FilterState;
  sort: string;
  page: number;
  results: Business[];
  total: number;
  loading: boolean;
  error: string | null;
}

function useSearch() {
  const [state, setState] = useState<SearchState>({
    query: '',
    filters: {},
    sort: 'relevance',
    page: 1,
    results: [],
    total: 0,
    loading: false,
    error: null,
  });

  const search = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const params = buildSearchParams(state);
      const response = await api.get('/search/businesses', { params });

      setState(prev => ({
        ...prev,
        results: response.data.results,
        total: response.data.total,
        loading: false,
      }));

      // Update URL
      const url = buildSearchUrl(state);
      history.pushState({}, '', url);
    } catch (error) {
      setState(prev => ({ ...prev, loading: false, error: error.message }));
    }
  }, [state]);

  return { state, search, setQuery, setFilter, setSort, setPage };
}
```

**Component Hierarchy:**

```
SearchPage
├── SearchBar
│   ├── Input (with debounce)
│   └── AutocompleteDropdown
│       ├── RecentSearches (if logged in)
│       ├── PopularSearches
│       └── BusinessSuggestions
├── FilterPanel (desktop sidebar, mobile modal)
│   ├── CategoryFilter
│   ├── DistanceFilter
│   ├── OpenNowToggle
│   ├── RatingFilter
│   └── ... (8 more filters)
├── ActiveFilterChips
├── SortDropdown
├── ResultCount
├── SearchResults (grid layout)
│   ├── BusinessCard (with highlights)
│   ├── BusinessCard
│   └── ...
├── Pagination
└── NoResultsState (if empty)
```

### Caching Strategy

**Elasticsearch Results:**
- Cache search results in Redis (5 minute TTL)
- Cache key: `search:${hash(params)}`
- Invalidate on business update

**Recent Searches:**
- Redis sorted set per user: `recent-searches:${userId}`
- 30-day TTL
- Max 10 entries

**Popular Searches:**
- Redis sorted set (global): `popular-searches`
- 7-day rolling window
- Recalculate daily

---

## TASK LIST BREAKDOWN

### 5.1 Search Infrastructure (6 tasks)

- [ ] **5.1.1** Configure Elasticsearch field weighting (name: 3x, category: 2x, description: 1x)
- [ ] **5.1.2** Implement business document indexing sync (on create/update/delete)
- [ ] **5.1.3** Set up synonym matching (Restaurant ↔ Eatery, Grocery ↔ Supermarket)
- [ ] **5.1.4** Configure typo tolerance (fuzzy matching, edit distance 1-2)
- [ ] **5.1.5** Enhance multilingual analyzer (verify tokenization, stopwords)
- [ ] **5.1.6** Create Elasticsearch query builder utility (buildSearchQuery function)

### 5.2 Search Features (7 tasks)

- [ ] **5.2.1** Build full-text search endpoint (`GET /search/businesses`)
- [ ] **5.2.2** Implement autocomplete endpoint (`GET /search/suggestions`)
- [ ] **5.2.3** Add recent searches tracking (Redis sorted set, 30-day TTL)
- [ ] **5.2.4** Display popular searches (Redis sorted set, 7-day window)
- [ ] **5.2.5** Build SearchBar component (input + autocomplete dropdown)
- [ ] **5.2.6** Build SearchResultsPage (grid layout + pagination)
- [ ] **5.2.7** Add result highlighting display (`<em>` tags for matches)

### 5.3 Filters (11 tasks)

- [ ] **5.3.1** Create FilterPanel component (form layout, mobile-friendly)
- [ ] **5.3.2** Implement category filter (multi-select, hierarchical)
- [ ] **5.3.3** Implement distance/radius filter (500m, 1km, 2km, 5km, Any)
- [ ] **5.3.4** Implement Open Now toggle (timezone-aware calculation)
- [ ] **5.3.5** Implement languages filter (multi-select)
- [ ] **5.3.6** Implement price range filter ($ to $$$$)
- [ ] **5.3.7** Implement rating filter (3+, 4+, 4.5+ stars)
- [ ] **5.3.8** Implement certifications filter (Halal, Kosher, Vegan, Organic)
- [ ] **5.3.9** Implement accessibility filter (Wheelchair, Hearing loop, etc.)
- [ ] **5.3.10** Implement has_promotions/has_events toggles (JOIN queries)
- [ ] **5.3.11** Implement verified_only toggle

### 5.4 Sort Options (7 tasks)

- [ ] **5.4.1** Implement relevance sort (ES `_score` field)
- [ ] **5.4.2** Implement distance sort (geo-distance ASC)
- [ ] **5.4.3** Implement rating sort (rating DESC, reviewCount DESC)
- [ ] **5.4.4** Implement most_reviewed sort (reviewCount DESC)
- [ ] **5.4.5** Implement recently_updated sort (updatedAt DESC)
- [ ] **5.4.6** Implement alphabetical sort (name ASC)
- [ ] **5.4.7** Implement newest_first sort (createdAt DESC)

### 5.5 Homepage Discovery (3 tasks)

- [ ] **5.5.1** Build HomePage component with 8 discovery sections
- [ ] **5.5.2** Implement featured businesses carousel (horizontal scrolling)
- [ ] **5.5.3** Implement category grid (all categories with icons)

### Additional Tasks (not in original 34)

- [ ] **5.6.1** Write unit tests for search service (>20 tests)
- [ ] **5.6.2** Write component tests for SearchBar (autocomplete, keyboard nav)
- [ ] **5.6.3** Write component tests for FilterPanel (all 11 filters)
- [ ] **5.6.4** Write integration tests for full search flow (query → ES → results)
- [ ] **5.6.5** Write E2E tests for search and homepage (user journey)
- [ ] **5.6.6** Accessibility audit (jest-axe, keyboard nav, screen reader testing)
- [ ] **5.6.7** Performance testing (p95 <200ms for search endpoint)
- [ ] **5.6.8** QA review and bug fixes

**Total Tasks:** 34 core + 8 testing/QA = **42 tasks**

---

## DEPENDENCIES & BLOCKERS

### Phase 5 Dependencies (All Complete ✅)

1. **Phase 1: Foundation** ✅
   - Elasticsearch infrastructure (elasticsearch-client.ts, index-manager.ts)
   - Redis for caching/recent searches
   - Rate limiting middleware
   - Input validation and sanitization middleware
   - Response utilities (sendSuccess, sendError)

2. **Phase 2: Authentication** ✅
   - User authentication (for recent searches)
   - JWT middleware (optional for search)
   - User context in requests

3. **Phase 3: Design System** ✅
   - All UI components (Input, Button, Card, Grid, Modal, etc.)
   - Responsive breakpoints
   - Accessibility utilities (jest-axe)
   - Icon component for category icons

4. **Phase 4: Business Directory** ✅
   - Business entity with all fields
   - Business API structure
   - Business card component
   - Category system

### Future Phases Depending on Phase 5

1. **Phase 6: User Engagement** (Reviews, Saved Businesses)
   - Search results show ratings (aggregate from reviews)
   - Saved businesses feature uses search

2. **Phase 8: Events System**
   - Event search endpoint (stub in Phase 5)
   - Homepage events preview section

3. **Phase 10: Deals Hub**
   - Search filter "Has Promotions"
   - Homepage offers section

### Known Blockers

**BREAKING CHANGE Required:**
- **Add `timezone` field to Business table** (for "Open Now" calculation)
  - Default: `'Australia/Sydney'`
  - Required for accurate open hours calculation
  - Migration: `ALTER TABLE "Business" ADD COLUMN "timezone" VARCHAR(50) DEFAULT 'Australia/Sydney'`

**Optional Enhancements (can defer):**
- Review system (Phase 6) - for accurate rating sorting
- Events system (Phase 8) - for events search and homepage preview
- Deals system (Phase 10) - for promotions filter and offers section

---

## BUSINESS RULES & CONSTRAINTS

### Search Query Rules

1. **Query Length:**
   - Min: 1 character
   - Max: 100 characters
   - Trim leading/trailing whitespace
   - Strip HTML tags

2. **Fuzzy Matching:**
   - Enabled for queries >3 characters
   - Edit distance: 1-2 characters (AUTO mode)
   - Prefix length: 2 characters (prevent excessive fuzzy matches)

3. **Field Weighting:**
   - Business name: 3x weight
   - Category: 2x weight
   - Description: 1x weight

4. **Synonyms:**
   - "Restaurant" ↔ "Eatery" ↔ "Dining"
   - "Grocery" ↔ "Supermarket" ↔ "Market"
   - "Pharmacy" ↔ "Chemist"
   - "Petrol" ↔ "Gas Station"

### Distance Calculation Rules

1. **User Location:**
   - Requires geolocation permission
   - 5-second timeout for permission prompt
   - Fallback to suburb-based if denied

2. **Distance Options:**
   - 500m, 1km, 2km, 5km, Any
   - Default: 5km (if location available)
   - Max radius: 25km (configurable)

3. **Display:**
   - Show distance in results (e.g., "1.2 km away")
   - Round to 1 decimal place
   - Use km for >1km, m for <1km

### Open Now Calculation Rules

1. **Timezone Awareness:**
   - Use business.timezone field (e.g., "Australia/Sydney")
   - Convert current time to business timezone
   - Compare against operating hours for current day

2. **Operating Hours Format:**
   - Stored as JSON: `{ "1": { "open": "09:00", "close": "17:00", "closed": false }, ... }`
   - Days: 1-7 (Monday-Sunday)
   - Times: 24-hour format (HH:mm)

3. **Special Cases:**
   - 24-hour businesses: `{ "open": "00:00", "close": "23:59" }`
   - Closed days: `{ "closed": true }`
   - Public holidays: Check business.holidayHours (if implemented)

4. **Display:**
   - Show "Open Now" badge in green
   - Show countdown if closing within 1 hour (e.g., "Closes in 45 min")

### Rating & Review Rules

1. **Minimum Reviews:**
   - Businesses with <5 reviews not shown in "Highly Rated" section
   - Prevents bias from single 5-star review

2. **Rating Display:**
   - Show stars + count (e.g., "4.5 ⭐ (42 reviews)")
   - Round to 1 decimal place
   - Default: null if 0 reviews (don't show 0.0)

3. **Sorting:**
   - Sort by rating DESC, then reviewCount DESC
   - Tie-breaker: createdAt DESC

### Pagination Rules

1. **Limits:**
   - Default: 20 results per page
   - Max: 100 results per page
   - Min page: 1

2. **Offset Calculation:**
   - `from = (page - 1) * limit`
   - Max offset: 10,000 (Elasticsearch limit)

3. **Deep Pagination:**
   - Discourage page >50 (poor UX)
   - Consider search-after cursor for large result sets (Phase 5 deferred)

### Recent Searches Rules

1. **Storage:**
   - Redis sorted set per user: `recent-searches:${userId}`
   - Score: timestamp (for chronological order)
   - Max 10 entries (remove oldest on insert)

2. **TTL:**
   - 30 days (auto-expire)
   - User can manually clear all

3. **Display:**
   - Show in autocomplete dropdown (if logged in)
   - Most recent first
   - Click → re-execute search

### Popular Searches Rules

1. **Calculation:**
   - Aggregate all search queries (last 7 days)
   - Count frequency
   - Top 10 by frequency

2. **Recalculation:**
   - Daily cron job (rebuild sorted set)
   - Incremental update on each search (optional optimization)

3. **Display:**
   - Show in autocomplete dropdown (all users)
   - Click → execute search

---

## TESTING STRATEGY

### Unit Tests (Backend)

**Search Service Tests (20+ tests):**

```typescript
describe('SearchService', () => {
  describe('buildSearchQuery', () => {
    test('builds basic text search query', () => {
      const query = buildSearchQuery({ q: 'pizza' });
      expect(query.body.query.bool.must[0].multi_match.query).toBe('pizza');
    });

    test('applies category filter', () => {
      const query = buildSearchQuery({ q: 'pizza', category: 'restaurants' });
      expect(query.body.query.bool.filter).toContainEqual({ term: { categorySlug: 'restaurants' } });
    });

    test('applies geo-distance filter', () => {
      const query = buildSearchQuery({ q: 'pizza', distance: 2, lat: -33.9366, lng: 150.6966 });
      expect(query.body.query.bool.filter).toContainEqual({
        geo_distance: { distance: '2km', location: { lat: -33.9366, lon: 150.6966 } }
      });
    });

    test('applies rating filter', () => {
      const query = buildSearchQuery({ rating: 4 });
      expect(query.body.query.bool.filter).toContainEqual({ range: { rating: { gte: 4 } } });
    });

    // ... 16 more tests for all filters, sorts, pagination
  });

  describe('formatSearchResults', () => {
    test('maps ES documents to Business DTOs', () => {
      const esDocs = [{ _source: { id: '1', name: 'Test' }, highlight: { name: ['<em>Test</em>'] } }];
      const results = formatSearchResults(esDocs);
      expect(results[0].highlights.name).toBe('<em>Test</em>');
    });
  });
});
```

**Query Builder Tests (15+ tests):**

```typescript
describe('Query Builder', () => {
  test('combines multiple filters with AND logic', () => {
    const query = buildSearchQuery({
      q: 'pizza',
      category: 'restaurants',
      rating: 4,
      openNow: true
    });
    expect(query.body.query.bool.filter.length).toBeGreaterThanOrEqual(3);
  });

  test('validates required lat/lng for distance filter', () => {
    expect(() => buildSearchQuery({ distance: 2 })).toThrow('Location required');
  });

  // ... more edge cases
});
```

### Component Tests (Frontend)

**SearchBar Tests (20+ tests):**

```typescript
describe('SearchBar', () => {
  test('renders input with placeholder', () => {
    render(<SearchBar />);
    expect(screen.getByPlaceholderText(/search for businesses/i)).toBeInTheDocument();
  });

  test('shows autocomplete dropdown on typing', async () => {
    render(<SearchBar />);
    const input = screen.getByRole('searchbox');

    await userEvent.type(input, 'piz');

    await waitFor(() => {
      expect(screen.getByText(/suggestions/i)).toBeInTheDocument();
    });
  });

  test('debounces API calls', async () => {
    const mockFetch = vi.fn();
    global.fetch = mockFetch;

    render(<SearchBar />);
    const input = screen.getByRole('searchbox');

    await userEvent.type(input, 'pizza');

    expect(mockFetch).toHaveBeenCalledTimes(1); // Only 1 call after debounce
  });

  test('navigates on Enter key', async () => {
    const mockNavigate = vi.fn();
    render(<SearchBar navigate={mockNavigate} />);
    const input = screen.getByRole('searchbox');

    await userEvent.type(input, 'pizza{Enter}');

    expect(mockNavigate).toHaveBeenCalledWith('/search/businesses?q=pizza');
  });

  test('is accessible', async () => {
    const { container } = render(<SearchBar />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  // ... 15 more tests for keyboard nav, recent searches, popular searches
});
```

**FilterPanel Tests (25+ tests):**

```typescript
describe('FilterPanel', () => {
  test('renders all 11 filter sections', () => {
    render(<FilterPanel />);
    expect(screen.getByText(/category/i)).toBeInTheDocument();
    expect(screen.getByText(/distance/i)).toBeInTheDocument();
    expect(screen.getByText(/open now/i)).toBeInTheDocument();
    // ... 8 more
  });

  test('applies category filter on selection', async () => {
    const onFilterChange = vi.fn();
    render(<FilterPanel onFilterChange={onFilterChange} />);

    await userEvent.click(screen.getByLabelText(/restaurants/i));

    expect(onFilterChange).toHaveBeenCalledWith({ category: ['restaurants'] });
  });

  test('clears all filters on button click', async () => {
    const onClearAll = vi.fn();
    render(<FilterPanel onClearAll={onClearAll} />);

    await userEvent.click(screen.getByText(/clear all filters/i));

    expect(onClearAll).toHaveBeenCalled();
  });

  test('updates URL on filter change', async () => {
    render(<FilterPanel />);

    await userEvent.click(screen.getByLabelText(/restaurants/i));

    expect(window.location.search).toContain('category=restaurants');
  });

  test('is accessible', async () => {
    const { container } = render(<FilterPanel />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  // ... 20 more tests for each filter type, combinations, edge cases
});
```

**SearchResultsPage Tests (15+ tests):**

```typescript
describe('SearchResultsPage', () => {
  test('displays search results in grid', async () => {
    const mockResults = [
      { id: '1', name: 'Business 1', categoryName: 'Restaurants' },
      { id: '2', name: 'Business 2', categoryName: 'Cafes' },
    ];

    render(<SearchResultsPage results={mockResults} />);

    expect(screen.getByText('Business 1')).toBeInTheDocument();
    expect(screen.getByText('Business 2')).toBeInTheDocument();
  });

  test('displays result count', () => {
    render(<SearchResultsPage total={156} />);
    expect(screen.getByText(/156 results found/i)).toBeInTheDocument();
  });

  test('displays pagination controls', () => {
    render(<SearchResultsPage total={100} page={2} limit={20} />);
    expect(screen.getByLabelText(/previous page/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/next page/i)).toBeInTheDocument();
  });

  test('shows no results state when empty', () => {
    render(<SearchResultsPage results={[]} />);
    expect(screen.getByText(/no results found/i)).toBeInTheDocument();
  });

  // ... 11 more tests for sorting, mobile layout, loading states
});
```

### Integration Tests (10+ tests)

```typescript
describe('Search Integration', () => {
  test('full search flow: query -> ES -> results', async () => {
    // Setup: seed Elasticsearch with test data
    await seedElasticsearch([
      { id: '1', name: 'Guildford Pizza', categorySlug: 'restaurants' },
      { id: '2', name: 'Pizza Hut', categorySlug: 'restaurants' },
    ]);

    // Act: search for "pizza"
    const response = await request(app).get('/api/v1/search/businesses?q=pizza');

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.data.results.length).toBe(2);
    expect(response.body.data.results[0].name).toContain('Pizza');
  });

  test('search with multiple filters', async () => {
    const response = await request(app)
      .get('/api/v1/search/businesses')
      .query({ q: 'pizza', category: 'restaurants', rating: 4 });

    expect(response.status).toBe(200);
    response.body.data.results.forEach(result => {
      expect(result.categorySlug).toBe('restaurants');
      expect(result.rating).toBeGreaterThanOrEqual(4);
    });
  });

  test('pagination across multiple pages', async () => {
    const page1 = await request(app).get('/api/v1/search/businesses?q=business&page=1&limit=10');
    const page2 = await request(app).get('/api/v1/search/businesses?q=business&page=2&limit=10');

    expect(page1.body.data.results.length).toBe(10);
    expect(page2.body.data.results.length).toBeLessThanOrEqual(10);
    expect(page1.body.data.results[0].id).not.toBe(page2.body.data.results[0].id);
  });

  // ... 7 more integration tests
});
```

### E2E Tests (5+ tests)

```typescript
describe('Search E2E', () => {
  test('user searches for business and views results', async () => {
    await page.goto('http://localhost:3000');

    // Type in search bar
    await page.fill('[role="searchbox"]', 'pizza');
    await page.press('[role="searchbox"]', 'Enter');

    // Wait for results page
    await page.waitForSelector('[data-testid="search-results"]');

    // Assert results displayed
    const results = await page.$$('[data-testid="business-card"]');
    expect(results.length).toBeGreaterThan(0);
  });

  test('user applies filters and sorts results', async () => {
    await page.goto('http://localhost:3000/search/businesses?q=restaurants');

    // Apply category filter
    await page.click('[data-testid="category-filter"]');
    await page.click('[data-testid="category-restaurants"]');

    // Change sort order
    await page.selectOption('[data-testid="sort-dropdown"]', 'rating');

    // Wait for results update
    await page.waitForLoadState('networkidle');

    // Assert URL updated
    expect(page.url()).toContain('category=restaurants');
    expect(page.url()).toContain('sort=rating');
  });

  // ... 3 more E2E tests
});
```

### Accessibility Testing

```typescript
describe('Accessibility', () => {
  test('SearchBar has no violations', async () => {
    const { container } = render(<SearchBar />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('FilterPanel has no violations', async () => {
    const { container } = render(<FilterPanel />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('SearchResultsPage has no violations', async () => {
    const { container } = render(<SearchResultsPage results={mockResults} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('keyboard navigation works', async () => {
    render(<SearchBar />);
    const input = screen.getByRole('searchbox');

    // Focus on input
    input.focus();
    expect(document.activeElement).toBe(input);

    // Type and navigate suggestions
    await userEvent.type(input, 'piz');
    await userEvent.keyboard('{ArrowDown}');

    // Assert first suggestion focused
    const firstSuggestion = screen.getAllByRole('option')[0];
    expect(document.activeElement).toBe(firstSuggestion);
  });
});
```

### Performance Testing

```typescript
describe('Performance', () => {
  test('search endpoint responds in <200ms (p95)', async () => {
    const times: number[] = [];

    for (let i = 0; i < 100; i++) {
      const start = Date.now();
      await request(app).get('/api/v1/search/businesses?q=pizza');
      times.push(Date.now() - start);
    }

    times.sort((a, b) => a - b);
    const p95 = times[Math.floor(times.length * 0.95)];

    expect(p95).toBeLessThan(200);
  });

  test('homepage loads in <3s on 3G', async () => {
    // Use Lighthouse or Puppeteer with 3G throttling
    const metrics = await lighthouse('http://localhost:3000', {
      throttling: { rttMs: 150, throughputKbps: 1600 },
    });

    expect(metrics.firstContentfulPaint).toBeLessThan(3000);
  });
});
```

### Coverage Target

**Target:** >80% overall coverage (per Phase requirements)

**Current Baseline:** 60% enforced (from Phase 4)

**Coverage Breakdown:**
- Backend search service: >90%
- Backend API routes: >85%
- Frontend components: >80%
- Frontend hooks: >75%
- Integration tests: All critical flows

---

## CONFIGURATION LOCATION REQUIREMENTS

### Location-Agnostic Design Principles

Phase 5 must adhere to the three-tier configuration system:

1. **`.env`** - Environment-specific settings
2. **`config/platform.json`** - Location, branding, feature flags
3. **Database** - Runtime-editable settings (categories, templates)

### What MUST Be Configurable

✅ **Correct Approach:**

1. **Hero Image:** Load from `platform.json`
   ```json
   { "homepage": { "hero": { "backgroundImage": "url" } } }
   ```

2. **Location Name:** Load from `platform.json`
   ```json
   { "location": { "name": "Guildford South" } }
   ```

3. **Coordinates:** Load from `platform.json`
   ```json
   { "location": { "coordinates": { "lat": -33.9366, "lng": 150.6966 } } }
   ```

4. **Search Radius:** Load from `platform.json`
   ```json
   { "search": { "defaultRadius": 5, "maxRadius": 25 } }
   ```

5. **Categories:** Load from database (not hardcoded)
   ```sql
   SELECT * FROM Category WHERE type = 'business'
   ```

6. **Timezone:** Load from `platform.json` and Business table
   ```json
   { "location": { "timezone": "Australia/Sydney" } }
   ```

### What MUST NOT Be Hardcoded

❌ **Incorrect Approach:**

1. **Hardcoded Suburb Names:**
   ```typescript
   // ❌ BAD
   const title = "Discover Guildford South";

   // ✅ GOOD
   const config = getPlatformConfig();
   const title = t('homepage.hero.title', { location: config.location.name });
   ```

2. **Hardcoded Coordinates:**
   ```typescript
   // ❌ BAD
   const center = { lat: -33.9366, lng: 150.6966 };

   // ✅ GOOD
   const config = getPlatformConfig();
   const center = config.location.coordinates;
   ```

3. **Hardcoded Category Names:**
   ```typescript
   // ❌ BAD
   const categories = ["Restaurants", "Cafes", "Groceries"];

   // ✅ GOOD
   const categories = await prisma.category.findMany({ where: { type: 'business' } });
   ```

4. **Hardcoded Search Defaults:**
   ```typescript
   // ❌ BAD
   const defaultRadius = 5;

   // ✅ GOOD
   const config = getPlatformConfig();
   const defaultRadius = config.search.defaultRadius;
   ```

### Configuration Access Pattern

```typescript
// Backend: load config once at startup
import { getPlatformConfig } from '@community-hub/shared';
const config = getPlatformConfig();

// Use in routes
app.get('/search/businesses', (req, res) => {
  const maxRadius = config.search.maxRadius;
  const defaultRadius = config.search.defaultRadius;

  // Validate distance param
  if (req.query.distance > maxRadius) {
    return sendError(res, 'INVALID_DISTANCE', `Max radius is ${maxRadius}km`, 400);
  }
});
```

```typescript
// Frontend: load config via API or context
import { usePlatformConfig } from '../contexts/ConfigContext';

function HomePage() {
  const config = usePlatformConfig();

  return (
    <Hero
      backgroundImage={config.homepage.hero.backgroundImage}
      title={t('homepage.hero.title', { location: config.location.name })}
    />
  );
}
```

---

## COMPLETION CRITERIA

Phase 5 is considered complete when:

### 1. API Endpoints (4/4 complete)

- ✅ `GET /api/v1/search/businesses` - Full-text search with filters/sorts
- ✅ `GET /api/v1/search/events` - Event search (stub for Phase 8)
- ✅ `GET /api/v1/search/suggestions` - Autocomplete suggestions
- ✅ `GET /api/v1/search/all` - Combined search across all content types

### 2. Search Features (7/7 complete)

- ✅ Full-text search with relevance scoring
- ✅ Autocomplete with debouncing
- ✅ Recent searches (authenticated users, Redis)
- ✅ Popular searches (all users, 7-day window)
- ✅ Search result highlighting
- ✅ No results state
- ✅ Result count display

### 3. Filters (11/11 complete)

- ✅ Category filter (multi-select)
- ✅ Distance/radius filter (geo-distance)
- ✅ Open Now toggle (timezone-aware)
- ✅ Languages filter (multi-select)
- ✅ Price range filter
- ✅ Rating filter (3+, 4+, 4.5+)
- ✅ Certifications filter
- ✅ Accessibility filter
- ✅ Has promotions toggle
- ✅ Has events toggle
- ✅ Verified only toggle

### 4. Sort Options (7/7 complete)

- ✅ Relevance (ES `_score`)
- ✅ Distance (geo-distance ASC)
- ✅ Rating (rating DESC)
- ✅ Most reviewed (reviewCount DESC)
- ✅ Recently updated (updatedAt DESC)
- ✅ Alphabetical (name ASC)
- ✅ Newest first (createdAt DESC)

### 5. Homepage Discovery (8/8 sections)

- ✅ Hero section with search bar
- ✅ Featured businesses carousel
- ✅ Near You section
- ✅ New businesses section
- ✅ Highly rated section
- ✅ Current offers section
- ✅ Upcoming events preview
- ✅ Category grid

### 6. Testing (>100 tests passing)

- ✅ Unit tests: >20 search service tests
- ✅ Unit tests: >15 query builder tests
- ✅ Component tests: >20 SearchBar tests
- ✅ Component tests: >25 FilterPanel tests
- ✅ Component tests: >15 SearchResultsPage tests
- ✅ Integration tests: >10 full-flow tests
- ✅ E2E tests: >5 user journey tests
- ✅ Coverage: >80% overall

### 7. Accessibility (WCAG 2.1 AA)

- ✅ Zero jest-axe violations across all components
- ✅ Keyboard navigation functional (Tab, Arrow keys, Enter, Escape)
- ✅ Screen reader announcements (aria-live, aria-label)
- ✅ Focus indicators visible (3:1 contrast)
- ✅ Touch targets ≥44px
- ✅ Color contrast ≥4.5:1 (text), ≥3:1 (UI)

### 8. Internationalization (10 languages)

- ✅ All UI strings translated (search.json in 10 locales)
- ✅ RTL layout support (Arabic, Urdu)
- ✅ Category names multilingual (from database)
- ✅ Business descriptions multilingual

### 9. Performance

- ✅ Search endpoint <200ms (p95)
- ✅ Homepage load <3s on 3G
- ✅ Lighthouse score >80

### 10. Security

- ✅ Rate limiting (30 req/min for search)
- ✅ Input validation (all query params)
- ✅ Input sanitization (strip HTML, escape special chars)
- ✅ CSRF protection (inherited from Phase 1)
- ✅ No SQL/ES injection vulnerabilities

### 11. Documentation

- ✅ API documentation (OpenAPI/Swagger)
- ✅ Component README (usage examples)
- ✅ Configuration guide (platform.json options)
- ✅ Deployment guide (Elasticsearch setup)

### 12. QA Review

- ✅ Security review passing (no critical/high vulnerabilities)
- ✅ Accessibility audit passing (manual + automated)
- ✅ Code review approved (2+ reviewers)
- ✅ No `any` types in TypeScript
- ✅ No console.log statements (use logger)

---

## FILES TO CREATE/MODIFY

### Backend Files

**New Files:**

1. `packages/backend/src/routes/search.ts` - Search API routes
2. `packages/backend/src/services/search-service.ts` - Business logic for search
3. `packages/backend/src/search/query-builder.ts` - Elasticsearch query builder
4. `packages/backend/src/search/indexing-service.ts` - Document indexing sync
5. `packages/backend/src/utils/recent-searches.ts` - Redis operations for recent searches
6. `packages/backend/src/utils/popular-searches.ts` - Popular searches calculation

**Modified Files:**

1. `packages/backend/src/routes/index.ts` - Register search routes
2. `packages/backend/src/search/index-manager.ts` - Add field weighting, synonyms
3. `packages/backend/prisma/schema.prisma` - Add featured, displayOrder, timezone to Business

**Test Files:**

1. `packages/backend/src/routes/__tests__/search.test.ts` - Route tests
2. `packages/backend/src/services/__tests__/search-service.test.ts` - Service tests
3. `packages/backend/src/search/__tests__/query-builder.test.ts` - Query builder tests

### Frontend Files

**New Files:**

1. `packages/frontend/src/pages/SearchPage.tsx` - Search results page
2. `packages/frontend/src/pages/HomePage.tsx` - Homepage with discovery sections
3. `packages/frontend/src/components/SearchBar.tsx` - Search input + autocomplete
4. `packages/frontend/src/components/AutocompleteDropdown.tsx` - Autocomplete UI
5. `packages/frontend/src/components/FilterPanel.tsx` - Filter sidebar/modal
6. `packages/frontend/src/components/SearchResults.tsx` - Results grid
7. `packages/frontend/src/components/SortDropdown.tsx` - Sort options
8. `packages/frontend/src/components/ActiveFilterChips.tsx` - Applied filters display
9. `packages/frontend/src/components/HeroSection.tsx` - Homepage hero
10. `packages/frontend/src/components/BusinessCarousel.tsx` - Featured businesses carousel
11. `packages/frontend/src/components/DiscoverySection.tsx` - Reusable section component
12. `packages/frontend/src/components/CategoryGrid.tsx` - Category showcase
13. `packages/frontend/src/hooks/useSearch.ts` - Search state management
14. `packages/frontend/src/hooks/useFilters.ts` - Filter state management
15. `packages/frontend/src/hooks/useAutocomplete.ts` - Autocomplete logic

**Modified Files:**

1. `packages/frontend/src/App.tsx` - Add routes for /search and /
2. `packages/frontend/src/components/Header.tsx` - Integrate SearchBar in header

**Test Files:**

1. `packages/frontend/src/pages/__tests__/SearchPage.test.tsx`
2. `packages/frontend/src/pages/__tests__/HomePage.test.tsx`
3. `packages/frontend/src/components/__tests__/SearchBar.test.tsx`
4. `packages/frontend/src/components/__tests__/FilterPanel.test.tsx`
5. `packages/frontend/src/components/__tests__/SearchResults.test.tsx`

### Shared Files

**New Files:**

1. `packages/shared/src/types/search.ts` - Search request/response types
2. `packages/shared/src/validators/search.ts` - Search validation schemas (Zod)

**Modified Files:**

1. `packages/shared/src/config/platform-schema.ts` - Add search config schema
2. `packages/shared/src/types/business.ts` - Add featured, displayOrder, timezone fields

### Configuration Files

**Modified Files:**

1. `config/platform.json` - Add search and homepage config
2. `.env.example` - Add Elasticsearch env vars
3. `TODO.md` - Mark Phase 5 tasks complete
4. `PROGRESS.md` - Update Phase 5 status

**New Migration:**

1. `packages/backend/prisma/migrations/YYYYMMDDHHMMSS_add_search_fields/migration.sql`

---

## RELATED SPECIFICATIONS

### Primary References

- **Spec §14:** Search & Discovery (full section)
  - §14.1: Search Functionality
  - §14.2: Filters (11 types)
  - §14.3: Sort Options (7 types)
  - §14.4: Homepage Discovery (8 sections)

### Supporting References

- **Spec §3.6:** Accessibility Requirements (WCAG 2.1 AA)
- **Spec §4.3:** Privacy & Data Protection (Australian Privacy Principles)
- **Spec §4.8:** Rate Limiting (30 req/min for search)
- **Spec §7:** Design Specifications (UI components, responsive breakpoints)
- **Spec §8:** Multilingual Support (10 languages, RTL)
- **Appendix A.1:** Business Data Model (all fields)
- **Appendix A.14:** Category Data Model
- **Appendix B.5:** Search API Endpoints (4 endpoints)
- **Appendix C:** Glossary (terms: fuzzy matching, geo-distance, relevance scoring)

### Related Phase Documentation

- Phase 1: Foundation (Elasticsearch setup, Redis, middleware)
- Phase 2: Authentication (user context for recent searches)
- Phase 3: Design System (UI components)
- Phase 4: Business Directory (business entity, API structure)
- Phase 6: User Engagement (reviews for rating aggregation)
- Phase 8: Events System (event search, homepage preview)
- Phase 10: Deals Hub (promotions filter, offers section)

---

## NEXT ACTIONS

### Immediate Next Steps

1. **Review this study document** with stakeholders
2. **Confirm priorities** for Phase 5 (all 34 tasks or MVP subset?)
3. **Create git branch** `feature/phase-5-search-and-discovery`
4. **Apply database migration** (add featured, displayOrder, timezone fields)
5. **Start with backend infrastructure:**
   - Configure Elasticsearch field weighting
   - Implement document indexing sync
   - Build query builder utility
6. **Then build search API:**
   - Create /search/businesses endpoint
   - Create /search/suggestions endpoint
7. **Then build frontend:**
   - SearchBar component
   - FilterPanel component
   - SearchResultsPage
   - HomePage with discovery sections
8. **Write comprehensive tests** (>100 tests)
9. **QA review** (security, accessibility, performance)
10. **Merge to main** and mark Phase 5 complete

### Estimated Timeline

**Note:** No time estimates provided per instructions. Focus on completing tasks in order.

### Success Metrics

- All 34 core tasks complete
- >100 tests passing (>80% coverage)
- Zero WCAG violations
- <200ms p95 search response time
- <3s homepage load on 3G
- 100/100 security score (no critical/high vulnerabilities)

---

## CONCLUSION

Phase 5 (Search & Discovery) is **ready for implementation**. All dependencies are met, infrastructure is in place, and requirements are well-defined. This phase is critical for MVP 2 (Search & User Engagement) and provides the foundation for user acquisition and business discoverability.

**Key Takeaways:**

1. **Infrastructure Ready:** Elasticsearch, Redis, middleware all configured
2. **Well-Specified:** 34 tasks with clear acceptance criteria
3. **Location-Agnostic:** Configuration system prevents hardcoded values
4. **Accessible & Multilingual:** WCAG 2.1 AA + 10 languages + RTL
5. **Testable:** >100 tests planned for comprehensive coverage
6. **Performant:** <200ms search, <3s homepage load targets

**Blocker to Address:**
- Add `timezone` field to Business table (migration required)

**Optional Enhancements (defer to later):**
- Review aggregation (Phase 6) for accurate ratings
- Events search (Phase 8 full implementation)
- Deals integration (Phase 10 full implementation)

This study document should serve as the authoritative reference for all Phase 5 implementation work.

---

**Study Completed:** March 1, 2026
**Agent ID:** a9bac6d (for resuming research if needed)
**Document Version:** 1.0