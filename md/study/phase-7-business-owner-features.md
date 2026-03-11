# Phase 7: Business Owner Features - Comprehensive Study

**Date:** March 11, 2026 (Updated)
**Status:** Not Started (0/33 tasks, 0%) - Ready to Begin
**Specification Reference:** §13 (lines 1851-1927)
**TODO Reference:** `TODO.md` lines 620-693
**Prerequisites:** Phase 4 ✅ Complete, Phase 6 ✅ ~90% Complete (4 tasks deferred)

---

## Executive Summary

Phase 7 is the **Business Owner Features** phase - a critical feature set that enables verified business owners to claim their business profiles, access comprehensive analytics, manage business information, and respond to reviews. This phase is foundational for subsequent phases (10 and 13) which depend on business owner capabilities.

**Key Features:**
1. Business claim and verification system (4 methods)
2. Business owner dashboard with real-time metrics
3. Business profile management and editing
4. Comprehensive analytics dashboard
5. Review response capabilities (integration with Phase 6)

---

## 1. Specification References

### Primary: §13 - Business Owner Features (lines 1851-1927)

**Related Sections:**
- **§9.2** (Onboarding, lines 1541-1582): Business Owner onboarding flow
- **§9.3** (QR Codes, lines 1583-1600): QR code analytics tracking
- **§10** (User Types, lines 1626-1700): Business Owner role and permissions
- **§13.1** (Claim & Verification, lines 1851-1880): Claim process details
- **§13.2** (Dashboard, lines 1881-1900): Dashboard metrics and widgets
- **§13.3** (Profile Management, lines 1901-1910): Profile editing features
- **§13.4** (Analytics, lines 1911-1927): Analytics dashboard requirements
- **§24.3** (Verification, lines 2478-2510): Claim verification criteria
- **§25** (Analytics, lines 2500-2550): Platform analytics architecture
- **§26** (Integrations, lines 2546-2600): Integration requirements

---

## 2. Phase 7 Features Breakdown

### 2.1 Business Claim & Verification (Spec §13.1, §24.3)

**Purpose:** Verify that a user is the legitimate owner of a business profile before granting management access.

**Verification Methods:**

| Method | Process | Approval | Timeline | Use Case |
|--------|---------|----------|----------|----------|
| **Phone** | Automated call with PIN | Auto | 10 min PIN | Small businesses, quick verification |
| **Email** | Domain email link | Auto | 24 hr link | Tech-savvy businesses with email |
| **Document** | ABN/utility bill upload | Moderator | 5 business days | Formal verification |
| **Google Business** | GMB OAuth connect | Auto | Immediate | Already verified with Google |

**Claim Flow:**

```
User visits unclaimed business profile
    ↓
Clicks "Claim This Business" button
    ↓
Modal shows verification options
    ↓
User selects method:
    ├─ Phone: Enter phone, receive PIN call, verify PIN
    ├─ Email: Enter domain email, click link in inbox
    ├─ Document: Upload ABN/utility bill, await moderator
    └─ Google: Click "Connect Google Business", OAuth flow
    ↓
Verification complete or in review
    ↓
If approved: User becomes business owner
    ↓
Complete 7-step profile wizard
```

**Business Rules:**
- Only unclaimed businesses can be claimed
- Phone PIN valid for exactly 10 minutes
- Max 3 failed PIN attempts before 1-hour lockout
- Email verification link valid for 24 hours
- Document claims need moderator decision within 5 days
- One active claim per business per user
- Rejected claims can be resubmitted after 30 days
- Appeal available within 30 days of rejection

**Ownership Management (Future):**
- Support multiple owners per business
- Staff accounts (subordinate to owner)
- Ownership transfer workflow
- Owner removal/revocation with audit

**Notification Flow:**
- Verification start: Confirmation email/SMS
- Verification success: Welcome email + dashboard access
- Document review: Status update emails
- Rejection: Email with reason + appeal instructions

---

### 2.2 Business Owner Dashboard (Spec §13.2)

**Purpose:** Provide business owners with quick overview of their business performance and easy access to key tasks.

**Dashboard Layout:**

```
┌─────────────────────────────────────────────────┐
│ Business Owner Dashboard                        │
├─────────────────────────────────────────────────┤
│  [Welcome, Name] | [Profile] | [Settings] | [Logout]  │
├─────────────────────────────────────────────────┤
│                                                 │
│ ┌───────────────┐  ┌───────────────┐  ┌────┐ │
│ │ Profile       │  │ Views This    │  │⚡ │ │
│ │ Complete      │  │ Week          │  │  │ │
│ │ 75%           │  │ 342           │  │  │ │
│ └───────────────┘  │ ↑ 22%         │  │  │ │
│                     └───────────────┘  │  │ │
│                                        │  │ │
│ ┌──────────────────────────────────┐  │  │ │
│ │ Recent Reviews (3 Unresponded)    │  │Q │ │
│ │ ⭐⭐⭐⭐⭐ "Best pizza!" - 2 hrs  │  │u │ │
│ │ ⭐⭐⭐⭐ "Good service" - 1 day   │  │i │ │
│ └──────────────────────────────────┘  │c │ │
│                                        │k │ │
│ [View All Reviews]                     │  │ │
│                                        └────┘ │
├─────────────────────────────────────────────────┤
│ Upcoming Events | Active Promotions | Messages │
└─────────────────────────────────────────────────┘
```

**Dashboard Widgets:**

1. **Profile Completeness**
   - Percentage progress (0-100%)
   - List of incomplete fields
   - CTA: "Complete Your Profile" button
   - Links to 7-step profile wizard

