# Community Hub Platform
## Specification Supplement Document

**Document Version:** 1.0
**Date:** January 2026
**Purpose:** Supplementary specifications addressing gaps identified in the main specification
**Reference:** Community_Hub_Platform_Specification.md v1.3

---

## Table of Contents

1. [Legal & Compliance](#1-legal--compliance)
2. [Onboarding & User Journeys](#2-onboarding--user-journeys)
3. [Error Handling & Edge Cases](#3-error-handling--edge-cases)
4. [Data Management](#4-data-management)
5. [Content Policies](#5-content-policies)
6. [Technical Operations](#6-technical-operations)
7. [Additional Data Models](#7-additional-data-models)
8. [Additional API Endpoints](#8-additional-api-endpoints)
9. [UI States & Components](#9-ui-states--components)
10. [Integration Specifications](#10-integration-specifications)
11. [Testing & Quality Requirements](#11-testing--quality-requirements)
12. [Operational Procedures](#12-operational-procedures)

---

## 1. Legal & Compliance

### 1.1 Terms of Service Outline

The Terms of Service document must include the following sections:

#### 1.1.1 Required Sections

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

#### 1.1.2 Prohibited Business Types

The following business types are not permitted on the platform:

| Category | Examples |
|----------|----------|
| Adult Services | Adult entertainment, escort services |
| Illegal Activities | Drug paraphernalia, unlicensed gambling |
| Weapons | Firearms dealers, weapon modifications |
| High-Risk Financial | Payday loans, cryptocurrency exchanges |
| Tobacco/Vaping | Tobacco shops, vape stores (unless licensed pharmacy) |
| Multi-Level Marketing | MLM schemes, pyramid businesses |

### 1.2 Privacy Policy Requirements

#### 1.2.1 Required Sections (APP Compliance)

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

#### 1.2.2 Data Retention Schedule

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

### 1.3 Cookie Consent Flow

#### 1.3.1 Cookie Banner Behaviour

| Trigger | Display |
|---------|---------|
| First visit | Banner appears at bottom of screen |
| Return visit (no consent) | Banner reappears |
| Return visit (consent given) | No banner |
| Settings change | Accessible via footer link |

#### 1.3.2 Consent Options

| Option | Description | Default |
|--------|-------------|---------|
| Essential Only | Minimum cookies for site function | N/A (always on) |
| Accept All | All cookie categories | One-click option |
| Customise | Individual category toggles | Expandable panel |

#### 1.3.3 Cookie Categories

| Category | Consent Required | If Declined |
|----------|------------------|-------------|
| Essential | No | Cannot decline |
| Functional | No | Language/preferences not persisted |
| Analytics | Yes | No usage tracking |
| Marketing | Yes | No personalised ads (not currently used) |

#### 1.3.4 Consent Storage

- Consent stored in localStorage and cookie
- Consent ID logged to database for compliance
- Consent valid for 12 months, then re-prompt
- Users can change preferences anytime via footer link

### 1.4 Content Licensing

#### 1.4.1 User-Generated Content License

When users submit content (reviews, photos, noticeboard posts), they grant:

| Right | Scope |
|-------|-------|
| License Type | Non-exclusive, worldwide, royalty-free, sublicensable |
| Permitted Uses | Display, distribute, modify (for formatting), translate |
| Duration | Perpetual for platform use; revocable by content deletion |
| Attribution | Platform may display with username or anonymously |
| Ownership | User retains ownership; platform has license only |

#### 1.4.2 Business Content License

Business owners grant similar license for:
- Business descriptions
- Photos uploaded to profile
- Promotional content
- Event descriptions

#### 1.4.3 Third-Party Content

| Source | License Requirement |
|--------|---------------------|
| Social media embeds | Displayed under platform's terms (public posts only) |
| Google Business data | Subject to Google's terms |
| Historical archive submissions | Explicit permission required, recorded |

### 1.5 Dispute Resolution Process

#### 1.5.1 Review Disputes

| Step | Process | Timeframe |
|------|---------|-----------|
| 1. Business Response | Business can respond publicly to review | Anytime |
| 2. Report Review | Business flags review with reason | Within 30 days of review |
| 3. Initial Review | Moderator reviews against content policy | 3 business days |
| 4. Decision | Remove, keep, or request edit | Communicated to both parties |
| 5. Appeal | Either party can appeal once | Within 7 days of decision |
| 6. Final Decision | Senior moderator/admin reviews | 5 business days |

#### 1.5.2 Business Claim Disputes

| Scenario | Process |
|----------|---------|
| Multiple claimants | Both must provide verification; admin decides |
| Fraudulent claim | Report mechanism; investigation; account suspension if proven |
| Former owner | Must provide proof of ownership transfer |

---

## 2. Onboarding & User Journeys

### 2.1 First-Time User Experience

#### 2.1.1 Visitor Journey (Unauthenticated)

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

#### 2.1.2 New User Onboarding Flow

| Step | Screen | Required | Content |
|------|--------|----------|---------|
| 1 | Welcome | Yes | "Welcome to [Platform Name]!" with value proposition |
| 2 | Language | Yes | Select preferred language |
| 3 | Location | Optional | Enable location for "Near Me" features |
| 4 | Interests | Optional | Select 3-5 business categories of interest |
| 5 | Notifications | Optional | Enable push notifications |
| 6 | Complete | Yes | "You're all set!" with suggested actions |

#### 2.1.3 Onboarding UI Specifications

| Element | Specification |
|---------|---------------|
| Progress indicator | Dots showing current step (e.g., ●●○○○○) |
| Skip option | "Skip" link on optional steps |
| Back navigation | Back arrow on all steps except first |
| Completion | Confetti animation, redirect to homepage |

### 2.2 Business Owner Onboarding Wizard

#### 2.2.1 Claim Flow

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

#### 2.2.2 Profile Completion Wizard

| Step | Section | Fields | Completion % |
|------|---------|--------|--------------|
| 1 | Basic Info | Name, description, category | 20% |
| 2 | Contact | Phone, email, website | 35% |
| 3 | Location | Address, map pin confirmation | 45% |
| 4 | Hours | Operating hours for each day | 55% |
| 5 | Photos | Logo + at least 3 gallery photos | 75% |
| 6 | Social | Social media links | 85% |
| 7 | Details | Languages, certifications, accessibility | 100% |

#### 2.2.3 Wizard UI Elements

| Element | Behaviour |
|---------|-----------|
| Progress bar | Visual percentage complete |
| Save & Continue | Saves progress, moves to next step |
| Save & Exit | Saves progress, returns to dashboard |
| Skip Step | Moves to next step without saving (marks incomplete) |
| Completion celebration | Animation when 100% reached |

### 2.3 Empty State Designs

#### 2.3.1 Search Results - No Results

| Element | Content |
|---------|---------|
| Illustration | Friendly illustration (magnifying glass with question mark) |
| Headline | "No businesses found" |
| Subtext | "Try adjusting your search or filters" |
| Actions | "Clear filters" button, "Browse all businesses" link |
| Suggestions | Show popular categories as chips |

#### 2.3.2 Saved Businesses - Empty

| Element | Content |
|---------|---------|
| Illustration | Heart/bookmark illustration |
| Headline | "No saved businesses yet" |
| Subtext | "Tap the heart icon on any business to save it here" |
| Action | "Explore businesses" button |

#### 2.3.3 Events Calendar - No Events

| Element | Content |
|---------|---------|
| Illustration | Calendar illustration |
| Headline | "No events on this date" |
| Subtext | "Check back soon or browse upcoming events" |
| Action | "View all events" button |

#### 2.3.4 Business Inbox - No Messages

| Element | Content |
|---------|---------|
| Illustration | Message/envelope illustration |
| Headline | "No messages yet" |
| Subtext | "When customers contact you, their messages will appear here" |
| Tip | "Tip: Complete your profile to attract more enquiries" |

#### 2.3.5 Reviews - No Reviews

| Element | Content |
|---------|---------|
| Illustration | Star illustration |
| Headline | "No reviews yet" |
| Subtext | "Be the first to share your experience!" |
| Action | "Write a review" button (if eligible) |

#### 2.3.6 Deals Hub - No Deals

| Element | Content |
|---------|---------|
| Illustration | Tag/discount illustration |
| Headline | "No deals available right now" |
| Subtext | "Check back soon for offers from local businesses" |
| Action | "Browse businesses" button |

### 2.4 QR Code Registration Flow

#### 2.4.1 QR Code Placement

| Location | Purpose |
|----------|---------|
| Business window stickers | Individual business registration |
| Event posters | Event-specific registration |
| Council publications | General platform registration |
| Partner marketing materials | Campaign-tracked registration |

#### 2.4.2 QR Code URL Structure

```
https://[platform-domain]/register?
  source=qr
  &location=[business-id|event-id|campaign-id]
  &campaign=[campaign-name]
```

#### 2.4.3 QR Registration Flow

| Step | Screen | Content |
|------|--------|---------|
| 1 | Landing | "Welcome! You're joining from [Business Name/Event]" |
| 2 | Registration | Standard registration form (pre-filled source) |
| 3 | Verification | Email verification |
| 4 | Onboarding | Abbreviated onboarding (skip interests if from specific business) |
| 5 | Redirect | If from business: redirect to that business profile |

#### 2.4.4 QR Code Analytics

Track per QR code:
- Scans (even without registration)
- Registrations completed
- Source attribution in user record

---

## 3. Error Handling & Edge Cases

### 3.1 Standardised API Error Response Format

#### 3.1.1 Error Response Schema

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

#### 3.1.2 Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `INVALID_CREDENTIALS` | 401 | Login failed |
| `TOKEN_EXPIRED` | 401 | JWT token expired |
| `TOKEN_INVALID` | 401 | JWT token malformed or invalid |
| `FORBIDDEN` | 403 | User lacks permission |
| `NOT_FOUND` | 404 | Resource not found |
| `ALREADY_EXISTS` | 409 | Resource already exists (e.g., duplicate email) |
| `RATE_LIMITED` | 429 | Too many requests |
| `SERVER_ERROR` | 500 | Internal server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

#### 3.1.3 Validation Error Codes

| Code | Field Types | Message Template |
|------|-------------|------------------|
| `REQUIRED` | All | "{field} is required" |
| `INVALID_FORMAT` | Email, phone, URL | "Please enter a valid {field}" |
| `TOO_SHORT` | Text | "{field} must be at least {min} characters" |
| `TOO_LONG` | Text | "{field} must be no more than {max} characters" |
| `INVALID_RANGE` | Numbers | "{field} must be between {min} and {max}" |
| `INVALID_OPTION` | Selects | "Please select a valid option for {field}" |
| `WEAK_PASSWORD` | Password | "Password must contain uppercase, lowercase, and number" |
| `PASSWORDS_MISMATCH` | Password confirm | "Passwords do not match" |
| `INVALID_FILE_TYPE` | File upload | "File type not allowed. Accepted: {types}" |
| `FILE_TOO_LARGE` | File upload | "File exceeds maximum size of {max}MB" |

### 3.2 User-Facing Error Messages

#### 3.2.1 Authentication Errors

| Scenario | Message |
|----------|---------|
| Invalid email/password | "Invalid email or password. Please try again." |
| Account locked | "Your account has been temporarily locked. Please try again in 15 minutes." |
| Email not verified | "Please verify your email address to continue." |
| Account suspended | "Your account has been suspended. Please contact support." |
| Session expired | "Your session has expired. Please log in again." |

#### 3.2.2 Form Validation Messages

| Scenario | Message |
|----------|---------|
| Required field empty | "This field is required" |
| Invalid email | "Please enter a valid email address" |
| Invalid phone | "Please enter a valid Australian phone number" |
| Password too weak | "Password must be at least 8 characters with one uppercase letter and one number" |
| File too large | "File is too large. Maximum size is {max}MB" |
| Invalid file type | "This file type is not supported. Please upload a JPG, PNG, or WebP image" |

#### 3.2.3 Action Errors

| Scenario | Message |
|----------|---------|
| Save failed | "Unable to save changes. Please try again." |
| Upload failed | "Upload failed. Please check your connection and try again." |
| Message send failed | "Message could not be sent. Please try again." |
| Rate limited | "You're doing that too often. Please wait a few minutes." |

### 3.3 Rate Limiting Responses

#### 3.3.1 Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1705312200
Retry-After: 60
```

#### 3.3.2 User-Facing Rate Limit Messages

| Action | Limit | Message |
|--------|-------|---------|
| Login attempts | 5 per 15 min | "Too many login attempts. Please wait 15 minutes." |
| Password reset | 3 per hour | "Too many reset requests. Please try again later." |
| New conversations | 10 per day | "You've reached the daily message limit. Try again tomorrow." |
| Review submissions | 5 per day | "You've reached the daily review limit." |
| API requests | 100 per min | "Too many requests. Please slow down." |

### 3.4 Service Unavailability

#### 3.4.1 Maintenance Mode Page

| Element | Content |
|---------|---------|
| Illustration | Tools/construction illustration |
| Headline | "We'll be right back" |
| Subtext | "We're performing scheduled maintenance to improve your experience." |
| Estimated time | "Expected completion: [time]" (if known) |
| Status link | Link to status page (if available) |
| Contact | "For urgent matters, email [support email]" |

#### 3.4.2 Graceful Degradation

| Feature | Degradation Behaviour |
|---------|----------------------|
| Search (Elasticsearch down) | Fall back to PostgreSQL full-text search |
| Maps (Google Maps down) | Display address text only, hide map |
| Translation (API down) | Show original language with "Translation unavailable" |
| Image upload (S3 down) | Queue uploads, show "Processing" status |
| Social feed (API down) | Show cached content with "Last updated: [time]" |

### 3.5 Edge Cases

#### 3.5.1 Business Edge Cases

| Scenario | Handling |
|----------|----------|
| Business moves location | Owner updates address; old saved directions invalid (notify users) |
| Business closes permanently | Owner or admin marks as "Permanently Closed"; profile visible but greyed |
| Business changes name | Update requires moderation to prevent abuse |
| Business changes ownership | New owner must re-verify; old owner access revoked |
| Duplicate business detected | Admin merge tool; redirect old URL to merged profile |

#### 3.5.2 User Edge Cases

| Scenario | Handling |
|----------|----------|
| User deletes account with reviews | Reviews anonymised ("Former User"), not deleted |
| User deletes account with active conversations | Conversations archived; business sees "[Deleted User]" |
| Email change to existing email | Reject with "This email is already registered" |
| User banned but has business | Business remains; new owner must claim |

#### 3.5.3 Content Edge Cases

| Scenario | Handling |
|----------|----------|
| Review for closed business | Allow reviews for 30 days after closure; then disable |
| Event in the past | Mark as "Past Event"; keep for history; disable RSVP |
| Expired deal | Move to "Past Deals" section; visible for 30 days |
| Orphaned photos | Photos without business association deleted after 7 days |

---

## 4. Data Management

### 4.1 Backup & Recovery

#### 4.1.1 Backup Schedule

| Backup Type | Frequency | Retention | Storage |
|-------------|-----------|-----------|---------|
| Full database | Daily (2 AM AEST) | 30 days | Encrypted S3, different region |
| Transaction logs | Continuous | 7 days | Encrypted S3 |
| Media files | Real-time replication | Indefinite | S3 cross-region |
| Configuration | On change | 90 days | Version-controlled, encrypted |

#### 4.1.2 Recovery Procedures

| Scenario | RTO | RPO | Procedure |
|----------|-----|-----|-----------|
| Accidental deletion (single record) | 1 hour | 0 | Restore from soft-delete or backup |
| Database corruption | 4 hours | 24 hours | Restore from daily backup |
| Complete data loss | 8 hours | 24 hours | Full restore from off-site backup |
| Ransomware | 12 hours | 24 hours | Restore from isolated backup |

#### 4.1.3 Backup Verification

- Weekly automated restore test to staging environment
- Monthly manual verification of backup integrity
- Quarterly disaster recovery drill

### 4.2 User Data Export (Data Portability)

#### 4.2.1 Export Contents

Users can export all their data in machine-readable format (JSON):

| Data Category | Included |
|---------------|----------|
| Profile | Name, email, photo, preferences, settings |
| Activity | Reviews written, RSVPs, saved businesses, saved deals |
| Messages | All conversations (sent and received) |
| Notifications | Notification history |
| Account | Registration date, login history, consent records |

#### 4.2.2 Export Process

| Step | Description |
|------|-------------|
| 1. Request | User requests export from Settings > Privacy > Export My Data |
| 2. Verification | Email confirmation required |
| 3. Generation | System generates export (may take up to 24 hours) |
| 4. Notification | Email sent when ready |
| 5. Download | Secure download link (valid 7 days) |
| 6. Format | ZIP file containing JSON files + media |

#### 4.2.3 Export API

```
POST /users/:id/export-request
GET /users/:id/export-status
GET /users/:id/export-download
```

### 4.3 Business Data Export

#### 4.3.1 Export Contents

Business owners can export:

| Data Category | Format |
|---------------|--------|
| Profile data | JSON |
| Analytics | CSV |
| Reviews received | CSV |
| Messages/enquiries | CSV |
| Followers list | CSV (anonymised - count only by suburb) |
| Deals performance | CSV |

#### 4.3.2 Analytics Export Fields

```csv
date,profile_views,search_appearances,website_clicks,phone_clicks,direction_requests,saves,follows
2026-01-01,150,320,45,23,67,12,5
```

### 4.4 Archival Strategy

#### 4.4.1 Archival Rules

| Content Type | Archive Trigger | Archive Duration | Then |
|--------------|-----------------|------------------|------|
| Past events | Event end date + 7 days | 2 years | Delete |
| Expired deals | Expiry + 30 days visible | 1 year archived | Delete |
| Archived conversations | 90 days inactive | 2 years | Delete |
| Closed businesses | Marked closed | 1 year | Delete or anonymise |
| Deleted users | Grace period end | Immediate anonymisation | N/A |
| Old notifications | 90 days | N/A | Delete |

#### 4.4.2 Archival Implementation

- Archived records moved to separate `_archive` tables
- Archived records excluded from search indexes
- Archived records accessible via admin for compliance
- Automated archival job runs daily at 3 AM AEST

### 4.5 Database Migration Strategy

#### 4.5.1 Migration Principles

| Principle | Implementation |
|-----------|----------------|
| Version control | All migrations in numbered sequence (001_, 002_, etc.) |
| Reversibility | Every migration has an up and down script |
| Atomicity | Migrations wrapped in transactions |
| Testing | All migrations tested in staging before production |
| Documentation | Each migration includes description and rollback notes |

#### 4.5.2 Migration Process

| Step | Action |
|------|--------|
| 1 | Create migration file with timestamp |
| 2 | Write up (apply) and down (rollback) scripts |
| 3 | Test in local development |
| 4 | Code review |
| 5 | Apply to staging, run integration tests |
| 6 | Schedule production deployment |
| 7 | Apply to production during low-traffic window |
| 8 | Verify migration success |
| 9 | Monitor for issues (rollback if critical) |

---

## 5. Content Policies

### 5.1 Review Guidelines

#### 5.1.1 Acceptable Reviews

Reviews should:

| Requirement | Description |
|-------------|-------------|
| Be based on genuine experience | Reviewer should have visited/used the business |
| Be relevant | Focus on the business, products, or services |
| Be constructive | Criticism should be specific and helpful |
| Be original | Written by the reviewer, not copied |
| Be current | Reflect recent experience (within 12 months ideal) |

#### 5.1.2 Prohibited Review Content

| Category | Examples |
|----------|----------|
| Fake reviews | Reviews from non-customers, paid reviews, self-reviews |
| Discriminatory content | Racism, sexism, religious discrimination |
| Personal attacks | Naming individual staff members negatively |
| Irrelevant content | Political opinions, complaints about other businesses |
| Promotional content | Advertising other businesses or services |
| Illegal content | Defamation, threats, incitement |
| Explicit content | Sexual content, graphic violence |
| Spam | Repetitive content, excessive links |

#### 5.1.3 Review Eligibility

| Rule | Implementation |
|------|----------------|
| Account required | Must be registered and verified |
| One review per business | Per user, can edit within 7 days |
| No self-review | Cannot review own business |
| No competitor reviews | Cannot review if own business in same category (optional flag) |

### 5.2 Photo Guidelines

#### 5.2.1 Acceptable Photos

| Requirement | Description |
|-------------|-------------|
| Relevant | Photos of the business, products, services, or experience |
| Original | Taken by the uploader or with permission |
| Appropriate | Suitable for all ages |
| Quality | Clear, properly oriented, not heavily filtered |

#### 5.2.2 Prohibited Photos

| Category | Examples |
|----------|----------|
| Copyright infringement | Stock photos, photos from other sources without permission |
| Inappropriate content | Nudity, violence, drug use |
| Irrelevant content | Photos unrelated to the business |
| Personal information | Photos showing private documents, credit cards, etc. |
| Screenshots | Screenshots of other apps, websites, maps |
| Manipulated images | Misleading edits, fake reviews in images |

### 5.3 Business Verification Criteria

#### 5.3.1 Verification Methods

| Method | Accepted Evidence | Confidence Level |
|--------|-------------------|------------------|
| Phone | Successful PIN verification to listed number | High |
| Email | Verification email to @business-domain.com | High |
| Google Business | Connected and verified GMB profile | High |
| ABN Certificate | Current ASIC registration showing business name | High |
| Utility Bill | Recent bill showing business name and address | Medium |
| Lease Agreement | Current lease showing business name | Medium |

#### 5.3.2 Verification Rejection Reasons

| Reason | Next Steps |
|--------|------------|
| Document expired | Request current document |
| Name mismatch | Request document matching claimed business |
| Address mismatch | Request proof of current address |
| Illegible document | Request clearer copy |
| Suspected fraud | Escalate to admin, possible account suspension |

### 5.4 Prohibited Content List

#### 5.4.1 Universally Prohibited

| Category | Description |
|----------|-------------|
| Illegal content | Anything violating Australian law |
| Hate speech | Content attacking protected groups |
| Harassment | Targeted abuse of individuals |
| Violence | Threats, glorification of violence |
| Child safety | Any content involving minors inappropriately |
| Self-harm | Content promoting suicide or self-injury |
| Terrorism | Extremist content, radicalisation |
| Fraud | Scams, phishing, deceptive practices |
| Malware | Links to malicious software |
| Spam | Bulk unsolicited content |

#### 5.4.2 Platform-Specific Prohibited

| Category | Description |
|----------|-------------|
| Fake businesses | Businesses that don't exist |
| Misleading claims | False advertising, fake certifications |
| Competitor attacks | Coordinated negative reviews |
| Price manipulation | Fake deals, misleading discounts |
| Personal ads | Dating, roommate, job postings (except designated areas) |

### 5.5 Appeal Process

#### 5.5.1 Appeal Eligibility

| Content Type | Appeal Window | Who Can Appeal |
|--------------|---------------|----------------|
| Removed review | 30 days | Review author |
| Removed business | 30 days | Business owner |
| Suspended account | 30 days | Account holder |
| Rejected claim | 14 days | Claimant |
| Removed noticeboard post | 14 days | Post author |

#### 5.5.2 Appeal Process

| Step | Action | Timeframe |
|------|--------|-----------|
| 1 | Submit appeal via Settings > Appeals | User action |
| 2 | Provide reason and any supporting evidence | User action |
| 3 | Acknowledgment email sent | Automatic |
| 4 | Senior moderator reviews original decision | 5 business days |
| 5 | Decision communicated via email | 5 business days |
| 6 | If upheld, content reinstated | Immediate |
| 7 | If rejected, explained with no further appeal | Final |

#### 5.5.3 Appeal Form Fields

| Field | Type | Required |
|-------|------|----------|
| Content ID | Auto-filled | Yes |
| Original decision | Display only | N/A |
| Reason for appeal | Text (1000 chars) | Yes |
| Supporting evidence | File upload (optional) | No |
| Contact preference | Email/Phone | Yes |

---

## 6. Technical Operations

### 6.1 Logging Strategy

#### 6.1.1 Log Levels

| Level | Use Case | Examples |
|-------|----------|----------|
| ERROR | System failures requiring attention | Database connection failed, payment processing error |
| WARN | Potential issues, degraded service | High memory usage, deprecated API calls |
| INFO | Normal operations, audit trail | User login, business created, settings changed |
| DEBUG | Development troubleshooting | Request/response details, query execution |

#### 6.1.2 What to Log

| Category | Log Level | Retention | Fields |
|----------|-----------|-----------|--------|
| Authentication | INFO | 90 days | user_id, action, ip_address, user_agent, success |
| API requests | DEBUG | 7 days | endpoint, method, user_id, duration_ms, status_code |
| Errors | ERROR | 1 year | error_type, message, stack_trace, request_id, user_id |
| Admin actions | INFO | 7 years | admin_id, action, target, previous_value, new_value |
| Security events | WARN/ERROR | 7 years | event_type, user_id, ip_address, details |
| Performance | DEBUG | 30 days | endpoint, duration_ms, db_queries, memory_usage |

#### 6.1.3 Sensitive Data Handling

Never log:
- Passwords (even hashed)
- Full credit card numbers
- API keys or tokens
- Personal health information
- Full message content (log message_id only)

Mask/truncate:
- Email addresses (show first 3 chars + domain)
- Phone numbers (show last 4 digits)
- IP addresses in public reports

#### 6.1.4 Log Format

```json
{
  "timestamp": "2026-01-15T10:30:00.123Z",
  "level": "INFO",
  "service": "api",
  "request_id": "req_abc123",
  "user_id": "usr_xyz789",
  "action": "user.login",
  "message": "User logged in successfully",
  "metadata": {
    "ip": "203.xxx.xxx.xxx",
    "user_agent": "Mozilla/5.0...",
    "method": "email"
  }
}
```

### 6.2 Monitoring & Alerting

#### 6.2.1 Metrics to Monitor

| Category | Metric | Warning Threshold | Critical Threshold |
|----------|--------|-------------------|-------------------|
| **Availability** | Uptime | < 99.9% (24hr) | < 99% (1hr) |
| **Performance** | API p95 latency | > 500ms | > 2000ms |
| **Performance** | Page load time | > 3s | > 5s |
| **Database** | Connection pool usage | > 70% | > 90% |
| **Database** | Query time p95 | > 100ms | > 500ms |
| **Memory** | Application memory | > 70% | > 90% |
| **CPU** | CPU usage | > 70% | > 90% |
| **Storage** | Disk usage | > 70% | > 90% |
| **Errors** | Error rate | > 1% | > 5% |
| **Security** | Failed login rate | > 10/min | > 50/min |
| **Queue** | Job queue depth | > 1000 | > 5000 |

#### 6.2.2 Alert Channels

| Severity | Channel | Response Time |
|----------|---------|---------------|
| Critical | SMS + PagerDuty + Slack | < 15 minutes |
| Warning | Email + Slack | < 1 hour |
| Info | Dashboard only | Next business day |

#### 6.2.3 Alert Escalation

| Time Since Alert | Action |
|------------------|--------|
| 0 min | Primary on-call notified |
| 15 min | Secondary on-call notified |
| 30 min | Team lead notified |
| 1 hour | Engineering manager notified |

### 6.3 Incident Response

#### 6.3.1 Severity Levels

| Severity | Definition | Examples | Response |
|----------|------------|----------|----------|
| P1 - Critical | Platform down, data breach | Complete outage, security breach | All hands, immediate |
| P2 - High | Major feature broken | Login broken, search down | On-call + backup |
| P3 - Medium | Degraded service | Slow performance, minor feature broken | On-call, business hours |
| P4 - Low | Minor issue | UI glitch, typo | Next sprint |

#### 6.3.2 Incident Response Process

| Phase | Actions |
|-------|---------|
| **Detection** | Monitoring alert or user report |
| **Triage** | Assess severity, assign responder |
| **Communication** | Update status page, notify stakeholders |
| **Investigation** | Identify root cause |
| **Mitigation** | Implement temporary fix if needed |
| **Resolution** | Deploy permanent fix |
| **Recovery** | Verify fix, monitor for recurrence |
| **Post-mortem** | Document incident, identify improvements |

#### 6.3.3 Status Page Updates

| Incident State | Status Page Message |
|----------------|---------------------|
| Investigating | "We are investigating reports of [issue]" |
| Identified | "The issue has been identified. We are working on a fix" |
| Monitoring | "A fix has been deployed. We are monitoring the situation" |
| Resolved | "The issue has been resolved" |

### 6.4 Deployment Strategy

#### 6.4.1 Deployment Types

| Type | Use Case | Rollback Time |
|------|----------|---------------|
| Standard | Normal releases | < 5 minutes |
| Hotfix | Critical bug fixes | < 5 minutes |
| Database migration | Schema changes | 15-30 minutes |
| Infrastructure | Server/config changes | Variable |

#### 6.4.2 Deployment Process

| Step | Action | Responsible |
|------|--------|-------------|
| 1 | Code merged to main | Developer |
| 2 | Automated tests pass | CI |
| 3 | Deploy to staging | CI/CD |
| 4 | QA verification | QA/Developer |
| 5 | Production deploy scheduled | DevOps |
| 6 | Deploy to production | CI/CD |
| 7 | Smoke tests | Automated |
| 8 | Monitor for 30 minutes | DevOps |

#### 6.4.3 Rollback Procedure

| Trigger | Action |
|---------|--------|
| Automated smoke test failure | Auto-rollback |
| Error rate spike (> 5%) | Auto-rollback |
| Manual trigger | DevOps initiates rollback |
| Database migration failure | Restore from backup |

#### 6.4.4 Deployment Windows

| Type | Window | Restrictions |
|------|--------|--------------|
| Standard releases | Weekdays 10am-4pm AEST | Not before public holidays |
| Hotfixes | Anytime | Approval required |
| Database migrations | Low-traffic (2-5am AEST) | Weekend preferred |
| Infrastructure | Low-traffic | Maintenance window announced |

### 6.5 Database Maintenance

#### 6.5.1 Routine Maintenance

| Task | Frequency | Window |
|------|-----------|--------|
| VACUUM ANALYZE | Daily | 3 AM AEST |
| Index maintenance | Weekly | Sunday 2 AM |
| Statistics update | Daily | 3 AM AEST |
| Connection pool reset | Weekly | Sunday 4 AM |
| Old session cleanup | Daily | 4 AM AEST |

#### 6.5.2 Performance Monitoring

| Metric | Check Frequency | Action Threshold |
|--------|-----------------|------------------|
| Slow queries | Real-time | > 1 second |
| Table bloat | Daily | > 20% |
| Index usage | Weekly | < 10% usage = review |
| Connection count | Real-time | > 80% of max |

---

## 7. Additional Data Models

### 7.1 Review

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

### 7.2 Notice (Noticeboard)

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

### 7.3 Community Group

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

### 7.4 Announcement

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

### 7.5 Historical Content

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

### 7.6 Category

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

### 7.7 RSVP

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

### 7.8 Saved Business

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

### 7.9 User Session

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

### 7.10 Audit Log

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

### 7.11 Email Template

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

### 7.12 Survey Models

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

### 7.13 Forum Models (B2B)

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

### 7.14 Referral

```
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

### 7.15 Notification

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

---

## 8. Additional API Endpoints

### 8.1 Reviews

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /businesses/:id/reviews | List reviews for a business | Public |
| GET | /reviews/:id | Get single review | Public |
| POST | /businesses/:id/reviews | Create a review | User |
| PUT | /reviews/:id | Update own review (within 7 days) | User |
| DELETE | /reviews/:id | Delete own review | User |
| POST | /reviews/:id/helpful | Mark review as helpful | User |
| DELETE | /reviews/:id/helpful | Remove helpful mark | User |
| POST | /reviews/:id/report | Report review | User |
| POST | /reviews/:id/respond | Business owner response | Business Owner |

### 8.2 Notifications

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /notifications | List user's notifications | User |
| GET | /notifications/unread-count | Get unread notification count | User |
| PUT | /notifications/:id/read | Mark notification as read | User |
| PUT | /notifications/read-all | Mark all as read | User |
| DELETE | /notifications/:id | Delete notification | User |

### 8.3 Noticeboard

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /notices | List active notices | Public |
| GET | /notices/:id | Get single notice | Public |
| POST | /notices | Create notice (pending approval) | User |
| PUT | /notices/:id | Update own notice | User |
| DELETE | /notices/:id | Delete own notice | User |
| POST | /notices/:id/report | Report notice | User |

### 8.4 Community Groups

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /groups | List community groups | Public |
| GET | /groups/:id | Get group details | Public |
| POST | /groups | Submit new group (pending approval) | User |
| PUT | /groups/:id | Update group (admin/creator) | Admin |

### 8.5 Local History

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /history | List historical content | Public |
| GET | /history/:id | Get single item | Public |
| POST | /history | Submit historical content | User |
| PUT | /history/:id | Update (admin) | Admin |
| DELETE | /history/:id | Delete (admin) | Admin |

### 8.6 Categories

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /categories | List all categories | Public |
| GET | /categories/:type | List categories by type | Public |
| POST | /categories | Create category | Admin |
| PUT | /categories/:id | Update category | Admin |
| DELETE | /categories/:id | Delete category | Admin |

### 8.7 Languages

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /languages | List supported languages | Public |
| GET | /translations/:lang | Get translations for language | Public |

### 8.8 File Uploads

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /upload/image | Upload image (returns URL) | User |
| POST | /upload/document | Upload document (PDF) | User |
| DELETE | /upload/:id | Delete uploaded file | User |

### 8.9 Announcements

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /announcements | List announcements | Public |
| GET | /announcements/:id | Get single announcement | Public |
| POST | /announcements | Create announcement | Admin |
| PUT | /announcements/:id | Update announcement | Admin |
| DELETE | /announcements/:id | Delete announcement | Admin |

### 8.10 Admin Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /admin/dashboard | Dashboard stats | Admin |
| GET | /admin/users | List all users | Admin |
| PUT | /admin/users/:id/role | Change user role | Admin |
| PUT | /admin/users/:id/suspend | Suspend user | Admin |
| PUT | /admin/users/:id/unsuspend | Unsuspend user | Admin |
| GET | /admin/moderation-queue | Get pending content | Moderator |
| POST | /admin/moderation/:type/:id/approve | Approve content | Moderator |
| POST | /admin/moderation/:type/:id/reject | Reject content | Moderator |
| GET | /admin/audit-log | Get audit log | Admin |
| GET | /admin/analytics | Platform analytics | Admin |
| POST | /admin/reports/generate | Generate report | Admin |

### 8.11 User Data Export

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /users/:id/export-request | Request data export | User |
| GET | /users/:id/export-status | Check export status | User |
| GET | /users/:id/export-download | Download export file | User |

### 8.12 Surveys

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /surveys | List available surveys | User |
| GET | /surveys/:id | Get survey details | User |
| POST | /surveys/:id/responses | Submit survey response | User |
| GET | /admin/surveys | List all surveys | Admin |
| POST | /admin/surveys | Create survey | Admin |
| PUT | /admin/surveys/:id | Update survey | Admin |
| GET | /admin/surveys/:id/results | Get survey results | Admin |

---

## 9. UI States & Components

### 9.1 Component States

#### 9.1.1 Button States

| State | Visual Treatment |
|-------|------------------|
| Default | Standard appearance per button type |
| Hover | Slight darkening (10%), cursor: pointer |
| Active/Pressed | Further darkening (15%), slight scale (0.98) |
| Focus | 2px outline in primary colour, offset 2px |
| Disabled | 50% opacity, cursor: not-allowed |
| Loading | Spinner icon, text replaced with "Loading...", disabled interaction |

#### 9.1.2 Form Field States

| State | Visual Treatment |
|-------|------------------|
| Default | 1px border #CCCCCC |
| Hover | 1px border #999999 |
| Focus | 2px border primary colour, subtle shadow |
| Filled | Same as default with content |
| Error | 2px border error colour, error message below |
| Disabled | Background #F5F5F5, 50% opacity, cursor: not-allowed |
| Read-only | Background #F5F5F5, normal cursor |

#### 9.1.3 Card States

| State | Visual Treatment |
|-------|------------------|
| Default | Shadow: 0 2px 4px rgba(0,0,0,0.1) |
| Hover | Shadow: 0 4px 8px rgba(0,0,0,0.15), slight lift (-2px Y transform) |
| Active/Selected | 2px border primary colour |
| Loading | Skeleton placeholder animation |
| Disabled | 50% opacity, no hover effect |

### 9.2 Loading States

#### 9.2.1 Skeleton Screens

| Component | Skeleton Design |
|-----------|-----------------|
| Business Card | Grey rectangle for image, lines for text |
| Business Profile | Header skeleton + content blocks |
| Event Card | Image placeholder + 3 text lines |
| Review | Avatar circle + text lines |
| List items | Repeating row skeletons |

#### 9.2.2 Skeleton Specifications

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

#### 9.2.3 Loading Indicators

| Context | Indicator |
|---------|-----------|
| Page load | Full-page skeleton |
| Button action | Inline spinner |
| List pagination | Bottom spinner |
| Pull to refresh | Top spinner |
| Background sync | Toast notification |

### 9.3 Empty States

#### 9.3.1 Standard Empty State Template

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

#### 9.3.2 Empty State Illustrations

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

### 9.4 Error States

#### 9.4.1 Inline Field Errors

```
┌─────────────────────────────────┐
│ Email                           │
├─────────────────────────────────┤
│ invalid-email                   │  ← Red border
└─────────────────────────────────┘
  ⚠ Please enter a valid email     ← Error message (red, 14px)
```

#### 9.4.2 Form-Level Errors

```
┌─────────────────────────────────┐
│ ⚠ Unable to save changes        │
│                                 │
│ Please fix the errors below     │
│ and try again.                  │
└─────────────────────────────────┘
```

#### 9.4.3 Page-Level Errors

| Error | Display |
|-------|---------|
| 404 Not Found | Full page with illustration, "Page not found", back button |
| 500 Server Error | Full page, "Something went wrong", retry button |
| Offline | Banner at top, "You're offline", cached content shown |
| Session Expired | Modal, "Session expired", login button |

### 9.5 Additional Components

#### 9.5.1 Modal/Dialog

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

#### 9.5.2 Toast/Snackbar Notifications

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

#### 9.5.3 Dropdown Menu

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

#### 9.5.4 Tabs

| Property | Specification |
|----------|---------------|
| Container | Border-bottom 1px #EEEEEE |
| Tab height | 48px |
| Tab padding | 0 16px |
| Active tab | Primary colour text, 2px bottom border |
| Inactive tab | Muted text, no border |
| Hover | Slight background highlight |
| Mobile | Scrollable horizontal if many tabs |

#### 9.5.5 Accordion/Collapsible

| Property | Specification |
|----------|---------------|
| Header height | 48px minimum |
| Header padding | 16px |
| Icon | Chevron right (collapsed), chevron down (expanded) |
| Animation | Smooth height transition (200ms) |
| Content padding | 16px |
| Border | 1px #EEEEEE between items |

#### 9.5.6 Tooltip

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

#### 9.5.7 Badge

| Type | Specification |
|------|---------------|
| Count badge | Circle, 18px min, background red, white text |
| Status badge | Pill shape, 24px height, semantic colours |
| Tag badge | Rounded rectangle, 28px height, subtle background |

#### 9.5.8 Progress Indicators

| Type | Specification |
|------|---------------|
| Linear | 4px height, rounded, primary colour fill |
| Circular (spinner) | 24px default, stroke width 3px, primary colour |
| Steps | Circles connected by lines, filled when complete |
| Percentage | Linear bar with percentage text |

#### 9.5.9 Date/Time Picker

| Property | Specification |
|----------|---------------|
| Calendar | Month grid view, today highlighted |
| Time | Dropdowns for hour, minute (15-min increments) |
| Mobile | Native date/time inputs on mobile |
| Range | Two calendars side by side for date ranges |

#### 9.5.10 File Upload Component

| State | Display |
|-------|---------|
| Default | Dashed border box, "Drag files or click to upload" |
| Drag over | Highlighted border, "Drop files here" |
| Uploading | Progress bar, file name, cancel button |
| Complete | Thumbnail (images), file icon (documents), remove button |
| Error | Red border, error message |

#### 9.5.11 Image Cropper

| Feature | Specification |
|---------|---------------|
| Crop area | Resizable, maintains aspect ratio if required |
| Aspect ratios | 1:1 (logo), 3:1 (cover), free (gallery) |
| Controls | Zoom slider, rotate buttons |
| Preview | Live preview of cropped result |
| Actions | Cancel, Apply buttons |

### 9.6 Animation & Transitions

#### 9.6.1 Standard Durations

| Type | Duration | Easing |
|------|----------|--------|
| Micro (hover, focus) | 150ms | ease-out |
| Small (buttons, toggles) | 200ms | ease-out |
| Medium (modals, panels) | 300ms | ease-in-out |
| Large (page transitions) | 400ms | ease-in-out |

#### 9.6.2 Page Transitions

| Transition | Animation |
|------------|-----------|
| Navigate forward | Slide left + fade |
| Navigate back | Slide right + fade |
| Modal open | Fade in + scale up |
| Modal close | Fade out + scale down |
| Dropdown open | Fade in + slide down |

#### 9.6.3 Micro-interactions

| Interaction | Animation |
|-------------|-----------|
| Button click | Scale down (0.98) on press |
| Card hover | Lift (translateY -2px) + shadow increase |
| Like/save | Heart pulse animation |
| Success | Checkmark draw animation |
| Error shake | Horizontal shake (3 cycles) |
| Pull to refresh | Spinner rotation |

---

## 10. Integration Specifications

### 10.1 SMS Templates (Twilio)

#### 10.1.1 Template Messages

| Template | Message | Max Length |
|----------|---------|------------|
| Verification PIN | "[Platform]: Your verification code is {pin}. Valid for 10 minutes." | 80 chars |
| Password Reset | "[Platform]: Reset your password: {link}. Link expires in 1 hour." | 100 chars |
| Critical Alert | "[Platform] ALERT: {title}. Details: {url}" | 160 chars |
| Warning Alert | "[Platform]: {title}. More info: {url}" | 140 chars |
| Event Reminder | "[Platform]: Reminder - {event} starts in 1 hour. {location}" | 140 chars |

#### 10.1.2 SMS Configuration

| Setting | Value |
|---------|-------|
| Sender ID | Platform name (configurable) |
| Character encoding | GSM-7 (fallback to UCS-2 for non-Latin) |
| Opt-out handling | Reply STOP to unsubscribe |
| Rate limiting | Max 1 SMS per user per 5 minutes (except critical) |

### 10.2 Push Notifications (Firebase)

#### 10.2.1 Notification Payloads

```json
{
  "notification": {
    "title": "New message from {business}",
    "body": "{preview}...",
    "icon": "/icons/notification-icon.png",
    "badge": "/icons/badge-icon.png",
    "click_action": "{action_url}"
  },
  "data": {
    "type": "new_message",
    "conversation_id": "{id}",
    "url": "/messages/{id}"
  }
}
```

#### 10.2.2 Notification Types

| Type | Title Template | Priority |
|------|----------------|----------|
| New message | "New message from {business}" | High |
| Review response | "{business} responded to your review" | Normal |
| Event reminder | "{event} starts in 1 hour" | High |
| Deal alert | "Flash deal from {business}!" | Normal |
| Critical alert | "⚠️ {alert_title}" | Critical |
| System | "{title}" | Normal |

### 10.3 Calendar Integration

#### 10.3.1 ICS File Format

```ics
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Community Hub//EN
BEGIN:VEVENT
UID:{event_id}@{platform_domain}
DTSTART:{start_datetime}
DTEND:{end_datetime}
SUMMARY:{event_title}
DESCRIPTION:{event_description}
LOCATION:{venue_address}
URL:{event_url}
ORGANIZER;CN={organizer_name}:mailto:{organizer_email}
END:VEVENT
END:VCALENDAR
```

#### 10.3.2 Calendar Subscription Feed

| Property | Value |
|----------|-------|
| URL format | /calendar/feed/{user_id}.ics |
| Update frequency | Real-time (updated on access) |
| Content | User's RSVPed events (Going + Interested) |
| Authentication | Token-based URL (long-lived) |

### 10.4 Analytics Event Tracking (GA4)

#### 10.4.1 Standard Events

| Event Name | Parameters | Trigger |
|------------|------------|---------|
| page_view | page_title, page_location | Page load |
| search | search_term, results_count | Search submitted |
| view_item | item_id, item_name, item_category | Business profile view |
| add_to_wishlist | item_id, item_name | Save business |
| begin_checkout | item_id | Click "Get Directions" |
| sign_up | method | Registration complete |
| login | method | Login complete |

#### 10.4.2 Custom Events

| Event Name | Parameters | Trigger |
|------------|------------|---------|
| business_contact | business_id, contact_type | Phone/email/message click |
| review_submit | business_id, rating | Review submitted |
| event_rsvp | event_id, rsvp_status | RSVP action |
| deal_view | deal_id, business_id | Deal detail view |
| deal_save | deal_id | Deal saved |
| alert_view | alert_id, alert_level | Alert viewed |
| language_change | from_lang, to_lang | Language switched |

### 10.5 External Emergency Feeds

#### 10.5.1 NSW Alerts Integration

| Property | Value |
|----------|-------|
| Feed URL | https://www.emergency.nsw.gov.au/feeds/... |
| Format | GeoRSS/CAP |
| Polling interval | 5 minutes |
| Filter | Geographic bounding box from config |

#### 10.5.2 Bureau of Meteorology

| Property | Value |
|----------|-------|
| Feed URL | http://www.bom.gov.au/fwo/... |
| Format | XML |
| Polling interval | 15 minutes |
| Alert types | Severe weather warnings |

#### 10.5.3 Transport NSW

| Property | Value |
|----------|-------|
| API | Transport Open Data API |
| Polling interval | 10 minutes |
| Alert types | Major disruptions affecting configured area |

---

## 11. Testing & Quality Requirements

### 11.1 Accessibility Testing

#### 11.1.1 Screen Reader Testing

| Screen Reader | Browser | OS | Required |
|---------------|---------|-----|----------|
| NVDA | Chrome, Firefox | Windows | Yes |
| JAWS | Chrome, Edge | Windows | Yes |
| VoiceOver | Safari | macOS, iOS | Yes |
| TalkBack | Chrome | Android | Yes |

#### 11.1.2 Accessibility Test Checklist

| Category | Test Items |
|----------|------------|
| Keyboard | All interactive elements focusable, logical tab order, visible focus |
| Screen reader | All content announced, form labels, error messages, dynamic updates |
| Visual | Colour contrast 4.5:1, text resizable to 200%, no information by colour alone |
| Motor | 44px touch targets, no time limits (or adjustable), no motion required |
| Cognitive | Clear language, consistent navigation, error prevention |

#### 11.1.3 Automated Testing Tools

| Tool | Purpose | When |
|------|---------|------|
| axe-core | Automated accessibility checks | CI pipeline |
| Lighthouse | Accessibility audit | CI pipeline |
| WAVE | Browser extension for manual testing | Development |
| Colour Contrast Analyzer | Contrast verification | Design review |

### 11.2 Browser Testing Matrix

#### 11.2.1 Desktop Browsers

| Browser | Versions | Priority |
|---------|----------|----------|
| Chrome | Latest, Latest-1 | Primary |
| Firefox | Latest, Latest-1 | Primary |
| Safari | Latest, Latest-1 | Primary |
| Edge | Latest, Latest-1 | Primary |

#### 11.2.2 Mobile Browsers

| Browser | Versions | Priority |
|---------|----------|----------|
| Chrome Mobile (Android) | Latest, Latest-1 | Primary |
| Safari Mobile (iOS) | Latest, Latest-1 | Primary |
| Samsung Internet | Latest | Secondary |
| Firefox Mobile | Latest | Secondary |

### 11.3 Device Testing Matrix

#### 11.3.1 Physical Device Testing

| Device | OS Version | Screen Size | Priority |
|--------|------------|-------------|----------|
| iPhone 12/13/14 | iOS 15+ | 390px | Primary |
| iPhone SE | iOS 15+ | 375px | Primary |
| Samsung Galaxy S21+ | Android 12+ | 384px | Primary |
| iPad | iPadOS 15+ | 768px | Primary |
| Pixel 6 | Android 12+ | 393px | Secondary |

#### 11.3.2 Emulator/Simulator Testing

| Viewport | Represents |
|----------|------------|
| 320px | Small phones (iPhone SE) |
| 375px | Standard phones |
| 414px | Large phones |
| 768px | Tablets portrait |
| 1024px | Tablets landscape / small laptops |
| 1280px | Desktop |
| 1920px | Large desktop |

### 11.4 Load Testing Scenarios

#### 11.4.1 Test Scenarios

| Scenario | Concurrent Users | Duration | Pass Criteria |
|----------|------------------|----------|---------------|
| Normal load | 100 | 30 min | p95 < 200ms, 0% errors |
| Peak load | 500 | 15 min | p95 < 500ms, < 0.1% errors |
| Stress test | 1000 | 10 min | No crashes, graceful degradation |
| Spike test | 0 → 500 → 0 | 5 min | Recovery within 2 min |
| Endurance | 200 | 4 hours | No memory leaks, stable response |

#### 11.4.2 Key Endpoints to Test

| Endpoint | Expected Load | Target Response |
|----------|---------------|-----------------|
| GET /businesses | High | < 100ms |
| GET /search/businesses | Very High | < 200ms |
| GET /businesses/:id | High | < 150ms |
| POST /auth/login | Medium | < 300ms |
| GET /events | Medium | < 150ms |

### 11.5 Security Testing

#### 11.5.1 Automated Security Scanning

| Tool | Purpose | Frequency |
|------|---------|-----------|
| OWASP ZAP | Dynamic security testing | Weekly |
| Snyk | Dependency vulnerability scanning | Every build |
| SonarQube | Static code analysis | Every PR |
| npm audit | Node.js dependency check | Every build |

#### 11.5.2 Penetration Testing Scope

| Area | Tests |
|------|-------|
| Authentication | Brute force, session hijacking, token manipulation |
| Authorization | Privilege escalation, IDOR |
| Input validation | SQL injection, XSS, command injection |
| File upload | Malicious file upload, path traversal |
| API | Rate limiting bypass, parameter tampering |
| Data exposure | Sensitive data in responses, error messages |

#### 11.5.3 Penetration Testing Schedule

| Type | Frequency | Provider |
|------|-----------|----------|
| Automated scan | Weekly | Internal |
| Manual pen test | Quarterly | External firm |
| Red team exercise | Annually | External firm |

### 11.6 Test Coverage Requirements

| Test Type | Coverage Target |
|-----------|-----------------|
| Unit tests | > 80% line coverage |
| Integration tests | All API endpoints |
| E2E tests | All critical user journeys |
| Accessibility tests | All pages and components |
| Performance tests | All high-traffic endpoints |

---

## 12. Operational Procedures

### 12.1 Support Workflow

#### 12.1.1 Support Channels

| Channel | Response Time | Availability |
|---------|---------------|--------------|
| Email (support@) | 24 hours | 24/7 |
| In-app help | 24 hours | 24/7 |
| FAQ/Knowledge base | Self-service | 24/7 |

#### 12.1.2 Support Categories

| Category | Priority | Examples |
|----------|----------|----------|
| Account access | High | Can't login, locked out |
| Business claim | Medium | Verification issues |
| Content issues | Medium | Review disputes, flags |
| Bug reports | Medium | Feature not working |
| Feature requests | Low | Suggestions |
| General enquiries | Low | How-to questions |

#### 12.1.3 Ticket Workflow

```
New Ticket
    ↓
Auto-categorise (AI/rules)
    ↓
Route to appropriate queue
    ↓
Assign to agent
    ↓
Investigate & respond
    ↓
Await user reply (24hr timeout)
    ↓
Resolve & close
    ↓
Satisfaction survey
```

### 12.2 SLA Definitions

#### 12.2.1 Uptime SLA

| Metric | Target |
|--------|--------|
| Monthly uptime | 99.9% |
| Scheduled maintenance | Max 4 hours/month, announced 48hrs ahead |
| Unplanned downtime | Max 43 minutes/month |

#### 12.2.2 Response Time SLAs

| Request Type | Target |
|--------------|--------|
| API response (p95) | < 200ms |
| Page load | < 3s |
| Search results | < 500ms |

#### 12.2.3 Support SLAs

| Priority | First Response | Resolution |
|----------|----------------|------------|
| Critical (P1) | 1 hour | 4 hours |
| High (P2) | 4 hours | 24 hours |
| Medium (P3) | 24 hours | 72 hours |
| Low (P4) | 48 hours | 1 week |

### 12.3 Runbooks

#### 12.3.1 Database Connection Issues

```
Symptoms: API errors, "Connection refused" in logs

Steps:
1. Check database server status in cloud console
2. Verify security group allows connections
3. Check connection pool metrics
4. If pool exhausted, restart application servers
5. If database overloaded, scale up or add read replicas
6. If data corruption suspected, failover to replica

Escalation: If not resolved in 15 min, page database team
```

#### 12.3.2 High Error Rate

```
Symptoms: Error rate > 5%, user reports

Steps:
1. Check error logs for common patterns
2. Identify affected endpoints
3. Check recent deployments (rollback if needed)
4. Check third-party service status
5. Enable verbose logging for affected area
6. Implement fix or mitigation

Escalation: If not resolved in 30 min, page on-call lead
```

#### 12.3.3 Search Not Working

```
Symptoms: Search returns no results, Elasticsearch errors

Steps:
1. Check Elasticsearch cluster health
2. Verify index exists and has documents
3. Check recent indexing jobs
4. Restart Elasticsearch if unhealthy
5. Rebuild index if corrupted
6. Fall back to PostgreSQL search if ES unavailable

Escalation: If not resolved in 20 min, page search team
```

### 12.4 On-Call Rotation

#### 12.4.1 Rotation Structure

| Role | Rotation | Responsibilities |
|------|----------|------------------|
| Primary on-call | Weekly | First responder for all alerts |
| Secondary on-call | Weekly | Backup if primary unavailable |
| Incident commander | As needed | Coordinate major incidents |

#### 12.4.2 On-Call Expectations

| Expectation | Requirement |
|-------------|-------------|
| Response time | Acknowledge within 15 minutes |
| Availability | Reachable by phone/Slack |
| Handoff | 30-minute overlap at rotation change |
| Documentation | Update incident log for all issues |

### 12.5 Cost Monitoring

#### 12.5.1 Budget Alerts

| Service | Warning | Critical |
|---------|---------|----------|
| Cloud compute | 80% of budget | 100% of budget |
| Database | 80% of budget | 100% of budget |
| Storage | 80% of allocated | 95% of allocated |
| API calls (external) | 75% of quota | 90% of quota |
| Email sends | 75% of quota | 90% of quota |
| SMS sends | 75% of budget | 90% of budget |

#### 12.5.2 Cost Optimisation Reviews

| Review | Frequency | Focus |
|--------|-----------|-------|
| Usage review | Weekly | Identify unused resources |
| Cost allocation | Monthly | Attribute costs to features |
| Right-sizing | Quarterly | Adjust resource allocation |
| Reserved capacity | Annually | Commit to reservations |

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | January 2026 | Claude | Initial supplement addressing specification gaps |

---

*This supplement should be read alongside the main Community Hub Platform Specification (v1.3). Together they provide a complete reference for platform development.*

