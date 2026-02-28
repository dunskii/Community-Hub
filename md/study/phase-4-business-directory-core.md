# PHASE 4 RESEARCH: BUSINESS DIRECTORY CORE - COMPREHENSIVE STUDY

## Executive Summary

Phase 4 (Business Directory Core) is the first major feature phase following successful completion of Phases 1-3 (Foundation, Authentication, Design System). This phase establishes the core business directory functionality that serves as the foundation for all downstream features (search, reviews, messaging, events, deals, etc.).

**Phase Scope:** 39 tasks across 4 major sections
**Dependency:** Phases 1-3 complete (✅ achieved)
**Status:** Ready to start
**Timeline:** Target completion by end of February 2026

---

## 1. OVERVIEW & PURPOSE

### 1.1 Strategic Importance

Phase 4 is **critical path** for the project:
- Establishes the Business entity (most complex data model in the platform)
- Enables Phases 5-10 (Search, Reviews, Messaging, Events, Deals all depend on Business)
- Creates the primary user-facing feature (business directory)
- Foundation for Business Owner features (Phase 7)
- Required for Search & Discovery (Phase 5)

### 1.2 Phase Goals

1. **Data Models:** Implement complete Business entity with all relationships
2. **API Layer:** 7 core business endpoints (CRUD + categories)
3. **Frontend Pages:** Business listing and profile pages
4. **User Features:** Browse, view, search (basic - advanced search in Phase 5)
5. **SEO Foundation:** Metadata, structured data, URL slugs

### 1.3 Success Criteria

- All 39 tasks completed
- 100% test coverage (>80% threshold)
- WCAG 2.1 AA compliance on all UI components
- Zero hardcoded location data (all from platform.json)
- All endpoints documented with examples
- Businesses displayable with all required information

---

## 2. SPECIFICATION REFERENCES

### 2.1 Primary Specification Sections

| Section | Title | Focus |
|---------|-------|-------|
| **§11** | Business Profile Features | Business data, media, hours, social, languages, certifications |
| **§14** | Search & Discovery | Search functionality, filters, sort (implementation in Phase 5) |
| **§4.5** | Security Headers | Required for all endpoints |
| **§3.6** | Accessibility (WCAG 2.1 AA) | Keyboard nav, screen readers, color contrast, alt text |
| **§8** | Multilingual Support | 10 languages, RTL for Arabic/Urdu |
| **§2.4** | SEO Configuration | Meta tags, structured data, slugs |

### 2.2 Appendix References

| Appendix | Content | Details |
|----------|---------|---------|
| **A.1** | Business Data Model | Complete field list, relationships, enums |
| **A.14** | Category Model | Hierarchical taxonomy with parent_id |
| **B.2** | Business Endpoints | 18 endpoints (CRUD + analytics + emergency status + follow) |
| **B.16** | Category Endpoints | 4 endpoints (list, get, create, update, delete) |

---

## 3. COMPLETE DATA MODELS

### 3.1 Business Model (Spec A.1)

```prisma
Business {
  id: UUID                          // Primary key
  name: String                      // Required, max 100 chars
  slug: String                      // SEO-friendly URL slug (from name)
  description: Text                 // Required, max 2000 chars, multilingual

  // Categories
  categoryPrimary: Reference → Category   // Required
  categoriesSecondary: [Category]         // Optional, max 3

  // Location
  address: Address                  // Embedded object
    - street: String
    - suburb: String
    - state: String
    - postcode: String (4 digits, validation: AU postcodes)
    - country: String
    - latitude: Float
    - longitude: Float

  // Contact
  phone: String                     // Required, Australian format validation
  email: String                     // Optional
  website: URL                      // Optional
  secondaryPhone: String            // Optional

  // Hours
  hours: OperatingHours            // Embedded (see 3.2)

  // Media
  logo: Image                       // Square 400x400px, 2MB max
  coverPhoto: Image                 // Landscape 1200x400px, 5MB max
  gallery: [Image]                  // Max 50 photos, 5MB each

  // Social & Online
  socialLinks: SocialLinks          // Facebook, Instagram, Twitter, LinkedIn, TikTok, YouTube

  // Business Info
  languagesSpoken: [String]         // From platform.json supported languages
  certifications: [String]          // Halal, Kosher, Vegan, Vegetarian, Organic
  paymentMethods: [String]          // Cash, Card, EFTPOS, PayPal, etc.
  accessibilityFeatures: [String]   // Wheelchair, hearing loop, accessible bathroom

  // Optional Fields
  priceRange: Enum (budget, moderate, premium, luxury)
  parkingInformation: String        // Street, dedicated lot, none, paid nearby
  yearEstablished: Integer          // YYYY format

  // Status & Ownership
  status: Enum (active, pending, suspended)  // Default: pending (admin approval)
  claimed: Boolean                           // Default: false
  claimedBy: Reference → User (optional)     // Business owner
  verifiedAt: DateTime (optional)            // When claim was approved

  // Timestamps
  createdAt: DateTime
  updatedAt: DateTime
}
```

**Validations Required:**
- Phone number: Australian format (+61 or 02-type)
- Postcode: 4 digits, must be in platform.json postcodeRange or validate against real AU postcodes
- Email: Valid email format
- Website: Valid URL format
- Coordinates: Valid lat/long (lat: -90 to 90, long: -180 to 180)
- Logo dimensions: 400x400px minimum
- Cover photo dimensions: 1200x400px minimum
- Gallery photos: 50 max, 5MB max each

### 3.2 OperatingHours Model

```prisma
OperatingHours {
  // Regular hours (one entry per business)
  monday: DayHours
  tuesday: DayHours
  wednesday: DayHours
  thursday: DayHours
  friday: DayHours
  saturday: DayHours
  sunday: DayHours
  publicHolidays: DayHours

  // Special circumstances
  specialNotes: String              // "Closed for renovations", etc.
}

DayHours {
  open: Time                        // HH:MM format, e.g. "09:00"
  close: Time                       // HH:MM format, e.g. "17:00"
  closed: Boolean                   // Day is completely closed
  byAppointment: Boolean            // Open by appointment only
}
```

**Special Hours (separate table/array):**
- Holiday hours: date + DayHours (Christmas, Easter, etc.)
- Temporary closure: date range + reason
- Special event hours: date + DayHours (extended hours)

