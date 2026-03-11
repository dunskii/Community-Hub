# Phase 8: Events & Calendar System - Implementation Plan

**Date:** 11 March 2026
**Specification Reference:** §15 (Events & Calendar System)
**Data Models:** Appendix A.3 (Event, RecurrenceRule)
**API Endpoints:** Appendix B.3 (9 endpoints)
**Estimated Duration:** 23-30 days (4-5 weeks)
**Estimated Tasks:** 35+ tasks

---

## Executive Summary

Phase 8 implements the Events & Calendar System for the Community Hub platform. This plan follows established patterns from Phases 6 and 7, ensuring consistency in code structure, naming conventions, and architecture.

**Key Deliverables:**
- Event management (CRUD with recurrence support)
- RSVP system with capacity management
- Calendar views (month, week, day)
- ICS export for calendar integration
- 10-language internationalization
- 300+ tests with WCAG 2.1 AA compliance

---

## Phase 8.1: Database Layer (Days 1-3)

**Objective:** Create Prisma schema additions for Event and EventRSVP models.

### Task 8.1.1: Add Event-Related Enums
- **File:** `packages/backend/prisma/schema.prisma`
- **Dependencies:** None
- **Complexity:** Simple
- **Pattern:** Phase 6/7 enum definitions
- **Enums to add:**
  ```prisma
  enum EventStatus {
    PENDING
    ACTIVE
    CANCELLED
    PAST
  }

  enum LocationType {
    PHYSICAL
    ONLINE
    HYBRID
  }

  enum RSVPStatus {
    GOING
    INTERESTED
    NOT_GOING
  }

  enum RecurrenceFrequency {
    NONE
    DAILY
    WEEKLY
    MONTHLY
    YEARLY
  }
  ```

### Task 8.1.2: Add Event Model
- **File:** `packages/backend/prisma/schema.prisma`
- **Dependencies:** 8.1.1
- **Complexity:** Complex
- **Pattern:** Business model structure
- **Model:**
  ```prisma
  model Event {
    id               String        @id @default(uuid())
    title            String        @db.VarChar(100)
    description      String        @db.Text
    categoryId       String
    category         Category      @relation(fields: [categoryId], references: [id])
    startTime        DateTime
    endTime          DateTime
    locationType     LocationType
    venue            Json?         // { street, suburb, state, postcode, lat, lng }
    onlineUrl        String?
    linkedBusinessId String?
    linkedBusiness   Business?     @relation(fields: [linkedBusinessId], references: [id])
    imageUrl         String?
    ticketUrl        String?
    cost             String?       @db.VarChar(50)
    capacity         Int?
    ageRestriction   String?       @db.VarChar(20)
    accessibility    String[]
    recurrence       Json?         // RecurrenceRule
    createdById      String
    createdBy        User          @relation(fields: [createdById], references: [id])
    status           EventStatus   @default(PENDING)
    rsvps            EventRSVP[]
    createdAt        DateTime      @default(now())
    updatedAt        DateTime      @updatedAt

    @@index([status, startTime])
    @@index([locationType, startTime])
    @@index([linkedBusinessId])
    @@index([createdById])
    @@index([categoryId])
    @@index([startTime])
  }
  ```

### Task 8.1.3: Add EventRSVP Model
- **File:** `packages/backend/prisma/schema.prisma`
- **Dependencies:** 8.1.2
- **Complexity:** Medium
- **Pattern:** ReviewHelpful model
- **Model:**
  ```prisma
  model EventRSVP {
    id         String     @id @default(uuid())
    eventId    String
    event      Event      @relation(fields: [eventId], references: [id], onDelete: Cascade)
    userId     String
    user       User       @relation(fields: [userId], references: [id], onDelete: Cascade)
    status     RSVPStatus
    guestCount Int        @default(1)
    rsvpDate   DateTime   @default(now())
    createdAt  DateTime   @default(now())
    updatedAt  DateTime   @updatedAt

    @@unique([eventId, userId])
    @@index([eventId])
    @@index([userId])
    @@index([eventId, status])
  }
  ```

