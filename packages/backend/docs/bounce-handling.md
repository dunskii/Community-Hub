# Email Bounce Handling

This document describes the email bounce handling infrastructure for Phase 1.6 (Email Service).

## Overview

Bounce handling is the process of tracking and responding to failed email deliveries. Mailgun automatically detects bounces and can notify us via webhooks. The infrastructure is prepared in Phase 1.6, with webhook endpoints to be implemented in Phase 16 (Integrations).

## Bounce Types

### Hard Bounces (Permanent Failures)

**Definition:** The email address is invalid or does not exist.

**Causes:**
- Mailbox doesn't exist
- Domain doesn't exist
- Email address syntax is invalid
- Recipient server permanently rejected the email

**Handling:**
1. Mark the email address as invalid in the database
2. Suspend all future email notifications to this address
3. Optionally notify the user (if they have an alternate contact method)
4. Log the bounce event for analytics

### Soft Bounces (Temporary Failures)

**Definition:** The email couldn't be delivered temporarily.

**Causes:**
- Mailbox full
- Server temporarily unavailable
- Message too large
- Content rejected by spam filter (temporary)

**Handling:**
1. Retry delivery (Mailgun handles this automatically)
2. If 3+ consecutive soft bounces occur, flag for manual review
3. After 7 days of soft bounces, treat as hard bounce

### Complaints (Spam Reports)

**Definition:** The recipient marked the email as spam.

**Causes:**
- User clicked "Mark as Spam" or "Report Phishing"
- Email content triggered spam filters
- Too many emails sent to the same recipient

**Handling:**
1. **Immediately** unsubscribe the user from all emails
2. Update user preferences (optOut = true)
3. Log the complaint for analytics
4. Send alert to admin if complaint rate exceeds threshold (>0.1%)

## Mailgun Webhook Payload

### Bounce Event

```json
{
  "signature": {
    "timestamp": "1650000000",
    "token": "abc123",
    "signature": "xyz789"
  },
  "event-data": {
    "event": "failed",
    "severity": "permanent",
    "reason": "bounce",
    "recipient": "user@example.com",
    "message": {
      "headers": {
        "message-id": "<20220415120000.1.ABCDEF@mg.example.com>"
      }
    },
    "delivery-status": {
      "code": 550,
      "message": "Mailbox does not exist",
      "description": "Permanent bounce"
    },
    "timestamp": 1650000000
  }
}
```

### Complaint Event

```json
{
  "signature": {
    "timestamp": "1650000000",
    "token": "abc123",
    "signature": "xyz789"
  },
  "event-data": {
    "event": "complained",
    "recipient": "user@example.com",
    "message": {
      "headers": {
        "message-id": "<20220415120000.1.ABCDEF@mg.example.com>"
      }
    },
    "timestamp": 1650000000
  }
}
```

## Webhook Endpoint (Phase 16)

**Endpoint:** `POST /webhooks/mailgun/bounces`

**Authentication:** HMAC-SHA256 signature verification using `MAILGUN_WEBHOOK_SIGNING_KEY`

**Implementation Steps (Phase 16):**

1. Verify webhook signature:
   ```typescript
   const crypto = require('crypto');

   function verifyWebhookSignature(timestamp: string, token: string, signature: string): boolean {
     const signingKey = process.env['MAILGUN_WEBHOOK_SIGNING_KEY'];
     const encodedToken = crypto
       .createHmac('sha256', signingKey)
       .update(timestamp + token)
       .digest('hex');

     return encodedToken === signature;
   }
   ```

2. Parse bounce event from request body

3. Determine bounce type (hard, soft, complaint)

4. Update user status:
   - Hard bounce: Set `emailValid = false`, log bounce
   - Soft bounce (3+): Flag for review
   - Complaint: Set `notificationPreferences.optOut = true`, log complaint

5. Log event in database (BounceLog model)

6. Send alert to admin if needed

## Unsubscribe Handling (RFC 8058)

### List-Unsubscribe Header

All emails include the `List-Unsubscribe` header for one-click unsubscribe:

```http
List-Unsubscribe: <https://guildfordhub.com.au/unsubscribe>
List-Unsubscribe-Post: List-Unsubscribe=One-Click
```

### Unsubscribe Endpoint (Phase 16)

**Endpoint:** `POST /webhooks/mailgun/unsubscribe`

