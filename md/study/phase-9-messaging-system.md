# Phase 9: Messaging System - Comprehensive Research

**Date:** 13 March 2026
**Status:** Not Started (0/28 tasks)
**Dependencies:** Phase 2 (User System), Phase 4 (Business Profiles)
**Spec Sections:** Section 16 (Messaging & Communication System), Appendix A.5, Appendix B.6

---

## Overview

Phase 9 implements the **Messaging & Communication System** - a user-to-business messaging platform that enables community users to send enquiries to local businesses through the platform. Business owners receive messages in a unified inbox and can respond with templates or custom messages.

**Key Value Proposition:**
- Privacy-preserving communication (no direct email/phone sharing)
- Spam protection with rate limiting (10 new conversations/day)
- Professional response tracking for business owners
- Centralised communication history

---

## Specification Reference Summary

### Section 16.1: Enquiry System

| Field | Type | Required |
|-------|------|----------|
| Subject Category | Select | Yes |
| Message | Text (max 1000) | Yes |
| Preferred Contact | Radio | Optional |
| Attachments | Images (max 3, 5MB each) | Optional |

**Subject Categories:**
- General Enquiry
- Product/Service Question
- Booking/Reservation
- Feedback
- Other

### Section 16.2: Conversation Management

**User View Features:**
| Feature | Description |
|---------|-------------|
| Conversation List | All conversations with businesses |
| Thread View | Full message history |
| Read Receipts | See when message was read |
| Archive | Hide old conversations |

**Business View Features:**
| Feature | Description |
|---------|-------------|
| Unified Inbox | All customer enquiries |
| Quick Reply | Template responses |
| Auto-Response | Out of office messages |
| Response Time | Track average response |
| Analytics | Enquiry metrics |

### Section 16.3: Privacy & Safety

| Feature | Description |
|---------|-------------|
| Hidden Contact Info | Personal details not shared until user chooses |
| Block User | Prevent further messages |
| Report | Flag inappropriate messages |
| Spam Detection | Automatic filtering |
| Rate Limiting | Max 10 new conversations/day |

---

## Data Models (Appendix A.5)

### Conversation Model

```prisma
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
  user     User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  messages Message[]

  @@unique([businessId, userId])
  @@index([businessId])
  @@index([userId])
  @@index([status])
  @@index([lastMessageAt])
  @@map("conversations")
}
```

### Message Model

```prisma
model Message {
  id             String      @id @default(uuid())
  conversationId String      @map("conversation_id")
  senderType     SenderType  @map("sender_type")
  senderId       String      @map("sender_id")
  content        String      @db.Text // max 1000 chars
  readAt         DateTime?   @map("read_at")
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

### MessageAttachment Model

```prisma
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

### QuickReplyTemplate Model (Business Feature)

```prisma
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

### New Enums

```prisma
enum SubjectCategory {
  GENERAL
  PRODUCT_QUESTION
  BOOKING
  FEEDBACK
  OTHER
}

enum ConversationStatus {
  ACTIVE
  ARCHIVED
  BLOCKED
}

