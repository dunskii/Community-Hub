# Phase 4 Implementation Plan - Business Directory Core

### Executive Summary

Phase 4 establishes the Business Directory Core - the first major user-facing feature after foundation work. This phase implements the Business entity (the platform's most complex data model), creates 7 core API endpoints, builds business listing and profile pages, and lays the groundwork for all downstream features (Search, Reviews, Events, Deals).

**Scope:** 39 tasks across 12 implementation sections
**Dependencies:** Phases 1-3 complete (✅ achieved)
**Timeline:** 5-7 business days for experienced full-stack team
**Critical Path:** This phase blocks Phases 5-10

---

## Implementation Sections

### Section 1: Database Schema & Models (Backend Foundation)

**Priority:** CRITICAL - Must complete before any other Phase 4 work
**Estimated Time:** 4-6 hours
**Dependencies:** Phase 1.3 (Prisma), Phase 1.2 (platform.json)

#### Tasks:

1. **Create Business Prisma Model** (2-3 hours)
   - Add Business model to `packages/backend/prisma/schema.prisma`
   - Include all fields from study document section 3.1:
     - Core: id, name, slug, description (JSON for multilingual)
     - Categories: categoryPrimary (relation), categoriesSecondary (array)
     - Location: address (JSON), coordinates (lat/long floats)
     - Contact: phone, email, website, secondaryPhone
     - Hours: operatingHours (JSON)
     - Media: logo, coverPhoto, gallery (JSON array)
     - Social: socialLinks (JSON)
     - Business Info: languagesSpoken, certifications, paymentMethods, accessibilityFeatures
     - Optional: priceRange (enum), parkingInformation, yearEstablished
     - Status: status (enum: active, pending, suspended, deleted), claimed (boolean), claimedBy (User relation), verifiedAt
     - Timestamps: createdAt, updatedAt

2. **Create Enums** (30 minutes)
   - Add BusinessStatus enum: ACTIVE, PENDING, SUSPENDED, DELETED
   - Add PriceRange enum: BUDGET, MODERATE, PREMIUM, LUXURY
   - Add certifications as string array (not enum for flexibility)

3. **Define JSON Structures** (1 hour)
   - Address: { street, suburb, state, postcode, country, latitude, longitude }
   - OperatingHours: { monday, tuesday, wednesday, thursday, friday, saturday, sunday, publicHolidays, specialNotes }, each day: { open, close, closed, byAppointment }
   - SocialLinks: { facebook, instagram, twitter, tiktok, linkedin, youtube, googleBusiness }
   - Description: Multilingual JSON like Category.name: { "en": "...", "ar": "..." }
   - Gallery: Array of { url, alt, category (interior/exterior/products/menu), order }

4. **Add Relationships** (30 minutes)
   - Business → Category (categoryPrimary) with @relation and onDelete: Restrict
   - Business → User (claimedBy) optional with @relation
   - User → Business (ownedBusinesses) inverse relation

5. **Create Indexes** (15 minutes)
   - @@index([status, createdAt]) for listing queries
   - @@index([categoryPrimary]) for category filtering
   - @@unique([slug]) for SEO URLs
   - @@index([claimed]) for unclaimed business queries

6. **Seed Business Categories** (1 hour)
   - Add 25+ business categories to seed script
   - Hierarchical structure: Food & Beverage (parent) → Restaurants, Cafes, Bakeries (children)
   - Multilingual names for all 10 languages (mark non-English as [UNTRANSLATED] like Phase 1.8)
   - Categories: Restaurant, Cafe, Retail, Grocery, Services, Health, Beauty, Auto, Professional Services, Entertainment

7. **Run Migration** (15 minutes)
   - `cd packages/backend && npx prisma migrate dev --name add_business_model`
   - `npx prisma generate` to regenerate client
   - Run seed: `pnpm db:seed`

**Success Criteria:**
- Migration runs without errors
- All relationships work (Business → Category, Business → User)
- Categories seeded with multilingual names
- Indexes created successfully
- Prisma Client regenerated with Business type

**Files Created/Modified:**
- `packages/backend/prisma/schema.prisma` (modified - add Business model, enums, relations)
- `packages/backend/prisma/migrations/YYYYMMDDHHMMSS_add_business_model/migration.sql` (auto-generated)
- `packages/backend/src/db/seed.ts` (modified - add business categories)

---

### Section 2: Shared Types & Validators (Cross-Package Foundation)

**Priority:** HIGH - Required before backend services
**Estimated Time:** 3-4 hours
**Dependencies:** Section 1 complete (Prisma schema)

#### Tasks:

1. **Create TypeScript Interfaces** (1 hour)
   - `packages/shared/src/types/business.ts`:
     - Business interface matching Prisma model
     - Address interface
     - SocialLinks interface
     - BusinessCreateInput, BusinessUpdateInput interfaces
   - `packages/shared/src/types/operating-hours.ts`:
     - OperatingHours interface
     - DayHours interface
     - SpecialHours interface (for future Phase 7)

2. **Create Zod Validators** (2 hours)
   - `packages/shared/src/validators/business.validator.ts`:
     - addressSchema (validates street, suburb, postcode - 4 digits, coordinates - lat/long ranges)
     - operatingHoursSchema (validates time format HH:MM, logical open < close)
     - socialLinksSchema (validates URL format)
     - businessCreateSchema (all required fields + validation rules)
     - businessUpdateSchema (partial, omit protected fields like status, claimed)
   - `packages/shared/src/validators/address.validator.ts`:
     - Australian postcode validation (4 digits, range 0200-9999)
     - Coordinates validation (lat: -90 to 90, long: -180 to 180)

3. **Create Phone/Postcode Validators** (30 minutes)
   - `packages/shared/src/utils/phone-validator.ts`:
     - validateAustralianPhone function with regex: `/^(\+61|0)[2-9]\d{8}$/`
     - Formats: +61299999999, 0299999999, 02 9999 9999
   - `packages/shared/src/utils/postcode-validator.ts`:
     - validateAustralianPostcode function (4 digits, range check)
     - Option to validate against platform.json postcodeRange

4. **Create Business Constants** (30 minutes)
   - `packages/shared/src/constants/business.constants.ts`:
     - BusinessStatus enum values
     - PriceRange enum values
     - Certification options (HALAL, KOSHER, VEGAN, VEGETARIAN, ORGANIC, GLUTEN_FREE)
     - Payment methods (CASH, CARD, EFTPOS, PAYPAL, AFTERPAY, APPLE_PAY, GOOGLE_PAY)
     - Accessibility features (WHEELCHAIR_ACCESS, ACCESSIBLE_BATHROOM, HEARING_LOOP, RAMP, ELEVATOR, BRAILLE)
     - Gallery categories (INTERIOR, EXTERIOR, PRODUCTS, MENU, TEAM, EVENTS)

5. **Create "Open Now" Utility** (1 hour)
   - `packages/shared/src/utils/open-now.ts`:
     - isOpenNow function (uses timezone from platform.json)
     - Takes: business.operatingHours, business.address.timezone (or config timezone)
     - Returns: boolean | null (null = "by appointment")
     - Logic: Get current time in business timezone, check day of week, compare with hours
     - Handle edge cases: overnight hours (close < open), public holidays

6. **Write Tests** (1 hour total)
   - `packages/shared/src/__tests__/validators/business.validator.test.ts` (15 tests)
   - `packages/shared/src/__tests__/utils/phone-validator.test.ts` (10 tests)
   - `packages/shared/src/__tests__/utils/postcode-validator.test.ts` (8 tests)
   - `packages/shared/src/__tests__/utils/open-now.test.ts` (12 tests)

**Success Criteria:**
- Types match Prisma schema exactly
- All validators reject invalid input (phone, postcode, email, coordinates)
- "Open Now" logic correctly calculates for configured timezone
- All tests passing (45+ new tests)

**Files Created:**
- `packages/shared/src/types/business.ts`
- `packages/shared/src/types/operating-hours.ts`
- `packages/shared/src/validators/business.validator.ts`
- `packages/shared/src/validators/address.validator.ts`
- `packages/shared/src/utils/phone-validator.ts`
- `packages/shared/src/utils/postcode-validator.ts`
- `packages/shared/src/utils/open-now.ts`
- `packages/shared/src/constants/business.constants.ts`
- `packages/shared/src/__tests__/[corresponding .test.ts files]` (4 test files)

**Files Modified:**
- `packages/shared/src/index.ts` (export new types, validators, utils, constants)

---

### Section 3: Backend Services (Business Logic)

**Priority:** HIGH - Core business logic layer
**Estimated Time:** 4-5 hours
**Dependencies:** Sections 1-2 complete

#### Tasks:

1. **Create BusinessService** (2-3 hours)
   - `packages/backend/src/services/business-service.ts`:
     - createBusiness: Insert with geocoding, Elasticsearch indexing, audit logging
     - getBusinessById: Fetch with category relation, cache in Redis (10 min TTL)
     - listBusinesses: Pagination, filtering (category, status, open_now), sorting (createdAt, name, rating)
     - updateBusiness: Update with geocoding if address changed, ES sync, audit log
     - deleteBusiness: Soft delete (set status=DELETED), remove from ES, audit log
     - getBusinessBySlug: Fetch by slug (for SEO URLs)
   - Integration with Phase 1.7 geocoding service (call on create/update if address provided)
   - Integration with Phase 1.3 Elasticsearch (index/update/remove)
   - Integration with Phase 1.3 Redis cache (cache business details)
   - Use Phase 1.3 audit logging (log all creates/updates/deletes)

2. **Create OperatingHoursService** (1 hour)
   - `packages/backend/src/services/operating-hours-service.ts`:
     - isOpenNow: Use shared util, inject timezone from platform config
     - getNextOpeningTime: Calculate next opening if currently closed
     - formatHoursForDisplay: Convert to human-readable format
     - validateHours: Ensure open < close, valid time format

3. **Create SEO Service** (1 hour)
   - `packages/backend/src/services/seo-service.ts`:
     - generateMetaTags: Create title, description, keywords
     - generateSchemaOrgData: LocalBusiness structured data (name, address, phone, hours, geo, priceRange)
     - generateSlug: Kebab-case from business name, ensure uniqueness
     - validateSlug: Check slug availability in database

4. **Create Slug Utility** (30 minutes)
   - `packages/backend/src/utils/slug.ts`:
     - generateSlug: Kebab-case transformation (lowercase, replace spaces with hyphens, remove special chars)
     - ensureUniqueSlug: Append number if slug exists (business-name, business-name-2, etc.)

5. **Write Tests** (1-2 hours)
   - `packages/backend/src/__tests__/services/business-service.test.ts` (25 tests)
   - `packages/backend/src/__tests__/services/operating-hours-service.test.ts` (12 tests)
   - `packages/backend/src/__tests__/services/seo-service.test.ts` (10 tests)
   - `packages/backend/src/__tests__/utils/slug.test.ts` (8 tests)

**Success Criteria:**
- BusinessService handles all CRUD operations correctly
- Geocoding converts address → coordinates on save
- "Open Now" calculation uses configured timezone
- SEO metadata generates valid LocalBusiness structured data
- Elasticsearch stays in sync with database (create, update, delete operations)
- Audit log tracks all changes with actor, timestamp, previous/new values
- All tests passing (55+ new tests)

**Files Created:**
- `packages/backend/src/services/business-service.ts`
- `packages/backend/src/services/operating-hours-service.ts`
- `packages/backend/src/services/seo-service.ts`
- `packages/backend/src/utils/slug.ts`
- `packages/backend/src/__tests__/services/business-service.test.ts`
- `packages/backend/src/__tests__/services/operating-hours-service.test.ts`
- `packages/backend/src/__tests__/services/seo-service.test.ts`
- `packages/backend/src/__tests__/utils/slug.test.ts`

---

### Section 4: Backend API Endpoints

**Priority:** HIGH - Exposes business data to frontend
**Estimated Time:** 4-5 hours
**Dependencies:** Section 3 complete

#### Tasks:

1. **Create BusinessController** (2 hours)
   - `packages/backend/src/routes/business-controller.ts`:
     - listBusinesses: GET /businesses (public)
     - getBusinessById: GET /businesses/:id (public)
     - createBusiness: POST /businesses (admin only)
     - updateBusiness: PUT /businesses/:id (owner or admin)
     - deleteBusiness: DELETE /businesses/:id (admin only)
     - getBusinessBySlug: GET /businesses/slug/:slug (public, for SEO URLs)
   - Use Phase 2 auth middleware (requireAuth, requireRole)
   - Apply Zod validation middleware from Section 2
   - Use Phase 1.5 rate limiters (specific to each endpoint)
   - Return standardized responses using Phase 1.3 sendSuccess/sendError

2. **Create Business Routes** (1 hour)
   - `packages/backend/src/routes/business-routes.ts`:
     - Register all business endpoints with Express router
     - Apply middleware: requestId, requestLogger, auth, validation, rate limiting, ownership checks
     - Route structure:
       - GET /api/v1/businesses (public, rate limited 30/min)
       - GET /api/v1/businesses/:id (public, rate limited 60/min)
       - GET /api/v1/businesses/slug/:slug (public, rate limited 60/min)
       - POST /api/v1/businesses (admin, rate limited 1/min)
       - PUT /api/v1/businesses/:id (owner/admin, rate limited 5/min)
       - DELETE /api/v1/businesses/:id (admin, rate limited 1/min)

3. **Create Category Routes** (30 minutes)
   - `packages/backend/src/routes/category-routes.ts`:
     - GET /api/v1/categories (public) - list categories by type
     - GET /api/v1/categories/:id/businesses (public) - businesses by category with pagination

4. **Create Business Ownership Middleware** (1 hour)
   - `packages/backend/src/middleware/business-ownership.ts`:
     - requireBusinessOwnership: Verify req.user.id === business.claimedBy OR req.user.role === ADMIN
     - Use async error handling
     - Return 403 Forbidden if not authorized
     - Attach business to req.business for downstream use

5. **Register Routes in App** (15 minutes)
   - Modify `packages/backend/src/app.ts`:
     - Import business routes and category routes
     - Register: `app.use('/api/v1', businessRoutes)` and `app.use('/api/v1', categoryRoutes)`

6. **Write Tests** (2 hours)
   - `packages/backend/src/__tests__/routes/business-routes.test.ts` (30 tests - all endpoints, auth, validation, pagination, filtering, errors)
   - `packages/backend/src/__tests__/routes/category-routes.test.ts` (8 tests)
   - `packages/backend/src/__tests__/middleware/business-ownership.test.ts` (10 tests)

**Success Criteria:**
- All 7 endpoints work correctly (5 business + 2 category)
- Pagination works (page, limit, total, totalPages)
- Filtering works (category, status, open_now query params)
- Sorting works (createdAt, name query params with +/- prefix)
- Ownership checks prevent unauthorized edits
- Rate limiting prevents abuse (verified in tests)
- Validation rejects invalid input (Zod schemas)
- Audit logging tracks all changes
- All tests passing (48+ new tests)

**Files Created:**
- `packages/backend/src/routes/business-controller.ts`
- `packages/backend/src/routes/business-routes.ts`
- `packages/backend/src/routes/category-routes.ts`
- `packages/backend/src/middleware/business-ownership.ts`
- `packages/backend/src/__tests__/routes/business-routes.test.ts`
- `packages/backend/src/__tests__/routes/category-routes.test.ts`
- `packages/backend/src/__tests__/middleware/business-ownership.test.ts`

**Files Modified:**
- `packages/backend/src/app.ts` (register business and category routes)

---

### Section 5: Frontend API Client & Hooks

**Priority:** HIGH - Connects frontend to backend
**Estimated Time:** 3-4 hours
**Dependencies:** Section 4 complete

#### Tasks:

1. **Create Business API Client** (1-2 hours)
   - `packages/frontend/src/services/business-api.ts`:
     - getBusinesses: GET /businesses with query params (page, limit, category, status, open_now, sort)
     - getBusinessById: GET /businesses/:id
     - getBusinessBySlug: GET /businesses/slug/:slug (for profile pages)
     - createBusiness: POST /businesses (admin only)
     - updateBusiness: PUT /businesses/:id
     - deleteBusiness: DELETE /businesses/:id
     - getCategories: GET /categories with type filter
     - getCategoryBusinesses: GET /categories/:id/businesses
   - Use existing api-client pattern from Phase 2
   - Include auth headers from AuthContext
     - Handle errors consistently (401, 403, 404, 500)

2. **Create useBusinesses Hook** (1 hour)
   - `packages/frontend/src/hooks/useBusinesses.ts`:
     - Fetch business list with pagination, filtering, sorting
     - Return: { businesses, loading, error, pagination, refetch }
     - Use React state management
     - Debounce filter changes (300ms)
     - Optional: React Query for caching/refetching (if available, otherwise manual state)

3. **Create useBusinessDetail Hook** (30 minutes)
   - `packages/frontend/src/hooks/useBusinessDetail.ts`:
     - Fetch single business by ID or slug
     - Return: { business, loading, error, refetch }
     - Handle 404 gracefully

4. **Create useCategories Hook** (30 minutes)
   - `packages/frontend/src/hooks/useCategories.ts`:
     - Fetch categories filtered by type (BUSINESS)
     - Return: { categories, loading, error }
     - Cache categories (rarely change)

5. **Create useIsOpenNow Hook** (30 minutes)
   - `packages/frontend/src/hooks/useIsOpenNow.ts`:
     - Real-time "Open Now" calculation using shared util
     - Takes: business.operatingHours, business.address or platform config
     - Updates every minute (useEffect with setInterval)
     - Return: { isOpen, loading }

6. **Write Tests** (1 hour)
   - `packages/frontend/src/__tests__/hooks/useBusinesses.test.ts` (12 tests)
   - `packages/frontend/src/__tests__/hooks/useBusinessDetail.test.ts` (8 tests)
   - `packages/frontend/src/__tests__/hooks/useCategories.test.ts` (6 tests)
   - `packages/frontend/src/__tests__/hooks/useIsOpenNow.test.ts` (10 tests)

**Success Criteria:**
- API client handles all business endpoints correctly
- Hooks provide clean data fetching interface with loading/error states
- useIsOpenNow updates in real-time (every minute)
- Error handling shows user-friendly messages
- All tests passing (36+ new tests)

**Files Created:**
- `packages/frontend/src/services/business-api.ts`
- `packages/frontend/src/hooks/useBusinesses.ts`
- `packages/frontend/src/hooks/useBusinessDetail.ts`
- `packages/frontend/src/hooks/useCategories.ts`
- `packages/frontend/src/hooks/useIsOpenNow.ts`
- `packages/frontend/src/__tests__/hooks/[corresponding .test.ts files]` (4 test files)

---

### Section 6: Frontend Components (UI Building Blocks)

**Priority:** MEDIUM - Building blocks for pages
**Estimated Time:** 5-6 hours
**Dependencies:** Section 5 complete, Phase 3 design system

#### Tasks:

1. **Create BusinessCard Component** (1-2 hours)
   - `packages/frontend/src/components/BusinessCard.tsx`:
     - Display: logo (Avatar), name (H3), category (Badge), rating (future), "Open Now" indicator (useIsOpenNow), distance (if available)
     - Link to profile page (/businesses/:slug)
     - Use Phase 3 Card component as wrapper
     - Use Phase 3 Badge for "Open Now" (green) / "Closed" (red)
     - Responsive: Full width mobile, 2 columns tablet, 3 columns desktop
     - Accessibility: Proper heading hierarchy, alt text, keyboard focusable
   - `packages/frontend/src/components/BusinessCard.test.tsx` (15 tests - rendering, links, accessibility with jest-axe)

2. **Create BusinessHeader Component** (1 hour)
   - `packages/frontend/src/components/BusinessHeader.tsx`:
     - Display: cover photo (background), logo (Avatar large), name (H1), category (Badge), rating (future), verification badge
     - Action buttons: Save, Share, Directions, Call, Message (future)
     - Use Phase 3 components (Avatar, Badge, Button)
     - Responsive: Stacked on mobile, side-by-side on desktop
     - Accessibility: Proper heading, alt text, ARIA labels
   - `packages/frontend/src/components/BusinessHeader.test.tsx` (12 tests)

3. **Create OperatingHoursDisplay Component** (1 hour)
   - `packages/frontend/src/components/OperatingHoursDisplay.tsx`:
     - Display: Table of hours (Monday-Sunday, each row: day name, open-close time)
     - "Open Now" indicator with real-time update (useIsOpenNow)
     - "Closed Today" for closed days
     - "By Appointment" for appointment-only days
     - Special notes display (if business.operatingHours.specialNotes exists)
     - Use Phase 3 typography and spacing
     - Responsive: Compact on mobile, expanded on desktop
     - Accessibility: Table headers, proper labels
   - `packages/frontend/src/components/OperatingHoursDisplay.test.tsx` (10 tests)

4. **Create LocationMap Component** (1 hour)
   - `packages/frontend/src/components/LocationMap.tsx`:
     - Use Mapbox GL JS (Phase 1.7 BusinessMap as reference)
     - Display: Map with business marker at coordinates
     - Props: business (with address and coordinates)
     - Size: 100% width, 400px height on desktop, 300px on mobile
     - Accessibility: ARIA label, keyboard focus, screen reader description
     - Fallback: Static map image if JS disabled (optional)
   - `packages/frontend/src/components/LocationMap.test.tsx` (8 tests)

5. **Create BusinessOverviewTab Component** (1 hour)
   - `packages/frontend/src/components/BusinessOverviewTab.tsx`:
     - Sections: About (description), Operating Hours (OperatingHoursDisplay), Location (LocationMap), Contact (phone, email, website), Features (languages, certifications, payment methods, accessibility)
     - Use Phase 3 layout components (Grid, PageContainer)
     - Use Phase 3 typography and spacing
     - Responsive: Single column mobile, two columns desktop
   - `packages/frontend/src/components/BusinessOverviewTab.test.tsx` (12 tests)

6. **Create BusinessPhotosTab Component** (30 minutes)
   - `packages/frontend/src/components/BusinessPhotosTab.tsx`:
     - Display: Photo gallery grid (2 columns mobile, 3 columns tablet, 4 columns desktop)
     - Use Phase 3 Carousel component for fullscreen view on click
     - Category filter chips (Interior, Exterior, Products, Menu)
     - Lazy load images (loading="lazy")
     - Accessibility: Alt text, keyboard navigation
   - `packages/frontend/src/components/BusinessPhotosTab.test.tsx` (10 tests)

**Success Criteria:**
- All components use Phase 3 design system components (no custom styles)
- Responsive design works at all breakpoints (<768px, 768-1199px, ≥1200px)
- "Open Now" indicator updates in real-time (every minute)
- Map displays business location correctly with marker
- Gallery supports swipe on mobile (Carousel component)
- Zero jest-axe violations (accessibility tests pass)
- Keyboard navigation works (Tab, Enter, Space)
- All tests passing (67+ new tests)

**Files Created:**
- `packages/frontend/src/components/BusinessCard.tsx`
- `packages/frontend/src/components/BusinessCard.test.tsx`
- `packages/frontend/src/components/BusinessHeader.tsx`
- `packages/frontend/src/components/BusinessHeader.test.tsx`
- `packages/frontend/src/components/OperatingHoursDisplay.tsx`
- `packages/frontend/src/components/OperatingHoursDisplay.test.tsx`
- `packages/frontend/src/components/LocationMap.tsx`
- `packages/frontend/src/components/LocationMap.test.tsx`
- `packages/frontend/src/components/BusinessOverviewTab.tsx`
- `packages/frontend/src/components/BusinessOverviewTab.test.tsx`
- `packages/frontend/src/components/BusinessPhotosTab.tsx`
- `packages/frontend/src/components/BusinessPhotosTab.test.tsx`

---

### Section 7: Frontend Pages (Complete User Experience)

**Priority:** HIGH - User-facing pages
**Estimated Time:** 5-6 hours
**Dependencies:** Section 6 complete

#### Tasks:

1. **Create BusinessListingPage** (2-3 hours)
   - `packages/frontend/src/pages/businesses/index.tsx`:
     - Layout: Grid of BusinessCard components (Phase 3 Grid with responsive columns)
     - Filters: Category chips (Phase 3 Badge), "Open Now" toggle (Phase 3 Toggle), Sort dropdown (Phase 3 Select)
     - Pagination: Phase 3 Pagination component at bottom
     - Results count: "Showing 1-20 of 156 businesses"
     - Loading state: Phase 3 Skeleton components
     - Empty state: Phase 3 EmptyState component with CTA
     - URL state: Sync filters/page to URL query params (shareable links)
     - Use useBusinesses hook
     - Responsive: 1 column mobile, 2 columns tablet, 3 columns desktop
     - Accessibility: Proper heading hierarchy, filter labels, pagination keyboard nav
   - `packages/frontend/src/pages/businesses/index.test.tsx` (20 tests - rendering, filtering, sorting, pagination, accessibility)

2. **Create BusinessProfilePage** (3 hours)
   - `packages/frontend/src/pages/businesses/[slug].tsx`:
     - Layout: BusinessHeader at top, Tabs below (Phase 3 Tabs)
     - Tabs: Overview (BusinessOverviewTab), Photos (BusinessPhotosTab), Reviews (future), Events (future), Deals (future)
     - Action buttons: Directions (Phase 1.7 DirectionsButton), Call (tel: link), Message (future)
     - Loading state: Phase 3 Skeleton components
     - Error state: 404 page if business not found
     - SEO: Dynamic meta tags (Section 8), Schema.org data
     - Use useBusinessDetail hook with slug
     - Responsive: Full width layout with proper spacing
     - Accessibility: H1 for business name, tab keyboard navigation, alt text
   - `packages/frontend/src/pages/businesses/[slug].test.tsx` (18 tests - rendering, tabs, 404, SEO metadata, accessibility)

3. **Add Routes** (30 minutes)
   - Modify `packages/frontend/src/App.tsx` (or router config):
     - Add route: `/businesses` → BusinessListingPage
     - Add route: `/businesses/:slug` → BusinessProfilePage
     - Ensure proper React Router setup (if not already configured)

**Success Criteria:**
- Listing page shows all active businesses with pagination
- Filters update results in real-time (debounced)
- Profile page loads from slug correctly
- All tabs work correctly with keyboard navigation
- SEO metadata renders correctly (see Section 8)
- Loading states show while fetching (Skeleton components)
- 404 page shows for invalid slug
- Mobile-first responsive design works at all breakpoints
- WCAG 2.1 AA compliant (zero jest-axe violations)
- All tests passing (38+ new tests)

**Files Created:**
- `packages/frontend/src/pages/businesses/index.tsx`
- `packages/frontend/src/pages/businesses/index.test.tsx`
- `packages/frontend/src/pages/businesses/[slug].tsx`
- `packages/frontend/src/pages/businesses/[slug].test.tsx`

**Files Modified:**
- `packages/frontend/src/App.tsx` (add business routes)

---

### Section 8: SEO & Metadata

**Priority:** MEDIUM - Important for discoverability
**Estimated Time:** 2-3 hours
**Dependencies:** Section 7 complete

#### Tasks:

1. **Create SEO Utility Functions** (1-2 hours)
   - `packages/frontend/src/utils/seo.ts`:
     - generateTitle: `${business.name} | ${platformName}` (from platform config)
     - generateDescription: Truncate business.description to 160 chars
     - generateKeywords: Business name, category, suburb, platform keywords
     - generateOpenGraphTags: og:title, og:description, og:image (logo or cover), og:url, og:type (business.business)
     - generateTwitterCardTags: twitter:card (summary_large_image), twitter:title, twitter:description, twitter:image
     - generateCanonicalUrl: Full URL from slug
     - generateSchemaOrg: LocalBusiness structured data (name, address, phone, hours, geo, priceRange, image, url)
   - Use platform config for branding (platformName, baseUrl)

2. **Add Meta Tags to Profile Page** (1 hour)
   - Modify `packages/frontend/src/pages/businesses/[slug].tsx`:
     - Use react-helmet or Next.js Head (or vanilla head manipulation)
     - Inject meta tags: title, description, keywords, canonical
     - Inject Open Graph tags (og:title, og:description, og:image, og:url, og:type)
     - Inject Twitter Card tags
     - Inject Schema.org JSON-LD script tag with LocalBusiness data
     - Ensure all metadata uses platform.json branding

3. **Write Tests** (30 minutes)
   - `packages/frontend/src/__tests__/utils/seo.test.ts` (15 tests - all SEO functions, validation, edge cases)

**Success Criteria:**
- Meta tags render correctly on profile page (verify in browser inspector)
- Open Graph tags work in social media link previews (test with Facebook debugger, LinkedIn inspector)
- Schema.org markup validates (Google Rich Results Test: https://search.google.com/test/rich-results)
- Canonical URL set correctly (absolute URL)
- All metadata uses platform.json branding (no hardcoded platform name)
- Tests passing (15+ new tests)

**Files Created:**
- `packages/frontend/src/utils/seo.ts`
- `packages/frontend/src/__tests__/utils/seo.test.ts`

**Files Modified:**
- `packages/frontend/src/pages/businesses/[slug].tsx` (add SEO metadata injection)

---

### Section 9: Internationalization (i18n)

**Priority:** MEDIUM - Required for 10-language support
**Estimated Time:** 2-3 hours
**Dependencies:** Phase 1.8 i18n foundation, Sections 6-7 complete

#### Tasks:

1. **Add Business Translation Keys** (1-2 hours)
   - Modify all 10 translation files in `packages/frontend/src/i18n/locales/`:
     - `en.json`: Add business keys (reference English)
     - `ar.json`, `zh-CN.json`, `zh-TW.json`, `vi.json`, `hi.json`, `ur.json`, `ko.json`, `el.json`, `it.json`: Copy English, mark [UNTRANSLATED]
   - Keys to add:
     - `business.label`: "Business"
     - `business.description`: "Description"
     - `business.hours`: "Operating Hours"
     - `business.category`: "Category"
     - `business.phone`: "Phone"
     - `business.email`: "Email"
     - `business.website`: "Website"
     - `business.openNow`: "Open Now"
     - `business.closed`: "Closed"
     - `business.byAppointment`: "By Appointment Only"
     - `business.location`: "Location"
     - `business.features`: "Features"
     - `business.languagesSpoken`: "Languages Spoken"
     - `business.certifications`: "Certifications"
     - `business.paymentMethods`: "Payment Methods"
     - `business.accessibility`: "Accessibility Features"
     - `business.directions`: "Get Directions"
     - `business.call`: "Call"
     - `business.message`: "Send Message"
     - `business.share`: "Share"
     - `business.save`: "Save"
     - `validation.invalidPhone`: "Invalid phone number format"
     - `validation.invalidPostcode`: "Invalid postcode"
     - `business.status.active`: "Active"
     - `business.status.pending`: "Pending Approval"
     - `business.status.suspended`: "Suspended"
     - `business.priceRange.budget`: "$"
     - `business.priceRange.moderate`: "$$"
     - `business.priceRange.premium`: "$$$"
     - `business.priceRange.luxury`: "$$$$"

2. **Update Components to Use i18n** (1 hour)
   - Modify business components created in Section 6:
     - Replace all hardcoded English strings with `t('business.keyName')`
     - Use useTranslation hook from react-i18next
     - Ensure all labels, buttons, and UI text use translation keys
   - Components to update: BusinessCard, BusinessHeader, OperatingHoursDisplay, BusinessOverviewTab, BusinessPhotosTab

3. **Test RTL Layout** (30 minutes)
   - Manually test Arabic and Urdu in browser
   - Verify text direction switches correctly (dir="rtl" on HTML element)
   - Check layout doesn't break (flexbox, grid should handle RTL automatically)
   - Verify icons mirror correctly (if needed)

4. **Test Multilingual Business Descriptions** (30 minutes)
   - Verify business.description JSON displays correct language based on useLanguage
   - Fallback to English if translation not available
   - Test language switching updates business description

**Success Criteria:**
- All UI text uses i18n keys (no hardcoded English)
- RTL layout works correctly for Arabic/Urdu (text flows right-to-left, layout intact)
- Language switching works on all pages (header language selector)
- Multilingual business descriptions display in selected language
- No i18n-related console errors
- All existing tests still pass

**Files Modified:**
- `packages/frontend/src/i18n/locales/en.json` (add 30+ business keys)
- `packages/frontend/src/i18n/locales/ar.json` (copy + mark [UNTRANSLATED])
- `packages/frontend/src/i18n/locales/zh-CN.json` (copy + mark [UNTRANSLATED])
- `packages/frontend/src/i18n/locales/zh-TW.json` (copy + mark [UNTRANSLATED])
- `packages/frontend/src/i18n/locales/vi.json` (copy + mark [UNTRANSLATED])
- `packages/frontend/src/i18n/locales/hi.json` (copy + mark [UNTRANSLATED])
- `packages/frontend/src/i18n/locales/ur.json` (copy + mark [UNTRANSLATED])
- `packages/frontend/src/i18n/locales/ko.json` (copy + mark [UNTRANSLATED])
- `packages/frontend/src/i18n/locales/el.json` (copy + mark [UNTRANSLATED])
- `packages/frontend/src/i18n/locales/it.json` (copy + mark [UNTRANSLATED])
- All business components from Section 6 (add useTranslation, replace strings)

---

### Section 10: Media Upload Endpoints

**Priority:** LOW - Can be deferred to Phase 7 (Business Owner)
**Estimated Time:** 3-4 hours
**Dependencies:** Phase 2 file upload infrastructure, Section 4 complete

**Note:** These endpoints enable business owners to upload photos. They can be deferred to Phase 7 (Business Owner Features) if time is tight. For Phase 4, you can display media but not allow uploads.

#### Tasks (Optional for Phase 4):

1. **Create Business Image Upload Middleware** (1 hour)
   - `packages/backend/src/middleware/business-image-upload.ts`:
     - Extend Phase 2 upload middleware for business images
     - Validation: Format (PNG, JPG, JPEG, WebP), size limits (2MB logo, 5MB cover, 5MB gallery), dimensions (200x200 min logo, 1200x400 min cover)
     - Use multer for file upload
     - Use Sharp for processing (resize, convert to WebP, strip EXIF)

2. **Create Business Media Controller** (1-2 hours)
   - `packages/backend/src/routes/business-media-controller.ts`:
     - uploadLogo: POST /businesses/:id/logo (resize 400x400px, WebP)
     - uploadCover: POST /businesses/:id/cover (resize 1200x400px, WebP)
     - uploadGalleryPhoto: POST /businesses/:id/gallery (convert to WebP, generate thumbnail)
     - deleteGalleryPhoto: DELETE /businesses/:id/gallery/:photoId
   - Ownership checks: requireBusinessOwnership middleware
   - File storage: `/uploads/businesses/{businessId}/logo/`, `/uploads/businesses/{businessId}/cover/`, `/uploads/businesses/{businessId}/gallery/`
   - Update business record with photo URLs
   - Max 50 gallery photos enforcement

3. **Register Media Routes** (15 minutes)
   - Create `packages/backend/src/routes/business-media-routes.ts`
   - Register in `packages/backend/src/app.ts`

4. **Write Tests** (1 hour)
   - `packages/backend/src/__tests__/routes/business-media-routes.test.ts` (15 tests - all endpoints, validation, ownership, errors)

**Success Criteria (if implemented):**
- Logo uploads resize to 400x400px WebP
- Cover photo uploads resize to 1200x400px WebP
- Gallery photos process correctly (WebP conversion, thumbnail generation)
- EXIF data stripped from all images
- File size limits enforced (validation rejects oversized files)
- Max 50 gallery photos enforced (validation rejects 51st photo)
- Ownership checks prevent unauthorized uploads
- All tests passing (15+ new tests)

**Files Created (if implemented):**
- `packages/backend/src/middleware/business-image-upload.ts`
- `packages/backend/src/routes/business-media-controller.ts`
- `packages/backend/src/routes/business-media-routes.ts`
- `packages/backend/src/__tests__/routes/business-media-routes.test.ts`

**Files Modified (if implemented):**
- `packages/backend/src/app.ts` (register media routes)

---

### Section 11: Testing & Quality Assurance

**Priority:** CRITICAL - Must pass before declaring Phase 4 complete
**Estimated Time:** 3-4 hours
**Dependencies:** All other sections complete

#### Tasks:

1. **Backend Unit Tests** (already created in each section)
   - Verify >80% coverage: `cd packages/backend && pnpm test:coverage`
   - Focus areas: Business service, Operating hours service, SEO service, Validators, Slug utility
   - Minimum tests: 110+ new backend tests

2. **Backend Integration Tests** (already created in Section 4)
   - All endpoint tests passing
   - Auth tests (admin-only, owner-only, public endpoints)
   - Rate limiting tests (verify limits not exceeded)
   - Validation tests (Zod rejection of invalid input)
   - Minimum tests: 48+ endpoint integration tests

3. **Frontend Unit Tests** (already created in Sections 5-8)
   - Component tests (BusinessCard, OperatingHoursDisplay, etc.)
   - Hook tests (useBusinesses, useIsOpenNow)
   - Utility tests (SEO helpers, formatters)
   - Minimum tests: 156+ new frontend tests

4. **Frontend Integration Tests** (1 hour)
   - Page tests (listing, profile) - already created in Section 7
   - User flow tests: Browse businesses → Click card → View profile → Switch tabs
   - Create `packages/frontend/src/__tests__/integration/business-flow.test.tsx` (8 tests)

5. **Accessibility Tests** (30 minutes)
   - jest-axe on all components (already in component tests)
   - Verify zero violations: `pnpm test | grep 'Expected the HTML found'` (should be empty)
   - Manual keyboard navigation test:
     - Tab through business listing (cards focusable)
     - Enter opens business profile
     - Tab navigates tabs, Space/Enter activates
     - All buttons keyboard-accessible

6. **Manual Screen Reader Test** (30 minutes - optional but recommended)
   - Test with NVDA (Windows) or VoiceOver (Mac)
   - Business listing: Card titles announced correctly
   - Business profile: Heading hierarchy correct, tabs announced, "Open Now" status announced

7. **Performance Tests** (1 hour)
   - API response time: Use `wrk` or `autocannon` to load test
     - GET /businesses: Target <200ms p95 (with 20 businesses, pagination, no filters)
     - GET /businesses/:id: Target <100ms p95 (single business fetch)
   - Page load time: Use Lighthouse CI
     - Business listing page: Target <3s on 3G
     - Business profile page: Target <3s on 3G
   - Run: `pnpm lighthouse packages/frontend/dist` (requires production build)
   - Target: Lighthouse score >80

**Success Criteria:**
- Backend coverage >80% (run `pnpm test:coverage` in backend package)
- Frontend coverage >80% (run `pnpm test:coverage` in frontend package)
- All tests passing (300+ total Phase 4 tests)
- Zero jest-axe violations (check test output for "Expected the HTML found")
- Performance targets met (<200ms API p95, <3s page load on 3G)
- No console errors/warnings in browser (check during manual testing)

**Files Created:**
- `packages/frontend/src/__tests__/integration/business-flow.test.tsx`

---

### Section 12: Documentation & Completion

**Priority:** HIGH - Required for handoff and future development
**Estimated Time:** 2-3 hours
**Dependencies:** All other sections complete

#### Tasks:

1. **Update TODO.md** (30 minutes)
   - Mark all 39 Phase 4 tasks as complete: `[x]`
   - Update progress percentages: Phase 4: 39/39 (100%)
   - Update overall progress: Calculate new total (132+39 = 171/644 tasks)

2. **Update PROGRESS.md** (30 minutes)
   - Update Phase 4 section:
     - Status: Complete
     - Progress: 39/39 (100%)
     - Completion date: [Today's date]
     - Test counts: Backend (XXX), Frontend (XXX), Shared (XXX), Total (XXX)
   - Update Quick Status table at top
   - Update Overall Project Progress percentage
   - Add milestone: "Phase 4 Complete (YYYY-MM-DD): Business Directory Core functional, 39/39 tasks, XXX tests"

3. **Create API Documentation** (1 hour)
   - Create or update `Docs/API_Documentation.md`:
     - Document all 7 business endpoints (GET /businesses, GET /businesses/:id, etc.)
     - Include: Method, URL, Auth requirements, Query params, Request body, Response format, Example requests/responses
     - Document all 2 category endpoints
     - Use OpenAPI/Swagger format (or Markdown if simpler)

4. **Create Phase 4 Developer Guide** (1 hour)
   - Create `Docs/Phase_4_Developer_Guide.md`:
     - Architecture overview: Business entity, services, controllers, routes
     - Data model: Business, Address, OperatingHours, SocialLinks
     - Key services: BusinessService, OperatingHoursService, SEOService
     - Frontend components: BusinessCard, BusinessHeader, tabs
     - "Open Now" logic explanation
     - Geocoding integration (Phase 1.7)
     - Elasticsearch integration (Phase 1.3)
     - Location-agnostic patterns (platform.json usage)
     - Adding new business fields (guide for future developers)
     - Testing approach (unit, integration, accessibility)

5. **Update README.md** (30 minutes)
   - Add Phase 4 features to main README:
     - Business directory with 25+ categories
     - Business listing page with filters and pagination
     - Business profile pages with tabs (Overview, Photos)
     - Real-time "Open Now" calculation
     - SEO metadata and Schema.org structured data
     - Mapbox integration for location display
     - Multilingual business descriptions (10 languages)

6. **Run Final QA Review** (1 hour)
   - Use existing QA review process from Phases 1-3
   - Create `md/review/phase-4-business-directory-core.md`
   - Check all success criteria from each section
   - Verify location-agnostic checklist (no hardcoded Guildford, Sydney, postcode 2161, coordinates, timezone)
   - Test all endpoints with Postman/Insomnia
   - Test all pages in browser (listing, profile, tabs, filters, pagination)
   - Check accessibility (keyboard nav, screen reader, color contrast)
   - Verify tests passing and coverage >80%
   - Document any findings (critical, high, medium, low)

**Success Criteria:**
- TODO.md shows Phase 4: 39/39 complete
- PROGRESS.md updated with completion date, test counts
- API docs complete with all endpoints documented with examples
- Developer guide helps future contributors understand Phase 4 architecture
- All Phase 4 success criteria met (from all sections)
- QA review document created with findings (or PASS CLEAN if zero issues)

**Files Modified:**
- `TODO.md` (mark Phase 4 tasks complete, update progress)
- `PROGRESS.md` (update Phase 4 section, milestones, test counts)
- `README.md` (add Phase 4 features)

**Files Created:**
- `Docs/API_Documentation.md` (if doesn't exist) or update existing
- `Docs/Phase_4_Developer_Guide.md`
- `md/review/phase-4-business-directory-core.md` (QA review)

---

## Risk Assessment

### High-Risk Areas (Require Extra Attention):

1. **"Open Now" Calculation**
   - **Risk:** Complex timezone logic, must use platform.json timezone, handle edge cases (overnight hours, appointment-only)
   - **Mitigation:** Comprehensive tests (12 tests in Section 2), use existing timezone utils from Phase 1.7, reference platform config
   - **Test cases:** Regular hours, overnight hours (open 22:00, close 02:00), closed days, appointment-only, special hours, timezone edge cases

2. **Geocoding Integration**
   - **Risk:** Depends on Phase 1.7 service working correctly, API failures, rate limiting
   - **Mitigation:** Use existing geocoding service (already tested), implement retry logic, cache results in Redis (30-day TTL), handle failures gracefully (store address without coordinates, geocode later)

3. **Elasticsearch Sync**
   - **Risk:** Database and ES must stay in sync (create, update, delete), ES downtime, indexing errors
   - **Mitigation:** Wrap ES calls in try-catch, log errors, don't fail request if ES fails (degrade gracefully), implement reindex job for Phase 5, test sync thoroughly (15 tests)

4. **Multilingual Descriptions**
   - **Risk:** JSON storage for descriptions, language selection, fallback to English, RTL layout
   - **Mitigation:** Follow Category.name pattern (already implemented), test language switching, verify RTL in browser, test fallback logic

5. **Image Upload** (if implementing Section 10)
   - **Risk:** File validation, Sharp processing, storage organization, path traversal, EXIF stripping
   - **Mitigation:** Reuse Phase 2 upload patterns, validate file type (magic bytes), validate dimensions, use safeResolvePath, test with malicious files

### Medium-Risk Areas:

1. **Business Ownership Checks**
   - **Risk:** Must prevent unauthorized edits, check business.claimedBy === user.id OR user.role === ADMIN
   - **Mitigation:** Dedicated middleware (business-ownership.ts), comprehensive tests (10 tests), audit logging

2. **Soft Delete**
   - **Risk:** Must not actually delete (audit trail requirement), set status=DELETED, remove from search, preserve data
   - **Mitigation:** Update BusinessService.deleteBusiness to set status, not call Prisma delete, test soft delete behavior

3. **Performance**
   - **Risk:** N+1 queries, slow pagination, large result sets
   - **Mitigation:** Create proper indexes (Section 1), use Prisma include for relations, implement Redis caching (business details), test with 100+ businesses

4. **SEO Metadata**
   - **Risk:** Schema.org validation, OG tags not rendering, missing canonical URL
   - **Mitigation:** Use SEO utility functions (Section 8), test with Google Rich Results Test, verify OG tags in Facebook debugger, test canonical URL

### Low-Risk Areas:

1. **Category System** - Already exists from Phase 1, just need to seed business categories
2. **Design System** - All components ready from Phase 3, just compose them
3. **Authentication** - Already complete from Phase 2, reuse requireAuth and RBAC middleware

---

## Location-Agnostic Checklist

**CRITICAL:** For EVERY file created, verify the following before declaring section complete:

- [ ] No hardcoded "Guildford", "Sydney", "NSW" strings in code
- [ ] No hardcoded postcode "2161" or any specific postcode
- [ ] No hardcoded coordinates (-33.8567, 150.9876, etc.)
- [ ] No hardcoded timezone "Australia/Sydney"
- [ ] All location data from `platform.json` (via getPlatformConfig())
- [ ] All branding from `platform.json` (platformName, colors, etc.)
- [ ] Categories from database, not hardcoded array
- [ ] All i18n keys used, no hardcoded English strings
- [ ] Business descriptions stored as multilingual JSON (like Category.name)
- [ ] "Open Now" uses timezone from platform.json
- [ ] Geocoding uses address from business input, not default location
- [ ] Map center defaults to platform.json location.coordinates

**Verification Command:**
```bash
# Search for hardcoded location strings (should return nothing in Phase 4 files)
grep -r "Guildford\|Sydney\|2161\|Australia/Sydney" packages/*/src --exclude-dir=node_modules --exclude-dir=__tests__
```

---

## Integration Points

### With Phase 1 (Foundation):
- **Database:** Use Prisma Client, follow existing model patterns (User, Category)
- **API:** Express routes, middleware pipeline (auth, rate limiting, validation, sanitization)
- **Configuration:** Read platform.json with getPlatformConfig(), use feature flags
- **Geocoding:** Call Phase 1.7 geocoding service for address → coordinates
- **i18n:** Use Phase 1.8 react-i18next, follow translation file structure
- **Elasticsearch:** Use Phase 1.3 ES client, index businesses in existing index
- **Redis:** Use Phase 1.3 cache service, cache business details and geocoding results
- **File Storage:** Use Phase 1.3 local storage for business images (if implementing Section 10)

### With Phase 2 (Authentication):
- **User Model:** Add ownedBusinesses relation (inverse of Business.claimedBy)
- **JWT Authentication:** Use requireAuth middleware for protected endpoints
- **RBAC:** Use requireRole middleware for admin-only endpoints (create, delete)
- **Ownership:** New business-ownership middleware for owner/admin checks (update)

### With Phase 3 (Design System):
- **Components:** Use existing components extensively:
  - Input, Textarea, Select (forms in Phase 7)
  - Modal, Tabs, Carousel (UI in profile page)
  - Pagination, EmptyState, Skeleton (listing page)
  - Grid, PageContainer (layout)
  - Badge (category, "Open Now"), Avatar (logo), Card (wrapper for BusinessCard)
- **Design Tokens:** Use CSS variables from platform.json (colors, typography, spacing)
- **Accessibility:** Follow Phase 3 patterns (jest-axe, keyboard nav, ARIA labels)

### With Future Phases (Forward Compatibility):
- **Phase 5 (Search):** Uses Business model and Elasticsearch index created in Phase 4
- **Phase 6 (Reviews):** Reviews link to Business (foreign key business_id)
- **Phase 7 (Business Owner):** Business claim workflow uses Business.claimed, Business.claimedBy
- **Phase 8 (Events):** Events link to Business (organizer)
- **Phase 10 (Deals):** Deals link to Business (business_id)
- **Phase 14 (Emergency):** Business emergency status uses Business model

---

## Success Metrics

### Definition of Done Checklist:

- [ ] All 39 tasks completed (verified in TODO.md)
- [ ] All endpoints implemented and documented (7 business + 2 category)
- [ ] All database models and relationships working (Business, Category, User)
- [ ] >80% test coverage (backend + frontend)
- [ ] Zero jest-axe violations (check test output)
- [ ] WCAG 2.1 AA compliant (keyboard nav, screen reader, color contrast, alt text)
- [ ] All hardcoded locations removed (verified with grep command)
- [ ] Performance targets met (<200ms p95 for list, <100ms p95 for detail, <3s page load on 3G)
- [ ] Security checklist completed (input validation, sanitization, rate limiting, ownership checks, audit logging)
- [ ] Audit trail logging working (all creates/updates/deletes logged to AuditLog)
- [ ] SEO metadata implemented (title, description, OG tags, Schema.org)
- [ ] Responsive design verified (3 breakpoints: mobile, tablet, desktop)
- [ ] All i18n keys added to translation files (10 languages, non-English marked [UNTRANSLATED])

### Test Coverage Targets:

| Package  | Existing | New (Phase 4) | Target | Expected Total |
|----------|----------|---------------|--------|----------------|
| Backend  | 261      | 110+          | >80%   | 371+           |
| Frontend | 244      | 190+          | >80%   | 434+           |
| Shared   | 70       | 45+           | >80%   | 115+           |
| **Total**| **575**  | **345+**      | **>80%** | **920+**     |

### Quality Indicators:

| Metric                   | Target     | How to Verify                                    |
|--------------------------|------------|--------------------------------------------------|
| Test Pass Rate           | 100%       | `pnpm test` (all packages)                       |
| Code Coverage            | >80%       | `pnpm test:coverage` (each package)              |
| Accessibility Violations | 0          | jest-axe output (grep "Expected the HTML found") |
| API Response (p95)       | <200ms     | wrk or autocannon load test                      |
| Page Load (3G)           | <3s        | Lighthouse CI                                    |
| Lighthouse Score         | >80        | `pnpm lighthouse packages/frontend/dist`         |
| TypeScript Errors        | 0          | `pnpm typecheck`                                 |
| Lint Errors              | 0          | `pnpm lint`                                      |

---

### Critical Files for Implementation

The following files are most critical for implementing Phase 4 (in order of importance):

1. **`packages/backend/prisma/schema.prisma`** - Core data model definition
   - **Why:** Defines Business entity with all fields, relationships, indexes
   - **Priority:** Must create first (Section 1)

2. **`packages/backend/src/services/business-service.ts`** - Business logic layer
   - **Why:** All CRUD operations, geocoding integration, ES sync, audit logging
   - **Priority:** Core service that controllers depend on (Section 3)

3. **`packages/shared/src/validators/business.validator.ts`** - Input validation
   - **Why:** Validates all business data (address, phone, hours), prevents invalid data
   - **Priority:** Required before API endpoints (Section 2)

4. **`packages/backend/src/routes/business-controller.ts`** - API request handlers
   - **Why:** Exposes business data to frontend via 7 endpoints
   - **Priority:** Required for frontend integration (Section 4)

5. **`packages/frontend/src/pages/businesses/[slug].tsx`** - Business profile page
   - **Why:** Primary user-facing feature, integrates all components, SEO metadata
   - **Priority:** Main deliverable for Phase 4 (Section 7)

---

This comprehensive plan provides a clear roadmap for implementing Phase 4 (Business Directory Core) with detailed tasks, dependencies, success criteria, and file paths. Each section builds on previous work and can be implemented incrementally with clear validation at each step.