import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { withPrisma } from "@/prisma/prisma-client";
import { slugFromName } from "@/lib/slug";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const characters = await withPrisma((prisma) =>
    prisma.character.findMany({ orderBy: [{ rarity: "desc" }, { name: "asc" }] }),
  );
  return NextResponse.json(characters);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const baseSlug = body.slug?.trim() || slugFromName(body.name) || `char-${Date.now()}`;
  const character = await withPrisma(async (prisma) => {
    let slug = baseSlug;
    let i = 1;

    while (await prisma.character.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${i++}`;
    }

    return prisma.character.create({
      data: {
        slug,
        name: body.name,
        image: body.image,
        splashImage: body.splashImage || null,
        rarity: body.rarity,
        element: body.element,
        weaponType: body.weaponType || null,
        region: body.region || null,
        sticker: body.sticker || null,
        shortDesc: body.shortDesc || null,
        contentHtml: body.contentHtml || "",
        levelMaterials: Array.isArray(body.levelMaterials) ? body.levelMaterials : [],
        published: body.published ?? true,
        order: body.order ?? 0,
      },
    });
  });

  return NextResponse.json(character, { status: 201 });
}
