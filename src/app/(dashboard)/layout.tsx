import Link from "next/link";
import { redirect } from "next/navigation";
import { LayoutGrid, ShieldCheck } from "lucide-react";
import { auth } from "@/lib/auth";
import { LogoutButton } from "@/components/LogoutButton";
import { SUPERADMIN_EMAIL } from "@/lib/superadmin";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const isSuperadmin = session.user.email === SUPERADMIN_EMAIL;

  return (
    <div className="min-h-screen flex flex-col">
      <header
        className="h-14 px-6 flex items-center justify-between"
        style={{ background: "#2b3144" }}
      >
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors"
        >
          <LayoutGrid size={18} strokeWidth={1.6} />
          <span className="text-[15px]">Ansara Reels</span>
        </Link>
        <div className="flex items-center gap-4">
          {isSuperadmin && (
            <Link
              href="/superadmin"
              className="inline-flex items-center gap-1.5 text-white/70 hover:text-white transition-colors text-sm"
            >
              <ShieldCheck size={16} strokeWidth={1.6} />
              <span>Суперадмин</span>
            </Link>
          )}
          <span className="text-white/60 text-sm">{session.user.email}</span>
          <LogoutButton variant="onDark" />
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
