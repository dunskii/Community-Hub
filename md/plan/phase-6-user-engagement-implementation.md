# Phase 6: User Engagement Features - Implementation Plan

**Status:** Ready to Start (0/35 tasks)
**Estimated Effort:** 60-80 hours
**Dependencies:** Phases 1-5 Complete ✅
**Target Completion:** March 2026

---

## EXECUTIVE SUMMARY

Phase 6 introduces critical user engagement features that transform the Community Hub from a passive directory into an active community platform. This phase adds:

1. **Reviews & Ratings** - Users submit reviews with 1-5 stars, text (50-1000 chars), and up to 3 photos
2. **Saved Businesses** - Users save businesses to custom lists for later reference
3. **Business Following** - Users follow businesses to receive updates (notifications in Phase 16)
4. **Moderation Infrastructure** - Admin queue for reviewing user-generated content
5. **Business Responses** - Business owners respond publicly to reviews

**Key Success Metrics:**
- ✅ WCAG 2.1 AA compliance (zero jest-axe violations)
- ✅ >80% test coverage (comprehensive unit, integration, component, E2E tests)
- ✅ Location-agnostic (all limits/rules from `platform.json`)
- ✅ Multilingual (10 languages + RTL support)
- ✅ Security & Privacy (APP compliance, rate limiting, audit logging)
- ✅ Mobile-first (44px touch targets, responsive at 3 breakpoints)

---

## IMPLEMENTATION STRATEGY

### Phase Structure

The implementation is divided into 8 sequential phases:

1. **Configuration & Schema** (4-6 hours) - Database models, migrations, platform.json
2. **Backend Services** (10-12 hours) - Business logic, validation, utilities
3. **API Endpoints** (8-10 hours) - RESTful routes with auth/validation
4. **Frontend Components** (12-15 hours) - React components (StarRating, ReviewForm, etc.)
5. **Frontend Pages** (6-8 hours) - Full pages and integrations
6. **Internationalization** (4-6 hours) - Translation files for 10 languages
7. **Testing** (16-20 hours) - Unit, integration, component, E2E tests
8. **Documentation & QA** (4-6 hours) - API docs, progress updates, final QA

### Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Complex moderation workflow | High | Start with manual approval, add auto-moderation later |
| Photo upload handling | Medium | Reuse Phase 2 profile photo upload infrastructure |
| Review editing 7-day window | Medium | Store `createdAt` and validate server-side |
| Language auto-detection accuracy | Low | Use `franc` library with fallback to user's preference |

---

## PHASE 1: CONFIGURATION & SCHEMA (4-6 hours)

### 1.1 Update Platform Configuration

**File:** `config\platform.json`

**Add to `features` object:**
```json
{
  "features": {
    "reviewsAndRatings": true,
    "savedBusinesses": true,
    "businessFollowing": true,
    "reviewModeration": true,
    "reviewPhotos": true,
    "businessResponses": true
  }
}
```

**Add to `limits` object:**
```json
{
  "limits": {
    "reviewEditWindowDays": 7,
    "minReviewLength": 50,
    "maxReviewLength": 1000,
    "maxReviewPhotos": 3,
    "maxReviewPhotoSizeMB": 5,
    "maxSavedBusinessesPerUser": 1000,
    "maxCustomLists": 10,
    "maxListNameLength": 50,
    "reviewsPerHour": 5,
    "reportsPerHour": 10,
    "businessResponseMaxLength": 500
  }
}
```

**Add to root level:**
```json
{
  "moderation": {
    "reviewsModerationRequired": true,
    "autoRejectPatterns": [],
    "profanityFilterEnabled": false,
    "spamDetectionEnabled": true,
    "moderationPriority": "manual"
  }
}
```

**Success Criteria:**
- ✅ JSON validates (no syntax errors)
- ✅ All new fields follow naming conventions
- ✅ Values are location-agnostic (no hardcoded suburb names)

---

### 1.2 Update Platform Schema Validation

**File:** `packages\shared\src\config\platform-schema.ts`

**Add to Zod schema:**
```typescript
// Add to features schema
const featuresSchema = z.object({
  // ... existing features ...
  reviewsAndRatings: z.boolean().default(true),
  savedBusinesses: z.boolean().default(true),
  businessFollowing: z.boolean().default(true),
  reviewModeration: z.boolean().default(true),
  reviewPhotos: z.boolean().default(true),
  businessResponses: z.boolean().default(true),
});

// Add to limits schema
const limitsSchema = z.object({
  // ... existing limits ...
  reviewEditWindowDays: z.number().int().min(0).max(30).default(7),
  minReviewLength: z.number().int().min(10).max(100).default(50),
  maxReviewLength: z.number().int().min(100).max(5000).default(1000),
  maxReviewPhotos: z.number().int().min(0).max(10).default(3),
  maxReviewPhotoSizeMB: z.number().min(1).max(20).default(5),
  maxSavedBusinessesPerUser: z.number().int().min(10).max(10000).default(1000),
  maxCustomLists: z.number().int().min(1).max(50).default(10),
  maxListNameLength: z.number().int().min(10).max(100).default(50),
  reviewsPerHour: z.number().int().min(1).max(100).default(5),
  reportsPerHour: z.number().int().min(1).max(100).default(10),
  businessResponseMaxLength: z.number().int().min(100).max(2000).default(500),
});

// Add moderation schema
const moderationSchema = z.object({
  reviewsModerationRequired: z.boolean().default(true),
  autoRejectPatterns: z.array(z.string()).default([]),
  profanityFilterEnabled: z.boolean().default(false),
  spamDetectionEnabled: z.boolean().default(true),
  moderationPriority: z.enum(['auto', 'manual', 'hybrid']).default('manual'),
});

// Add to root schema
const platformConfigSchema = z.object({
  // ... existing fields ...
  moderation: moderationSchema,
});
```

