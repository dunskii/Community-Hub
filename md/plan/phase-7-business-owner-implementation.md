# Phase 7: Business Owner Features - Comprehensive Implementation Plan

**Date:** March 3, 2026
**Status:** Planning (0/33 tasks, 0% complete)
**Target Completion:** June 2026
**Specification Reference:** §13 (Business Owner Features) + Related Sections §9, §10, §24

---

## 1. Executive Overview

Phase 7 is a foundational phase that enables verified business owners to claim profiles, access comprehensive analytics dashboards, manage business information, and respond to customer reviews. This phase is critical for subsequent phases (10, 13) that depend on business owner functionality.

**Key Phase Objectives:**
- Implement 4-method business claim and verification system
- Build business owner dashboard with real-time metrics
- Create 7-step profile completion wizard
- Develop comprehensive analytics dashboard with exports
- Enable review response capabilities (Phase 6 integration)

**Critical Success Factors:**
- Secure verification workflows (phone, email, document, GMB OAuth)
- Sub-2-second analytics dashboard load time
- >80% test coverage across all new features
- WCAG 2.1 AA accessibility compliance
- Full i18n support (10 languages + RTL)

---

## 2. Architecture Overview

### 2.1 Three-Tier Implementation Stack

**Database Layer (PostgreSQL + Prisma)**
- 3 new models: BusinessClaimRequest, BusinessAnalyticsEvent, BusinessOwnerStaff
- Migrations with proper indexes for performance
- Relationships and constraints aligned with existing models

**Backend API Layer (Express 5.0)**
- 3 core endpoints: POST /businesses/:id/claim, GET /businesses/:id/analytics, GET /businesses/:id/inbox/analytics
- Extended PUT /businesses/:id for full profile fields
- Photo CRUD endpoints
- Support endpoints for moderation queue

**Frontend Layer (React 18.3 + TypeScript)**
- Business Owner Dashboard page
- Profile management and editing pages
- Analytics dashboard with charts and visualizations
- Dashboard widgets (6 components)
- Claim modal and flow
- Utility components (photo gallery, hours editor, social links manager)

**Services Layer**
- Claim verification services (phone, email, document, GMB)
- Analytics aggregation and calculation services
- Export services (CSV, PDF)
- Email/notification services
- Rate limiting and throttling

**Configuration**
- Feature flags in platform.json for business owner features
- Environment variables for external integrations (Twilio, Google, PDF service)
- Validation schemas for all configuration

---

## 3. Database Layer Design

### 3.1 New Data Models

**BusinessClaimRequest Model**
```
Fields:
- id (CUID, primary key)
- businessId (FK → Business)
- userId (FK → User)
- verificationMethod ('phone'|'email'|'document'|'google_business')
- verificationToken (JWT for email, nullable)
- verificationCode (hashed PIN for phone, nullable)
- verificationAttempts (counter, max 3)
- verificationStatus ('pending'|'verified'|'failed')
- documentType ('abn'|'utility_bill', for documents)
- documentUrls (string array, file URLs)
- googleBusinessId (Google Business Profile ID, nullable)
- claimStatus ('pending'|'approved'|'rejected')
- moderatorId (FK → User, moderator who reviewed)
- moderatorNotes (rejection reason, nullable)
- decisionDate (DateTime, when decision made)
- ipAddress (for audit)
- userAgent (for audit)
- createdAt, updatedAt

Indexes:
- businessId (for finding claims by business)
- userId (for finding user's claims)
- verificationStatus (for filtering pending claims)
- claimStatus (for moderator queue)

Unique constraint: businessId + userId (one active claim per business per user)
```

**BusinessAnalyticsEvent Model**
```
Fields:
- id (CUID, primary key)
- businessId (FK → Business)
- eventType ('profile_view'|'search_appearance'|'website_click'|'phone_click'|'direction_request'|'photo_view'|'save'|'follow'|'review_created')
- userId (FK → User, nullable for anonymous)
- referralSource ('search'|'homepage'|'saved_list'|'direct'|'external', nullable)
- searchTerm (from search, nullable)
- userAgent (device/browser info)
- ipAddressHash (bcrypt hashed, anonymized)
- geolocation (suburb/city)
- eventDate (DateTime when occurred)
- createdAt (for data cleanup)

Indexes:
- businessId (for analytics aggregation)
- eventDate (for time-range queries)
- eventType (for metric filtering)
- userId (for user behavior tracking)

Data retention: 3 years minimum
IP anonymization: After 90 days, hash is deleted
```

