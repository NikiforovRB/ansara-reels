import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { mergeSettings, type ButtonSettings } from "@/lib/settings";
import { urlForKey } from "@/lib/reel-url";
import { ContentEditor, type EditorReel } from "./ContentEditor";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ContentPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) return null;
  const { id } = await params;
  const project = await prisma.project.findFirst({
    where: { id, userId: session.user.id },
    include: { reels: { orderBy: { order: "asc" } } },
  });
  if (!project) notFound();

  const settings = mergeSettings(project.settings);
  const reels: EditorReel[] = project.reels.map((reel) => ({
    id: reel.id,
    order: reel.order,
    title: reel.title,
    bgImageKey: reel.bgImageKey ?? null,
    hoverVideoKey: reel.hoverVideoKey ?? null,
    mainVideoKey: reel.mainVideoKey ?? null,
    bgImageUrl: urlForKey(reel.bgImageKey),
    hoverVideoUrl: urlForKey(reel.hoverVideoKey),
    mainVideoUrl: urlForKey(reel.mainVideoKey),
    button: (reel.button as ButtonSettings | null) ?? null,
  }));

  return (
    <ContentEditor
      projectId={project.id}
      initialReels={reels}
      defaultButton={settings.defaultButton}
    />
  );
}