**Display Logic:**
- Show "Open Now" or "Closed" based on current time + business timezone (from platform.json)
- Display next opening time if currently closed
- Show countdown to closing if closing within 1 hour
- Highlight modified hours with visual indicator

### 3.3 Address Model (Embedded Object)

```prisma
Address {
  street: String                    // Required
  suburb: String                    // Auto-filled from address lookup
  state: String                     // Default: "NSW"
  postcode: String                  // 4 digits, validated
  country: String                   // Default: "Australia"
  latitude: Float                   // From geocoding
  longitude: Float                  // From geocoding
}
```

**Location-Agnostic Considerations:**
- Do NOT hardcode "Guildford", "Sydney", "NSW"
- All default values come from platform.json:
  - `location.state` → "NSW" (but this is config-driven)
  - `location.postcode` → "2161" (but validate against range)
  - `location.coordinates` → Default center point for map
  - `location.timezone` → For "Open Now" calculation

### 3.4 SocialLinks Model (Embedded Object)

```prisma
SocialLinks {
  facebook: URL                     // facebook.com/{page}
  instagram: URL                    // @username or instagram.com/{username}
  twitter: URL                      // @username or twitter.com/{username}
  tiktok: URL                       // @username or tiktok.com/@{username}
  linkedin: URL                     // linkedin.com/company/{page}
  youtube: URL                      // youtube.com/{channel}
  googleBusiness: URL               // Auto-linked if claimed via Google
}
```

### 3.5 Category Model (Already exists - Spec A.14)

```prisma
// ALREADY IMPLEMENTED IN PHASE 1 - Verify exists:
Category {
  id: UUID
  type: CategoryType                // BUSINESS (for Phase 4)
  name: Json                        // Multilingual: {"en": "Restaurant", "ar": "..."}
  slug: String
  icon: String
  parentId: String (optional)       // For hierarchical categories
  parent: Category (optional)
  children: Category[]
  displayOrder: Int
  active: Boolean
  createdAt: DateTime
  updatedAt: DateTime
}
```

**Hierarchical Structure Example:**
```
Food & Beverage (parent)
├── Restaurants
├── Cafes
├── Bakeries
└── Fast Food

Retail (parent)
├── Clothing
├── Electronics
└── Groceries
```

---

## 4. ALL API ENDPOINTS (Spec B.2)

### 4.1 Business CRUD Endpoints

#### GET /businesses (List)
```
Query Parameters:
  - page: number (default 1)
  - limit: number (default 20, max 100)
  - category: string (filter by primary category slug)
  - sort: string (default: -created_at)
  - open_now: boolean (filter currently open)
  - status: string (active|pending|suspended)

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Business Name",
      "slug": "business-name",
      "category": { "id": "uuid", "name": "Restaurant" },
      "address": { "suburb": "Guildford", "postcode": "2161" },
      "logo": "/uploads/businesses/logo.webp",
      "status": "active",
      "createdAt": "2026-02-01T10:00:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 156, "totalPages": 8 }
}

Authorization: Public
```

#### GET /businesses/:id (Detail)
```
Path Parameters:
  - id: UUID (business ID)

Query Parameters:
  - fields: string (sparse fieldsets, e.g. "name,category,phone")

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Business Name",
    "slug": "business-name",
    "description": "...",
    "categoryPrimary": { "id": "uuid", "name": "Restaurant" },
    "categoriesSecondary": [...],
    "address": {
      "street": "123 Main St",
      "suburb": "Guildford",
      "postcode": "2161",
      "latitude": -33.8567,
      "longitude": 150.9876
    },
    "phone": "02 9999 9999",
    "email": "hello@business.com.au",
    "website": "https://business.com.au",
    "hours": {
      "monday": { "open": "09:00", "close": "17:00", "closed": false },
      ...
    },
    "logo": "/uploads/businesses/logo.webp",
    "coverPhoto": "/uploads/businesses/cover.webp",
    "gallery": [
      { "url": "/uploads/businesses/photo1.webp", "alt": "Interior", "category": "interior" },
      ...
    ],
    "socialLinks": {
      "facebook": "facebook.com/business",
      "instagram": "@business"
    },
    "languagesSpoken": ["en", "ar", "zh-CN"],
    "certifications": ["halal", "vegetarian"],
    "paymentMethods": ["cash", "card", "paypal"],
    "accessibilityFeatures": ["wheelchair_access", "accessible_bathroom"],
    "priceRange": "moderate",
    "parkingInformation": "dedicated lot",
    "yearEstablished": 2010,
    "status": "active",
    "claimed": true,
    "claimedBy": { "id": "uuid", "displayName": "John Doe" },
    "verifiedAt": "2026-01-15T10:00:00Z",
    "createdAt": "2026-01-01T10:00:00Z",
    "updatedAt": "2026-02-01T10:00:00Z"
  }
}

Authorization: Public
```

#### POST /businesses (Create - Admin)
```
Request Body:
{
  "name": "Business Name",
  "description": "...",
  "categoryPrimary": "uuid",
  "categoriesSecondary": ["uuid"],
  "address": {
    "street": "123 Main St",
    "suburb": "Guildford",
    "postcode": "2161"
  },
  "phone": "02 9999 9999",
  "email": "hello@business.com.au",
  "website": "https://business.com.au",
  "hours": {...},
  "logo": "uuid (from file upload)",
  "coverPhoto": "uuid (from file upload)",
  "languagesSpoken": ["en"],
  "certifications": [],
  "paymentMethods": ["card"],
  "accessibilityFeatures": [],
  "priceRange": "moderate",
  "yearEstablished": 2010
}

Response: 201 Created - Same as GET /businesses/:id

Authorization: Admin only
Rate Limiting: 1 request per minute (create is expensive)
Validation:
  - Required fields: name, description, categoryPrimary, phone, address
  - Phone: Australian format
  - Postcode: 4 digits, validate AU format
  - Email/Website: Valid format if provided
  - Coordinates: Auto-geocoded from address (Phase 1.7 geocoding service)
```

#### PUT /businesses/:id (Update)
```
Path Parameters:
  - id: UUID

Request Body:
{
  "name": "...",
  "description": "...",
  "categoryPrimary": "uuid",
  // All other fields...
}

Response: 200 OK - Same as GET /businesses/:id

Authorization: Business Owner (must own the business) OR Admin
Rate Limiting: 5 requests per minute per business
Validation:
  - Same as POST
  - Prevent changing `claimed`, `claimedBy`, `status` (owners can't change these)
  - Status changes only via admin (separate endpoint in Phase 7)
Audit Trail:
  - Log all changes to AuditLog for compliance
```

