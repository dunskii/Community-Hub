# Community Hub Platform
## Development Roadmap

**Document Version:** 1.1
**Date:** January 2026
**Reference:** Community_Hub_Specification_v2.md

---

## Overview

This roadmap outlines the development phases for the Community Hub Platform. The platform will be built incrementally, delivering value at each phase while building towards the complete feature set defined in the specification.

### Development Principles

1. **Mobile-First** - All features designed for mobile first, then enhanced for larger screens
2. **Accessibility from Day One** - WCAG 2.1 AA compliance built in, not retrofitted
3. **Multilingual Foundation** - i18n architecture established in Phase 1, languages added progressively
4. **Security by Default** - Australian Privacy Principles compliance throughout
5. **Progressive Enhancement** - Core functionality works without JavaScript; enhanced with it

---

## Phase 1: Foundation & Core Infrastructure

### 1.1 Project Setup & Architecture

**Objective:** Establish the technical foundation for the entire platform.

#### Tasks

- [ ] **Development Environment**
  - Set up monorepo structure
  - Configure CI/CD pipelines (GitHub Actions or similar)
  - Set up development, staging, and production environments
  - Configure code quality tools (ESLint, Prettier, TypeScript)

- [ ] **Backend Infrastructure**
  - Set up PostgreSQL database with initial schema
  - Install Prisma ORM >= 7.3.0 (`prisma` and `@prisma/client`) — verify installed version meets minimum before proceeding
  - Set up Redis for caching and sessions
  - Configure local media storage on DigitalOcean Droplets
  - Implement RESTful API scaffolding
  - Set up Elasticsearch for search functionality

- [ ] **DigitalOcean Droplet Infrastructure**
  - Configure Nginx as reverse proxy with SSL termination (Cloudflare Origin Certificate)
  - Create Docker and Docker Compose configuration for all services
  - Configure UFW firewall rules (allow 80, 443, 22 only)
  - Set up server hardening (fail2ban, SSH key-only auth, disable root login)
  - Configure process management (PM2 or systemd) for application restarts
  - Set up automated PostgreSQL backups (pg_dump + WAL archiving, daily to separate volume)
  - Configure log rotation (logrotate for application and Nginx logs)
  - Set up basic monitoring (Prometheus + Grafana or DigitalOcean monitoring)

- [ ] **Cloudflare Setup**
  - Add domain to Cloudflare and update registrar nameservers
  - Configure DNS records (A record to Droplet, CNAME for www)
  - Enable SSL/TLS Full (Strict) mode with edge certificates
  - Generate Origin Certificate and install on Nginx
  - Configure caching rules (static assets, media, API bypass)
  - Enable WAF managed rules and DDoS protection
  - Set up Page Rules (force HTTPS, cache levels)
  - Configure API token for programmatic cache purge

- [ ] **Frontend Infrastructure**
  - Initialize React frontend with TypeScript
  - Configure responsive design system with breakpoints (Mobile < 768px, Tablet 768-1199px, Desktop ≥ 1200px)
  - Implement design tokens (colours, typography, spacing)
  - Set up component library foundation
  - Configure PWA manifest and service worker skeleton

- [ ] **i18n Foundation**
  - Implement translation file structure (JSON per language)
  - Set up language detection and switching
  - Configure RTL support infrastructure for Arabic/Urdu
  - Establish translation workflow

- [ ] **Security Foundation**
  - Implement security headers (CSP, X-Frame-Options, HSTS)
  - Set up TLS 1.3 configuration
  - Configure rate limiting infrastructure
  - Implement input validation middleware
  - Implement CSRF protection (SameSite cookies + CSRF tokens)
  - Configure input sanitization middleware (DOMPurify or equivalent)

- [ ] **Email Service (required for auth)**
  - Set up Mailgun email provider
  - Create base HTML email template
  - Implement email verification template
  - Implement password reset template
  - Configure delivery and bounce handling

### 1.2 Authentication System

**Objective:** Enable user registration and secure access.

#### Data Models
- User (core fields)

#### API Endpoints
- POST /auth/register
- POST /auth/login
- POST /auth/logout
- POST /auth/forgot-password
- POST /auth/reset-password
- POST /auth/verify-email
- GET /auth/me

