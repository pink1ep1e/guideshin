import {
  makeSlug,
  NextRequest,
  NextResponse,
  requireAdmin,
  unauthorized,
  uniqueSlug,
  withPrisma,
} from "@/lib/admin-api";
import { prismaErrorMessage } from "@/prisma/prisma-client";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return unauthorized();
  try {
    const items = await withPrisma((prisma) =>
      prisma.material.findMany({ orderBy: { createdAt: "desc" } }),
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
  const base = makeSlug(body.name, body.slug);

  try {
    const item = await withPrisma(async (prisma) => {
      const slug = await uniqueSlug(base, async (s) =>
        Boolean(await prisma.material.findUnique({ where: { slug: s } })),
      );
      return prisma.material.create({
        data: {
          slug,
          name: body.name,
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
      });
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: prismaErrorMessage(error) }, { status: 503 });
  }
}
