# Phase 9: Messaging System - Implementation Plan

**Created:** 13 March 2026
**Status:** Ready to Implement
**Total Tasks:** 28 tasks (from TODO.md)
**Estimated Duration:** 5-7 development days
**Estimated Lines of Code:** ~4,500+ (backend: ~2,100, frontend: ~2,000, tests: ~400)

---

## 1. Overview

### What Phase 9 Delivers

Phase 9 implements a **privacy-preserving messaging system** enabling users to send enquiries to local businesses through the platform. Key capabilities include:

- **User-to-Business Communication:** Community users can initiate conversations with businesses via enquiry forms
- **Business Inbox:** Unified inbox for business owners to manage customer enquiries
- **Quick Reply Templates:** Saved responses for efficient business owner communication
- **Read Receipts:** Track when messages are read
- **Privacy Protection:** Personal contact info hidden until explicit consent
- **Spam Prevention:** Rate limiting (10 new conversations/day) and block/report functionality
- **Response Analytics:** Track average response time and response rates

### Dependencies

| Dependency | Phase | Status | Required For |
|------------|-------|--------|--------------|
| User System | Phase 2 | Complete | Sender/recipient identification |
| Business Profiles | Phase 4 | Complete | Target businesses for enquiries |
| Business Owner Features | Phase 7 | Complete | Owner inbox integration |
| Review Moderation | Phase 6 | Complete | Report handling patterns |

### Scope

- **In Scope:** Enquiry system, conversation management, business inbox, quick replies, block/report, response tracking
- **Out of Scope:** Real-time WebSocket (use polling initially), file storage changes (use existing media service), advanced spam/profanity filtering (Phase 15)

---

## 2. Prerequisites Checklist

Before starting Phase 9, verify:

- [ ] Phase 8 (Events) is complete and merged
- [ ] All tests passing: `pnpm test` in root directory (expect 1,810+ tests)
- [ ] No TypeScript errors: `pnpm type-check`
- [ ] Database migrations up to date: `pnpm prisma:migrate`
- [ ] Redis running: Health check at `/api/v1/health`
- [ ] Feature flag enabled: `platform.json` has `"messaging": true`
- [ ] Business owner routes operational (for inbox integration)
- [ ] Moderation queue functional (for report handling)

---

## 3. Implementation Phases

### Phase 9.1: Database Layer

**Duration:** 0.5 days | **Agent Type:** general-purpose

#### Tasks

**9.1.1: Add Messaging Enums to Prisma Schema**
- **File:** `packages/backend/prisma/schema.prisma`
- **Add after Phase 8 enums (around line 180):**

```prisma
// ─── Phase 9 Enums ──────────────────────────────────────────

/// Phase 9: Subject category for enquiries
enum SubjectCategory {
  GENERAL
  PRODUCT_QUESTION
  BOOKING
  FEEDBACK
  OTHER
}

/// Phase 9: Conversation status
enum ConversationStatus {
  ACTIVE
  ARCHIVED
  BLOCKED
}

/// Phase 9: Message sender type
enum SenderType {
  USER
  BUSINESS
}
```

- **Estimated Lines:** ~20 lines
- **Success Criteria:** Enums defined without syntax errors

**9.1.2: Add Conversation Model**
- **File:** `packages/backend/prisma/schema.prisma`
- **Add after EventRSVP model (around line 795):**

```prisma
// ─── Phase 9: Messaging System ────────────────────────────────

/// Spec A.5 - User-to-business conversations
model Conversation {
  id                  String              @id @default(uuid())
  businessId          String              @map("business_id")
  userId              String              @map("user_id")
  subject             String              @db.VarChar(200)
  subjectCategory     SubjectCategory     @map("subject_category")
  status              ConversationStatus  @default(ACTIVE)
  lastMessageAt       DateTime?           @map("last_message_at")
  unreadCountBusiness Int                 @default(0) @map("unread_count_business")
  unreadCountUser     Int                 @default(0) @map("unread_count_user")
  createdAt           DateTime            @default(now()) @map("created_at")
  updatedAt           DateTime            @updatedAt @map("updated_at")

  // Relations
  business Business   @relation(fields: [businessId], references: [id], onDelete: Cascade)
  user     User       @relation("UserConversations", fields: [userId], references: [id], onDelete: Cascade)
  messages Message[]

  @@unique([businessId, userId])
  @@index([businessId])
  @@index([userId])
  @@index([status])
  @@index([lastMessageAt])
  @@map("conversations")
}
```

- **Estimated Lines:** ~30 lines
- **Dependencies:** 9.1.1 complete
- **Success Criteria:** Model compiles, relations valid

**9.1.3: Add Message Model**
- **File:** `packages/backend/prisma/schema.prisma`
- **Add after Conversation model:**

