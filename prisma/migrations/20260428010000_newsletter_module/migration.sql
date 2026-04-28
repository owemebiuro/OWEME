-- Newsletter CRM module.

CREATE TYPE "NewsletterCampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'PAUSED', 'CANCELLED');
CREATE TYPE "NewsletterSubscriberStatus" AS ENUM ('ACTIVE', 'UNSUBSCRIBED', 'BOUNCED', 'COMPLAINED', 'PENDING');
CREATE TYPE "NewsletterEmailStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'BOUNCED', 'COMPLAINED', 'UNSUBSCRIBED', 'FAILED');

ALTER TABLE "Client"
  ADD COLUMN "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "emailValid" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "NewsletterSubscriber" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "firstName" TEXT,
  "lastName" TEXT,
  "status" "NewsletterSubscriberStatus" NOT NULL DEFAULT 'PENDING',
  "source" TEXT,
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "subscribedAt" TIMESTAMP(3),
  "unsubscribedAt" TIMESTAMP(3),
  "unsubscribeReason" TEXT,
  "lastOpenAt" TIMESTAMP(3),
  "openCount" INTEGER NOT NULL DEFAULT 0,
  "preferences" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NewsletterSegment" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "rules" JSONB NOT NULL DEFAULT '[]',
  "rootOperator" TEXT NOT NULL DEFAULT 'AND',
  "isDynamic" BOOLEAN NOT NULL DEFAULT true,
  "isSystem" BOOLEAN NOT NULL DEFAULT false,
  "recipientCount" INTEGER,
  "lastCalculatedAt" TIMESTAMP(3),
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NewsletterSegment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NewsletterTemplate" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "thumbnailUrl" TEXT,
  "contentHtml" TEXT NOT NULL,
  "isSystem" BOOLEAN NOT NULL DEFAULT false,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NewsletterTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NewsletterCampaign" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "status" "NewsletterCampaignStatus" NOT NULL DEFAULT 'DRAFT',
  "subject" TEXT NOT NULL,
  "previewText" TEXT,
  "fromName" TEXT,
  "fromEmail" TEXT,
  "replyTo" TEXT,
  "segmentId" TEXT,
  "recipientIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "recipientCount" INTEGER NOT NULL DEFAULT 0,
  "contentHtml" TEXT,
  "contentText" TEXT,
  "templateId" TEXT,
  "scheduledAt" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NewsletterCampaign_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NewsletterEmailLog" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "recipientEmail" TEXT NOT NULL,
  "recipientName" TEXT,
  "status" "NewsletterEmailStatus" NOT NULL,
  "messageId" TEXT,
  "openedAt" TIMESTAMP(3),
  "clickedAt" TIMESTAMP(3),
  "bouncedAt" TIMESTAMP(3),
  "bounceType" TEXT,
  "errorMessage" TEXT,
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NewsletterEmailLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NewsletterLinkClick" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "recipientEmail" TEXT NOT NULL,
  "originalUrl" TEXT NOT NULL,
  "trackingUrl" TEXT NOT NULL,
  "clickedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userAgent" TEXT,
  "ipAddress" TEXT,
  CONSTRAINT "NewsletterLinkClick_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NewsletterSubscriber_email_key" ON "NewsletterSubscriber"("email");
CREATE INDEX "Client_marketingConsent_emailValid_idx" ON "Client"("marketingConsent", "emailValid");
CREATE INDEX "NewsletterSubscriber_email_idx" ON "NewsletterSubscriber"("email");
CREATE INDEX "NewsletterSubscriber_status_idx" ON "NewsletterSubscriber"("status");
CREATE INDEX "NewsletterSubscriber_createdAt_idx" ON "NewsletterSubscriber"("createdAt");
CREATE INDEX "NewsletterSegment_createdById_idx" ON "NewsletterSegment"("createdById");
CREATE INDEX "NewsletterSegment_isSystem_idx" ON "NewsletterSegment"("isSystem");
CREATE INDEX "NewsletterTemplate_isSystem_idx" ON "NewsletterTemplate"("isSystem");
CREATE INDEX "NewsletterCampaign_status_idx" ON "NewsletterCampaign"("status");
CREATE INDEX "NewsletterCampaign_segmentId_idx" ON "NewsletterCampaign"("segmentId");
CREATE INDEX "NewsletterCampaign_createdById_idx" ON "NewsletterCampaign"("createdById");
CREATE INDEX "NewsletterCampaign_scheduledAt_idx" ON "NewsletterCampaign"("scheduledAt");
CREATE INDEX "NewsletterEmailLog_campaignId_idx" ON "NewsletterEmailLog"("campaignId");
CREATE INDEX "NewsletterEmailLog_recipientEmail_idx" ON "NewsletterEmailLog"("recipientEmail");
CREATE INDEX "NewsletterEmailLog_status_idx" ON "NewsletterEmailLog"("status");
CREATE INDEX "NewsletterLinkClick_campaignId_idx" ON "NewsletterLinkClick"("campaignId");
CREATE INDEX "NewsletterLinkClick_recipientEmail_idx" ON "NewsletterLinkClick"("recipientEmail");

ALTER TABLE "NewsletterSegment" ADD CONSTRAINT "NewsletterSegment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "NewsletterTemplate" ADD CONSTRAINT "NewsletterTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "NewsletterCampaign" ADD CONSTRAINT "NewsletterCampaign_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "NewsletterCampaign" ADD CONSTRAINT "NewsletterCampaign_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "NewsletterSegment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "NewsletterCampaign" ADD CONSTRAINT "NewsletterCampaign_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "NewsletterTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "NewsletterEmailLog" ADD CONSTRAINT "NewsletterEmailLog_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "NewsletterCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NewsletterLinkClick" ADD CONSTRAINT "NewsletterLinkClick_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "NewsletterCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
