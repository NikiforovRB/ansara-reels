"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const gridRef = useRef<HTMLDivElement>(null);

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

  const scrollByOneCard = useCallback(
    (direction: 1 | -1) => {
      const el = gridRef.current;
      if (!el) return;
      const firstCard = el.firstElementChild as HTMLElement | null;
      const cardWidth = firstCard ? firstCard.offsetWidth : 200;
      el.scrollBy({ left: direction * (cardWidth + gap), behavior: "smooth" });
    },
    [gap],
  );

  // Listen for postMessage from host page to navigate via .reels-left / .reels-right buttons.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onMessage = (e: MessageEvent) => {
      const data = e.data as { type?: string; direction?: string } | undefined;
      if (!data || data.type !== "ar:nav") return;
      scrollByOneCard(data.direction === "left" ? -1 : 1);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [scrollByOneCard]);

  // Same-page support: also react to clicks on .reels-left / .reels-right
  // when they are inside the iframe document itself.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const btn = target.closest(".reels-left, .reels-right") as HTMLElement | null;
      if (!btn) return;
      e.preventDefault();
      scrollByOneCard(btn.classList.contains("reels-left") ? -1 : 1);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [scrollByOneCard]);

  // Drag-to-scroll on desktop when the row overflows.
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    if (isMobile) return;
    if (settings.layout !== "single-row") return;

    const updateCursor = () => {
      const overflows = el.scrollWidth > el.clientWidth + 1;
      el.style.cursor = overflows ? "grab" : "";
    };
    updateCursor();
    const ro = new ResizeObserver(updateCursor);
    ro.observe(el);

    let isDown = false;
    let startX = 0;
    let startScroll = 0;
    let moved = false;

    const onDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      if (el.scrollWidth <= el.clientWidth + 1) return;
      isDown = true;
      moved = false;
      startX = e.clientX;
      startScroll = el.scrollLeft;
      el.style.cursor = "grabbing";
      el.style.userSelect = "none";
      e.preventDefault();
    };
    const onMove = (e: MouseEvent) => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 3) moved = true;
      el.scrollLeft = startScroll - dx;
    };
    const endDrag = () => {
      if (!isDown) return;
      isDown = false;
      el.style.userSelect = "";
      updateCursor();
    };
    const onClickCapture = (e: MouseEvent) => {
      if (moved) {
        e.stopPropagation();
        e.preventDefault();
        moved = false;
      }
    };

    el.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", endDrag);
    el.addEventListener("click", onClickCapture, true);

    return () => {
      ro.disconnect();
      el.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", endDrag);
      el.removeEventListener("click", onClickCapture, true);
    };
  }, [isMobile, settings.layout, reels.length]);

  const sectionStyle = useMemo<React.CSSProperties>(
    () => ({
      backgroundColor: settings.section.bgColor,
      // On mobile reels go edge-to-edge: no section padding on sides at all.
      paddingLeft: isMobile ? 0 : `${settings.section.paddingX}px`,
      paddingRight: isMobile ? 0 : `${settings.section.paddingX}px`,
    }),
    [settings.section, isMobile],
  );

  const gridStyle = useMemo<React.CSSProperties>(() => {
    // On mobile reels go edge-to-edge. We only add a one-time left offset for
    // the first reel (it scrolls out of view together with the content as the
    // user swipes right, so the right side stays flush with the screen edge).
    // `overhang` reserves the room necessary for the glow border so the
    // border itself isn't clipped on either side.
    const leftPad = isMobile
      ? settings.section.mobileLeftOffset + overhang
      : overhang;
    return {
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
      paddingLeft: `${leftPad}px`,
      paddingRight: `${overhang}px`,
    };
  }, [
    settings.layout,
    settings.section.gridMaxWidth,
    settings.section.mobileLeftOffset,
    overhang,
    gap,
    settings.align,
    isMobile,
  ]);

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
      <div ref={gridRef} style={gridStyle} className="no-scrollbar">
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
