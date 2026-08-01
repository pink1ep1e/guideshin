import {
  NextRequest,
  NextResponse,
  requireAdmin,
  unauthorized,
  withPrisma,
} from "@/lib/admin-api";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return unauthorized();
  const { id } = await params;
  const item = await withPrisma((prisma) =>
    prisma.artifact.findUnique({ where: { id: Number(id) } }),
  );
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return unauthorized();
  const { id } = await params;
  const body = await req.json();
  const item = await withPrisma((prisma) =>
    prisma.artifact.update({
      where: { id: Number(id) },
      data: {
        name: body.name,
        slug: body.slug,
        image: body.image || "",
        rarity: body.rarity,
        sticker: body.sticker || null,
        region: body.region || null,
        shortDesc: body.shortDesc || null,
        contentHtml: body.contentHtml || "",
        published: body.published ?? true,
        order: body.order ?? 0,
      },
    }),
  );
  return NextResponse.json(item);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return unauthorized();
  const { id } = await params;
  await withPrisma((prisma) => prisma.artifact.delete({ where: { id: Number(id) } }));
  return NextResponse.json({ ok: true });
}