**Success Criteria:**
- ✅ Schema validates successfully
- ✅ Default values match platform.json
- ✅ Type inference works (`getPlatformConfig()` returns correct types)

---

### 1.3 Add Database Models (Prisma Schema)

**File:** `packages\backend\prisma\schema.prisma`

**Add 6 new enums:**
```prisma
enum ReviewStatus {
  PENDING
  PUBLISHED
  HIDDEN
  DELETED
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

enum AppealStatus {
  PENDING
  UPHELD
  REJECTED
}
```

**Add 8 new models:**
```prisma
/// Spec A.16 - User's saved businesses
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

/// Spec A.16 - User's custom lists for organizing saved businesses
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

/// Spec A.4 - Business reviews with ratings and photos
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

/// Spec A.4 - Photos attached to reviews
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

/// Spec A.4 - Track helpful votes on reviews
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

/// Spec A.23 - Users following businesses
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

/// Spec A.22 - Content moderation reports
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

/// Spec A.22 - Appeals for moderation decisions
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
```

**Update User model:**
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
```

**Update Business model:**
```prisma
model Business {
  // ... existing fields ...

  // Phase 6 relations
  savedBy       SavedBusiness[]
  reviews       Review[]
  followers     BusinessFollow[]
}
```

**Success Criteria:**
- ✅ Prisma format validates (`npx prisma format`)
- ✅ All indexes are logical and necessary
- ✅ Cascade deletes protect data integrity
- ✅ Unique constraints prevent duplicates

---

### 1.4 Create Database Migration

**Command:**
```bash
cd packages/backend
npx prisma migrate dev --name add_phase6_user_engagement
```

**Expected Output:**
- New migration file in `packages/backend/prisma/migrations/`
- 8 new tables created
- 6 new enums created
- Relations established

**Success Criteria:**
- ✅ Migration runs without errors
- ✅ All tables created with correct schema
- ✅ Indexes created successfully
- ✅ Foreign keys established

---

### 1.5 Generate Prisma Client

**Command:**
```bash
cd packages/backend
npx prisma generate
```

**Success Criteria:**
- ✅ Updated Prisma Client types available
- ✅ No compilation errors in backend

---

## PHASE 2: BACKEND SERVICES (10-12 hours)

### 2.1 Language Detection Utility

**File:** `packages\backend\src\utils\language-detection.ts`

**Purpose:** Auto-detect language of review content using franc library

**Dependencies:**
```bash
npm install franc --workspace=@community-hub/backend
npm install -D @types/franc --workspace=@community-hub/backend
```

**Implementation:**
```typescript
import { franc } from 'franc';
import { logger } from './logger.js';

/**
 * Detects the language of the given text using franc library
 * Returns ISO 639-1 language code (e.g., 'en', 'ar', 'zh')
 * Fallback to provided defaultLanguage if detection fails
 */