### Task 8.1.4: Create Database Migration
- **Command:** `pnpm prisma migrate dev --name add_events`
- **Dependencies:** 8.1.3
- **Complexity:** Simple
- **Success Criteria:** Migration runs without errors, tables created

### Task 8.1.5: Update User Model Relations
- **File:** `packages/backend/prisma/schema.prisma`
- **Dependencies:** 8.1.3
- **Complexity:** Simple
- **Add to User model:**
  ```prisma
  createdEvents  Event[]
  eventRsvps     EventRSVP[]
  ```

### Task 8.1.6: Update Business Model Relations
- **File:** `packages/backend/prisma/schema.prisma`
- **Dependencies:** 8.1.3
- **Complexity:** Simple
- **Add to Business model:**
  ```prisma
  events  Event[]
  ```

---

## Phase 8.2: Backend Service Layer (Days 4-8)

**Objective:** Create EventService with CRUD, RSVP, recurrence, and ICS export.

### Task 8.2.1: Create Event Validation Schemas
- **File:** `packages/shared/src/schemas/event-schemas.ts`
- **Dependencies:** 8.1.4
- **Complexity:** Medium
- **Pattern:** `review-schemas.ts`
- **Schemas:**
  ```typescript
  export const eventCreateSchema = z.object({
    title: z.string().min(1).max(100),
    description: z.string().min(50).max(5000),
    categoryId: z.string().uuid(),
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
    locationType: z.enum(['PHYSICAL', 'ONLINE', 'HYBRID']),
    venue: venueSchema.optional(),
    onlineUrl: z.string().url().optional(),
    linkedBusinessId: z.string().uuid().optional(),
    imageUrl: z.string().url().optional(),
    ticketUrl: z.string().url().optional(),
    cost: z.string().max(50).optional(),
    capacity: z.number().int().positive().optional(),
    ageRestriction: z.string().max(20).optional(),
    accessibility: z.array(z.string()).optional(),
    recurrence: recurrenceRuleSchema.optional(),
  }).refine(data => new Date(data.startTime) < new Date(data.endTime), {
    message: 'Start time must be before end time',
  }).refine(data => {
    if (data.locationType === 'PHYSICAL' || data.locationType === 'HYBRID') {
      return !!data.venue;
    }
    return true;
  }, { message: 'Venue required for physical/hybrid events' })
  .refine(data => {
    if (data.locationType === 'ONLINE' || data.locationType === 'HYBRID') {
      return !!data.onlineUrl;
    }
    return true;
  }, { message: 'Online URL required for online/hybrid events' });

  export const eventUpdateSchema = eventCreateSchema.partial();

  export const eventRSVPSchema = z.object({
    status: z.enum(['GOING', 'INTERESTED', 'NOT_GOING']),
    guestCount: z.number().int().min(1).max(10).default(1),
  });

  export const recurrenceRuleSchema = z.object({
    frequency: z.enum(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
    interval: z.number().int().min(1).default(1),
    daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
    endDate: z.string().datetime().optional(),
    exceptions: z.array(z.string().datetime()).optional(),
  });

  export const eventFilterSchema = z.object({
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    categoryId: z.string().uuid().optional(),
    locationType: z.enum(['PHYSICAL', 'ONLINE', 'HYBRID']).optional(),
    distance: z.number().positive().max(100).optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    includePast: z.boolean().optional(),
    freeOnly: z.boolean().optional(),
    hasAccessibility: z.array(z.string()).optional(),
    page: z.number().int().positive().default(1),
    limit: z.number().int().min(1).max(50).default(20),
    sort: z.enum(['upcoming', 'distance', 'newest', 'featured']).default('upcoming'),
  });
  ```

### Task 8.2.2: Export Event Schemas
- **File:** `packages/shared/src/index.ts`
- **Dependencies:** 8.2.1
- **Complexity:** Simple
- **Add exports:**
  ```typescript
  export * from './schemas/event-schemas.js';
  ```

