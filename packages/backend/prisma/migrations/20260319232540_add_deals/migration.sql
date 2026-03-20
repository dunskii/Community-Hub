-- CreateEnum
CREATE TYPE "DealStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED', 'BOGO', 'FREE_ITEM');

-- CreateTable
CREATE TABLE "deals" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "price" DECIMAL(10,2),
    "original_price" DECIMAL(10,2),
    "discount_type" "DiscountType",
    "discount_value" DECIMAL(10,2),
    "duration" VARCHAR(100),
    "voucher_code" VARCHAR(50),
    "image" VARCHAR(500),
    "terms" VARCHAR(500),
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_until" TIMESTAMP(3) NOT NULL,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "status" "DealStatus" NOT NULL DEFAULT 'ACTIVE',
    "views" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "deals_business_id_idx" ON "deals"("business_id");

-- CreateIndex
CREATE INDEX "deals_status_valid_until_idx" ON "deals"("status", "valid_until");

-- CreateIndex
CREATE INDEX "deals_featured_status_idx" ON "deals"("featured", "status");

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