**BusinessOwnerStaff Model** (Future phase, include for schema completeness)
```
Fields:
- id (CUID, primary key)
- businessId (FK → Business)
- userId (FK → User)
- role ('manager'|'staff'|'viewer')
- permissions (string array)
- addedBy (owner who added)
- createdAt, updatedAt

Unique constraint: businessId + userId
```

### 3.2 Schema Updates to Existing Models

**Business Model Enhancements**
```
Add fields:
- detailedDescription (optional, rich text max 2000 chars)
- socialLinks (JSON: {facebook?, instagram?, twitter?, linkedin?, tiktok?, youtube?})
- menuPdfUrl (optional, menu/price list URL)

The following already exist:
- claimed (boolean, already present)
- claimedBy (FK to User, already present)
- verifiedAt (DateTime, already present)
- operatingHours (JSON, already present)
- logo, coverPhoto (already present)
- gallery (already present)
- languagesSpoken, certifications, accessibilityFeatures, paymentMethods (arrays, already present)
- timezone, featured, displayOrder (already present)
```

### 3.3 Migration Strategy

**Migration 1: Create BusinessClaimRequest Table**
- Create table with all fields
- Add foreign keys with proper cascading
- Create indexes for performance
- Add unique constraint

**Migration 2: Create BusinessAnalyticsEvent Table**
- Create table with all fields
- Add indexes for common queries
- Plan retention/cleanup jobs

**Migration 3: Create BusinessOwnerStaff Table**
- Create table (even though not immediately used)
- Add indexes
- Set up for future use

**Migration 4: Enhance Business Model**
- Add detailedDescription column (nullable text)
- Add menuPdfUrl column (nullable varchar)
- Add socialLinks column (nullable JSON)
- No data migration needed (all nullable)

---

## 4. API Layer Design

### 4.1 Core Endpoints

#### POST /businesses/:id/claim
**Purpose:** Initiate business ownership claim with selected verification method

**Request:**
```typescript
{
  verificationMethod: 'phone' | 'email' | 'document' | 'google_business'

  // If phone:
  phoneNumber?: string (E.164 format, e.g., +61412345678)

  // If email:
  businessEmail?: string (must be @company domain)

  // If document:
  documentType?: 'abn' | 'utility_bill'
  documents?: File[] (multipart FormData, max 3 files, 10MB each)

  // If google_business:
  googleBusinessCode?: string (OAuth authorization code)
}
```

**Response 201:**
```typescript
{
  claimRequestId: string
  status: 'pending' | 'verified' | 'awaiting_moderator'
  verificationMethod: string

  // Phone-specific response
  pinToken?: string (for PIN verification)
  pinExpiresAt?: DateTime (10 minutes)
  pinAttempts?: number

  // Email-specific response
  verificationToken?: string
  verificationTokenExpiresAt?: DateTime (24 hours)
  verificationLink?: string (frontend constructs from token)

  // Document-specific response
  moderationEstimate?: string (e.g., "5 business days")

  message: string (user-friendly message)
}
```

**Error Codes:**
- 400: BUSINESS_ALREADY_CLAIMED, INVALID_METHOD, INVALID_EMAIL, INVALID_PHONE, FILE_TOO_LARGE, INVALID_FILE_TYPE
- 401: UNAUTHENTICATED
- 404: BUSINESS_NOT_FOUND
- 409: CLAIM_ALREADY_PENDING, TOO_MANY_ATTEMPTS, ACCOUNT_LOCKED

**Authorization:** Authenticated user only

**Rate Limiting:** 3 requests per hour per user

#### GET /businesses/:id/analytics
**Purpose:** Fetch business performance metrics for date range

**Request:**
```typescript
Query parameters:
- startDate: ISO 8601 date (required, e.g., "2026-03-01")
- endDate: ISO 8601 date (required, e.g., "2026-03-03")
- metric?: 'profile_views' | 'search_appearances' | 'clicks' | 'saves' | 'follows' | 'reviews' (optional)
- granularity?: 'day' | 'week' | 'month' (default: auto-determined)
```

