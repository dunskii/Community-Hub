---
name: db-migrate
description: Creates PostgreSQL database migrations following the Community Hub data models. Use when adding new entities, modifying schemas, creating indexes, or making any database changes.
---

# Database Migration Skill

You are a database migration expert for the Community Hub platform. Your role is to help create safe, reversible database migrations that implement the data models defined in the specification.

## Database Stack

- **Database:** PostgreSQL 14+
- **ORM:** Prisma (recommended) or TypeORM
- **Migrations:** Prisma Migrate or raw SQL

## Migration Principles

1. **Always reversible** - Every migration should have a rollback
2. **Atomic changes** - One logical change per migration
3. **Non-destructive** - Never drop columns/tables in production without data migration
4. **Safe deployments** - Migrations should be zero-downtime compatible

## Prisma Schema Patterns

### Basic Entity

```prisma
// prisma/schema.prisma

model Business {
  id            String   @id @default(uuid())
  name          String   @db.VarChar(100)
  slug          String   @unique @db.VarChar(120)
  description   String?  @db.Text
  tagline       String?  @db.VarChar(200)
  status        BusinessStatus @default(PENDING)

  // Contact
  email         String?  @db.VarChar(255)
  phone         String?  @db.VarChar(20)
  website       String?  @db.VarChar(255)

  // Relations
  categoryId    String
  category      Category @relation(fields: [categoryId], references: [id])
  owners        BusinessOwner[]
  reviews       Review[]
  events        Event[]
  deals         Deal[]
  hours         OperatingHours[]
  media         BusinessMedia[]

  // Metadata
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([categoryId])
  @@index([status])
  @@index([createdAt])
}

enum BusinessStatus {
  PENDING
  ACTIVE
  SUSPENDED
  CLOSED
}
```

### User Model (from Spec §10, Appendix A)

```prisma
model User {
  id              String    @id @default(uuid())
  email           String    @unique @db.VarChar(255)
  passwordHash    String    @db.VarChar(255)
  displayName     String    @db.VarChar(50)
  bio             String?   @db.VarChar(500)
  avatarUrl       String?   @db.VarChar(500)
  role            UserRole  @default(COMMUNITY)
  status          UserStatus @default(ACTIVE)

  // Preferences
  language        String    @default("en") @db.VarChar(10)
  timezone        String    @default("Australia/Sydney") @db.VarChar(50)

  // Verification
  emailVerified   Boolean   @default(false)
  emailVerifiedAt DateTime?

  // Security
  failedLogins    Int       @default(0)
  lockedUntil     DateTime?
  lastLoginAt     DateTime?

  // Relations
  ownedBusinesses BusinessOwner[]
  reviews         Review[]
  savedBusinesses SavedBusiness[]
  conversations   ConversationParticipant[]
  eventRsvps      EventRSVP[]

  // Deletion
  deletionScheduledAt DateTime?

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([email])
  @@index([role])
  @@index([status])
}

enum UserRole {
  GUEST
  COMMUNITY
  BUSINESS_OWNER
  MODERATOR
  ADMIN
  SUPER_ADMIN
}

enum UserStatus {
  ACTIVE
  SUSPENDED
  PENDING_DELETION
  DELETED
}
```

### Review Model (from Spec §18, Appendix A)

```prisma
model Review {
  id            String   @id @default(uuid())
  rating        Int      @db.SmallInt // 1-5
  content       String   @db.VarChar(1000)
  language      String   @default("en") @db.VarChar(10)

  // Relations
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  businessId    String
  business      Business @relation(fields: [businessId], references: [id], onDelete: Cascade)

  photos        ReviewPhoto[]
  response      ReviewResponse?
  helpfulVotes  ReviewHelpful[]

  // Moderation
  status        ReviewStatus @default(PENDING)
  moderatedAt   DateTime?
  moderatedBy   String?

  // Tracking
  helpfulCount  Int      @default(0)

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Can only review once per business (edit within 7 days)
  @@unique([userId, businessId])
  @@index([businessId, status])
  @@index([userId])
  @@index([createdAt])
}

enum ReviewStatus {
  PENDING
  APPROVED
  REJECTED
  FLAGGED
}
```

### Event Model (from Spec §15, Appendix A)

```prisma
model Event {
  id              String    @id @default(uuid())
  title           String    @db.VarChar(200)
  description     String    @db.Text
  slug            String    @unique @db.VarChar(220)

  // Timing
  startDate       DateTime
  endDate         DateTime
  allDay          Boolean   @default(false)
  timezone        String    @default("Australia/Sydney") @db.VarChar(50)

  // Recurrence
  isRecurring     Boolean   @default(false)
  recurrenceRule  Json?     // RRULE format

  // Location
  locationType    EventLocationType
  locationName    String?   @db.VarChar(200)
  locationAddress String?   @db.VarChar(500)
  latitude        Decimal?  @db.Decimal(10, 8)
  longitude       Decimal?  @db.Decimal(11, 8)
  onlineUrl       String?   @db.VarChar(500)

  // Capacity
  capacity        Int?
  rsvpCount       Int       @default(0)

  // Relations
  businessId      String?
  business        Business? @relation(fields: [businessId], references: [id], onDelete: SetNull)
  categoryId      String
  category        EventCategory @relation(fields: [categoryId], references: [id])

  rsvps           EventRSVP[]

  // Media
  imageUrl        String?   @db.VarChar(500)

  // Settings
  isFree          Boolean   @default(true)
  ticketUrl       String?   @db.VarChar(500)

  status          EventStatus @default(DRAFT)

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([businessId])
  @@index([categoryId])
  @@index([startDate])
  @@index([status])
}

enum EventLocationType {
  PHYSICAL
  ONLINE
  HYBRID
}

enum EventStatus {
  DRAFT
  PUBLISHED
  CANCELLED
  COMPLETED
}
```

