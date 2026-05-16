-- CRM major update: additive changes only. Existing records keep old values.

ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "phoneFormatted" TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "countryCode" TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "pesel" TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "documentType" TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "documentNumber" TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "documentSeries" TEXT;
ALTER TABLE "Client" ALTER COLUMN "status" SET DEFAULT 'active';

ALTER TABLE "Claim" ADD COLUMN IF NOT EXISTS "caseYear" INTEGER;
ALTER TABLE "Claim" ADD COLUMN IF NOT EXISTS "caseSequence" INTEGER;
ALTER TABLE "Claim" ADD COLUMN IF NOT EXISTS "signatureFirst" TEXT;
ALTER TABLE "Claim" ADD COLUMN IF NOT EXISTS "signatureSecond" TEXT;
ALTER TABLE "Claim" ADD COLUMN IF NOT EXISTS "courtName" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Claim_caseYear_caseSequence_key"
  ON "Claim"("caseYear", "caseSequence");

ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "clientId" TEXT;

DO $$
BEGIN
  ALTER TABLE "Task"
    ADD CONSTRAINT "Task_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "Client"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "Task_clientId_idx" ON "Task"("clientId");

ALTER TABLE "Payout" ADD COLUMN IF NOT EXISTS "airlinePaymentAmount" DECIMAL(10,2);
ALTER TABLE "Payout" ADD COLUMN IF NOT EXISTS "clientPaymentAmount" DECIMAL(10,2);
ALTER TABLE "Payout" ADD COLUMN IF NOT EXISTS "courtCosts" DECIMAL(10,2);
ALTER TABLE "Payout" ADD COLUMN IF NOT EXISTS "courtCostsPaid" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Payout" ADD COLUMN IF NOT EXISTS "eurPlnRate" DECIMAL(10,4);
ALTER TABLE "Payout" ADD COLUMN IF NOT EXISTS "companyShare" DECIMAL(10,2);
ALTER TABLE "Payout" ADD COLUMN IF NOT EXISTS "clientShare" DECIMAL(10,2);
ALTER TABLE "Payout" ADD COLUMN IF NOT EXISTS "calculatedAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "Notification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "taskId" TEXT,
  "claimId" TEXT,
  "priority" TEXT,
  "read" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  ALTER TABLE "Notification"
    ADD CONSTRAINT "Notification_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "Notification"
    ADD CONSTRAINT "Notification_taskId_fkey"
    FOREIGN KEY ("taskId") REFERENCES "Task"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "Notification"
    ADD CONSTRAINT "Notification_claimId_fkey"
    FOREIGN KEY ("claimId") REFERENCES "Claim"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "Notification_userId_read_createdAt_idx"
  ON "Notification"("userId", "read", "createdAt");
CREATE INDEX IF NOT EXISTS "Notification_taskId_idx" ON "Notification"("taskId");
CREATE INDEX IF NOT EXISTS "Notification_claimId_idx" ON "Notification"("claimId");
