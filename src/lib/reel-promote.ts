import { prisma } from "@/lib/db";
import { isReelActive } from "@/lib/reel-visibility";

/**
 * For the given project, finds reels whose scheduled start has just elapsed
 * (and which we haven't promoted yet), bumps them to position 0 in the
 * project's reel order, and stamps their `promotedAt` so we don't promote
 * the same reel twice.
 *
 * Idempotent and cheap: in the steady state this issues zero writes.
 */
export async function promoteJustStartedReels(projectId: string): Promise<void> {
  const now = new Date();
  const allCandidates = await prisma.reel.findMany({
    where: {
      projectId,
      visibilityMode: { in: ["start", "range"] },
      startAt: { lte: now },
    },
    select: {
      id: true,
      visibilityMode: true,
      startAt: true,
      endAt: true,
      promotedAt: true,
      order: true,
    },
    orderBy: { startAt: "asc" },
  });

  // Skip reels we've already promoted for this scheduled start.
  const candidates = allCandidates.filter((r) => {
    if (!r.promotedAt) return true;
    if (!r.startAt) return false;
    return r.promotedAt.getTime() < r.startAt.getTime();
  });

  if (candidates.length === 0) return;

  // Filter to ones currently active. If a "range" reel's end has already
  // passed we don't need to promote — it's not visible anyway.
  const toPromote = candidates.filter((r) =>
    isReelActive(
      {
        visibilityMode: r.visibilityMode,
        startAt: r.startAt,
        endAt: r.endAt,
      },
      now,
    ),
  );

  if (toPromote.length === 0) {
    // Mark even non-active candidates as promoted so we don't re-check them.
    await prisma.reel.updateMany({
      where: { id: { in: candidates.map((c) => c.id) } },
      data: { promotedAt: now },
    });
    return;
  }

  // Get current min order in the project so we can place new actives above it.
  const min = await prisma.reel.aggregate({
    where: { projectId },
    _min: { order: true },
  });
  let nextTop = (min._min.order ?? 0) - 1;

  // Promote in start-asc order, so the most recently activated reel ends up
  // on top after we finish this batch.
  await prisma.$transaction(async (tx) => {
    for (const r of toPromote) {
      await tx.reel.update({
        where: { id: r.id },
        data: { order: nextTop, promotedAt: now },
      });
      nextTop -= 1;
    }
    // Also stamp non-promoted candidates so we don't keep checking them.
    const skipped = candidates
      .filter((c) => !toPromote.some((t) => t.id === c.id))
      .map((c) => c.id);
    if (skipped.length > 0) {
      await tx.reel.updateMany({
        where: { id: { in: skipped } },
        data: { promotedAt: now },
      });
    }
  });
}