### Task 8.2.3: Create EventService Class
- **File:** `packages/backend/src/services/event-service.ts`
- **Dependencies:** 8.2.2
- **Complexity:** Complex (~800 lines)
- **Pattern:** `review-service.ts`, `claim-service.ts`
- **Methods:**
  ```typescript
  class EventService {
    // CRUD Operations
    async createEvent(data: EventCreateInput, userId: string, auditContext: AuditContext): Promise<Event>
    async updateEvent(id: string, data: EventUpdateInput, userId: string, auditContext: AuditContext): Promise<Event>
    async deleteEvent(id: string, userId: string, auditContext: AuditContext): Promise<void>
    async getEvent(id: string, userId?: string): Promise<EventWithDetails>
    async listEvents(filters: EventFilterInput, pagination: Pagination): Promise<PaginatedEvents>

    // RSVP Operations
    async rsvpToEvent(eventId: string, userId: string, status: RSVPStatus, guestCount: number, auditContext: AuditContext): Promise<EventRSVP>
    async cancelRSVP(eventId: string, userId: string, auditContext: AuditContext): Promise<void>
    async getEventAttendees(eventId: string, userId: string, filters: AttendeeFilter, pagination: Pagination): Promise<PaginatedAttendees>
    async getUserRSVPStatus(eventId: string, userId: string): Promise<RSVPStatus | null>

    // Export
    async exportEventICS(eventId: string): Promise<string>

    // Recurrence
    async getRecurringInstances(eventId: string, dateFrom: Date, dateTo: Date): Promise<EventInstance[]>

    // Status Management
    async updatePastEventsStatus(): Promise<number> // Batch job

    // Helpers
    private async checkCapacity(eventId: string, additionalGuests: number): Promise<boolean>
    private async notifyRSVP(event: Event, rsvp: EventRSVP, action: 'created' | 'updated' | 'cancelled'): Promise<void>
    private async validateEventOwnership(eventId: string, userId: string): Promise<Event>
  }
  ```

### Task 8.2.4: Implement Recurrence Rule Handling
- **File:** `packages/backend/src/utils/recurrence.ts`
- **Dependencies:** 8.2.3
- **Complexity:** Complex
- **Consider:** Using `rrule` library for RFC 5545 compliance
- **Functions:**
  ```typescript
  export function parseRecurrenceRule(rule: RecurrenceRule): RRule
  export function getOccurrences(rule: RecurrenceRule, from: Date, to: Date): Date[]
  export function isException(rule: RecurrenceRule, date: Date): boolean
  export function getNextOccurrence(rule: RecurrenceRule, after: Date): Date | null
  ```

### Task 8.2.5: Implement ICS Export Utility
- **File:** `packages/backend/src/utils/ics-generator.ts`
- **Dependencies:** 8.2.3
- **Complexity:** Medium
- **Functions:**
  ```typescript
  export function generateICS(event: Event): string
  export function formatVEvent(event: Event): string
  export function formatVTimezone(timezone: string): string
  export function escapeICSText(text: string): string
  export function formatICSDate(date: Date): string
  ```
- **RFC 5545 Compliance:** VCALENDAR, VEVENT, VTIMEZONE, RRULE support

### Task 8.2.6: Create Event Rate Limiters
- **File:** `packages/backend/src/middleware/event-rate-limiter.ts`
- **Dependencies:** None
- **Complexity:** Simple
- **Pattern:** `review-rate-limiter.ts`
- **Limiters:**
  ```typescript
  export const createEventLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5,
    message: { error: 'TOO_MANY_REQUESTS', message: 'Event creation limit exceeded' }
  });

  export const rsvpLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    message: { error: 'TOO_MANY_REQUESTS', message: 'RSVP rate limit exceeded' }
  });

  export const listEventsLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: { error: 'TOO_MANY_REQUESTS', message: 'Search rate limit exceeded' }
  });

  export const getEventLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    message: { error: 'TOO_MANY_REQUESTS', message: 'Event view rate limit exceeded' }
  });

  export const exportICSLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    message: { error: 'TOO_MANY_REQUESTS', message: 'Export rate limit exceeded' }
  });
  ```

