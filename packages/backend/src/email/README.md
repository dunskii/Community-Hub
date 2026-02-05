# Email Service

## Overview

The email service provides a high-level API for sending templated emails with multilingual support. All emails are queued in Redis and sent asynchronously via Mailgun.

**Spec Reference:** Section 26.3 (Email Service)

## Quick Start

```typescript
import { getEmailService } from './email/email-service.js';

const emailService = getEmailService();

// Send email verification
await emailService.sendVerificationEmail(
  'user@example.com',
  'John Doe',
  'verification-token-abc123',
  'en' // Optional: user's language preference
);

// Send password reset
await emailService.sendPasswordResetEmail(
  'user@example.com',
  'John Doe',
  'reset-token-xyz789',
  '192.168.1.1', // User's IP address
  'en' // Optional: user's language preference
);
```

## Architecture

### Components

- **MailgunClient** (`mailgun-client.ts`): Low-level Mailgun API wrapper
- **EmailService** (`email-service.ts`): High-level email sending API
- **TemplateRenderer** (`template-renderer.ts`): Template rendering with variable substitution
- **EmailQueue** (`queue.ts`): Redis-backed email queue with retry logic
- **TemplateTypes** (`template-types.ts`): TypeScript types for templates and variables

### Email Flow

1. Application calls `emailService.sendVerificationEmail()` or `sendPasswordResetEmail()`
2. Service loads template from database (`EmailTemplate` model)
3. Renderer selects language (user preference → platform default from `platform.json`)
4. Renderer substitutes variables (`{{userName}}`, `{{verificationLink}}`, etc.)
5. Email is queued in Redis with retry metadata
6. Worker dequeues and sends via Mailgun
7. Mailgun returns message ID for tracking
8. On failure, email is re-queued (up to 3 retries)

## API Reference

### EmailService

#### `sendVerificationEmail(to, userName, verificationToken, userLanguage?)`

Send email verification email to a new user.

**Parameters:**
- `to` (string): Recipient email address
- `userName` (string): User's display name
- `verificationToken` (string): Verification token (JWT or random string)
- `userLanguage` (LanguageCode, optional): User's preferred language

**Returns:** `Promise<void>`

**Example:**
```typescript
await emailService.sendVerificationEmail(
  'alice@example.com',
  'Alice Smith',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  'ar' // Arabic
);
```

**Template:** `email_verification`
**Variables:** `userName`, `verificationLink`, `expiryHours` (24)

---

#### `sendPasswordResetEmail(to, userName, resetToken, ipAddress, userLanguage?)`

Send password reset email to a user who requested password reset.

**Parameters:**
- `to` (string): Recipient email address
- `userName` (string): User's display name
- `resetToken` (string): Password reset token
- `ipAddress` (string): IP address of the reset request (for security)
- `userLanguage` (LanguageCode, optional): User's preferred language

**Returns:** `Promise<void>`

**Example:**
```typescript
await emailService.sendPasswordResetEmail(
  'bob@example.com',
  'Bob Johnson',
  'reset-token-123',
  '192.168.1.1',
  'zh-CN' // Simplified Chinese
);
```

**Template:** `password_reset`
**Variables:** `userName`, `resetLink`, `expiryMinutes` (60), `ipAddress`, `timestamp`

---

#### `sendTemplatedEmail(templateKey, to, variables, userLanguage?)`

Send a templated email (generic method).

**Parameters:**
- `templateKey` (EmailTemplateKey): Template identifier
- `to` (string): Recipient email address
- `variables` (TemplateVariables[K]): Template variables (type-safe)
- `userLanguage` (LanguageCode, optional): User's preferred language

**Returns:** `Promise<void>`

**Example:**
```typescript
await emailService.sendTemplatedEmail(
  'email_verification',
  'user@example.com',
  {
    userName: 'Test User',
    verificationLink: 'https://example.com/verify?token=abc',
    expiryHours: 24,
  },
  'vi' // Vietnamese
);
```

---

#### `processQueue()`

Process one email from the queue. Call this method from a worker process.

**Returns:** `Promise<void>`

**Example (worker process):**
```typescript
import { getEmailService } from './email/email-service.js';

const emailService = getEmailService();

// Process queue in a loop
setInterval(async () => {
  try {
    await emailService.processQueue();
  } catch (error) {
    console.error('Queue processing error:', error);
  }
}, 5000); // Every 5 seconds
```

## Supported Languages

