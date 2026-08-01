import { cache } from "react";
import { withPrisma } from "@/prisma/prisma-client";

export const getCharacterBySlug = cache(async (slug: string) => {
  return withPrisma((prisma) => prisma.character.findUnique({ where: { slug } })).catch(
    () => null,
  );
});