### Task 8.2.7: Write EventService Unit Tests
- **File:** `packages/backend/src/services/event-service.test.ts`
- **Dependencies:** 8.2.5
- **Complexity:** Complex
- **Pattern:** `claim-service.test.ts`
- **Test Categories:**
  - createEvent (validation, authorization, success)
  - updateEvent (ownership, validation, success)
  - deleteEvent (ownership, cascading RSVPs)
  - getEvent (public, with RSVP status)
  - listEvents (filters, pagination, sorting)
  - rsvpToEvent (create, update, capacity, validation)
  - cancelRSVP (exists, success)
  - getEventAttendees (ownership, filtering)
  - exportEventICS (format, recurrence)
  - getRecurringInstances (patterns, exceptions)
- **Target:** 80+ tests

---

## Phase 8.3: API Routes (Days 9-12)

**Objective:** Implement all 9 event API endpoints.

### Task 8.3.1: Create Event Controller
- **File:** `packages/backend/src/controllers/event-controller.ts`
- **Dependencies:** 8.2.5
- **Complexity:** Medium
- **Pattern:** `review-controller.ts`

### Task 8.3.2: Create Event Routes
- **File:** `packages/backend/src/routes/events.ts`
- **Dependencies:** 8.3.1, 8.2.6
- **Complexity:** Medium
- **Pattern:** `review.ts`
- **Endpoints:**
  ```typescript
  const router = Router();

  // Public endpoints
  router.get('/', listEventsLimiter, validateQuery(eventFilterSchema), eventController.listEvents);
  router.get('/:id', getEventLimiter, eventController.getEvent);
  router.get('/:id/export', exportICSLimiter, eventController.exportICS);

  // Authenticated endpoints
  router.post('/', authMiddleware, createEventLimiter, validateBody(eventCreateSchema), eventController.createEvent);
  router.post('/:id/rsvp', authMiddleware, rsvpLimiter, validateBody(eventRSVPSchema), eventController.rsvpToEvent);
  router.delete('/:id/rsvp', authMiddleware, rsvpLimiter, eventController.cancelRSVP);

  // Owner-only endpoints
  router.put('/:id', authMiddleware, requireEventOwnership, validateBody(eventUpdateSchema), eventController.updateEvent);
  router.delete('/:id', authMiddleware, requireEventOwnership, eventController.deleteEvent);
  router.get('/:id/attendees', authMiddleware, requireEventOwnership, eventController.getAttendees);

  export { router as eventRouter };
  ```

### Task 8.3.3: Register Event Routes
- **File:** `packages/backend/src/routes/index.ts`
- **Dependencies:** 8.3.2
- **Complexity:** Simple
- **Add:**
  ```typescript
  import { eventRouter } from './events.js';
  v1.use('/events', eventRouter);
  ```

### Task 8.3.4: Create requireEventOwnership Middleware
- **File:** `packages/backend/src/middleware/event-ownership.ts`
- **Dependencies:** 8.1.4
- **Complexity:** Simple
- **Pattern:** RBAC middleware

### Task 8.3.5: Add Event Email Templates
- **File:** `packages/backend/src/services/email-service.ts`
- **Dependencies:** 8.3.2
- **Complexity:** Simple
- **Templates:**
  - `EVENT_RSVP_CONFIRMATION` - Sent to user after RSVP
  - `EVENT_UPDATE_NOTIFICATION` - Sent to RSVPs when event updated
  - `EVENT_CANCELLATION` - Sent to RSVPs when event cancelled
  - `EVENT_REMINDER_24H` - Reminder 24 hours before
  - `EVENT_REMINDER_1H` - Reminder 1 hour before

### Task 8.3.6: Write Event API Integration Tests
- **File:** `packages/backend/src/routes/__tests__/events.test.ts`
- **Dependencies:** 8.3.3
- **Complexity:** Complex
- **Pattern:** `business.test.ts`
- **Target:** 60+ tests

### Task 8.3.7: Add Event Search Endpoint
- **File:** `packages/backend/src/routes/search.ts`
- **Dependencies:** 8.3.3
- **Complexity:** Medium
- **Add:** GET /search/events for Elasticsearch full-text search

---

## Phase 8.4: Frontend Components (Days 13-19)

**Objective:** Create event UI components with WCAG 2.1 AA compliance.

