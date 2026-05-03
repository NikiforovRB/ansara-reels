import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AnalyticsView } from "./AnalyticsView";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AnalyticsPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) return null;
  const { id } = await params;
  const project = await prisma.project.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, name: true },
  });
  if (!project) notFound();

  return <AnalyticsView projectId={project.id} />;
}
