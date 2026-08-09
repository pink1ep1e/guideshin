import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { withPrisma } from "@/prisma/prisma-client";
import { resolveWishUser } from "@/lib/wish-auth";

const SOURCE_LABEL: Record<string, string> = {
  paimon: "paimon.moe",
  url: "Ссылка Hoyoverse",
  json: "JSON",
  pulls: "Импорт",
};

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const user = await resolveWishUser(session);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accountId = new URL(req.url).searchParams.get("accountId");
  if (!accountId) {
    return NextResponse.json({ error: "Укажите accountId" }, { status: 400 });
  }

  const batches = await withPrisma(async (prisma) => {
    const account = await prisma.wishAccount.findFirst({
      where: { id: accountId, userId: user.id },
    });
    if (!account) return null;
    return prisma.wishImportBatch.findMany({
      where: { accountId },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        source: true,
        label: true,
        pullCount: true,
        replacedPrevious: true,
        createdAt: true,
        previousPulls: true,
      },
    });
  });

  if (!batches) {
    return NextResponse.json({ error: "Аккаунт не найден" }, { status: 404 });
  }

  return NextResponse.json({
    imports: batches.map((b) => ({
      id: b.id,
      source: b.source,
      sourceLabel: SOURCE_LABEL[b.source] || b.source,
      label: b.label,
      pullCount: b.pullCount,
      replacedPrevious: b.replacedPrevious,
      canRestore: Boolean(b.previousPulls),
      createdAt: b.createdAt.toISOString(),
    })),
  });
}

/** Отмена импорта */
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  const user = await resolveWishUser(session);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const batchId = new URL(req.url).searchParams.get("id");
  if (!batchId) {
    return NextResponse.json({ error: "Укажите id импорта" }, { status: 400 });
  }

  const result = await withPrisma(async (prisma) => {
    const batch = await prisma.wishImportBatch.findFirst({
      where: { id: batchId },
      include: { account: true },
    });
    if (!batch || batch.account.userId !== user.id) {
      return { error: "Импорт не найден" as const };
    }

    // Удаляем молитвы этого импорта
    await prisma.wishPull.deleteMany({ where: { importBatchId: batch.id } });

    // Восстанавливаем снимок, если импорт заменял данные
    const previous = batch.previousPulls;
    let restored = 0;
    if (Array.isArray(previous) && previous.length > 0) {
      const rows = previous as {
        hoyoId: string;
        gachaType: string;
        itemName: string;
        itemType: string;
        rankType: string;
        wishTime: string;
        raw?: object | null;
      }[];
      const chunk = 200;
      for (let i = 0; i < rows.length; i += chunk) {
        const slice = rows.slice(i, i + chunk);
        const created = await prisma.wishPull.createMany({
          data: slice.map((p) => ({
            accountId: batch.accountId,
            hoyoId: p.hoyoId,
            gachaType: p.gachaType,
            itemName: p.itemName,
            itemType: p.itemType,
            rankType: p.rankType,
            wishTime: new Date(p.wishTime),
            raw: p.raw ?? undefined,
          })),
          skipDuplicates: true,
        });
        restored += created.count;
      }
    }

    await prisma.wishImportBatch.delete({ where: { id: batch.id } });
    return { ok: true as const, restored };
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json(result);
}
