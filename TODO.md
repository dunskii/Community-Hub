# Community Hub Platform - Development TODO

**Specification Version:** 2.0
**Last Updated:** 4 February 2026
**Current Phase:** Phase 1 (Sub-phases 1.1-1.5 Complete, 1.6 Next)

---

## How to Use This File

- [ ] Unchecked = Not started
- [x] Checked = Completed
- [~] Tilde = In Progress (manually add ~)
- Items marked with `[BLOCKED]` have dependencies that must be resolved first
- Spec references use format: `[Spec §X]` pointing to v2 specification sections

---

## Phase 1: Foundation & Core Infrastructure (42/59 tasks, 71%)

> **Sub-phases 1.1, 1.2, 1.3, 1.4, 1.5 = COMPLETE (42/43 tasks, 1 deferred)**
> Remaining: 1.6 Email (0/5), 1.7 Maps (0/5), 1.8 i18n (0/6)

### 1.1 Project Setup & Architecture

#### Development Environment (100% Complete)

- [x] Set up monorepo structure
- [x] Configure Git repository and branching strategy
- [x] Configure CI/CD pipelines (GitHub Actions)
- [x] Set up development environment (Docker)
- [x] Set up staging environment
- [x] Set up production environment
- [x] Configure ESLint
- [x] Configure Prettier
- [x] Configure TypeScript
- [x] Set up testing framework (Jest/Vitest)

#### Configuration Architecture [Spec §2] (100% Complete)

> Note: Legal & Compliance requirements are in §5

- [x] Create `.env.example` template with all required variables
- [x] Implement `config/platform.json` schema and loader
- [x] Implement environment-specific config overrides (dev/staging/prod)
- [x] Create configuration validation on startup
- [x] Implement feature flags system from config
- [x] Create deployment checklist documentation

#### Backend Infrastructure [Spec §3] (100% Complete)

- [x] Set up PostgreSQL database
- [x] Install Prisma ORM >= 7.3.0 (`prisma` and `@prisma/client`) and verify version
- [x] Create initial database schema and migrations
- [x] Set up Redis for caching and sessions
- [x] Configure local media storage
- [x] Implement RESTful API scaffolding
- [x] Set up Elasticsearch for search
- [x] Implement API versioning strategy
- [x] Set up logging infrastructure [Spec §29.1]

#### Frontend Infrastructure [Spec §3] (100% Complete)

- [x] Initialize React frontend with TypeScript
- [x] Configure responsive design system (mobile-first)
- [x] Implement design tokens from config (colours, typography, spacing)
- [x] Set up component library foundation
- [x] Configure PWA manifest
- [x] Set up service worker skeleton
- [x] Configure build optimisation (code splitting, tree shaking)

#### Security Foundation [Spec §4] (100% Complete, 1 deferred)

- [x] Implement Content-Security-Policy header
- [x] Implement X-Frame-Options header (DENY)
- [x] Implement X-Content-Type-Options header (nosniff)
- [x] Implement HSTS header (max-age=31536000)
- [x] Implement Referrer-Policy header
- [ ] Configure TLS 1.3 (deferred to Phase 19 -- server/Cloudflare config)
- [x] Set up rate limiting middleware [Spec §4] (7 tiers: global, auth, api, upload, passwordReset, search, review)
- [x] Implement input validation middleware
- [x] Set up AES-256 encryption for sensitive data at rest
- [x] Implement CSRF protection
- [x] Implement input sanitization middleware (isomorphic-dompurify) [Spec §4.9]

#### Email Service (required for auth) [Spec §26]

- [x] Set up Mailgun and configure API key
- [x] Create base HTML email template (branded, responsive)
- [x] Implement email verification template
- [x] Implement password reset template
- [x] Configure delivery, bounce handling, and one-click unsubscribe

#### Maps Integration (required for business profiles) [Spec §26]

- [ ] Set up Mapbox API (access token, geocoding, map tiles)
- [ ] Implement map embed component for business profiles
- [ ] Implement "Get Directions" link
- [ ] Implement geocoding (address to coordinates)
- [ ] Implement distance calculation from user location

#### i18n Foundation [Spec §8]

- [ ] Implement translation file structure (JSON per language)
- [ ] Set up language detection (browser, user preference, URL)
- [ ] Implement language switching UI component
- [ ] Configure RTL support infrastructure (Arabic, Urdu)
- [ ] Set up translation key management workflow
- [ ] Implement text direction switching (LTR/RTL)

---

## Phase 2: Authentication & User System

### 2.1 Authentication [Spec §4, §12, Appendix B]

#### Core Auth Endpoints

- [ ] POST /auth/register - User registration
- [ ] POST /auth/login - User login
- [ ] POST /auth/logout - User logout
- [ ] POST /auth/forgot-password - Password reset request
- [ ] POST /auth/reset-password - Password reset completion
- [ ] POST /auth/verify-email - Email verification
- [ ] POST /auth/resend-verification - Resend verification email
- [ ] GET /auth/me - Current user profile
- [ ] POST /auth/refresh - Refresh JWT token

#### Auth Features

- [ ] Email/password registration form
- [ ] Email verification flow (24-hour expiry link)
- [ ] Password validation (8+ chars, uppercase, number)
- [ ] Password reset flow (1-hour expiry link)
- [ ] JWT implementation with secure HTTP-only cookies
- [ ] Session management (24hr standard / 30-day remember me)
- [ ] Failed login lockout (5 attempts, 15-minute lockout)
- [ ] bcrypt password hashing (cost factor 12+)
- [ ] Google OAuth integration
- [ ] Facebook OAuth integration
- [ ] Two-factor authentication (TOTP) - optional

### 2.2 User System [Spec §10, §12, Appendix A]

#### User Model

- [ ] User entity with all fields (id, email, password_hash, display_name, etc.)
- [ ] Role enum (Guest, Community, BusinessOwner, Moderator, Admin, SuperAdmin)
- [ ] User preferences (language, notifications, interests)
- [ ] User status tracking (active, suspended, deleted)

#### Role System & Permissions [Spec §10.1-10.2]

- [ ] Permission matrix implementation
- [ ] Role-based access control middleware
- [ ] Guest user capabilities (browse, search, view)
- [ ] Community User permissions (save, review, RSVP, message)
- [ ] Business Owner permissions (claim, manage, respond)
- [ ] Moderator permissions (approve, flag, manage content)
- [ ] Administrator permissions (full platform access)
- [ ] Super Admin permissions (multi-platform, system config)