#### DELETE /businesses/:id (Delete - Admin)
```
Path Parameters:
  - id: UUID

Response: 204 No Content

Authorization: Admin only
Rate Limiting: 1 request per minute
Side Effects:
  - Mark as DELETED in status enum (soft delete, not hard delete)
  - DO NOT actually delete (audit trail requirement)
  - Remove from search index (Elasticsearch)
```

### 4.2 Category Endpoints

#### GET /categories (List All)
```
Query Parameters:
  - type: string (BUSINESS|EVENT|DEAL|NOTICE|GROUP, filter by type)
  - parent: string (filter by parent category ID)
  - active: boolean (default: true)

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "BUSINESS",
      "name": "Restaurant",
      "slug": "restaurant",
      "icon": "restaurant",
      "parentId": null,
      "displayOrder": 1,
      "active": true
    }
  ]
}

Authorization: Public
```

#### GET /categories/:id/businesses (Businesses by Category)
```
Path Parameters:
  - id: UUID (category ID)

Query Parameters:
  - page: number (default 1)
  - limit: number (default 20, max 100)
  - sort: string

Response:
{
  "success": true,
  "data": [
    // Business list (same as GET /businesses)
  ],
  "pagination": {...}
}

Authorization: Public
```

### 4.3 Additional Business Endpoints (Not Phase 4, but defined in Spec B.2)

These are listed for context but **not implemented in Phase 4**:

| Endpoint | Phase | Details |
|----------|-------|---------|
| POST /businesses/:id/claim | Phase 7 | Business owner claim verification |
| GET /businesses/:id/analytics | Phase 7 | Business owner dashboard analytics |
| GET /businesses/:id/reviews | Phase 6 | Review listing (see Phase 6) |
| GET /businesses/:id/events | Phase 8 | Event listing |
| GET /businesses/:id/deals | Phase 10 | Deals listing |
| GET /businesses/:id/inbox | Phase 9 | Business messaging inbox |
| GET /businesses/:id/emergency-status | Phase 14 | Emergency alert status |
| PUT /businesses/:id/emergency-status | Phase 14 | Update emergency status |
| POST /businesses/:id/follow | Phase 6 | Follow/unfollow business |
| DELETE /businesses/:id/follow | Phase 6 | Unfollow business |

---

## 5. BUSINESS RULES & WORKFLOWS

### 5.1 Business Status Workflow

```
pending → active (admin approval)
   ↓
   ↘ → suspended (abuse/violation)
         ↓
         → active (appeal accepted)
         → deleted (permanently removed)

active → suspended (admin action)
   ↓
   ↘ → active (appeal)
         → deleted

deleted (soft delete - never shown to users, kept for audit)
```

**Initial Status:** `pending` (admin must approve before public visibility)
**Visibility Rules:**
- Only `active` businesses appear in searches/listings
- `pending` visible to owner only
- `suspended` hidden from public
- `deleted` never shown (soft delete)

### 5.2 Business Claim Workflow (Phase 7, documented here for context)

```
Unclaimed Business → Claim Request (owner submits proof)
                  → Pending Review (moderator checks proof)
                  → Approved (claimed = true, claimedBy = owner)
                  → Owner can now edit business

Claimed Business → Ownership Change Request (existing owner transfers)
                → Moderator approves → Updates claimedBy
```

**Proof Methods (Phase 7):**
- Phone verification (call business with code)
- Email verification (send code to business email)
- Document upload (business registration, utility bill)
- Google Business Profile verification

### 5.3 "Open Now" Calculation

**Requirements:**
1. Use business timezone from platform.json (`location.timezone`)
2. Get current time in that timezone
3. Check if today's day matches `hours[day]`
4. Check if current time is between `open` and `close`
5. Check for special hours (override normal hours)

**Logic Pseudocode:**
```javascript
function isOpenNow(business) {
  const timezone = platformConfig.location.timezone; // "Australia/Sydney"
  const now = new Date(); // UTC
  const businessTime = convertToTimezone(now, timezone);
  const dayKey = getDayOfWeek(businessTime); // "monday", "tuesday", etc.

  // Check special hours first
  const specialHours = business.hours.special?.[businessTime.toDateString()];
  if (specialHours) {
    return isWithinTimeRange(businessTime, specialHours);
  }

  // Check regular hours
  const dayHours = business.hours[dayKey];
  if (dayHours.closed) return false;
  if (dayHours.byAppointment) return null; // "By appointment only"

  return isWithinTimeRange(businessTime, dayHours);
}
```

### 5.4 Media Upload Validation

**Logo Requirements:**
- Format: PNG, JPG, JPEG, WebP
- Minimum size: 200x200px
- Maximum size: 2MB
- Aspect ratio: 1:1 (square)
- Processing: Convert to WebP, resize to 400x400px, strip EXIF

**Cover Photo Requirements:**
- Format: PNG, JPG, JPEG, WebP
- Minimum size: 1200x400px
- Maximum size: 5MB
- Aspect ratio: 3:1 recommended
- Processing: Convert to WebP, resize to 1200x400px, strip EXIF

**Photo Gallery Requirements:**
- Maximum photos: 50 per business
- Format: PNG, JPG, JPEG, WebP
- Maximum size: 5MB per image
- Categories: Interior, Exterior, Products, Menu, Team, Events
- Alt text: Required, max 200 chars
- Processing: Convert to WebP, generate thumbnails (400px, 800px)

**Validation Location:**
- Backend: `/packages/backend/src/middleware/file-upload.ts` (already exists)
- Use Sharp library (already imported Phase 1.3)
- Implement `validateBusinessImage()` function
- Store in `/uploads/businesses/{businessId}/` structure

### 5.5 Multilingual Description Handling

**Database Storage:**
- Store description as multilingual JSON object (like Category.name)
- Example: `{ "en": "We serve pizza and pasta", "ar": "نحن نقدم البيتزا والمعكرونة" }`
- Default: Always provide English version
- For other languages: Professional translation (Phase 18) or auto-translation

**API Behavior:**
- `POST /businesses`: Accept `description` as string or JSON object
- Store as JSON internally
- `GET /businesses/:id`: Return full JSON object OR specific language based on `Accept-Language` header
- Frontend uses `useLanguage()` hook to read correct language