#### Features
- [ ] Email/password registration with validation
- [ ] Email verification flow (24-hour link validity)
- [ ] Password requirements (8+ chars, uppercase, number)
- [ ] Password reset flow (1-hour link validity)
- [ ] JWT-based authentication with secure cookies
- [ ] Session management (24hr default, 30-day remember me)
- [ ] Failed login lockout (5 attempts, 15-minute lockout)
- [ ] Google OAuth sign-in
- [ ] Facebook OAuth sign-in
- [ ] Basic role system (Community Member, Business Owner, Moderator, Admin)

### 1.3 Design System & Core Components

**Objective:** Build reusable UI components following the specification.

#### Components
- [ ] **Layout Components**
  - Header (sticky, with logo, language selector, nav)
  - Footer (nav links, social, partner logos)
  - Page container with responsive breakpoints
  - Bottom navigation (mobile)

- [ ] **Core UI Components**
  - Buttons (Primary, Secondary, Tertiary, Disabled states)
  - Cards (8px radius, shadow, hover state)
  - Form fields (inputs, selects, checkboxes, validation states)
  - Typography scale (Montserrat headings, Open Sans body)
  - Icons system
  - Loading states and skeletons

- [ ] **Accessibility Features**
  - Skip links
  - Focus indicators
  - Screen reader announcements
  - Keyboard navigation
  - 4.5:1 colour contrast compliance

#### Colour Implementation
| Token | Hex | Usage |
|-------|-----|-------|
| --color-primary | #2C5F7C | Headers, primary buttons, links |
| --color-secondary | #E67E22 | Accents, CTAs |
| --color-accent | #F39C12 | Featured items, stars |
| --color-success | #27AE60 | Success messages, open status |
| --color-error | #E74C3C | Error messages, alerts |

---

## Phase 2: Business Directory Core

### 2.1 Business Profiles (Read-Only)

**Objective:** Display business information to visitors.

#### Data Models
- Business (full schema)
- Category
- OperatingHours
- Address

#### API Endpoints
- GET /businesses
- GET /businesses/:id

#### Features
- [ ] **Business Listing Page**
  - Business cards with logo, name, category, rating
  - Pagination/infinite scroll
  - Quick filter chips (Restaurants, Retail, Services, Open Now, Near Me)

- [ ] **Business Profile Page**
  - Cover photo and logo display
  - Business name, category, rating display
  - Description with multilingual support
  - Operating hours with "Open Now"/"Closed" logic
  - Photo gallery with categories
  - Contact information (phone, email, website)
  - Social media links
  - Languages spoken display
  - Cultural certifications (Halal, Kosher, etc.)
  - Accessibility features display
  - Payment methods
  - Map integration (Mapbox GL JS)
  - "Get Directions" functionality

- [ ] **SEO Implementation**
  - Meta tags (title, description)
  - Schema.org LocalBusiness structured data
  - Open Graph tags
  - URL slugs

### 2.2 Search & Discovery

**Objective:** Enable users to find businesses effectively.

#### API Endpoints
- GET /search/businesses
- GET /search/suggestions

#### Features
- [ ] **Search Functionality**
  - Full-text search across business name, description, categories
  - Autocomplete suggestions
  - Typo tolerance
  - Synonym matching
  - Search history (for logged-in users)

- [ ] **Filters**
  - Category (multi-select)
  - Distance (500m, 1km, 2km, 5km, Any)
  - Open Now toggle
  - Languages Spoken (multi-select)
  - Price Range (multi-select)
  - Rating (3+, 4+, 4.5+)
  - Certifications (Halal, Kosher, Vegan, etc.)
  - Accessibility features (multi-select)
  - Has Promotions toggle

- [ ] **Sort Options**
  - Relevance
  - Distance (nearest first)
  - Rating (highest first)
  - Most Reviewed
  - Recently Updated
  - Alphabetical

### 2.3 Homepage

**Objective:** Create an engaging landing page for visitors.

#### Features
- [ ] **Hero Section**
  - Background image
  - Search bar
  - Quick filter chips
  - Stats strip (business count, user count)

- [ ] **Featured Businesses Carousel**
  - Admin-curated businesses
  - Horizontal scroll

- [ ] **Discovery Sections**
  - "Near You" (location-based)
  - "New to Platform"
  - "Highly Rated"
  - "With Offers"

---

## Phase 3: User Engagement

### 3.1 User Profiles & Preferences

**Objective:** Enable personalised user experiences.

#### Data Models
- User (extended with preferences)
- NotificationPreferences

#### API Endpoints
- GET /users/:id
- PUT /users/:id