All email templates support 10 languages:

| Code | Language | Direction |
|------|----------|-----------|
| `en` | English | LTR |
| `ar` | Arabic | RTL |
| `zh-CN` | Simplified Chinese | LTR |
| `zh-TW` | Traditional Chinese | LTR |
| `vi` | Vietnamese | LTR |
| `hi` | Hindi | LTR |
| `ur` | Urdu | RTL |
| `ko` | Korean | LTR |
| `el` | Greek | LTR |
| `it` | Italian | LTR |

**RTL Support:** Arabic and Urdu emails automatically use `dir="rtl"` in the HTML.

## Email Templates

### Available Templates (Phase 1.6)

| Template Key | Description | Variables |
|--------------|-------------|-----------|
| `email_verification` | Email verification for new users | `userName`, `verificationLink`, `expiryHours` |
| `password_reset` | Password reset request | `userName`, `resetLink`, `expiryMinutes`, `ipAddress`, `timestamp` |

### Template Structure

Templates are stored in the `email_templates` database table with multilingual content:

```typescript
{
  templateKey: 'email_verification',
  name: 'Email Verification',
  description: 'Email sent to verify user email address',
  subject: {
    en: 'Verify your email address',
    ar: 'تحقق من عنوان بريدك الإلكتروني',
    // ... all 10 languages
  },
  bodyHtml: {
    en: '<h2>Welcome {{userName}}!</h2><p>Click to verify: <a href="{{verificationLink}}">Verify</a></p>',
    ar: '<h2>مرحباً {{userName}}!</h2><p>انقر للتحقق: <a href="{{verificationLink}}">تأكيد</a></p>',
    // ... all 10 languages
  },
  bodyText: {
    en: 'Welcome {{userName}}! Visit: {{verificationLink}}',
    ar: 'مرحباً {{userName}}! زيارة: {{verificationLink}}',
    // ... all 10 languages
  },
  variables: ['userName', 'verificationLink', 'expiryHours'],
  active: true
}
```

## Adding New Email Templates

### 1. Add Template Key

Edit `packages/backend/src/email/template-types.ts`:

```typescript
export type EmailTemplateKey =
  | 'email_verification'
  | 'password_reset'
  | 'your_new_template'; // Add here

export interface TemplateVariables {
  // ... existing templates
  your_new_template: {
    variable1: string;
    variable2: number;
  };
}
```

### 2. Seed Template

Create seed script in `packages/backend/src/db/seeds/your-template.ts`:

```typescript
import { prisma } from '../index.js';

export async function seedYourTemplate() {
  await prisma.emailTemplate.upsert({
    where: { templateKey: 'your_new_template' },
    create: {
      templateKey: 'your_new_template',
      name: 'Your Template Name',
      description: 'Template description',
      subject: {
        en: 'Subject in English',
        ar: 'Subject in Arabic',
        // ... all 10 languages
      },
      bodyHtml: {
        en: '<p>HTML content with {{variable1}}</p>',
        // ... all 10 languages
      },
      bodyText: {
        en: 'Plain text with {{variable1}}',
        // ... all 10 languages
      },
      variables: ['variable1', 'variable2'],
      active: true,
    },
    update: {},
  });
}
```

Add to `packages/backend/src/db/seed.ts`:
```typescript
import { seedYourTemplate } from './seeds/your-template.js';

async function main() {
  // ... existing seeds
  await seedYourTemplate();
}
```

### 3. Add Convenience Method (Optional)

Edit `packages/backend/src/email/email-service.ts`:

```typescript
async sendYourTemplate(
  to: string,
  variable1: string,
  variable2: number,
  userLanguage?: LanguageCode
): Promise<void> {
  await this.sendTemplatedEmail(
    'your_new_template',
    to,
    { variable1, variable2 },
    userLanguage
  );
}
```

### 4. Test Template

```typescript
const emailService = getEmailService();
await emailService.sendYourTemplate('test@example.com', 'value1', 42, 'en');
await emailService.processQueue();
```

## Template Variables

### Variable Syntax

Use `{{variableName}}` syntax in templates. Variables are substituted after language selection.

**Example:**
```html
<p>Hello {{userName}}, your link is: {{verificationLink}}</p>
```

**After substitution:**
```html
<p>Hello John Doe, your link is: https://example.com/verify?token=abc123</p>
```

### Security

**IMPORTANT:** Do NOT allow user input directly in templates without sanitization. All variables should be controlled by the application.

