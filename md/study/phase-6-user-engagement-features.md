# Phase 6: User Engagement Features - Comprehensive Research

**Research Date:** March 2, 2026
**Status:** Not Started (0/35 tasks)
**Estimated Effort:** 60-80 hours
**Dependencies:** Phases 1-5 (all complete ✅)

---

## OVERVIEW & PURPOSE

**Phase 6** focuses on implementing user engagement features that enable community members to interact with businesses through:
- **Saved/Favorited Businesses** - Users can save businesses to custom lists
- **Following Businesses** - Users can follow businesses for updates
- **Reviews & Ratings** - Users can submit reviews with 1-5 star ratings and photos
- **Review Moderation** - Admin queue for reviewing/approving user-generated content
- **Business Responses** - Business owners can respond publicly to reviews

This phase bridges the gap between passive browsing (Phases 1-5) and active engagement, creating the foundation for user-generated content (UGC) that drives community involvement.

**Current Status (as of March 2, 2026):**
- Phase 5 (Search & Discovery) is 100% complete with 1,419+ total tests passing
- Phase 6 is next in the MVP 2 roadmap (50% of MVP 2)
- 35 tasks scheduled in TODO.md
- All technical dependencies (auth, database, design system) are in place

---

## SPECIFICATION REFERENCES

### Primary Spec Sections

1. **§12.4 "Saved Businesses & Activity"** (Line 1819)
   - Saved businesses, custom lists, following features, user activity tracking

2. **§18 "Reviews & Ratings"** (Line 2155)
   - Review submission, business responses, review display, moderation rules

3. **§23.4 "Content Moderation"** (Line 2420)
   - Review moderation queue, approval requirements, moderation actions

4. **§24.1 "Review Guidelines"** (Line 2444)
   - Acceptable/prohibited review content, guidelines for enforcement

5. **§10.2 "Permission Matrix"** (Line 1639)
   - Which roles can save businesses, submit reviews, respond to reviews

6. **§8 "Multilingual Support"**
   - Review translations, language detection, content handling

---

## DATA MODELS (Appendix A References)

### A.16 SavedBusiness & SavedList

```typescript
SavedBusiness {
  id: UUID
  user_id: Reference (User)
  business_id: Reference (Business)
  list_id: Reference (SavedList, optional)  // null = default list
  notes: Text (max 500, optional)
  created_at: DateTime
}

SavedList {
  id: UUID
  user_id: Reference (User)
  name: String (max 50)
  is_default: Boolean                       // Each user has one default list
  created_at: DateTime
  updated_at: DateTime
}
```

**Purpose:** Allow users to save favorite businesses and organize them into custom lists (e.g., "To Try", "Lunch Spots", "Family-Friendly")

**Unique Constraints:**
- `(user_id, business_id)` on SavedBusiness (cannot save same business twice)
- Only one `is_default: true` per user_id

---

### A.4 Review, ReviewPhoto, ReviewHelpful

```typescript
Review {
  id: UUID
  business_id: Reference (Business)
  user_id: Reference (User)
  rating: Integer (1-5)
  title: String (optional, max 100)
  content: Text (50-1000 chars)
  language: String (detected, ISO 639-1)    // e.g., "en", "ar", "zh"
  photos: [ReviewPhoto]
  helpful_count: Integer (default 0)
  status: Enum (pending, published, hidden, deleted)
  moderation_notes: Text (admin only)
  business_response: Text (max 500, optional)
  business_response_at: DateTime (optional)
  created_at: DateTime
  updated_at: DateTime
  published_at: DateTime (optional)
}

ReviewPhoto {
  id: UUID
  review_id: Reference (Review)
  url: String
  alt_text: String (max 200)                // WCAG 2.1 AA requirement
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

**Purpose:**
- Store user reviews with ratings, photos, and moderation status
- Track helpful votes (users vote on whether a review is helpful)
- Store business owner responses

**Unique Constraints:**
- `(user_id, business_id)` on Review (one review per user per business)
- `(review_id, user_id)` on ReviewHelpful (one helpful vote per user per review)

**Indexes Needed:**
- `review.status` (for moderation queue)
- `review.created_at` (for sorting)
- `review.helpful_count` (for sorting by most helpful)
- `review.business_id` (for fetching business reviews)

---

### A.23 BusinessFollow

```typescript
BusinessFollow {
  id: UUID
  user_id: Reference (User)
  business_id: Reference (Business)
  created_at: DateTime
}
```

**Purpose:** Users can follow businesses to receive updates/notifications when business posts updates or new reviews appear (notification system is Phase 16).

**Unique Constraints:**
- `(user_id, business_id)` (each user can follow each business only once)

---

### A.22 ModerationReport & Appeal

```typescript
ModerationReport {
  id: UUID
  reporter_id: Reference (User)
  content_type: Enum (review, notice, message, business, event)
  content_id: UUID
  reason: Enum (spam, inappropriate, fake, harassment, other)
  details: Text (max 500)
  status: Enum (pending, reviewed, actioned, dismissed)
  moderator_id: Reference (User, optional)
  moderator_notes: Text (optional)
  action_taken: Enum (none, warning, content_removed, user_suspended)
  created_at: DateTime
  reviewed_at: DateTime (optional)
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
  reviewer_id: Reference (User, optional)
  reviewer_notes: Text (optional)
  created_at: DateTime
  reviewed_at: DateTime (optional)
}
```

**Purpose:** Track reported content and appeal process. Provides audit trail for moderation actions.

---

## API ENDPOINTS (Appendix B References)

### B.4 User Saved Businesses Endpoints

```
GET    /users/:id/saved                    - Get saved businesses (User auth)
POST   /users/:id/saved                    - Save a business (User auth)
DELETE /users/:id/saved/:businessId        - Remove saved business (User auth)
GET    /users/:id/reviews                  - Get user's reviews (Public)
```

**Request/Response Examples:**

```typescript
// POST /users/:id/saved
{
  business_id: "uuid",
  list_id: "uuid" | null,  // null = default list
  notes: "Great coffee!" | null
}
// Response: 201 Created
{
  success: true,
  data: SavedBusiness
}

// GET /users/:id/saved?list_id=uuid
// Response: 200 OK
{
  success: true,
  data: {
    saved_businesses: SavedBusiness[],
    lists: SavedList[]
  }
}
```

---

### B.7 Reviews Endpoints

```
GET     /reviews/:id                       - Get single review (Public)
POST    /businesses/:id/reviews            - Create a review (User auth)
PUT     /reviews/:id                       - Update own review within 7 days (User auth)
DELETE  /reviews/:id                       - Delete own review (User auth)
POST    /reviews/:id/helpful               - Mark review as helpful (User auth)
DELETE  /reviews/:id/helpful               - Remove helpful mark (User auth)
POST    /reviews/:id/report                - Report review (User auth)
POST    /reviews/:id/respond               - Business owner response (Owner auth)
```

**Request/Response Examples:**

```typescript
// POST /businesses/:id/reviews
{
  rating: 5,
  title: "Amazing coffee!" | null,
  content: "This cafe has the best flat whites in Sydney...",
  photos: File[] | null  // Max 3, multipart/form-data
}
// Response: 201 Created
{
  success: true,
  data: Review,
  message: "Review submitted and pending approval"
}

// POST /reviews/:id/helpful
// Response: 200 OK
{
  success: true,
  data: { helpful_count: 42 }
}

// POST /reviews/:id/respond (Business Owner only)
{
  response: "Thank you for the lovely review! We're thrilled..."
}
// Response: 200 OK
{
  success: true,
  data: Review  // Updated with business_response field
}
```

---

### Additional Endpoints (Implied but Required)

```
GET     /businesses/:id/reviews            - List reviews for business (Public)
  Query params: ?sort=newest|helpful|highest|lowest&rating=1-5&page=1&limit=10

