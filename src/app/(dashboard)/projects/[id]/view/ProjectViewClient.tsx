"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { ReelGrid } from "@/components/reels/ReelGrid";
import type { PublicReel } from "@/components/reels/ReelCard";
import type { ProjectSettings } from "@/lib/settings";
import { DeviceSwitcher, type Device } from "@/components/ui/DeviceSwitcher";
import { DeviceFrame } from "@/components/ui/DeviceFrame";
import { IconButton } from "@/components/ui/IconButton";

interface Props {
  slug: string;
  settings: ProjectSettings;
  reels: PublicReel[];
}

export function ProjectViewClient({ slug, settings, reels }: Props) {
  const [device, setDevice] = useState<Device>("desktop");
  const [resetKey, setResetKey] = useState(0);

  function handleReset() {
    try {
      window.localStorage.removeItem(`ar-seen:${slug}`);
    } catch {
      // ignore
    }
    setResetKey((k) => k + 1);
  }

  return (
    <div className="px-6 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 max-w-7xl mx-auto">
        <DeviceSwitcher value={device} onChange={setDevice} />
        <IconButton icon={RotateCcw} size="sm" onClick={handleReset}>
          Сбросить просмотры
        </IconButton>
      </div>
      {reels.length === 0 ? (
        <div className="text-icon text-center py-16">
          Добавьте рилсы во вкладке «Редактор контента».
        </div>
      ) : (
        <DeviceFrame device={device}>
          <ReelGrid
            key={resetKey}
            slug={slug}
            settings={settings}
            reels={reels}
            forceMobile={device === "mobile"}
          />
        </DeviceFrame>
      )}
    </div>
  );
}