#### Features
- [ ] **Profile Management**
  - Display name editing
  - Profile photo upload
  - Bio field (500 chars)
  - Preferred language setting
  - Suburb selection
  - Interest categories

- [ ] **Security Settings**
  - Password change
  - Email change (with re-verification)
  - Active sessions view and revoke
  - Optional two-factor authentication (TOTP)
  - Account deletion (14-day grace period)

- [ ] **Notification Preferences**
  - Business updates, event reminders, promotions, community news
  - Delivery methods: Email (instant/daily/weekly digest), Push, SMS opt-in

### 3.2 Saved Businesses & Following

**Objective:** Let users curate their favourite businesses.

#### Data Models
- SavedBusiness
- BusinessFollow

#### API Endpoints
- GET /users/:id/saved
- POST /users/:id/saved
- DELETE /users/:id/saved/:businessId

#### Features
- [ ] Save/favourite button on business cards and profiles
- [ ] Saved businesses list in user profile
- [ ] Custom lists/categories for saved businesses
- [ ] Follow/unfollow businesses
- [ ] Follow count display on business profiles
- [ ] Feed of updates from followed businesses

### 3.3 Reviews & Ratings

**Objective:** Build trust through community reviews.

#### Data Models
- Review
- ReviewPhoto
- ReviewHelpful

#### API Endpoints
- GET /businesses/:id/reviews
- POST /businesses/:id/reviews
- PUT /reviews/:id
- DELETE /reviews/:id

#### Features
- [ ] 1-5 star rating system
- [ ] Review text (50-1000 characters)
- [ ] Photo upload (up to 3 images)
- [ ] Review language detection and translation
- [ ] "Helpful" voting system
- [ ] 7-day edit window
- [ ] Review moderation queue
- [ ] Aggregate rating calculation

### 3.4 Basic Moderation Infrastructure

**Objective:** Establish moderation tools before user-generated content scales.

> **Note:** This is the minimum viable moderation system. Full admin dashboard and advanced moderation tools are in Phase 12, but basic content moderation must exist before reviews, events, and community content go live.

#### Data Models
- ModerationReport (A.22)
- AuditLog (A.18)

#### Features
- [ ] Content reporting (flag reviews, businesses, events)
- [ ] Basic moderation queue (list flagged content)
- [ ] Approve/reject/remove actions for moderators
- [ ] Audit log for moderation actions
- [ ] Admin user management (suspend/unsuspend users)
- [ ] Basic admin dashboard with pending items count

### 3.5 Maps Integration (required for business profiles)

**Objective:** Enable location display and directions on business profiles.

> **Note:** Full maps features are in Phase 13, but basic map display is needed for business profiles launched in Phase 2.

#### Features
- [ ] Mapbox GL JS embed on business profiles
- [ ] "Get Directions" link
- [ ] Geocoding for address-to-coordinates
- [ ] Distance calculation from user location

---

## Phase 4: Business Owner Features

### 4.1 Business Claim & Verification

**Objective:** Allow legitimate business owners to control their profiles.

#### API Endpoints
- POST /businesses/:id/claim

#### Features
- [ ] "Claim this business" flow
- [ ] Verification methods:
  - Phone verification (automated PIN call)
  - Email verification (business domain)
  - Document upload (ABN certificate, utility bill)
  - Google Business Profile connection
- [ ] Moderator review workflow for claims
- [ ] Ownership transfer capability

### 4.2 Business Dashboard

**Objective:** Provide business owners with management tools.

#### API Endpoints
- GET /businesses/:id/analytics
- PUT /businesses/:id

#### Features
- [ ] **Dashboard Overview**
  - Key metrics summary
  - Quick actions
  - Pending tasks

- [ ] **Profile Management**
  - Edit all business fields
  - Operating hours management (standard, holiday, temporary closures)
  - Photo gallery management (upload, categorise, reorder, delete)
  - Menu/price list upload
  - Social link management

- [ ] **Analytics Dashboard**
  - Profile views
  - Search appearances
  - Website clicks
  - Phone clicks
  - Direction requests
  - Photo views
  - Review metrics
  - Follower/save counts
  - Date range selection
  - Comparison to previous period
  - CSV/PDF export

### 4.3 Promotions Management

**Objective:** Enable businesses to create and manage offers.

#### Data Models
- Promotion

#### Features
- [ ] Create promotion form:
  - Title, description
  - Discount type (percentage, fixed, BOGO, free item)
  - Valid dates
  - Terms & conditions
  - Promotion image
