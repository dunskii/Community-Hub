# Phase 8 Study: Events & Calendar System

**Date:** 11 March 2026
**Status:** Not Yet Started (0%)
**Specification Reference:** §15 (Events & Calendar System)
**Data Models:** Appendix A.3 (Event, RecurrenceRule)
**API Endpoints:** Appendix B.3 (9 core endpoints)
**Estimated Tasks:** 30-35 tasks
**Part of:** MVP 4 (Events & Messaging)

---

## Overview

Phase 8 is the Events & Calendar System implementation, following the completion of Phase 7 (Business Owner Features). Phase 8 will enable community users and business owners to create, discover, and interact with local events through a comprehensive calendar interface.

**Key Features:**
- Event creation with multiple location types (physical, online, hybrid)
- Recurring event support with various patterns
- RSVP system with capacity management
- Calendar views (month, week, day)
- Event search and filtering
- ICS export for calendar integration
- Attendee management for event creators

---

## Architecture Overview

### Components Involved

1. **Database Models:** 2 models + 3 enums
   - Event (main entity with 22+ fields)
   - EventRSVP (RSVP tracking)
   - Enums: EventStatus, LocationType, RSVPStatus

2. **Backend Services:** 1 primary service
   - EventService (~800 lines)
     - CRUD operations
     - Recurrence rule handling
     - RSVP management
     - ICS export formatting

3. **API Routes:** 9 endpoints
   - 5 public/user endpoints
   - 2 owner/creator endpoints
   - 1 export endpoint
   - 1 attendee list endpoint

4. **Frontend Components:** 8 components
   - EventCard, EventList
   - EventDetailPage
   - EventForm (creation/editing)
   - CalendarView (month, week, day)
   - RSVPButton
   - EventFilters
   - EventSearch

5. **Frontend Pages:** 2 pages
   - EventsListingPage
   - EventDetailPage

---

## Data Models

### Event Model (Spec A.3)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | Yes | Primary key |
| title | String (max 100) | Yes | Event name |
| description | Text | Yes | Rich text, max 5000 chars |
| category | Reference (Category) | Yes | FK to Category table |
| startTime | DateTime | Yes | Event start (UTC) |
| endTime | DateTime | Yes | Event end (UTC) |
| locationType | Enum | Yes | PHYSICAL \| ONLINE \| HYBRID |
| venue | JSON | Conditional | Required if locationType = PHYSICAL |
| onlineUrl | URL | Conditional | Required if locationType = ONLINE \| HYBRID |
| linkedBusinessId | Reference (Business) | Optional | FK to Business |
| imageUrl | String | Optional | Event poster/cover photo |
| ticketUrl | URL | Optional | External ticket booking link |
| cost | String | Optional | "Free", "$50", "Variable", etc. |
| capacity | Integer | Optional | Max attendees |
| ageRestriction | String | Optional | "18+", "13+", "All ages", etc. |
| accessibility | String[] | Optional | ["wheelchair_access", "hearing_loop"] |
| recurrence | JSON | Optional | RecurrenceRule config |
| createdById | Reference (User) | Yes | Event creator |
| status | Enum | Yes | PENDING \| ACTIVE \| CANCELLED \| PAST |
| createdAt | DateTime | Yes | Timestamp |
| updatedAt | DateTime | Yes | Timestamp |

**Indexes:**
- (status, startTime) - filtering active/upcoming events
- (locationType, startTime) - filtering by location
- (linkedBusinessId) - business's events list
- (createdById) - user's created events
- (categoryId) - events by category

**Validation Rules:**
- title: 1-100 characters
- description: 50-5000 characters
- startTime < endTime
- If PHYSICAL: venue address required
- If ONLINE: onlineUrl required
- capacity: if present, must be > 0

### RecurrenceRule (Embedded JSON)

```json
{
  "frequency": "WEEKLY|DAILY|MONTHLY|YEARLY|NONE",
  "interval": 1,
  "daysOfWeek": [0,1,2,3,4,5,6],
  "endDate": "2026-12-31T23:59:59Z",
  "exceptions": ["2026-03-15T19:00:00Z"]
}
```

**Patterns Supported:**
| Pattern | Description |
|---------|-------------|
| NONE | Single occurrence |
| DAILY | Every day |
| WEEKLY | Same day each week |
| MONTHLY | Same date or day each month |
| YEARLY | Annual event |

### EventRSVP Model

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | Yes | Primary key |
| eventId | Reference (Event) | Yes | FK to Event |
| userId | Reference (User) | Yes | FK to User |
| status | Enum | Yes | GOING \| INTERESTED \| NOT_GOING |
| guestCount | Integer | No | Additional guests (default 1) |
| rsvpDate | DateTime | Yes | When RSVP was made |
| createdAt | DateTime | Yes | Timestamp |
| updatedAt | DateTime | Yes | Timestamp |

