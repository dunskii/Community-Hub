-- Remove follows from analytics daily
ALTER TABLE "business_analytics_daily" DROP COLUMN IF EXISTS "follows";

-- Remove FOLLOW/UNFOLLOW from AnalyticsEventType enum
-- Note: PostgreSQL doesn't support DROP VALUE from enum directly.
-- We create a new enum without those values and swap.
ALTER TYPE "AnalyticsEventType" RENAME TO "AnalyticsEventType_old";
CREATE TYPE "AnalyticsEventType" AS ENUM ('PROFILE_VIEW', 'SEARCH_APPEARANCE', 'WEBSITE_CLICK', 'PHONE_CLICK', 'DIRECTIONS_CLICK', 'PHOTO_VIEW', 'SAVE', 'UNSAVE', 'REVIEW_CREATED', 'MESSAGE_SENT');
ALTER TABLE "business_analytics_events" ALTER COLUMN "event_type" TYPE "AnalyticsEventType" USING "event_type"::text::"AnalyticsEventType";
DROP TYPE "AnalyticsEventType_old";

-- Drop business_follows table
DROP TABLE IF EXISTS "business_follows";

-- Add digest email preference columns to users
ALTER TABLE "users" ADD COLUMN "receive_deal_emails" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "receive_event_emails" BOOLEAN NOT NULL DEFAULT false;