- [ ] Promotion listing and editing
- [ ] Max 5 active promotions per business
- [ ] Auto-archive after 30 days expired
- [ ] Featured promotion request (moderator approval)

### 4.4 Review Response

**Objective:** Allow businesses to engage with customer feedback.

#### Features
- [ ] View all reviews from dashboard
- [ ] Public response capability
- [ ] Review notifications

---

## Phase 5: Events System

### 5.1 Event Display

**Objective:** Show community events to users.

#### Data Models
- Event (full schema)
- EventCategory
- RecurrenceRule

#### API Endpoints
- GET /events
- GET /events/:id

#### Features
- [ ] **Event Listing**
  - Event cards with image, title, date, location
  - Category filtering
  - Date range filtering
  - Keyword search

- [ ] **Calendar Views**
  - Month view (mini calendar grid)
  - List view (chronological)
  - Day view (timeline)

- [ ] **Event Detail Page**
  - Banner image
  - Title, description
  - Date/time with timezone
  - Location (physical/online/hybrid)
  - Map for physical events
  - Ticket link
  - Cost information
  - Capacity display
  - Age restrictions
  - Accessibility features
  - Contact information

### 5.2 Event Interaction

**Objective:** Enable user engagement with events.

#### API Endpoints
- POST /events/:id/rsvp

#### Features
- [ ] RSVP options (Going, Interested, Not Going)
- [ ] Calendar export (ICS file)
- [ ] Google Calendar one-click add
- [ ] Event reminders (1 day, 1 hour before)
- [ ] Social sharing

### 5.3 Event Management

**Objective:** Allow admins and business owners to create events.

#### API Endpoints
- POST /events
- PUT /events/:id
- DELETE /events/:id

#### Features
- [ ] Event creation form with all fields
- [ ] Recurring event support:
  - Daily, weekly, fortnightly
  - Monthly (by date or day)
  - Custom occurrences
  - Exception dates
- [ ] Event editing (single occurrence vs series)
- [ ] Event cancellation
- [ ] Business-linked events

---

## Phase 6: Messaging System

### 6.1 Business Enquiry System

**Objective:** Enable communication between users and businesses.

#### Data Models
- Message
- Conversation

#### API Endpoints
- GET /conversations
- GET /conversations/:id
- POST /conversations
- POST /conversations/:id/messages
- PUT /conversations/:id/read
- PUT /conversations/:id/archive

#### Features
- [ ] **Enquiry Form**
  - Subject categories (General, Product/Service, Booking, Feedback, Other)
  - Message field (1000 chars max)
  - Preferred contact method
  - Image attachments (max 3, 5MB each)

- [ ] **User Conversation View**
  - Conversation list with preview
  - Thread view with all messages
  - Read receipts
  - Timestamps

### 6.2 Business Inbox

**Objective:** Provide businesses with message management tools.

#### API Endpoints
- GET /businesses/:id/inbox
- GET /businesses/:id/inbox/analytics
- POST /conversations/:id/block

#### Features
- [ ] **Inbox Management**
  - Unified inbox
  - Unread count badge
  - Mark as read/unread
  - Archive conversations
  - Search and filter

- [ ] **Response Tools**
  - Quick reply templates
  - Auto-response configuration
  - Response time goal setting

- [ ] **Analytics**
  - Total enquiries
  - Response rate
  - Average response time
  - Enquiry categories breakdown
  - Peak times

### 6.3 Privacy & Safety

**Objective:** Protect users from spam and abuse.

#### Features
- [ ] Personal contact info hidden until shared
- [ ] Block user functionality
- [ ] Report message capability
- [ ] Spam detection
- [ ] Rate limiting (10 new conversations/day)
- [ ] Response rate display on profiles

---

## Phase 7: Deals & Promotions Hub

### 7.1 Deals Discovery

**Objective:** Create a centralised deals browsing experience.

#### Data Models
- Deal (full schema)
- DealCategory
- DealRedemption
- SavedDeal

#### API Endpoints
- GET /deals
- GET /deals/featured
- GET /deals/flash
- GET /deals/:id

#### Features
- [ ] **Deals Hub Page**
  - "Today's Deals" section
  - "Ending Soon" (48 hours) section
  - "New This Week" section
  - "Most Popular" section
  - "Near You" section

- [ ] **Deal Cards**
  - Business logo and name
  - Deal title
  - Discount badge (20% OFF, BOGO, FREE)
  - Valid period
  - Distance from user
  - Save and share buttons