2. **Profile Views Metrics**
   - "Views Today" (today's count)
   - "Views This Week" (week total)
   - Week-over-week comparison with ↑/↓ indicator
   - Percentage change from previous week
   - Mini chart showing daily trend

3. **Recent Reviews Summary**
   - Latest 3 reviews displayed
   - Star rating visible
   - Review text preview (truncated)
   - Response status badge (Responded/Awaiting Response)
   - Avatar and reviewer name
   - CTA: "View All Reviews" + "Respond" buttons
   - Unresponded count prominently shown

4. **Upcoming Events**
   - Events linked to this business
   - Event date and title
   - RSVP/attendance count
   - Status: Upcoming/Ongoing/Ended

5. **Active Promotions**
   - Current deals status
   - Expiration date
   - Redemption count
   - Performance indicator (clicks)

6. **Messages Summary**
   - Unread enquiry count (badge)
   - Response rate percentage (e.g., "92% response")
   - Latest message preview
   - CTA: "Go to Messages"

**Quick Action Links:**
- Edit Profile
- Upload Photos
- Create Event
- Create Promotion
- View Analytics
- Manage Team

---

### 2.3 Business Profile Management (Spec §13.3)

**Purpose:** Allow business owners to maintain and update their complete business information.

**Profile Completion Wizard (7 Steps):**

1. **Basic Information**
   - Business name (required, max 100 chars)
   - Short description (required, max 500 chars)
   - Primary category (required, dropdown)
   - Secondary categories (optional, max 3 selections)

2. **Contact Details**
   - Phone number (required, validated)
   - Secondary phone (optional)
   - Email (required, validated)
   - Website (optional, URL validation)

3. **Address**
   - Street address (required)
   - Suburb/City (required, dropdown)
   - Postcode (required, validated)
   - Business type: physical/online/both (required)

4. **Operating Hours**
   - Time open/close per day (required)
   - Closed days (optional)
   - Special hours per date (optional)
   - Timezone handling (automatic from location)

5. **Visual Identity**
   - Logo upload (required, with cropping)
   - Cover photo (required, with cropping)
   - Photo gallery (optional, max 50 photos)

6. **Details & Features**
   - Detailed description/about (rich text, max 2000 chars)
   - Price range (optional, dropdown: $/$$/$$$/$$$$)
   - Year established (optional, year picker)
   - Parking information (optional, text)

7. **Additional Information**
   - Languages spoken (multi-select)
   - Certifications (multi-select: Halal, Kosher, Vegan, etc.)
   - Accessibility features (multi-select)
   - Payment methods (multi-select)

**Profile Editing Features (Post-Wizard):**

| Feature | Details | Constraints |
|---------|---------|-------------|
| **Text Fields** | Name, description, details | Max char enforced, live count |
| **Logo Upload** | Square image with crop | WebP, <5MB, 800x800px output |
| **Cover Photo** | Wide image with crop | WebP, <10MB, 1200x400px output |
| **Photo Gallery** | Upload, reorder, delete | Max 50 photos, alt text required |
| **Operating Hours** | Day-by-day with exceptions | Timezone-aware, special hours |
| **Social Links** | Facebook, Instagram, Twitter, LinkedIn, TikTok, YouTube | URL validation |
| **Menu/Price List** | PDF upload | Max 10MB, PDF only |
| **Languages** | Multi-select from 50+ languages | Accessibility feature |
| **Certifications** | Halal, Kosher, Vegan, Organic, Fair Trade, etc. | Display as badges |
| **Accessibility** | Wheelchair, accessible parking, ASL, etc. | Display on profile |
| **Payment Methods** | Cash, Card, Mobile, Bank Transfer, etc. | Display on profile |

**Validation Rules:**
- Business name: Required, 1-100 chars, no HTML
- Description: Required, 1-500 chars (wizard), 2000 chars (full), no HTML
- Phone: E.164 format, Australian numbers valid
- Email: Standard email validation
- Website: URL validation with http(s) protocol
- Images: JPG/PNG only, <5MB, safe MIME types
- PDFs: PDF only, <10MB, scanned for malware
- Categories: At least 1 required, max 4 total

**Save Behavior:**
- Auto-save drafts to local storage while editing
- Confirmation before discarding unsaved changes
- Success toast on save
- Audit trail: timestamp and owner recorded

---

### 2.4 Business Analytics Dashboard (Spec §13.4, Appendix B.2)

**Purpose:** Provide detailed business performance metrics to help owners understand customer engagement.

**Key Metrics Tracked:**

| Metric | Definition | Format | Time Range |
|--------|-----------|--------|-----------|
| **Profile Views** | Total visits to business profile (unique per day) | Count | Today, 7d, 30d, 12m, custom |
| **Search Appearances** | Times shown in search results | Count | Same |
| **Website Clicks** | Outbound clicks to website URL | Count | Same |
| **Phone Clicks** | Click-to-call action usage | Count | Same |
| **Direction Requests** | Maps/directions button clicks | Count | Same |
| **Photo Views** | Gallery photo views | Count | Same |
| **Saves** | Times saved to user's saved list | Count | Same |
| **Follows** | Current follower count + new follows | Count | Same |
| **Reviews** | Total review count + new reviews | Count | Same |
| **Rating** | Average star rating | 0-5 stars (1 decimal) | Same |

**Analytics Dashboard Layout:**

```
┌─────────────────────────────────────────────┐
│ Business Analytics                          │
│                                             │
│ Date Range: [Today ▼] [Last 7 Days ▼]      │
│           [Last 30 Days ▼] [Custom ...]     │
│                                             │
│ Comparison: This period vs last period ▼    │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│ ┌─────────────────────────────────────┐   │
│ │ Profile Views        342             │   │
│ │ Line chart trend                     │   │
│ │ +22% vs previous period              │   │
│ └─────────────────────────────────────┘   │
│                                             │
│ ┌─────────────────────────────────────┐   │
│ │ Search Impressions   1,204           │   │
│ │ Bar chart by day                     │   │
│ │ -5% vs previous period               │   │
│ └─────────────────────────────────────┘   │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│ Action Breakdown:                           │
│ ├─ Website Clicks: 45 (↑15%)               │
│ ├─ Phone Clicks: 28 (↑8%)                  │
│ ├─ Directions: 67 (↑22%)                   │
│ └─ Photo Views: 189 (↑12%)                 │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│ Reviews & Rating:                           │
│ ├─ Total Reviews: 127 (↑3)                 │
│ ├─ New This Period: 5 reviews               │
│ ├─ Average Rating: ⭐ 4.6                  │
│ └─ Rating Distribution: [histogram]        │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│ Audience Insights:                          │
│ ├─ Followers: 342 (↑15)                    │
│ ├─ Top Referral Source: Search Results     │
│ ├─ Peak Activity: Wed 6-8PM                │
│ └─ Geographic: [Map breakdown]             │
│                                             │
├─────────────────────────────────────────────┤
│ [📊 Export CSV] [📄 Export PDF] [🔄 Refresh]
└─────────────────────────────────────────────┘
```

**Analytics Features:**

1. **Date Range Selection**
   - Preset: Today, Last 7 Days, Last 30 Days, Last 12 Months
   - Custom range: From date → To date (max 3 years)
   - Compare to: Previous period (auto-calculated)

2. **Visualizations**
   - Line charts (views trend over time)
   - Bar charts (daily/weekly/monthly breakdown)
   - Pie charts (action breakdown)
   - Heatmap (peak activity times)
   - Histogram (rating distribution)
   - Geographic map (by suburb/region)

3. **Metrics Display**
   - Large KPI cards with trend indicators
   - Percentage change from previous period
   - Color coding: Green (↑), Red (↓), Gray (→)
   - Data table alternative for screen readers

4. **Data Export**
   - CSV download: All metrics in spreadsheet format
   - PDF report: Formatted report with charts and summary
   - Download token (single-use for security)
   - Audit logging of exports

5. **Real-time Updates**
   - Auto-refresh every 5 minutes
   - Manual refresh button
   - Last updated timestamp
   - Loading indicators

**API Endpoint:**

```
GET /businesses/:id/analytics
Authentication: Owner or Admin
Parameters:
  - startDate: ISO 8601 date (required)
  - endDate: ISO 8601 date (required)
  - metric: Specific metric to fetch (optional)
  - granularity: 'day' | 'week' | 'month' (default: auto)

Response:
{
  businessId: string
  period: { startDate, endDate }
  metrics: {
    profileViews: { current, previous, change% }
    searchAppearances: { current, previous, change% }
    clicks: {
      website: { current, previous, change% }
      phone: { current, previous, change% }
      directions: { current, previous, change% }
    }
    photoViews: { current, previous, change% }
    saves: { current, previous, change% }
    follows: { current, previous, change% }
    reviews: { current, previous, change% }
    rating: { current, previous, change }
  }
  timeseries: [
    { date, profileViews, searchAppearances, ... }
  ]
  topSearchTerms: [
    { term, count, trend }
  ]
  referralSources: [
    { source, count, percentage }
  ]
  peakTimes: [
    { dayOfWeek, hour, views }
  ]
}
```

---

## 3. Data Models

### 3.1 Existing Models Used

**Business** (Appendix A.1)
```
Fields used by Phase 7:
- id, name, slug, description
- categoryPrimaryId, categoriesSecondary[]
- address, suburb, postcode, phone, email, website, secondaryPhone
- operatingHours: JSON
- logo, coverPhoto
- gallery: string[] (photo URLs)
- socialLinks: JSON { facebook?, instagram?, ... }
- languagesSpoken: string[]
- certifications: string[]
- paymentMethods: string[]
- accessibilityFeatures: string[]
- priceRange: '$'|'$$'|'$$$'|'$$$$'
- parkingInformation: string
- yearEstablished: number
- status, claimed, claimedBy (userId), claimedByUser (FK)
- verifiedAt: DateTime
- timezone: string
- featured, displayOrder
- createdAt, updatedAt
```

**User** (Appendix A.2)
```
Fields used by Phase 7:
- id, email, passwordHash, displayName, profilePhoto
- languagePreference
- role: 'COMMUNITY' | 'BUSINESS_OWNER' | 'MODERATOR' | 'ADMIN' | 'SUPER_ADMIN'
- status: 'active' | 'suspended' | 'deleted'
- emailVerified: boolean
- createdAt, updatedAt, lastLogin
```

### 3.2 New Models Required

**BusinessClaimRequest** (Tracking claim attempts)

```prisma
model BusinessClaimRequest {
  id                    String    @id @default(cuid())
  businessId            String
  business              Business  @relation(fields: [businessId], references: [id])
  userId                String
  user                  User      @relation(fields: [userId], references: [id])

  verificationMethod    String    // 'phone' | 'email' | 'document' | 'google_business'
  verificationToken     String?   // For email verification links
  verificationCode      String?   // PIN for phone calls (hashed)
  verificationAttempts  Int       @default(0)
  verificationStatus    String    // 'pending' | 'verified' | 'failed'

  // Document upload specific
  documentType          String?   // 'abn' | 'utility_bill'
  documentUrls          String[]  // Array of file URLs

  // Google Business specific
  googleBusinessId      String?   // Google Business Profile ID

  // Moderation workflow
  claimStatus           String    // 'pending' | 'approved' | 'rejected'
  moderatorId           String?   // FK to User (moderator who reviewed)
  moderator             User?     @relation("ClaimModerator", fields: [moderatorId], references: [id])
  moderatorNotes        String?   // Reason for rejection/approval
  decisionDate          DateTime?

  // Audit
  ipAddress             String?
  userAgent             String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  @@unique([businessId, userId]) // One active claim per business per user
  @@index([businessId])
  @@index([userId])
  @@index([verificationStatus])
  @@index([claimStatus])
}
```

**BusinessAnalyticsEvent** (Tracking all metrics)

```prisma
model BusinessAnalyticsEvent {
  id                    String    @id @default(cuid())
  businessId            String
  business              Business  @relation(fields: [businessId], references: [id])

  eventType             String    // 'profile_view' | 'search_appearance' | 'website_click' | 'phone_click' | 'direction_request' | 'photo_view' | 'save' | 'follow' | 'review_created'

  userId                String?   // FK to User (null for anonymous)
  user                  User?     @relation(fields: [userId], references: [id])

  // Event details
  referralSource        String?   // 'search' | 'homepage' | 'saved_list' | 'direct' | 'external'
  searchTerm            String?   // If from search
  userAgent             String?   // Device/browser info (not PII)
  ipAddressHash         String?   // Hashed IP (anonymized after 90 days)
  geolocation           String?   // Suburb/city

  eventDate             DateTime  @default(now())

  // For cleanup
  createdAt             DateTime  @default(now())

  @@index([businessId])
  @@index([eventDate])
  @@index([eventType])
  @@index([userId])
}
```

**BusinessOwnerStaff** (Future: For team accounts)

```prisma
model BusinessOwnerStaff {
  id                    String    @id @default(cuid())
  businessId            String
  business              Business  @relation(fields: [businessId], references: [id])

  userId                String
  user                  User      @relation(fields: [userId], references: [id])

  role                  String    // 'manager' | 'staff' | 'viewer'
  permissions           String[]  // Array of permission flags

  addedBy               String    // Owner who added this staff member
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  @@unique([businessId, userId])
}
```

---

## 4. API Endpoints (Appendix B.2)

### 4.1 Core Phase 7 Endpoints

#### POST /businesses/:id/claim
**Claim a business ownership**

```
POST /businesses/:id/claim
Authentication: User (authenticated)
Body: {
  verificationMethod: 'phone' | 'email' | 'document' | 'google_business'

  // If phone:
  phoneNumber?: string (E.164 format)

  // If email:
  businessEmail?: string (must be @company domain)

  // If document:
  documentType?: 'abn' | 'utility_bill'
  documents?: File[] (multipart upload)

  // If google_business:
  googleBusinessCode?: string (OAuth code)
}

Response 201:
{
  claimRequestId: string
  status: 'pending' | 'verified' | 'awaiting_moderator'
  verificationMethod: string

  // Phone-specific
  pinToken?: string (for verifying PIN)
  pinExpiresAt?: DateTime (10 minutes)

  // Email-specific
  verificationToken?: string (for email link)
  verificationTokenExpiresAt?: DateTime (24 hours)

  // Document-specific
  moderationEstimate?: string (e.g., "5 business days")

  message: string
}

Errors:
- 400: BUSINESS_ALREADY_CLAIMED | INVALID_METHOD | INVALID_EMAIL | FILE_TOO_LARGE
- 401: UNAUTHENTICATED
- 404: BUSINESS_NOT_FOUND
- 409: CLAIM_ALREADY_PENDING
```

#### GET /businesses/:id/analytics
**Get business analytics data**

```
GET /businesses/:id/analytics?startDate=2026-03-01&endDate=2026-03-03
Authentication: Owner or Admin
Query Parameters:
  - startDate: ISO 8601 date (required)
  - endDate: ISO 8601 date (required)
  - metric?: Specific metric ('profile_views', 'search_appearances', etc.)
  - granularity?: 'day' | 'week' | 'month' (default: auto)

Response 200:
{
  businessId: string
  businessName: string
  period: {
    startDate: DateTime
    endDate: DateTime
    previousStart: DateTime (auto-calculated for comparison)
    previousEnd: DateTime
  }
  summary: {
    profileViews: {
      current: number
      previous: number
      changePercent: number
      trend: 'up' | 'down' | 'flat'
    }
    searchAppearances: { current, previous, changePercent, trend }
    clicks: {
      website: { current, previous, changePercent, trend }
      phone: { current, previous, changePercent, trend }
      directions: { current, previous, changePercent, trend }
      total: { current, previous, changePercent, trend }
    }
    photoViews: { current, previous, changePercent, trend }
    saves: { current, previous, changePercent, trend }
    follows: { current, previous, changePercent, trend }
    reviews: {
      count: { current, previous, changePercent, trend }
      averageRating: number (1-5, 1 decimal)
      newReviews: number
    }
  }
  timeseries: [
    {
      date: DateTime
      profileViews: number
      searchAppearances: number
      clicks: { website, phone, directions, total }
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

Errors:
- 400: INVALID_DATE_RANGE | DATE_RANGE_TOO_LARGE
- 401: UNAUTHENTICATED
- 403: INSUFFICIENT_PERMISSIONS (not owner/admin)
- 404: BUSINESS_NOT_FOUND
```

#### GET /businesses/:id/inbox/analytics
**Get messaging analytics for business**

```
GET /businesses/:id/inbox/analytics?period=last_30_days
Authentication: Owner or Admin
Query Parameters:
  - period: 'today' | 'last_7_days' | 'last_30_days' | 'last_12_months'

Response 200:
{
  businessId: string
  period: string
  unreadCount: number
  totalConversations: number
  messageCount: number
  averageResponseTime: number (minutes)
  responseRate: number (percentage, 0-100)
  conversionRate: number (messages → bookings, 0-100)
  topInquiryTypes: [
    { type: string, count: number, percentage: number }
  ]
}

Errors:
- 401: UNAUTHENTICATED
- 403: INSUFFICIENT_PERMISSIONS
- 404: BUSINESS_NOT_FOUND
```

### 4.2 Supporting Endpoints (Existing, need expansion)

#### PUT /businesses/:id
**Update business information (Owner-controlled)**

```
PUT /businesses/:id
Authentication: Owner or Admin
Body: {
  name?: string
  description?: string
  detailedDescription?: string
  categoryPrimaryId?: string
  categoriesSecondary?: string[]
  phone?: string
  secondaryPhone?: string
  email?: string
  website?: string
  address?: string
  suburb?: string
  postcode?: string
  operatingHours?: JSON
  logo?: File (multipart)
  coverPhoto?: File (multipart)
  priceRange?: string
  yearEstablished?: number
  parkingInformation?: string
  socialLinks?: {
    facebook?: string
    instagram?: string
    twitter?: string
    linkedin?: string
    tiktok?: string
    youtube?: string
  }
  languagesSpoken?: string[]
  certifications?: string[]
  accessibilityFeatures?: string[]
  paymentMethods?: string[]
}

Response 200: Updated Business object

Errors:
- 400: VALIDATION_ERROR
- 401: UNAUTHENTICATED
- 403: INSUFFICIENT_PERMISSIONS
- 404: BUSINESS_NOT_FOUND
- 413: FILE_TOO_LARGE
```

#### POST /businesses/:id/photos
**Add photos to gallery**

```
POST /businesses/:id/photos
Authentication: Owner or Admin
Body: FormData with files

Response 201:
{
  photos: [
    {
      id: string
      url: string
      altText: string (default: "")
      order: number
    }
  ]
}

Errors:
- 400: FILE_TOO_LARGE | GALLERY_FULL (50 photo limit)
- 401: UNAUTHENTICATED
- 403: INSUFFICIENT_PERMISSIONS
- 404: BUSINESS_NOT_FOUND
```

#### PUT /businesses/:id/photos/:photoId
**Update photo metadata**

```
PUT /businesses/:id/photos/:photoId
Body: {
  altText?: string
  order?: number
}

Response 200: Updated Photo object
```

#### DELETE /businesses/:id/photos/:photoId
**Delete photo from gallery**

```
DELETE /businesses/:id/photos/:photoId

Response 204: No content
```

---

## 5. Architecture & Configuration

### 5.1 Location-Agnostic Considerations

**Phase 7 has NO location-specific hardcoding requirements** - All features are generic and work across any suburb/region.

**Configuration in `config/platform.json`:**

```json
{
  "features": {
    "businessOwnerClaiming": true,
    "businessAnalytics": true,
    "businessDashboard": true,
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
    "exportMaxRangeDays": 1095
  }
}
```

**Environment Variables (`.env`):**

```bash
# Twilio (Phone verification)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# PDF Export Service
PDF_SERVICE_URL= # or use local jsPDF/pdfkit
PDF_SERVICE_API_KEY=

# Analytics Chart Library (if cloud-based)
CHARTS_API_URL=
CHARTS_API_KEY=

# Google Business Profile Integration (Phase 7)
GOOGLE_BUSINESS_CLIENT_ID=
GOOGLE_BUSINESS_CLIENT_SECRET=
GOOGLE_BUSINESS_REDIRECT_URI=
```

### 5.2 File Storage Architecture

**S3/Cloud Storage Paths:**

```
/businesses/{businessId}/
├── logo.webp (optimized)
├── cover-photo.webp (optimized)
└── gallery/
    ├── photo-1.webp
    ├── photo-2.webp
    └── ...

/business-documents/{claimRequestId}/
├── document-1.pdf (ABN, utility bill)
├── document-2.pdf
└── metadata.json
```

---

## 6. Business Rules & Constraints

### Claim Process Rules

1. **Eligibility**
   - Only unclaimed businesses can be claimed
   - User must have verified email address
   - One active claim per business per user

2. **Phone Verification**
   - PIN is 6-8 random digits
   - Valid for exactly 10 minutes
   - SMS sent to number (e.g., "[App]: Your verification code is 123456")
   - Max 3 failed attempts → 60-minute lockout
   - Twilio integration for automated calls

3. **Email Verification**
   - Must be @businessdomain.com email
   - Verification link valid for 24 hours
   - Can only verify with email domain matching business website
   - Tokens use JWT with expiry

4. **Document Verification**
   - Supported: ABN certificate (ASIC), utility bill
   - Files: PDF only, <10MB, scanned for malware
   - Moderator decision within 5 business days
   - Rejection reason provided to applicant
   - Appeal window: 30 days

5. **Google Business Verification**
   - OAuth flow connects verified GMB account
   - Automatic approval if GMB account matches business address
   - Token stored securely (encrypted)

6. **After Verification**
   - User becomes business owner in database
   - Owner completes 7-step profile wizard
   - Gets access to owner dashboard
   - Receives welcome email

### Profile Management Rules

1. **Required Fields**
   - Business name (1-100 chars)
   - Primary category (1 required)
   - Phone number (valid format)
   - Email (valid format)
   - Address (street, suburb, postcode)
   - Operating hours (days/times)

2. **Image Constraints**
   - Logo: 1:1 ratio, 800x800px (output), WebP, <5MB input
   - Cover: 3:1 ratio, 1200x400px (output), WebP, <10MB input
   - Gallery: 4:3 ratio, 800x600px (output), WebP, <5MB each, max 50
   - All include alt text (required for accessibility)

3. **Text Content**
   - No HTML allowed (sanitized)
   - Markdown not supported
   - Multilingual: Must be provided in all active languages OR use default
   - Max character counts enforced

4. **Save Behavior**
   - Draft auto-save to localStorage
   - Database save on explicit save action
   - Timestamps tracked for audits
   - Unsaved changes warning on exit

### Analytics Rules

1. **Data Tracking**
   - Profile views: Counted once per user per day (unique user tracking)
   - Anonymous views: Tracked by IP hash (anonymized)
   - Search appearances: Counted every time in results
   - All clicks tracked: Website, phone, directions, photos

2. **Data Retention**
   - Events stored for 3 years minimum
   - IP address hashing after 90 days (GDPR/privacy)
   - User-agent kept for analytics (not PII)
   - Personally identifying data avoided

3. **Access Control**
   - Only owner can view own analytics
   - Admins can view all
   - Moderators: No access
   - Public: No access

4. **Export**
   - CSV: Raw data, all metrics, date range selectable
   - PDF: Formatted report with charts, summary, date range
   - One-time download tokens for security
   - Audit logged: Who, when, what date range

### Review Response Rules (Integration with Phase 6)

1. **Responses**
   - Owner can respond to reviews
   - Response max 500 characters
   - Edit/delete own responses (within 30 days)
   - No moderation required (unless configured)

2. **Visibility**
   - Response displayed below review
   - Noted as "Business Owner Response"
   - Timestamps shown

3. **Notifications**
   - Reviewer notified when owner responds
   - Dashboard shows unresponded count

---

## 7. Internationalization (i18n)

### Translation Keys Required

**Owner Module Keys:**

```javascript
// Dashboard
owner.dashboard.title
owner.dashboard.welcome
owner.dashboard.profileCompleteness
owner.dashboard.completeProfile
owner.dashboard.viewsThisWeek
owner.dashboard.viewsToday
owner.dashboard.comparison.upPercent
owner.dashboard.comparison.downPercent
owner.dashboard.recentReviews
owner.dashboard.unrespondedCount
owner.dashboard.viewAllReviews
owner.dashboard.respondButton
owner.dashboard.upcomingEvents
owner.dashboard.activePromotions
owner.dashboard.messages
owner.dashboard.unreadCount
owner.dashboard.responseRate

// Claim Process
owner.claim.button
owner.claim.modal.title
owner.claim.modal.description
owner.claim.selectMethod
owner.claim.method.phone
owner.claim.method.email
owner.claim.method.document
owner.claim.method.googleBusiness
owner.claim.phone.enterNumber
owner.claim.phone.sendPin
owner.claim.phone.enterPin
owner.claim.phone.pinSent
owner.claim.phone.invalidPin
owner.claim.phone.tooManyAttempts
owner.claim.email.enterEmail
owner.claim.email.sendLink
owner.claim.email.checkInbox
owner.claim.email.linkExpired
owner.claim.document.selectType
owner.claim.document.abn
owner.claim.document.utilityBill
owner.claim.document.upload
owner.claim.document.uploaded
owner.claim.document.reviewPending
owner.claim.document.reviewEstimate
owner.claim.googleBusiness.connect
owner.claim.success
owner.claim.successMessage
owner.claim.pending
owner.claim.pendingMessage
owner.claim.rejected
owner.claim.rejectedMessage
owner.claim.appealWindow
owner.claim.appeal

// Profile Management
owner.profile.edit
owner.profile.wizard.title
owner.profile.wizard.step
owner.profile.wizard.stepName.basicInfo
owner.profile.wizard.stepName.contact
owner.profile.wizard.stepName.address
owner.profile.wizard.stepName.hours
owner.profile.wizard.stepName.visual
owner.profile.wizard.stepName.details
owner.profile.wizard.stepName.additional
owner.profile.basicInfo
owner.profile.businessName
owner.profile.businessNameHelp
owner.profile.description
owner.profile.descriptionHelp
owner.profile.primaryCategory
owner.profile.secondaryCategories
owner.profile.contact
owner.profile.phone
owner.profile.secondaryPhone
owner.profile.email
owner.profile.website
owner.profile.address
owner.profile.suburb
owner.profile.postcode
owner.profile.operatingHours
owner.profile.dayOfWeek.monday
owner.profile.dayOfWeek.tuesday
owner.profile.dayOfWeek.wednesday
owner.profile.dayOfWeek.thursday
owner.profile.dayOfWeek.friday
owner.profile.dayOfWeek.saturday
owner.profile.dayOfWeek.sunday
owner.profile.timeOpen
owner.profile.timeClose
owner.profile.closed
owner.profile.specialHours
owner.profile.specialHoursDate
owner.profile.logo
owner.profile.logoHelp
owner.profile.uploadLogo
owner.profile.coverPhoto
owner.profile.coverPhotoHelp
owner.profile.uploadCover
owner.profile.gallery
owner.profile.galleryHelp
owner.profile.uploadPhotos
owner.profile.galleryFull
owner.profile.maxPhotos
owner.profile.altText
owner.profile.altTextHelp
owner.profile.moveUp
owner.profile.moveDown
owner.profile.deletePhoto
owner.profile.detailedDescription
owner.profile.detailedDescriptionHelp
owner.profile.priceRange
owner.profile.priceRange.$
owner.profile.priceRange.$$
owner.profile.priceRange.$$$
owner.profile.priceRange.$$$$
owner.profile.yearEstablished
owner.profile.parkingInformation
owner.profile.languagesSpoken
owner.profile.certifications
owner.profile.accessibilityFeatures
owner.profile.paymentMethods
owner.profile.save
owner.profile.saved
owner.profile.saving
owner.profile.error
owner.profile.validation.required
owner.profile.validation.invalid
owner.profile.validation.minChars
owner.profile.validation.maxChars
owner.profile.validation.fileSize
owner.profile.validation.fileType

// Analytics
owner.analytics.title
owner.analytics.dateRange
owner.analytics.preset.today
owner.analytics.preset.last7Days
owner.analytics.preset.last30Days
owner.analytics.preset.last12Months
owner.analytics.preset.custom
owner.analytics.comparison
owner.analytics.comparisonVs
owner.analytics.profileViews
owner.analytics.searchAppearances
owner.analytics.clicks
owner.analytics.clicks.website
owner.analytics.clicks.phone
owner.analytics.clicks.directions
owner.analytics.clicks.total
owner.analytics.photoViews
owner.analytics.saves
owner.analytics.follows
owner.analytics.reviews
owner.analytics.reviewsNew
owner.analytics.rating
owner.analytics.ratingAverage
owner.analytics.insights
owner.analytics.topSearchTerms
owner.analytics.referralSources
owner.analytics.peakActivityTimes
owner.analytics.export
owner.analytics.exportCsv
owner.analytics.exportPdf
owner.analytics.exported
owner.analytics.refresh
owner.analytics.noData
owner.analytics.trend.up
owner.analytics.trend.down
owner.analytics.trend.flat

// Errors
owner.error.businessNotFound
owner.error.claimAlreadyExists
owner.error.verificationFailed
owner.error.fileTooBig
owner.error.invalidFile
owner.error.invalidEmail
owner.error.invalidPhone
owner.error.invalidUrl
```

### Language Support

**10 Languages** (RTL: Arabic, Urdu)
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

**Implementation Pattern:**

```typescript
import { useTranslation } from 'react-i18next';

export function BusinessDashboard() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('owner.dashboard.title')}</h1>
      <p>{t('owner.dashboard.welcome', { name: ownerName })}</p>
    </div>
  );
}
```

---

## 8. Accessibility Requirements (WCAG 2.1 AA)

### Dashboard Accessibility

- [ ] Keyboard navigation: Tab through all metrics, filters, buttons
- [ ] Focus indicators: 2px outline on keyboard navigation
- [ ] ARIA labels: All chart elements labeled for screen readers
- [ ] Skip to main content link
- [ ] Color contrast: All text >4.5:1 ratio
- [ ] Touch targets: Minimum 44px for all buttons/links
- [ ] Data table alternative: Numeric data in accessible tables
- [ ] Loading states: Screen reader announcements

### Forms Accessibility

- [ ] All labels associated with inputs (< for>)
- [ ] Error messages linked to fields via aria-describedby
- [ ] Required indicators accessible to screen readers
- [ ] File input helpers: Clear format/size requirements
- [ ] Progress bar: Semantic HTML + ARIA
- [ ] Form submission: Confirm/success messages announced

### Photo Management

- [ ] Drag-drop alternative: Button-based upload
- [ ] Keyboard-accessible reordering: Arrow keys
- [ ] Delete confirmation: Dialog not just visual
- [ ] Alt text: Input field labeled and required
- [ ] Preview: Available to all users

### Charts & Data Visualization

- [ ] Not color-dependent (use patterns, symbols)
- [ ] Data table view toggle
- [ ] Alt text on chart images
- [ ] Numeric values always displayed
- [ ] Trend indicators: ↑/↓ symbols + text

### Testing Tools

- jest-axe (automated, >400 component tests)
- Manual testing: NVDA, JAWS, VoiceOver
- Keyboard-only navigation testing
- Color contrast verification

---

## 9. Security Requirements

### Authentication & Authorization

**Owner Access Control:**
```typescript
// Middleware to verify owner/admin access
async function requireBusinessOwnership(req, res, next) {
  const user = req.user;
  const businessId = req.params.id;

  // Must be owner of business OR admin/moderator
  const isOwner = business.claimedBy === user.id;
  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: 'INSUFFICIENT_PERMISSIONS' });
  }

  next();
}
```

### Claim Verification Security

**Phone Verification:**
- PIN: 6-8 cryptographically random digits (crypto.randomInt)
- Expiry: Exactly 10 minutes (tracked via token timestamp)
- Throttling: Max 3 attempts per phone number per hour
- Lockout: 60-minute temporary block after max attempts
- Token Storage: Hashed PIN in database (bcrypt)
- SMS Template: No sensitive data in SMS

**Email Verification:**
- Token: JWT with 24-hour expiry
- Secret: From environment variable
- URL: Includes single-use token
- Domain Validation: Extract domain from website URL match against email

**Document Verification:**
- File Type: PDF only (not .doc, .docx, .txt)
- Size: <10MB enforced on upload
- Malware Scan: ClamAV or similar integration
- Storage: Encrypted at rest (AES-256-GCM)
- Cleanup: Auto-delete after decision or 90 days

**Google Business OAuth:**
- Token: Stored encrypted in database
- Validation: Verify token with Google API before approval
- Scope: Minimal (read-only business info)
- Refresh: Handle token refresh before expiry

### Rate Limiting

```javascript
// Phone verification: 5 attempts per phone number per hour
phoneVerificationLimiter = rateLimit({
  key: req.body.phoneNumber,
  windowMs: 3600000,
  max: 5,
  message: 'TOO_MANY_VERIFICATION_ATTEMPTS'
});

// Email verification: 3 attempts per email per hour
emailVerificationLimiter = rateLimit({
  key: req.body.businessEmail,
  windowMs: 3600000,
  max: 3,
  message: 'TOO_MANY_VERIFICATION_ATTEMPTS'
});

// Analytics export: 10 per business per hour
analyticsExportLimiter = rateLimit({
  key: req.params.id,
  windowMs: 3600000,
  max: 10,
  message: 'EXPORT_RATE_LIMIT_EXCEEDED'
});
```

### Data Protection

**Analytics Data:**
- IP Address: Hashed with bcrypt, auto-deleted after 90 days
- User-Agent: Kept as-is (not personally identifying)
- Sensitive Data: None in analytics (no passwords, emails)
- Encryption: All data encrypted at rest (AES-256-GCM for PII)

**Exports:**
- Download Token: Single-use JWT token
- HTTPS Only: Enforced via middleware
- Content Type: application/octet-stream (force download)
- Filename: Includes business name + date (no PII)

**Audit Logging:**
```javascript
// Log all sensitive operations
auditLog({
  action: 'BUSINESS_CLAIM_REQUEST',
  userId: user.id,
  businessId: business.id,
  verificationMethod: method,
  timestamp: new Date(),
  ipAddress: req.ip,
  userAgent: req.get('user-agent'),
  result: 'success'|'failure'
});
```

### Input Validation & Sanitization

**Form Inputs:**
- XSS Prevention: DOMPurify library
- No HTML: Strip HTML tags from text fields
- URL Validation: URL constructor throws on invalid
- Email Validation: RFC 5322 regex
- Phone: E.164 international format only

**File Uploads:**
- MIME Type: Check magic bytes, not extension
- Size: Enforce max size on upload
- Dimensions: Validate image dimensions
- Filename: Sanitize (remove path traversal)

**API Responses:**
- Output Encoding: JSON.stringify escapes by default
- XSS: Avoid eval, innerHTML with user data
- CSRF: Check origin header on mutations

### OWASP Top 10 Coverage

| Risk | Mitigation |
|------|-----------|
| **Injection** | Parameterized queries (Prisma), input validation |
| **Broken Auth** | JWT + HttpOnly cookies, rate limiting, email verification |
| **Sensitive Data** | Encryption at rest, HTTPS only, PII anonymization |
| **XML External Entities** | No XML processing (JSON only) |
| **Broken Access Control** | requireBusinessOwnership middleware, role checks |
| **Security Misconfiguration** | CSP/HSTS headers, secure defaults in config |
| **XSS** | DOMPurify, output encoding, no innerHTML |
| **Deserialization** | JSON only, no pickle/serialize untrusted data |
| **Using Components with Known Vulnerabilities** | Dependabot, npm audit |
| **Insufficient Logging** | Audit logging for all sensitive actions |

---

## 10. Current Implementation Status

### Implemented (From Codebase)

**Database:**
- ✅ Business model with claimed/claimedBy/verifiedAt
- ✅ User model with BUSINESS_OWNER role
- ✅ Category model
- ✅ Review model
- ✅ BusinessFollow model

**Backend API:**
- ✅ GET /businesses/:id (basic)
- ✅ PUT /businesses/:id (basic, limited fields)
- ✅ GET /businesses/:slug
- ✅ Review endpoints (Phase 6)
- ✅ Follow endpoints (Phase 6)

**Middleware:**
- ✅ Authentication middleware
- ✅ Authorization middleware
- ✅ Rate limiting (basic)
- ✅ CORS, CSP headers

**Frontend:**
- ✅ BusinessDetailPage
- ✅ User authentication UI
- ✅ Component library (Phase 3)

### NOT Implemented (Phase 7 Work Items)

**Backend - Endpoints:**
- ❌ POST /businesses/:id/claim
- ❌ GET /businesses/:id/analytics
- ❌ GET /businesses/:id/inbox/analytics
- ❌ Extended PUT /businesses/:id (full profile fields)
- ❌ POST /businesses/:id/photos
- ❌ Moderation queue endpoints

**Backend - Infrastructure:**
- ❌ BusinessClaimRequest model
- ❌ BusinessAnalyticsEvent model
- ❌ Analytics event tracking system
- ❌ Claim verification workflow (phone, email, document, GMB)
- ❌ Moderator review queue
- ❌ Claim appeal process
- ❌ Multiple owner support

**Backend - Integration:**
- ❌ Twilio integration (phone verification)
- ❌ Google Business API integration
- ❌ Email verification workflow
- ❌ Document scanning (malware)
- ❌ PDF/CSV export services

**Frontend - Pages:**
- ❌ Business Owner Dashboard
- ❌ Profile Management/Edit Page
- ❌ Analytics Dashboard
- ❌ Moderation Queue Page

**Frontend - Components:**
- ❌ Profile Completion Wizard (7 steps)
- ❌ Claim Modal
- ❌ Dashboard Widgets (6 widgets)
- ❌ Analytics Charts
- ❌ Photo Gallery Manager
- ❌ Operating Hours Editor
- ❌ Social Media Link Manager
- ❌ Export Functionality

**Testing:**
- ❌ Unit tests for claim logic
- ❌ Integration tests for verification
- ❌ E2E tests for dashboard
- ❌ Accessibility tests (jest-axe)

---

## 11. Phase Dependencies & Blocking

### Requires Completion Before Phase 7

1. **Phase 4 (Business Directory)** ✅
   - Business entity and endpoints
   - Business listing and detail pages
   - SEO metadata

2. **Phase 6 (User Engagement)** ✅
   - Review system (for response feature)
   - Follow system (for follower tracking)
   - Rating system

### Phase 7 Blocks

1. **Phase 10 (Deals & Promotions)**
   - Depends on owner verification
   - Depends on owner dashboard
   - Depends on business ownership

2. **Phase 13 (B2B Networking)**
   - Depends on verified business owners
   - Depends on team management

---

## 12. Key Files Reference

### Documentation
- `Docs/Community_Hub_Specification_v2.md` - Full spec §13
- `TODO.md` - Phase 7 task breakdown
- `PROGRESS.md` - Phase tracking

### Backend Code
- `packages/backend/prisma/schema.prisma` - Data models
- `packages/backend/src/routes/business.ts` - Business endpoints
- `packages/backend/src/middleware/business-ownership.js` - Owner verification
- `packages/backend/src/controllers/business-controller.ts` - Business logic

### Frontend Code
- `packages/frontend/src/pages/BusinessDetailPage.tsx`
- `packages/frontend/src/pages/` - (Dashboard, analytics pages to create)
- `packages/frontend/src/components/business/` - Business components
- `packages/frontend/src/i18n/locales/` - Translations (10 languages)

### Configuration
- `config/platform.json` - Feature flags, limits, verification settings
- `.env.example` - Environment variables template
- `packages/shared/src/config/platform-schema.ts` - Config validation

---

## 13. Development Workflow Recommendations

### Phase 7 Task Sequence (33 tasks)

**7.1 Foundation (Database & Models)**
1. Create BusinessClaimRequest migration
2. Create BusinessAnalyticsEvent migration
3. Add indexes for performance

**7.2 Claim System (9 tasks)**
4. Implement POST /businesses/:id/claim endpoint
5. Implement phone verification flow (Twilio)
6. Implement email verification flow
7. Implement document upload flow
8. Implement Google Business Profile verification
9. Moderator review queue backend
10. Claim approval/rejection logic
11. Appeals process
12. Notification emails

**7.3 Dashboard (8 tasks)**
13. Create Business Owner Dashboard page
14. Implement profile completeness widget
15. Implement profile views widget
16. Implement recent reviews widget
17. Implement promotions widget
18. Implement messages widget
19. Create profile completion wizard (7 steps)
20. Dashboard quick actions

**7.4 Profile Management (7 tasks)**
21. Extend PUT /businesses/:id endpoint
22. Create profile editing form
23. Logo/cover photo upload with cropping
24. Photo gallery manager (CRUD)
25. Operating hours editor
26. Social media link manager
27. Validation and save

**7.5 Analytics (5 tasks)**
28. Create analytics event tracking
29. Implement GET /businesses/:id/analytics endpoint
30. Analytics dashboard page
31. Charts and visualizations
32. CSV/PDF export

**7.6 Testing & QA (3 tasks)**
33. Comprehensive tests (>80% coverage)
34. Accessibility audit (WCAG 2.1 AA)
35. Security review

---

## Summary

**Phase 7 (Business Owner Features)** is a foundational phase enabling business owners to:

1. **Claim Ownership** - Verify they own a business (4 methods)
2. **Access Dashboard** - Real-time metrics and quick actions
3. **Manage Profile** - Edit business information (7-step wizard)
4. **View Analytics** - Comprehensive performance metrics
5. **Respond to Reviews** - Engage with customers (Phase 6 integration)

**Status:** 0/33 tasks (0%) - Ready to Begin (March 2026)
**Specification:** §13 + related sections
**Dependencies:** Phase 4 ✅, Phase 6 ✅ → Phase 10, 13 (blocked by Phase 7)
**Key Integrations:** Twilio, Google Business API, Mailgun, PDF/CSV export
**Languages:** 10 (Arabic/Urdu RTL support)
**Testing:** >80% coverage target (current platform: 1,290+ tests passing)
**Security:** AAA compliance, rate limiting, verification tokens, audit logging
**Accessibility:** WCAG 2.1 AA mandatory

