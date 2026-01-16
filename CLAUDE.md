# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Community Hub** - a location-agnostic Digital Community Improvement Hub (DCIH) platform for local business discovery and community engagement. The platform connects residents with local businesses that face competition from large shopping centres.

**First Deployment:** Guildford South precinct (Sydney, Australia)

**Future Deployments:** The platform is designed to be deployed to multiple suburbs with configuration-only changes (no code modifications required).

**Current Status:** Specification phase - the detailed specification is complete but source code has not yet been written.

**Primary Reference:** `Docs/Community_Hub_Specification_v2.md` - this is the authoritative source for all functional requirements, data models, API endpoints, and design specifications.

**Specification Version:** 2.0 (January 2026)

## Location-Agnostic Architecture

**CRITICAL:** No location-specific data should be hardcoded. The platform uses a three-tier configuration system (see Section 2 of the specification):

1. **`.env`** - Sensitive credentials, API keys, environment-specific settings
2. **`config/platform.json`** - Location, branding, feature flags (edit this for new suburb deployments)
3. **Database** - Runtime-editable settings (categories, templates, system settings)

When implementing features, always reference configuration values rather than hardcoding suburb names, coordinates, or other location-specific data.

## Specification Document Structure (v2.0)

The specification is organised into 7 parts plus appendices:

### Part 1: Foundation & Architecture (Sections 1-5)
- **Section 1:** Project Overview
- **Section 2:** Platform Configuration Architecture (location-agnostic config)
- **Section 3:** Technical Requirements (stack, performance, scalability, accessibility)
- **Section 4:** Security & Privacy
- **Section 5:** Legal & Compliance (Terms, Privacy Policy, Cookie Consent)

### Part 2: Design & User Experience (Sections 6-9)
- **Section 6:** Design Specifications (colours, typography, components)
- **Section 7:** UI States & Components (loading, empty, error states)
- **Section 8:** Multilingual Support (10 languages, RTL)
- **Section 9:** Onboarding & User Journeys

### Part 3: Users & Core Entities (Sections 10-13)
- **Section 10:** User Types & Roles
- **Section 11:** Business Profile Features
- **Section 12:** Community User Features
- **Section 13:** Business Owner Features

### Part 4: Core Functionality (Sections 14-18)
- **Section 14:** Search & Discovery
- **Section 15:** Events & Calendar System
- **Section 16:** Messaging & Communication System
- **Section 17:** Deals & Promotions Hub
- **Section 18:** Reviews & Ratings

### Part 5: Community & Social Features (Sections 19-22)
- **Section 19:** Community Features (noticeboard, groups, history)
- **Section 20:** Social Media Integration
- **Section 21:** Business-to-Business Networking
- **Section 22:** Emergency & Crisis Communication

### Part 6: Administration & Operations (Sections 23-26)
- **Section 23:** Administration & Moderation
- **Section 24:** Content Policies
- **Section 25:** Analytics & Reporting
- **Section 26:** Integration Requirements

### Part 7: Technical Operations (Sections 27-31)
- **Section 27:** Error Handling
- **Section 28:** Data Management
- **Section 29:** Technical Operations
- **Section 30:** Testing & Quality Requirements
- **Section 31:** Operational Procedures

### Appendices
- **Appendix A:** Data Models (22 complete models)
- **Appendix B:** API Endpoints (130+ endpoints)
- **Appendix C:** Glossary

## Key Technical Decisions (from Specification)

### Planned Stack
- **Frontend:** Modern JavaScript framework (React/Vue), mobile-first responsive, PWA-capable
- **Backend:** RESTful API or GraphQL, JWT authentication
- **Database:** PostgreSQL (relational) + Elasticsearch (search)
- **Storage:** AWS S3 or similar for media
- **Caching:** Redis for sessions and data

### Critical Requirements
- **Multilingual Support:** 10 languages including RTL (Arabic, Urdu) - must be built in from the start, not retrofitted
- **WCAG 2.1 AA Accessibility:** All components must meet accessibility standards
- **Mobile-First:** Primary breakpoint < 768px, 44px minimum touch targets
- **PWA:** Installable, offline-capable with service worker
- **Location-Agnostic:** All location data from configuration, never hardcoded

### Performance Targets
- Page load < 3 seconds on 3G
- API response < 200ms (95th percentile)
- Lighthouse performance score > 80

## Data Models

Key entities defined in Appendix A of the specification:
- **Business:** Profile, hours, media, promotions, social links, certifications
- **User:** Community members, business owners, moderators, admins
- **Event:** Recurring events with RSVPs, calendar export
- **Review:** Star ratings, photos, business responses
- **Message/Conversation:** Business enquiries and responses
- **Deal:** Promotions with redemption tracking
- **BusinessConnection:** B2B networking relationships
- **Alert:** Emergency and crisis communications
- **BusinessEmergencyStatus:** Real-time business status during incidents

## API Structure

RESTful endpoints defined in Appendix B:
- `/auth/*` - Registration, login, password reset
- `/businesses/*` - CRUD, claim, analytics, emergency status
- `/events/*` - CRUD, RSVP
- `/users/*` - Profile, saved businesses, alert preferences
- `/search/*` - Business/event search with filters
- `/conversations/*` - Messaging between users and businesses
- `/deals/*` - Deals hub, flash deals, redemptions
- `/b2b/*` - Business networking, connections, forum
- `/alerts/*` - Emergency alerts, check-ins

## Design System

- **Colors:** Teal (#2C5F7C), Orange (#E67E22), Gold (#F39C12) - configurable per deployment
- **Typography:** Montserrat (headings), Open Sans (body)
- **Responsive breakpoints:** Mobile (< 768px), Tablet (768-1199px), Desktop (≥ 1200px)
- **Alert Colors:** Red (Critical), Orange (Warning), Yellow (Advisory), Blue (Information)

## Security Requirements

- Australian Privacy Principles (APP) compliance
- bcrypt password hashing (cost factor 12+)
- TLS 1.3, AES-256 encryption at rest
- Security headers: CSP, X-Frame-Options, HSTS
- Rate limiting, input validation on all endpoints
- Message spam detection and rate limiting (max 10 new conversations/day)
- API keys and secrets in `.env` only, never in platform.json or code

## Integration Points

- Google Business Profile API (import business data)
- Facebook/Instagram APIs (social feed, events)
- Google Translate API (auto-translation)
- Maps API (Google Maps or OpenStreetMap)
- SendGrid/Mailgun (email notifications)
- Twilio or similar (SMS for emergency alerts)
- State emergency alerts / Bureau of Meteorology / Transport authority (emergency feeds)

## Configuration Files

When the codebase is implemented, the following configuration files will be present:

| File | Purpose |
|------|---------|
| `.env.example` | Template for environment variables |
| `config/platform.json` | Location and branding configuration |
| `config/platform.development.json` | Development overrides |
| `config/platform.staging.json` | Staging overrides |