### Task 8.4.1: Create Event API Service
- **File:** `packages/frontend/src/services/event-service.ts`
- **Dependencies:** 8.3.3
- **Complexity:** Medium
- **Pattern:** Review/saved API services

### Task 8.4.2: Create useEvent Hook
- **File:** `packages/frontend/src/hooks/useEvent.ts`
- **Dependencies:** 8.4.1
- **Complexity:** Simple
- **Pattern:** `useBusinessDetail`

### Task 8.4.3: Create useRSVP Hook
- **File:** `packages/frontend/src/hooks/useRSVP.ts`
- **Dependencies:** 8.4.1
- **Complexity:** Simple
- **Pattern:** `useSavedBusiness`, `useFollowBusiness`

### Task 8.4.4: Create EventCard Component
- **File:** `packages/frontend/src/components/events/EventCard.tsx`
- **Dependencies:** 8.4.3
- **Complexity:** Medium
- **Pattern:** `BusinessCard.tsx`
- **Features:**
  - Event image (lazy loaded)
  - Title (max 2 lines, ellipsis)
  - Date/time display (smart formatting: "Today", "Tomorrow", etc.)
  - Location type badge (PHYSICAL/ONLINE/HYBRID)
  - Capacity indicator (if set)
  - RSVP count
  - Skeleton loading state
  - Hover effects
  - Click through to detail

### Task 8.4.5: Create EventList Component
- **File:** `packages/frontend/src/components/events/EventList.tsx`
- **Dependencies:** 8.4.4
- **Complexity:** Medium
- **Pattern:** `BusinessList.tsx`
- **Features:**
  - Responsive grid (1 col mobile, 2 col tablet, 3 col desktop)
  - Pagination or infinite scroll
  - Empty state
  - Sort dropdown

### Task 8.4.6: Create RSVPButton Component
- **File:** `packages/frontend/src/components/events/RSVPButton.tsx`
- **Dependencies:** 8.4.3
- **Complexity:** Medium
- **Pattern:** `SaveButton.tsx`, `FollowButton.tsx`
- **Features:**
  - Dropdown: Going / Interested / Not Going
  - Guest count input (when capacity available)
  - Auth gate (login prompt if not authenticated)
  - Error handling (at capacity, event full)
  - Optimistic UI updates
  - Loading state

### Task 8.4.7: Create EventFilters Component
- **File:** `packages/frontend/src/components/events/EventFilters.tsx`
- **Dependencies:** 8.4.1
- **Complexity:** Medium
- **Pattern:** `SearchFilters.tsx`
- **Filters:**
  - Category multi-select (EVENT type categories)
  - Date range picker (from/to)
  - Location type checkboxes
  - Distance slider (1-50km, requires geolocation)
  - Free events toggle
  - Accessibility filter (checkboxes)
  - Clear all button
  - Applied filters chips

### Task 8.4.8: Create CalendarView Component
- **File:** `packages/frontend/src/components/events/CalendarView.tsx`
- **Dependencies:** 8.4.4
- **Complexity:** Complex
- **Views:**
  - **Month view:** Traditional calendar grid, 3-5 events visible per day
  - **Week view:** 7 columns, hourly timeslots
  - **Day view:** Single column, 30-min timeslots
- **Features:**
  - Navigation (prev/next month/week/day, today button)
  - View toggle buttons
  - Event indicators (colored dots by category)
  - Click event to open detail
  - Responsive (mobile: day view default)
  - Keyboard navigation (arrow keys)
  - ARIA role="grid" with proper aria-rowindex/colindex

### Task 8.4.9: Create EventForm Component
- **File:** `packages/frontend/src/components/events/EventForm.tsx`
- **Dependencies:** 8.4.1
- **Complexity:** Complex
- **Pattern:** Multi-step auth forms
- **Steps:**
  1. **Basic Info:** Title (char counter), description (rich text), category
  2. **Date/Time:** Start/end pickers, timezone selection
  3. **Location:** Type selector, venue fields OR online URL
  4. **Details:** Cost, capacity, age restriction, accessibility checkboxes
  5. **Media:** Image upload (1200x630 recommended)
  6. **Recurrence:** Frequency, interval, end date (optional step)