**Safe:**
```typescript
await emailService.sendVerificationEmail(
  user.email,
  user.displayName, // From database, trusted
  verificationToken,
  user.languagePreference
);
```

**Unsafe:**
```typescript
// NEVER do this:
await emailService.sendTemplatedEmail('some_template', userEmail, {
  content: req.body.userInput, // Untrusted user input!
});
```

## Language Selection

Languages are selected in this order:

1. **User preference:** Passed to `sendVerificationEmail()` or `sendPasswordResetEmail()`
2. **Platform default:** From `platform.json` (`multilingual.defaultLanguage`)

If a template doesn't have content for the selected language, it falls back to English (`en`).

**Example:**
```typescript
// User prefers Arabic
await emailService.sendVerificationEmail(
  'user@example.com',
  'أحمد',
  'token',
  'ar' // Arabic email will be sent
);

// No language specified, uses platform default (en)
await emailService.sendVerificationEmail(
  'user@example.com',
  'John',
  'token'
  // English email will be sent (platform default)
);
```

## RTL Support

Arabic (`ar`) and Urdu (`ur`) emails automatically use `dir="rtl"` in the base template. No additional work needed.

**Base template (`base.html`):**
```html
<html lang="{{lang}}" dir="{{dir}}">
  <!-- For ar/ur: dir="rtl", for others: dir="ltr" -->
</html>
```

## Base Template

All emails are wrapped in a base HTML template (`src/email/templates/base.html`) that includes:

- **Header:** Platform name with primary brand color background
- **Content area:** Injected template content
- **Footer:** Copyright, support email link

**Branding (from platform.json):**
- `{{platformName}}` - Guildford Community Hub
- `{{primaryColor}}` - #2C5F7C (teal)
- `{{secondaryColor}}` - #E67E22 (orange)
- `{{copyrightHolder}}` - Guildford South Community Partners
- `{{supportEmail}}` - support@guildfordhub.com.au

## Queue Management

### Queue Operations

```typescript
import { EmailQueue } from './email/queue.js';

const queue = new EmailQueue();

// Enqueue an email
await queue.enqueue({
  to: 'user@example.com',
  from: 'noreply@test.com',
  subject: 'Test',
  html: '<p>Test</p>',
  text: 'Test',
});

// Dequeue an email
const email = await queue.dequeue();

// Re-queue for retry
await queue.retry(email);

// Get queue length
const length = await queue.length();
```

### Retry Logic

- Max retries: **3**
- Retry on: Any Mailgun send error
- After max retries: Email is dropped (logged as error)
- Future (Phase 16): Move to dead-letter queue for manual review

## Testing

### Unit Tests

```bash
pnpm --filter @community-hub/backend test email
```

**Test Files:**
- `__tests__/email/mailgun-client.test.ts` - Mailgun API client tests
- `__tests__/email/template-renderer.test.ts` - Template rendering tests
- `__tests__/email/email-service.test.ts` - Email service tests

### Manual Testing

Send test emails:

```typescript
import { getEmailService } from './email/email-service.js';

const emailService = getEmailService();

// Send test verification email
await emailService.sendVerificationEmail(
  'your-email@example.com',
  'Test User',
  'test-token-123',
  'en'
);

// Process queue to actually send
await emailService.processQueue();
```

Check your inbox for the email.

### Email Client Testing

Test rendering in:
- Gmail (web, iOS, Android)
- Outlook (desktop, web)
- Apple Mail (macOS, iOS)
- Yahoo Mail
- Proton Mail

## Troubleshooting

### Email not sending

**Check Mailgun configuration:**
```bash
# .env file
MAILGUN_API_KEY=your-api-key
MAILGUN_DOMAIN=mg.guildfordhub.com.au
```

**Verify domain is active:**
```typescript
import { getMailgunClient } from './email/mailgun-client.js';

const client = getMailgunClient();
const isActive = await client.verifyDomain();
console.log('Domain active:', isActive);
```

**Check Redis is running:**
```bash
redis-cli ping
# Should return: PONG
```

**Check email queue:**
```bash
redis-cli llen email:queue
# Should return: 0 (empty) or N (N emails queued)
```

### Template rendering error

**Verify template exists in database:**
```sql
SELECT * FROM email_templates WHERE template_key = 'your_key';
```

