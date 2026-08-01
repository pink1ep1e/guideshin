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
      prisma.dailyTip.findMany({ orderBy: [{ order: "asc" }, { id: "asc" }] }),
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
      prisma.dailyTip.create({
        data: {
          title: String(body.title || "").trim(),
          body: String(body.body || "").trim(),
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
