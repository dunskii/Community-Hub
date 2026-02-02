# Phase 1: Foundation & Core Infrastructure - Study Notes

**Specification References:** Sections 2-8, 26, 29 of `Docs/Community_Hub_Specification_v2.md`
**Planning References:** `TODO.md` (lines 19-123), `PROGRESS.md` (lines 94-123), `Docs/Development_Roadmap.md` (lines 24-156)
**Duration:** January 2026 - July 2026 (6 months)
**Status:** Not Started (pre-development phase complete)
**Task Count:** 59 tasks across 8 subsections

> **Note:** DigitalOcean Droplet Infrastructure and Cloudflare Setup have been moved to Phase 19 (Deployment Infrastructure), to be completed once all development is done.

---

## Overview

Phase 1 establishes the entire technical foundation for the Community Hub platform. No user-facing features are delivered in this phase - it builds the infrastructure, security, configuration system, and development tooling that all subsequent phases depend on.

Phase 1 **blocks** Phase 2 (Auth & Users), Phase 3 (Design System), and Phase 4 (Business Directory).

---

## Subsections (8 areas, 59 tasks)

### 1.1.1 Development Environment (10 tasks)
- Monorepo structure setup
- Git repository and branching strategy (main, develop, feature/*)
- CI/CD pipelines (GitHub Actions)
- Development, staging, production environments
- ESLint configuration
- Prettier code formatting
- TypeScript configuration
- Testing framework (Jest/Vitest)

### 1.1.2 Configuration Architecture [Spec SS2] (6 tasks)

**3-tier configuration system (CRITICAL for location-agnostic deployment):**

| Tier | File | Purpose | Examples |
|------|------|---------|----------|
| 1 | `.env` | Sensitive credentials | DB creds, API keys, JWT secret, encryption key |
| 2 | `config/platform.json` | Location & branding | Suburb name, coordinates, timezone, colours, logos, feature flags |
| 3 | Database tables | Runtime-editable | Categories, system settings, email templates |

**Tasks:**
- `.env.example` template with all required variables
- `config/platform.json` schema and loader implementation
- Environment-specific config overrides (dev/staging/prod)
- Configuration validation on startup
- Feature flags system from config
- Deployment checklist documentation

**Feature Flags Available:**
businessDirectory, eventsCalendar, communityNoticeboard, messaging, dealsHub, b2bNetworking, emergencyAlerts, socialFeedAggregation, surveySystem, reviewsAndRatings, multilingual, pwaInstallation, smsAlerts, whatsappAlerts

### 1.1.3 Backend Infrastructure [Spec SS3] (8 tasks)
- PostgreSQL database with initial schema and migrations
- **Prisma ORM >= 7.3.0** (REQUIRED - must verify version)
- Redis for caching and sessions
- Local media storage on DigitalOcean Droplets
- RESTful API scaffolding (versioned: `/api/v1/`)
- Elasticsearch for full-text search
- Logging infrastructure [Spec SS29.1]

**API Response Format:**
```json
// Success
{ "success": true, "data": {...} }

// List with pagination
{ "success": true, "data": [...], "pagination": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 } }
```

### 1.1.4 Frontend Infrastructure [Spec SS3] (7 tasks)
- React with TypeScript initialization
- Responsive design system with breakpoints:
  - Mobile: < 768px (primary)
  - Tablet: 768-1199px
  - Desktop: >= 1200px
- Design tokens from config (colours, typography, spacing)
- Component library foundation
- PWA manifest configuration
- Service worker skeleton
- Build optimization (code splitting, tree shaking)

### 1.1.5 Security Foundation [Spec SS4] (11 tasks)

**Security Headers:**
- Content-Security-Policy
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- HSTS (max-age=31536000)
- Referrer-Policy

**Rate Limiting [Spec SS4.8]:**

| Endpoint | Limit |
|----------|-------|
| Auth endpoints | 10 req / 15 min |
| Password reset | 3 req / 1 hour |
| API (authenticated) | 100 req / 1 min |
| API (anonymous) | 30 req / 1 min |
| Search | 30 req / 1 min |
| File uploads | 20 / 1 hour |
| Review submissions | 5 / 24 hours |
| New conversations | 10 / 24 hours |
| Flash deals | 2 / 7 days |

**Additional Security:**
- TLS 1.3 configuration
- Input validation middleware
- AES-256 encryption for sensitive data at rest
- CSRF protection (SameSite=Strict cookies + CSRF tokens)
- Input sanitization (DOMPurify)
- Allowed HTML tags: p, br, strong, em, ul, ol, li, a (with rel="nofollow")

**Password Policy:**
- bcrypt cost factor 12+
- 8+ characters with uppercase + number

**JWT Configuration:**
- RS256 (asymmetric signing)
- 15-minute access token
- 7-day refresh token (30-day with remember-me)
- Token rotation on refresh
- Token revocation list in Redis

**Session:**
- Secure HTTP-only cookies
- SameSite=Strict, Path=/
- Failed login lockout: 5 attempts -> 15-minute lockout

**File Upload Security:**
- MIME validation via magic bytes (not extension)
- Max 5MB images / 10MB docs
- UUID filenames
- EXIF metadata stripping
- Path traversal rejection

### 1.1.6 Email Service Setup [Spec SS26.3] (5 tasks)
- Mailgun API setup and domain verification
- Base HTML email template (branded, responsive)
- Email verification template
- Password reset template
- Delivery and bounce handling configuration
- One-click unsubscribe configuration

### 1.1.7 Maps Integration [Spec SS26.4] (5 tasks)
- Mapbox API setup (access token, geocoding, map tiles)
- Map embed component for business profiles
- "Get Directions" link (Mapbox, Google Maps, Apple Maps deep links)
- Geocoding (address to coordinates)
- Distance calculation from user location

### 1.1.8 Internationalization (i18n) Foundation [Spec SS8] (6 tasks)

**10 Languages:**

| Language | Code | RTL | Priority |
|----------|------|-----|----------|
| English | en | No | Primary |
| Arabic | ar | Yes | High |
| Chinese Simplified | zh-CN | No | High |
| Chinese Traditional | zh-TW | No | Medium |
| Vietnamese | vi | No | High |
| Hindi | hi | No | Medium |
| Urdu | ur | Yes | Medium |
| Korean | ko | No | Low |
| Greek | el | No | Low |
| Italian | it | No | Low |

**Tasks:**
- Translation file structure (JSON per language)
- Language detection (browser preference, user setting, URL)
- Language switching UI component (header globe icon)
- RTL support infrastructure for Arabic/Urdu
- Translation key management workflow
- Text direction switching (LTR/RTL)

**Auto-Translation (Google Translate API):**
- Business descriptions, promotions, user content
- Language detection
- "Auto-translated" indicator displayed
- Owner can override translations

**Translated Elements:**
Navigation menus, action buttons, form labels, success/error/info messages, tooltips, email templates

---

## Data Models Required (from Appendix A)

### User (A.2)
```
id, email, password_hash, display_name, profile_photo, language_preference,
suburb, bio (max 500), interests, notification_preferences, role, status,
email_verified, created_at, updated_at, last_login
```
Roles: community, business_owner, moderator, admin

### Business (A.1)
```
id, name, slug, description (multilingual), category_primary, categories_secondary,
address (street, suburb, postcode, lat/long), phone, email, website, hours,
logo, cover_photo, gallery (max 50), social_links, languages, certifications,
payment_methods, accessibility, price_range, parking_info, year_established,
status, claimed, owner, created_at, updated_at, verified_at
```

### Category (A.14)
```
id, type (business/event/deal/notice/group), name (multilingual JSON),
slug, icon, parent_id (hierarchical), display_order, active, created_at
```

### AuditLog (A.18)
```
id, entity_type, entity_id, action, changes, user_id, timestamp
```

### ModerationReport (A.22)
```
id, content_type, content_id, reported_by, reason, status, reviewed_by, notes, created_at
```

---

## API Endpoints Required

### Authentication [Appendix B.1]
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /auth/verify-email`
- `POST /auth/resend-verification`
- `GET /auth/me`
- `POST /auth/refresh`

### Businesses [Appendix B.2]
- `GET /businesses` (list with pagination)
- `GET /businesses/:id` (details)
- `POST /businesses` (admin)
- `PUT /businesses/:id` (owner)
- `DELETE /businesses/:id` (admin)
- `GET /categories` (list categories)

### Users [Appendix B.4]
- `GET /users/:id` (profile)
- `PUT /users/:id` (update)
- `DELETE /users/:id` (delete account)

### Health [Appendix B.22]
- `GET /health` (API health check)
- `GET /status` (service status)

---

## Performance Targets [Spec SS3.2]

| Metric | Target |
|--------|--------|
| Page Load Time | < 3 seconds on 3G |
| Time to Interactive | < 5 seconds |
| First Contentful Paint | < 1.5 seconds |
| Lighthouse Performance Score | > 80 |
| API Response Time (p95) | < 200ms |

**Optimization Strategies:**
- Image optimization (WebP, responsive sizes, lazy loading)
- Code splitting by route
- Bundle size monitoring
- Critical CSS extraction
- Font optimization (font-display: swap)
- API response caching (Redis)
- Database query optimization with indexes
- Cloudflare CDN for static assets

---

## Design System Foundation [Spec SS6-7]

### Colours (configurable per deployment)
- Primary Teal: #2C5F7C (headers, primary buttons, links)
- Secondary Orange: #E67E22 (accents, highlights, CTAs)
- Accent Gold: #F39C12 (featured items, stars, badges)
- Success Green: #27AE60 (success, open status)
- Error Red: #E74C3C (errors, alerts)

### Typography
- Headings: Montserrat (H1: 32px bold, H2: 26px bold, H3: 22px semi-bold)
- Body: Open Sans (16px regular), Small (14px), Caption (12px)

### Components to Build
- Buttons (Primary, Secondary, Tertiary, Disabled states)
- Cards (8px radius, shadow, hover effects)
- Form fields (1px border, 4px radius, 12px x 16px padding)
- Icons system
- Loading states (skeleton screens with shimmer animation)
- Empty states (illustration + headline + action button)
- Modals (480px-800px, mobile: full screen)
- Toasts (bottom center/right, 4s duration)
- Tabs, Accordions, Dropdowns, Badges, Progress indicators

### Accessibility [Spec SS3.6]
- WCAG 2.1 AA compliance
- 4.5:1 colour contrast minimum
- Skip to main content link
- Visible 2px focus indicators
- Screen reader support (aria-live regions)
- Full keyboard navigation
- 44px minimum touch targets (mobile)
- Form label associations
- Alt text for all images

---

## Legal & Compliance [Spec SS5]

### Static Pages Required
1. **Terms of Service** (SS5.1) - acceptance, age 13+, prohibited conduct, content licensing
2. **Privacy Policy** (SS5.2) - APP compliant, data collection/use/sharing, user rights
3. **Cookie Policy** (SS5.3) - banner on first visit, categories (Essential, Functional, Analytics, Marketing)
4. **Content Licensing Terms** (SS5.4) - non-exclusive, worldwide, royalty-free license to platform

### Data Retention Schedule (SS5.2.2)
- Active user data: duration of account
- Deleted user data: 14-day grace period, then permanent deletion
- Messages: 2 years
- Analytics: 3 years
- Audit logs: 7 years

### Australian Privacy Principles (APP) Compliance [SS4.3]
- Collection Principle: Only necessary data
- Use Principle: Only stated purposes
- Disclosure Principle: No third-party sharing without consent
- Access Principle: Users can access their data
- Correction Principle: Users can correct data
- Security Principle: Protect from misuse/loss

---

## External Dependencies

### API Keys Required
- Mapbox (maps, geocoding)
- Google Translate API (auto-translation)
- Mailgun (email)
- Twilio (SMS/WhatsApp - Phase 2+)
- Firebase Cloud Messaging (push notifications)

### Infrastructure Required
- DigitalOcean account + Droplet(s)
- Cloudflare account + domain
- SSL certificates (Cloudflare Origin)
- Email domain verification (Mailgun)

---

## Critical Success Factors

1. **Configuration system must be truly location-agnostic** - no hardcoded suburb names, coordinates, or branding
2. **Multilingual infrastructure must be built in from day 1** - not retrofitted later
3. **WCAG 2.1 AA accessibility from start** - all components must meet standards
4. **Security headers and practices in foundation** - not bolted on after
5. **API versioning decided** - `/api/v1/` prefix on all endpoints

---

## Phase Dependencies

```
Phase 1 (Foundation) --> Phase 2 (Auth & Users)
Phase 1 (Foundation) --> Phase 3 (Design System)
Phase 1 (Foundation) --> Phase 4 (Business Directory)
Phase 2 (Auth & Users) --> Phase 5+ (features requiring authentication)
```
