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
      prisma.homeBannerSlide.findMany({
        orderBy: [{ half: "asc" }, { order: "asc" }, { id: "asc" }],
      }),
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
      prisma.homeBannerSlide.create({
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
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: prismaErrorMessage(error) }, { status: 503 });
  }
}