**Validation:**
- Max 2000 characters per language
- No HTML (sanitize with DOMPurify if needed)

---

## 6. ARCHITECTURE & DEPENDENCIES

### 6.1 How Phase 4 Builds on Phases 1-3

| Phase | Contribution | Used in Phase 4 |
|-------|-------------|-----------------|
| **Phase 1** | Foundation infrastructure | Database, API, middleware, config system |
| Phase 1.3 | Backend APIs, Prisma, Express | All business endpoints |
| Phase 1.4 | Frontend infrastructure, Tailwind | Business components, pages |
| Phase 1.5 | Security (auth, CSRF, rate limiting) | All endpoints secured |
| Phase 1.6 | Email service | Notification on business changes (Phase 7) |
| Phase 1.7 | Maps, geocoding | Address → coordinates conversion |
| Phase 1.8 | Internationalization | Business descriptions in 10 languages |
| **Phase 2** | Authentication & user system | User ownership, business owner role |
| Phase 2 Auth | JWT, HttpOnly cookies | Secure business owner endpoints |
| Phase 2 User | User model, roles | Business owner identification |
| **Phase 3** | 31 UI components (design system) | Use existing components (Input, Select, Modal, etc.) |
| Phase 3 Forms | Form components (Input, Textarea, etc.) | Business creation/edit forms |
| Phase 3 Display | Cards, Pagination, Tabs, Carousel | Business cards, gallery, profile tabs |
| Phase 3 Layout | Header, Footer, Grid, PageContainer | Business profile layout |

### 6.2 Database Schema Changes Required

**New Models to Create:**
- None! Business model architecture fits with existing Category model

**Existing Models to Extend:**
1. **Category model** - Already exists (Phase 1.3)
   - Verify `type: BUSINESS` category type exists
   - Seed 20-30 business categories (Restaurant, Cafe, Retail, Services, etc.)

2. **User model** - Extend relationships
   - Add inverse relationship: `ownedBusinesses: Business[]`
   - Already has `businessOwner` role and `email_verified` field

3. **Create Migration:**
   - Add Business table with all fields
   - Create indexes: `(status, created_at)`, `(category_primary_id)`, `(slug)`

**Migration Checklist:**
- [ ] Create Prisma migration: `npx prisma migrate dev --name add_business_model`
- [ ] Seed business categories (20-30 types)
- [ ] Verify relationships: Business → Category, Business → User
- [ ] Create indexes for performance
- [ ] Test migration up/down cycle

### 6.3 Elasticsearch Integration

**Index Configuration (Already exists from Phase 1.3):**
- Index name: `businesses`
- Document type: `_doc` (Elasticsearch 7+)

**Index Mapping for Phase 4:**
```json
{
  "mappings": {
    "properties": {
      "id": { "type": "keyword" },
      "name": {
        "type": "text",
        "analyzer": "multilingual",
        "fields": { "keyword": { "type": "keyword" } }
      },
      "description": { "type": "text", "analyzer": "multilingual" },
      "category_primary": { "type": "keyword" },
      "categories_secondary": { "type": "keyword" },
      "suburb": { "type": "keyword" },
      "postcode": { "type": "keyword" },
      "location": { "type": "geo_point" },  // { "lat": -33.8567, "lon": 150.9876 }
      "status": { "type": "keyword" },
      "created_at": { "type": "date" },
      "hours_open_now": { "type": "boolean" }  // Calculated field
    }
  }
}
```

**Sync Strategy:**
- Index business on creation (POST /businesses)
- Update index on business edit (PUT /businesses/:id)
- Remove from index on delete (DELETE /businesses/:id)
- Build reindex job for Phase 5 (admin tool)

### 6.4 Mapbox Integration (Existing - Phase 1.7)

**Already Implemented:**
- Geocoding service at `/packages/backend/src/services/geocoding.ts`
- `POST /api/v1/geocode` endpoint
- 30-day Redis cache for addresses
- Direct use in Phase 4: Convert address → coordinates on business save

**Phase 4 Usage:**
```typescript
// In business creation/update service
const address = req.body.address;
const { latitude, longitude } = await geocodingService.geocode(address);
business.address.latitude = latitude;
business.address.longitude = longitude;
```

### 6.5 File Upload Integration (Existing - Phase 1.3)

**Already Implemented:**
- Multer middleware: `/packages/backend/src/middleware/file-upload.ts`
- Sharp image processing
- Local storage at `./uploads/`

**Phase 4 Media Endpoints:**
- Need to implement: `POST /businesses/:id/logo` (upload logo)
- Need to implement: `POST /businesses/:id/cover` (upload cover photo)
- Need to implement: `POST /businesses/:id/gallery` (upload gallery photos)

**Storage Structure:**
```
./uploads/
├── businesses/
│   ├── {businessId}/
│   │   ├── logo/
│   │   │   ├── original.webp
│   │   │   └── thumb.webp
│   │   ├── cover/
│   │   │   ├── original.webp
│   │   │   └── thumb.webp
│   │   └── gallery/
│   │       ├── {photoId}.webp
│   │       └── {photoId}-thumb.webp
│   └── {businessId2}/
└── profiles/  # (Phase 2 user photos)
```

---

## 7. LOCATION-AGNOSTIC REQUIREMENTS

### 7.1 Configuration System (3-Tier)

**Tier 1: `.env` (Secrets - Never commit)**
- Database credentials
- API keys (Mapbox, Mailgun, Firebase)
- Session secrets
- No location data here

**Tier 2: `config/platform.json` (Configuration - EDIT for new suburbs)**
- `location.suburbName`: "Guildford"
- `location.region`: "Guildford South"
- `location.postcode`: "2161"
- `location.postcodeRange`: ["2161", "2162"]
- `location.coordinates`: Default map center
- `location.timezone`: "Australia/Sydney"
- `location.defaultSearchRadiusKm`: 5
- `branding.colors`, `branding.platformName`, etc.
- `seo.defaultTitle`, `seo.defaultKeywords`

**Tier 3: Database (Runtime)**
- Categories (editable in admin)
- System settings
- User-generated content (businesses, reviews, etc.)

### 7.2 Zero-Hardcoding Rules for Phase 4