```prisma
/// Spec A.5 - Individual messages within conversations
model Message {
  id             String      @id @default(uuid())
  conversationId String      @map("conversation_id")
  senderType     SenderType  @map("sender_type")
  senderId       String      @map("sender_id")
  content        String      @db.Text // max 1000 chars (validated in code)
  readAt         DateTime?   @map("read_at")
  deletedAt      DateTime?   @map("deleted_at") // Soft delete
  createdAt      DateTime    @default(now()) @map("created_at")

  // Relations
  conversation Conversation       @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  attachments  MessageAttachment[]

  @@index([conversationId])
  @@index([senderId])
  @@index([createdAt])
  @@map("messages")
}
```

- **Estimated Lines:** ~25 lines
- **Dependencies:** 9.1.2 complete
- **Success Criteria:** Model compiles, cascade delete works

**9.1.4: Add MessageAttachment Model**
- **File:** `packages/backend/prisma/schema.prisma`
- **Add after Message model:**

```prisma
/// Spec A.5 - Attachments for messages (images only)
model MessageAttachment {
  id        String   @id @default(uuid())
  messageId String   @map("message_id")
  url       String   @db.VarChar(500)
  altText   String?  @map("alt_text") @db.VarChar(200)
  sizeBytes Int      @map("size_bytes")
  mimeType  String   @map("mime_type") @db.VarChar(50)
  createdAt DateTime @default(now()) @map("created_at")

  // Relations
  message Message @relation(fields: [messageId], references: [id], onDelete: Cascade)

  @@index([messageId])
  @@map("message_attachments")
}
```

- **Estimated Lines:** ~18 lines
- **Dependencies:** 9.1.3 complete
- **Success Criteria:** Model compiles

**9.1.5: Add QuickReplyTemplate Model**
- **File:** `packages/backend/prisma/schema.prisma`
- **Add after MessageAttachment model:**

```prisma
/// Spec §16.2 - Business quick reply templates
model QuickReplyTemplate {
  id         String   @id @default(uuid())
  businessId String   @map("business_id")
  name       String   @db.VarChar(50)
  content    String   @db.Text // max 1000 chars
  order      Int      @default(0)
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  // Relations
  business Business @relation(fields: [businessId], references: [id], onDelete: Cascade)

  @@index([businessId])
  @@map("quick_reply_templates")
}
```

- **Estimated Lines:** ~18 lines
- **Dependencies:** 9.1.4 complete
- **Success Criteria:** Model compiles

**9.1.6: Add Relations to Existing Models**
- **File:** `packages/backend/prisma/schema.prisma`
- **Modify User model (around line 230):** Add `conversations Conversation[] @relation("UserConversations")`
- **Modify Business model (around line 340):** Add `conversations Conversation[]` and `quickReplyTemplates QuickReplyTemplate[]`
- **Estimated Lines:** ~5 lines of modifications
- **Dependencies:** 9.1.5 complete
- **Success Criteria:** All relations valid, `prisma format` passes

**9.1.7: Run Prisma Migration**
- **Command:** `cd packages/backend && npx prisma migrate dev --name phase9_messaging`
- **Dependencies:** All 9.1.x tasks complete
- **Success Criteria:** Migration runs without errors, tables created in database

---

### Phase 9.2: Backend Services

**Duration:** 1.5 days | **Agent Type:** general-purpose

#### Tasks

**9.2.1: Create Conversation Service**
- **File:** `packages/backend/src/services/conversation-service.ts`
- **Pattern Reference:** `packages/backend/src/services/event-service.ts`
- **Methods:**
  - `createConversation(data, userId, auditContext)` - Start new conversation with initial message
  - `getConversationById(id, userId)` - Get with messages and auth check
  - `getUserConversations(userId, filters, pagination)` - List user's conversations
  - `getBusinessConversations(businessId, ownerId, filters, pagination)` - Business inbox
  - `archiveConversation(id, userId)` - Archive by user
  - `unarchiveConversation(id, userId)` - Restore archived
  - `blockConversation(id, ownerId)` - Block by business owner
  - `reportConversation(id, userId, reason, details)` - Submit to moderation
- **Estimated Lines:** ~600 lines
- **Dependencies:** 9.1.7 complete
- **Success Criteria:** All CRUD operations work, proper auth checks

**9.2.2: Create Message Service**
- **File:** `packages/backend/src/services/message-service.ts`
- **Pattern Reference:** `packages/backend/src/services/review-service.ts`
- **Methods:**
  - `sendMessage(conversationId, content, senderType, senderId, attachments)` - Send message
  - `getMessages(conversationId, userId, pagination)` - Paginated message history
  - `markAsRead(conversationId, userId)` - Update read status
  - `deleteMessage(messageId, userId)` - Soft delete within 24h window
  - `getUnreadCount(userId)` - Total unread for user
  - `getBusinessUnreadCount(businessId)` - Unread for business inbox
