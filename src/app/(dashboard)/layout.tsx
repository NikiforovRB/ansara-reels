import Link from "next/link";
import { redirect } from "next/navigation";
import { LayoutGrid } from "lucide-react";
import { auth } from "@/lib/auth";
import { LogoutButton } from "@/components/LogoutButton";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-14 px-6 flex items-center justify-between bg-surface">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-icon hover:text-iconHover transition-colors"
        >
          <LayoutGrid size={18} strokeWidth={1.6} />
          <span className="text-[15px]">Ansara Reels</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-icon text-sm">{session.user.email}</span>
          <LogoutButton />
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
