-- Drop the lifetime-unique constraints in favor of per-day uniqueness.
DROP INDEX IF EXISTS "ReelView_reelId_viewerHash_key";
DROP INDEX IF EXISTS "ReelClick_reelId_viewerHash_key";

-- Add the `day` column (initially nullable so we can backfill from firstSeenAt).
ALTER TABLE "ReelView" ADD COLUMN "day" DATE;
ALTER TABLE "ReelClick" ADD COLUMN "day" DATE;

UPDATE "ReelView"  SET "day" = ("firstSeenAt" AT TIME ZONE 'UTC')::date WHERE "day" IS NULL;
UPDATE "ReelClick" SET "day" = ("firstSeenAt" AT TIME ZONE 'UTC')::date WHERE "day" IS NULL;

-- Collapse any duplicates that would violate the new unique key.
DELETE FROM "ReelView" v
USING "ReelView" o
WHERE v."reelId" = o."reelId"
  AND v."viewerHash" = o."viewerHash"
  AND v."day" = o."day"
  AND v.ctid > o.ctid;

DELETE FROM "ReelClick" c
USING "ReelClick" o
WHERE c."reelId" = o."reelId"
  AND c."viewerHash" = o."viewerHash"
  AND c."day" = o."day"
  AND c.ctid > o.ctid;

ALTER TABLE "ReelView"  ALTER COLUMN "day" SET NOT NULL;
ALTER TABLE "ReelClick" ALTER COLUMN "day" SET NOT NULL;

CREATE UNIQUE INDEX "ReelView_reelId_viewerHash_day_key"  ON "ReelView"  ("reelId", "viewerHash", "day");
CREATE UNIQUE INDEX "ReelClick_reelId_viewerHash_day_key" ON "ReelClick" ("reelId", "viewerHash", "day");
