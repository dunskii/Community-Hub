# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **Guildford Community Digital Platform** - a Digital Community Improvement Hub (DCIH) for local business discovery and community engagement in the Guildford South precinct (Sydney, Australia). The platform connects residents with local businesses that face competition from large shopping centres.

**Current Status:** Specification phase - the detailed specification is complete but source code has not yet been written.

**Primary Reference:** `Docs/Guildford_Platform_Specification.md` (2500+ lines) - this is the authoritative source for all functional requirements, data models, API endpoints, and design specifications.

**Specification Version:** 1.1 (January 2026)

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

## Core Platform Features

### Business Discovery (Sections 3, 5, 10)
- Business profiles with hours, media, promotions, certifications
- Search with filters (category, distance, languages, accessibility)
- Google Business Profile sync

### Community Engagement (Sections 4, 6, 8)
- User accounts with saved businesses and follows
- Events calendar with RSVPs and recurring events
- Community noticeboard, groups hub, local history archive

### Messaging System (Section 17)
- Business enquiry forms with subject categories
- Business inbox with quick replies and templates
- Response rate tracking displayed on profiles
- Privacy controls (blocking, spam detection)

### Deals & Promotions Hub (Section 18)
- Centralised deals discovery ("Today's Deals", "Ending Soon", "Near You")
- Flash deals with countdown timers and quantity limits
- Multiple redemption methods (QR codes, unique codes)
- Personalised deal recommendations and alerts

### Business-to-Business Networking (Section 19)
- B2B network profiles (partnerships, suppliers, cross-promotion)
- Business connection system with messaging
- Discussion forum for local business topics
- Joint promotions and referral tracking
- Chamber of Commerce integration

### Emergency & Crisis Communication (Section 20)
- Four-tier alert system (Critical, Warning, Advisory, Information)
- Multiple sources (Admin, Council, NSW Government, Chamber)
- SMS opt-in for critical alerts
- Business emergency status updates
- Community safety check-in system
- Integration with NSW Alerts, BOM, Transport NSW

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

- **Colors:** Teal (#2C5F7C), Orange (#E67E22), Gold (#F39C12)
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

## Integration Points

- Google Business Profile API (import business data)
- Facebook/Instagram APIs (social feed, events)
- Google Translate API (auto-translation)
- Maps API (Google Maps or OpenStreetMap)
- SendGrid/Mailgun (email notifications)
- Twilio or similar (SMS for emergency alerts)
- NSW Alerts / Bureau of Meteorology / Transport NSW (emergency feeds)