**Constraints:**
- Unique: (eventId, userId)

---

## API Endpoints

**Base:** `/api/v1/events`

### 1. GET /events (List Events)
- **Auth:** Public
- **Query Params:**
  - `dateFrom` (ISO datetime)
  - `dateTo` (ISO datetime)
  - `category` (string)
  - `locationType` (enum)
  - `distance` (number, km)
  - `includePast` (boolean)
  - `page`, `limit`
  - `sort` (upcoming, distance, newest, featured)
- **Response:** Paginated event list
- **Rate Limit:** 30/minute
- **Caching:** 5-minute Redis TTL

### 2. GET /events/:id (Get Event Details)
- **Auth:** Public
- **Response:** Full event object with attendee count, RSVP status (if logged in)
- **Rate Limit:** 60/minute
- **Caching:** 10-minute TTL

### 3. POST /events (Create Event)
- **Auth:** User (logged in)
- **Body:** All event fields
- **Validations:**
  - Title: 1-100 chars
  - Description: 50-5000 chars
  - startTime < endTime
  - Future event (startTime > now)
  - Category exists
  - If linkedBusinessId: user must be business owner
- **Rate Limit:** 5/minute
- **Status:** Events enter "PENDING" status, require moderation

### 4. PUT /events/:id (Update Event)
- **Auth:** Owner only (createdById = current user)
- **Constraints:** Cannot change startTime if event has RSVPs
- **Rate Limit:** 10/minute

### 5. DELETE /events/:id (Delete Event)
- **Auth:** Owner only
- **Side Effects:** Notify all RSVPs about cancellation
- **Rate Limit:** 5/minute

### 6. POST /events/:id/rsvp (RSVP to Event)
- **Auth:** User (logged in)
- **Body:**
  ```json
  {
    "status": "GOING|INTERESTED|NOT_GOING",
    "guestCount": 1
  }
  ```
- **Validations:**
  - Event exists and is active
  - Capacity check if guestCount provided
  - User cannot RSVP multiple times (update existing)
- **Rate Limit:** 20/minute

### 7. DELETE /events/:id/rsvp (Cancel RSVP)
- **Auth:** User (logged in)
- **Rate Limit:** 10/minute

### 8. GET /events/:id/attendees (List Event Attendees)
- **Auth:** Owner only
- **Query Params:** `status`, `page`, `limit`
- **Response:** Attendee list with user info, RSVP status, guest count
- **Rate Limit:** 30/minute

### 9. GET /events/:id/export (Export Event to ICS)
- **Auth:** Public
- **Response:** ICS/iCalendar format file (RFC 5545)
- **Rate Limit:** 20/minute

---

## Business Rules

### Event Creation
1. Only logged-in users can create events
2. Events must have startTime in the future
3. startTime must be before endTime
4. At least 50 characters in description
5. Category must exist with type = "EVENT"
6. If linkedBusinessId: user must be business owner
7. New events enter "PENDING" status
8. Moderators approve/reject within 48 hours

### Event Display
1. Only "ACTIVE" events shown in listings
2. Past events automatically set to "PAST" status (daily batch job)
3. "PENDING" events hidden from public, visible to creator and moderators
4. "CANCELLED" events show cancellation notice

### RSVP Rules
1. One RSVP per user per event (update existing)
2. Cannot RSVP after event start time
3. If capacity set: Total RSVPs (GOING) cannot exceed capacity
4. If at capacity: "INTERESTED" still allowed, "GOING" rejected
5. Guest count must be reasonable (≤10)

### Recurrence Rules
1. Patterns can be created at event creation
2. Cannot edit recurrence on existing events (delete and recreate)
3. Exception dates stored in recurrence.exceptions array
4. Cancelling recurring event only cancels single instance

---

## Frontend Components

### EventCard
- Displays: Image, title, date/time, location type badge, capacity indicator, RSVP count
- Responsive: Mobile (1 col), tablet (2 col), desktop (3+ col)
- States: Loading skeleton, clickable, hover effects

### EventList
- Wraps multiple EventCard components
- Infinite scroll or pagination toggle
- Filter UI integration
- Sort dropdown
- Empty state handling

### EventDetailPage
- Full event info with rich text description
- Date/time display with timezone awareness
- Location info (map if physical, link if online)
- Host/organizer information
- Capacity and spots remaining
- RSVP button with guest count input
- Share buttons (Facebook, Twitter, WhatsApp, copy link)
- Export options (ICS, Google Calendar, Apple Calendar)
- Related events section
- Accessibility features list

