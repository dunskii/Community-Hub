# Community Hub Platform
## Complete Platform Specification

**Document Version:** 2.0
**Date:** January 2026
**Status:** Master Development Reference
**First Deployment:** Guildford South, Sydney, Australia

---

## Document Information

This is the authoritative specification for Community Hub platform development. It consolidates all requirements, data models, API endpoints, design specifications, and operational procedures into a single reference document.

**Supersedes:**
- Community_Hub_Platform_Specification.md (v1.3)
- Community_Hub_Specification_Supplement.md (v1.0)

---

## Table of Contents

### Part 1: Foundation & Architecture
1. [Project Overview](#1-project-overview)
2. [Platform Configuration Architecture](#2-platform-configuration-architecture)
3. [Technical Requirements](#3-technical-requirements)
4. [Security & Privacy](#4-security--privacy)
5. [Legal & Compliance](#5-legal--compliance)

### Part 2: Design & User Experience
6. [Design Specifications](#6-design-specifications)
7. [UI States & Components](#7-ui-states--components)
8. [Multilingual Support](#8-multilingual-support)
9. [Onboarding & User Journeys](#9-onboarding--user-journeys)

### Part 3: Users & Core Entities
10. [User Types & Roles](#10-user-types--roles)
11. [Business Profile Features](#11-business-profile-features)
12. [Community User Features](#12-community-user-features)
13. [Business Owner Features](#13-business-owner-features)

### Part 4: Core Functionality
14. [Search & Discovery](#14-search--discovery)
15. [Events & Calendar System](#15-events--calendar-system)
16. [Messaging & Communication System](#16-messaging--communication-system)
17. [Deals & Promotions Hub](#17-deals--promotions-hub)
18. [Reviews & Ratings](#18-reviews--ratings)

### Part 5: Community & Social Features
19. [Community Features](#19-community-features)
20. [Social Media Integration](#20-social-media-integration)
21. [Business-to-Business Networking](#21-business-to-business-networking)
22. [Emergency & Crisis Communication](#22-emergency--crisis-communication)

### Part 6: Administration & Operations
23. [Administration & Moderation](#23-administration--moderation)
24. [Content Policies](#24-content-policies)
25. [Analytics & Reporting](#25-analytics--reporting)
26. [Integration Requirements](#26-integration-requirements)

### Part 7: Technical Operations
27. [Error Handling](#27-error-handling)
28. [Data Management](#28-data-management)
29. [Technical Operations](#29-technical-operations)
30. [Testing & Quality Requirements](#30-testing--quality-requirements)
31. [Operational Procedures](#31-operational-procedures)

### Appendices
- [Appendix A: Data Models](#appendix-a-data-models)
- [Appendix B: API Endpoints](#appendix-b-api-endpoints)
- [Appendix C: Glossary](#appendix-c-glossary)

---

# Part 1: Foundation & Architecture

---

## 1. Project Overview

### 1.1 Purpose

Community Hub is a location-agnostic Digital Community Improvement Hub (DCIH) platform designed to support local businesses facing competition from large shopping centres. The platform serves as an integrated directory and community engagement system connecting residents with local businesses.

The platform is designed for deployment to multiple suburbs with configuration-only changes. The first deployment will be the Guildford South precinct in Sydney, Australia.

### 1.2 Key Objectives

| Objective | Description |
|-----------|-------------|
| Business Visibility | Create digital shopfronts for businesses, many of which have no online presence |
| Community Connection | Bridge the gap between residents and local businesses |
| Multilingual Access | Remove language barriers for diverse communities |
| Data Collection | Enable surveys and data gathering to inform strategic planning |
| Economic Vitality | Drive foot traffic to the physical precinct |

### 1.3 Project Timeline

- **Phase 1:** January 2026 - July 2026
- **Investment:** Approximately $48,000
- **Project Manager:** Greater Cumberland Chamber of Commerce in partnership with Cumberland Council

### 1.4 Platform Foundation

The platform is partitioned from the existing Body Chi Me marketplace infrastructure, which services over 20,000 businesses worldwide.

---

## 2. Platform Configuration Architecture

### 2.1 Overview

The platform is designed to be **location-agnostic**, enabling deployment to multiple suburbs with minimal configuration changes. No location-specific data should be hardcoded in the application source code. This architecture supports the future rollout of the platform to other suburbs and communities.

### 2.2 Configuration Tiers

The platform uses a three-tier configuration system:

| Tier | File | Purpose | When to Edit |
|------|------|---------|--------------|
| Environment Variables | `.env` | Sensitive credentials, environment-specific settings | Per deployment environment (dev/staging/prod) |
| Platform Configuration | `config/platform.json` | Location, branding, feature flags | Per suburb deployment |
| Database Configuration | Database tables | Runtime-editable settings, categories, templates | Post-launch via admin panel |

### 2.3 Environment Variables (.env)

#### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `SESSION_SECRET` | Secret for JWT/session signing | Random 64-char string |
| `ENCRYPTION_KEY` | AES-256 key for data encryption | Random 32-byte key (base64) |

#### API Keys

| Variable | Description | Required |
|----------|-------------|----------|
| `MAPBOX_ACCESS_TOKEN` | Mapbox maps integration | Yes |
| `GOOGLE_TRANSLATE_API_KEY` | Auto-translation service | Yes |
| `GOOGLE_OAUTH_CLIENT_ID` | Google sign-in | Yes |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Google sign-in | Yes |
| `FACEBOOK_APP_ID` | Facebook integration | Optional |
| `FACEBOOK_APP_SECRET` | Facebook integration | Optional |
| `MAILGUN_API_KEY` | Email delivery | Yes |
| `MAILGUN_DOMAIN` | Mailgun sending domain | Yes |
| `TWILIO_ACCOUNT_SID` | Twilio SMS & WhatsApp | Yes |
| `TWILIO_AUTH_TOKEN` | Twilio authentication | Yes |
| `TWILIO_PHONE_NUMBER` | SMS sender number | Yes |
| `TWILIO_WHATSAPP_NUMBER` | WhatsApp sender number (Twilio sandbox or approved) | Yes |

#### Storage Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `STORAGE_PATH` | Local media storage path | `/var/data/community-hub/media` |
| `STORAGE_MAX_SIZE_GB` | Maximum storage allocation | `50` |
| `STORAGE_BACKUP_PATH` | Backup storage path | `/var/backups/community-hub/media` |

#### Search Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `ELASTICSEARCH_URL` | Elasticsearch connection string | `http://localhost:9200` |
| `ELASTICSEARCH_API_KEY` | Elasticsearch API key (if auth enabled) | Optional |

#### Push Notification Configuration

| Variable | Description | Required |
|----------|-------------|----------|
| `FIREBASE_PROJECT_ID` | Firebase project identifier | Yes (for push) |
| `FIREBASE_PRIVATE_KEY` | Firebase service account private key | Yes (for push) |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account email | Yes (for push) |

#### Cloudflare Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `CLOUDFLARE_ZONE_ID` | Cloudflare zone identifier | Zone ID from dashboard |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token (cache purge, DNS) | Yes |
| `CDN_URL` | CDN base URL for static assets | `https://cdn.example.com` |
| `CDN_ENABLED` | Enable CDN for media delivery | `true`, `false` |

#### External API Configuration

| Variable | Description | Required |
|----------|-------------|----------|
| `GOOGLE_BUSINESS_API_KEY` | Google Business Profile API key | Yes |

#### Environment Settings

| Variable | Description | Values |
|----------|-------------|--------|
| `NODE_ENV` | Environment type | `development`, `staging`, `production` |
| `LOG_LEVEL` | Logging verbosity | `debug`, `info`, `warn`, `error` |
| `ENABLE_DEBUG_MODE` | Debug features | `true`, `false` |

### 2.4 Platform Configuration (config/platform.json)

This file contains all location-specific and branding configuration. It should be the **primary file edited when deploying to a new suburb**.

#### Complete Configuration Schema

```json
{
  "platform": {
    "id": "guildford",
    "version": "1.0.0"
  },

  "location": {
    "suburbName": "Guildford",
    "suburbNameShort": "Guildford",
    "region": "Guildford South",
    "city": "Sydney",
    "state": "NSW",
    "stateFullName": "New South Wales",
    "country": "Australia",
    "countryCode": "AU",
    "postcode": "2161",
    "postcodeRange": ["2161", "2162"],
    "coordinates": {
      "latitude": -33.8567,
      "longitude": 150.9876
    },
    "boundingBox": {
      "north": -33.8400,
      "south": -33.8700,
      "east": 151.0000,
      "west": 150.9700
    },
    "timezone": "Australia/Sydney",
    "locale": "en-AU",
    "currency": "AUD",
    "currencySymbol": "$",
    "phoneCountryCode": "+61",
    "defaultSearchRadiusKm": 5,
    "maxSearchRadiusKm": 20
  },

  "branding": {
    "platformName": "Guildford Community Hub",
    "platformNameShort": "Guildford Hub",
    "tagline": "Connecting locals with local business",
    "description": "Your digital guide to local businesses and community in Guildford",
    "legalEntityName": "Guildford Community Digital Platform",
    "copyrightHolder": "Greater Cumberland Chamber of Commerce",

    "colors": {
      "primary": "#2C5F7C",
      "secondary": "#E67E22",
      "accent": "#F39C12",
      "success": "#27AE60",
      "error": "#E74C3C",
      "warning": "#F39C12",
      "info": "#3498DB"
    },

    "logos": {
      "primary": "/assets/branding/logo-primary.svg",
      "light": "/assets/branding/logo-light.svg",
      "dark": "/assets/branding/logo-dark.svg",
      "favicon": "/assets/branding/favicon.ico",
      "appleTouchIcon": "/assets/branding/apple-touch-icon.png"
    },

    "socialHashtags": {
      "primary": "#MyGuildford",
      "secondary": ["#Guildford", "#GuildfordNSW", "#GuildfordSydney", "#ShopGuildford"]
    }
  },

  "partners": {
    "council": {
      "name": "Cumberland Council",
      "website": "https://www.cumberland.nsw.gov.au",
      "logo": "/assets/partners/cumberland-council.png",
      "contactEmail": "council@cumberland.nsw.gov.au"
    },
    "chamber": {
      "name": "Greater Cumberland Chamber of Commerce",
      "website": "https://www.cumberlandchamber.com.au",
      "logo": "/assets/partners/chamber.png",
      "contactEmail": "info@cumberlandchamber.com.au"
    }
  },

  "features": {
    "businessDirectory": true,
    "eventsCalendar": true,
    "communityNoticeboard": true,
    "communityGroups": true,
    "localHistory": true,
    "messaging": true,
    "dealsHub": true,
    "b2bNetworking": true,
    "emergencyAlerts": true,
    "socialFeedAggregation": true,
    "surveySystem": true,
    "reviewsAndRatings": true,
    "multilingual": true,
    "pwaInstallation": true,
    "smsAlerts": true,
    "whatsappAlerts": true
  },

  "multilingual": {
    "defaultLanguage": "en",
    "supportedLanguages": [
      { "code": "en", "name": "English", "nativeName": "English", "rtl": false, "enabled": true },
      { "code": "ar", "name": "Arabic", "nativeName": "العربية", "rtl": true, "enabled": true },
      { "code": "zh-CN", "name": "Chinese (Simplified)", "nativeName": "简体中文", "rtl": false, "enabled": true },
      { "code": "zh-TW", "name": "Chinese (Traditional)", "nativeName": "繁體中文", "rtl": false, "enabled": true },
      { "code": "vi", "name": "Vietnamese", "nativeName": "Tiếng Việt", "rtl": false, "enabled": true },
      { "code": "hi", "name": "Hindi", "nativeName": "हिन्दी", "rtl": false, "enabled": true },
      { "code": "ur", "name": "Urdu", "nativeName": "اردو", "rtl": true, "enabled": true },
      { "code": "ko", "name": "Korean", "nativeName": "한국어", "rtl": false, "enabled": true },
      { "code": "el", "name": "Greek", "nativeName": "Ελληνικά", "rtl": false, "enabled": true },
      { "code": "it", "name": "Italian", "nativeName": "Italiano", "rtl": false, "enabled": true }
    ],
    "autoTranslationEnabled": true
  },

  "seo": {
    "titleTemplate": "{page} | {platformName}",
    "defaultTitle": "Guildford Community Hub - Local Business Directory",
    "defaultDescription": "Discover local businesses, events, and community in Guildford South, Sydney. Connect with your neighbourhood.",
    "defaultKeywords": ["Guildford", "local business", "Sydney", "community", "NSW", "Guildford South"],
    "ogImage": "/assets/branding/og-image.jpg",
    "twitterHandle": "@GuildfordHub"
  },

  "contact": {
    "supportEmail": "support@guildfordhub.com.au",
    "generalEmail": "hello@guildfordhub.com.au",
    "feedbackEmail": "feedback@guildfordhub.com.au",
    "privacyEmail": "privacy@guildfordhub.com.au"
  },

  "legal": {
    "termsUrl": "/legal/terms",
    "privacyUrl": "/legal/privacy",
    "cookieUrl": "/legal/cookies",
    "accessibilityUrl": "/legal/accessibility",
    "abn": "XX XXX XXX XXX"
  },

  "limits": {
    "maxBusinessPhotos": 50,
    "maxPhotoSizeMb": 5,
    "maxMenuFileSizeMb": 10,
    "maxActivePromotions": 5,
    "maxNoticeboardPostsPerUser": 3,
    "noticeboardExpiryDays": 30,
    "maxNewConversationsPerDay": 10,
    "maxFlashDealsPerWeek": 2,
    "reviewEditWindowDays": 7,
    "accountDeletionGracePeriodDays": 14
  },

  "analytics": {
    "googleAnalyticsId": "G-XXXXXXXXXX",
    "enableCookieConsent": true
  }
}
```

### 2.5 Configuration by Category

#### Location Configuration

| Field | Purpose | Impact |
|-------|---------|--------|
| `suburbName` | Display name throughout platform | UI, emails, SEO |
| `coordinates` | Map centre, distance calculations | Search, map views |
| `boundingBox` | Geographic boundaries for business eligibility | Verification, search filters |
| `timezone` | All time displays, "Open Now" calculations | Business hours, events |
| `postcodeRange` | Valid postcodes for businesses | Business registration |
| `phoneCountryCode` | Phone number formatting and validation | Forms, click-to-call |

#### Branding Configuration

| Field | Purpose | Impact |
|-------|---------|--------|
| `platformName` | Full name in headers, emails, legal | Site-wide |
| `tagline` | Hero section, metadata | Homepage, SEO |
| `colors` | CSS custom properties | Entire UI theme |
| `logos` | Header, footer, PWA icons | Branding presence |
| `socialHashtags` | Social feed aggregation | Community feed feature |

#### Feature Flags

Feature flags allow enabling/disabling major platform features:

| Flag | Description | Default |
|------|-------------|---------|
| `businessDirectory` | Core business listing functionality | true |
| `eventsCalendar` | Events and calendar system | true |
| `communityNoticeboard` | Community notices feature | true |
| `messaging` | User-to-business messaging | true |
| `dealsHub` | Centralised deals discovery | true |
| `b2bNetworking` | Business-to-business features | true |
| `emergencyAlerts` | Crisis communication system | true |
| `smsAlerts` | SMS notification capability | true |
| `whatsappAlerts` | WhatsApp notification capability (via Twilio) | true |

### 2.6 Database Configuration

The following settings are stored in the database for runtime editability:

#### Categories Table

| Field | Description |
|-------|-------------|
| `id` | Unique identifier |
| `name` | Category name (multilingual) |
| `slug` | URL-safe identifier |
| `icon` | Category icon |
| `parent_id` | For hierarchical categories |
| `display_order` | Sort order |
| `active` | Enable/disable category |

#### System Settings Table

| Setting Key | Description | Example |
|-------------|-------------|---------|
| `maintenance_mode` | Enable maintenance page | `false` |
| `registration_enabled` | Allow new user registration | `true` |
| `business_claims_enabled` | Allow business claims | `true` |
| `moderation_queue_enabled` | Require content approval | `true` |
| `featured_businesses` | IDs of featured businesses | `["uuid1", "uuid2"]` |

#### Email Templates Table

| Field | Description |
|-------|-------------|
| `template_key` | Unique template identifier |
| `subject` | Email subject (multilingual) |
| `body_html` | HTML email body |
| `body_text` | Plain text fallback |
| `variables` | Available template variables |

### 2.7 Deployment Checklist for New Suburbs

When deploying the platform to a new suburb, follow this checklist:

#### 1. Environment Setup
- [ ] Create new `.env` file from `.env.example`
- [ ] Configure database connection
- [ ] Set up API keys for all services
- [ ] Configure media storage on DigitalOcean Droplet

#### 2. Platform Configuration
- [ ] Copy `config/platform.json` from template
- [ ] Update all `location` fields
- [ ] Update all `branding` fields
- [ ] Configure `partners` information
- [ ] Review and adjust `features` flags
- [ ] Update `multilingual` settings for local demographics
- [ ] Configure `seo` fields
- [ ] Set `contact` email addresses
- [ ] Update `legal` information including ABN

#### 3. Assets
- [ ] Create logo variations (primary, light, dark)
- [ ] Create favicon and app icons
- [ ] Create Open Graph image
- [ ] Upload partner logos
- [ ] Create hero/banner images

#### 4. Database Seeding
- [ ] Seed business categories
- [ ] Seed event categories
- [ ] Configure email templates
- [ ] Set initial system settings
- [ ] Create admin user accounts

#### 5. Cloudflare, DNS & SSL
- [ ] Add domain to Cloudflare and update registrar nameservers
- [ ] Configure DNS records (A record to Droplet IP, CNAME for www)
- [ ] Enable Cloudflare SSL/TLS (Full Strict mode) with edge certificates
- [ ] Generate Cloudflare Origin Certificate and install on Nginx
- [ ] Configure Cloudflare caching rules (static assets, media)
- [ ] Enable Cloudflare WAF and DDoS protection
- [ ] Set up Cloudflare Page Rules (force HTTPS, cache levels)
- [ ] Configure Cloudflare API token for cache purge integration

#### 6. Testing
- [ ] Verify all location references display correctly
- [ ] Test map functionality with new coordinates
- [ ] Verify "Open Now" calculations with timezone
- [ ] Test email delivery
- [ ] Test SMS delivery (if enabled)
- [ ] Verify branding throughout platform

### 2.8 Configuration Access in Code

#### Reading Configuration

The platform configuration should be loaded once at startup and made available throughout the application:

```
// Pseudocode - implementation varies by framework
const platformConfig = loadPlatformConfig('config/platform.json');

// Access location data
const suburbName = platformConfig.location.suburbName;

// Access branding
const primaryColor = platformConfig.branding.colors.primary;

// Check feature flags
if (platformConfig.features.dealsHub) {
  // Enable deals hub routes
}
```

#### Environment-Specific Overrides

Support for environment-specific configuration files:

| Environment | Config File |
|-------------|-------------|
| Development | `config/platform.development.json` |
| Staging | `config/platform.staging.json` |
| Production | `config/platform.json` |

Merge order: base config → environment-specific overrides

### 2.9 Configuration Validation

The application should validate configuration on startup:

#### Required Field Validation

| Field Path | Validation |
|------------|------------|
| `location.suburbName` | Non-empty string |
| `location.coordinates.latitude` | Valid latitude (-90 to 90) |
| `location.coordinates.longitude` | Valid longitude (-180 to 180) |
| `location.timezone` | Valid IANA timezone |
| `branding.platformName` | Non-empty string |
| `branding.colors.primary` | Valid hex colour |
| `contact.supportEmail` | Valid email address |

#### Startup Validation Behaviour

- **Missing required field**: Application fails to start with clear error message
- **Invalid value**: Application fails to start with validation error
- **Missing optional field**: Use default value, log warning

### 2.10 Security Considerations

| Consideration | Implementation |
|---------------|----------------|
| `.env` file | Never commit to version control; add to `.gitignore` |
| API keys | Use environment variables, never platform.json |
| Sensitive config | Keep in `.env`, not database |
| Config file permissions | Read-only for application user |
| Audit logging | Log configuration changes in database |

---

## 3. Technical Requirements

### 3.1 Platform Architecture

#### Frontend

| Requirement | Specification |
|-------------|---------------|
| Framework | React with TypeScript (confirmed) |
| Responsive Design | Mobile-first approach |
| PWA Capability | Installable, offline-capable |
| Browser Support | Chrome, Firefox, Safari, Edge (last 2 versions) |

#### Backend

| Requirement | Specification |
|-------------|---------------|
| API Architecture | RESTful API or GraphQL |
| Authentication | JWT-based authentication |
| Database | Relational (PostgreSQL) + Search (Elasticsearch) |
| File Storage | Local disk storage on DigitalOcean Droplets (with Cloudflare CDN for delivery) |
| Caching | Redis for session and data caching |

### 3.2 Performance Requirements

| Metric | Target |
|--------|--------|
| Page Load Time | < 3 seconds on 3G |
| Time to Interactive | < 5 seconds |
| First Contentful Paint | < 1.5 seconds |
| Lighthouse Score | > 80 (Performance) |
| API Response Time | < 200ms (95th percentile) |

### 3.3 Scalability

| Requirement | Specification |
|-------------|---------------|
| Concurrent Users | Support 1,000+ simultaneous users |
| Business Profiles | Support 500+ businesses |
| User Accounts | Support 10,000+ users |
| Image Storage | 100GB+ capacity |
| Database Growth | Auto-scaling capability |

### 3.4 Mobile Experience

#### Responsive Breakpoints

| Device | Width | Priority |
|--------|-------|----------|
| Mobile | < 768px | Primary |
| Tablet | 768px - 1199px | Secondary |
| Desktop | ≥ 1200px | Secondary |

#### Mobile-Specific Features

| Feature | Description |
|---------|-------------|
| Touch Optimisation | 44px minimum touch targets |
| Swipe Gestures | Photo galleries, card navigation |
| Pull to Refresh | Refresh content feeds |
| Bottom Navigation | Key actions accessible by thumb |
| Click to Call | Direct phone dialling |
| Click to Navigate | Open maps application |

### 3.5 Offline Capability

| Feature | Offline Behaviour |
|---------|-------------------|
| Homepage | Cached version available |
| Business Profiles | Recently viewed available offline |
| Saved Businesses | Full offline access |
| Search | Limited to cached data |
| Actions | Queue for sync when online |

### 3.6 Accessibility (WCAG 2.1 AA)

| Requirement | Specification |
|-------------|---------------|
| Colour Contrast | Minimum 4.5:1 for text |
| Keyboard Navigation | Full site navigable by keyboard |
| Screen Reader | All content accessible |
| Alt Text | Required for all images |
| Focus Indicators | Visible focus states |
| Form Labels | All inputs labelled |
| Error Messages | Clear, associated with fields |
| Skip Links | Skip to main content |

### 3.7 Progressive Web App (PWA)

#### PWA Features

| Feature | Specification |
|---------|---------------|
| Web App Manifest | Full configuration for installation |
| Service Worker | Caching and offline support |
| Install Prompts | Smart prompting for installation |
| App Icons | All required sizes (72px to 512px) |
| Splash Screens | Branded loading screens |
| Push Notifications | Firebase Cloud Messaging |

#### Offline Caching Strategy

| Resource Type | Strategy |
|---------------|----------|
| Static assets | Cache-first |
| API responses | Network-first with cache fallback |
| Images | Cache-first with background update |
| User data | IndexedDB with sync |

---

## 4. Security & Privacy

### 4.1 Authentication

| Requirement | Specification |
|-------------|---------------|
| Password Hashing | bcrypt with cost factor 12+ |
| Password Requirements | 8+ chars, uppercase, number |
| Session Management | Secure, HTTP-only cookies |
| Session Timeout | 30 days (remember me) or 24 hours |
| Failed Login Lockout | 5 attempts, 15-minute lockout |
| Two-Factor Auth | Optional, TOTP-based |

### 4.2 Data Protection

| Requirement | Specification |
|-------------|---------------|
| Encryption at Rest | AES-256 for sensitive data |
| Encryption in Transit | TLS 1.3 |
| PII Handling | Minimise collection, encrypt storage |
| Data Retention | Defined retention periods |
| Data Deletion | Complete removal on request |
| Backup Encryption | Encrypted backups |

### 4.3 Privacy Compliance

#### Australian Privacy Principles (APP)

| Principle | Implementation |
|-----------|----------------|
| Collection | Collect only necessary data |
| Use | Use only for stated purposes |
| Disclosure | No third-party sharing without consent |
| Access | Users can access their data |
| Correction | Users can correct their data |
| Security | Protect from misuse, loss |

#### Consent Management

| Consent Type | Implementation |
|--------------|----------------|
| Registration | Accept terms and privacy policy |
| Marketing | Explicit opt-in checkbox |
| Analytics | Cookie consent banner |
| Location | Browser permission request |
| Notifications | Explicit opt-in |

### 4.4 Cookie Policy

| Cookie Type | Purpose | Consent Required |
|-------------|---------|------------------|
| Essential | Authentication, security | No |
| Functional | Language, preferences | No |
| Analytics | Usage tracking | Yes |
| Marketing | Advertising | Yes |

### 4.5 Security Headers

| Header | Value |
|--------|-------|
| Content-Security-Policy | Strict CSP rules |
| X-Frame-Options | DENY |
| X-Content-Type-Options | nosniff |
| Strict-Transport-Security | max-age=31536000 |
| Referrer-Policy | strict-origin-when-cross-origin |

### 4.6 JWT Token Lifecycle

| Parameter | Specification |
|-----------|---------------|
| Signing Algorithm | RS256 (asymmetric) |
| Access Token Lifetime | 15 minutes |
| Refresh Token Lifetime | 7 days (30 days with "remember me") |
| Refresh Token Rotation | Issue new refresh token on each use; invalidate old |
| Token Payload | `sub` (user ID), `role`, `iat`, `exp` |
| Token Revocation | Maintain a Redis blocklist of revoked token JTIs |
| Cookie Settings | `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/` |

### 4.7 CSRF Protection

| Requirement | Specification |
|-------------|---------------|
| Approach | SameSite=Strict cookies + CSRF token for non-GET requests |
| Token Source | Server-generated, stored in session, validated per request |
| Exempt Routes | Public GET endpoints, OAuth callbacks |

### 4.8 Rate Limiting

| Endpoint Category | Limit | Window | Action |
|-------------------|-------|--------|--------|
| Authentication (login, register) | 10 requests | 15 minutes | 429 + lockout |
| Password reset | 3 requests | 1 hour | 429 + silent drop |
| API (authenticated) | 100 requests | 1 minute | 429 |
| API (anonymous) | 30 requests | 1 minute | 429 |
| Search | 30 requests | 1 minute | 429 |
| File uploads | 20 uploads | 1 hour | 429 |
| Review submissions | 5 reviews | 24 hours | 429 |
| New conversations | 10 conversations | 24 hours | 429 |
| Flash deal creation | 2 deals | 7 days | 429 |

### 4.9 Input Sanitization

| Requirement | Specification |
|-------------|---------------|
| Rich Text Fields | Sanitize with allowlist (DOMPurify or equivalent) |
| Allowed HTML Tags | `p`, `br`, `strong`, `em`, `ul`, `ol`, `li`, `a` (with `rel="nofollow"`) |
| Blocked Content | `script`, `iframe`, `object`, `embed`, `style`, `onclick` and all event handlers |
| Plain Text Fields | Strip all HTML tags |
| SQL Injection | Parameterized queries via ORM (Prisma) |
| URL Fields | Validate against URL format; block `javascript:` and `data:` schemes |

### 4.10 File Upload Security

| Requirement | Specification |
|-------------|---------------|
| MIME Validation | Validate via magic bytes, not file extension alone |
| Accepted Image Types | `image/jpeg`, `image/png`, `image/webp` |
| Accepted Document Types | `application/pdf` (for B2B file sharing) |
| Max File Size | Images: 5MB, Documents: 10MB |
| Filename Sanitization | Generate UUID filenames; never use original filename in storage path |
| EXIF Stripping | Remove EXIF metadata from uploaded images (privacy) |
| Path Traversal | Reject filenames containing `..`, `/`, or `\` |
| Executable Blocking | Reject any file with executable MIME type or extension |

---

## 5. Legal & Compliance

### 5.1 Terms of Service

The Terms of Service document must include the following sections:

#### 5.1.1 Required Sections

| Section | Content |
|---------|---------|
| **Acceptance of Terms** | Agreement by using the platform; age requirement (13+) |
| **Account Registration** | Accuracy of information; account security responsibility |
| **Permitted Use** | Personal, non-commercial use for community members; business promotion for verified owners |
| **Prohibited Conduct** | Illegal activities, harassment, spam, impersonation, false information |
| **User-Generated Content** | Definition, license grant to platform, responsibility for content |
| **Business Listings** | Accuracy requirements, verification obligations, prohibited business types |
| **Intellectual Property** | Platform ownership, user content rights, trademark usage |
| **Privacy** | Reference to Privacy Policy, data collection consent |
| **Disclaimers** | No warranty, accuracy of business information, third-party links |
| **Limitation of Liability** | Cap on damages, exclusions |
| **Indemnification** | User responsibility for their actions |
| **Termination** | Platform right to terminate, user right to delete account |
| **Dispute Resolution** | Governing law (NSW, Australia), jurisdiction, informal resolution first |
| **Changes to Terms** | Notification of changes, continued use as acceptance |
| **Contact Information** | How to reach platform for legal matters |

#### 5.1.2 Prohibited Business Types

The following business types are not permitted on the platform:

| Category | Examples |
|----------|----------|
| Adult Services | Adult entertainment, escort services |
| Illegal Activities | Drug paraphernalia, unlicensed gambling |
| Weapons | Firearms dealers, weapon modifications |
| High-Risk Financial | Payday loans, cryptocurrency exchanges |
| Tobacco/Vaping | Tobacco shops, vape stores (unless licensed pharmacy) |
| Multi-Level Marketing | MLM schemes, pyramid businesses |

### 5.2 Privacy Policy Requirements

#### 5.2.1 Required Sections (APP Compliance)

| Section | Content |
|---------|---------|
| **Information We Collect** | Personal info, usage data, device info, location data |
| **How We Collect Information** | Direct provision, automatic collection, third parties |
| **How We Use Information** | Service provision, communication, analytics, safety |
| **Information Sharing** | With businesses (enquiries), service providers, legal requirements |
| **Data Retention** | Retention periods by data type |
| **Your Rights** | Access, correction, deletion, portability, complaint |
| **Security Measures** | Encryption, access controls, monitoring |
| **Cookies & Tracking** | Types used, purpose, control options |
| **Children's Privacy** | No collection from under-13s |
| **International Transfers** | Data storage location, safeguards |
| **Changes to Policy** | Notification method |
| **Contact for Privacy** | Privacy officer contact details |

#### 5.2.2 Data Retention Schedule

| Data Type | Retention Period | After Deletion |
|-----------|------------------|----------------|
| Active user account | Duration of account | 14-day grace period, then permanent deletion |
| Deleted user account | 14 days (grace period) | Anonymised analytics retained |
| Business profile | Duration of listing | 90 days archived, then deleted |
| Reviews | Indefinite (while business exists) | Anonymised if user deletes account |
| Messages | 2 years from last message | Permanently deleted |
| Analytics data | 3 years | Aggregated/anonymised |
| Audit logs | 7 years | Required for compliance |
| Emergency alerts | 5 years | Historical record |
| Session data | 30 days after logout | Permanently deleted |

### 5.3 Cookie Consent Flow

#### 5.3.1 Cookie Banner Behaviour

| Trigger | Display |
|---------|---------|
| First visit | Banner appears at bottom of screen |
| Return visit (no consent) | Banner reappears |
| Return visit (consent given) | No banner |
| Settings change | Accessible via footer link |

#### 5.3.2 Consent Options

| Option | Description | Default |
|--------|-------------|---------|
| Essential Only | Minimum cookies for site function | N/A (always on) |
| Accept All | All cookie categories | One-click option |
| Customise | Individual category toggles | Expandable panel |

#### 5.3.3 Cookie Categories

| Category | Consent Required | If Declined |
|----------|------------------|-------------|
| Essential | No | Cannot decline |
| Functional | No | Language/preferences not persisted |
| Analytics | Yes | No usage tracking |
| Marketing | Yes | No personalised ads (not currently used) |

#### 5.3.4 Consent Storage

- Consent stored in localStorage and cookie
- Consent ID logged to database for compliance
- Consent valid for 12 months, then re-prompt
- Users can change preferences anytime via footer link

### 5.4 Content Licensing

#### 5.4.1 User-Generated Content License

When users submit content (reviews, photos, noticeboard posts), they grant:

| Right | Scope |
|-------|-------|
| License Type | Non-exclusive, worldwide, royalty-free, sublicensable |
| Permitted Uses | Display, distribute, modify (for formatting), translate |
| Duration | Perpetual for platform use; revocable by content deletion |
| Attribution | Platform may display with username or anonymously |
| Ownership | User retains ownership; platform has license only |

#### 5.4.2 Business Content License

Business owners grant similar license for:
- Business descriptions
- Photos uploaded to profile
- Promotional content
- Event descriptions

#### 5.4.3 Third-Party Content

| Source | License Requirement |
|--------|---------------------|
| Social media embeds | Displayed under platform's terms (public posts only) |
| Google Business data | Subject to Google's terms |
| Historical archive submissions | Explicit permission required, recorded |

### 5.5 Dispute Resolution Process

#### 5.5.1 Review Disputes

| Step | Process | Timeframe |
|------|---------|-----------|
| 1. Business Response | Business can respond publicly to review | Anytime |
| 2. Report Review | Business flags review with reason | Within 30 days of review |
| 3. Initial Review | Moderator reviews against content policy | 3 business days |
| 4. Decision | Remove, keep, or request edit | Communicated to both parties |
| 5. Appeal | Either party can appeal once | Within 7 days of decision |
| 6. Final Decision | Senior moderator/admin reviews | 5 business days |

#### 5.5.2 Business Claim Disputes

| Scenario | Process |
|----------|---------|
| Multiple claimants | Both must provide verification; admin decides |
| Fraudulent claim | Report mechanism; investigation; account suspension if proven |
| Former owner | Must provide proof of ownership transfer |

---

# Part 2: Design & User Experience

---

## 6. Design Specifications

### 6.1 Colour Palette

| Colour | Hex Code | Usage |
|--------|----------|-------|
| Primary Teal | #2C5F7C | Headers, primary buttons, links |
| Secondary Orange | #E67E22 | Accents, highlights, CTAs |
| Accent Gold | #F39C12 | Featured items, stars, badges |
| Success Green | #27AE60 | Success messages, open status |
| Error Red | #E74C3C | Error messages, alerts |
| Neutral Light | #F5F5F5 | Backgrounds, cards |
| Neutral Medium | #CCCCCC | Borders, dividers |
| Text Dark | #2C3E50 | Primary text |
| Text Light | #7F8C8D | Secondary text |

### 6.2 Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| H1 | Montserrat | 32px | Bold |
| H2 | Montserrat | 26px | Bold |
| H3 | Montserrat | 22px | Semi-bold |
| Body | Open Sans | 16px | Regular |
| Small | Open Sans | 14px | Regular |
| Caption | Open Sans | 12px | Regular |
| Button | Open Sans | 16px | Semi-bold |

### 6.3 Component Specifications

#### Buttons

| Type | Background | Text | Border |
|------|------------|------|--------|
| Primary | #E67E22 | White | None |
| Secondary | White | #2C5F7C | 1px #2C5F7C |
| Tertiary | Transparent | #2C5F7C | None |
| Disabled | #CCCCCC | #7F8C8D | None |

#### Cards

| Property | Value |
|----------|-------|
| Background | White |
| Border Radius | 8px |
| Shadow | 0 2px 4px rgba(0,0,0,0.1) |
| Padding | 16px |
| Hover Shadow | 0 4px 8px rgba(0,0,0,0.15) |

#### Form Fields

| Property | Value |
|----------|-------|
| Border | 1px solid #CCCCCC |
| Border Radius | 4px |
| Padding | 12px 16px |
| Focus Border | 2px solid #2C5F7C |
| Error Border | 2px solid #E74C3C |

### 6.4 Page Layouts

#### Homepage

1. Header (sticky)
   - Logo + tagline
   - Language selector
   - Navigation
   - "List Your Business" button

2. Hero Section
   - Background image
   - Search bar
   - Quick filter chips
   - Stats strip

3. Featured Businesses
   - Horizontal carousel
   - Business cards

4. Community Feed
   - Social posts
   - Masonry grid

5. Upcoming Events
   - Mini calendar
   - Event list

6. Call to Action
   - Resident signup
   - Business listing

7. Footer
   - Navigation links
   - Social links
   - Partner logos

#### Business Profile

1. Header (sticky)

2. Business Header
   - Cover photo
   - Logo
   - Name, category, rating
   - Action buttons

3. Navigation Tabs
   - Overview, Photos, Reviews, Events, Posts

4. Main Content (70%)
   - About
   - Features
   - Photo gallery
   - Reviews

5. Sidebar (30%)
   - Contact info
   - Hours
   - Promotions
   - Related businesses

### 6.5 Alert Colours

| Alert Level | Colour | Hex |
|-------------|--------|-----|
| Critical | Red | #E74C3C |
| Warning | Orange | #E67E22 |
| Advisory | Yellow | #F39C12 |
| Information | Blue | #3498DB |

---

## 7. UI States & Components

### 7.1 Component States

#### 7.1.1 Button States

| State | Visual Treatment |
|-------|------------------|
| Default | Standard appearance per button type |
| Hover | Slight darkening (10%), cursor: pointer |
| Active/Pressed | Further darkening (15%), slight scale (0.98) |
| Focus | 2px outline in primary colour, offset 2px |
| Disabled | 50% opacity, cursor: not-allowed |
| Loading | Spinner icon, text replaced with "Loading...", disabled interaction |

#### 7.1.2 Form Field States

| State | Visual Treatment |
|-------|------------------|
| Default | 1px border #CCCCCC |
| Hover | 1px border #999999 |
| Focus | 2px border primary colour, subtle shadow |
| Filled | Same as default with content |
| Error | 2px border error colour, error message below |
| Disabled | Background #F5F5F5, 50% opacity, cursor: not-allowed |
| Read-only | Background #F5F5F5, normal cursor |

#### 7.1.3 Card States

| State | Visual Treatment |
|-------|------------------|
| Default | Shadow: 0 2px 4px rgba(0,0,0,0.1) |
| Hover | Shadow: 0 4px 8px rgba(0,0,0,0.15), slight lift (-2px Y transform) |
| Active/Selected | 2px border primary colour |
| Loading | Skeleton placeholder animation |
| Disabled | 50% opacity, no hover effect |

### 7.2 Loading States

#### 7.2.1 Skeleton Screens

| Component | Skeleton Design |
|-----------|-----------------|
| Business Card | Grey rectangle for image, lines for text |
| Business Profile | Header skeleton + content blocks |
| Event Card | Image placeholder + 3 text lines |
| Review | Avatar circle + text lines |
| List items | Repeating row skeletons |

#### 7.2.2 Skeleton Specifications

```css
.skeleton {
  background: linear-gradient(
    90deg,
    #F0F0F0 25%,
    #E0E0E0 50%,
    #F0F0F0 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

#### 7.2.3 Loading Indicators

| Context | Indicator |
|---------|-----------|
| Page load | Full-page skeleton |
| Button action | Inline spinner |
| List pagination | Bottom spinner |
| Pull to refresh | Top spinner |
| Background sync | Toast notification |

### 7.3 Empty States

#### 7.3.1 Standard Empty State Template

```
┌─────────────────────────────────┐
│                                 │
│      [Illustration 120px]       │
│                                 │
│        [Headline - H3]          │
│                                 │
│   [Subtext - Body, muted]       │
│                                 │
│    [Primary Action Button]      │
│                                 │
│     [Secondary Text Link]       │
│                                 │
└─────────────────────────────────┘
```

#### 7.3.2 Empty State Content

| Context | Headline | Subtext | Action |
|---------|----------|---------|--------|
| No search results | "No businesses found" | "Try adjusting your search or filters" | "Clear filters" |
| No saved businesses | "No saved businesses yet" | "Tap the heart icon on any business to save it here" | "Explore businesses" |
| No events | "No events on this date" | "Check back soon or browse upcoming events" | "View all events" |
| No messages | "No messages yet" | "When customers contact you, their messages will appear here" | None |
| No reviews | "No reviews yet" | "Be the first to share your experience!" | "Write a review" |
| No deals | "No deals available right now" | "Check back soon for offers from local businesses" | "Browse businesses" |

#### 7.3.3 Empty State Illustrations

| Context | Illustration Theme |
|---------|-------------------|
| No search results | Magnifying glass with question mark |
| No saved items | Heart or bookmark |
| No messages | Empty inbox/envelope |
| No reviews | Star with speech bubble |
| No events | Empty calendar |
| No deals | Price tag |
| No notifications | Bell |
| Error/offline | Cloud with X |

### 7.4 Error States

#### 7.4.1 Inline Field Errors

```
┌─────────────────────────────────┐
│ Email                           │
├─────────────────────────────────┤
│ invalid-email                   │  ← Red border
└─────────────────────────────────┘
  ⚠ Please enter a valid email     ← Error message (red, 14px)
```

#### 7.4.2 Form-Level Errors

```
┌─────────────────────────────────┐
│ ⚠ Unable to save changes        │
│                                 │
│ Please fix the errors below     │
│ and try again.                  │
└─────────────────────────────────┘
```

#### 7.4.3 Page-Level Errors

| Error | Display |
|-------|---------|
| 404 Not Found | Full page with illustration, "Page not found", back button |
| 500 Server Error | Full page, "Something went wrong", retry button |
| Offline | Banner at top, "You're offline", cached content shown |
| Session Expired | Modal, "Session expired", login button |

### 7.5 Additional Components

#### 7.5.1 Modal/Dialog

| Property | Specification |
|----------|---------------|
| Overlay | rgba(0,0,0,0.5), click to close (optional) |
| Container | White, 8px radius, shadow |
| Max width | 480px (small), 640px (medium), 800px (large) |
| Padding | 24px |
| Header | Title (H3) + close button (X icon) |
| Footer | Action buttons, right-aligned |
| Animation | Fade in + slight scale up (0.95 → 1) |
| Mobile | Full screen on mobile < 480px |

#### 7.5.2 Toast/Snackbar Notifications

| Property | Specification |
|----------|---------------|
| Position | Bottom center (mobile), bottom right (desktop) |
| Width | Auto, max 400px |
| Padding | 12px 16px |
| Border radius | 4px |
| Background | Dark (#333) for info, semantic colours for others |
| Text | White, 14px |
| Duration | 4 seconds (auto-dismiss), or persistent with close |
| Animation | Slide up + fade in |
| Stacking | Max 3 visible, newest on top |

#### 7.5.3 Dropdown Menu

| Property | Specification |
|----------|---------------|
| Trigger | Button or link |
| Container | White, 4px radius, shadow |
| Item height | 40px |
| Item padding | 12px 16px |
| Hover | Background #F5F5F5 |
| Selected | Background primary colour (10% opacity), text primary |
| Divider | 1px #EEEEEE |
| Max height | 300px, scrollable |
| Position | Below trigger, align left (flip if needed) |

#### 7.5.4 Tabs

| Property | Specification |
|----------|---------------|
| Container | Border-bottom 1px #EEEEEE |
| Tab height | 48px |
| Tab padding | 0 16px |
| Active tab | Primary colour text, 2px bottom border |
| Inactive tab | Muted text, no border |
| Hover | Slight background highlight |
| Mobile | Scrollable horizontal if many tabs |

#### 7.5.5 Accordion/Collapsible

| Property | Specification |
|----------|---------------|
| Header height | 48px minimum |
| Header padding | 16px |
| Icon | Chevron right (collapsed), chevron down (expanded) |
| Animation | Smooth height transition (200ms) |
| Content padding | 16px |
| Border | 1px #EEEEEE between items |

#### 7.5.6 Tooltip

| Property | Specification |
|----------|---------------|
| Background | Dark (#333) |
| Text | White, 12px |
| Padding | 8px 12px |
| Border radius | 4px |
| Max width | 200px |
| Arrow | 6px triangle pointing to trigger |
| Delay | 300ms before show |
| Position | Prefer top, flip if needed |

#### 7.5.7 Badge

| Type | Specification |
|------|---------------|
| Count badge | Circle, 18px min, background red, white text |
| Status badge | Pill shape, 24px height, semantic colours |
| Tag badge | Rounded rectangle, 28px height, subtle background |

#### 7.5.8 Progress Indicators

| Type | Specification |
|------|---------------|
| Linear | 4px height, rounded, primary colour fill |
| Circular (spinner) | 24px default, stroke width 3px, primary colour |
| Steps | Circles connected by lines, filled when complete |
| Percentage | Linear bar with percentage text |

#### 7.5.9 Date/Time Picker

| Property | Specification |
|----------|---------------|
| Calendar | Month grid view, today highlighted |
| Time | Dropdowns for hour, minute (15-min increments) |
| Mobile | Native date/time inputs on mobile |
| Range | Two calendars side by side for date ranges |

#### 7.5.10 File Upload Component

| State | Display |
|-------|---------|
| Default | Dashed border box, "Drag files or click to upload" |
| Drag over | Highlighted border, "Drop files here" |
| Uploading | Progress bar, file name, cancel button |
| Complete | Thumbnail (images), file icon (documents), remove button |
| Error | Red border, error message |

#### 7.5.11 Image Cropper

| Feature | Specification |
|---------|---------------|
| Crop area | Resizable, maintains aspect ratio if required |
| Aspect ratios | 1:1 (logo), 3:1 (cover), free (gallery) |
| Controls | Zoom slider, rotate buttons |
| Preview | Live preview of cropped result |
| Actions | Cancel, Apply buttons |

### 7.6 Animation & Transitions

#### 7.6.1 Standard Durations

| Type | Duration | Easing |
|------|----------|--------|
| Micro (hover, focus) | 150ms | ease-out |
| Small (buttons, toggles) | 200ms | ease-out |
| Medium (modals, panels) | 300ms | ease-in-out |
| Large (page transitions) | 400ms | ease-in-out |

#### 7.6.2 Page Transitions

| Transition | Animation |
|------------|-----------|
| Navigate forward | Slide left + fade |
| Navigate back | Slide right + fade |
| Modal open | Fade in + scale up |
| Modal close | Fade out + scale down |
| Dropdown open | Fade in + slide down |

#### 7.6.3 Micro-interactions

| Interaction | Animation |
|-------------|-----------|
| Button click | Scale down (0.98) on press |
| Card hover | Lift (translateY -2px) + shadow increase |
| Like/save | Heart pulse animation |
| Success | Checkmark draw animation |
| Error shake | Horizontal shake (3 cycles) |
| Pull to refresh | Spinner rotation |

---

## 8. Multilingual Support

### 8.1 Supported Languages

#### Phase 1 Languages

| Language | Code | RTL | Priority |
|----------|------|-----|----------|
| English | en | No | Primary |
| Arabic | ar | Yes | High |
| Chinese (Simplified) | zh-CN | No | High |
| Chinese (Traditional) | zh-TW | No | Medium |
| Vietnamese | vi | No | High |
| Hindi | hi | No | Medium |
| Urdu | ur | Yes | Medium |
| Korean | ko | No | Low |
| Greek | el | No | Low |
| Italian | it | No | Low |

### 8.2 UI Translation

#### Translated Elements

| Element | Translation Required |
|---------|---------------------|
| Navigation | All menu items |
| Buttons | All action buttons |
| Labels | Form labels and field names |
| Messages | Success, error, info messages |
| Tooltips | Help text |
| Email Templates | All automated emails |

#### Translation Management

- Translation files per language (JSON format)
- Admin interface for translation editing
- Missing translation fallback to English
- Professional translation for initial launch
- Community contribution system for updates

### 8.3 Content Translation

#### Business Content

| Content | Translation Method |
|---------|-------------------|
| Business Name | Manual by owner or auto-transliteration |
| Description | Manual by owner or auto-translation |
| Promotions | Manual by owner or auto-translation |
| Categories | Pre-translated (system) |

#### Auto-Translation

- Powered by Google Translate API (confirmed)
- Indicated as "Auto-translated"
- Owner can override with manual translation
- Quality flag for community reporting

### 8.4 RTL Support

#### RTL Requirements

| Element | Behaviour |
|---------|-----------|
| Text Direction | Right-to-left for Arabic, Urdu |
| Layout Mirroring | Navigation, cards, forms |
| Icons | Direction-aware icons mirrored |
| Numbers | Left-to-right within RTL text |
| Mixed Content | Bidirectional text handling |

### 8.5 Language Selection

#### User Language

| Setting | Location |
|---------|----------|
| Header Selector | Globe icon + current language |
| Registration | Language preference question |
| Profile Settings | Change language preference |
| Browser Detection | Initial suggestion based on browser |

#### Content Language

- Display content in user's preferred language
- Fallback to English if translation unavailable
- Option to view original language
- Indicate when showing translation

---

## 9. Onboarding & User Journeys

### 9.1 First-Time User Experience

#### 9.1.1 Visitor Journey (Unauthenticated)

```
Landing Page
    ↓
[Search/Browse Businesses] ← Primary CTA
    ↓
View Business Profile
    ↓
[Prompt: "Save this business? Create a free account"]
    ↓
Registration (if clicked)
```

#### 9.1.2 New User Onboarding Flow

| Step | Screen | Required | Content |
|------|--------|----------|---------|
| 1 | Welcome | Yes | "Welcome to [Platform Name]!" with value proposition |
| 2 | Language | Yes | Select preferred language |
| 3 | Location | Optional | Enable location for "Near Me" features |
| 4 | Interests | Optional | Select 3-5 business categories of interest |
| 5 | Notifications | Optional | Enable push notifications |
| 6 | Complete | Yes | "You're all set!" with suggested actions |

#### 9.1.3 Onboarding UI Specifications

| Element | Specification |
|---------|---------------|
| Progress indicator | Dots showing current step (e.g., ●●○○○○) |
| Skip option | "Skip" link on optional steps |
| Back navigation | Back arrow on all steps except first |
| Completion | Confetti animation, redirect to homepage |

### 9.2 Business Owner Onboarding

#### 9.2.1 Claim Flow

```
Business Profile (Unclaimed)
    ↓
[Claim This Business] Button
    ↓
Verification Method Selection
    ↓
Verification Process
    ↓
Moderator Review (if document-based)
    ↓
Access Granted
    ↓
Profile Completion Wizard
```

#### 9.2.2 Profile Completion Wizard

| Step | Section | Fields | Completion % |
|------|---------|--------|--------------|
| 1 | Basic Info | Name, description, category | 20% |
| 2 | Contact | Phone, email, website | 35% |
| 3 | Location | Address, map pin confirmation | 45% |
| 4 | Hours | Operating hours for each day | 55% |
| 5 | Photos | Logo + at least 3 gallery photos | 75% |
| 6 | Social | Social media links | 85% |
| 7 | Details | Languages, certifications, accessibility | 100% |

#### 9.2.3 Wizard UI Elements

| Element | Behaviour |
|---------|-----------|
| Progress bar | Visual percentage complete |
| Save & Continue | Saves progress, moves to next step |
| Save & Exit | Saves progress, returns to dashboard |
| Skip Step | Moves to next step without saving (marks incomplete) |
| Completion celebration | Animation when 100% reached |

### 9.3 QR Code Registration Flow

#### 9.3.1 QR Code Placement

| Location | Purpose |
|----------|---------|
| Business window stickers | Individual business registration |
| Event posters | Event-specific registration |
| Council publications | General platform registration |
| Partner marketing materials | Campaign-tracked registration |

#### 9.3.2 QR Code URL Structure

```
https://[platform-domain]/register?
  source=qr
  &location=[business-id|event-id|campaign-id]
  &campaign=[campaign-name]
```

#### 9.3.3 QR Registration Flow

| Step | Screen | Content |
|------|--------|---------|
| 1 | Landing | "Welcome! You're joining from [Business Name/Event]" |
| 2 | Registration | Standard registration form (pre-filled source) |
| 3 | Verification | Email verification |
| 4 | Onboarding | Abbreviated onboarding (skip interests if from specific business) |
| 5 | Redirect | If from business: redirect to that business profile |

#### 9.3.4 QR Code Analytics

Track per QR code:
- Scans (even without registration)
- Registrations completed
- Source attribution in user record

---

# Part 3: Users & Core Entities

---

## 10. User Types & Roles

### 10.1 Role Definitions

| Role | Description | Access Level |
|------|-------------|--------------|
| **Visitor** | Unauthenticated user browsing the platform | Read-only access to public content |
| **Community Member** | Registered resident/community user | Save businesses, RSVP events, submit reviews, receive notifications |
| **Business Owner** | Verified owner/manager of a listed business | Full control of their business profile, analytics access |
| **Content Moderator** | Platform staff managing content quality | Content approval, flag review, user warnings |
| **Platform Administrator** | Full administrative access | All moderator functions plus user management, settings, analytics |
| **Chamber/Council Staff** | Partner organisation access | Analytics, surveys, communications, event management |

### 10.2 Permission Matrix

| Function | Visitor | Community | Business Owner | Moderator | Admin |
|----------|---------|-----------|----------------|-----------|-------|
| View business profiles | ✓ | ✓ | ✓ | ✓ | ✓ |
| View events | ✓ | ✓ | ✓ | ✓ | ✓ |
| Save/favourite businesses | ✗ | ✓ | ✓ | ✓ | ✓ |
| RSVP to events | ✗ | ✓ | ✓ | ✓ | ✓ |
| Submit reviews | ✗ | ✓ | ✓ | ✓ | ✓ |
| Edit own business profile | ✗ | ✗ | ✓ | ✗ | ✓ |
| View business analytics | ✗ | ✗ | Own only | ✗ | ✓ |
| Approve content | ✗ | ✗ | ✗ | ✓ | ✓ |
| Manage users | ✗ | ✗ | ✗ | ✗ | ✓ |
| Platform settings | ✗ | ✗ | ✗ | ✗ | ✓ |
| Create surveys | ✗ | ✗ | ✗ | ✗ | ✓ |
| Export reports | ✗ | ✗ | ✗ | ✗ | ✓ |

---

## 11. Business Profile Features

### 11.1 Basic Business Information

#### Required Fields

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| Business Name | Text | Official business name | Required, max 100 chars |
| Business Description | Rich Text | About the business | Required, max 2000 chars, multilingual |
| Primary Category | Select | Main business type | Required, from predefined list |
| Secondary Categories | Multi-select | Additional categories | Optional, max 3 |
| Street Address | Text | Physical location | Required |
| Suburb | Text | Auto-filled from address | Required |
| Postcode | Text | Auto-filled from address | Required, 4 digits |
| Phone Number | Text | Primary contact | Required, Australian format |
| Email Address | Email | Contact email | Optional |
| Website URL | URL | External website link | Optional |

#### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| Secondary Phone | Text | Alternative contact number |
| Year Established | Number | When business started |
| Price Range | Select | $, $$, $$$, $$$$ |
| Payment Methods | Multi-select | Cash, Card, EFTPOS, PayPal, etc. |
| Parking Information | Select | Street, dedicated lot, none, paid nearby |
| Accessibility Features | Multi-select | Wheelchair access, hearing loop, accessible bathroom |

### 11.2 Operating Hours

#### Standard Hours

| Field | Type | Description |
|-------|------|-------------|
| Monday - Sunday | Time range | Opening and closing time for each day |
| Closed Days | Checkbox | Mark days when business is closed |
| 24 Hours | Checkbox | Business operates 24 hours |
| By Appointment Only | Checkbox | No walk-in service |

#### Special Hours

| Field | Type | Description |
|-------|------|-------------|
| Holiday Hours | Date + Time range | Modified hours for specific dates |
| Temporary Closure | Date range + Reason | Planned closure |
| Special Event Hours | Date + Time range | Extended hours for events |

#### Display Logic

- Show "Open Now" or "Closed" based on current time
- Display next opening time if currently closed
- Show countdown to closing if closing within 1 hour
- Highlight modified hours with visual indicator

### 11.3 Business Media

#### Logo

| Specification | Requirement |
|---------------|-------------|
| Format | PNG, JPG, JPEG, WebP |
| Minimum Size | 200 x 200 pixels |
| Maximum Size | 2MB |
| Aspect Ratio | 1:1 (square) |

#### Cover/Banner Photo

| Specification | Requirement |
|---------------|-------------|
| Format | PNG, JPG, JPEG, WebP |
| Minimum Size | 1200 x 400 pixels |
| Maximum Size | 5MB |
| Aspect Ratio | 3:1 recommended |

#### Photo Gallery

| Specification | Requirement |
|---------------|-------------|
| Maximum Photos | 50 per business |
| Format | PNG, JPG, JPEG, WebP |
| Maximum Size | 5MB per image |
| Categories | Interior, Exterior, Products, Menu, Team, Events |
| Alt Text | Required for accessibility, max 200 chars |

### 11.4 Social & Online Presence

| Platform | Field | Format |
|----------|-------|--------|
| Facebook | Page URL | facebook.com/{page} |
| Instagram | Handle | @username |
| X (Twitter) | Handle | @username |
| TikTok | Handle | @username |
| LinkedIn | Page URL | linkedin.com/company/{page} |
| YouTube | Channel URL | youtube.com/{channel} |
| Google Business | Profile Link | Auto-linked if connected |

### 11.5 Languages & Cultural Information

| Feature | Description |
|---------|-------------|
| Languages Spoken | Multi-select from supported languages |
| Cultural Certifications | Halal, Kosher, Vegan, Vegetarian, Organic |
| Cultural Services | Languages for service, cultural specialties |

---

## 12. Community User Features

### 12.1 User Registration

#### Registration Methods

| Method | Description |
|--------|-------------|
| Email + Password | Standard registration |
| Google Sign-In | OAuth with Google |
| Facebook Sign-In | OAuth with Facebook |

#### Registration Fields

| Field | Required | Validation |
|-------|----------|------------|
| Email | Yes | Valid format, unique |
| Password | Yes | 8+ chars, uppercase, number |
| Display Name | Yes | 2-50 chars |
| Suburb | Optional | From dropdown |
| Language Preference | Yes | Default to browser |
| Interests | Optional | Category selection |

### 12.2 User Profile

| Field | Type | Editable |
|-------|------|----------|
| Display Name | Text | Yes |
| Profile Photo | Image | Yes |
| Bio | Text (500 chars) | Yes |
| Suburb | Select | Yes |
| Language Preference | Select | Yes |
| Interest Categories | Multi-select | Yes |
| Member Since | Date | No |

### 12.3 Notification Preferences

| Notification Type | Default | Options |
|-------------------|---------|---------|
| Business Updates | On | Email, Push, Both, Off |
| Event Reminders | On | Email, Push, Both, Off |
| Promotions | Off | Email, Push, Both, Off |
| Community News | On | Email, Push, Both, Off |
| Emergency Alerts | On (forced for Critical) | Email, Push, SMS, WhatsApp, All |

#### Digest Options

| Frequency | Content |
|-----------|---------|
| Instant | Each notification immediately |
| Daily | Digest at 8am |
| Weekly | Digest on Monday morning |

### 12.4 Saved Businesses & Activity

#### Saved Businesses

| Feature | Description |
|---------|-------------|
| Save Button | Heart icon on business cards/profiles |
| Saved List | Personal list of favourites |
| Custom Lists | Create named collections |
| Follow | Subscribe to business updates |

#### User Activity

| Tracked Activity | Visible To |
|------------------|------------|
| Reviews Written | Public (on profile) |
| Events RSVPed | Private |
| Saved Businesses | Private |
| Saved Deals | Private |

### 12.5 Account Security

| Feature | Description |
|---------|-------------|
| Password Change | Requires current password |
| Email Change | Verification required |
| Two-Factor Auth | Optional TOTP |
| Active Sessions | View and revoke |
| Account Deletion | 14-day grace period |

---

## 13. Business Owner Features

### 13.1 Business Claim Process

#### Verification Methods

| Method | Description | Approval |
|--------|-------------|----------|
| Phone Verification | Automated call with PIN | Automatic |
| Email Verification | Link to business domain email | Automatic |
| Document Upload | ABN certificate, utility bill | Moderator review |
| Google Business | Connect verified GMB profile | Automatic |

#### Claim Flow

1. User clicks "Claim This Business"
2. Selects verification method
3. Completes verification
4. If document-based: enters moderation queue
5. On approval: linked as owner
6. Owner completes profile wizard

### 13.2 Business Dashboard

#### Dashboard Widgets

| Widget | Content |
|--------|---------|
| Profile Completeness | Percentage with prompts |
| This Week's Views | Views compared to last week |
| Recent Reviews | Latest reviews with response status |
| Upcoming Events | Events linked to business |
| Active Promotions | Current deals with performance |
| Messages | Unread enquiry count |

### 13.3 Profile Management

| Feature | Description |
|---------|-------------|
| Edit All Fields | Full control over business info |
| Photo Management | Upload, categorise, reorder, delete |
| Hours Management | Update regular and special hours |
| Promotion Creation | Create and manage deals |
| Event Linking | Associate events with business |

### 13.4 Business Analytics

| Metric | Description |
|--------|-------------|
| Profile Views | Total and unique visitors |
| Search Appearances | Times shown in search results |
| Website Clicks | Outbound clicks to website |
| Phone Clicks | Click-to-call actions |
| Direction Requests | Maps/directions clicks |
| Photo Views | Gallery engagement |
| Save Count | Times saved by users |
| Follow Count | Follower total |
| Review Count | Total reviews |
| Average Rating | Star rating average |

#### Analytics Timeframes

| Period | Description |
|--------|-------------|
| Today | Current day stats |
| Last 7 Days | Week view with daily breakdown |
| Last 30 Days | Month view with weekly breakdown |
| Last 12 Months | Year view with monthly breakdown |
| Custom Range | User-defined date range |

#### Export Options

| Format | Content |
|--------|---------|
| CSV | Raw data for all metrics |
| PDF | Formatted report with charts |

---

# Part 4: Core Functionality

---

## 14. Search & Discovery

### 14.1 Search Functionality

#### Search Features

| Feature | Description |
|---------|-------------|
| Full-Text Search | Search business name, description, categories |
| Autocomplete | Real-time suggestions as user types |
| Recent Searches | Last 10 searches for logged-in users |
| Popular Searches | Trending search terms |
| Typo Tolerance | Fuzzy matching for misspellings |
| Synonym Matching | "Restaurant" matches "Eatery", etc. |

### 14.2 Filters

| Filter | Type | Options |
|--------|------|---------|
| Category | Multi-select | From category list |
| Distance | Radio | 500m, 1km, 2km, 5km, Any |
| Open Now | Toggle | Show only currently open |
| Languages | Multi-select | Languages spoken |
| Price Range | Multi-select | $, $$, $$$, $$$$ |
| Rating | Slider | 3+, 4+, 4.5+ stars |
| Certifications | Multi-select | Halal, Kosher, Vegan, etc. |
| Accessibility | Multi-select | Wheelchair, hearing loop, etc. |
| Has Promotions | Toggle | Currently running deals |

### 14.3 Sort Options

| Option | Description |
|--------|-------------|
| Relevance | Best match to search terms |
| Distance | Nearest first |
| Rating | Highest rated first |
| Most Reviewed | Most reviews first |
| Recently Updated | Latest activity first |
| Alphabetical | A-Z sorting |

### 14.4 Search Results

#### Business Card Display

| Element | Content |
|---------|---------|
| Image | Logo or first gallery image |
| Name | Business name |
| Category | Primary category |
| Rating | Stars and review count |
| Distance | Distance from user |
| Status | Open Now / Closed |
| Promotion Badge | If active promotion |

---

## 15. Events & Calendar System

### 15.1 Event Information

#### Event Fields

| Field | Type | Required |
|-------|------|----------|
| Title | Text (max 100) | Yes |
| Description | Rich Text (max 5000) | Yes |
| Category | Select | Yes |
| Start Date/Time | DateTime | Yes |
| End Date/Time | DateTime | Yes |
| Location Type | Select (Physical/Online/Hybrid) | Yes |
| Venue Name | Text | If physical |
| Venue Address | Address | If physical |
| Online Link | URL | If online |
| Image | Upload | Recommended |
| Ticket URL | URL | Optional |
| Cost | Text | Optional |
| Capacity | Number | Optional |
| Age Restriction | Text | Optional |
| Accessibility | Multi-select | Optional |

### 15.2 Recurring Events

| Pattern | Description |
|---------|-------------|
| Daily | Every day |
| Weekly | Same day each week |
| Fortnightly | Every two weeks |
| Monthly (Date) | Same date each month |
| Monthly (Day) | Same day (e.g., 2nd Tuesday) |
| Custom | User-defined pattern |

### 15.3 Calendar Views

| View | Description |
|------|-------------|
| Month | Traditional calendar grid |
| List | Chronological event list |
| Day | Detailed single day view |

### 15.4 Event Interaction

| Action | Description |
|--------|-------------|
| RSVP | Going, Interested, Not Going |
| Calendar Export | ICS file download |
| Google Calendar | One-click add |
| Share | Social sharing options |
| Reminder | Set notification reminder |

---

## 16. Messaging & Communication System

### 16.1 Enquiry System

#### Enquiry Form

| Field | Type | Required |
|-------|------|----------|
| Subject Category | Select | Yes |
| Message | Text (max 1000) | Yes |
| Preferred Contact | Radio | Optional |
| Attachments | Images (max 3, 5MB each) | Optional |

#### Subject Categories

- General Enquiry
- Product/Service Question
- Booking/Reservation
- Feedback
- Other

### 16.2 Conversation Management

#### User View

| Feature | Description |
|---------|-------------|
| Conversation List | All conversations with businesses |
| Thread View | Full message history |
| Read Receipts | See when message was read |
| Archive | Hide old conversations |

#### Business View

| Feature | Description |
|---------|-------------|
| Unified Inbox | All customer enquiries |
| Quick Reply | Template responses |
| Auto-Response | Out of office messages |
| Response Time | Track average response |
| Analytics | Enquiry metrics |

### 16.3 Privacy & Safety

| Feature | Description |
|---------|-------------|
| Hidden Contact Info | Personal details not shared until user chooses |
| Block User | Prevent further messages |
| Report | Flag inappropriate messages |
| Spam Detection | Automatic filtering |
| Rate Limiting | Max 10 new conversations/day |

---

## 17. Deals & Promotions Hub

### 17.1 Deal Types

| Type | Description |
|------|-------------|
| Standard | Regular promotions with extended validity |
| Flash | Time-limited (2-24 hours), quantity limited |
| Recurring | Weekly specials (e.g., "Taco Tuesday") |

### 17.2 Deal Information

| Field | Type | Required |
|-------|------|----------|
| Title | Text (max 100) | Yes |
| Description | Text (max 500) | Yes |
| Discount Type | Select | Yes |
| Discount Value | Number | Yes |
| Category | Select | Yes |
| Valid From | DateTime | Yes |
| Valid Until | DateTime | Yes |
| Redemption Method | Select | Yes |
| Terms & Conditions | Text | Recommended |
| Image | Upload | Recommended |

### 17.3 Discount Types

| Type | Example |
|------|---------|
| Percentage | 20% off |
| Fixed Amount | $10 off |
| BOGO | Buy one get one free |
| Free Item | Free coffee with purchase |

### 17.4 Redemption Methods

| Method | Description |
|--------|-------------|
| Show Screen | Display deal on phone |
| Unique Code | One-time use code |
| QR Code | Scan at checkout |
| None | No verification needed |

### 17.5 Deals Hub Features

| Section | Content |
|---------|---------|
| Today's Deals | Featured daily deals |
| Ending Soon | Deals expiring within 48 hours |
| New This Week | Recently added deals |
| Most Popular | High engagement deals |
| Near You | Location-based deals |
| By Category | Filtered views |

---

## 18. Reviews & Ratings

### 18.1 Review Submission

| Field | Type | Required |
|-------|------|----------|
| Rating | 1-5 stars | Yes |
| Title | Text (max 100) | Optional |
| Content | Text (50-1000 chars) | Yes |
| Photos | Upload (max 3) | Optional |

### 18.2 Review Rules

| Rule | Description |
|------|-------------|
| One per business | Users can only review once per business |
| Edit window | 7 days to edit after posting |
| Minimum length | 50 characters |
| Moderation | Reviews enter moderation queue |

### 18.3 Business Response

| Feature | Description |
|---------|-------------|
| Public Response | Business can reply publicly |
| Response Notification | User notified of response |
| One Response | One response per review |

### 18.4 Review Display

| Element | Content |
|---------|---------|
| Author | Display name and photo |
| Date | When posted |
| Rating | Star display |
| Content | Review text |
| Photos | Review images |
| Helpful | "Was this helpful?" voting |
| Response | Business reply if present |

---

# Part 5: Community & Social Features

---

## 19. Community Features

### 19.1 Community Noticeboard

#### Notice Types

| Type | Description |
|------|-------------|
| Lost & Found | Lost or found items |
| For Sale | Items for sale |
| Free Items | Giveaways |
| Wanted | Looking for items/services |
| Recommendations | Seeking/giving recommendations |
| General | Other community notices |

#### Notice Rules

| Rule | Value |
|------|-------|
| Max active per user | 3 |
| Auto-expiry | 30 days |
| Moderation | All require approval |
| Renewals | Can renew before expiry |

### 19.2 Community Groups

| Field | Description |
|-------|-------------|
| Name | Group name |
| Category | Hobby, Parent, Cultural, Sports, Volunteer |
| Description | About the group |
| Meeting Schedule | When/where they meet |
| Contact | How to join/enquire |
| Website/Social | Links to group presence |

### 19.3 Local History Archive

| Content Type | Description |
|--------------|-------------|
| Photos | Historical photographs |
| Stories | Written memories/accounts |
| Heritage Sites | Important locations |
| Oral Histories | Recorded interviews |
| Timeline | Chronological events |

### 19.4 Announcements

| Source | Description |
|--------|-------------|
| Platform | System announcements |
| Council | Local government updates |
| Chamber | Business community news |
| Community | Approved community updates |

---

## 20. Social Media Integration

### 20.1 Community Social Feed

| Feature | Description |
|---------|-------------|
| Hashtag Aggregation | Collect posts with configured hashtags |
| Multi-Platform | Instagram, Facebook, X |
| Masonry Grid | Pinterest-style layout |
| Moderation | Filter inappropriate content |
| Location Filter | Within configured radius |

### 20.2 Business Social Feeds

| Feature | Description |
|---------|-------------|
| Feed Display | Latest 3-4 posts on profile |
| Platform Support | Instagram, Facebook |
| Sync Frequency | Hourly with webhook support |
| Follow Links | Direct links to social profiles |

---

## 21. Business-to-Business Networking

### 21.1 B2B Profile

| Field | Description |
|-------|-------------|
| Open to Networking | Toggle visibility |
| Looking For | Partnerships, suppliers, referrals, mentorship |
| Can Offer | Same categories as "Looking For" |
| Business Size | Solo, Small (2-5), Medium (6-20), Large (20+) |
| Years in Area | How long established |

### 21.2 Connections

| Feature | Description |
|---------|-------------|
| Connection Request | Send request with message |
| Accept/Decline | Review incoming requests |
| Connection List | View all connections |
| B2B Messaging | Direct messaging between connected businesses |
| Export Contacts | Download connection list |

### 21.3 B2B Forum

| Category | Topics |
|----------|--------|
| General | Open discussion |
| Suppliers | Supplier recommendations |
| Marketing | Marketing ideas/partnerships |
| Operations | Operational advice |
| Local Issues | Area-specific discussions |

### 21.4 Collaboration Features

| Feature | Description |
|---------|-------------|
| Joint Promotions | Co-branded deals |
| Referral Tracking | Track referrals between businesses |
| Resource Sharing | Recommended suppliers, templates |

---

## 22. Emergency & Crisis Communication

### 22.1 Alert System

#### Alert Levels

| Level | Colour | Use Case |
|-------|--------|----------|
| Critical | Red | Immediate danger, natural disaster |
| Warning | Orange | Significant disruption, severe weather |
| Advisory | Yellow | Planned disruption, minor incident |
| Information | Blue | Recovery updates, general info |

#### Alert Content

| Field | Type | Required |
|-------|------|----------|
| Level | Select | Yes |
| Title | Text (max 100) | Yes |
| Summary | Text (max 280) | Yes |
| Full Details | Rich Text (max 2000) | Yes |
| Affected Area | Multi-select or "All" | Yes |
| Start Time | DateTime | Yes |
| Expected End | DateTime | Optional |
| Source | Text | Yes |
| External Links | URLs | Optional |
| Map Area | Polygon | Optional |

### 22.2 Alert Distribution

| Channel | Critical | Warning | Advisory | Info |
|---------|----------|---------|----------|------|
| Push | Forced | Default On | Default Off | Off |
| SMS (opt-in) | Yes | Yes | No | No |
| WhatsApp (opt-in) | Yes | Yes | No | No |
| Email | Immediate | Immediate | Digest | Digest |
| In-App | Prominent | Prominent | Standard | Standard |

### 22.3 Business Emergency Status

| Status | Description |
|--------|-------------|
| Operating Normally | Default |
| Modified Hours | Temporary changes |
| Limited Services | Some services unavailable |
| Temporarily Closed | Closed due to emergency |
| Closed Until Further Notice | Extended closure |

### 22.4 Community Safety

| Feature | Description |
|---------|-------------|
| "I'm Safe" Check-In | Users mark themselves safe |
| Business Status | Quick status updates |
| Emergency Contacts | Police, Fire, Ambulance, SES |
| Resource Links | Evacuation routes, relief centres |

---

# Part 6: Administration & Operations

---

## 23. Administration & Moderation

### 23.1 Admin Dashboard

| Widget | Content |
|--------|---------|
| Active Users | Current logged-in count |
| New Registrations | Last 7 days |
| Pending Approvals | Content awaiting review |
| Active Businesses | With recent activity |
| Upcoming Events | Next 7 days |
| System Health | Status indicators |

### 23.2 User Management

| Action | Description |
|--------|-------------|
| View Profile | See user details |
| Edit Role | Change permissions |
| Suspend | Temporary disable |
| Unsuspend | Restore access |
| Delete | Permanent removal |
| View Activity | User action history |

### 23.3 Business Management

| Action | Description |
|--------|-------------|
| View Profile | See business details |
| Edit Profile | Modify information |
| Change Status | Activate, suspend |
| Transfer Ownership | Change verified owner |
| Merge Duplicate | Combine listings |
| Completeness Tracking | Profile progress |

### 23.4 Content Moderation

| Content Type | Approval Required |
|--------------|-------------------|
| New Businesses | Yes (unclaimed) |
| Photos | If reported |
| Reviews | Yes (all) |
| Noticeboard Items | Yes (all) |
| Events | Community-submitted only |

#### Moderation Actions

| Action | Description |
|--------|-------------|
| Approve | Publish content |
| Reject | Remove with reason |
| Edit | Modify before publishing |
| Request Changes | Return to submitter |
| Escalate | Send to senior moderator |

---

## 24. Content Policies

### 24.1 Review Guidelines

#### Acceptable Reviews

| Requirement | Description |
|-------------|-------------|
| Genuine Experience | Based on actual visit/purchase |
| Relevant | Focus on business/products/services |
| Constructive | Specific, helpful criticism |
| Original | Written by reviewer |
| Current | Recent experience (within 12 months ideal) |

#### Prohibited Content

| Category | Examples |
|----------|----------|
| Fake reviews | Paid reviews, self-reviews |
| Discrimination | Racism, sexism, religious attacks |
| Personal attacks | Naming staff negatively |
| Irrelevant | Political opinions, competitor attacks |
| Promotional | Advertising other businesses |
| Illegal | Defamation, threats |
| Explicit | Sexual content, graphic violence |
| Spam | Repetitive, excessive links |

### 24.2 Photo Guidelines

| Acceptable | Prohibited |
|------------|------------|
| Business premises | Copyright infringement |
| Products/services | Inappropriate content |
| Customer experience | Irrelevant photos |
| Clear, quality images | Personal information visible |

### 24.3 Business Verification Criteria

| Method | Accepted Evidence |
|--------|-------------------|
| Phone | Successful PIN verification |
| Email | Verification to @business-domain.com |
| Google Business | Connected verified GMB |
| ABN Certificate | Current ASIC registration |
| Utility Bill | Recent bill showing business name/address |

### 24.4 Appeal Process

| Step | Timeframe |
|------|-----------|
| Submit Appeal | Within 30 days |
| Acknowledgment | Automatic |
| Senior Review | 5 business days |
| Decision | Communicated via email |
| Final | No further appeal |

---

## 25. Analytics & Reporting

### 25.1 Platform Analytics

| Metric | Description |
|--------|-------------|
| Daily Active Users | Unique users per day |
| Monthly Active Users | Unique users per month |
| New Registrations | Account creation |
| Session Duration | Average time on platform |
| Page Views | Total and by page |
| Search Queries | What users search for |
| Popular Businesses | Most viewed profiles |
| Event Attendance | RSVPs and check-ins |

### 25.2 Standard Reports

| Report | Frequency |
|--------|-----------|
| Platform Overview | Weekly |
| Business Health | Monthly |
| User Engagement | Monthly |
| Content Moderation | Weekly |
| Event Performance | Per event |
| Survey Results | Per survey |

### 25.3 Export Formats

| Format | Use |
|--------|-----|
| PDF | Formatted report |
| CSV | Raw data |
| Excel | Formatted with charts |

### 25.4 CID Pilot Metrics

| Metric | Description |
|--------|-------------|
| Foot Traffic Impact | Before/after comparison |
| Business Participation | Onboarded and active |
| Community Engagement | Registrations and activity |
| Economic Indicators | Referrals, directions |
| Survey Insights | Aggregated results |

---

## 26. Integration Requirements

### 26.1 Google Business Profile API (confirmed)

| Data | Direction | Frequency |
|------|-----------|-----------|
| Business Name | Import | Initial + on-demand |
| Address | Import | Initial + on-demand |
| Hours | Import | Initial + on-demand |
| Photos | Import | Initial + on-demand |
| Reviews | Import | Daily |
| Rating | Import | Daily |

### 26.2 Facebook & Instagram APIs

| Data | Direction | Frequency |
|------|-----------|-----------|
| Page Info | Import | Initial + on-demand |
| Posts | Import | Hourly |
| Events | Import | Daily |

### 26.3 Email Service

| Feature | Specification |
|---------|---------------|
| Provider | Mailgun (confirmed) |
| Templates | HTML with personalisation |
| Tracking | Open and click tracking |
| Unsubscribe | One-click unsubscribe |
| Bounce Handling | Automatic management |

### 26.4 Maps Integration

| Feature | Specification |
|---------|---------------|
| Provider | Mapbox (confirmed) |
| Business Locations | Map markers |
| Directions | Link to navigation |
| Geocoding | Address to coordinates |
| Distance | User to business calculation |

### 26.5 SMS & WhatsApp Templates (Twilio)

Twilio is the confirmed provider for both SMS and WhatsApp messaging.

#### SMS Templates

| Template | Message |
|----------|---------|
| Verification PIN | "[Platform]: Your verification code is {pin}. Valid for 10 minutes." |
| Password Reset | "[Platform]: Reset your password: {link}. Link expires in 1 hour." |
| Critical Alert | "[Platform] ALERT: {title}. Details: {url}" |
| Warning Alert | "[Platform]: {title}. More info: {url}" |
| Event Reminder | "[Platform]: Reminder - {event} starts in 1 hour. {location}" |

#### WhatsApp Templates

WhatsApp messages use Twilio's WhatsApp Business API. Templates must be pre-approved by WhatsApp.

| Template | Message |
|----------|---------|
| Welcome | "Welcome to [Platform]! Tap here to explore local businesses: {url}" |
| Critical Alert | "[Platform] ALERT: {title}. Details: {url}" |
| Event Reminder | "Reminder: {event} starts in 1 hour at {location}. Details: {url}" |
| Deal Notification | "New deal from {business}: {deal_title}. View: {url}" |

#### Twilio Configuration

| Setting | Value |
|---------|-------|
| Provider | Twilio (confirmed) |
| SMS Rate Limit | Max 1 SMS per user per 5 minutes (except critical alerts) |
| WhatsApp Rate Limit | Max 1 message per user per 5 minutes (except critical alerts) |
| User Preference | Users choose: SMS only, WhatsApp only, or both |
| Opt-in Required | Yes — explicit opt-in for both SMS and WhatsApp |

### 26.6 Push Notifications (Firebase)

| Type | Title Template | Priority |
|------|----------------|----------|
| New message | "New message from {business}" | High |
| Review response | "{business} responded to your review" | Normal |
| Event reminder | "{event} starts in 1 hour" | High |
| Deal alert | "Flash deal from {business}!" | Normal |
| Critical alert | "⚠️ {alert_title}" | Critical |

### 26.7 Calendar Integration

ICS file format for calendar export:
- UID unique per event
- DTSTART/DTEND with timezone
- SUMMARY, DESCRIPTION, LOCATION
- URL to event page

### 26.8 Analytics Event Tracking (GA4)

| Event | Trigger |
|-------|---------|
| page_view | Page load |
| search | Search submitted |
| view_item | Business profile view |
| add_to_wishlist | Save business |
| sign_up | Registration complete |
| login | Login complete |
| business_contact | Phone/email/message click |
| review_submit | Review submitted |
| event_rsvp | RSVP action |
| deal_view | Deal detail view |

### 26.9 External Emergency Feeds

| System | Integration |
|--------|-------------|
| NSW Alerts | GeoRSS/CAP feed |
| Bureau of Meteorology | Severe weather XML |
| Transport NSW | Open Data API |

---

# Part 7: Technical Operations

---

## 27. Error Handling

### 27.1 API Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid data",
    "details": [
      {
        "field": "email",
        "code": "INVALID_FORMAT",
        "message": "Please enter a valid email address"
      }
    ],
    "requestId": "req_abc123xyz",
    "timestamp": "2026-01-15T10:30:00Z"
  }
}
```

### 27.2 Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Request validation failed |
| INVALID_CREDENTIALS | 401 | Login failed |
| TOKEN_EXPIRED | 401 | JWT token expired |
| TOKEN_INVALID | 401 | JWT token malformed |
| FORBIDDEN | 403 | User lacks permission |
| NOT_FOUND | 404 | Resource not found |
| ALREADY_EXISTS | 409 | Resource already exists |
| RATE_LIMITED | 429 | Too many requests |
| SERVER_ERROR | 500 | Internal server error |
| SERVICE_UNAVAILABLE | 503 | Service temporarily unavailable |

### 27.3 Validation Error Codes

| Code | Message Template |
|------|------------------|
| REQUIRED | "{field} is required" |
| INVALID_FORMAT | "Please enter a valid {field}" |
| TOO_SHORT | "{field} must be at least {min} characters" |
| TOO_LONG | "{field} must be no more than {max} characters" |
| WEAK_PASSWORD | "Password must be 8+ characters and contain an uppercase letter and a number" |
| PASSWORDS_MISMATCH | "Passwords do not match" |
| INVALID_FILE_TYPE | "File type not allowed. Accepted: {types}" |
| FILE_TOO_LARGE | "File exceeds maximum size of {max}MB" |

### 27.4 User-Facing Error Messages

| Scenario | Message |
|----------|---------|
| Invalid login | "Invalid email or password. Please try again." |
| Account locked | "Your account has been temporarily locked. Please try again in 15 minutes." |
| Email not verified | "Please verify your email address to continue." |
| Account suspended | "Your account has been suspended. Please contact support." |
| Session expired | "Your session has expired. Please log in again." |
| Rate limited | "You're doing that too often. Please wait a few minutes." |

### 27.5 Graceful Degradation

| Feature | Fallback |
|---------|----------|
| Search (ES down) | PostgreSQL full-text search |
| Maps (API down) | Display address text only |
| Translation (API down) | Show original with "Translation unavailable" |
| Image upload (storage unavailable) | Queue uploads, show "Processing" |
| Social feed (API down) | Show cached content |

---

## 28. Data Management

### 28.1 Backup & Recovery

| Backup Type | Frequency | Retention |
|-------------|-----------|-----------|
| Full database | Daily (2 AM AEST) | 30 days |
| Transaction logs | Continuous | 7 days |
| Media files | Real-time replication | Indefinite |
| Configuration | On change | 90 days |

### 28.2 Recovery Targets

| Scenario | RTO | RPO |
|----------|-----|-----|
| Accidental deletion | 1 hour | 0 |
| Database corruption | 4 hours | 24 hours |
| Complete data loss | 8 hours | 24 hours |

### 28.3 User Data Export

Users can export all their data in JSON format:
- Profile information
- Activity (reviews, RSVPs, saved items)
- Messages
- Notification history
- Account information

Export process:
1. Request from Settings > Privacy
2. Email confirmation required
3. Generation (up to 24 hours)
4. Secure download link (valid 7 days)

### 28.4 Business Data Export

Business owners can export:
- Profile data (JSON)
- Analytics (CSV)
- Reviews received (CSV)
- Messages/enquiries (CSV)
- Deals performance (CSV)

### 28.5 Archival Strategy

| Content | Archive Trigger | Duration | Then |
|---------|-----------------|----------|------|
| Past events | End date + 7 days | 2 years | Delete |
| Expired deals | Expiry + 30 days | 1 year | Delete |
| Archived conversations | 90 days inactive | 2 years | Delete |
| Closed businesses | Marked closed | 1 year | Delete |
| Deleted users | Grace period end | Immediate | Anonymise |

---

## 29. Technical Operations

### 29.1 Logging Strategy

#### Log Levels

| Level | Use Case |
|-------|----------|
| ERROR | System failures requiring attention |
| WARN | Potential issues, degraded service |
| INFO | Normal operations, audit trail |
| DEBUG | Development troubleshooting |

#### What to Log

| Category | Retention |
|----------|-----------|
| Authentication | 90 days |
| API requests | 7 days |
| Errors | 1 year |
| Admin actions | 7 years |
| Security events | 7 years |

### 29.2 Monitoring & Alerting

| Metric | Warning | Critical |
|--------|---------|----------|
| Uptime | < 99.9% (24hr) | < 99% (1hr) |
| API p95 latency | > 500ms | > 2000ms |
| Error rate | > 1% | > 5% |
| Database connections | > 70% | > 90% |
| Memory usage | > 70% | > 90% |
| CPU usage | > 70% | > 90% |

### 29.3 Incident Response

| Severity | Definition | Response |
|----------|------------|----------|
| P1 - Critical | Platform down, data breach | All hands, immediate |
| P2 - High | Major feature broken | On-call + backup |
| P3 - Medium | Degraded service | On-call, business hours |
| P4 - Low | Minor issue | Next sprint |

### 29.4 Deployment Strategy

| Type | Use Case | Rollback Time |
|------|----------|---------------|
| Standard | Normal releases | < 5 minutes |
| Hotfix | Critical bug fixes | < 5 minutes |
| Database migration | Schema changes | 15-30 minutes |

#### Deployment Windows

| Type | Window |
|------|--------|
| Standard | Weekdays 10am-4pm AEST |
| Hotfixes | Anytime with approval |
| Migrations | Low-traffic (2-5am AEST) |

### 29.5 Database Maintenance

| Task | Frequency |
|------|-----------|
| VACUUM ANALYZE | Daily |
| Index maintenance | Weekly |
| Statistics update | Daily |
| Session cleanup | Daily |

---

## 30. Testing & Quality Requirements

### 30.1 Accessibility Testing

| Screen Reader | Browser | OS |
|---------------|---------|-----|
| NVDA | Chrome, Firefox | Windows |
| JAWS | Chrome, Edge | Windows |
| VoiceOver | Safari | macOS, iOS |
| TalkBack | Chrome | Android |

### 30.2 Browser Testing Matrix

| Browser | Versions |
|---------|----------|
| Chrome | Latest, Latest-1 |
| Firefox | Latest, Latest-1 |
| Safari | Latest, Latest-1 |
| Edge | Latest, Latest-1 |
| Chrome Mobile | Latest, Latest-1 |
| Safari Mobile | Latest, Latest-1 |

### 30.3 Device Testing

| Device | Screen Size |
|--------|-------------|
| iPhone 12/13/14 | 390px |
| iPhone SE | 375px |
| Samsung Galaxy S21+ | 384px |
| iPad | 768px |
| Pixel 6 | 393px |

### 30.4 Load Testing

| Scenario | Users | Duration | Pass Criteria |
|----------|-------|----------|---------------|
| Normal load | 100 | 30 min | p95 < 200ms, 0% errors |
| Peak load | 500 | 15 min | p95 < 500ms, < 0.1% errors |
| Stress test | 1000 | 10 min | No crashes |
| Spike test | 0→500→0 | 5 min | Recovery < 2 min |
| Endurance | 200 | 4 hours | No memory leaks |

### 30.5 Security Testing

| Tool | Purpose | Frequency |
|------|---------|-----------|
| OWASP ZAP | Dynamic security testing | Weekly |
| Snyk | Dependency scanning | Every build |
| SonarQube | Static code analysis | Every PR |

| Testing Type | Frequency |
|--------------|-----------|
| Automated scan | Weekly |
| Manual pen test | Quarterly |
| Red team exercise | Annually |

### 30.6 Test Coverage

| Test Type | Target |
|-----------|--------|
| Unit tests | > 80% coverage |
| Integration tests | All API endpoints |
| E2E tests | All critical journeys |
| Accessibility | All pages/components |

---

## 31. Operational Procedures

### 31.1 Support Workflow

| Channel | Response Time |
|---------|---------------|
| Email | 24 hours |
| In-app help | 24 hours |
| FAQ | Self-service |

### 31.2 SLA Definitions

| Metric | Target |
|--------|--------|
| Monthly uptime | 99.9% |
| Scheduled maintenance | Max 4 hours/month |
| API response (p95) | < 200ms |
| Page load | < 3s |

### 31.3 Support SLAs

| Priority | First Response | Resolution |
|----------|----------------|------------|
| Critical | 1 hour | 4 hours |
| High | 4 hours | 24 hours |
| Medium | 24 hours | 72 hours |
| Low | 48 hours | 1 week |

### 31.4 On-Call Rotation

| Role | Rotation | Responsibility |
|------|----------|----------------|
| Primary | Weekly | First responder |
| Secondary | Weekly | Backup |
| Incident Commander | As needed | Major incidents |

### 31.5 Cost Monitoring

| Service | Warning | Critical |
|---------|---------|----------|
| Cloud compute | 80% | 100% |
| Database | 80% | 100% |
| Storage | 80% | 95% |
| API calls | 75% | 90% |
| Email sends | 75% | 90% |
| SMS sends | 75% | 90% |

---

# Part 8: Appendices

---

## Appendix A: Data Models

This appendix contains all data models for the Community Hub platform.

### A.1 Business

```
Business {
  id: UUID
  name: String
  slug: String
  description: Text (multilingual)
  category_primary: Reference (Category)
  categories_secondary: [Reference (Category)]
  address: Address
  phone: String
  email: String
  website: URL
  hours: OperatingHours
  logo: Image
  cover_photo: Image
  gallery: [Image]
  social_links: SocialLinks
  languages: [String]
  certifications: [String]
  payment_methods: [String]
  accessibility: [String]
  price_range: Enum (budget, moderate, premium, luxury)
  parking_information: String
  year_established: Integer
  status: Enum (active, pending, suspended)
  claimed: Boolean
  owner: Reference (User)
  created_at: DateTime
  updated_at: DateTime
  verified_at: DateTime
}

Address {
  street: String
  suburb: String
  state: String
  postcode: String
  country: String
  latitude: Float
  longitude: Float
}

OperatingHours {
  monday: DayHours
  tuesday: DayHours
  wednesday: DayHours
  thursday: DayHours
  friday: DayHours
  saturday: DayHours
  sunday: DayHours
  public_holidays: DayHours
  special_notes: String
}

DayHours {
  open: Time
  close: Time
  closed: Boolean
  by_appointment: Boolean
}

SocialLinks {
  facebook: URL
  instagram: URL
  twitter: URL
  linkedin: URL
  tiktok: URL
  youtube: URL
}
```

### A.2 User

```
User {
  id: UUID
  email: String
  password_hash: String
  display_name: String
  profile_photo: Image
  language_preference: String
  suburb: String
  bio: Text (max 500)
  interests: [String]
  notification_preferences: NotificationPrefs
  role: Enum (community, business_owner, moderator, admin)
  status: Enum (active, suspended, pending)
  email_verified: Boolean
  created_at: DateTime
  updated_at: DateTime
  last_login: DateTime
}

NotificationPrefs {
  email_digest: Enum (none, daily, weekly)
  push_enabled: Boolean
  sms_enabled: Boolean
  deal_alerts: Boolean
  event_reminders: Boolean
  business_updates: Boolean
  emergency_alerts: Enum (all, critical_only, none)
}
```

### A.3 Event

```
Event {
  id: UUID
  title: String
  description: Text (multilingual)
  category: Reference (Category)
  start_time: DateTime
  end_time: DateTime
  location_type: Enum (physical, online, hybrid)
  venue: Address
  online_url: URL
  linked_business: Reference (Business)
  image: Image
  ticket_url: URL
  cost: String
  capacity: Integer
  age_restriction: String
  accessibility: [String]
  recurrence: RecurrenceRule
  created_by: Reference (User)
  status: Enum (pending, active, cancelled, past)
  created_at: DateTime
  updated_at: DateTime
}

RecurrenceRule {
  frequency: Enum (none, daily, weekly, monthly, yearly)
  interval: Integer
  days_of_week: [Integer]
  end_date: DateTime
  exceptions: [DateTime]
}
```

### A.4 Review

```
Review {
  id: UUID
  business_id: Reference (Business)
  user_id: Reference (User)
  rating: Integer (1-5)
  title: String (optional, max 100)
  content: Text (50-1000 chars)
  language: String (detected)
  photos: [ReviewPhoto]
  helpful_count: Integer (default 0)
  status: Enum (pending, published, hidden, deleted)
  moderation_notes: Text (admin only)
  business_response: Text (max 500)
  business_response_at: DateTime
  created_at: DateTime
  updated_at: DateTime
  published_at: DateTime
}

ReviewPhoto {
  id: UUID
  review_id: Reference (Review)
  url: String
  alt_text: String (max 200)
  order: Integer
  created_at: DateTime
}

ReviewHelpful {
  id: UUID
  review_id: Reference (Review)
  user_id: Reference (User)
  created_at: DateTime
}
```

### A.5 Message & Conversation

```
Conversation {
  id: UUID
  business_id: Reference (Business)
  user_id: Reference (User)
  subject: String
  subject_category: Enum (general, product_question, booking, feedback, other)
  status: Enum (active, archived, blocked)
  last_message_at: DateTime
  unread_count_business: Integer
  unread_count_user: Integer
  created_at: DateTime
}

Message {
  id: UUID
  conversation_id: UUID
  sender_type: Enum (user, business)
  sender_id: UUID
  content: Text
  attachments: [Image]
  read_at: DateTime
  created_at: DateTime
}
```

### A.6 Deal

```
Deal {
  id: UUID
  business_id: Reference (Business)
  title: String
  description: Text (multilingual)
  deal_type: Enum (standard, flash, recurring)
  discount_type: Enum (percentage, fixed, bogo, free_item)
  discount_value: Number
  category: Reference (Category)
  valid_from: DateTime
  valid_until: DateTime
  redemption_method: Enum (show_screen, unique_code, qr_code, none)
  redemption_limit: Integer
  redemption_count: Integer
  target_audience: Enum (all, followers, new_customers)
  terms_conditions: Text
  image: Image
  featured: Boolean
  status: Enum (active, pending, expired, cancelled)
  views: Integer
  saves: Integer
  created_at: DateTime
  updated_at: DateTime
}

DealRedemption {
  id: UUID
  deal_id: Reference (Deal)
  user_id: Reference (User)
  redemption_code: String
  redeemed_at: DateTime
}

SavedDeal {
  id: UUID
  deal_id: Reference (Deal)
  user_id: Reference (User)
  created_at: DateTime
}
```

### A.7 Business Networking (B2B)

```
BusinessConnection {
  id: UUID
  requester_business_id: Reference (Business)
  recipient_business_id: Reference (Business)
  status: Enum (pending, accepted, declined, blocked)
  message: Text
  connected_at: DateTime
  created_at: DateTime
}

BusinessNetworkProfile {
  id: UUID
  business_id: Reference (Business)
  open_to_networking: Boolean
  looking_for: [Enum] (partnerships, suppliers, cross_promotion, referrals, mentorship)
  can_offer: [Enum] (partnerships, suppliers, cross_promotion, referrals, mentorship)
  business_size: Enum (solo, small_2_5, medium_6_20, large_20_plus)
  years_in_area: Integer
  industry_connections: [String]
  created_at: DateTime
  updated_at: DateTime
}

Referral {
  id: UUID
  referrer_business_id: Reference (Business)
  referred_business_id: Reference (Business)
  referral_code: String (unique)
  status: Enum (active, converted, expired)
  clicks: Integer
  conversions: Integer
  notes: Text (optional)
  created_at: DateTime
  expires_at: DateTime
}

ReferralClick {
  id: UUID
  referral_id: Reference (Referral)
  ip_address: String
  user_agent: String
  converted: Boolean
  created_at: DateTime
}
```

### A.8 B2B Forum

```
ForumTopic {
  id: UUID
  business_id: Reference (Business)
  category: Enum (general, suppliers, marketing, operations, local_issues)
  type: Enum (question, discussion, recommendation, announcement)
  title: String (max 200)
  content: Text (max 5000)
  pinned: Boolean
  locked: Boolean
  views: Integer
  reply_count: Integer
  last_reply_at: DateTime
  status: Enum (active, hidden, deleted)
  created_at: DateTime
  updated_at: DateTime
}

ForumReply {
  id: UUID
  topic_id: Reference (ForumTopic)
  business_id: Reference (Business)
  parent_reply_id: Reference (ForumReply, optional for threading)
  content: Text (max 2000)
  upvotes: Integer
  status: Enum (active, hidden, deleted)
  created_at: DateTime
  updated_at: DateTime
}

ForumUpvote {
  id: UUID
  reply_id: Reference (ForumReply)
  business_id: Reference (Business)
  created_at: DateTime
}
```

### A.9 Alert & Emergency

```
Alert {
  id: UUID
  level: Enum (critical, warning, advisory, information)
  title: String
  summary: String (max 280 chars)
  full_details: Text
  affected_areas: [String]
  start_time: DateTime
  expected_end: DateTime
  source: String
  source_type: Enum (admin, council, government, chamber, business)
  external_links: [URL]
  map_polygon: GeoJSON
  status: Enum (active, resolved, cancelled)
  parent_alert_id: UUID (for updates)
  views: Integer
  created_by: Reference (User)
  created_at: DateTime
  updated_at: DateTime
  resolved_at: DateTime
}

BusinessEmergencyStatus {
  id: UUID
  business_id: Reference (Business)
  status: Enum (normal, modified_hours, limited_services, temporarily_closed, closed_indefinitely)
  message: String (max 280 chars)
  modified_hours: OperatingHours
  expected_reopening: DateTime
  related_alert_id: Reference (Alert)
  created_at: DateTime
  updated_at: DateTime
}

AlertCheckIn {
  id: UUID
  alert_id: Reference (Alert)
  user_id: Reference (User)
  status: Enum (safe, need_help, affected)
  message: Text (optional)
  created_at: DateTime
}
```

### A.10 Notice (Noticeboard)

```
Notice {
  id: UUID
  user_id: Reference (User)
  type: Enum (lost_found, for_sale, free_items, wanted, recommendation, general)
  title: String (max 100)
  description: Text (max 1000)
  image_url: String (optional)
  contact_method: Enum (phone, email, message)
  contact_value: String
  suburb: String
  status: Enum (pending, active, expired, removed)
  moderation_notes: Text (admin only)
  expires_at: DateTime
  created_at: DateTime
  updated_at: DateTime
}
```

### A.11 Community Group

```
CommunityGroup {
  id: UUID
  name: String (max 100)
  description: Text (max 2000)
  category: Enum (hobby, parent, cultural, sports, volunteer, other)
  meeting_schedule: String (max 500)
  location: String (max 200)
  contact_name: String (max 100)
  contact_email: String
  contact_phone: String
  website_url: String (optional)
  social_links: JSON
  how_to_join: Text (max 500)
  image_url: String (optional)
  status: Enum (active, inactive)
  created_by: Reference (User)
  created_at: DateTime
  updated_at: DateTime
}
```

### A.12 Announcement

```
Announcement {
  id: UUID
  source: Enum (council, chamber, platform, community)
  title: String (max 200)
  summary: Text (max 500)
  content: Text (max 5000)
  image_url: String (optional)
  external_link: String (optional)
  pinned: Boolean (default false)
  published: Boolean
  published_at: DateTime
  expires_at: DateTime (optional)
  created_by: Reference (User)
  created_at: DateTime
  updated_at: DateTime
}
```

### A.13 Historical Content

```
HistoricalContent {
  id: UUID
  type: Enum (photo, story, heritage_site, oral_history, timeline_event)
  title: String (max 200)
  description: Text (max 5000)
  date_period: String (e.g., "1920s", "1945", "Early 20th Century")
  location: String (optional)
  media_urls: [String]
  attribution: String (required)
  source: String
  permission_confirmed: Boolean
  permission_details: Text
  status: Enum (pending, published, rejected)
  moderation_notes: Text
  submitted_by: Reference (User)
  reviewed_by: Reference (User)
  created_at: DateTime
  published_at: DateTime
}
```

### A.14 Category

```
Category {
  id: UUID
  type: Enum (business, event, deal, notice, group)
  name: JSON (multilingual: { "en": "Restaurants", "ar": "مطاعم" })
  slug: String (URL-safe)
  icon: String (icon name or URL)
  parent_id: Reference (Category, optional)
  display_order: Integer
  active: Boolean
  created_at: DateTime
  updated_at: DateTime
}
```

### A.15 RSVP

```
RSVP {
  id: UUID
  event_id: Reference (Event)
  user_id: Reference (User)
  status: Enum (going, interested, not_going)
  guests: Integer (default 1)
  notes: Text (max 500, optional)
  reminder_sent: Boolean
  created_at: DateTime
  updated_at: DateTime
}
```

### A.16 Saved Business

```
SavedBusiness {
  id: UUID
  user_id: Reference (User)
  business_id: Reference (Business)
  list_id: Reference (SavedList, optional)
  notes: Text (max 500, optional)
  created_at: DateTime
}

SavedList {
  id: UUID
  user_id: Reference (User)
  name: String (max 50)
  is_default: Boolean
  created_at: DateTime
  updated_at: DateTime
}
```

### A.17 User Session

```
UserSession {
  id: UUID
  user_id: Reference (User)
  token_hash: String
  device_info: JSON {
    user_agent: String,
    device_type: Enum (mobile, tablet, desktop),
    os: String,
    browser: String
  }
  ip_address: String
  location: String (city/country from IP)
  is_current: Boolean
  last_active_at: DateTime
  expires_at: DateTime
  created_at: DateTime
}
```

### A.18 Audit Log

```
AuditLog {
  id: UUID
  actor_id: Reference (User)
  actor_role: Enum (user, business_owner, moderator, admin, system)
  action: String (e.g., "review.delete", "business.suspend", "user.ban")
  target_type: String (e.g., "Review", "Business", "User")
  target_id: UUID
  previous_value: JSON
  new_value: JSON
  reason: Text (optional)
  ip_address: String
  user_agent: String
  created_at: DateTime
}
```

### A.19 Email Template

```
EmailTemplate {
  id: UUID
  template_key: String (unique, e.g., "welcome", "password_reset")
  name: String
  description: Text
  subject: JSON (multilingual)
  body_html: JSON (multilingual)
  body_text: JSON (multilingual)
  variables: JSON (list of available variables)
  active: Boolean
  created_at: DateTime
  updated_at: DateTime
}
```

### A.20 Survey

```
Survey {
  id: UUID
  title: JSON (multilingual)
  description: JSON (multilingual)
  questions: [SurveyQuestion]
  status: Enum (draft, active, closed)
  anonymous: Boolean
  target_audience: Enum (all, residents, business_owners)
  start_date: DateTime
  end_date: DateTime
  created_by: Reference (User)
  created_at: DateTime
  updated_at: DateTime
}

SurveyQuestion {
  id: UUID
  survey_id: Reference (Survey)
  type: Enum (multiple_choice, checkbox, rating, text, scale)
  question: JSON (multilingual)
  options: JSON (for choice questions)
  required: Boolean
  order: Integer
  branching_logic: JSON (optional)
}

SurveyResponse {
  id: UUID
  survey_id: Reference (Survey)
  user_id: Reference (User, optional if anonymous)
  answers: JSON
  completed: Boolean
  started_at: DateTime
  completed_at: DateTime
}
```

### A.21 Notification

```
Notification {
  id: UUID
  user_id: Reference (User)
  type: Enum (business_update, event_reminder, new_message, deal_alert, review_response, system)
  title: String
  body: Text
  data: JSON (context-specific payload)
  read: Boolean
  read_at: DateTime
  action_url: String
  created_at: DateTime
}
```

### A.22 Moderation

```
ModerationReport {
  id: UUID
  reporter_id: Reference (User)
  content_type: Enum (review, notice, message, business, event)
  content_id: UUID
  reason: Enum (spam, inappropriate, fake, harassment, other)
  details: Text (max 500)
  status: Enum (pending, reviewed, actioned, dismissed)
  moderator_id: Reference (User)
  moderator_notes: Text
  action_taken: Enum (none, warning, content_removed, user_suspended)
  created_at: DateTime
  reviewed_at: DateTime
}

Appeal {
  id: UUID
  user_id: Reference (User)
  content_type: String
  content_id: UUID
  original_action: String
  reason: Text (max 1000)
  supporting_evidence: [String] (file URLs)
  status: Enum (pending, upheld, rejected)
  reviewer_id: Reference (User)
  reviewer_notes: Text
  created_at: DateTime
  reviewed_at: DateTime
}
```

### A.23 Business Follow

```
BusinessFollow {
  id: UUID
  user_id: Reference (User)
  business_id: Reference (Business)
  created_at: DateTime
}
```

Unique constraint: `(user_id, business_id)`

### A.24 System Settings

```
SystemSetting {
  key: String (primary key)
  value: JSON
  description: String
  updated_by: Reference (User)
  updated_at: DateTime
}
```

Default keys: `maintenance_mode`, `registration_enabled`, `max_upload_size_mb`, `featured_businesses`, `default_search_radius_km`, `max_active_deals_per_business`

---

## Appendix B: API Endpoints

This appendix contains all API endpoints for the Community Hub platform.

### B.0 API Conventions

#### API Versioning

All endpoints are prefixed with `/api/v1/`. Future breaking changes will introduce `/api/v2/` while maintaining the previous version during a deprecation period.

```
Base URL: https://{domain}/api/v1
Example:  https://{domain}/api/v1/businesses
```

#### Success Response Format

```json
{
  "success": true,
  "data": { ... }
}
```

For list endpoints:

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8
  }
}
```

#### Pagination

All list endpoints support cursor-based or offset pagination via query parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number (1-indexed) |
| `limit` | integer | 20 | Items per page (max 100) |

Response includes a `pagination` object with `page`, `limit`, `total`, and `totalPages`.

#### Common Query Parameters

| Parameter | Type | Applies To | Description |
|-----------|------|------------|-------------|
| `q` | string | Search endpoints | Search query string |
| `sort` | string | List endpoints | Sort field (prefix with `-` for descending, e.g., `-created_at`) |
| `fields` | string | All endpoints | Comma-separated list of fields to include (sparse fieldsets) |

#### Filtering

List endpoints support filtering via query parameters matching field names:

```
GET /api/v1/businesses?category=restaurant&open_now=true&rating_min=4
GET /api/v1/events?date_from=2026-03-01&date_to=2026-03-31&category=music
GET /api/v1/deals?discount_type=percentage&category=food&expiring_soon=true
```

#### CORS Configuration

The API supports cross-origin requests from configured frontend domains:

| Header | Value |
|--------|-------|
| `Access-Control-Allow-Origin` | Configured frontend domain(s) |
| `Access-Control-Allow-Methods` | `GET, POST, PUT, DELETE, OPTIONS` |
| `Access-Control-Allow-Headers` | `Content-Type, Authorization` |
| `Access-Control-Allow-Credentials` | `true` |

### B.1 Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /auth/register | Register new user | Public |
| POST | /auth/login | User login | Public |
| POST | /auth/logout | User logout | User |
| POST | /auth/forgot-password | Request password reset | Public |
| POST | /auth/reset-password | Reset password | Public |
| POST | /auth/verify-email | Verify email address | Public |
| POST | /auth/resend-verification | Resend verification email | Public |
| GET | /auth/me | Get current user | User |
| POST | /auth/refresh | Refresh JWT token | User |

### B.2 Businesses

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /businesses | List businesses | Public |
| GET | /businesses/:id | Get business details | Public |
| POST | /businesses | Create business (admin) | Admin |
| PUT | /businesses/:id | Update business | Owner |
| DELETE | /businesses/:id | Delete business (admin) | Admin |
| POST | /businesses/:id/claim | Claim business | User |
| GET | /businesses/:id/analytics | Get business analytics | Owner |
| GET | /businesses/:id/reviews | List reviews for business | Public |
| GET | /businesses/:id/events | List events for business | Public |
| GET | /businesses/:id/deals | Get deals for business | Public |
| GET | /businesses/:id/inbox | Get business inbox | Owner |
| GET | /businesses/:id/inbox/analytics | Get messaging analytics | Owner |
| GET | /businesses/:id/emergency-status | Get emergency status | Public |
| PUT | /businesses/:id/emergency-status | Update emergency status | Owner |
| POST | /businesses/:id/follow | Follow business | User |
| DELETE | /businesses/:id/follow | Unfollow business | User |

### B.3 Events

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /events | List events | Public |
| GET | /events/:id | Get event details | Public |
| POST | /events | Create event | User |
| PUT | /events/:id | Update event | Owner |
| DELETE | /events/:id | Delete event | Owner |
| POST | /events/:id/rsvp | RSVP to event | User |
| DELETE | /events/:id/rsvp | Cancel RSVP | User |
| GET | /events/:id/attendees | List attendees | Owner |
| GET | /events/:id/export | Export event to ICS | Public |

### B.4 Users

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /users/:id | Get user profile | User |
| PUT | /users/:id | Update user profile | User |
| DELETE | /users/:id | Delete account | User |
| GET | /users/:id/saved | Get saved businesses | User |
| POST | /users/:id/saved | Save business | User |
| DELETE | /users/:id/saved/:businessId | Remove saved business | User |
| GET | /users/:id/saved-deals | Get saved deals | User |
| GET | /users/:id/events | Get user's RSVPs | User |
| GET | /users/:id/reviews | Get user's reviews | User |
| PUT | /users/:id/alert-preferences | Update alert preferences | User |
| GET | /users/:id/sessions | List active sessions | User |
| DELETE | /users/:id/sessions/:sessionId | Revoke session | User |
| POST | /users/:id/export-request | Request data export | User |
| GET | /users/:id/export-status | Check export status | User |
| GET | /users/:id/export-download | Download export file | User |

### B.5 Search

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /search/businesses | Search businesses | Public |
| GET | /search/events | Search events | Public |
| GET | /search/suggestions | Get autocomplete suggestions | Public |
| GET | /search/all | Combined search | Public |

### B.6 Messages

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /conversations | List user's conversations | User |
| GET | /conversations/:id | Get conversation with messages | User |
| POST | /conversations | Start new conversation | User |
| POST | /conversations/:id/messages | Send message in conversation | User |
| PUT | /conversations/:id/read | Mark conversation as read | User |
| PUT | /conversations/:id/archive | Archive conversation | User |
| POST | /conversations/:id/block | Block user from conversation | User |

### B.7 Reviews

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /reviews/:id | Get single review | Public |
| POST | /businesses/:id/reviews | Create a review | User |
| PUT | /reviews/:id | Update own review (within 7 days) | User |
| DELETE | /reviews/:id | Delete own review | User |
| POST | /reviews/:id/helpful | Mark review as helpful | User |
| DELETE | /reviews/:id/helpful | Remove helpful mark | User |
| POST | /reviews/:id/report | Report review | User |
| POST | /reviews/:id/respond | Business owner response | Owner |

### B.8 Deals

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /deals | List all active deals | Public |
| GET | /deals/featured | Get featured/today's deals | Public |
| GET | /deals/flash | Get active flash deals | Public |
| GET | /deals/:id | Get deal details | Public |
| POST | /deals | Create deal | Owner |
| PUT | /deals/:id | Update deal | Owner |
| DELETE | /deals/:id | Cancel deal | Owner |
| POST | /deals/:id/save | Save deal to user's list | User |
| DELETE | /deals/:id/save | Remove deal from saved | User |
| POST | /deals/:id/redeem | Record deal redemption | User |
| GET | /deals/:id/analytics | Get deal performance | Owner |

### B.9 Business Networking (B2B)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /b2b/directory | List businesses open to networking | Owner |
| GET | /b2b/profile/:businessId | Get B2B network profile | Owner |
| PUT | /b2b/profile/:businessId | Update B2B network profile | Owner |
| GET | /b2b/connections | List business connections | Owner |
| POST | /b2b/connections | Send connection request | Owner |
| PUT | /b2b/connections/:id | Accept/decline connection | Owner |
| DELETE | /b2b/connections/:id | Remove connection | Owner |
| GET | /b2b/messages | Get B2B inbox | Owner |
| POST | /b2b/messages | Send B2B message | Owner |
| GET | /b2b/forum | List forum topics | Owner |
| GET | /b2b/forum/:topicId | Get forum topic with replies | Owner |
| POST | /b2b/forum | Create forum topic | Owner |
| POST | /b2b/forum/:topicId/replies | Reply to forum topic | Owner |
| POST | /b2b/forum/:replyId/upvote | Upvote forum reply | Owner |
| GET | /b2b/events | List B2B events | Owner |
| POST | /b2b/referrals | Create referral tracking link | Owner |
| GET | /b2b/referrals | Get referral statistics | Owner |

### B.10 Alerts

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /alerts | List active alerts | Public |
| GET | /alerts/active | Get currently active alerts by severity | Public |
| GET | /alerts/:id | Get alert details | Public |
| POST | /alerts | Create alert | Admin |
| PUT | /alerts/:id | Update alert | Admin |
| POST | /alerts/:id/resolve | Mark alert as resolved | Admin |
| GET | /alerts/history | Get past alerts | Public |
| POST | /alerts/:id/check-in | User safety check-in | User |

### B.11 Notifications

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /notifications | List user's notifications | User |
| GET | /notifications/unread-count | Get unread count | User |
| PUT | /notifications/:id/read | Mark notification as read | User |
| PUT | /notifications/read-all | Mark all as read | User |
| DELETE | /notifications/:id | Delete notification | User |

### B.12 Noticeboard

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /notices | List active notices | Public |
| GET | /notices/:id | Get single notice | Public |
| POST | /notices | Create notice (pending approval) | User |
| PUT | /notices/:id | Update own notice | User |
| DELETE | /notices/:id | Delete own notice | User |
| POST | /notices/:id/report | Report notice | User |

### B.13 Community Groups

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /groups | List community groups | Public |
| GET | /groups/:id | Get group details | Public |
| POST | /groups | Submit new group (pending approval) | User |
| PUT | /groups/:id | Update group | Admin |

### B.14 Local History

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /history | List historical content | Public |
| GET | /history/:id | Get single item | Public |
| POST | /history | Submit historical content | User |
| PUT | /history/:id | Update (admin) | Admin |
| DELETE | /history/:id | Delete (admin) | Admin |

### B.15 Announcements

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /announcements | List announcements | Public |
| GET | /announcements/:id | Get single announcement | Public |
| POST | /announcements | Create announcement | Admin |
| PUT | /announcements/:id | Update announcement | Admin |
| DELETE | /announcements/:id | Delete announcement | Admin |

### B.16 Categories

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /categories | List all categories | Public |
| GET | /categories/:type | List categories by type | Public |
| POST | /categories | Create category | Admin |
| PUT | /categories/:id | Update category | Admin |
| DELETE | /categories/:id | Delete category | Admin |

### B.17 Languages & Translations

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /languages | List supported languages | Public |
| GET | /translations/:lang | Get translations for language | Public |
| POST | /translate | Request on-demand translation | User |

### B.18 File Uploads

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /upload/image | Upload image (returns URL) | User |
| POST | /upload/document | Upload document (PDF) | User |
| DELETE | /upload/:id | Delete uploaded file | User |

### B.19 Surveys

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /surveys | List available surveys | User |
| GET | /surveys/:id | Get survey details | User |
| POST | /surveys/:id/responses | Submit survey response | User |
| GET | /admin/surveys | List all surveys | Admin |
| POST | /admin/surveys | Create survey | Admin |
| PUT | /admin/surveys/:id | Update survey | Admin |
| GET | /admin/surveys/:id/results | Get survey results | Admin |

### B.20 Admin Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /admin/dashboard | Dashboard stats | Admin |
| GET | /admin/users | List all users | Admin |
| GET | /admin/users/:id | Get user details | Admin |
| PUT | /admin/users/:id/role | Change user role | Admin |
| PUT | /admin/users/:id/suspend | Suspend user | Admin |
| PUT | /admin/users/:id/unsuspend | Unsuspend user | Admin |
| GET | /admin/businesses | List all businesses | Admin |
| PUT | /admin/businesses/:id/verify | Verify business | Admin |
| PUT | /admin/businesses/:id/suspend | Suspend business | Admin |
| GET | /admin/moderation-queue | Get pending content | Moderator |
| POST | /admin/moderation/:type/:id/approve | Approve content | Moderator |
| POST | /admin/moderation/:type/:id/reject | Reject content | Moderator |
| GET | /admin/audit-log | Get audit log | Admin |
| GET | /admin/analytics | Platform analytics | Admin |
| POST | /admin/reports/generate | Generate report | Admin |
| GET | /admin/reports | List generated reports | Admin |
| GET | /admin/reports/:id/download | Download report | Admin |

### B.21 Calendar Integration

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /calendar/feed/:userId.ics | User's calendar subscription feed | Token |
| GET | /calendar/event/:eventId.ics | Single event ICS export | Public |

### B.22 Health & Status

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /health | API health check | Public |
| GET | /status | Service status | Public |

---

## Appendix C: Glossary

| Term | Definition |
|------|------------|
| APP | Australian Privacy Principles - the cornerstone of privacy protection in Australia |
| B2B | Business-to-Business - features for business owners to network with each other |
| bcrypt | Password hashing algorithm used for secure password storage |
| CAP | Common Alerting Protocol - standard format for emergency alerts |
| CID | Community Improvement District |
| DCIH | Digital Community Improvement Hub |
| E2E | End-to-End (testing) - tests that simulate complete user journeys |
| GA4 | Google Analytics 4 - web analytics platform |
| GeoJSON | JSON-based format for encoding geographic data structures |
| GeoRSS | RSS extension for encoding geographic information |
| GMB | Google My Business (now Google Business Profile) |
| HSTS | HTTP Strict Transport Security - security header enforcing HTTPS |
| ICS | iCalendar format - standard for calendar file exchange |
| IDOR | Insecure Direct Object Reference - security vulnerability type |
| JWT | JSON Web Token - compact, URL-safe means of representing claims |
| LTR | Left-to-Right (text direction) |
| MFA | Multi-Factor Authentication |
| OAuth | Open Authorization - standard for access delegation |
| OWASP | Open Web Application Security Project |
| p95 | 95th percentile - common performance measurement |
| PWA | Progressive Web App |
| RTO | Recovery Time Objective - target time to restore service |
| RPO | Recovery Point Objective - acceptable data loss duration |
| RSVP | Répondez s'il vous plaît (event response) |
| RTL | Right-to-Left (text direction) |
| SEO | Search Engine Optimisation |
| SLA | Service Level Agreement |
| SSE | Server-Sent Events - HTTP-based push technology |
| TLS | Transport Layer Security - cryptographic protocol |
| UUID | Universally Unique Identifier |
| WCAG | Web Content Accessibility Guidelines |
| XSS | Cross-Site Scripting - security vulnerability type |

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | January 2026 | Andrew | Initial comprehensive specification |
| 1.1 | January 2026 | Andrew | Added Messaging System, Deals Hub, B2B Networking, Emergency Communications |
| 1.2 | January 2026 | Andrew | Added Platform Configuration Architecture for multi-suburb deployment support |
| 1.3 | January 2026 | Andrew | Reorganised document structure for development workflow; made location references generic |
| 2.0 | January 2026 | Andrew | Merged main specification (v1.3) with supplement (v1.0) into single comprehensive document; added Legal & Compliance, Onboarding flows, Error handling, Data management, Content policies, Technical operations, UI components, Testing requirements, and Operational procedures |

---

*This document is the authoritative source for all Community Hub platform requirements. It supersedes all previous specification documents (v1.3 and Supplement v1.0) and should be used as the primary reference for development planning.*

---

**End of Document**

