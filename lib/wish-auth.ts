import type { Session } from "next-auth";
import { withPrisma } from "@/prisma/prisma-client";
import { friendlyWishImportError } from "@/lib/wish-errors";

export { friendlyWishImportError };

/** Резолвит User из сессии (id или email) — чинит Google JWT с чужим sub. */
export async function resolveWishUser(session: Session | null) {
  if (!session?.user || session.user.kind !== "user") return null;

  const id = session.user.id?.trim() || "";
  const email = session.user.email?.trim().toLowerCase() || "";

  return withPrisma(async (prisma) => {
    if (id) {
      const byId = await prisma.user.findUnique({ where: { id } });
      if (byId) return byId;
    }
    if (email) {
      const byEmail = await prisma.user.findUnique({ where: { email } });
      if (byEmail) return byEmail;
    }
    return null;
  });
}