- **Estimated Lines:** ~400 lines
- **Dependencies:** 9.2.1 complete
- **Success Criteria:** Messages persist, unread counts update correctly

**9.2.3: Create Quick Reply Service**
- **File:** `packages/backend/src/services/quick-reply-service.ts`
- **Methods:**
  - `createTemplate(businessId, ownerId, data)` - Create new template
  - `getTemplates(businessId, ownerId)` - List templates for business
  - `updateTemplate(templateId, ownerId, data)` - Update template
  - `deleteTemplate(templateId, ownerId)` - Delete template
  - `reorderTemplates(businessId, ownerId, templateIds)` - Update display order
- **Estimated Lines:** ~200 lines
- **Dependencies:** 9.1.7 complete
- **Success Criteria:** Templates CRUD operational

**9.2.4: Create Messaging Analytics Service**
- **File:** `packages/backend/src/services/messaging-analytics-service.ts`
- **Pattern Reference:** `packages/backend/src/services/analytics-service.ts`
- **Methods:**
  - `trackMessageSent(conversationId, senderType)` - Log send event
  - `calculateResponseTime(businessId)` - Average response time
  - `calculateResponseRate(businessId)` - Percentage with response
  - `getMessagingStats(businessId, dateRange)` - Aggregated stats
- **Estimated Lines:** ~250 lines
- **Dependencies:** 9.2.2 complete
- **Success Criteria:** Stats calculate correctly

**9.2.5: Create Spam Detection Service (Basic)**
- **File:** `packages/backend/src/services/spam-detection-service.ts`
- **Methods:**
  - `checkMessage(content, userId)` - Basic content analysis
  - `checkUserReputation(userId)` - Check previous reports/blocks
  - `flagForReview(conversationId, reason)` - Queue for moderation
- **Estimated Lines:** ~150 lines (basic implementation, enhanced in Phase 15)
- **Dependencies:** 9.2.1 complete
- **Success Criteria:** Basic spam checks work

**9.2.6: Create Validation Schemas**
- **File:** `packages/shared/src/schemas/messaging-schemas.ts`
- **Pattern Reference:** `packages/shared/src/schemas/event-schemas.ts`
- **Schemas:**

```typescript
// Create conversation
export const createConversationSchema = z.object({
  businessId: z.string().uuid(),
  subject: z.string().min(5).max(200),
  subjectCategory: z.enum(['GENERAL', 'PRODUCT_QUESTION', 'BOOKING', 'FEEDBACK', 'OTHER']),
  message: z.string().min(10).max(1000),
  preferredContact: z.enum(['email', 'phone', 'message']).optional()
});

// Send message
export const sendMessageSchema = z.object({
  content: z.string().min(1).max(1000),
  attachments: z.array(z.object({
    url: z.string().url(),
    altText: z.string().max(200).optional(),
    sizeBytes: z.number().max(5 * 1024 * 1024),
    mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp'])
  })).max(3).optional()
});

// Quick reply template
export const quickReplyTemplateSchema = z.object({
  name: z.string().min(1).max(50),
  content: z.string().min(1).max(1000)
});

// Conversation filters
export const conversationFilterSchema = z.object({
  status: z.enum(['active', 'archived', 'all']).optional(),
  search: z.string().max(100).optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(50).optional()
});

// Report conversation
export const reportConversationSchema = z.object({
  reason: z.enum(['SPAM', 'INAPPROPRIATE', 'HARASSMENT', 'OTHER']),
  details: z.string().max(500).optional()
});
```

- **Estimated Lines:** ~150 lines
- **Dependencies:** None
- **Success Criteria:** All schemas validate correctly

**9.2.7: Create Rate Limiters**
- **File:** `packages/backend/src/middleware/messaging-rate-limiter.ts`
- **Pattern Reference:** `packages/backend/src/middleware/event-rate-limiter.ts`
- **Limiters:**

| Limiter | Window | Max | Purpose |
|---------|--------|-----|---------|
| `createConversationLimiter` | 24h | 10 | Prevent spam account abuse |
| `sendMessageLimiter` | 1h | 30 | Reasonable conversation pace |
| `readConversationsLimiter` | 1h | 100 | Prevent scraping |
| `reportConversationLimiter` | 24h | 10 | Prevent report abuse |
| `quickReplyLimiter` | 1h | 20 | Reasonable CRUD pace |

- **Estimated Lines:** ~80 lines
- **Dependencies:** None
- **Success Criteria:** Rate limits enforced correctly

---

### Phase 9.3: API Endpoints

**Duration:** 1 day | **Agent Type:** general-purpose

#### Tasks