#### User Profile Features [Spec §12.2]

- [ ] Display name editing
- [ ] Profile photo upload with cropping
- [ ] Bio field (500 chars max)
- [ ] Language preference setting
- [ ] Suburb/location selection
- [ ] Interest categories selection
- [ ] Password change flow
- [ ] Email change with re-verification
- [ ] Active sessions management (view/revoke) [Spec §12.5]
- [ ] Account deletion flow (14-day grace period) [Spec §12.5, §5.2.2]

#### Notification Preferences [Spec §12.3]

- [ ] Email notification toggles
- [ ] Push notification toggles
- [ ] SMS notification toggles (if enabled)
- [ ] Notification frequency settings
- [ ] Category-based notification preferences

---

## Phase 3: Design System & Core Components

### 3.1 Design System [Spec §6]

> Note: UI States & Components are covered in §7

#### Colour System

- [ ] CSS custom properties from platform.json colours
- [ ] Primary colour (#2C5F7C) implementation
- [ ] Secondary colour (#E67E22) implementation
- [ ] Accent colour (#F39C12) implementation
- [ ] Semantic colours (success, error, warning, info)
- [ ] Neutral colours (backgrounds, borders, text)
- [ ] Dark mode support (optional future)

#### Typography System

- [ ] Montserrat font loading (headings)
- [ ] Open Sans font loading (body)
- [ ] Type scale implementation (H1-H6, body, small, caption)
- [ ] Font weight utilities
- [ ] Line height utilities
- [ ] Responsive typography

### 3.2 Core UI Components [Spec §7]

#### Layout Components

- [ ] Header component (sticky, logo, language selector, nav, CTA button)
- [ ] Footer component (nav links, social links, partner logos, copyright)
- [ ] Page container with responsive breakpoints
- [ ] Bottom navigation (mobile)
- [ ] Sidebar component
- [ ] Grid system (12-column)

#### Form Components [Spec §7.1]

- [ ] Button component (Primary, Secondary, Tertiary, Disabled states)
- [ ] Input field component with validation states
- [ ] Textarea component
- [ ] Select/dropdown component
- [ ] Checkbox component
- [ ] Radio button component
- [ ] Toggle/switch component
- [ ] Date picker component
- [ ] Time picker component
- [ ] File upload component
- [ ] Form validation error display

#### Display Components [Spec §7.2-7.5]

- [ ] Card component (8px radius, shadow, hover state)
- [ ] Modal/dialog component
- [ ] Toast/notification component
- [ ] Alert/banner component
- [ ] Badge component
- [ ] Avatar component
- [ ] Icon system (consistent icon library)
- [ ] Loading spinner
- [ ] Skeleton loaders
- [ ] Empty state component
- [ ] Pagination component
- [ ] Tabs component
- [ ] Accordion component
- [ ] Carousel/slider component
- [ ] Image gallery component

### 3.3 Accessibility [Spec §3.6]

- [ ] Skip to main content link
- [ ] Visible focus indicators (2px solid)
- [ ] Screen reader announcements (aria-live regions)
- [ ] Full keyboard navigation
- [ ] Colour contrast verification (4.5:1 minimum)
- [ ] Alt text enforcement for images
- [ ] Form label associations
- [ ] Error message accessibility
- [ ] Touch target sizing (44px minimum)

---

## Phase 4: Business Directory Core

### 4.1 Business Data [Spec §11, Appendix A]

#### Data Models

- [ ] Business entity (all fields from spec)
- [ ] Category model (hierarchical with parent_id)
- [ ] OperatingHours model (day, open, close, is_closed)
- [ ] SpecialHours model (date-specific overrides)
- [ ] Address model (street, suburb, postcode, coordinates)
- [ ] BusinessMedia model (photos, videos, documents)
- [ ] BusinessCertification model (halal, kosher, organic, etc.)
- [ ] BusinessSocialLink model (platform, URL)

#### API Endpoints [Appendix B.2]

- [ ] GET /businesses - List businesses with pagination
- [ ] GET /businesses/:id - Get business details
- [ ] POST /businesses - Create business (admin)
- [ ] PUT /businesses/:id - Update business
- [ ] DELETE /businesses/:id - Delete business (admin)
- [ ] GET /categories - List all categories
- [ ] GET /categories/:id/businesses - Businesses by category

### 4.2 Business Listing Page

- [ ] Business card component (photo, name, category, rating, distance)
- [ ] Grid/list view toggle
- [ ] Pagination or infinite scroll
- [ ] Quick filter chips (category, open now, has deals)
- [ ] Sort dropdown
- [ ] Results count display
- [ ] No results state [Spec §7]

### 4.3 Business Profile Page [Spec §11]

- [ ] Cover photo display (1200x400px)
- [ ] Logo display (400x400px)
- [ ] Business name and tagline
- [ ] Category badges
- [ ] Star rating and review count
- [ ] Verification badge display
- [ ] Action buttons (Save, Share, Directions, Call, Message)
- [ ] Navigation tabs (Overview, Photos, Reviews, Events, Deals)

#### Overview Tab

- [ ] About section with description
- [ ] Features and amenities list
- [ ] Operating hours with Open/Closed status
- [ ] Special hours display
- [ ] "Open Now" calculation using timezone
- [ ] Holiday hours handling
- [ ] Contact information (phone, email, website)
- [ ] Social media links
- [ ] Languages spoken display
- [ ] Cultural certifications display (halal, kosher, vegan, etc.)
- [ ] Accessibility features display
- [ ] Payment methods display
- [ ] Parking information

#### Location & Map

- [ ] Embedded map (Mapbox GL JS)
- [ ] Business marker on map
- [ ] Get Directions button (opens native maps)
- [ ] Address display with copy functionality
- [ ] Distance from user (if location enabled)

#### Photos Tab

- [ ] Photo gallery grid
- [ ] Lightbox/fullscreen view
- [ ] Swipe navigation (mobile)
- [ ] Photo categories (interior, exterior, products, menu)

### 4.4 SEO & Metadata [Spec §2.4 (seo config)]

- [ ] Dynamic meta title and description
- [ ] Schema.org LocalBusiness structured data
- [ ] Open Graph tags for social sharing
- [ ] Twitter Card tags
- [ ] Canonical URL implementation
- [ ] SEO-friendly URL slugs (/business/[slug])
- [ ] Sitemap generation for businesses

---

## Phase 5: Search & Discovery

### 5.1 Search Infrastructure [Spec §14]

#### Search API Endpoints [Appendix B.5]

- [ ] GET /search/businesses - Full business search
- [ ] GET /search/events - Event search
- [ ] GET /search/suggestions - Autocomplete suggestions
- [ ] GET /search/all - Combined search

#### Search Engine Setup

- [ ] Elasticsearch index configuration
- [ ] Business document indexing
- [ ] Field weighting (name > description > category)
- [ ] Synonym matching setup
- [ ] Typo tolerance configuration
- [ ] Multilingual analyzer setup

### 5.2 Search Features [Spec §14.1]

- [ ] Search bar component (prominent, accessible)
- [ ] Full-text search with relevance scoring
- [ ] Autocomplete suggestions (debounced)
- [ ] Recent searches (logged-in users)
- [ ] Popular searches display
- [ ] Search result highlighting
- [ ] Voice search (optional future)

### 5.3 Filters [Spec §14.2]

- [ ] Category filter (multi-select, hierarchical)
- [ ] Distance/radius filter (slider or dropdown)
- [ ] Open Now toggle
- [ ] Languages spoken filter
- [ ] Price range filter (if applicable)
- [ ] Rating filter (minimum stars)
- [ ] Certifications filter (halal, kosher, vegan, etc.)
- [ ] Accessibility filter
- [ ] Has Promotions toggle
- [ ] Has Events toggle
- [ ] Verified Only toggle
- [ ] Filter state in URL (shareable)
- [ ] Clear all filters button
- [ ] Active filter chips display

### 5.4 Sort Options [Spec §14.3]

- [ ] Relevance (default for search)
- [ ] Distance (requires location)
- [ ] Rating (highest first)
- [ ] Most Reviewed
- [ ] Recently Updated
- [ ] Alphabetical (A-Z, Z-A)
- [ ] Newest First

### 5.5 Homepage Discovery [Spec §14.4]

- [ ] Hero section with background image
- [ ] Prominent search bar
- [ ] Quick filter chips
- [ ] Stats strip (businesses, users, categories)
- [ ] Featured Businesses carousel (admin-selected)
- [ ] Near You section (location-based)
- [ ] New to Platform section (recently added)
- [ ] Highly Rated section (4.5+ stars)
- [ ] With Current Offers section
- [ ] Upcoming Events preview
- [ ] Category grid/showcase

---

## Phase 6: User Engagement Features

### 6.1 Saved Businesses & Following [Spec §12.4]

#### Data Models

- [ ] SavedBusiness model (user_id, business_id, list_id, saved_at)
- [ ] BusinessFollow model (user_id, business_id, followed_at)
- [ ] SavedList model (user_id, name, is_default)

#### API Endpoints [Appendix B.4]

- [ ] GET /users/:id/saved - Get saved businesses
- [ ] POST /users/:id/saved - Save a business
- [ ] DELETE /users/:id/saved/:businessId - Unsave business
- [ ] POST /businesses/:id/follow - Follow business
- [ ] DELETE /businesses/:id/follow - Unfollow

#### UI Features

- [ ] Save/heart button on business cards and profiles
- [ ] Saved businesses page with list view
- [ ] Custom lists creation and management
- [ ] Follow/unfollow button
- [ ] Following feed (updates from followed businesses)
- [ ] Follower count display on business profiles

### 6.2 Reviews & Ratings [Spec §18]

#### Data Models [Appendix A.4]

- [ ] Review model (user_id, business_id, rating, text, photos, language)
- [ ] ReviewPhoto model (review_id, url, order)
- [ ] ReviewHelpful model (review_id, user_id)
- [ ] ReviewResponse model (review_id, business_id, text, responded_at)

#### API Endpoints [Appendix B.7]

- [ ] GET /businesses/:id/reviews - List reviews for business
- [ ] POST /businesses/:id/reviews - Create review
- [ ] PUT /reviews/:id - Edit review (within 7 days)
- [ ] DELETE /reviews/:id - Delete own review
- [ ] POST /reviews/:id/helpful - Mark as helpful
- [ ] POST /reviews/:id/report - Report review
- [ ] POST /reviews/:id/respond - Business owner response

#### Review Features

- [ ] Star rating component (1-5, half stars)
- [ ] Review form (50-1000 characters)
- [ ] Photo upload (up to 3 images)
- [ ] Automatic language detection
- [ ] Translation button for non-English reviews
- [ ] Helpful voting (was this review helpful?)
- [ ] 7-day edit window enforcement
- [ ] Review count and aggregate rating calculation
- [ ] Review sorting (newest, highest, lowest, most helpful)
- [ ] Review filtering by rating

#### Business Response

- [ ] Response form for business owners
- [ ] Response display below review
- [ ] One response per review limit
- [ ] Response edit capability

#### Moderation [Spec §23.4, §24.1]

- [ ] Review submission to moderation queue
- [ ] Profanity filtering
- [ ] Spam detection
- [ ] Report functionality
- [ ] Review removal by moderators

### 6.4 Basic Moderation Infrastructure [Spec §23]

> **Note:** Minimum viable moderation — must be in place before UGC scales. Full admin dashboard is in Phase 15.

- [ ] Implement ModerationReport model (A.22)
- [ ] Implement AuditLog model (A.18)
- [ ] Create moderation queue page (list all flagged content by type)
- [ ] Implement approve/reject/remove actions for moderators
- [ ] Add content reporting endpoints (POST /reviews/:id/report, POST /notices/:id/report)
- [ ] Implement audit log for all moderation actions
- [ ] Basic admin: user list with suspend/unsuspend capability
- [ ] Basic admin: dashboard with pending moderation items count
- [ ] Email notification to moderators for new flagged content

---

## Phase 7: Business Owner Features

### 7.1 Business Claim & Verification [Spec §13.1, §24]

#### Claim Flow

- [ ] "Claim This Business" button on unclaimed profiles
- [ ] Claim request form
- [ ] Phone verification method
- [ ] Email verification method
- [ ] Document upload verification (business registration, utility bill)
- [ ] Google Business Profile verification option
- [ ] Claim status tracking (pending, approved, rejected)
- [ ] Moderator review workflow
- [ ] Claim notification emails

#### Ownership Management

- [ ] Multiple owner support
- [ ] Staff account creation
- [ ] Ownership transfer flow
- [ ] Owner removal

### 7.2 Business Dashboard [Spec §13.2]

#### Dashboard Overview

- [ ] Dashboard home with key metrics
- [ ] Profile views (today, week, month)
- [ ] Search appearances
- [ ] Click-through rates (phone, website, directions)
- [ ] Review summary (average, recent)
- [ ] Message summary (unread, response rate)
- [ ] Current promotions status
- [ ] Quick action buttons

#### Profile Management

- [ ] Basic info editing form
- [ ] Description editor (rich text)
- [ ] Category selection
- [ ] Operating hours editor with special hours
- [ ] Logo upload and cropping
- [ ] Cover photo upload and cropping
- [ ] Photo gallery management (upload, reorder, delete)
- [ ] Maximum 50 photos enforcement
- [ ] Menu/price list PDF upload
- [ ] Social media link management
- [ ] Languages spoken selection
- [ ] Certifications management
- [ ] Accessibility features selection
- [ ] Payment methods selection

### 7.3 Business Analytics [Spec §13.4, Appendix B.2]

#### Analytics Endpoint

- [ ] GET /businesses/:id/analytics - Business performance data

#### Analytics Dashboard

- [ ] Date range selector
- [ ] Profile views chart
- [ ] Search impressions chart
- [ ] Action clicks breakdown (phone, website, directions, message)
- [ ] Review trends
- [ ] Follower growth
- [ ] Peak activity times
- [ ] Comparison to previous period
- [ ] Top search terms leading to profile
- [ ] Referral sources breakdown
- [ ] CSV export
- [ ] PDF report export

---

## Phase 8: Events System

### 8.1 Event Data [Spec §15, Appendix A.3]

#### Data Models

- [ ] Event entity (all fields from spec)
- [ ] EventCategory model
- [ ] RecurrenceRule model (frequency, interval, end conditions)
- [ ] EventRSVP model (event_id, user_id, status, guests)
- [ ] EventReminder model

#### API Endpoints [Appendix B.3]

- [ ] GET /events - List events with filters
- [ ] GET /events/:id - Event details
- [ ] POST /events - Create event
- [ ] PUT /events/:id - Update event
- [ ] DELETE /events/:id - Delete event
- [ ] POST /events/:id/rsvp - RSVP to event
- [ ] DELETE /events/:id/rsvp - Cancel RSVP
- [ ] GET /events/:id/attendees - List attendees
- [ ] GET /events/:id/export - Export to ICS

### 8.2 Event Display [Spec §15.3]

#### Event Listing Page

- [ ] Event card component
- [ ] Month calendar view
- [ ] Week view
- [ ] Day view
- [ ] List/agenda view
- [ ] Category filtering
- [ ] Date range filtering
- [ ] Keyword search
- [ ] Location/distance filtering
- [ ] Free events toggle
- [ ] Accessibility filter

#### Event Detail Page

- [ ] Event header (image, title, date/time)
- [ ] Host/organiser information
- [ ] Location with map
- [ ] Full description (rich text)
- [ ] Accessibility information
- [ ] Ticket/registration link (external)
- [ ] Capacity and spots remaining
- [ ] RSVP buttons
- [ ] Share buttons
- [ ] Related events

### 8.3 Event Interaction [Spec §15.4]

- [ ] RSVP options (Going, Interested, Not Going)
- [ ] Guest count for RSVPs
- [ ] RSVP confirmation email
- [ ] ICS file export (single event)
- [ ] Google Calendar "Add" button
- [ ] Apple Calendar support
- [ ] Event reminders (24hr, 1hr before)
- [ ] Social sharing (Facebook, Twitter, WhatsApp deep links)
- [ ] Copy event link

### 8.4 Event Management (Business Owners) [Spec §15]

- [ ] Event creation form
- [ ] Image upload for event
- [ ] Recurring event setup (daily, weekly, monthly, custom)
- [ ] Event editing
- [ ] Event cancellation with attendee notification
- [ ] Duplicate event functionality
- [ ] RSVP list view
- [ ] Export attendee list
- [ ] Event analytics (views, RSVPs)

---

## Phase 9: Messaging System

### 9.1 Messaging Data [Spec §16, Appendix A.5]

#### Data Models

- [ ] Conversation model (participants, business_id, status, created_at)
- [ ] Message model (conversation_id, sender_id, content, attachments, read_at)
- [ ] ConversationParticipant model
- [ ] MessageAttachment model

#### API Endpoints [Appendix B.6]

- [ ] GET /conversations - User's conversations
- [ ] GET /conversations/:id - Conversation detail with messages
- [ ] POST /conversations - Start new conversation
- [ ] POST /conversations/:id/messages - Send message
- [ ] PUT /conversations/:id/read - Mark as read
- [ ] PUT /conversations/:id/archive - Archive conversation
- [ ] POST /conversations/:id/block - Block user

### 9.2 User Messaging [Spec §16.1]

#### Enquiry Flow

- [ ] "Send Message" button on business profiles
- [ ] Enquiry form (subject, message, contact preference)
- [ ] Pre-defined enquiry types (general, booking, quote, complaint)
- [ ] CAPTCHA or honeypot for spam prevention
- [ ] Confirmation message on send

#### Conversation UI

- [ ] Conversations list (inbox view)
- [ ] Unread indicator/badge
- [ ] Conversation thread view
- [ ] Message bubbles with timestamps
- [ ] Read receipts display
- [ ] Image attachment support
- [ ] Message character limit
- [ ] Real-time message updates (WebSocket or polling)

### 9.3 Business Inbox [Spec §16.2]

- [ ] Business inbox dashboard
- [ ] Unread count badge
- [ ] Mark as read/unread
- [ ] Archive functionality
- [ ] Search conversations
- [ ] Filter by status (all, unread, archived)
- [ ] Quick reply templates (saved responses)
- [ ] Auto-response configuration
- [ ] Response time goal setting
- [ ] Response rate display
- [ ] Messaging analytics (response time, volume)

### 9.4 Privacy & Safety [Spec §16.3]

- [ ] Contact info privacy (no direct email/phone in messages)
- [ ] Block user functionality
- [ ] Report message/conversation
- [ ] Spam detection system
- [ ] Rate limiting (max 10 new conversations/day)
- [ ] Blocked users management
- [ ] Inappropriate content filtering

---

## Phase 10: Deals & Promotions Hub

### 10.1 Deals Data [Spec §17, Appendix A.6]

#### Data Models

- [ ] Deal model (all fields from spec)
- [ ] DealCategory model
- [ ] DealRedemption model (deal_id, user_id, redeemed_at, method)
- [ ] SavedDeal model (user_id, deal_id, saved_at)
- [ ] DealAlert model (user_id, preferences)

#### API Endpoints [Appendix B.8]

- [ ] GET /deals - List deals with filters
- [ ] GET /deals/featured - Featured deals
- [ ] GET /deals/flash - Active flash deals
- [ ] GET /deals/:id - Deal details
- [ ] POST /deals - Create deal
- [ ] PUT /deals/:id - Update deal
- [ ] DELETE /deals/:id - Delete deal
- [ ] POST /deals/:id/save - Save deal
- [ ] DELETE /deals/:id/save - Unsave deal
- [ ] POST /deals/:id/redeem - Redeem deal
- [ ] GET /deals/:id/analytics - Deal performance
- [ ] GET /businesses/:id/deals - Business's deals
- [ ] GET /users/:id/saved-deals - User's saved deals

### 10.2 Deals Discovery [Spec §17.5]

- [ ] Deals hub page
- [ ] Deal card component (image, title, discount, business, expiry)
- [ ] Today's Deals section
- [ ] Ending Soon section (24hrs)
- [ ] New This Week section
- [ ] Most Popular section
- [ ] Near You section
- [ ] Category filtering
- [ ] Discount type filtering (%, $, BOGO, etc.)
- [ ] Distance filtering
- [ ] Search within deals

### 10.3 Flash Deals [Spec §17.1]

- [ ] Flash deal creation (business owners)
- [ ] Countdown timer component
- [ ] Quantity limit setting
- [ ] Remaining count display
- [ ] Push notifications for flash deals
- [ ] 2 per week limit validation
- [ ] Expedited moderation queue
- [ ] Flash deal badge/styling

### 10.4 Deal Redemption [Spec §17.4]

- [ ] Show Screen redemption method
- [ ] Unique code generation
- [ ] QR code generation
- [ ] Redemption confirmation flow
- [ ] Redemption tracking and history
- [ ] Single-use vs multi-use handling
- [ ] Redemption limit enforcement
- [ ] User's saved deals list
- [ ] User's redemption history

### 10.5 Deal Management (Business Owners)

- [ ] Deal creation form
- [ ] Deal types (percentage, fixed, BOGO, free item, etc.)
- [ ] Validity period setting
- [ ] Usage limits (total, per user)
- [ ] Terms and conditions field
- [ ] Deal image upload
- [ ] Max 5 active promotions validation
- [ ] Deal editing
- [ ] Deal pause/resume
- [ ] Featured deal request
- [ ] Deal analytics dashboard

### 10.6 Deal Alerts [Spec §17.5]

- [ ] Flash deal push notifications
- [ ] Category-based alerts
- [ ] Business-specific alerts
- [ ] Threshold alerts (discounts over X%)
- [ ] Proximity alerts (deals near user)
- [ ] Alert preferences management
- [ ] Personalised deal recommendations

---

## Phase 11: Community Features

### 11.1 Community Noticeboard [Spec §19.1]

#### Data Models [Appendix A.10]

- [ ] Notice model (user_id, type, title, content, images, expires_at)
- [ ] NoticeCategory model

#### Notice Types

- [ ] Items for Sale/Wanted
- [ ] Services Offered/Wanted
- [ ] Lost & Found
- [ ] Community Announcements
- [ ] Local Recommendations
- [ ] Volunteer Opportunities
- [ ] Carpool/Rideshare

#### Noticeboard Features

- [ ] Notice listing page
- [ ] Category filtering
- [ ] Search within notices
- [ ] Notice creation form
- [ ] Image upload (up to 3)
- [ ] 30-day auto-expiry
- [ ] 3 active notices per user limit
- [ ] Contact via platform messaging
- [ ] Notice renewal
- [ ] Moderation workflow
- [ ] Report functionality

#### API Endpoints [Appendix B.12]

- [ ] GET /notices - List active notices
- [ ] GET /notices/:id - Get single notice
- [ ] POST /notices - Create notice
- [ ] PUT /notices/:id - Update own notice
- [ ] DELETE /notices/:id - Delete own notice
- [ ] POST /notices/:id/report - Report notice

### 11.2 Community Groups Hub [Spec §19.2]

#### Data Models [Appendix A.11]

- [ ] CommunityGroup model
- [ ] GroupCategory model
- [ ] GroupModerator model

#### Group Features

- [ ] Group listing page
- [ ] Category filtering (sports, cultural, hobby, etc.)
- [ ] Group detail page
- [ ] External link (Facebook group, website, etc.)
- [ ] Meeting schedule display
- [ ] Contact information
- [ ] Group submission form
- [ ] Moderator management

#### API Endpoints [Appendix B.13]

- [ ] GET /groups - List community groups
- [ ] GET /groups/:id - Get group details
- [ ] POST /groups - Submit new group
- [ ] PUT /groups/:id - Update group

### 11.3 Local News & Announcements [Spec §19.4]

#### Data Models [Appendix A.12]

- [ ] Announcement model
- [ ] AnnouncementSource model (council, chamber, platform)

#### News Features

- [ ] News feed page
- [ ] Pinned/featured announcements
- [ ] Category filtering
- [ ] Source filtering
- [ ] Search functionality
- [ ] Date range filtering
- [ ] Share functionality

#### API Endpoints [Appendix B.15]

- [ ] GET /announcements - List announcements
- [ ] GET /announcements/:id - Get single announcement
- [ ] POST /announcements - Create announcement (admin)
- [ ] PUT /announcements/:id - Update announcement
- [ ] DELETE /announcements/:id - Delete announcement

### 11.4 Local History Archive [Spec §19.3]

#### Data Models [Appendix A.13]

- [ ] HistoricalContent model
- [ ] HistoricalCategory model (era, topic, type)

#### History Features

- [ ] History archive page
- [ ] Browse by era/decade
- [ ] Browse by category
- [ ] Search functionality
- [ ] Content submission form (community contribution)
- [ ] Moderation workflow for submissions
- [ ] Photo/document upload
- [ ] Oral history support (audio/video links)
- [ ] Timeline view

#### API Endpoints [Appendix B.14]

- [ ] GET /history - List historical content
- [ ] GET /history/:id - Get single item
- [ ] POST /history - Submit historical content
- [ ] PUT /history/:id - Update (admin)
- [ ] DELETE /history/:id - Delete (admin)

---

## Phase 12: Social Media Integration

### 12.1 Community Feed [Spec §20.1]

#### Aggregation Features

- [ ] Hashtag aggregation (configurable hashtags)
- [ ] Instagram post import
- [ ] Facebook post import
- [ ] Twitter/X post import (if supported)
- [ ] Masonry grid layout
- [ ] Photo-focused display
- [ ] Post attribution with links
- [ ] Location filtering (suburb only)
- [ ] Content moderation queue
- [ ] Manual removal capability
- [ ] Refresh/update mechanism

### 12.2 Business Social Feeds [Spec §20.2]

- [ ] Latest posts display on business profiles
- [ ] Facebook post embedding
- [ ] Instagram post embedding
- [ ] Follow buttons (link to social profiles)
- [ ] Sync mechanism (scheduled fetch)
- [ ] Manual refresh option

### 12.3 Community Competitions [Spec §20]

- [ ] Competition/challenge announcements
- [ ] Theme display
- [ ] Submission tracking via hashtag
- [ ] Voting mechanism (if applicable)
- [ ] Winner selection and display
- [ ] Prize information

---

## Phase 13: B2B Networking

### 13.1 B2B Profiles [Spec §21.1, Appendix A.7]

#### Data Models

- [ ] BusinessNetworkProfile model
- [ ] BusinessConnection model (status, message, connected_at)

#### B2B Profile Fields

- [ ] Services offered to other businesses
- [ ] Services needed from other businesses
- [ ] Partnership interests
- [ ] Preferred communication method
- [ ] Availability for collaboration

#### API Endpoints [Appendix B.9]

- [ ] GET /b2b/directory - B2B directory
- [ ] GET /b2b/profile/:businessId - B2B profile
- [ ] PUT /b2b/profile/:businessId - Update B2B profile

### 13.2 B2B Directory & Connections [Spec §21.2]

#### API Endpoints

- [ ] GET /b2b/connections - List connections
- [ ] POST /b2b/connections - Request connection
- [ ] PUT /b2b/connections/:id - Accept/reject connection
- [ ] DELETE /b2b/connections/:id - Remove connection

#### Directory Features

- [ ] B2B directory page
- [ ] Filter by services offered
- [ ] Filter by services needed
- [ ] Filter by category
- [ ] Search functionality
- [ ] Connection request flow
- [ ] Connection status tracking
- [ ] Connection management dashboard
- [ ] Export contacts (CSV)

### 13.3 B2B Messaging [Spec §21.3]

#### API Endpoints

- [ ] GET /b2b/messages - B2B messages
- [ ] POST /b2b/messages - Send B2B message

#### Features

- [ ] B2B inbox (separate from customer messages)
- [ ] Rich message support
- [ ] File sharing (documents, images)
- [ ] Meeting scheduler integration
- [ ] Message threading

### 13.4 Collaboration Tools [Spec §21.4]

- [ ] Joint promotion creation
- [ ] Cross-promotion partnerships
- [ ] Referral tracking system
- [ ] Referral dashboard
- [ ] Commission/reward tracking

### 13.5 B2B Forum & Events [Spec §21, Appendix A.8]

#### API Endpoints

- [ ] GET /b2b/forum - Forum topics
- [ ] GET /b2b/forum/:topicId - Topic detail
- [ ] POST /b2b/forum - Create topic
- [ ] POST /b2b/forum/:topicId/replies - Reply to topic
- [ ] POST /b2b/forum/:replyId/upvote - Upvote reply
- [ ] GET /b2b/events - B2B events
- [ ] POST /b2b/referrals - Log referral
- [ ] GET /b2b/referrals - Referral history

#### Forum Features

- [ ] Forum topic listing
- [ ] Create topic form
- [ ] Threaded replies
- [ ] Upvoting system
- [ ] Topic categories
- [ ] Search within forum
- [ ] Notification on replies

#### B2B Events

- [ ] B2B events listing
- [ ] Networking event RSVP
- [ ] Business representative selection

### 13.6 Chamber Integration [Spec §21]

- [ ] Chamber announcements section
- [ ] Chamber member badge
- [ ] Chamber events integration
- [ ] Resources section (guides, templates)
- [ ] Chamber contact information
- [ ] Member benefits display

---

## Phase 14: Emergency & Crisis Communication

### 14.1 Alert System [Spec §22, Appendix A.9]

#### Data Models

- [ ] Alert model (all fields from spec)
- [ ] BusinessEmergencyStatus model
- [ ] AlertCheckIn model

#### API Endpoints [Appendix B.10]

- [ ] GET /alerts - All alerts
- [ ] GET /alerts/active - Currently active alerts
- [ ] GET /alerts/:id - Alert details
- [ ] GET /alerts/history - Past alerts
- [ ] POST /alerts - Create alert (admin)
- [ ] PUT /alerts/:id - Update alert
- [ ] POST /alerts/:id/resolve - Resolve alert
- [ ] PUT /users/:id/alert-preferences - User alert preferences
- [ ] POST /alerts/:id/check-in - User safety check-in
- [ ] GET /businesses/:id/emergency-status - Business emergency status
- [ ] PUT /businesses/:id/emergency-status - Update business status

### 14.2 Alert Display [Spec §22.1]

- [ ] Alert level styling (Critical-red, Warning-orange, Advisory-yellow, Info-blue)
- [ ] Full-width banner for critical alerts
- [ ] Header indicator for active alerts
- [ ] Alert centre page
- [ ] Alert detail view
- [ ] Affected area display on map
- [ ] Resource links
- [ ] Action buttons (share, check-in)

### 14.3 Alert Distribution [Spec §22.2]

- [ ] Push notifications for critical alerts
- [ ] SMS integration for emergency alerts (Twilio)
- [ ] WhatsApp integration for emergency alerts (Twilio WhatsApp API)
- [ ] Email notifications
- [ ] User alert preferences UI
- [ ] Category preferences (weather, fire, traffic, health, etc.)
- [ ] Quiet hours setting
- [ ] Critical override option

### 14.4 Business Emergency Status [Spec §22.3]

- [ ] Status options (Open, Modified Hours, Closed Temporarily, Affected, Closed Until Further Notice)
- [ ] Quick update buttons in dashboard
- [ ] Status message (custom text)
- [ ] Expected reopening date
- [ ] Status badge display on business profiles
- [ ] Follower notifications on status change
- [ ] Status history log

### 14.5 Community Safety [Spec §22.4]

- [ ] Safety check-in system
- [ ] Resource information display
- [ ] Emergency contacts page
- [ ] First aid locations
- [ ] Evacuation information
- [ ] Community support resources

### 14.6 External Alert Integrations [Spec §22, §26]

- [ ] NSW Emergency Services feed integration
- [ ] Bureau of Meteorology (BOM) weather alerts
- [ ] Transport NSW disruptions
- [ ] Council emergency communications
- [ ] Automatic alert import
- [ ] Manual verification workflow

---

## Phase 15: Administration & Analytics

### 15.1 Admin Dashboard [Spec §23.1]

- [ ] Admin dashboard overview
- [ ] Key metrics widgets
- [ ] Active users chart
- [ ] New registrations chart
- [ ] Business activity summary
- [ ] Content pending moderation
- [ ] Recent alerts/issues
- [ ] Quick action buttons

### 15.2 User Management [Spec §23.2, Appendix B.20]

- [ ] User listing with search/filter
- [ ] User detail view
- [ ] Role assignment
- [ ] User suspension
- [ ] User reactivation
- [ ] Password reset for users
- [ ] User activity log
- [ ] Account deletion processing

### 15.3 Business Management [Spec §23.3]

- [ ] Business listing with search/filter
- [ ] Business detail/edit view
- [ ] Claim request queue
- [ ] Claim approval/rejection
- [ ] Business suspension
- [ ] Featured business selection
- [ ] Profile completeness tracking
- [ ] Automated incomplete profile reminders
- [ ] Bulk import functionality
- [ ] Bulk update functionality

### 15.4 Content Moderation [Spec §23.4]

- [ ] Moderation queue dashboard
- [ ] Queue filtering (type, status, age)
- [ ] Quick approve/reject actions
- [ ] Preview content in queue
- [ ] Rejection reason selection
- [ ] Rejection notification to user
- [ ] Moderation log (audit trail)
- [ ] Reports/flags queue
- [ ] Content removal with reason
- [ ] Appeal handling workflow [Spec §24.4]

### 15.5 Platform Analytics [Spec §25]

- [ ] Platform-wide metrics dashboard
- [ ] User analytics (registrations, active users, retention)
- [ ] Business analytics (total, by category, verification rate)
- [ ] Content analytics (reviews, events, deals)
- [ ] Engagement metrics (searches, views, actions)
- [ ] Performance metrics (load times, errors)
- [ ] Geographic distribution
- [ ] Language usage statistics
- [ ] Device/platform breakdown
- [ ] Custom date range selection
- [ ] Comparison to previous periods

### 15.6 Reporting [Spec §25]

- [ ] Standard report templates
- [ ] Custom report builder
- [ ] Scheduled report generation
- [ ] Email report delivery
- [ ] CSV export
- [ ] PDF export
- [ ] Council reporting package
- [ ] Chamber reporting package
- [ ] CID pilot metrics

### 15.7 Survey System [Spec §23, Appendix B]

- [ ] Survey builder interface
- [ ] Question types (text, single choice, multiple choice, scale, matrix)
- [ ] Conditional logic
- [ ] Survey distribution (email, in-app, link)
- [ ] Response collection
- [ ] Survey analytics dashboard
- [ ] Response export
- [ ] Anonymous vs identified responses

---

## Phase 16: External Integrations

### 16.1 Google Business Profile API [Spec §26.1]

- [ ] OAuth 2.0 implementation
- [ ] Business data import
- [ ] Hours synchronisation
- [ ] Photo import
- [ ] Review import (display only)
- [ ] Sync scheduling (daily)
- [ ] Manual sync trigger
- [ ] Conflict resolution (platform vs Google)
- [ ] Manual override flags

### 16.2 Facebook & Instagram APIs [Spec §26.2]

- [ ] Facebook OAuth implementation
- [ ] Instagram Basic Display API setup
- [ ] Page information import
- [ ] Posts import for business feeds
- [ ] Events import from Facebook
- [ ] Hashtag aggregation for community feed
- [ ] Rate limiting handling
- [ ] Token refresh automation

### 16.3 Email Service [Spec §26.3]

- [ ] Mailgun provider setup
- [ ] Email template system
- [ ] Template management in admin
- [ ] Personalisation tokens
- [ ] Open/click tracking
- [ ] Bounce handling
- [ ] Unsubscribe management
- [ ] Email queue system

#### Email Templates Required

- [ ] Welcome email
- [ ] Email verification
- [ ] Password reset
- [ ] Business claim notification
- [ ] Claim approved/rejected
- [ ] New message notification
- [ ] New review notification
- [ ] Event reminder
- [ ] Deal alerts
- [ ] Emergency alerts
- [ ] Newsletter template

### 16.4 Maps Integration [Spec §26.4]

- [ ] Mapbox GL JS setup and access token configuration
- [ ] Map component for business locations
- [ ] Multiple business map view
- [ ] Custom business markers
- [ ] Directions deep link (Mapbox, Google Maps, Apple Maps)
- [ ] Geocoding service (address to coordinates)
- [ ] Reverse geocoding (coordinates to address)
- [ ] Distance calculation
- [ ] Boundary polygon display

### 16.5 Translation API [Spec §8.3]

- [ ] Google Translate API integration
- [ ] On-demand translation for user content
- [ ] Translation caching
- [ ] Translation quality feedback
- [ ] Language detection
- [ ] Batch translation for performance

### 16.6 SMS Integration [Spec §26.5]

- [ ] Twilio provider setup (Account SID, Auth Token, phone number)
- [ ] SMS template system
- [ ] Twilio WhatsApp Business API setup (approved sender number)
- [ ] WhatsApp message template registration and approval
- [ ] User preference for notification channel (SMS, WhatsApp, or both)
- [ ] Verification PIN messages
- [ ] Critical alert messages
- [ ] Event reminders
- [ ] Rate limiting (max 1 per 5 minutes)

### 16.7 Push Notifications (Firebase) [Spec §26.6]

- [ ] Firebase Cloud Messaging setup
- [ ] Notification payload structure
- [ ] Notification types configuration
- [ ] Priority levels (normal, high, critical)

---

## Phase 17: PWA & Performance

### 17.1 PWA Features [Spec §3]

- [ ] Web App Manifest with all required fields
- [ ] Install prompt handling (iOS and Android)
- [ ] App icons (all required sizes)
- [ ] Splash screens
- [ ] Push notification setup (FCM/Web Push)
- [ ] Push permission request flow
- [ ] Notification preferences sync

### 17.2 Offline Capability [Spec §3]

- [ ] Service worker implementation
- [ ] Cache-first strategy for static assets
- [ ] Network-first strategy for API calls
- [ ] Offline homepage
- [ ] Offline business profiles (recently viewed)
- [ ] Offline saved businesses
- [ ] Limited offline search (cached data)
- [ ] Action queue for offline submissions
- [ ] Background sync when online
- [ ] Offline indicator UI

### 17.3 Performance Optimisation [Spec §3]

- [ ] Image optimisation (WebP, responsive sizes)
- [ ] Lazy loading for images
- [ ] Code splitting by route
- [ ] Bundle size optimisation
- [ ] Critical CSS extraction
- [ ] Font optimisation (font-display: swap)
- [ ] API response caching (Redis)
- [ ] Database query optimisation
- [ ] Index optimisation
- [ ] Cloudflare CDN caching optimisation for static assets and media
- [ ] Lighthouse CI integration
- [ ] Performance monitoring (Core Web Vitals)

---

## Phase 18: Multilingual Expansion

### 18.1 UI Translation [Spec §8]

#### High Priority Languages

- [ ] English (en) - Primary (complete)
- [ ] Arabic (ar) - High priority
- [ ] Chinese Simplified (zh-CN) - High priority
- [ ] Vietnamese (vi) - High priority

#### Medium Priority Languages

- [ ] Chinese Traditional (zh-TW)
- [ ] Hindi (hi)
- [ ] Urdu (ur)

#### Lower Priority Languages

- [ ] Korean (ko)
- [ ] Greek (el)
- [ ] Italian (it)

### 18.2 RTL Support [Spec §8.4]

- [ ] RTL stylesheet generation
- [ ] Arabic layout testing and fixes
- [ ] Urdu layout testing and fixes
- [ ] Bidirectional text handling
- [ ] Icon mirroring for RTL
- [ ] Form field alignment for RTL
- [ ] Navigation RTL layout

### 18.3 Translation Management

- [ ] Translation key extraction
- [ ] Missing translation detection
- [ ] Translation file validation
- [ ] Professional translation procurement
- [ ] Community translation feedback
- [ ] Translation update workflow

---

## Phase 19: Deployment Infrastructure

> **Note:** This phase covers production hosting and CDN setup. It should be completed once all development phases are done and the platform is ready for production deployment.

### 19.1 DigitalOcean Droplet Infrastructure

- [ ] Configure Nginx as reverse proxy with SSL termination (Cloudflare Origin Certificate)
- [ ] Create Dockerfile for application
- [ ] Create Docker Compose configuration for all services (app, PostgreSQL, Redis, Elasticsearch)
- [ ] Configure UFW firewall rules (allow 80, 443, 22 only)
- [ ] Set up server hardening (fail2ban, SSH key-only auth, disable root login)
- [ ] Configure process management (PM2 or systemd) for application restarts
- [ ] Set up automated PostgreSQL backups (pg_dump + WAL archiving, daily)
- [ ] Configure log rotation (logrotate for application and Nginx logs)
- [ ] Set up monitoring (Prometheus + Grafana or DigitalOcean monitoring)
- [ ] Create health check endpoints (`GET /health`, `GET /status`) [Spec Appendix B]

### 19.2 Cloudflare Setup

- [ ] Add domain to Cloudflare and update registrar nameservers
- [ ] Configure DNS records (A record to Droplet IP, CNAME for www)
- [ ] Enable SSL/TLS Full (Strict) mode with Cloudflare edge certificates
- [ ] Generate Cloudflare Origin Certificate and install on Nginx
- [ ] Configure caching rules (static assets, media, API bypass)
- [ ] Enable WAF managed rules and DDoS protection
- [ ] Set up Page Rules (force HTTPS, cache levels, security level)
- [ ] Configure API token for programmatic cache purge on content updates
- [ ] Set up Cloudflare firewall rules (rate limiting, bot management)
- [ ] Configure Browser Integrity Check and Hotlink Protection

---

## Ongoing Tasks

### Testing [Spec §30]

- [ ] Unit test coverage > 80%
- [ ] Integration tests for all API endpoints
- [ ] E2E tests for critical user journeys
- [ ] Accessibility testing (axe-core, screen reader) [Spec §30.1]
- [ ] Performance testing (Lighthouse CI)
- [ ] Security testing (OWASP ZAP) [Spec §30.5]
- [ ] Cross-browser testing [Spec §30.2]
- [ ] Mobile device testing [Spec §30.3]
- [ ] RTL layout testing
- [ ] Load testing scenarios [Spec §30.4]

### Legal & Compliance [Spec §5]

- [ ] Terms of Service document (all required sections) [Spec §5.1]
- [ ] Privacy Policy (APP compliant) [Spec §5.2]
- [ ] Cookie consent flow implementation [Spec §5.3]
- [ ] Content licensing terms [Spec §5.4]
- [ ] Dispute resolution process [Spec §5.5]

### Onboarding Flows [Spec §9]

- [ ] First-time user experience flow [Spec §9.1]
- [ ] Business owner onboarding wizard [Spec §9.2]
- [ ] QR code registration flow [Spec §9.3]

### Documentation

- [ ] API documentation (OpenAPI/Swagger)
- [ ] Component documentation (Storybook)
- [ ] Architecture documentation
- [ ] Deployment documentation
- [ ] User guides
- [ ] Business owner guides
- [ ] Admin guides
- [ ] Translation contributor guide

### Maintenance [Spec §31]

- [ ] Dependency update schedule
- [ ] Security patch process
- [ ] Performance monitoring setup
- [ ] Error tracking setup (Sentry or similar)
- [ ] Uptime monitoring
- [ ] Backup verification [Spec §28.1]
- [ ] Disaster recovery testing

---

## Notes

_Add any additional notes, decisions, or blockers here._

---

**Total Estimated Tasks:** ~650+ items across 19 phases
**Completed:** 42 tasks (Phase 1.1 + 1.2 + 1.3 + 1.4 + 1.5) -- ~6.5% overall
**Next:** Phase 1.6 (Email Service)

---
