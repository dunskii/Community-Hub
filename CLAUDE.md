# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

**Community Hub** - A location-agnostic Digital Community Improvement Hub (DCIH) platform for local business discovery and community engagement.

**First Deployment:** Guildford South precinct (Sydney, Australia)
**Architecture:** Designed for multi-suburb deployment with configuration-only changes (no code modifications)

### Current Status (17 March 2026)

- **Phase 1 (Foundation):** ✅ Complete (59/59 tasks)
- **Phase 2 (Authentication):** ✅ Complete (33/33 tasks)
- **Phase 3 (Design System):** ✅ Complete (40/40 tasks) - 31 components, WCAG 2.1 AA
- **Phase 4 (Business Directory):** ✅ Complete (39/39 tasks) - 100/100 security score
- **Phase 5 (Search & Discovery):** ✅ Complete (34/34 tasks) - Elasticsearch integration
- **Phase 6 (User Engagement):** ✅ ~90% Complete (31/35 tasks - 4 deferred to later phases)
- **Phase 7 (Business Owner):** ✅ ~85% Complete (28/33 tasks - claim, dashboard, analytics)
- **Phase 8 (Events & Calendar):** ✅ 98% Complete (33/35 tasks) - Calendar views, RSVP, reminders
- **Phase 9 (Messaging System):** ✅ 95% Complete (26/28 tasks) - QA R3 PASS, production-ready
- **v2.2 UI/UX Specification:** ✅ Complete (9 phases UX-1 through UX-9) - 72 tests, QA R2 PASS
- **MVP 1:** ✅ Complete (Static Business Directory - Phases 1-4)
- **MVP 2:** ✅ Complete (Phase 5 + Phase 6)
- **MVP 3:** ✅ ~85% Complete (Phase 7 - Business Owner Portal)
- **MVP 4:** ✅ Complete (Phases 8-9 - Events & Messaging)
- **Overall Progress:** ~53% (339/644 tasks) + v2.2 UI/UX
- **Total Tests:** 2,387+ passing

### Key References

- **Primary Spec:** `Docs/Community_Hub_Specification_v2.md` (authoritative source for all requirements, data models, API endpoints)
- **Progress:** `PROGRESS.md` (detailed phase status, milestones, QA reviews)
- **Tasks:** `TODO.md` (644 tasks across 19 phases)

## Location-Agnostic Architecture

**CRITICAL:** No location-specific data should be hardcoded. The platform uses a three-tier configuration system (see Section 2 of the specification):

1. **`.env`** - Sensitive credentials, API keys, environment-specific settings
2. **`config/platform.json`** - Location, branding, feature flags (edit this for new suburb deployments)
3. **Database** - Runtime-editable settings (categories, templates, system settings)

When implementing features, always reference configuration values rather than hardcoding suburb names, coordinates, or other location-specific data.

## Architecture & Stack

### Implemented Stack

- **Frontend:** React 18.3 + TypeScript, Vite 6.0, Tailwind CSS 4
- **Backend:** Express 5.0, Node.js (ESM)
- **Database:** PostgreSQL 17 + Prisma 7.3 (PrismaPg adapter)
- **Caching:** Redis 7.4 (ioredis)
- **Search:** Elasticsearch 8.17
- **Testing:** Vitest 3.0, React Testing Library, jest-axe
- **Code Quality:** ESLint 9 (flat config), Prettier, TypeScript strict mode

### Integrations Configured

- **Maps:** Mapbox GL JS (map rendering, geocoding, static images) + deep links (Google Maps, Apple Maps, Waze for directions)
- **Analytics:** Google Analytics 4 (GA4)
- **Email:** Mailgun v12.7.0
- **i18n:** react-i18next v16.5.4 (10 languages, RTL support)
- **Future:** Google Business Profile API, Facebook/Instagram APIs, Google Translate API, Twilio (SMS/WhatsApp), Firebase (push notifications)

## Critical Requirements

### Location-Agnostic Architecture

**NEVER hardcode location-specific data.** Use the three-tier configuration system:

1. **`.env`** - Secrets, API keys, environment settings (never commit `.env`, only `.env.example`)
2. **`config/platform.json`** - Location, branding, feature flags (edit for new suburb deployments)
3. **Database** - Runtime-editable settings (categories, templates, system settings)

### Non-Negotiable Standards

