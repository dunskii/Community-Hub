-- CreateEnum
CREATE TYPE "VerificationMethod" AS ENUM ('PHONE', 'EMAIL', 'DOCUMENT', 'GOOGLE_BUSINESS');

-- CreateEnum
CREATE TYPE "ClaimVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'APPEALED');

-- CreateEnum
CREATE TYPE "AnalyticsEventType" AS ENUM ('PROFILE_VIEW', 'SEARCH_APPEARANCE', 'WEBSITE_CLICK', 'PHONE_CLICK', 'DIRECTIONS_CLICK', 'PHOTO_VIEW', 'SAVE', 'UNSAVE', 'FOLLOW', 'UNFOLLOW', 'REVIEW_CREATED', 'MESSAGE_SENT');

-- AlterTable
ALTER TABLE "businesses" ADD COLUMN     "detailed_description" JSONB,
ADD COLUMN     "menu_pdf_url" VARCHAR(500);

-- CreateTable
CREATE TABLE "business_claim_requests" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "verification_method" "VerificationMethod" NOT NULL,
    "verification_status" "ClaimVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "claim_status" "ClaimStatus" NOT NULL DEFAULT 'PENDING',
    "verification_code" TEXT,
    "verification_attempts" INTEGER NOT NULL DEFAULT 0,
    "verification_expires_at" TIMESTAMP(3),
    "verification_token" TEXT,
    "token_expires_at" TIMESTAMP(3),
    "document_type" VARCHAR(50),
    "document_urls" TEXT[],
    "google_business_id" TEXT,
    "google_access_token" TEXT,
    "moderator_id" TEXT,
    "moderator_notes" TEXT,
    "decision_at" TIMESTAMP(3),
    "rejection_reason" VARCHAR(500),
    "appealed_at" TIMESTAMP(3),
    "appeal_reason" TEXT,
    "ip_address" VARCHAR(45),
    "user_agent" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_claim_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_analytics_events" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "event_type" "AnalyticsEventType" NOT NULL,
    "user_id" TEXT,
    "session_id" VARCHAR(100),
    "referral_source" VARCHAR(50),
    "search_term" VARCHAR(200),
    "ip_address_hash" VARCHAR(100),
    "user_agent" VARCHAR(500),
    "metadata" JSONB,
    "event_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_analytics_daily" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "profile_views" INTEGER NOT NULL DEFAULT 0,
    "unique_views" INTEGER NOT NULL DEFAULT 0,
    "search_appearances" INTEGER NOT NULL DEFAULT 0,
    "website_clicks" INTEGER NOT NULL DEFAULT 0,
    "phone_clicks" INTEGER NOT NULL DEFAULT 0,
    "directions_clicks" INTEGER NOT NULL DEFAULT 0,
    "photo_views" INTEGER NOT NULL DEFAULT 0,
    "saves" INTEGER NOT NULL DEFAULT 0,
    "follows" INTEGER NOT NULL DEFAULT 0,
    "reviews" INTEGER NOT NULL DEFAULT 0,
    "messages" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "business_analytics_daily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_owner_staff" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" VARCHAR(50) NOT NULL,
    "permissions" TEXT[],
    "added_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_owner_staff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "business_claim_requests_business_id_idx" ON "business_claim_requests"("business_id");

-- CreateIndex
CREATE INDEX "business_claim_requests_user_id_idx" ON "business_claim_requests"("user_id");

-- CreateIndex
CREATE INDEX "business_claim_requests_claim_status_idx" ON "business_claim_requests"("claim_status");

-- CreateIndex
CREATE INDEX "business_claim_requests_verification_status_idx" ON "business_claim_requests"("verification_status");

-- CreateIndex
CREATE INDEX "business_claim_requests_created_at_idx" ON "business_claim_requests"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "business_claim_requests_business_id_user_id_key" ON "business_claim_requests"("business_id", "user_id");

-- CreateIndex
CREATE INDEX "business_analytics_events_business_id_event_date_idx" ON "business_analytics_events"("business_id", "event_date");

-- CreateIndex
CREATE INDEX "business_analytics_events_business_id_event_type_idx" ON "business_analytics_events"("business_id", "event_type");

-- CreateIndex
CREATE INDEX "business_analytics_events_event_date_idx" ON "business_analytics_events"("event_date");

-- CreateIndex
CREATE INDEX "business_analytics_events_user_id_idx" ON "business_analytics_events"("user_id");

-- CreateIndex
CREATE INDEX "business_analytics_daily_business_id_idx" ON "business_analytics_daily"("business_id");

-- CreateIndex
CREATE INDEX "business_analytics_daily_date_idx" ON "business_analytics_daily"("date");

-- CreateIndex
CREATE UNIQUE INDEX "business_analytics_daily_business_id_date_key" ON "business_analytics_daily"("business_id", "date");

-- CreateIndex
CREATE INDEX "business_owner_staff_business_id_idx" ON "business_owner_staff"("business_id");

-- CreateIndex
CREATE INDEX "business_owner_staff_user_id_idx" ON "business_owner_staff"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "business_owner_staff_business_id_user_id_key" ON "business_owner_staff"("business_id", "user_id");

-- AddForeignKey
ALTER TABLE "business_claim_requests" ADD CONSTRAINT "business_claim_requests_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_claim_requests" ADD CONSTRAINT "business_claim_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_claim_requests" ADD CONSTRAINT "business_claim_requests_moderator_id_fkey" FOREIGN KEY ("moderator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_analytics_events" ADD CONSTRAINT "business_analytics_events_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_analytics_events" ADD CONSTRAINT "business_analytics_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_analytics_daily" ADD CONSTRAINT "business_analytics_daily_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_owner_staff" ADD CONSTRAINT "business_owner_staff_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_owner_staff" ADD CONSTRAINT "business_owner_staff_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_owner_staff" ADD CONSTRAINT "business_owner_staff_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