### EventForm
- Multi-step form wizard
- Title input (1-100 chars) with character counter
- Description editor (rich text, 50-5000 chars)
- Category selector (EVENT type categories)
- Date/time pickers with timezone selection
- Location type selector (radio: physical/online/hybrid)
- Image upload (1200x630px recommended)
- Optional fields (cost, capacity, ticket URL, age restriction)
- Accessibility features (checkboxes)
- Recurrence setup

### CalendarView
- Month view (traditional grid)
- Week view (hourly timeslots, 7 columns)
- Day view (detailed, 30-min timeslots)
- Navigation (prev/next, date picker)
- Event indicators (colored dots)
- Responsive (mobile: day/week, desktop: all views)

### RSVPButton
- Dropdown: Going / Interested / Not Going
- Guest count input
- Confirmation toast
- Error handling (at capacity)
- Auth gate (login prompt)

### EventFilters
- Category multi-select
- Date range picker
- Location type checkboxes
- Distance slider (1-50km)
- Free events toggle
- Accessibility filter
- Clear all button

### EventSearch
- Debounced 300ms full-text search
- Autocomplete dropdown
- Recent searches (localStorage)
- Keyboard navigation

---

## Security & Compliance

### Authentication & Authorization
- Event creation: User role or higher
- Event editing: Owner-only (createdById = current user)
- RSVP operations: User role required
- Attendee list: Owner-only
- Moderation: Moderator/Admin role required

### Data Validation (Zod Schemas)
- EventCreateValidator (20+ fields)
- EventUpdateValidator (subset of create)
- EventRSVPValidator (status enum, guestCount)
- RecurrenceRuleValidator (frequency, interval, endDate)

### Rate Limiting
- Event creation: 5/minute per user
- RSVP: 20/minute per user
- List/search: 30/minute global
- Get details: 60/minute per event
- Export: 20/minute

### Input Sanitization
- Description: HTML sanitized (isomorphic-dompurify)
- Title: Plain text, no HTML
- URLs: Validated format
- Addresses: Standard validation

### Privacy
- Attendee list: Owner-only (email visible only to owner)
- RSVP data: User can hide status from other attendees
- IP anonymization: Analytics events anonymized after 90 days

### Audit Logging
- All event CRUD operations logged
- RSVP changes logged
- Moderation decisions logged

---

## Location-Agnostic Architecture

### Configuration (config/platform.json)
```json
{
  "features": {
    "events": {
      "enabled": true,
      "requireModeration": true,
      "defaultCalendarView": "month",
      "maxEventsPerCreator": 10,
      "eventValidityDays": 365
    }
  },
  "timezone": "Australia/Sydney"
}
```

### Hardcoded Values to Avoid
- NO event category names (use Category table and i18n)
- NO timezone defaults (use config or database)
- NO distance calculations based on specific coordinates
- NO fixed event URL patterns (use dynamic routing)

---

## Multilingual Support

### i18n Requirements
1. Create `events.json` for all 10 languages
2. Estimated 120+ keys:
   - Navigation: events.nav.upcoming, events.nav.calendar, events.nav.create
   - Form labels: events.form.title, events.form.description, etc.
   - RSVP: events.rsvp.going, events.rsvp.interested, events.rsvp.notGoing
   - Calendar: events.calendar.month, events.calendar.week, events.calendar.day
   - Status: events.status.active, events.status.pending, events.status.cancelled
   - Messages: events.message.rsvpConfirmed, events.error.atCapacity

3. Date/Time Formatting:
   - Use i18n.language for date locale
   - Display times in user's timezone (store as UTC)
   - Smart formatting: "Today", "Tomorrow", "Next week"

4. RTL Support:
   - Calendar grid direction: RTL for Arabic/Urdu
   - Form field alignment for RTL
   - Event detail page layout for RTL

---

## Accessibility (WCAG 2.1 AA)

### Keyboard Navigation
- Tab through form fields (logical order)
- Calendar: arrow keys to navigate dates/timeslots
- Escape to close modals/dropdowns
- Enter to submit forms, select dates, toggle RSVP

### Screen Reader Support
- Semantic HTML (nav, section, article)
- ARIA labels for all interactive elements
- ARIA live regions for dynamic content
- Form field labels linked with htmlFor
- Error messages with role="alert"
- Calendar: role="grid" with proper aria-rowindex/colindex

### Visual
- 4.5:1 color contrast for text
- 3:1 for UI elements
- 2px focus indicators
- 44px minimum touch targets

