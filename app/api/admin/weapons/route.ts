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
    prisma.weapon.findMany({ orderBy: { createdAt: "desc" } }),
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
      Boolean(await prisma.weapon.findUnique({ where: { slug: s } })),
    );
    return prisma.weapon.create({
      data: {
        slug,
        name: body.name,
        image: body.image || "",
        rarity: body.rarity || "LEGEND",
        weaponType: body.weaponType || "Меч",
        sticker: body.sticker || null,
        shortDesc: body.shortDesc || null,
        contentHtml: body.contentHtml || "",
        guideData: body.guideData ?? undefined,
        published: body.published ?? true,
        order: body.order ?? 0,
      },
    });
  });

  return NextResponse.json(item, { status: 201 });
}
