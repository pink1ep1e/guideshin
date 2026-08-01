import {
  NextRequest,
  NextResponse,
  requireAdmin,
  unauthorized,
  withPrisma,
} from "@/lib/admin-api";
import { prismaErrorMessage } from "@/prisma/prisma-client";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return unauthorized();
  try {
    const items = await withPrisma((prisma) =>
      prisma.promoCode.findMany({ orderBy: [{ order: "asc" }, { id: "asc" }] }),
    );
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: prismaErrorMessage(error) }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return unauthorized();
  const body = await req.json();
  try {
    const item = await withPrisma((prisma) =>
      prisma.promoCode.create({
        data: {
          code: String(body.code || "").trim().toUpperCase(),
          reward: String(body.reward || "").trim(),
          expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
          published: body.published ?? true,
          order: Number(body.order) || 0,
        },
      }),
    );
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: prismaErrorMessage(error) }, { status: 503 });
  }
}