**Flow:**
1. User clicks "Unsubscribe" in email client (Gmail, Outlook)
2. Email client sends POST request to unsubscribe URL
3. Endpoint updates user preferences (`notificationPreferences.optOut = true`)
4. Return 200 OK
5. Optionally send confirmation email (if user hasn't completely opted out)

## Bounce Thresholds

**Hard Bounce Rate:**
- Threshold: >2% of sent emails
- Action: Alert admin, review email list quality

**Soft Bounce Rate:**
- Threshold: >5% of sent emails
- Action: Review email content for spam triggers

**Complaint Rate:**
- Threshold: >0.1% of sent emails
- Action: **Critical alert**, review email frequency and content

## Database Schema (Phase 16)

### BounceLog Model

```prisma
model BounceLog {
  id              String   @id @default(uuid())
  recipient       String   // Email address
  bounceType      String   // HARD, SOFT, COMPLAINT
  severity        String   // permanent, temporary
  reason          String   // bounce, suppressed, spam
  mailgunEventId  String   @unique @map("mailgun_event_id")
  statusCode      Int?     @map("status_code")
  statusMessage   String?  @map("status_message")
  createdAt       DateTime @default(now()) @map("created_at")

  @@map("bounce_logs")
  @@index([recipient])
  @@index([bounceType])
  @@index([createdAt])
}
```

### User Model Updates (Phase 2)

Add fields to track email validity:

```prisma
model User {
  // ... existing fields
  emailValid          Boolean  @default(true) @map("email_valid")
  lastBounceAt        DateTime? @map("last_bounce_at")
  bounceCount         Int      @default(0) @map("bounce_count")
}
```

## Monitoring & Alerts

### Metrics to Track (Phase 15 - Analytics)

1. **Bounce Rate:** (bounces / sent) × 100
2. **Complaint Rate:** (complaints / sent) × 100
3. **Deliverability Rate:** (delivered / sent) × 100
4. **Bounce by Type:** Hard vs Soft vs Complaint
5. **Bounce by Template:** Which templates have highest bounce rates

### Alert Conditions

| Condition | Severity | Action |
|-----------|----------|--------|
| Hard bounce rate > 2% | Warning | Email admin |
| Complaint rate > 0.1% | Critical | Email admin + SMS |
| Deliverability < 95% | Warning | Review email configuration |
| 10+ bounces for same domain | Info | Domain may be blocking us |

## Best Practices

1. **Clean Email List Regularly**
   - Remove hard bounced emails after 30 days
   - Flag soft bounced emails after 7 days of failures

2. **Monitor Sender Reputation**
   - Use Mailgun's reputation tracking
   - Check domain on mail-tester.com monthly
   - Monitor SPF/DKIM/DMARC alignment

3. **Reduce Bounce Rate**
   - Validate email addresses on registration (syntax + MX record)
   - Use double opt-in for email verification
   - Don't send to old/inactive email addresses

4. **Handle Complaints Promptly**
   - Unsubscribe immediately (never send again)
   - Review email content for spam triggers
   - Respect user preferences

5. **Test Email Deliverability**
   - Send test emails to Gmail, Outlook, Yahoo
   - Check spam folder placement
   - Monitor open rates (low opens may indicate spam folder)

## Implementation Checklist (Phase 16)

- [ ] Create BounceLog database model
- [ ] Add emailValid, lastBounceAt, bounceCount fields to User model
- [ ] Implement webhook signature verification
- [ ] Create `POST /webhooks/mailgun/bounces` endpoint
- [ ] Create `POST /webhooks/mailgun/unsubscribe` endpoint
- [ ] Implement hard bounce handling logic
- [ ] Implement soft bounce handling logic
- [ ] Implement complaint handling logic
- [ ] Set up bounce monitoring and alerts
- [ ] Test webhook with Mailgun test events
- [ ] Document bounce handling workflow
- [ ] Add bounce metrics to admin dashboard (Phase 15)

## References

- **RFC 8058:** Signaling One-Click Functionality for List Email Headers
- **RFC 2369:** The Use of URLs as Meta-Syntax for Core Mail List Commands
- **Mailgun Webhooks:** https://documentation.mailgun.com/en/latest/user_manual.html#webhooks
- **Spec Section 26.3:** Email Service (bounce handling)
