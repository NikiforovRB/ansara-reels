import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { mergeSettings, type ButtonSettings } from "@/lib/settings";
import { urlForKey } from "@/lib/reel-url";
import { ReelGrid } from "@/components/reels/ReelGrid";
import type { PublicReel } from "@/components/reels/ReelCard";
import { EmbedAutoResize } from "@/components/embed/EmbedAutoResize";
import { isReelActive } from "@/lib/reel-visibility";
import { promoteJustStartedReels } from "@/lib/reel-promote";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function EmbedPage({ params }: Props) {
  const { slug } = await params;
  const project = await prisma.project.findUnique({
    where: { slug },
    include: { reels: { orderBy: { order: "asc" } } },
  });
  if (!project) notFound();

  // Lazy promotion: any scheduled reel whose start time has just elapsed is
  // bumped to position 0 in the project the first time it's served.
  await promoteJustStartedReels(project.id);

  // Re-fetch reels after potential reorder.
  const dbReels = await prisma.reel.findMany({
    where: { projectId: project.id },
    orderBy: { order: "asc" },
  });

  const now = new Date();
  const settings = mergeSettings(project.settings);
  const reels: PublicReel[] = dbReels
    .filter((r) =>
      isReelActive(
        {
          visibilityMode: r.visibilityMode,
          startAt: r.startAt,
          endAt: r.endAt,
        },
        now,
      ),
    )
    .map((reel) => ({
      id: reel.id,
      title: reel.title,
      bgImageUrl: urlForKey(reel.bgImageKey),
      hoverVideoUrl: urlForKey(reel.hoverVideoKey),
      mainVideoUrl: urlForKey(reel.mainVideoKey),
      button: (reel.button as ButtonSettings | null) ?? null,
    }));

  return (
    <div style={{ background: settings.section.bgColor }}>
      <EmbedAutoResize />
      <ReelGrid
        slug={project.slug}
        settings={settings}
        reels={reels}
        enableTracking
      />
    </div>
  );
}
