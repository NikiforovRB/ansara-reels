import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { mergeSettings, type ButtonSettings } from "@/lib/settings";
import { urlForKey } from "@/lib/reel-url";
import type { PublicReel } from "@/components/reels/ReelCard";
import { ProjectViewClient } from "./ProjectViewClient";
import { isReelActive } from "@/lib/reel-visibility";
import { promoteJustStartedReels } from "@/lib/reel-promote";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProjectViewPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) return null;
  const { id } = await params;
  const project = await prisma.project.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, slug: true, settings: true },
  });
  if (!project) notFound();

  await promoteJustStartedReels(project.id);

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
      subtitle: reel.subtitle ?? "",
      bgImageUrl: urlForKey(reel.bgImageKey),
      hoverVideoUrl: urlForKey(reel.hoverVideoKey),
      mainVideoUrl: urlForKey(reel.mainVideoKey),
      button: (reel.button as ButtonSettings | null) ?? null,
    }));

  return <ProjectViewClient slug={project.slug} settings={settings} reels={reels} />;
}
