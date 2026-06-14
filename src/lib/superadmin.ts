import { auth } from "@/lib/auth";

/**
 * The single email address allowed to access the /superadmin area.
 * Kept here so both the layout (nav link) and the page/route guards
 * share the same source of truth.
 */
export const SUPERADMIN_EMAIL = "nikiforovrb@yandex.ru";

export function isSuperadmin(email?: string | null): boolean {
  return !!email && email.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase();
}

/**
 * Guard for superadmin-only API routes. Returns the session when the caller
 * is the superadmin, otherwise null (caller should respond 403).
 */
export async function requireSuperadmin() {
  const session = await auth();
  if (!isSuperadmin(session?.user?.email)) return null;
  return session;
}