- **Accessibility:** WCAG 2.1 AA compliance (all components tested with jest-axe, zero violations)
- **Mobile-First:** Breakpoints: <768px (mobile), 768-1199px (tablet), ≥1200px (desktop), 44px touch targets
- **Multilingual:** 10 languages with RTL support (Arabic, Urdu) - use react-i18next, never hardcode strings
- **Security:** bcrypt (cost 12+), CSRF protection, CSP/HSTS headers, input validation/sanitization, rate limiting
- **Testing:** >80% coverage target (current: 60% enforced), all new features require tests

### Performance Targets

- Page load: <3s on 3G
- API response: <200ms (p95)
- Lighthouse score: >80

## Implemented Features (Phases 1-3)

### Phase 1: Foundation (59/59 tasks ✅)

- Monorepo (pnpm workspaces): `packages/backend`, `packages/frontend`, `packages/shared`
- Configuration system with validation (Zod schemas)
- Express 5 API with middleware pipeline (CORS, rate limiting, error handling, request logging)
- Prisma 7.3 with 6 models: User, Category, UserSession, AuditLog, EmailTemplate, SystemSetting
- Redis caching, Elasticsearch search, local media storage (Sharp for images)
- Security: 5 headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy), CSRF, AES-256-GCM, 7 rate limiters
- Email service: Mailgun integration, template rendering (10 languages)
- Maps: Mapbox GL JS integration with geocoding, BusinessMap component, DirectionsButton
- Analytics: Google Analytics 4 implementation with event tracking
- i18n: react-i18next, 10 translation files, RTL support, useLanguage hook

### Phase 2: Authentication (33/33 tasks ✅)

- JWT authentication with HttpOnly cookies (access + refresh tokens)
- 9 auth endpoints: register, login, logout, verify-email, forgot-password, reset-password, refresh
- 10 user profile endpoints: get, update, password change, preferences, sessions, photo upload, deletion
- bcrypt hashing (cost 12), email verification, password reset (1hr expiry), session management
- Rate limiting: 10/15min (login), 3/hr (forgot password), 5/hr (reset password)
- User deletion grace period (30 days), profile photo upload (800x800px WebP)

### Phase 3: Design System (40/40 tasks ✅)

- **31 production-ready components:** 6 layout, 9 form, 12 display, 3 accessibility
- Runtime CSS variables from platform.json (colors, typography, spacing)
- WCAG 2.1 AA compliant (zero jest-axe violations across 424 tests)
- Mobile-first responsive (all components tested at 3 breakpoints)
- Components: Header, Footer, PageContainer, BottomNavigation, Sidebar, Grid, Input, Textarea, Select, Checkbox, RadioButton, Toggle, DatePicker, TimePicker, FileUpload, Modal, Toast, Alert, Badge, Avatar, Skeleton, EmptyState, Pagination, Tabs, Accordion, Carousel, LiveRegion, useFocusTrap, useAnnounce

## Specification Structure (v2.0)

The spec (`Docs/Community_Hub_Specification_v2.md`) is organized into 7 parts + appendices:

1. **Foundation & Architecture (§1-5):** Overview, Config, Technical, Security, Legal
2. **Design & UX (§6-9):** Design Specs, UI Components, Multilingual, Onboarding
3. **Users & Entities (§10-13):** User Types, Business Profile, Community User, Business Owner
4. **Core Functionality (§14-18):** Search, Events, Messaging, Deals, Reviews
5. **Community & Social (§19-22):** Community Features, Social Media, B2B, Emergency
6. **Administration (§23-26):** Admin, Content Policies, Analytics, Integrations
7. **Technical Ops (§27-31):** Error Handling, Data Management, Tech Ops, Testing, Operations

**Appendices:** A (22 data models), B (130+ API endpoints), C (Glossary)

## Development Workflow

### When Starting Work

1. Check `TODO.md` for current phase tasks
2. Review relevant spec sections (§X references in TODO)
3. Read `PROGRESS.md` for context on what's complete
4. Review recent QA findings in `md/review/` for patterns to avoid

### Code Standards

- **TypeScript:** Strict mode, no `any` types, explicit return types on functions
- **Testing:** Write tests before marking tasks complete (Vitest + React Testing Library)
- **Accessibility:** Run jest-axe on all UI components, test keyboard navigation
- **Git Commits:** Conventional commits format: `feat(phase-X): description`
- **Code Style:** ESLint + Prettier (run `pnpm lint:fix` and `pnpm format` before committing)

