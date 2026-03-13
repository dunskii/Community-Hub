-- CreateEnum
CREATE TYPE "SubjectCategory" AS ENUM ('GENERAL', 'PRODUCT_QUESTION', 'BOOKING', 'FEEDBACK', 'OTHER');

-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "SenderType" AS ENUM ('USER', 'BUSINESS');

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "subject" VARCHAR(200) NOT NULL,
    "subject_category" "SubjectCategory" NOT NULL,
    "status" "ConversationStatus" NOT NULL DEFAULT 'ACTIVE',
    "last_message_at" TIMESTAMP(3),
    "unread_count_business" INTEGER NOT NULL DEFAULT 0,
    "unread_count_user" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "sender_type" "SenderType" NOT NULL,
    "sender_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "read_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_attachments" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "alt_text" VARCHAR(200),
    "size_bytes" INTEGER NOT NULL,
    "mime_type" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quick_reply_templates" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quick_reply_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "conversations_business_id_idx" ON "conversations"("business_id");

-- CreateIndex
CREATE INDEX "conversations_user_id_idx" ON "conversations"("user_id");

-- CreateIndex
CREATE INDEX "conversations_status_idx" ON "conversations"("status");

-- CreateIndex
CREATE INDEX "conversations_last_message_at_idx" ON "conversations"("last_message_at");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_business_id_user_id_key" ON "conversations"("business_id", "user_id");

-- CreateIndex
CREATE INDEX "messages_conversation_id_idx" ON "messages"("conversation_id");

-- CreateIndex
CREATE INDEX "messages_sender_id_idx" ON "messages"("sender_id");

-- CreateIndex
CREATE INDEX "messages_created_at_idx" ON "messages"("created_at");

-- CreateIndex
CREATE INDEX "message_attachments_message_id_idx" ON "message_attachments"("message_id");

-- CreateIndex
CREATE INDEX "quick_reply_templates_business_id_idx" ON "quick_reply_templates"("business_id");

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_attachments" ADD CONSTRAINT "message_attachments_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quick_reply_templates" ADD CONSTRAINT "quick_reply_templates_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
