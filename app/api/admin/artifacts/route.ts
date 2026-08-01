import {
  makeSlug,
  NextRequest,
  NextResponse,
  requireAdmin,
  unauthorized,
  uniqueSlug,
  withPrisma,
} from "@/lib/admin-api";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return unauthorized();
  const items = await withPrisma((prisma) =>
    prisma.artifact.findMany({ orderBy: [{ order: "asc" }, { createdAt: "desc" }] }),
  );
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return unauthorized();
  const body = await req.json();
  const base = makeSlug(body.name, body.slug);

  const item = await withPrisma(async (prisma) => {
    const slug = await uniqueSlug(base, async (s) =>
      Boolean(await prisma.artifact.findUnique({ where: { slug: s } })),
    );
    return prisma.artifact.create({
      data: {
        slug,
        name: body.name,
        image: body.image || "",
        rarity: body.rarity || "LEGEND",
        sticker: body.sticker || null,
        region: body.region || null,
        shortDesc: body.shortDesc || null,
        contentHtml: body.contentHtml || "",
        published: body.published ?? true,
        order: body.order ?? 0,
      },
    });
  });

  return NextResponse.json(item, { status: 201 });
}
