# Guildford Community Digital Platform - TODO

**Last Updated:** January 2026
**Current Phase:** Phase 1 - Foundation & Core Infrastructure

---

## How to Use This File

- [ ] Unchecked = Not started
- [x] Checked = Completed
- [~] Tilde = In Progress (manually add ~)
- Items marked with `[BLOCKED]` have dependencies that must be resolved first

---

## Phase 1: Foundation & Core Infrastructure

### 1.1 Project Setup & Architecture

#### Development Environment
- [ ] Set up monorepo structure
- [ ] Configure CI/CD pipelines (GitHub Actions)
- [ ] Set up development environment
- [ ] Set up staging environment
- [ ] Set up production environment
- [ ] Configure ESLint
- [ ] Configure Prettier
- [ ] Configure TypeScript

#### Backend Infrastructure
- [ ] Set up PostgreSQL database
- [ ] Create initial database schema
- [ ] Set up Redis for caching/sessions
- [ ] Configure AWS S3 for media storage
- [ ] Implement RESTful API scaffolding
- [ ] Set up Elasticsearch for search

#### Frontend Infrastructure
- [ ] Initialize frontend framework (React/Vue + TypeScript)
- [ ] Configure responsive design system
- [ ] Implement design tokens (colours, typography, spacing)
- [ ] Set up component library foundation
- [ ] Configure PWA manifest
- [ ] Set up service worker skeleton

#### i18n Foundation
- [ ] Implement translation file structure (JSON)
- [ ] Set up language detection
- [ ] Set up language switching UI
- [ ] Configure RTL support infrastructure
- [ ] Establish translation workflow

#### Security Foundation
- [ ] Implement Content-Security-Policy header
- [ ] Implement X-Frame-Options header
- [ ] Implement HSTS header
- [ ] Configure TLS 1.3
- [ ] Set up rate limiting middleware
- [ ] Implement input validation middleware

### 1.2 Authentication System

#### Core Auth
- [ ] POST /auth/register endpoint
- [ ] POST /auth/login endpoint
- [ ] POST /auth/logout endpoint
- [ ] POST /auth/forgot-password endpoint
- [ ] POST /auth/reset-password endpoint
- [ ] POST /auth/verify-email endpoint
- [ ] GET /auth/me endpoint

#### Auth Features
- [ ] Email/password registration form
- [ ] Email verification flow (24-hour link)
- [ ] Password validation (8+ chars, uppercase, number)
- [ ] Password reset flow (1-hour link)
- [ ] JWT implementation with secure cookies
- [ ] Session management (24hr/30-day)
- [ ] Failed login lockout (5 attempts, 15min)
- [ ] Google OAuth integration
- [ ] Facebook OAuth integration
- [ ] Role system (Community, Business Owner, Moderator, Admin)

### 1.3 Design System & Core Components

#### Layout Components
- [ ] Header component (sticky, logo, language selector, nav)
- [ ] Footer component (nav, social, partner logos)
- [ ] Page container with breakpoints
- [ ] Bottom navigation (mobile)

#### Core UI Components
- [ ] Button component (Primary, Secondary, Tertiary, Disabled)
- [ ] Card component (8px radius, shadow, hover)
- [ ] Input field component
- [ ] Select component
- [ ] Checkbox component
- [ ] Form validation states
- [ ] Typography scale implementation
- [ ] Icons system
- [ ] Loading states/skeletons

#### Accessibility
- [ ] Skip links
- [ ] Focus indicators
- [ ] Screen reader announcements
- [ ] Keyboard navigation
- [ ] Colour contrast verification (4.5:1)

---

## Phase 2: Business Directory Core

### 2.1 Business Profiles (Read-Only)

#### Data Models
- [ ] Business model
- [ ] Category model
- [ ] OperatingHours model
- [ ] Address model

#### API Endpoints
- [ ] GET /businesses endpoint
- [ ] GET /businesses/:id endpoint

#### Business Listing Page
- [ ] Business card component
- [ ] Pagination/infinite scroll
- [ ] Quick filter chips

#### Business Profile Page
- [ ] Cover photo display
- [ ] Logo display
- [ ] Business info section
- [ ] Operating hours with Open/Closed logic
- [ ] Photo gallery
- [ ] Contact information display
- [ ] Social media links
- [ ] Languages spoken display
- [ ] Cultural certifications display
- [ ] Accessibility features display
- [ ] Payment methods display
- [ ] Map integration
- [ ] Get Directions button

