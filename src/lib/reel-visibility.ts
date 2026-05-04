export type VisibilityMode = "always" | "end" | "start" | "range";

export interface ReelLike {
  visibilityMode: VisibilityMode | string;
  startAt: Date | string | null;
  endAt: Date | string | null;
}

function asDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

/** Whether the reel should be visible to viewers at the given moment. */
export function isReelActive(reel: ReelLike, now: Date = new Date()): boolean {
  const mode = (reel.visibilityMode as VisibilityMode) || "always";
  const start = asDate(reel.startAt);
  const end = asDate(reel.endAt);
  const t = now.getTime();
  switch (mode) {
    case "end":
      return end ? t < end.getTime() : true;
    case "start":
      return start ? t >= start.getTime() : true;
    case "range":
      if (start && t < start.getTime()) return false;
      if (end && t >= end.getTime()) return false;
      return true;
    case "always":
    default:
      return true;
  }
}

/** Status describing why a reel is inactive (used in editor UI). */
export type ReelStatus = "active" | "scheduled" | "ended";

export function reelStatus(reel: ReelLike, now: Date = new Date()): ReelStatus {
  const mode = (reel.visibilityMode as VisibilityMode) || "always";
  const start = asDate(reel.startAt);
  const end = asDate(reel.endAt);
  const t = now.getTime();
  if (mode === "end") {
    if (end && t >= end.getTime()) return "ended";
    return "active";
  }
  if (mode === "start") {
    if (start && t < start.getTime()) return "scheduled";
    return "active";
  }
  if (mode === "range") {
    if (start && t < start.getTime()) return "scheduled";
    if (end && t >= end.getTime()) return "ended";
    return "active";
  }
  return "active";
}
