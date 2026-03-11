-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('PENDING', 'ACTIVE', 'CANCELLED', 'PAST');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('PHYSICAL', 'ONLINE', 'HYBRID');

-- CreateEnum
CREATE TYPE "RSVPStatus" AS ENUM ('GOING', 'INTERESTED', 'NOT_GOING');

-- CreateEnum
CREATE TYPE "RecurrenceFrequency" AS ENUM ('NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "timezone" VARCHAR(50) NOT NULL DEFAULT 'Australia/Sydney',
    "location_type" "LocationType" NOT NULL,
    "venue" JSONB,
    "online_url" VARCHAR(500),
    "linked_business_id" TEXT,
    "image_url" VARCHAR(500),
    "ticket_url" VARCHAR(500),
    "cost" VARCHAR(100),
    "capacity" INTEGER,
    "age_restriction" VARCHAR(20),
    "accessibility" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "recurrence" JSONB,
    "created_by_id" TEXT NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'PENDING',
    "slug" VARCHAR(150),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_rsvps" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "RSVPStatus" NOT NULL,
    "guest_count" INTEGER NOT NULL DEFAULT 1,
    "notes" VARCHAR(200),
    "rsvp_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_rsvps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "events_status_start_time_idx" ON "events"("status", "start_time");

-- CreateIndex
CREATE INDEX "events_location_type_start_time_idx" ON "events"("location_type", "start_time");

-- CreateIndex
CREATE INDEX "events_linked_business_id_idx" ON "events"("linked_business_id");

-- CreateIndex
CREATE INDEX "events_created_by_id_idx" ON "events"("created_by_id");

-- CreateIndex
CREATE INDEX "events_category_id_idx" ON "events"("category_id");

-- CreateIndex
CREATE INDEX "events_start_time_idx" ON "events"("start_time");

-- CreateIndex
CREATE INDEX "events_slug_idx" ON "events"("slug");

-- CreateIndex
CREATE INDEX "event_rsvps_event_id_idx" ON "event_rsvps"("event_id");

-- CreateIndex
CREATE INDEX "event_rsvps_user_id_idx" ON "event_rsvps"("user_id");

-- CreateIndex
CREATE INDEX "event_rsvps_event_id_status_idx" ON "event_rsvps"("event_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "event_rsvps_event_id_user_id_key" ON "event_rsvps"("event_id", "user_id");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_linked_business_id_fkey" FOREIGN KEY ("linked_business_id") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_rsvps" ADD CONSTRAINT "event_rsvps_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_rsvps" ADD CONSTRAINT "event_rsvps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
