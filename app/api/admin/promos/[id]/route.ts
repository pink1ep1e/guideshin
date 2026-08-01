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
      prisma.promoCode.update({
        where: { id: Number(id) },
        data: {
          code: String(body.code || "").trim().toUpperCase(),
          reward: String(body.reward || "").trim(),
          expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
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
    await withPrisma((prisma) => prisma.promoCode.delete({ where: { id: Number(id) } }));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: prismaErrorMessage(error) }, { status: 503 });
  }
}