GET     /businesses/:id/follow             - Get follower count (Public)
POST    /businesses/:id/follow             - Follow business (User auth)
DELETE  /businesses/:id/follow             - Unfollow business (User auth)
GET     /users/:id/following               - Get user's followed businesses (User auth)

GET     /admin/moderation/reviews          - Moderation queue (Moderator/Admin auth)
  Query params: ?status=pending|reviewed&sort=newest|oldest

POST    /admin/moderation/reviews/:id/approve  - Approve review (Moderator/Admin)
POST    /admin/moderation/reviews/:id/reject   - Reject review (Moderator/Admin)
  Body: { reason: string, notes: string }
```

---

## BUSINESS RULES & CONSTRAINTS

### Review Rules (Spec §18.2)

1. **One Review Per Business**
   - Users can only review once per business
   - Enforced via unique constraint: `(user_id, business_id)`
   - Attempting to submit a second review returns 409 Conflict

2. **Edit Window**
   - 7 days to edit after posting (configurable: `reviewEditWindowDays`)
   - After 7 days, PUT /reviews/:id returns 403 Forbidden
   - Can delete review at any time (but cannot recreate immediately)

3. **Length Constraints**
   - Minimum: 50 characters
   - Maximum: 1000 characters
   - Validation on frontend + backend

4. **Moderation**
   - All reviews enter "pending" status
   - Requires moderator approval before "published" status
   - Auto-moderation rules can be configured (spam detection, profanity filter)

5. **Rating**
   - Required: 1-5 stars (integer)
   - Cannot submit review without rating

6. **Photos**
   - Optional: Up to 3 images per review
   - Max size: 5MB per photo (configurable)
   - Allowed formats: JPEG, PNG, WebP
   - Alt-text required for WCAG 2.1 AA compliance

7. **Language**
   - Auto-detected from review content
   - Stored as ISO 639-1 code (e.g., "en", "ar", "zh")
   - Used for future translation features (Phase 16)

8. **Titles**
   - Optional
   - Max 100 characters
   - Not required but encouraged

---

### Business Response Rules (Spec §18.3)

1. **Public Response**
   - Business owner can reply publicly to reviews
   - Response visible on review card

2. **Response Notification**
   - User notified when owner responds (Phase 16 notification system)

3. **One Response Per Review**
   - Only one response allowed per review
   - Can edit response later (same edit window as reviews)

4. **Response Size**
   - Max 500 characters
   - Validation on frontend + backend

5. **Authorization**
   - Only verified business owners can respond
   - Must own the business being reviewed
   - Enforced via JWT auth + ownership check

---

### Saved Business Rules (Spec §12.4)

1. **Custom Lists**
   - Users can create multiple named lists
   - List names: Max 50 characters
   - Default list created automatically for each user

2. **Default List**
   - Each user has one default "Saved" list
   - `is_default: true` flag
   - Cannot be deleted (can be renamed)

3. **Notes**
   - Optional per saved item
   - Max 500 characters
   - Private (only visible to user)

4. **Privacy**
   - Saved businesses are private
   - Not visible to other users
   - Not shown on public profile

5. **Limits**
   - No hard limit on saved businesses (configurable: `maxSavedBusinessesPerUser`)
   - No hard limit on custom lists (configurable: `maxCustomLists`, suggest 10)

---

### Follow Rules

1. **Unique Constraint**
   - Each user can follow each business only once
   - Enforced via unique constraint: `(user_id, business_id)`

2. **No Notifications (Yet)**
   - Following businesses is for tracking follower count
   - Notifications for updates come in Phase 16

3. **Business View**
   - Business profile shows follower count (public)
   - Does not show list of followers (privacy)

4. **Updates**
   - Following businesses may receive updates when business posts new content
   - Integration with Phase 9 (Community Notices) and Phase 11 (Events)

---

### Moderation Rules (Spec §23.4, §24.1)

1. **Auto-Moderation**
   - All reviews enter "pending" status automatically
   - Spam detection flags suspicious content
   - Profanity filter can auto-reject (configurable)

2. **Approval Required**
   - All reviews require moderator approval before "published"
   - Moderators can approve, reject, or hide reviews

3. **Status Tracking**
   - `pending` → `published` (approved)
   - `pending` → `hidden` (rejected but not deleted)
   - `pending` → `deleted` (permanently removed)

4. **Spam Detection**
   - Auto-flags for profanity, spam patterns
   - Configurable regex patterns: `autoRejectPatterns`
   - Manual review required for borderline cases

5. **Report Mechanism**
   - Users can report inappropriate reviews
   - Report reasons: spam, inappropriate, fake, harassment, other
   - Creates ModerationReport entry
   - Triggers moderator notification

6. **7-Day Grace Period**
   - Users can edit/delete their own reviews within 7 days
   - After 7 days, only moderators can modify

7. **Audit Trail**
   - All moderation actions logged in AuditLog table
   - Tracks moderator ID, action, reason, timestamp
   - Required for 7 years (Spec §5.2.2)

---

## LOCATION-AGNOSTIC ARCHITECTURE

### Feature Flags (config/platform.json)

```json
{
  "features": {
    "reviewsAndRatings": true,           // Master flag for entire Phase 6
    "savedBusinesses": true,             // Enable saved businesses feature
    "businessFollowing": true,           // Enable follow/unfollow feature
    "reviewModeration": true,            // Enable pre-moderation
    "reviewPhotos": true,                // Enable photo uploads on reviews
    "businessResponses": true            // Enable business owner responses
  }
}
```

### Configuration Limits (config/platform.json)

```json
{
  "limits": {
    "reviewEditWindowDays": 7,
    "minReviewLength": 50,
    "maxReviewLength": 1000,
    "maxReviewPhotos": 3,
    "maxReviewPhotoSizeMB": 5,
    "maxSavedBusinessesPerUser": 1000,   // Or null for unlimited
    "maxCustomLists": 10,
    "maxListNameLength": 50,
    "reviewsPerHour": 5,                 // Rate limiting
    "reportsPerHour": 10                 // Prevent spam reports
  }
}
```

### Moderation Settings (config/platform.json)

```json
{
  "moderation": {
    "reviewsModerationRequired": true,   // Pre-moderation enabled
    "autoRejectPatterns": [],            // Regex patterns for auto-reject
    "profanityFilterEnabled": true,
    "spamDetectionEnabled": true,
    "moderationPriority": "manual"       // "auto", "manual", "hybrid"
  }
}
```

### CRITICAL: No Hardcoded Values

All review approval times, character limits, photo counts, rate limits must come from:
1. `config/platform.json` (preferred)
2. Database `SystemSetting` table (for runtime changes)
3. Environment variables `.env` (for sensitive values)

**NEVER hardcode:**
- Character limits (50, 100, 500, 1000)
- Photo limits (3)
- Edit window (7 days)
- Rate limits (5/hr, 10/hr)
- Moderation rules

---

## INTERNATIONALIZATION (i18n)

### Current State (Phase 1 Complete)

- 10 languages fully supported: en, ar, zh-CN, zh-TW, vi, hi, ur, ko, el, it
- react-i18next v16.5.4 with RTL support
- Translation files: `packages/frontend/src/i18n/locales/`

### Phase 6 i18n Requirements

#### 1. Review Display Translations

```typescript
// en.json additions
{
  "reviews": {
    "title": "Reviews",
    "writeReview": "Write a Review",
    "rateThisBusiness": "Rate This Business",
    "overallRating": "Overall Rating",
    "basedOnReviews": "Based on {{count}} reviews",
    "noReviewsYet": "No reviews yet",
    "beTheFirst": "Be the first to review this business!",
    "helpful": "Helpful?",
    "reportReview": "Report Review",
    "editReview": "Edit Review",
    "deleteReview": "Delete Review",
    "businessResponse": "Business Owner Response",
    "respondedOn": "Responded on {{date}}",
    "postedOn": "Posted on {{date}}",
    "verified": "Verified Customer"
  }
}
```

#### 2. Review Form Translations

```typescript
{
  "reviewForm": {
    "title": "Write Your Review",
    "ratingLabel": "Your Rating",
    "ratingRequired": "Rating is required",
    "titleLabel": "Review Title (Optional)",
    "titlePlaceholder": "Summarize your experience",
    "contentLabel": "Your Review",
    "contentPlaceholder": "Tell others about your experience...",
    "contentMinLength": "Review must be at least {{min}} characters",
    "contentMaxLength": "Review cannot exceed {{max}} characters",
    "photosLabel": "Add Photos (Optional)",
    "photosMaxCount": "Maximum {{max}} photos",
    "submitButton": "Submit Review",
    "cancelButton": "Cancel",
    "successMessage": "Review submitted successfully! It will appear after moderation.",
    "errorMessage": "Failed to submit review. Please try again."
  }
}
```

#### 3. Business Response Translations

```typescript
{
  "businessResponse": {
    "title": "Respond to Review",
    "responseLabel": "Your Response",
    "responsePlaceholder": "Thank the customer or address their concerns...",
    "responseMaxLength": "Response cannot exceed {{max}} characters",
    "submitButton": "Post Response",
    "editButton": "Edit Response",
    "successMessage": "Response posted successfully",
    "errorMessage": "Failed to post response"
  }
}
```

#### 4. Saved/Following Translations

```typescript
{
  "saved": {
    "title": "Saved Businesses",
    "saveBusiness": "Save Business",
    "saved": "Saved",
    "unsave": "Remove from Saved",
    "createList": "Create New List",
    "listName": "List Name",
    "defaultList": "Saved Businesses",
    "addToList": "Add to List",
    "removeFromList": "Remove from List",
    "emptyState": "No saved businesses yet",
    "emptyStateSubtext": "Tap the heart icon on any business to save it here",
    "notesLabel": "Notes (Optional)",
    "notesPlaceholder": "Add personal notes..."
  },
  "following": {
    "followBusiness": "Follow",
    "following": "Following",
    "unfollow": "Unfollow",
    "followerCount": "{{count}} followers",
    "emptyState": "Not following any businesses yet",
    "emptyStateSubtext": "Follow businesses to get updates on new events and deals"
  }
}
```

#### 5. Moderation Translations

```typescript
{
  "moderation": {
    "queueTitle": "Review Moderation Queue",
    "pending": "Pending",
    "approved": "Approved",
    "rejected": "Rejected",
    "approveButton": "Approve",
    "rejectButton": "Reject",
    "hideButton": "Hide",
    "notesLabel": "Moderation Notes",
    "notesPlaceholder": "Reason for decision...",
    "successApproved": "Review approved",
    "successRejected": "Review rejected",
    "filters": {
      "all": "All",
      "pending": "Pending",
      "approved": "Approved",
      "rejected": "Rejected"
    }
  }
}
```

#### 6. Empty States

```typescript
{
  "emptyStates": {
    "noReviews": {
      "title": "No reviews yet",
      "subtitle": "Be the first to review this business!"
    },
    "noSavedBusinesses": {
      "title": "No saved businesses yet",
      "subtitle": "Tap the heart icon on any business to save it here"
    },
    "noFollowing": {
      "title": "Not following any businesses yet",
      "subtitle": "Follow businesses to get updates on new events and deals"
    },
    "noReviewsWritten": {
      "title": "You haven't written any reviews yet",
      "subtitle": "Share your experiences to help others in the community"
    }
  }
}
```

### Language Detection

- Auto-detect review language using `franc` library (lightweight language detection)
- Store detected language in `review.language` field (ISO 639-1 code)
- Display language indicator on review card (optional)
- Future: Integration with Google Translate API (Phase 16) for review translations

### RTL Support

- Heart icon and save list dropdowns: Position correctly in RTL
- Review text alignment: RTL for Arabic/Urdu reviews
- Star rating: RTL order for Arabic/Urdu
- Form field order: Adjusted for RTL languages

---

## ACCESSIBILITY (WCAG 2.1 AA)

### Component Testing

- All review/rating/saved components must pass jest-axe tests
- Zero accessibility violations allowed (strict enforcement)
- Test at 3 breakpoints: mobile (<768px), tablet (768-1199px), desktop (≥1200px)

### Keyboard Navigation

#### Star Rating Input
- Tab to focus
- Arrow keys to select rating (Left/Right or Up/Down)
- Enter/Space to confirm rating
- Escape to cancel

#### Review List
- Tab through all interactive elements
- Arrow keys for pagination
- Enter/Space to activate buttons
- Tab order: Rating → Title → Content → Helpful → Report

#### Moderation Queue
- Full keyboard access for approve/reject actions
- Tab through pending reviews
- Enter to approve, Delete to reject (with confirmation)
- Escape to close modals

#### Modal Dialogs (Review Form, Save List Creation)
- Focus trap within modal
- Escape to close
- Tab cycles through form fields
- Enter to submit

### Screen Reader Support

#### Star Ratings
```html
<div role="slider"
     aria-label="Rate this business"
     aria-valuenow="4"
     aria-valuemin="1"
     aria-valuemax="5"
     aria-valuetext="4 out of 5 stars">
  <!-- Star icons -->
