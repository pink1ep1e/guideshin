import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized, withPrisma } from "@/lib/admin-api";
import { slugFromName } from "@/lib/slug";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const characters = await withPrisma((prisma) =>
    prisma.character.findMany({ orderBy: { createdAt: "desc" } }),
  );
  return NextResponse.json(characters);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return unauthorized();

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
        talents: Array.isArray(body.talents) ? body.talents : [],
        constellations: Array.isArray(body.constellations) ? body.constellations : [],
        published: body.published ?? true,
        order: body.order ?? 0,
      },
    });
  });

  return NextResponse.json(character, { status: 201 });
}