**Response 200:**
```typescript
{
  businessId: string
  businessName: string

  period: {
    startDate: DateTime
    endDate: DateTime
    previousStart: DateTime (auto-calculated)
    previousEnd: DateTime
    daysInPeriod: number
  }

  summary: {
    profileViews: { current: number, previous: number, changePercent: number, trend: 'up'|'down'|'flat' }
    searchAppearances: { current: number, previous: number, changePercent: number, trend: string }
    clicks: {
      website: { current, previous, changePercent, trend }
      phone: { current, previous, changePercent, trend }
      directions: { current, previous, changePercent, trend }
      total: { current, previous, changePercent, trend }
    }
    photoViews: { current: number, previous: number, changePercent: number, trend: string }
    saves: { current: number, previous: number, changePercent: number, trend: string }
    follows: { current: number, previous: number, changePercent: number, trend: string }
    reviews: {
      count: { current, previous, changePercent, trend }
      averageRating: number (1-5, 1 decimal place)
      newReviews: number
    }
  }

  timeseries: [
    {
      date: DateTime
      profileViews: number
      searchAppearances: number
      clicks: { website: number, phone: number, directions: number, total: number }
      photoViews: number
      saves: number
      follows: number
      reviewsAdded: number
    }
  ]

  insights: {
    topSearchTerms: [
      { term: string, count: number, trend: 'up'|'down'|'flat' }
    ]
    referralSources: [
      { source: string, count: number, percentage: number }
    ]
    peakActivityTimes: [
      { dayOfWeek: string, hour: number, count: number }
    ]
    topPhotos: [
      { photoUrl: string, views: number }
    ]
  }
}
```

**Error Codes:**
- 400: INVALID_DATE_RANGE, DATE_RANGE_TOO_LARGE (>3 years)
- 401: UNAUTHENTICATED
- 403: INSUFFICIENT_PERMISSIONS (not owner/admin)
- 404: BUSINESS_NOT_FOUND

**Authorization:** Owner or Admin only

**Performance:** Must load in <2 seconds; Redis caching (5-minute TTL) for frequent queries

#### GET /businesses/:id/inbox/analytics
**Purpose:** Get messaging metrics for business

**Request:**
```typescript
Query parameters:
- period?: 'today' | 'last_7_days' | 'last_30_days' | 'last_12_months' (default: 'last_30_days')
```

**Response 200:**
```typescript
{
  businessId: string
  period: string
  unreadCount: number
  totalConversations: number
  messageCount: number
  averageResponseTime: number (minutes)
  responseRate: number (percentage 0-100)
  conversionRate: number (percentage, 0-100)
  topInquiryTypes: [
    { type: string, count: number, percentage: number }
  ]
}
```

**Authorization:** Owner or Admin only

#### PUT /businesses/:id (Extended)
**Purpose:** Update business profile with full set of fields (owner-controlled)

**Request:**
```typescript
{
  // Basic fields
  name?: string (max 100 chars)
  description?: string (max 500 chars, sanitized)
  detailedDescription?: string (max 2000 chars, sanitized)
  categoryPrimaryId?: string
  categoriesSecondary?: string[] (max 3)

  // Contact
  phone?: string (E.164 format)
  secondaryPhone?: string
  email?: string
  website?: string (URL validation)

  // Location
  address?: string
  suburb?: string
  postcode?: string

  // Hours and operations
  operatingHours?: JSON (time editor component sends structure)

  // Media (handled separately in POST /photos)
  // logo, coverPhoto sent via separate file endpoints

  // Social links
  socialLinks?: {
    facebook?: string (URL)
    instagram?: string (URL)
    twitter?: string (URL)
    linkedin?: string (URL)
    tiktok?: string (URL)
    youtube?: string (URL)
  }

  // Business info
  priceRange?: '$'|'$$'|'$$$'|'$$$$'
  yearEstablished?: number (YYYY format)
  parkingInformation?: string (max 500 chars)
  languagesSpoken?: string[] (language codes)
  certifications?: string[] (from predefined list)
  accessibilityFeatures?: string[] (from predefined list)
  paymentMethods?: string[] (from predefined list)
}
```

**Response 200:** Updated Business object with all fields

**Validation:**
- name: Required, 1-100 chars, no HTML
- description: Required, 1-500 chars (wizard), 2000 chars (full edit), no HTML
- phone: E.164 format, valid Australian numbers
- email: RFC 5322 format
- website: Valid URL with http(s) protocol
- URLs in socialLinks: Valid HTTP(S) URLs
- Year: Valid year (1800-current+1)