</div>
```

#### Review Cards
```html
<article aria-labelledby="review-title-123">
  <h3 id="review-title-123">Amazing coffee!</h3>
  <div aria-label="Rating: 5 out of 5 stars">★★★★★</div>
  <p>This cafe has the best flat whites...</p>
  <button aria-pressed="false">Helpful?</button>
</article>
```

#### Helpful Button
```html
<button
  aria-pressed="true"
  aria-label="You found this review helpful. Click to remove helpful vote.">
  Helpful (42)
</button>
```

#### Saved Status
```html
<button
  aria-pressed="true"
  aria-label="Business saved. Click to unsave.">
  <HeartIcon aria-hidden="true" />
  Saved
</button>

<!-- Live region for confirmation -->
<div role="status" aria-live="polite" aria-atomic="true">
  Added to saved list
</div>
```

### Focus Indicators

- 2px solid focus outline with 2px offset
- Visible on all interactive elements (buttons, links, inputs, star rating)
- Sufficient contrast (4.5:1 minimum against background)
- Never remove outlines with `outline: none` without replacement

### Touch Targets

- All buttons: ≥44px on mobile
- Star rating: ≥44px hit targets per star
- Helpful/report buttons: ≥44px spacing
- Save/follow buttons: ≥44px minimum

### Color Contrast

- Text on background: ≥4.5:1 (WCAG AA)
- Star icons: ≥3:1 (non-text elements)
- Disabled states: Clear visual indicator (not just color)
- Error messages: Icon + text (not color alone)

### Error Handling

- Validation errors announced to screen readers
- Form field errors: `aria-describedby` to error message
- Inline errors with `role="alert"` for live announcements
- Clear, actionable error messages

---

## SECURITY & PRIVACY (APP COMPLIANCE)

### Australian Privacy Principles (APP)

#### APP 1: Data Collection
- Reviews are public personal information
- User must consent to review publication (checkbox on form)
- Collect only necessary data: rating, text, photos, language
- Clear labeling: "Reviews are public and visible to everyone"

#### APP 2: Use & Disclosure
- Reviews used for business rating calculations
- Shared with business owner for response capability
- Subject to moderation access (staff only)
- Can be anonymized if user deletes account (Spec §5.2.2)

#### APP 3: Data Quality
- Review must be accurate (can edit within 7 days)
- Language auto-detection verified
- Photo alt-text validates accessibility

#### APP 4: Data Security
- Reviews encrypted in transit (HTTPS enforced)
- CSP headers in place (Phase 1 complete)
- AES-256-GCM encryption for sensitive data at rest
- Rate limiting on review creation (5 per hour per user, configurable)

#### APP 6: Openness
- Privacy policy must disclose review data handling
- Clear labeling: "Reviews are public"
- Link to privacy policy in review form footer

#### APP 11: Data Retention (Spec §5.2.2)
- Reviews: Indefinite retention (while business exists)
- Anonymized if user deletes account (replace name with "Former User")
- Moderation reports: 1 year minimum (audit trail)
- Audit logs: 7 years retention

### Input Validation & Sanitization

#### Review Content
- Sanitized with `isomorphic-dompurify` (Phase 1 already configured)
- HTML tags stripped (plain text only)
- Profanity filtering (configurable, opt-in)
- XSS prevention via React's default escaping

#### Photo Uploads
- Type validation: JPEG, PNG, WebP only
- Size validation: Max 5MB per photo (configurable)
- Dimension validation: Max 4096x4096px
- MIME type verification (not just extension)
- Sharp library for image processing (already in use, Phase 1)

#### SQL Injection Prevention
- Prisma ORM parameterized queries (already in use)
- No raw SQL queries without sanitization

### Rate Limiting

#### Review Creation
- 5 reviews per hour per user (configurable: `reviewsPerHour`)
- Returns 429 Too Many Requests after limit

#### Helpful Votes
- 1 vote per review per user (enforced via unique constraint)
- No rate limit needed (constraint prevents abuse)

#### Report Submission
- 10 reports per hour per user (configurable: `reportsPerHour`)
- Prevents spam reporting

#### Business Responses
- 10 responses per hour per business owner (prevent spam)

### Audit Logging

All moderation actions logged to `AuditLog` table:
- Review creation, edits, deletions
- Moderation approvals/rejections
- Business responses
- Report submissions
- User identity: IP, user-agent, role
- Moderator actions: reason, decision, timestamp
- Retention: 7 years (compliance requirement)

### Business Owner Verification

- Only verified owners can respond to reviews
- Response must be from business account, not impersonation
- JWT auth + ownership check on `/reviews/:id/respond`
- Track who responded and when (audit trail)

---

## CURRENT IMPLEMENTATION STATUS

### Already Implemented (Phases 1-5)

✅ **Phase 1: Foundation (59/59 tasks)**
- User authentication & authorization
- User model with roles: COMMUNITY, BUSINESS_OWNER, MODERATOR, ADMIN, SUPER_ADMIN
- Audit logging infrastructure (AuditLog model)
- Rate limiting middleware (7 custom limiters already configured)
- Input sanitization (isomorphic-dompurify)
- CSRF protection
- Business model with status tracking
- Multilingual support infrastructure (10 languages)
- Configuration system with platform.json

✅ **Phase 2: Authentication (33/33 tasks)**
- JWT authentication with HttpOnly cookies
- Email verification, password reset
- Session management
- Profile photo upload (reusable for review photos)

✅ **Phase 3: Design System (40/40 tasks)**
- 31 WCAG 2.1 AA components, 100% tests passing
- Modal, Toast, Alert (reusable for review form, success messages)
- FileUpload (reusable for review photos)
- Pagination (reusable for review list)
- EmptyState (reusable for no reviews, no saved)
- Badge (reusable for review status)

✅ **Phase 4: Business Directory (39/39 tasks)**
- Business entity with all fields
- Business profile page (add Reviews tab)
- API endpoints: GET/POST/PUT/DELETE `/businesses/*`
- 209 comprehensive tests

✅ **Phase 5: Search & Discovery (34/34 tasks)**
- Elasticsearch integration with optimized indexes
- SearchBar with autocomplete
- 7 filter types, 7 sort options
- Homepage with discovery sections
- 110+ tests added (1,419+ total passing)

### NOT Yet Implemented (Phase 6 Work)

❌ **Database Models**
- SavedBusiness model
- SavedList model
- BusinessFollow model
- Review model
- ReviewPhoto model
- ReviewHelpful model
- ModerationReport model
- Appeal model

❌ **API Endpoints**
- All Phase 6 endpoints (15+ total)
- Review CRUD endpoints
- Saved business endpoints
- Follow/unfollow endpoints
- Moderation endpoints

❌ **Frontend Components**
- StarRating component (1-5 star picker)
- ReviewForm component (modal with validation)
- ReviewCard component (display review with helpful/report)
- ReviewList component (sorting, filtering, pagination)
- BusinessResponse component (owner response display)
- SaveButton component (save/unsave toggle)
- SavedList page (list management)
- ModerationQueue component (admin interface)

❌ **Services**
- Review service (business logic)
- Moderation service (approval/rejection)
- Language detection utility
- Review validation schemas

❌ **Tests**
- Unit tests (services)
- Integration tests (API endpoints)
- Component tests (UI components with jest-axe)
- E2E tests (full workflows)

❌ **Integrations**
- Business profile Reviews tab
- Search results: Show average rating, review count
- User profile: Show "Reviews Written" section
- Email notifications (Phase 16)

---

## RELATED FEATURES & DEPENDENCIES

### Hard Dependencies (Must Complete Before Phase 6)

✅ **Phase 1: Foundation** - Database, auth, config, i18n infrastructure
✅ **Phase 2: Authentication** - User auth, JWT, session management
✅ **Phase 3: Design System** - UI components (Modal, FileUpload, Pagination)
✅ **Phase 4: Business Directory** - Business entity, profile pages
✅ **Phase 5: Search & Discovery** - Business search, discovery features

### Soft Dependencies (Phase 6 Can Proceed Independently)

- **Phase 7: Business Owner Features** - Claim flow, dashboard with review analytics
- **Phase 8: Events System** - Reviews could integrate with event attendance verification
- **Phase 10: Deals Hub** - Reviews could be linked to deal redemptions
- **Phase 12: Social Media Integration** - Reviews could be aggregated from social platforms
- **Phase 16: Notifications** - Email/push notifications for new reviews, responses

### Integration Points (Post-Phase 6)

1. **Business Profile Page (Phase 4)**
   - Add Reviews tab with ReviewList component
   - Show average rating (aggregate from reviews)
   - Show review count (total published reviews)
   - Add "Write a Review" button (opens ReviewForm modal)

2. **Search Results (Phase 5)**
   - Show average rating stars on business cards
   - Show review count (e.g., "4.5 stars (23 reviews)")
   - Add filter: "Minimum Rating" (4+ stars, 3+ stars)
   - Add sort option: "Highest Rated"

3. **User Profile (Phase 2)**
   - Add "Reviews Written" section
   - Show user's reviews with business names
   - Link to business profile from review

4. **Homepage (Phase 5)**
   - "Highly Rated" section already exists
   - Expand to show featured reviews (Phase 6.5 enhancement)

5. **Email Notifications (Phase 16)**
   - New review notification (to business owner)
   - Business response notification (to reviewer)
   - Review approved/rejected notification (to reviewer)

---

## PHASE COMPLETION CRITERIA

### Code Quality

✅ Zero TypeScript errors
✅ Zero `any` types
✅ No console statements (use logger utility from Phase 1)
✅ ESLint + Prettier passing
✅ Explicit return types on all functions

### Testing

✅ >80% code coverage (Phase 4 target: 60-80%, exceeded with 83%)
✅ All unit tests passing
✅ All integration tests passing
✅ All component tests passing (jest-axe included)
✅ E2E tests documented

### Accessibility

✅ WCAG 2.1 AA compliance (zero jest-axe violations)
✅ All components keyboard accessible
✅ 44px minimum touch targets on mobile
✅ Color contrast ≥4.5:1 for text
✅ Proper ARIA labeling and roles
✅ Screen reader tested (manual verification recommended)

### Documentation

✅ API endpoint documentation
✅ Component README files
✅ Architecture decisions documented
✅ Data models documented

### Security

✅ Input validation on all review fields
✅ Rate limiting enforced
✅ Audit logging for all moderation actions
✅ XSS prevention
✅ CSRF protection
✅ Authorization checks on all endpoints

### Internationalization

✅ All UI strings in translation files (no hardcoded English)
✅ RTL support tested (Arabic/Urdu)
✅ Language auto-detection for review content

---

## KEY FILES TO UNDERSTAND

### Specification Files

- `/Docs/Community_Hub_Specification_v2.md` - Master specification
  - §12.4 (Line 1819): Saved Businesses & Activity
  - §18 (Line 2155): Reviews & Ratings
  - §23.4 (Line 2420): Content Moderation
  - §24.1 (Line 2444): Review Guidelines

### Configuration

- `/config/platform.json` - Feature flags, limits, multilingual config
- `/packages/shared/src/config/platform-schema.ts` - Zod validation schema
- `/.env.example` - Environment variables (add review-specific vars)

### Database

- `/packages/backend/prisma/schema.prisma` - Add 8 new models
- `/packages/backend/prisma/migrations/` - Migration files

### Backend Structure

- `/packages/backend/src/routes/` - Route handlers
  - Add `review.ts` (review CRUD, helpful, report)
  - Add `saved.ts` (saved business CRUD)
  - Add `follow.ts` (follow/unfollow)
  - Expand `user.ts` (add /users/:id/reviews, /users/:id/saved, /users/:id/following)
  - Expand `business.ts` (add /businesses/:id/reviews, /businesses/:id/follow)

- `/packages/backend/src/services/` - Business logic
  - Add `review-service.ts` (create, update, delete, helpful, language detection)
  - Add `moderation-service.ts` (approve, reject, report, appeal)
  - Add `saved-service.ts` (save, unsave, list management)
  - Add `follow-service.ts` (follow, unfollow, get followers)

- `/packages/backend/src/middleware/` - Validation, auth, rate limiting
  - Add `review-validation.ts` (validate review fields)
  - Add `photo-upload.ts` (validate review photos)
  - Expand rate limiters (review creation, helpful votes, reports)

### Frontend Structure

- `/packages/frontend/src/components/` - React components
  - Add `review/StarRating.tsx` (1-5 star picker)
  - Add `review/ReviewForm.tsx` (modal with validation)
  - Add `review/ReviewCard.tsx` (display review)
  - Add `review/ReviewList.tsx` (sorting, filtering, pagination)
  - Add `review/BusinessResponse.tsx` (owner response)
  - Add `saved/SaveButton.tsx` (save/unsave toggle)
  - Add `saved/SavedList.tsx` (list management)
  - Add `moderation/ModerationQueue.tsx` (admin interface)

- `/packages/frontend/src/services/` - API clients
  - Add `review-api.ts` (review CRUD, helpful, report)
  - Add `saved-api.ts` (saved business CRUD)
  - Add `follow-api.ts` (follow/unfollow)

- `/packages/frontend/src/pages/` - Pages
  - Add `SavedBusinessesPage.tsx`
  - Add `ReviewsPage.tsx` (user's reviews)
  - Add `ModerationPage.tsx` (admin only)
  - Expand `BusinessProfilePage.tsx` (add Reviews tab)

- `/packages/frontend/src/i18n/locales/` - Translations
  - Expand `en.json` with Phase 6 strings
  - Expand `ar.json` with Phase 6 strings (all 10 languages)

### Testing

- `/packages/backend/src/routes/__tests__/` - API tests
  - Add `review.test.ts`
  - Add `saved.test.ts`
  - Add `follow.test.ts`

- `/packages/frontend/src/components/__tests__/` - Component tests
  - Add `StarRating.test.tsx`
  - Add `ReviewForm.test.tsx`
  - Add `ReviewCard.test.tsx`
  - Add `ReviewList.test.tsx`
  - Add `SaveButton.test.tsx`
  - Add `ModerationQueue.test.tsx`

### Documentation

- `/TODO.md` - 35 Phase 6 tasks defined
- `/PROGRESS.md` - Phase tracking (update after Phase 6 complete)
- `/CLAUDE.md` - Development workflow and standards

---

## TESTING STRATEGY (>80% Coverage Target)

### Unit Tests Required

#### Backend Services

1. **review-service.ts**
   - `createReview()` - Creates review with "pending" status
   - `updateReview()` - Allows edit within 7 days, rejects after
   - `deleteReview()` - Soft delete (status: deleted)
   - `markHelpful()` - Increments helpful_count, prevents duplicate votes
   - `unmarkHelpful()` - Decrements helpful_count
   - `respondToReview()` - Business owner adds response
   - `detectLanguage()` - Auto-detects review language (franc library)

2. **moderation-service.ts**
   - `approveReview()` - Sets status to "published", publishes_at timestamp
   - `rejectReview()` - Sets status to "hidden", logs reason
   - `reportReview()` - Creates ModerationReport entry
   - `appealRejection()` - Creates Appeal entry

3. **saved-service.ts**
   - `saveBusiness()` - Adds to SavedBusiness table
   - `unsaveBusiness()` - Removes from SavedBusiness table
   - `createList()` - Creates custom SavedList
   - `deleteList()` - Deletes list (cascade removes SavedBusiness entries)

4. **follow-service.ts**
   - `followBusiness()` - Adds to BusinessFollow table
   - `unfollowBusiness()` - Removes from BusinessFollow table
   - `getFollowerCount()` - Counts followers for business

#### Validation & Utilities

5. **review-validation.ts**
   - Schema validation (Zod): rating, title, content length
   - Photo validation: type, size, dimensions
   - Duplicate review check (one per user per business)

6. **language-detection.ts**
   - Detects language from review content (franc)
   - Returns ISO 639-1 code (e.g., "en", "ar", "zh")
   - Handles short text gracefully

---

### Integration Tests Required

#### API Endpoints

1. **Review CRUD Flow**
   - POST /businesses/:id/reviews → 201 Created (status: pending)
   - GET /businesses/:id/reviews → 200 OK (returns published reviews only)
   - PUT /reviews/:id → 200 OK (within 7 days)
   - PUT /reviews/:id → 403 Forbidden (after 7 days)
   - DELETE /reviews/:id → 204 No Content

2. **Review Editing Enforcement**
   - User submits review
   - User edits within 7 days (success)
   - Mock time to 8 days later
   - User attempts edit (403 Forbidden)

3. **Business Response Workflow**
   - User submits review (pending)
   - Moderator approves (published)
   - Business owner responds (success)
   - Non-owner attempts response (403 Forbidden)

4. **Helpful Voting**
   - User marks review as helpful (helpful_count: 1)
   - Same user attempts to vote again (409 Conflict)
   - User unmarks helpful (helpful_count: 0)

5. **Saved Business Persistence**
   - User saves business to default list (success)
   - User creates custom list (success)
   - User saves business to custom list (success)
   - User unsaves business (success)
   - Verify data persists across sessions

6. **Moderation Queue**
   - GET /admin/moderation/reviews?status=pending → 200 OK (pending reviews)
   - POST /admin/moderation/reviews/:id/approve → 200 OK (status: published)
   - POST /admin/moderation/reviews/:id/reject → 200 OK (status: hidden)
   - Non-moderator attempts access (403 Forbidden)

7. **Rate Limiting Enforcement**
   - User submits 5 reviews in 1 hour (success)
   - User attempts 6th review (429 Too Many Requests)
   - Wait 1 hour (mock time)
   - User submits review (success)

---

### Component Tests Required

#### React Components (with jest-axe)

1. **StarRating Component**
   - Renders 5 stars
   - Keyboard navigation (arrow keys)
   - Mouse/touch interaction
   - Displays current value
   - Calls onChange when value changes
   - Zero accessibility violations (jest-axe)

2. **ReviewForm Component**
   - Renders form fields (rating, title, content, photos)
   - Validates minimum/maximum content length
   - Shows character counter
   - Photo upload (drag-drop, click to upload)
   - Submits data correctly
   - Displays validation errors
   - Zero accessibility violations (jest-axe)

3. **ReviewCard Component**
   - Displays review data (rating, title, content, author, date)
   - Shows review photos (gallery)
   - Helpful button (toggle state)
   - Report button (opens modal)
   - Business response (if present)
   - Keyboard navigation (Tab to all interactive elements)
   - Zero accessibility violations (jest-axe)

4. **ReviewList Component**
   - Displays multiple ReviewCard components
   - Sort dropdown (newest, helpful, highest, lowest)
   - Filter by rating (all, 5-star, 4-star, etc.)
   - Pagination (Pagination component from Phase 3)
   - Empty state (EmptyState component from Phase 3)
   - Loading state (Skeleton component from Phase 3)
   - Zero accessibility violations (jest-axe)

5. **SaveButton Component**
   - Displays heart icon
   - Toggle state (saved/unsaved)
   - Tooltip "Save This Business"
   - Opens list selection modal (optional)
   - Requires authentication (redirects if not logged in)
   - Zero accessibility violations (jest-axe)

6. **ModerationQueue Component**
   - Displays pending reviews table
   - Approve/Reject buttons
   - Notes field for moderation reason
   - Filters (status, age, type)
   - Bulk actions (optional, Phase 6.5)
   - Zero accessibility violations (jest-axe)

7. **SavedBusinessesList Component**
   - Displays saved businesses grid
   - List selection dropdown
   - Unsave/remove actions
   - Manage lists modal (create, rename, delete)
   - Empty state
   - Zero accessibility violations (jest-axe)

---

### E2E Tests Required

#### Complete User Workflows

1. **Review Submission Flow**
   - User navigates to business profile
   - Clicks "Write a Review" button
   - ReviewForm modal opens
   - User selects 5-star rating
   - User enters title and content
   - User uploads 2 photos
   - User submits form
   - Success toast appears
   - Review enters moderation queue (status: pending)
   - Review does NOT appear on business profile yet

2. **Review Approval Flow**
   - Moderator logs in
   - Navigates to moderation queue
   - Filters by "Pending"
   - Reviews pending review
   - Approves review with notes
   - Review status changes to "published"
   - Review appears on business profile

3. **Business Response Flow**
   - Business owner logs in
   - Navigates to their business profile
   - Sees published review
   - Clicks "Respond to Review"
   - Enters response text
   - Submits response
   - Response appears below review
   - User receives notification (Phase 16)

4. **Saved Business Flow**
   - User navigates to business profile
   - Clicks heart icon (Save button)
   - Business saved to default list
   - User navigates to "Saved Businesses" page
   - Sees saved business in list
   - Creates custom list "To Try"
   - Moves business to "To Try" list
   - Business appears in custom list

5. **Review Editing Flow**
   - User submits review (success)
   - User navigates to their reviews
   - Clicks "Edit Review" button
   - ReviewForm modal opens with existing data
   - User updates content
   - User submits changes (success within 7 days)
   - Updated review re-enters moderation queue

6. **Review Deletion Flow**
   - User navigates to their reviews
   - Clicks "Delete Review" button
   - Confirmation modal appears
   - User confirms deletion
   - Review status changes to "deleted"
   - Review disappears from business profile

7. **Helpful Voting Flow**
   - User navigates to business profile
   - Scrolls to reviews
   - Clicks "Helpful?" button on review
   - Button state changes to "You found this helpful"
   - Helpful count increments by 1
   - User clicks button again to undo
   - Helpful count decrements by 1

---

## DATABASE SCHEMA (Prisma)

### New Models to Add

```prisma
// packages/backend/prisma/schema.prisma

model SavedBusiness {
  id          String    @id @default(uuid())
  userId      String    @map("user_id")
  businessId  String    @map("business_id")
  listId      String?   @map("list_id")
  notes       String?   @db.VarChar(500)
  createdAt   DateTime  @default(now()) @map("created_at")

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  business    Business  @relation(fields: [businessId], references: [id], onDelete: Cascade)
  list        SavedList? @relation(fields: [listId], references: [id], onDelete: SetNull)

  @@unique([userId, businessId])
  @@index([userId])
  @@index([businessId])
  @@index([listId])
  @@map("saved_businesses")
}

model SavedList {
  id          String    @id @default(uuid())
  userId      String    @map("user_id")
  name        String    @db.VarChar(50)
  isDefault   Boolean   @default(false) @map("is_default")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  savedBusinesses SavedBusiness[]

  @@index([userId])
  @@index([userId, isDefault])
  @@map("saved_lists")
}

model Review {
  id                  String         @id @default(uuid())
  businessId          String         @map("business_id")
  userId              String         @map("user_id")
  rating              Int            @db.SmallInt // 1-5
  title               String?        @db.VarChar(100)
  content             String         @db.Text // 50-1000 chars (validated in code)
  language            String         @default("en") @db.VarChar(10) // ISO 639-1
  helpfulCount        Int            @default(0) @map("helpful_count")
  status              ReviewStatus   @default(PENDING)
  moderationNotes     String?        @db.Text @map("moderation_notes")
  businessResponse    String?        @db.VarChar(500) @map("business_response")
  businessResponseAt  DateTime?      @map("business_response_at")
  createdAt           DateTime       @default(now()) @map("created_at")
  updatedAt           DateTime       @updatedAt @map("updated_at")
  publishedAt         DateTime?      @map("published_at")

  business    Business       @relation(fields: [businessId], references: [id], onDelete: Cascade)
  user        User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  photos      ReviewPhoto[]
  helpful     ReviewHelpful[]
  reports     ModerationReport[]

  @@unique([userId, businessId])
  @@index([businessId])
  @@index([userId])
  @@index([status])
  @@index([createdAt])
  @@index([helpfulCount])
  @@map("reviews")
}

enum ReviewStatus {
  PENDING
  PUBLISHED
  HIDDEN
  DELETED
}

model ReviewPhoto {
  id          String    @id @default(uuid())
  reviewId    String    @map("review_id")
  url         String    @db.VarChar(500)
  altText     String    @db.VarChar(200) @map("alt_text")
  order       Int       @default(0)
  createdAt   DateTime  @default(now()) @map("created_at")

  review      Review    @relation(fields: [reviewId], references: [id], onDelete: Cascade)

  @@index([reviewId])
  @@map("review_photos")
}

model ReviewHelpful {
  id          String    @id @default(uuid())
  reviewId    String    @map("review_id")
  userId      String    @map("user_id")
  createdAt   DateTime  @default(now()) @map("created_at")

  review      Review    @relation(fields: [reviewId], references: [id], onDelete: Cascade)
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([reviewId, userId])
  @@index([reviewId])
  @@index([userId])
  @@map("review_helpful")
}

model BusinessFollow {
  id          String    @id @default(uuid())
  userId      String    @map("user_id")
  businessId  String    @map("business_id")
  createdAt   DateTime  @default(now()) @map("created_at")

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  business    Business  @relation(fields: [businessId], references: [id], onDelete: Cascade)

  @@unique([userId, businessId])
  @@index([userId])
  @@index([businessId])
  @@map("business_follows")
}

model ModerationReport {
  id            String              @id @default(uuid())
  reporterId    String              @map("reporter_id")
  contentType   ContentType         @map("content_type")
  contentId     String              @map("content_id")
  reason        ReportReason
  details       String?             @db.VarChar(500)
  status        ModerationStatus    @default(PENDING)
  moderatorId   String?             @map("moderator_id")
  moderatorNotes String?            @db.Text @map("moderator_notes")
  actionTaken   ModerationAction?   @map("action_taken")
  createdAt     DateTime            @default(now()) @map("created_at")
  reviewedAt    DateTime?           @map("reviewed_at")

  reporter      User                @relation("ReportedBy", fields: [reporterId], references: [id], onDelete: Cascade)
  moderator     User?               @relation("ModeratedBy", fields: [moderatorId], references: [id], onDelete: SetNull)

  @@index([status])
  @@index([contentType, contentId])
  @@index([reporterId])
  @@index([moderatorId])
  @@map("moderation_reports")
}

enum ContentType {
  REVIEW
  NOTICE
  MESSAGE
  BUSINESS
  EVENT
}

enum ReportReason {
  SPAM
  INAPPROPRIATE
  FAKE
  HARASSMENT
  OTHER
}

enum ModerationStatus {
  PENDING
  REVIEWED
  ACTIONED
  DISMISSED
}

enum ModerationAction {
  NONE
  WARNING
  CONTENT_REMOVED
  USER_SUSPENDED
}

model Appeal {
  id                  String        @id @default(uuid())
  userId              String        @map("user_id")
  contentType         String        @db.VarChar(50) @map("content_type")
  contentId           String        @map("content_id")
  originalAction      String        @db.VarChar(100) @map("original_action")
  reason              String        @db.Text // max 1000 chars
  supportingEvidence  String[]      @map("supporting_evidence") // Array of file URLs
  status              AppealStatus  @default(PENDING)
  reviewerId          String?       @map("reviewer_id")
  reviewerNotes       String?       @db.Text @map("reviewer_notes")
  createdAt           DateTime      @default(now()) @map("created_at")
  reviewedAt          DateTime?     @map("reviewed_at")

  user        User      @relation("AppealedBy", fields: [userId], references: [id], onDelete: Cascade)
  reviewer    User?     @relation("AppealReviewedBy", fields: [reviewerId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([status])
  @@index([reviewerId])
  @@map("appeals")
}

enum AppealStatus {
  PENDING
  UPHELD
  REJECTED
}
```

### Update Existing Models

```prisma
model User {
  // ... existing fields ...

  // Phase 6 relations
  savedBusinesses   SavedBusiness[]
  savedLists        SavedList[]
  reviews           Review[]
  reviewsHelpful    ReviewHelpful[]
  following         BusinessFollow[]
  reportsSubmitted  ModerationReport[] @relation("ReportedBy")
  reportsModerated  ModerationReport[] @relation("ModeratedBy")
  appealsSubmitted  Appeal[]           @relation("AppealedBy")
  appealsReviewed   Appeal[]           @relation("AppealReviewedBy")
}

model Business {
  // ... existing fields ...

  // Phase 6 relations
  savedBy       SavedBusiness[]
  reviews       Review[]
  followers     BusinessFollow[]
}
```

---

## FRONTEND COMPONENT ARCHITECTURE

### Review System Components

#### 1. StarRating Component

**Purpose:** Input component for selecting 1-5 star rating

**Props:**
```typescript
interface StarRatingProps {
  value: number;              // Current rating (1-5)
  onChange: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';  // Icon size
  disabled?: boolean;
  readOnly?: boolean;         // Display only (no interaction)
  showLabel?: boolean;        // Show "X out of 5 stars" text
  className?: string;
}
```

**Features:**
- Mouse/touch interaction (click star to select)
- Keyboard navigation (arrow keys, Enter to confirm)
- Hover preview (show rating on hover)
- WCAG 2.1 AA compliant (role="slider", aria-label, aria-valuenow)
- Zero jest-axe violations

**Usage:**
```tsx
<StarRating
  value={rating}
  onChange={setRating}
  showLabel
  aria-label="Rate this business"
/>
```

---

#### 2. ReviewForm Component

**Purpose:** Modal form for submitting/editing reviews

**Props:**
```typescript
interface ReviewFormProps {
  businessId: string;
  existingReview?: Review;    // For editing
  onSuccess: () => void;
  onCancel: () => void;
}
```

**Features:**
- Star rating input (StarRating component)
- Title field (optional, max 100 chars)
- Content field (50-1000 chars with live counter)
- Photo upload (drag-drop, max 3, FileUpload component from Phase 3)
- Validation errors (inline, accessible)
- Submit/Cancel buttons
- Loading state during submission
- Success/error toast messages (Toast component from Phase 3)

**Validation:**
- Rating required (1-5)
- Content min 50 chars, max 1000 chars
- Photo type: JPEG, PNG, WebP only
- Photo size: Max 5MB per photo

**Usage:**
```tsx
<Modal open={isOpen} onClose={handleClose}>
  <ReviewForm
    businessId={businessId}
    onSuccess={handleSuccess}
    onCancel={handleClose}
  />
</Modal>
```

---

#### 3. ReviewCard Component

**Purpose:** Display single review with interactions

**Props:**
```typescript
interface ReviewCardProps {
  review: Review;
  onHelpful: (reviewId: string) => void;
  onReport: (reviewId: string) => void;
  onEdit?: (reviewId: string) => void;    // Only for own reviews
  onDelete?: (reviewId: string) => void;  // Only for own reviews
  showBusiness?: boolean;                 // Show business name (for user profile)
}
```

**Features:**
- Author avatar + name
- Star rating display (StarRating component in readOnly mode)
- Publication date (relative time: "2 days ago")
- Review title (if present, bold)
- Review text (expandable if >500 chars with "Read more" button)
- Review photos (gallery, lightbox on click)
- Helpful button (toggle state, shows count)
- Report button (opens report modal)
- Business response (if present, BusinessResponse component)
- Edit/Delete buttons (only for own reviews, within 7 days)

**Usage:**
```tsx
<ReviewCard
  review={review}
  onHelpful={handleHelpful}
  onReport={handleReport}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

---

#### 4. ReviewList Component

**Purpose:** Container for displaying multiple reviews with sorting/filtering

**Props:**
```typescript
interface ReviewListProps {
  businessId: string;
  initialSort?: 'newest' | 'helpful' | 'highest' | 'lowest';
  showFilters?: boolean;
}
```

**Features:**
- Sort dropdown (newest, most helpful, highest rating, lowest rating)
- Filter by rating (all, 5-star, 4-star, 3-star, 2-star, 1-star)
- Pagination (10 reviews per page, Pagination component from Phase 3)
- Empty state (EmptyState component from Phase 3)
- Loading state (Skeleton component from Phase 3)
- Review count summary ("23 reviews")
- Average rating display (aggregated)

**Usage:**
```tsx
<ReviewList
  businessId={businessId}
  initialSort="newest"
  showFilters
/>
```

---

#### 5. BusinessResponse Component

**Purpose:** Display business owner response to review

**Props:**
```typescript
interface BusinessResponseProps {
  response: string;
  respondedAt: Date;
  ownerName: string;
  onEdit?: () => void;  // Only for business owner
}
```

**Features:**
- "Business Owner Response" label
- Response text
- Owner name (e.g., "John Smith, Owner")
- Response date (relative time)
- Edit button (only for business owner)

**Usage:**
```tsx
{review.businessResponse && (
  <BusinessResponse
    response={review.businessResponse}
    respondedAt={review.businessResponseAt}
    ownerName={business.ownerName}
  />
)}
```

---

#### 6. SaveButton Component

**Purpose:** Toggle button for saving/unsaving businesses

**Props:**
```typescript
interface SaveButtonProps {
  businessId: string;
  isSaved: boolean;
  onToggle: (saved: boolean) => void;
  showListModal?: boolean;  // Show list selection modal
  variant?: 'icon' | 'button';
  size?: 'sm' | 'md' | 'lg';
}
```

**Features:**
- Heart icon (filled when saved, outline when not)
- Tooltip "Save This Business" (unsaved) / "Saved" (saved)
- Toggle state (saved/unsaved)
- Requires authentication (redirects if not logged in)
- Optional list selection modal (choose which list to save to)
- Live region announcement "Added to saved list"

**Usage:**
```tsx
<SaveButton
  businessId={businessId}
  isSaved={isSaved}
  onToggle={handleToggle}
  showListModal
  variant="icon"
/>
```

---

#### 7. SavedBusinessesList Component

**Purpose:** Page displaying user's saved businesses with list management

**Props:**
```typescript
interface SavedBusinessesListProps {
  userId: string;
}
```

**Features:**
- List selection dropdown (default list + custom lists)
- Saved businesses grid (business cards with unsave button)
- "Create New List" button (opens modal)
- "Manage Lists" button (opens modal for rename/delete)
- Empty state (EmptyState component from Phase 3)
- Notes display (if user added notes)

**Usage:**
```tsx
<SavedBusinessesList userId={currentUser.id} />
```

---

#### 8. ModerationQueue Component

**Purpose:** Admin interface for reviewing pending reviews

**Props:**
```typescript
interface ModerationQueueProps {
  // No props, fetches data internally
}
```

**Features:**
- Pending reviews table (business name, reviewer, rating, content preview)
- Approve/Reject buttons per review
- Notes field for moderation reason
- Filters (status: pending/approved/rejected, age: newest/oldest)
- Bulk actions (approve/reject selected, Phase 6.5 enhancement)
- Pagination

**Usage:**
```tsx
<ModerationQueue />  {/* Admin/Moderator only */}
```

---

## IMPLEMENTATION CHECKLIST

### Database & Schema

- [ ] Add 8 new Prisma models (SavedBusiness, SavedList, Review, ReviewPhoto, ReviewHelpful, BusinessFollow, ModerationReport, Appeal)
- [ ] Add enums (ReviewStatus, ContentType, ReportReason, ModerationStatus, ModerationAction, AppealStatus)
- [ ] Update User model (add relations)
- [ ] Update Business model (add relations)
- [ ] Create migration file
- [ ] Run migration
- [ ] Seed database with test data

### Backend API

- [ ] Review service (create, update, delete, helpful, language detection)
- [ ] Moderation service (approve, reject, report, appeal)
- [ ] Saved business service (save, unsave, list management)
- [ ] Follow service (follow, unfollow, get followers)
- [ ] Review validation schemas (Zod)
- [ ] Photo upload validation
- [ ] Rate limiters (review creation, helpful votes, reports)
- [ ] Review CRUD endpoints (/businesses/:id/reviews, /reviews/:id)
- [ ] Saved business endpoints (/users/:id/saved)
- [ ] Follow endpoints (/businesses/:id/follow)
- [ ] Moderation endpoints (/admin/moderation/reviews)
- [ ] Authorization middleware (business owner, moderator)
- [ ] Unit tests (services)
- [ ] Integration tests (API endpoints)

### Frontend Components

- [ ] StarRating component (1-5 star picker)
- [ ] ReviewForm component (modal with validation)
- [ ] ReviewCard component (display review)
- [ ] ReviewList component (sorting, filtering, pagination)
- [ ] BusinessResponse component (owner response display)
- [ ] SaveButton component (save/unsave toggle)
- [ ] SavedBusinessesList component (page with list management)
- [ ] ModerationQueue component (admin interface)
- [ ] Component tests (jest-axe for all)

### Frontend Services (API Clients)

- [ ] review-api.ts (review CRUD, helpful, report)
- [ ] saved-api.ts (saved business CRUD)
- [ ] follow-api.ts (follow/unfollow)

### Frontend Pages

- [ ] SavedBusinessesPage.tsx
- [ ] ReviewsPage.tsx (user's reviews)
- [ ] ModerationPage.tsx (admin only)
- [ ] Update BusinessProfilePage.tsx (add Reviews tab)
- [ ] Update UserProfilePage.tsx (add Reviews Written section)

### Internationalization

- [ ] Expand en.json with Phase 6 strings
- [ ] Expand ar.json with Phase 6 strings
- [ ] Translate to all 10 languages (zh-CN, zh-TW, vi, hi, ur, ko, el, it)
- [ ] Language detection utility (franc library)

### Configuration

- [ ] Add Phase 6 feature flags to platform.json
- [ ] Add Phase 6 limits to platform.json
- [ ] Add moderation settings to platform.json
- [ ] Update platform-schema.ts (Zod validation)

### Testing

- [ ] Unit tests: review-service.ts
- [ ] Unit tests: moderation-service.ts
- [ ] Unit tests: saved-service.ts
- [ ] Unit tests: follow-service.ts
- [ ] Integration tests: review endpoints
- [ ] Integration tests: saved endpoints
- [ ] Integration tests: follow endpoints
- [ ] Integration tests: moderation endpoints
- [ ] Component tests: StarRating (jest-axe)
- [ ] Component tests: ReviewForm (jest-axe)
- [ ] Component tests: ReviewCard (jest-axe)
- [ ] Component tests: ReviewList (jest-axe)
- [ ] Component tests: SaveButton (jest-axe)
- [ ] Component tests: ModerationQueue (jest-axe)
- [ ] E2E test: Review submission flow
- [ ] E2E test: Review approval flow
- [ ] E2E test: Business response flow
- [ ] E2E test: Saved business flow
- [ ] Coverage report (>80% target)

### Documentation

- [ ] API endpoint documentation
- [ ] Component README files
- [ ] Architecture decisions
- [ ] Data models documentation
- [ ] Update PROGRESS.md
- [ ] Update TODO.md (mark Phase 6 tasks complete)

### Integration

- [ ] Add Reviews tab to BusinessProfilePage
- [ ] Show average rating on business cards (search results)
- [ ] Show review count on business cards
- [ ] Add "Write a Review" button to business profile
- [ ] Add "Reviews Written" section to user profile
- [ ] Add review count to business profile header

### Security & Compliance

- [ ] Input validation (all review fields)
- [ ] Rate limiting enforcement (5/hr review creation)
- [ ] Audit logging (all moderation actions)
- [ ] XSS prevention (sanitize review content)
- [ ] CSRF protection (already in place)
- [ ] Authorization checks (all endpoints)
- [ ] Privacy policy update (review data handling)

### Final QA

- [ ] Zero TypeScript errors
- [ ] Zero `any` types
- [ ] No console statements
- [ ] ESLint + Prettier passing
- [ ] All tests passing (>80% coverage)
- [ ] WCAG 2.1 AA compliance (zero jest-axe violations)
- [ ] Keyboard navigation tested
- [ ] Screen reader tested (manual)
- [ ] RTL support tested (Arabic/Urdu)
- [ ] Mobile responsive (3 breakpoints)
- [ ] Performance tested (Lighthouse >80)

---

## SUMMARY

**Phase 6: User Engagement Features** is a substantial phase (35 tasks) that introduces user-generated content to the Community Hub platform. It builds on the solid foundation of Phases 1-5 and adds critical engagement features:

1. **Reviews & Ratings** - Users can submit reviews with photos, ratings, and text
2. **Saved Businesses** - Users can save businesses to custom lists
3. **Following** - Users can follow businesses for updates
4. **Moderation** - Admin queue for reviewing user-generated content
5. **Business Responses** - Business owners can respond to reviews

**Key Success Factors:**
- WCAG 2.1 AA compliance (zero violations, full keyboard navigation)
- >80% test coverage (comprehensive unit, integration, component, E2E tests)
- Location-agnostic configuration (no hardcoded limits or rules)
- Multilingual support (10 languages + RTL)
- Security & privacy (APP compliance, rate limiting, audit logging)
- Mobile-first responsive design (44px touch targets)

**Estimated Effort:** 60-80 hours based on Phase 4 (209 tests, 39 tasks) and Phase 5 (110+ tests, 34 tasks).

**Next Steps After Phase 6:**
- Phase 7: Business Owner Features (claim flow, dashboard with review analytics)
- Phase 8: Events System (could integrate with reviews)
- Phase 16: Notifications (email/push for review responses)

This research provides a comprehensive foundation for implementing Phase 6 with full understanding of requirements, architecture, and quality standards.