**FORBIDDEN - Will cause deployment issues:**
```typescript
// ❌ WRONG - Hardcoded location
const suburbFilter = "Guildford";

// ❌ WRONG - Hardcoded postcode
if (business.postcode === "2161") { ... }

// ❌ WRONG - Hardcoded timezone for "Open Now"
const businessTime = moment().tz('Australia/Sydney');

// ❌ WRONG - Hardcoded platform name
const title = "Guildford Community Hub";

// ❌ WRONG - Hardcoded search radius
const maxRadius = 20; // km
```

**REQUIRED - Use configuration:**
```typescript
// ✅ CORRECT - Read from platform config
import { getPlatformConfig } from '@community-hub/shared';
const config = getPlatformConfig();

// Business suburb validation
const allowedPostcodes = config.location.postcodeRange;
if (!allowedPostcodes.includes(business.postcode)) {
  throw new Error('Business postcode outside configured range');
}

// Timezone for "Open Now"
const timezone = config.location.timezone;
const businessTime = convertToTimezone(now, timezone);

// Default search radius
const defaultRadius = config.location.defaultSearchRadiusKm; // 5 km

// Platform branding
const platformName = config.branding.platformName; // "Guildford Community Hub"
const title = `${business.name} | ${platformName}`;
```

### 7.3 Category System Flexibility

**Categories must be admin-editable** (data-driven, not code-driven):
- Default categories seeded in migration
- `GET /categories?type=BUSINESS` returns all business categories
- `POST /categories` allows admin to add new categories
- Categories have multilingual names: `{ "en": "Restaurant", "ar": "مطعم" }`

**Example Seed Data (Guildford):**
```
Restaurant
├── Italian
├── Chinese
└── Thai

Retail
├── Clothing
├── Books
└── Electronics

Services
├── Haircut/Salon
├── Legal
└── Accounting
```

**For new suburb (just edit config, not code):**
- Same category structure applies (Restaurant, Retail, Services, etc.)
- Category names are multilingual (no hardcoding)
- Different suburbs may have different categories, but structure is identical

---

## 8. INTERNATIONALIZATION & ACCESSIBILITY

### 8.1 i18n Requirements (Spec §8, Phase 1.8 Complete)

**Already Implemented:**
- react-i18next with 10 languages (en, ar, zh-CN, zh-TW, vi, hi, ur, ko, el, it)
- Language detection: URL → localStorage → browser → default
- RTL support for Arabic/Urdu
- `useLanguage()` hook available

**Phase 4 i18n Needs:**

| Key | Usage | Example |
|-----|-------|---------|
| `business.label` | Form label | "Business Name" |
| `business.description` | Form label | "Description" |
| `business.hours` | Section title | "Operating Hours" |
| `business.category` | Form label | "Category" |
| `business.phone` | Form label | "Phone Number" |
| `business.email` | Form label | "Email Address" |
| `business.website` | Form label | "Website" |
| `business.status` | Enum display | "Active", "Pending", "Suspended" |
| `business.openNow` | Status indicator | "Open Now", "Closed" |
| `business.closed` | Status indicator | "Closed" |
| `business.byAppointment` | Status indicator | "By Appointment Only" |
| `validation.invalidPhone` | Validation error | "Invalid phone number format" |
| `validation.invalidPostcode` | Validation error | "Invalid postcode" |

**Multilingual Database Fields:**
- Business `description` - Stored as JSON
- Category `name` - Already JSON (Phase 1)
- Language: User selects in `useLanguage()`, component reads based on selection

### 8.2 Accessibility (WCAG 2.1 AA) - Phase 3 Components

**Already Compliant (from Phase 3):**
- All form components (Input, Select, Textarea, DatePicker) have proper ARIA
- All display components (Modal, Tabs, Carousel) have keyboard navigation
- Color contrast ≥ 4.5:1 for text, ≥ 3:1 for UI
- Touch targets ≥ 44px on mobile
- Focus indicators visible (2px solid, 2px offset)

**Phase 4-Specific Accessibility:**

1. **Business Listing Page:**
   - Business card component: Focusable, semantic HTML
   - Each card is a link to business profile
   - Proper heading hierarchy (H1 for page title, H2 for card titles)
   - Alt text on all images (logo, cover photo)

2. **Business Profile Page:**
   - Semantic HTML structure
   - Proper heading hierarchy
   - Link to business website has `aria-label="Business website"`
   - Phone number link: `<a href="tel:+61299999999">02 9999 9999</a>`
   - Carousel/gallery: Keyboard nav (arrow keys), screen reader support
   - Map: ARIA label explaining map content

3. **Image Alt Text Rules:**
   - Logo: "Business logo for {businessName}"
   - Cover photo: "{businessName} cover photo"
   - Gallery photos: Use category + description, e.g. "Interior of {businessName}"

4. **Form Validation:**
   - Error messages connected via `aria-describedby`
   - Invalid fields have `aria-invalid="true"`
   - Phone/postcode validation shows specific error (e.g., "Invalid Australian phone format")

**Testing Requirements:**
- Run jest-axe on all business components
- Test keyboard navigation (Tab, Shift+Tab, Enter, Space, Escape)
- Test with screen reader (NVDA, JAWS simulation)
- Test color contrast with WebAIM contrast checker
- Zero jest-axe violations required

---

## 9. SECURITY & PRIVACY REQUIREMENTS

### 9.1 Authentication & Authorization

**Business Owner Endpoints:**
- `PUT /businesses/:id` - Only business owner OR admin
- `POST /businesses/:id/logo` - Only business owner OR admin
- `POST /businesses/:id/cover` - Only business owner OR admin
- `POST /businesses/:id/gallery` - Only business owner OR admin
- `DELETE /businesses/:id/gallery/{photoId}` - Only business owner OR admin

**Implementation:**
```typescript
// Middleware check: requireAuth + ownership verification
router.put('/businesses/:id',
  requireAuth,
  async (req, res, next) => {
    const business = await Business.findById(req.params.id);
    const userId = req.user.id;

    // Allow if: owner of business OR admin
    if (business.claimedBy !== userId && req.user.role !== 'ADMIN') {
      throw new Error('NOT_AUTHORIZED');
    }

    next();
  }
);
```

### 9.2 Input Validation & Sanitization

**Phone Number Validation:**
- Australian format: 02 XXXX XXXX or +61 2 XXXX XXXX
- Use library: `phone` or custom regex
- Test: "02 9999 9999", "+61299999999", "0299999999"

**Postcode Validation:**
- 4 digits only
- Validate against `platform.json.location.postcodeRange`
- Future: Validate against real Australian postcode database