- **Features:**
  - Step navigation with progress indicator
  - Validation per step
  - Draft save to localStorage
  - Preview before submit

### Task 8.4.10: Create EventSearch Component
- **File:** `packages/frontend/src/components/events/EventSearch.tsx`
- **Dependencies:** 8.4.1
- **Complexity:** Medium
- **Pattern:** `SearchBar.tsx`
- **Features:**
  - 300ms debounced search
  - Autocomplete dropdown (event titles, categories)
  - Recent searches (localStorage)
  - Keyboard navigation (arrow keys, Enter to select)

### Task 8.4.11: Write EventCard/EventList Tests
- **File:** `packages/frontend/src/components/events/__tests__/EventCard.test.tsx`
- **Dependencies:** 8.4.5
- **Complexity:** Medium
- **Target:** 40+ tests

### Task 8.4.12: Write RSVPButton/EventFilters Tests
- **File:** `packages/frontend/src/components/events/__tests__/RSVPButton.test.tsx`
- **Dependencies:** 8.4.7
- **Complexity:** Medium
- **Target:** 50+ tests

### Task 8.4.13: Write CalendarView Tests
- **File:** `packages/frontend/src/components/events/__tests__/CalendarView.test.tsx`
- **Dependencies:** 8.4.8
- **Complexity:** Complex
- **Test Coverage:**
  - All three views (month, week, day)
  - Navigation (prev/next, today)
  - Keyboard accessibility
  - Event display and click-through
- **Target:** 40+ tests

### Task 8.4.14: Write Accessibility Tests (jest-axe)
- **File:** `packages/frontend/src/components/events/__tests__/accessibility.test.tsx`
- **Dependencies:** 8.4.13
- **Complexity:** Medium
- **Pattern:** Existing accessibility test files
- **Target:** Zero violations

---

## Phase 8.5: Frontend Pages (Days 20-23)

**Objective:** Create event listing and detail pages.

### Task 8.5.1: Create EventsListingPage
- **File:** `packages/frontend/src/pages/EventsListingPage.tsx`
- **Dependencies:** 8.4.8, 8.4.5, 8.4.7
- **Complexity:** Medium
- **Pattern:** `BusinessListPage.tsx`
- **Features:**
  - View toggle (list view / calendar view)
  - Filters sidebar (collapsible on mobile)
  - Search bar
  - Sort dropdown
  - Pagination
  - SEO metadata (Helmet)
  - URL state for filters (shareable links)

### Task 8.5.2: Create EventDetailPage
- **File:** `packages/frontend/src/pages/EventDetailPage.tsx`
- **Dependencies:** 8.4.2, 8.4.6
- **Complexity:** Medium
- **Pattern:** `BusinessDetailPage.tsx`
- **Sections:**
  - Hero: Event image, title, date/time
  - Host/organizer info (link to business if linked)
  - Location: Map (if physical), link (if online), both (if hybrid)
  - Description (rich text rendered)
  - Details: Cost, age restriction, accessibility features
  - Capacity: Spots remaining, RSVP count
  - RSVP button with guest count
  - Share buttons (Facebook, Twitter, WhatsApp, copy link)
  - Export: Add to Calendar (ICS, Google, Apple)
  - Related events (same category)

### Task 8.5.3: Add Event Routes
- **File:** `packages/frontend/src/App.tsx`
- **Dependencies:** 8.5.2
- **Complexity:** Simple
- **Routes:**
  ```tsx
  <Route path="/events" element={<EventsListingPage />} />
  <Route path="/events/:id" element={<EventDetailPage />} />
  <Route path="/events/new" element={<ProtectedRoute><EventForm mode="create" /></ProtectedRoute>} />
  <Route path="/events/:id/edit" element={<ProtectedRoute><EventForm mode="edit" /></ProtectedRoute>} />
  ```

### Task 8.5.4: Write Page Tests
- **File:** `packages/frontend/src/pages/__tests__/EventsListingPage.test.tsx`
- **Dependencies:** 8.5.2
- **Complexity:** Medium
- **Target:** 50+ tests for both pages