**9.3.1: Create Conversations Router**
- **File:** `packages/backend/src/routes/conversations.ts`
- **Pattern Reference:** `packages/backend/src/routes/events.ts`
- **Endpoints:**

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /conversations | List user's conversations | User |
| GET | /conversations/:id | Get conversation with messages | User |
| POST | /conversations | Start new conversation | User |
| POST | /conversations/:id/messages | Send message | User |
| PUT | /conversations/:id/read | Mark as read | User |
| PUT | /conversations/:id/archive | Archive conversation | User |
| PUT | /conversations/:id/unarchive | Restore archived | User |
| POST | /conversations/:id/block | Block (business owner only) | Owner |
| POST | /conversations/:id/report | Report conversation | User |

- **Estimated Lines:** ~250 lines
- **Dependencies:** 9.2.1, 9.2.2, 9.2.6, 9.2.7 complete
- **Success Criteria:** All endpoints respond correctly

**9.3.2: Create Conversation Controller**
- **File:** `packages/backend/src/controllers/conversation-controller.ts`
- **Pattern Reference:** `packages/backend/src/controllers/event-controller.ts`
- **Handles:** Request parsing, response formatting, error handling
- **Estimated Lines:** ~300 lines
- **Dependencies:** 9.2.1, 9.2.2 complete
- **Success Criteria:** Clean separation from routes

**9.3.3: Add Business Inbox Endpoints**
- **File:** `packages/backend/src/routes/conversations.ts` (additions)
- **Endpoints:**

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /businesses/:businessId/conversations | Business inbox | Owner |
| GET | /businesses/:businessId/messaging-stats | Analytics | Owner |
| GET | /businesses/:businessId/quick-replies | List templates | Owner |
| POST | /businesses/:businessId/quick-replies | Create template | Owner |
| PUT | /businesses/:businessId/quick-replies/:id | Update template | Owner |
| DELETE | /businesses/:businessId/quick-replies/:id | Delete template | Owner |

- **Estimated Lines:** ~150 lines (additions)
- **Dependencies:** 9.2.3, 9.2.4 complete
- **Success Criteria:** Business owner routes protected

**9.3.4: Register Routes**
- **File:** `packages/backend/src/routes/index.ts`
- **Add:** Import and register `conversationRouter` at `/conversations`
- **Estimated Lines:** ~5 lines of modifications
- **Dependencies:** 9.3.1 complete
- **Success Criteria:** Routes accessible at `/api/v1/conversations`

---

### Phase 9.4: Frontend - Core Components

**Duration:** 1 day | **Agent Type:** general-purpose

#### Tasks

**9.4.1: Create ConversationList Component**
- **File:** `packages/frontend/src/components/messaging/ConversationList.tsx`
- **Pattern Reference:** `packages/frontend/src/components/events/EventCard.tsx`
- **Features:**
  - List of conversation cards
  - Unread badge indicator
  - Last message preview (truncated)
  - Business name and avatar
  - Status indicators (archived, blocked)
  - RTL support
  - WCAG 2.1 AA compliant
- **Estimated Lines:** ~180 lines
- **Dependencies:** None
- **Success Criteria:** Renders correctly, accessible

**9.4.2: Create MessageBubble Component**
- **File:** `packages/frontend/src/components/messaging/MessageBubble.tsx`
- **Features:**
  - Sender-specific styling (user blue, business gray)
  - Timestamp display
  - Read receipt indicator
  - Attachment thumbnails
  - Delete option (within 24h window)
  - RTL support
- **Estimated Lines:** ~120 lines
- **Dependencies:** None
- **Success Criteria:** Visual differentiation clear

**9.4.3: Create ConversationThread Component**
- **File:** `packages/frontend/src/components/messaging/ConversationThread.tsx`
- **Features:**
  - Message history with MessageBubble
  - Infinite scroll for history
  - Scroll to bottom on new message
  - Loading states
  - Empty state
  - Keyboard navigation
- **Estimated Lines:** ~200 lines
- **Dependencies:** 9.4.2 complete
- **Success Criteria:** Scrolling works, accessible

**9.4.4: Create MessageForm Component**
- **File:** `packages/frontend/src/components/messaging/MessageForm.tsx`
- **Features:**
  - Textarea with character counter (max 1000)
  - Attachment upload (drag & drop)
  - Quick reply selection (business view)
  - Send button with loading state
  - Keyboard shortcut (Ctrl/Cmd + Enter)
  - 44px minimum touch targets
- **Estimated Lines:** ~180 lines
- **Dependencies:** None
- **Success Criteria:** Form validates, submits correctly

**9.4.5: Create EnquiryForm Component**
- **File:** `packages/frontend/src/components/messaging/EnquiryForm.tsx`
- **Features:**
  - Subject category dropdown
  - Subject text input
  - Message textarea with validation
  - Preferred contact radio buttons (optional)
  - Attachment upload (max 3 images, 5MB each)
  - Submit with loading state
  - Success confirmation modal
- **Estimated Lines:** ~250 lines
- **Dependencies:** None
- **Success Criteria:** All validations work

