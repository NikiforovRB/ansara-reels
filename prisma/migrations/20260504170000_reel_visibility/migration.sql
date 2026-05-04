-- AlterTable: add visibility/scheduling fields to Reel
ALTER TABLE "Reel"
  ADD COLUMN "visibilityMode" TEXT NOT NULL DEFAULT 'always',
  ADD COLUMN "startAt" TIMESTAMP(3),
  ADD COLUMN "endAt" TIMESTAMP(3),
  ADD COLUMN "promotedAt" TIMESTAMP(3);
