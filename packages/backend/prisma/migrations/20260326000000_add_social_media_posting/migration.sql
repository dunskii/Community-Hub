-- CreateEnum
CREATE TYPE "SocialPlatform" AS ENUM ('FACEBOOK', 'INSTAGRAM', 'TWITTER', 'LINKEDIN', 'GOOGLE_BUSINESS');

-- CreateEnum
CREATE TYPE "SocialPostStatus" AS ENUM ('PENDING', 'QUEUED', 'PUBLISHING', 'PUBLISHED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "social_accounts" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "platform_account_id" VARCHAR(255) NOT NULL,
    "platform_account_name" VARCHAR(255) NOT NULL,
    "access_token_encrypted" TEXT NOT NULL,
    "refresh_token_encrypted" TEXT,
    "token_expires_at" TIMESTAMP(3),
    "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "connected_by" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_post_at" TIMESTAMP(3),
    "last_error" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_posts" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "social_account_id" TEXT NOT NULL,
    "content_type" VARCHAR(20) NOT NULL,
    "content_id" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "caption" VARCHAR(2200) NOT NULL,
    "image_url" VARCHAR(500),
    "platform_post_id" VARCHAR(255),
    "platform_post_url" VARCHAR(500),
    "status" "SocialPostStatus" NOT NULL DEFAULT 'PENDING',
    "scheduled_at" TIMESTAMP(3),
    "published_at" TIMESTAMP(3),
    "error_message" VARCHAR(1000),
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "max_retries" INTEGER NOT NULL DEFAULT 3,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_post_logs" (
    "id" TEXT NOT NULL,
    "social_post_id" TEXT NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_post_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "social_accounts_business_id_idx" ON "social_accounts"("business_id");
CREATE INDEX "social_accounts_connected_by_idx" ON "social_accounts"("connected_by");
CREATE INDEX "social_accounts_token_expires_at_idx" ON "social_accounts"("token_expires_at");
CREATE UNIQUE INDEX "social_accounts_business_id_platform_key" ON "social_accounts"("business_id", "platform");

-- CreateIndex
CREATE INDEX "social_posts_business_id_idx" ON "social_posts"("business_id");
CREATE INDEX "social_posts_social_account_id_idx" ON "social_posts"("social_account_id");
CREATE INDEX "social_posts_content_type_content_id_idx" ON "social_posts"("content_type", "content_id");
CREATE INDEX "social_posts_status_scheduled_at_idx" ON "social_posts"("status", "scheduled_at");
CREATE INDEX "social_posts_platform_status_idx" ON "social_posts"("platform", "status");

-- CreateIndex
CREATE INDEX "social_post_logs_social_post_id_idx" ON "social_post_logs"("social_post_id");
CREATE INDEX "social_post_logs_created_at_idx" ON "social_post_logs"("created_at");

-- AddForeignKey
ALTER TABLE "social_accounts" ADD CONSTRAINT "social_accounts_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "social_accounts" ADD CONSTRAINT "social_accounts_connected_by_fkey" FOREIGN KEY ("connected_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_social_account_id_fkey" FOREIGN KEY ("social_account_id") REFERENCES "social_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_post_logs" ADD CONSTRAINT "social_post_logs_social_post_id_fkey" FOREIGN KEY ("social_post_id") REFERENCES "social_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
