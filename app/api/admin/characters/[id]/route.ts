import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized, withPrisma } from "@/lib/admin-api";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const { id } = await params;
  const character = await withPrisma((prisma) =>
    prisma.character.findUnique({ where: { id: Number(id) } }),
  );
  if (!character) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(character);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const { id } = await params;
  const body = await req.json();

  const character = await withPrisma((prisma) =>
    prisma.character.update({
      where: { id: Number(id) },
      data: {
        name: body.name,
        slug: body.slug,
        image: body.image,
        splashImage: body.splashImage || null,
        rarity: body.rarity,
        element: body.element,
        weaponType: body.weaponType || null,
        region: body.region || null,
        sticker: body.sticker || null,
        shortDesc: body.shortDesc || null,
        contentHtml: body.contentHtml || "",
        levelMaterials: Array.isArray(body.levelMaterials)
          ? body.levelMaterials
          : [],
        talents: Array.isArray(body.talents) ? body.talents : [],
        constellations: Array.isArray(body.constellations)
          ? body.constellations
          : [],
        published: body.published ?? true,
        order: body.order ?? 0,
      },
    }),
  );

  return NextResponse.json(character);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const { id } = await params;
  await withPrisma((prisma) =>
    prisma.character.delete({ where: { id: Number(id) } }),
  );

  return NextResponse.json({ ok: true });
}