**Verify all variables are provided:**
```typescript
// WRONG: Missing expiryHours
await emailService.sendVerificationEmail('user@example.com', 'John', 'token');

// CORRECT: All variables provided (expiryHours is set automatically)
await emailService.sendVerificationEmail('user@example.com', 'John', 'token', 'en');
```

**Check logs for template rendering errors:**
```bash
pnpm --filter @community-hub/backend dev
# Look for errors from template-renderer.ts
```

### Wrong language

**Check user's language preference:**
```sql
SELECT language_preference FROM users WHERE email = 'user@example.com';
```

**Check platform.json default language:**
```json
{
  "multilingual": {
    "defaultLanguage": "en"
  }
}
```

**Ensure template has content for the selected language:**
```sql
SELECT subject, body_html, body_text FROM email_templates WHERE template_key = 'email_verification';
-- Check that the JSON objects have the language key (e.g., "ar", "zh-CN")
```

### Emails going to spam

**Check spam score:**
- Use [mail-tester.com](https://www.mail-tester.com/)
- Target: 8+/10

**Verify SPF/DKIM/DMARC:**
```bash
# Check DNS records
dig TXT mg.guildfordhub.com.au
dig TXT _domainkey.mg.guildfordhub.com.au
dig TXT _dmarc.guildfordhub.com.au
```

**Check Mailgun domain reputation:**
- Login to Mailgun dashboard
- Navigate to Sending → Domains → [your domain]
- Check "Reputation" tab

**Common spam triggers:**
- Too many links
- ALL CAPS in subject
- Spam trigger words ("FREE", "WINNER", "CLICK HERE")
- No plain text version
- Invalid SPF/DKIM/DMARC

## Environment Variables

Required in `.env`:

```bash
# Mailgun
MAILGUN_API_KEY=your-api-key-here
MAILGUN_DOMAIN=mg.guildfordhub.com.au

# Frontend URL (for email links)
FRONTEND_URL=https://guildfordhub.com.au

# Database (for template storage)
DATABASE_URL=postgresql://user:pass@localhost:5432/community_hub

# Redis (for queue)
REDIS_URL=redis://localhost:6379
```

## Best Practices

### 1. Always use convenience methods

**Good:**
```typescript
await emailService.sendVerificationEmail('user@example.com', 'John', 'token', 'en');
```

**Avoid:**
```typescript
await emailService.sendTemplatedEmail('email_verification', 'user@example.com', { ... }, 'en');
```

### 2. Include user language preference

**Good:**
```typescript
const user = await prisma.user.findUnique({ where: { id: userId } });
await emailService.sendVerificationEmail(
  user.email,
  user.displayName,
  token,
  user.languagePreference // User's preferred language
);
```

**Avoid:**
```typescript
await emailService.sendVerificationEmail(user.email, user.displayName, token);
// Missing language, defaults to platform language (might not be user's preference)
```

### 3. Always sanitize user input

**Good:**
```typescript
const sanitizedName = user.displayName.replace(/[<>]/g, ''); // Remove < and >
await emailService.sendVerificationEmail(user.email, sanitizedName, token);
```

**Avoid:**
```typescript
await emailService.sendVerificationEmail(user.email, req.body.name, token);
// Unsanitized user input could inject HTML
```

### 4. Use HTTPS for all links

**Good:**
```typescript
const verificationLink = `https://guildfordhub.com.au/verify?token=${token}`;
```

**Avoid:**
```typescript
const verificationLink = `http://guildfordhub.com.au/verify?token=${token}`;
// HTTP is insecure
```

### 5. Log email sending

Email service automatically logs:
- Email queued: `info` level
- Email sent: `info` level
- Email failed: `error` level

No additional logging needed.

## Future Enhancements (Phase 16+)

- **Bounce handling:** Track hard/soft bounces, update user status
- **Unsubscribe endpoint:** One-click unsubscribe via webhook
- **Email open/click tracking:** Mailgun tracking pixels
- **Email template admin UI:** Edit templates via admin dashboard (Phase 15)
- **Email analytics:** Sent, delivered, bounced, opened rates (Phase 15)
- **Scheduled emails:** Send emails at a specific time
- **Batch emails:** Send to multiple recipients efficiently

## References

- **Spec Section 26.3:** Email Service
- **Spec Section 8:** Multilingual Support
- **Spec Appendix A.19:** EmailTemplate data model
- **Mailgun API:** https://documentation.mailgun.com/
- **RFC 8058:** One-Click Unsubscribe
- **RFC 2369:** List Email Headers
