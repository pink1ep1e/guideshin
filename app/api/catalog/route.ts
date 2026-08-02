import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { withPrisma } from "@/prisma/prisma-client";

/** Каталог для пикеров в админке: все записи (включая черновики). */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await withPrisma(async (prisma) => {
    const [characters, weapons, artifacts, materials] = await Promise.all([
      prisma.character.findMany({
        select: {
          id: true,
          slug: true,
          name: true,
          image: true,
          splashImage: true,
          rarity: true,
          element: true,
        },
        orderBy: [{ rarity: "desc" }, { name: "asc" }],
      }),
      prisma.weapon.findMany({
        select: { id: true, slug: true, name: true, image: true, rarity: true, weaponType: true },
        orderBy: [{ rarity: "desc" }, { name: "asc" }],
      }),
      prisma.artifact.findMany({
        select: { id: true, slug: true, name: true, image: true, rarity: true },
        orderBy: [{ rarity: "desc" }, { name: "asc" }],
      }),
      prisma.material.findMany({
        select: {
          id: true,
          slug: true,
          name: true,
          image: true,
          rarityStars: true,
          category: true,
        },
        orderBy: [{ rarityStars: "desc" }, { name: "asc" }],
      }),
    ]);
    return { characters, weapons, artifacts, materials };
  });

  return NextResponse.json(data, {
    headers: { "Cache-Control": "no-store" },
  });
}