### Task 8.5.5: Add Events to Navigation
- **File:** `packages/frontend/src/components/layout/Header.tsx`
- **Dependencies:** 8.5.3
- **Complexity:** Simple
- **Add:** Events link to main navigation

### Task 8.5.6: Add Events to Homepage
- **File:** `packages/frontend/src/pages/HomePage.tsx`
- **Dependencies:** 8.4.4
- **Complexity:** Simple
- **Add:** "Upcoming Events" section with 3-4 EventCards

---

## Phase 8.6: Internationalization (Days 24-25)

**Objective:** Create translation files for all 10 languages.

### Task 8.6.1: Create English Events Translations
- **File:** `packages/frontend/src/i18n/locales/en/events.json`
- **Dependencies:** 8.5.5
- **Complexity:** Medium
- **Pattern:** `reviews.json`
- **Estimated Keys:** 120+
- **Categories:**
  ```json
  {
    "nav": { "upcoming": "Upcoming Events", "calendar": "Calendar", "create": "Create Event" },
    "form": { "title": "Event Title", "description": "Description", ... },
    "rsvp": { "going": "Going", "interested": "Interested", "notGoing": "Not Going", ... },
    "calendar": { "month": "Month", "week": "Week", "day": "Day", "today": "Today", ... },
    "status": { "active": "Active", "pending": "Pending Review", "cancelled": "Cancelled", "past": "Past" },
    "messages": { "rsvpConfirmed": "Your RSVP has been confirmed", ... },
    "errors": { "atCapacity": "This event is at full capacity", ... },
    "filters": { "category": "Category", "dateRange": "Date Range", ... },
    "export": { "addToCalendar": "Add to Calendar", "googleCalendar": "Google Calendar", ... },
    "detail": { "host": "Hosted by", "spotsLeft": "{{count}} spots left", ... }
  }
  ```

### Task 8.6.2: Create Translations for Other Languages
- **Files:** `packages/frontend/src/i18n/locales/{ar,zh-CN,zh-TW,vi,hi,ur,ko,el,it}/events.json`
- **Dependencies:** 8.6.1
- **Complexity:** Medium
- **Notes:**
  - RTL languages (ar, ur): Ensure date/time formatting correct
  - Chinese: Simplified vs Traditional differences
  - Professional translations with cultural adaptations

### Task 8.6.3: Update i18n Configuration
- **File:** `packages/frontend/src/i18n/config.ts`
- **Dependencies:** 8.6.2
- **Complexity:** Simple
- **Add:** Import and register events namespace for all 10 languages

### Task 8.6.4: Test RTL Layout
- **File:** `packages/frontend/src/components/events/__tests__/rtl.test.tsx`
- **Dependencies:** 8.6.3
- **Complexity:** Medium
- **Test Coverage:**
  - Calendar grid direction (RTL)
  - Form field alignment
  - Navigation arrows (reversed)
  - Date picker direction

---

## Phase 8.7: Integration & QA (Days 26-30)

**Objective:** End-to-end testing, accessibility audit, performance, security.

### Task 8.7.1: E2E Tests - Event Discovery
- **File:** `packages/frontend/e2e/events.spec.ts`
- **Dependencies:** 8.6.3
- **Complexity:** Medium
- **Scenarios:**
  - Browse events listing
  - Filter by category
  - Filter by date range
  - Search for events
  - View event details
  - Calendar view navigation

### Task 8.7.2: E2E Tests - Event Interaction
- **File:** `packages/frontend/e2e/event-rsvp.spec.ts`
- **Dependencies:** 8.7.1
- **Complexity:** Medium
- **Scenarios:**
  - RSVP to event (all statuses)
  - Update RSVP
  - Cancel RSVP
  - Add guest count
  - Export to ICS
  - Share event

### Task 8.7.3: E2E Tests - Event Creation
- **File:** `packages/frontend/e2e/event-create.spec.ts`
- **Dependencies:** 8.7.2
- **Complexity:** Medium
- **Scenarios:**
  - Create single event
  - Create recurring event
  - Edit event
  - Cancel event
  - View attendee list

