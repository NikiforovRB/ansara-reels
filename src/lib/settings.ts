export type GlowEffect =
  | "none"
  | "pulse"
  | "rotate"
  | "spin"
  | "breathe"
  | "shimmer";
export type TitlePosition = "bottom" | "right";
export type TitleAlign = "left" | "center";
export type LayoutMode = "single-row" | "wrap";
export type Radius = number | "full";

export type ButtonWidthMode = "auto" | "stretch";

export interface ButtonSettings {
  enabled: boolean;
  text: string;
  url: string;
  fontSize: number;
  textColor: string;
  bgColor: string;
  bgHoverColor: string;
  radius: number;
  widthMode: ButtonWidthMode;
}

export type GlowDirection = "cw" | "ccw";

export interface ProjectSettings {
  section: {
    bgColor: string;
    gridMaxWidth: number;
    paddingX: number;
  };
  reel: {
    radius: Radius;
    desktop: { width: number; height: number };
    mobile: { width: number; height: number };
  };
  border: {
    gap: number;
    width: number;
    unreadColor: string;
    readColor: string;
    glow: GlowEffect;
    glowSecondColor: string;
    glowDirection: GlowDirection;
    glowDurationSec: number;
  };
  modal: {
    backdropOpacity: number;
  };
  title: {
    text: string;
    position: TitlePosition;
    rightWidth: number;
    align: TitleAlign;
    fontFamily: string;
    customFontUrl?: string | null;
    sizeDesktop: number;
    sizeMobile: number;
    color: string;
  };
  layout: LayoutMode;
  gap: { desktop: number; mobile: number };
  defaultButton: ButtonSettings;
}

export const DEFAULT_BUTTON: ButtonSettings = {
  enabled: false,
  text: "Подробнее",
  url: "",
  fontSize: 14,
  textColor: "#ffffff",
  bgColor: "#0f68e4",
  bgHoverColor: "#0a55bd",
  radius: 8,
  widthMode: "auto",
};

export const DEFAULT_SETTINGS: ProjectSettings = {
  section: {
    bgColor: "#ffffff",
    gridMaxWidth: 1200,
    paddingX: 24,
  },
  reel: {
    radius: 16,
    desktop: { width: 160, height: 240 },
    mobile: { width: 110, height: 170 },
  },
  border: {
    gap: 4,
    width: 2,
    unreadColor: "#0f68e4",
    readColor: "#bdc1cc",
    glow: "pulse",
    glowSecondColor: "#ffffff",
    glowDirection: "cw",
    glowDurationSec: 4,
  },
  modal: {
    backdropOpacity: 70,
  },
  title: {
    text: "Заголовок под рилсом",
    position: "bottom",
    rightWidth: 160,
    align: "center",
    fontFamily: "Gilroy Regular",
    customFontUrl: null,
    sizeDesktop: 14,
    sizeMobile: 12,
    color: "#0f1115",
  },
  layout: "wrap",
  gap: { desktop: 16, mobile: 12 },
  defaultButton: DEFAULT_BUTTON,
};

export function mergeSettings(base: unknown): ProjectSettings {
  const incoming = (base ?? {}) as Partial<ProjectSettings>;
  return {
    section: { ...DEFAULT_SETTINGS.section, ...(incoming.section ?? {}) },
    reel: {
      ...DEFAULT_SETTINGS.reel,
      ...(incoming.reel ?? {}),
      desktop: {
        ...DEFAULT_SETTINGS.reel.desktop,
        ...(incoming.reel?.desktop ?? {}),
      },
      mobile: {
        ...DEFAULT_SETTINGS.reel.mobile,
        ...(incoming.reel?.mobile ?? {}),
      },
    },
    border: { ...DEFAULT_SETTINGS.border, ...(incoming.border ?? {}) },
    modal: { ...DEFAULT_SETTINGS.modal, ...(incoming.modal ?? {}) },
    title: { ...DEFAULT_SETTINGS.title, ...(incoming.title ?? {}) },
    layout: incoming.layout ?? DEFAULT_SETTINGS.layout,
    gap: {
      ...DEFAULT_SETTINGS.gap,
      ...(incoming.gap ?? {}),
    },
    defaultButton: {
      ...DEFAULT_SETTINGS.defaultButton,
      ...(incoming.defaultButton ?? {}),
    },
  };
}

export const FONT_OPTIONS = [
  "Gilroy Regular",
  "Gilroy Medium",
  "Roboto Regular",
  "Roboto Medium",
  "Open Sans",
  "system-ui",
  "Arial",
  "Georgia",
] as const;