export function detectLanguage(
  text: string,
  defaultLanguage: string = 'en'
): string {
  if (!text || text.trim().length < 10) {
    return defaultLanguage;
  }

  try {
    // franc returns ISO 639-3 codes, convert to ISO 639-1
    const detected = franc(text, { minLength: 10 });

    // Map common ISO 639-3 to ISO 639-1
    const iso6393to6391: Record<string, string> = {
      'eng': 'en',
      'ara': 'ar',
      'cmn': 'zh',
      'vie': 'vi',
      'hin': 'hi',
      'urd': 'ur',
      'kor': 'ko',
      'ell': 'el',
      'ita': 'it',
    };

    const language = iso6393to6391[detected] || defaultLanguage;

    logger.debug({ detected, language, textLength: text.length }, 'Language detected');

    return language;
  } catch (error) {
    logger.warn({ error }, 'Language detection failed, using default');
    return defaultLanguage;
  }
}
```

**Unit Tests:**
- Test English text returns 'en'
- Test Arabic text returns 'ar'
- Test Chinese text returns 'zh'
- Test short text (<10 chars) returns default
- Test empty string returns default
- Test detection failure returns default

**Success Criteria:**
- ✅ Detects English, Arabic, Chinese correctly
- ✅ Handles edge cases gracefully
- ✅ 100% test coverage

---

### 2.2 Review Service

**File:** `packages\backend\src\services\review-service.ts`

**Purpose:** Business logic for review CRUD, helpful votes, language detection

**Pattern Reference:** `packages\backend\src\services\business-service.ts`

**Key Methods:**
1. `createReview(data, userId, auditContext)` - Creates review with PENDING status
2. `updateReview(reviewId, data, userId, auditContext)` - Updates within 7-day window
3. `deleteReview(reviewId, userId, auditContext)` - Soft delete (status: DELETED)
4. `getReviewById(reviewId)` - Fetch single review
5. `getBusinessReviews(businessId, filters, pagination)` - List reviews for business
6. `getUserReviews(userId, pagination)` - List user's reviews
7. `markHelpful(reviewId, userId)` - Increment helpful count
8. `unmarkHelpful(reviewId, userId)` - Decrement helpful count
9. `canEditReview(review, userId)` - Check 7-day edit window
10. `respondToReview(reviewId, response, businessOwnerId, auditContext)` - Business response

**Critical Business Rules:**
- All reviews start with status: PENDING
- One review per user per business (unique constraint)
- Edit allowed within 7 days (configurable via `reviewEditWindowDays`)
- Editing re-enters moderation queue (status: PENDING)
- Language auto-detected using franc
- Audit logging on all mutations
- Helpful voting: one vote per user per review (unique constraint)

**Unit Tests (>80% coverage):**
- createReview: Creates with PENDING status
- createReview: Detects language correctly
- createReview: Rejects duplicate review (409)
- createReview: Validates content length (min/max)
- updateReview: Allows edit within 7 days
- updateReview: Rejects edit after 7 days (403)
- updateReview: Re-enters moderation queue
- deleteReview: Soft deletes (status: DELETED)
- markHelpful: Increments count
- markHelpful: Rejects duplicate vote (409)
- unmarkHelpful: Decrements count
- respondToReview: Business owner can respond
- respondToReview: Non-owner cannot respond (403)

**Success Criteria:**
- ✅ All methods follow existing service patterns
- ✅ Audit logging on all mutations
- ✅ Error handling with ApiError
- ✅ TypeScript strict mode compliant
- ✅ >80% test coverage

---

### 2.3 Moderation Service

**File:** `packages\backend\src\services\moderation-service.ts`

**Purpose:** Approve, reject, hide reviews; handle reports and appeals

**Key Methods:**
1. `approveReview(reviewId, moderatorId, notes, auditContext)` - Set status to PUBLISHED
2. `rejectReview(reviewId, moderatorId, reason, notes, auditContext)` - Set status to HIDDEN
3. `reportContent(contentType, contentId, reason, details, reporterId)` - Create ModerationReport
4. `getModerationQueue(filters, pagination)` - List pending reviews
5. `appealRejection(contentId, reason, evidence, userId)` - Create Appeal

**Critical Business Rules:**
- Only PENDING reviews can be approved/rejected
- Approved reviews: status PUBLISHED, publishedAt timestamp set
- Rejected reviews: status HIDDEN, moderationNotes stored
- Reports tracked in ModerationReport table
- Audit logging on all moderation actions

**Success Criteria:**
- ✅ Approve sets status to PUBLISHED
- ✅ Reject sets status to HIDDEN
- ✅ Audit logging on all actions
- ✅ >80% test coverage

---

### 2.4 Saved Business Service

**File:** `packages\backend\src\services\saved-service.ts`

**Purpose:** Save/unsave businesses, create/manage custom lists

**Key Methods:**
1. `saveBusiness(userId, businessId, listId, notes)` - Add to SavedBusiness
2. `unsaveBusiness(userId, businessId)` - Remove from SavedBusiness
3. `getSavedBusinesses(userId, listId, pagination)` - List saved businesses
4. `createList(userId, name)` - Create custom SavedList
5. `deleteList(userId, listId)` - Delete list (cascade removes SavedBusiness entries)
6. `getDefaultList(userId)` - Get or create default list

**Critical Business Rules:**
- Each user has one default list (isDefault: true)
- Default list auto-created on first save if not exists
- Saved count limit enforced (maxSavedBusinessesPerUser)
- Duplicate saves prevented (unique constraint userId, businessId)

**Success Criteria:**
- ✅ Save business to default list if no listId provided
- ✅ Prevent duplicate saves (409)
- ✅ Enforce saved count limit
- ✅ >80% test coverage

---

### 2.5 Follow Service

**File:** `packages\backend\src\services\follow-service.ts`

**Purpose:** Follow/unfollow businesses, get follower count

**Key Methods:**
1. `followBusiness(userId, businessId)` - Add to BusinessFollow
2. `unfollowBusiness(userId, businessId)` - Remove from BusinessFollow
3. `getFollowerCount(businessId)` - Count followers
4. `getFollowedBusinesses(userId, pagination)` - List followed businesses
5. `isFollowing(userId, businessId)` - Check follow status

**Critical Business Rules:**
- Duplicate follows prevented (unique constraint userId, businessId)
- Follower count is public
- Following list is private (user auth required)

**Success Criteria:**
- ✅ Follow/unfollow toggle correctly
- ✅ Prevent duplicate follows (409)
- ✅ Follower count accurate
- ✅ >80% test coverage

---

## PHASE 3: API ENDPOINTS (8-10 hours)

### 3.1 Review Validation Schemas

**File:** `packages\shared\src\schemas\review-schemas.ts`

**Purpose:** Zod schemas for review validation

```typescript
import { z } from 'zod';
import { getPlatformConfig } from '../config/platform-config.js';

const config = getPlatformConfig();

export const reviewCreateSchema = z.object({
  businessId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(100).optional(),
  content: z
    .string()
    .min(config.limits.minReviewLength)
    .max(config.limits.maxReviewLength),
  photos: z
    .array(
      z.object({
        url: z.string().url(),
        altText: z.string().max(200),
      })
    )
    .max(config.limits.maxReviewPhotos)
    .optional(),
});

export const reviewUpdateSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  title: z.string().max(100).optional(),
  content: z
    .string()
    .min(config.limits.minReviewLength)
    .max(config.limits.maxReviewLength)
    .optional(),
});

export const businessResponseSchema = z.object({
  response: z
    .string()
    .min(10)
    .max(config.limits.businessResponseMaxLength),
});
```

**Success Criteria:**
- ✅ Schemas validate correctly
- ✅ Limits pulled from config (not hardcoded)
- ✅ TypeScript types exported

---

### 3.2 Review Rate Limiters

**File:** `packages\backend\src\middleware\review-rate-limiter.ts`

**Purpose:** Rate limiting for review endpoints

```typescript
import rateLimit from 'express-rate-limit';
import { getPlatformConfig } from '@community-hub/shared';

const config = getPlatformConfig();

export const createReviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: config.limits.reviewsPerHour,
  message: 'Too many reviews created. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const helpfulVoteLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: 'Too many helpful votes. Please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const reportContentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: config.limits.reportsPerHour,
  message: 'Too many reports submitted. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