### Testing
- jest-axe tests for all components (0 violations)
- Screen reader testing (NVDA, JAWS, VoiceOver)
- Keyboard-only navigation testing

---

## Performance Targets

- **Page Load:** <3s on 3G
- **Search Results:** <200ms (p95) with Redis caching
- **Calendar Month View:** <500ms to render 40+ events
- **RSVP Response:** <100ms (optimistic UI)
- **Export ICS:** <1s for events up to 1 year
- **Lighthouse Score:** >80

### Optimizations
- Elasticsearch for event search
- Redis caching: 5-min TTL for event lists
- Database indexes on key query fields
- Frontend lazy loading for event images
- Code splitting: EventPages loaded separately
- Pagination: 20 events per page default

---

## Dependencies

### Required (Complete)
- ✅ Phase 1: Foundation
- ✅ Phase 2: Authentication (RSVP requires login)
- ✅ Phase 3: Design System (UI components)
- ✅ Phase 5: Search (search architecture)
- ✅ Phase 6: User Engagement (moderation infrastructure)
- ✅ Phase 7: Business Owner (for business-linked events)

### Downstream (Depend on Phase 8)
- Phase 9: Messaging (owners message attendees)
- Phase 12: Social Media (event sharing)
- Phase 15: Admin Dashboard (event moderation)
- Phase 16: Google Calendar API integration

---

## Key Files to Create/Modify

### Database
- `packages/backend/prisma/schema.prisma` - Add Event, EventRSVP models, enums

### Backend
- `packages/backend/src/services/event-service.ts` (~800 lines)
- `packages/backend/src/services/event-service.test.ts` (100+ tests)
- `packages/backend/src/routes/events.ts` (150+ lines, 9 endpoints)
- `packages/backend/src/routes/__tests__/events.test.ts` (80+ tests)
- `packages/backend/src/validators/event.validator.ts` (150+ lines)

### Frontend Components
- `packages/frontend/src/components/events/EventCard.tsx`
- `packages/frontend/src/components/events/EventList.tsx`
- `packages/frontend/src/components/events/EventForm.tsx`
- `packages/frontend/src/components/events/CalendarView.tsx`
- `packages/frontend/src/components/events/RSVPButton.tsx`
- `packages/frontend/src/components/events/EventFilters.tsx`
- `packages/frontend/src/components/events/EventSearch.tsx`

### Frontend Pages
- `packages/frontend/src/pages/EventsListingPage.tsx`
- `packages/frontend/src/pages/EventDetailPage.tsx`

### Frontend Services
- `packages/frontend/src/services/event-service.ts`

### i18n
- `packages/frontend/src/i18n/locales/*/events.json` (10 languages)

---

## Implementation Roadmap

### Phase 8.1: Data Models & Backend (5-7 days)
1. Add Event, EventRSVP enums to Prisma schema
2. Add Event, EventRSVP models with indexes
3. Create EventService (CRUD, RSVP, query helpers)
4. Create event validators (Zod)
5. Write 50+ backend unit tests

### Phase 8.2: API Routes & Integration (4-6 days)
1. Implement 9 API endpoints
2. Add rate limiters for event operations
3. Write 40+ integration tests
4. Email notifications (RSVP, event updates)
5. ICS export formatting

### Phase 8.3: Frontend Components (5-7 days)
1. Create 7 reusable components
2. Integrate with API service layer
3. Add Tailwind styling with responsive design
4. Write 150+ component tests
5. jest-axe accessibility tests (0 violations)

### Phase 8.4: Frontend Pages & Features (4-5 days)
1. Create EventsListingPage with filtering, sorting, search
2. Create EventDetailPage with RSVP, sharing, export
3. Mobile-first responsive design
4. Write 50+ page tests

### Phase 8.5: Internationalization (2-3 days)
1. Create events.json for all 10 languages
2. Add i18n key references to components/pages
3. Test RTL layout (Arabic, Urdu)

### Phase 8.6: Testing & QA (3-4 days)
1. Full test suite: 300+ tests
2. Accessibility audit
3. Security review
4. Performance testing
5. Manual QA testing

**Total Estimated Effort:** 23-32 days (3-4 weeks)

---

## Notes for Implementation

1. **Recurrence Handling:** Complex logic - consider a library like `rrule` for recurring event expansion
2. **Timezone Management:** Store all times as UTC in database, convert on display using user's timezone
3. **Capacity Management:** Real-time checks needed to prevent overbooking race conditions
4. **ICS Export:** Use RFC 5545 spec strictly for calendar compatibility
5. **Calendar Grid:** Consider using a library like `react-big-calendar` or building custom with CSS Grid
6. **Image Uploads:** Reuse existing FileUpload component and media service from Phase 4
