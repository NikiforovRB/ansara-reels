"use client";

import type { CSSProperties } from "react";
import type { ProjectSettings } from "@/lib/settings";
import { hexToRgba } from "@/lib/glow";

interface Props {
  settings: ProjectSettings;
  unread: boolean;
}

function animation(
  name: string,
  duration: string,
  timing: "linear" | "ease-in-out",
  direction: "normal" | "reverse",
): CSSProperties {
  return {
    animationName: name,
    animationDuration: duration,
    animationTimingFunction: timing,
    animationIterationCount: "infinite",
    animationDirection: direction,
  };
}

export function GlowBorder({ settings, unread }: Props) {
  const { border, reel } = settings;
  const baseColor = unread ? border.unreadColor : border.readColor;
  const secondColor = border.glowSecondColor || baseColor;
  const radius = reel.radius === "full" ? "9999px" : `${reel.radius}px`;
  const offset = -border.gap;
  const borderWidth = border.width;
  const duration = `${Math.max(0.2, border.glowDurationSec)}s`;
  const direction: "normal" | "reverse" =
    border.glowDirection === "ccw" ? "reverse" : "normal";

  const baseStyle: CSSProperties = {
    position: "absolute",
    inset: `${offset}px`,
    borderRadius: radius,
    border: `${borderWidth}px solid ${baseColor}`,
    pointerEvents: "none",
    boxSizing: "border-box",
  };

  const gradientFrame: CSSProperties = {
    position: "absolute",
    inset: `${offset}px`,
    borderRadius: radius,
    padding: `${borderWidth}px`,
    WebkitMask:
      "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
    WebkitMaskComposite: "xor",
    maskComposite: "exclude",
    pointerEvents: "none",
  };

  if (!unread || border.glow === "none") {
    return <span style={baseStyle} />;
  }

  if (border.glow === "pulse") {
    return (
      <span
        style={{
          ...baseStyle,
          ...animation("ar-glow-pulse", duration, "ease-in-out", direction),
          ["--glow-color" as string]: hexToRgba(baseColor, 0.55),
          ["--glow-color-soft" as string]: hexToRgba(baseColor, 0.25),
        } as CSSProperties}
      />
    );
  }

  if (border.glow === "breathe") {
    return (
      <>
        <span style={baseStyle} />
        <span
          style={{
            ...baseStyle,
            border: "none",
            background: "transparent",
            boxShadow: `0 0 16px 4px ${hexToRgba(baseColor, 0.45)}`,
            ...animation("ar-glow-breathe", duration, "ease-in-out", direction),
          }}
        />
      </>
    );
  }

  if (border.glow === "rotate") {
    return (
      <span
        style={{
          ...gradientFrame,
          background: `conic-gradient(from 0deg, ${baseColor}, ${secondColor} 25%, ${baseColor} 50%, ${secondColor} 75%, ${baseColor} 100%)`,
          ...animation("ar-glow-rotate", duration, "linear", direction),
        }}
      />
    );
  }

  if (border.glow === "spin") {
    return (
      <span
        style={{
          ...gradientFrame,
          background: `conic-gradient(from 0deg, ${baseColor}, ${secondColor}, ${baseColor})`,
          ...animation("ar-glow-rotate", duration, "linear", direction),
        }}
      />
    );
  }

  if (border.glow === "shimmer") {
    return (
      <span
        style={{
          ...gradientFrame,
          background: `linear-gradient(110deg, ${baseColor} 0%, ${baseColor} 40%, ${secondColor} 50%, ${baseColor} 60%, ${baseColor} 100%)`,
          backgroundSize: "200% 100%",
          ...animation("ar-glow-shimmer", duration, "linear", direction),
        }}
      />
    );
  }

  return <span style={baseStyle} />;
}
