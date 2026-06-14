import { notFound } from "next/navigation";
import { Folder, Film, HardDrive } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { listObjectSizes } from "@/lib/s3";
import { isSuperadmin } from "@/lib/superadmin";
import {
  formatBytes,
  formatDateRu,
  pluralRu,
  PROJECT_FORMS,
  VIDEO_FORMS,
} from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface ProjectStat {
  id: string;
  name: string;
  videoCount: number;
  videoBytes: number;
}

interface UserStat {
  id: string;
  email: string;
  createdAt: Date;
  projectCount: number;
  videoCount: number;
  videoBytes: number;
  projects: ProjectStat[];
}

export default async function SuperadminPage() {
  const session = await auth();
  if (!isSuperadmin(session?.user?.email)) {
    notFound();
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      email: true,
      createdAt: true,
      projects: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          reels: {
            select: { hoverVideoKey: true, mainVideoKey: true },
          },
        },
      },
    },
  });

  // Pull every object's size once; fall back to an empty map if S3 is down.
  let sizes = new Map<string, number>();
  try {
    sizes = await listObjectSizes();
  } catch {
    sizes = new Map();
  }

  const stats: UserStat[] = users.map((u) => {
    const projects: ProjectStat[] = u.projects.map((p) => {
      const keys: string[] = [];
      for (const r of p.reels) {
        if (r.hoverVideoKey) keys.push(r.hoverVideoKey);
        if (r.mainVideoKey) keys.push(r.mainVideoKey);
      }
      const videoBytes = keys.reduce((sum, k) => sum + (sizes.get(k) ?? 0), 0);
      return {
        id: p.id,
        name: p.name,
        videoCount: keys.length,
        videoBytes,
      };
    });
    return {
      id: u.id,
      email: u.email,
      createdAt: u.createdAt,
      projectCount: projects.length,
      videoCount: projects.reduce((s, p) => s + p.videoCount, 0),
      videoBytes: projects.reduce((s, p) => s + p.videoBytes, 0),
      projects,
    };
  });

  const totalUsers = stats.length;
  const totalProjects = stats.reduce((s, u) => s + u.projectCount, 0);
  const totalVideos = stats.reduce((s, u) => s + u.videoCount, 0);
  const totalBytes = stats.reduce((s, u) => s + u.videoBytes, 0);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-medium">Суперадмин</h1>
        <p className="text-icon text-sm mt-1">
          Управление всеми пользователями платформы
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatCard label="Пользователи" value={String(totalUsers)} />
        <StatCard label="Проекты" value={String(totalProjects)} />
        <StatCard label="Видео" value={String(totalVideos)} />
        <StatCard label="Объём видео" value={formatBytes(totalBytes)} />
      </div>

      <div className="flex flex-col gap-4">
        {stats.map((u) => (
          <div key={u.id} className="bg-surface rounded-lg p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[15px] font-medium truncate">
                  {u.email}
                </div>
                <div className="text-icon text-xs mt-0.5">
                  Зарегистрирован: {formatDateRu(u.createdAt)}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span className="inline-flex items-center gap-1.5 text-icon">
                  <Folder size={15} strokeWidth={1.6} />
                  {u.projectCount} {pluralRu(u.projectCount, PROJECT_FORMS)}
                </span>
                <span className="inline-flex items-center gap-1.5 text-icon">
                  <Film size={15} strokeWidth={1.6} />
                  {u.videoCount} {pluralRu(u.videoCount, VIDEO_FORMS)}
                </span>
                <span className="inline-flex items-center gap-1.5 text-icon">
                  <HardDrive size={15} strokeWidth={1.6} />
                  {formatBytes(u.videoBytes)}
                </span>
              </div>
            </div>

            {u.projects.length > 0 ? (
              <div className="mt-4 bg-white rounded-md overflow-hidden">
                <div className="grid grid-cols-[1fr_120px_140px] px-4 py-2.5 text-[11px] uppercase tracking-wide text-icon">
                  <span>Проект</span>
                  <span className="text-right">Видео</span>
                  <span className="text-right">Объём видео</span>
                </div>
                {u.projects.map((p) => (
                  <div
                    key={p.id}
                    className="grid grid-cols-[1fr_120px_140px] px-4 py-2.5 text-sm border-t border-[#eceef2]"
                  >
                    <span className="truncate">{p.name}</span>
                    <span className="text-right">{p.videoCount}</span>
                    <span className="text-right">
                      {formatBytes(p.videoBytes)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 text-icon text-sm">Нет проектов.</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface rounded-lg p-4">
      <div className="text-icon text-xs">{label}</div>
      <div className="text-2xl font-medium mt-1.5">{value}</div>
    </div>
  );
}
