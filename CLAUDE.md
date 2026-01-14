# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **Guildford Community Digital Platform** - a Digital Community Improvement Hub (DCIH) for local business discovery and community engagement in the Guildford South precinct (Sydney, Australia). The platform connects residents with local businesses that face competition from large shopping centres.

**Current Status:** Specification phase - the detailed specification is complete but source code has not yet been written.

**Primary Reference:** `Docs/Guildford_Platform_Specification.md` (1800+ lines) - this is the authoritative source for all functional requirements, data models, API endpoints, and design specifications.

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

## API Structure

RESTful endpoints defined in Appendix B:
- `/auth/*` - Registration, login, password reset
- `/businesses/*` - CRUD, claim, analytics
- `/events/*` - CRUD, RSVP
- `/users/*` - Profile, saved businesses
- `/search/*` - Business/event search with filters

## Design System

- **Colors:** Teal (#2C5F7C), Orange (#E67E22), Gold (#F39C12)
- **Typography:** Montserrat (headings), Open Sans (body)
- **Responsive breakpoints:** Mobile (< 768px), Tablet (768-1199px), Desktop (≥ 1200px)

## Security Requirements

- Australian Privacy Principles (APP) compliance
- bcrypt password hashing (cost factor 12+)
- TLS 1.3, AES-256 encryption at rest
- Security headers: CSP, X-Frame-Options, HSTS
- Rate limiting, input validation on all endpoints

## Integration Points

- Google Business Profile API (import business data)
- Facebook/Instagram APIs (social feed, events)
- Google Translate API (auto-translation)
- Maps API (Google Maps or OpenStreetMap)
- SendGrid/Mailgun (email notifications)
