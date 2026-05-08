"use client";

import { useEffect, useRef, useState } from "react";
import type { ProjectSettings, ButtonSettings } from "@/lib/settings";
import { GlowBorder } from "./GlowBorder";

export interface PublicReel {
  id: string;
  title: string;
  subtitle: string;
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

  const isFull = settings.reel.mediaRadius === "full";
  const sizes = isMobile ? settings.reel.mobile : settings.reel.desktop;
  const width = sizes.width;
  const height = isFull ? sizes.width : sizes.height;
  const mediaRadius =
    settings.reel.mediaRadius === "full"
      ? "9999px"
      : `${settings.reel.mediaRadius}px`;
  const titleSize = isMobile ? settings.title.sizeMobile : settings.title.sizeDesktop;
  const subtitleSize = isMobile
    ? settings.subtitle.sizeMobile
    : settings.subtitle.sizeDesktop;
  const titleAlign = settings.title.align === "center" ? "center" : "left";
  const titlePosition = settings.title.position;
  const spacingFromReel = isMobile
    ? settings.title.spacingFromReelMobile
    : settings.title.spacingFromReelDesktop;
  const showTitleBlock =
    (reel.title?.trim().length ?? 0) > 0 || (reel.subtitle?.trim().length ?? 0) > 0;

  const cardStyle: React.CSSProperties = {
    width: `${width}px`,
    height: `${height}px`,
    borderRadius: mediaRadius,
    cursor: "pointer",
    position: "relative",
    background: "transparent",
    flexShrink: 0,
  };

  const mediaStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    borderRadius: mediaRadius,
    overflow: "hidden",
    background: "#000",
  };

  const textBlockWidth =
    titlePosition === "right" ? `${settings.title.rightWidth}px` : `${width}px`;

  const titleLineStyle: React.CSSProperties = {
    fontFamily: settings.title.fontFamily,
    fontSize: `${titleSize}px`,
    color: settings.title.color,
    textAlign: titleAlign,
    overflowWrap: "break-word",
    lineHeight: 1.25,
  };

  const subtitleLineStyle: React.CSSProperties = {
    fontFamily: settings.title.fontFamily,
    fontSize: `${subtitleSize}px`,
    color: settings.subtitle.color,
    textAlign: titleAlign,
    overflowWrap: "break-word",
    lineHeight: 1.25,
    marginTop: (reel.title?.trim().length ?? 0) > 0 ? 4 : 0,
  };

  const titleBlockStyle: React.CSSProperties = {
    marginTop: titlePosition === "bottom" ? spacingFromReel : 0,
    width: textBlockWidth,
  };

  const wrapperStyle: React.CSSProperties =
    titlePosition === "right"
      ? {
          display: "flex",
          alignItems: "center",
          gap: spacingFromReel,
          flexShrink: 0,
        }
      : {
          display: "flex",
          flexDirection: "column",
          alignItems: titleAlign === "center" ? "center" : "flex-start",
          flexShrink: 0,
        };

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
      {showTitleBlock && (
        <div style={titleBlockStyle}>
          {(reel.title?.trim().length ?? 0) > 0 && (
            <div style={titleLineStyle}>{reel.title}</div>
          )}
          {(reel.subtitle?.trim().length ?? 0) > 0 && (
            <div style={subtitleLineStyle}>{reel.subtitle}</div>
          )}
        </div>
      )}
    </div>
  );
}
