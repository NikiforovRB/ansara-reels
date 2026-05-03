import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Tabs, type SerializableTab } from "@/components/ui/Tabs";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function ProjectLayout({ children, params }: LayoutProps) {
  const session = await auth();
  if (!session?.user?.id) return null;
  const { id } = await params;
  const project = await prisma.project.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, name: true },
  });
  if (!project) notFound();

  const base = `/projects/${project.id}`;
  const tabs: SerializableTab[] = [
    { href: `${base}/view`, label: "Просмотр", icon: "view" },
    { href: `${base}/content`, label: "Редактор контента", icon: "pencil" },
    { href: `${base}/settings`, label: "Настройки", icon: "settings" },
    { href: `${base}/analytics`, label: "Аналитика", icon: "chart" },
  ];

  return (
    <div className="min-h-[calc(100vh-56px)]">
      <div className="px-6 pt-4 flex items-center gap-3">
        <Link
          href="/dashboard"
          className="text-icon hover:text-iconHover inline-flex items-center gap-1 text-sm transition-colors"
        >
          <ChevronLeft size={16} strokeWidth={1.6} />К проектам
        </Link>
        <span className="text-icon">·</span>
        <h1 className="text-[18px] font-medium truncate">{project.name}</h1>
      </div>
      <Tabs tabs={tabs} />
      <div>{children}</div>
    </div>
  );
}
