import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const querySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const project = await prisma.project.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });
  if (!project) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse({
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const from = parsed.data.from ? new Date(parsed.data.from) : null;
  const to = parsed.data.to ? new Date(parsed.data.to) : null;

  const range =
    from || to
      ? {
          ...(from ? { gte: from } : {}),
          ...(to ? { lte: to } : {}),
        }
      : undefined;

  const reels = await prisma.reel.findMany({
    where: { projectId: project.id },
    orderBy: { order: "asc" },
    select: {
      id: true,
      title: true,
      order: true,
      _count: {
        select: {
          views: range ? { where: { firstSeenAt: range } } : true,
          clicks: range ? { where: { firstSeenAt: range } } : true,
        },
      },
    },
  });

  // Daily series: aggregate views/clicks per day in the range.
  const views = await prisma.reelView.findMany({
    where: { reel: { projectId: project.id }, firstSeenAt: range },
    select: { firstSeenAt: true },
  });
  const clicks = await prisma.reelClick.findMany({
    where: { reel: { projectId: project.id }, firstSeenAt: range },
    select: { firstSeenAt: true },
  });

  const series = bucketByDay(views, clicks, from, to);

  return NextResponse.json({
    reels: reels.map((r) => ({
      id: r.id,
      title: r.title,
      order: r.order,
      views: r._count.views,
      clicks: r._count.clicks,
    })),
    series,
  });
}

function bucketByDay(
  views: { firstSeenAt: Date }[],
  clicks: { firstSeenAt: Date }[],
  from: Date | null,
  to: Date | null,
) {
  const map = new Map<string, { date: string; views: number; clicks: number }>();
  const ensure = (d: Date) => {
    const key = d.toISOString().slice(0, 10);
    if (!map.has(key)) map.set(key, { date: key, views: 0, clicks: 0 });
    return map.get(key)!;
  };
  for (const v of views) ensure(v.firstSeenAt).views += 1;
  for (const c of clicks) ensure(c.firstSeenAt).clicks += 1;

  const start = from ?? earliest(views, clicks);
  const end = to ?? new Date();
  if (start) {
    const cur = new Date(start);
    cur.setUTCHours(0, 0, 0, 0);
    const stop = new Date(end);
    stop.setUTCHours(0, 0, 0, 0);
    while (cur.getTime() <= stop.getTime()) {
      ensure(cur);
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1 : 0,
  );
}

function earliest(
  views: { firstSeenAt: Date }[],
  clicks: { firstSeenAt: Date }[],
): Date | null {
  let min: Date | null = null;
  for (const v of [...views, ...clicks]) {
    if (!min || v.firstSeenAt < min) min = v.firstSeenAt;
  }
  return min;
}