**Email Validation:**
- Standard email regex (from Zod)
- No special validation needed

**Website URL Validation:**
- Standard URL validation (from Zod)
- Ensure HTTPS (warn if HTTP)

**Description Sanitization:**
- No HTML (sanitize with DOMPurify)
- Max 2000 characters
- No malicious scripts

**Address Validation:**
- Required: street, suburb, postcode
- Postcode: Australian format
- Auto-fill suburb from geocoding result (Phase 1.7)

**Implementation Example:**
```typescript
import { z } from 'zod';

const BusinessAddressSchema = z.object({
  street: z.string().min(5).max(255),
  suburb: z.string().min(2).max(100),
  postcode: z.string().regex(/^\d{4}$/, 'Invalid postcode'),
  state: z.string().default('NSW'),
  country: z.string().default('Australia'),
  // Coordinates are added by geocoding service, not from input
});

const BusinessSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().min(10).max(2000),
  categoryPrimary: z.string().uuid(),
  categoriesSecondary: z.array(z.string().uuid()).max(3),
  phone: z.string().regex(/^(\+61|0)[0-9]{9}$/, 'Invalid Australian phone'),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  address: BusinessAddressSchema,
  // ... other fields
});
```

### 9.3 Rate Limiting

**Business Endpoints Rate Limits:**
- `GET /businesses` - 30 requests per minute (search is expensive)
- `POST /businesses` - 1 request per minute (admin only)
- `PUT /businesses/:id` - 5 requests per minute per business
- `DELETE /businesses/:id` - 1 request per minute (admin only)
- `POST /businesses/:id/logo` - 5 requests per minute
- `POST /businesses/:id/gallery` - 5 requests per minute

**Implementation:**
```typescript
// Use existing rate limiters from Phase 1.5
import { apiRateLimiter, createRateLimiter } from '@/middleware/rate-limit';

const businessEditLimiter = createRateLimiter({
  windowMs: 60 * 1000,  // 1 minute
  max: 5,
  keyGenerator: (req) => `${req.user.id}:${req.params.id}` // Per user per business
});

router.put('/businesses/:id', apiRateLimiter, businessEditLimiter, updateBusiness);
```

### 9.4 Audit Logging

**Log All Business Changes:**
- Create business: Log with admin user ID
- Update business: Log who changed what (track field changes)
- Delete business: Log with admin user ID + reason

**Implementation:**
```typescript
// Use existing AuditLog model (Phase 1.3)
async function logBusinessChange(
  actor: User,
  business: Business,
  action: 'create' | 'update' | 'delete',
  changes?: Record<string, any>
) {
  await AuditLog.create({
    actorId: actor.id,
    actorRole: actor.role,
    action: `business.${action}`,
    targetType: 'Business',
    targetId: business.id,
    previousValue: action === 'update' ? oldBusiness : null,
    newValue: business,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });
}
```

### 9.5 Data Protection (Australian Privacy Principles)

**Relevant APP Principles:**
1. **Collection** - Only collect business data necessary for directory
2. **Use** - Use only for display and search (no email scraping)
3. **Disclosure** - Don't share phone/email with third parties
4. **Access** - Business owners can view their own data
5. **Correction** - Business owners can update their data
6. **Security** - Protect from unauthorized access, loss, misuse

**Implementation:**
- All business data (except public fields) encrypted at rest (AES-256)
- Phone numbers visible only to authenticated users (future Phase)
- Email visible only to business owner
- Rate limit message endpoint to prevent enumeration attacks
- Backup encryption (Phase 19)

---

## 10. IMPLEMENTATION ROADMAP

### 10.1 Phase 4 Task Breakdown (39 tasks)

**Section 4.1: Business Data Models (8 tasks)**
1. Create Business Prisma model (with all fields, relationships)
2. Create OperatingHours model/structure
3. Create Address embedded model
4. Create SocialLinks embedded model
5. Verify Category model exists and has BUSINESS type
6. Seed 25+ business categories (multilingual)
7. Create database migration
8. Create business model tests (Prisma validation)

**Section 4.2: Business API Endpoints (7 tasks)**
1. Implement GET /businesses (list with pagination)
2. Implement GET /businesses/:id (detail)
3. Implement POST /businesses (admin creation)
4. Implement PUT /businesses/:id (owner/admin update)
5. Implement DELETE /businesses/:id (soft delete)
6. Implement GET /categories (list categories)
7. Implement GET /categories/:id/businesses (filter by category)
8. Write comprehensive endpoint tests

**Section 4.3: Frontend - Business Listing Page (8 tasks)**
1. Create BusinessCard component (using Phase 3 components)
2. Create BusinessListingPage component with layout
3. Implement pagination (using Phase 3 Pagination component)
4. Implement quick filter chips (category, open now, has deals)
5. Implement sort dropdown (relevance, distance, rating)
6. Implement results count display
7. Implement no results state (using Phase 3 EmptyState)
8. Write comprehensive component tests

**Section 4.4: Frontend - Business Profile Page (10 tasks)**
1. Create BusinessProfile page layout
2. Implement header section (logo, cover, name, category, rating)
3. Implement action buttons (Save, Share, Directions, Call, Message)
4. Create Overview tab with all fields
5. Create Operating Hours component with "Open Now" logic
6. Create Location & Map section (using Mapbox from Phase 1.7)
7. Create Photos tab with gallery (using Phase 3 Carousel)
8. Create navigation tabs (using Phase 3 Tabs component)
9. Implement responsive design (mobile-first)
10. Write comprehensive page tests

**Section 4.5: SEO & Metadata (6 tasks)**
1. Implement dynamic meta title generation
2. Implement dynamic meta description generation
3. Implement Open Graph tags (social sharing)
4. Implement Twitter Card tags
5. Implement canonical URL
6. Implement Schema.org LocalBusiness structured data
7. Create SEO metadata service tests

---

## 11. KEY FILES TO CREATE/MODIFY

### 11.1 Backend Files

**New Files to Create:**

