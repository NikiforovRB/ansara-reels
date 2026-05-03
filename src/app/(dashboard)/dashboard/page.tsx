import Link from "next/link";
import { Plus, ExternalLink } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CreateProjectButton } from "./CreateProjectButton";

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

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-medium">Проекты</h1>
        <CreateProjectButton />
      </div>

      {projects.length === 0 ? (
        <div className="bg-surface rounded-lg p-10 text-center text-icon">
          <Plus size={28} strokeWidth={1.4} className="mx-auto mb-3" />
          <p>У вас пока нет проектов. Создайте первый.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                href={`/projects/${project.id}/view`}
                className="block bg-surface hover:bg-[#eceef2] transition-colors rounded-lg p-5"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[16px] font-medium truncate">
                    {project.name}
                  </span>
                  <ExternalLink
                    size={16}
                    strokeWidth={1.4}
                    className="text-icon shrink-0 mt-1"
                  />
                </div>
                <div className="mt-3 text-[12px] text-icon flex items-center gap-3">
                  <span>{project._count.reels} рилсов</span>
                  <span>·</span>
                  <span>/{project.slug}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