```

**Success Criteria:**
- ✅ Rate limits pulled from config
- ✅ Returns 429 when exceeded
- ✅ Standard headers enabled

---

### 3.3 Review Routes & Controller

**File:** `packages\backend\src\routes\review.ts`

**Pattern Reference:** `packages\backend\src\routes\business.ts`

**RESTful Endpoints:**

**Public Routes:**
- `GET /reviews/:id` - Get single review
- `GET /businesses/:id/reviews` - List reviews for business (query: sort, rating, page, limit)

**Protected Routes (User Auth):**
- `POST /businesses/:id/reviews` - Create review (rate limited)
- `PUT /reviews/:id` - Update own review (within 7 days)
- `DELETE /reviews/:id` - Delete own review
- `POST /reviews/:id/helpful` - Mark helpful (rate limited)
- `DELETE /reviews/:id/helpful` - Remove helpful mark
- `POST /reviews/:id/report` - Report review (rate limited)

**Protected Routes (Business Owner):**
- `POST /reviews/:id/respond` - Business owner response (rate limited)

**File:** `packages\backend\src\controllers\review-controller.ts`

**Key Methods:**
- `createReview` - Validate, call service, return 201
- `updateReview` - Check ownership, validate, call service
- `deleteReview` - Check ownership, call service, return 204
- `markHelpful` / `unmarkHelpful` - Call service
- `reportReview` - Create moderation report
- `respondToReview` - Check business ownership, call service
- `getBusinessReviews` - Fetch with filters/pagination
- `getReviewById` - Fetch single review

**Success Criteria:**
- ✅ All endpoints follow RESTful conventions
- ✅ Auth middleware applied correctly
- ✅ Rate limiting enforced
- ✅ Validation on all inputs
- ✅ Audit logging on mutations

---

### 3.4 Saved Business Routes

**File:** `packages\backend\src\routes\saved.ts`

**RESTful Endpoints:**
- `GET /users/:id/saved` - List saved businesses (user auth)
- `POST /users/:id/saved` - Save business (user auth)
- `DELETE /users/:id/saved/:businessId` - Unsave business (user auth)
- `POST /users/:id/lists` - Create custom list (user auth)
- `DELETE /users/:id/lists/:listId` - Delete list (user auth)

**Success Criteria:**
- ✅ Auth required for all endpoints
- ✅ User can only access their own saved businesses
- ✅ Validation on all inputs

---

### 3.5 Follow Routes

**File:** `packages\backend\src\routes\follow.ts`

**RESTful Endpoints:**
- `POST /businesses/:id/follow` - Follow business (user auth)
- `DELETE /businesses/:id/follow` - Unfollow business (user auth)
- `GET /businesses/:id/followers/count` - Get follower count (public)
- `GET /users/:id/following` - List followed businesses (user auth)

**Success Criteria:**
- ✅ Follow/unfollow requires auth
- ✅ Follower count is public
- ✅ User can only access their own following list

---

### 3.6 Moderation Routes

**File:** `packages\backend\src\routes\moderation.ts`

**Admin-only Endpoints:**
- `GET /admin/moderation/reviews` - Moderation queue (moderator/admin auth)
- `POST /admin/moderation/reviews/:id/approve` - Approve review (moderator/admin)
- `POST /admin/moderation/reviews/:id/reject` - Reject review (moderator/admin)

**Success Criteria:**
- ✅ Requires MODERATOR or ADMIN role
- ✅ Audit logging on all actions
- ✅ Returns queue sorted by oldest first

---

### 3.7 Register Routes in Main Router

**File:** `packages\backend\src\routes\index.ts`

**Add:**
```typescript
import { reviewRouter } from './review.js';
import { savedRouter } from './saved.js';
import { followRouter } from './follow.js';
import { moderationRouter } from './moderation.js';