**9.4.6: Create Frontend API Service**
- **File:** `packages/frontend/src/services/conversation-service.ts`
- **Pattern Reference:** `packages/frontend/src/services/event-service.ts`
- **Methods:**
  - `getConversations(filters)` - List conversations
  - `getConversation(id)` - Get with messages
  - `createConversation(businessId, data)` - Start conversation
  - `sendMessage(conversationId, content, attachments)` - Send message
  - `markAsRead(conversationId)` - Mark read
  - `archiveConversation(id)` - Archive
  - `reportConversation(id, reason, details)` - Report
- **Estimated Lines:** ~150 lines
- **Dependencies:** None
- **Success Criteria:** All API calls work

**9.4.7: Create React Hooks**
- **Files:**
  - `packages/frontend/src/hooks/useConversations.ts`
  - `packages/frontend/src/hooks/useMessages.ts`
- **Features:**
  - `useConversations(filters)` - List with pagination
  - `useConversation(id)` - Single conversation with messages
  - `useUnreadCount()` - Unread badge count
  - Polling support (30-second interval)
  - Optimistic updates
- **Estimated Lines:** ~200 lines (combined)
- **Dependencies:** 9.4.6 complete
- **Success Criteria:** Data fetching works, updates correctly

---

### Phase 9.5: Frontend - Pages

**Duration:** 1 day | **Agent Type:** general-purpose

#### Tasks

**9.5.1: Create ConversationsPage**
- **File:** `packages/frontend/src/pages/ConversationsPage.tsx`
- **Route:** `/messages`
- **Features:**
  - ConversationList with filters (all, unread, archived)
  - Search functionality
  - Empty state for no conversations
  - Link to start new enquiry
  - Mobile-responsive layout
  - Page title with unread count
- **Estimated Lines:** ~300 lines
- **Dependencies:** 9.4.1, 9.4.7 complete
- **Success Criteria:** Lists conversations, filters work

**9.5.2: Create ConversationDetailPage**
- **File:** `packages/frontend/src/pages/ConversationDetailPage.tsx`
- **Route:** `/messages/:id`
- **Features:**
  - ConversationThread with messages
  - MessageForm at bottom
  - Header with business info
  - Archive/Report actions
  - Back navigation
  - Auto-scroll to latest message
- **Estimated Lines:** ~350 lines
- **Dependencies:** 9.4.3, 9.4.4 complete
- **Success Criteria:** Full conversation flow works

**9.5.3: Add Enquiry Button to Business Profile**
- **File:** `packages/frontend/src/pages/BusinessDetailPage.tsx`
- **Modification:** Add "Send Message" button that opens EnquiryForm modal
- **Estimated Lines:** ~30 lines of modifications
- **Dependencies:** 9.4.5 complete
- **Success Criteria:** Button visible, modal opens

**9.5.4: Register Routes in App.tsx**
- **File:** `packages/frontend/src/App.tsx`
- **Add:**
  - Import ConversationsPage, ConversationDetailPage
  - Protected routes for `/messages` and `/messages/:id`
- **Estimated Lines:** ~15 lines of modifications
- **Dependencies:** 9.5.1, 9.5.2 complete
- **Success Criteria:** Routes navigate correctly

---

### Phase 9.6: Business Owner Features

**Duration:** 0.5 days | **Agent Type:** general-purpose

#### Tasks

**9.6.1: Create BusinessInboxPage**
- **File:** `packages/frontend/src/pages/owner/BusinessInboxPage.tsx`
- **Route:** `/owner/messages`
- **Features:**
  - Conversation list for owned business
  - Filter by status (all, unread, archived)
  - Response time metrics display
  - Link to quick reply settings
  - Unread count badge
- **Estimated Lines:** ~350 lines
- **Dependencies:** 9.4.1, 9.5.2 complete (reuse components)
- **Success Criteria:** Business owner can manage inbox

**9.6.2: Create QuickReplyManager Component**
- **File:** `packages/frontend/src/components/messaging/QuickReplyManager.tsx`
- **Features:**
  - List of saved templates
  - Create/edit/delete templates
  - Drag to reorder
  - Template preview
  - Max 10 templates per business
- **Estimated Lines:** ~280 lines
- **Dependencies:** None
- **Success Criteria:** CRUD works, reorder persists

**9.6.3: Create MessagingSettingsPage**
- **File:** `packages/frontend/src/pages/owner/MessagingSettingsPage.tsx`
- **Route:** `/owner/settings/messaging`
- **Features:**
  - QuickReplyManager integration
  - Auto-response toggle (future)
  - Response time goal setting (future)
- **Estimated Lines:** ~200 lines
- **Dependencies:** 9.6.2 complete
- **Success Criteria:** Settings persist

**9.6.4: Add Inbox Link to Owner Dashboard**
- **File:** `packages/frontend/src/pages/owner/OwnerDashboardPage.tsx`
- **Modification:** Add inbox card with unread count, link to `/owner/messages`
- **Estimated Lines:** ~40 lines of modifications
- **Dependencies:** 9.6.1 complete
- **Success Criteria:** Link visible with unread badge