**Authorization:** Owner or Admin only

**Rate Limiting:** 10 requests per hour per business

#### POST /businesses/:id/photos
**Purpose:** Add photos to business gallery

**Request:**
```
Multipart FormData with:
- files: File[] (FormData key: "files")
  - Format: JPG or PNG (validated by magic bytes)
  - Size: <5MB per file
  - Max: 50 total in gallery
- altTexts: string[] (optional, for accessibility)
```

**Response 201:**
```typescript
{
  photos: [
    {
      id: string
      url: string (CDN URL)
      altText: string (default: "")
      order: number
    }
  ]
}
```

**Error Codes:**
- 400: FILE_TOO_LARGE, GALLERY_FULL (50 limit), INVALID_FILE_TYPE
- 413: PAYLOAD_TOO_LARGE
- 401: UNAUTHENTICATED
- 403: INSUFFICIENT_PERMISSIONS
- 404: BUSINESS_NOT_FOUND

**Authorization:** Owner or Admin only

#### PUT /businesses/:id/photos/:photoId
**Purpose:** Update photo metadata (alt text, order)

**Request:**
```typescript
{
  altText?: string (max 200 chars)
  order?: number (0-indexed)
}
```

**Response 200:** Updated photo object

#### DELETE /businesses/:id/photos/:photoId
**Purpose:** Delete photo from gallery

**Response 204:** No content

---

## 5. Frontend Layer Design

### 5.1 Pages

**BusinessOwnerDashboard Page** (`packages/frontend/src/pages/BusinessOwnerDashboard.tsx`)
- Layout: Header (welcome, profile, logout), main content with 6 widgets + sidebar quick actions
- Widgets: Profile Completeness, Profile Views, Recent Reviews, Upcoming Events, Active Promotions, Messages
- Quick Action Links: Edit Profile, Upload Photos, Create Event, Create Promotion, View Analytics, Manage Team
- Responsive: Mobile-optimized sidebar becomes drawer
- Accessibility: Keyboard nav all widgets, ARIA live regions for updates, semantic HTML

**ProfileManagementPage** (`packages/frontend/src/pages/ProfileManagementPage.tsx`)
- 7-step wizard mode (new owners)
- Full edit mode (existing owners)
- Step 1: Basic Information (name, description, category)
- Step 2: Contact Details (phone, email, website)
- Step 3: Address (street, suburb, postcode)
- Step 4: Operating Hours (time editor component)
- Step 5: Visual Identity (logo, cover, gallery)
- Step 6: Details & Features (description, price, year, parking)
- Step 7: Additional Info (languages, certs, accessibility, payment methods)

**AnalyticsDashboard Page** (`packages/frontend/src/pages/AnalyticsDashboard.tsx`)
- Date range selector (presets + custom)
- Comparison period selector
- Metric KPI cards with trend indicators
- Charts: Line (views trend), Bar (daily breakdown), Pie (action breakdown), Heatmap (peak times)
- Data tables (for screen readers, alternative to charts)
- Export buttons (CSV, PDF)
- Auto-refresh every 5 minutes
- Loading states and error handling

**ClaimBusinessModal** (embedded in `packages/frontend/src/pages/BusinessDetailPage.tsx`)
- Unclaimed business profile shows "Claim This Business" button
- Modal overlays with 4 method tabs:
  - Phone: Enter number → Shows PIN input field (10 min timer)
  - Email: Enter email → Shows "Check inbox" message (24 hr timer)
  - Document: File upload → Shows "Under review" status (5 day estimate)
  - Google Business: Connect button → OAuth redirect flow

### 5.2 Component Organization

```
packages/frontend/src/components/business/
├── dashboard/
│   ├── BusinessOwnerDashboard.tsx
│   ├── ProfileCompletenessWidget.tsx
│   ├── ProfileViewsWidget.tsx
│   ├── RecentReviewsWidget.tsx
│   ├── UpcomingEventsWidget.tsx
│   ├── ActivePromotionsWidget.tsx
│   ├── MessagesWidget.tsx
│   └── __tests__/
├── claim/
│   ├── ClaimModal.tsx
│   ├── ClaimFlow.tsx
│   └── __tests__/
├── profile/
│   ├── ProfileWizard.tsx
│   ├── BasicInfoStep.tsx
│   ├── ContactDetailsStep.tsx
│   ├── AddressStep.tsx
│   ├── OperatingHoursEditor.tsx
│   ├── VisualIdentityStep.tsx
│   ├── DetailsStep.tsx
│   ├── AdditionalInfoStep.tsx
│   ├── PhotoGalleryManager.tsx
│   ├── SocialLinksManager.tsx
│   └── __tests__/
├── analytics/
│   ├── AnalyticsDashboard.tsx
│   ├── AnalyticsCard.tsx
│   ├── DateRangeSelector.tsx
│   ├── LineChart.tsx
│   ├── BarChart.tsx
│   ├── ExportSection.tsx
│   └── __tests__/
└── __tests__/
    └── accessibility.test.tsx
```