### Phase 4 Complete

**Business Directory Core** (39/39 tasks ✅):

- ✅ Business entity with all fields (Appendix A.1)
- ✅ API endpoints: GET/POST/PUT/DELETE `/businesses/*` (Appendix B.2)
- ✅ Business listing page with filters, sorting, pagination
- ✅ Business profile page with tabs (Overview, Photos, Reviews, Events, Deals)
- ✅ SEO metadata (Schema.org LocalBusiness, Open Graph, Twitter Cards)
- ✅ 209 comprehensive tests created (83% of target, exceeded 60-80% goal)
- ✅ QA High Priority Fixes complete (TypeScript `any` removed, console statements removed)
- ✅ Production-ready with 100/100 security score

### Phase 5 Complete

**Search & Discovery** (34/34 tasks ✅):

- ✅ Elasticsearch integration with optimized indexes
- ✅ 4 search API endpoints (businesses, autocomplete, featured, popular)
- ✅ Full-text search with relevance scoring and fuzzy matching
- ✅ SearchBar with autocomplete (300ms debounce, keyboard nav)
- ✅ 7 filter types (category, distance, rating, open now, verified, promotions, events)
- ✅ 7 sort options (relevance, distance, rating, newest, alphabetical, most reviewed)
- ✅ Homepage with 7 discovery sections (hero, featured, near you, highly rated, new)
- ✅ Database enhancements (timezone, featured, displayOrder fields)
- ✅ Search result caching (Redis, 5-min TTL)
- ✅ 110+ tests added (1,419+ total passing)
- ✅ Zero TypeScript errors, zero console statements
- ✅ WCAG 2.1 AA compliant, production-ready

### Phase 6 Complete (~90%)

**User Engagement Features** (31/35 tasks - 4 strategically deferred):

**Data Models (8 models + 6 enums):**
- Review, ReviewPhoto, ReviewHelpful (Spec A.4)
- SavedBusiness, SavedList (Spec A.16)
- BusinessFollow (Spec A.23)
- ModerationReport, Appeal (Spec A.22)
- Enums: ReviewStatus, ContentType, ReportReason, ModerationStatus, ModerationAction, AppealStatus

**Backend Services (1,677 lines total):**
- ReviewService (709 lines) - CRUD, helpful voting, reporting, business responses
- SavedService (375 lines) - Save/unsave, custom lists management
- FollowService (228 lines) - Follow/unfollow, count tracking
- ModerationService (365 lines) - Queue, approve/reject actions

**API Endpoints (26 total):**
- Review: 10 endpoints (create, read, update, delete, helpful, report, respond)
- Saved: 6 endpoints (businesses, custom lists)
- Follow: 6 endpoints (follow/unfollow, status, counts)
- Moderation: 3 endpoints (queue, approve, reject - admin only)
- /users/me alias support via resolveMe middleware

**Frontend Components (8):**
- StarRating (1-5, interactive/readonly)
- ReviewForm (50-1000 chars, photo upload)
- ReviewCard (44 tests), ReviewList (37 tests)
- SaveButton, FollowButton (39 tests)
- ModerationQueue, AdminProtectedRoute

**Frontend Pages (3):**
- SavedBusinessesPage (with custom lists)
- FollowingPage (with pagination)
- ModerationPage (admin-only)

**Security & Quality:**
- 6 rate limiters configured
- 9 validation schemas (Zod)
- WCAG 2.1 AA compliant
- 120+ Phase 6 tests added
- 10/10 languages (100% i18n)
- 2 QA reviews passed (R1 March 3, R2 March 11)

**Deferred Items (4 tasks):**
- Following feed (Phase 7+ - requires events/deals)
- Language detection, translation button (Phase 18 - Google Translate)
- Profanity/spam filtering (Phase 15 - admin dashboard)

### Phase 7 Complete (~85%)

**Business Owner Features** (28/33 tasks - 5 deferred to Phase 7.2):

**Data Models (4 models + 4 enums):**
- BusinessClaimRequest (24 fields) - Claim tracking with verification
- BusinessAnalyticsEvent (10 fields) - Individual event records
- BusinessAnalyticsDaily (13 fields) - Daily aggregated metrics
- BusinessOwnerStaff (7 fields) - Staff accounts (future)
- Enums: VerificationMethod, ClaimVerificationStatus, ClaimStatus, AnalyticsEventType

