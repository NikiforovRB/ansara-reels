import type { GlowEffect } from "./settings";

export const GLOW_OPTIONS: { value: GlowEffect; label: string }[] = [
  { value: "none", label: "Без свечения" },
  { value: "pulse", label: "Пульсация" },
  { value: "rotate", label: "Вращающийся градиент" },
  { value: "spin", label: "Простое вращение" },
  { value: "breathe", label: "Дыхание" },
  { value: "shimmer", label: "Бликующая обводка" },
];

export function hexToRgba(hex: string, alpha: number): string {
  const m = hex.replace("#", "");
  if (m.length !== 6) return hex;
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
