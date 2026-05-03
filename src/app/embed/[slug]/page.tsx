import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { mergeSettings, type ButtonSettings } from "@/lib/settings";
import { urlForKey } from "@/lib/reel-url";
import { ReelGrid } from "@/components/reels/ReelGrid";
import type { PublicReel } from "@/components/reels/ReelCard";
import { EmbedAutoResize } from "@/components/embed/EmbedAutoResize";

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

  const settings = mergeSettings(project.settings);
  const reels: PublicReel[] = project.reels.map((reel) => ({
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