### Deal Model (from Spec §17, Appendix A)

```prisma
model Deal {
  id              String    @id @default(uuid())
  title           String    @db.VarChar(100)
  description     String    @db.VarChar(500)

  // Discount
  discountType    DiscountType
  discountValue   Decimal   @db.Decimal(10, 2)
  originalPrice   Decimal?  @db.Decimal(10, 2)

  // Validity
  startDate       DateTime
  endDate         DateTime

  // Limits
  maxRedemptions  Int?      // Total limit
  perUserLimit    Int       @default(1)
  redemptionCount Int       @default(0)

  // Flash deal
  isFlashDeal     Boolean   @default(false)

  // Redemption method
  redemptionType  RedemptionType @default(SHOW_SCREEN)
  redemptionCode  String?   @db.VarChar(50)

  // Terms
  terms           String?   @db.Text

  // Relations
  businessId      String
  business        Business  @relation(fields: [businessId], references: [id], onDelete: Cascade)

  redemptions     DealRedemption[]
  savedBy         SavedDeal[]

  // Media
  imageUrl        String?   @db.VarChar(500)

  status          DealStatus @default(DRAFT)

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([businessId])
  @@index([status, startDate, endDate])
  @@index([isFlashDeal])
}

enum DiscountType {
  PERCENTAGE
  FIXED_AMOUNT
  BOGO
  FREE_ITEM
  BUNDLE
}

enum RedemptionType {
  SHOW_SCREEN
  UNIQUE_CODE
  QR_CODE
}

enum DealStatus {
  DRAFT
  PENDING
  ACTIVE
  PAUSED
  EXPIRED
}
```

## Migration Commands

```bash
# Create a new migration
npx prisma migrate dev --name add_business_table

# Apply migrations to production
npx prisma migrate deploy

# Reset database (dev only!)
npx prisma migrate reset

# Generate Prisma client after schema changes
npx prisma generate
```

## Safe Migration Patterns

### Adding a Column

```prisma
// Safe: New nullable column
model Business {
  // ... existing fields
  newField String?  // Nullable, no default needed
}

// Safe: New column with default
model Business {
  // ... existing fields
  isVerified Boolean @default(false)
}
```

### Adding a Required Column

```sql
-- Step 1: Add nullable column
ALTER TABLE "Business" ADD COLUMN "new_field" VARCHAR(100);

-- Step 2: Backfill data
UPDATE "Business" SET "new_field" = 'default_value' WHERE "new_field" IS NULL;

-- Step 3: Add NOT NULL constraint
ALTER TABLE "Business" ALTER COLUMN "new_field" SET NOT NULL;
```

### Renaming a Column

```sql
-- Safe: Use a migration period
-- Step 1: Add new column
ALTER TABLE "Business" ADD COLUMN "display_name" VARCHAR(100);

-- Step 2: Copy data
UPDATE "Business" SET "display_name" = "name";

-- Step 3: Application code uses both columns (read new, write both)
-- Step 4: After deployment, drop old column
ALTER TABLE "Business" DROP COLUMN "name";
```

### Adding an Index

```prisma
// Safe: Adding indexes is non-blocking in PostgreSQL
model Business {
  // ...
  @@index([categoryId, status]) // New composite index
}
```

```sql
-- For large tables, use CONCURRENTLY to avoid locks
CREATE INDEX CONCURRENTLY idx_business_category_status
ON "Business" ("categoryId", "status");
```

### Dropping a Column (Dangerous!)

```sql
-- NEVER do this directly in production!
-- Instead:

-- Step 1: Stop reading from column in application
-- Step 2: Stop writing to column in application
-- Step 3: Deploy application changes
-- Step 4: Wait for confirmation application is stable
-- Step 5: Then drop the column

ALTER TABLE "Business" DROP COLUMN "deprecated_field";
```

## Full-Text Search Setup

```sql
-- Create search index for businesses
CREATE INDEX idx_business_search ON "Business"
USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Search query
SELECT * FROM "Business"
WHERE to_tsvector('english', name || ' ' || COALESCE(description, ''))
   @@ plainto_tsquery('english', 'coffee shop');
```

## Indexing Strategy

### Index These Columns

```prisma
// Foreign keys
@@index([businessId])
@@index([userId])
@@index([categoryId])

// Frequently filtered columns
@@index([status])
@@index([createdAt])
@@index([startDate])

// Composite indexes for common queries
@@index([businessId, status])
@@index([status, startDate, endDate])

// Unique constraints (automatically indexed)
@@unique([userId, businessId])
@@unique([slug])
```

### Don't Over-Index

- Indexes slow down writes
- Each index uses disk space
- Only add indexes for queries you actually run

## Migration Checklist

Before creating a migration:

- [ ] Schema matches specification (Appendix A)
- [ ] Field types are appropriate (VARCHAR lengths, precision)
- [ ] Nullable vs required is correct
- [ ] Default values are sensible
- [ ] Foreign keys have appropriate ON DELETE behaviour
- [ ] Necessary indexes are defined
- [ ] Migration is reversible
- [ ] Large tables: index creation won't lock database

After creating a migration:

- [ ] Test migration on copy of production data
- [ ] Test rollback works correctly
- [ ] Document any manual steps needed
- [ ] Plan for zero-downtime deployment if needed