```
packages/backend/src/
├── models/
│   └── business.model.ts           # Business service
├── services/
│   ├── business.service.ts         # CRUD operations, geocoding
│   ├── operating-hours.service.ts  # "Open Now" logic
│   └── seo.service.ts              # SEO metadata generation
├── controllers/
│   └── business.controller.ts      # Request handlers
├── routes/
│   └── business.routes.ts          # Route definitions
├── validators/
│   └── business.validator.ts       # Zod schemas
├── middleware/
│   └── business-ownership.ts       # Authorization checks
├── tests/
│   ├── models/business.model.test.ts
│   ├── services/business.service.test.ts
│   ├── services/operating-hours.service.test.ts
│   ├── services/seo.service.test.ts
│   ├── controllers/business.controller.test.ts
│   └── routes/business.routes.test.ts
└── prisma/
    └── migrations/
        └── add_business_model/ (auto-generated by prisma migrate)
```

**Modified Files:**

```
packages/backend/
├── src/app.ts                      # Register business routes
├── prisma/schema.prisma            # Add Business model
└── src/index.ts                    # (No changes)
```

### 11.2 Frontend Files

**New Files to Create:**

```
packages/frontend/src/
├── components/
│   ├── BusinessCard.tsx            # Listing card
│   ├── BusinessCard.test.tsx
│   ├── BusinessListingPage.tsx      # Listing page
│   ├── BusinessListingPage.test.tsx
│   ├── BusinessProfilePage.tsx      # Profile page
│   ├── BusinessProfilePage.test.tsx
│   ├── BusinessHeader.tsx           # Profile header
│   ├── BusinessOverviewTab.tsx      # Overview tab
│   ├── BusinessPhotosTab.tsx        # Gallery tab
│   ├── OperatingHoursDisplay.tsx    # Hours component
│   ├── LocationMap.tsx              # Map component
│   └── [corresponding .test.tsx files]
├── pages/
│   ├── businesses/
│   │   ├── index.tsx               # /businesses listing
│   │   └── [slug].tsx              # /businesses/[slug] profile
│   └── [corresponding .test.tsx files]
├── hooks/
│   ├── useBusinesses.ts            # Data fetching hook
│   ├── useBusinessDetail.ts        # Single business hook
│   ├── useIsOpenNow.ts             # Open Now calculation
│   └── [corresponding .test.ts files]
├── utils/
│   ├── seo.ts                      # SEO metadata helpers
│   ├── business-formatting.ts      # Display formatting
│   └── [corresponding .test.ts files]
├── services/
│   └── business-api.ts             # API calls
└── styles/
    └── business.css                # (If needed - use Tailwind)
```

### 11.3 Shared Files

**New Files to Create:**

```
packages/shared/src/
├── types/
│   ├── business.ts                 # TypeScript interfaces
│   ├── operating-hours.ts
│   └── seo.ts
├── validators/
│   ├── business.validator.ts       # Shared Zod schemas
│   └── address.validator.ts
├── utils/
│   ├── phone-validator.ts          # Australian phone validation
│   ├── postcode-validator.ts       # Australian postcode validation
│   └── open-now.ts                 # "Open Now" logic
├── constants/
│   └── business.constants.ts       # Status enums, categories, etc.
└── tests/
    └── [corresponding .test.ts files]
```

---

## 12. FEATURE FLAGS (From platform.json)

**Phase 4 Feature Flags:**

```json
{
  "features": {
    "businessDirectory": true,  // Enable/disable entire feature
    "eventsCalendar": true,     // Needed for Phase 8 preview
    "reviewsAndRatings": true,  // Needed for ratings display
    "multilingual": true,       // For description translations
    "pwaInstallation": true     // For offline support
  }
}
```

**Usage in Code:**
```typescript
import { useFeatureFlag } from '@community-hub/shared';

export function BusinessCard() {
  const isEnabled = useFeatureFlag('businessDirectory');
  if (!isEnabled) return null;

  return <div className="business-card">...</div>;
}
```

---

## 13. TESTING STRATEGY

### 13.1 Coverage Targets

- **Backend Unit Tests:** >80% coverage
  - Models, Services, Validators, Utils
  - All edge cases (invalid phone, postcode, timezone calculations)

- **Backend Integration Tests:** All endpoints
  - GET /businesses (pagination, filtering)
  - GET /businesses/:id
  - POST /businesses (auth checks)
  - PUT /businesses/:id (ownership checks)
  - DELETE /businesses/:id

- **Frontend Unit Tests:** >80% coverage
  - Components (BusinessCard, OperatingHours, etc.)
  - Hooks (useBusinesses, useIsOpenNow)
  - Utils (phone formatter, seo helpers)

- **Frontend E2E Tests:** Critical paths
  - Browse business directory
  - View business profile
  - Check "Open Now" status

- **Accessibility Tests:** jest-axe on all components
  - Zero violations required
  - Keyboard navigation tested
  - Screen reader tested

### 13.2 Test Data

**Seed Data for Testing:**
- 5 test businesses in different categories
- Different timezones (if applicable)
- Different statuses (active, pending, suspended)
- Various media (with/without photos)
- Different operating hours (24hr, closed, appointment only)

**Test Fixtures:**
```typescript
const mockBusiness = {
  id: 'test-business-1',
  name: 'Test Restaurant',
  slug: 'test-restaurant',
  description: { en: 'A test restaurant' },
  categoryPrimary: 'restaurant-uuid',
  address: {
    street: '123 Test St',
    suburb: 'Guildford',
    postcode: '2161',
    latitude: -33.8567,
    longitude: 150.9876
  },
  phone: '0299999999',
  status: 'active',
  claimed: true,
  claimedBy: 'user-uuid'
};
```

---

## 14. SECURITY CHECKLIST

- [ ] All user input validated with Zod schemas
- [ ] All user input sanitized (DOMPurify for descriptions)
- [ ] Phone numbers validated (Australian format)
- [ ] Postcodes validated (4 digits, range check)
- [ ] URLs validated (email, website)
- [ ] File uploads validated (format, size, dimensions)
- [ ] File uploads scanned for malware signatures
- [ ] Ownership checks on PUT/DELETE endpoints
- [ ] Rate limiting applied to all endpoints
- [ ] Audit logging for all changes
- [ ] CSRF protection enabled
- [ ] CORS headers correct
- [ ] No sensitive data in logs (phone, email)
- [ ] No hardcoded location data
- [ ] Timezone used correctly for "Open Now"
- [ ] Image EXIF data stripped

---

## 15. PERFORMANCE TARGETS (From Spec §3)

| Metric | Target | Strategy |
|--------|--------|----------|
| GET /businesses (list) | <200ms (p95) | Index on status, category, created_at |
| GET /businesses/:id | <100ms (p95) | Lean database query, Redis cache |
| GET /categories | <100ms (p95) | Redis cache, small dataset |
| Page load | <3s on 3G | Lazy load images, code splitting |
| Lighthouse score | >80 | Already targeted from Phase 1 |