- [ ] **Deal Filters**
  - Category (Food, Retail, Services, Health, Entertainment, Family)
  - Distance
  - Discount type
  - Expiring soon

### 7.2 Flash Deals

**Objective:** Enable time-limited special offers.

#### Features
- [ ] Flash deal creation (2-24 hour duration)
- [ ] Countdown timer display
- [ ] Quantity limit support
- [ ] "X remaining" display
- [ ] Push notifications to followers
- [ ] Max 2 flash deals per business per week
- [ ] Expedited moderation (1-hour approval)

### 7.3 Deal Redemption

**Objective:** Track and validate deal usage.

#### API Endpoints
- POST /deals/:id/save
- DELETE /deals/:id/save
- POST /deals/:id/redeem
- GET /users/:id/saved-deals

#### Features
- [ ] Redemption methods:
  - Show screen
  - Unique code generation
  - QR code generation
  - No verification
- [ ] Redemption tracking and counting
- [ ] User saved deals list

### 7.4 Deal Analytics & Alerts

**Objective:** Provide insights and personalised notifications.

#### API Endpoints
- GET /deals/:id/analytics
- GET /businesses/:id/deals

#### Features
- [ ] **Business Analytics**
  - Impressions
  - Click-through rate
  - Save rate
  - Redemption rate

- [ ] **User Alerts**
  - Flash deal notifications
  - Category-based alerts
  - Followed business alerts
  - Price threshold alerts
  - Proximity alerts

- [ ] **Personalised Recommendations**
  - Based on saved businesses
  - Based on category interests
  - Based on past redemptions
  - Based on location

---

## Phase 8: Community Features

### 8.1 Community Noticeboard

**Objective:** Enable local community announcements.

#### Data Models
- Notice
- NoticeCategory

#### Features
- [ ] Notice types (Lost & Found, For Sale, Free Items, Wanted, Recommendations, General)
- [ ] Notice creation form
- [ ] Image upload support
- [ ] 30-day auto-expiry
- [ ] Limit 3 active notices per user
- [ ] Moderator approval workflow
- [ ] Report functionality

### 8.2 Community Groups Hub

**Objective:** Showcase local community organisations.

#### Data Models
- CommunityGroup
- GroupCategory

#### Features
- [ ] Group listing by category (Hobby, Parent, Cultural, Sports, Volunteer)
- [ ] Group detail pages with:
  - Description
  - Meeting schedule
  - Location
  - Contact info
  - How to join
- [ ] Moderator-managed content

### 8.3 Local News & Announcements

**Objective:** Distribute official communications.

#### Data Models
- Announcement
- AnnouncementSource

#### Features
- [ ] News feed (reverse chronological)
- [ ] Pinned/featured announcements
- [ ] Category filtering
- [ ] Source filtering (Council, Chamber, Platform)
- [ ] Search functionality

### 8.4 Local History Archive

**Objective:** Preserve and share local heritage.

#### Data Models
- HistoricalContent
- HistoricalCategory

#### Features
- [ ] Content types (Photos, Stories, Heritage Sites, Oral Histories, Timeline)
- [ ] Community submission with moderator approval
- [ ] Attribution requirements
- [ ] Browse and search functionality

---

## Phase 9: Business-to-Business Networking

### 9.1 B2B Network Profiles

**Objective:** Enable businesses to present networking interests.

#### Data Models
- BusinessNetworkProfile

#### API Endpoints
- GET /b2b/profile/:businessId
- PUT /b2b/profile/:businessId

#### Features
- [ ] Extended business fields:
  - Open to networking toggle
  - Looking for (partnerships, suppliers, cross-promotion, referrals, mentorship)
  - Can offer (same categories)
  - Business size
  - Years in community (from config)
  - Industry connections

### 9.2 B2B Directory & Connections

**Objective:** Facilitate business discovery and connection.

#### Data Models
- BusinessConnection

#### API Endpoints
- GET /b2b/directory
- GET /b2b/connections
- POST /b2b/connections
- PUT /b2b/connections/:id
- DELETE /b2b/connections/:id

#### Features
- [ ] **B2B Directory**
  - Filter by networking needs/offers
  - Filter by category
  - Show mutual connections
  - Connection request button

- [ ] **Connection Management**
  - Send request with message
  - Accept/decline requests
  - View all connections
  - Remove connections
  - Block businesses
  - Export contacts (CSV)

### 9.3 B2B Messaging

**Objective:** Enable direct business-to-business communication.

