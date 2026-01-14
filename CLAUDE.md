# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Community Hub** - a location-agnostic Digital Community Improvement Hub (DCIH) platform for local business discovery and community engagement. The platform connects residents with local businesses that face competition from large shopping centres.

**First Deployment:** Guildford South precinct (Sydney, Australia)

**Future Deployments:** The platform is designed to be deployed to multiple suburbs with configuration-only changes (no code modifications required).

**Current Status:** Specification phase - the detailed specification is complete but source code has not yet been written.

**Primary Reference:** `Docs/Community_Hub_Platform_Specification.md` (~3000 lines) - this is the authoritative source for all functional requirements, data models, API endpoints, and design specifications.

**Specification Version:** 1.3 (January 2026)

## Location-Agnostic Architecture

**CRITICAL:** No location-specific data should be hardcoded. The platform uses a three-tier configuration system (see Section 2 of the specification):

1. **`.env`** - Sensitive credentials, API keys, environment-specific settings
2. **`config/platform.json`** - Location, branding, feature flags (edit this for new suburb deployments)
3. **Database** - Runtime-editable settings (categories, templates, system settings)

When implementing features, always reference configuration values rather than hardcoding suburb names, coordinates, or other location-specific data.

## Specification Document Structure

The specification is organised for development workflow:

### Foundation & Architecture (Sections 1-6)
- **Section 1:** Project Overview
- **Section 2:** Platform Configuration Architecture (location-agnostic config)
- **Section 3:** Technical Requirements (stack, performance, scalability)
- **Section 4:** Security & Privacy
- **Section 5:** Design Specifications (colours, typography, components)
- **Section 6:** Multilingual Support (10 languages, RTL)

### Users & Core Entities (Sections 7-10)
- **Section 7:** User Types & Roles
- **Section 8:** Business Profile Features
- **Section 9:** Community User Features
- **Section 10:** Business Owner Features

### Core Functionality (Sections 11-14)
- **Section 11:** Search & Discovery
- **Section 12:** Events & Calendar System
- **Section 13:** Messaging & Communication System
- **Section 14:** Deals & Promotions Hub

### Community & Social Features (Sections 15-18)
- **Section 15:** Community Features (noticeboard, groups, history)
- **Section 16:** Social Media Integration
- **Section 17:** Business-to-Business Networking
- **Section 18:** Emergency & Crisis Communication

### Administration & Operations (Sections 19-21)
- **Section 19:** Administration & Moderation
- **Section 20:** Analytics & Reporting
- **Section 21:** Integration Requirements

### Appendices
- **Appendix A:** Data Models
- **Appendix B:** API Endpoints
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