#### SEO
- [ ] Meta tags implementation
- [ ] Schema.org LocalBusiness data
- [ ] Open Graph tags
- [ ] URL slug generation

### 2.2 Search & Discovery

#### API Endpoints
- [ ] GET /search/businesses endpoint
- [ ] GET /search/suggestions endpoint

#### Search Features
- [ ] Full-text search implementation
- [ ] Autocomplete suggestions
- [ ] Typo tolerance
- [ ] Synonym matching
- [ ] Search history (logged-in users)

#### Filters
- [ ] Category filter (multi-select)
- [ ] Distance filter
- [ ] Open Now toggle
- [ ] Languages filter
- [ ] Price Range filter
- [ ] Rating filter
- [ ] Certifications filter
- [ ] Accessibility filter
- [ ] Has Promotions toggle

#### Sort Options
- [ ] Relevance sort
- [ ] Distance sort
- [ ] Rating sort
- [ ] Most Reviewed sort
- [ ] Recently Updated sort
- [ ] Alphabetical sort

### 2.3 Homepage

- [ ] Hero section with background image
- [ ] Search bar
- [ ] Quick filter chips
- [ ] Stats strip
- [ ] Featured Businesses carousel
- [ ] "Near You" section
- [ ] "New to Platform" section
- [ ] "Highly Rated" section
- [ ] "With Offers" section

---

## Phase 3: User Engagement

### 3.1 User Profiles & Preferences
- [ ] Display name editing
- [ ] Profile photo upload
- [ ] Bio field
- [ ] Language preference
- [ ] Suburb selection
- [ ] Interest categories
- [ ] Password change
- [ ] Email change with re-verification
- [ ] Active sessions management
- [ ] Two-factor authentication (TOTP)
- [ ] Account deletion flow
- [ ] Notification preferences UI

### 3.2 Saved Businesses & Following
- [ ] SavedBusiness model
- [ ] BusinessFollow model
- [ ] Save button on cards/profiles
- [ ] Saved businesses list
- [ ] Custom lists feature
- [ ] Follow/unfollow functionality
- [ ] Follow count display
- [ ] Updates feed from followed businesses

### 3.3 Reviews & Ratings
- [ ] Review model
- [ ] ReviewPhoto model
- [ ] ReviewHelpful model
- [ ] Star rating component
- [ ] Review form (50-1000 chars)
- [ ] Photo upload (3 images)
- [ ] Language detection
- [ ] Translation integration
- [ ] Helpful voting
- [ ] 7-day edit window
- [ ] Moderation queue integration
- [ ] Aggregate rating calculation

---

## Phase 4: Business Owner Features

### 4.1 Business Claim & Verification
- [ ] Claim flow UI
- [ ] Phone verification
- [ ] Email verification
- [ ] Document upload verification
- [ ] Google Business Profile verification
- [ ] Moderator review workflow
- [ ] Ownership transfer

### 4.2 Business Dashboard
- [ ] Dashboard overview page
- [ ] Profile editing forms
- [ ] Operating hours management
- [ ] Photo gallery management
- [ ] Menu/price list upload
- [ ] Social link management
- [ ] Analytics dashboard
- [ ] Date range selector
- [ ] CSV export
- [ ] PDF export

### 4.3 Promotions Management
- [ ] Promotion model
- [ ] Promotion creation form
- [ ] Promotion listing
- [ ] Promotion editing
- [ ] Max 5 promotions validation
- [ ] Auto-archive logic
- [ ] Featured promotion request

### 4.4 Review Response
- [ ] Review list in dashboard
- [ ] Response form
- [ ] Review notifications

---

## Phase 5: Events System

### 5.1 Event Display
- [ ] Event model
- [ ] EventCategory model
- [ ] RecurrenceRule model
- [ ] Event card component
- [ ] Event listing page
- [ ] Category filtering
- [ ] Date range filtering
- [ ] Keyword search
- [ ] Month calendar view
- [ ] List view
- [ ] Day view
- [ ] Event detail page

### 5.2 Event Interaction
- [ ] RSVP endpoint
- [ ] RSVP UI (Going, Interested, Not Going)
- [ ] ICS export
- [ ] Google Calendar integration
- [ ] Event reminders
- [ ] Social sharing

### 5.3 Event Management
- [ ] Event creation form
- [ ] Recurring event support
- [ ] Event editing
- [ ] Event cancellation
- [ ] Business-linked events

---

## Phase 6: Messaging System

