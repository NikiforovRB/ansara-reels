"use client";

import { useEffect, useRef, useState } from "react";
import type { ProjectSettings, ButtonSettings } from "@/lib/settings";
import { GlowBorder } from "./GlowBorder";

export interface PublicReel {
  id: string;
  title: string;
  bgImageUrl: string | null;
  hoverVideoUrl: string | null;
  mainVideoUrl: string | null;
  button: ButtonSettings | null;
}

interface Props {
  settings: ProjectSettings;
  reel: PublicReel;
  unread: boolean;
  onOpen: () => void;
  forceMobile?: boolean;
  alwaysPlayHover?: boolean;
}

export function ReelCard({
  settings,
  reel,
  unread,
  onOpen,
  forceMobile,
  alwaysPlayHover = false,
}: Props) {
  const [hover, setHover] = useState(false);
  const [vpMobile, setVpMobile] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 500px)");
    const update = () => setVpMobile(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  const isMobile = forceMobile ?? vpMobile;
  const playing = alwaysPlayHover || (hover && !isMobile);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (playing && reel.hoverVideoUrl) {
      el.muted = true;
      el.play().catch(() => undefined);
    } else if (!alwaysPlayHover) {
      el.pause();
    }
  }, [playing, alwaysPlayHover, reel.hoverVideoUrl]);

  const isFull = settings.reel.radius === "full";
  const sizes = isMobile ? settings.reel.mobile : settings.reel.desktop;
  const width = sizes.width;
  const height = isFull ? sizes.width : sizes.height;
  const radius = settings.reel.radius === "full" ? "9999px" : `${settings.reel.radius}px`;
  const titleSize = isMobile ? settings.title.sizeMobile : settings.title.sizeDesktop;
  const titleAlign = settings.title.align === "center" ? "center" : "left";
  const titlePosition = settings.title.position;

  const cardStyle: React.CSSProperties = {
    width: `${width}px`,
    height: `${height}px`,
    borderRadius: radius,
    cursor: "pointer",
    position: "relative",
    background: "transparent",
    flexShrink: 0,
  };

  const mediaStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    borderRadius: radius,
    overflow: "hidden",
    background: "#000",
  };

  const titleStyle: React.CSSProperties = {
    fontFamily: settings.title.fontFamily,
    fontSize: `${titleSize}px`,
    color: settings.title.color,
    textAlign: titleAlign,
    marginTop: titlePosition === "bottom" ? 8 : 0,
    width: titlePosition === "right" ? `${settings.title.rightWidth}px` : `${width}px`,
    overflowWrap: "break-word",
    lineHeight: 1.25,
  };

  const wrapperStyle: React.CSSProperties =
    titlePosition === "right"
      ? { display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }
      : { display: "flex", flexDirection: "column", alignItems: titleAlign === "center" ? "center" : "flex-start", flexShrink: 0 };

  return (
    <div style={wrapperStyle}>
      <div
        style={cardStyle}
        onClick={onOpen}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen();
          }
        }}
      >
        <div style={mediaStyle}>
          {reel.bgImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={reel.bgImageUrl}
              alt=""
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          )}
          {reel.hoverVideoUrl && (
            <video
              ref={videoRef}
              src={reel.hoverVideoUrl}
              muted
              playsInline
              loop
              autoPlay={alwaysPlayHover}
              preload={alwaysPlayHover ? "auto" : "metadata"}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: playing ? 1 : 0,
                transition: "opacity 200ms",
              }}
            />
          )}
        </div>
        <GlowBorder settings={settings} unread={unread} />
      </div>
      {reel.title && titlePosition !== "right" && (
        <div style={titleStyle}>{reel.title}</div>
      )}
      {reel.title && titlePosition === "right" && (
        <div style={titleStyle}>{reel.title}</div>
      )}
    </div>
  );
}