---

## 6. Configuration & Environment

### 6.1 platform.json Configuration

```json
{
  "features": {
    "businessOwnerClaiming": true,
    "businessDashboard": true,
    "businessAnalytics": true,
    "analyticsExportCsv": true,
    "analyticsExportPdf": true,
    "reviewOwnerResponses": true,
    "businessTeamManagement": false
  },

  "limits": {
    "maxBusinessPhotos": 50,
    "maxMenuPdfSizeMb": 10,
    "maxPhotoPdfSizeMb": 5,
    "businessDescriptionMaxChars": 2000,
    "shortDescriptionMaxChars": 500,
    "ownerResponseMaxChars": 500,
    "profileCompletionSteps": 7
  },

  "verification": {
    "phoneVerificationTimeoutMinutes": 10,
    "phoneVerificationMaxAttempts": 3,
    "phoneVerificationLockoutMinutes": 60,
    "emailVerificationTimeoutHours": 24,
    "documentReviewTimeoutDays": 5,
    "claimRejectionAppealWindowDays": 30,
    "claimResubmitWaitDays": 30
  },

  "moderation": {
    "documentClaimsRequireReview": true,
    "reviewRespondApprovalRequired": false
  },

  "analytics": {
    "eventRetentionDays": 1095,
    "anonIpHashingRetentionDays": 90,
    "cacheTtlMinutes": 5,
    "exportMaxRangeDays": 1095,
    "enableRealTimeAnalytics": false
  }
}
```

### 6.2 Environment Variables (.env)

```bash
# Phone Verification (Twilio)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+61412345678
TWILIO_VOICE_URL=https://your-domain.com/api/v1/twilio/voice

# PDF Export Service
PDF_SERVICE_URL=http://localhost:3001  # or cloud service
PDF_SERVICE_API_KEY=optional_if_needed

# Google Business Profile Integration
GOOGLE_BUSINESS_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_BUSINESS_CLIENT_SECRET=your_client_secret
GOOGLE_BUSINESS_REDIRECT_URI=https://your-domain.com/api/v1/auth/google-business/callback

# Malware Scanning (for document uploads)
CLAMAV_URL=http://clamav:3310  # Optional, ClamAV Docker service
SCAN_DOCUMENTS=true

# Analytics
ANALYTICS_EVENT_BATCH_SIZE=100
ANALYTICS_EVENT_FLUSH_INTERVAL_MS=30000
```

---

## 7. Internationalization (i18n)

### 7.1 Translation Keys

**Namespace:** `owner`

**Key Breakdown by Category:**

Dashboard Keys: owner.dashboard.* (15+ keys)
Claim Keys: owner.claim.* (20+ keys)
Profile Keys: owner.profile.* (40+ keys)
Analytics Keys: owner.analytics.* (30+ keys)
Error Keys: owner.error.* (10+ keys)

**Total Translation Keys:** 115+ keys across 10 languages

### 7.2 Language Support

**10 Languages:**
- English (en)
- Arabic (ar) - RTL
- Chinese Simplified (zh-CN)
- Chinese Traditional (zh-TW)
- Vietnamese (vi)
- Hindi (hi)
- Urdu (ur) - RTL
- Korean (ko)
- Greek (el)
- Italian (it)

---

## 8. Security & Validation

### 8.1 Authentication & Authorization

**Owner Access Control Middleware:**
```typescript
async function requireBusinessOwnership(req, res, next) {
  const userId = req.user?.id;
  const businessId = req.params.id;

  if (!userId) return res.status(401).json({ error: 'UNAUTHENTICATED' });

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: { claimedByUser: true }
  });

  if (!business) return res.status(404).json({ error: 'BUSINESS_NOT_FOUND' });

  const isOwner = business.claimedBy === userId;
  const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: 'INSUFFICIENT_PERMISSIONS' });
  }

  req.business = business;
  next();
}
```