### 6.1 Business Enquiry System
- [ ] Message model
- [ ] Conversation model
- [ ] Enquiry form
- [ ] User conversation list
- [ ] Thread view
- [ ] Read receipts
- [ ] Image attachments

### 6.2 Business Inbox
- [ ] Business inbox UI
- [ ] Unread count badge
- [ ] Mark read/unread
- [ ] Archive functionality
- [ ] Search and filter
- [ ] Quick reply templates
- [ ] Auto-response config
- [ ] Response time goal
- [ ] Messaging analytics

### 6.3 Privacy & Safety
- [ ] Contact info privacy
- [ ] Block user functionality
- [ ] Report message
- [ ] Spam detection
- [ ] Rate limiting (10/day)
- [ ] Response rate display

---

## Phase 7: Deals & Promotions Hub

### 7.1 Deals Discovery
- [ ] Deal model
- [ ] DealCategory model
- [ ] DealRedemption model
- [ ] SavedDeal model
- [ ] Deals hub page
- [ ] Deal card component
- [ ] Today's Deals section
- [ ] Ending Soon section
- [ ] New This Week section
- [ ] Most Popular section
- [ ] Near You section
- [ ] Deal filters

### 7.2 Flash Deals
- [ ] Flash deal creation
- [ ] Countdown timer
- [ ] Quantity limit
- [ ] Remaining count display
- [ ] Push notifications
- [ ] 2/week limit validation
- [ ] Expedited moderation

### 7.3 Deal Redemption
- [ ] Save deal endpoint
- [ ] Redeem deal endpoint
- [ ] Show screen method
- [ ] Unique code generation
- [ ] QR code generation
- [ ] Redemption tracking
- [ ] User saved deals list

### 7.4 Deal Analytics & Alerts
- [ ] Deal analytics dashboard
- [ ] Business deals list
- [ ] Flash deal alerts
- [ ] Category alerts
- [ ] Business alerts
- [ ] Threshold alerts
- [ ] Proximity alerts
- [ ] Personalised recommendations

---

## Phase 8: Community Features

### 8.1 Community Noticeboard
- [ ] Notice model
- [ ] NoticeCategory model
- [ ] Notice types setup
- [ ] Notice creation form
- [ ] Image upload
- [ ] 30-day auto-expiry
- [ ] 3 notice limit
- [ ] Moderation workflow
- [ ] Report functionality

### 8.2 Community Groups Hub
- [ ] CommunityGroup model
- [ ] GroupCategory model
- [ ] Group listing page
- [ ] Group detail page
- [ ] Moderator management

### 8.3 Local News & Announcements
- [ ] Announcement model
- [ ] AnnouncementSource model
- [ ] News feed
- [ ] Pinned announcements
- [ ] Category filtering
- [ ] Search functionality

### 8.4 Local History Archive
- [ ] HistoricalContent model
- [ ] HistoricalCategory model
- [ ] Content submission
- [ ] Moderation workflow
- [ ] Browse/search UI

---

## Phase 9: B2B Networking

### 9.1 B2B Network Profiles
- [ ] BusinessNetworkProfile model
- [ ] B2B profile fields
- [ ] Profile editing

### 9.2 B2B Directory & Connections
- [ ] BusinessConnection model
- [ ] B2B directory page
- [ ] Filter by needs/offers
- [ ] Connection request flow
- [ ] Connection management
- [ ] Export contacts

### 9.3 B2B Messaging
- [ ] B2B inbox
- [ ] Rich messages
- [ ] File sharing
- [ ] Meeting scheduler

### 9.4 Collaboration Tools
- [ ] Joint promotions
- [ ] Referral tracking
- [ ] Referral dashboard

### 9.5 B2B Forum & Events
- [ ] Forum topic model
- [ ] Forum UI
- [ ] Threaded replies
- [ ] Upvoting
- [ ] B2B events listing
- [ ] Business RSVP

### 9.6 Chamber Integration
- [ ] Chamber announcements
- [ ] Member badge
- [ ] Chamber events
- [ ] Resources section
- [ ] Chamber contact

---

## Phase 10: Emergency & Crisis Communication

### 10.1 Alert System
- [ ] Alert model
- [ ] BusinessEmergencyStatus model
- [ ] Alert levels UI
- [ ] Alert content forms
- [ ] Alert display (banner, header, centre)

### 10.2 Alert Distribution
- [ ] Push notifications
- [ ] SMS integration
- [ ] Email alerts
- [ ] User preferences UI

