# Guildford Community Digital Platform
## Complete Platform Specification Document

**Document Version:** 1.1
**Date:** January 2026
**Purpose:** Comprehensive specification for platform development planning

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [User Types & Roles](#2-user-types--roles)
3. [Business Profile Features](#3-business-profile-features)
4. [Community User Features](#4-community-user-features)
5. [Business Owner Features](#5-business-owner-features)
6. [Events & Calendar System](#6-events--calendar-system)
7. [Social Media Integration](#7-social-media-integration)
8. [Community Features](#8-community-features)
9. [Administration & Moderation](#9-administration--moderation)
10. [Search & Discovery](#10-search--discovery)
11. [Multilingual Support](#11-multilingual-support)
12. [Technical Requirements](#12-technical-requirements)
13. [Security & Privacy](#13-security--privacy)
14. [Analytics & Reporting](#14-analytics--reporting)
15. [Integration Requirements](#15-integration-requirements)
16. [Design Specifications](#16-design-specifications)
17. [Messaging & Communication System](#17-messaging--communication-system)
18. [Deals & Promotions Hub](#18-deals--promotions-hub)
19. [Business-to-Business Networking](#19-business-to-business-networking)
20. [Emergency & Crisis Communication](#20-emergency--crisis-communication)

---

## 1. Project Overview

### 1.1 Purpose

The Guildford Community Digital Platform is a Digital Community Improvement Hub (DCIH) designed to support local businesses in the Guildford South precinct facing competition from large shopping centres. The platform serves as an integrated directory and community engagement system connecting residents with local businesses.

### 1.2 Key Objectives

| Objective | Description |
|-----------|-------------|
| Business Visibility | Create digital shopfronts for businesses, many of which have no online presence |
| Community Connection | Bridge the gap between residents and local businesses |
| Multilingual Access | Remove language barriers for Guildford's diverse community |
| Data Collection | Enable surveys and data gathering to inform strategic planning |
| Economic Vitality | Drive foot traffic to the physical precinct |

### 1.3 Project Timeline

- **Phase 1:** January 2026 - July 2026
- **Investment:** Approximately $48,000
- **Project Manager:** Greater Cumberland Chamber of Commerce in partnership with Cumberland Council

### 1.4 Platform Foundation

The platform is partitioned from the existing Body Chi Me marketplace infrastructure, which services over 20,000 businesses worldwide.

---

## 2. User Types & Roles

### 2.1 Role Definitions

| Role | Description | Access Level |
|------|-------------|--------------|
| **Visitor** | Unauthenticated user browsing the platform | Read-only access to public content |
| **Community Member** | Registered resident/community user | Save businesses, RSVP events, submit reviews, receive notifications |
| **Business Owner** | Verified owner/manager of a listed business | Full control of their business profile, analytics access |
| **Content Moderator** | Platform staff managing content quality | Content approval, flag review, user warnings |
| **Platform Administrator** | Full administrative access | All moderator functions plus user management, settings, analytics |
| **Chamber/Council Staff** | Partner organisation access | Analytics, surveys, communications, event management |

### 2.2 Permission Matrix

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

## 3. Business Profile Features

### 3.1 Basic Business Information

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

### 3.2 Operating Hours

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
| Temporary Closure | Date range + Reason | Planned closure (renovation, holiday, etc.) |
| Special Event Hours | Date + Time range | Extended hours for events |

#### Display Logic

- Show "Open Now" or "Closed" based on current time
- Display next opening time if currently closed
- Show countdown to closing if closing within 1 hour
- Highlight modified hours with visual indicator

### 3.3 Business Media

#### Logo

| Specification | Requirement |
|---------------|-------------|
| Format | PNG, JPG, JPEG, WebP |
| Minimum Size | 200 x 200 pixels |
| Maximum Size | 2MB |
| Aspect Ratio | 1:1 (square) |
| Background | Transparent supported for PNG |

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
| Caption | Optional, max 500 chars |

#### Menu/Price List

| Specification | Requirement |
|---------------|-------------|
| Format | PDF, PNG, JPG |
| Maximum Size | 10MB |
| Multiple Files | Up to 5 menu files |

### 3.4 Social & Online Presence

#### Social Media Links

| Platform | Field Type | Auto-sync Available |
|----------|------------|---------------------|
| Google Business Profile | URL | Yes - primary sync source |
| Facebook Page | URL | Yes |
| Instagram Profile | URL | Yes |
| X (Twitter) | URL | No |
| LinkedIn | URL | No |
| TikTok | URL | No |
| YouTube | URL | No |

#### External Links

| Link Type | Description |
|-----------|-------------|
| Website | Main business website |
| Online Store | E-commerce site |
| Booking System | External booking platform |
| Menu (External) | Link to online menu |
| Delivery Platforms | UberEats, DoorDash, Menulog links |

### 3.5 Language & Cultural Features

#### Staff Languages

| Field | Type | Description |
|-------|------|-------------|
| Languages Spoken | Multi-select | Languages staff can communicate in |
| Primary Language | Select | Main language of service |
| Display Format | Flag icons | Visual indicator on profile |

#### Cultural Certifications

| Certification | Type | Description |
|---------------|------|-------------|
| Halal Certified | Checkbox + Certificate | Islamic dietary certification |
| Kosher Certified | Checkbox + Certificate | Jewish dietary certification |
| Vegetarian Friendly | Checkbox | Vegetarian options available |
| Vegan Friendly | Checkbox | Vegan options available |
| Organic Certified | Checkbox + Certificate | Organic certification |
| Other Certifications | Text + File | Custom certifications |

#### Cultural Services

| Service | Description |
|---------|-------------|
| Cultural Service Tags | E.g., "Serves Lebanese community", "Specialises in Vietnamese cuisine" |
| Cultural Event Hosting | Business hosts cultural celebrations |
| Community Language Support | "Arabic-speaking staff", "Mandarin services available" |

### 3.6 Promotions & Offers

#### Promotion Fields

| Field | Type | Description |
|-------|------|-------------|
| Promotion Title | Text | Name of the offer, max 100 chars |
| Description | Rich Text | Details of the offer, max 500 chars |
| Discount Type | Select | Percentage, Fixed Amount, BOGO, Free Item |
| Discount Value | Number | Amount or percentage |
| Valid From | Date | Start date |
| Valid Until | Date | Expiry date |
| Terms & Conditions | Text | Fine print, max 1000 chars |
| Promotion Image | Image | Visual for the offer |
| Featured | Checkbox | Display prominently |

#### Promotion Rules

- Maximum 5 active promotions per business
- Expired promotions auto-archive after 30 days
- Featured promotions require moderator approval
- Promotional posts distributed as per monthly content schedule (1 post per month per business)

---

## 4. Community User Features

### 4.1 Account Registration

#### Registration Methods

| Method | Fields Required | Verification |
|--------|-----------------|--------------|
| Email Registration | Email, Password, Name | Email verification link |
| Google Sign-in | OAuth consent | Automatic via Google |
| Facebook Sign-in | OAuth consent | Automatic via Facebook |
| QR Code Registration | Scan QR → Email, Password, Name | Email verification link |

#### Registration Fields

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Email Address | Email | Yes | Valid email, unique |
| Password | Password | Yes | Min 8 chars, 1 uppercase, 1 number |
| Display Name | Text | Yes | 2-50 chars |
| Preferred Language | Select | Yes | Default to English |
| Suburb | Select | No | For local recommendations |
| Interests | Multi-select | No | Business categories of interest |
| Marketing Consent | Checkbox | Yes | Required for email communications |

#### Email Verification

- Verification link valid for 24 hours
- Resend option after 60 seconds
- Account limited to browsing until verified
- 3 maximum resend attempts per hour

### 4.2 Account Management

#### Profile Settings

| Setting | Description |
|---------|-------------|
| Edit Display Name | Change visible name |
| Change Email | Requires re-verification |
| Change Password | Requires current password |
| Profile Photo | Optional avatar image |
| Bio | Optional description, max 500 chars |

#### Security Settings

| Setting | Description |
|---------|-------------|
| Password Reset | Email-based reset flow |
| Active Sessions | View and revoke login sessions |
| Two-Factor Authentication | Optional, via authenticator app |
| Account Deletion | Permanent deletion with 14-day grace period |

#### Password Reset Flow

1. User clicks "Forgot Password"
2. User enters email address
3. System sends reset link (valid 1 hour)
4. User clicks link, enters new password
5. All existing sessions invalidated
6. Confirmation email sent

### 4.3 Notification Preferences

#### Notification Types

| Type | Description | Default |
|------|-------------|---------|
| Business Updates | Updates from followed businesses | On |
| Event Reminders | Reminders for RSVPed events | On |
| New Events | New events matching interests | On |
| Promotions | New promotions from followed businesses | On |
| Community News | Platform announcements | On |
| Survey Invitations | Requests to complete surveys | On |

#### Delivery Methods

| Method | Options |
|--------|---------|
| Email Frequency | Instant, Daily Digest, Weekly Digest, Off |
| Push Notifications | On/Off (if PWA installed) |
| SMS | Off by default, opt-in |

### 4.4 User Engagement Features

#### Saved Businesses

| Feature | Description |
|---------|-------------|
| Save Button | Heart/bookmark icon on business cards |
| Saved List | Accessible from user profile |
| Categories | User can create custom lists |
| Sharing | Share saved lists with others |
| Notifications | Optional alerts for saved business updates |

#### Following Businesses

| Feature | Description |
|---------|-------------|
| Follow Button | On business profile page |
| Feed | Updates from followed businesses |
| Unfollow | One-click unfollow |
| Follow Count | Visible on business profile |

#### Event Interaction

| Feature | Description |
|---------|-------------|
| RSVP Options | Going, Interested, Not Going |
| Calendar Export | Add to personal calendar (ICS file) |
| Reminders | 1 day and 1 hour before event |
| Share Event | Social sharing buttons |

#### Reviews & Ratings

| Feature | Description |
|---------|-------------|
| Star Rating | 1-5 stars |
| Review Text | 50-1000 characters |
| Review Photos | Up to 3 images |
| Review Language | Auto-detected, translateable |
| Helpful Votes | Other users can mark helpful |
| Business Response | Owner can respond publicly |
| Edit Window | 7 days to edit own review |

---

## 5. Business Owner Features

### 5.1 Business Claim & Verification

#### Claim Process

1. User clicks "Claim this business" on unclaimed profile
2. User selects verification method
3. User completes verification
4. Moderator reviews (if required)
5. Access granted upon approval

#### Verification Methods

| Method | Process | Timeframe |
|--------|---------|-----------|
| Phone Verification | Automated call with PIN | Instant |
| Email Verification | Email to business domain | Instant |
| Document Upload | ABN certificate, utility bill | 1-3 business days |
| Google Business | Connect existing GMB profile | Instant |

#### Verification Requirements

- Business must be physically located in Guildford South precinct
- One verified owner per business (can add additional managers)
- Re-verification required if ownership changes

### 5.2 Business Dashboard

#### Dashboard Sections

| Section | Description |
|---------|-------------|
| Overview | Key metrics summary |
| Profile | Edit business information |
| Photos | Manage gallery |
| Promotions | Create and manage offers |
| Events | Create business events |
| Reviews | View and respond to reviews |
| Analytics | Detailed performance data |
| Settings | Account and notification settings |

#### Quick Actions

- Edit basic info
- Add/remove photos
- Create promotion
- Respond to latest review
- View today's analytics

### 5.3 Content Management

#### Profile Editing

| Section | Editable Fields |
|---------|-----------------|
| Basic Info | All fields from Section 3.1 |
| Hours | All fields from Section 3.2 |
| Media | All fields from Section 3.3 |
| Social Links | All fields from Section 3.4 |
| Languages | All fields from Section 3.5 |
| Promotions | All fields from Section 3.6 |

#### Content Sync Options

| Source | Sync Type | Fields Synced |
|--------|-----------|---------------|
| Google Business Profile | Auto/Manual | Name, address, phone, hours, photos, reviews |
| Facebook Page | Auto/Manual | Description, photos, events |
| Instagram | Auto/Manual | Photos, posts |

#### Manual Override

- Any auto-synced field can be manually overridden
- Override flag indicates manual edit
- Option to revert to synced data
- Sync can be paused for specific fields

### 5.4 Business Analytics

#### Metrics Available

| Metric | Description | Timeframe Options |
|--------|-------------|-------------------|
| Profile Views | Total views of business profile | Daily, Weekly, Monthly, Custom |
| Search Appearances | Times shown in search results | Daily, Weekly, Monthly, Custom |
| Website Clicks | Clicks to external website | Daily, Weekly, Monthly, Custom |
| Phone Clicks | Clicks on phone number | Daily, Weekly, Monthly, Custom |
| Direction Requests | Clicks on "Get Directions" | Daily, Weekly, Monthly, Custom |
| Photo Views | Views of gallery images | Daily, Weekly, Monthly, Custom |
| Promotion Views | Views of active promotions | Per promotion |
| Review Count | New reviews in period | Daily, Weekly, Monthly, Custom |
| Average Rating | Current average star rating | All time, Recent |
| Follower Count | Users following business | Current total |
| Save Count | Users who saved business | Current total |

#### Comparison Data

- Compare to previous period
- Compare to category average
- Compare to precinct average

#### Export Options

- CSV download
- PDF report
- Email scheduled reports (weekly/monthly)

---

## 6. Events & Calendar System

### 6.1 Event Types

| Type | Description | Creator |
|------|-------------|---------|
| Community Events | General community gatherings | Admin, Chamber, Council |
| Business Events | Events hosted by businesses | Business owners |
| Cultural Events | Cultural celebrations | Admin, Community groups |
| Sports Events | Sports club activities | Admin, Sports clubs |
| Council Events | Council-organised events | Council staff |
| Markets | Markets and fairs | Admin, organisers |

### 6.2 Event Fields

#### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| Event Title | Text | Name of event, max 100 chars |
| Event Description | Rich Text | Details, max 2000 chars |
| Event Category | Select | From predefined list |
| Start Date/Time | DateTime | When event begins |
| End Date/Time | DateTime | When event ends |
| Location Type | Select | Physical, Online, Hybrid |

#### Location Fields (Physical Events)

| Field | Type | Description |
|-------|------|-------------|
| Venue Name | Text | Name of venue |
| Street Address | Text | Full address |
| Suburb | Text | Suburb name |
| Map Display | Boolean | Show on map |
| Linked Business | Reference | Link to business if hosted there |

#### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| Event Image | Image | Banner image for event |
| Gallery | Images | Multiple event images |
| Ticket URL | URL | Link to ticketing platform |
| Cost | Text | Free, or price details |
| Capacity | Number | Maximum attendees |
| Age Restriction | Select | All ages, 18+, Family-friendly |
| Accessibility | Multi-select | Wheelchair, hearing loop, etc. |
| Contact Email | Email | For enquiries |
| Contact Phone | Phone | For enquiries |
| Tags | Multi-select | For discovery |

### 6.3 Recurring Events

| Pattern | Description |
|---------|-------------|
| Daily | Every day at same time |
| Weekly | Same day(s) each week |
| Fortnightly | Every two weeks |
| Monthly (Date) | Same date each month |
| Monthly (Day) | E.g., First Monday of each month |
| Custom | Define specific occurrences |

#### Recurrence Settings

| Setting | Description |
|---------|-------------|
| Start Date | First occurrence |
| End Type | After X occurrences, On specific date, Never |
| Exceptions | Dates to skip |
| Instance Editing | Edit single occurrence vs entire series |

### 6.4 Calendar Views

#### Month View

- Mini calendar grid
- Dots indicating events on dates
- Click date to see event list
- Navigate between months

#### List View

- Chronological event list
- Filter by category
- Filter by date range
- Search by keyword

#### Day View

- All events for selected date
- Timeline format
- Quick RSVP buttons

### 6.5 Event Integration

#### Facebook Events Sync

| Direction | Description |
|-----------|-------------|
| Import | Pull events from linked Facebook page |
| Manual Add | Add Facebook event URL |
| Display | Show synced events on calendar |

#### Eventbrite Integration

| Feature | Description |
|---------|-------------|
| Link Events | Connect Eventbrite event to platform listing |
| Ticket Display | Show "Get Tickets" button |
| Availability | Display ticket availability status |

#### Calendar Export

| Format | Description |
|--------|-------------|
| ICS File | Single event download |
| Calendar Subscribe | URL for calendar app subscription |
| Google Calendar | One-click add to Google Calendar |

---

## 7. Social Media Integration

### 7.1 #MyGuildford Community Feed

#### Hashtag Aggregation

| Hashtag | Platform | Description |
|---------|----------|-------------|
| #MyGuildford | Instagram, Facebook, X | Primary community hashtag |
| #Guildford | Instagram, Facebook, X | General suburb hashtag |
| #GuildfordNSW | Instagram, Facebook, X | Location-specific |
| #GuildfordSydney | Instagram, Facebook, X | Location-specific |
| #ShopGuildford | Instagram, Facebook, X | Shopping focus |

#### Feed Display

- Masonry/Pinterest-style grid layout
- 3 columns on desktop, 2 on tablet, 1 on mobile
- Cards show: image, username, platform icon, preview text, engagement count
- Click to expand or link to original post
- Infinite scroll with lazy loading

#### Content Filtering

| Filter | Description |
|--------|-------------|
| Location | Posts geotagged within 5km of Guildford |
| Language | Support for community languages |
| Content Type | Images, Videos, Text posts |
| Moderation | Remove flagged/inappropriate content |

### 7.2 Business Social Feeds

#### Per-Business Display

- Show latest 3-4 posts from business's social accounts
- Instagram and Facebook posts
- "Follow us" buttons for each platform
- Embedded post format

#### Sync Frequency

- Real-time for new posts (webhook where available)
- Hourly poll as fallback
- Manual refresh option

### 7.3 Community Competitions

| Feature | Description |
|---------|-------------|
| Monthly Theme | Platform announces monthly photo theme |
| Submission | Use designated hashtag |
| Voting | Community votes via engagement |
| Winner Selection | Manual selection by admin |
| Prizes | Displayed on platform, facilitated offline |

### 7.4 Content Moderation

#### Automated Filters

| Filter Type | Description |
|-------------|-------------|
| Profanity | Block posts with flagged words |
| Spam Detection | Block repetitive/promotional spam |
| Off-topic | Flag posts not related to Guildford |
| Duplicate | Prevent same content appearing twice |

#### Manual Moderation

| Action | Description |
|--------|-------------|
| Approve | Allow flagged content to display |
| Remove | Hide content from feed |
| Block User | Prevent user's content from appearing |
| Report to Platform | Report TOS violation to source platform |

---

## 8. Community Features

### 8.1 Local Services Directory

#### Service Categories

| Category | Examples |
|----------|----------|
| Home Services | Gardening, Handyman, Cleaning, Pet care |
| Personal Services | Tutoring, Music lessons, Personal training |
| Professional Services | Tax prep, Resume writing, Translation |
| Community Help | Elderly assistance, Community navigation |

#### Service Listing Fields

| Field | Type | Description |
|-------|------|-------------|
| Service Title | Text | Name of service offered |
| Description | Text | Details of service |
| Category | Select | From predefined list |
| Provider Name | Text | Individual or business name |
| Contact Method | Select | Phone, Email, Message |
| Contact Details | Text | Based on contact method |
| Service Area | Multi-select | Suburbs served |
| Languages | Multi-select | Languages available |
| Pricing | Text | Rate or price range |

### 8.2 Community Groups Hub

#### Group Types

| Type | Examples |
|------|----------|
| Hobby Groups | Book clubs, Craft groups, Walking groups |
| Parent Groups | Playgroups, School parent groups |
| Cultural Groups | Cultural associations, Language groups |
| Sports Clubs | Local sporting clubs |
| Volunteer Groups | Community service organisations |

#### Group Listing Fields

| Field | Type | Description |
|-------|------|-------------|
| Group Name | Text | Official name |
| Description | Text | About the group |
| Category | Select | From predefined list |
| Meeting Schedule | Text | When the group meets |
| Location | Text | Where meetings are held |
| Contact Person | Text | Group contact name |
| Contact Details | Text | Email or phone |
| Website/Social | URL | External links |
| How to Join | Text | Membership process |

### 8.3 Community Noticeboard

#### Notice Types

| Type | Description |
|------|-------------|
| Lost & Found | Lost pets, lost items, found items |
| Items for Sale | Second-hand items from residents |
| Free Items | Items being given away |
| Wanted | Items residents are looking for |
| Recommendations | Asking for or giving recommendations |
| General | Other community notices |

#### Notice Fields

| Field | Type | Description |
|-------|------|-------------|
| Title | Text | Notice heading |
| Description | Text | Details |
| Category | Select | Notice type |
| Image | Image | Optional photo |
| Contact Method | Select | Phone, Email, Message |
| Expiry | Date | When to auto-remove (default 30 days) |

#### Moderation

- All notices require moderator approval before posting
- Auto-expire after 30 days (configurable)
- Limit 3 active notices per user
- Report button for inappropriate content

### 8.4 Local News & Announcements

#### Content Sources

| Source | Description |
|--------|-------------|
| Council Announcements | Official council news and updates |
| Chamber Updates | Chamber of Commerce communications |
| Platform News | Platform updates and features |
| Community News | Moderated community news |

#### Display Format

- Reverse chronological feed
- Featured/pinned announcements at top
- Category filtering
- Search functionality

### 8.5 Local History Archive

#### Content Types

| Type | Description |
|---------|-------------|
| Historical Photos | Images from Guildford's past |
| Stories | Written accounts of local history |
| Heritage Sites | Information about heritage locations |
| Oral Histories | Transcribed interviews |
| Timeline Events | Key dates in local history |

#### Submission Process

- Community members can submit content
- All submissions require moderator approval
- Attribution required for all content
- Rights/permissions must be confirmed

---

## 9. Administration & Moderation

### 9.1 Admin Dashboard

#### Dashboard Overview

| Widget | Description |
|--------|-------------|
| Active Users | Current logged-in users |
| New Registrations | Signups in last 7 days |
| Pending Approvals | Content awaiting review |
| Active Businesses | Businesses with recent activity |
| Upcoming Events | Events in next 7 days |
| Platform Health | System status indicators |

#### Quick Actions

- Approve pending content
- Respond to flagged items
- Create announcement
- Export reports

### 9.2 User Management

#### User List

| Column | Description |
|--------|-------------|
| User ID | Unique identifier |
| Display Name | User's chosen name |
| Email | Registration email |
| Role | User type |
| Status | Active, Suspended, Pending |
| Registered | Registration date |
| Last Active | Last login date |

#### User Actions

| Action | Description |
|--------|-------------|
| View Profile | See user details |
| Edit Role | Change user permissions |
| Suspend | Temporarily disable account |
| Unsuspend | Restore suspended account |
| Delete | Permanently remove account |
| Send Message | Contact user directly |
| View Activity | See user's actions |

### 9.3 Business Management

#### Business List

| Column | Description |
|--------|-------------|
| Business ID | Unique identifier |
| Business Name | Official name |
| Category | Primary category |
| Status | Active, Pending, Suspended |
| Claimed | Yes/No |
| Owner | Linked user account |
| Profile Completeness | Percentage complete |
| Last Updated | Last edit date |

#### Business Actions

| Action | Description |
|--------|-------------|
| View Profile | See business details |
| Edit Profile | Modify business information |
| Change Status | Activate, Suspend |
| Transfer Ownership | Change verified owner |
| Send Reminder | Notify about incomplete profile |
| View Analytics | See business metrics |
| Merge Duplicate | Combine duplicate listings |

#### Profile Completeness Tracking

| Completeness Level | Criteria |
|--------------------|----------|
| Basic (40%) | Name, category, address, phone |
| Standard (70%) | + Description, hours, 1 photo |
| Complete (90%) | + Logo, 5+ photos, social links |
| Optimised (100%) | + All optional fields |

#### Automated Reminders

| Trigger | Action |
|---------|--------|
| Profile < 70% after 7 days | Email reminder to complete profile |
| No updates for 90 days | Email to verify information current |
| Photo older than 1 year | Suggest updating photos |

### 9.4 Content Moderation

#### Moderation Queue

| Content Type | Approval Required |
|--------------|-------------------|
| Business Profiles | New/unclaimed businesses |
| Photos | Reported photos |
| Reviews | Reported reviews |
| Social Feed Posts | Flagged posts |
| Noticeboard Items | All submissions |
| Events | Community-submitted events |

#### Moderation Actions

| Action | Description |
|--------|-------------|
| Approve | Publish content |
| Reject | Remove with reason |
| Edit | Modify before publishing |
| Request Changes | Return to submitter |
| Escalate | Send to senior moderator |

#### Moderation Log

| Field | Description |
|-------|-------------|
| Content ID | Unique identifier |
| Content Type | Type of content |
| Action | What was done |
| Moderator | Who took action |
| Timestamp | When action occurred |
| Reason | Why action was taken |
| Original Content | Preserved for audit |

### 9.5 Reports & Flags

#### Report Reasons

| Reason | Description |
|--------|-------------|
| Inappropriate Content | Offensive or adult content |
| Spam | Advertising or repetitive content |
| Incorrect Information | Factually wrong |
| Copyright Violation | Stolen content |
| Harassment | Targeting individuals |
| Scam/Fraud | Deceptive content |
| Other | Custom reason |

#### Flag Workflow

1. User submits report with reason
2. Content flagged in moderation queue
3. Moderator reviews content and report
4. Action taken (approve, remove, warn)
5. Reporter notified of outcome

### 9.6 Survey & Data Collection

#### Survey Builder

| Feature | Description |
|---------|-------------|
| Question Types | Multiple choice, Rating, Text, Checkbox |
| Branching Logic | Skip questions based on answers |
| Required Fields | Mark questions as mandatory |
| Multilingual | Surveys in multiple languages |
| Anonymous Option | Allow anonymous responses |

#### Survey Distribution

| Channel | Description |
|---------|-------------|
| Platform Notification | In-app notification to users |
| Email | Direct email to user segments |
| Public Link | Shareable URL |
| QR Code | Physical distribution |

#### Survey Analytics

| Metric | Description |
|--------|-------------|
| Response Rate | Completed vs invited |
| Completion Time | Average time to complete |
| Question Analytics | Response breakdown per question |
| Demographic Breakdown | Responses by user segment |
| Export | CSV, PDF export of results |

---

## 10. Search & Discovery

### 10.1 Business Search

#### Search Fields

| Field | Searchable | Weighted |
|-------|------------|----------|
| Business Name | Yes | High |
| Description | Yes | Medium |
| Category | Yes | High |
| Address/Suburb | Yes | Medium |
| Tags | Yes | Medium |
| Languages | Yes | Low |

#### Search Features

| Feature | Description |
|---------|-------------|
| Autocomplete | Suggestions as user types |
| Typo Tolerance | Handle common misspellings |
| Synonym Matching | "Restaurant" matches "Eatery" |
| Recent Searches | Show user's recent searches |
| Popular Searches | Show trending searches |

### 10.2 Filters & Sorting

#### Filter Options

| Filter | Type | Options |
|--------|------|---------|
| Category | Multi-select | All categories |
| Distance | Range | 500m, 1km, 2km, 5km, Any |
| Open Now | Toggle | Yes/No |
| Languages Spoken | Multi-select | All languages |
| Price Range | Multi-select | $, $$, $$$, $$$$ |
| Rating | Range | 3+, 4+, 4.5+ |
| Certifications | Multi-select | Halal, Kosher, Vegan, etc. |
| Accessibility | Multi-select | All accessibility options |
| Has Promotions | Toggle | Yes/No |

#### Sort Options

| Sort | Description |
|------|-------------|
| Relevance | Best match to search query |
| Distance | Nearest first |
| Rating | Highest rated first |
| Most Reviewed | Most reviews first |
| Recently Updated | Latest updates first |
| Alphabetical | A-Z |

### 10.3 Quick Filters

#### Homepage Quick Filters (Chips)

- Restaurants
- Retail
- Services
- Events
- Open Now
- Near Me

### 10.4 Discovery Features

#### Featured Sections

| Section | Logic |
|---------|-------|
| Featured Businesses | Admin-curated or sponsored |
| Near You | Based on user location |
| New to Platform | Recently added businesses |
| Highly Rated | Top rated in last 30 days |
| Trending | Most viewed this week |
| With Offers | Active promotions |

#### Personalised Recommendations

| Signal | Usage |
|--------|-------|
| Saved Businesses | Recommend similar |
| Viewed Categories | Prioritise in results |
| Location History | Emphasise nearby areas |
| Language Preference | Highlight language matches |

### 10.5 SEO Requirements

#### Per-Business SEO

| Element | Specification |
|---------|---------------|
| Page Title | "{Business Name} - {Category} in Guildford" |
| Meta Description | First 155 chars of description |
| H1 | Business name |
| URL Slug | /business/{url-safe-name} |
| Canonical URL | Full URL to profile |
| Open Graph | Title, Description, Image |
| Schema.org | LocalBusiness structured data |

#### Structured Data

```json
{
  "@type": "LocalBusiness",
  "name": "Business Name",
  "address": { "@type": "PostalAddress", ... },
  "telephone": "+61...",
  "openingHours": "Mo-Fr 09:00-17:00",
  "priceRange": "$$",
  "aggregateRating": { "@type": "AggregateRating", ... }
}
```

---

## 11. Multilingual Support

### 11.1 Supported Languages

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

### 11.2 UI Translation

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

### 11.3 Content Translation

#### Business Content

| Content | Translation Method |
|---------|-------------------|
| Business Name | Manual by owner or auto-transliteration |
| Description | Manual by owner or auto-translation |
| Promotions | Manual by owner or auto-translation |
| Categories | Pre-translated (system) |

#### Auto-Translation

- Powered by Google Translate API or similar
- Indicated as "Auto-translated"
- Owner can override with manual translation
- Quality flag for community reporting

### 11.4 RTL Support

#### RTL Requirements

| Element | Behaviour |
|---------|-----------|
| Text Direction | Right-to-left for Arabic, Urdu |
| Layout Mirroring | Navigation, cards, forms |
| Icons | Direction-aware icons mirrored |
| Numbers | Left-to-right within RTL text |
| Mixed Content | Bidirectional text handling |

### 11.5 Language Selection

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

## 12. Technical Requirements

### 12.1 Platform Architecture

#### Frontend

| Requirement | Specification |
|-------------|---------------|
| Framework | Modern JavaScript framework (React, Vue, or similar) |
| Responsive Design | Mobile-first approach |
| PWA Capability | Installable, offline-capable |
| Browser Support | Chrome, Firefox, Safari, Edge (last 2 versions) |

#### Backend

| Requirement | Specification |
|-------------|---------------|
| API Architecture | RESTful API or GraphQL |
| Authentication | JWT-based authentication |
| Database | Relational (PostgreSQL) + Search (Elasticsearch) |
| File Storage | Cloud storage (AWS S3 or similar) |
| Caching | Redis for session and data caching |

### 12.2 Performance Requirements

| Metric | Target |
|--------|--------|
| Page Load Time | < 3 seconds on 3G |
| Time to Interactive | < 5 seconds |
| First Contentful Paint | < 1.5 seconds |
| Lighthouse Score | > 80 (Performance) |
| API Response Time | < 200ms (95th percentile) |

### 12.3 Scalability

| Requirement | Specification |
|-------------|---------------|
| Concurrent Users | Support 1,000+ simultaneous users |
| Business Profiles | Support 500+ businesses |
| User Accounts | Support 10,000+ users |
| Image Storage | 100GB+ capacity |
| Database Growth | Auto-scaling capability |

### 12.4 Mobile Experience

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

### 12.5 Offline Capability

| Feature | Offline Behaviour |
|---------|-------------------|
| Homepage | Cached version available |
| Business Profiles | Recently viewed available offline |
| Saved Businesses | Full offline access |
| Search | Limited to cached data |
| Actions | Queue for sync when online |

### 12.6 Accessibility (WCAG 2.1 AA)

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

---

## 13. Security & Privacy

### 13.1 Authentication

| Requirement | Specification |
|-------------|---------------|
| Password Hashing | bcrypt with cost factor 12+ |
| Password Requirements | 8+ chars, uppercase, number |
| Session Management | Secure, HTTP-only cookies |
| Session Timeout | 30 days (remember me) or 24 hours |
| Failed Login Lockout | 5 attempts, 15-minute lockout |
| Two-Factor Auth | Optional, TOTP-based |

### 13.2 Data Protection

| Requirement | Specification |
|-------------|---------------|
| Encryption at Rest | AES-256 for sensitive data |
| Encryption in Transit | TLS 1.3 |
| PII Handling | Minimise collection, encrypt storage |
| Data Retention | Defined retention periods |
| Data Deletion | Complete removal on request |
| Backup Encryption | Encrypted backups |

### 13.3 Privacy Compliance

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

### 13.4 Cookie Policy

| Cookie Type | Purpose | Consent Required |
|-------------|---------|------------------|
| Essential | Authentication, security | No |
| Functional | Language, preferences | No |
| Analytics | Usage tracking | Yes |
| Marketing | Advertising | Yes |

### 13.5 Security Headers

| Header | Value |
|--------|-------|
| Content-Security-Policy | Strict CSP rules |
| X-Frame-Options | DENY |
| X-Content-Type-Options | nosniff |
| Strict-Transport-Security | max-age=31536000 |
| Referrer-Policy | strict-origin-when-cross-origin |

---

## 14. Analytics & Reporting

### 14.1 Platform Analytics

#### Key Metrics

| Metric | Description |
|--------|-------------|
| Daily Active Users | Unique users per day |
| Monthly Active Users | Unique users per month |
| New Registrations | New accounts created |
| Session Duration | Average time on platform |
| Page Views | Total and by page |
| Bounce Rate | Single-page sessions |
| Search Queries | What users search for |
| Popular Businesses | Most viewed profiles |
| Event Attendance | RSVPs and check-ins |

#### Tracking Implementation

- Google Analytics 4 or privacy-focused alternative (Plausible, Fathom)
- Custom event tracking for key actions
- User journey tracking
- Conversion funnels

### 14.2 Business Analytics

See Section 5.4 for business-specific analytics.

### 14.3 Admin Reports

#### Standard Reports

| Report | Description | Frequency |
|--------|-------------|-----------|
| Platform Overview | Key metrics summary | Weekly |
| Business Health | Profile completeness, activity | Monthly |
| User Engagement | Registration, activity trends | Monthly |
| Content Moderation | Actions taken, queue status | Weekly |
| Event Performance | Attendance, engagement | Per event |
| Survey Results | Response summaries | Per survey |

#### Export Formats

- PDF (formatted report)
- CSV (raw data)
- Excel (formatted with charts)

#### Scheduled Reports

- Email delivery to specified recipients
- Daily, weekly, monthly options
- Custom date ranges

### 14.4 Data for Council/Chamber

#### CID Pilot Metrics

| Metric | Description |
|--------|-------------|
| Foot Traffic Impact | Before/after comparisons |
| Business Participation | Businesses onboarded and active |
| Community Engagement | User registrations and activity |
| Economic Indicators | Referral clicks, direction requests |
| Survey Insights | Aggregated survey results |

#### Reporting Requirements

- Quarterly progress reports
- End of pilot evaluation report
- Anonymised data only for external reporting

---

## 15. Integration Requirements

### 15.1 Google Business Profile API

#### Sync Capabilities

| Data | Direction | Frequency |
|------|-----------|-----------|
| Business Name | Import | Initial + on-demand |
| Address | Import | Initial + on-demand |
| Phone | Import | Initial + on-demand |
| Hours | Import | Initial + on-demand |
| Photos | Import | Initial + on-demand |
| Reviews | Import | Daily |
| Rating | Import | Daily |

#### Authentication

- OAuth 2.0 for business owner authorisation
- Store refresh tokens securely
- Handle token expiry gracefully

### 15.2 Facebook API

#### Sync Capabilities

| Data | Direction | Frequency |
|------|-----------|-----------|
| Page Info | Import | Initial + on-demand |
| Posts | Import | Hourly |
| Events | Import | Daily |
| Photos | Import | On-demand |

### 15.3 Instagram API

#### Sync Capabilities

| Data | Direction | Frequency |
|------|-----------|-----------|
| Profile Info | Import | Initial + on-demand |
| Posts | Import | Hourly |
| Hashtag Posts | Import | Hourly |

### 15.4 Email Service

#### Requirements

| Feature | Specification |
|---------|---------------|
| Provider | SendGrid, Mailgun, or similar |
| Templates | HTML email templates |
| Personalisation | Dynamic content insertion |
| Tracking | Open and click tracking |
| Unsubscribe | One-click unsubscribe |
| Bounce Handling | Automatic bounce management |

#### Email Types

| Email | Trigger |
|-------|---------|
| Welcome | Account registration |
| Verification | Email confirmation |
| Password Reset | Reset request |
| Notification Digest | Daily/weekly digest |
| Event Reminder | 1 day before event |
| Survey Invitation | Survey distribution |
| Business Alert | Profile incomplete reminder |

### 15.5 Maps Integration

#### Requirements

| Feature | Specification |
|---------|---------------|
| Provider | Google Maps or OpenStreetMap |
| Business Locations | Map markers for businesses |
| Directions | Link to directions |
| Geocoding | Address to coordinates |
| Distance Calculation | User to business distance |

### 15.6 Translation API

#### Requirements

| Feature | Specification |
|---------|---------------|
| Provider | Google Translate or similar |
| Languages | All supported languages |
| Usage | On-demand content translation |
| Caching | Cache translations for efficiency |
| Rate Limiting | Handle API limits |

---

## 16. Design Specifications

### 16.1 Colour Palette

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

### 16.2 Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| H1 | Montserrat | 32px | Bold |
| H2 | Montserrat | 26px | Bold |
| H3 | Montserrat | 22px | Semi-bold |
| Body | Open Sans | 16px | Regular |
| Small | Open Sans | 14px | Regular |
| Caption | Open Sans | 12px | Regular |
| Button | Open Sans | 16px | Semi-bold |

### 16.3 Component Specifications

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

### 16.4 Page Layouts

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
   - #MyGuildford posts
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

---

## 17. Messaging & Communication System

### 17.1 Overview

The messaging system enables direct communication between community members and businesses, facilitating enquiries, customer service, and community connection while maintaining privacy and safety.

### 17.2 Message Types

| Type | Participants | Use Case |
|------|--------------|----------|
| Business Enquiry | Community Member → Business | Pre-visit questions, service enquiries |
| Business Response | Business → Community Member | Replies to enquiries |
| Event Enquiry | Community Member → Event Organiser | Event-specific questions |
| Admin Broadcast | Admin → Users/Businesses | Platform announcements |

### 17.3 Business Enquiry System

#### Enquiry Form Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Subject | Select | Yes | Predefined categories: General Enquiry, Product/Service Question, Booking Request, Feedback, Other |
| Message | Text | Yes | Max 1000 characters |
| Preferred Contact | Select | No | Reply via platform, Email, Phone |
| Phone Number | Text | Conditional | Required if phone contact preferred |

#### Business Inbox Features

| Feature | Description |
|---------|-------------|
| Unified Inbox | All enquiries in one place |
| Unread Count | Badge showing unread messages |
| Quick Reply | Template responses for common questions |
| Mark as Read/Unread | Message status management |
| Archive | Move resolved conversations out of inbox |
| Search | Search messages by keyword, sender, date |
| Filter | Filter by status, subject category, date range |

#### Response Management

| Setting | Options |
|---------|---------|
| Auto-Response | Optional message sent immediately upon receiving enquiry |
| Response Time Goal | Business sets target (e.g., "Usually responds within 2 hours") |
| Response Rate | Displayed on profile (e.g., "Responds to 95% of messages") |
| Average Response Time | Calculated and displayed on profile |

### 17.4 Conversation Threading

| Feature | Description |
|---------|-------------|
| Thread View | All messages in conversation grouped together |
| Reply Chain | Clear parent-child message relationship |
| Timestamp | Date and time for each message |
| Read Receipt | Indicator when message has been read |
| Attachments | Support for images (max 3, 5MB each) |

### 17.5 Notification Settings

| Notification | Default | Options |
|--------------|---------|---------|
| New Message | On | Push, Email, Both, Off |
| Message Reminder | On | 24-hour reminder for unanswered messages |
| Daily Digest | Off | Summary of all messages |

### 17.6 Privacy & Safety

| Feature | Description |
|---------|-------------|
| No Direct Contact | Personal email/phone hidden until user chooses to share |
| Block User | Prevent further messages from specific user |
| Report Message | Flag inappropriate content for moderation |
| Spam Detection | Automated filtering of spam messages |
| Rate Limiting | Max 10 new conversations per user per day |

### 17.7 Business Messaging Analytics

| Metric | Description |
|--------|-------------|
| Total Enquiries | Messages received in period |
| Response Rate | Percentage of messages responded to |
| Average Response Time | Time to first response |
| Enquiry Categories | Breakdown by subject type |
| Peak Times | When most enquiries are received |

---

## 18. Deals & Promotions Hub

### 18.1 Overview

A centralised deals discovery system that aggregates promotions from all participating businesses, making it easy for community members to find and take advantage of local offers.

### 18.2 Deals Hub Features

#### Main Deals Page

| Section | Description |
|---------|-------------|
| Today's Deals | Active promotions valid today |
| Ending Soon | Deals expiring within 48 hours |
| New This Week | Recently added promotions |
| Most Popular | Deals with highest saves/views |
| Near You | Location-based deal recommendations |

#### Deal Card Display

| Element | Description |
|---------|-------------|
| Business Logo | Visual identifier |
| Business Name | Linked to profile |
| Deal Title | Headline of the offer |
| Discount Badge | e.g., "20% OFF", "BOGO", "FREE" |
| Valid Period | Start and end dates |
| Distance | From user's location |
| Save Button | Add to saved deals |
| Share Button | Share deal with others |

### 18.3 Deal Categories

| Category | Examples |
|----------|----------|
| Food & Drink | Restaurant specials, cafe discounts, meal deals |
| Retail | Store sales, product discounts |
| Services | Service discounts, package deals |
| Health & Beauty | Spa offers, salon discounts |
| Entertainment | Activity discounts, event specials |
| Family | Kid-friendly deals, family packages |

### 18.4 Flash Deals

#### Flash Deal Features

| Feature | Description |
|---------|-------------|
| Limited Time | Deals lasting 2-24 hours |
| Countdown Timer | Visual countdown on deal card |
| Quantity Limit | Optional limit on redemptions |
| Remaining Count | Show "X remaining" if limited |
| Push Notification | Alert followers of flash deals |

#### Flash Deal Rules

- Business can run max 2 flash deals per week
- Minimum 2-hour duration
- Must be approved within 1 hour (expedited moderation)
- Cannot overlap with another flash deal from same business

### 18.5 Deal Redemption

#### Redemption Methods

| Method | Description |
|--------|-------------|
| Show Screen | Display deal on phone at business |
| Unique Code | One-time use code generated per user |
| QR Code | Scannable code for business to verify |
| No Verification | Trust-based redemption |

#### Redemption Tracking

| Field | Description |
|-------|-------------|
| Views | Number of times deal was viewed |
| Saves | Number of users who saved deal |
| Redemptions | Verified redemption count (if tracked) |
| Conversion Rate | Redemptions / Views |

### 18.6 Personalised Deal Recommendations

| Signal | Usage |
|--------|-------|
| Saved Businesses | Prioritise deals from favourites |
| Category Interests | Show relevant deal categories |
| Past Redemptions | Recommend similar deals |
| Location | Emphasise nearby offers |
| Browsing History | Learn preferences over time |

### 18.7 Deal Alerts

#### User Alert Settings

| Setting | Description |
|---------|-------------|
| Flash Deal Alerts | Notify for all flash deals |
| Category Alerts | Notify for specific deal categories |
| Business Alerts | Notify for deals from followed businesses |
| Price Threshold | Notify for deals above X% discount |
| Proximity Alerts | Notify for deals within X distance |

#### Alert Delivery

| Channel | Options |
|---------|---------|
| Push Notification | Instant alert (if PWA installed) |
| Email | Instant, Daily Digest, Weekly Digest |
| In-App | Notification centre |

### 18.8 Business Deal Management

#### Deal Creation (Enhanced)

| Field | Type | Description |
|-------|------|-------------|
| Deal Type | Select | Standard, Flash Deal, Recurring |
| Feature on Hub | Checkbox | Request featuring on main deals page |
| Target Audience | Multi-select | All, Followers only, New customers |
| Redemption Method | Select | Show screen, Code, QR, None |
| Redemption Limit | Number | Optional cap on redemptions |

#### Deal Analytics

| Metric | Description |
|--------|-------------|
| Impressions | Times shown in deals hub |
| Click-through Rate | Views / Impressions |
| Save Rate | Saves / Views |
| Redemption Rate | Redemptions / Views |
| Revenue Impact | Estimated revenue from deal (optional input) |

---

## 19. Business-to-Business Networking

### 19.1 Overview

A dedicated networking space for local business owners to connect, collaborate, and support each other, strengthening the local business ecosystem.

### 19.2 Business Network Profile

#### Additional Business Fields

| Field | Type | Description |
|-------|------|-------------|
| Open to Networking | Toggle | Show in B2B directory |
| Looking For | Multi-select | Partnerships, Suppliers, Cross-promotion, Referrals, Mentorship |
| Can Offer | Multi-select | Same options as Looking For |
| Business Size | Select | Solo, 2-5 employees, 6-20, 20+ |
| Years in Guildford | Number | Time operating in precinct |
| Industry Connections | Multi-select | Industries interested in connecting with |

### 19.3 Business Directory (B2B View)

#### Directory Features

| Feature | Description |
|---------|-------------|
| B2B Search | Search businesses by networking criteria |
| Filter by Needs | Find businesses looking for what you offer |
| Filter by Offers | Find businesses offering what you need |
| Category Filter | Filter by business type |
| Connection Status | Show existing connections |

#### Directory Card (B2B)

| Element | Description |
|---------|-------------|
| Business Name | Linked to profile |
| Category | Primary business type |
| Looking For | Icons showing needs |
| Can Offer | Icons showing offerings |
| Mutual Connections | Shared business connections |
| Connect Button | Initiate connection request |

### 19.4 Business Connections

#### Connection Flow

1. Business A sends connection request with optional message
2. Business B receives notification
3. Business B accepts or declines
4. If accepted, both can now message directly
5. Connection visible on both profiles

#### Connection Management

| Action | Description |
|--------|-------------|
| View Connections | List of all connected businesses |
| Pending Requests | Incoming and outgoing requests |
| Remove Connection | Disconnect from business |
| Block Business | Prevent future requests |
| Export Contacts | Download connection list (CSV) |

### 19.5 Business Messaging (B2B)

#### B2B Inbox

| Feature | Description |
|---------|-------------|
| Separate from Customer Messages | Dedicated B2B inbox tab |
| Connection Required | Must be connected to message |
| Rich Messages | Support for attachments, links |
| Meeting Scheduler | Propose meeting times |
| File Sharing | Share documents (PDF, max 10MB) |

### 19.6 Collaboration Features

#### Joint Promotions

| Feature | Description |
|---------|-------------|
| Co-branded Deals | Create promotions with partner business |
| Split Visibility | Deal appears on both business profiles |
| Shared Analytics | Both businesses see performance data |
| Approval Workflow | Both parties must approve before publishing |

#### Referral Tracking

| Feature | Description |
|---------|-------------|
| Referral Links | Generate trackable referral links |
| Referral Dashboard | See referrals sent and received |
| Thank You Notes | Send appreciation for referrals |
| Referral Leaderboard | Optional visibility of top referrers |

### 19.7 Business Community Features

#### Discussion Forum (B2B)

| Feature | Description |
|---------|-------------|
| Topic Categories | General, Suppliers, Marketing, Operations, Local Issues |
| Post Types | Question, Discussion, Recommendation, Announcement |
| Replies & Comments | Threaded discussions |
| Upvoting | Surface helpful content |
| Moderator Oversight | Chamber/Council staff can moderate |

#### Resource Sharing

| Resource Type | Description |
|---------------|-------------|
| Recommended Suppliers | Share supplier contacts |
| Local Service Providers | Recommend accountants, designers, etc. |
| Templates & Documents | Share useful business templates |
| Bulk Buy Opportunities | Coordinate group purchasing |

### 19.8 Business Events

#### B2B Event Types

| Type | Description |
|------|-------------|
| Networking Events | Chamber-organised meetups |
| Workshop/Training | Skill-building sessions |
| Business Breakfasts | Morning networking |
| Industry Meetups | Category-specific gatherings |

#### B2B Event Features

| Feature | Description |
|---------|-------------|
| Business RSVP | RSVP as business (not personal) |
| Attendee List | See which businesses are attending |
| Post-Event Connections | Suggest connections with attendees |
| Event Discussion | Pre/post event discussion thread |

### 19.9 Chamber Integration

| Feature | Description |
|---------|-------------|
| Chamber Announcements | Official communications to businesses |
| Member Benefits | Display Chamber member status |
| Chamber Events | Highlighted in B2B calendar |
| Resources | Chamber resources and documents |
| Contact Chamber | Direct line to Chamber staff |

---

## 20. Emergency & Crisis Communication

### 20.1 Overview

A critical communication system for urgent alerts affecting the Guildford community, ensuring residents and businesses receive timely notifications during emergencies.

### 20.2 Alert Types

| Alert Level | Description | Visual | Use Case |
|-------------|-------------|--------|----------|
| **Critical** | Immediate danger to life/safety | Red banner, persistent | Natural disaster, major emergency |
| **Warning** | Significant disruption or risk | Orange banner | Severe weather, major road closure |
| **Advisory** | Important information | Yellow banner | Planned disruption, minor incident |
| **Information** | General updates | Blue banner | Recovery updates, situation resolved |

### 20.3 Alert Sources

| Source | Alert Types | Approval Required |
|--------|-------------|-------------------|
| Platform Admin | All levels | No |
| Cumberland Council | All levels | No (trusted source) |
| NSW Government | Critical, Warning | No (integrated feed) |
| Chamber of Commerce | Advisory, Information | Admin approval |
| Business Owners | Information (own business only) | No |

### 20.4 Alert Content

#### Alert Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Alert Level | Select | Yes | Critical, Warning, Advisory, Information |
| Title | Text | Yes | Max 100 characters, clear and concise |
| Summary | Text | Yes | Max 280 characters (SMS-friendly) |
| Full Details | Rich Text | Yes | Complete information, max 2000 chars |
| Affected Area | Multi-select | Yes | Specific suburbs/streets or "All Guildford" |
| Start Time | DateTime | Yes | When alert becomes active |
| Expected End | DateTime | No | Estimated resolution time |
| Source | Text | Yes | Organisation issuing alert |
| External Links | URLs | No | Links to official sources |
| Map Area | Polygon | No | Visual representation of affected area |

#### Alert Updates

| Feature | Description |
|---------|-------------|
| Update Thread | All updates linked to original alert |
| Update Notification | Users notified of significant updates |
| Status Changes | Clear indication when situation changes |
| Resolution Notice | Final update when incident resolved |

### 20.5 Alert Distribution

#### Display Locations

| Location | Behaviour |
|----------|-----------|
| Homepage Banner | Persistent banner for active Critical/Warning alerts |
| App Header | Alert icon with count, colour indicates severity |
| Alert Centre | Dedicated page for all active and recent alerts |
| Business Profiles | Relevant alerts shown on affected business pages |
| Map View | Visual overlay of affected areas |

#### Notification Channels

| Channel | Critical | Warning | Advisory | Information |
|---------|----------|---------|----------|-------------|
| Push Notification | Forced | Default On | Default Off | Off |
| SMS (opt-in) | Yes | Yes | No | No |
| Email | Immediate | Immediate | Digest | Digest |
| In-App | Prominent | Prominent | Standard | Standard |

### 20.6 User Alert Preferences

| Setting | Description |
|---------|-------------|
| SMS Alerts | Opt-in for SMS (Critical/Warning only) |
| Phone Number | Required for SMS alerts |
| Location-Based | Only receive alerts for specified area |
| Alert Categories | Choose alert types to receive |
| Quiet Hours | No non-critical alerts during specified hours |

### 20.7 Business Emergency Features

#### Business Status Updates

| Status | Description | Display |
|--------|-------------|---------|
| Operating Normally | Default status | None |
| Modified Hours | Temporary hour changes | Yellow badge |
| Limited Services | Some services unavailable | Orange badge |
| Temporarily Closed | Closed due to emergency | Red badge |
| Closed Until Further Notice | Extended closure | Red badge + date unknown |

#### Quick Update Feature

| Feature | Description |
|---------|-------------|
| One-Tap Status | Quick status change buttons |
| Auto-Notification | Followers notified of status change |
| Expected Reopening | Optional reopening date/time |
| Update Message | Brief explanation (max 280 chars) |
| Social Sync | Option to post update to social media |

### 20.8 Community Safety Features

#### Check-In System (Major Emergencies)

| Feature | Description |
|---------|-------------|
| "I'm Safe" Button | Users can mark themselves safe |
| Business Check-In | Businesses confirm status |
| Community View | See check-in status (privacy-controlled) |
| Family/Friends | Share status with specified contacts |

#### Resource Information

| Resource | Description |
|----------|-------------|
| Emergency Contacts | Police, Fire, Ambulance, SES |
| Evacuation Routes | Links to official evacuation info |
| Relief Centres | Location of emergency shelters |
| Council Contacts | Direct council emergency line |

### 20.9 Alert Analytics (Admin)

| Metric | Description |
|--------|-------------|
| Alert Reach | Users who viewed alert |
| Notification Delivery | Success rate by channel |
| Engagement | Clicks on alert for details |
| Response Time | Time from incident to alert publication |
| Resolution Time | Duration of incident |

### 20.10 Integration with External Systems

| System | Integration |
|--------|-------------|
| NSW Alerts | Feed integration for relevant alerts |
| Bureau of Meteorology | Severe weather warnings |
| Transport NSW | Major transport disruptions |
| Council Systems | Direct integration for council alerts |

---

## Appendix A: Data Models

### Business

```
Business {
  id: UUID
  name: String
  slug: String
  description: Text (multilingual)
  category_primary: Reference
  categories_secondary: [Reference]
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
  status: Enum (active, pending, suspended)
  claimed: Boolean
  owner: Reference (User)
  created_at: DateTime
  updated_at: DateTime
  verified_at: DateTime
}
```

### User

```
User {
  id: UUID
  email: String
  password_hash: String
  display_name: String
  profile_photo: Image
  language_preference: String
  suburb: String
  interests: [String]
  notification_preferences: NotificationPrefs
  role: Enum (community, business_owner, moderator, admin)
  status: Enum (active, suspended, pending)
  email_verified: Boolean
  created_at: DateTime
  last_login: DateTime
}
```

### Event

```
Event {
  id: UUID
  title: String
  description: Text (multilingual)
  category: Reference
  start_time: DateTime
  end_time: DateTime
  location_type: Enum (physical, online, hybrid)
  venue: Address
  linked_business: Reference (Business)
  image: Image
  ticket_url: URL
  cost: String
  capacity: Integer
  age_restriction: String
  accessibility: [String]
  recurrence: RecurrenceRule
  created_by: Reference (User)
  created_at: DateTime
  updated_at: DateTime
}
```

### Message

```
Message {
  id: UUID
  conversation_id: UUID
  sender_type: Enum (user, business)
  sender_id: UUID
  recipient_type: Enum (user, business)
  recipient_id: UUID
  subject_category: Enum (general, product_question, booking, feedback, other)
  content: Text
  attachments: [Image]
  read_at: DateTime
  created_at: DateTime
}
```

### Conversation

```
Conversation {
  id: UUID
  business_id: Reference (Business)
  user_id: Reference (User)
  subject: String
  status: Enum (active, archived, blocked)
  last_message_at: DateTime
  unread_count_business: Integer
  unread_count_user: Integer
  created_at: DateTime
}
```

### Deal

```
Deal {
  id: UUID
  business_id: Reference (Business)
  title: String
  description: Text (multilingual)
  deal_type: Enum (standard, flash, recurring)
  discount_type: Enum (percentage, fixed, bogo, free_item)
  discount_value: Number
  category: Reference (DealCategory)
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
```

### BusinessConnection

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
```

### BusinessNetworkProfile

```
BusinessNetworkProfile {
  id: UUID
  business_id: Reference (Business)
  open_to_networking: Boolean
  looking_for: [Enum] (partnerships, suppliers, cross_promotion, referrals, mentorship)
  can_offer: [Enum] (partnerships, suppliers, cross_promotion, referrals, mentorship)
  business_size: Enum (solo, small_2_5, medium_6_20, large_20_plus)
  years_in_guildford: Integer
  industry_connections: [String]
  created_at: DateTime
  updated_at: DateTime
}
```

### Alert

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
```

### BusinessEmergencyStatus

```
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
```

---

## Appendix B: API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/register | Register new user |
| POST | /auth/login | User login |
| POST | /auth/logout | User logout |
| POST | /auth/forgot-password | Request password reset |
| POST | /auth/reset-password | Reset password |
| POST | /auth/verify-email | Verify email address |
| GET | /auth/me | Get current user |

### Businesses

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /businesses | List businesses |
| GET | /businesses/:id | Get business details |
| POST | /businesses | Create business (admin) |
| PUT | /businesses/:id | Update business |
| DELETE | /businesses/:id | Delete business (admin) |
| POST | /businesses/:id/claim | Claim business |
| GET | /businesses/:id/analytics | Get business analytics |

### Events

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /events | List events |
| GET | /events/:id | Get event details |
| POST | /events | Create event |
| PUT | /events/:id | Update event |
| DELETE | /events/:id | Delete event |
| POST | /events/:id/rsvp | RSVP to event |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /users/:id | Get user profile |
| PUT | /users/:id | Update user profile |
| GET | /users/:id/saved | Get saved businesses |
| POST | /users/:id/saved | Save business |
| DELETE | /users/:id/saved/:businessId | Remove saved business |

### Search

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /search/businesses | Search businesses |
| GET | /search/events | Search events |
| GET | /search/suggestions | Get autocomplete suggestions |

### Messages

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /conversations | List user's conversations |
| GET | /conversations/:id | Get conversation with messages |
| POST | /conversations | Start new conversation |
| POST | /conversations/:id/messages | Send message in conversation |
| PUT | /conversations/:id/read | Mark conversation as read |
| PUT | /conversations/:id/archive | Archive conversation |
| POST | /conversations/:id/block | Block user from conversation |
| GET | /businesses/:id/inbox | Get business inbox (owner only) |
| GET | /businesses/:id/inbox/analytics | Get messaging analytics |

### Deals

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /deals | List all active deals |
| GET | /deals/featured | Get featured/today's deals |
| GET | /deals/flash | Get active flash deals |
| GET | /deals/:id | Get deal details |
| POST | /deals | Create deal (business owner) |
| PUT | /deals/:id | Update deal |
| DELETE | /deals/:id | Cancel deal |
| POST | /deals/:id/save | Save deal to user's list |
| DELETE | /deals/:id/save | Remove deal from saved |
| POST | /deals/:id/redeem | Record deal redemption |
| GET | /deals/:id/analytics | Get deal performance analytics |
| GET | /businesses/:id/deals | Get deals for specific business |
| GET | /users/:id/saved-deals | Get user's saved deals |

### Business Networking (B2B)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /b2b/directory | List businesses open to networking |
| GET | /b2b/profile/:businessId | Get B2B network profile |
| PUT | /b2b/profile/:businessId | Update B2B network profile |
| GET | /b2b/connections | List business connections |
| POST | /b2b/connections | Send connection request |
| PUT | /b2b/connections/:id | Accept/decline connection |
| DELETE | /b2b/connections/:id | Remove connection |
| GET | /b2b/messages | Get B2B inbox |
| POST | /b2b/messages | Send B2B message |
| GET | /b2b/forum | List forum topics |
| GET | /b2b/forum/:topicId | Get forum topic with replies |
| POST | /b2b/forum | Create forum topic |
| POST | /b2b/forum/:topicId/replies | Reply to forum topic |
| GET | /b2b/events | List B2B events |
| POST | /b2b/referrals | Create referral tracking link |
| GET | /b2b/referrals | Get referral statistics |

### Alerts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /alerts | List active alerts |
| GET | /alerts/active | Get currently active alerts by severity |
| GET | /alerts/:id | Get alert details |
| POST | /alerts | Create alert (admin/council) |
| PUT | /alerts/:id | Update alert |
| POST | /alerts/:id/resolve | Mark alert as resolved |
| GET | /alerts/history | Get past alerts |
| PUT | /users/:id/alert-preferences | Update alert notification preferences |
| POST | /alerts/:id/check-in | User safety check-in |
| GET | /businesses/:id/emergency-status | Get business emergency status |
| PUT | /businesses/:id/emergency-status | Update business emergency status |

---

## Appendix C: Glossary

| Term | Definition |
|------|------------|
| CID | Community Improvement District |
| DCIH | Digital Community Improvement Hub |
| GMB | Google My Business (now Google Business Profile) |
| PWA | Progressive Web App |
| RTL | Right-to-Left (text direction) |
| RSVP | Répondez s'il vous plaît (event response) |
| SEO | Search Engine Optimisation |
| WCAG | Web Content Accessibility Guidelines |

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | January 2026 | Andrew | Initial comprehensive specification |
| 1.1 | January 2026 | Andrew | Added Messaging System, Deals Hub, B2B Networking, Emergency Communications |

---

*This document consolidates all platform requirements and should be used as the primary reference for development planning.*
