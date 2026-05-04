"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Eye,
  Pencil,
  Settings as SettingsIcon,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import { twMerge } from "tailwind-merge";

const ICONS: Record<string, LucideIcon> = {
  view: Eye,
  pencil: Pencil,
  settings: SettingsIcon,
  chart: BarChart3,
};

export type TabIconName = keyof typeof ICONS;

export interface SerializableTab {
  href: string;
  label: string;
  icon: TabIconName;
}

interface TabsProps {
  tabs: SerializableTab[];
}

export function Tabs({ tabs }: TabsProps) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap items-center gap-1 px-6 py-1.5 min-h-12">
      {tabs.map(({ href, label, icon }) => {
        const Icon = ICONS[icon];
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={twMerge(
              "inline-flex items-center gap-2 h-9 px-3 transition-colors",
              "text-icon hover:text-iconHover",
              active && "text-iconHover",
            )}
          >
            <Icon size={16} strokeWidth={1.6} />
            <span className="text-[14px]">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