#### API Endpoints
- GET /b2b/messages
- POST /b2b/messages

#### Features
- [ ] Separate B2B inbox tab
- [ ] Rich messages with attachments
- [ ] File sharing (PDF, max 10MB)
- [ ] Meeting scheduler integration

### 9.4 Collaboration Tools

**Objective:** Support business partnerships.

#### API Endpoints
- POST /b2b/referrals
- GET /b2b/referrals

#### Features
- [ ] **Joint Promotions**
  - Co-branded deal creation
  - Dual business approval workflow
  - Shared analytics

- [ ] **Referral Tracking**
  - Generate referral links
  - Referral dashboard
  - Thank you note system

### 9.5 B2B Forum & Events

**Objective:** Build business community engagement.

#### API Endpoints
- GET /b2b/forum
- GET /b2b/forum/:topicId
- POST /b2b/forum
- POST /b2b/forum/:topicId/replies
- GET /b2b/events

#### Features
- [ ] **Discussion Forum**
  - Topic categories (General, Suppliers, Marketing, Operations, Local Issues)
  - Post types (Question, Discussion, Recommendation, Announcement)
  - Threaded replies
  - Upvoting
  - Moderator oversight

- [ ] **B2B Events**
  - Networking events
  - Workshops/training
  - Business breakfasts
  - Industry meetups
  - RSVP as business
  - Attendee list visibility

### 9.6 Chamber Integration

**Objective:** Connect platform with Chamber of Commerce.

#### Features
- [ ] Chamber announcements display
- [ ] Chamber member badge on profiles
- [ ] Chamber events highlighting
- [ ] Chamber resources section
- [ ] Direct Chamber contact

---

## Phase 10: Emergency & Crisis Communication

### 10.1 Alert System

**Objective:** Deliver urgent community notifications.

#### Data Models
- Alert
- BusinessEmergencyStatus

#### API Endpoints
- GET /alerts
- GET /alerts/active
- GET /alerts/:id
- POST /alerts
- PUT /alerts/:id
- POST /alerts/:id/resolve
- GET /alerts/history

#### Features
- [ ] **Alert Levels**
  - Critical (red banner, persistent)
  - Warning (orange banner)
  - Advisory (yellow banner)
  - Information (blue banner)

- [ ] **Alert Content**
  - Title, summary (280 chars for SMS)
  - Full details
  - Affected areas
  - Start time, expected end
  - Source attribution
  - External links
  - Map polygon overlay

- [ ] **Alert Display**
  - Homepage banner
  - App header icon with count
  - Dedicated Alert Centre page
  - Affected business profile display

### 10.2 Alert Distribution

**Objective:** Ensure alerts reach relevant users.

#### API Endpoints
- PUT /users/:id/alert-preferences

#### Features
- [ ] **Notification Channels**
  - Push notifications (forced for Critical)
  - SMS opt-in (Critical/Warning only)
  - Email (immediate/digest)
  - In-app notifications

- [ ] **User Preferences**
  - SMS opt-in with phone number
  - Location-based filtering
  - Alert category selection
  - Quiet hours setting

### 10.3 Business Emergency Status

**Objective:** Let businesses communicate operational changes.

#### API Endpoints
- GET /businesses/:id/emergency-status
- PUT /businesses/:id/emergency-status

#### Features
- [ ] **Status Options**
  - Operating Normally
  - Modified Hours
  - Limited Services
  - Temporarily Closed
  - Closed Until Further Notice

- [ ] **Quick Update Features**
  - One-tap status buttons
  - Brief message (280 chars)
  - Expected reopening date
  - Auto-notify followers
  - Social media sync option

### 10.4 Community Safety Features

**Objective:** Support community during emergencies.

#### API Endpoints
- POST /alerts/:id/check-in

#### Features
- [ ] **Check-In System**
  - "I'm Safe" button
  - Business status check-in
  - Privacy-controlled visibility
  - Family/friends sharing

- [ ] **Resource Information**
  - Emergency contacts (Police, Fire, Ambulance, SES)
  - Evacuation route links
  - Relief centre locations
  - Council emergency contacts

### 10.5 External Integrations

**Objective:** Aggregate alerts from official sources.

#### Features
- [ ] NSW Alerts feed integration
- [ ] Bureau of Meteorology severe weather
- [ ] Transport NSW disruptions
- [ ] Council systems direct integration

---

## Phase 11: Social Media Integration

