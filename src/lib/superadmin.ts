/**
 * The single email address allowed to access the /superadmin area.
 * Kept here so both the layout (nav link) and the page/route guards
 * share the same source of truth.
 */
export const SUPERADMIN_EMAIL = "nikiforovrb@yandex.ru";

export function isSuperadmin(email?: string | null): boolean {
  return !!email && email.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase();
}