**Backend Services (1,718 lines total):**
- ClaimService (995 lines) - Phone/email/document verification, PIN hashing, appeals
- AnalyticsService (723 lines) - Event tracking, aggregation, insights, CSV export

**API Endpoints (12 total):**
- Claim: 8 endpoints (initiate, verify-pin, verify-email, resend-pin, appeal, queue, approve, reject)
- Analytics: 4 endpoints (get, export CSV, track event, track profile view)

**Frontend Pages (3):**
- ClaimBusinessPage (590 lines) - Multi-step verification flow
- OwnerDashboardPage (371 lines) - Business management with stats
- AnalyticsDashboardPage (479 lines) - Full analytics display

**Security & Quality:**
- PIN hashing (bcrypt cost 10), JWT email tokens
- 6 rate limiters, IP anonymization (SHA-256)
- 656+ test lines added
- 10/10 languages (186 keys each)
- QA review passed

**Deferred Items (5 tasks - Phase 7.2):**
- Profile management forms
- Photo gallery management
- Staff account management
- Ownership transfer flow
- PDF export

### Phase 8 Complete (98%)

**Events & Calendar System** (33/35 tasks - 2 deferred as nice-to-have):

**Data Models (2 models + 3 enums):**
- Event (22 fields) - Full event entity per Spec A.3
- EventRSVP (7 fields) - RSVP tracking with guest counts
- Enums: EventStatus (PENDING, ACTIVE, PAST, CANCELLED), LocationType (PHYSICAL, ONLINE, HYBRID), RSVPStatus (GOING, INTERESTED, NOT_GOING)

**Backend Services (1,965 lines total):**
- EventService (998 lines) - CRUD, status management, approval workflow
- EventRSVPService (425 lines) - RSVP operations, capacity management
- EventNotificationService (406 lines) - Email notifications (cancellation, update, reminders)
- EventExportService (136 lines) - ICS calendar export

**Event Reminder Scheduler:**
- EventReminderScheduler (~200 lines) - 24h/1h reminders
- Redis deduplication with database fallback
- Integrated into server startup/shutdown

**API Endpoints (11 total):**
- Event CRUD: 5 endpoints (list, get, create, update, delete)
- RSVP: 3 endpoints (create, cancel, get attendees)
- Additional: 3 endpoints (get by slug, export ICS, approve)

**Frontend Components (5):**
- EventCard, RSVPButton, EventFilters
- CalendarView (749 lines) - Month/Week/Day views, keyboard nav, RTL
- EventForm (777 lines) - Multi-step creation with validation

**Frontend Pages (2):**
- EventsListingPage - Grid with filters, sort, pagination
- EventDetailPage (609 lines) - Full details, RSVP, share

**Homepage Integration:**
- UpcomingEventsSection (207 lines) - 6 upcoming events display

**Security & Quality:**
- 6 rate limiters configured
- 9 validation schemas (Zod)
- ~360 tests (70 backend, 290 frontend, 80 E2E)
- 10/10 languages (~50 keys each)
- WCAG 2.1 AA compliant, keyboard navigation
- QA R3 passed

**Deferred Items (2 tasks):**
- EventSearch autocomplete (nice-to-have)
- Skip link for EventDetailPage (can use shared layout)

### Phase 9 Complete (95%)

**Messaging System** (26/28 tasks - 2 deferred):

**Data Models (5 models + 3 enums):**
- Conversation (10 fields) - User-to-business conversations with unique constraint
- Message (8 fields) - Messages with soft delete support
- MessageAttachment (6 fields) - Image attachments (JPEG, PNG, WebP)
- QuickReplyTemplate (6 fields) - Business owner saved responses
- Enums: ConversationStatus (ACTIVE, ARCHIVED, BLOCKED), SubjectCategory (5 types), SenderType (USER, BUSINESS)

**Backend Services (1,971 lines total):**
- ConversationService (1,074 lines) - CRUD, business inbox, block/report, unread counts
- MessageService (531 lines) - Send, read receipts, soft delete, batch sender loading
- QuickReplyService (366 lines) - Template CRUD, reordering

