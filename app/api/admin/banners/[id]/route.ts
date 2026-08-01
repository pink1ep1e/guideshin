import {
  NextRequest,
  NextResponse,
  requireAdmin,
  unauthorized,
  withPrisma,
} from "@/lib/admin-api";
import { prismaErrorMessage } from "@/prisma/prisma-client";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return unauthorized();
  const { id } = await params;
  const body = await req.json();
  try {
    const item = await withPrisma((prisma) =>
      prisma.homeBannerSlide.update({
        where: { id: Number(id) },
        data: {
          half: body.half === "second" ? "second" : "first",
          name: String(body.name || "").trim(),
          slug: String(body.slug || "").trim(),
          role: String(body.role || "").trim(),
          element: String(body.element || "pyro").toLowerCase(),
          rarity: Number(body.rarity) >= 5 ? 5 : 4,
          text: String(body.text || "").trim(),
          image: String(body.image || "").trim(),
          icon: String(body.icon || "").trim(),
          published: body.published ?? true,
          order: Number(body.order) || 0,
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
    await withPrisma((prisma) =>
      prisma.homeBannerSlide.delete({ where: { id: Number(id) } }),
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: prismaErrorMessage(error) }, { status: 503 });
  }
}
