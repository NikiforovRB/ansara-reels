import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CreateProjectButton } from "./CreateProjectButton";
import { ProjectsList, type DashboardProject } from "./ProjectsList";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      updatedAt: true,
      _count: { select: { reels: true } },
    },
  });

  const initial: DashboardProject[] = projects.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    reelsCount: p._count.reels,
  }));

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-medium">Проекты</h1>
        <CreateProjectButton />
      </div>
      <ProjectsList initial={initial} />
    </div>
  );
}
