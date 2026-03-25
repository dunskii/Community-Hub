-- CreateTable
CREATE TABLE "business_enquiries" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20),
    "category" VARCHAR(30) NOT NULL DEFAULT 'GENERAL',
    "subject" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'NEW',
    "user_id" TEXT,
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_enquiries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "business_enquiries_business_id_created_at_idx" ON "business_enquiries"("business_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "business_enquiries_status_idx" ON "business_enquiries"("status");

-- AddForeignKey
ALTER TABLE "business_enquiries" ADD CONSTRAINT "business_enquiries_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_enquiries" ADD CONSTRAINT "business_enquiries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
