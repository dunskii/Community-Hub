# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

**Community Hub** - A location-agnostic Digital Community Improvement Hub (DCIH) platform for local business discovery and community engagement.

**First Deployment:** Guildford South precinct (Sydney, Australia)
**Architecture:** Designed for multi-suburb deployment with configuration-only changes (no code modifications)

### Current Status (March 2026)

- **Phase 1 (Foundation):** ✅ Complete (59/59 tasks) - 575 total tests passing
- **Phase 2 (Authentication):** ✅ Complete (33/33 tasks) - 392 auth tests passing
- **Phase 3 (Design System):** ✅ Complete (40/40 tasks) - 31 components, 424/424 tests (100%), WCAG 2.1 AA
- **Phase 4 (Business Directory):** ✅ Complete (39/39 tasks) - 209 tests created, 1,309 total passing, 100/100 security score
- **MVP 1:** ✅ Complete (Static Business Directory - Phases 1-4)
- **Overall Progress:** 26.7% (172/644 tasks)

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

- **Maps:** Google Maps API (Google Maps JavaScript API, Google Places API, Google Directions API)
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
- Maps: Google Maps API integration with geocoding, BusinessMap component, DirectionsButton
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

### Phase 5 Focus (Next)

Next phase is **Search & Discovery** (34 tasks):

- Implement Elasticsearch full-text search
- Build search bar with autocomplete
- Create filters (category, distance, open now, certifications)
- Add sort options (relevance, distance, rating, newest)
- Build homepage discovery sections (featured, near you, highly rated)

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
