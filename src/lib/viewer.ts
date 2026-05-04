import { createHash } from "node:crypto";
import { cookies, headers } from "next/headers";
import { nanoid } from "nanoid";

const COOKIE_NAME = "arv";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 2; // 2 years

interface ResolvedViewer {
  hash: string;
  cookieValue: string | null;
  shouldSetCookie: boolean;
}

export async function resolveViewer(projectId: string): Promise<ResolvedViewer> {
  const jar = await cookies();
  const existing = jar.get(COOKIE_NAME)?.value;

  let cookieValue = existing ?? null;
  let shouldSetCookie = false;

  if (!cookieValue) {
    cookieValue = nanoid(24);
    shouldSetCookie = true;
  }

  const hash = createHash("sha256")
    .update(`${cookieValue}:${projectId}`)
    .digest("hex");

  return { hash, cookieValue, shouldSetCookie };
}

export async function fallbackViewerHash(projectId: string): Promise<string> {
  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    hdrs.get("x-real-ip") ||
    "0.0.0.0";
  const ua = hdrs.get("user-agent") || "unknown";
  return createHash("sha256").update(`${ip}|${ua}|${projectId}`).digest("hex");
}

export function viewerCookieHeader(value: string): string {
  // Production: SameSite=None + Secure + Partitioned (CHIPS) so the cookie
  // sticks inside cross-site iframes. Development (HTTP localhost): browsers
  // reject SameSite=None without Secure, so fall back to Lax — same-origin
  // testing still works and the viewer hash persists across requests.
  const isHttps = process.env.NODE_ENV === "production";
  const parts = [
    `${COOKIE_NAME}=${value}`,
    "Path=/",
    `Max-Age=${COOKIE_MAX_AGE}`,
    "HttpOnly",
  ];
  if (isHttps) {
    parts.push("SameSite=None", "Secure", "Partitioned");
  } else {
    parts.push("SameSite=Lax");
  }
  return parts.join("; ");
}

export const VIEWER_COOKIE_NAME = COOKIE_NAME;
