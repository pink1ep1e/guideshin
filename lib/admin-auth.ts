import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";

/** Роль site-user или отдельный AdminUser (legacy kind=admin). */
export function isAdminSession(
  session: Session | null | undefined,
): boolean {
  if (!session?.user) return false;
  if (session.user.kind === "admin") return true;
  return String(session.user.role || "").toLowerCase() === "admin";
}

export function isAdminToken(token: JWT | null | undefined): boolean {
  if (!token) return false;
  if (token.kind === "admin") return true;
  return String(token.role || "").toLowerCase() === "admin";
}
