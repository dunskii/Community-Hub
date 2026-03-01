-- AlterTable
ALTER TABLE "businesses" ADD COLUMN     "display_order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "timezone" VARCHAR(50) NOT NULL DEFAULT 'Australia/Sydney';

-- CreateIndex
CREATE INDEX "businesses_featured_display_order_idx" ON "businesses"("featured", "display_order");

-- CreateIndex
CREATE INDEX "businesses_created_at_idx" ON "businesses"("created_at" DESC);