### Task 8.7.4: Accessibility Audit
- **Dependencies:** 8.7.3
- **Complexity:** Medium
- **Checklist:**
  - [ ] All components pass jest-axe (0 violations)
  - [ ] Keyboard navigation works for all interactions
  - [ ] Screen reader testing (NVDA, VoiceOver)
  - [ ] Focus indicators visible (2px solid)
  - [ ] Touch targets minimum 44px
  - [ ] Color contrast 4.5:1 for text, 3:1 for UI
  - [ ] ARIA labels on all interactive elements
  - [ ] Error messages with role="alert"
  - [ ] Calendar grid proper ARIA structure

### Task 8.7.5: Performance Testing
- **Dependencies:** 8.7.4
- **Complexity:** Medium
- **Targets:**
  - Page load: <3s on 3G
  - API response: <200ms (p95)
  - Calendar month view: <500ms with 40+ events
  - RSVP response: <100ms (optimistic UI)
  - ICS export: <1s for 1-year events
  - Lighthouse score: >80

### Task 8.7.6: Security Review
- **Dependencies:** 8.7.5
- **Complexity:** Medium
- **Checklist:**
  - [ ] All endpoints have proper authentication
  - [ ] Owner-only operations verified
  - [ ] Rate limiting working correctly
  - [ ] Input validation prevents injection
  - [ ] HTML sanitization in descriptions
  - [ ] Audit logging for all mutations
  - [ ] CSRF protection on forms
  - [ ] No sensitive data exposed in attendee list

### Task 8.7.7: QA Review Documentation
- **File:** `md/review/phase-8-events-calendar-qa.md`
- **Dependencies:** 8.7.6
- **Complexity:** Simple
- **Contents:** Findings, issues resolved, final status

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Recurrence handling complexity** | High | High | Use `rrule` library; extensive testing of edge cases |
| **Calendar grid accessibility** | Medium | High | Follow WAI-ARIA Grid pattern; screen reader testing |
| **Timezone edge cases** | Medium | Medium | Store UTC; convert on display; test DST transitions |
| **RSVP race conditions** | Medium | Medium | Database transactions; optimistic locking for capacity |
| **Performance with many events** | Medium | Medium | Redis caching; pagination; lazy loading |
| **ICS compatibility** | Low | Medium | RFC 5545 strict compliance; test with Google/Apple/Outlook |

---

## Location-Agnostic Considerations

1. **Event Categories:** Load from Category table (type='EVENT'), not hardcoded
2. **Timezone:** Use `config.location.timezone` from platform.json
3. **Distance Calculations:** Use user's coordinates for "Near You" filtering
4. **Currency:** Use `config.location.currency` for ticket prices (future)
5. **Date/Time Formats:** Use i18n.language for locale-specific formatting
6. **Map Integration:** Reuse existing BusinessMap component patterns

---

## Success Criteria

- [ ] All 9 API endpoints implemented and tested
- [ ] 300+ tests total (80+ service, 60+ API, 130+ component, 30+ E2E)
- [ ] Zero TypeScript errors, zero `any` types
- [ ] Zero console statements in production code
- [ ] WCAG 2.1 AA compliance (0 jest-axe violations)
- [ ] 10/10 languages with complete translations
- [ ] Performance targets met
- [ ] Security review passed
- [ ] Documentation complete

---

## Dependencies Summary

### Required (All Complete ✅)
- Phase 1: Foundation
- Phase 2: Authentication
- Phase 3: Design System
- Phase 5: Search
- Phase 6: User Engagement
- Phase 7: Business Owner

### New Dependencies to Install
- `rrule` - RFC 5545 recurrence rule handling (optional, can implement manually)
- No other new dependencies required

---

## Critical Files Reference

1. **Schema:** `packages/backend/prisma/schema.prisma`
2. **Service:** `packages/backend/src/services/event-service.ts`
3. **Routes:** `packages/backend/src/routes/events.ts`
4. **Validators:** `packages/shared/src/schemas/event-schemas.ts`
5. **CalendarView:** `packages/frontend/src/components/events/CalendarView.tsx`
6. **EventForm:** `packages/frontend/src/components/events/EventForm.tsx`
7. **Translations:** `packages/frontend/src/i18n/locales/*/events.json`
