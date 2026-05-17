CREATE TABLE "email_logs" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "recipient_email" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "resend_email_id" TEXT,
  "status" TEXT NOT NULL,
  "error_message" TEXT,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sent_at" TIMESTAMP(3),

  CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "email_logs_type_idx" ON "email_logs"("type");
CREATE INDEX "email_logs_recipient_email_idx" ON "email_logs"("recipient_email");
CREATE INDEX "email_logs_status_idx" ON "email_logs"("status");
CREATE INDEX "email_logs_created_at_idx" ON "email_logs"("created_at");
