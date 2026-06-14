import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { listObjectSizes } from "@/lib/s3";
import { isSuperadmin } from "@/lib/superadmin";
import { SuperadminClient, type AdminUser } from "./SuperadminClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

  const adminUsers: AdminUser[] = users.map((u) => {
    const projects = u.projects.map((p) => {
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
      createdAt: u.createdAt.toISOString(),
      projectCount: projects.length,
      videoCount: projects.reduce((s, p) => s + p.videoCount, 0),
      videoBytes: projects.reduce((s, p) => s + p.videoBytes, 0),
      projects,
    };
  });

  return (
    <SuperadminClient
      users={adminUsers}
      currentUserId={session?.user?.id ?? ""}
    />
  );
}