**API Endpoints (16 total):**
- Conversations: 10 endpoints (list, get, create, messages, read, archive, unarchive, report, delete message)
- Business inbox: 5 endpoints (get, unread count, block, unblock)
- Quick replies: 4 endpoints (list, create, update, delete)
- Messaging stats: 1 endpoint

**Frontend Components (5):**
- ConversationList (311 lines), ConversationView (354 lines)
- MessageBubble (221 lines), MessageInput (328 lines)
- NewConversationForm (417 lines)

**Frontend Pages (2):**
- MessagesPage (454 lines) - User inbox with conversation list/detail
- BusinessInboxPage (636 lines) - Business owner inbox with stats

**Security & Quality:**
- 6 rate limiters (10 conversations/day spam prevention per spec §16.2)
- 9 validation schemas (Zod)
- 90-day IP anonymization (Australian Privacy Principles)
- N+1 query optimization (batch sender loading)
- WCAG 2.1 AA compliant, keyboard navigation
- ~145 tests added (~60 backend, ~70 frontend, ~15 scheduler)
- 10/10 languages (~140 keys each)
- QA R3 PASS (97% score)

**Deferred Items (2 tasks):**
- SpamDetectionService (Phase 15 - requires admin dashboard)
- WebSocket real-time messaging (Phase 9.2 - polling sufficient for MVP)

### v2.2 UI/UX Specification Complete

**UI/UX Implementation** (9 phases UX-1 through UX-9):

**Foundation & Theming:**
- UX-1: Foundation tokens (4px spacing scale, animation timing, 44px touch targets)
- UX-2: Dark mode (ThemeContext, useTheme hook, ThemeToggle, system preference detection)
- UX-3: Shimmer loading (animations, prefers-reduced-motion, BusinessCardSkeleton, EventCardSkeleton)

**Interaction & Feedback:**
- UX-4: Keyboard shortcuts (useKeyboardShortcuts hook, GlobalShortcuts, KeyboardShortcutsHelp)
- UX-5: Enhanced toast (ToastContext, useToast hook, ToastContainer, close button)
- UX-6: Responsive images (ResponsiveImage with srcset, WebP, lazy loading)

**Resilience & Recovery:**
- UX-7: Offline behaviour (useOnlineStatus hook, OfflineBanner, SyncStatus, OfflineHandler)
- UX-8: Error recovery (ErrorBoundary, SessionTimeoutModal, RetryBanner, api-error-handler)
- UX-9: Message states (MessageStatus type, status indicators, retry for failed)

**Files Created (22):**
- Hooks: useTheme, useKeyboardShortcuts, useOnlineStatus, useToast
- Contexts: ThemeContext, ToastContext
- Components: ThemeToggle, KeyboardShortcutsHelp, OfflineBanner, SyncStatus, ResponsiveImage, GlobalShortcuts, OfflineHandler, ErrorBoundary, RetryBanner, SessionTimeoutModal, ToastContainer, BusinessCardSkeleton, EventCardSkeleton
- Utils: api-error-handler

**Quality:**
- 72 tests added (useTheme 20, useKeyboardShortcuts 24, useOnlineStatus 14, ErrorBoundary 14)
- WCAG 2.1 AA compliant
- 10/10 languages updated
- QA R2 PASS (97% score)

## Common Patterns

### Configuration Loading

```typescript
import { getPlatformConfig } from '@community-hub/shared';
const config = getPlatformConfig(); // Validated, merged config
const primaryColor = config.branding.colors.primary; // #2C5F7C by default
```

### Translations

```typescript
import { useTranslation } from 'react-i18next';
const { t } = useTranslation();
return <h1>{t('common.welcome')}</h1>; // Never hardcode English strings
```

### API Responses

```typescript
import { sendSuccess, sendError } from '../utils/response.js';
sendSuccess(res, data, 200);
sendError(res, 'ERROR_CODE', 'Message', 400); // Use spec error codes (§27)
```

## Key Files

- `packages/shared/src/config/platform-config.ts` - Config loading and validation
- `packages/shared/src/config/platform-schema.ts` - Zod schema for platform.json
- `packages/backend/src/middleware/` - Auth, rate limiting, validation, sanitization
- `packages/frontend/src/components/` - 31 reusable components (Phase 3)
- `packages/frontend/src/i18n/locales/` - Translation files (10 languages)