enum SenderType {
  USER
  BUSINESS
}
```

---

## API Endpoints (Appendix B.6)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /conversations | List user's conversations | User |
| GET | /conversations/:id | Get conversation with messages | User |
| POST | /conversations | Start new conversation | User |
| POST | /conversations/:id/messages | Send message in conversation | User |
| PUT | /conversations/:id/read | Mark conversation as read | User |
| PUT | /conversations/:id/archive | Archive conversation | User |
| POST | /conversations/:id/block | Block user from conversation | User |

### Additional Endpoints (Inferred from Features)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /conversations/:id/report | Report conversation/user | User |
| GET | /businesses/:businessId/conversations | Business inbox | Owner |
| GET | /businesses/:businessId/quick-replies | List quick reply templates | Owner |
| POST | /businesses/:businessId/quick-replies | Create quick reply template | Owner |
| PUT | /businesses/:businessId/quick-replies/:id | Update template | Owner |
| DELETE | /businesses/:businessId/quick-replies/:id | Delete template | Owner |
| PUT | /businesses/:businessId/auto-response | Configure auto-response | Owner |
| GET | /businesses/:businessId/messaging-stats | Messaging analytics | Owner |

---

## Business Rules

### Rate Limiting (from platform.json)

```json
"limits": {
  "maxNewConversationsPerDay": 10
}
```

- **New Conversations:** 10 per user per day
- **Messages:** Reasonable limit per hour (suggested 30/hour)
- **Attachments:** Max 3 images per message, 5MB each

### Message Rules

- **Character Limit:** 1000 characters max per message
- **Attachments:** Max 3 images, 5MB each, JPG/PNG/WebP only
- **Edit Window:** None (messages cannot be edited after sending)
- **Delete:** Users can delete their own messages within 24 hours

### Conversation Rules

- **One conversation per user-business pair** (conversations are reusable)
- **Archive:** Archived conversations retained for 2 years
- **Block:** Blocked users cannot start new conversations or send messages
- **Report:** Reports enter moderation queue

### Business Response Tracking

- **Response Time Goal:** Configurable per business (e.g., "within 24 hours")
- **Response Rate:** Percentage of conversations with business reply
- **Average Response Time:** Calculated from all conversations

---

## Location-Agnostic Considerations

- No hardcoded business names or locations in templates
- Timezone-aware message timestamps (use business timezone for display)
- Currency formatting from platform config (if mentioning pricing)
- All UI strings from i18n (never hardcode English)

---

## Internationalization (i18n) Requirements

**Languages:** 10 (en, ar, zh-CN, zh-TW, vi, hi, ur, ko, el, it)
**RTL Support:** Arabic (ar), Urdu (ur)
**Estimated Keys:** 100-150 per language

**Key Namespaces:**
- `messaging.labels.*` - Form labels
- `messaging.placeholders.*` - Input placeholders
- `messaging.buttons.*` - Button text
- `messaging.categories.*` - Subject categories
- `messaging.status.*` - Status labels
- `messaging.notifications.*` - Notification text
- `messaging.errors.*` - Error messages
- `messaging.empty.*` - Empty state messages

---

## Accessibility Requirements (WCAG 2.1 AA)

### Keyboard Navigation
- Tab through all interactive elements
- Arrow keys within conversation list
- Enter to select/send
- Esc to close modals

### Screen Reader Support
- Proper `aria-label` on all buttons
- `aria-live="polite"` for new message notifications
- Announce read receipts
- Announce conversation status changes

### Visual
- Colour contrast: 4.5:1 for text, 3:1 for UI elements
- Focus indicators on all interactive elements
- 44px minimum touch targets
- Clear visual hierarchy

### Forms
- Labels properly associated with inputs
- Error messages announced and linked
- Required fields clearly indicated

---

## Security Considerations

### Privacy (Australian Privacy Principles Compliance)
- Contact info hidden until explicit user consent
- IP address logging with anonymization after 90 days
- Message content encrypted at rest (AES-256-GCM)
- Audit logging for all message actions

### Input Validation
- Message content: max 1000 chars, sanitized (DOMPurify)
- Subject: max 200 chars
- Attachments: file type validation, size limits

### Rate Limiting
```
messaging-new-conversation: 10/day per user
messaging-send-message: 30/hour per user
messaging-read: 100/hour per user
messaging-report: 10/day per user
```

### Spam Prevention
- CAPTCHA or honeypot on first message
- Rate limiting
- Content analysis (optional, Phase 15)
- User reputation tracking

### Block/Report System
- Block prevents all future communication
- Reports enter moderation queue
- Pattern detection for repeat offenders

---

## Frontend Components

### ConversationList
- List of all user conversations
- Unread count badges
- Last message preview
- Business name and avatar
- Status indicators (archived, blocked)
- Search/filter functionality

### ConversationThread
- Message history with timestamps
- Message bubbles (user vs business styling)
- Read receipts indicator
- Scroll to bottom on new message
- Infinite scroll for history

### MessageForm
- Text area with character counter
- Attachment upload (drag & drop)
- Quick reply selection (business view)
- Send button with loading state
- Keyboard shortcut (Cmd/Ctrl + Enter)

### MessageBubble
- Sender styling (user blue, business gray)
- Timestamp
- Read receipt indicator
- Attachment thumbnails
- Delete option (within window)

### EnquiryForm
- Subject category select
- Message text area
- Preferred contact radio buttons
- Attachment upload
- Submit with confirmation

### QuickReplyManager (Business)
- List of saved templates
- Create/edit/delete templates
- Drag to reorder
- Template preview

### BusinessInboxDashboard
- Conversation list with filters
- Response time metrics
- Auto-response configuration
- Quick reply management link

---

## Frontend Pages

| Page | Route | Description |
|------|-------|-------------|
| ConversationsPage | /messages | User's message inbox |
| ConversationDetailPage | /messages/:id | Single conversation thread |
| BusinessInboxPage | /owner/messages | Business owner inbox |
| MessagingSettingsPage | /owner/settings/messaging | Auto-response, templates |

---

## Backend Services

### ConversationService (~600 lines estimated)
- `createConversation()` - Start new conversation
- `getConversationById()` - Get with messages
- `getUserConversations()` - List for user
- `getBusinessConversations()` - List for business
- `archiveConversation()` - Archive
- `blockConversation()` - Block user
- `reportConversation()` - Submit report

### MessageService (~400 lines estimated)
- `sendMessage()` - Create and send message
- `getMessages()` - Get paginated messages
- `markAsRead()` - Mark conversation read
- `deleteMessage()` - Delete within window
- `getUnreadCount()` - Get unread counts

### QuickReplyService (~200 lines estimated)
- `createTemplate()` - Create template
- `updateTemplate()` - Update template
- `deleteTemplate()` - Delete template
- `getTemplates()` - List templates
- `reorderTemplates()` - Update order

### SpamDetectionService (~150 lines estimated)
- `checkMessage()` - Analyze message content
- `checkUserReputation()` - Check user spam history
- `flagForReview()` - Submit to moderation

### MessagingAnalyticsService (~250 lines estimated)
- `trackMessageSent()` - Log message event
- `calculateResponseTime()` - Average response time
- `calculateResponseRate()` - Response percentage
- `getStats()` - Aggregated stats

---

## Rate Limiter Configuration

```typescript
export const messagingRateLimiters = {
  'messaging-new-conversation': {
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 10,
    message: 'Too many new conversations. Try again tomorrow.'
  },
  'messaging-send-message': {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 30,
    message: 'Too many messages. Please slow down.'
  },
  'messaging-read': {
    windowMs: 60 * 60 * 1000,
    max: 100,
    message: 'Too many requests. Please try again later.'
  },
  'messaging-report': {
    windowMs: 24 * 60 * 60 * 1000,
    max: 10,
    message: 'Too many reports. Please try again tomorrow.'
  }
};
```

---

## Validation Schemas

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
```

