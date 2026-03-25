-- Add GBP sync tracking fields to businesses table (§26.1)
ALTER TABLE "businesses" ADD COLUMN "gbp_last_sync_at" TIMESTAMP(3);
ALTER TABLE "businesses" ADD COLUMN "gbp_sync_status" VARCHAR(20);
