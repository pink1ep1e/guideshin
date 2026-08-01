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
      prisma.dailyTip.update({
        where: { id: Number(id) },
        data: {
          title: String(body.title || "").trim(),
          body: String(body.body || "").trim(),
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
    await withPrisma((prisma) => prisma.dailyTip.delete({ where: { id: Number(id) } }));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: prismaErrorMessage(error) }, { status: 503 });
  }
}