---

## Email Notifications

### Notification Types

| Event | Recipient | Template Key |
|-------|-----------|--------------|
| New enquiry | Business | `messaging.new_enquiry` |
| Business response | User | `messaging.business_response` |
| Unread reminder | Business | `messaging.unread_reminder` |
| Conversation blocked | User | `messaging.blocked` |

### Template Variables

```json
{
  "userName": "John D.",
  "businessName": "Guildford Cafe",
  "messagePreview": "Hi, I wanted to ask about...",
  "conversationUrl": "https://platform.com/messages/abc123",
  "unsubscribeUrl": "https://platform.com/unsubscribe/xyz"
}
```

---

## Related Phases

| Phase | Relationship |
|-------|-------------|
| Phase 2 | User system (sender/recipient) |
| Phase 4 | Business profiles (recipient businesses) |
| Phase 7 | Business owner dashboard (inbox integration) |
| Phase 15 | Admin moderation (spam management) |
| Phase 16 | Email notifications (message alerts) |

---

## Task Breakdown (28 Tasks)

### 9.1 Data Models (5 tasks)
1. Create Conversation model and enum
2. Create Message model
3. Create MessageAttachment model
4. Create QuickReplyTemplate model
5. Run Prisma migration

### 9.2 Backend Services (7 tasks)
1. ConversationService implementation
2. MessageService implementation
3. QuickReplyService implementation
4. SpamDetectionService (basic)
5. MessagingAnalyticsService
6. Rate limiters configuration
7. Validation schemas

### 9.3 API Endpoints (5 tasks)
1. Conversation CRUD endpoints
2. Message endpoints
3. Business inbox endpoints
4. Quick reply template endpoints
5. Messaging settings endpoints

### 9.4 Frontend - User (6 tasks)
1. ConversationList component
2. ConversationThread component
3. MessageForm component
4. EnquiryForm component
5. ConversationsPage
6. ConversationDetailPage

### 9.5 Frontend - Business (4 tasks)
1. BusinessInboxDashboard
2. QuickReplyManager
3. MessagingSettingsPage
4. Inbox integration with owner dashboard

### 9.6 Testing & i18n (1 task)
1. 10-language translations (100+ keys)

---

## Key Files to Create/Modify

### Backend