### 10.3 Business Emergency Status
- [ ] Status options UI
- [ ] Quick update buttons
- [ ] Status message
- [ ] Reopening date
- [ ] Follower notifications

### 10.4 Community Safety
- [ ] Check-in system
- [ ] Resource information
- [ ] Emergency contacts

### 10.5 External Integrations
- [ ] NSW Alerts feed
- [ ] BOM integration
- [ ] Transport NSW integration
- [ ] Council systems integration

---

## Phase 11: Social Media Integration

### 11.1 #MyGuildford Feed
- [ ] Hashtag aggregation
- [ ] Masonry grid layout
- [ ] Multi-platform support
- [ ] Location filtering
- [ ] Content moderation

### 11.2 Business Social Feeds
- [ ] Latest posts display
- [ ] Post embedding
- [ ] Follow buttons
- [ ] Sync mechanism

### 11.3 Community Competitions
- [ ] Theme announcements
- [ ] Submission tracking
- [ ] Winner selection

---

## Phase 12: Administration & Analytics

### 12.1 Admin Dashboard
- [ ] Overview widgets
- [ ] User management
- [ ] Business management
- [ ] Profile completeness tracking
- [ ] Automated reminders

### 12.2 Content Moderation
- [ ] Moderation queue
- [ ] Approve/reject workflow
- [ ] Moderation log
- [ ] Reports & flags

### 12.3 Platform Analytics
- [ ] Key metrics dashboard
- [ ] Standard reports
- [ ] Export functionality
- [ ] Scheduled reports
- [ ] CID pilot metrics

### 12.4 Survey System
- [ ] Survey builder
- [ ] Question types
- [ ] Distribution channels
- [ ] Analytics dashboard

---

## Phase 13: External Integrations

### 13.1 Google Business Profile API
- [ ] OAuth implementation
- [ ] Data import
- [ ] Sync scheduling
- [ ] Manual override

### 13.2 Facebook & Instagram APIs
- [ ] API authentication
- [ ] Posts import
- [ ] Events import
- [ ] Hashtag aggregation

### 13.3 Email Service
- [ ] Provider setup
- [ ] Email templates
- [ ] Personalisation
- [ ] Tracking
- [ ] Bounce handling

### 13.4 Maps Integration
- [ ] Provider setup
- [ ] Business markers
- [ ] Directions
- [ ] Geocoding
- [ ] Distance calculation

### 13.5 Translation API
- [ ] API integration
- [ ] On-demand translation
- [ ] Caching
- [ ] Quality feedback

---

## Phase 14: PWA & Offline

### 14.1 PWA Features
- [ ] Manifest configuration
- [ ] Install prompts
- [ ] App icons
- [ ] Splash screens
- [ ] Push notification setup

### 14.2 Offline Capability
- [ ] Service worker implementation
- [ ] Cache strategies
- [ ] Offline search
- [ ] Action queuing
- [ ] Offline indicators

### 14.3 Performance Optimisation
- [ ] Image optimisation
- [ ] Code splitting
- [ ] Bundle optimisation
- [ ] API caching
- [ ] Database optimisation
- [ ] CDN setup

---

## Phase 15: Multilingual Expansion

### 15.1 UI Translation
- [ ] English (en) - Primary
- [ ] Arabic (ar) - High priority
- [ ] Chinese Simplified (zh-CN) - High priority
- [ ] Vietnamese (vi) - High priority
- [ ] Chinese Traditional (zh-TW) - Medium priority
- [ ] Hindi (hi) - Medium priority
- [ ] Urdu (ur) - Medium priority
- [ ] Korean (ko) - Low priority
- [ ] Greek (el) - Low priority
- [ ] Italian (it) - Low priority

### 15.2 RTL Support
- [ ] Arabic RTL layout
- [ ] Urdu RTL layout
- [ ] Bidirectional text handling
- [ ] RTL icon mirroring

---

## Ongoing Tasks

### Testing
- [ ] Unit test coverage > 80%
- [ ] Integration tests for all endpoints
- [ ] E2E tests for critical journeys
- [ ] Accessibility testing (axe-core)
- [ ] Performance testing (Lighthouse CI)
- [ ] Security testing (OWASP ZAP)

### Documentation
- [ ] API documentation
- [ ] Component documentation
- [ ] Deployment documentation
- [ ] User guides

### Maintenance
- [ ] Dependency updates
- [ ] Security patches
- [ ] Performance monitoring
- [ ] Error tracking

---

## Notes

_Add any additional notes, decisions, or blockers here._

---