### 8.2 Rate Limiting

```typescript
// Phone verification: 5 attempts per hour per phone
phoneVerificationLimiter = rateLimit({
  windowMs: 3600000,
  max: 5,
  keyGenerator: req => req.body.phoneNumber,
  message: 'TOO_MANY_VERIFICATION_ATTEMPTS'
});

// Email verification: 3 attempts per hour per email
emailVerificationLimiter = rateLimit({
  windowMs: 3600000,
  max: 3,
  keyGenerator: req => req.body.businessEmail,
  message: 'TOO_MANY_VERIFICATION_ATTEMPTS'
});

// Analytics export: 10 per hour per business
analyticsExportLimiter = rateLimit({
  windowMs: 3600000,
  max: 10,
  keyGenerator: req => `${req.user.id}:${req.params.id}`,
  message: 'EXPORT_RATE_LIMIT_EXCEEDED'
});
```

### 8.3 Input Validation

- Name: 1-100 chars, no HTML, trim
- Description: 1-500 chars (short), 1-2000 chars (detailed), no HTML
- Phone: E.164 format validation
- Email: RFC 5322 validation
- Website: URL constructor validation
- File uploads: Magic bytes validation, size limits

### 8.4 Audit Logging

All sensitive operations logged:
- Business claim requests
- Claim decisions (approve/reject)
- Document uploads
- Analytics exports
- Profile updates
- Each log includes: user ID, action, timestamp, IP address, outcome

---

## 9. Testing Strategy

### 9.1 Test Coverage Goals

**Target:** >80% code coverage
- Backend: 85%+ coverage
- Frontend: 80%+ coverage
- Shared: 80%+ coverage

### 9.2 Test Categories

**Unit Tests:**
- Claim verification logic (PIN, email token, document validation)
- Analytics calculation (aggregation, period comparison, trends)
- Profile completion (percentage, field detection)
- Authorization (owner access, admin override)
- Input validation (all form fields)

**Integration Tests:**
- Full claim flow (end-to-end from claim to dashboard)
- Profile wizard (all 7 steps, validation, save)
- Analytics (event tracking, aggregation, export)
- API endpoints (request/response validation)

**E2E Tests:**
- User visits business, claims it, completes wizard
- Owner views dashboard, edits profile, views analytics
- Owner exports analytics in CSV/PDF

**Accessibility Tests:**
- jest-axe: Zero violations across all components
- Keyboard navigation: Tab through all interactive elements
- Screen reader: Test with NVDA, JAWS, VoiceOver
- Color contrast: All text >4.5:1 ratio

### 9.3 Test Tools

- Vitest: Unit testing backend
- React Testing Library: Component testing
- jest-axe: Accessibility testing
- Cypress/Playwright: E2E testing
- MSW: Mock API responses

---

## 10. Performance Optimization

### 10.1 Performance Targets

| Metric | Target |
|--------|--------|
| Dashboard Load | <2 seconds |
| Analytics Query | <500ms |
| Chart Rendering | <1 second |
| Export Generation | <10 seconds |
| API Response | <200ms (p95) |

### 10.2 Caching Strategy

- Redis: 5-minute TTL for analytics queries
- CDN: 30-day cache for images
- Browser: Cache analytics data for offline access
- Invalidation: Clear cache on new events

### 10.3 Database Optimization

- Indexes on: businessId, eventDate, eventType, userId
- Query optimization: Avoid N+1 queries
- Batch operations: Multiple events in single transaction
- Aggregate in database: Use SQL SUM, COUNT, not application

### 10.4 Frontend Optimization

- Code splitting: Lazy load analytics components
- Image optimization: WebP format, <100KB each
- Bundle optimization: Tree-shake unused code
- Virtual scrolling: For long lists

---

## 11. Task Sequencing

### Phase Breakdown (33 Tasks)

**7.1: Foundation & Database (3 tasks)**
1. Create BusinessClaimRequest migration
2. Create BusinessAnalyticsEvent migration
3. Create BusinessOwnerStaff migration

**7.2: Claim System Backend (8 tasks)**
4. Implement POST /businesses/:id/claim endpoint
5. Implement phone verification (Twilio)
6. Implement email verification (JWT)
7. Implement document verification
8. Implement Google Business OAuth
9. Create moderator review queue backend
10. Implement claim approval/rejection
11. Implement appeals process