**New Files:**
- `packages/backend/src/services/conversation-service.ts`
- `packages/backend/src/services/message-service.ts`
- `packages/backend/src/services/quick-reply-service.ts`
- `packages/backend/src/services/spam-detection-service.ts`
- `packages/backend/src/services/messaging-analytics-service.ts`
- `packages/backend/src/routes/conversations.ts`
- `packages/backend/src/validation/conversation-schemas.ts`
- `packages/backend/src/middleware/messaging-rate-limiter.ts`

**Modified Files:**
- `packages/backend/prisma/schema.prisma` (add models)
- `packages/backend/src/routes/index.ts` (register routes)
- `packages/backend/src/app.ts` (middleware)

### Frontend

**New Files:**
- `packages/frontend/src/components/messaging/ConversationList.tsx`
- `packages/frontend/src/components/messaging/ConversationThread.tsx`
- `packages/frontend/src/components/messaging/MessageForm.tsx`
- `packages/frontend/src/components/messaging/MessageBubble.tsx`
- `packages/frontend/src/components/messaging/EnquiryForm.tsx`
- `packages/frontend/src/components/messaging/QuickReplyManager.tsx`
- `packages/frontend/src/pages/ConversationsPage.tsx`
- `packages/frontend/src/pages/ConversationDetailPage.tsx`
- `packages/frontend/src/pages/BusinessInboxPage.tsx`
- `packages/frontend/src/pages/MessagingSettingsPage.tsx`
- `packages/frontend/src/services/conversation-service.ts`
- `packages/frontend/src/hooks/useConversations.ts`
- `packages/frontend/src/hooks/useMessages.ts`

**Modified Files:**
- `packages/frontend/src/App.tsx` (routes)
- `packages/frontend/src/pages/BusinessProfilePage.tsx` (add enquiry button)
- `packages/frontend/src/pages/OwnerDashboardPage.tsx` (add inbox link)

### i18n

**New Files:**
- `packages/frontend/src/i18n/locales/en/messaging.json`
- `packages/frontend/src/i18n/locales/ar/messaging.json`
- (+ 8 more language files)

---

## Testing Requirements

### Backend Tests (Target: 80%+)
- ConversationService unit tests
- MessageService unit tests
- Rate limiter tests
- Validation schema tests
- API endpoint integration tests

### Frontend Tests (Target: 80%+)
- Component render tests
- User interaction tests
- Form validation tests
- Accessibility tests (jest-axe)

### E2E Tests
- Start new conversation flow
- Send/receive messages
- Business inbox workflow
- Block/report functionality
- Quick reply usage

**Estimated Tests:** ~100 (60 backend, 40 frontend)

---

## Implementation Patterns

Follow existing patterns from Phase 6/7/8:

### Service Pattern
```typescript
export class ConversationService {
  constructor(
    private prisma: PrismaClient,
    private cache: RedisClient,
    private analytics: MessagingAnalyticsService
  ) {}

  async createConversation(data: CreateConversationInput, userId: string): Promise<Conversation> {
    // Implementation
  }
}
```

### Route Pattern
```typescript
router.post(
  '/',
  authenticate,
  rateLimiter('messaging-new-conversation'),
  validate(createConversationSchema),
  async (req, res) => {
    // Implementation
  }
);
```

### Component Pattern
```typescript
export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  onSelect,
  isLoading
}) => {
  const { t } = useTranslation('messaging');
  // Implementation
};
```

---

## Open Questions

1. **Real-time updates:** WebSocket or polling for new messages?
   - Recommendation: Start with polling (simpler), add WebSocket in Phase 9.2

2. **File storage:** Use existing media storage or dedicated messaging storage?
   - Recommendation: Use existing media service with `/messages/` prefix

3. **Auto-response scope:** Per-business or per-owner?
   - Recommendation: Per-business (businesses may have multiple owners)

4. **Message deletion:** Soft delete or hard delete?
   - Recommendation: Soft delete with `deletedAt` field for audit trail

---

## Success Criteria

- [ ] Users can send enquiries to businesses
- [ ] Business owners can view and respond in unified inbox
- [ ] Rate limiting prevents spam (10 conversations/day)
- [ ] Block/report functionality works
- [ ] Quick reply templates save time
- [ ] Response time tracking displays correctly
- [ ] All 10 languages supported
- [ ] WCAG 2.1 AA compliant
- [ ] 80%+ test coverage
- [ ] Zero TypeScript errors
- [ ] Zero console statements
