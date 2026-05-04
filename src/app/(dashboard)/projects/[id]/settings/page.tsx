import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { mergeSettings, type ButtonSettings } from "@/lib/settings";
import { urlForKey } from "@/lib/reel-url";
import { SettingsEditor } from "./SettingsEditor";
import type { PublicReel } from "@/components/reels/ReelCard";
import { isReelActive } from "@/lib/reel-visibility";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SettingsPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) return null;
  const { id } = await params;
  const project = await prisma.project.findFirst({
    where: { id, userId: session.user.id },
    include: { reels: { orderBy: { order: "asc" } } },
  });
  if (!project) notFound();

  const now = new Date();
  const settings = mergeSettings(project.settings);
  const reels: PublicReel[] = project.reels
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
    <SettingsEditor
      projectId={project.id}
      slug={project.slug}
      initialSettings={settings}
      reels={reels}
    />
  );
}
