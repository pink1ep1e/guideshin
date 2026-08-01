import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { withPrisma } from "@/prisma/prisma-client";

type Params = { params: Promise<{ id: string }> };

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  return session;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const character = await withPrisma((prisma) => prisma.character.findUnique({ where: { id: Number(id) } }));
  if (!character) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(character);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
        levelMaterials: Array.isArray(body.levelMaterials) ? body.levelMaterials : [],
        published: body.published ?? true,
        order: body.order ?? 0,
      },
    }),
  );

  return NextResponse.json(character);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await withPrisma((prisma) => prisma.character.delete({ where: { id: Number(id) } }));

  return NextResponse.json({ ok: true });
}
