"use client";

import { useEffect, useMemo, useState } from "react";
import { ReelCard, type PublicReel } from "./ReelCard";
import { ReelModal } from "./ReelModal";
import type { ProjectSettings } from "@/lib/settings";

interface ReelGridProps {
  slug: string;
  settings: ProjectSettings;
  reels: PublicReel[];
  enableTracking?: boolean;
  forceMobile?: boolean;
}

export function ReelGrid({
  slug,
  settings,
  reels,
  enableTracking = false,
  forceMobile,
}: ReelGridProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [seen, setSeen] = useState<Record<string, boolean>>({});
  const [vpMobile, setVpMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(`ar-seen:${slug}`);
      if (raw) setSeen(JSON.parse(raw) as Record<string, boolean>);
    } catch {
      // ignore
    }
  }, [slug]);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 500px)");
    const update = () => setVpMobile(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  const isMobile = forceMobile ?? vpMobile;

  const markSeen = (reelId: string) => {
    setSeen((prev) => {
      if (prev[reelId]) return prev;
      const next = { ...prev, [reelId]: true };
      try {
        window.localStorage.setItem(`ar-seen:${slug}`, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const overhang = settings.border.gap + settings.border.width;
  const gap = isMobile ? settings.gap.mobile : settings.gap.desktop;

  const sectionStyle = useMemo<React.CSSProperties>(
    () => ({
      backgroundColor: settings.section.bgColor,
      paddingLeft: `${settings.section.paddingX}px`,
      paddingRight: `${settings.section.paddingX}px`,
    }),
    [settings.section],
  );

  const gridStyle = useMemo<React.CSSProperties>(
    () => ({
      maxWidth: `${settings.section.gridMaxWidth}px`,
      margin: "0 auto",
      display: "flex",
      flexWrap: settings.layout === "single-row" ? "nowrap" : "wrap",
      gap: `${gap}px`,
      // `safe center` falls back to `flex-start` when items overflow,
      // so the very first reel stays visible on narrow screens.
      justifyContent:
        settings.align === "center" ? "safe center" : "flex-start",
      overflowX: settings.layout === "single-row" ? "auto" : "visible",
      paddingTop: `${16 + overhang}px`,
      paddingBottom: `${16 + overhang}px`,
      paddingLeft: `${overhang}px`,
      paddingRight: `${overhang}px`,
    }),
    [settings.layout, settings.section.gridMaxWidth, overhang, gap, settings.align],
  );

  async function trackView(reelId: string) {
    if (!enableTracking) return;
    try {
      await fetch(`/api/embed/${slug}/track/view`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reelId }),
      });
    } catch {
      // ignore
    }
  }

  async function trackClick(reelId: string) {
    if (!enableTracking) return;
    try {
      await fetch(`/api/embed/${slug}/track/click`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reelId }),
      });
    } catch {
      // ignore
    }
  }

  const open = (index: number) => {
    setOpenIndex(index);
    const reel = reels[index];
    if (reel) {
      markSeen(reel.id);
      void trackView(reel.id);
    }
  };

  const handleNav = (direction: 1 | -1) => {
    setOpenIndex((current) => {
      if (current === null) return current;
      const next = current + direction;
      if (next < 0 || next >= reels.length) return current;
      const reel = reels[next];
      if (reel) {
        markSeen(reel.id);
        void trackView(reel.id);
      }
      return next;
    });
  };

  return (
    <section style={sectionStyle} className="w-full">
      <div style={gridStyle} className="no-scrollbar">
        {reels.map((reel, index) => (
          <ReelCard
            key={reel.id}
            settings={settings}
            reel={reel}
            unread={!seen[reel.id]}
            forceMobile={forceMobile}
            alwaysPlayHover={settings.hoverPreview === "video"}
            onOpen={() => open(index)}
          />
        ))}
      </div>
      {openIndex !== null && reels[openIndex] && (
        <ReelModal
          settings={settings}
          reel={reels[openIndex]}
          total={reels.length}
          currentIndex={openIndex}
          onPrev={() => handleNav(-1)}
          onNext={() => handleNav(1)}
          onClose={() => setOpenIndex(null)}
          onButtonClick={() => trackClick(reels[openIndex].id)}
        />
      )}
    </section>
  );
}