---

### Phase 9.7: Testing & i18n

**Duration:** 1 day | **Agent Type:** test-write specialist

#### Tasks

**9.7.1: Backend Unit Tests**
- **Files:**
  - `packages/backend/src/services/__tests__/conversation-service.test.ts`
  - `packages/backend/src/services/__tests__/message-service.test.ts`
  - `packages/backend/src/services/__tests__/quick-reply-service.test.ts`
- **Coverage Target:** 80%+
- **Estimated Lines:** ~400 lines of tests
- **Dependencies:** 9.2.x complete
- **Success Criteria:** All service methods tested

**9.7.2: Backend Integration Tests**
- **File:** `packages/backend/src/routes/__tests__/conversations.test.ts`
- **Test Cases:**
  - Create conversation (auth required, rate limited)
  - Send message (participant only)
  - Mark as read (unread count updates)
  - Archive/unarchive
  - Block (business owner only)
  - Report (creates moderation entry)
- **Estimated Lines:** ~300 lines of tests
- **Dependencies:** 9.3.x complete
- **Success Criteria:** All endpoints tested

**9.7.3: Frontend Component Tests**
- **Files:**
  - `packages/frontend/src/components/messaging/__tests__/ConversationList.test.tsx`
  - `packages/frontend/src/components/messaging/__tests__/MessageBubble.test.tsx`
  - `packages/frontend/src/components/messaging/__tests__/ConversationThread.test.tsx`
  - `packages/frontend/src/components/messaging/__tests__/MessageForm.test.tsx`
  - `packages/frontend/src/components/messaging/__tests__/EnquiryForm.test.tsx`
- **Coverage Target:** 80%+
- **Include:** jest-axe accessibility tests
- **Estimated Lines:** ~500 lines of tests
- **Dependencies:** 9.4.x complete
- **Success Criteria:** Components render, interact correctly

**9.7.4: Create i18n Translation Files**
- **Files (10 languages):**
  - `packages/frontend/src/i18n/locales/en/messaging.json`
  - `packages/frontend/src/i18n/locales/ar/messaging.json`
  - `packages/frontend/src/i18n/locales/zh-CN/messaging.json`
  - `packages/frontend/src/i18n/locales/zh-TW/messaging.json`
  - `packages/frontend/src/i18n/locales/vi/messaging.json`
  - `packages/frontend/src/i18n/locales/hi/messaging.json`
  - `packages/frontend/src/i18n/locales/ur/messaging.json`
  - `packages/frontend/src/i18n/locales/ko/messaging.json`
  - `packages/frontend/src/i18n/locales/el/messaging.json`
  - `packages/frontend/src/i18n/locales/it/messaging.json`
- **Estimated Keys:** 100-150 per language
- **Key Namespaces:**
  - `messaging.labels.*` - Form labels
  - `messaging.placeholders.*` - Input placeholders
  - `messaging.buttons.*` - Button text
  - `messaging.categories.*` - Subject categories (5)
  - `messaging.status.*` - Status labels
  - `messaging.notifications.*` - Toast messages
  - `messaging.errors.*` - Error messages
  - `messaging.empty.*` - Empty states
  - `messaging.business.*` - Business inbox specific
- **Estimated Lines:** ~120 lines per file (1,200 total)
- **Dependencies:** All components complete
- **Success Criteria:** All strings translated, RTL works for Arabic/Urdu

---

### Phase 9.8: Integration & QA

**Duration:** 0.5 days | **Agent Type:** qa specialist

#### Tasks

**9.8.1: End-to-End Tests**
- **File:** `packages/frontend/e2e/messaging.spec.ts`
- **Test Flows:**
  - User sends enquiry to business
  - Business owner responds
  - User views response (read receipt)
  - Archive/unarchive conversation
  - Block/report flow
  - Quick reply usage
- **Estimated Lines:** ~200 lines
- **Dependencies:** All 9.x tasks complete
- **Success Criteria:** Full user journeys pass

**9.8.2: QA Review Checklist**
- Run full test suite: `pnpm test`
- TypeScript check: `pnpm type-check`
- Lint check: `pnpm lint`
- Manual testing:
  - [ ] New conversation creates correctly
  - [ ] Messages send and display
  - [ ] Read receipts work
  - [ ] Unread counts accurate
  - [ ] Archive/unarchive works
  - [ ] Block prevents further messages
  - [ ] Report enters moderation queue
  - [ ] Quick replies work for business owners
  - [ ] Rate limiting enforced
  - [ ] All 10 languages display correctly
  - [ ] RTL layout correct for Arabic/Urdu
  - [ ] Keyboard navigation works
  - [ ] Screen reader announces correctly
- **Success Criteria:** Zero critical/high issues

---

## 4. Configuration Requirements