// Register routes
app.use('/api/v1', reviewRouter);
app.use('/api/v1', savedRouter);
app.use('/api/v1', followRouter);
app.use('/api/v1/admin', moderationRouter);
```

**Success Criteria:**
- ✅ All routes accessible at `/api/v1/*`
- ✅ Moderation routes at `/api/v1/admin/*`
- ✅ No route conflicts

---

## PHASE 4: FRONTEND COMPONENTS (12-15 hours)

### 4.1 StarRating Component

**File:** `packages\frontend\src\components\review\StarRating.tsx`

**Purpose:** Input component for 1-5 star rating with keyboard navigation

**Key Features:**
- Mouse/touch interaction (click star to select)
- Keyboard navigation (arrow keys, Home, End)
- Hover preview (show rating on hover)
- ReadOnly mode for display
- WCAG 2.1 AA compliant (role="slider", aria-label, aria-valuenow)

**Props:**
```typescript
interface StarRatingProps {
  value: number; // 0-5
  onChange?: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  readOnly?: boolean;
  showLabel?: boolean;
  className?: string;
}
```

**Component Test:**
**File:** `packages\frontend\src\components\review\__tests__\StarRating.test.tsx`

**Tests:**
- Renders 5 stars
- Displays current value correctly
- Calls onChange when star clicked
- Supports keyboard navigation (arrow keys)
- Does not call onChange when readOnly
- Has no accessibility violations (jest-axe)

**Success Criteria:**
- ✅ Keyboard navigation works (arrow keys, Home, End)
- ✅ Mouse/touch interaction works
- ✅ ReadOnly mode displays correctly
- ✅ Zero jest-axe violations
- ✅ 100% test coverage

---

### 4.2 ReviewForm Component

**File:** `packages\frontend\src\components\review\ReviewForm.tsx`

**Purpose:** Modal form for submitting/editing reviews

**Pattern Reference:** `packages\frontend\src\components\auth\RegisterForm.tsx`

**Key Features:**
- Star rating input (StarRating component)
- Title field (optional, max 100 chars)
- Content field (50-1000 chars with live counter)
- Photo upload (drag-drop, max 3, FileUpload component from Phase 3)
- Validation errors (inline, accessible)
- Submit/Cancel buttons
- Loading state during submission
- Success/error toast messages (Toast component from Phase 3)

**Props:**
```typescript
interface ReviewFormProps {
  businessId: string;
  existingReview?: Review;
  onSuccess: () => void;
  onCancel: () => void;
}
```

**Success Criteria:**
- ✅ Form validation works correctly
- ✅ Character counter updates live
- ✅ Photo upload supports drag-drop
- ✅ Zero jest-axe violations
- ✅ Focus trapped in modal

---

### 4.3 ReviewCard Component

**File:** `packages\frontend\src\components\review\ReviewCard.tsx`

**Purpose:** Display single review with interactions

**Pattern Reference:** `packages\frontend\src\components\business\BusinessCard.tsx`

**Key Features:**
- Author avatar + name
- Star rating display (StarRating component in readOnly mode)
- Publication date (relative time: "2 days ago" using date-fns)
- Review title (if present, bold)
- Review text (expandable if >500 chars with "Read more" button)
- Review photos (gallery, lightbox on click using Carousel component)
- Helpful button (toggle state, shows count)
- Report button (opens report modal)
- Business response (if present, BusinessResponse component)
- Edit/Delete buttons (only for own reviews, within 7 days)

**Props:**
```typescript
interface ReviewCardProps {
  review: Review;
  onHelpful: (reviewId: string) => void;
  onReport: (reviewId: string) => void;
  onEdit?: (reviewId: string) => void;
  onDelete?: (reviewId: string) => void;
  showBusiness?: boolean;
}
```

**Success Criteria:**
- ✅ Responsive at 3 breakpoints
- ✅ Helpful button accessible (aria-pressed)
- ✅ Photos have alt text (WCAG 2.1 AA)
- ✅ Zero jest-axe violations

---

### 4.4 ReviewList Component

**File:** `packages\frontend\src\components\review\ReviewList.tsx`

**Purpose:** Container for displaying multiple reviews with sorting/filtering

**Pattern Reference:** `packages\frontend\src\components\business\BusinessList.tsx`

**Key Features:**
- Sort dropdown (newest, most helpful, highest rating, lowest rating)
- Filter by rating (all, 5-star, 4-star, 3-star, 2-star, 1-star)
- Pagination (10 reviews per page, Pagination component from Phase 3)
- Empty state (EmptyState component from Phase 3)
- Loading state (Skeleton component from Phase 3)
- Review count summary ("23 reviews")
- Average rating display (aggregated)

**Props:**
```typescript
interface ReviewListProps {
  businessId: string;
  initialSort?: 'newest' | 'helpful' | 'highest' | 'lowest';
  showFilters?: boolean;
}
```

**Success Criteria:**
- ✅ Sort/filter updates URL query params
- ✅ Pagination works correctly
- ✅ Empty state displays when no reviews
- ✅ Zero jest-axe violations

---

### 4.5 SaveButton Component

**File:** `packages\frontend\src\components\business\SaveButton.tsx`

**Purpose:** Toggle button for saving/unsaving businesses

**Key Features:**
- Heart icon (filled when saved, outline when not)
- Tooltip "Save This Business" (unsaved) / "Saved" (saved)
- Toggle state (saved/unsaved)
- Requires authentication (redirects if not logged in)
- Optional list selection modal (choose which list to save to)
- Live region announcement "Added to saved list"

**Props:**
```typescript
interface SaveButtonProps {
  businessId: string;
  isSaved: boolean;
  onToggle: (saved: boolean) => void;
  showListModal?: boolean;
  variant?: 'icon' | 'button';
  size?: 'sm' | 'md' | 'lg';
}
```

**Success Criteria:**
- ✅ Icon changes on toggle
- ✅ Redirects to login if not authenticated
- ✅ Live region announces changes (screen reader support)
- ✅ 44px minimum touch target on mobile
- ✅ Zero jest-axe violations

---

### 4.6 ModerationQueue Component

**File:** `packages\frontend\src\components\moderation\ModerationQueue.tsx`

**Purpose:** Admin interface for reviewing pending reviews

**Key Features:**
- Pending reviews table (business name, reviewer, rating, content preview)
- Approve/Reject buttons per review
- Notes field for moderation reason
- Filters (status: pending/approved/rejected, age: newest/oldest)
- Pagination

**Success Criteria:**
- ✅ Requires MODERATOR or ADMIN role
- ✅ Displays pending reviews correctly
- ✅ Approve/Reject actions work
- ✅ Zero jest-axe violations

---

### 4.7 Additional Components

- **BusinessResponse.tsx** - Display business owner response
- **SavedBusinessesList.tsx** - Page displaying saved businesses with list management
- **FollowButton.tsx** - Toggle follow/unfollow

**Follow same patterns as above.**

---

## PHASE 5: FRONTEND PAGES (6-8 hours)

### 5.1 Update BusinessProfilePage

**File:** `packages\frontend\src\pages\BusinessProfilePage.tsx`

**Changes:**
1. Add "Reviews" tab to existing tab navigation
2. Display ReviewList component in Reviews tab
3. Show average rating and review count in header
4. Add "Write a Review" button (opens ReviewForm modal)
5. Add SaveButton and FollowButton to action buttons

**Success Criteria:**
- ✅ Reviews tab displays correctly
- ✅ Average rating aggregated correctly
- ✅ Write review button accessible
- ✅ Zero jest-axe violations

---

### 5.2 Create SavedBusinessesPage

**File:** `packages\frontend\src\pages\SavedBusinessesPage.tsx`

**Purpose:** Page displaying user's saved businesses with list management

**Key Sections:**
- List selection dropdown (default list + custom lists)
- Saved businesses grid (business cards with unsave button)
- "Create New List" button (opens modal)
- "Manage Lists" button (opens modal for rename/delete)
- Empty state (EmptyState component from Phase 3)

**Success Criteria:**
- ✅ Requires authentication
- ✅ Lists load correctly
- ✅ Create/delete list works
- ✅ Zero jest-axe violations

---

### 5.3 Create ModerationPage

**File:** `packages\frontend\src\pages\ModerationPage.tsx`

**Purpose:** Admin page for moderation queue

**Key Sections:**
- ModerationQueue component
- Requires MODERATOR or ADMIN role

**Success Criteria:**
- ✅ Redirects non-moderators
- ✅ Queue loads correctly
- ✅ Zero jest-axe violations

---

### 5.4 Update UserProfilePage

**File:** `packages\frontend\src\pages\UserProfilePage.tsx`

**Changes:**
1. Add "Reviews Written" section
2. Display user's reviews with business names
3. Link to business profile from review

**Success Criteria:**
- ✅ Reviews display correctly
- ✅ Links work
- ✅ Zero jest-axe violations

---

### 5.5 Update Search Results

**File:** `packages\frontend\src\components\search\SearchResults.tsx`

**Changes:**
1. Show average rating stars on business cards
2. Show review count (e.g., "4.5 stars (23 reviews)")

**Success Criteria:**
- ✅ Rating displays correctly
- ✅ Count accurate
- ✅ Zero jest-axe violations

---

## PHASE 6: INTERNATIONALIZATION (4-6 hours)

### 6.1 Add Review Translations

**Files:** All 10 language files in `packages\frontend\src\i18n\locales\`

**Languages:**
- en.json (English)
- ar.json (Arabic)
- zh-CN.json (Chinese Simplified)
- zh-TW.json (Chinese Traditional)
- vi.json (Vietnamese)
- hi.json (Hindi)
- ur.json (Urdu)
- ko.json (Korean)
- el.json (Greek)
- it.json (Italian)

**English Translation Keys (en.json):**
```json
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
    "helpfulCount": "{{count}} people found this helpful",
    "reportReview": "Report Review",
    "editReview": "Edit Review",
    "deleteReview": "Delete Review",
    "businessResponse": "Business Owner Response",
    "respondedOn": "Responded on {{date}}",
    "postedOn": "Posted on {{date}}",
    "verified": "Verified Customer",
    "readMore": "Read more",
    "readLess": "Read less"
  },
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
    "characterCount": "{{count}}/{{max}} characters",
    "photosLabel": "Add Photos (Optional)",
    "photosMaxCount": "Maximum {{max}} photos",
    "submitButton": "Submit Review",
    "cancelButton": "Cancel",
    "successMessage": "Review submitted successfully! It will appear after moderation.",
    "errorMessage": "Failed to submit review. Please try again."
  },
  "businessResponse": {
    "title": "Respond to Review",
    "responseLabel": "Your Response",
    "responsePlaceholder": "Thank the customer or address their concerns...",
    "responseMaxLength": "Response cannot exceed {{max}} characters",
    "submitButton": "Post Response",
    "editButton": "Edit Response",
    "successMessage": "Response posted successfully",
    "errorMessage": "Failed to post response"
  },
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
    "notesPlaceholder": "Add personal notes...",
    "successSaved": "Business saved to {{listName}}",
    "successUnsaved": "Business removed from saved"
  },
  "following": {
    "followBusiness": "Follow",
    "following": "Following",
    "unfollow": "Unfollow",
    "followerCount": "{{count}} followers",
    "emptyState": "Not following any businesses yet",
    "emptyStateSubtext": "Follow businesses to get updates on new events and deals",
    "successFollowed": "You are now following {{businessName}}",
    "successUnfollowed": "You unfollowed {{businessName}}"
  },
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

**Success Criteria:**
- ✅ All 10 language files updated
- ✅ RTL languages (ar, ur) tested
- ✅ No hardcoded English strings in components
- ✅ Interpolation ({{count}}, {{date}}) works correctly

---

## PHASE 7: TESTING (16-20 hours)

### 7.1 Backend Unit Tests

**Files:**
- `packages\backend\src\services\__tests__\review-service.test.ts`
- `packages\backend\src\services\__tests__\moderation-service.test.ts`
- `packages\backend\src\services\__tests__\saved-service.test.ts`
- `packages\backend\src\services\__tests__\follow-service.test.ts`
- `packages\backend\src\utils\__tests__\language-detection.test.ts`

**Coverage Target:** >80% per service

**Key Test Cases (ReviewService):**
1. createReview: Creates with PENDING status
2. createReview: Detects language correctly
3. createReview: Rejects duplicate review (409)
4. createReview: Validates content length (min/max)
5. updateReview: Allows edit within 7 days
6. updateReview: Rejects edit after 7 days (403)
7. deleteReview: Soft deletes (status: DELETED)
8. markHelpful: Increments count
9. markHelpful: Rejects duplicate vote (409)
10. unmarkHelpful: Decrements count
11. respondToReview: Business owner can respond
12. respondToReview: Non-owner cannot respond (403)

**Success Criteria:**
- ✅ All services >80% coverage
- ✅ Edge cases tested
- ✅ Error cases tested

---

### 7.2 Backend Integration Tests

**Files:**
- `packages\backend\src\routes\__tests__\review.test.ts`
- `packages\backend\src\routes\__tests__\saved.test.ts`
- `packages\backend\src\routes\__tests__\follow.test.ts`
- `packages\backend\src\routes\__tests__\moderation.test.ts`

**Key Test Cases (Review Endpoints):**
1. POST /businesses/:id/reviews → 201 Created (status: pending)
2. POST /businesses/:id/reviews → 409 Conflict (duplicate review)
3. GET /businesses/:id/reviews → 200 OK (returns published reviews only)
4. PUT /reviews/:id → 200 OK (within 7 days)
5. PUT /reviews/:id → 403 Forbidden (after 7 days)
6. DELETE /reviews/:id → 204 No Content
7. POST /reviews/:id/helpful → 200 OK
8. POST /reviews/:id/helpful → 409 Conflict (already marked)
9. DELETE /reviews/:id/helpful → 200 OK
10. POST /reviews/:id/report → 201 Created
11. POST /reviews/:id/respond → 200 OK (business owner)
12. POST /reviews/:id/respond → 403 Forbidden (non-owner)
13. Rate limiting: 6th review in 1 hour → 429 Too Many Requests

**Success Criteria:**
- ✅ All endpoints tested
- ✅ Auth/authorization tested
- ✅ Rate limiting tested
- ✅ Validation tested

---

### 7.3 Frontend Component Tests

**Files:**
- `packages\frontend\src\components\review\__tests__\StarRating.test.tsx`
- `packages\frontend\src\components\review\__tests__\ReviewForm.test.tsx`
- `packages\frontend\src\components\review\__tests__\ReviewCard.test.tsx`
- `packages\frontend\src\components\review\__tests__\ReviewList.test.tsx`
- `packages\frontend\src\components\business\__tests__\SaveButton.test.tsx`
- `packages\frontend\src\components\moderation\__tests__\ModerationQueue.test.tsx`

**Each test must include:**
1. Render test (component renders without crashing)
2. Interaction test (clicks, keyboard navigation)
3. Accessibility test (zero jest-axe violations)
4. Responsive test (mobile, tablet, desktop)

**Success Criteria:**
- ✅ All components tested
- ✅ Zero jest-axe violations
- ✅ 100% component coverage

---

### 7.4 E2E Tests (Manual or Automated)

**Test Workflows:**

1. **Review Submission Flow:**
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

2. **Review Approval Flow:**
   - Moderator logs in
   - Navigates to moderation queue
   - Filters by "Pending"
   - Reviews pending review
   - Approves review with notes
   - Review status changes to "published"
   - Review appears on business profile

3. **Business Response Flow:**
   - Business owner logs in
   - Navigates to their business profile
   - Sees published review
   - Clicks "Respond to Review"
   - Enters response text
   - Submits response
   - Response appears below review

4. **Saved Business Flow:**
   - User navigates to business profile
   - Clicks heart icon (Save button)
   - Business saved to default list
   - User navigates to "Saved Businesses" page
   - Sees saved business in list
   - Creates custom list "To Try"
   - Moves business to "To Try" list
   - Business appears in custom list

5. **Helpful Voting Flow:**
   - User navigates to business profile
   - Scrolls to reviews
   - Clicks "Helpful?" button on review
   - Button state changes to "You found this helpful"
   - Helpful count increments by 1
   - User clicks button again to undo
   - Helpful count decrements by 1

**Success Criteria:**
- ✅ All workflows complete without errors
- ✅ Data persists correctly
- ✅ UI updates reflect database changes

---

## PHASE 8: DOCUMENTATION & QA (4-6 hours)

### 8.1 API Documentation

**File:** `docs\api\phase-6-endpoints.md`

**Document all endpoints:**
- Request/response examples
- Query parameters
- Error codes
- Rate limits
- Authentication requirements

**Success Criteria:**
- ✅ All Phase 6 endpoints documented
- ✅ Examples provided for each endpoint
- ✅ Error codes listed

---

### 8.2 Component Documentation

**Files:** Create README.md in each component directory

**Example:** `packages\frontend\src\components\review\README.md`

**Include:**
- Component purpose
- Props documentation
- Usage examples
- Accessibility notes

**Success Criteria:**
- ✅ All new components documented
- ✅ Props table included
- ✅ Accessibility notes added

---

### 8.3 Update Progress Tracking

**File:** `PROGRESS.md`

**Add Phase 6 section:**
```markdown
## Phase 6: User Engagement Features (35/35 tasks, 100%) ✅ COMPLETE

**Status:** COMPLETE (2026-03-XX)
**Tests:** X passing (Y Phase 6 tests created - Z% of target exceeded)
**Security:** 100/100 (TypeScript `any` types removed, console statements removed)
**Reports:** `md/review/phase-6-user-engagement.md`, `md/report/phase-6-completion.md`

### 6.1 Saved Businesses & Following (Complete)

- [x] SavedBusiness model
- [x] BusinessFollow model
- [x] SavedList model
- [x] Saved business API endpoints
- [x] Follow/unfollow API endpoints
- [x] SaveButton component
- [x] SavedBusinessesPage
- [x] FollowButton component

### 6.2 Reviews & Ratings (Complete)

- [x] Review model with photos
- [x] ReviewHelpful model
- [x] Review API endpoints (CRUD, helpful, report, respond)
- [x] StarRating component
- [x] ReviewForm component
- [x] ReviewCard component
- [x] ReviewList component
- [x] BusinessResponse component

### 6.3 Moderation Infrastructure (Complete)

- [x] ModerationReport model
- [x] Appeal model
- [x] Moderation API endpoints
- [x] ModerationQueue component
- [x] Review approval workflow
- [x] Content reporting
```

**Success Criteria:**
- ✅ PROGRESS.md updated
- ✅ Task counts accurate
- ✅ Status reflects reality

---

### 8.4 Update TODO.md

**File:** `TODO.md`

**Mark all Phase 6 tasks complete:**
- [x] All 35 Phase 6 tasks

**Success Criteria:**
- ✅ All tasks marked complete
- ✅ Counts updated

---

### 8.5 Final QA Checklist

**Code Quality:**
- ✅ Zero TypeScript errors (`npm run typecheck`)
- ✅ Zero `any` types
- ✅ No console statements (use logger utility)
- ✅ ESLint passing (`npm run lint`)
- ✅ Prettier formatted (`npm run format`)
- ✅ Explicit return types on all functions

**Testing:**
- ✅ >80% code coverage
- ✅ All unit tests passing
- ✅ All integration tests passing
- ✅ All component tests passing (jest-axe included)
- ✅ E2E tests documented/passing

**Accessibility:**
- ✅ WCAG 2.1 AA compliance (zero jest-axe violations)
- ✅ All components keyboard accessible
- ✅ 44px minimum touch targets on mobile
- ✅ Color contrast ≥4.5:1 for text
- ✅ Proper ARIA labeling and roles
- ✅ Screen reader tested (manual verification recommended)

**Security:**
- ✅ Input validation on all review fields
- ✅ Rate limiting enforced
- ✅ Audit logging for all moderation actions
- ✅ XSS prevention
- ✅ CSRF protection (already in place)
- ✅ Authorization checks on all endpoints

**Internationalization:**
- ✅ All UI strings in translation files (no hardcoded English)
- ✅ RTL support tested (Arabic/Urdu)
- ✅ Language auto-detection for review content

**Performance:**
- ✅ Page load <3s on 3G
- ✅ API response <200ms (p95)
- ✅ Lighthouse score >80

---

## CRITICAL FILES FOR IMPLEMENTATION

Here are the 5 most critical files to understand before starting Phase 6:

1. **`packages\backend\prisma\schema.prisma`**
   - **Why:** Must add 8 new models (Review, SavedBusiness, etc.) with correct relations
   - **Pattern:** Follow existing model structure (User, Business, Category)

2. **`config\platform.json`**
   - **Why:** Add all Phase 6 feature flags, limits, moderation settings
   - **Pattern:** All limits configurable, no hardcoded values

3. **`packages\backend\src\services\business-service.ts`**
   - **Why:** Template for review-service.ts (follows same patterns)
   - **Pattern:** Audit logging, error handling, TypeScript strict

4. **`packages\backend\src\routes\business.ts`**
   - **Why:** Template for review routes (follows same patterns)
   - **Pattern:** Rate limiting, auth middleware, validation, controller binding

5. **`packages\frontend\src\components\form\FileUpload.tsx`**
   - **Why:** Reusable for review photo upload
   - **Pattern:** Drag-drop, preview, validation, accessibility

---

## DEPENDENCIES & INSTALLATION

**Backend:**
```bash
# Language detection
npm install franc --workspace=@community-hub/backend
npm install -D @types/franc --workspace=@community-hub/backend

# Date utilities (if not already installed)
npm install date-fns --workspace=@community-hub/backend
```

**Frontend:**
```bash
# Date formatting
npm install date-fns --workspace=@community-hub/frontend

# Icon library (if not already installed, for heart/star icons)
npm install lucide-react --workspace=@community-hub/frontend
```

---

## RISK MITIGATION STRATEGIES

### 1. Complex Moderation Workflow
**Risk:** Manual review queue may become overwhelming
**Mitigation:**
- Start with manual approval (Phase 6)
- Add auto-moderation rules later (Phase 6.5)
- Set clear moderation SLAs (24-48 hours)
- Email notifications to moderators

### 2. Photo Upload Handling
**Risk:** Large photo uploads may slow down review submission
**Mitigation:**
- Reuse Phase 2 profile photo upload infrastructure
- Enforce 5MB limit per photo (configurable)
- Use Sharp library for image processing (already in use)
- Async processing (upload first, then submit review)

### 3. Review Editing 7-Day Window
**Risk:** Users may edit reviews after 7 days and bypass moderation
**Mitigation:**
- Server-side validation (check `createdAt` timestamp)
- Return 403 Forbidden after 7 days
- Re-enter moderation queue after edit
- Audit log all edits

### 4. Language Auto-Detection Accuracy
**Risk:** `franc` may misdetect language for short reviews
**Mitigation:**
- Fallback to user's language preference
- Minimum 10 characters for detection
- Allow manual language selection (Phase 6.5 enhancement)

---

## POST-IMPLEMENTATION TASKS

After Phase 6 is complete:

1. **Update Homepage:**
   - Add "Recent Reviews" section (optional)
   - Display average ratings on featured businesses

2. **Email Notifications (Phase 16 dependency):**
   - Review approved/rejected → notify reviewer
   - Business response → notify reviewer
   - New review → notify business owner
   - Flagged content → notify moderators

3. **Analytics Integration:**
   - Track review submission rate
   - Track moderation queue size
   - Track helpful vote engagement

4. **SEO Enhancement:**
   - Add review schema.org markup to business profiles
   - Generate rich snippets with ratings

5. **Future Enhancements (Phase 6.5):**
   - Bulk moderation actions
   - Auto-moderation rules (profanity filter, spam detection)
   - Review translations (Google Translate API)
   - Photo moderation

---

## CONCLUSION

Phase 6: User Engagement Features is a substantial phase that adds critical functionality to the Community Hub platform. By following this implementation plan step-by-step, you will:

- Add 8 new database models with proper relations
- Implement 15+ RESTful API endpoints with auth/validation
- Build 8+ accessible React components (WCAG 2.1 AA)
- Write 100+ comprehensive tests (>80% coverage target)
- Support 10 languages with RTL (Arabic/Urdu)
- Maintain location-agnostic architecture
- Ensure security & privacy (APP compliance)

**Estimated Timeline:**
- Week 1: Phases 1-3 (Configuration, Services, API)
- Week 2: Phases 4-5 (Components, Pages)
- Week 3: Phases 6-8 (i18n, Testing, Documentation)

**Total Effort:** 60-80 hours (3 weeks at 20-27 hours/week)

Good luck with the implementation! 🚀
