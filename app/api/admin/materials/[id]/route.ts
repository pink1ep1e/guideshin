import {
  NextRequest,
  NextResponse,
  requireAdmin,
  unauthorized,
  withPrisma,
} from "@/lib/admin-api";
import { prismaErrorMessage } from "@/prisma/prisma-client";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return unauthorized();
  const { id } = await params;
  try {
    const item = await withPrisma((prisma) =>
      prisma.material.findUnique({ where: { id: Number(id) } }),
    );
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: prismaErrorMessage(error) }, { status: 503 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return unauthorized();
  const { id } = await params;
  const body = await req.json();
  try {
    const item = await withPrisma((prisma) =>
      prisma.material.update({
        where: { id: Number(id) },
        data: {
          name: body.name,
          slug: body.slug,
          image: body.image || "",
          rarityStars: Number(body.rarityStars) || 4,
          category: body.category || "other",
          sticker: body.sticker || null,
          region: body.region || null,
          shortDesc: body.shortDesc || null,
          contentHtml: body.contentHtml || "",
          guideData: body.guideData ?? undefined,
          published: body.published ?? true,
          order: body.order ?? 0,
        },
      }),
    );
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: prismaErrorMessage(error) }, { status: 503 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return unauthorized();
  const { id } = await params;
  try {
    await withPrisma((prisma) => prisma.material.delete({ where: { id: Number(id) } }));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: prismaErrorMessage(error) }, { status: 503 });
  }
}