### platform.json

The feature flag already exists at `config/platform.json`:
```json
{
  "features": {
    "messaging": true
  }
}
```

No additional configuration needed. The feature uses existing branding colors.

### Environment Variables

No new environment variables required. Uses existing:
- Database connection
- Redis for rate limiting
- Existing media storage for attachments

### Rate Limiter Configuration

| Limiter | Window | Max | Purpose |
|---------|--------|-----|---------|
| createConversation | 24h | 10 | Prevent spam account abuse |
| sendMessage | 1h | 30 | Reasonable conversation pace |
| readConversations | 1h | 100 | Prevent scraping |
| reportConversation | 24h | 10 | Prevent report abuse |
| quickReply | 1h | 20 | Reasonable CRUD pace |

---

## 5. Security Considerations

### Rate Limiting (Per Endpoint)

| Endpoint | Rate Limit | Window |
|----------|-----------|--------|
| POST /conversations | 10 | 24h |
| POST /conversations/:id/messages | 30 | 1h |
| GET /conversations | 100 | 1h |
| POST /conversations/:id/report | 10 | 24h |

### Input Validation

All inputs validated with Zod schemas (9.2.6):
- Message content: 1-1000 characters, sanitized with DOMPurify
- Subject: 5-200 characters
- Attachments: Max 3, 5MB each, JPG/PNG/WebP only
- Template name: 1-50 characters
- Template content: 1-1000 characters

### Privacy Protections

- **Contact Info Hidden:** User email/phone never exposed in messages
- **IP Anonymization:** IP addresses hashed after 90 days
- **Message Encryption:** Content encrypted at rest using existing AES-256-GCM utility
- **Audit Logging:** All message actions logged (create, read, delete)

### Spam Prevention

- Rate limiting (10 new conversations/day)
- Basic content checks in spam-detection-service.ts
- Block/report functionality
- Honeypot field on EnquiryForm (invisible to users)
- Advanced profanity/spam filtering deferred to Phase 15

### Block/Report System

- Block: Prevents all future messages from user, uses existing ModerationReport model
- Report: Creates entry in moderation queue, handled by existing Phase 6 moderation infrastructure
- Pattern detection: Track repeat offenders (userId + blocked count)

---

## 6. Accessibility Requirements

### WCAG 2.1 AA Checkpoints

| Requirement | Implementation |
|-------------|----------------|
| 1.3.1 Info and Relationships | Proper form labels, semantic HTML |
| 1.4.3 Contrast (Minimum) | 4.5:1 for text, 3:1 for UI elements |
| 1.4.11 Non-text Contrast | Focus indicators, buttons meet 3:1 |
| 2.1.1 Keyboard | All interactive elements reachable |
| 2.4.3 Focus Order | Logical tab order in forms |
| 2.4.7 Focus Visible | Clear focus ring on all elements |
| 4.1.2 Name, Role, Value | ARIA labels on buttons, forms |

### Keyboard Navigation

- Tab through all interactive elements in logical order
- Arrow keys to navigate conversation list
- Enter to select/open conversation
- Escape to close modals
- Ctrl/Cmd + Enter to send message
- Focus trapped in modals

### Screen Reader Support

- `aria-label` on all icon-only buttons
- `aria-live="polite"` on new message notifications
- Announce unread count changes
- Announce conversation status changes (archived, blocked)
- Proper heading hierarchy (h1, h2, h3)

### Touch Targets

- All buttons minimum 44x44px
- Adequate spacing between interactive elements
- Clear tap feedback

---

## 7. Risk Assessment

### Technical Challenges

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Real-time complexity | Medium | High | Start with polling (30s), add WebSocket later |
| Large attachment handling | Low | Medium | Use existing media service, enforce limits |
| Race conditions on unread counts | Medium | Low | Use database transactions |
| Performance with many messages | Low | Medium | Implement pagination, cache counts |

### Integration Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Business owner auth issues | Low | High | Reuse existing owner verification from Phase 7 |
| Moderation queue overload | Low | Medium | Reports use existing Phase 6 infrastructure |
| i18n key conflicts | Low | Low | Use unique `messaging.*` namespace |

### Performance Considerations

- **Message List:** Paginate (20 per page), lazy load images
- **Unread Counts:** Cache in Redis (5-minute TTL), invalidate on read
- **Polling:** 30-second interval, pause when tab inactive
- **Attachments:** Use existing Sharp image processing pipeline

---

## 8. Success Criteria

### Functional Requirements Checklist

- [ ] Users can send enquiries to businesses via form
- [ ] Conversations persist with full message history
- [ ] Business owners can view messages in unified inbox
- [ ] Quick reply templates save and apply correctly
- [ ] Read receipts display when messages are read
- [ ] Archive/unarchive functionality works
- [ ] Block prevents further messages from user
- [ ] Report creates entry in moderation queue
- [ ] Response time tracking displays correctly
- [ ] Rate limiting enforced (10 conversations/day)
- [ ] All 10 languages supported with RTL