### 11.1 Community Feed (Hashtag Integration)

**Objective:** Aggregate community social content.

#### Features
- [ ] Hashtag aggregation (configurable per deployment, e.g., #MyCommunity, #LocalArea)
- [ ] Masonry/Pinterest-style grid layout
- [ ] Multi-platform support (Instagram, Facebook, X)
- [ ] Content filtering:
  - Location-based (5km radius)
  - Language support
  - Content type filtering
- [ ] Moderation:
  - Profanity filter
  - Spam detection
  - Off-topic flagging
  - Manual approve/remove/block

### 11.2 Business Social Feeds

**Objective:** Display business social media on profiles.

#### Features
- [ ] Latest 3-4 posts from linked accounts
- [ ] Instagram and Facebook post embedding
- [ ] "Follow us" buttons
- [ ] Real-time sync (webhook) with hourly fallback
- [ ] Manual refresh option

### 11.3 Community Competitions

**Objective:** Engage community through photo contests.

#### Features
- [ ] Monthly theme announcements
- [ ] Hashtag-based submission
- [ ] Community engagement voting
- [ ] Winner selection and display
- [ ] Prize facilitation

---

## Phase 12: Administration & Analytics

### 12.1 Admin Dashboard

**Objective:** Provide platform management tools.

#### Features
- [ ] **Overview Widgets**
  - Active users
  - New registrations
  - Pending approvals queue
  - Active businesses
  - Upcoming events
  - System health

- [ ] **User Management**
  - User list with search/filter
  - Role editing
  - Suspend/unsuspend
  - Account deletion
  - Activity logs

- [ ] **Business Management**
  - Business list with search/filter
  - Profile editing
  - Status changes
  - Ownership transfer
  - Duplicate merging
  - Completeness tracking
  - Automated reminders

### 12.2 Content Moderation

**Objective:** Ensure content quality and safety.

#### Features
- [ ] **Moderation Queue**
  - Pending content by type
  - Approve/reject/edit actions
  - Request changes workflow
  - Escalation system

- [ ] **Moderation Log**
  - All actions tracked
  - Moderator attribution
  - Timestamps
  - Original content preservation

- [ ] **Reports & Flags**
  - Report reasons taxonomy
  - Flag workflow
  - Reporter notification

### 12.3 Platform Analytics

**Objective:** Track platform health and engagement.

#### Features
- [ ] **Key Metrics**
  - Daily/Monthly Active Users
  - New registrations
  - Session duration
  - Page views
  - Bounce rate
  - Search queries
  - Popular businesses
  - Event attendance

- [ ] **Reporting**
  - Standard reports (weekly/monthly)
  - Custom date ranges
  - Export (PDF, CSV, Excel)
  - Scheduled email delivery

- [ ] **CID Pilot Metrics**
  - Foot traffic impact
  - Business participation
  - Community engagement
  - Economic indicators

### 12.4 Survey System

**Objective:** Collect community feedback.

#### Features
- [ ] **Survey Builder**
  - Question types (multiple choice, rating, text, checkbox)
  - Branching logic
  - Required fields
  - Multilingual support
  - Anonymous option

- [ ] **Distribution**
  - Platform notification
  - Email campaigns
  - Public link
  - QR code generation

- [ ] **Analytics**
  - Response rates
  - Completion time
  - Question breakdowns
  - Demographic analysis
  - Export results

---

## Phase 13: External Integrations

### 13.1 Google Business Profile API

**Objective:** Sync business data from Google.

#### Features
- [ ] OAuth 2.0 business owner authorization
- [ ] Import: name, address, phone, hours, photos, reviews, ratings
- [ ] Sync on demand and scheduled (daily for reviews)
- [ ] Manual override capability
- [ ] Token refresh handling

### 13.2 Facebook & Instagram APIs

**Objective:** Import social content and events.

#### Features
- [ ] Page info import
- [ ] Posts import (hourly)
- [ ] Events import (daily)
- [ ] Photos import (on demand)
- [ ] Hashtag post aggregation

### 13.3 Email Service Integration

**Objective:** Send transactional and marketing emails.

#### Features
- [ ] Mailgun provider setup and domain verification
- [ ] HTML email templates:
  - Welcome
  - Email verification
  - Password reset
  - Notification digest
  - Event reminders
  - Survey invitations
  - Business alerts
- [ ] Personalisation tokens
- [ ] Open/click tracking
- [ ] One-click unsubscribe
- [ ] Bounce management

### 13.4 Maps Integration

**Objective:** Display locations and enable navigation.

#### Features
- [ ] Business location markers
- [ ] Event location display
- [ ] Directions linking
- [ ] Geocoding (address to coordinates)
- [ ] Distance calculation

### 13.5 Translation API

**Objective:** Enable content auto-translation.

#### Features
- [ ] Google Translate API integration
- [ ] On-demand translation
- [ ] "Auto-translated" indicator
- [ ] Manual override by owners
- [ ] Translation caching
- [ ] Quality feedback mechanism

---

## Phase 14: Progressive Web App & Offline

### 14.1 PWA Features

**Objective:** Enable app-like experience.

#### Features
- [ ] Web app manifest configuration
- [ ] Install prompts
- [ ] App icons (all sizes)
- [ ] Splash screens
- [ ] Push notification support
- [ ] Add to home screen

### 14.2 Offline Capability

**Objective:** Provide functionality without connectivity.

#### Features
- [ ] Service worker implementation
- [ ] Cache strategies:
  - Homepage cached
  - Recently viewed businesses offline
  - Saved businesses full offline access
- [ ] Offline search (cached data)
- [ ] Action queuing for sync
- [ ] Offline indicators

### 14.3 Performance Optimisation

**Objective:** Meet performance targets.

#### Targets
- Page load < 3 seconds on 3G
- Time to Interactive < 5 seconds
- First Contentful Paint < 1.5 seconds
- Lighthouse Performance > 80
- API response < 200ms (95th percentile)

#### Features
- [ ] Image optimisation (WebP, lazy loading)
- [ ] Code splitting
- [ ] Bundle optimisation
- [ ] API response caching
- [ ] Database query optimisation
- [ ] Cloudflare CDN caching optimisation

---

## Phase 15: Multilingual Expansion

### 15.1 UI Translation

**Objective:** Translate all interface elements.

#### Languages (by priority)
1. English (en) - Primary
2. Arabic (ar) - High priority, RTL
3. Chinese Simplified (zh-CN) - High priority
4. Vietnamese (vi) - High priority
5. Chinese Traditional (zh-TW) - Medium priority
6. Hindi (hi) - Medium priority
7. Urdu (ur) - Medium priority, RTL
8. Korean (ko) - Low priority
9. Greek (el) - Low priority
10. Italian (it) - Low priority

#### Features
- [ ] Professional translation of all UI elements
- [ ] Translation management interface
- [ ] Missing translation fallback
- [ ] Community contribution system

### 15.2 RTL Support

**Objective:** Full support for Arabic and Urdu.

#### Features
- [ ] Text direction switching
- [ ] Layout mirroring
- [ ] Direction-aware icons
- [ ] Bidirectional text handling
- [ ] Number display (LTR within RTL)

---

## Quality Assurance Throughout

### Testing Strategy

- **Unit Tests:** All business logic, utilities, components
- **Integration Tests:** API endpoints, database operations
- **E2E Tests:** Critical user journeys
- **Accessibility Testing:** axe-core, manual screen reader testing
- **Performance Testing:** Lighthouse CI, load testing
- **Security Testing:** OWASP ZAP, penetration testing
- **Multilingual Testing:** All languages, RTL layouts

### Continuous Integration

- Automated test runs on all PRs
- Lighthouse CI for performance regression
- Accessibility checks in CI pipeline
- Security scanning (dependency vulnerabilities)

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Scope creep | Strict phase boundaries, MVP focus per phase |
| Performance issues | Performance budgets from Phase 1, continuous monitoring |
| Accessibility gaps | WCAG compliance testing each phase |
| Security vulnerabilities | Security review each phase, automated scanning |
| Translation quality | Professional translation, community feedback |
| Integration failures | API fallbacks, graceful degradation |
| Data migration issues | Comprehensive testing in staging |

---

## Success Metrics

### Platform Health
- 99.9% uptime
- < 3s page load (3G)
- < 200ms API response (p95)
- Lighthouse score > 80
- WCAG 2.1 AA compliance

### User Engagement
- Monthly Active Users growth
- Session duration
- Return visit rate
- Feature adoption rates

### Business Value
- Businesses onboarded
- Profile completeness rates
- Business owner engagement
- Review volume
- Deal redemptions

### Community Impact
- Event attendance
- Message volume
- Deal saves
- Community content submissions

---

*This roadmap should be treated as a living document and updated as the project progresses. Each phase should be reviewed and refined before development begins.*