**Caching Strategy:**
- Categories: 1 hour Redis cache (low change frequency)
- Business list: No caching (needs to reflect real-time)
- Business detail: Optional Redis cache (10 minutes) if high traffic
- Geocoding results: 30 days (Phase 1.7, already implemented)

---

## 16. GLOSSARY OF TERMS

| Term | Definition |
|------|-----------|
| **Business** | A local organization/shop/service listed in the directory |
| **Claimed** | Business ownership verified and associated with a user account |
| **Status** | pending (new, awaiting approval), active (visible), suspended (hidden), deleted (soft deleted) |
| **Category** | Business type classification (Restaurant, Retail, Services, etc.) |
| **Operating Hours** | Regular weekly hours + special hours exceptions |
| **Open Now** | Real-time indicator if business is currently open |
| **Slug** | SEO-friendly URL component from business name (kebab-case) |
| **Postcode** | Australian 4-digit postcode (e.g., 2161) |
| **Geocoding** | Converting address → latitude/longitude |
| **Timezone** | Database timezone (e.g., "Australia/Sydney") for "Open Now" logic |
| **SEO Metadata** | Title, description, keywords, structured data, OG tags |
| **LocalBusiness** | Schema.org structured data type for businesses |

---

## 17. KNOWN CONSTRAINTS & TECHNICAL DECISIONS

### 17.1 Constraints

1. **Soft Delete Required** - Business must use soft delete (status = DELETED), not hard delete
   - Reason: Audit trail, reference integrity for reviews/deals/events

2. **Multilingual by Default** - All business descriptions stored as JSON
   - Reason: Platform requirement for 10-language support

3. **No Hardcoded Locations** - All location data from platform.json
   - Reason: Location-agnostic architecture for multi-suburb deployment

4. **Timezone-Aware "Open Now"** - Must use business timezone from config, not UTC
   - Reason: Business hours are in local timezone, not UTC

5. **Max 50 Photos per Business** - Enforced at application level
   - Reason: Performance (gallery rendering, storage costs)
   - Stored in `config.limits.maxBusinessPhotos`

### 17.2 Technical Decisions

1. **Embedded vs. Separate Models**
   - ✅ Address, SocialLinks, OperatingHours = Embedded objects (JSON)
   - ❌ NOT separate tables (over-normalization, harder to query)
   - Reason: Always fetched with business, low change frequency

2. **Phone Validation Approach**
   - Use regex for basic format validation
   - Don't use external API (cost, latency)
   - Can be enhanced later if needed

3. **Postcode Validation**
   - Start with range check (platform.json.postcodeRange)
   - Can be enhanced with real AU postcode database later

4. **Geocoding on Save**
   - Call geocoding service on POST/PUT
   - Cache results in Redis (Phase 1.7 already does this)
   - Don't geolocate on GET (read cached values)

5. **Elasticsearch for Search**
   - Index created in Phase 1.3
   - Phase 4 maintains index (update on changes)
   - Full search implementation in Phase 5

---

## 18. SUCCESS METRICS

### 18.1 Definition of Done

- [ ] All 39 tasks completed
- [ ] All endpoints implemented and documented
- [ ] All database models and relationships working
- [ ] >80% test coverage (backend + frontend)
- [ ] Zero jest-axe violations
- [ ] WCAG 2.1 AA compliance verified
- [ ] All hardcoded locations removed
- [ ] Performance targets met (<200ms p95 for list, <100ms p95 for detail)
- [ ] Security checklist completed
- [ ] Audit trail logging working
- [ ] SEO metadata implemented
- [ ] Responsive design verified (3 breakpoints)
- [ ] All i18n keys added to translation files

### 18.2 Quality Indicators

| Metric | Target | Current |
|--------|--------|---------|
| Test Pass Rate | 100% | - |
| Code Coverage | >80% | - |
| Accessibility Violations | 0 | - |
| Performance (p95) | <200ms | - |
| Lighthouse Score | >80 | - |
| Security Score | >95 | - |
| Lint Errors | 0 | - |
| TypeScript Errors | 0 | - |

---

## 19. DEPENDENCIES & BLOCKERS

### 19.1 External Dependencies

| Dependency | Status | Usage |
|------------|--------|-------|
| Mapbox SDK | ✅ Phase 1.7 complete | Geocoding |
| Prisma 7.3 | ✅ Phase 1.3 complete | Database |
| Express 5 | ✅ Phase 1.3 complete | API |
| React 18.3 | ✅ Phase 1.4 complete | UI |
| Tailwind CSS 4 | ✅ Phase 1.4 complete | Styling |
| Vitest 3.0 | ✅ Phase 1.1 complete | Testing |
| jest-axe | ✅ Phase 3 complete | A11y testing |
| react-i18next | ✅ Phase 1.8 complete | i18n |

### 19.2 Blockers

**None** - Phase 4 has no blockers. All dependencies are satisfied by Phases 1-3.

---

## 20. NEXT PHASE DEPENDENCIES

**Phase 5 (Search & Discovery) requires:**
- ✅ Business model complete (Phase 4)
- ✅ Business data populated (Phase 4)
- ✅ Business listing page (Phase 4)
- Elasticsearch integration (partial, Phase 1.3)

**Phase 6 (User Engagement) requires:**
- ✅ Business profiles (Phase 4)
- ✅ User system (Phase 2)
- Review creation/display (new in Phase 6)

**Phase 7 (Business Owner) requires:**
- ✅ Business profiles (Phase 4)
- Business claim workflow (new in Phase 7)
- Business analytics (new in Phase 7)

---

## CONCLUSION

Phase 4 is a straightforward implementation phase with well-defined scope and clear dependencies. All necessary foundations are in place from Phases 1-3. The Business Directory Core establishes the primary user-facing feature that all downstream phases depend on. Focus on clean, well-tested code with zero hardcoded location data to ensure the location-agnostic architecture remains intact for multi-suburb deployment.

**Key Success Factors:**
1. Proper data model design (Location, OperatingHours, SocialLinks as embedded)
2. Robust input validation and sanitization
3. Comprehensive test coverage (>80%)
4. Zero accessibility violations
5. No hardcoded location data
6. Audit trail logging for all changes

**Estimated Effort:** 5-7 business days for experienced full-stack team