### Quality Requirements

- [ ] Zero TypeScript errors (`pnpm type-check` passes)
- [ ] Zero ESLint errors (`pnpm lint` passes)
- [ ] Zero console statements in production code
- [ ] All new code follows existing patterns

### Test Coverage Targets

- [ ] Backend service coverage: 80%+
- [ ] Frontend component coverage: 80%+
- [ ] E2E tests for critical flows: 100%
- [ ] Accessibility tests (jest-axe): Zero violations
- **Estimated Total New Tests:** ~100 (60 backend, 40 frontend + E2E)

### Performance Targets

- [ ] API response time: <200ms (p95)
- [ ] Page load time: <3s on 3G
- [ ] Smooth scrolling in message list

---

## 9. Key Files Summary

### Backend (New Files)

| File | Lines | Purpose |
|------|-------|---------|
| `prisma/schema.prisma` | +120 | 4 models, 3 enums |
| `src/services/conversation-service.ts` | ~600 | Conversation CRUD |
| `src/services/message-service.ts` | ~400 | Message operations |
| `src/services/quick-reply-service.ts` | ~200 | Template management |
| `src/services/messaging-analytics-service.ts` | ~250 | Stats tracking |
| `src/services/spam-detection-service.ts` | ~150 | Basic spam checks |
| `src/routes/conversations.ts` | ~400 | API routes |
| `src/controllers/conversation-controller.ts` | ~300 | Request handling |
| `src/middleware/messaging-rate-limiter.ts` | ~80 | Rate limiting |
| `shared/schemas/messaging-schemas.ts` | ~150 | Validation |

### Frontend (New Files)

| File | Lines | Purpose |
|------|-------|---------|
| `components/messaging/ConversationList.tsx` | ~180 | List component |
| `components/messaging/MessageBubble.tsx` | ~120 | Message display |
| `components/messaging/ConversationThread.tsx` | ~200 | Thread view |
| `components/messaging/MessageForm.tsx` | ~180 | Send form |
| `components/messaging/EnquiryForm.tsx` | ~250 | New enquiry |
| `components/messaging/QuickReplyManager.tsx` | ~280 | Template manager |
| `pages/ConversationsPage.tsx` | ~300 | User inbox |
| `pages/ConversationDetailPage.tsx` | ~350 | Conversation view |
| `pages/owner/BusinessInboxPage.tsx` | ~350 | Owner inbox |
| `pages/owner/MessagingSettingsPage.tsx` | ~200 | Settings |
| `services/conversation-service.ts` | ~150 | API client |
| `hooks/useConversations.ts` | ~100 | Data hook |
| `hooks/useMessages.ts` | ~100 | Message hook |

### Tests & i18n

| File | Lines | Purpose |
|------|-------|---------|
| Backend tests (3 files) | ~700 | Unit + integration |
| Frontend tests (5 files) | ~500 | Component tests |
| E2E tests | ~200 | User journeys |
| i18n (10 files) | ~1,200 | Translations |

---

## 10. Implementation Order

```
Phase 9.1 (Database) ──┐
                       ├──> Phase 9.2 (Services) ──> Phase 9.3 (API Routes)
                       │                                      │
                       └──────────────────────────────────────┤
                                                              │
Phase 9.2.6 (Schemas) ────────────────────────────────────────┤
Phase 9.2.7 (Rate Limiters) ──────────────────────────────────┘
                                                              │
                                                              v
                                                    Phase 9.4 (Components)
                                                              │
                                                              v
                                                    Phase 9.5 (Pages)
                                                              │
                                                              v
                                                    Phase 9.6 (Owner Features)
                                                              │
                                                              v
                                                    Phase 9.7 (Tests & i18n)
                                                              │
                                                              v
                                                    Phase 9.8 (QA)
```

---

## 11. Open Questions / Decisions

1. **Real-time updates:** WebSocket or polling for new messages?
   - **Decision:** Start with polling (30s), add WebSocket in Phase 9.2 if needed

2. **File storage:** Use existing media storage or dedicated messaging storage?
   - **Decision:** Use existing media service with `/messages/` prefix

3. **Auto-response scope:** Per-business or per-owner?
   - **Decision:** Per-business (businesses may have multiple owners)

4. **Message deletion:** Soft delete or hard delete?
   - **Decision:** Soft delete with `deletedAt` field for audit trail

---

## 12. Post-Implementation Tasks

After Phase 9 is complete:

1. Update `TODO.md` - Mark all Phase 9 tasks complete
2. Update `PROGRESS.md` - Phase 9 status to 100%
3. Update `CLAUDE.md` - Add Phase 9 completion summary
4. Create completion report at `md/report/phase-9-messaging-complete.md`
5. Run full QA review and document findings
6. Update test count in documentation