**7.3: Dashboard Backend (5 tasks)**
12. Implement analytics event tracking
13. Implement GET /businesses/:id/analytics endpoint
14. Implement GET /businesses/:id/inbox/analytics endpoint
15. Create profile completion service
16. Extend PUT /businesses/:id endpoint

**7.4: Dashboard Frontend (8 tasks)**
17. Create BusinessOwnerDashboard page
18. Create ProfileCompletenessWidget
19. Create ProfileViewsWidget
20. Create RecentReviewsWidget
21. Create UpcomingEventsWidget
22. Create ActivePromotionsWidget
23. Create MessagesWidget
24. Create dashboard quick actions

**7.5: Profile Management (7 tasks)**
25. Create ProfileWizard component
26. Implement Steps 1-3 (Basic, Contact, Address)
27. Implement Steps 4-5 (Hours, Visual)
28. Implement Steps 6-7 (Details, Additional)
29. Create PhotoGalleryManager
30. Create OperatingHoursEditor
31. Create SocialLinksManager

**7.6: Analytics Dashboard (4 tasks)**
32. Create AnalyticsDashboard page
33. Implement CSV export
34. Implement PDF export
35. Add date range selector

**7.7: Testing & QA (3 tasks)**
36. Write comprehensive tests
37. Accessibility audit
38. Security review

### Dependencies

```
Database migrations (7.1) ──┐
                            ├─> Claim endpoints (7.2)
                            │
Analytics event DB (7.1) ──┤
                            ├─> Dashboard backend (7.3)
                            │
Claim endpoint (7.2) ───────┤
                            ├─> Dashboard frontend (7.4)
                            │
Analytics endpoint (7.3) ───┤
                            └─> Analytics dashboard (7.6)

Dashboard frontend (7.4) ────> Testing & QA (7.7)
Profile management (7.5) ────┘
```

---

## 12. Critical Files

### Backend Core

- `/packages/backend/prisma/schema.prisma` - Data models
- `/packages/backend/src/routes/business.ts` - Endpoints
- `/packages/backend/src/controllers/business-controller.ts` - Business logic
- `/packages/backend/src/services/claim-verification.ts` - Claim logic
- `/packages/backend/src/services/analytics.ts` - Analytics logic

### Frontend Core

- `/packages/frontend/src/pages/BusinessOwnerDashboard.tsx` - Main page
- `/packages/frontend/src/pages/ProfileManagementPage.tsx` - Profile page
- `/packages/frontend/src/pages/AnalyticsDashboard.tsx` - Analytics page
- `/packages/frontend/src/components/business/dashboard/` - Dashboard widgets
- `/packages/frontend/src/components/business/profile/` - Profile components
- `/packages/frontend/src/components/business/analytics/` - Analytics components

### Configuration

- `/packages/shared/src/config/platform-schema.ts` - Configuration validation
- `/.env.example` - Environment variables
- `/config/platform.json` - Feature flags and limits

### i18n

- `/packages/frontend/src/i18n/locales/{lang}/owner.json` (10 files)

### Tests

- `/packages/backend/src/__tests__/` - Backend tests
- `/packages/frontend/src/__tests__/` - Frontend tests

---

## 13. Success Criteria

**Phase 7 Complete When:**
- [ ] All 33 tasks completed
- [ ] >80% code coverage (backend, frontend)
- [ ] Zero jest-axe violations
- [ ] <2 second dashboard load time
- [ ] <500ms analytics query time
- [ ] All tests passing (1500+)
- [ ] Production-ready code
- [ ] Full i18n support (10 languages)
- [ ] WCAG 2.1 AA compliant
- [ ] Zero critical security issues

---

## 14. Recommended Team Size & Timeline

**Estimated Effort:** 140 hours
- Backend: 40 hours
- Frontend: 50 hours
- Full-stack: 30 hours
- QA/Testing: 20 hours

**Timeline:**
- 1 developer: 5-6 weeks
- 2 developers: 2.5-3 weeks
- 3 developers: 1.5-2 weeks (with coordination overhead)

**Suggested Work Allocation:**
- Backend lead: Database, API endpoints, services
- Frontend lead: Pages, components, styling
- Full-stack: Integration, testing, coordination

