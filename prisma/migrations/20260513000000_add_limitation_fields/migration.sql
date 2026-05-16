-- Limitation fields for art. 205c aviation-law claims.

ALTER TABLE "Claim" ADD COLUMN IF NOT EXISTS "flightDate" TIMESTAMP(3);
ALTER TABLE "Claim" ADD COLUMN IF NOT EXISTS "complaintFiledAt" TIMESTAMP(3);
ALTER TABLE "Claim" ADD COLUMN IF NOT EXISTS "complaintAnsweredAt" TIMESTAMP(3);
